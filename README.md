# 💊 MedScan - AI Medicine Advisor

An AI-powered full-stack medicine advisor that helps you understand the right medicine for your symptoms, scan medicine strips for expiry dates, and manage your personal medicine cabinet.

> ⚠️ **Disclaimer:** MedScan is an educational prototype, not medical advice. Always consult a qualified doctor or pharmacist before taking any medication.

---

## 🔍 What it does

**1. Symptom Checker**
Describe your symptoms in plain English and get the top matching medicines with confidence scores, what they treat, side effects, and safety warnings. Results below 8% confidence are filtered out automatically.

**2. Medicine Scanner**
Upload a photo of any medicine strip, box, or label. MedScan uses OCR to extract the medicine name and expiry date and tells you whether it is valid, expiring soon, or already expired.

**3. Safety Check**
Enter a medicine name, your age, and any other medicines you are taking. MedScan checks for age restrictions (e.g. aspirin under 16 triggers a Reye's syndrome warning) and known drug interactions.

**4. Medicine Encyclopedia**
Browse and search all medicines in the knowledge base: generic name, brand names, what it treats, side effects, warnings, age limits, and interactions.

**5. My Cabinet**
Save medicines you have at home with their expiry dates and notes. Expiry status is computed live. Add directly from symptom results or the medicine detail page.

**6. History**
See a log of every symptom check and scan you have run, pulled from the SQLite database.

---

## 🏗️ Architecture

```
React Frontend (Vite)
        ↓  REST API (JSON)
FastAPI Backend (Python)
        ↓
┌─────────────────────────────────────────────┐
│  Symptom Matcher   TF-IDF + Logistic Reg.   │
│  OCR Engine        EasyOCR                  │
│  Safety Checker    Rule-based               │
│  Data Layer        SQLite (4 tables)        │
└─────────────────────────────────────────────┘
```

The frontend never sees the backend's raw response shapes: a normalization layer
in `src/api/client.js` maps the API's `snake_case` fields (`medicine_name`,
`expiry_status`, `created_at`, …) to the `camelCase` the components expect, so
either side can change independently.

---

## 🧠 ML Model

- **Algorithm:** TF-IDF vectorizer (unigrams + bigrams) into a Logistic Regression classifier
- **Training data:** UCI ML Drug Review Dataset (Drugs.com) with ~215,000 real patient reviews. Falls back to a built-in seed dataset so the app runs immediately on a fresh clone without needing the Kaggle CSV.
- **Output:** Top-3 medicine predictions with probability scores per query
- **Evaluation:** `evaluate_model.py` trains on an 80/20 split purely for scoring and reports top-1 accuracy, top-3 accuracy, and macro-F1. (The shipped `model.pkl` is trained on 100% of the data by `train_model.py`, so the two are intentionally separate — one is the product, the other is the honest score.)

The model is a **closed-set classifier**: it predicts from its fixed set of trained medicines and cannot invent new drug names. Unrecognized input still returns the nearest known medicines, just with low confidence.

---

## 🗄️ Database

SQLite (`medicine_advisor.db`) is auto-created on first server boot and git-ignored since it regenerates from seed data on every deploy.

| Table | What it stores |
|---|---|
| `medicines` | The medicine knowledge base, seeded from `seed_data.py` |
| `symptom_history` | Every `/symptoms` query and top result |
| `scan_history` | Every `/scan` with medicine name and expiry status |
| `cabinet` | User-saved medicines with expiry and notes |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, CSS Modules |
| Routing | React Router v6 |
| Backend | FastAPI, Python 3.10+ |
| ML | scikit-learn (TF-IDF + Logistic Regression) |
| OCR | EasyOCR (PyTorch) |
| Database | SQLite |

---

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check and model status |
| POST | `/symptoms` | Symptom text to top medicines (logged to history) |
| POST | `/scan` | Image upload to OCR name and expiry (logged to history) |
| POST | `/check` | Medicine + age + other meds to safety warnings |
| GET | `/medicines` | Full knowledge base |
| GET | `/medicines/{name}` | Single medicine detail |
| GET | `/history` | Recent symptom checks and scans |
| POST | `/cabinet` | Add a medicine to the cabinet |
| GET | `/cabinet` | List saved medicines |
| DELETE | `/cabinet/{id}` | Remove a saved medicine |

---

## 🚀 Running locally

### Prerequisites
- Python 3.10+
- Node 18+

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train_model.py           # creates model.pkl and tfidf.pkl
uvicorn main:app --reload --port 8000
```

Interactive API docs at **http://localhost:8000/docs**

To use the full model, download `drugsComTrain_raw.csv` from the UCI Drug Review Dataset on Kaggle, place it in `backend/`, and rerun `python train_model.py`. Then check the scores with:

```bash
python evaluate_model.py        # top-1, top-3, macro-F1 on an 80/20 split
```

### Frontend

```bash
cd frontend
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm install
npm run dev
```

App at **http://localhost:5173**


## 📁 Project structure

```
MedScan/
├── backend/
│   ├── main.py             # FastAPI app and all routes
│   ├── symptom_model.py    # Loads trained matcher, runs predictions
│   ├── train_model.py      # TF-IDF + LR training script (+ seed dataset)
│   ├── evaluate_model.py   # 80/20 evaluation (top-1, top-3, macro-F1)
│   ├── ocr_engine.py       # EasyOCR pipeline and expiry parser
│   ├── safety.py           # Age limits and interaction checks
│   ├── db.py               # SQLite data layer (CRUD for all 4 tables)
│   ├── seed_data.py        # Single source of truth for medicine knowledge base
│   ├── model.pkl           # Trained classifier (committed, no retrain on deploy)
│   ├── tfidf.pkl           # Fitted vectorizer (committed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js       # All API calls and response normalization
│   │   │   └── mock.js         # Mock data for dev without backend
│   │   ├── components/
│   │   │   ├── Nav.jsx / Nav.module.css
│   │   │   ├── UI.jsx          # Card, Badge, Btn, Spinner, Disclaimer
│   │   │   └── UI.module.css
│   │   ├── pages/
│   │   │   ├── Home.jsx / Home.module.css
│   │   │   ├── Symptoms.jsx / Symptoms.module.css
│   │   │   ├── Scan.jsx / Scan.module.css
│   │   │   ├── Check.jsx / Check.module.css
│   │   │   ├── Medicines.jsx / Medicines.module.css
│   │   │   ├── Cabinet.jsx / Cabinet.module.css
│   │   │   └── History.jsx / History.module.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css           # Design tokens (CSS variables)
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## ⚠️ Limitations & honest notes

- **Not medical advice.** This is an educational prototype. Every medicine output
  carries a disclaimer, and the safety logic is a teaching aid, not a clinical
  tool.
- **Closed-set classifier.** The matcher only knows the medicines it was trained
  on. Out-of-vocabulary or vague symptoms still return the nearest known options
  at low confidence — read the percentage, not just the name.
- **Seed vs. full data.** A fresh clone runs on a small hand-built seed dataset so
  the app works immediately; meaningful accuracy requires the ~215k-row Kaggle
  dataset and a rerun of `train_model.py`.
- **OCR depends on image quality.** Expiry/name extraction works best on clear,
  well-lit, flat strips. The parser handles common date formats (MM/YYYY,
  MM-YY, MON YYYY, ISO, and `EXP`-prefixed); unusual layouts may not parse.
- **Safety knowledge is curated, not exhaustive.** Interaction and age-limit
  checks cover the medicines in `seed_data.py` and are not a substitute for a
  pharmacist or a full drug-interaction database.


---

*Built to make medicine safety more accessible.*
