import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

const ALLOWED_WHEN_NO_USERNAME = [
  '/account-setup', '/login', '/signup', '/forgot-password', '/recovery-password', '/reset-password'
]

export default function RequireProfileSetup({ children }) {
  const location = useLocation()
  const { userCookie } = useSelector(s => s.auth)
  const { myProfile, myProfileLoad } = useSelector(s => s.user)

  // If not logged in, allow normal routing
  if (!userCookie) return children

  // If profile is still loading, render nothing to avoid flicker
    if (myProfileLoad) return null
    if (!myProfile) return null

  // If logged in but username missing, redirect to setup except for allowed paths
  const pathname = location.pathname

  if (myProfile && myProfile?.username && pathname === '/account-setup') {
    return <Navigate to="/" state={{ from: pathname }} replace />
  }

  

  if (myProfile && !myProfile?.username && !ALLOWED_WHEN_NO_USERNAME.includes(pathname)) {
    return <Navigate to="/account-setup" state={{ from: pathname }} replace />
  }



  return children
}
