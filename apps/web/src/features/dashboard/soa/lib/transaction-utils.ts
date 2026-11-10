export type TransactionKind =
  | "credit"
  | "payment"
  | "interest"
  | "fee"
  | "purchase";

import {
  CANNOT_ANALYZE_SLUG,
  type TransactionCategorySlug,
} from "@/lib/transactions/categories";
import { DATE_PAIR_SPLIT } from "@/lib/soa/transaction-dates";

export type SoaTransaction = {
  id: string;
  date: string | null;
  description: string;
  amount: string;
  categorySlug?: TransactionCategorySlug | string | null;
  categoryLabel?: string | null;
  categorySource?: string | null;
};

export function isCreditAmount(amount: string): boolean {
  return /\(CR\)/i.test(amount) || amount.trim().startsWith("-");
}

export function parseTransactionAmount(raw: string): number {
  const n = Number.parseFloat(
    raw
      .replace(/\(CR\)/gi, "")
      .replace(/,/g, "")
      .replace(/^-/, "")
      .trim(),
  );
  return Number.isFinite(n) ? n : 0;
}

export function classifyTransaction(
  description: string,
  amount: string,
): TransactionKind {
  if (isCreditAmount(amount)) {
    if (/payment|paid|thank you|autopay|auto-pay/i.test(description)) {
      return "payment";
    }
    return "credit";
  }
  if (/interest\s+charge/i.test(description)) return "interest";
  if (
    /\b(fee|annual fee|late charge|finance charge|service charge|overlimit)\b/i.test(
      description,
    )
  ) {
    return "fee";
  }
  if (/payment|paid/i.test(description)) return "payment";
  return "purchase";
}

export function isInterestOrFeeKind(kind: TransactionKind): boolean {
  return kind === "interest" || kind === "fee";
}

const INTEREST_FEES_KIND_META = {
  row: "",
  amount: "text-due font-semibold",
  badge: "bg-due-wash text-due",
  label: "Interest & fees",
} as const;

export const TRANSACTION_KIND_META: Record<
  TransactionKind,
  { row: string; amount: string; badge: string; label: string | null }
> = {
  credit: {
    row: "",
    amount: "text-success font-semibold",
    badge: "bg-success-wash text-success",
    label: "Credit",
  },
  payment: {
    row: "",
    amount: "text-success font-semibold",
    badge: "bg-accent text-accent-foreground",
    label: "Payment",
  },
  interest: { ...INTEREST_FEES_KIND_META },
  fee: { ...INTEREST_FEES_KIND_META },
  purchase: {
    row: "",
    amount: "text-foreground",
    badge: "",
    label: null,
  },
};

export function formatTransactionAmountDisplay(amount: string): string {
  const isCredit = isCreditAmount(amount);
  const value = parseTransactionAmount(amount);
  const formatted = value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isCredit ? `−${formatted}` : formatted;
}

export function sumTransactionsByKind(
  transactions: SoaTransaction[],
  kinds: TransactionKind[],
): number {
  return transactions.reduce((sum, t) => {
    const kind = classifyTransaction(t.description, t.amount);
    if (!kinds.includes(kind)) return sum;
    return sum + parseTransactionAmount(t.amount);
  }, 0);
}

export function groupTransactionsByDate(
  transactions: SoaTransaction[],
): { date: string; items: SoaTransaction[] }[] {
  const map = new Map<string, SoaTransaction[]>();

  for (const tx of transactions) {
    const key = tx.date?.trim() || "Undated";
    const list = map.get(key) ?? [];
    list.push(tx);
    map.set(key, list);
  }

  return [...map.entries()].map(([date, items]) => ({ date, items }));
}

export type ParsedTransactionDate =
  import("@/lib/soa/transaction-dates").ParsedTransactionDate;

export { DATE_PAIR_SPLIT } from "@/lib/soa/transaction-dates";

export {
  formatTransactionDateToken as formatTransactionDatePart,
  parseTransactionDate,
  transactionDateSortKey,
} from "@/lib/soa/transaction-dates";

export function transactionHasDualDates(
  transactions: SoaTransaction[],
): boolean {
  return transactions.some((tx) => DATE_PAIR_SPLIT.test(tx.date ?? ""));
}

/** Drop leading `(MM/DD)` from description when dates are shown in their own columns. */
export function cleanTransactionDescription(description: string): string {
  return description.replace(/^\(\d{1,2}\/\d{1,2}\)\s*/, "").trim();
}
