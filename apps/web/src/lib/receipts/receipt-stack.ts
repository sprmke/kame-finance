/** Identity used to collapse receipt images that pay the same card cycle. */
export type ReceiptStackIdentity = {
  dueEntryId?: string | null;
  statementPeriodKey?: string | null;
  dueDateYmd?: string | null;
  parsedCardLast4?: string | null;
  bankDetected?: string | null;
  cardDisplayLabel?: string | null;
  createdAt?: Date | string | null;
};

function createdMonthKey(createdAt: Date | string | null | undefined): string {
  if (!createdAt) return "unknown";
  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * One stack per card and statement period.
 * A due entry wins, so partial payments toward the same cycle stay together.
 */
export function receiptPaymentStackKey(receipt: ReceiptStackIdentity): string {
  if (receipt.dueEntryId) return `due:${receipt.dueEntryId}`;

  const period =
    receipt.statementPeriodKey ??
    (receipt.dueDateYmd ? receipt.dueDateYmd.slice(0, 7) : null) ??
    createdMonthKey(receipt.createdAt);
  const last4 = receipt.parsedCardLast4 ?? "unknown";
  const bank = receipt.bankDetected ?? receipt.cardDisplayLabel ?? "unknown";
  return `card:${bank}:${last4}|${period}`;
}
