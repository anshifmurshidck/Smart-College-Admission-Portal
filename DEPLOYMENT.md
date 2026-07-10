# Deployment Guide

This app is a single repo with two independently deployed services:

- **Frontend** (`frontend/`) → **Vercel**
- **Backend** (`backend/`) → **Render**

You do **not** need to split the repo. Each platform points at the same GitHub repo with a different root directory.

```
GitHub repo
├── frontend/  ──►  Vercel   (static React build)
└── backend/   ──►  Render   (Flask API via gunicorn)
```

Recommended order: **deploy the backend first** (to get its public URL), then deploy the frontend with that URL.

---

## 0. Prerequisites

- A **GitHub** account with this project pushed to a repository.
- A **Render** account (https://render.com).
- A **Vercel** account (https://vercel.com).
- Your **Supabase** project URL + anon key (already used locally).
- *(Optional)* A **Google Gemini** API key for the AI chatbots (https://aistudio.google.com/app/apikey).

### Push the code to GitHub (if not already)

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

> `.env` files and `venv/` are gitignored and will not be pushed. You will set secrets in the Render/Vercel dashboards instead.

---

## 1. Deploy the Backend to Render

The repo already includes [`render.yaml`](render.yaml), so you can use Render's Blueprint flow (recommended) or configure a Web Service manually.

### Option A — Blueprint (uses render.yaml)

1. Go to the Render Dashboard → **New +** → **Blueprint**.
2. Connect your GitHub account and select this repository.
3. Render reads `render.yaml` and proposes a web service named **tmec-backend** with:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`
4. Click **Apply**. Render will create the service and start the first build.

### Option B — Manual Web Service

1. Render Dashboard → **New +** → **Web Service** → connect the repo.
2. Set:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Instance Type**: Free (or higher)

### Environment variables (Render → your service → Environment)

Set these (do not commit secrets):

| Key | Value | Notes |
| :--- | :--- | :--- |
| `JWT_SECRET` | a long random string | Changing it later logs everyone out. |
| `ADMIN_USERNAME` | e.g. `admin` | Admin login username. |
| `ADMIN_PASSWORD` | a strong password | Change from the default `admin123`. |
| `GEMINI_API_KEY` | your Gemini key | Optional; without it chatbots use the local fallback. |
| `FALLBACK_SQLITE` | `true` | Uses SQLite unless you configure MySQL. |
| `DATA_DIR` | `/tmp` | Render's disk is ephemeral; keeps SQLite/uploads writable. |
| `VITE_SUPABASE_URL` | your Supabase URL | Used for startup data sync. |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key | Used for startup data sync. |
| `SUPABASE_URL` | your Supabase URL | Used to build document links. |
| `SUPABASE_BUCKET` | `documents` | Supabase Storage bucket name. |

3. Save. Render redeploys automatically.
4. When live, copy the service URL, e.g. `https://tmec-backend.onrender.com`.
5. Verify: open `https://tmec-backend.onrender.com/api/health` — you should see a JSON `{"status": "healthy", ...}`.

> **Note on data:** Render's filesystem is ephemeral, so the SQLite database and any locally uploaded files reset on each redeploy. Application data and uploaded documents live in **Supabase**, so this only affects the backend's own tables (admin/JWT). For persistent backend tables, provision a managed database (e.g. Render PostgreSQL or an external MySQL) and set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

> **Free tier cold starts:** Free Render services sleep after inactivity; the first request may take ~30–60s to wake.

---

## 2. Deploy the Frontend to Vercel

1. Go to the Vercel Dashboard → **Add New…** → **Project** → import this repository.
2. Configure the project:
   - **Root Directory**: `frontend`  ← important
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
3. Add **Environment Variables** (Project → Settings → Environment Variables):

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://tmec-backend.onrender.com/api` (your Render URL **+ `/api`**) |
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your Supabase anon key |

> `VITE_API_URL` **must include the `/api` suffix**, because the frontend calls paths like `${VITE_API_URL}/auth/login`.

4. Click **Deploy**. Vercel builds and serves the app, e.g. `https://your-app.vercel.app`.
5. The included `frontend/vercel.json` provides the SPA rewrite so client-side routes (e.g. `/admin/dashboard`) load correctly on refresh.

> Environment variables in Vite are baked in at **build time**. If you change `VITE_API_URL` later, trigger a **redeploy** for it to take effect.

---

## 3. Connect the two + verify

1. Ensure `VITE_API_URL` on Vercel points at the live Render backend (with `/api`).
2. Open your Vercel URL and test:
   - Home page loads; the chatbot drawer opens.
   - Go to `/admin/login` and log in with your `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
   - The dashboard, Applications, and Student Database load data (calls hit the Render backend).
3. CORS is already open on the backend (`origins: "*"` for `/api/*`), so cross-domain Vercel → Render calls work out of the box.

---

## 4. Updating a deployment

Both platforms auto-deploy on push to the connected branch:

```bash
git add .
git commit -m "Your change"
git push origin main
```

- Vercel rebuilds the frontend.
- Render rebuilds the backend.

If you changed `VITE_API_URL` (or any `VITE_*` var), redeploy the frontend so the new value is baked into the build.

---

## 5. Troubleshooting

| Symptom | Cause / Fix |
| :--- | :--- |
| Frontend loads but API calls fail (Network/CORS) | `VITE_API_URL` missing/wrong, or missing `/api` suffix. Fix the env var and redeploy Vercel. |
| `401` on every admin call after changing `JWT_SECRET` | Old tokens are invalid. Log out and log in again. |
| Admin login fails | Check `ADMIN_USERNAME` / `ADMIN_PASSWORD` on Render; confirm `/api/health` is reachable. |
| Chatbot says the AI key isn't configured | Set `GEMINI_API_KEY` on Render and redeploy. Without it, chatbots use the local fallback. |
| Backend data resets after redeploy | Expected on Render's ephemeral disk. Use a managed DB for persistence (see note in Step 1). |
| First request very slow | Render free tier cold start. Upgrade the instance or accept the wake-up delay. |

---

© 2026 Thought Minds Engineering College (TMEC).
