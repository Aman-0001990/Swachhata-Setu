import axios from 'axios'

// Use VITE_API_BASE if provided (e.g., https://api.example.com). Otherwise, same-origin ('').
// All callers use paths like '/api/...', which will resolve to:
//   - `${VITE_API_BASE}/api/...` when set, or
//   - '/api/...' under the same origin when not set.
const rawBase = import.meta.env?.VITE_API_BASE || ''
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
    // Optionally handle 401 to logout, etc.
    return Promise.reject(err)
  }
)

export default api
