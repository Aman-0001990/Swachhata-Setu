import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

export default function ProtectedRoute({ roles = [], children }) {
  const { user, loading } = useAuth()

  if (loading) return <Loader label="Loading your session" />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
