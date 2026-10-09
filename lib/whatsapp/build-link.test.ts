import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, toWaNumber } from "@/lib/whatsapp/build-link";

describe("buildWhatsAppLink", () => {
  it("strips the number to digits for wa.me", () => {
    expect(toWaNumber("+255 747-809 299")).toBe("255747809299");
  });

  it("encodes spaces as %20, never +", () => {
    expect(
      buildWhatsAppLink({ number: "+255747809299", message: "Habari OSP" }),
    ).toBe("https://wa.me/255747809299?text=Habari%20OSP");
  });

  it("omits text when there is no message", () => {
    expect(buildWhatsAppLink({ number: "+255747809299", message: "  " })).toBe(
      "https://wa.me/255747809299",
    );
  });

  it("returns null without a number, so no dead link is rendered", () => {
    expect(buildWhatsAppLink({ number: "" })).toBeNull();
  });
});
