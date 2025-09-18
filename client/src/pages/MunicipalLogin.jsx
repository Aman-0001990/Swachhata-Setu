import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MunicipalLogin() {
  const { municipalLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await municipalLogin(email, password)
      if (role === 'municipal') navigate('/municipal', { replace: true })
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 grid place-items-center px-4 py-10">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 shadow-xl shadow-emerald-500/5">
        <div className="mb-6 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 2.25c5.385 0 9.75 3.876 9.75 8.625 0 2.268-1.09 4.318-2.853 5.773-.236.195-.384.483-.384.789v1.714a1.875 1.875 0 01-2.716 1.667l-2.563-1.293a1.125 1.125 0 00-.5-.12h-.5c-5.385 0-9.75-3.876-9.75-8.625S6.615 2.25 12 2.25z"/></svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Municipal Head Login</h1>
          <p className="mt-1 text-sm text-slate-400">Only the designated head can access</p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
        <input
          type="email"
          placeholder="head@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
    
        <label className="block text-sm font-medium text-slate-300 mb-1 mt-2">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2.5 transition"
        >
          {loading ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
