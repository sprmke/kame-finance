import { parsePhpAmount } from "@/lib/utils/format-money";

/** Stored transaction line used to derive statement total due. */
export type ManualEntryAmountLine = {
  description: string;
  amount: string;
};

const MONEY_FORMAT: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** Non-negative peso string stored on statement and due rows (`1,234.50`, including `0.00`). */
export function formatSoaMoney(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return safe.toLocaleString("en-PH", MONEY_FORMAT);
}

/** Transaction amount string. Credits use a leading minus so existing classifiers treat them as credits. */
export function encodeTransactionAmount(amount: number, credit: boolean): string {
  const formatted = Math.abs(amount).toLocaleString("en-PH", MONEY_FORMAT);
  return credit ? `-${formatted}` : formatted;
}

function reducesBalance(raw: string, description: string): boolean {
  if (/\(CR\)/i.test(raw) || raw.trim().startsWith("-")) return true;
  return /\b(payment|paid|thank you|autopay|auto-pay)\b/i.test(description);
}

/**
 * Net amount due from manual lines: charges add, credits and payments subtract.
 * Result is rounded to cents and never negative.
 */
export function netManualTransactionTotal(
  transactions: ManualEntryAmountLine[],
): number {
  const sum = transactions.reduce((total, line) => {
    const magnitude = parsePhpAmount(line.amount);
    return reducesBalance(line.amount, line.description)
      ? total - magnitude
      : total + magnitude;
  }, 0);
  return Math.max(0, Math.round(sum * 100) / 100);
}
