import {
  statementMonthForDueYmd,
  statementPeriodOrdinal,
  targetStatementMonthForCard,
  type CardBillingSchedule,
  type StatementMonth,
} from "@/lib/credit-cards/billing-cycle";
import {
  expectedDueDateCandidates,
  isValidDueDay,
} from "@/lib/credit-cards/expected-due";
import { daysUntilYmd } from "@/lib/reminders/reminder-status";
import { estimatedDueYmdForStatementMonth } from "@/lib/soa/calendar-sync-rows";

export function currentStatementMonth(
  asOfYmd: string,
  gmailMonthOffset = 0,
): StatementMonth {
  return targetStatementMonthForCard(asOfYmd, gmailMonthOffset);
}

/**
 * Due dates to store as expected rows for one card.
 * Always includes the open statement month when it has no parsed SOA, so every
 * registered card has a current-month placeholder. Never includes a statement
 * month after the open one.
 */
export function expectedDueYmdsToEnsure(input: {
  asOfYmd: string;
  schedule: CardBillingSchedule;
  windowDays: number;
  overdueFollowUpDays: number;
  hasParsedSoa: (year: number, month: number) => boolean;
}): string[] {
  const dueDay = input.schedule.dueDay;
  if (dueDay == null || !isValidDueDay(dueDay)) return [];

  const current = currentStatementMonth(
    input.asOfYmd,
    input.schedule.gmailMonthOffset,
  );
  const currentOrdinal = statementPeriodOrdinal(current);
  const targets = new Set<string>();

  if (!input.hasParsedSoa(current.year, current.month)) {
    targets.add(
      estimatedDueYmdForStatementMonth(
        current.year,
        current.month,
        dueDay,
        input.schedule.statementDay,
      ),
    );
  }

  for (const dueDateYmd of expectedDueDateCandidates(input.asOfYmd, dueDay)) {
    const period = statementMonthForDueYmd(dueDateYmd, input.schedule);
    if (statementPeriodOrdinal(period) > currentOrdinal) continue;
    if (input.hasParsedSoa(period.year, period.month)) continue;
    const daysAway = daysUntilYmd(dueDateYmd, input.asOfYmd);
    if (
      daysAway <= input.windowDays &&
      daysAway >= -input.overdueFollowUpDays
    ) {
      targets.add(dueDateYmd);
    }
  }

  return [...targets];
}

/** Unpaid expected row whose billing month is after the open statement month. */
export function isStaleFutureExpectedDue(
  dueDateYmd: string,
  schedule: Pick<CardBillingSchedule, "statementDay" | "dueDay">,
  current: StatementMonth,
  keep: ReadonlySet<string>,
): boolean {
  if (keep.has(dueDateYmd)) return false;
  const period = statementMonthForDueYmd(dueDateYmd, schedule);
  return statementPeriodOrdinal(period) > statementPeriodOrdinal(current);
}
