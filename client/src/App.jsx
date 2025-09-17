import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CitizenDashboard from './pages/dashboards/CitizenDashboard'
import WorkerDashboard from './pages/dashboards/WorkerDashboard'
import MunicipalDashboard from './pages/dashboards/MunicipalDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import RoleSelect from './pages/RoleSelect'
import MunicipalLogin from './pages/MunicipalLogin'
import WorkerLogin from './pages/WorkerLogin'

export default function App() {
  const { user } = useAuth()

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

  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={getRoleRoute(user.role)} replace /> : <RoleSelect />
      } />

      <Route path="/login" element={<Login />} />
      <Route path="/municipal-login" element={<MunicipalLogin />} />
      <Route path="/worker-login" element={<WorkerLogin />} />
      <Route path="/signup" element={<Signup />} />

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
          <MunicipalDashboard />
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
