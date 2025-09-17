import React, { useState } from 'react'
import api from '../../services/api'

export default function CreateWorkerPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', workerId: '', password: '' })
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(null)
    try {
      const { data } = await api.post('/api/users', form)
      setInfo(`Worker created: ${data?.data?.workerId} — ${data?.data?.name}`)
      setForm({ name: '', email: '', phone: '', workerId: '', password: '' })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create worker')
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 max-w-3xl">
      <h2 className="text-xl font-semibold mb-3">Create Worker</h2>
      {info && <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 px-3 py-2">{info}</div>}
      {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
      <form className="grid gap-3" onSubmit={submit}>
        <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({...f, name: e.target.value}))} required />
        <input type="email" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Email" value={form.email} onChange={(e) => setForm(f => ({...f, email: e.target.value}))} required />
        <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Phone" value={form.phone} onChange={(e) => setForm(f => ({...f, phone: e.target.value}))} required />
        <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID (e.g., WRK-1001)" value={form.workerId} onChange={(e) => setForm(f => ({...f, workerId: e.target.value.toUpperCase()}))} required />
        <input type="password" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Password" value={form.password} onChange={(e) => setForm(f => ({...f, password: e.target.value}))} required />
        <button type="submit" className="mt-1 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-3">Create Worker</button>
      </form>
    </section>
  )
}
