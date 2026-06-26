import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

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
  return (
    <BrowserRouter>
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
