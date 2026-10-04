import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for Client Components.
 *
 * Phase 1 has little use for it — public reads happen on the server and the
 * contact form goes through a Server Action — but it is the sanctioned way for
 * a client island to talk to Supabase, and Phase 2's admin forms need it.
 * Carries the anon key only; RLS bounds everything it can reach.
 */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
