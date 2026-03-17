import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

const ALLOWED_WHEN_NO_USERNAME = [
  '/account-setup', '/login', '/signup', '/forgot-password', '/recovery-password', '/reset-password',
  '/verify-email', '/confirm-account',
]

const PUBLIC_ROUTES = [
  '/login', '/signup', '/forgot-password', '/recovery-password', '/reset-password',
  '/verify-email', '/confirm-account',
]

export default function NavigationHelper({ children }) {
  const location  = useLocation()
  const { userCookie }                  = useSelector(s => s.auth)
  const { myProfile, myProfileLoad }    = useSelector(s => s.user)

  const pathname = location.pathname

  // Not logged in — only block protected routes
  if (!userCookie) {
    if (pathname === '/account-setup' || pathname === '/profile') {
      return <Navigate to="/login" state={{ from: pathname }} replace />
    }
    if (pathname.startsWith('/profile/')) {
      return <Navigate to="/login" state={{ from: pathname }} replace />
    }
    return children
  }

  // Logged in but profile still loading — only block if on a route that strictly needs it
  if (myProfileLoad && !myProfile) {
    if (PUBLIC_ROUTES.includes(pathname)) return children
    return null
  }

  // Profile loaded
  if (myProfile) {
    // Has username, trying to re-do account setup → redirect home
    if (myProfile.username && pathname === '/account-setup') {
      return <Navigate to="/" replace />
    }

    // No username yet, must complete setup
    if (!myProfile.username && !ALLOWED_WHEN_NO_USERNAME.includes(pathname)) {
      return <Navigate to="/account-setup" replace />
    }
  }

  return children
}