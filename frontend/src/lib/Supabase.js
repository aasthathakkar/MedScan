import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  console.warn('Supabase env vars not set — auth will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

// ---------------------------------------------------------------------------
// Auth helpers used across the app
// ---------------------------------------------------------------------------

/** Returns the current session's access token, or null if logged out. */
export async function getAccessToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/** Returns the current user object, or null. */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

/** Sign in with Google — redirects to Google and back. */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
}

/** Sign in with email + password. */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign up with email + password. */
export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/** Sign out. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}