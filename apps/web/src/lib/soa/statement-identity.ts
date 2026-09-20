import { normalizeCardLast4 } from "@/lib/due/normalize";

/** Fields that identify one persisted SOA statement row for a user + period. */
export type SoaStatementIdentity = {
  issuerId: string;
  cardLast4: string;
  statementMonth: number;
  statementYear: number;
};

/**
 * One statement per card per billing period — this is the canonical identity
 * used both to find-or-update rows on persist and to de-duplicate existing
 * rows. It intentionally ignores `sourceMessageId`/`pdfFileName`: those differ
 * between an "unavailable" placeholder (no SOA email found) and the real
 * statement parsed on a later run, and using them as part of the identity is
 * what previously let both rows exist side by side for the same card+period.
 */
export function soaStatementIdentityKey(row: SoaStatementIdentity): string {
  return [
    row.issuerId.toLowerCase(),
    normalizeCardLast4(row.cardLast4),
    row.statementYear,
    row.statementMonth,
  ].join(":");
}

/** Rows considered when collapsing leftover duplicates for the same card+period. */
export type SoaStatementDedupeRow = SoaStatementIdentity & {
  id: string;
  soaUnavailable?: boolean | null;
  createdAt: Date | string;
};

/**
 * One statement per (issuer, last-4, period). Newer real rows win; a parsed
 * statement always beats an "unavailable" placeholder even if the placeholder
 * was saved later (that leftover pair is what used to show as duplicate cards).
 */
export function pickCanonicalSoaStatements<T extends SoaStatementDedupeRow>(
  rows: readonly T[],
): { keep: T[]; drop: T[] } {
  const newestFirst = [...rows].sort(
    (a, b) => createdAtMs(b.createdAt) - createdAtMs(a.createdAt),
  );
  const bestByKey = new Map<string, T>();

  for (const row of newestFirst) {
    const key = soaStatementIdentityKey(row);
    const current = bestByKey.get(key);
    if (!current) {
      bestByKey.set(key, row);
      continue;
    }
    if (current.soaUnavailable && !row.soaUnavailable) {
      bestByKey.set(key, row);
    }
  }

  const keep = [...bestByKey.values()];
  const keepIds = new Set(keep.map((row) => row.id));
  return {
    keep,
    drop: rows.filter((row) => !keepIds.has(row.id)),
  };
}

function createdAtMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}
