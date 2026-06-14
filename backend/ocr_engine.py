"""
OCR for medicine strips/boxes using EasyOCR.

Pipeline:
  image -> EasyOCR text blocks
        -> medicine name  (prefer a known drug name, else the tallest text)
        -> expiry date    (regex: MM/YYYY, MM-YY, MON YYYY, ISO, with EXP prefix)
        -> expiry status  (expired / expiring_soon / valid) vs today

EasyOCR downloads its model files on first run, so the first /scan call
will be slow. After that it is cached.
"""

import re
import calendar
from datetime import date, datetime, timedelta, timezone

import safety

_reader = None


def _get_reader():
    """Lazy-load the EasyOCR reader (heavy import + model download)."""
    global _reader
    if _reader is None:
        import easyocr
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


# month name/abbr -> number, e.g. {"jan": 1, "january": 1, ...}
_MONTHS = {m.lower(): i for i, m in enumerate(calendar.month_abbr) if m}
_MONTHS.update({m.lower(): i for i, m in enumerate(calendar.month_name) if m})

_EXP_PATTERNS = [
    # EXP / Use before / Best before prefix, then MM/YY(YY)
    r'(?:exp(?:iry)?|use before|best before|bb)[^0-9a-z]{0,6}([0-1]?\d)\s*[/\-.]\s*(\d{2,4})',
    r'\b([0-1]?\d)\s*[/\-.]\s*(\d{4})\b',   # MM/YYYY
    r'\b([0-1]?\d)\s*[/\-.]\s*(\d{2})\b',   # MM/YY
    r'\b(\d{4})\s*[/\-.]\s*([0-1]?\d)\b',   # YYYY-MM (ISO-ish)
]


def _parse_expiry(text):
    """Return (month, year) or None."""
    t = text.lower()

    # Month-name format: "jun 2025", "jun/25", "exp jun 2026"
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
            if a > 12:           # first group is the year (ISO form)
                year, month = a, b
            else:
                month, year = a, b
            if year < 100:
                year += 2000
            if 1 <= month <= 12:
                return month, year
    return None


# This app targets users in India, so pin "today" to IST. Otherwise a server
# running in UTC could flag an end-of-month medicine a day early or late.
_IST = timezone(timedelta(hours=5, minutes=30))


def _today():
    return datetime.now(_IST).date()


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
    results = reader.readtext(path)  # [(bbox, text, confidence), ...]

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

    # Prefer a recognised medicine name; fall back to the tallest text block.
    medicine_name = None
    for line in lines:
        if safety.get_info(line):
            medicine_name = line.strip()
            break
    if not medicine_name:
        medicine_name = tallest["text"]

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
        "expiry": expiry_str,
        "expiry_iso": iso,
        "expiry_status": status,
        "days_until_expiry": days,
    }