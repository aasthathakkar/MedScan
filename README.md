# MedScan

A full-stack medicine advisor that helps you understand a medicine you already have at home — what it treats, whether it's expired, and whether it's safe given your age or other medicines you're taking. Requires a free account; your history is private to you.

> ⚠️ **Educational prototype, not medical advice.** This tool does not diagnose conditions or prescribe medicine. Always consult a qualified doctor or pharmacist before taking any medication.

<!-- Fill these in once deployed / captured -->
**Live demo:** _add your Netlify URL here_
**Screenshots:** _add a couple of screenshots or a short GIF here — this is the single biggest thing a portfolio reviewer looks at first._

---

## The problem it solves

In India, people often self-medicate with medicines they already have at home — without knowing whether it's expired, whether it interacts with something else they're taking, or whether it's even the right medicine for their symptoms. People reach for ChatGPT to answer this, awkwardly and inconsistently. MedScan is purpose-built for it, and stays strictly informational: it explains a medicine you already hold, rather than prescribing one.

## Features

**Scan Medicine** — upload a photo of a medicine strip or box. EasyOCR reads the text, a 3-pass name resolver identifies the medicine, and a regex expiry parser reports whether it's expired, expiring soon, or valid. The resolver falls back from a direct knowledge-base match, to an active-ingredient lookup that resolves unfamiliar brands (Calpol → Paracetamol, Combiflam → Ibuprofen), to the largest OCR text block as a last resort — and it tells the UI which path fired. The expiry parser sanity-checks the year (2015–2040) so common OCR misreads like "7022" are rejected instead of trusted.

**Symptom Checker** — describe symptoms in plain text; a TF-IDF + Logistic Regression model returns the top 3 most likely medicines with confidence scores, plus what each treats, side effects, and warnings. Framed as "commonly used for this — read about it," not as a prescription.

**Safety Checker** — enter a medicine name, your age, and other medicines you're taking; rule-based checks flag age restrictions (e.g. aspirin under 16 → Reye's syndrome risk) and known drug interactions.

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
| Deployment | Render (backend) + Netlify (frontend) |

## ML model

The symptom matcher uses a hybrid training strategy so it fits the actual use case rather than the source data's bias:

- **External data:** the WebMD drug-review dataset (Kaggle). The model keeps the 200 most-reviewed drugs (each with at least 20 reviews) for breadth. *(The CSV is large and tracked via Git LFS — see "Running locally".)*
- **OTC oversampling:** common Indian OTC medicines (Paracetamol, Cetirizine, Omeprazole, etc.) are oversampled 8× so they rank above obscure US prescription drugs for everyday symptoms — so "headache fever" returns Paracetamol, not Naproxen.
- **Architecture:** `TfidfVectorizer` (unigrams + bigrams, up to 50k features) → `LogisticRegression (C=5.0)`.
- **Evaluation on a held-out 20% split** (`evaluate_model.py`):
  - Top-1 accuracy: ~30%
  - **Top-3 accuracy: ~61%** ← the metric that matches the UI, which shows 3 results
  - Macro F1: ~0.20

Smoke-test predictions after training:
```
'headache fever body ache'   → Paracetamol   99.7%
'allergy and sneezing'       → Cetirizine    92.3%
'acidity and heartburn'      → Omeprazole    87.6%
'type 2 diabetes'            → Metformin     72.3%
'loose motion diarrhea'      → Loperamide    98.1%
```

The low top-1 / macro-F1 is expected and honest for a 200-class problem where many conditions map to several valid drugs; top-3 is the number that reflects how the app is actually used. The scores are only meaningful when the real dataset is present — running the evaluator on the built-in seed data prints a warning and produces non-meaningful numbers.

## Ingredient lookup (separate from the ML model)

The scan feature's ingredient resolver is a deliberate, flat lookup table — **not** part of the classifier. The ML model predicts a medicine from symptoms; this table resolves an unknown brand to a known active ingredient when the OCR reads it off a strip. It covers **25 active ingredients and 120+ brand names**, keyed on the ingredient so an unfamiliar brand still resolves as long as its active ingredient is listed. Brand names are effectively infinite (everyone rebrands paracetamol); active ingredients are a finite, tractable set — which is what makes this robust.

## Privacy model

History is private per user via Postgres Row Level Security (RLS). Every row in `symptom_history` and `scan_history` has a `user_id` referencing `auth.users`. RLS policies enforce `auth.uid() = user_id` at the database level — so even a direct API call using the public anon key cannot read another user's rows. The backend uses the service-role key (never exposed to the frontend) only to seed the shared `medicines` table.

## Project structure

```
MedScan/
├── backend/
│   ├── main.py              # FastAPI routes (auth-aware)
│   ├── supabase_db.py       # Supabase data layer (medicines + per-user history)
│   ├── seed_data.py         # Medicine knowledge base — 20 medicines (source of truth)
│   ├── ingredient_data.py   # 25 active ingredients + 120+ brand-name lookup
│   ├── safety.py            # Age limits + interaction rule checks
│   ├── ocr_engine.py        # EasyOCR + 3-pass name resolution + expiry parsing
│   ├── symptom_model.py     # Loads and runs the trained classifier
│   ├── train_model.py       # Hybrid training (WebMD + OTC oversampling)
│   ├── evaluate_model.py    # Held-out accuracy evaluation
│   ├── model.pkl            # Trained classifier (committed — no retrain on deploy)
│   ├── tfidf.pkl            # Fitted vectorizer (committed)
│   ├── webmd.csv            # WebMD dataset (Git LFS pointer; large file)
│   ├── nixpacks.toml        # Pins Python 3.12 (torch compatibility) — Railway path
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/Supabase.js  # Supabase client + auth helpers
│   │   ├── pages/           # Auth, AuthCallback, Home, Symptoms, Scan, Check, Medicines, History
│   │   ├── components/      # Nav (with user + sign out), UI components
│   │   └── api/client.js    # API calls + Bearer-token attachment (+ mock layer for offline dev)
│   ├── netlify.toml         # Build config + SPA redirect rule
│   └── package.json
├── railway.json             # Legacy Railway deploy config (see Deploying)
└── README.md
```

## Running locally

### Prerequisites
- Python 3.12
- Node 18+
- A free [Supabase](https://supabase.com) project

### Supabase setup (one-time)

1. Create a project at supabase.com.
2. In **SQL Editor → New query**, run:

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
create policy "medicines are publicly readable"      on medicines       for select using (true);
create policy "users can view own symptom history"   on symptom_history for select using (auth.uid() = user_id);
create policy "users can insert own symptom history"  on symptom_history for insert with check (auth.uid() = user_id);
create policy "users can delete own symptom history"  on symptom_history for delete using (auth.uid() = user_id);
create policy "users can view own scan history"      on scan_history    for select using (auth.uid() = user_id);
create policy "users can insert own scan history"     on scan_history    for insert with check (auth.uid() = user_id);
create policy "users can delete own scan history"     on scan_history    for delete using (auth.uid() = user_id);
```

3. Enable **Authentication → Providers → Google** for Google sign-in.
4. **Authentication → URL Configuration → Site URL** → `http://localhost:5173`.
5. Add `http://localhost:5173/auth/callback` to the redirect URLs.
6. For easier local testing, turn off **Authentication → Email → Confirm email**.

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<your service-role key>
```

The model pickles are committed, so the app runs as-is. To retrain:
```bash
python train_model.py        # uses the built-in seed data unless webmd.csv is present
```
For the full model, place the WebMD dataset at `backend/webmd.csv` first. It's tracked with Git LFS — run `git lfs install && git lfs pull` after cloning, or download the CSV from Kaggle.

Start the API:
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
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon public key>
```

```bash
npm run dev
```

> If `VITE_API_URL` is unset in dev, the frontend falls back to a built-in mock layer (`api/mock.js`), so you can click through the UI without the backend running.

## Deploying

Target stack: **Render (backend) + Netlify (frontend).**

### Backend → Render

1. [render.com](https://render.com) → **New → Web Service** → connect the `MedScan` repo.
2. **Root Directory:** `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Python version:** EasyOCR pulls in PyTorch, which needs Python 3.12 — set a `PYTHON_VERSION=3.12.x` environment variable (or add a `runtime.txt` with `python-3.12.x`).
6. Environment variables:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_KEY` — your service-role key (Supabase → Settings → API)
   - `CORS_ORIGINS` — your Netlify URL (add after the frontend is live)
7. Deploy, then copy the Render URL (e.g. `https://medscan-backend.onrender.com`).

> **Note on size / cold starts:** EasyOCR + PyTorch make the backend image large, and free-tier instances sleep when idle, so the first scan after a cold start can be slow. This is a fine, honest thing to mention in an interview.

### Frontend → Netlify

1. [netlify.com](https://netlify.com) → **Add new site → Import from Git** → select `MedScan`.
2. Netlify reads `netlify.toml` automatically — base `frontend`, build `npm run build`, publish `dist`, with an SPA redirect already configured.
3. Environment variables:
   - `VITE_API_URL` — your Render URL from above
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your anon public key
4. Deploy, then copy your Netlify URL (e.g. `https://medscan.netlify.app`).

### After both are live

- **Render → Environment:** set `CORS_ORIGINS` to your Netlify URL.
- **Supabase → Authentication → URL Configuration:** set **Site URL** to your Netlify URL and add `https://<your-netlify-url>/auth/callback` to the redirect URLs.
- **Google OAuth:** the OAuth redirect goes through Supabase, so the authorized redirect URI stays `https://<your-project-ref>.supabase.co/auth/v1/callback`. In Google Cloud Console → Credentials, add your Netlify URL to the authorized JavaScript origins.

> A `railway.json` and `backend/nixpacks.toml` remain in the repo as an alternative Railway deployment path. If you deploy on Render only, they can be removed.

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET  | `/`                 | No  | Health check — model status, medicine count |
| POST | `/symptoms`         | Yes | `{"text": "..."}` → top-3 medicine matches |
| POST | `/scan`             | Yes | Image upload → name, ingredient match, expiry |
| POST | `/check`            | No  | `{"medicine", "age", "other_medicines"}` → safety |
| GET  | `/medicines`        | No  | Full knowledge base |
| GET  | `/medicines/{name}` | No  | One medicine's details |
| GET  | `/history`          | Yes | The caller's private history |

Authenticated routes expect a Supabase access token: `Authorization: Bearer <token>`.

## Limitations

- Not medical advice — decision support only, not diagnosis or prescription.
- OCR quality depends on image clarity; blurry or glare-heavy strips may not parse correctly.
- The symptom classifier is closed-set — it can only return medicines it was trained on.
- The WebMD dataset is US-focused; OTC oversampling corrects the most common cases but isn't exhaustive.

## Roadmap (v2)

- Ship as an installable PWA (works on iOS and Android, no app store), then optionally wrap with Capacitor for store builds.
- Expand the ingredient knowledge base beyond the current 25 actives.
- Optional "medicines I own" cabinet, now that per-user storage exists.

## License

Educational project. Not for clinical or commercial use.
