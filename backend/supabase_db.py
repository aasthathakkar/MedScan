"""
Supabase data layer — replaces db.py entirely.

Uses the SERVICE ROLE key (never exposed to frontend) so backend can
seed medicines bypassing RLS. All history writes include user_id so
each user only ever reads/writes their own rows.
"""

import os
from typing import Any, Dict, List, Optional

from supabase import create_client, Client
from dotenv import load_dotenv
from seed_data import MEDICINES

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


def _client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Setup / seeding
# ---------------------------------------------------------------------------

def init_db() -> int:
    """Seed medicines table if empty. Returns count already present."""
    sb = _client()
    res = sb.table("medicines").select("id", count="exact").execute()
    count = res.count or 0
    if count == 0:
        rows = [
            {
                "name": name,
                "aka": info.get("aka", []),
                "treats": info.get("treats", []),
                "side_effects": info.get("side_effects", []),
                "warnings": info.get("warnings", []),
                "min_age": info.get("min_age"),
                "interactions": info.get("interactions", []),
            }
            for name, info in MEDICINES.items()
        ]
        sb.table("medicines").insert(rows).execute()
        print(f"Seeded {len(rows)} medicines into Supabase.")
    else:
        print(f"Medicines already seeded ({count} rows).")
    return count


# ---------------------------------------------------------------------------
# Medicines (shared reference data — no user_id needed)
# ---------------------------------------------------------------------------

def get_medicine(name: str) -> Optional[Dict[str, Any]]:
    """Look up by generic name or brand (aka). Returns dict or None."""
    if not name or not name.strip():
        return None
    n = name.strip().lower()
    sb = _client()

    # Exact match first (fast, indexed)
    res = sb.table("medicines").select("*").eq("name", n).execute()
    if res.data:
        return res.data[0]

    # Fallback: scan all rows for substring / brand match (table is small)
    all_res = sb.table("medicines").select("*").execute()
    for med in (all_res.data or []):
        if med["name"] in n or n in med["name"]:
            return med
        for aka in (med.get("aka") or []):
            a = aka.lower()
            if a in n or n in a:
                return med
    return None


def all_medicines() -> List[Dict[str, Any]]:
    sb = _client()
    res = sb.table("medicines").select("*").order("name").execute()
    return res.data or []


# ---------------------------------------------------------------------------
# History (user-scoped — private per user via RLS + user_id filter)
# ---------------------------------------------------------------------------

def log_symptom_check(user_id: str, query: str, results: list) -> None:
    top = results[0]["medicine"] if results else None
    sb = _client()
    sb.table("symptom_history").insert({
        "user_id": user_id,
        "query": query,
        "top_medicine": top,
        "results": results,
    }).execute()


def log_scan(user_id: str, medicine_name: Optional[str],
             expiry: Optional[str], expiry_status: Optional[str]) -> None:
    sb = _client()
    sb.table("scan_history").insert({
        "user_id": user_id,
        "medicine_name": medicine_name,
        "expiry": expiry,
        "expiry_status": expiry_status,
    }).execute()


def get_history(user_id: str, limit: int = 20) -> Dict[str, Any]:
    sb = _client()
    symptoms = sb.table("symptom_history") \
        .select("id, query, top_medicine, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute().data or []

    scans = sb.table("scan_history") \
        .select("id, medicine_name, expiry, expiry_status, created_at") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .limit(limit) \
        .execute().data or []

    return {"symptom_checks": symptoms, "scans": scans}