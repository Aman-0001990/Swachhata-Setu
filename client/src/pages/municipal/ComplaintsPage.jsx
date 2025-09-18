import React, { useEffect, useState } from 'react'
import api from '../../services/api'

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // History modal state
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyFor, setHistoryFor] = useState(null)
  const [historyComplaint, setHistoryComplaint] = useState(null)

  const API_BASE = import.meta.env?.VITE_API_BASE || ''
  const toUrl = (u) => (u && !String(u).startsWith('http') ? `${API_BASE}${u}` : u)

  useEffect(() => {
    async function load() {
      try {
        const [c, w] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/users/workers')
        ])
        setComplaints(c.data.data)
        setWorkers(w.data.data || [])
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load complaints')
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
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to assign complaint')
    }
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

  if (loading) return <div>Loading...</div>

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
      <h2 className="text-xl font-semibold mb-1">Complaints</h2>
      <p className="text-slate-400 text-sm mb-3">View and manage complaints. Use History to view updates and before/after images.</p>
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
                <button className="rounded-lg border border-white/10 px-3 py-2 hover:bg-slate-800/60" onClick={() => openHistory(c._id)}>History</button>
                {!c.assignedTo?.workerId && (
                  <>
                    <input className="w-56 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-slate-100" placeholder="Worker ID" list="workers-datalist"
                      onKeyDown={(e) => { if (e.key === 'Enter') assignComplaint(c._id, e.currentTarget.value) }}
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
        {complaints.length === 0 && <li className="py-3 text-slate-400">No complaints found.</li>}
      </ul>
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
    </section>
  )
}

