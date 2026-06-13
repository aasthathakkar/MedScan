"""
SQLite data layer for Medicine Advisor.

Tables:
  medicines        - the knowledge base, seeded from seed_data.MEDICINES
  symptom_history  - every /symptoms query that runs
  scan_history     - every /scan that runs
  cabinet          - medicines the user saved ("my medicine cabinet")

Design notes:
  - One SQLite file, no server. `MEDICINE_DB` env var overrides the path.
  - List fields (aka, treats, ...) are stored as JSON strings since SQLite has
    no array type.
  - A fresh connection is opened per call (safe across FastAPI's threads) and
    the schema is ensured on every connect, so tables always exist.
"""

import os
import json
import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from seed_data import MEDICINES

DB_PATH = os.environ.get("MEDICINE_DB", "medicine_advisor.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS medicines (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT UNIQUE NOT NULL,
    aka          TEXT NOT NULL DEFAULT '[]',
    treats       TEXT NOT NULL DEFAULT '[]',
    side_effects TEXT NOT NULL DEFAULT '[]',
    warnings     TEXT NOT NULL DEFAULT '[]',
    min_age      INTEGER,
    interactions TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS symptom_history (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    query        TEXT NOT NULL,
    top_medicine TEXT,
    results      TEXT NOT NULL DEFAULT '[]',
    created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scan_history (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name TEXT,
    expiry        TEXT,
    expiry_status TEXT,
    created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cabinet (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    medicine_name TEXT NOT NULL,
    expiry        TEXT,
    notes         TEXT,
    created_at    TEXT NOT NULL
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(_SCHEMA)   # idempotent: guarantees tables exist
    return conn


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------------------- #
# Setup / seeding
# --------------------------------------------------------------------------- #
def init_db(reseed: bool = False) -> int:
    """Create tables and seed `medicines` if empty. Returns rows already present."""
    conn = _connect()
    try:
        count = conn.execute("SELECT COUNT(*) AS c FROM medicines").fetchone()["c"]
        if reseed:
            conn.execute("DELETE FROM medicines")
            count = 0
        if count == 0:
            rows = [
                (
                    name,
                    json.dumps(info.get("aka", [])),
                    json.dumps(info.get("treats", [])),
                    json.dumps(info.get("side_effects", [])),
                    json.dumps(info.get("warnings", [])),
                    info.get("min_age"),
                    json.dumps(info.get("interactions", [])),
                )
                for name, info in MEDICINES.items()
            ]
            conn.executemany(
                "INSERT INTO medicines "
                "(name, aka, treats, side_effects, warnings, min_age, interactions) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                rows,
            )
            conn.commit()
        return count
    finally:
        conn.close()


def _to_medicine(row: sqlite3.Row) -> Dict[str, Any]:
    return {
        "name": row["name"],
        "aka": json.loads(row["aka"]),
        "treats": json.loads(row["treats"]),
        "side_effects": json.loads(row["side_effects"]),
        "warnings": json.loads(row["warnings"]),
        "min_age": row["min_age"],
        "interactions": json.loads(row["interactions"]),
    }


# --------------------------------------------------------------------------- #
# Medicines
# --------------------------------------------------------------------------- #
def get_medicine(name: str) -> Optional[Dict[str, Any]]:
    """Look up by generic name or brand (aka). Returns a dict or None."""
    if not name or not name.strip():
        return None
    n = name.strip().lower()
    conn = _connect()
    try:
        row = conn.execute("SELECT * FROM medicines WHERE name = ?", (n,)).fetchone()
        if row:
            return _to_medicine(row)
        # substring / brand match (table is small, a scan is fine)
        for row in conn.execute("SELECT * FROM medicines"):
            med = _to_medicine(row)
            if med["name"] in n or n in med["name"]:
                return med
            for aka in med["aka"]:
                a = aka.lower()
                if a in n or n in a:
                    return med
        return None
    finally:
        conn.close()


def all_medicines() -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        return [_to_medicine(r) for r in conn.execute(
            "SELECT * FROM medicines ORDER BY name")]
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# History
# --------------------------------------------------------------------------- #
def log_symptom_check(query: str, results: list) -> None:
    top = results[0]["medicine"] if results else None
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO symptom_history (query, top_medicine, results, created_at) "
            "VALUES (?, ?, ?, ?)",
            (query, top, json.dumps(results), _now()),
        )
        conn.commit()
    finally:
        conn.close()


def log_scan(medicine_name: Optional[str], expiry: Optional[str],
             expiry_status: Optional[str]) -> None:
    conn = _connect()
    try:
        conn.execute(
            "INSERT INTO scan_history (medicine_name, expiry, expiry_status, created_at) "
            "VALUES (?, ?, ?, ?)",
            (medicine_name, expiry, expiry_status, _now()),
        )
        conn.commit()
    finally:
        conn.close()


def get_history(limit: int = 20) -> Dict[str, Any]:
    conn = _connect()
    try:
        symptoms = [dict(r) for r in conn.execute(
            "SELECT id, query, top_medicine, created_at "
            "FROM symptom_history ORDER BY id DESC LIMIT ?", (limit,))]
        scans = [dict(r) for r in conn.execute(
            "SELECT id, medicine_name, expiry, expiry_status, created_at "
            "FROM scan_history ORDER BY id DESC LIMIT ?", (limit,))]
        return {"symptom_checks": symptoms, "scans": scans}
    finally:
        conn.close()


# --------------------------------------------------------------------------- #
# Cabinet ("my medicines")
# --------------------------------------------------------------------------- #
def add_to_cabinet(medicine_name: str, expiry: Optional[str] = None,
                   notes: Optional[str] = None) -> Dict[str, Any]:
    conn = _connect()
    try:
        cur = conn.execute(
            "INSERT INTO cabinet (medicine_name, expiry, notes, created_at) "
            "VALUES (?, ?, ?, ?)",
            (medicine_name, expiry, notes, _now()),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM cabinet WHERE id = ?",
                           (cur.lastrowid,)).fetchone()
        return dict(row)
    finally:
        conn.close()


def get_cabinet() -> List[Dict[str, Any]]:
    conn = _connect()
    try:
        return [dict(r) for r in conn.execute(
            "SELECT * FROM cabinet ORDER BY id DESC")]
    finally:
        conn.close()


def remove_from_cabinet(item_id: int) -> bool:
    conn = _connect()
    try:
        cur = conn.execute("DELETE FROM cabinet WHERE id = ?", (item_id,))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()