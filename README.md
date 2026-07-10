# Smart College Admission Portal (TMEC)

![Status](https://img.shields.io/badge/Status-Active-success.svg) ![License](https://img.shields.io/badge/License-MIT-blue.svg) ![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg?logo=react) ![Python](https://img.shields.io/badge/Backend-Flask-3776AB.svg?logo=python)

A full-stack web application for Thought Minds Engineering College (TMEC) that streamlines the college admission process. Students submit applications online; administrators manage, review, and analyse them from a secure dashboard with an AI-powered assistant.

---

## Features

### For Students
- **Online Application** — Apply to CSE, AIML, ECE, ME, or CE departments in one digital form.
- **Document Uploads** — Upload 10th/12th marksheets, Aadhaar, and ID proof directly from the browser.
- **Status Tracking** — Check application status (Pending → Under Review → Approved / Rejected) with an Application ID.
- **AI Chatbot** — Floating assistant answers admission questions and tracks applications in real time.

### For Administrators
- **Dashboard** — Application pipeline, enrollment rates, and academic score metrics.
- **Review System** — Approve / reject applications, add reviewer comments, and auto-generate Student IDs.
- **Student Database** — Search, filter, edit, and paginate through all enrolled students.
- **AI Database Assistant** — Natural-language queries over the student database powered by Google Gemini.
- **Reports** — Export student and application data to CSV.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 19, Vite 8, React Router v7, Framer Motion, Axios |
| Backend | Python 3.9+, Flask, Werkzeug, PyJWT |
| Database | MySQL (primary) with automatic SQLite fallback for local dev |
| Cloud / Storage | Supabase (application data + file storage) |
| AI | Google Gemini 2.5 Flash API |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Project Structure

```
Smart-College-Admission-Portal/
├── frontend/                  # React + Vite (deploys to Vercel)
│   ├── src/
│   │   ├── components/        # Navbar, Chatbot drawer, modals
│   │   ├── layouts/           # PublicLayout, AdminLayout
│   │   ├── lib/               # Supabase client, adminFetch helper
│   │   └── pages/             # Home, Apply, Track, AdminDashboard, etc.
│   ├── public/                # Static assets
│   ├── package.json
│   ├── vite.config.js         # Dev proxy: /api → localhost:5001
│   └── vercel.json            # SPA rewrite for Vercel
│
├── backend/                   # Flask REST API (deploys to Render)
│   ├── routes/                # auth, admissions, admin_api, chatbot, reports
│   ├── middlewares/           # JWT auth decorator
│   ├── app.py                 # Flask application factory
│   ├── run.py                 # Local dev entry point
│   ├── config.py              # Config + env loading
│   ├── db.py                  # MySQL / SQLite database manager
│   ├── requirements.txt       # Python dependencies (includes gunicorn)
│   └── .env.example           # Template for backend environment variables
│
├── render.yaml                # Render deployment config
└── DEPLOYMENT.md              # Full Vercel + Render deployment guide
```

---

## Local Setup

### Prerequisites

| Tool | macOS / Linux | Windows |
| :--- | :--- | :--- |
| Node.js | v18 or higher | v18 or higher |
| Python | `python3` (v3.9+) | `python` (v3.9+) from python.org |
| Git | `git` | Git for Windows |

> MySQL is optional. The backend automatically falls back to SQLite if MySQL is not running.

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-username/Smart-College-Admission-Portal.git
cd Smart-College-Admission-Portal
```

---

### Step 2 — Set up the backend (Python)

#### macOS / Linux

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Windows (Command Prompt or PowerShell)

```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### Step 3 — Set up the frontend (Node)

```bash
cd frontend
npm install
```

---

### Step 4 — Environment variables

**Frontend — `frontend/.env`** (already present in the repo with Supabase keys):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Leave VITE_API_URL unset locally — Vite proxies /api to localhost:5001
```

**Backend — `backend/.env`** (create by copying `.env.example`):

```bash
# macOS / Linux
cp backend/.env.example backend/.env

# Windows
copy backend\.env.example backend\.env
```

Then open `backend/.env` and set at minimum:

```env
JWT_SECRET=any_long_random_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
PORT=5001
FALLBACK_SQLITE=true
GEMINI_API_KEY=           # leave blank to use local keyword fallback
```

> All values have working defaults, so the app runs without a `.env` for a first test.

---

### Step 5 — Run the application

The backend **must be set up first** (Step 2) before running. The dev command launches both the Flask API and the Vite dev server together.

#### macOS / Linux — one terminal

```bash
cd frontend
npm run dev
```

#### Windows — one terminal (Command Prompt or PowerShell)

```bat
cd frontend
npm run dev:win
```

> `npm run dev` uses `sh` which is not available on Windows. Use `npm run dev:win` instead.

#### Any OS — two separate terminals (alternative)

If the single-command approach has any issues, use two terminals:

```bash
# Terminal 1 — Backend
cd backend

# macOS / Linux:
source venv/bin/activate && python run.py

# Windows:
venv\Scripts\activate
python run.py
```

```bash
# Terminal 2 — Frontend
cd frontend
npm run dev      # macOS/Linux
# or
npm run dev:win  # Windows (only runs Vite — backend already started in Terminal 1)
```

---

### What you should see

| Service | URL | Notes |
| :--- | :--- | :--- |
| Frontend | `http://localhost:5173` | Vite dev server |
| Backend API | `http://localhost:5001/api` | Flask |
| Health check | `http://localhost:5001/api/health` | Verify backend is up |

> **Port 5001 instead of 5000?** On macOS, Control Center (AirPlay Receiver) occupies port 5000. This project uses 5001 to avoid the conflict. You can disable AirPlay via System Settings → General → AirDrop & Handoff → AirPlay Receiver if you prefer 5000.

**Default admin login:** `admin` / `admin123`  
*(Override in `backend/.env` with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.)*

> After changing any backend Python file, stop the server (`Ctrl+C`) and restart — the Flask auto-reloader is disabled to prevent double-startup.

---

## API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login, returns JWT. |
| `GET` | `/api/departments` | Public | Lists engineering departments. |
| `POST` | `/api/admissions/apply` | Public | Submit a student application. |
| `GET` | `/api/admissions/track/<app_id>` | Public | Track application status. |
| `POST` | `/api/chatbot/chat` | Public | Home page AI chatbot (Gemini + fallback). |
| `GET` | `/api/admin/dashboard-stats` | JWT | Dashboard metrics. |
| `GET` | `/api/admin/applications` | JWT | Filtered application list. |
| `POST` | `/api/admin/applications/<id>/status` | JWT | Approve / reject application. |
| `GET` | `/api/admin/students` | JWT | Enrolled student list. |
| `POST` | `/api/admin/chat` | JWT | Admin AI database assistant. |
| `GET` | `/api/health` | Public | Backend health + DB status. |

---

## Development Notes

- **Database fallback** — The backend tries MySQL on startup. If it fails, it automatically switches to a local SQLite file (`backend/tmec_portal.db`). No manual setup needed for local dev.
- **Authentication** — Admin routes require a JWT in `Authorization: Bearer <token>`. The frontend's Axios interceptor and `adminFetch` helper automatically redirect to `/admin/login` when a token expires or becomes invalid.
- **AI chatbots** — Both the home chatbot and the admin assistant call Google Gemini when `GEMINI_API_KEY` is set. Without it, they fall back to a local keyword-based responder — the UI still works fully.
- **Password hashing** — Uses `pbkdf2:sha256` (not `scrypt`) for compatibility with Python builds that use LibreSSL (common on macOS).
- **Supabase** — Student uploads and application records are written to Supabase directly from the browser. The Flask backend syncs approved records into its local DB on startup for admin queries.

---

## Troubleshooting

| Problem | Fix |
| :--- | :--- |
| `npm run dev` fails on Windows | Use `npm run dev:win` instead. |
| `sh: command not found` on Windows | Same as above — `sh` is not available outside Git Bash. Use `npm run dev:win`. |
| `Address already in use` (port 5001) | Another process holds port 5001. Run `netstat -ano \| findstr :5001` (Windows) or `lsof -i :5001` (Mac) to find and stop it. |
| `zsh: command not found: python` | Use `python3` on macOS/Linux. Inside an activated venv, `python` works. |
| `401` loop on admin pages after restart | Your stored JWT was signed with a different `JWT_SECRET`. Log out and log back in. |
| Backend changes not taking effect | The auto-reloader is off. Restart `npm run dev` / `npm run dev:win`. |
| Chatbot says key not configured | Add `GEMINI_API_KEY` to `backend/.env` and restart. Without it, the local fallback is used. |

---

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the complete step-by-step guide for Vercel (frontend) and Render (backend).

**Quick summary:**

| Platform | Root Dir | Build | Start |
| :--- | :--- | :--- | :--- |
| **Vercel** (frontend) | `frontend` | `npm run build` | — (static) |
| **Render** (backend) | `backend` | `pip install -r requirements.txt` | `gunicorn app:app` |

Set `VITE_API_URL=https://your-backend.onrender.com/api` on Vercel so the frontend reaches the Render backend.

---

© 2026 Thought Minds Engineering College (TMEC) Open Source Team.
