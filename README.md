# 💊 MedScan — Medicine Advisor

An AI-powered medicine advisor that helps you identify the right medicine for your symptoms and verify your medicines using image scanning.

---

## 🔍 What it does

**1. Symptom Checker**
Enter your symptoms in plain English and get the top 3 matching medicines with confidence scores, common uses, and side effects.

**2. Medicine Scanner**
Upload a photo of any medicine strip, box, or label — MedScan reads the medicine name and expiry date using OCR and tells you if it's safe to take.

**3. Safety Warnings**
Get instant warnings if:
- The medicine doesn't match your symptoms
- The medicine is expired or expiring within 30 days
- There are age-based or dietary restrictions

---

## 🏗️ Architecture

```
React Frontend
      ↓
FastAPI Backend
      ↓
┌─────────────────────────────┐
│  Symptom Matcher            │  TF-IDF + Logistic Regression
│  OCR Engine                 │  EasyOCR
│  Safety Checker             │  Rule-based warnings
└─────────────────────────────┘
```

---

## 📊 Dataset

**UCI Drug Review Dataset** — 215,000 real patient drug reviews
- Drug name → medical condition mapping
- Used to train symptom → medicine classifier
- Covers 900+ medicines and conditions

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Python |
| ML Model | scikit-learn, TF-IDF, Logistic Regression |
| OCR | EasyOCR |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🚀 How to run

```bash
# Clone
git clone https://github.com/aasthathakkar/medscan.git
cd medscan

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📁 Structure

```
├── backend/
│   ├── main.py            # FastAPI app + routes
│   ├── symptom_model.py   # TF-IDF symptom matcher
│   ├── ocr_engine.py      # EasyOCR medicine scanner
│   ├── safety.py          # Rule-based safety checker
│   ├── model.pkl          # Trained model
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── SymptomChecker.jsx
│           ├── ImageUpload.jsx
│           ├── MedicineCard.jsx
│           └── ExpiryBadge.jsx
└── README.md
```

---

## ⚠️ Disclaimer

MedScan is built for educational purposes only. Always consult a qualified medical professional before taking any medicine.

---

*Built to make medicine safety accessible to everyone.*
