import { normalizeCardLast4 } from "@/lib/due/normalize";
import { soaPeriodMonthKey } from "@/lib/soa/period";
import {
  resolveDueEntryForStatement,
  type StatementDueEntryMatchInput,
  type StatementDueEntryRow,
} from "@/lib/soa/statement-due-entry";

export type StatementReceiptLink = {
  dueEntryId: string | null;
  parsedCardLast4: string | null;
  statementPeriodKey: string | null;
  dueDateYmd: string | null;
  bankDetected?: string | null;
  createdAt?: Date | string | null;
};

function cardPrefix(issuerId: string, cardLast4: string): string {
  return `${issuerId.trim().toLowerCase()}:${normalizeCardLast4(cardLast4)}`;
}

function last4Matches(
  receiptLast4: string | null | undefined,
  cardLast4: string,
): boolean {
  if (!receiptLast4) return false;
  return normalizeCardLast4(receiptLast4) === normalizeCardLast4(cardLast4);
}

function bankAligns(
  bankDetected: string | null | undefined,
  issuerId: string,
): boolean {
  const bank = bankDetected?.trim().toLowerCase();
  if (!bank) return true;
  const issuer = issuerId.trim().toLowerCase();
  return issuer.includes(bank) || bank.includes(issuer);
}

function dueMatchesStatement(
  due: StatementDueEntryRow,
  statement: StatementDueEntryMatchInput,
  periodKey: string,
): boolean {
  if (
    cardPrefix(due.issuerId, due.cardLast4) !==
    cardPrefix(statement.issuerId, statement.cardLast4)
  ) {
    return false;
  }
  if (due.statementPeriodKey === periodKey) return true;
  return due.dueDateYmd.slice(0, 7) === periodKey;
}

function byNewest<T extends StatementReceiptLink>(left: T, right: T): number {
  const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
  return rightTime - leftTime;
}

/**
 * Receipts that pay this statement's card cycle.
 * A linked due entry wins. Otherwise last-4 plus statement month, and bank when known.
 */
export function receiptsForStatement<T extends StatementReceiptLink>(
  statement: StatementDueEntryMatchInput,
  dues: StatementDueEntryRow[],
  receipts: T[],
): T[] {
  const due = resolveDueEntryForStatement(statement, dues);
  if (due) {
    const linked = receipts.filter((receipt) => receipt.dueEntryId === due.id);
    if (linked.length > 0) return linked.sort(byNewest);
  }

  const periodKey = soaPeriodMonthKey(
    statement.statementYear,
    statement.statementMonth,
  );

  return receipts
    .filter((receipt) => {
      if (receipt.dueEntryId) {
        const receiptDue = dues.find((row) => row.id === receipt.dueEntryId);
        if (!receiptDue) return false;
        return dueMatchesStatement(receiptDue, statement, periodKey);
      }

      if (!last4Matches(receipt.parsedCardLast4, statement.cardLast4)) {
        return false;
      }
      if (!bankAligns(receipt.bankDetected, statement.issuerId)) return false;
      if (receipt.statementPeriodKey === periodKey) return true;
      return receipt.dueDateYmd?.slice(0, 7) === periodKey;
    })
    .sort(byNewest);
}
