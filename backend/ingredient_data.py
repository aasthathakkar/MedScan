"""
Active ingredient lookup table.

Keyed on the active ingredient name (lowercase). Each entry lists:
- brand_names: common brands so we can match OCR text like "Calpol", "Dolo"
- ingredient_patterns: regex fragments that appear on strip ingredient lines
  e.g. "paracetamol 500mg", "acetaminophen 650 mg"
- treats, side_effects, warnings, min_age, interactions: same shape as
  the medicines table so the frontend renders identically

This is intentionally a flat lookup, not a replacement for the ML model.
The ML model predicts medicine from symptoms. This lookup resolves an
unknown brand to a known active ingredient when the OCR finds it on a strip.
"""

INGREDIENTS = {
    "paracetamol": {
        "also_known_as": ["acetaminophen"],
        "brand_names": [
            "calpol", "dolo", "crocin", "tylenol", "pcm", "febrinil",
            "metacin", "paracip", "p 500", "p500", "dolo 650",
        ],
        "treats": ["fever", "headache", "mild pain", "body ache"],
        "side_effects": ["rare at normal doses", "liver damage if overdosed"],
        "warnings": [
            "Do not exceed 4 g per day for adults",
            "Avoid combining with alcohol",
            "Check combo cold medicines for hidden paracetamol",
        ],
        "min_age": None,
        "interactions": ["warfarin"],
    },
    "ibuprofen": {
        "also_known_as": [],
        "brand_names": [
            "brufen", "advil", "nurofen", "combiflam", "ibugesic",
            "ibuclin", "imol", "ibuflam",
        ],
        "treats": ["pain", "inflammation", "fever", "muscle pain", "period pain"],
        "side_effects": ["stomach upset", "heartburn", "nausea"],
        "warnings": [
            "Take with food",
            "Avoid on an empty stomach",
            "Caution with kidney problems, asthma or ulcers",
        ],
        "min_age": None,
        "interactions": ["aspirin", "warfarin", "blood pressure medicines"],
    },
    "aspirin": {
        "also_known_as": ["acetylsalicylic acid"],
        "brand_names": ["disprin", "ecosprin", "loprin", "cardioprin"],
        "treats": ["pain", "fever", "headache", "blood thinning (low dose)"],
        "side_effects": ["stomach irritation", "increased bleeding risk"],
        "warnings": [
            "Not for children under 16 (risk of Reye's syndrome)",
            "Avoid if allergic to NSAIDs",
            "Caution with stomach ulcers",
        ],
        "min_age": 16,
        "interactions": ["ibuprofen", "warfarin"],
    },
    "cetirizine": {
        "also_known_as": [],
        "brand_names": [
            "zyrtec", "cetzine", "alerid", "okacet", "cetcip",
            "zyncet", "allercet",
        ],
        "treats": ["allergy", "runny nose", "sneezing", "itching", "hay fever"],
        "side_effects": ["drowsiness", "dry mouth"],
        "warnings": [
            "May cause drowsiness",
            "Avoid driving if it makes you sleepy",
        ],
        "min_age": None,
        "interactions": ["alcohol", "sedatives"],
    },
    "loratadine": {
        "also_known_as": [],
        "brand_names": ["claritin", "lorfast", "lorano", "clarityn"],
        "treats": ["allergy", "hay fever", "runny nose", "sneezing"],
        "side_effects": ["headache", "mild drowsiness"],
        "warnings": ["Usually non-drowsy but effects vary"],
        "min_age": None,
        "interactions": [],
    },
    "fexofenadine": {
        "also_known_as": [],
        "brand_names": ["allegra", "fexofast", "altifex", "telfast"],
        "treats": ["allergy", "hay fever", "hives", "itching"],
        "side_effects": ["headache", "nausea", "dizziness"],
        "warnings": ["Non-drowsy antihistamine", "Avoid taking with fruit juice"],
        "min_age": None,
        "interactions": [],
    },
    "omeprazole": {
        "also_known_as": [],
        "brand_names": ["prilosec", "omez", "omesec", "ocid", "omizac"],
        "treats": ["acidity", "heartburn", "acid reflux", "gerd", "ulcers"],
        "side_effects": ["headache", "stomach pain", "diarrhea"],
        "warnings": [
            "Take before food",
            "Not meant for long-term use without advice",
        ],
        "min_age": None,
        "interactions": ["clopidogrel"],
    },
    "pantoprazole": {
        "also_known_as": [],
        "brand_names": [
            "pantop", "pan", "protonix", "pantocid", "pantin",
            "p-cap", "rantac d",
        ],
        "treats": ["acidity", "heartburn", "acid reflux", "gerd"],
        "side_effects": ["headache", "diarrhea"],
        "warnings": ["Take before food"],
        "min_age": None,
        "interactions": [],
    },
    "ranitidine": {
        "also_known_as": [],
        "brand_names": ["zantac", "rantac", "aciloc", "zinetac"],
        "treats": ["acidity", "heartburn", "stomach ulcers"],
        "side_effects": ["headache", "constipation"],
        "warnings": ["Take before meals for best effect"],
        "min_age": None,
        "interactions": [],
    },
    "loperamide": {
        "also_known_as": [],
        "brand_names": ["imodium", "lopamide", "eldoper"],
        "treats": ["diarrhea", "loose motion"],
        "side_effects": ["constipation", "bloating"],
        "warnings": [
            "Do not use if there is blood in stool or high fever",
            "Stay hydrated",
        ],
        "min_age": 12,
        "interactions": [],
    },
    "domperidone": {
        "also_known_as": [],
        "brand_names": ["motilium", "domstal", "vomistop", "domperi"],
        "treats": ["nausea", "vomiting", "bloating"],
        "side_effects": ["dry mouth", "headache"],
        "warnings": ["Use the lowest effective dose"],
        "min_age": None,
        "interactions": [],
    },
    "ondansetron": {
        "also_known_as": [],
        "brand_names": ["zofran", "emeset", "ondem", "vomikind"],
        "treats": ["nausea", "vomiting"],
        "side_effects": ["headache", "constipation", "dizziness"],
        "warnings": ["Prescription medicine", "Do not use frequently without advice"],
        "min_age": None,
        "interactions": [],
    },
    "amoxicillin": {
        "also_known_as": [],
        "brand_names": ["amoxil", "mox", "novamox", "trimox", "wymox"],
        "treats": ["bacterial infection", "throat infection", "ear infection"],
        "side_effects": ["diarrhea", "rash", "nausea"],
        "warnings": [
            "Antibiotic — only use if prescribed",
            "Finish the full course",
            "Avoid if allergic to penicillin",
        ],
        "min_age": None,
        "interactions": [],
    },
    "azithromycin": {
        "also_known_as": [],
        "brand_names": [
            "zithromax", "azithral", "azee", "zady", "atm",
            "azifast", "aziwin",
        ],
        "treats": ["bacterial infection", "throat infection", "respiratory infection"],
        "side_effects": ["nausea", "diarrhea", "stomach pain"],
        "warnings": [
            "Antibiotic — only use if prescribed",
            "Finish the full course",
        ],
        "min_age": None,
        "interactions": [],
    },
    "dextromethorphan": {
        "also_known_as": ["dxm"],
        "brand_names": ["benylin", "dextro", "alex", "corex d", "koflet"],
        "treats": ["dry cough"],
        "side_effects": ["drowsiness", "dizziness"],
        "warnings": ["Not for productive (wet) cough"],
        "min_age": 6,
        "interactions": ["antidepressants"],
    },
    "salbutamol": {
        "also_known_as": ["albuterol"],
        "brand_names": ["asthalin", "ventolin", "salbair", "levolin"],
        "treats": ["asthma", "wheezing", "breathlessness"],
        "side_effects": ["tremor", "fast heartbeat"],
        "warnings": [
            "Use as directed by a doctor",
            "Seek help if breathing does not improve",
        ],
        "min_age": None,
        "interactions": [],
    },
    "montelukast": {
        "also_known_as": [],
        "brand_names": ["singulair", "montair", "montek", "telekast"],
        "treats": ["asthma", "allergic rhinitis"],
        "side_effects": ["headache", "stomach pain", "mood changes"],
        "warnings": ["Prescription medicine"],
        "min_age": None,
        "interactions": [],
    },
    "diclofenac": {
        "also_known_as": [],
        "brand_names": ["voveran", "voltaren", "diclomax", "reactine"],
        "treats": ["pain", "inflammation", "joint pain", "muscle pain"],
        "side_effects": ["stomach upset", "heartburn"],
        "warnings": [
            "Take with food",
            "Caution with heart or kidney conditions",
        ],
        "min_age": 14,
        "interactions": ["aspirin", "warfarin"],
    },
    "metformin": {
        "also_known_as": [],
        "brand_names": ["glucophage", "glycomet", "obimet", "formet"],
        "treats": ["type 2 diabetes", "high blood sugar"],
        "side_effects": ["nausea", "diarrhea", "metallic taste"],
        "warnings": ["Prescription medicine", "Take with meals"],
        "min_age": None,
        "interactions": [],
    },
    "amlodipine": {
        "also_known_as": [],
        "brand_names": ["amlong", "norvasc", "amlip", "stamlo"],
        "treats": ["high blood pressure", "hypertension", "chest pain"],
        "side_effects": ["ankle swelling", "flushing", "headache"],
        "warnings": ["Prescription medicine", "Do not stop suddenly"],
        "min_age": None,
        "interactions": [],
    },
    "atorvastatin": {
        "also_known_as": [],
        "brand_names": ["lipitor", "atorva", "storvas", "aztor"],
        "treats": ["high cholesterol"],
        "side_effects": ["muscle ache", "headache"],
        "warnings": [
            "Prescription medicine",
            "Report unexplained muscle pain",
        ],
        "min_age": None,
        "interactions": [],
    },
    "vitamin c": {
        "also_known_as": ["ascorbic acid"],
        "brand_names": ["limcee", "celin", "redoxon", "ester-c"],
        "treats": ["low immunity", "cold support", "scurvy prevention"],
        "side_effects": ["generally safe", "stomach upset in high doses"],
        "warnings": ["Very high doses (>2g/day) are not better"],
        "min_age": None,
        "interactions": [],
    },
    "zinc": {
        "also_known_as": ["zinc sulfate", "zinc gluconate"],
        "brand_names": ["zincovit", "zinconia", "z&d", "zinco"],
        "treats": ["immunity support", "cold", "wound healing", "diarrhea"],
        "side_effects": ["nausea if taken on empty stomach"],
        "warnings": ["Take with food to reduce stomach upset"],
        "min_age": None,
        "interactions": [],
    },
    "calcium": {
        "also_known_as": ["calcium carbonate", "calcium citrate"],
        "brand_names": ["shelcal", "calcirol", "ostocalcium", "calcigard"],
        "treats": ["calcium deficiency", "bone health", "osteoporosis support"],
        "side_effects": ["constipation", "bloating"],
        "warnings": ["Take with vitamin D for best absorption"],
        "min_age": None,
        "interactions": [],
    },
    "vitamin d": {
        "also_known_as": ["cholecalciferol", "vitamin d3"],
        "brand_names": ["calcirol", "uprise d3", "d-rise", "arachitol"],
        "treats": ["vitamin d deficiency", "bone health", "immunity support"],
        "side_effects": ["generally safe at recommended doses"],
        "warnings": ["High doses over long periods can be harmful"],
        "min_age": None,
        "interactions": [],
    },
}


# ---------------------------------------------------------------------------
# Lookup helpers
# ---------------------------------------------------------------------------

import re as _re


def _normalise(text: str) -> str:
    return (text or "").strip().lower()


def lookup_by_ingredient(ocr_text: str) -> tuple[str | None, dict | None]:
    """
    Scan OCR text for a known active ingredient name or brand name.
    Returns (matched_ingredient_name, info_dict) or (None, None).

    Priority:
      1. Ingredient name appears directly in the OCR text
         (e.g. "Paracetamol 500mg" → matches "paracetamol")
      2. Brand name appears in the OCR text
         (e.g. "CALPOL" → resolves to "paracetamol")
    """
    t = _normalise(ocr_text)

    # Pass 1 — ingredient name match (highest confidence)
    for ingredient, info in INGREDIENTS.items():
        # Match ingredient name as a whole word
        pattern = r'\b' + _re.escape(ingredient) + r'\b'
        if _re.search(pattern, t):
            return ingredient, info
        # Also check also_known_as
        for alias in info.get("also_known_as", []):
            if _re.search(r'\b' + _re.escape(alias) + r'\b', t):
                return ingredient, info

    # Pass 2 — brand name match (lower confidence, still useful)
    for ingredient, info in INGREDIENTS.items():
        for brand in info.get("brand_names", []):
            if _re.search(r'\b' + _re.escape(brand) + r'\b', t):
                return ingredient, info

    return None, None