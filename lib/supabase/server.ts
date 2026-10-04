import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for server-side code (Server Components, Server Actions,
 * Route Handlers).
 *
 * Connects as the anon role, so RLS is what decides which rows come back
 * (architecture.md 6.1). Phase 2 adds the session cookie wiring that upgrades
 * this to the authenticated owner inside `/admin`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Called from a Server Component, where cookies are read-only.
             Harmless: Phase 2's middleware refreshes the session instead. */
        }
      },
    },
  });
}

/**
 * Client for reads that must not depend on request cookies.
 *
 * Public content pages are statically rendered and revalidated (ISR), and
 * touching `cookies()` would opt them into dynamic rendering, costing the CDN
 * cache the whole strategy depends on (architecture.md 5.2). Those reads use
 * this instead. It is still the anon role and still fully bounded by RLS.
 */
export function createStaticClient() {
  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* No session to persist — this client is deliberately anonymous. */
      },
    },
  });
}
