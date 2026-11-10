/** One status vocabulary for a card's bill, shared by Home, Bills, and Statements. */
export type BillState =
  | "paid"
  | "overdue"
  | "due-soon"
  | "unpaid"
  | "missing"
  | "expected";

/** Days before the due date when a bill counts as "due soon". */
export const DUE_SOON_DAYS = 3;

/** Paid → SOA missing → awaiting SOA → overdue → due soon → unpaid. */
export function resolveBillState(input: {
  paid: boolean;
  soaMissing?: boolean;
  expected?: boolean;
  daysAway?: number | null;
}): BillState {
  if (input.paid) return "paid";
  if (input.soaMissing) return "missing";
  if (input.expected) return "expected";
  if (input.daysAway != null && input.daysAway < 0) return "overdue";
  if (input.daysAway != null && input.daysAway <= DUE_SOON_DAYS) return "due-soon";
  return "unpaid";
}

export function formatDaysAway(daysAway: number | null | undefined): string | null {
  if (daysAway == null) return null;
  if (daysAway < -1) return `${Math.abs(daysAway)} days overdue`;
  if (daysAway === -1) return "1 day overdue";
  if (daysAway === 0) return "Due today";
  if (daysAway === 1) return "Due tomorrow";
  return `Due in ${daysAway} days`;
}
