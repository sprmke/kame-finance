import { describe, expect, it } from "vitest";

import { collapseLetterSpacedText } from "./letter-spacing";

describe("collapseLetterSpacedText", () => {
  it("collapses pdf.js letter-spaced lines into words", () => {
    expect(
      collapseLetterSpacedText(
        "B P I   A M O R E C A S H B A C K C A R D\n4 1 8 8 9 8 - 4 - 9 0 - 3 2 1 0 6 5 7 - M I C H A E L D M A N L U L U",
      ),
    ).toBe(
      "BPI AMORECASHBACKCARD\n418898-4-90-3210657-MICHAELDMANLULU",
    );
  });

  it("leaves normal lines unchanged", () => {
    const text = "Statement of Account\nCard ending 9001 Metrobank Statement";
    expect(collapseLetterSpacedText(text)).toBe(text);
  });
});
