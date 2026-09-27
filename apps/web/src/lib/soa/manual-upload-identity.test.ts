import { describe, expect, test } from "bun:test";

import type { CardCredential, SoaRow } from "./types";
import {
  identityIsAssignedToKnownCard,
  last4MatchesKnownCard,
  mergeAiIntoSoaRow,
  pickIdentityText,
  resolveIssuerAndLast4,
  resolveManualUploadIdentity,
} from "./manual-upload-identity";

const cards: CardCredential[] = [
  { issuer: "rcbc", last4: "8899", password: "a" },
  { issuer: "bpi", last4: "1122", password: "b" },
];

function row(partial: Partial<SoaRow>): SoaRow {
  return {
    bankLabel: "BPI",
    issuerId: "bpi",
    cardLast4: "1122",
    sourceEmailSubject: "Manual upload",
    sourceMessageId: "manual:1",
    pdfFileName: "soa.pdf",
    minimumDue: "100.00",
    totalDue: "200.00",
    statementDate: "Mar 12, 2026",
    dueDate: "Apr 08, 2026",
    transactions: [{ date: "Mar 01", description: "Store", amount: "10.00" }],
    ...partial,
  };
}

describe("last4MatchesKnownCard", () => {
  test("rejects last-4 that is not on a user card", () => {
    expect(last4MatchesKnownCard("0001", cards)).toBe(false);
    expect(last4MatchesKnownCard("12", cards)).toBe(false);
  });

  test("accepts a real card last-4", () => {
    expect(last4MatchesKnownCard("8899", cards)).toBe(true);
    expect(last4MatchesKnownCard("xx8899", cards)).toBe(true);
  });
});

describe("mergeAiIntoSoaRow", () => {
  test("does not overwrite a parsed issuer or last-4", () => {
    const merged = mergeAiIntoSoaRow(
      row({ issuerId: "bpi", cardLast4: "1122" }),
      {
        issuerId: "rcbc",
        cardLast4: "8899",
        statementDate: null,
        dueDate: null,
        minimumDue: null,
        totalDue: null,
        transactions: [],
      },
    );
    expect(merged.issuerId).toBe("bpi");
    expect(merged.cardLast4).toBe("1122");
  });

  test("fills blank totals and dates", () => {
    const merged = mergeAiIntoSoaRow(
      row({ minimumDue: "—", statementDate: "—" }),
      {
        issuerId: "bpi",
        cardLast4: null,
        statementDate: "2026-03-12",
        dueDate: null,
        minimumDue: "50.00",
        totalDue: null,
        transactions: [],
      },
    );
    expect(merged.minimumDue).toBe("50.00");
    expect(merged.statementDate).toBe("2026-03-12");
  });
});

describe("resolveIssuerAndLast4", () => {
  test("does not fall back to an arbitrary last-4", () => {
    const result = resolveIssuerAndLast4({
      text: "Some random PDF",
      cards,
      unlockLast4: "0000",
      ai: {
        issuerId: "rcbc",
        cardLast4: "0001",
        statementDate: null,
        dueDate: null,
        minimumDue: null,
        totalDue: null,
        transactions: [],
      },
    });
    expect(result.last4).toBe("");
    expect(
      identityIsAssignedToKnownCard(result.issuerId, result.last4, cards),
    ).toBe(false);
  });

  test("uses unique last-4 from statement text", () => {
    const result = resolveIssuerAndLast4({
      text: "Card ending 8899 RCBC Flex Visa",
      cards,
      unlockLast4: "0000",
      ai: null,
    });
    expect(result).toEqual({ issuerId: "rcbc", last4: "8899" });
  });

  test("disambiguates shared last-4 with issuer text", () => {
    const shared: CardCredential[] = [
      { issuer: "rcbc", last4: "1111", password: "a" },
      { issuer: "bpi", last4: "1111", password: "b" },
    ];
    const result = resolveIssuerAndLast4({
      text: "Bank of the Philippine Islands ending 1111",
      cards: shared,
      unlockLast4: "0000",
      ai: null,
    });
    expect(result).toEqual({ issuerId: "bpi", last4: "1111" });
  });

  test("does not assign the only card of an issuer without last-4", () => {
    const result = resolveIssuerAndLast4({
      text: "RCBC Flex Visa",
      cards,
      unlockLast4: "0000",
      ai: null,
    });
    expect(result.last4).toBe("");
  });
});

describe("resolveManualUploadIdentity", () => {
  test("auto-detects unknown card from issuer + last-4 in text", () => {
    const result = resolveManualUploadIdentity({
      text: "RCBC Flex Visa Card ending 4455 Statement Date Mar 01, 2026",
      cards,
      unlockLast4: "0000",
      ai: null,
    });
    expect(result).toEqual({
      issuerId: "rcbc",
      last4: "4455",
      matchedKnownCard: false,
    });
  });

  test("still matches an existing card preferentially", () => {
    const result = resolveManualUploadIdentity({
      text: "RCBC Flex Visa ending 8899",
      cards,
      unlockLast4: "0000",
      ai: null,
    });
    expect(result).toEqual({
      issuerId: "rcbc",
      last4: "8899",
      matchedKnownCard: true,
    });
  });

  test("uses AI last-4 when text has no candidates", () => {
    const result = resolveManualUploadIdentity({
      text: "Metrobank Credit Card Statement",
      cards: [],
      unlockLast4: "0000",
      ai: {
        issuerId: "metrobank",
        cardLast4: "3746",
        statementDate: null,
        dueDate: null,
        minimumDue: null,
        totalDue: null,
        transactions: [],
      },
    });
    expect(result).toEqual({
      issuerId: "metrobank",
      last4: "3746",
      matchedKnownCard: false,
    });
  });
});

describe("pickIdentityText", () => {
  const ocrFirstPages =
    "BPI Credit Cards Statement of Account\nSTATEMENT DATE SEPTEMBER 07,2026";
  const rawAllPages = [
    "M I C H A E L D M A N L U L U   P A Y M E N T   D U E   D A T E",
    "B P I   A M O R E C A S H B A C K C A R D",
    "4 1 8 8 9 8 - 4 - 9 0 - 1 6 5 7 2 7 1 - A R I A N N A L P E R E Z",
    "4 1 8 8 9 8 - 4 - 9 0 - 3 2 1 0 6 5 7 - M I C H A E L D M A N L U L U",
  ].join("\n");

  test("falls back to pdf.js text when page-capped OCR has no card number", () => {
    const text = pickIdentityText(ocrFirstPages, rawAllPages);
    expect(text).toBe(rawAllPages);
    expect(
      resolveManualUploadIdentity({ text, cards: [], unlockLast4: "0000", ai: null }),
    ).toEqual({ issuerId: "bpi", last4: "0657", matchedKnownCard: false });
  });

  test("keeps OCR text when it already has a card number", () => {
    const ocr = `${ocrFirstPages}\n418898-4-90-3210657 - MICHAEL D MANLULU`;
    expect(pickIdentityText(ocr, rawAllPages)).toBe(ocr);
  });
});
