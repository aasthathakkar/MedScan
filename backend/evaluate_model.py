"""
Evaluates the symptom -> medicine matcher on a held-out test split.

Trains a fresh TF-IDF + Logistic Regression on 80% of the data and reports
top-1 accuracy, top-3 accuracy, and macro-F1 on the remaining 20%.

Usage:
    python evaluate_model.py                   # auto: Kaggle CSV if found, else seed
    python evaluate_model.py path/to/file.csv  # force a specific CSV

NOTE: this trains its OWN model on an 80/20 split purely for scoring. The
shipped model.pkl is trained on 100% of the data by train_model.py, so the
two are not identical by design. Run this on the full Kaggle dataset; on the
tiny built-in seed set the numbers are not meaningful.
"""

import sys

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

# Reuse the exact same data loading + cleaning as training, so the evaluation
# reflects the real pipeline rather than a divergent copy.
from train_model import load_dataset, clean


def evaluate(path=None):
    df, is_seed = load_dataset(path)
    df = clean(df)

    if is_seed:
        print("\n  WARNING: evaluating on the built-in SEED dataset.")
        print("  These scores are NOT meaningful. Download the Kaggle CSV")
        print("  (drugsComTrain_raw.csv) into backend/ and rerun for a real eval.\n")
    else:
        # Mirror train_model's filtering so we score the same drug set the
        # shipped model is trained on.
        counts = df["drugName"].value_counts()
        keep = list(counts[counts >= 25].head(150).index)
        df = df[df["drugName"].isin(keep)]

    # Stratified split needs at least 2 samples per class.
    vc = df["drugName"].value_counts()
    df = df[df["drugName"].isin(vc[vc >= 2].index)]

    X = df["condition"].values
    y = df["drugName"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1 if is_seed else 3,
        stop_words="english",
    )
    Xtr = vectorizer.fit_transform(X_train)
    Xte = vectorizer.transform(X_test)

    clf = LogisticRegression(max_iter=1000, C=4.0)
    clf.fit(Xtr, y_train)

    classes = clf.classes_
    proba = clf.predict_proba(Xte)

    # Top-1
    top1 = classes[proba.argmax(axis=1)]
    top1_acc = float((top1 == y_test).mean())

    # Top-3: is the true label among the 3 highest-probability classes?
    top3_idx = np.argsort(proba, axis=1)[:, -3:]
    top3_hit = np.array([y_test[i] in classes[top3_idx[i]] for i in range(len(y_test))])
    top3_acc = float(top3_hit.mean())

    macro_f1 = float(f1_score(y_test, top1, average="macro"))

    print(
        f"Evaluated on {len(set(y))} drugs / {len(X)} rows "
        f"({len(X_train)} train, {len(X_test)} test)"
    )
    print(f"  Top-1 accuracy : {top1_acc:.3f}")
    print(f"  Top-3 accuracy : {top3_acc:.3f}")
    print(f"  Macro F1       : {macro_f1:.3f}")


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    evaluate(arg)