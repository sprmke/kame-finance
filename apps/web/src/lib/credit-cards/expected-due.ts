export const MIN_DUE_DAY = 1;
export const MAX_DUE_DAY = 31;

export function isValidDueDay(value: number): boolean {
  return (
    Number.isInteger(value) && value >= MIN_DUE_DAY && value <= MAX_DUE_DAY
  );
}

export function expectedDueDateYmd(
  year: number,
  month: number,
  dueDay: number,
): string {
  if (!isValidDueDay(dueDay)) {
    throw new Error("Due day must be between 1 and 31");
  }
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("Invalid due month");
  }

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function expectedDueDateCandidates(
  asOfYmd: string,
  dueDay: number,
): string[] {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(asOfYmd);
  if (!match) throw new Error("Invalid reference date");

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
    throw new Error("Invalid reference date");
  }

  return [-1, 0, 1].map((offset) => {
    const target = new Date(Date.UTC(year, monthIndex + offset, 1));
    return expectedDueDateYmd(
      target.getUTCFullYear(),
      target.getUTCMonth() + 1,
      dueDay,
    );
  });
}

export function formatExpectedDueDate(ymd: string): string {
  const date = new Date(`${ymd}T00:00:00`);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Calendar day (1–31) from an ISO `YYYY-MM-DD` due date. */
export function dueDayFromYmd(ymd: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!match) return null;
  const day = Number(match[3]);
  return isValidDueDay(day) ? day : null;
}

/**
 * Recurring due day from SOA history: most frequent calendar day.
 * Ties go to the day that appears last in `ymds` (pass chronological order).
 */
export function inferDueDayFromYmds(ymds: readonly string[]): number | null {
  const days: number[] = [];
  for (const ymd of ymds) {
    const day = dueDayFromYmd(ymd);
    if (day != null) days.push(day);
  }
  if (days.length === 0) return null;

  const counts = new Map<number, number>();
  const lastIndex = new Map<number, number>();
  days.forEach((day, index) => {
    counts.set(day, (counts.get(day) ?? 0) + 1);
    lastIndex.set(day, index);
  });

  const maxCount = Math.max(...counts.values());
  let winner: number | null = null;
  let winnerLast = -1;
  for (const [day, count] of counts) {
    if (count !== maxCount) continue;
    const last = lastIndex.get(day) ?? -1;
    if (winner == null || last > winnerLast) {
      winner = day;
      winnerLast = last;
    }
  }
  return winner;
}
