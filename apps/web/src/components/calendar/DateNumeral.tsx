import { cn } from "@/lib/utils/cn";

import { DayMark, type DayMarkKind } from "./DayMark";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
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

export function parseYmd(ymd: string | null | undefined) {
  if (!ymd) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, weekday };
}

type DateNumeralProps = {
  ymd: string | null | undefined;
  mark?: DayMarkKind;
  size?: "sm" | "md" | "lg";
  /** Show "Thu · Nov" under the day. */
  showContext?: boolean;
  animate?: boolean;
  className?: string;
};

const SIZE = {
  sm: { box: "size-9", num: "text-lg" },
  md: { box: "size-11", num: "text-xl" },
  lg: { box: "size-14", num: "text-2xl" },
} as const;

/**
 * A calendar date the way a wall calendar prints it: the day as a heavy
 * condensed numeral, Sundays in red, with its status mark drawn around it.
 */
export function DateNumeral({
  ymd,
  mark = "none",
  size = "md",
  showContext = true,
  animate,
  className,
}: DateNumeralProps) {
  const parsed = parseYmd(ymd);
  const s = SIZE[size];

  if (!parsed) {
    return (
      <div className={cn("flex w-12 shrink-0 flex-col items-center", className)}>
        <span className={cn("font-numeral leading-none text-muted-foreground", s.num)}>
          –
        </span>
        {showContext ? (
          <span className="mt-1 text-2xs font-semibold text-muted-foreground">
            No date
          </span>
        ) : null}
      </div>
    );
  }

  const sunday = parsed.weekday === 0;

  return (
    <div className={cn("flex w-12 shrink-0 flex-col items-center", className)}>
      <DayMark kind={mark} animate={animate} className={cn(s.box, "rounded-sm")}>
        <span
          className={cn(
            "font-numeral leading-none",
            s.num,
            mark !== "today" && sunday && "text-due",
          )}
        >
          {parsed.day}
        </span>
      </DayMark>
      {showContext ? (
        <span className="mt-1 whitespace-nowrap text-2xs font-semibold text-muted-foreground">
          {WEEKDAYS[parsed.weekday]} · {MONTHS[parsed.month - 1]}
        </span>
      ) : null}
    </div>
  );
}

export function formatShortDate(ymd: string | null | undefined): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return "—";
  return `${MONTHS[parsed.month - 1]} ${parsed.day}`;
}

export function formatWeekdayDate(ymd: string | null | undefined): string {
  const parsed = parseYmd(ymd);
  if (!parsed) return "—";
  return `${WEEKDAYS[parsed.weekday]}, ${MONTHS[parsed.month - 1]} ${parsed.day}`;
}
