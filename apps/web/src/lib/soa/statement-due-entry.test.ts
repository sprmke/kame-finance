import { describe, expect, it } from "vitest";

import {
  resolveUnpaidDueEntryForStatement,
  shouldOfferStatementPayNow,
  type StatementDueEntryRow,
} from "./statement-due-entry";

function due(
  partial: Partial<StatementDueEntryRow> & Pick<StatementDueEntryRow, "id">,
): StatementDueEntryRow {
  return {
    issuerId: "bpi",
    cardLast4: "1234",
    dueDateYmd: "2026-09-25",
    paidAt: null,
    statementPeriodKey: "2026-08",
    ...partial,
  };
}

const statement = {
  issuerId: "bpi",
  cardLast4: "1234",
  dueDateYmd: null as string | null,
  statementMonth: 8,
  statementYear: 2026,
};

describe("statement-due-entry", () => {
  it("matches unpaid due by statement period when SOA due date is missing", () => {
    const entry = due({ id: "due-1", dueDateYmd: "2026-09-25" });
    const matched = resolveUnpaidDueEntryForStatement(statement, [entry]);
    expect(matched?.id).toBe("due-1");
  });

  it("offers pay now when due is today and unpaid", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ymd = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    const entry = due({ id: "due-today", dueDateYmd: ymd });
    const offer = shouldOfferStatementPayNow(
      { ...statement, dueDateYmd: ymd },
      [entry],
      false,
    );
    expect(offer).toEqual({ show: true, dueEntryId: "due-today" });
  });

  it("hides pay now when already paid", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ymd = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");
    const entry = due({
      id: "due-today",
      dueDateYmd: ymd,
      paidAt: new Date(),
    });
    const offer = shouldOfferStatementPayNow(
      { ...statement, dueDateYmd: ymd },
      [entry],
      true,
    );
    expect(offer).toEqual({ show: false });
  });
});
