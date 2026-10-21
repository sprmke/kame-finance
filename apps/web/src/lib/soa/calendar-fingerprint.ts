import { normalizeCardLast4 } from "@/lib/due/normalize";

/** Due identity stored in a `pay-cc` fingerprint, without the `D-n` suffix. */
export function payCcDueKey(
  issuerId: string,
  cardLast4: string,
  dueYmd: string,
): string {
  return `pay-cc:${issuerId.trim().toLowerCase()}:${normalizeCardLast4(cardLast4)}:${dueYmd}`;
}

export function payCcFingerprint(
  issuerId: string,
  cardLast4: string,
  dueYmd: string,
  daysAway: number,
): string {
  return `${payCcDueKey(issuerId, cardLast4, dueYmd)}:D-${daysAway}`;
}

const FINGERPRINT_RE = /^pay-cc:([^:]+):([^:]+):(\d{4}-\d{2}-\d{2}):D-(\d+)$/;

export function dueKeyFromPayCcFingerprint(fingerprint: string): string | null {
  const match = FINGERPRINT_RE.exec(fingerprint);
  if (!match) return null;
  return payCcDueKey(match[1]!, match[2]!, match[3]!);
}

/** Shift a `YYYY-MM-DD` by whole days. Uses UTC so the calendar day does not depend on the host timezone. */
export function shiftYmd(ymd: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) throw new Error("Invalid date");
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * True when every pay-cc fingerprint on the event points at a due date that
 * is no longer a due entry. Events with no pay-cc fingerprint are left alone.
 */
export function eventFingerprintsAreStale(
  fingerprints: readonly string[],
  keepDueKeys: ReadonlySet<string>,
): boolean {
  const keys = fingerprints
    .map((fp) => dueKeyFromPayCcFingerprint(fp))
    .filter((key): key is string => key != null);
  if (keys.length === 0) return false;
  return keys.every((key) => !keepDueKeys.has(key));
}

/** D-4 through D-0 are present for this due. */
export function seriesIsComplete(
  dueKey: string,
  fingerprints: ReadonlySet<string>,
): boolean {
  for (let daysAway = 0; daysAway <= 4; daysAway++) {
    if (!fingerprints.has(`${dueKey}:D-${daysAway}`)) return false;
  }
  return true;
}
