import { describe, expect, it } from "bun:test";

import type { ReceiptListItem } from "./receipt-utils";
import {
  buildReceiptBoard,
  type ReceiptSlotCard,
  type ReceiptSlotDue,
  type ReceiptSlotStatement,
} from "./receipt-slots";

const now = new Date("2026-10-19T02:00:00Z");

const cards: ReceiptSlotCard[] = [
  {
    issuerId: "bpi",
    last4: "0018",
    label: "BPI Platinum",
    color: "#B45309",
    isActive: true,
  },
  {
    issuerId: "rcbc",
    last4: "7015",
    label: "RCBC Flex Visa",
    color: null,
    isActive: true,
  },
  {
    issuerId: "metrobank",
    last4: "9999",
    label: "Closed card",
    isActive: false,
  },
];

const dues: ReceiptSlotDue[] = [
  {
    id: "due-bpi",
    issuerId: "bpi",
    cardLast4: "0018",
    dueDateYmd: "2026-10-28",
    statementPeriodKey: "2026-10",
    statementPeriodLabel: "October 2026",
    paidAt: null,
    minimumDue: "1,190.78",
    totalDue: "33,341.75",
    cardDisplayLabel: "BPI Platinum",
    bankLabel: "BPI",
  },
  {
    id: "due-rcbc",
    issuerId: "rcbc",
    cardLast4: "7015",
    dueDateYmd: "2026-09-28",
    statementPeriodKey: "2026-09",
    statementPeriodLabel: "September 2026",
    paidAt: new Date("2026-09-20T00:00:00Z"),
    minimumDue: "2,000.00",
    totalDue: "60,753.00",
    cardDisplayLabel: "RCBC Flex Visa",
    bankLabel: "RCBC",
  },
];

function receipt(
  overrides: Partial<ReceiptListItem> & Pick<ReceiptListItem, "id">,
): ReceiptListItem {
  return {
    originalFileName: "payment.jpg",
    parsedCardLast4: "7015",
    parsedAmount: 60753,
    parsedAmountRaw: "60,753.00",
    bankDetected: "RCBC",
    aiVerdict: "valid",
    aiSummary: null,
    aiAnalysis: null,
    paymentStatus: "marked_paid",
    createdAt: new Date("2026-09-20T10:00:00Z"),
    dueEntryId: "due-rcbc",
    cardDisplayLabel: "RCBC Flex Visa",
    bankLabel: "RCBC",
    dueDateYmd: "2026-09-28",
    statementDate: null,
    statementPeriodKey: "2026-09",
    statementPeriodLabel: "September 2026",
    minimumDue: "2,000.00",
    totalDue: "60,753.00",
    ...overrides,
  };
}

const statements: ReceiptSlotStatement[] = [
  {
    id: "stmt-bpi",
    issuerId: "bpi",
    cardLast4: "0018",
    statementMonth: 10,
    statementYear: 2026,
    pdfStoragePath: "soa/bpi.pdf",
    pdfFileName: "bpi.pdf",
    soaUnavailable: false,
  },
];

describe("buildReceiptBoard", () => {
  it("keeps the current month and a placeholder for every active card", () => {
    const groups = buildReceiptBoard({
      mode: "month",
      receipts: [],
      cards,
      dues: [],
      now,
    });

    expect(groups.map((group) => group.key)).toEqual(["2026-10"]);
    expect(groups[0]?.slots.map((slot) => slot.cardLast4)).toEqual([
      "0018",
      "7015",
    ]);
    expect(groups[0]?.slots.every((slot) => !slot.paid)).toBe(true);
    expect(groups[0]?.slots.every((slot) => slot.receipts.length === 0)).toBe(
      true,
    );
    expect(groups[0]?.paidCount).toBe(0);
    expect(groups[0]?.totalCount).toBe(2);
    expect(groups[0]?.slots.every((slot) => !slot.soaMissing)).toBe(true);
  });

  it("flags a slot when the statement day has passed and no SOA is stored", () => {
    const groups = buildReceiptBoard({
      mode: "month",
      receipts: [],
      cards: cards.map((card) =>
        card.last4 === "7015" ? { ...card, statementDay: 5 } : card,
      ),
      dues: [],
      now,
    });

    const october = groups[0];
    expect(
      october?.slots.find((slot) => slot.cardLast4 === "7015")?.soaMissing,
    ).toBe(true);
    expect(
      october?.slots.find((slot) => slot.cardLast4 === "0018")?.soaMissing,
    ).toBe(false);
  });

  it("marks paid dues and skips a placeholder when a receipt exists", () => {
    const groups = buildReceiptBoard({
      mode: "month",
      receipts: [receipt({ id: "rcbc-sept" })],
      cards,
      dues,
      statements,
      now,
    });

    const october = groups.find((group) => group.key === "2026-10");
    const september = groups.find((group) => group.key === "2026-09");
    const bpi = october?.slots.find((slot) => slot.cardLast4 === "0018");
    const rcbcOctober = october?.slots.find((slot) => slot.cardLast4 === "7015");
    const rcbcSeptember = september?.slots.find(
      (slot) => slot.cardLast4 === "7015",
    );

    expect(bpi?.paid).toBe(false);
    expect(bpi?.statementId).toBe("stmt-bpi");
    expect(bpi?.dueEntryId).toBe("due-bpi");
    expect(bpi?.totalDue).toBe("33,341.75");
    expect(rcbcOctober?.receipts).toHaveLength(0);
    expect(rcbcSeptember?.receipts.map((item) => item.id)).toEqual([
      "rcbc-sept",
    ]);
    expect(rcbcSeptember?.paid).toBe(true);
    expect(september?.slots.map((slot) => slot.cardLast4)).toEqual(["7015"]);
  });

  it("groups card view by card and still includes the current month", () => {
    const groups = buildReceiptBoard({
      mode: "card",
      receipts: [],
      cards,
      dues,
      now,
    });

    const bpi = groups.find((group) => group.key === "bpi:0018");
    const rcbc = groups.find((group) => group.key === "rcbc:7015");
    const closed = groups.find((group) => group.key === "metrobank:9999");

    expect(bpi?.label).toBe("BPI Platinum");
    expect(bpi?.slots.map((slot) => slot.periodKey)).toEqual(["2026-10"]);
    expect(rcbc?.slots.map((slot) => slot.periodKey)).toEqual([
      "2026-10",
      "2026-09",
    ]);
    expect(rcbc?.slots.find((slot) => slot.periodKey === "2026-09")?.paid).toBe(
      true,
    );
    expect(rcbc?.paidCount).toBe(0);
    expect(rcbc?.totalCount).toBe(1);
    expect(closed).toBeUndefined();
  });
});
