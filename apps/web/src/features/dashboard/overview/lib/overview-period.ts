export const OVERVIEW_PERIOD_GRAINS = ["month", "year"] as const;

export type OverviewPeriodGrain = (typeof OVERVIEW_PERIOD_GRAINS)[number];

/** Anchor month stays set in year view so switching back lands on the same month. */
export type OverviewPeriod = {
  grain: OverviewPeriodGrain;
  year: number;
  month: number;
};

export type OverviewStatsInput = {
  grain: OverviewPeriodGrain;
  year: number;
  month: number;
};

export type MonthSpan = {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
};

const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const MANILA_TIME_ZONE = "Asia/Manila";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

export function manilaToday(now = new Date()): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  return { year, month };
}

export function currentOverviewPeriod(now = new Date()): OverviewPeriod {
  const today = manilaToday(now);
  return { grain: "month", year: today.year, month: today.month };
}

export function parseOverviewPeriod(
  params: {
    grain?: string | null;
    year?: string | null;
    month?: string | null;
  },
  now = new Date(),
): OverviewPeriod {
  const today = manilaToday(now);
  if (!params.grain && !params.year && !params.month) {
    return { grain: "month", year: today.year, month: today.month };
  }

  const grain: OverviewPeriodGrain = params.grain === "year" ? "year" : "month";
  const parsedYear = Number(params.year);
  const parsedMonth = Number(params.month);
  return clampOverviewPeriod(
    {
      grain,
      year: Number.isInteger(parsedYear) ? parsedYear : today.year,
      month: Number.isInteger(parsedMonth) ? parsedMonth : today.month,
    },
    today,
  );
}

/** Omit the query when the selection is the current month so the default URL stays clean. */
export function overviewStatsInput(
  period: OverviewPeriod,
  now = new Date(),
): OverviewStatsInput | undefined {
  const current = currentOverviewPeriod(now);
  if (
    period.grain === "month" &&
    period.year === current.year &&
    period.month === current.month
  ) {
    return undefined;
  }
  return { grain: period.grain, year: period.year, month: period.month };
}

export function formatOverviewPeriodLabel(period: OverviewPeriod): string {
  if (period.grain === "year") return String(period.year);
  return MONTH_FORMAT.format(new Date(period.year, period.month - 1, 1));
}

export function overviewPeriodSpan(period: OverviewPeriod): MonthSpan {
  if (period.grain === "year") {
    return {
      fromMonth: 1,
      fromYear: period.year,
      toMonth: 12,
      toYear: period.year,
    };
  }
  return {
    fromMonth: period.month,
    fromYear: period.year,
    toMonth: period.month,
    toYear: period.year,
  };
}

export function spanIncludesMonth(
  span: MonthSpan,
  year: number,
  month: number,
): boolean {
  const value = year * 12 + month;
  const from = span.fromYear * 12 + span.fromMonth;
  const to = span.toYear * 12 + span.toMonth;
  return value >= from && value <= to;
}

export function isCurrentOverviewPeriod(
  period: OverviewPeriod,
  now = new Date(),
): boolean {
  const today = manilaToday(now);
  if (period.grain === "year") return period.year === today.year;
  return period.year === today.year && period.month === today.month;
}

export function withOverviewGrain(
  period: OverviewPeriod,
  grain: OverviewPeriodGrain,
): OverviewPeriod {
  return { ...period, grain };
}

export function jumpToCurrentOverviewPeriod(
  grain: OverviewPeriodGrain,
  now = new Date(),
): OverviewPeriod {
  const today = manilaToday(now);
  return { grain, year: today.year, month: today.month };
}

export function shiftOverviewPeriod(
  period: OverviewPeriod,
  direction: "prev" | "next",
  now = new Date(),
): OverviewPeriod {
  const today = manilaToday(now);
  const delta = direction === "next" ? 1 : -1;
  const next =
    period.grain === "year"
      ? { ...period, year: period.year + delta }
      : shiftMonth(period, delta);
  if (next.year < MIN_YEAR || next.year > MAX_YEAR) return period;
  if (isAfterToday(next, today)) return period;
  return next;
}

export function canShiftOverviewPeriod(
  period: OverviewPeriod,
  direction: "prev" | "next",
  now = new Date(),
): boolean {
  const next = shiftOverviewPeriod(period, direction, now);
  return next.year !== period.year || next.month !== period.month;
}

export function pickPeriodIdForMonth(
  periods: Array<{
    id: string;
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
  }>,
  month: number,
  year: number,
): string | null {
  const covering = periods.filter((period) =>
    spanIncludesMonth(
      {
        fromMonth: period.fromMonth,
        fromYear: period.fromYear,
        toMonth: period.toMonth,
        toYear: period.toYear,
      },
      year,
      month,
    ),
  );
  if (covering.length === 0) return null;

  covering.sort((a, b) => {
    const aExact = isExactMonth(a, month, year);
    const bExact = isExactMonth(b, month, year);
    if (aExact !== bExact) return aExact ? -1 : 1;
    return spanLength(a) - spanLength(b);
  });

  return covering[0]?.id ?? null;
}

export function dueMatchesSpan(
  due: { statementPeriodKey?: string | null; dueDateYmd: string },
  span: MonthSpan,
): boolean {
  const periodMatch = /^(\d{4})-(\d{2})$/.exec(due.statementPeriodKey ?? "");
  if (periodMatch) {
    return spanIncludesMonth(
      span,
      Number(periodMatch[1]),
      Number(periodMatch[2]),
    );
  }
  const dueMatch = /^(\d{4})-(\d{2})-/.exec(due.dueDateYmd);
  if (!dueMatch) return false;
  return spanIncludesMonth(span, Number(dueMatch[1]), Number(dueMatch[2]));
}

function clampOverviewPeriod(
  period: OverviewPeriod,
  today: { year: number; month: number },
): OverviewPeriod {
  let year = period.year;
  let month = period.month;
  if (!Number.isInteger(year)) year = today.year;
  if (!Number.isInteger(month) || month < 1 || month > 12) month = today.month;
  year = Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
  const clamped = { grain: period.grain, year, month };
  if (isAfterToday(clamped, today)) {
    return { grain: period.grain, year: today.year, month: today.month };
  }
  return clamped;
}

function shiftMonth(period: OverviewPeriod, delta: number): OverviewPeriod {
  const index = period.year * 12 + (period.month - 1) + delta;
  return {
    ...period,
    year: Math.floor(index / 12),
    month: (index % 12) + 1,
  };
}

function isAfterToday(
  period: OverviewPeriod,
  today: { year: number; month: number },
): boolean {
  if (period.grain === "year") return period.year > today.year;
  return (
    period.year > today.year ||
    (period.year === today.year && period.month > today.month)
  );
}

function isExactMonth(
  period: {
    fromMonth: number;
    fromYear: number;
    toMonth: number;
    toYear: number;
  },
  month: number,
  year: number,
): boolean {
  return (
    period.fromMonth === month &&
    period.toMonth === month &&
    period.fromYear === year &&
    period.toYear === year
  );
}

function spanLength(period: {
  fromMonth: number;
  fromYear: number;
  toMonth: number;
  toYear: number;
}): number {
  return (
    period.toYear * 12 +
    period.toMonth -
    (period.fromYear * 12 + period.fromMonth)
  );
}
