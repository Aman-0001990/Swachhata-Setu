import React from 'react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* Left: Illustration / pitch */}
      <div className="hidden md:flex flex-col relative overflow-hidden">
        <div className="relative z-10 p-10 h-full flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-300">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 2.25c5.385 0 9.75 3.876 9.75 8.625 0 2.268-1.09 4.318-2.853 5.773-.236.195-.384.483-.384.789v1.714a1.875 1.875 0 01-2.716 1.667l-2.563-1.293a1.125 1.125 0 00-.5-.12h-.5c-5.385 0-9.75-3.876-9.75-8.625S6.615 2.25 12 2.25z"/></svg>
              </span>
              <span className="font-semibold">Waste Management System</span>
            </div>

            <h2 className="mt-10 text-4xl font-bold leading-tight">Cleaner cities start with smarter reporting.</h2>
            <p className="mt-3 text-slate-400 max-w-lg">Report garbage, track collections, manage workers, and convert waste to value — all in one place.</p>
          </div>

          <div className="mt-10 text-sm text-slate-400">
            <p>Don’t have an account? <Link to="/signup" className="text-emerald-400 hover:text-emerald-300">Create one</Link></p>
          </div>
        </div>
      </div>

      {/* Right: Auth card */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 shadow-xl shadow-emerald-500/5">
            <div className="mb-6 text-center">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 2.25c5.385 0 9.75 3.876 9.75 8.625 0 2.268-1.09 4.318-2.853 5.773-.236.195-.384.483-.384.789v1.714a1.875 1.875 0 01-2.716 1.667l-2.563-1.293a1.125 1.125 0 00-.5-.12h-.5c-5.385 0-9.75-3.876-9.75-8.625S6.615 2.25 12 2.25z"/></svg>
              </div>
              <h1 className="mt-3 text-2xl font-bold">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
            </div>

            {children}

            {footer && (
              <div className="mt-4 text-xs text-slate-400 text-center">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
