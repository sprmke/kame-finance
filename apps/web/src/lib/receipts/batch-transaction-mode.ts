import type { CreditCardReceiptAiResult } from "@/lib/receipts/types";

import type {
  AnalyzedBatchGroup,
  AnalyzedBatchItem,
} from "@/lib/receipts/receipt-card-group";

/** How a multi-file receipt upload is recorded. */
export type ReceiptBatchTransactionMode = "separate" | "combined";

export const RECEIPT_BATCH_TRANSACTION_MODES = [
  "separate",
  "combined",
] as const satisfies readonly ReceiptBatchTransactionMode[];

type AmountLine = {
  amount: number | null;
  reference?: string | null;
};

/**
 * Total of distinct payments in one upload.
 * The same reference is counted once. Without a reference, a repeated amount
 * is treated as another photo of the same payment.
 */
export function distinctPaymentTotal(lines: AmountLine[]): number | null {
  const counted = new Set<string>();
  let total = 0;
  let any = false;

  for (const line of lines) {
    if (line.amount == null || !(line.amount > 0)) continue;
    const reference = line.reference?.trim().toLowerCase();
    const key = reference
      ? `ref:${reference}`
      : `amt:${line.amount.toFixed(2)}`;
    if (counted.has(key)) continue;
    counted.add(key);
    total += line.amount;
    any = true;
  }

  return any ? total : null;
}

/** Separate keeps card groups. Combined puts the whole selection in one group. */
export function planBatchGroups(
  groups: AnalyzedBatchGroup[],
  mode: ReceiptBatchTransactionMode,
): AnalyzedBatchGroup[] {
  if (mode === "combined" && groups.length > 1) {
    return [
      {
        key: "combined",
        label: "One payment",
        items: groups.flatMap((group) => group.items),
      },
    ];
  }

  if (mode === "separate") {
    return groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item, recordPayment: true })),
    }));
  }

  return groups;
}

function leadAi(
  item: AnalyzedBatchItem,
  groupAi: CreditCardReceiptAiResult | null,
  amount: number | null,
): CreditCardReceiptAiResult {
  const extraction = {
    ...item.ai.extraction,
    ...(groupAi?.extraction ?? {}),
    amount: amount ?? undefined,
    amountRaw:
      groupAi?.extraction.amountRaw ??
      (amount != null ? String(amount) : item.ai.extraction.amountRaw),
  };

  if (!groupAi) {
    return {
      ...item.ai,
      hasAmount: amount != null && amount > 0,
      extraction,
    };
  }

  return {
    ...item.ai,
    verdict: groupAi.verdict,
    confidence: groupAi.confidence,
    summary: groupAi.summary,
    hasAmount: amount != null && amount > 0,
    hasDate: groupAi.hasDate || item.ai.hasDate,
    hasReference: groupAi.hasReference || item.ai.hasReference,
    isCreditCardPayment:
      groupAi.isCreditCardPayment || item.ai.isCreditCardPayment,
    provider: groupAi.provider ?? item.ai.provider,
    extraction,
  };
}

/**
 * One payment for the set: the lead receipt keeps the amount.
 * The other files stay attached and do not add to the paid total.
 */
export function assignCombinedPayment(
  items: AnalyzedBatchItem[],
  groupAi: CreditCardReceiptAiResult | null,
): AnalyzedBatchItem[] {
  if (items.length <= 1) {
    return items.map((item) => ({ ...item, recordPayment: true }));
  }

  const fallback = distinctPaymentTotal(
    items.map((item) => ({
      amount: item.ai.extraction.amount ?? null,
      reference: item.ai.extraction.referenceNumber ?? null,
    })),
  );
  const groupAmount = groupAi?.extraction.amount;
  const amount =
    groupAmount != null && groupAmount > 0 ? groupAmount : fallback;

  return items.map((item, index) => {
    if (index === 0) {
      return {
        ...item,
        recordPayment: true,
        ai: leadAi(item, groupAi, amount),
      };
    }

    return {
      ...item,
      recordPayment: false,
      ai: {
        ...item.ai,
        hasAmount: false,
        extraction: {
          ...item.ai.extraction,
          amount: undefined,
          amountRaw: undefined,
        },
      },
    };
  });
}
