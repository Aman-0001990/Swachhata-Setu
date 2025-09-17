import React, { useEffect, useState } from 'react'
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

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' })
  const [workerForm, setWorkerForm] = useState({ name: '', email: '', phone: '', password: '', workerId: '' })
  const [workerFilter, setWorkerFilter] = useState('')

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
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '' })
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
    <div className="min-h-screen p-6 max-w-6xl mx-auto text-slate-100">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${toast.type === 'error' ? 'bg-red-500/20 text-red-200 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'}`}>
          {toast.message}
        </div>
      )}
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Municipal Head Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{user?.name}</span>
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
                    </div>
                    <div className="flex items-center gap-2">
                      <input className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID" list="workers-datalist"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') assignComplaint(c._id, e.currentTarget.value)
                        }}
                      />
                      <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={(e) => {
                        const input = e.currentTarget.parentElement.querySelector('input')
                        if (input?.value) assignComplaint(c._id, input.value)
                      }}>Assign</button>
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
              <label className="text-sm text-slate-300">Assign to (Worker ID)</label>
              <input list="workers-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.assignedTo} onChange={(e) => setTaskForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Optional" />
              <button type="submit" className="mt-1 w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-3">Create Task</button>
            </form>

            <h3 className="mt-4 text-lg font-semibold">Tasks</h3>
            <ul className="divide-y divide-white/10">
              {tasks.map(t => (
                <li key={t._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-slate-400 text-sm">{t.status}</div>
                  </div>
                  <select className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100" value={t.status} onChange={(e) => updateTaskStatus(t._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </li>
              ))}
            </ul>
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
    </div>
  )
}
