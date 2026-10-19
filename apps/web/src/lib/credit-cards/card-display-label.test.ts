import { describe, expect, it } from "bun:test";

import { formatCardDisplayLabel } from "./card-display-label";

describe("formatCardDisplayLabel", () => {
  it("prefers the card label when set", () => {
    expect(formatCardDisplayLabel("rcbc", "RCBC Flex Visa")).toBe(
      "RCBC Flex Visa",
    );
  });

  it("falls back to issuer display name", () => {
    expect(formatCardDisplayLabel("rcbc", null)).toBe("RCBC");
    expect(formatCardDisplayLabel("rcbc", "   ")).toBe("RCBC");
  });
});
