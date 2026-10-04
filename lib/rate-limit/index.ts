import "server-only";

/**
 * Fixed-window rate limiter, in process memory.
 *
 * API.md 6 suggests Upstash Redis or a Supabase-backed counter. Phase 1 ships
 * neither: Upstash is a dependency and an account the project does not have
 * yet, and a Supabase counter needs a table that is not in the Phase 1 schema.
 *
 * What this does buy, today: it stops a script hammering the contact form from
 * a single IP, which together with the honeypot and the minimum-submit-time
 * check is what FR-W6 actually asks for.
 *
 * What it does NOT do, and must be understood before launch: serverless
 * functions scale to many instances, each with its own memory, and instances
 * are recycled. So the real limit is "5 per window per instance", and a
 * determined attacker spreading requests across instances gets more through.
 * Before the site carries real traffic this needs to move to a shared store —
 * the `checkRateLimit` signature is designed so that swap touches this file
 * only.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

/** Stop the map growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export type RateLimitRule = {
  /** Requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Seconds until the window resets — for a Retry-After header. */
  retryAfterSeconds: number;
};

/**
 * Counts one hit against `key` and says whether it is allowed.
 *
 * Every rule for a surface must be checked (contact has both a 10-minute and
 * a daily rule), so callers pass an array and are rejected if any rule trips.
 */
export function checkRateLimit(
  key: string,
  rules: RateLimitRule[],
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let allowed = true;
  let retryAfterMs = 0;

  for (const rule of rules) {
    const ruleKey = `${key}:${rule.windowMs}:${rule.limit}`;
    const existing = windows.get(ruleKey);

    if (!existing || existing.resetAt <= now) {
      windows.set(ruleKey, { count: 1, resetAt: now + rule.windowMs });
      continue;
    }

    existing.count += 1;
    if (existing.count > rule.limit) {
      allowed = false;
      retryAfterMs = Math.max(retryAfterMs, existing.resetAt - now);
    }
  }

  return {
    allowed,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  };
}

/** API.md 6: 5 per 10 minutes per IP, and 20 per day per IP. */
export const CONTACT_RULES: RateLimitRule[] = [
  { limit: 5, windowMs: 10 * 60 * 1000 },
  { limit: 20, windowMs: 24 * 60 * 60 * 1000 },
];

/** API.md 6: 60 per minute per IP, dropped silently over the limit. */
export const EVENT_RULES: RateLimitRule[] = [
  { limit: 60, windowMs: 60 * 1000 },
];
