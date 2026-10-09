import { describe, expect, it } from "vitest";
import { nextOccurrence } from "@/lib/business/recurrence";
import { toDarDateTimeInput } from "@/lib/format";

/** Express a result as Dar es Salaam wall time, which is what the owner sees. */
const eat = (iso: string) => toDarDateTimeInput(new Date(iso));

describe("nextOccurrence", () => {
  it("steps daily and weekly", () => {
    expect(eat(nextOccurrence("2026-10-04T06:00:00Z", "daily"))).toBe(
      "2026-10-05T09:00",
    );
    expect(eat(nextOccurrence("2026-10-04T06:00:00Z", "weekly"))).toBe(
      "2026-10-11T09:00",
    );
  });

  it("clamps month-end so February is not skipped", () => {
    /* 31 Jan 09:00 EAT → 28 Feb 09:00 EAT (2026 is not a leap year). */
    expect(eat(nextOccurrence("2026-01-31T06:00:00Z", "monthly"))).toBe(
      "2026-02-28T09:00",
    );
  });

  it("steps the EAT calendar, not the UTC one", () => {
    /* 1 Nov 01:00 EAT is 31 Oct 22:00 UTC. Monthly must give 1 Dec 01:00
       EAT; stepping the UTC calendar would give 30 Nov (clamped from 31). */
    expect(eat(nextOccurrence("2026-10-31T22:00:00Z", "monthly"))).toBe(
      "2026-12-01T01:00",
    );
  });

  it("leaves non-repeating items where they are", () => {
    expect(nextOccurrence("2026-10-04T06:00:00.000Z", "none")).toBe(
      "2026-10-04T06:00:00.000Z",
    );
  });
});
