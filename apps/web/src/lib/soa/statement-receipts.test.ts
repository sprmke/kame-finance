import { describe, expect, it } from "vitest";

import type { StatementDueEntryRow } from "./statement-due-entry";
import {
  receiptsForStatement,
  type StatementReceiptLink,
} from "./statement-receipts";

function due(
  partial: Partial<StatementDueEntryRow> & Pick<StatementDueEntryRow, "id">,
): StatementDueEntryRow {
  return {
    issuerId: "metrobank",
    cardLast4: "3746",
    dueDateYmd: "2026-09-25",
    paidAt: new Date("2026-09-20"),
    statementPeriodKey: "2026-09",
    ...partial,
  };
}

function receipt(
  partial: Partial<StatementReceiptLink>,
): StatementReceiptLink {
  return {
    dueEntryId: "due-1",
    parsedCardLast4: "3746",
    statementPeriodKey: "2026-09",
    dueDateYmd: "2026-09-25",
    bankDetected: "Metrobank",
    createdAt: "2026-09-20T00:00:00.000Z",
    ...partial,
  };
}

const statement = {
  issuerId: "metrobank",
  cardLast4: "3746",
  dueDateYmd: "2026-09-25",
  statementMonth: 9,
  statementYear: 2026,
};

describe("receiptsForStatement", () => {
  it("returns receipts linked to the statement due entry", () => {
    const result = receiptsForStatement(
      statement,
      [due({ id: "due-1" })],
      [
        receipt({ dueEntryId: "due-2", parsedCardLast4: "7015" }),
        receipt({ dueEntryId: "due-1" }),
      ],
    );
    expect(result.map((item) => item.dueEntryId)).toEqual(["due-1"]);
  });

  it("matches an unlinked receipt by card, bank, and statement month", () => {
    const result = receiptsForStatement(statement, [], [
      receipt({
        dueEntryId: null,
        statementPeriodKey: "2026-08",
        dueDateYmd: "2026-08-25",
      }),
      receipt({ dueEntryId: null, createdAt: "2026-09-21T00:00:00.000Z" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.statementPeriodKey).toBe("2026-09");
  });

  it("does not attach another bank that shares the last 4", () => {
    const result = receiptsForStatement(statement, [], [
      receipt({ dueEntryId: null, bankDetected: "BPI" }),
    ]);
    expect(result).toEqual([]);
  });

  it("keeps a receipt on its linked due when that due is this statement", () => {
    const result = receiptsForStatement(
      statement,
      [due({ id: "due-1", paidAt: null })],
      [
        receipt({
          dueEntryId: "due-1",
          parsedCardLast4: null,
          statementPeriodKey: null,
          dueDateYmd: null,
        }),
      ],
    );
    expect(result).toHaveLength(1);
  });

  it("orders multiple receipts newest first", () => {
    const result = receiptsForStatement(
      statement,
      [due({ id: "due-1" })],
      [
        receipt({ createdAt: "2026-09-18T00:00:00.000Z" }),
        receipt({ createdAt: "2026-09-22T00:00:00.000Z" }),
      ],
    );
    expect(result.map((item) => item.createdAt)).toEqual([
      "2026-09-22T00:00:00.000Z",
      "2026-09-18T00:00:00.000Z",
    ]);
  });
});
