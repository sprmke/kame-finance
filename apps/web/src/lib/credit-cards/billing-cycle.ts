import {
  expectedDueDateYmd,
  formatExpectedDueDate,
  isValidDueDay,
} from "@/lib/credit-cards/expected-due";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { parseDueDateToYmd } from "@/lib/due/parse-due-date";
import { soaPeriodMonthKey } from "@/lib/soa/period";

export type CardBillingSchedule = {
  statementDay: number | null;
  dueDay: number | null;
  gmailMonthOffset: number;
};

export type StatementMonth = { year: number; month: number };

export function targetStatementMonthForCard(
  asOfYmd: string,
  gmailMonthOffset = 0,
): StatementMonth {
  const year = Number(asOfYmd.slice(0, 4));
  const month = Number(asOfYmd.slice(5, 7));
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid reference date");
  }
  const offset = Number.isFinite(gmailMonthOffset) ? Math.trunc(gmailMonthOffset) : 0;
  const anchor = new Date(year, month - 1 + offset, 1);
  return { year: anchor.getFullYear(), month: anchor.getMonth() + 1 };
}

export function expectedStatementDateYmd(
  statementYear: number,
  statementMonth: number,
  statementDay: number,
): string {
  return expectedDueDateYmd(statementYear, statementMonth, statementDay);
}

/** When `statementDay` is unset, use the last calendar day of the billing month. */
export function expectedStatementThresholdYmd(
  schedule: Pick<CardBillingSchedule, "statementDay">,
  statementYear: number,
  statementMonth: number,
): string {
  if (schedule.statementDay != null && isValidDueDay(schedule.statementDay)) {
    return expectedStatementDateYmd(
      statementYear,
      statementMonth,
      schedule.statementDay,
    );
  }
  const lastDay = new Date(statementYear, statementMonth, 0).getDate();
  return expectedDueDateYmd(statementYear, statementMonth, lastDay);
}

export function isOnOrPastExpectedStatementDate(
  asOfYmd: string,
  schedule: CardBillingSchedule,
): boolean {
  const { year, month } = targetStatementMonthForCard(
    asOfYmd,
    schedule.gmailMonthOffset,
  );
  return isOnOrPastStatementDateForPeriod(asOfYmd, year, month, schedule);
}

export function isOnOrPastStatementDateForPeriod(
  asOfYmd: string,
  statementYear: number,
  statementMonth: number,
  schedule: Pick<CardBillingSchedule, "statementDay">,
): boolean {
  const threshold = expectedStatementThresholdYmd(
    schedule,
    statementYear,
    statementMonth,
  );
  return asOfYmd >= threshold;
}

export function formatExpectedStatementDate(
  schedule: Pick<CardBillingSchedule, "statementDay">,
  statementYear: number,
  statementMonth: number,
): string {
  if (schedule.statementDay != null && isValidDueDay(schedule.statementDay)) {
    return formatExpectedDueDate(
      expectedStatementDateYmd(
        statementYear,
        statementMonth,
        schedule.statementDay,
      ),
    );
  }
  return formatExpectedDueDate(
    expectedStatementThresholdYmd(schedule, statementYear, statementMonth),
  );
}

export type SoaStatementPeriodRow = {
  creditCardId: string | null;
  issuerId: string;
  cardLast4: string;
  statementYear: number;
  statementMonth: number;
  soaUnavailable: boolean | null;
  dueDateYmd: string | null;
};

export function cardHasParsedSoaForStatementMonth(
  statements: readonly SoaStatementPeriodRow[],
  card: { id: string; issuer: string; last4: string },
  year: number,
  month: number,
): boolean {
  const last4 = normalizeCardLast4(card.last4);
  const issuer = card.issuer.trim().toLowerCase();
  return statements.some(
    (row) =>
      !row.soaUnavailable &&
      row.dueDateYmd &&
      row.statementYear === year &&
      row.statementMonth === month &&
      (row.creditCardId === card.id ||
        (row.issuerId.trim().toLowerCase() === issuer &&
          normalizeCardLast4(row.cardLast4) === last4)),
  );
}

/** Active card is on or past its statement day and the target month has no parsed SOA. */
export function isCardMissingCurrentSoa(
  asOfYmd: string,
  card: {
    id: string;
    issuer: string;
    last4: string;
    isActive: boolean;
    statementDay: number | null;
    gmailMonthOffset?: number | null;
  },
  statements: readonly SoaStatementPeriodRow[],
): boolean {
  if (!card.isActive) return false;
  if (card.statementDay == null || !isValidDueDay(card.statementDay)) {
    return false;
  }
  const offset = card.gmailMonthOffset ?? 0;
  const schedule: CardBillingSchedule = {
    statementDay: card.statementDay,
    dueDay: null,
    gmailMonthOffset: offset,
  };
  if (!isOnOrPastExpectedStatementDate(asOfYmd, schedule)) return false;
  const { year, month } = targetStatementMonthForCard(asOfYmd, offset);
  return !cardHasParsedSoaForStatementMonth(statements, card, year, month);
}

/** Unavailable statement row whose billing month is already on or past the card’s statement day. */
export function isMissingSoaForStatementPeriod(
  asOfYmd: string,
  statement: {
    soaUnavailable: boolean | null;
    statementYear: number;
    statementMonth: number;
  },
  statementDay: number | null | undefined,
): boolean {
  if (!statement.soaUnavailable) return false;
  return isOnOrPastStatementDateForPeriod(
    asOfYmd,
    statement.statementYear,
    statement.statementMonth,
    { statementDay: statementDay ?? null },
  );
}

export function statementPeriodKeyForCardAsOf(
  asOfYmd: string,
  gmailMonthOffset: number,
): string {
  const { year, month } = targetStatementMonthForCard(asOfYmd, gmailMonthOffset);
  return soaPeriodMonthKey(year, month);
}

/** Calendar day from parsed SOA `statement_date` display strings. */
export function inferStatementDayFromStatementDates(
  displayDates: readonly string[],
): number | null {
  const ymds = displayDates
    .map((value) => parseDueDateToYmd(value))
    .filter((ymd): ymd is string => ymd != null);
  if (ymds.length === 0) return null;

  const days: number[] = [];
  for (const ymd of ymds) {
    const day = Number(ymd.slice(8, 10));
    if (isValidDueDay(day)) days.push(day);
  }
  if (days.length === 0) return null;

  const counts = new Map<number, number>();
  const lastIndex = new Map<number, number>();
  days.forEach((day, index) => {
    counts.set(day, (counts.get(day) ?? 0) + 1);
    lastIndex.set(day, index);
  });

  const maxCount = Math.max(...counts.values());
  let winner: number | null = null;
  let winnerLast = -1;
  for (const [day, count] of counts) {
    if (count !== maxCount) continue;
    const last = lastIndex.get(day) ?? -1;
    if (winner == null || last > winnerLast) {
      winner = day;
      winnerLast = last;
    }
  }
  return winner;
}
