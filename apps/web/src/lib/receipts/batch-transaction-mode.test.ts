import { describe, expect, test } from "bun:test";

import {
  assignCombinedPayment,
  distinctPaymentTotal,
  planBatchGroups,
} from "./batch-transaction-mode";
import type { AnalyzedBatchGroup } from "./receipt-card-group";
import type { CreditCardReceiptAiResult } from "./types";

function ai(
  amount: number | undefined,
  reference?: string,
  last4 = "1234",
): CreditCardReceiptAiResult {
  return {
    verdict: "valid",
    confidence: 0.9,
    summary: "mock",
    hasAmount: amount != null,
    hasDate: true,
    hasReference: Boolean(reference),
    isCreditCardPayment: true,
    extraction: {
      cardLast4: last4,
      amount,
      amountRaw: amount != null ? String(amount) : undefined,
      referenceNumber: reference,
    },
    provider: "gemini",
  };
}

function groups(): AnalyzedBatchGroup[] {
  return [
    {
      key: "card:bpi:1234",
      label: "BPI Gold",
      items: [
        { storagePath: "a", ai: ai(5000, "REF1") },
        { storagePath: "b", ai: ai(5000, "REF1") },
      ],
    },
    {
      key: "card:rcbc:5678",
      label: "RCBC",
      items: [{ storagePath: "c", ai: ai(1200, "REF2", "5678") }],
    },
  ];
}

describe("distinctPaymentTotal", () => {
  test("counts the same reference once", () => {
    expect(
      distinctPaymentTotal([
        { amount: 5000, reference: "REF1" },
        { amount: 5000, reference: "REF1" },
      ]),
    ).toBe(5000);
  });

  test("counts a repeated amount without a reference once", () => {
    expect(
      distinctPaymentTotal([
        { amount: 2500, reference: null },
        { amount: 2500, reference: "  " },
      ]),
    ).toBe(2500);
  });

  test("sums different amounts and different references", () => {
    expect(
      distinctPaymentTotal([
        { amount: 2000, reference: "A" },
        { amount: 3000, reference: "B" },
      ]),
    ).toBe(5000);
  });

  test("returns null when nothing is payable", () => {
    expect(
      distinctPaymentTotal([{ amount: null }, { amount: 0, reference: "A" }]),
    ).toBeNull();
  });
});

describe("planBatchGroups", () => {
  test("separate keeps one group per card and records every receipt", () => {
    const planned = planBatchGroups(groups(), "separate");
    expect(planned).toHaveLength(2);
    expect(planned[0]?.items.every((item) => item.recordPayment)).toBe(true);
    expect(planned[1]?.label).toBe("RCBC");
  });

  test("combined merges every selected receipt into one group", () => {
    const planned = planBatchGroups(groups(), "combined");
    expect(planned).toHaveLength(1);
    expect(planned[0]?.label).toBe("One payment");
    expect(planned[0]?.items).toHaveLength(3);
  });

  test("combined keeps a single card group intact", () => {
    const onlyBpi = groups().slice(0, 1);
    const planned = planBatchGroups(onlyBpi, "combined");
    expect(planned).toHaveLength(1);
    expect(planned[0]?.label).toBe("BPI Gold");
  });
});

describe("assignCombinedPayment", () => {
  test("uses the grouped amount once and clears the other files", () => {
    const items = groups()[0]!.items;
    const assigned = assignCombinedPayment(items, {
      ...ai(5000, "REF1"),
      summary: "One BPI payment",
      extraction: { ...ai(5000, "REF1").extraction, amount: 5000 },
    });

    expect(assigned[0]?.recordPayment).toBe(true);
    expect(assigned[0]?.ai.extraction.amount).toBe(5000);
    expect(assigned[0]?.ai.summary).toBe("One BPI payment");
    expect(assigned[1]?.recordPayment).toBe(false);
    expect(assigned[1]?.ai.extraction.amount).toBeUndefined();
  });

  test("falls back to distinct amounts when the grouped read has no amount", () => {
    const items = [
      { storagePath: "a", ai: ai(2000, "A") },
      { storagePath: "b", ai: ai(3000, "B") },
    ];
    const assigned = assignCombinedPayment(items, null);
    expect(assigned[0]?.ai.extraction.amount).toBe(5000);
    expect(assigned[1]?.recordPayment).toBe(false);
    expect(assigned[1]?.ai.extraction.amount).toBeUndefined();
  });

  test("a single file always records a payment", () => {
    const assigned = assignCombinedPayment(
      [{ storagePath: "a", ai: ai(100) }],
      null,
    );
    expect(assigned[0]?.recordPayment).toBe(true);
    expect(assigned[0]?.ai.extraction.amount).toBe(100);
  });
});
