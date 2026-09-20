"use client";

import { cn } from "@/lib/utils/cn";

import type { PeriodTransaction } from "../lib/period-overview-stats";
import {
  classifyTransaction,
  cleanTransactionDescription,
  formatTransactionAmountDisplay,
  parseTransactionDate,
  TRANSACTION_KIND_META,
} from "../lib/transaction-utils";

type CategorySpendTransactionsProps = {
  transactions: PeriodTransaction[];
  className?: string;
};

function cardIdentity(tx: PeriodTransaction): string {
  return `${tx.bankLabel} ···· ${tx.cardLast4}`;
}

export function CategorySpendTransactions({
  transactions,
  className,
}: CategorySpendTransactionsProps) {
  const showCard =
    new Set(transactions.map((tx) => `${tx.issuerId}:${tx.cardLast4}`)).size >
    1;

  if (!transactions.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No transactions.
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-border/60", className)}>
      {transactions.map((tx) => {
        const kind = classifyTransaction(tx.description, tx.amount);
        const meta = TRANSACTION_KIND_META[kind];
        const dates = parseTransactionDate(tx.date, tx.issuerId);
        const dateLabel = dates.posted ?? "—";
        const description = cleanTransactionDescription(tx.description);

        return (
          <li
            key={tx.id}
            className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-snug">
                {description}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {dateLabel}
                {showCard ? ` · ${cardIdentity(tx)}` : null}
              </p>
            </div>
            <p
              className={cn(
                "shrink-0 pt-0.5 text-sm font-semibold tabular-nums",
                meta.amount,
              )}
            >
              {formatTransactionAmountDisplay(tx.amount)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
