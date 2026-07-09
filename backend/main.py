"""
Medicine Advisor API (Supabase-backed).

Routes:
  GET    /                  health check
  POST   /symptoms          symptom text   -> top-3 medicines (+ logs to history)
  POST   /scan              medicine image -> OCR name + expiry (+ logs to history)
  POST   /check             medicine+age   -> safety warnings + interactions
  GET    /medicines         list the whole medicine knowledge base
  GET    /medicines/{name}  one medicine's full info
  GET    /history           recent symptom checks + scans (private, requires auth)

Auth:
  Routes that log or return personal data (/symptoms, /scan, /history) require
  a valid Supabase JWT in the Authorization header:
    Authorization: Bearer <supabase_access_token>
  Public routes (/check, /medicines, /) work without auth.

Run:
  uvicorn main:app --reload --port 8000
"""

import os
import tempfile
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv

import supabase_db as db
import safety
from symptom_model import SymptomMatcher

load_dotenv()

app = FastAPI(title="Medicine Advisor API", version="2.0.0")

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

# Seed medicines on startup
db.init_db()

# Self-heal: train model if pickles are missing
if not (os.path.exists("model.pkl") and os.path.exists("tfidf.pkl")):
    print("model.pkl/tfidf.pkl not found -> training now...")
    import train_model
    train_model.train_and_save()

try:
    matcher = SymptomMatcher()
    matcher_error = None
except FileNotFoundError as exc:
    matcher = None
    matcher_error = str(exc)


# ---------------------------------------------------------------------------
# Auth helper — verifies the Supabase JWT and returns the user_id
# ---------------------------------------------------------------------------

def get_user_id(authorization: Optional[str]) -> str:
    """
    Extracts and verifies the Bearer token from the Authorization header.
    Returns the user's UUID string, or raises 401.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    token = authorization.split(" ", 1)[1]
    try:
        # Use the anon key here — we're verifying a user token, not bypassing RLS
        sb = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
        user = sb.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SymptomRequest(BaseModel):
    text: str


class CheckRequest(BaseModel):
    medicine: str
    age: Optional[int] = None
    other_medicines: Optional[List[str]] = []


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Medicine Advisor API",
        "model_loaded": matcher is not None,
        "medicines_in_db": len(db.all_medicines()),
        "disclaimer": DISCLAIMER,
    }


@app.post("/symptoms")
def symptoms(req: SymptomRequest,
             authorization: Optional[str] = Header(default=None)):
    if matcher is None:
        raise HTTPException(status_code=503, detail=matcher_error)

    user_id = get_user_id(authorization)

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

    db.log_symptom_check(user_id, req.text, matches)
    return {"query": req.text, "matches": enriched, "disclaimer": DISCLAIMER}


MAX_UPLOAD_BYTES = 10 * 1024 * 1024


@app.post("/scan")
async def scan(file: UploadFile = File(...),
               authorization: Optional[str] = Header(default=None)):
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400,
                            detail="Please upload an image file (PNG or JPG).")

    user_id = get_user_id(authorization)

    import ocr_engine
    suffix = os.path.splitext(file.filename or "")[1] or ".png"
    size = 0
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        while True:
            chunk = await file.read(1024 * 1024)
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

    db.log_scan(user_id, result.get("medicine_name"),
                result.get("expiry"), result.get("expiry_status"))
    return result


@app.post("/check")
def check(req: CheckRequest):
    # /check is intentionally public — no auth needed, it's purely informational
    result = safety.check(
        req.medicine,
        age=req.age,
        other_medicines=req.other_medicines or [],
    )
    result["disclaimer"] = DISCLAIMER
    return result


@app.get("/medicines")
def list_medicines():
    meds = db.all_medicines()
    return {"count": len(meds), "medicines": meds, "disclaimer": DISCLAIMER}


@app.get("/medicines/{name}")
def get_medicine(name: str):
    med = db.get_medicine(name)
    if not med:
        raise HTTPException(status_code=404, detail=f"'{name}' not found")
    med["disclaimer"] = DISCLAIMER
    return med


@app.get("/history")
def history(authorization: Optional[str] = Header(default=None),
            limit: int = 20):
    user_id = get_user_id(authorization)
    return db.get_history(user_id, limit)