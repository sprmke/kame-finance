import { and, count, desc, eq, isNull } from "drizzle-orm";

import {
  currentOverviewPeriod,
  dueMatchesSpan,
  formatOverviewPeriodLabel,
  manilaToday,
  overviewPeriodSpan,
  parseOverviewPeriod,
  pickPeriodIdForMonth,
  spanIncludesMonth,
  type OverviewStatsInput,
} from "@/features/dashboard/overview/lib/overview-period";
import { rollupStatementMonths } from "@/features/dashboard/overview/lib/overview-range-stats";
import {
  computePeriodOverviewStats,
  flattenStatementTransactions,
} from "@/features/dashboard/soa/lib/period-overview-stats";
import { db } from "@/lib/db";
import {
  creditCards,
  dueEntries,
  soaPeriods,
  soaStatements,
} from "@/lib/db/schema";
import { daysUntilYmd, todayYmdLocal } from "@/lib/reminders/reminder-status";

import { reminderService } from "./reminder.service";
import { soaPeriodService } from "./soa-period.service";

export const overviewService = {
  async getStats(userId: string, input?: OverviewStatsInput) {
    const asOf = todayYmdLocal();
    const selected = input
      ? parseOverviewPeriod({
          grain: input.grain,
          year: String(input.year),
          month: String(input.month),
        })
      : currentOverviewPeriod();
    const span = overviewPeriodSpan(selected);
    const today = manilaToday();
    const includesToday = spanIncludesMonth(span, today.year, today.month);

    const [
      cardsCount,
      unpaidCount,
      statementsCount,
      periodCount,
      unpaidDueRows,
      reminderStatus,
      rangeBundle,
      periodRows,
      lastSoa,
    ] = await Promise.all([
      db
        .select({ value: count() })
        .from(creditCards)
        .where(
          and(eq(creditCards.userId, userId), isNull(creditCards.deletedAt)),
        )
        .then(([row]) => row?.value ?? 0),
      db
        .select({ value: count() })
        .from(dueEntries)
        .where(
          and(
            eq(dueEntries.userId, userId),
            isNull(dueEntries.paidAt),
            eq(dueEntries.source, "soa"),
          ),
        )
        .then(([row]) => row?.value ?? 0),
      db
        .select({ value: count() })
        .from(soaStatements)
        .where(eq(soaStatements.userId, userId))
        .then(([row]) => row?.value ?? 0),
      db
        .select({ value: count() })
        .from(soaPeriods)
        .where(eq(soaPeriods.userId, userId))
        .then(([row]) => row?.value ?? 0),
      reminderService.listDueEntries(userId, true),
      includesToday
        ? reminderService.getReminderStatus(userId)
        : Promise.resolve({ readyCount: 0, inWindowCount: 0 }),
      soaPeriodService.loadRangeBundle(userId, span),
      db.query.soaPeriods.findMany({
        where: eq(soaPeriods.userId, userId),
        columns: {
          id: true,
          fromMonth: true,
          fromYear: true,
          toMonth: true,
          toYear: true,
        },
      }),
      db.query.soaStatements.findFirst({
        where: eq(soaStatements.userId, userId),
        orderBy: [desc(soaStatements.createdAt)],
      }),
    ]);

    const upcomingDues = unpaidDueRows
      .filter((row) => dueMatchesSpan(row, span))
      .map((row) => ({
        id: row.id,
        issuerId: row.issuerId,
        bankLabel: row.bankLabel,
        cardLast4: row.cardLast4,
        cardDisplayLabel: row.cardDisplayLabel,
        dueDate: row.dueDate,
        dueDateYmd: row.dueDateYmd,
        statementPeriodKey: row.statementPeriodKey,
        statementPeriodLabel: row.statementPeriodLabel,
        minimumDue: row.minimumDue,
        totalDue: row.totalDue,
        paidAt: row.paidAt,
        source: row.source,
        daysAway: daysUntilYmd(row.dueDateYmd, asOf),
      }));

    const rolled = rollupStatementMonths(
      rangeBundle.statements,
      rangeBundle.dueRows,
    );
    const categoryStats = computePeriodOverviewStats(
      flattenStatementTransactions(rangeBundle.statements),
    );

    const period =
      rolled.statementCount === 0
        ? null
        : {
            id:
              selected.grain === "month"
                ? pickPeriodIdForMonth(
                    periodRows,
                    selected.month,
                    selected.year,
                  )
                : null,
            label: formatOverviewPeriodLabel(selected),
            cardCount: rolled.cardCount,
            paidCardCount: rolled.paidCardCount,
            minimumMetCardCount: rolled.minimumMetCardCount,
            statementCount: rolled.statementCount,
            totalDue: rolled.totalDue,
            totalMinimum: rolled.totalMinimum,
            grossStatementDue: rolled.grossStatementDue,
            grossMinimumDue: rolled.grossMinimumDue,
            totalPaid: rolled.totalPaid,
            nextDueYmd: rolled.nextDueYmd,
            spendTotal: categoryStats.spendTotal,
            unanalyzed: categoryStats.unanalyzed,
            interestFeesTotal: categoryStats.interestFeesTotal,
            topCategory: categoryStats.topCategory
              ? {
                  label: categoryStats.topCategory.label,
                  share: categoryStats.topCategoryShare,
                }
              : null,
            analyzedCategoryRows: categoryStats.analyzedRows,
            periodCards: rolled.periodCards,
          };

    return {
      cards: cardsCount,
      unpaidDues: unpaidCount,
      statements: statementsCount,
      periodCount,
      reminders: {
        readyCount: reminderStatus.readyCount,
        inWindowCount: reminderStatus.inWindowCount,
      },
      missingSoaCount: includesToday
        ? unpaidDueRows.filter((row) => row.source === "expected").length
        : 0,
      period,
      upcomingDues,
      lastSoaAt: lastSoa?.createdAt ?? null,
    };
  },
};
