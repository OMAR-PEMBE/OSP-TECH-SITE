import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next";

describe("safeNextPath", () => {
  it("keeps same-origin paths, with query and hash", () => {
    expect(safeNextPath("/admin/projects")).toBe("/admin/projects");
    expect(safeNextPath("/admin/finance?from=2026-01-01#x")).toBe(
      "/admin/finance?from=2026-01-01#x",
    );
  });

  it("falls back when there is nothing usable", () => {
    expect(safeNextPath(undefined)).toBe("/admin");
    expect(safeNextPath("")).toBe("/admin");
    expect(safeNextPath("admin")).toBe("/admin");
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "javascript:alert(1)",
  ])("refuses the open redirect %j", (next) => {
    expect(safeNextPath(next)).toBe("/admin");
  });
});
