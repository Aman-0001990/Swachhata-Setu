import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', relatedComplaint: '' })
  const [workers, setWorkers] = useState([])
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  // History modal state (for related complaints)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyComplaint, setHistoryComplaint] = useState(null)
  const [historyFor, setHistoryFor] = useState(null)

  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => (u && !String(u).startsWith('http') ? `${API_BASE}${u}` : u)

  useEffect(() => {
    async function load() {
      const [t, w, c] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/users/workers'),
        api.get('/api/complaints')
      ])
      setTasks(t.data.data)
      setWorkers(w.data.data || [])
      setComplaints(c.data.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const createTask = async (e) => {
    e.preventDefault()
    const payload = { ...taskForm }
    if (!payload.assignedTo) delete payload.assignedTo
    if (!payload.relatedComplaint) delete payload.relatedComplaint
    await api.post('/api/tasks', payload)
    const { data } = await api.get('/api/tasks')
    setTasks(data.data)
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', relatedComplaint: '' })
  }

  const updateTaskStatus = async (id, status) => {
    await api.put(`/api/tasks/${id}/status`, { status })
    const { data } = await api.get('/api/tasks')
    setTasks(data.data)
  }

  const openHistory = async (complaintId) => {
    if (!complaintId) return
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError('')
    setHistoryItems([])
    setHistoryComplaint(null)
    setHistoryFor(complaintId)
    try {
      const [u, c] = await Promise.all([
        api.get(`/api/complaints/${complaintId}/updates`),
        api.get(`/api/complaints/${complaintId}`)
      ])
      setHistoryItems(u.data?.data || [])
      setHistoryComplaint(c.data?.data || null)
    } catch (e) {
      setHistoryError(e?.response?.data?.error || 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
        <h2 className="text-xl font-semibold mb-3">Create Task</h2>
        <form className="grid gap-2" onSubmit={createTask}>
          <label className="text-sm text-slate-300">Title</label>
          <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.title} onChange={(e) => setTaskForm(f => ({...f, title: e.target.value}))} required />
          <label className="text-sm text-slate-300">Description</label>
          <textarea className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.description} onChange={(e) => setTaskForm(f => ({...f, description: e.target.value}))} />
          <label className="text-sm text-slate-300">Priority</label>
          <select className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.priority} onChange={(e) => setTaskForm(f => ({...f, priority: e.target.value}))}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label className="text-sm text-slate-300">Link Complaint (ID, optional)</label>
          <input list="complaints-id-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.relatedComplaint} onChange={(e) => setTaskForm(f => ({...f, relatedComplaint: e.target.value}))} placeholder="Optional (link to complaint)" />
          <label className="text-sm text-slate-300">Assign to (select Worker)</label>
          <input list="workers-obj-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.assignedTo} onChange={(e) => setTaskForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Optional (select worker)" />
          <button type="submit" className="mt-1 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-3">Create Task</button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
        <h2 className="text-xl font-semibold mb-3">Tasks</h2>
        <ul className="divide-y divide-white/10">
          {tasks.map(t => (
            <li key={t._id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-slate-400 text-sm">{t.status}</div>
                {t.assignedTo && (
                  <div className="text-xs text-slate-500 mt-0.5">Assigned: {t.assignedTo.workerId || t.assignedTo._id} {t.assignedTo.name ? `(${t.assignedTo.name})` : ''}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {t.relatedComplaint && (
                  <button className="rounded-lg border border-white/10 px-2 py-1 hover:bg-slate-800/60 text-sm" onClick={() => openHistory(t.relatedComplaint)}>History</button>
                )}
                {t.status !== 'completed' && (
                  <select className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100" value={t.status} onChange={(e) => updateTaskStatus(t._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <datalist id="workers-obj-datalist">
        {workers.map(w => (
          <option key={w._id || w.workerId} value={w._id}>{w.workerId} • {w.name} • {w.phone}</option>
        ))}
      </datalist>
      <datalist id="complaints-id-datalist">
        {complaints.map(c => (
          <option key={c._id} value={c._id}>{c.title} • {c.category} • {c.status}</option>
        ))}
      </datalist>

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">History</h3>
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

