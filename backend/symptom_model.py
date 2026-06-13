"""Loads the trained matcher and returns top-k medicine predictions."""

import os
import pickle


class SymptomMatcher:
    def __init__(self, model_path="model.pkl", tfidf_path="tfidf.pkl"):
        if not (os.path.exists(model_path) and os.path.exists(tfidf_path)):
            raise FileNotFoundError(
                "model.pkl / tfidf.pkl not found. "
                "Run `python train_model.py` first."
            )
        with open(tfidf_path, "rb") as f:
            self.vectorizer = pickle.load(f)
        with open(model_path, "rb") as f:
            self.model = pickle.load(f)

    def predict(self, text, top_k=3):
        if not text or not text.strip():
            return []
        vec = self.vectorizer.transform([text.lower()])
        proba = self.model.predict_proba(vec)[0]
        classes = self.model.classes_
        idx = proba.argsort()[::-1][:top_k]
        return [
            {"medicine": str(classes[i]), "confidence": round(float(proba[i]), 4)}
            for i in idx
        ]