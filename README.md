# MedScan

A full-stack medicine advisor that helps you understand a medicine you already have at home — what it treats, whether it's expired, and whether it's safe given your age or other medicines you're taking. Requires a free account; your history is private to you.

> ⚠️ **Educational prototype, not medical advice.** Always consult a qualified doctor or pharmacist before taking any medicine.

---

## The problem it solves

In India, people often self-medicate with medicines they have at home — without knowing whether it's expired, whether it interacts with something else they're taking, or whether it's even the right medicine for their symptoms. People use ChatGPT for this, awkwardly. MedScan is purpose-built for it.

## Features

**Symptom Checker** — describe symptoms in plain text; a TF-IDF + Logistic Regression model trained on 177k+ real drug reviews returns the top 3 most likely medicines with confidence scores, what each treats, side effects, and warnings.

**Scan Medicine** — upload a photo of a medicine strip or box; EasyOCR reads the text, a 3-pass ingredient lookup resolves unknown brands to their active ingredient (Calpol → Paracetamol, Azithral → Azithromycin, 70+ brands supported), and a regex expiry parser with year sanity-checking rejects OCR misreads like "7022".

**Safety Checker** — enter a medicine name, your age, and other medicines you're taking; rule-based checks flag age restrictions (aspirin under 16 → Reye's syndrome risk) and known drug interactions.

**Medicine Encyclopedia** — browse or search the knowledge base: what each medicine treats, side effects, warnings, brand names, and interactions.

**Private History** — every symptom check and scan is logged privately per user, enforced at the database level via Postgres Row Level Security — not just backend filtering.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python) |
| ML model | scikit-learn — TF-IDF + Logistic Regression |
| OCR | EasyOCR + custom 3-pass name resolver + regex expiry parser |
| Database | Supabase (Postgres + Row Level Security) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Frontend | React + Vite, plain CSS modules |
| Deployment | Netlify (frontend) + Railway (backend) |

## ML model

The symptom matcher uses a hybrid training strategy:

- **External data:** WebMD drug review dataset (~362k reviews, 200+ drugs) for breadth
- **OTC oversampling:** common Indian OTC medicines (Paracetamol, Cetirizine, Omeprazole, etc.) are oversampled 8× to correct for the US prescription bias in the WebMD data — so "headache fever" returns Paracetamol, not Naproxen
- **Architecture:** `TfidfVectorizer` (unigrams + bigrams, 50k features) → `LogisticRegression (C=5.0)`
- **Evaluation on held-out 20% test split:**
  - Top-1 accuracy: ~30%
  - **Top-3 accuracy: ~61%** ← the relevant metric (UI shows 3 results)
  - Macro F1: ~0.20

Smoke test results after training:
```
'headache fever body ache'   → Paracetamol 99.7%
'allergy and sneezing'       → Cetirizine 92.3%
'acidity and heartburn'      → Omeprazole 87.6%
'type 2 diabetes'            → Metformin 72.3%
'loose motion diarrhea'      → Loperamide 98.1%
```

The ingredient-based lookup is a separate system from the classifier — it reads active ingredients off a scanned strip and resolves 25 common OTC ingredients and 70+ brand names without needing the ML model.

## Privacy model

History is private per user via Postgres Row Level Security (RLS). Every row in `symptom_history` and `scan_history` has a `user_id` referencing `auth.users`. RLS policies enforce `auth.uid() = user_id` at the database level — so even a direct API call with the public anon key cannot read another user's rows.

## Project structure

```
MedScan/
├── backend/
│   ├── main.py              # FastAPI routes (auth-aware)
│   ├── supabase_db.py       # Supabase data layer
│   ├── seed_data.py         # Medicine knowledge base (source of truth)
│   ├── ingredient_data.py   # 25 ingredients + 70+ brand name lookup
│   ├── safety.py            # Age limits + interaction rule checks
│   ├── ocr_engine.py        # EasyOCR + 3-pass name resolution + expiry parsing
│   ├── symptom_model.py     # Loads and runs the trained classifier
│   ├── train_model.py       # Hybrid training script (WebMD + OTC oversampling)
│   ├── evaluate_model.py    # Held-out accuracy evaluation
│   ├── model.pkl            # Trained classifier (committed — no retrain on deploy)
│   ├── tfidf.pkl            # Fitted vectorizer
│   ├── nixpacks.toml        # Pins Python 3.12 for Railway (torch compatibility)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/supabase.js  # Supabase client + auth helpers
│   │   ├── pages/           # Auth, AuthCallback, Home, Symptoms, Scan, Check, Medicines, History
│   │   ├── components/      # Nav (with user + sign out), UI components
│   │   └── api/client.js    # API calls + Bearer token attachment
│   ├── netlify.toml         # Build config + SPA redirect rule
│   ├── vercel.json          # Fallback SPA routing config
│   └── package.json
├── railway.json             # Railway deployment config
└── README.md
```

## Running locally

### Prerequisites
- Python 3.12
- Node 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Supabase setup (one-time)

1. Create a project at supabase.com
2. Run this schema in **SQL Editor → New query**:

```sql
create table if not exists medicines (
    id            bigint generated always as identity primary key,
    name          text unique not null,
    aka           jsonb not null default '[]',
    treats        jsonb not null default '[]',
    side_effects  jsonb not null default '[]',
    warnings      jsonb not null default '[]',
    min_age       integer,
    interactions  jsonb not null default '[]'
);
create table if not exists symptom_history (
    id            bigint generated always as identity primary key,
    user_id       uuid not null references auth.users(id) on delete cascade,
    query         text not null,
    top_medicine  text,
    results       jsonb not null default '[]',
    created_at    timestamptz not null default now()
);
create table if not exists scan_history (
    id             bigint generated always as identity primary key,
    user_id        uuid not null references auth.users(id) on delete cascade,
    medicine_name  text,
    expiry         text,
    expiry_status  text,
    created_at     timestamptz not null default now()
);
create index if not exists idx_symptom_history_user on symptom_history(user_id, created_at desc);
create index if not exists idx_scan_history_user    on scan_history(user_id, created_at desc);
alter table medicines       enable row level security;
alter table symptom_history enable row level security;
alter table scan_history    enable row level security;
create policy "medicines are publicly readable" on medicines for select using (true);
create policy "users can view own symptom history" on symptom_history for select using (auth.uid() = user_id);
create policy "users can insert own symptom history" on symptom_history for insert with check (auth.uid() = user_id);
create policy "users can delete own symptom history" on symptom_history for delete using (auth.uid() = user_id);
create policy "users can view own scan history" on scan_history for select using (auth.uid() = user_id);
create policy "users can insert own scan history" on scan_history for insert with check (auth.uid() = user_id);
create policy "users can delete own scan history" on scan_history for delete using (auth.uid() = user_id);
```

3. Enable **Authentication → Providers → Google** for Google sign-in
4. Set **Authentication → URL Configuration → Site URL** to `http://localhost:5173`
5. Add `http://localhost:5173/auth/callback` to redirect URLs
6. Turn off **Authentication → Configuration → Email → Enable email confirmations** for easier local testing

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python train_model.py        # seed data only; add webmd.csv for full model
```

Create `backend/.env`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend && npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

```bash
npm run dev
```

## Deploying

### Backend → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo → select `MedScan`
2. Set **Root Directory** to `backend`
3. Railway reads `nixpacks.toml` automatically — no other build config needed
4. Add environment variables:
   - `SUPABASE_URL` = your Supabase project URL
   - `SUPABASE_SERVICE_KEY` = your service role key (Settings → API)
   - `CORS_ORIGINS` = your Netlify URL (add after step below)
5. Deploy and copy the Railway URL (e.g. `https://medscan-backend.up.railway.app`)

### Frontend → Netlify

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from Git → select `MedScan`
2. Netlify reads `netlify.toml` automatically — build settings are pre-configured
3. Add environment variables:
   - `VITE_API_URL` = your Railway URL from above
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key (Settings → API)
4. Deploy and copy your Netlify URL (e.g. `https://medscan.netlify.app`)

### After both are live

In Railway → Variables → update `CORS_ORIGINS` to your Netlify URL.

In Supabase → Authentication → URL Configuration:
- Site URL: your Netlify URL
- Redirect URLs: add `https://your-netlify-url.netlify.app/auth/callback`

In Google Cloud Console → APIs & Services → Credentials → your OAuth client:
- Add your Netlify URL to authorized origins
- Add `https://your-netlify-url.netlify.app/auth/callback` to authorized redirect URIs — wait, this actually goes through Supabase, so the redirect URI stays `https://qvtkcxcuafhwvdaaqrzw.supabase.co/auth/v1/callback` (already set)

## API reference

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| GET | `/` | No | Health check — model status, medicine count |
| POST | `/symptoms` | Yes | `{"text": "..."}` → top-3 medicine matches |
| POST | `/scan` | Yes | Image upload → name, ingredient match, expiry |
| POST | `/check` | No | `{"medicine", "age", "other_medicines"}` → safety |
| GET | `/medicines` | No | Full knowledge base |
| GET | `/medicines/{name}` | No | One medicine's details |
| GET | `/history` | Yes | Caller's private history |

## Limitations

- Not medical advice — decision support only, not diagnosis
- OCR quality depends on image clarity; blurry or glare-heavy strips may not parse correctly
- Symptom classifier is closed-set — can only return medicines it was trained on
- WebMD dataset is US-focused; OTC oversampling corrects the most common cases but isn't exhaustive

## License

Educational project. Not for clinical or commercial use.