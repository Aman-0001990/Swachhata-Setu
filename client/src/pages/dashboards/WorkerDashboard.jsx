import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export default function WorkerDashboard() {
  const { user, logout } = useAuth()

  // State
  const [complaints, setComplaints] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  // Local, unsent files chosen by the worker per complaint
  const [localBefore, setLocalBefore] = useState({}) // { [complaintId]: File[] }
  const [localAfter, setLocalAfter] = useState({})  // { [complaintId]: File[] }
  // Cached object URLs for reliable preview/open
  const [previewBefore, setPreviewBefore] = useState({}) // { [complaintId]: string[] }
  const [previewAfter, setPreviewAfter] = useState({}) // { [complaintId]: string[] }
  // Lightbox state for proper full-size preview
  const [lightboxUrl, setLightboxUrl] = useState('')
  const [lightboxAlt, setLightboxAlt] = useState('')

  // ------------------------
  // Helpers
  // ------------------------
  const toUrl = (u) => (!u ? '' : u.startsWith('http') ? u : `${u}`)

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-400/30',
      'in-progress': 'bg-blue-500/15 text-blue-300 border-blue-400/30',
      resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      rejected: 'bg-red-500/15 text-red-300 border-red-400/30',
      assigned: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
      cancelled: 'bg-slate-500/15 text-slate-300 border-slate-400/30',
    }
    return map[status] || map.pending
  }

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ------------------------
  // Data Load
  // ------------------------
  useEffect(() => {
    async function load() {
      try {
        const [c, t] = await Promise.all([
          api.get('/api/complaints'),
          api.get('/api/tasks'),
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
    // Cleanup object URLs on unmount
    return () => {
      Object.values(previewBefore).forEach((arr) => (arr || []).forEach((u) => URL.revokeObjectURL(u)))
      Object.values(previewAfter).forEach((arr) => (arr || []).forEach((u) => URL.revokeObjectURL(u)))
    }
  }, [])

  // Periodic refresh to reflect head reviews (rewards/penalties)
  useEffect(() => {
    let active = true
    const fetchNow = async () => {
      try {
        const { data } = await api.get('/api/complaints')
        if (active) setComplaints(data.data)
      } catch (_) {}
    }
    const timer = setInterval(fetchNow, 5000) // 5s for near-simultaneous updates
    const onFocus = () => fetchNow()
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchNow() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      active = false
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // ------------------------
  // API Actions - Complaints
  // ------------------------
  const updateComplaintStatus = async (id, status) => {
    try {
      await api.put(`/api/complaints/${id}/status`, { status })
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
      showToast(
        status === 'in-progress'
          ? 'Work started'
          : status === 'resolved'
          ? 'Marked as resolved'
          : 'Status updated',
        'success'
      )
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to update status', 'error')
    }
  }

  const uploadImages = async (id, type, files) => {
    const form = new FormData()
    for (const f of files) form.append('images', f)

    try {
      await api.post(`/api/complaints/${id}/images?type=${type}`, form)
      const { data } = await api.get('/api/complaints')
      setComplaints(data.data)
      showToast(
        type === 'before'
          ? 'Before images uploaded'
          : 'After images uploaded',
        'success'
      )
    } catch (e) {
      showToast(e?.response?.data?.error || 'Failed to upload images', 'error')
    }
  }

  const handleSubmitCompletion = async (complaint) => {
    const id = complaint._id
    const hasServerAfter = (complaint.resolutionDetails?.afterImages || []).length > 0
    const hasLocalAfter = (localAfter[id] || []).length > 0

    if (hasLocalAfter) await handleUpload(id, 'after')
    const nowHasAfter = hasServerAfter || hasLocalAfter

    if (!nowHasAfter) {
      showToast('Please upload at least one After image.', 'error')
      return
    }

    await updateComplaintStatus(id, 'resolved')
    showToast('Completion submitted. Great job! 🎉', 'success')
  }

  // ------------------------
  // API Actions - Tasks
  // ------------------------
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

  // ------------------------
  // Local File Handlers
  // ------------------------
  const addFiles = (id, type, fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    if (type === 'before') {
      setLocalBefore((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...files],
      }))
      const newUrls = files.map((f) => URL.createObjectURL(f))
      setPreviewBefore((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...newUrls],
      }))
    } else {
      setLocalAfter((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...files],
      }))
      const newUrls = files.map((f) => URL.createObjectURL(f))
      setPreviewAfter((prev) => ({
        ...prev,
        [id]: [...(prev[id] || []), ...newUrls],
      }))
    }
  }

  const removeFile = (id, type, index) => {
    if (type === 'before') {
      setLocalBefore((prev) => {
        const arr = [...(prev[id] || [])]
        arr.splice(index, 1)
        return { ...prev, [id]: arr }
      })
      setPreviewBefore((prev) => {
        const urls = [...(prev[id] || [])]
        const [u] = urls.splice(index, 1)
        if (u) URL.revokeObjectURL(u)
        return { ...prev, [id]: urls }
      })
    } else {
      setLocalAfter((prev) => {
        const arr = [...(prev[id] || [])]
        arr.splice(index, 1)
        return { ...prev, [id]: arr }
      })
      setPreviewAfter((prev) => {
        const urls = [...(prev[id] || [])]
        const [u] = urls.splice(index, 1)
        if (u) URL.revokeObjectURL(u)
        return { ...prev, [id]: urls }
      })
    }
  }

  const clearLocal = (id, type) => {
    if (type === 'before') setLocalBefore((prev) => ({ ...prev, [id]: [] }))
    else setLocalAfter((prev) => ({ ...prev, [id]: [] }))
    if (type === 'before') {
      setPreviewBefore((prev) => {
        for (const u of (prev[id] || [])) URL.revokeObjectURL(u)
        return { ...prev, [id]: [] }
      })
    } else {
      setPreviewAfter((prev) => {
        for (const u of (prev[id] || [])) URL.revokeObjectURL(u)
        return { ...prev, [id]: [] }
      })
    }
  }

  const handleUpload = async (id, type) => {
    const files = (type === 'before' ? localBefore[id] : localAfter[id]) || []
    if (!files.length) return
    await uploadImages(id, type, files)
    clearLocal(id, type)
  }

  // ------------------------
  // UI
  // ------------------------
  // Simple rewards/penalties computation for header summary (from DB)
  const resolvedForHeader = complaints.filter((c) => c.status === 'resolved')
  const totalRewardHeader = complaints.reduce(
    (sum, c) => sum + (c.rewardPoints ?? c.reward?.points ?? 0),
    0
  )
  const totalPenaltyHeader = complaints.reduce(
    (sum, c) => sum + (c.penaltyPoints ?? c.penalty?.points ?? 0),
    0
  )
  // If backend doesn’t send rewards yet, fallback to 10 per resolved
  const fallbackPoints = totalRewardHeader === 0 && totalPenaltyHeader === 0
    ? resolvedForHeader.length * 10
    : 0
  const netPointsHeader = totalRewardHeader - totalPenaltyHeader + fallbackPoints

  const badgeThresholds = [
    { name: 'Novice', at: 0 },
    { name: 'Bronze', at: 50 },
    { name: 'Silver', at: 150 },
    { name: 'Gold', at: 300 },
  ]
  const currentBadge = badgeThresholds.reduce((acc, t) => (netPointsHeader >= t.at ? t : acc), badgeThresholds[0])

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto text-slate-100">
      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setLightboxUrl('')}>
          <div className="relative max-w-5xl w-full">
            <button className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-red-500 text-white" onClick={() => setLightboxUrl('')}>×</button>
            <img src={lightboxUrl} alt={lightboxAlt || 'preview'} className="w-full max-h-[85vh] object-contain rounded-lg border border-white/10 bg-slate-900" />
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.type === 'error'
              ? 'bg-red-500/20 text-red-200 border border-red-500/40'
              : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Worker Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your assigned tasks and complaints
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">{user?.name}</span>
          <div className="hidden sm:flex items-center gap-2">
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-200 text-xs px-2 py-0.5">
              {currentBadge.name}
            </span>
            <span className="rounded-full border border-white/10 bg-slate-900/70 text-slate-200 text-xs px-2 py-0.5">
              {netPointsHeader} pts
            </span>
          </div>
          <button
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Complaints Section */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 shadow-xl shadow-emerald-500/5">
            <h3 className="text-lg font-semibold mb-1">Complaints</h3>
            <p className="text-slate-400 text-sm mb-3">
              Update status and submit completion when done.
            </p>

            {error && (
              <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-200 px-3 py-2">
                {error}
              </div>
            )}

            {/* Complaint List */}
            <ul className="grid gap-3">
              {complaints.map((c) => (
                <li
                  key={c._id}
                  className="rounded-xl border border-white/10 p-4 bg-slate-900/60 transition hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  {/* Complaint Header */}
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <span>{c.category}</span>
                        <span>•</span>
                        <span
                          className={`inline-block border rounded-full px-2 py-0.5 text-xs ${getStatusBadge(
                            c.status
                          )}`}
                        >
                          {String(c.status).replace('-', ' ')}
                        </span>
                        {(() => {
                          const reward = c.rewardPoints ?? c.reward?.points ?? 0
                          const penalty = c.penaltyPoints ?? c.penalty?.points ?? 0
                          return (
                            <>
                              {reward > 0 && (
                                <span className="inline-block border rounded-full px-2 py-0.5 text-xs border-emerald-400/30 bg-emerald-500/15 text-emerald-200">+{reward} pts</span>
                              )}
                              {penalty > 0 && (
                                <span className="inline-block border rounded-full px-2 py-0.5 text-xs border-red-400/30 bg-red-500/15 text-red-200">-{penalty} pts</span>
                              )}
                            </>
                          )
                        })()}
                      </div>

                  {/* Review summary by head when resolved/rejected */}
                  {(c.status === 'resolved' || c.status === 'rejected') && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/70 p-3 text-sm flex items-center justify-between">
                      {(() => {
                        const reward = c.rewardPoints ?? c.reward?.points ?? 0
                        const penalty = c.penaltyPoints ?? c.penalty?.points ?? 0
                        if (c.status === 'resolved') {
                          if (reward > 0) {
                            return <span className="text-emerald-300">Head review: Rewarded +{reward} pts</span>
                          }
                          if (penalty > 0) {
                            return <span className="text-red-300">Head review: Penalized -{penalty} pts</span>
                          }
                          return <span className="text-slate-300">Head review: Pending</span>
                        }
                        // rejected
                        if (penalty > 0) {
                          return <span className="text-red-300">Rejected: Penalty -{penalty} pts</span>
                        }
                        return <span className="text-red-300">Rejected: Penalty pending</span>
                      })()}
                      <span className="text-xs text-slate-400">Complaint ID: {c._id.slice(-6)}</span>
                    </div>
                  )}
                    </div>
                    <select
                      className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-slate-100"
                      value={c.status}
                      onChange={(e) =>
                        updateComplaintStatus(c._id, e.target.value)
                      }
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Complaint Actions */}
                  {c.status === 'pending' && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <button
                        className="rounded-lg border border-white/10 px-3 py-2 hover:bg-slate-800"
                        onClick={() =>
                          updateComplaintStatus(c._id, 'in-progress')
                        }
                      >
                        Start Work
                      </button>
                    </div>
                  )}

                  {c.status === 'in-progress' && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {(() => {
                        const hasServerAfter =
                          (c.resolutionDetails?.afterImages || []).length > 0
                        const hasLocalAfter =
                          (localAfter[c._id] || []).length > 0
                        const canSubmit = hasServerAfter || hasLocalAfter

                        return (
                          <button
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-semibold px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!canSubmit}
                            onClick={() => handleSubmitCompletion(c)}
                          >
                            Submit Completion
                          </button>
                        )
                      })()}
                    </div>
                  )}

                  {/* Upload before/after images */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {/* Before */}
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        Before {(localBefore[c._id] || []).length > 0 && (
                          <span className="text-slate-300">
                            ({(localBefore[c._id] || []).length} selected)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {((localBefore[c._id]) || []).map((file, i) => (
                          <div key={`b-${i}`} className="relative">
                            <img
                              src={(previewBefore[c._id] || [])[i]}
                              alt="before"
                              className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in"
                              onClick={() => { setLightboxAlt('before'); setLightboxUrl((previewBefore[c._id] || [])[i] || '') }}
                            />
                            <button
                              aria-label="Remove"
                              title="Remove"
                              onClick={() => removeFile(c._id, 'before', i)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-slate-100 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label
                          htmlFor={`file-before-${c._id}`}
                          className="flex items-center justify-center h-24 w-full rounded-lg border border-dashed border-white/10 bg-slate-900/60 hover:bg-slate-800/70 cursor-pointer text-slate-300"
                          onDragOver={(e) => { e.preventDefault() }}
                          onDrop={(e) => { e.preventDefault(); addFiles(c._id, 'before', e.dataTransfer.files) }}
                        >
                          + Add image
                          <input
                            id={`file-before-${c._id}`}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => addFiles(c._id, 'before', e.target.files)}
                          />
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleUpload(c._id, 'before')}
                          className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
                          disabled={!((localBefore[c._id] || []).length)}
                        >
                          Upload
                        </button>
                        {(localBefore[c._id] || []).length > 0 && (
                          <button
                            onClick={() => clearLocal(c._id, 'before')}
                            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-slate-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                    {/* After */}
                    <div>
                      <div className="text-xs text-slate-400 mb-1">
                        After {(localAfter[c._id] || []).length > 0 && (
                          <span className="text-slate-300">
                            ({(localAfter[c._id] || []).length} selected)
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {((localAfter[c._id]) || []).map((file, i) => (
                          <div key={`a-${i}`} className="relative">
                            <img
                              src={(previewAfter[c._id] || [])[i]}
                              alt="after"
                              className="rounded-lg border border-white/10 object-cover h-24 w-full cursor-zoom-in"
                              onClick={() => { setLightboxAlt('after'); setLightboxUrl((previewAfter[c._id] || [])[i] || '') }}
                            />
                            <button
                              aria-label="Remove"
                              title="Remove"
                              onClick={() => removeFile(c._id, 'after', i)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-slate-100 text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label
                          htmlFor={`file-after-${c._id}`}
                          className="flex items-center justify-center h-24 w-full rounded-lg border border-dashed border-white/10 bg-slate-900/60 hover:bg-slate-800/70 cursor-pointer text-slate-300"
                          onDragOver={(e) => { e.preventDefault() }}
                          onDrop={(e) => { e.preventDefault(); addFiles(c._id, 'after', e.dataTransfer.files) }}
                        >
                          + Add image
                          <input
                            id={`file-after-${c._id}`}
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => addFiles(c._id, 'after', e.target.files)}
                          />
                        </label>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleUpload(c._id, 'after')}
                          className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
                          disabled={!((localAfter[c._id] || []).length)}
                        >
                          Upload
                        </button>
                        {(localAfter[c._id] || []).length > 0 && (
                          <button
                            onClick={() => clearLocal(c._id, 'after')}
                            className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-slate-800"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}

              {complaints.length === 0 && (
                <li className="rounded-xl border border-white/10 p-6 text-slate-400">
                  No assigned complaints yet.
                </li>
              )}
            </ul>
          </section>

          {/* Rewards Section */}
          <section className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6 shadow-xl shadow-emerald-500/5">
            <h3 className="text-lg font-semibold mb-1">Rewards</h3>
            <p className="text-slate-400 text-sm mb-4">See your earned points and recent rewards.</p>

            {(() => {
              const resolved = complaints.filter((c) => c.status === 'resolved')
              const rewarded = complaints.filter((c) => (c.rewardPoints ?? c.reward?.points) > 0)
              const penalized = complaints.filter((c) => (c.penaltyPoints ?? c.penalty?.points) > 0)
              const totalReward = complaints.reduce((sum, c) => sum + (c.rewardPoints ?? c.reward?.points ?? 0), 0)
              const totalPenalty = complaints.reduce((sum, c) => sum + (c.penaltyPoints ?? c.penalty?.points ?? 0), 0)
              const fallback = totalReward === 0 && totalPenalty === 0 ? resolved.length * 10 : 0
              const netPoints = totalReward - totalPenalty + fallback

              const thresholds = [
                { name: 'Novice', at: 0 },
                { name: 'Bronze', at: 50 },
                { name: 'Silver', at: 150 },
                { name: 'Gold', at: 300 },
              ]
              const current = thresholds.reduce((acc, t) => (netPoints >= t.at ? t : acc), thresholds[0])
              const next = thresholds.find((t) => t.at > current.at)

              const recentRewards = (rewarded.length ? rewarded : resolved).slice(0, 5)
              const recentPenalties = penalized.slice(0, 5)

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                      <div className="text-xs text-slate-400">Total Reward</div>
                      <div className="text-2xl font-bold text-emerald-300 mt-1">{totalReward}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                      <div className="text-xs text-slate-400">Badge</div>
                      <div className="text-2xl font-bold mt-1">{current.name}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                      <div className="text-xs text-slate-400">Total Penalty</div>
                      <div className="text-2xl font-bold text-red-300 mt-1">{totalPenalty}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Recent Rewards</div>
                        {next && (
                          <div className="text-xs text-slate-400">Next badge: {next.name} at {next.at} pts</div>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {recentRewards.map((c) => (
                          <li key={c._id} className="flex items-center justify-between text-sm">
                            <div className="truncate mr-2">{c.title}</div>
                            <div className="text-emerald-300">+{c.rewardPoints ?? c.reward?.points ?? 10} pts</div>
                          </li>
                        ))}
                        {recentRewards.length === 0 && (
                          <li className="text-slate-400 text-sm">No rewards yet.</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                      <div className="font-medium mb-2">Recent Penalties</div>
                      <ul className="space-y-2">
                        {recentPenalties.map((c) => (
                          <li key={c._id} className="flex items-center justify-between text-sm">
                            <div className="truncate mr-2">{c.title}</div>
                            <div className="text-red-300">-{c.penaltyPoints ?? c.penalty?.points ?? 0} pts</div>
                          </li>
                        ))}
                        {recentPenalties.length === 0 && (
                          <li className="text-slate-400 text-sm">No penalties recorded.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4 bg-slate-900/70">
                    <div className="text-xs text-slate-400">Net Points</div>
                    <div className="text-2xl font-bold mt-1">{netPoints}</div>
                  </div>
                </div>
              )
            })()}
          </section>
        </div>
      )}
    </div>
  )
}
