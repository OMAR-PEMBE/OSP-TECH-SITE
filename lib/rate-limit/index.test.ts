import { describe, expect, it } from "vitest";
import { checkInMemory } from "@/lib/rate-limit";

describe("checkInMemory (local-dev fallback)", () => {
  it("allows up to the limit, then refuses with a retry time", () => {
    const rules = [{ limit: 2, windowMs: 60_000 }];
    const key = `test:${Math.random()}`;

    expect(checkInMemory(key, rules).allowed).toBe(true);
    expect(checkInMemory(key, rules).allowed).toBe(true);

    const third = checkInMemory(key, rules);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("refuses when any one of several rules trips", () => {
    const rules = [
      { limit: 10, windowMs: 60_000 },
      { limit: 1, windowMs: 86_400_000 },
    ];
    const key = `test:${Math.random()}`;

    expect(checkInMemory(key, rules).allowed).toBe(true);
    expect(checkInMemory(key, rules).allowed).toBe(false);
  });
});
