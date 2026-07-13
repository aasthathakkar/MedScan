import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import Home from './pages/Home'
import Symptoms from './pages/Symptoms'
import Scan from './pages/Scan'
import Check from './pages/Check'
import Medicines from './pages/Medicines'
import History from './pages/History'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import s from './App.module.css'

/**
 * Wraps routes that need a logged-in user.
 * If there's no session, redirects to /auth and remembers where they
 * were going so we can send them back after login.
 */
function Protected({ session, children }) {
  const location = useLocation()
  if (session === null) {
    // null = definitely logged out. undefined = still loading.
    return <Navigate to="/auth" state={{ from: location }} replace />
  }
  // undefined = still resolving — render nothing briefly rather than flash /auth
  if (session === undefined) return null
  return children
}

export default function App() {
  const [session, setSession] = useState(undefined) // undefined=loading, null=out, obj=in

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
    })

    // Keep in sync with sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      {/* Nav hides itself on /auth and /auth/callback */}
      {session && <Nav session={session} />}
      <main className={session ? s.main : s.mainFull}>
        <Routes>
          {/* Public routes */}
          <Route path="/auth"          element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected routes — redirect to /auth if not signed in */}
          <Route path="/" element={
            <Protected session={session}><Home /></Protected>
          } />
          <Route path="/symptoms" element={
            <Protected session={session}><Symptoms /></Protected>
          } />
          <Route path="/scan" element={
            <Protected session={session}><Scan /></Protected>
          } />
          <Route path="/check" element={
            <Protected session={session}><Check /></Protected>
          } />
          <Route path="/medicines" element={
            <Protected session={session}><Medicines /></Protected>
          } />
          <Route path="/history" element={
            <Protected session={session}><History /></Protected>
          } />
        </Routes>
      </main>
    </>
  )
}