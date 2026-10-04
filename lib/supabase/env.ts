/**
 * The only two Supabase values that may ever reach the browser
 * (agents.md 2.5, security.md 6).
 *
 * The anon key is safe to publish by design — it carries no authority of its
 * own and everything it can reach is bounded by RLS. The service-role key is
 * never read here, is never prefixed `NEXT_PUBLIC_`, and has no place in
 * Phase 1 at all: the public site only ever reads published content and
 * inserts a message or an event, which is exactly what the anon role is
 * granted.
 *
 * Read through accessors rather than inlined at module scope so a missing
 * variable fails loudly at the call site, naming the variable, instead of
 * surfacing as an opaque "Invalid URL" from deep inside supabase-js.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local ` +
        `and fill it in — for local development the values are printed by ` +
        `\`npx supabase status\`.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
