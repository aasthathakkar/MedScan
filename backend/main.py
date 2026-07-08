"""
Medicine Advisor API (SQLite-backed).

Routes:
  GET    /                  health check
  POST   /symptoms          symptom text   -> top-3 medicines (+ logs to history)
  POST   /scan              medicine image -> OCR name + expiry (+ logs to history)
  POST   /check             medicine+age   -> safety warnings + interactions
  GET    /medicines         list the whole medicine knowledge base
  GET    /medicines/{name}  one medicine's full info
  GET    /history           recent symptom checks + scans

Run:
  uvicorn main:app --reload --port 8000
"""

import os
import tempfile
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import backend.supabase_db as supabase_db
import safety
from symptom_model import SymptomMatcher

app = FastAPI(title="Medicine Advisor API", version="1.1.0")

# Set CORS_ORIGINS="https://yourapp.com,https://www.yourapp.com" in production.
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCLAIMER = (
    "Educational prototype, NOT medical advice. This tool does not diagnose "
    "conditions or prescribe medicine. Always consult a qualified doctor or "
    "pharmacist before taking any medication."
)

# Create tables + seed the medicines knowledge base on startup.
supabase_db.init_db()

# Self-heal a fresh deployment: if the model pickles are missing, train them now
# (uses the Kaggle CSV if present in this folder, otherwise the seed data).
if not (os.path.exists("model.pkl") and os.path.exists("tfidf.pkl")):
    print("model.pkl/tfidf.pkl not found -> training the model now...")
    import train_model
    train_model.train_and_save()

# Load the trained matcher once. If still missing, /symptoms returns a clear 503.
try:
    matcher = SymptomMatcher()
    matcher_error = None
except FileNotFoundError as exc:
    matcher = None
    matcher_error = str(exc)


# --------------------------------------------------------------------------- #
# Schemas
# --------------------------------------------------------------------------- #
class SymptomRequest(BaseModel):
    text: str


class CheckRequest(BaseModel):
    medicine: str
    age: Optional[int] = None
    symptoms: Optional[str] = None
    other_medicines: Optional[List[str]] = []


# --------------------------------------------------------------------------- #
# Core routes
# --------------------------------------------------------------------------- #
@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Medicine Advisor API",
        "model_loaded": matcher is not None,
        "medicines_in_db": len(supabase_db.all_medicines()),
        "disclaimer": DISCLAIMER,
    }


@app.post("/symptoms")
def symptoms(req: SymptomRequest):
    if matcher is None:
        raise HTTPException(status_code=503, detail=matcher_error)

    matches = matcher.predict(req.text, top_k=3)
    enriched = []
    for m in matches:
        info = safety.get_info(m["medicine"])
        enriched.append({
            "medicine": m["medicine"],
            "confidence": m["confidence"],
            "treats": info.get("treats", []),
            "side_effects": info.get("side_effects", []),
            "warnings": info.get("warnings", []),
        })

    supabase_db.log_symptom_check(req.text, matches)   # persist to history
    return {"query": req.text, "matches": enriched, "disclaimer": DISCLAIMER}


MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB cap


@app.post("/scan")
async def scan(file: UploadFile = File(...)):
    # Validate: must be an image, and not absurdly large.
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400,
                            detail="Please upload an image file (PNG or JPG).")

    import ocr_engine  # lazy import: pulls in EasyOCR/torch only when needed

    suffix = os.path.splitext(file.filename or "")[1] or ".png"
    size = 0
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        while True:
            chunk = await file.read(1024 * 1024)   # stream in 1 MB chunks
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                tmp.close()
                os.unlink(tmp_path)
                raise HTTPException(status_code=413,
                                    detail="Image too large (max 10 MB).")
            tmp.write(chunk)
    try:
        result = ocr_engine.scan_image(tmp_path)
    finally:
        os.unlink(tmp_path)

    info = safety.get_info(result.get("medicine_name") or "")
    result["treats"] = info.get("treats", [])
    result["warnings"] = info.get("warnings", [])
    result["disclaimer"] = DISCLAIMER

    supabase_db.log_scan(result.get("medicine_name"), result.get("expiry"),
                result.get("expiry_status"))   # persist to history
    return result


@app.post("/check")
def check(req: CheckRequest):
    result = safety.check(
        req.medicine,
        age=req.age,
        other_medicines=req.other_medicines or [],
    )
    result["disclaimer"] = DISCLAIMER
    return result


# --------------------------------------------------------------------------- #
# Medicines (knowledge base)
# --------------------------------------------------------------------------- #
@app.get("/medicines")
def list_medicines():
    meds = supabase_db.all_medicines()
    return {"count": len(meds), "medicines": meds, "disclaimer": DISCLAIMER}


@app.get("/medicines/{name}")
def get_medicine(name: str):
    med = supabase_db.get_medicine(name)
    if not med:
        raise HTTPException(status_code=404, detail=f"'{name}' not found")
    med["disclaimer"] = DISCLAIMER
    return med


# --------------------------------------------------------------------------- #
# History
# --------------------------------------------------------------------------- #
@app.get("/history")
def history(limit: int = 20):
    return supabase_db.get_history(limit)
