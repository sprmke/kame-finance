import { dueEntryKey } from "@/lib/soa/outstanding";
import { soaPeriodMonthKey } from "@/lib/soa/period";
import type { DueEntryPaidMatchInput } from "@/lib/soa/paid-status";

export type StatementDueEntryRow = DueEntryPaidMatchInput & { id: string };

export type StatementDueEntryMatchInput = {
  issuerId: string;
  cardLast4: string;
  dueDateYmd: string | null;
  statementMonth: number;
  statementYear: number;
};

function daysUntilDueYmd(dueDateYmd: string | null): number | null {
  if (!dueDateYmd) return null;
  const due = new Date(`${dueDateYmd}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

function cardPrefix(issuerId: string, cardLast4: string): string {
  return `${issuerId.toLowerCase()}:${cardLast4}`;
}

/**
 * Due entry for this statement, paid or not.
 * Exact due-date key first, then the same card in the statement month.
 */
export function resolveDueEntryForStatement(
  statement: StatementDueEntryMatchInput,
  dues: StatementDueEntryRow[],
): StatementDueEntryRow | undefined {
  if (dues.length === 0) return undefined;

  const statementKey = dueEntryKey(
    statement.issuerId,
    statement.cardLast4,
    statement.dueDateYmd,
  );
  const byDueDate = dues.find(
    (due) =>
      dueEntryKey(due.issuerId, due.cardLast4, due.dueDateYmd) === statementKey,
  );
  if (byDueDate) return byDueDate;

  const statementPeriodKey = soaPeriodMonthKey(
    statement.statementYear,
    statement.statementMonth,
  );
  const prefix = cardPrefix(statement.issuerId, statement.cardLast4);

  return dues.find((due) => {
    if (cardPrefix(due.issuerId, due.cardLast4) !== prefix) return false;
    if (due.statementPeriodKey === statementPeriodKey) return true;
    return due.dueDateYmd.slice(0, 7) === statementPeriodKey;
  });
}

/** Unpaid due entry aligned with {@link isStatementMarkedPaid} matching rules. */
export function resolveUnpaidDueEntryForStatement(
  statement: StatementDueEntryMatchInput,
  dues: StatementDueEntryRow[],
): StatementDueEntryRow | undefined {
  return resolveDueEntryForStatement(
    statement,
    dues.filter((due) => !due.paidAt),
  );
}

export function shouldOfferStatementPayNow(
  statement: StatementDueEntryMatchInput,
  dues: StatementDueEntryRow[],
  paid: boolean,
): { show: boolean; dueEntryId?: string } {
  if (paid) return { show: false };

  const due = resolveUnpaidDueEntryForStatement(statement, dues);
  if (!due) return { show: false };

  const ymd = due.dueDateYmd || statement.dueDateYmd;
  if (daysUntilDueYmd(ymd) !== 0) return { show: false };

  return { show: true, dueEntryId: due.id };
}
