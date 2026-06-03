import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

// Server-side only client with service role key.
// Bypasses RLS — only use in API routes and server components.
// Throws if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.
export function getSupabase(): SupabaseClient {
  if (_client) return _client
  if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL")
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY")
  _client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
  return _client
}
