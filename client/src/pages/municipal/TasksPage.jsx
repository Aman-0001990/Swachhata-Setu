import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '' })
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [t, w] = await Promise.all([
        api.get('/api/tasks'),
        api.get('/api/users/workers')
      ])
      setTasks(t.data.data)
      setWorkers(w.data.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const createTask = async (e) => {
    e.preventDefault()
    const payload = { ...taskForm }
    if (!payload.assignedTo) delete payload.assignedTo
    await api.post('/api/tasks', payload)
    const { data } = await api.get('/api/tasks')
    setTasks(data.data)
    setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '' })
  }

  const updateTaskStatus = async (id, status) => {
    await api.put(`/api/tasks/${id}/status`, { status })
    const { data } = await api.get('/api/tasks')
    setTasks(data.data)
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
          <label className="text-sm text-slate-300">Assign to (Worker ID)</label>
          <input list="workers-datalist" className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" value={taskForm.assignedTo} onChange={(e) => setTaskForm(f => ({...f, assignedTo: e.target.value}))} placeholder="Optional" />
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

      <datalist id="workers-datalist">
        {workers.map(w => (
          <option key={w._id || w.workerId} value={w.workerId}>{w.name} • {w.phone}</option>
        ))}
      </datalist>
    </div>
  )
}
