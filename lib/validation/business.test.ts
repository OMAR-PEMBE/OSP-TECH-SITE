import { describe, expect, it } from "vitest";
import { reminderSchema, tzsAmountSchema } from "@/lib/validation/business";

describe("tzsAmountSchema", () => {
  it("accepts whole shillings with the separators people type", () => {
    expect(tzsAmountSchema.parse("2,500,000")).toBe("2500000");
    expect(tzsAmountSchema.parse(" 1 000 ")).toBe("1000");
  });

  it("keeps amounts above 2^53 exact", () => {
    expect(tzsAmountSchema.parse("9007199254740993")).toBe("9007199254740993");
  });

  it("rejects decimals, negatives and empty input", () => {
    expect(tzsAmountSchema.safeParse("1.5").success).toBe(false);
    expect(tzsAmountSchema.safeParse("-100").success).toBe(false);
    expect(tzsAmountSchema.safeParse("").success).toBe(false);
  });
});

describe("reminderSchema.due_at", () => {
  it("stores the typed time as Dar es Salaam time", () => {
    const parsed = reminderSchema.parse({
      title: "Chase payment",
      due_at: "2026-10-04T14:30",
    });
    expect(parsed.due_at).toBe("2026-10-04T11:30:00.000Z");
  });

  it("rejects an unreadable date", () => {
    expect(
      reminderSchema.safeParse({ title: "Chase payment", due_at: "soon" })
        .success,
    ).toBe(false);
  });
});
