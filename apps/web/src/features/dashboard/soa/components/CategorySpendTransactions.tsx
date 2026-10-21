"use client";

import { CANNOT_ANALYZE_SLUG } from "@/lib/transactions/categories";
import { cn } from "@/lib/utils/cn";

import type { PeriodTransaction } from "../lib/period-overview-stats";
import { TransactionCategorySelect } from "./TransactionCategorySelect";
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
            className={cn(
              "flex items-start justify-between gap-3 py-3 first:pt-2 last:pb-2",
              meta.row && "rounded-md px-2 -mx-2",
              meta.row,
            )}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="truncate text-sm font-medium leading-snug">
                  {description}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {dateLabel}
                    {showCard ? ` · ${cardIdentity(tx)}` : null}
                  </p>
                  {meta.label ? (
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                        meta.badge,
                      )}
                    >
                      {meta.label}
                    </span>
                  ) : null}
                </div>
              </div>
              <TransactionCategorySelect
                transactionId={tx.id}
                value={tx.categorySlug ?? CANNOT_ANALYZE_SLUG}
                ariaLabel={`Category for ${description}`}
                className="h-11 w-full max-w-none sm:w-[11rem] sm:max-w-[11rem]"
              />
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
