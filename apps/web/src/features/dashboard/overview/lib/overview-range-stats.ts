import {
  computeOutstandingTotals,
  computeTotalPaid,
  type DuePaymentLookupRow,
  type PeriodCardBreakdown,
  type SoaStatementForOutstanding,
} from "@/lib/soa/outstanding";

const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type OverviewPeriodCard = PeriodCardBreakdown & {
  statementPeriodKey: string;
};

export type OverviewRangeStats = {
  statementCount: number;
  cardCount: number;
  paidCardCount: number;
  minimumMetCardCount: number;
  totalDue: number;
  totalMinimum: number;
  grossStatementDue: number;
  grossMinimumDue: number;
  totalPaid: number;
  nextDueYmd: string | null;
  periodCards: OverviewPeriodCard[];
};

/**
 * Sum each statement month on its own, then add those months together.
 * A multi-month window therefore matches what each month shows alone,
 * instead of keeping only the latest statement per card.
 */
export function rollupStatementMonths(
  statements: SoaStatementForOutstanding[],
  dues: DuePaymentLookupRow[],
): OverviewRangeStats {
  const groups = new Map<string, SoaStatementForOutstanding[]>();
  for (const statement of statements) {
    const key = statementPeriodKey(
      statement.statementYear,
      statement.statementMonth,
    );
    const list = groups.get(key);
    if (list) list.push(statement);
    else groups.set(key, [statement]);
  }

  const keys = [...groups.keys()].sort().reverse();
  const multi = keys.length > 1;

  let cardCount = 0;
  let paidCardCount = 0;
  let minimumMetCardCount = 0;
  let totalDue = 0;
  let totalMinimum = 0;
  let grossStatementDue = 0;
  let grossMinimumDue = 0;
  let totalPaid = 0;
  const nextDues: string[] = [];
  const periodCards: OverviewPeriodCard[] = [];

  for (const key of keys) {
    const monthStatements = groups.get(key) ?? [];
    const totals = computeOutstandingTotals(monthStatements, dues);
    cardCount += totals.cardCount;
    paidCardCount += totals.paidCardCount;
    minimumMetCardCount += totals.minimumMetCardCount;
    totalDue += totals.totalDue;
    totalMinimum += totals.totalMinimum;
    grossStatementDue += totals.grossStatementDue;
    grossMinimumDue += totals.grossMinimumDue;
    totalPaid += computeTotalPaid(monthStatements, dues);
    if (totals.nextDueYmd) nextDues.push(totals.nextDueYmd);

    const month = Number(key.slice(5, 7));
    const suffix = SHORT_MONTHS[month - 1];
    for (const card of totals.cards) {
      periodCards.push({
        ...card,
        label: multi && suffix ? `${card.label} · ${suffix}` : card.label,
        statementPeriodKey: key,
      });
    }
  }

  nextDues.sort();

  return {
    statementCount: statements.length,
    cardCount,
    paidCardCount,
    minimumMetCardCount,
    totalDue,
    totalMinimum,
    grossStatementDue,
    grossMinimumDue,
    totalPaid,
    nextDueYmd: nextDues[0] ?? null,
    periodCards,
  };
}

function statementPeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
