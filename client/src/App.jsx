import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import CitizenDashboard from './pages/dashboards/CitizenDashboard'
import WorkerDashboard from './pages/dashboards/WorkerDashboard'
import MunicipalDashboard from './pages/dashboards/MunicipalDashboard'
import MunicipalLayout from './pages/municipal/MunicipalLayout'
import ComplaintsPage from './pages/municipal/ComplaintsPage'
import TasksPage from './pages/municipal/TasksPage'
import CreateWorkerPage from './pages/municipal/CreateWorkerPage'
import WorkerListPage from './pages/municipal/WorkerListPage'
import TrackerPage from './pages/municipal/TrackerPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import RoleSelect from './pages/RoleSelect'
import MunicipalLogin from './pages/MunicipalLogin'
import WorkerLogin from './pages/WorkerLogin'
// Signup disabled in this build; we redirect /signup to /login
import Loader from './components/Loader'

export default function App() {
  const { user } = useAuth()
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    // Ensure the app always shows a brief branded loader before landing
    const t = setTimeout(() => setBooting(false), 1000) // 1s splash
    return () => clearTimeout(t)
  }, [])

  const getRoleRoute = (role) => {
    switch (role) {
      case 'citizen':
        return '/citizen'
      case 'worker':
        return '/worker'
      case 'municipal':
        return '/municipal'
      default:
        return '/login'
    }
  }

  if (booting) return <Loader label="Preparing Swachhata Setu" />

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={getRoleRoute(user.role)} replace /> : <RoleSelect />
      } />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/municipal-login" element={<MunicipalLogin />} />
      <Route path="/worker-login" element={<WorkerLogin />} />

      <Route path="/citizen" element={
        <ProtectedRoute roles={["citizen"]}>
          <CitizenDashboard />
        </ProtectedRoute>
      } />

      <Route path="/worker" element={
        <ProtectedRoute roles={["worker"]}>
          <WorkerDashboard />
        </ProtectedRoute>
      } />

      <Route path="/municipal" element={
        <ProtectedRoute roles={["municipal"]}>
          <MunicipalLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/municipal/complaints" replace />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="workers" element={<WorkerListPage />} />
        <Route path="workers/new" element={<CreateWorkerPage />} />
        <Route path="tracker" element={<TrackerPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
