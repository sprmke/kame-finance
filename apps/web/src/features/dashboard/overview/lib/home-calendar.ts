import type { DayMarkKind } from "@/components/calendar/DayMark";
import { markForState, ymdOf, type CalendarEvent } from "@/lib/calendar/month-grid";
import { resolveBillState, type BillState } from "@/lib/due/bill-state";

export type CalendarDue = {
  id: string;
  issuerId: string;
  bankLabel: string;
  cardLast4: string;
  cardDisplayLabel: string | null;
  cardColor: string | null;
  dueDate: string;
  dueDateYmd: string;
  statementPeriodKey: string;
  minimumDue: string;
  totalDue: string;
  paidAt: Date | string | null;
  source: string;
  soaMissing?: boolean;
  daysAway: number;
};

export {
  dayMark,
  markForState,
  monthGrid,
  ymdOf,
  type CalendarEvent,
  type MonthGridCell,
} from "@/lib/calendar/month-grid";

export type CalendarCard = {
  id: string;
  issuerId: string;
  last4: string;
  label: string | null;
  color: string | null;
  statementDay: number | null;
  dueDay: number | null;
};

export function billStateForDue(due: CalendarDue): BillState {
  return resolveBillState({
    paid: Boolean(due.paidAt),
    soaMissing: Boolean(due.soaMissing),
    expected: due.source === "expected",
    daysAway: due.daysAway,
  });
}

function cardName(input: {
  cardDisplayLabel?: string | null;
  label?: string | null;
  bankLabel?: string;
  issuerId: string;
  last4: string;
}): string {
  const name = input.cardDisplayLabel?.trim() || input.label?.trim();
  if (name) return name;
  return `${input.bankLabel ?? input.issuerId} ${input.last4}`;
}

/** Due dates (from due entries) and statement days (from cards) that fall in the month. */
export function buildMonthEvents(input: {
  year: number;
  month: number;
  dues: CalendarDue[];
  cards: CalendarCard[];
}): CalendarEvent[] {
  const prefix = `${input.year}-${String(input.month).padStart(2, "0")}-`;
  const events: CalendarEvent[] = [];

  for (const due of input.dues) {
    if (!due.dueDateYmd.startsWith(prefix)) continue;
    const state = billStateForDue(due);
    events.push({
      id: `due:${due.id}`,
      ymd: due.dueDateYmd,
      kind: "due",
      color: due.cardColor,
      label: cardName({ ...due, last4: due.cardLast4 }),
      mark: markForState(state),
      state,
    });
  }

  for (const card of input.cards) {
    if (!card.statementDay) continue;
    events.push({
      id: `stmt:${card.id}`,
      ymd: ymdOf(input.year, input.month, card.statementDay),
      kind: "statement",
      color: card.color,
      label: cardName({ ...card }),
      mark: "none",
    });
  }

  return events.sort((a, b) => a.ymd.localeCompare(b.ymd));
}

const STATE_ORDER: Record<BillState, number> = {
  overdue: 0,
  missing: 1,
  "due-soon": 2,
  unpaid: 3,
  expected: 4,
  paid: 5,
};

/** What the user owes next first: overdue → SOA missing → due soon → unpaid → awaiting → paid. */
export function sortDuesByUrgency<T extends CalendarDue>(dues: T[]): T[] {
  return [...dues].sort((a, b) => {
    const order = STATE_ORDER[billStateForDue(a)] - STATE_ORDER[billStateForDue(b)];
    if (order !== 0) return order;
    return a.dueDateYmd.localeCompare(b.dueDateYmd);
  });
}
