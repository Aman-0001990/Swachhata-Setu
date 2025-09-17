import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [c, w] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/users/workers')
        ])
        setComplaints(c.data.data)
        setWorkers(w.data.data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load complaints')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const assignComplaint = async (id, workerId) => {
    try {
      const normalized = String(workerId || '').trim().toUpperCase()
      await api.put(`/api/complaints/${id}/assign`, { workerId: normalized })
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to assign complaint')
    }
  }

  if (loading) return <div>Loading...</div>

  const unassigned = complaints.filter(c => !c.assignedTo)

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
      <h2 className="text-xl font-semibold mb-1">Complaints</h2>
      <p className="text-slate-400 text-sm mb-3">Only unassigned complaints are shown here. Once assigned, they move to the Tracker.</p>
      {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
      <ul className="divide-y divide-white/10">
        {unassigned.map(c => (
          <li key={c._id} className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-slate-400 text-sm">{c.category} • {c.status}</div>
              </div>
              <div className="flex items-center gap-2">
                <input className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID" list="workers-datalist"
                  onKeyDown={(e) => { if (e.key === 'Enter') assignComplaint(c._id, e.currentTarget.value) }}
                />
                <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={(e) => {
                  const input = e.currentTarget.parentElement.querySelector('input')
                  if (input?.value) assignComplaint(c._id, input.value)
                }}>Assign</button>
              </div>
            </div>
          </li>
        ))}
        {unassigned.length === 0 && <li className="py-3 text-slate-400">No unassigned complaints.</li>}
      </ul>
      <datalist id="workers-datalist">
        {workers.map(w => (
          <option key={w._id || w.workerId} value={w.workerId}>{w.name} • {w.phone}</option>
        ))}
      </datalist>
    </section>
  )
}
