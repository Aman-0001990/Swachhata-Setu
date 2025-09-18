import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | pending | in-progress | resolved | rejected
  const [q, setQ] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  const [form, setForm] = useState({ title: '', description: '', category: 'uncollected-waste', priority: 'medium' })
  const [images, setImages] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get('/api/complaints')
        setComplaints(data.data)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load complaints')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => data.append(k, v))
    // sample location, ideally from map/geolocation
    data.append('location', JSON.stringify({ type: 'Point', coordinates: [72.8777, 19.076] }))
    for (const file of images) data.append('images', file)
    try {
      await api.post('/api/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      const res = await api.get('/api/complaints')
      setComplaints(res.data.data)
      setForm({ title: '', description: '', category: 'uncollected-waste', priority: 'medium' })
      setImages([])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create complaint')
    }
  }

  const priorityBadge = (p) => {
    const base = 'px-2 py-1 rounded-full text-xs'
    if (p === 'high') return `${base} bg-red-500/15 text-red-200`
    if (p === 'medium') return `${base} bg-amber-500/15 text-amber-200`
    return `${base} bg-emerald-500/15 text-emerald-200`
  }

  // Helpers and derived state for list + modal
  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => (!u ? '' : u.startsWith('http') ? u : `${API_BASE}${u}`)

  const filtered = complaints.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (q && !(`${c.title}`.toLowerCase().includes(q.toLowerCase()) || `${c.description}`.toLowerCase().includes(q.toLowerCase()))) return false
    return true
  })

  const openView = (c) => { setViewItem(c); setViewOpen(true) }
  const closeView = () => { setViewOpen(false); setViewItem(null) }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto text-slate-100">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Citizen Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{user?.name}</span>
          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Rewards & Penalties */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Rewards & Penalties</h3>
            <div className="text-sm text-slate-400">Total Points</div>
          </div>
          <div className="mb-4">
            <div className="inline-flex items-baseline gap-2 rounded-xl bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30 px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M11.48 3.499a.75.75 0 0 1 1.04 0l7.5 7.25a.75.75 0 0 1-1.04 1.08L18 11.028V19.5a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75V15a.75.75 0 0 0-.75-.75h-1.5A.75.75 0 0 0 9.75 15v4.5a.75.75 0 0 1-.75.75h-3A.75.75 0 0 1 5.25 19.5v-8.472l-.98.9a.75.75 0 0 1-1.04-1.079l7.5-7.25Z"/></svg>
              <span className="text-2xl font-bold">{user?.points ?? 0}</span>
              <span className="text-sm">pts</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Recent history</h4>
            {user?.pointsHistory?.length ? (
              <ul className="divide-y divide-white/10">
                {user.pointsHistory.slice(0, 6).map((h, idx) => (
                  <li key={idx} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="text-sm">{h.reason || 'Activity'}</div>
                      <div className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-sm font-semibold ${h.points >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                      {h.points >= 0 ? '+' : ''}{h.points}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-slate-400 text-sm">No history yet</div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
          <h3 className="text-lg font-semibold mb-3">Report Garbage</h3>
          {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
          <form onSubmit={onSubmit} className="grid gap-2">
            <label className="text-sm text-slate-300">Title</label>
            <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" name="title" value={form.title} onChange={onChange} required />
            <label className="text-sm text-slate-300">Description</label>
            <textarea className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" name="description" value={form.description} onChange={onChange} required />
            <label className="text-sm text-slate-300">Category</label>
            <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" name="category" value={form.category} onChange={onChange}>
              <option value="uncollected-waste">Uncollected Waste</option>
              <option value="overflowing-dustbin">Overflowing Dustbin</option>
              <option value="illegal-dumping">Illegal Dumping</option>
              <option value="other">Other</option>
            </select>
            <label className="text-sm text-slate-300">Priority</label>
            <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" name="priority" value={form.priority} onChange={onChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label className="text-sm text-slate-300">Images</label>
            <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" type="file" multiple onChange={(e) => setImages(Array.from(e.target.files))} />
            <button type="submit" className="mt-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2">Submit</button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-lg font-semibold">My Complaints</h3>
            <div className="flex items-center gap-2">
              <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 text-sm" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 text-sm w-48" placeholder="Search title/desc" value={q} onChange={(e)=>setQ(e.target.value)} />
            </div>
          </div>
          {loading ? (
            <div>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-slate-400">No complaints yet</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map(c => (
                <li key={c._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-slate-400 text-sm">{c.category} • {c.status}</div>
                      {c.assignedTo?.workerId && (
                        <div className="text-xs text-slate-500 mt-0.5">Assigned: {c.assignedTo.workerId} {c.assignedTo.name ? `(${c.assignedTo.name})` : ''}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={priorityBadge(c.priority)}>{c.priority}</span>
                      <button className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-slate-800/60 text-sm" onClick={()=>openView(c)}>Open</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* View Complaint Modal */}
      {viewOpen && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-3xl rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Complaint Details</h3>
              <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-slate-800/60" onClick={closeView}>Close</button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-lg truncate">{viewItem.title}</div>
                <div className="text-slate-400 text-sm">{viewItem.category} • {viewItem.status}</div>
                {viewItem.assignedTo?.workerId && (
                  <div className="mt-1 text-sm">Worker: <span className="text-slate-200">{viewItem.assignedTo.workerId}</span>{viewItem.assignedTo.name ? ` (${viewItem.assignedTo.name})` : ''}</div>
                )}
                {(viewItem.resolutionDetails?.startedAt || viewItem.resolutionDetails?.completedAt || viewItem.resolutionDetails?.resolvedAt) && (
                  <div className="mt-2 grid md:grid-cols-3 gap-2 text-xs text-slate-400">
                    <div>Start: {viewItem.resolutionDetails?.startedAt ? new Date(viewItem.resolutionDetails.startedAt).toLocaleString() : '-'}</div>
                    <div>Complete: {viewItem.resolutionDetails?.completedAt ? new Date(viewItem.resolutionDetails.completedAt).toLocaleString() : '-'}</div>
                    <div>{viewItem.status === 'rejected' ? 'Rejected' : 'Resolved'}: {viewItem.resolutionDetails?.resolvedAt ? new Date(viewItem.resolutionDetails.resolvedAt).toLocaleString() : '-'}</div>
                  </div>
                )}
                {viewItem.description && (
                  <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{viewItem.description}</p>
                )}
              </div>
              <span className={priorityBadge(viewItem.priority)}>{viewItem.priority}</span>
            </div>
            {(viewItem.resolutionDetails?.beforeImages?.length > 0 || viewItem.resolutionDetails?.afterImages?.length > 0) && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Before</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewItem.resolutionDetails?.beforeImages || []).map((src, i) => (
                      <img key={`vb-${i}`} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-24 w-full" />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">After</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(viewItem.resolutionDetails?.afterImages || []).map((src, i) => (
                      <img key={`va-${i}`} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-24 w-full" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
