import { describe, expect, it } from "vitest";

import { parseSoaText } from "./parse-soa";
import { extractTransactions } from "./parse-transactions";

/** pdf.js text from a Maya Black statement. Summary labels are not in the text layer. */
const MAYA_TEXT = `
Statement of Account
Billing date: 10 October 2026
4,149.00 PHP
- 4,149.00 PHP
0.00 PHP
6,577.79 PHP
0.00 PHP
0.00 PHP
0.00 PHP
0.00 PHP
0.00 PHP
30 Oct 2026   6,577.79 PHP
500.00 PHP
Maya Black CC
MICHAEL MANLULU
0884
10,000.00 PHP
2,000.00 PHP
Transactions
11 Sep 2026 to 10 Oct 2026
SHOPEE PH MANDALUYONG PH   718.00 11 Sep   13 Sep
TGI FRIDAYS VISTA PAMP PAMPANGA PH   1,302.79 15 Sep   16 Sep
GBI SM PAMPANGA SAN FERNANDO PH   230.00 17 Sep   18 Sep
BREADTALK SM PAMPANGA SAN FERNANDO
PH
555.00 17 Sep   18 Sep
KFC BACOLOR BACOLOR PH   140.00 17 Sep   18 Sep
KFC BACOLOR BACOLOR PH   265.00 17 Sep   18 Sep
UNIQLO SM CITY PAMPANG PAMPANGA PH   1,582.00 17 Sep   18 Sep
S1 FOODS OPC SAN FERNANDO PH   580.00 17 Sep   18 Sep
BILL PAYMENT   - 4,149.00 22 Sep   22 Sep
TOM N TOMS ANGELES ANGELES PH   1,005.00 26 Sep   27 Sep
TOM N TOMS ANGELES ANGELES PH   200.00 26 Sep   27 Sep
Page 1 of 6
Statement of Account
Maya Black Credit Card (0884)   Billing date: 10 October 2026
Page 2 of 6
`;

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

describe("parseSoaText (Maya)", () => {
  it("reads billing date, dues, and transactions when labels are missing from the text layer", () => {
    const row = parseSoaText(
      "Maya",
      "maya",
      "0884",
      "Your Maya Black Credit Card billing statement is now available",
      "m",
      "maya.pdf",
      MAYA_TEXT,
    );
    expect(row.statementDate).toBe("Oct 10, 2026");
    expect(row.dueDate).toBe("Oct 30, 2026");
    expect(row.totalDue).toBe("6,577.79");
    expect(row.minimumDue).toBe("500.00");
    expect(row.parseNotes).toBeUndefined();

    const transactions = extractTransactions("maya", MAYA_TEXT);
    expect(transactions).toHaveLength(11);
    expect(transactions[0]).toEqual({
      date: "11 Sep / 13 Sep",
      description: "SHOPEE PH MANDALUYONG PH",
      amount: "718.00",
    });
    expect(transactions[3]).toEqual({
      date: "17 Sep / 18 Sep",
      description: "BREADTALK SM PAMPANGA SAN FERNANDO PH",
      amount: "555.00",
    });
    expect(transactions[8]).toEqual({
      date: "22 Sep / 22 Sep",
      description: "BILL PAYMENT",
      amount: "4,149.00 (CR)",
    });
    expect(transactions[10]).toEqual({
      date: "26 Sep / 27 Sep",
      description: "TOM N TOMS ANGELES ANGELES PH",
      amount: "200.00",
    });
  });
});
