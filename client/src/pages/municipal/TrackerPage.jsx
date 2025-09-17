import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

export default function TrackerPage() {
  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({ workerId: '', status: 'all', category: 'all', q: '' })
  const [reward, setReward] = useState({}) // { [complaintId]: { points, notes } }

  const toUrl = (u) => {
    if (!u) return ''
    return u.startsWith('http') ? u : `${u}`
  }

  const resolveComplaint = async (id) => {
    const payload = reward[id] || { points: 0, notes: '' }
    try {
      let pts = Number(payload.points || 0)
      if (!Number.isFinite(pts) || pts <= 0) pts = 10 // default reward = 10
      await api.put(`/api/complaints/${id}/resolve`, { points: pts, notes: payload.notes })
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data || [])
      setReward((r) => ({ ...r, [id]: { points: '', notes: '' } }))
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to resolve complaint')
    }
  }

  const rejectComplaint = async (id) => {
    const payload = reward[id] || { penaltyPoints: 0, notes: '' }
    try {
      let pts = Number(payload.penaltyPoints || 0)
      if (!Number.isFinite(pts) || pts <= 0) pts = 10 // default penalty = 10
      const bodies = [
        { points: pts, penaltyPoints: pts, notes: payload.notes },
        { penaltyPoints: pts, notes: payload.notes },
        { penalty: { points: pts }, notes: payload.notes },
        { penalty: pts, notes: payload.notes },
      ]
      let ok = false
      let lastErr
      for (const body of bodies) {
        try {
          console.debug('Reject attempt with body', body)
          await api.put(`/api/complaints/${id}/reject`, body)
          ok = true
          break
        } catch (e) {
          lastErr = e
        }
      }
      if (!ok) throw lastErr || new Error('All reject shapes failed')
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data || [])
      setReward((r) => ({ ...r, [id]: { points: '', penaltyPoints: '', notes: '' } }))
    } catch (e) {
      console.error('Reject failed', e?.response?.data || e)
      alert(e?.response?.data?.error || e?.message || 'Failed to reject complaint')
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [c, w] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/users/workers')
        ])
        setComplaints(c.data.data || [])
        setWorkers(w.data.data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load tracker data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const allStatuses = ['pending','in-progress','resolved','rejected']
  const allCategories = useMemo(() => {
    const set = new Set()
    complaints.forEach(c => { if (c.category) set.add(c.category) })
    return Array.from(set)
  }, [complaints])

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase()
    const wid = filters.workerId.trim().toUpperCase()
    return complaints.filter(c => {
      if (filters.status !== 'all' && c.status !== filters.status) return false
      if (filters.category !== 'all' && c.category !== filters.category) return false
      if (wid && (c.assignedTo?.workerId || '').toUpperCase() !== wid) return false
      if (q && !(c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))) return false
      return true
    })
  }, [complaints, filters])

  const badge = (status) => {
    const map = {
      'pending': 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
      'in-progress': 'bg-blue-500/20 text-blue-200 border-blue-500/40',
      'resolved': 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
      'rejected': 'bg-red-500/20 text-red-200 border-red-500/40'
    }
    return `inline-block rounded-full px-2.5 py-0.5 text-xs border ${map[status] || 'bg-slate-700 text-slate-300 border-white/10'}`
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
        <h2 className="text-xl font-semibold mb-3">Tracker</h2>
        {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}

        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Search title/description" value={filters.q} onChange={(e)=>setFilters(f => ({...f, q: e.target.value}))} />
          <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={filters.status} onChange={(e)=>setFilters(f => ({...f, status: e.target.value}))}>
            <option value="all">All Statuses</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={filters.category} onChange={(e)=>setFilters(f => ({...f, category: e.target.value}))}>
            <option value="all">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input list="workers-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Filter by Worker ID" value={filters.workerId} onChange={(e)=>setFilters(f => ({...f, workerId: e.target.value}))} />
        </div>

        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <li key={c._id} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-start justify-between">
                <div className="font-semibold pr-3">{c.title}</div>
                <span className={badge(c.status)}>{c.status}</span>
              </div>
              <div className="mt-1 text-sm text-slate-400">{c.category}</div>
              {c.assignedTo?.workerId && (
                <div className="mt-1 text-xs text-slate-500">Assigned: {c.assignedTo.workerId} ({c.assignedTo.name})</div>
              )}
              {/* Times */}
              {(c.resolutionDetails?.startedAt || c.resolutionDetails?.completedAt || c.resolutionDetails?.resolvedAt) && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-400">
                  <div>Start: {c.resolutionDetails?.startedAt ? new Date(c.resolutionDetails.startedAt).toLocaleString() : '-'}</div>
                  <div>Complete: {c.resolutionDetails?.completedAt ? new Date(c.resolutionDetails.completedAt).toLocaleString() : '-'}</div>
                  <div>Resolved: {c.resolutionDetails?.resolvedAt ? new Date(c.resolutionDetails.resolvedAt).toLocaleString() : '-'}</div>
                </div>
              )}
              {c.description && <p className="mt-2 text-sm text-slate-300 line-clamp-3">{c.description}</p>}

              {(c.resolutionDetails?.beforeImages?.length > 0 || c.resolutionDetails?.afterImages?.length > 0) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Before</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(c.resolutionDetails?.beforeImages || []).map((src, i) => (
                        <img key={i} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in" onClick={() => window.open(toUrl(src), '_blank')} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">After</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(c.resolutionDetails?.afterImages || []).map((src, i) => (
                        <img key={i} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in" onClick={() => window.open(toUrl(src), '_blank')} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 items-end">
                <div>
                  <label className="text-xs text-slate-400">Reward Points (default 10)</label>
                  <input type="number" min="0" className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100"
                    value={reward[c._id]?.points || ''}
                    onChange={(e)=>setReward(r => ({...r, [c._id]: { ...(r[c._id]||{}), points: e.target.value }}))}
                    placeholder="10"/>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Penalty Points (default 10)</label>
                  <input type="number" min="0" className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100"
                    value={reward[c._id]?.penaltyPoints || ''}
                    onChange={(e)=>setReward(r => ({...r, [c._id]: { ...(r[c._id]||{}), penaltyPoints: e.target.value }}))}
                    placeholder="10"/>
                </div>
                <div className="col-span-1 md:col-span-1"></div>
                <div className="col-span-3">
                  <label className="text-xs text-slate-400">Notes (for approval or rejection)</label>
                  <input className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100"
                    value={reward[c._id]?.notes || ''}
                    onChange={(e)=>setReward(r => ({...r, [c._id]: { ...(r[c._id]||{}), notes: e.target.value }}))}
                    placeholder="Optional"/>
                </div>
                <div className="col-span-3 flex gap-2">
                  <button onClick={()=>resolveComplaint(c._id)} className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2">Approve & Reward</button>
                  <button onClick={()=>rejectComplaint(c._id)} className="flex-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white font-semibold px-3 py-2">Reject & Penalize</button>
                </div>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="text-slate-400">No results</li>}
        </ul>
      </section>

      <datalist id="workers-datalist">
        {workers.map(w => (
          <option key={w._id || w.workerId} value={w.workerId}>{w.name} • {w.phone}</option>
        ))}
      </datalist>
    </div>
  )
}
