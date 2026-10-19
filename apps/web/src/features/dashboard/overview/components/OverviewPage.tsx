"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { keepPreviousData } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { OverviewContentSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import {
  SoaPeriodSpendByCategoryCard,
  SoaPeriodSummaryCard,
} from "@/features/dashboard/soa/components/SoaPeriodOverviewCards";
import { api } from "@/lib/api/client";
import {
  formatOverviewPeriodLabel,
  overviewStatsInput,
  parseOverviewPeriod,
  type OverviewPeriod,
} from "../lib/overview-period";
import { OverviewPeriodMission } from "./OverviewPeriodMission";
import { OverviewPeriodSwitcher } from "./OverviewPeriodSwitcher";

type OverviewPageProps = OverviewPeriod;

export function OverviewPage({ grain, year, month }: OverviewPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<OverviewPeriod>({ grain, year, month });

  useEffect(() => {
    setPeriod({ grain, year, month });
  }, [grain, year, month]);

  const { data: stats, isLoading, isFetching, isPlaceholderData, error } =
    api.overview.stats.useQuery(overviewStatsInput(period), {
      placeholderData: keepPreviousData,
    });

  function commit(next: OverviewPeriod) {
    const safe = parseOverviewPeriod({
      grain: next.grain,
      year: String(next.year),
      month: String(next.month),
    });
    setPeriod(safe);
    const input = overviewStatsInput(safe);
    const params = new URLSearchParams();
    if (input) {
      params.set("grain", input.grain);
      params.set("year", String(input.year));
      params.set("month", String(input.month));
    }
    const query = params.toString();
    const href = (query ? `${pathname}?${query}` : pathname) as Route;
    router.replace(href, { scroll: false });
  }

  const label = formatOverviewPeriodLabel(period);
  const showingPeriod = stats?.period ?? null;
  const contentPending = isLoading || isPlaceholderData;

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Overview"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <OverviewPeriodSwitcher period={period} onChange={commit} />
            <Button asChild>
              <Link href={ROUTES.dashboard.soa}>Run SOA</Link>
            </Button>
          </div>
        }
      />

      {!contentPending && (stats?.missingSoaCount ?? 0) > 0 ? (
        <Card className="border-warning/50 bg-warning/10 shadow-card">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="font-display font-semibold">SOA missing</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.missingSoaCount} card
                  {stats?.missingSoaCount === 1 ? "" : "s"} past the statement
                  date without an SOA. Check email or upload manually.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.dashboard.reminders}>
                View due dates
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {error && !stats ? (
        <p className="text-destructive">
          Failed to load dashboard. Please refresh.
        </p>
      ) : contentPending && !showingPeriod ? (
        <OverviewContentSkeleton />
      ) : showingPeriod ? (
        <div className="space-y-8" aria-busy={isFetching}>
          {isFetching ? (
            <span className="sr-only" aria-live="polite">
              Loading {label}
            </span>
          ) : null}
          <OverviewPeriodMission
            periodLabel={showingPeriod.label}
            soaHref={
              (showingPeriod.id
                ? ROUTES.dashboard.soaPeriod(showingPeriod.id)
                : ROUTES.dashboard.soa) as Route
            }
            paidCardCount={showingPeriod.paidCardCount}
            cardCount={showingPeriod.cardCount}
            totalPaid={showingPeriod.totalPaid}
            outstandingDue={showingPeriod.totalDue}
            grossStatementDue={showingPeriod.grossStatementDue}
            grossMinimumDue={showingPeriod.grossMinimumDue}
            minimumRemaining={showingPeriod.totalMinimum}
            minimumMetCardCount={showingPeriod.minimumMetCardCount}
            nextDueYmd={showingPeriod.nextDueYmd}
            periodCards={showingPeriod.periodCards}
            upcomingDues={stats?.upcomingDues ?? []}
            remindersReady={stats?.reminders.readyCount ?? 0}
            remindersInWindow={stats?.reminders.inWindowCount ?? 0}
            unanalyzedCount={showingPeriod.unanalyzed}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <SoaPeriodSpendByCategoryCard
              rows={showingPeriod.analyzedCategoryRows}
              spendTotal={showingPeriod.spendTotal}
            />
            <SoaPeriodSummaryCard
              totalPaid={showingPeriod.totalPaid}
              outstandingDue={showingPeriod.totalDue}
              grossStatementDue={showingPeriod.grossStatementDue}
              grossMinimumDue={showingPeriod.grossMinimumDue}
              minimumRemaining={showingPeriod.totalMinimum}
              minimumMetCardCount={showingPeriod.minimumMetCardCount}
              cardCount={showingPeriod.cardCount}
              paidCardCount={showingPeriod.paidCardCount}
              nextDueYmd={showingPeriod.nextDueYmd}
              spendTotal={showingPeriod.spendTotal}
              topCategory={showingPeriod.topCategory ?? undefined}
              interestFeesTotal={showingPeriod.interestFeesTotal}
              unanalyzedCount={showingPeriod.unanalyzed}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center shadow-card">
          <p className="font-display text-lg font-semibold">
            No SOA for {label}
          </p>
          {period.grain === "month" &&
          overviewStatsInput(period) === undefined ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Run SOA to fetch statements and track payments.
            </p>
          ) : null}
          <Button className="mt-6" asChild>
            <Link href={ROUTES.dashboard.soa}>Run SOA</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
