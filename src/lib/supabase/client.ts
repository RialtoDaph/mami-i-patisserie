"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser Supabase client, used for direct Storage uploads (photos). */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
