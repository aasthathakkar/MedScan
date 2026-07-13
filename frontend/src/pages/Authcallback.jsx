/**
 * Landing page for the OAuth redirect.
 * Supabase handles the token exchange automatically via the JS client —
 * we just need this route to exist so the redirect lands somewhere, then
 * we push to home once the session is confirmed.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase JS client picks up the token from the URL hash automatically.
    // We just wait for the session to be ready, then redirect.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', { replace: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      fontFamily: 'Quicksand, sans-serif', color: '#6A6480'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 16,
        background: 'linear-gradient(135deg,#7C5CFC,#FF8A5C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>
          <path d="M12 8v6M9 11h6"/>
        </svg>
      </div>
      <p style={{ fontWeight: 700, fontSize: 18 }}>Signing you in…</p>
    </div>
  )
}