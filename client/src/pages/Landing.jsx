import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen animated-bg text-slate-100">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur bg-slate-900/40 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30">♻</span>
            <span className="font-semibold">Swachhata-Setu</span>
          </div>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-slate-300">
            <button className="hover:text-emerald-300" onClick={() => scrollTo('overview')}>Overview</button>
            <button className="hover:text-emerald-300" onClick={() => scrollTo('features')}>Features</button>
            <button className="hover:text-emerald-300" onClick={() => scrollTo('revenue')}>Revenue</button>
            <button className="hover:text-emerald-300" onClick={() => scrollTo('benefits')}>Benefits</button>
            <button className="hover:text-emerald-300" onClick={() => scrollTo('future')}>Future</button>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2 text-sm btn-animated">Login</button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <div className="animate-fade-in">
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              ♻ Waste Management System
            </h1>
            <p className="mt-3 text-slate-300 md:text-lg">
              Connecting Citizens, Workers, and Municipal Heads into one ecosystem for a cleaner, smarter, profitable India.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => navigate('/login')} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-5 py-2.5 btn-animated">🚀 Get Started</button>
              <button onClick={() => scrollTo('overview')} className="rounded-full border border-white/10 px-5 py-2.5 hover:bg-slate-900/50">ℹ Learn More</button>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-elevated animate-fade-in">
              <div className="grid grid-cols-3 gap-4 text-center">
                <button aria-label="Citizen Login" onClick={() => navigate('/login')} className="p-4 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-slate-800/80 transition">
                  <div className="text-2xl">👤</div>
                  <div className="mt-1 text-sm text-slate-300">Citizen</div>
                </button>
                <button aria-label="Worker Login" onClick={() => navigate('/worker-login')} className="p-4 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-slate-800/80 transition">
                  <div className="text-2xl">👷</div>
                  <div className="mt-1 text-sm text-slate-300">Worker</div>
                </button>
                <button aria-label="Municipal Login" onClick={() => navigate('/municipal-login')} className="p-4 rounded-xl bg-slate-800/60 border border-white/10 hover:bg-slate-800/80 transition">
                  <div className="text-2xl">🏛</div>
                  <div className="mt-1 text-sm text-slate-300">Municipal</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section id="overview" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold">🌍 Why This Project?</h2>
        <p className="mt-3 text-slate-300">
          This project solves India’s biggest waste challenge – lack of coordination. With three integrated interfaces (Citizen, Worker, Municipal Head), Swachhata-Setu ensures cleanliness, transparency, and a sustainable waste-to-wealth model.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <button aria-label="Citizen Login" onClick={() => navigate('/login')} className="rounded-xl border border-white/10 p-4 bg-slate-900/60 hover:bg-slate-900/70 transition">👤 Citizen</button>
          <button aria-label="Worker Login" onClick={() => navigate('/worker-login')} className="rounded-xl border border-white/10 p-4 bg-slate-900/60 hover:bg-slate-900/70 transition">👷 Worker</button>
          <button aria-label="Municipal Login" onClick={() => navigate('/municipal-login')} className="rounded-xl border border-white/10 p-4 bg-slate-900/60 hover:bg-slate-900/70 transition">🏛 Municipal Head</button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-900/40 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold">👥 3 Interfaces & Features</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 p-5 bg-slate-900/60 hover:bg-slate-900/70 transition">
              <div className="text-xl">👤 Citizen App</div>
              <ul className="mt-2 text-slate-300 text-sm space-y-1">
                <li>• Report garbage</li>
                <li>• Hire workers</li>
                <li>• Bonuses & penalties</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 p-5 bg-slate-900/60 hover:bg-slate-900/70 transition">
              <div className="text-xl">👷 Worker App</div>
              <ul className="mt-2 text-slate-300 text-sm space-y-1">
                <li>• Scan bins (QR)</li>
                <li>• Reassign tasks</li>
                <li>• Earn rewards & train citizens</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 p-5 bg-slate-900/60 hover:bg-slate-900/70 transition">
              <div className="text-xl">🏛 Municipal Head</div>
              <ul className="mt-2 text-slate-300 text-sm space-y-1">
                <li>• Monitor system</li>
                <li>• Manage complaints</li>
                <li>• Recycle waste into profit</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue */}
      <section id="revenue" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold">💸 How the System Sustains Itself</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          {[
            ['🌱', 'Fertilizer Sales'],
            ['🏭', 'Scrap Selling'],
            ['🛒', 'Citizen-Worker Payments'],
            ['🚮', 'Recycling Reinvestment'],
          ].map(([icon, title]) => (
            <div key={title} className="rounded-2xl border border-white/10 p-5 bg-slate-900/60 text-center">
              <div className="text-2xl">{icon}</div>
              <div className="mt-1 font-medium">{title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-slate-900/40 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold">⚡ Key Benefits</h2>
          <div className="mt-6 grid md:grid-cols-5 gap-3 text-sm">
            {[
              '✅ Cleaner homes & public spaces',
              '👷 Workers earn more with rewards',
              '🏛 Municipal heads profit from recycling',
              '🌏 Eco-friendly and sustainable',
              '💰 Waste → Wealth',
            ].map((t) => (
              <div key={t} className="rounded-xl border border-white/10 p-4 bg-slate-900/60">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Future */}
      <section id="future" className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold">🏗 Future Scope</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-4 text-sm">
          {[
            '🤖 AI-based garbage detection',
            '📊 Predictive analytics for waste generation',
            '🔗 Blockchain transparency',
            '🇮🇳 Swachh Bharat integration',
          ].map((t) => (
            <div key={t} className="rounded-2xl border border-white/10 p-5 bg-slate-900/60">{t}</div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => navigate('/login')} className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-6 py-3 btn-animated">Start Today</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-4 text-sm text-slate-400">
          <div>
            <div className="font-semibold text-slate-200">Swachhata-Setu</div>
            <div className="mt-1">Building a Cleaner Tomorrow, Together.</div>
          </div>
          <div className="flex gap-4">
            <a className="hover:text-emerald-300" href="#">About</a>
            <a className="hover:text-emerald-300" href="#">Contact</a>
            <a className="hover:text-emerald-300" href="#">Privacy</a>
            <a className="hover:text-emerald-300" href="#">Terms</a>
          </div>
          <div className="text-right md:text-left">© {new Date().getFullYear()} Swachhata-Setu</div>
        </div>
      </footer>
    </div>
  )
}
