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

describe("parseSoaText (RCBC)", () => {
  it("keeps the balance next to minimum due and ignores a larger year-to-date figure", () => {
    const text = [
      "PAYMENTS and OTHER CREDITS (-) 3,499.72 3.00% 3.00% 6,000 TOTAL BALANCE DUE",
      "This billing cycle 0.00 Year-to-date 51,618.39 This billing cycle 3,500.09",
      "PAYMENT DUE DATE TOTAL BALANCE DUE OCT 28 2026 4311-7017-5773-8009 FLEX VISA P 3,499.72 MINIMUM PAYMENT DUE P 500.00",
      "P P 500.00 3,499.72 MINIMUM PAYMENT DUE TOTAL BALANCE DUE OCT 28 2026 OCT 04 2026 PAYMENT DUE DATE STATEMENT DATE",
    ].join(" ");
    const row = parseSoaText("RCBC", "rcbc", "8009", "", "m", "rcbc.pdf", text);
    expect(row.totalDue).toBe("3,499.72");
    expect(row.minimumDue).toBe("500.00");
  });

  it("reads column-major labels when both amounts follow both labels", () => {
    const text =
      "STATEMENT DATE PAYMENT DUE DATE JAN 04 2026 JAN 25 2026 TOTAL BALANCE DUE MINIMUM PAYMENT DUE P 20,000.00 P 2,000.00";
    const row = parseSoaText("RCBC", "rcbc", "7015", "", "m", "rcbc.pdf", text);
    expect(row.totalDue).toBe("20,000.00");
    expect(row.minimumDue).toBe("2,000.00");
  });
});

describe("parseSoaText (UnionBank)", () => {
  it("reads statement balance when the currency is glued to the colon", () => {
    const text = [
      "─".repeat(40),
      "STATEMENT SUMMARY Statement Date : Oct 07, 2026 Payment Due Date : Oct 26, 2026",
      "Statement Balance :PHP 23,958.44 Minimum Amount Due :PHP 500.00",
      "PAYMENT DUE DATE TOTAL AMOUNT DUE MINIMUM AMOUNT DUE Oct 26, 2026 ₱ 23,958.44 ₱ 500.00",
    ].join(" ");
    const row = parseSoaText(
      "UnionBank",
      "unionbank",
      "6607",
      "",
      "m",
      "ub.pdf",
      text,
    );
    expect(row.totalDue).toBe("23,958.44");
    expect(row.minimumDue).toBe("500.00");
    expect(row.statementDate).toBe("Oct 07, 2026");
    expect(row.dueDate).toBe("Oct 26, 2026");
    expect(row.parseNotes).toBeUndefined();
  });

  it("keeps a credit statement balance", () => {
    const text =
      "Statement Date : Sep 07, 2026 Payment Due Date : Sep 24, 2026 Statement Balance :PHP -7,540.26 Minimum Amount Due :PHP 0.00";
    const row = parseSoaText(
      "UnionBank",
      "unionbank",
      "6607",
      "",
      "m",
      "ub.pdf",
      text,
    );
    expect(row.totalDue).toBe("-7,540.26");
    expect(row.minimumDue).toBe("0.00");
  });
});

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
