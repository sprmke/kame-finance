import { formatExpectedDueDate, expectedDueDateYmd } from "@/lib/credit-cards/expected-due";
import { parseDueDateToYmd } from "@/lib/due/parse-due-date";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { formatBankIssuer } from "@/lib/db/schema";
import type { CalendarEventInput } from "@/lib/soa/google-calendar";
import type { SoaRow } from "@/lib/soa/types";

export type SoaCalendarCard = {
  issuer: string;
  last4: string;
  label?: string | null;
  fullPan?: string | null;
  contactLine?: string | null;
  dueDay: number | null;
};

export type SoaCalendarMonth = {
  month: number;
  year: number;
  rows: SoaRow[];
};

function cardKey(issuerId: string, cardLast4: string): string {
  return `${issuerId.trim().toLowerCase()}:${normalizeCardLast4(cardLast4)}`;
}

function dueKey(issuerId: string, cardLast4: string, dueYmd: string): string {
  return `${cardKey(issuerId, cardLast4)}:${dueYmd}`;
}

/** Last calendar day of a 1-based statement month. */
export function statementPeriodEndYmd(year: number, month1: number): string {
  const lastDay = new Date(year, month1, 0).getDate();
  return expectedDueDateYmd(year, month1, lastDay);
}

export function formatStatementPeriodEnd(year: number, month1: number): string {
  return formatExpectedDueDate(statementPeriodEndYmd(year, month1));
}

/**
 * Typical PH SOA: statement for month M, payment due in month M+1 on the card's due day.
 */
export function estimatedDueYmdForStatementMonth(
  year: number,
  statementMonth1: number,
  dueDay: number,
): string {
  const dueMonth1 = statementMonth1 === 12 ? 1 : statementMonth1 + 1;
  const dueYear = statementMonth1 === 12 ? year + 1 : year;
  return expectedDueDateYmd(dueYear, dueMonth1, dueDay);
}

export function monthHasParsedSoaForCard(
  rows: SoaRow[],
  issuer: string,
  last4: string,
): boolean {
  const key = cardKey(issuer, last4);
  return rows.some(
    (r) =>
      !r.soaUnavailable &&
      r.cardLast4 &&
      r.cardLast4 !== "—" &&
      cardKey(r.issuerId, r.cardLast4) === key &&
      parseDueDateToYmd(r.dueDate),
  );
}

function soaRowToCalendarInput(row: SoaRow): CalendarEventInput | null {
  if (row.soaUnavailable) return null;
  if (!parseDueDateToYmd(row.dueDate)) return null;
  return {
    issuerId: row.issuerId,
    cardLast4: row.cardLast4,
    bankLabel: row.bankLabel,
    cardDisplayLabel: row.cardDisplayLabel,
    fullPan: row.fullPan,
    contactLine: row.contactLine,
    dueDate: row.dueDate,
    minimumDue: row.minimumDue,
    totalDue: row.totalDue,
    statementDate: row.statementDate,
    transactions: row.transactions,
    soaUnavailable: false,
  };
}

function missingSoaCalendarRow(
  card: SoaCalendarCard,
  month: SoaCalendarMonth,
): CalendarEventInput | null {
  if (!card.dueDay) return null;

  const issuerId = card.issuer.trim().toLowerCase();
  const cardLast4 = normalizeCardLast4(card.last4);
  const dueYmd = estimatedDueYmdForStatementMonth(
    month.year,
    month.month,
    card.dueDay,
  );

  return {
    issuerId,
    cardLast4,
    bankLabel: formatBankIssuer(card.issuer),
    cardDisplayLabel: card.label,
    fullPan: card.fullPan,
    contactLine: card.contactLine,
    dueDate: formatExpectedDueDate(dueYmd),
    minimumDue: "—",
    totalDue: "—",
    statementDate: formatStatementPeriodEnd(month.year, month.month),
    source: "expected",
    soaUnavailable: true,
  };
}

/**
 * Calendar rows for an SOA run: parsed statements plus estimated due dates for every
 * registered card that did not get a statement for that month.
 */
export function buildCalendarRowsForSoaRun(
  months: SoaCalendarMonth[],
  cards: SoaCalendarCard[],
): CalendarEventInput[] {
  const out: CalendarEventInput[] = [];
  const seen = new Set<string>();

  for (const month of months) {
    for (const row of month.rows) {
      const input = soaRowToCalendarInput(row);
      if (!input) continue;
      const ymd = parseDueDateToYmd(input.dueDate)!;
      const key = dueKey(input.issuerId, input.cardLast4, ymd);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(input);
    }
  }

  for (const month of months) {
    for (const card of cards) {
      if (!card.dueDay) continue;
      if (monthHasParsedSoaForCard(month.rows, card.issuer, card.last4)) {
        continue;
      }
      const synthetic = missingSoaCalendarRow(card, month);
      if (!synthetic) continue;
      const ymd = parseDueDateToYmd(synthetic.dueDate)!;
      const key = dueKey(synthetic.issuerId, synthetic.cardLast4, ymd);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(synthetic);
    }
  }

  return out;
}
