import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function WorkerLogin() {
  const { workerLogin } = useAuth()
  const navigate = useNavigate()
  const [workerId, setWorkerId] = useState('')
  const [preview, setPreview] = useState(null)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function fetchWorker() {
      setError('')
      setPreview(null)
      if (!workerId || workerId.length < 4) return
      try {
        const { data } = await api.get(`/api/users/worker/${encodeURIComponent(workerId)}`)
        if (active) setPreview(data.data)
      } catch (e) {
        if (active) setError('Worker not found')
      }
    }
    fetchWorker()
    return () => { active = false }
  }, [workerId])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { role } = await workerLogin(workerId, password)
      if (role === 'worker') navigate('/worker', { replace: true })
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M11.7 2.065a.75.75 0 0 1 .6 0l7.5 3.214a.75.75 0 0 1 0 1.386l-7.5 3.214a.75.75 0 0 1-.6 0L4.2 6.665a.75.75 0 0 1 0-1.386l7.5-3.214Z" /><path fillRule="evenodd" d="M3 8.517a.75.75 0 0 1 1.03-.696l7.97 3.417 7.97-3.417A.75.75 0 0 1 21 8.517V15.75A2.25 2.25 0 0 1 18.75 18h-13.5A2.25 2.25 0 0 1 3 15.75V8.517Zm9 7.983 8.25-3.535v2.785A.75.75 0 0 1 19.5 16.5h-15a.75.75 0 0 1-.75-.75V12.965L12 16.5Z" clipRule="evenodd" /></svg>
          </div>
          <h1 className="mt-3 text-2xl font-bold">Worker Login</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your Worker ID and password</p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-300 mb-1">Worker ID</label>
        <input
          type="text"
          placeholder="WRK-XXXXXX"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value.toUpperCase())}
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 placeholder-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {preview && (
          <div className="mt-2 text-xs text-slate-400">
            <div>Name: <span className="text-slate-200">{preview.name}</span></div>
            <div>Email: <span className="text-slate-200">{preview.email}</span></div>
          </div>
        )}

        <label className="block text-sm font-medium text-slate-300 mb-1 mt-3">Password</label>
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
