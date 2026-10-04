import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client IP, for rate-limit keys only.
 *
 * `x-forwarded-for` is attacker-controllable in general, which is why this is
 * never used for authorisation — only to bucket rate limits. On Vercel the
 * platform overwrites the leftmost entry, so the first hop is trustworthy
 * there; elsewhere a spoofed value simply buys the attacker their own bucket.
 */
export async function getRequestIp(): Promise<string> {
  const h = await headers();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return h.get("x-real-ip")?.trim() || "unknown";
}
