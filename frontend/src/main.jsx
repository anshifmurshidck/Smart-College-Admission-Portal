import React from "react"
import ReactDOM from "react-dom/client"
import axios from "axios"
import App from "./App.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import "./index.css"

// Global Axios Response Interceptor to handle expired/invalid tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("adminToken")
      localStorage.removeItem("adminData")
      window.location.href = "/admin/login"
    }
    return Promise.reject(error)
  }
)

// Get root element
const rootElement = document.getElementById("root")
const loadingScreen = document.getElementById("loading-screen")

if (!rootElement) {
  console.error("Root element not found!")
  if (loadingScreen) {
    loadingScreen.innerHTML = '<div style="color: #ef4444; text-align: center;"><h1>Critical Error</h1><p>Root element missing</p></div>'
  }
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    )
  } catch (error) {
    console.error("React rendering error:", error)
    if (loadingScreen) {
      loadingScreen.innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;"><h1>App Load Error</h1><p>${error.message}</p></div>`
      loadingScreen.style.opacity = "1"
    }
  }
}
