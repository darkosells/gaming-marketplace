import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client
  
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}

// Helper to safely get user without throwing errors
export async function safeGetUser() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data.user
  } catch {
    return null
  }
}