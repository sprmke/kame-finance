import { describe, expect, it } from "vitest";

import { parseSoaText } from "./parse-soa";

describe("parseSoaText (BPI OCR)", () => {
  const ocrText = [
    "BPI Credit Cards Statement of Account",
    "PAYMENT DUE DATE     SEPTEMBER 28,2026",
    "TOTAL AMOUNT DUE             33.341.75",
    "STATEMENT DATE       SEPTEMBER 07,2026",
    "MINIMUM AMOUNT DUE            1,190.78",
  ].join("\n");

  it("keeps the full month name and fixes OCR thousands separators", () => {
    const row = parseSoaText(
      "BPI",
      "bpi",
      "0657",
      "Manual upload",
      "m",
      "soa.pdf",
      ocrText,
      { usedOcr: true },
    );
    expect(row.statementDate).toBe("Sep 07, 2026");
    expect(row.dueDate).toBe("Sep 28, 2026");
    expect(row.totalDue).toBe("33,341.75");
    expect(row.minimumDue).toBe("1,190.78");
  });
});
