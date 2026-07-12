import { useState, useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import axios from "axios"
import { API_BASE } from "./lib/apiBase"

// Layouts
import PublicLayout from "./layouts/PublicLayout"
import AdminLayout from "./layouts/AdminLayout"

// Public / Guest Pages
import Home from "./pages/Home"
import Apply from "./pages/Apply"
import TrackStatus from "./pages/TrackStatus"
import Departments from "./pages/Departments"
import Contact from "./pages/Contact"

// Admin Pages
import AdminLogin from "./pages/AdminLogin"
import AdminDashboard from "./pages/AdminDashboard"
import ApplicationsList from "./pages/ApplicationsList"
import StudentDatabase from "./pages/StudentDatabase"
import Reports from "./pages/Reports"

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking') // checking, ok, error
  const [errorDetails, setErrorDetails] = useState('')

  useEffect(() => {
    // Hide initial static loading screen once React executes this effect
    const loadingScreen = document.getElementById("loading-screen")
    if (loadingScreen) {
      loadingScreen.style.opacity = "0"
      loadingScreen.style.transition = "opacity 0.4s ease-out"
      loadingScreen.style.pointerEvents = "none"
      setTimeout(() => {
        if (loadingScreen.parentNode) {
          loadingScreen.remove()
        }
      }, 400)
    }

    // Check backend health
    const checkBackend = async () => {
      try {
        await axios.get(`${API_BASE}/health`, { timeout: 5000 })
        setBackendStatus('ok')
      } catch (error) {
        console.error("Backend health check failed:", error)
        setErrorDetails(error.message)
        setBackendStatus('error')
      }
    }

    checkBackend()
  }, [])

  return (
    <BrowserRouter>
      {backendStatus === 'error' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#ef4444', color: 'white', padding: '10px', textAlign: 'center', zIndex: 9999, fontFamily: 'sans-serif', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px' }}>
          <span>⚠️ Backend is unreachable. Some features may not work.</span>
          <button onClick={() => window.location.reload()} style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Retry Connection</button>
        </div>
      )}
      {backendStatus === 'checking' && (
        <div style={{ position: 'fixed', top: '10px', right: '10px', background: 'rgba(59, 130, 246, 0.9)', color: 'white', padding: '8px 16px', borderRadius: '20px', zIndex: 9999, fontFamily: 'sans-serif', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Checking backend...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <Routes>
        {/* Public Routes wrapped in PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/track" element={<TrackStatus />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Standalone Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes wrapped in AdminLayout */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<ApplicationsList />} />
          <Route path="/admin/students" element={<StudentDatabase />} />
          <Route path="/admin/reports" element={<Reports />} />
        </Route>

        {/* Redirections / Fallback */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
