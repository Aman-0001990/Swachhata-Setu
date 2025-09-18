import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [complaints, setComplaints] = useState([])
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('approved') // approved | rejected
  const [q, setQ] = useState('')

  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => (!u ? '' : u.startsWith('http') ? u : `${API_BASE}${u}`)

  useEffect(() => {
    async function load() {
      try {
        const [c, t] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/tasks')
        ])
        setComplaints(c.data?.data || [])
        setTasks(t.data?.data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const approvedList = useMemo(() => {
    const c = (complaints || [])
      .filter((x) => x.status === 'resolved')
      .map((x) => ({
        id: x._id,
        type: 'complaint',
        title: x.title,
        workerId: x.assignedTo?.workerId,
        workerName: x.assignedTo?.name,
        startedAt: x.resolutionDetails?.startedAt,
        completedAt: x.resolutionDetails?.completedAt,
        resolvedAt: x.resolutionDetails?.resolvedAt,
        reward: x.rewardPoints ?? x.reward?.points ?? 0,
        beforeImages: x.resolutionDetails?.beforeImages || [],
        afterImages: x.resolutionDetails?.afterImages || [],
      }))
    const t = (tasks || [])
      .filter((x) => x.status === 'completed')
      .map((x) => ({
        id: x._id,
        type: 'task',
        title: x.title,
        workerId: x.assignedTo?._id ? (x.assignedTo.workerId || x.assignedTo._id) : '',
        workerName: x.assignedTo?.name,
        startedAt: null,
        completedAt: x.completedAt,
        resolvedAt: null,
        reward: null,
        beforeImages: [],
        afterImages: [],
      }))
    return [...c, ...t]
      .filter((x) => (q ? (x.title || '').toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => new Date(b.completedAt || b.resolvedAt || 0) - new Date(a.completedAt || a.resolvedAt || 0))
  }, [complaints, tasks, q])

  const rejectedList = useMemo(() => {
    return (complaints || [])
      .filter((x) => x.status === 'rejected')
      .map((x) => ({
        id: x._id,
        title: x.title,
        workerId: x.assignedTo?.workerId,
        workerName: x.assignedTo?.name,
        rejectedAt: x.resolutionDetails?.resolvedAt,
        penalty: x.penaltyPoints ?? x.penalty?.points ?? 0,
      }))
      .filter((x) => (q ? (x.title || '').toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => new Date(b.rejectedAt || 0) - new Date(a.rejectedAt || 0))
  }, [complaints, q])

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {error && <div className="rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">{error}</div>}

      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
          <button className={`px-3 py-2 text-sm ${tab==='approved'?'bg-emerald-500 text-slate-900':'bg-slate-900/60'}`} onClick={()=>setTab('approved')}>Approved</button>
          <button className={`px-3 py-2 text-sm ${tab==='rejected'?'bg-emerald-500 text-slate-900':'bg-slate-900/60'}`} onClick={()=>setTab('rejected')}>Rejected</button>
        </div>
        <input className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100 w-64" placeholder="Search title" value={q} onChange={(e)=>setQ(e.target.value)} />
      </div>

      {tab === 'approved' ? (
        <ul className="space-y-3">
          {approvedList.map((it) => (
            <li key={`${it.type}-${it.id}`} className="rounded-lg border border-white/10 p-4 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate mr-2">{it.title}</div>
                <div className="text-xs text-slate-400">
                  {it.completedAt ? `Completed: ${new Date(it.completedAt).toLocaleString()}` : it.resolvedAt ? `Resolved: ${new Date(it.resolvedAt).toLocaleString()}` : ''}
                </div>
              </div>
              <div className="mt-1 grid md:grid-cols-3 gap-2 text-xs text-slate-300">
                <div>Worker: <span className="text-slate-200">{it.workerId || '-'}</span>{it.workerName ? ` (${it.workerName})` : ''}</div>
                {it.reward !== null && <div>Reward: <span className="text-emerald-300">{it.reward}</span></div>}
                {it.startedAt && <div>Start: {new Date(it.startedAt).toLocaleString()}</div>}
                {it.completedAt && <div>Complete: {new Date(it.completedAt).toLocaleString()}</div>}
              </div>
              {(it.beforeImages.length > 0 || it.afterImages.length > 0) && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Before</div>
                    <div className="grid grid-cols-3 gap-2">
                      {it.beforeImages.map((src, i) => (
                        <img key={`b-${i}`} src={toUrl(src)} alt="before" className="rounded-lg border border-white/10 object-cover h-20 w-full" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">After</div>
                    <div className="grid grid-cols-3 gap-2">
                      {it.afterImages.map((src, i) => (
                        <img key={`a-${i}`} src={toUrl(src)} alt="after" className="rounded-lg border border-white/10 object-cover h-20 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
          {approvedList.length === 0 && <li className="text-slate-400">No approved items.</li>}
        </ul>
      ) : (
        <ul className="space-y-3">
          {rejectedList.map((it) => (
            <li key={`rej-${it.id}`} className="rounded-lg border border-white/10 p-4 bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="font-medium truncate mr-2">{it.title}</div>
                <div className="text-xs text-slate-400">Rejected: {it.rejectedAt ? new Date(it.rejectedAt).toLocaleString() : '-'}</div>
              </div>
              <div className="mt-1 grid md:grid-cols-3 gap-2 text-xs text-slate-300">
                <div>Worker: <span className="text-slate-200">{it.workerId || '-'}</span>{it.workerName ? ` (${it.workerName})` : ''}</div>
                <div>Penalty: <span className="text-red-300">{it.penalty}</span></div>
              </div>
            </li>
          ))}
          {rejectedList.length === 0 && <li className="text-slate-400">No rejected items.</li>}
        </ul>
      )}
    </div>
  )
}
