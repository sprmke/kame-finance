"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { keepPreviousData } from "@tanstack/react-query";

import { MonthCalendar, MonthCalendarLegend } from "@/components/calendar/MonthCalendar";
import { ErrorState } from "@/components/shared/ErrorState";
import { OverviewContentSkeleton } from "@/components/shared/skeletons";
import { ROUTES } from "@/config/routes";
import { useQuickActions } from "@/features/dashboard/components/shell/QuickActionsProvider";
import { SoaPeriodSpendByCategoryCard } from "@/features/dashboard/soa/components/SoaPeriodOverviewCards";
import { soaPeriodHref } from "@/features/dashboard/soa/lib/soa-period-query";
import { api } from "@/lib/api/client";
import { formatPhpAmount } from "@/lib/utils/format-money";

import { buildMonthEvents } from "../lib/home-calendar";
import {
  formatOverviewPeriodLabel,
  overviewStatsInput,
  parseOverviewPeriod,
  type OverviewPeriod,
} from "../lib/overview-period";
import { FirstRunChecklist } from "./FirstRunChecklist";
import { MonthHeader } from "./MonthHeader";
import { MonthLedger } from "./MonthLedger";
import { NeedsYouList, type NeedsYouExtra } from "./NeedsYouList";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type OverviewPageProps = OverviewPeriod;

export function OverviewPage({ grain, year, month }: OverviewPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const actions = useQuickActions();
  const [period, setPeriod] = useState<OverviewPeriod>({ grain, year, month });
  const [selectedYmd, setSelectedYmd] = useState<string | null>(null);

  useEffect(() => {
    setPeriod({ grain, year, month });
  }, [grain, year, month]);

  const statsQuery = api.overview.stats.useQuery(overviewStatsInput(period), {
    placeholderData: keepPreviousData,
  });
  const { data: stats, isLoading, isFetching, isPlaceholderData, error } = statsQuery;
  const { data: googleAccounts } = api.integrations.listGoogleAccounts.useQuery(undefined, {
    enabled: stats !== undefined && stats.cards === 0,
  });

  function commit(next: OverviewPeriod) {
    const safe = parseOverviewPeriod({
      grain: next.grain,
      year: String(next.year),
      month: String(next.month),
    });
    setPeriod(safe);
    setSelectedYmd(null);
    const input = overviewStatsInput(safe);
    const params = new URLSearchParams();
    if (input) {
      params.set("grain", input.grain);
      params.set("year", String(input.year));
      params.set("month", String(input.month));
    }
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, {
      scroll: false,
    });
  }

  const label = formatOverviewPeriodLabel(period);
  const showing = stats?.period ?? null;
  const pending = (isLoading || isPlaceholderData) && !stats;

  const events = useMemo(
    () =>
      stats && period.grain === "month"
        ? buildMonthEvents({
            year: period.year,
            month: period.month,
            dues: stats.calendarDues,
            cards: stats.calendarCards,
          })
        : [],
    [stats, period],
  );

  const extras = useMemo((): NeedsYouExtra[] => {
    if (!stats) return [];
    const items: NeedsYouExtra[] = [];
    const reminderCount = stats.reminders.readyCount;
    if (reminderCount > 0) {
      items.push({
        key: "reminders",
        icon: "reminders",
        label: `${reminderCount} reminder${reminderCount === 1 ? "" : "s"} ready to send`,
        detail: "Payment reminders run daily",
        href: ROUTES.dashboard.settingsSection("automations"),
      });
    }
    const belowMinimum = (showing?.periodCards ?? []).filter(
      (card) => card.markedPaid && !card.minimumMet && card.grossMinimumDue > 0,
    );
    for (const card of belowMinimum) {
      items.push({
        key: `min-${card.issuerId}-${card.cardLast4}-${card.statementPeriodKey}`,
        icon: "minimum",
        label: `${card.label} is below minimum`,
        detail: `Paid ${formatPhpAmount(card.paidAmount)} of ${formatPhpAmount(card.grossMinimumDue)}`,
        href: ROUTES.dashboard.bills,
      });
    }
    if (showing && showing.unanalyzed > 0 && showing.id) {
      items.push({
        key: "uncategorized",
        icon: "uncategorized",
        label: `${showing.unanalyzed} uncategorized transaction${showing.unanalyzed === 1 ? "" : "s"}`,
        detail: "Categorize them for accurate spend",
        href: soaPeriodHref(showing.id, { tab: "transactions" }),
      });
    }
    return items;
  }, [stats, showing]);

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <MonthHeader period={period} onChange={commit} onRunSoa={actions.runSoa} />
        <ErrorState title="Couldn't load this month" error={error} onRetry={() => void statsQuery.refetch()} />
      </div>
    );
  }

  const statementsHref = (
    showing?.id ? ROUTES.dashboard.statementPeriod(showing.id) : ROUTES.dashboard.statements
  ) as Route;
  const firstRun = stats !== undefined && (stats.cards === 0 || stats.statements === 0);

  return (
    <div className="space-y-6" aria-busy={isFetching}>
      <MonthHeader
        period={period}
        onChange={commit}
        onRunSoa={actions.runSoa}
        runSoaPending={actions.runSoaPending}
      />
      {isFetching ? (
        <span className="sr-only" aria-live="polite">
          Loading {label}
        </span>
      ) : null}

      {pending || !stats ? (
        <OverviewContentSkeleton />
      ) : (
        <div key={`${period.grain}-${period.year}-${period.month}`} className="kame-sheet-in space-y-6">
          {firstRun ? (
            <FirstRunChecklist
              googleConnected={(googleAccounts?.length ?? 0) > 0 || stats.cards > 0}
              hasCards={stats.cards > 0}
              hasStatements={stats.statements > 0}
              onAddCard={actions.addCard}
              onRunSoa={actions.runSoa}
            />
          ) : null}

          {period.grain === "month" ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <section aria-label={`${label} calendar`} className="min-w-0 space-y-3">
                <div className="rounded-lg border bg-card px-2 pb-1 pt-3 sm:px-3">
                  <MonthCalendar
                    year={period.year}
                    month={period.month}
                    todayYmd={stats.asOf}
                    events={events}
                    selectedYmd={selectedYmd}
                    onSelectDay={setSelectedYmd}
                  />
                </div>
                <MonthCalendarLegend className="px-1" />
              </section>
              <NeedsYouList
                dues={stats.calendarDues}
                extras={extras}
                selectedYmd={selectedYmd}
                onClearDay={() => setSelectedYmd(null)}
                onUploadReceipt={(id) => actions.uploadReceipt(id)}
                onRunSoa={actions.runSoa}
                uploadPending={actions.receiptUploadPending}
              />
            </div>
          ) : (
            <YearMonths year={period.year} onPick={(m) => commit({ grain: "month", year: period.year, month: m })} />
          )}

          {showing ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <MonthLedger
                title={period.grain === "year" ? `${period.year} summary` : "Month summary"}
                statementsHref={statementsHref}
                grossStatementDue={showing.grossStatementDue}
                totalPaid={showing.totalPaid}
                outstandingDue={showing.totalDue}
                grossMinimumDue={showing.grossMinimumDue}
                minimumMetCardCount={showing.minimumMetCardCount}
                cardCount={showing.cardCount}
                paidCardCount={showing.paidCardCount}
                nextDueYmd={showing.nextDueYmd}
                interestFeesTotal={showing.interestFeesTotal}
                spendTotal={showing.spendTotal}
                topCategory={showing.topCategory}
                unanalyzedCount={showing.unanalyzed}
              />
              <SoaPeriodSpendByCategoryCard
                rows={showing.analyzedCategoryRows}
                spendTotal={showing.spendTotal}
                onSelectCategory={
                  showing.id
                    ? (slug) => {
                        if (!showing.id) return;
                        router.push(soaPeriodHref(showing.id, { tab: "analytics", category: slug }));
                      }
                    : undefined
                }
              />
            </div>
          ) : !firstRun ? (
            <p className="rounded-lg border border-dashed px-4 py-6 text-center text-13 text-muted-foreground">
              No statements for {label} yet.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function YearMonths({ year, onPick }: { year: number; onPick: (month: number) => void }) {
  return (
    <div className="grid grid-cols-3 overflow-hidden rounded-lg border bg-card sm:grid-cols-4 lg:grid-cols-6">
      {MONTH_SHORT.map((name, index) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(index + 1)}
          className="flex min-h-16 flex-col items-start justify-between border-b border-r px-3 py-2.5 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="font-headline text-sm uppercase">{name}</span>
          <span className="font-numeral text-xs text-muted-foreground">{year}</span>
        </button>
      ))}
    </div>
  );
}
