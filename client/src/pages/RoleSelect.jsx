import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelect() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 grid place-items-center p-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-3xl font-bold text-center">Choose how you want to continue</h1>
        <p className="text-slate-400 text-center mt-1">Select your role to proceed</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/municipal-login')}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 p-6 text-left transition"
          >
            <div className="text-emerald-300 text-sm">Municipal</div>
            <div className="mt-1 text-xl font-semibold">Municipal Head</div>
            <div className="mt-2 text-slate-400 text-sm">Login with official municipal credentials</div>
          </button>

          <button
            onClick={() => navigate('/worker-login')}
            className="rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/70 p-6 text-left transition"
          >
            <div className="text-slate-300 text-sm">Worker</div>
            <div className="mt-1 text-xl font-semibold">Worker Login</div>
            <div className="mt-2 text-slate-400 text-sm">Login using your Worker ID</div>
          </button>

          <button
            onClick={() => navigate('/signup?role=citizen')}
            className="rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900/70 p-6 text-left transition"
          >
            <div className="text-slate-300 text-sm">Citizen</div>
            <div className="mt-1 text-xl font-semibold">Create citizen account</div>
            <div className="mt-2 text-slate-400 text-sm">Name, email and password only</div>
          </button>
        </div>

        <div className="text-center mt-6 text-slate-400 text-sm">
          Already have an account? <button className="text-emerald-400 hover:text-emerald-300" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    </div>
  )
}
