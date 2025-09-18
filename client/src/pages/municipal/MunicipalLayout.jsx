import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MunicipalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const linkBase = 'rounded-lg px-3 py-2 text-sm font-semibold border border-white/10'
  const active = ({ isActive }) => isActive ? `${linkBase} bg-emerald-500 text-slate-900 border-emerald-400` : `${linkBase} bg-slate-900/60 text-slate-200 hover:bg-slate-900` 

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <header className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Municipal Head</h1>
        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-slate-400">{user?.name}</span>
          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={() => { logout(); navigate('/'); }}>Logout</button>
        </div>
      </header>

      <nav className="max-w-7xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
        <NavLink to="/municipal/complaints" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/></svg>
            Complaints
          </span>
        </NavLink>
        <NavLink to="/municipal/tasks" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>
            Create Task
          </span>
        </NavLink>
        <NavLink to="/municipal/workers/new" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm-7 9a7 7 0 0 1 14 0z"/></svg>
            Create Worker
          </span>
        </NavLink>
        <NavLink to="/municipal/workers" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2a5 5 0 0 0-5 5v1h6v-1a6.9 6.9 0 0 1 2-4.9A7 7 0 0 0 8 13zm8 1a6 6 0 0 0-6 6v1h12v-1a6 6 0 0 0-6-6z"/></svg>
            Worker List
          </span>
        </NavLink>
        <NavLink to="/municipal/tracker" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3zm0 6h12v2H3zm0 6h18v2H3z"/></svg>
            Tracker
          </span>
        </NavLink>
        <NavLink to="/municipal/history" end className={active}>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3zm1 8V7h-2v6h6v-2h-4z"/></svg>
            History
          </span>
        </NavLink>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
