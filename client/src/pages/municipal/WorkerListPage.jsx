import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

export default function WorkerListPage() {
  const [workers, setWorkers] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await api.get('/api/users/workers')
      setWorkers(data.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toUpperCase()
    if (!s) return workers
    return workers.filter(w => (w.workerId||'').toUpperCase().includes(s) || (w.name||'').toUpperCase().includes(s) || (w.phone||'').toUpperCase().includes(s))
  }, [workers, q])

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  if (loading) return <div>Loading...</div>

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
      <h2 className="text-xl font-semibold mb-3">Workers</h2>
      <div className="mb-3">
        <input className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Search by Worker ID, Name or Phone" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>
      <ul className="divide-y divide-white/10">
        {filtered.map(w => (
          <li key={w._id || w.workerId} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{w.name}</div>
              <div className="text-slate-400 text-sm">{w.workerId} • {w.phone}</div>
            </div>
            <button className="rounded-lg border border-white/10 px-3 py-1 text-sm hover:bg-slate-800" onClick={()=>copy(w.workerId)}>Copy ID</button>
          </li>
        ))}
        {filtered.length === 0 && <li className="py-3 text-slate-400">No matching workers.</li>}
      </ul>
    </section>
  )
}
