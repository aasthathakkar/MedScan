"""
Evaluates the symptom -> medicine matcher on a held-out test split.

Reports top-1 accuracy, top-3 accuracy, and macro-F1 on 20% held-out data.
Supports both Drugs.com and WebMD CSV formats (same as train_model.py).

Usage:
    python evaluate_model.py                   # auto-detects CSV
    python evaluate_model.py path/to/file.csv  # force a specific CSV
"""

import sys
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score

from train_model import load_dataset, clean


def evaluate(path=None):
    df, is_seed = load_dataset(path)
    df = clean(df)

    if is_seed:
        print("\n  WARNING: evaluating on the built-in SEED dataset.")
        print("  These scores are NOT meaningful. Put webmd.csv or")
        print("  drugsComTrain_raw.csv in backend/ and rerun.\n")
    else:
        counts = df["drugName"].value_counts()
        keep = list(counts[counts >= 20].head(200).index)
        df = df[df["drugName"].isin(keep)]

    # Need at least 2 samples per class for stratified split
    vc = df["drugName"].value_counts()
    df = df[df["drugName"].isin(vc[vc >= 2].index)]

    X = df["condition"].values
    y = df["drugName"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    vec = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=1 if is_seed else 3,
        stop_words="english",
        max_features=50000,
    )
    Xtr = vec.fit_transform(X_train)
    Xte = vec.transform(X_test)

    clf = LogisticRegression(max_iter=1000, C=4.0, n_jobs=-1)
    clf.fit(Xtr, y_train)

    classes = clf.classes_
    proba = clf.predict_proba(Xte)

    top1 = classes[proba.argmax(axis=1)]
    top1_acc = float((top1 == y_test).mean())

    top3_idx = np.argsort(proba, axis=1)[:, -3:]
    top3_hit = np.array([y_test[i] in classes[top3_idx[i]] for i in range(len(y_test))])
    top3_acc = float(top3_hit.mean())

    macro_f1 = float(f1_score(y_test, top1, average="macro", zero_division=0))

    print(f"\nEvaluated on {df['drugName'].nunique()} drugs / {len(X)} rows")
    print(f"  Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"  Top-1 accuracy : {top1_acc * 100:.1f}%")
    print(f"  Top-3 accuracy : {top3_acc * 100:.1f}%  (matches the top-3 UI)")
    print(f"  Macro F1       : {macro_f1:.3f}")
    print()
    return top1_acc, top3_acc, macro_f1


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    evaluate(arg)