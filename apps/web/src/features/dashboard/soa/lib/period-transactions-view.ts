import { CANNOT_ANALYZE_SLUG } from "@/lib/transactions/categories";

import type { PeriodTransaction } from "./period-overview-stats";
import {
  classifyTransaction,
  cleanTransactionDescription,
  parseTransactionAmount,
  type TransactionKind,
} from "./transaction-utils";

export type PeriodTxGroupMode = "flat" | "card" | "category";

export type PeriodTxSort = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

export type PeriodTxFilters = {
  search: string;
  cardKey: string;
  categorySlug: string;
  kind: string;
};

export type PeriodTxGroup = {
  key: string;
  label: string;
  transactions: PeriodTransaction[];
  spendTotal: number;
};

export function cardKeyForTransaction(tx: PeriodTransaction): string {
  return `${tx.issuerId}:${tx.cardLast4}`;
}

export function cardLabelForTransaction(tx: PeriodTransaction): string {
  return `${tx.bankLabel} ···· ${tx.cardLast4}`;
}

export function categoryKeyForTransaction(tx: PeriodTransaction): string {
  return tx.categorySlug ?? CANNOT_ANALYZE_SLUG;
}

export function categoryLabelForTransaction(tx: PeriodTransaction): string {
  return tx.categoryLabel ?? "Cannot analyze";
}

function matchesSearch(tx: PeriodTransaction, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    cleanTransactionDescription(tx.description),
    tx.bankLabel,
    tx.cardLast4,
    tx.categoryLabel ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function matchesKind(tx: PeriodTransaction, kind: string): boolean {
  if (!kind || kind === "all") return true;
  const actual = classifyTransaction(tx.description, tx.amount);
  return actual === kind;
}

export function filterPeriodTransactions(
  transactions: PeriodTransaction[],
  filters: PeriodTxFilters,
): PeriodTransaction[] {
  return transactions.filter((tx) => {
    if (!matchesSearch(tx, filters.search)) return false;
    if (
      filters.cardKey &&
      filters.cardKey !== "all" &&
      cardKeyForTransaction(tx) !== filters.cardKey
    ) {
      return false;
    }
    if (
      filters.categorySlug &&
      filters.categorySlug !== "all" &&
      categoryKeyForTransaction(tx) !== filters.categorySlug
    ) {
      return false;
    }
    if (!matchesKind(tx, filters.kind)) return false;
    return true;
  });
}

function compareDateStrings(a: string | null, b: string | null): number {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

export function sortPeriodTransactions(
  transactions: PeriodTransaction[],
  sort: PeriodTxSort,
): PeriodTransaction[] {
  const copy = [...transactions];
  copy.sort((a, b) => {
    switch (sort) {
      case "date_asc":
        return compareDateStrings(a.date, b.date);
      case "date_desc":
        return compareDateStrings(b.date, a.date);
      case "amount_asc":
        return parseTransactionAmount(a.amount) - parseTransactionAmount(b.amount);
      case "amount_desc":
        return parseTransactionAmount(b.amount) - parseTransactionAmount(a.amount);
      default:
        return 0;
    }
  });
  return copy;
}

export function sumPositiveSpend(transactions: PeriodTransaction[]): number {
  return transactions.reduce((sum, tx) => {
    const amount = parseTransactionAmount(tx.amount);
    const kind = classifyTransaction(tx.description, tx.amount);
    if (kind === "credit" || kind === "payment") return sum;
    return amount > 0 ? sum + amount : sum;
  }, 0);
}

export function groupPeriodTransactions(
  transactions: PeriodTransaction[],
  mode: PeriodTxGroupMode,
): PeriodTxGroup[] {
  if (mode === "flat") {
    return [
      {
        key: "flat",
        label: "",
        transactions,
        spendTotal: sumPositiveSpend(transactions),
      },
    ];
  }

  const map = new Map<string, PeriodTransaction[]>();

  for (const tx of transactions) {
    const key =
      mode === "card"
        ? cardKeyForTransaction(tx)
        : categoryKeyForTransaction(tx);
    const list = map.get(key) ?? [];
    list.push(tx);
    map.set(key, list);
  }

  const groups = [...map.entries()].map(([key, items]) => {
    const sample = items[0]!;
    const label =
      mode === "card"
        ? cardLabelForTransaction(sample)
        : categoryLabelForTransaction(sample);
    return {
      key,
      label,
      transactions: items,
      spendTotal: sumPositiveSpend(items),
    };
  });

  groups.sort((a, b) => a.label.localeCompare(b.label));
  return groups;
}

export function listCardFilterOptions(
  transactions: PeriodTransaction[],
): { key: string; label: string }[] {
  const map = new Map<string, string>();
  for (const tx of transactions) {
    const key = cardKeyForTransaction(tx);
    if (!map.has(key)) map.set(key, cardLabelForTransaction(tx));
  }
  return [...map.entries()]
    .map(([key, label]) => ({ key, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function listCategoryFilterOptions(
  transactions: PeriodTransaction[],
): { slug: string; label: string }[] {
  const map = new Map<string, string>();
  for (const tx of transactions) {
    const slug = categoryKeyForTransaction(tx);
    if (!map.has(slug)) {
      map.set(slug, categoryLabelForTransaction(tx));
    }
  }
  return [...map.entries()]
    .map(([slug, label]) => ({ slug, label }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const PERIOD_TX_KIND_OPTIONS: { value: TransactionKind | "all"; label: string }[] =
  [
    { value: "all", label: "All types" },
    { value: "purchase", label: "Purchase" },
    { value: "payment", label: "Payment" },
    { value: "credit", label: "Credit" },
    { value: "interest", label: "Interest" },
    { value: "fee", label: "Fee" },
  ];
