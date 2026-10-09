import { describe, expect, it } from "vitest";
import {
  addDays,
  darMonthStart,
  darStartOfDay,
  formatTzs,
  parseDarDateTime,
  toDarDateInput,
  toDarDateTimeInput,
} from "@/lib/format";

describe("formatTzs", () => {
  it("formats whole shillings from bigint and number", () => {
    expect(formatTzs(1_500_000n)).toMatch(/1,500,000/);
    expect(formatTzs(0)).toMatch(/0/);
  });

  it("refuses amounts it cannot format exactly", () => {
    expect(() => formatTzs(2n ** 60n)).toThrow(RangeError);
  });
});

describe("Dar es Salaam wall time", () => {
  it("reads a datetime-local value as EAT, not server time", () => {
    /* 14:30 in Morogoro is 11:30 UTC. Reading it as UTC was the bug. */
    expect(parseDarDateTime("2026-10-04T14:30")?.toISOString()).toBe(
      "2026-10-04T11:30:00.000Z",
    );
  });

  it("round-trips: what is shown is what is saved", () => {
    const shown = "2026-10-04T14:30";
    const saved = parseDarDateTime(shown)!;
    expect(toDarDateTimeInput(saved)).toBe(shown);
    /* Saving again must not drift — the 3h-per-save bug. */
    expect(
      toDarDateTimeInput(parseDarDateTime(toDarDateTimeInput(saved))!),
    ).toBe(shown);
  });

  it("rejects anything that is not a plain wall-clock value", () => {
    expect(parseDarDateTime("")).toBeNull();
    expect(parseDarDateTime("tomorrow")).toBeNull();
    expect(parseDarDateTime("2026-10-04T14:30Z")).toBeNull();
    expect(parseDarDateTime("2026-13-40T99:99")).toBeNull();
  });

  it("uses the EAT date when UTC is still on the previous day", () => {
    /* 22:30 UTC on the 3rd is 01:30 on the 4th in Dar es Salaam. */
    const instant = new Date("2026-10-03T22:30:00Z");
    expect(toDarDateInput(instant)).toBe("2026-10-04");
    expect(darMonthStart(new Date("2026-09-30T22:00:00Z"))).toBe("2026-10-01");
  });

  it("finds the start of an EAT day and steps calendar days", () => {
    expect(darStartOfDay("2026-10-04").toISOString()).toBe(
      "2026-10-03T21:00:00.000Z",
    );
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});
