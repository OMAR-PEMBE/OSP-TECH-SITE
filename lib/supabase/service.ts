import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { supabaseUrl } from "@/lib/supabase/env";

/**
 * Service-role client. Bypasses RLS entirely (agents.md 2.5, security.md 6).
 *
 * `server-only` makes importing this from a Client Component a build error,
 * and the key is read from a non-`NEXT_PUBLIC_` variable so it can never be
 * inlined into a browser bundle.
 *
 * Use this only where RLS genuinely cannot express the need — a cron job with
 * no user session, or an admin operation that must act across users. Anything
 * a logged-in owner does goes through the ordinary session client instead, so
 * the database stays the second wall rather than being waved past.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. This is a server-only secret; it must never be prefixed NEXT_PUBLIC_.",
    );
  }

  return createSupabaseClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
