import { MONTH_NAMES_LONG } from "@/lib/soa/month";

export type CalendarMonth = { month: number; year: number };

export function monthOrdinal(month: number, year: number): number {
  return year * 12 + (month - 1);
}

export function isMonthInPeriodRange(
  month: number,
  year: number,
  fromMonth: number,
  fromYear: number,
  toMonth: number,
  toYear: number,
): boolean {
  const value = monthOrdinal(month, year);
  return (
    value >= monthOrdinal(fromMonth, fromYear) &&
    value <= monthOrdinal(toMonth, toYear)
  );
}

export function calendarDayFromYmd(ymd: string): number {
  const day = Number(ymd.slice(8, 10));
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error("Invalid YMD date");
  }
  return day;
}

/** Statement month to fetch when running SOA early (month after `todayYmd`). */
export function soaAdvanceRunTargetMonth(todayYmd: string): CalendarMonth {
  const year = Number(todayYmd.slice(0, 4));
  const month = Number(todayYmd.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid YMD date");
  }
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

export function shouldOfferSoaAdvanceRun(
  todayYmd: string,
  promptDay: number,
): boolean {
  if (!Number.isInteger(promptDay) || promptDay < 1 || promptDay > 31) {
    return false;
  }
  return calendarDayFromYmd(todayYmd) >= promptDay;
}

export function formatStatementMonthLabel(month: number, year: number): string {
  const name = MONTH_NAMES_LONG[month - 1];
  return name ? `${name} ${year}` : `${month}/${year}`;
}

export function advancePromptDismissStorageKey(
  target: CalendarMonth,
): string {
  const m = String(target.month).padStart(2, "0");
  return `kame:soa-advance-prompt:${target.year}-${m}`;
}

export function isAdvancePromptDismissed(
  target: CalendarMonth,
  storage: Pick<Storage, "getItem">,
): boolean {
  return storage.getItem(advancePromptDismissStorageKey(target)) === "1";
}

export function dismissAdvancePrompt(
  target: CalendarMonth,
  storage: Pick<Storage, "setItem">,
): void {
  storage.setItem(advancePromptDismissStorageKey(target), "1");
}

export type SoaPeriodMonthRange = {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
};

export function periodCoversMonth(
  period: SoaPeriodMonthRange,
  month: number,
  year: number,
): boolean {
  return isMonthInPeriodRange(
    month,
    year,
    period.fromMonth,
    period.fromYear,
    period.toMonth,
    period.toYear,
  );
}

export function hasSoaPeriodForMonth(
  periods: SoaPeriodMonthRange[],
  month: number,
  year: number,
): boolean {
  return periods.some((p) => periodCoversMonth(p, month, year));
}
