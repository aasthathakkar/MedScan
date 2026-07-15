"""
Trains the symptom -> medicine matcher (TF-IDF + Logistic Regression).

Strategy: hybrid training
  1. Start with the WebMD/Drugs.com dataset for breadth (many conditions)
  2. Oversample our curated OTC medicines so they rank above obscure
     US prescription drugs for common symptoms
  3. Result: "fever headache" -> paracetamol/ibuprofen, not naproxen

This is honest ML engineering: the training data should match your use case.
WebMD is US prescription-focused; we correct for that by weighting OTC meds.
"""

import os
import sys
import pickle

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

DATA_CANDIDATES = [
    "drugsComTrain_raw.csv",
    "data/drugsComTrain_raw.csv",
    "webmd.csv",
    "data/webmd.csv",
]

EXCLUDE_CONDITIONS = {"other", "n/a", "", "none", "not applicable"}

# ---------------------------------------------------------------------------
# Curated OTC medicine data — these get oversampled in training so they
# appear for common symptoms even if underrepresented in the external dataset.
# This matches the app's actual use case: Indian OTC medicines for everyday use.
# ---------------------------------------------------------------------------
OTC_OVERSAMPLES = {
    "Paracetamol": [
        "fever", "headache", "body ache", "mild pain", "cold and fever",
        "high temperature", "flu", "muscle pain", "toothache",
        "headache and fever", "body pain", "fever and chills",
    ],
    "Ibuprofen": [
        "pain", "inflammation", "fever", "back pain", "muscle pain",
        "period pain", "joint pain", "swelling", "dental pain",
        "pain and inflammation", "sports injury",
    ],
    "Aspirin": [
        "pain", "fever", "headache", "mild pain", "blood thinning",
        "heart attack prevention",
    ],
    "Cetirizine": [
        "allergy", "runny nose", "sneezing", "itching", "hay fever",
        "skin rash", "allergic rhinitis", "dust allergy",
        "allergy and sneezing", "watery eyes",
    ],
    "Loratadine": [
        "allergy", "hay fever", "runny nose", "sneezing",
        "non drowsy allergy", "seasonal allergy",
    ],
    "Fexofenadine": [
        "allergy", "hives", "itching", "hay fever",
        "chronic urticaria", "seasonal allergies",
    ],
    "Omeprazole": [
        "acidity", "heartburn", "acid reflux", "gerd",
        "indigestion", "stomach acid", "burning stomach",
        "acidity and heartburn",
    ],
    "Pantoprazole": [
        "acidity", "heartburn", "acid reflux", "stomach acid",
        "gastric pain", "burning in chest",
    ],
    "Loperamide": [
        "diarrhea", "loose motion", "stomach upset",
        "traveler diarrhea",
    ],
    "Domperidone": [
        "nausea", "vomiting", "stomach upset", "bloating",
        "nausea and vomiting",
    ],
    "Amoxicillin": [
        "bacterial infection", "throat infection", "ear infection",
        "chest infection", "sinus infection", "strep throat",
    ],
    "Azithromycin": [
        "bacterial infection", "throat infection", "respiratory infection",
        "pneumonia", "bronchitis", "skin infection",
    ],
    "Metformin": [
        "diabetes", "high blood sugar", "type 2 diabetes",
        "blood sugar control", "type 2 diabetes mellitus",
    ],
    "Salbutamol": [
        "asthma", "wheezing", "breathlessness", "shortness of breath",
        "bronchospasm", "exercise induced asthma",
    ],
    "Montelukast": [
        "asthma", "allergy", "allergic rhinitis",
        "exercise induced bronchospasm",
    ],
    "Dextromethorphan": [
        "cough", "dry cough", "non productive cough",
    ],
    "Diclofenac": [
        "pain", "inflammation", "joint pain", "muscle pain",
        "arthritis", "back pain",
    ],
    "Amlodipine": [
        "high blood pressure", "hypertension", "chest pain",
        "angina", "blood pressure control",
    ],
    "Atorvastatin": [
        "high cholesterol", "cholesterol", "cardiovascular risk",
        "hyperlipidemia",
    ],
    "Vitamin C": [
        "cold", "low immunity", "fatigue", "immunity boost",
        "vitamin deficiency",
    ],
}

# How many times to repeat each OTC sample
OTC_WEIGHT = 8


def build_seed():
    rows = []
    for drug, conditions in OTC_OVERSAMPLES.items():
        for cond in conditions:
            for _ in range(OTC_WEIGHT):
                rows.append({"drugName": drug, "condition": cond})
    return pd.DataFrame(rows)


def load_dataset(path=None):
    paths = [path] if path else DATA_CANDIDATES
    for p in paths:
        if p and os.path.exists(p):
            print(f"Loading dataset from {p} ...")
            for sep in ["\t", ","]:
                try:
                    df = pd.read_csv(p, sep=sep)
                    if {"drugName", "condition"}.issubset(df.columns):
                        print(f"  Detected Drugs.com format, shape={df.shape}")
                        return df, False
                except Exception:
                    continue
            try:
                df = pd.read_csv(p)
                if {"Drug", "Condition"}.issubset(df.columns):
                    print(f"  Detected WebMD format, shape={df.shape}")
                    df = df.rename(columns={"Drug": "drugName", "Condition": "condition"})
                    df = df[~df["condition"].str.lower().str.strip().isin(EXCLUDE_CONDITIONS)]
                    return df, False
            except Exception as e:
                print(f"  Failed to parse {p}: {e}")
    print("No dataset CSV found -> using built-in seed dataset.")
    return build_seed(), True


def clean(df):
    df = df.dropna(subset=["drugName", "condition"]).copy()
    df = df[~df["condition"].astype(str).str.contains("</span>", na=False)]
    df["condition"] = df["condition"].astype(str).str.strip().str.lower()
    df["drugName"]  = df["drugName"].astype(str).str.strip()
    df = df[df["condition"].str.len() > 1]
    df = df[df["drugName"].str.len() > 1]
    return df


def train_and_save(path=None):
    df, is_seed = load_dataset(path)
    df = clean(df)

    if not is_seed:
        counts = df["drugName"].value_counts()
        keep = list(counts[counts >= 20].head(200).index)
        df = df[df["drugName"].isin(keep)]
        print(f"External dataset: {len(keep)} drugs, {len(df)} rows")
        otc_df = clean(build_seed())
        df = pd.concat([df, otc_df], ignore_index=True)
        print(f"After OTC oversampling: {df['drugName'].nunique()} drugs, {len(df)} rows")
    else:
        df = clean(build_seed())

    print(f"Training on {df['drugName'].nunique()} drugs / {len(df)} rows")

    X = df["condition"].values
    y = df["drugName"].values

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        stop_words="english",
        max_features=50000,
    )
    Xv = vectorizer.fit_transform(X)
    clf = LogisticRegression(max_iter=2000, C=5.0)
    clf.fit(Xv, y)

    with open("tfidf.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open("model.pkl", "wb") as f:
        pickle.dump(clf, f)
    print("Saved model.pkl and tfidf.pkl")

    classes = clf.classes_
    print("\nSmoke test:")
    for q in [
        "headache fever body ache",
        "allergy and sneezing",
        "acidity and heartburn",
        "high blood pressure",
        "type 2 diabetes",
        "dry cough",
        "nausea and vomiting",
        "loose motion diarrhea",
    ]:
        row = clf.predict_proba(vectorizer.transform([q]))[0]
        idx = row.argsort()[::-1][:3]
        top = [(classes[i], round(float(row[i]), 3)) for i in idx]
        print(f"  {q!r:35} -> {top}")

    return clf, vectorizer


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    train_and_save(path)


if __name__ == "__main__":
    main()