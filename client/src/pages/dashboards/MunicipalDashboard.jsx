import React, { useEffect, useState } from 'react'
import Avatar from '../../components/Avatar'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function MunicipalDashboard() {
  const { user, logout } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [tasks, setTasks] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', relatedComplaint: '' })
  const [workerForm, setWorkerForm] = useState({ name: '', email: '', phone: '', password: '', workerId: '' })
  const [workerFilter, setWorkerFilter] = useState('')

  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyFor, setHistoryFor] = useState(null)
  const [historyComplaint, setHistoryComplaint] = useState(null)

  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => (u && !String(u).startsWith('http') ? `${API_BASE}${u}` : u)

  // Global history modal state (all approved items)
  const [globalHistoryOpen, setGlobalHistoryOpen] = useState(false)
  const [globalHistoryLoading, setGlobalHistoryLoading] = useState(false)
  const [globalHistoryError, setGlobalHistoryError] = useState('')
  const [globalHistoryItems, setGlobalHistoryItems] = useState([])
  const openGlobalHistory = async () => {
    setGlobalHistoryOpen(true)
    setGlobalHistoryLoading(true)
    setGlobalHistoryError('')
    setGlobalHistoryItems([])
    try {
      const { data } = await api.get('/api/complaints')
      const list = (data?.data || [])
        .filter((c) => c.status === 'resolved')
        .map((c) => ({
          id: c._id,
          title: c.title,
          workerId: c.assignedTo?.workerId || '',
          workerName: c.assignedTo?.name || '',
          startedAt: c.resolutionDetails?.startedAt,
          completedAt: c.resolutionDetails?.completedAt,
          resolvedAt: c.resolutionDetails?.resolvedAt,
          reward: c.rewardPoints ?? c.reward?.points ?? 0,
          beforeImages: c.resolutionDetails?.beforeImages || [],
          afterImages: c.resolutionDetails?.afterImages || [],
        }))
        .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0))
      setGlobalHistoryItems(list)
    } catch (e) {
      setGlobalHistoryError(e?.response?.data?.error || 'Failed to load history')
    } finally {
      setGlobalHistoryLoading(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [c, t, w] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/tasks'),
          api.get('/api/users/workers')
        ])
        setComplaints(c.data.data)
        setTasks(t.data.data)
        setWorkers(w.data.data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load data')
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
      showToast('Complaint assigned', 'success')
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to assign complaint', 'error')
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...taskForm }
      if (!payload.assignedTo) delete payload.assignedTo
      await api.post('/api/tasks', payload)
      const { data } = await api.get('/api/tasks')
      setTasks(data.data)
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', relatedComplaint: '' })
      showToast('Task created', 'success')
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to create task', 'error')
    }
  }

  const updateTaskStatus = async (id, status) => {
    try {
      await api.put(`/api/tasks/${id}/status`, { status })
      const { data } = await api.get('/api/tasks')
      setTasks(data.data)
      showToast('Task status updated', 'success')
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to update task', 'error')
    }
  }

  const createWorker = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/users', workerForm)
      const { data } = await api.get('/api/users/workers')
      setWorkers(data.data)
      setWorkerForm({ name: '', email: '', phone: '', password: '', workerId: '' })
      showToast('Worker created successfully', 'success')
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to create worker', 'error')
    }
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const openHistory = async (complaintId) => {
    if (!complaintId) return
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryError('')
    setHistoryItems([])
    setHistoryFor(complaintId)
    setHistoryComplaint(null)
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

  const filteredWorkers = workers.filter(w => {
    const q = workerFilter.trim().toUpperCase()
    if (!q) return true
    return (
      (w.workerId || '').toUpperCase().includes(q) ||
      (w.name || '').toUpperCase().includes(q) ||
      (w.phone || '').toUpperCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto text-slate-100 animate-fade-in">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${toast.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'}`}>
          {toast.message}
        </div>
      )}
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Municipal Head Dashboard</h1>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex rounded-lg border border-white/10 px-3 py-2 hover:bg-slate-800/60 btn-animated" onClick={openGlobalHistory}>History</button>
          <div className="flex items-center gap-2">
            <Avatar name={user?.name || 'User'} seed={user?.email || user?.name || ''} size={32} />
            <span className="text-slate-400 hidden sm:inline">{user?.name}</span>
          </div>
          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Quick Actions - full width buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <button onClick={() => document.getElementById('complaints-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-3 font-semibold">Complaints</button>
        <button onClick={() => document.getElementById('create-task-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-3 font-semibold">Create Task</button>
        <button onClick={() => document.getElementById('create-worker-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-3 font-semibold">Create Worker</button>
        <button onClick={() => document.getElementById('worker-list-section')?.scrollIntoView({ behavior: 'smooth' })} className="w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 px-4 py-3 font-semibold">Worker List</button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <section id="complaints-section" className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
            <h3 className="text-lg font-semibold mb-3">Complaints</h3>
            {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
            <ul className="divide-y divide-white/10">
              {complaints.map(c => (
                <li key={c._id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-slate-400 text-sm">{c.category} • {c.status}</div>
                      {c.assignedTo?.workerId && (
                        <div className="text-xs text-slate-500 mt-0.5">Assigned: {c.assignedTo.workerId} {c.assignedTo.name ? `(${c.assignedTo.name})` : ''}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.assignedTo?.workerId ? (
                        <>
                          <button className="rounded-lg border border-white/10 px-3 py-2 hover:bg-slate-800/60" onClick={() => openHistory(c._id)}>History</button>
                        </>
                      ) : (
                        <>
                          <input className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID" list="workers-datalist"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') assignComplaint(c._id, e.currentTarget.value)
                            }}
                          />
                          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={(e) => {
                            const input = e.currentTarget.parentElement.querySelector('input')
                            if (input?.value) assignComplaint(c._id, input.value)
                          }}>Assign</button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {/* Worker autocomplete list */}
            <datalist id="workers-datalist">
              {workers.map(w => (
                <option key={w._id || w.workerId} value={w.workerId}>{w.name} • {w.phone}</option>
              ))}
            </datalist>
          </section>

          <section id="create-task-section" className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
            <h3 className="text-lg font-semibold mb-3">Create Task</h3>
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
              <label className="text-sm text-slate-300">Assign to (Worker ID)</label>
              <input list="workers-obj-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.assignedTo} onChange={(e) => setTaskForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Optional (select worker)" />
              <button type="submit" className="mt-1 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-3">Create Task</button>
            </form>

            <h3 className="mt-4 text-lg font-semibold">Tasks</h3>
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
            {/* Datalist for selecting worker by ObjectId (used for task assignment) */}
            <datalist id="workers-obj-datalist">
              {workers.map(w => (
                <option key={w._id || w.workerId} value={w._id}>{w.workerId} • {w.name} • {w.phone}</option>
              ))}
            </datalist>
            {/* Datalist of complaint IDs for linking */}
            <datalist id="complaints-id-datalist">
              {complaints.map(c => (
                <option key={c._id} value={c._id}>{c.title} • {c.category} • {c.status}</option>
              ))}
            </datalist>
          </section>

          <section id="create-worker-section" className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
            <h3 className="text-lg font-semibold mb-3">Create Worker</h3>
            <form className="grid gap-2" onSubmit={createWorker}>
              <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Name" value={workerForm.name} onChange={(e) => setWorkerForm(f => ({...f, name: e.target.value}))} required />
              <input type="email" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Email" value={workerForm.email} onChange={(e) => setWorkerForm(f => ({...f, email: e.target.value}))} required />
              <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Phone" value={workerForm.phone} onChange={(e) => setWorkerForm(f => ({...f, phone: e.target.value}))} required />
              <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID" value={workerForm.workerId} onChange={(e) => setWorkerForm(f => ({...f, workerId: e.target.value.toUpperCase()}))} required />
              <input type="password" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Password" value={workerForm.password} onChange={(e) => setWorkerForm(f => ({...f, password: e.target.value}))} required />
              <button type="submit" className="mt-1 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-3">Create Worker</button>
            </form>
          </section>

          <section id="worker-list-section" className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
            <h3 className="text-lg font-semibold mb-3">Worker List</h3>
            <div className="mb-3">
              <input className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Search by Worker ID, Name or Phone" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} />
            </div>
            <ul className="divide-y divide-white/10">
              {filteredWorkers.map(w => (
                <li key={w._id || w.workerId} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{w.name}</div>
                    <div className="text-slate-400 text-sm">{w.workerId} • {w.phone}</div>
                  </div>
                </li>
              ))}
              {filteredWorkers.length === 0 && <li className="py-2 text-slate-400">No matching workers.</li>}
            </ul>
          </section>
        </div>
      )}
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
                        {/* Fallback to raw JSON if there are other meta fields */}
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
      {/* Global History Modal (top-right button) */}
      {globalHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-4xl rounded-xl border border-white/10 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">History — All Approved</h3>
              <button className="rounded-md border border-white/10 px-2 py-1 hover:bg-slate-800/60" onClick={() => setGlobalHistoryOpen(false)}>Close</button>
            </div>
            {globalHistoryLoading ? (
              <div>Loading...</div>
            ) : globalHistoryError ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{globalHistoryError}</div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-auto">
                {globalHistoryItems.map((item) => (
                  <div key={item.id} className="rounded-lg border border-white/10 p-3 bg-slate-900/70">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate mr-2">{item.title}</div>
                      <div className="text-xs text-slate-400">Resolved: {item.resolvedAt ? new Date(item.resolvedAt).toLocaleString() : '-'}</div>
                    </div>
                    <div className="mt-1 grid md:grid-cols-3 gap-2 text-xs text-slate-300">
                      <div>Worker: <span className="text-slate-200">{item.workerId || '-'}</span>{item.workerName ? ` (${item.workerName})` : ''}</div>
                      <div>Reward: <span className="text-emerald-300">{item.reward}</span></div>
                      <div>Start: {item.startedAt ? new Date(item.startedAt).toLocaleString() : '-'}</div>
                      <div>Complete: {item.completedAt ? new Date(item.completedAt).toLocaleString() : '-'}</div>
                    </div>
                    {(item.beforeImages.length > 0 || item.afterImages.length > 0) && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-slate-400 mb-1">Before</div>
                          <div className="grid grid-cols-3 gap-2">
                            {item.beforeImages.map((src, i) => (
                              <img key={`gb-${item.id}-${i}`} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-20 w-full" />
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400 mb-1">After</div>
                          <div className="grid grid-cols-3 gap-2">
                            {item.afterImages.map((src, i) => (
                              <img key={`ga-${item.id}-${i}`} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-20 w-full" />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {globalHistoryItems.length === 0 && (
                  <div className="text-slate-400">No approved items yet.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
