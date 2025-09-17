import axios from 'axios'

const api = axios.create({
  baseURL: '/',
})

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
