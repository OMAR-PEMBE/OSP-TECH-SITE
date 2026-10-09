import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fixed-window rate limiter (API.md 6).
 *
 * Counts live in Postgres (`rate_limit_counters`, via the `rate_limit_hit`
 * function), so the limit holds across every serverless instance. The earlier
 * in-process Map gave each instance its own budget and forgot it whenever the
 * instance was recycled — "5 per window per instance", not 5 per window.
 *
 * The function is executable by the service role only. Letting the anon role
 * call it would let anyone inflate someone else's counter or flood the table,
 * so the server makes the call with the service client. Nothing else about
 * the request runs with that key.
 *
 * Fallbacks, both deliberate:
 *  - No `SUPABASE_SERVICE_ROLE_KEY` configured (local dev, or a preview
 *    without secrets): use the in-memory window, with a one-time warning.
 *  - The database call fails: fail *open* and log. A rate limiter that takes
 *    the contact form down whenever the database hiccups would cost exactly
 *    the leads it exists to protect; the honeypot and minimum-submit-time
 *    checks still stand in front of the form.
 */

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
export async function checkRateLimit(
  key: string,
  rules: RateLimitRule[],
): Promise<RateLimitResult> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    warnMemoryFallbackOnce();
    return checkInMemory(key, rules);
  }

  try {
    const supabase = createServiceClient();
    const results = await Promise.all(
      rules.map((rule) =>
        supabase.rpc("rate_limit_hit", {
          p_key: key.slice(0, 200),
          p_limit: rule.limit,
          p_window_seconds: Math.max(1, Math.round(rule.windowMs / 1000)),
        }),
      ),
    );

    let allowed = true;
    let retryAfterSeconds = 0;
    for (const { data, error } of results) {
      if (error) throw error;
      const row = data?.[0];
      if (row && !row.allowed) {
        allowed = false;
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          row.retry_after_seconds,
        );
      }
    }
    return { allowed, retryAfterSeconds };
  } catch (cause) {
    console.error("rate limit check failed — allowing the request", cause);
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

/* ------------------------------------------------------ in-memory fallback */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
let warned = false;

function warnMemoryFallbackOnce() {
  if (warned) return;
  warned = true;
  console.warn(
    "SUPABASE_SERVICE_ROLE_KEY is not set — rate limits are per-process only. " +
      "Set it in any deployed environment.",
  );
}

/** Stop the map growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (windows.size < 5_000) return;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

/** Exported for tests; production code calls `checkRateLimit`. */
export function checkInMemory(
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

/* ------------------------------------------------------------------ rules */

/** API.md 6: 5 per 10 minutes per IP, and 20 per day per IP. */
export const CONTACT_RULES: RateLimitRule[] = [
  { limit: 5, windowMs: 10 * 60 * 1000 },
  { limit: 20, windowMs: 24 * 60 * 60 * 1000 },
];

/** API.md 6: 60 per minute per IP, dropped silently over the limit. */
export const EVENT_RULES: RateLimitRule[] = [
  { limit: 60, windowMs: 60 * 1000 },
];

/** API.md 6: 10 per 15 minutes per IP. */
export const LOGIN_RULES: RateLimitRule[] = [
  { limit: 10, windowMs: 15 * 60 * 1000 },
];

/** API.md 6: 30 per hour per user. */
export const EXPORT_RULES: RateLimitRule[] = [
  { limit: 30, windowMs: 60 * 60 * 1000 },
];
