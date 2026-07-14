# MedScan

A full-stack medicine advisor that helps you understand a medicine you already have at home: what it treats, whether it's expired, and whether it's safe given your age or what else you're taking. Requires a free account — your search and scan history is private to you.

> ⚠️ **Educational prototype, not medical advice.** This tool does not diagnose conditions or prescribe medication. Always consult a qualified doctor or pharmacist before taking any medicine.

---

## Why this exists

In India especially, people often have medicines at home without knowing what they're for, whether they're still good, or whether they're safe to combine with something else. People turn to general-purpose chatbots for this, awkwardly. MedScan is purpose-built for it: describe symptoms and get medicines commonly used for them, scan a strip to read its expiry date, or check one medicine against your age and other medications — all from a small, curated knowledge base rather than open-ended chat.

## What it does

**1. Symptom Checker** — describe symptoms in plain text; a TF-IDF + Logistic Regression model returns the top 3 closest-matching medicines from the knowledge base, each with a confidence score, what it treats, side effects, and warnings.

**2. Scan Medicine** — upload a photo of a medicine strip or box; EasyOCR reads the text, a regex parser extracts the expiry date in whatever format it's printed (`MM/YYYY`, `MM-YY`, `EXP JUN 2026`, etc.), and the app reports whether it's valid, expiring soon, or expired.

**3. Safety Checker** — enter a medicine name plus your age and any other medicines you're taking; rule-based checks flag age restrictions (e.g. aspirin isn't recommended under 16, due to Reye's syndrome risk) and known interactions between medicines.

**4. Medicine Encyclopedia** — browse or search the full knowledge base directly: what each medicine treats, side effects, warnings, brand names, and interactions.

**5. History** — a private log of your past symptom checks and scans. Requires login — each user only ever sees their own rows, enforced at the database level via Row Level Security.

## How it's built

**Backend** — FastAPI (Python), Supabase (Postgres), scikit-learn, EasyOCR
**Frontend** — React (Vite), plain CSS modules, Supabase JS client

### Authentication

Auth is handled entirely by Supabase — email/password and Google OAuth are both supported. The frontend uses the Supabase JS client with the `anon` public key. The backend uses the `service_role` key (never exposed to the frontend) to seed data and verify JWTs on protected routes.

Protected routes (`/symptoms`, `/scan`, `/history`) require a valid Bearer token in the `Authorization` header. The frontend attaches it automatically via `getAccessToken()` before every request. `/check` and `/medicines` are intentionally public — they're purely informational lookups that don't touch personal data.

### Privacy model

History privacy is enforced at the database level via Postgres Row Level Security (RLS), not just in the backend code. Every row in `symptom_history` and `scan_history` has a `user_id` column that references `auth.users`. RLS policies ensure a user can only `SELECT`, `INSERT`, or `DELETE` rows where `auth.uid() = user_id` — so even a direct API call with the anon key can't read another user's history. The backend's own filter-by-user_id is a second layer, not the only layer.

### The ML model

The symptom matcher is a `TfidfVectorizer` (unigrams + bigrams) feeding a `LogisticRegression` classifier, trained on symptom/condition → medicine pairs. It's a closed-set classifier: it can only ever return one of the medicines it was trained on, never an unrecognized one. Two data sources are supported:

- A small **built-in seed set** (~20 medicines, hand-written) so the app runs immediately with zero setup.
- The full **[UCI ML Drug Review Dataset](https://archive.ics.uci.edu/dataset/461/drug+review+dataset+drugs+com)** (Drugs.com, ~215k reviews), if `drugsComTrain_raw.csv` is placed in `backend/` before training.

`evaluate_model.py` does an honest 80/20 train/test split and reports top-1 accuracy, top-3 accuracy, and macro-F1.

### The data layer

Supabase (Postgres). Three tables:

| Table | Scope | Purpose |
|---|---|---|
| `medicines` | Shared | Curated knowledge base — 19 common OTC medicines with brand names, treats, side effects, warnings, min age, interactions |
| `symptom_history` | Per-user (RLS) | Every symptom search, private to the user who ran it |
| `scan_history` | Per-user (RLS) | Every strip scan, private to the user who ran it |

### OCR pipeline

EasyOCR reads all text blocks off the uploaded image. The medicine name is taken as either a recognized entry from the knowledge base if one appears in the text, or the tallest text block as a fallback. The expiry date is extracted via regex patterns covering numeric and month-name formats. Expiry status is computed against IST.

## Project structure

```
MedScan/
├── backend/
│   ├── main.py              # FastAPI app and routes (auth-aware)
│   ├── supabase_db.py       # Supabase data layer (replaces SQLite db.py)
│   ├── db.py                # Legacy SQLite layer (kept for reference, unused)
│   ├── seed_data.py         # Medicine knowledge base (source of truth)
│   ├── safety.py            # Age limit + interaction logic
│   ├── symptom_model.py     # Loads model.pkl/tfidf.pkl, runs predictions
│   ├── ocr_engine.py        # EasyOCR + expiry parsing
│   ├── train_model.py       # Trains and saves the symptom matcher
│   ├── evaluate_model.py    # Held-out accuracy / F1 evaluation
│   ├── model.pkl, tfidf.pkl # Trained model artifacts (committed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/supabase.js   # Supabase client + auth helpers
│   │   ├── pages/            # Auth, AuthCallback, Home, Symptoms, Scan,
│   │   │                     # Check, Medicines, History
│   │   ├── components/       # Nav (with user/sign-out), shared UI
│   │   ├── api/client.js     # API calls + auth token attachment
│   │   └── api/mock.js       # Mock data for local dev without backend
│   └── package.json
└── README.md
```

## Running it locally

### Supabase setup (one-time)

1. Create a project at [supabase.com](https://supabase.com)
2. Run the schema in **SQL Editor → New query** (see `schema.sql` or the schema block in the setup guide)
3. Enable **Authentication → Providers → Google** if you want Google sign-in
4. Set **Authentication → URL Configuration → Site URL** to `http://localhost:5173`

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python train_model.py   # creates model.pkl + tfidf.pkl
```

Create `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key   # Settings → API → service_role
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key   # Settings → API → anon public
```

```bash
npm run dev
```

## API reference

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| GET | `/` | No | Health check |
| POST | `/symptoms` | Yes | `{"text": "..."}` → top-3 medicine matches |
| POST | `/scan` | Yes | Multipart image → name, expiry, status |
| POST | `/check` | No | `{"medicine", "age", "other_medicines"}` → warnings |
| GET | `/medicines` | No | Full knowledge base |
| GET | `/medicines/{name}` | No | One medicine's full details |
| GET | `/history` | Yes | Caller's private symptom checks and scans |

## Limitations, honestly

- **Not medical advice.** Decision-support over a small curated dataset, not a diagnostic tool.
- **Closed-set classifier.** The symptom matcher can only return medicines it was trained on.
- **Small knowledge base.** 19 medicines, hand-curated. Covers common OTC cases only.
- **OCR depends on image quality.** Blurry or glare-heavy strips may not parse correctly.
- **Email confirmation required by default.** New signups need to confirm their email before signing in (configurable in Supabase Authentication settings).

## License

Educational project. Not for clinical or commercial use without proper medical and regulatory review.
