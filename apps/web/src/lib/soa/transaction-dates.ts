/**
 * SOA transaction date parsing.
 *
 * Bank statements print their posting/transaction date columns month-first, e.g.
 * RCBC `SALE DATE 10/29/26`, Unionbank `TRANSACTION DATE 09/11/26`, Metrobank
 * `Post Date 09/25`, BPI `January 25`, Maya `11 Sep`. Treating these as `DD/MM`
 * reverses month and day, so `11/03` renders as "Mar 11" instead of "Nov 3".
 */

const MONTH_SHORT = [
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

/** Split pair delimiter: `04/24/26 / 05/22/26` — not every `/`. */
export const DATE_PAIR_SPLIT = /\s+\/\s+/;

/**
 * How a bank prints slash dates.
 * `mdy` = `MM/DD/YY`, `dmy` = `DD/MM/YY`, `md` = `MM/DD` (no year).
 */
export type SlashDateOrder = "mdy" | "dmy" | "md";

/** Column order per issuer. All current issuers print month first. */
const ISSUER_SLASH_ORDER: Record<string, SlashDateOrder> = {
  bpi: "mdy",
  maya: "mdy",
  metrobank: "md",
  rcbc: "mdy",
  unionbank: "mdy",
};

export type NumericDate = { month: number; day: number; year?: number };

function monthIndexFromName(word: string): number | null {
  const t = word.toLowerCase().replace(/[^a-z]/g, "");
  if (t.length < 3) return null;
  const idx = MONTH_SHORT.map((m) => m.toLowerCase()).indexOf(t.slice(0, 3));
  return idx >= 0 ? idx + 1 : null;
}

/** Two-digit statement years (`26`) expand to 2026; four-digit years pass through. */
export function expandYear(year: number): number {
  return year < 100 ? 2000 + year : year;
}

export function isMonthDay(month: number, day: number): boolean {
  return (
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= 31
  );
}

/** Render `Nov 3` (no year) or `Nov 3, 2026` (with year). */
export function formatMonthDay(
  month: number,
  day: number,
  year?: number,
): string {
  const label = MONTH_SHORT[month - 1];
  if (!label) return `${month}/${day}`;
  if (year === undefined) return `${label} ${day}`;
  return `${label} ${day}, ${expandYear(year)}`;
}

/** Apply a column order to numeric segments, rejecting out-of-range results. */
function toNumericDate(
  segments: number[],
  order: SlashDateOrder,
): NumericDate | null {
  const a = segments[0];
  const b = segments[1];
  if (a === undefined || b === undefined) return null;

  const dayFirst = order === "dmy";
  const month = dayFirst ? b : a;
  const day = dayFirst ? a : b;
  if (!isMonthDay(month, day)) return null;

  const year = segments[2];
  return year === undefined ? { month, day } : { month, day, year };
}

function resolveSlashOrder(
  segments: number[],
  issuerId?: string | null,
): SlashDateOrder {
  const preferred =
    ISSUER_SLASH_ORDER[(issuerId ?? "").toLowerCase()] ??
    // Unknown issuer: a value above 12 can only be a day, otherwise month-first.
    ((segments[0] ?? 0) > 12 ? "dmy" : "mdy");

  if (segments.length >= 3) return preferred === "md" ? "mdy" : preferred;
  return preferred === "dmy" ? "dmy" : "md";
}

/** Parse one date token (`10/29/26`, `09/25`, `Sep 11`, `11 Sep`) into parts. */
export function parseTransactionDateToken(
  part: string,
  issuerId?: string | null,
): NumericDate | null {
  const trimmed = part.trim();
  if (!trimmed) return null;

  // `Sep 11` / `September 11` — Metrobank, BPI.
  const monthName = trimmed.match(/^([A-Za-z]{3,12})\s+(\d{1,2})$/);
  if (monthName) {
    const month = monthIndexFromName(monthName[1]!);
    const day = Number.parseInt(monthName[2]!, 10);
    return month && isMonthDay(month, day) ? { month, day } : null;
  }

  // `11 Sep` — Maya prints day-first month names.
  const dayMonthName = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,12})$/);
  if (dayMonthName) {
    const day = Number.parseInt(dayMonthName[1]!, 10);
    const month = monthIndexFromName(dayMonthName[2]!);
    return month && isMonthDay(month, day) ? { month, day } : null;
  }

  if (trimmed.includes("/")) {
    const segments = trimmed
      .split("/")
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));
    if (segments.length < 2) return null;
    const order = resolveSlashOrder(segments, issuerId);
    return (
      toNumericDate(segments, order) ??
      // Safety net: a bank that flips its own column order, rather than render nonsense.
      toNumericDate(segments, order === "dmy" ? "mdy" : "dmy")
    );
  }

  return null;
}

/** Format one stored date token for display, falling back to the raw text. */
export function formatTransactionDateToken(
  part: string,
  issuerId?: string | null,
): string {
  const parsed = parseTransactionDateToken(part, issuerId);
  if (!parsed) return part.trim() || "—";
  return formatMonthDay(parsed.month, parsed.day, parsed.year);
}

/** Split a stored `posted / transacted` date pair into its two tokens. */
export function splitTransactionDatePair(
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(DATE_PAIR_SPLIT)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Sortable `YYYYMMDD` key, or `Infinity` when the date cannot be parsed. */
export function transactionDateSortKey(
  raw: string | null | undefined,
  issuerId?: string | null,
): number {
  for (const part of splitTransactionDatePair(raw)) {
    const parsed = parseTransactionDateToken(part, issuerId);
    if (parsed) {
      const year = parsed.year === undefined ? 0 : expandYear(parsed.year);
      return year * 10_000 + parsed.month * 100 + parsed.day;
    }
  }
  return Number.POSITIVE_INFINITY;
}

export type ParsedTransactionDate = {
  posted: string | null;
  transacted: string | null;
};

/** Format a stored `posted / transacted` pair for display. */
export function parseTransactionDate(
  raw: string | null | undefined,
  issuerId?: string | null,
): ParsedTransactionDate {
  const parts = splitTransactionDatePair(raw);
  if (parts.length === 0) return { posted: null, transacted: null };
  return {
    posted: formatTransactionDateToken(parts[0]!, issuerId),
    transacted: parts[1] ? formatTransactionDateToken(parts[1], issuerId) : null,
  };
}
