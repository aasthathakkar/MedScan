"""
Rule-based safety checks, backed by Supabase medicines table via supabase_db.
"""
from typing import List, Optional
import supabase_db as db


def _normalize(name: str) -> str:
    return (name or "").strip().lower()


def get_info(name: str) -> dict:
    """Return the medicine record (dict) or {} if unknown."""
    med = db.get_medicine(name)
    return med or {}


def check(medicine: str,
          age: Optional[int] = None,
          other_medicines: Optional[List[str]] = None) -> dict:
    """Combine age limits + interactions + warnings for one medicine."""
    other_medicines = other_medicines or []
    info = db.get_medicine(medicine)
    recognized = info is not None
    info = info or {}

    warnings = list(info.get("warnings", []))
    side_effects = list(info.get("side_effects", []))
    interactions: List[str] = []
    safe = True

    min_age = info.get("min_age")
    if age is not None and min_age is not None and age < min_age:
        warnings.insert(0, f"Not recommended under age {min_age}.")
        safe = False

    known = [i.lower() for i in info.get("interactions", [])]
    for other in other_medicines:
        o = _normalize(other)
        for ki in known:
            if ki and (ki in o or o in ki):
                interactions.append(f"Possible interaction with {other}.")
                safe = False

    return {
        "medicine": medicine,
        "recognized": recognized,
        "safe": safe if recognized else None,
        "warnings": warnings,
        "side_effects": side_effects,
        "interactions": interactions,
    }