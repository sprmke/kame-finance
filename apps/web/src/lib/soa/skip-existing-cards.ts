import { normalizeCardLast4 } from "@/lib/due/normalize";

export type SoaCoverageStatement = {
  issuerId: string;
  cardLast4: string;
  statementMonth: number;
  statementYear: number;
  soaUnavailable?: boolean | null;
  totalDue?: string | null;
  dueDate?: string | null;
};

function isBlankSoaAmount(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed.length === 0 || trimmed === "—";
}

/** A saved row with no due date and no total still needs a parse. */
function statementHasParsedAmounts(
  statement: SoaCoverageStatement,
): boolean {
  if (statement.totalDue === undefined && statement.dueDate === undefined) {
    return true;
  }
  return (
    !isBlankSoaAmount(statement.totalDue) || !isBlankSoaAmount(statement.dueDate)
  );
}

export function statementMonthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/** Issuer + last-4 identity used to decide whether a card already has an SOA. */
export function soaCoverageKey(issuerId: string, last4: string): string {
  return `${issuerId.trim().toLowerCase()}\0${normalizeCardLast4(last4)}`;
}

/**
 * Real statements only. Unavailable placeholders are missing SOAs and stay
 * eligible for the next run.
 */
export function coveredKeysByMonth(
  statements: readonly SoaCoverageStatement[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const statement of statements) {
    if (statement.soaUnavailable) continue;
    if (!statementHasParsedAmounts(statement)) continue;
    if (!statement.cardLast4 || statement.cardLast4 === "—") continue;

    const monthKey = statementMonthKey(
      statement.statementYear,
      statement.statementMonth,
    );
    const keys = map.get(monthKey) ?? new Set<string>();
    keys.add(soaCoverageKey(statement.issuerId, statement.cardLast4));
    map.set(monthKey, keys);
  }

  return map;
}

export function cardHasSoaForMonth(
  coveredByMonth: ReadonlyMap<string, ReadonlySet<string>>,
  year: number,
  month: number,
  issuerId: string,
  last4: string,
): boolean {
  const covered = coveredByMonth.get(statementMonthKey(year, month));
  if (!covered) return false;
  return covered.has(soaCoverageKey(issuerId, last4));
}
