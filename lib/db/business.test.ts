import { afterEach, describe, expect, it, vi } from "vitest";
import { bucketFor } from "@/lib/db/business";

/* Supabase is never touched: bucketFor is pure. The module is imported only
   for it, and its client import is inert until a query runs. */

describe("bucketFor", () => {
  afterEach(() => vi.useRealTimers());

  it("uses Dar es Salaam day boundaries, not the server's", () => {
    /* 22:30 EAT on 4 Oct (19:30 UTC). */
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T19:30:00Z"));

    /* 23:30 EAT the same evening → today. */
    expect(bucketFor("2026-10-04T20:30:00Z", false)).toBe("today");
    /* 01:00 EAT on 5 Oct is still 4 Oct in UTC — but it is tomorrow in
       Morogoro, so it belongs in "this week", not "today". */
    expect(bucketFor("2026-10-04T22:00:00Z", false)).toBe("week");
  });

  it("classifies overdue, later and done", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-04T09:00:00Z"));

    expect(bucketFor("2026-10-04T08:00:00Z", false)).toBe("overdue");
    expect(bucketFor("2026-11-04T08:00:00Z", false)).toBe("later");
    expect(bucketFor("2026-10-04T08:00:00Z", true)).toBe("done");
  });
});
