"""
OCR for medicine strips/boxes using EasyOCR.

Pipeline:
  image -> EasyOCR text blocks
        -> medicine name   (priority order below)
        -> expiry date     (regex across all formats)
        -> expiry status   (expired / expiring_soon / valid) vs IST today

Medicine name resolution priority:
  1. A line in the OCR text that matches the medicines knowledge base (brand lookup)
  2. Active ingredient match via ingredient_data.lookup_by_ingredient()
     — catches any brand not in the KB as long as its ingredient is listed
  3. Tallest text block as a last-resort fallback (raw OCR, unverified)

The match_method field in the result tells the frontend which path fired,
so it can show "Matched by ingredient: paracetamol" vs "Matched by name".
"""

import re
import calendar
from datetime import date, datetime, timedelta, timezone

import safety
import ingredient_data

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


_MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
_MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_name) if m})

_EXP_PATTERNS = [
    r'(?:exp(?:iry)?|use before|best before|bb)[^0-9a-z]{0,6}([0-1]?\d)\s*[/\-.]\s*(\d{2,4})',
    r'\b([0-1]?\d)\s*[/\-.]\s*(\d{4})\b',
    r'\b([0-1]?\d)\s*[/\-.]\s*(\d{2})\b',
    r'\b(\d{4})\s*[/\-.]\s*([0-1]?\d)\b',
]

_IST = timezone(timedelta(hours=5, minutes=30))


def _today():
    return datetime.now(_IST).date()


def _parse_expiry(text):
    t = text.lower()
    name_re = r'\b(' + '|'.join(re.escape(k) for k in _MONTHS) + r')\s*[/\-. ]\s*(\d{2,4})\b'
    m = re.search(name_re, t)
    if m:
        month = _MONTHS[m.group(1)]
        year = int(m.group(2))
        year = 2000 + year if year < 100 else year
        return month, year
    for pat in _EXP_PATTERNS:
        m = re.search(pat, t)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            if a > 12:
                year, month = a, b
            else:
                month, year = a, b
            if year < 100:
                year += 2000
            if 1 <= month <= 12:
                return month, year
    return None


def _expiry_status(month, year):
    last_day = calendar.monthrange(year, month)[1]
    expiry_end = date(year, month, last_day)
    days = (expiry_end - _today()).days
    if days < 0:
        status = "expired"
    elif days <= 90:
        status = "expiring_soon"
    else:
        status = "valid"
    return status, days, expiry_end.isoformat()


def scan_image(path):
    """Run OCR on an image file and return a structured result dict."""
    reader = _get_reader()
    results = reader.readtext(path)

    lines = []
    tallest = {"text": None, "height": 0}
    for bbox, text, _conf in results:
        text = (text or "").strip()
        if not text:
            continue
        lines.append(text)
        ys = [point[1] for point in bbox]
        height = max(ys) - min(ys)
        alpha = re.sub(r'[^A-Za-z]', '', text)
        if len(alpha) >= 3 and height > tallest["height"]:
            tallest = {"text": text, "height": height}

    full_text = "\n".join(lines)

    # ------------------------------------------------------------------
    # Medicine name resolution — three-pass priority system
    # ------------------------------------------------------------------
    medicine_name = None
    matched_ingredient = None
    match_method = "none"

    # Pass 1 — direct knowledge-base match (brand or generic in KB)
    for line in lines:
        if safety.get_info(line):
            medicine_name = line.strip()
            match_method = "knowledge_base"
            break

    # Pass 2 — ingredient lookup (catches unknown brands)
    if not medicine_name:
        ing_name, ing_info = ingredient_data.lookup_by_ingredient(full_text)
        if ing_name:
            matched_ingredient = ing_name
            # Use the ingredient name as the display name since the brand
            # isn't in our KB — better than showing a random OCR line
            medicine_name = ing_name.title()
            match_method = "ingredient"

    # Pass 3 — tallest text block (raw fallback, unverified)
    if not medicine_name:
        medicine_name = tallest["text"]
        match_method = "ocr_fallback"

    # ------------------------------------------------------------------
    # Expiry parsing
    # ------------------------------------------------------------------
    parsed = _parse_expiry(full_text)
    if parsed:
        month, year = parsed
        status, days, iso = _expiry_status(month, year)
        expiry_str = f"{month:02d}/{year}"
    else:
        status, days, iso, expiry_str = "unknown", None, None, None

    return {
        "raw_text": full_text,
        "medicine_name": medicine_name,
        "matched_ingredient": matched_ingredient,
        "match_method": match_method,
        "expiry": expiry_str,
        "expiry_iso": iso,
        "expiry_status": status,
        "days_until_expiry": days,
    }