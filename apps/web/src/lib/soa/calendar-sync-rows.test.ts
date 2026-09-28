import { describe, expect, test } from "bun:test";

import {
  buildCalendarRowsForSoaRun,
  estimatedDueYmdForStatementMonth,
  monthHasParsedSoaForCard,
  statementPeriodEndYmd,
} from "./calendar-sync-rows";
import type { SoaRow } from "./types";

function parsedRow(overrides: Partial<SoaRow> = {}): SoaRow {
  return {
    bankLabel: "BPI",
    issuerId: "bpi",
    cardLast4: "1234",
    sourceEmailSubject: "Mar 2026",
    sourceMessageId: "m1",
    pdfFileName: "soa.pdf",
    minimumDue: "₱500.00",
    totalDue: "₱1,000.00",
    statementDate: "Mar 12, 2026",
    dueDate: "Apr 08, 2026",
    ...overrides,
  };
}

describe("estimatedDueYmdForStatementMonth", () => {
  test("due in month after statement month", () => {
    expect(estimatedDueYmdForStatementMonth(2026, 3, 25)).toBe("2026-04-25");
    expect(estimatedDueYmdForStatementMonth(2026, 12, 10)).toBe("2027-01-10");
  });
});

describe("statementPeriodEndYmd", () => {
  test("last day of month", () => {
    expect(statementPeriodEndYmd(2026, 2)).toBe("2026-02-28");
    expect(statementPeriodEndYmd(2026, 3)).toBe("2026-03-31");
  });
});

describe("buildCalendarRowsForSoaRun", () => {
  const cards = [
    {
      issuer: "bpi",
      last4: "1234",
      label: "BPI Gold",
      dueDay: 25,
    },
    {
      issuer: "rcbc",
      last4: "5678",
      label: "RCBC",
      dueDay: 8,
    },
  ];

  test("adds estimated row for cards without parsed SOA", () => {
    const rows = buildCalendarRowsForSoaRun(
      [{ month: 3, year: 2026, rows: [parsedRow()] }],
      cards,
    );
    const rcbc = rows.find((r) => r.issuerId === "rcbc");
    expect(rcbc).toBeDefined();
    expect(rcbc?.soaUnavailable).toBe(true);
    expect(rcbc?.source).toBe("expected");
    expect(rcbc?.dueDate).toBe("Apr 8, 2026");
    expect(rows.filter((r) => r.issuerId === "bpi")).toHaveLength(1);
  });

  test("skips synthetic row when parsed SOA exists for card in month", () => {
    expect(
      monthHasParsedSoaForCard([parsedRow()], "bpi", "1234"),
    ).toBe(true);
    const rows = buildCalendarRowsForSoaRun(
      [{ month: 3, year: 2026, rows: [parsedRow()] }],
      [cards[0]],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.soaUnavailable).toBeFalsy();
  });
});
