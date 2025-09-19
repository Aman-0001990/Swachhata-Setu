import axios from 'axios'

// Use VITE_API_BASE if provided (e.g., https://api.example.com). Otherwise, same-origin ('').
// All callers use paths like '/api/...', which will resolve to:
//   - `${VITE_API_BASE}/api/...` when set, or
//   - '/api/...' under the same origin when not set.
let rawBase = import.meta.env?.VITE_API_BASE || ''

// If not provided at build time, add a safe runtime fallback for common static hosts
// so production does not accidentally call same-origin (Netlify/Vercel) and 404.
if (!rawBase) {
  try {
    const host = typeof window !== 'undefined' ? window.location.hostname : ''
    if (host.endsWith('netlify.app') || host.endsWith('vercel.app')) {
      rawBase = 'https://swachhata-setu.onrender.com'
    }
  } catch (_) {
    // ignore
  }
}

// Normalize to avoid accidental double slashes (e.g., 'https://host//api/...')
const baseURL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

const api = axios.create({ baseURL })

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Basic error logging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Handle 401: clear token and redirect to appropriate login
    if (err?.response?.status === 401) {
      try {
        localStorage.removeItem('token')
      } catch (_) {}
      // Best-effort redirect depending on current path
      try {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname || ''
          if (path.startsWith('/municipal')) {
            window.location.replace('/municipal-login')
          } else if (path.startsWith('/worker')) {
            window.location.replace('/worker-login')
          } else {
            window.location.replace('/login')
          }
        }
      } catch (_) {}
    }
    return Promise.reject(err)
  }
)

export default api
