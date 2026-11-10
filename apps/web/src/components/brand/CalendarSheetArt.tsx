import { DayMark, type DayMarkKind } from "@/components/calendar/DayMark";
import { monthGrid } from "@/lib/calendar/month-grid";
import { cn } from "@/lib/utils/cn";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** Sample marks for the illustration only: two paid, one due soon, one due, one missing SOA. */
const SAMPLE_MARKS: Record<number, DayMarkKind> = {
  4: "paid",
  11: "paid",
  18: "urgent",
  22: "due",
  25: "missing",
};

/**
 * Decorative wall-calendar sheet (current month, sample marks). Server-renderable.
 * Used on sign-in and the landing page; never shows user data.
 */
export function CalendarSheetArt({
  className,
  now = new Date(),
}: {
  className?: string;
  now?: Date;
}) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const weeks = monthGrid(year, month);

  return (
    <div
      aria-hidden
      className={cn(
        "relative select-none rounded-lg border bg-card p-5 shadow-overlay sm:p-6",
        className,
      )}
    >
      {/* binding holes */}
      <div className="absolute -top-2.5 left-6 right-6 flex justify-between">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className="h-5 w-1 rounded-full bg-foreground/80" />
        ))}
      </div>
      <div className="mb-4 flex items-baseline justify-between gap-3 border-b-2 border-foreground pb-3">
        <span className="font-headline text-3xl uppercase leading-none sm:text-4xl">
          {MONTHS[month - 1]}
        </span>
        <span className="font-numeral text-2xl leading-none text-muted-foreground">{year}</span>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LETTERS.map((letter, index) => (
          <span
            key={`${letter}-${index}`}
            className={cn("pb-1 text-xs font-bold", index === 0 ? "text-due" : "text-muted-foreground")}
          >
            {letter}
          </span>
        ))}
        {weeks.flat().map((cell) => {
          const mark = cell.inMonth ? (SAMPLE_MARKS[cell.day] ?? "none") : "none";
          return (
            <span key={cell.ymd} className="flex h-10 items-center justify-center sm:h-11">
              <DayMark kind={mark} className="size-8">
                <span
                  className={cn(
                    "font-numeral text-lg leading-none",
                    !cell.inMonth && "text-muted-foreground/30",
                    cell.inMonth && cell.weekday === 0 && "text-due",
                  )}
                >
                  {cell.day}
                </span>
              </DayMark>
            </span>
          );
        })}
      </div>
    </div>
  );
}
