import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import ImageWithFallback from '../../components/ImageWithFallback'

export default function TrackerPage() {
  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({ workerId: '', status: 'pending', category: 'all', q: '' })
  const [reward, setReward] = useState({}) // { [complaintId]: { points, notes } }
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyFor, setHistoryFor] = useState(null)
  const [historyComplaint, setHistoryComplaint] = useState(null)

  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => {
    if (!u) return ''
    return u.startsWith('http') ? u : `${API_BASE}${u}`
  }

  const openHistory = async (id) => {
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError('')
    setHistoryItems([])
    setHistoryFor(id)
    setHistoryComplaint(null)
    try {
      const [u, c] = await Promise.all([
        api.get(`/api/complaints/${id}/updates`),
        api.get(`/api/complaints/${id}`)
      ])
      setHistoryItems(u.data?.data || [])
      setHistoryComplaint(c.data?.data || null)
    } catch (e) {
      setHistoryError(e?.response?.data?.error || 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const resolveComplaint = async (id) => {
    const payload = reward[id] || { points: 0, notes: '', workerId: '' }
    try {
      let pts = Number(payload.points || 0)
      if (!Number.isFinite(pts) || pts <= 0) pts = 10 // default reward = 10
      await api.put(`/api/complaints/${id}/resolve`, { points: pts, notes: payload.notes, workerId: payload.workerId })
      // Optimistically remove from current list so it disappears from tracker immediately
      setComplaints((list) => list.filter((c) => c._id !== id))
      setReward((r) => ({ ...r, [id]: { points: '', notes: '' } }))
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to resolve complaint')
    }
  }

  const rejectComplaint = async (id) => {
    const payload = reward[id] || { penaltyPoints: 0, notes: '', workerId: '' }
    try {
      let pts = Number(payload.penaltyPoints || 0)
      if (!Number.isFinite(pts) || pts <= 0) pts = 10 // default penalty = 10
      const bodies = [
        { points: pts, penaltyPoints: pts, notes: payload.notes, workerId: payload.workerId, createTask: !!payload.workerId },
        { penaltyPoints: pts, notes: payload.notes, workerId: payload.workerId, createTask: !!payload.workerId },
        { penalty: { points: pts }, notes: payload.notes, workerId: payload.workerId, createTask: !!payload.workerId },
        { penalty: pts, notes: payload.notes, workerId: payload.workerId, createTask: !!payload.workerId },
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
      setReward((r) => ({ ...r, [id]: { points: '', penaltyPoints: '', notes: '', workerId: '' } }))
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
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold pr-3">{c.title}</div>
                <div className="flex items-center gap-2">
                  {c.status === 'resolved' && (
                    <button className="text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-slate-800/60" onClick={() => openHistory(c._id)}>History</button>
                  )}
                  <span className={badge(c.status)}>{c.status}</span>
                </div>
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
                        <ImageWithFallback key={i} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in" onClick={() => window.open(toUrl(src), '_blank')} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">After</div>
                    <div className="grid grid-cols-2 gap-2">
                      {(c.resolutionDetails?.afterImages || []).map((src, i) => (
                        <ImageWithFallback key={i} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in" onClick={() => window.open(toUrl(src), '_blank')} />
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
                <div>
                  <label className="text-xs text-slate-400">Assign Worker (optional for follow-up task)</label>
                  <input list="workers-datalist" className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100" placeholder="Worker ID or select"
                    value={reward[c._id]?.workerId || ''}
                    onChange={(e)=>setReward(r => ({...r, [c._id]: { ...(r[c._id]||{}), workerId: e.target.value }}))}
                  />
                </div>
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
      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Complaint History</h3>
              <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-slate-800/60" onClick={() => setHistoryOpen(false)}>Close</button>
            </div>
            {historyLoading ? (
              <div>Loading...</div>
            ) : historyError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{historyError}</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold mb-2">Updates</div>
                  <ul className="divide-y divide-white/10 max-h-80 overflow-auto">
                    {historyItems.map((h) => (
                      <li key={h._id} className="py-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{h.action}</span>
                          <span className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</span>
                        </div>
                        {h.notes && <div className="text-slate-300 mt-1">{h.notes}</div>}
                        {/* Show select meta fields nicely, else raw JSON */}
                        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                          {h.by && (
                            <div><span className="text-slate-500">By:</span> {h.by.name} ({h.by.role})</div>
                          )}
                          {h.meta?.workerId && (
                            <div><span className="text-slate-500">Worker:</span> {h.meta.workerId}{h.meta.workerName ? ` (${h.meta.workerName})` : ''}</div>
                          )}
                          {(h.meta?.points || h.meta?.points === 0) && (
                            <div><span className="text-slate-500">Reward:</span> {h.meta.points}</div>
                          )}
                          {h.meta?.startedAt && (
                            <div><span className="text-slate-500">Start:</span> {new Date(h.meta.startedAt).toLocaleString()}</div>
                          )}
                          {h.meta?.completedAt && (
                            <div><span className="text-slate-500">Complete:</span> {new Date(h.meta.completedAt).toLocaleString()}</div>
                          )}
                          {h.meta?.resolvedAt && (
                            <div><span className="text-slate-500">Resolved:</span> {new Date(h.meta.resolvedAt).toLocaleString()}</div>
                          )}
                        </div>
                        {h.meta && !(h.meta.workerId || h.meta.workerName || 'points' in h.meta || h.meta.startedAt || h.meta.completedAt || h.meta.resolvedAt) && (
                          <pre className="mt-1 text-xs text-slate-400 bg-slate-800/60 rounded-md p-2 overflow-auto">{JSON.stringify(h.meta, null, 2)}</pre>
                        )}
                      </li>
                    ))}
                    {historyItems.length === 0 && <li className="py-2 text-slate-400">No history entries.</li>}
                  </ul>
                </div>
                <div>
                  <div className="font-semibold mb-2">Images</div>
                  {!historyComplaint ? (
                    <div className="text-slate-400">No complaint details.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-80 overflow-auto">
                      {((historyComplaint.resolutionDetails?.beforeImages) || []).map((src, i) => (
                        <img key={`b-${i}`} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-28 w-full" />
                      ))}
                      {((historyComplaint.resolutionDetails?.afterImages) || []).map((src, i) => (
                        <img key={`a-${i}`} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-28 w-full" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

