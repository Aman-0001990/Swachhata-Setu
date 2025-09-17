import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    async function bootstrap() {
      if (!token) return setLoading(false)
      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data.data)
      } catch (e) {
        // invalid token
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [token])

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password })
    if (data?.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      // load profile
      const me = await api.get('/api/auth/me')
      setUser(me.data.data)
      return { role: data.role }
    }
    throw new Error('Login failed')
  }

  const municipalLogin = async (email, password) => {
    const { data } = await api.post('/api/auth/municipal-login', { email, password })
    if (data?.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      const me = await api.get('/api/auth/me')
      setUser(me.data.data)
      return { role: data.role || 'municipal' }
    }
    throw new Error('Login failed')
  }

  const workerLogin = async (workerId, email, password) => {
    const { data } = await api.post('/api/auth/worker-login', { workerId, email, password })
    if (data?.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      const me = await api.get('/api/auth/me')
      setUser(me.data.data)
      return { role: data.role || 'worker' }
    }
    throw new Error('Login failed')
  }

  const signup = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload)
    if (data?.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      const me = await api.get('/api/auth/me')
      setUser(me.data.data)
    } else {
      throw new Error('Signup failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ user, token, loading, login, municipalLogin, workerLogin, signup, logout }), [user, token, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
