import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for the PIN login (device check, PIN check, opening a session) and for creating
 * team accounts. Bypasses RLS: never pass it to client code. Null when SUPABASE_SECRET_KEY is not set,
 * in which case only the email login is offered.
 */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
