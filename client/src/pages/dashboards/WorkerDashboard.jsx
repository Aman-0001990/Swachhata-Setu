import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function WorkerDashboard() {
  const { user, logout } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [c, t] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/tasks')
        ])
        setComplaints(c.data.data)
        setTasks(t.data.data)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateComplaintStatus = async (id, status) => {
    try {
      await api.put(`/api/complaints/${id}/status`, { status })
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to update status')
    }
  }

  const uploadImages = async (id, type, files) => {
    const form = new FormData()
    for (const f of files) form.append('images', f)
    try {
      await api.post(`/api/complaints/${id}/images?type=${type}`, form)
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to upload images')
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
        <h1 className="text-2xl font-bold">Worker Dashboard</h1>
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
            <h3 className="text-lg font-semibold mb-3">Assigned Complaints</h3>
            {error && <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}
            <ul className="divide-y divide-white/10">
              {complaints.map(c => (
                <li key={c._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-slate-400 text-sm">{c.category} • {c.status}</div>
                    </div>
                    <select className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100" value={c.status} onChange={(e) => updateComplaintStatus(c._id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2 cursor-pointer inline-flex items-center">
                      Upload Before
                      <input type="file" multiple hidden onChange={(e) => uploadImages(c._id, 'before', Array.from(e.target.files))} />
                    </label>
                    <label className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2 cursor-pointer inline-flex items-center">
                      Upload After
                      <input type="file" multiple hidden onChange={(e) => uploadImages(c._id, 'after', Array.from(e.target.files))} />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
            <h3 className="text-lg font-semibold mb-3">My Tasks</h3>
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
