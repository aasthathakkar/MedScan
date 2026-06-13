"""
Canonical medicine knowledge base — the single source of truth.

`db.py` reads this on first run to populate the `medicines` table. To change
the medicine data, edit here and either delete the .db file or call
`db.init_db(reseed=True)`.

This is a SMALL, curated set for common medicines. It is not exhaustive and is
not a substitute for a pharmacist or doctor. Brand names (`aka`) let an OCR'd
strip name be matched back to a generic.
"""

MEDICINES = {
    "paracetamol": {
        "aka": ["acetaminophen", "tylenol", "crocin", "dolo", "calpol", "pcm"],
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
        "aka": ["brufen", "advil", "nurofen", "combiflam"],
        "treats": ["pain", "inflammation", "fever"],
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
        "aka": ["disprin", "ecosprin", "acetylsalicylic acid"],
        "treats": ["pain", "fever", "blood thinning (low dose)"],
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
        "aka": ["zyrtec", "cetzine", "alerid"],
        "treats": ["allergy", "runny nose", "sneezing", "itching"],
        "side_effects": ["drowsiness", "dry mouth"],
        "warnings": ["May cause drowsiness", "Avoid driving if it makes you sleepy"],
        "min_age": None,
        "interactions": ["alcohol", "sedatives"],
    },
    "loratadine": {
        "aka": ["claritin", "lorfast"],
        "treats": ["allergy", "hay fever", "runny nose"],
        "side_effects": ["headache", "mild drowsiness"],
        "warnings": ["Usually non-drowsy but effects vary"],
        "min_age": None,
        "interactions": [],
    },
    "omeprazole": {
        "aka": ["prilosec", "omez"],
        "treats": ["acidity", "heartburn", "acid reflux", "gerd"],
        "side_effects": ["headache", "stomach pain", "diarrhea"],
        "warnings": ["Take before food", "Not meant for long-term use without advice"],
        "min_age": None,
        "interactions": ["clopidogrel"],
    },
    "pantoprazole": {
        "aka": ["pantop", "pan", "protonix"],
        "treats": ["acidity", "heartburn", "acid reflux"],
        "side_effects": ["headache", "diarrhea"],
        "warnings": ["Take before food"],
        "min_age": None,
        "interactions": [],
    },
    "loperamide": {
        "aka": ["imodium"],
        "treats": ["diarrhea", "loose motion"],
        "side_effects": ["constipation", "bloating"],
        "warnings": ["Do not use if there is blood in stool or high fever", "Stay hydrated"],
        "min_age": 12,
        "interactions": [],
    },
    "ors": {
        "aka": ["oral rehydration salts", "electral"],
        "treats": ["dehydration", "diarrhea"],
        "side_effects": ["generally safe"],
        "warnings": ["Mix with the correct amount of clean water"],
        "min_age": None,
        "interactions": [],
    },
    "amoxicillin": {
        "aka": ["amoxil", "mox", "novamox"],
        "treats": ["bacterial infection", "throat infection", "ear infection"],
        "side_effects": ["diarrhea", "rash", "nausea"],
        "warnings": [
            "Antibiotic - only use if prescribed",
            "Finish the full course",
            "Avoid if allergic to penicillin",
        ],
        "min_age": None,
        "interactions": [],
    },
    "azithromycin": {
        "aka": ["zithromax", "azithral", "azee"],
        "treats": ["bacterial infection", "throat infection", "respiratory infection"],
        "side_effects": ["nausea", "diarrhea", "stomach pain"],
        "warnings": ["Antibiotic - only use if prescribed", "Finish the full course"],
        "min_age": None,
        "interactions": [],
    },
    "metformin": {
        "aka": ["glucophage", "glycomet"],
        "treats": ["type 2 diabetes", "high blood sugar"],
        "side_effects": ["nausea", "diarrhea", "metallic taste"],
        "warnings": ["Prescription medicine", "Take with meals"],
        "min_age": None,
        "interactions": [],
    },
    "salbutamol": {
        "aka": ["albuterol", "asthalin", "ventolin"],
        "treats": ["asthma", "wheezing", "breathlessness"],
        "side_effects": ["tremor", "fast heartbeat"],
        "warnings": ["Use as directed by a doctor", "Seek help if breathing does not improve"],
        "min_age": None,
        "interactions": [],
    },
    "dextromethorphan": {
        "aka": ["benylin", "dextro"],
        "treats": ["dry cough"],
        "side_effects": ["drowsiness", "dizziness"],
        "warnings": ["Not for productive (wet) cough"],
        "min_age": 6,
        "interactions": ["antidepressants"],
    },
    "domperidone": {
        "aka": ["motilium", "domstal"],
        "treats": ["nausea", "vomiting"],
        "side_effects": ["dry mouth", "headache"],
        "warnings": ["Use the lowest effective dose"],
        "min_age": None,
        "interactions": [],
    },
    "montelukast": {
        "aka": ["singulair", "montair"],
        "treats": ["asthma", "allergic rhinitis"],
        "side_effects": ["headache", "stomach pain", "mood changes"],
        "warnings": ["Prescription medicine"],
        "min_age": None,
        "interactions": [],
    },
    "diclofenac": {
        "aka": ["voveran", "voltaren"],
        "treats": ["pain", "inflammation", "joint pain"],
        "side_effects": ["stomach upset", "heartburn"],
        "warnings": ["Take with food", "Caution with heart or kidney conditions"],
        "min_age": 14,
        "interactions": ["aspirin", "warfarin"],
    },
    "amlodipine": {
        "aka": ["amlong", "norvasc"],
        "treats": ["high blood pressure", "hypertension"],
        "side_effects": ["ankle swelling", "flushing", "headache"],
        "warnings": ["Prescription medicine", "Do not stop suddenly"],
        "min_age": None,
        "interactions": [],
    },
    "atorvastatin": {
        "aka": ["lipitor", "atorva"],
        "treats": ["high cholesterol"],
        "side_effects": ["muscle ache", "headache"],
        "warnings": ["Prescription medicine", "Report unexplained muscle pain"],
        "min_age": None,
        "interactions": [],
    },
    "vitamin c": {
        "aka": ["ascorbic acid", "limcee", "celin"],
        "treats": ["low immunity", "cold support"],
        "side_effects": ["generally safe", "stomach upset in high doses"],
        "warnings": ["Very high doses are not better"],
        "min_age": None,
        "interactions": [],
    },
}