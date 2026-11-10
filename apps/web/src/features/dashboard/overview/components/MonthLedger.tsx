import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";

import { formatShortDate } from "@/components/calendar/DateNumeral";
import { Amount } from "@/components/shared/Amount";
import { Ledger, LedgerRow } from "@/components/shared/Ledger";
import { Button } from "@/components/ui/button";

type MonthLedgerProps = {
  title: string;
  statementsHref: Route;
  grossStatementDue: number;
  totalPaid: number;
  outstandingDue: number;
  grossMinimumDue: number;
  minimumMetCardCount: number;
  cardCount: number;
  paidCardCount: number;
  nextDueYmd: string | null;
  interestFeesTotal: number;
  spendTotal: number;
  topCategory?: { label: string; share: number | null } | null;
  unanalyzedCount: number;
};

/** The month's books: one paid/total bar, then ledger rows. */
export function MonthLedger({
  title,
  statementsHref,
  grossStatementDue,
  totalPaid,
  outstandingDue,
  grossMinimumDue,
  minimumMetCardCount,
  cardCount,
  paidCardCount,
  nextDueYmd,
  interestFeesTotal,
  spendTotal,
  topCategory,
  unanalyzedCount,
}: MonthLedgerProps) {
  const statementTotal = grossStatementDue > 0 ? grossStatementDue : totalPaid + outstandingDue;
  const paidShare = statementTotal > 0 ? Math.min(100, (totalPaid / statementTotal) * 100) : 0;

  return (
    <section aria-labelledby="month-ledger-title" className="rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 id="month-ledger-title">{title}</h2>
        <Button asChild variant="ghost" size="sm" className="-mr-2">
          <Link href={statementsHref}>
            Statements
            <ArrowRight />
          </Link>
        </Button>
      </div>
      <div className="space-y-3 px-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <Amount value={outstandingDue} size="xl" tone={outstandingDue > 0 ? "default" : "success"} />
          </div>
          <p className="pb-1 text-right text-xs text-muted-foreground">
            <span className="font-numeral text-base text-foreground">{Math.round(paidShare)}%</span>{" "}
            paid
          </p>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Paid share of statement total"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(paidShare)}
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-300 ease-out"
            style={{ width: `${paidShare}%` }}
          />
        </div>
      </div>
      <Ledger className="px-4 pb-1 pt-1">
        <LedgerRow label="Statement total" value={<Amount value={statementTotal} />} />
        <LedgerRow label="Paid" value={<Amount value={totalPaid} tone="success" />} />
        <LedgerRow label="Minimum due" value={<Amount value={grossMinimumDue} />} />
        <LedgerRow
          label="Minimum met"
          value={
            <span className="text-sm font-semibold tabular-nums">
              {minimumMetCardCount}/{cardCount}
            </span>
          }
        />
        <LedgerRow
          label="Cards paid"
          value={
            <span className="text-sm font-semibold tabular-nums">
              {paidCardCount}/{cardCount}
            </span>
          }
        />
        <LedgerRow
          label="Next due"
          value={<span className="text-sm font-semibold">{nextDueYmd ? formatShortDate(nextDueYmd) : "—"}</span>}
        />
        <LedgerRow label="Spend tracked" value={<Amount value={spendTotal} />} />
        {topCategory ? (
          <LedgerRow
            label="Top category"
            value={
              <span className="text-sm font-semibold">
                {topCategory.label}
                {topCategory.share !== null ? (
                  <span className="text-muted-foreground"> · {topCategory.share}%</span>
                ) : null}
              </span>
            }
          />
        ) : null}
        <LedgerRow
          label="Interest & fees"
          value={<Amount value={interestFeesTotal} tone={interestFeesTotal > 0 ? "due" : "muted"} />}
        />
        {unanalyzedCount > 0 ? (
          <LedgerRow
            label="Uncategorized"
            value={<span className="text-sm font-semibold tabular-nums">{unanalyzedCount}</span>}
          />
        ) : null}
      </Ledger>
    </section>
  );
}
