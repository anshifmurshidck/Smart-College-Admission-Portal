// Use the Vite proxy in local development so the frontend and OCR backend run
// from the same project. Set VITE_API_URL only for a deployed environment.
export const API_BASE = import.meta.env.VITE_API_URL || '/api';
