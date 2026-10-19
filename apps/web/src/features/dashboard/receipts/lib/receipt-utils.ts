import {
  matchReceiptToDue,
  resolveStatementPeriodFromDue,
} from "@/lib/receipts/match-due";
import type { DuePaymentCoverage } from "@/lib/receipts/partial-payment";
import { receiptPaymentStackKey } from "@/lib/receipts/receipt-stack";
import { formatSoaPeriodLabelFromKey } from "@/lib/soa/period";
import { formatPhpAmount } from "@/lib/utils/format-money";

export type ReceiptGroupMode = "month" | "card";

export type ReceiptAiAnalysis = {
  confidence?: number | null;
  hasAmount?: boolean;
  hasDate?: boolean;
  hasReference?: boolean;
  isCreditCardPayment?: boolean;
  paymentDate?: string;
  referenceNumber?: string;
  aiModelError?: string;
};

export type ReceiptListItem = {
  id: string;
  originalFileName: string | null;
  parsedCardLast4: string | null;
  parsedAmount: number | null;
  parsedAmountRaw: string | null;
  bankDetected: string | null;
  aiVerdict: string | null;
  aiSummary: string | null;
  aiAnalysis: ReceiptAiAnalysis | null;
  paymentStatus: string | null;
  createdAt: Date;
  dueEntryId: string | null;
  cardDisplayLabel: string | null;
  bankLabel: string | null;
  dueDateYmd: string | null;
  statementDate: string | null;
  statementPeriodKey: string | null;
  statementPeriodLabel: string | null;
  minimumDue: string | null;
  totalDue: string | null;
  cumulativePaidForDue?: number | null;
  duePaymentCoverage?: DuePaymentCoverage | null;
  paymentSequenceLabel?: string | null;
  receiptCountForDue?: number | null;
};

export type ReceiptGroup = {
  key: string;
  label: string;
  items: ReceiptListItem[];
};

export type ReceiptMonthDueContext = {
  id: string;
  issuerId: string;
  cardLast4: string;
  dueDateYmd: string;
  statementPeriodKey: string;
  statementPeriodLabel: string;
};

type ReceiptRevalidationRow = Pick<
  ReceiptListItem,
  | "parsedCardLast4"
  | "parsedAmountRaw"
  | "bankDetected"
  | "aiVerdict"
  | "aiSummary"
  | "aiAnalysis"
  | "paymentStatus"
> & {
  parsedAmount: string | number | null;
};

/** Merge a revalidate mutation row into list/preview shape without losing due context. */
export function mergeReceiptFromRevalidation<T extends ReceiptListItem>(
  existing: T,
  updated: ReceiptRevalidationRow,
): T {
  return {
    ...existing,
    parsedCardLast4: updated.parsedCardLast4,
    parsedAmount:
      updated.parsedAmount != null && updated.parsedAmount !== ""
        ? Number(updated.parsedAmount)
        : null,
    parsedAmountRaw: updated.parsedAmountRaw,
    bankDetected: updated.bankDetected,
    aiVerdict: updated.aiVerdict,
    aiSummary: updated.aiSummary,
    aiAnalysis: updated.aiAnalysis,
    paymentStatus: updated.paymentStatus,
  };
}

export function receiptFileUrl(receiptId: string): string {
  return `/api/receipts/file?receiptId=${encodeURIComponent(receiptId)}`;
}

export function receiptCardLabel(receipt: ReceiptListItem): string {
  if (receipt.cardDisplayLabel) return receipt.cardDisplayLabel;
  if (receipt.bankDetected && receipt.parsedCardLast4) {
    return `${receipt.bankDetected} ···· ${receipt.parsedCardLast4}`;
  }
  if (receipt.parsedCardLast4) return `···· ${receipt.parsedCardLast4}`;
  return "Unknown card";
}

export function receiptCardGroupKey(receipt: ReceiptListItem): string {
  const last4 = receipt.parsedCardLast4 ?? "unknown";
  const bank = receipt.bankDetected ?? receipt.cardDisplayLabel ?? "unknown";
  return `${bank}:${last4}`;
}

export function formatReceiptMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

export function formatReceiptDate(date: Date): string {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatReceiptDueDate(ymd: string | null): string | null {
  if (!ymd) return null;
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return formatReceiptDate(date);
}

export function receiptMonthGroup(
  receipt: ReceiptListItem,
  dues: ReceiptMonthDueContext[],
): { key: string; label: string } {
  if (receipt.statementPeriodKey && receipt.statementPeriodLabel) {
    return {
      key: receipt.statementPeriodKey,
      label: receipt.statementPeriodLabel,
    };
  }

  const matched = matchReceiptToDue(dues, {
    dueEntryId: receipt.dueEntryId,
    parsedCardLast4: receipt.parsedCardLast4,
    dueDateYmd: receipt.dueDateYmd,
    aiAnalysis: receipt.aiAnalysis,
    createdAt: receipt.createdAt,
  });

  if (matched) {
    return resolveStatementPeriodFromDue(matched);
  }

  if (receipt.dueDateYmd) {
    const key = receipt.dueDateYmd.slice(0, 7);
    return { key, label: formatSoaPeriodLabelFromKey(key) };
  }

  const uploaded = new Date(receipt.createdAt);
  const key = `${uploaded.getFullYear()}-${String(uploaded.getMonth() + 1).padStart(2, "0")}`;
  return { key, label: formatSoaPeriodLabelFromKey(key) };
}

export function receiptGroupPaidSummary(items: ReceiptListItem[]): {
  paidCount: number;
  totalCount: number;
} {
  return {
    totalCount: items.length,
    paidCount: items.filter((item) => item.paymentStatus === "marked_paid")
      .length,
  };
}

const PAYMENT_STATUS_RANK: Record<string, number> = {
  marked_paid: 4,
  partial: 3,
  pending: 2,
  rejected: 1,
  ai_error: 0,
};

function paymentStatusRank(status: string | null | undefined): number {
  if (!status) return 2;
  return PAYMENT_STATUS_RANK[status] ?? 2;
}

/** Identity for collapsing duplicate upload attempts of the same receipt file. */
export function receiptDuplicateIdentity(receipt: ReceiptListItem): string {
  const fileName = receipt.originalFileName?.trim().toLowerCase();
  if (fileName) return `file:${fileName}`;

  const reference = receipt.aiAnalysis?.referenceNumber?.trim();
  if (reference) return `ref:${reference}`;

  const amount =
    receipt.parsedAmountRaw?.trim() ||
    (receipt.parsedAmount != null ? String(receipt.parsedAmount) : "");
  return `amount:${amount || "unknown"}`;
}

function receiptDisplaySlotKey(
  receipt: ReceiptListItem,
  dues: ReceiptMonthDueContext[],
): string {
  const cardKey = receiptCardGroupKey(receipt);
  const periodKey = receiptMonthGroup(receipt, dues).key;
  const duplicateKey = receiptDuplicateIdentity(receipt);
  return `${cardKey}|${periodKey}|${duplicateKey}`;
}

function pickPreferredReceipt(
  current: ReceiptListItem,
  candidate: ReceiptListItem,
): ReceiptListItem {
  const currentRank = paymentStatusRank(current.paymentStatus);
  const candidateRank = paymentStatusRank(candidate.paymentStatus);
  if (candidateRank !== currentRank) {
    return candidateRank > currentRank ? candidate : current;
  }

  const currentTime = new Date(current.createdAt).getTime();
  const candidateTime = new Date(candidate.createdAt).getTime();
  return candidateTime >= currentTime ? candidate : current;
}

/** Keep the latest unique receipt per card and statement period; collapse same-file retries. */
export function dedupeReceiptsForDisplay(
  items: ReceiptListItem[],
  dues: ReceiptMonthDueContext[] = [],
): ReceiptListItem[] {
  const winners = new Map<string, ReceiptListItem>();

  for (const item of items) {
    const slotKey = receiptDisplaySlotKey(item, dues);
    const existing = winners.get(slotKey);
    winners.set(
      slotKey,
      existing ? pickPreferredReceipt(existing, item) : item,
    );
  }

  return [...winners.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export type ReceiptCardStack = {
  key: string;
  items: ReceiptListItem[];
};

const VERDICT_RANK: Record<string, number> = {
  valid: 4,
  likely_valid: 3,
  unclear: 2,
  skipped: 1,
  invalid: 0,
};

function mergeAnalysisFlag(
  values: Array<boolean | undefined>,
): boolean | undefined {
  if (values.some((value) => value === true)) return true;
  if (values.length > 0 && values.every((value) => value === false)) {
    return false;
  }
  return undefined;
}

function pickGroupVerdict(items: ReceiptListItem[]): string | null {
  const verdicts = items
    .map((item) => item.aiVerdict)
    .filter((verdict): verdict is string => Boolean(verdict));
  if (verdicts.length === 0) return null;
  if (verdicts.every((verdict) => verdict === "invalid")) return "invalid";

  return verdicts.reduce((best, verdict) =>
    (VERDICT_RANK[verdict] ?? 2) > (VERDICT_RANK[best] ?? 2) ? verdict : best,
  );
}

function combinedReceiptSummary(
  items: ReceiptListItem[],
  primary: ReceiptListItem,
): string | null {
  const unique = [
    ...new Set(
      items
        .map((item) => item.aiSummary?.trim())
        .filter((summary): summary is string => Boolean(summary)),
    ),
  ];
  if (unique.length === 1) return unique[0] ?? null;
  if (unique.length === 0) return null;

  const total = items.reduce(
    (sum, item) => sum + (item.parsedAmount ?? 0),
    0,
  );
  const amount = formatPhpAmount(total);
  const card = receiptCardLabel(primary);
  if (amount !== "—") {
    return `${items.length} receipts for ${card} totaling PHP ${amount}.`;
  }
  return `${items.length} receipts for ${card}.`;
}

/** Collapse receipt images that pay the same card and statement period. */
export function stackReceiptsByCard(items: ReceiptListItem[]): ReceiptCardStack[] {
  const map = new Map<string, ReceiptListItem[]>();

  for (const item of items) {
    const key = receiptPaymentStackKey(item);
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }

  return [...map.entries()]
    .map(([key, groupItems]) => ({
      key,
      items: groupItems.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }))
    .sort(
      (a, b) =>
        new Date(b.items[0]?.createdAt ?? 0).getTime() -
        new Date(a.items[0]?.createdAt ?? 0).getTime(),
    );
}

/**
 * One checklist and summary for every image in a stack.
 * A check passes when any image satisfies it. Amount coverage stays on the due entry.
 */
export function mergeReceiptStack(items: ReceiptListItem[]): ReceiptListItem {
  const [first] = items;
  if (!first) {
    throw new Error("Cannot merge an empty receipt stack");
  }
  if (items.length === 1) return first;

  const primary = items.reduce((current, candidate) =>
    pickPreferredReceipt(current, candidate),
  );
  const analyses = items.map((item) => item.aiAnalysis);
  const paymentDates = analyses
    .map((analysis) => analysis?.paymentDate)
    .filter((date): date is string => Boolean(date));
  const alignedDate = paymentDates.find(
    (date) =>
      primary.dueDateYmd != null &&
      date.slice(0, 7) === primary.dueDateYmd.slice(0, 7),
  );
  const references = [
    ...new Set(
      analyses
        .map((analysis) => analysis?.referenceNumber?.trim())
        .filter((reference): reference is string => Boolean(reference)),
    ),
  ];
  const confidences = analyses
    .map((analysis) => analysis?.confidence)
    .filter((value): value is number => typeof value === "number");
  const modelErrors = analyses
    .map((analysis) => analysis?.aiModelError)
    .filter((error): error is string => Boolean(error));
  const everyImageErrored =
    analyses.length > 0 &&
    analyses.every((analysis) => Boolean(analysis?.aiModelError));

  return {
    ...primary,
    aiVerdict: pickGroupVerdict(items),
    aiSummary: combinedReceiptSummary(items, primary),
    aiAnalysis: {
      confidence:
        confidences.length > 0 ? Math.max(...confidences) : null,
      hasAmount: mergeAnalysisFlag(analyses.map((analysis) => analysis?.hasAmount)),
      hasDate: mergeAnalysisFlag(analyses.map((analysis) => analysis?.hasDate)),
      hasReference: mergeAnalysisFlag(
        analyses.map((analysis) => analysis?.hasReference),
      ),
      isCreditCardPayment: mergeAnalysisFlag(
        analyses.map((analysis) => analysis?.isCreditCardPayment),
      ),
      paymentDate: alignedDate ?? paymentDates[0],
      referenceNumber: references.join(", ") || undefined,
      aiModelError: everyImageErrored ? modelErrors[0] : undefined,
    },
  };
}

export function groupReceipts(
  items: ReceiptListItem[],
  mode: ReceiptGroupMode,
  dues: ReceiptMonthDueContext[] = [],
): ReceiptGroup[] {
  const map = new Map<string, ReceiptGroup>();

  for (const item of items) {
    if (mode === "month") {
      const { key, label } = receiptMonthGroup(item, dues);
      const group = map.get(key) ?? { key, label, items: [] };
      group.items.push(item);
      map.set(key, group);
      continue;
    }

    const key = receiptCardGroupKey(item);
    const label = receiptCardLabel(item);
    const group = map.get(key) ?? { key, label, items: [] };
    group.items.push(item);
    map.set(key, group);
  }

  return [...map.values()].sort((a, b) => {
    if (mode === "month") return b.key.localeCompare(a.key);
    return a.label.localeCompare(b.label);
  });
}
