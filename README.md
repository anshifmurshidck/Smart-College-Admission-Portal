# Smart College Admission Portal

The **Smart College Admission Portal** (Thought Minds Engineering College) is a comprehensive full-stack web application designed to streamline the college admission process. It provides an intuitive interface for students to submit applications and for administrators to manage and track those applications.

## Key Features

- **Student Application Submission**: Secure portal for students to apply to various engineering departments (CSE, AIML, ECE, ME, CE).
- **Admin Dashboard**: Comprehensive dashboard for administrators to review, approve, or reject student applications.
- **Document Management**: Upload and manage necessary admission documents (10th/12th marksheets, ID proofs).
- **Status Tracking**: Real-time tracking of application status with history logs.
- **Department & Student Management**: Manage department details, track enrolled students, and generate reports.

## Technology Stack

- **Frontend**: React.js, Vite, Framer Motion (for animations), Lucide React (icons), React Router.
- **Backend**: Python, Flask REST API.
- **Database**: MySQL (with SQLite fallback for local development).
- **Storage/Cloud**: Supabase integration for cloud storage.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.8+
- MySQL (Optional, SQLite is used as a fallback)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Smart-College-Admission-Portal
   ```

2. **Install Frontend Dependencies:**
   ```bash
   npm install
   ```

3. **Set up Backend Environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

4. **Run the Application (Development Mode):**
   ```bash
   npm run dev
   ```
   This single command concurrently starts both the Vite frontend development server and the Flask backend server.

## API Endpoints
- The Frontend runs by default on `http://localhost:5173`
- The Backend API runs on `http://localhost:5000/api`
  - Health check endpoint: `http://localhost:5000/api/health`

---
*Note: This project was bootstrapped with Vite and React.*
