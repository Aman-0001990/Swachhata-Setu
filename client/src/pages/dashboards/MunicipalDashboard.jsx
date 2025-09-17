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

  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' })

  useEffect(() => {
    async function load() {
      try {
        const [c, t] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/tasks')
        ])
        setComplaints(c.data.data)
        setTasks(t.data.data)
        // Ideally a workers list endpoint; as a placeholder, allow manual entry or fetch via users if available
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
      await api.put(`/api/complaints/${id}/assign`, { workerId })
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to assign complaint')
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
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to create task')
    }
  }

  const updateTaskStatus = async (id, status) => {
    try {
      await api.put(`/api/tasks/${id}/status`, { status })
      const { data } = await api.get('/api/tasks')
      setTasks(data.data)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update task')
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto text-slate-100">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Municipal Head Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{user?.name}</span>
          <button className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2" onClick={logout}>Logout</button>
        </div>
      </header>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
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
                      <input className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID"
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
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
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
              <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.assignedTo} onChange={(e) => setTaskForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Optional" />
              <button type="submit" className="mt-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-4 py-2">Create</button>
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
        </div>
      )}
    </div>
  )
}
