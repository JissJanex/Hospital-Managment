import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfigError =
  'Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart Vite.'

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(supabaseConfigError)
  }

  return supabase
}

export async function getCurrentSession() {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw new Error(`Failed to get auth session: ${error.message}`)
  }

  return data.session
}

export function subscribeToAuthChanges(onChange) {
  const client = getSupabaseClient()
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    onChange(session)
  })

  return () => {
    subscription.unsubscribe()
  }
}

export async function signInWithEmail(email, password) {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`)
  }

  return data.session
}

export async function signOutUser() {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`)
  }
}
