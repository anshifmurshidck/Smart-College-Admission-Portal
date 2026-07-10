# Smart College Admission Portal (TMEC)

![Smart College Admission Portal](https://img.shields.io/badge/Status-Active-success.svg) ![License](https://img.shields.io/badge/License-MIT-blue.svg) ![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg?logo=react) ![Python](https://img.shields.io/badge/Backend-Flask-3776AB.svg?logo=python)

The **Smart College Admission Portal** (Thought Minds Engineering College - TMEC) is a comprehensive, full-stack web application designed to streamline the college admission process. It provides an intuitive, highly responsive interface for students to submit applications and a secure, powerful dashboard for administrators to manage, track, and analyze those applications.

The platform includes modern UX principles, seamless animations, local/cloud database synchronization, and an AI-powered Database Assistant (via Google Gemini) for administrators.

---

## 🌟 Key Features

### 🎓 For Students
- **Digital Application Submission**: Securely apply to various engineering departments (CSE, AIML, ECE, ME, CE).
- **Document Uploads**: Directly upload necessary admission documents (10th/12th mark sheets, Aadhaar, ID proofs) with progress tracking.
- **Real-Time Status Tracking**: Check application status (Pending, Under Review, Approved, Rejected) and read reviewer comments using an Application ID and Date of Birth.
- **Interactive UI**: Fluid animations using Framer Motion, micro-interactions, and a premium "Glassmorphism" dark aesthetic.

### 🛡️ For Administrators
- **Comprehensive Dashboard**: View application pipelines, recent activities, and high-level college metrics (enrollment rates, average academic scores).
- **Application Review System**: Approve or reject applications, leave feedback for students, and automatically generate Student IDs upon approval.
- **Student Database**: A unified view of all enrolled students, with filtering, searching, and pagination capabilities.
- **AI-Powered Database Chatbot**: Integrated AI assistant that parses natural language queries (e.g., *"How many students in CSE?"* or *"Show details for vasu@gmail.com"*) using the Gemini API to instantly query the local database.
- **CSV Reports Generation**: Export student and application data directly to CSV for external processing.

---

## 🛠️ Technology Stack

**Frontend:**
- [React.js 19](https://react.dev/) & [Vite 8](https://vitejs.dev/) - Lightning fast development and optimized production builds.
- [React Router v7](https://reactrouter.com/) - Application routing.
- [Framer Motion](https://www.framer.com/motion/) - Smooth page transitions and element animations.
- [Lucide React](https://lucide.dev/) - Modern iconography.
- [Axios](https://axios-http.com/) - API requests.

**Backend:**
- [Python 3.8+](https://www.python.org/) & [Flask](https://flask.palletsprojects.com/) - Lightweight and scalable REST API.
- [MySQL](https://www.mysql.com/) / SQLite - Primary database engine with an automatic fallback to SQLite for immediate local development.
- [Google Gemini API](https://deepmind.google/technologies/gemini/) - Powers the intelligent administrative chatbot.

**Cloud/Storage:**
- [Supabase](https://supabase.com/) - Cloud sync and secure file object storage.

**Deployment:**
- [Vercel](https://vercel.com/) - Hosts the React frontend.
- [Render](https://render.com/) - Hosts the Flask backend (via `gunicorn`).

---

## 📁 Project Structure

```text
Smart-College-Admission-Portal/
├── frontend/                 # React + Vite application (deploys to Vercel)
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Chatbot, Modals)
│   │   ├── layouts/          # Page layouts (Public Layout, Admin Layout)
│   │   ├── pages/            # Route views (Home, Apply, AdminDashboard, etc.)
│   │   ├── lib/              # External clients (Supabase client config)
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global design tokens and Glassmorphism CSS styles
│   ├── public/               # Static assets (Logos, icons)
│   ├── tests/                # Standalone JS test/debug scripts
│   ├── package.json          # NPM scripts and dependencies
│   ├── vite.config.js        # Vite bundler and dev proxy configuration
│   ├── vercel.json           # SPA rewrite config for Vercel
│   └── .env                  # Frontend env (VITE_SUPABASE_*, VITE_API_URL)
├── backend/                  # Flask REST API (deploys to Render)
│   ├── routes/               # API endpoint modules (auth, admissions, chatbot, admin)
│   ├── middlewares/          # JWT auth decorator
│   ├── tests/                # Python test/debug scripts
│   ├── db.py                 # Database manager (MySQL/SQLite fallback logic)
│   ├── config.py             # Configuration + env loading
│   ├── app.py                # Flask application factory (exposes `app`)
│   ├── run.py                # Local dev runner (python run.py)
│   ├── requirements.txt      # Python dependencies (incl. gunicorn)
│   └── .env                  # Backend environment variables
└── render.yaml               # Render deployment config for the backend
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher). On macOS/Linux the command is usually `python3`.
- *(Optional)* MySQL Server if you prefer not to use the SQLite fallback.

### 2. Installation

Clone the repository to your local machine:
```bash
git clone https://github.com/your-username/Smart-College-Admission-Portal.git
cd Smart-College-Admission-Portal
```

Install frontend dependencies:
```bash
cd frontend
npm install
```

Set up the Python backend environment (from a **separate** shell, or before starting the frontend):
```bash
cd backend

# Create a virtual environment
# macOS/Linux:
python3 -m venv venv
# Windows:
python -m venv venv

# Activate the virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

> The frontend's `npm run dev` launches the backend using `backend/venv`, so this
> virtual environment must exist and have the dependencies installed first.

### 3. Environment Variables

You need to configure both the frontend and backend environment variables.

**Frontend (`frontend/.env`):**
```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
# Optional: point the frontend at a remote backend (e.g. Render). Leave unset
# locally to use the Vite dev proxy to http://127.0.0.1:5001.
# VITE_API_URL=https://your-backend.onrender.com/api
```

**Backend (`backend/.env`):** copy `backend/.env.example` and fill in values. All keys have sensible defaults, so this file is optional for a first local run.
```env
JWT_SECRET=your_secure_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tmec_admission
UPLOAD_FOLDER=uploads
PORT=5001
FALLBACK_SQLITE=true
GEMINI_API_KEY=your_gemini_api_key  # Required for the AI Chatbot feature
```

### 4. Running the Application

**One command runs the whole stack.** The `frontend` uses `concurrently` to launch both
the Vite dev server and the Flask backend (from `../backend`) in a single terminal:
```bash
cd frontend
npm run dev
```

- `[web]` **Vite Frontend** → `http://localhost:5173`
- `[api]` **Flask Backend** → `http://localhost:5001` (port 5000 is reserved by macOS AirPlay Receiver). API requests are proxied from the frontend to the backend during development.
- `Ctrl+C` stops both processes.

**Default admin login:** username `admin`, password `admin123` (override via `backend/.env`).

> The backend runs with the Flask auto-reloader disabled, so after changing backend
> Python code, restart with `Ctrl+C` then `npm run dev` again.

Prefer separate terminals? That works too (useful for restarting one side independently):
```bash
# Terminal 1 - backend
cd backend && source venv/bin/activate && python run.py

# Terminal 2 - frontend
cd frontend && npm run dev
```

---

## 🔌 API Reference (Selected Endpoints)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates an admin and returns a JWT token. |
| `GET`  | `/api/departments` | Lists available engineering departments. |
| `POST` | `/api/admissions/apply` | Submits a new student application. |
| `POST` | `/api/admissions/verify-ocr` | Runs OCR verification on an uploaded mark sheet. |
| `GET`  | `/api/admissions/track/<app_id>` | Retrieves an application's status by Application ID. |
| `GET`  | `/api/admin/dashboard-stats` | Dashboard metrics and pipeline stats (Protected). |
| `GET`  | `/api/admin/applications` | Retrieves a filtered list of applications (Protected). |
| `POST` | `/api/admin/applications/<app_id>/status` | Approve/reject an application (Protected). |
| `GET`  | `/api/admin/students` | Lists enrolled students with filtering (Protected). |
| `POST` | `/api/admin/chat` | Admin AI Database Assistant, natural language querying (Protected). |
| `POST` | `/api/chatbot/chat` | Public admissions assistant for the home page chatbot (Gemini + local fallback). |
| `GET`  | `/api/health` | Backend health check and database status monitor. |

---

## 👨‍💻 Development Notes

- **Database Fallback:** By default, `backend/db.py` attempts to connect to a MySQL instance. If it fails (e.g., MySQL is not installed or running), it automatically falls back to an SQLite file-based database (`backend/tmec_portal.db`) for seamless local development.
- **Authentication:** Admin routes are secured using JWT tokens passed in the `Authorization: Bearer <token>` header. The frontend manages these tokens via an Axios interceptor in `main.jsx` and LocalStorage.
- **Password hashing:** Passwords are hashed with `pbkdf2:sha256` (Werkzeug). This is used instead of the newer `scrypt` default because `scrypt` is unavailable on Python builds linked against LibreSSL (common on macOS).
- **API base URL:** The frontend reads `import.meta.env.VITE_API_URL` (falling back to `/api`). Locally, leave it unset and the Vite dev proxy forwards `/api` to `http://127.0.0.1:5001`. In production, set it to the deployed backend URL.
- **File storage & data:** Student uploads and application records are written directly to **Supabase** from the frontend. The Flask backend uses its own database only for admin/JWT and server-side queries.

---

## 🩹 Troubleshooting

- **`Address already in use` / `Port 5000 is in use`** — On macOS, Control Center (AirPlay Receiver) occupies port 5000. This project uses **5001** for the backend. To free 5000 instead, disable System Settings → General → AirDrop & Handoff → AirPlay Receiver.
- **`zsh: command not found: python`** — macOS ships `python3`, not `python`. Use `python3` to create the venv; once the venv is activated, `python` is available inside it.
- **`AttributeError: module 'hashlib' has no attribute 'scrypt'`** — Caused by LibreSSL-linked Python. Already handled: the app hashes with `pbkdf2:sha256`.
- **Backend code changes not taking effect** — the auto-reloader is off; restart `npm run dev` (`Ctrl+C` then re-run).
- **Chatbot says the key isn't configured** — add `GEMINI_API_KEY` to `backend/.env` and restart.

---

## ☁️ Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full step-by-step guide. Quick summary below.

The app is a single repo with two independently deployable services.

### Frontend → Vercel
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (output `dist/`)
- **Environment Variable:** `VITE_API_URL=https://<your-render-service>.onrender.com/api`
- The `frontend/vercel.json` SPA rewrite serves the React router on all paths.

### Backend → Render
- Uses `render.yaml` (root directory `backend`).
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT`
- Set secrets in the Render dashboard: `JWT_SECRET`, `GEMINI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SUPABASE_URL`.
- Render's filesystem is ephemeral. `DATA_DIR=/tmp` keeps the SQLite fallback and uploads writable, but they reset on redeploy. For persistent data, provision a managed database and set `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`. Application data and uploaded documents are stored in Supabase, so this mainly affects the backend's own tables.

---

© 2026 Thought Minds Engineering College (TMEC) Open Source Team.
