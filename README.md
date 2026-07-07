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

---

## 📁 Project Structure

```text
Smart-College-Admission-Portal/
├── backend/                  # Flask Backend Application
│   ├── routes/               # API endpoint modules (auth, admissions, chatbot, admin)
│   ├── db.py                 # Database manager (MySQL/SQLite fallback logic)
│   ├── app.py                # Flask application factory
│   └── .env                  # Backend environment variables
├── src/                      # React Frontend Source
│   ├── components/           # Reusable UI components (Navbar, Chatbot, Modals)
│   ├── layouts/              # Page layouts (Public Layout, Admin Layout)
│   ├── pages/                # Route views (Home, Apply, AdminDashboard, etc.)
│   ├── lib/                  # External clients (Supabase client config)
│   ├── main.jsx              # React entry point
│   └── index.css             # Global design tokens and Glassmorphism CSS styles
├── public/                   # Static assets (Logos, icons)
├── package.json              # NPM scripts and dependencies
├── requirements.txt          # Python dependencies
├── run.py                    # Master backend runner script
└── vite.config.js            # Vite bundler and proxy configuration
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- *(Optional)* MySQL Server if you prefer not to use the SQLite fallback.

### 2. Installation

Clone the repository to your local machine:
```bash
git clone https://github.com/your-username/Smart-College-Admission-Portal.git
cd Smart-College-Admission-Portal
```

Install frontend dependencies:
```bash
npm install
```

Set up the Python backend environment:
```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Environment Variables

You need to configure both the frontend and backend environment variables.

**Frontend (`.env` in the root directory):**
```env
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (`backend/.env`):**
```env
JWT_SECRET=your_secure_jwt_secret
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tmec_admission
UPLOAD_FOLDER=uploads
PORT=5000
FALLBACK_SQLITE=true
GEMINI_API_KEY=your_gemini_api_key  # Required for the AI Chatbot feature
```

### 4. Running the Application

This project uses `concurrently` to run both the frontend and backend simultaneously.

From the root directory, simply run:
```bash
npm run dev
```

- The **Vite Frontend** will automatically open in your default browser at `http://localhost:5173`.
- The **Flask Backend** will run on `http://localhost:5000`. API requests are automatically proxied from the frontend to the backend.

> ⚠️ **Windows Terminal Tip:**
> If you click inside the Windows terminal window while the server is running, it may activate "QuickEdit Mode" and visually freeze the backend. If your app ever hangs, click the terminal and press `Enter` or `Esc` to unfreeze it. Avoid pressing `Ctrl+C` to copy text, as it will kill the server.

---

## 🔌 API Reference (Selected Endpoints)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticates an admin and returns a JWT token. |
| `POST` | `/api/admissions/apply` | Submits a new student application. |
| `POST` | `/api/admissions/upload` | Uploads application documents. |
| `GET`  | `/api/admissions/track` | Retrieves application status (requires `id` and `dob`). |
| `GET`  | `/api/admin/applications` | Retrieves a filtered list of applications (Protected). |
| `POST` | `/api/chatbot/chat` | AI Chatbot natural language querying (Protected). |
| `GET`  | `/api/health` | Backend health check and database status monitor. |

---

## 👨‍💻 Development Notes

- **Database Fallback:** By default, the `backend/db.py` script attempts to connect to a MySQL instance. If it fails (e.g., MySQL is not installed or turned on), it automatically falls back to an SQLite file-based database for seamless local development.
- **Authentication:** Admin routes are secured using JWT tokens passed in the `Authorization: Bearer <token>` header. The frontend manages these tokens via an Axios interceptor in `main.jsx` and LocalStorage.

---

© 2026 Thought Minds Engineering College (TMEC) Open Source Team.
