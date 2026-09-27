import { describe, expect, test } from "bun:test";

import {
  extractCardLast4Candidates,
  pickDetectedCardLast4,
  principalCardLast4,
  resolveCardLast4FromSoaText,
} from "./card-last4-from-text";

describe("extractCardLast4Candidates", () => {
  test("finds full PAN groups", () => {
    const text =
      "Unionbank Miles+ 4741 3700 2517 0344 Statement Date: Jun 11, 2026";
    expect(extractCardLast4Candidates(text)).toContain("0344");
  });

  test("finds masked PAN", () => {
    const text = "Card number XXXX XXXX XXXX 5678";
    expect(extractCardLast4Candidates(text)).toContain("5678");
  });

  test("finds BPI card numbers but not the customer number", () => {
    const text =
      "Customer Number 020100-4-10-8489031\n418898-4-90-3210657 - MICHAEL D MANLULU";
    expect(extractCardLast4Candidates(text)).toEqual(["0657"]);
  });

  test("finds BPI card numbers in letter-spaced pdf.js text", () => {
    const text =
      "4 1 8 8 9 8 - 4 - 9 0 - 3 2 1 0 6 5 7 - M I C H A E L D M A N L U L U";
    expect(extractCardLast4Candidates(text)).toEqual(["0657"]);
  });
});

describe("principalCardLast4", () => {
  const bpiText = [
    "Prepared for",
    "CUSTOMER NUMBER 020100-4-10-8489031",
    "MICHAEL D MANLULU",
    "418898-4-90-1657271 - ARIANNA L PEREZ",
    "418898-4-90-3210657 - MICHAEL D MANLULU",
  ].join("\n");

  test("picks the card whose holder is also named in the header", () => {
    expect(principalCardLast4(bpiText, ["7271", "0657"])).toBe("0657");
  });

  test("pickDetectedCardLast4 resolves principal among supplementary cards", () => {
    expect(pickDetectedCardLast4(bpiText)).toBe("0657");
  });

  test("resolveCardLast4FromSoaText prefers principal when both are known", () => {
    expect(
      resolveCardLast4FromSoaText(
        bpiText,
        [{ last4: "7271" }, { last4: "0657" }],
        "0000",
      ),
    ).toBe("0657");
  });
});

describe("pickDetectedCardLast4", () => {
  test("returns a single candidate without known cards", () => {
    expect(
      pickDetectedCardLast4("Card ending 9001 Metrobank Statement"),
    ).toBe("9001");
  });

  test("prefers AI when it matches one of several candidates", () => {
    expect(
      pickDetectedCardLast4(
        "4741 3700 2517 0344 and ending 6607",
        "6607",
      ),
    ).toBe("6607");
  });

  test("returns null when multiple candidates conflict without AI", () => {
    expect(
      pickDetectedCardLast4("4741 3700 2517 0344 and 4157 6400 6049 6607"),
    ).toBeNull();
  });
});

describe("resolveCardLast4FromSoaText", () => {
  const unionbankCards = [
    {
      last4: "6607",
      label: "Unionbank Rewards Platinum",
      fullPan: "4157 6400 6049 6607",
    },
    {
      last4: "0344",
      label: "Unionbank Miles+",
      fullPan: "4741 3700 2517 0344",
    },
  ];

  test("uses PAN from text when unlock last4 differs", () => {
    const text =
      "Unionbank Cashback 5123 4500 8899 7788 Total Amount Due PHP 1,234.56";
    const resolved = resolveCardLast4FromSoaText(
      text,
      [
        { last4: "0344", fullPan: "4741 3700 2517 0344" },
        { last4: "7788", fullPan: "5123 4500 8899 7788" },
      ],
      "0344",
    );
    expect(resolved).toBe("7788");
  });

  test("prefers configured fullPan over unlock last4", () => {
    const text =
      "Card No. 4157 6400 6049 6607 Statement Date: Jun 05, 2026 Total Amount Due PHP 42,392.77";
    expect(resolveCardLast4FromSoaText(text, unionbankCards, "0344")).toBe(
      "6607",
    );
  });

  test("uses email subject when PDF text has no card number", () => {
    const text = "Statement Date: Jun 11, 2026 Total Amount Due PHP 31,785.87";
    expect(
      resolveCardLast4FromSoaText(
        text,
        unionbankCards,
        "6607",
        "UnionBank Miles+ Platinum Credit Card e-Statement",
      ),
    ).toBe("0344");
  });

  test("prefers rewards label when subject names rewards platinum", () => {
    const text = "Statement Date: Jun 05, 2026 Total Amount Due PHP 42,392.77";
    expect(
      resolveCardLast4FromSoaText(
        text,
        unionbankCards,
        "0344",
        "UnionBank Rewards Platinum Credit Card e-Statement",
      ),
    ).toBe("6607");
  });

  test("parses ending-in pattern from Unionbank Gmail subjects", () => {
    const text = "Statement Date: Jun 05, 2026 Total Amount Due PHP 42,392.77";
    expect(
      resolveCardLast4FromSoaText(
        text,
        unionbankCards,
        "0344",
        "Your REWARDS VISA PLATINUM Credit Card ending in 6607 e-Statement",
      ),
    ).toBe("6607");
    expect(
      resolveCardLast4FromSoaText(
        text,
        unionbankCards,
        "6607",
        "Your MILES+ VISA SIGNATURE Credit Card ending in 0344 e-Statement",
      ),
    ).toBe("0344");
  });

  test("keeps unlock last4 when text has no matching known card", () => {
    const text = "Statement Date: Jun 11, 2026 Total Amount Due PHP 100.00";
    const resolved = resolveCardLast4FromSoaText(
      text,
      [{ last4: "0344" }, { last4: "7788" }],
      "0344",
    );
    expect(resolved).toBe("0344");
  });

  test("picks earliest known last4 when multiple appear", () => {
    const text =
      "Primary 4741 3700 2517 0344 Supplementary 5123 4500 8899 7788";
    const resolved = resolveCardLast4FromSoaText(
      text,
      [{ last4: "0344" }, { last4: "7788" }],
      "0344",
    );
    expect(resolved).toBe("0344");
  });
});
