import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signInWithGoogle, signInWithEmail, signUpWithEmail } from '../lib/supabase'
import s from './Auth.module.css'

export default function Auth() {
  const navigate = useNavigate()
  const [mode,     setMode]     = useState('login')   // 'login' | 'signup'
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [message,  setMessage]  = useState('')

  // If already logged in, go straight to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/', { replace: true })
    })
  }, [navigate])

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      // signInWithGoogle redirects — control won't reach here
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password)
        navigate('/', { replace: true })
      } else {
        await signUpWithEmail(email, password)
        setMessage('Check your email for a confirmation link, then come back to sign in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* Logo */}
        <div className={s.logo}>
          <div className={s.logoChip}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/>
              <path d="M12 8v6M9 11h6"/>
            </svg>
          </div>
          <div>
            <div className={s.logoTitle}>MedScan</div>
            <div className={s.logoSub}>Medicine, made friendly</div>
          </div>
        </div>

        <h1 className={s.heading}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className={s.sub}>
          {mode === 'login'
            ? 'Sign in to access your private history'
            : 'Your searches and scans stay private to you'}
        </p>

        {/* Google button */}
        <button
          className={s.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.8 6C6.7 42.6 14.7 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className={s.divider}><span>or</span></div>

        {/* Email form */}
        <form onSubmit={handleEmail} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              type="email"
              className={s.input}
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              type="password"
              className={s.input}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error   && <div className={s.error}>{error}</div>}
          {message && <div className={s.success}>{message}</div>}

          <button className={s.submitBtn} type="submit" disabled={loading}>
            {loading
              ? 'Please wait…'
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className={s.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className={s.toggleBtn}
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className={s.disclaimer}>
          Educational prototype · Not medical advice
        </p>
      </div>
    </div>
  )
}