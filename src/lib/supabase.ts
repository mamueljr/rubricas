import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hayNube = Boolean(
  url && anonKey && /^https?:\/\//.test(url) && !url.includes('xxxxxxxx'),
)

export const supabase: SupabaseClient | null = hayNube
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

export const claveAdmin = import.meta.env.VITE_ADMIN_KEY ?? ''
