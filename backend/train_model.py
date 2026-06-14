"""
Trains the symptom -> medicine matcher (TF-IDF + Logistic Regression)
and saves model.pkl + tfidf.pkl.

Usage:
    python train_model.py                 # auto: uses Kaggle CSV if found, else seed data
    python train_model.py path/to/file.csv  # force a specific CSV

The Kaggle "UCI ML Drug Review dataset" (Drugs.com) ships as
drugsComTrain_raw.csv (tab-separated). Put it in this backend/ folder.
Until then, a small built-in seed dataset lets the whole app run end-to-end.
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
    "drugsCom_raw/drugsComTrain_raw.csv",
    "drugs.csv",
]


def build_seed():
    """A small, hand-made dataset so the app works before the real CSV exists."""
    seed = {
        "Paracetamol": ["fever", "headache", "body ache", "mild pain",
                        "cold and fever", "high temperature"],
        "Ibuprofen": ["pain", "inflammation", "fever", "back pain",
                      "muscle pain", "period pain"],
        "Aspirin": ["pain", "fever", "headache", "mild pain"],
        "Cetirizine": ["allergy", "runny nose", "sneezing", "itching",
                       "hay fever", "skin rash"],
        "Loratadine": ["allergy", "hay fever", "runny nose", "sneezing"],
        "Omeprazole": ["acidity", "heartburn", "acid reflux", "gerd",
                       "indigestion"],
        "Pantoprazole": ["acidity", "heartburn", "acid reflux", "stomach acid"],
        "Loperamide": ["diarrhea", "loose motion"],
        "ORS": ["dehydration", "diarrhea", "loose motion", "weakness"],
        "Amoxicillin": ["bacterial infection", "throat infection",
                        "ear infection", "chest infection"],
        "Azithromycin": ["bacterial infection", "throat infection",
                         "respiratory infection"],
        "Metformin": ["diabetes", "high blood sugar", "type 2 diabetes"],
        "Salbutamol": ["asthma", "wheezing", "breathlessness",
                       "shortness of breath"],
        "Dextromethorphan": ["cough", "dry cough"],
        "Domperidone": ["nausea", "vomiting", "stomach upset"],
        "Montelukast": ["asthma", "allergy", "allergic rhinitis"],
        "Diclofenac": ["pain", "inflammation", "joint pain", "muscle pain"],
        "Vitamin C": ["cold", "low immunity", "fatigue"],
        "Amlodipine": ["high blood pressure", "hypertension"],
        "Atorvastatin": ["high cholesterol"],
    }
    rows = []
    for drug, conditions in seed.items():
        for cond in conditions:
            # repeat a couple of times so tokens/classes have support
            rows.append({"drugName": drug, "condition": cond})
            rows.append({"drugName": drug, "condition": cond})
    return pd.DataFrame(rows)


def load_dataset(path=None):
    """Returns (dataframe, is_seed)."""
    paths = [path] if path else DATA_CANDIDATES
    for p in paths:
        if p and os.path.exists(p):
            print(f"Loading dataset from {p} ...")
            for sep in ["\t", ","]:
                try:
                    df = pd.read_csv(p, sep=sep)
                    if {"drugName", "condition"}.issubset(df.columns):
                        print(f"  parsed with sep={sep!r}, shape={df.shape}")
                        return df, False
                except Exception:
                    continue
    print("No Kaggle CSV found -> using built-in seed dataset.")
    print("  (Download drugsComTrain_raw.csv from Kaggle and rerun for the full model.)")
    return build_seed(), True


def clean(df):
    df = df.dropna(subset=["drugName", "condition"]).copy()
    # The raw Kaggle data has some HTML-junk condition values; drop them.
    df = df[~df["condition"].astype(str).str.contains("</span>", na=False)]
    df["condition"] = df["condition"].astype(str).str.strip().str.lower()
    df["drugName"] = df["drugName"].astype(str).str.strip()
    df = df[df["condition"].str.len() > 1]
    return df


def train_and_save(path=None):
    """Train the matcher and write model.pkl + tfidf.pkl. Returns (clf, vectorizer)."""
    df, is_seed = load_dataset(path)
    df = clean(df)

    if not is_seed:
        # Keep the most-reviewed drugs so the classifier is tractable
        # and the confidence scores stay meaningful.
        counts = df["drugName"].value_counts()
        keep = list(counts[counts >= 25].head(150).index)
        df = df[df["drugName"].isin(keep)]

    print(f"Training on {df['drugName'].nunique()} drugs / {len(df)} rows")

    X = df["condition"].values
    y = df["drugName"].values

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1 if is_seed else 3,
        stop_words="english",
    )
    Xv = vectorizer.fit_transform(X)

    clf = LogisticRegression(max_iter=1000, C=4.0)
    clf.fit(Xv, y)

    with open("tfidf.pkl", "wb") as f:
        pickle.dump(vectorizer, f)
    with open("model.pkl", "wb") as f:
        pickle.dump(clf, f)
    print("Saved model.pkl and tfidf.pkl")
    return clf, vectorizer


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    clf, vectorizer = train_and_save(path)

    # Smoke test
    classes = clf.classes_
    for q in ["headache fever body ache", "allergy and sneezing",
              "acidity and heartburn", "high blood pressure"]:
        row = clf.predict_proba(vectorizer.transform([q]))[0]
        idx = row.argsort()[::-1][:3]
        top = [(classes[i], round(float(row[i]), 3)) for i in idx]
        print(f"  {q!r:35} -> {top}")


if __name__ == "__main__":
    main()