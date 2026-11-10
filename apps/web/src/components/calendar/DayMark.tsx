import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Calendar marks — the status grammar shared by every screen (DESIGN.md › Shapes):
 * due = pen circle, overdue = red pen circle, paid = check crossing the date,
 * missing = dashed ring, expected = dotted ring, today = filled ink square.
 */
export type DayMarkKind =
  | "due"
  | "urgent"
  | "paid"
  | "missing"
  | "expected"
  | "today"
  | "none";

const STROKE: Record<Exclude<DayMarkKind, "none" | "today">, string> = {
  due: "text-foreground",
  urgent: "text-due",
  paid: "text-success",
  missing: "text-warning",
  expected: "text-muted-foreground",
};

type DayMarkProps = {
  kind: DayMarkKind;
  children: ReactNode;
  className?: string;
  /** Draw the stroke in (pen motion). Use once, right after a state change. */
  animate?: boolean;
};

/** Wraps a numeral and draws its mark around it. */
export function DayMark({ kind, children, className, animate }: DayMarkProps) {
  if (kind === "none") {
    return (
      <span className={cn("relative inline-flex items-center justify-center", className)}>
        {children}
      </span>
    );
  }

  if (kind === "today") {
    return (
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-sm bg-foreground text-background",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
    >
      <span className="relative z-[1]">{children}</span>
      <MarkSvg kind={kind} animate={animate} />
    </span>
  );
}

function MarkSvg({
  kind,
  animate,
}: {
  kind: Exclude<DayMarkKind, "none" | "today">;
  animate?: boolean;
}) {
  const color = STROKE[kind];

  if (kind === "paid") {
    return (
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className={cn("pointer-events-none absolute -inset-[18%] h-[136%] w-[136%] overflow-visible", color)}
      >
        <path
          d="M9 21.5 L17 29 L32 10"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? "kame-draw" : undefined}
          style={animate ? ({ "--kame-stroke-length": 40 } as CSSProperties) : undefined}
        />
      </svg>
    );
  }

  if (kind === "missing" || kind === "expected") {
    return (
      <svg
        viewBox="0 0 40 40"
        aria-hidden
        className={cn("pointer-events-none absolute -inset-[16%] h-[132%] w-[132%] overflow-visible", color)}
      >
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="currentColor"
          strokeWidth={kind === "missing" ? 1.8 : 1.6}
          strokeDasharray={kind === "missing" ? "4.5 3.5" : "0.1 4"}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Pen circle: a slightly open, hand-drawn ellipse.
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden
      className={cn("pointer-events-none absolute -inset-[20%] h-[140%] w-[140%] overflow-visible", color)}
    >
      <path
        d="M31.5 9.5 C26.5 4.8 13.8 4.4 8.2 10.6 C3.2 16.2 4.6 27.4 11.4 32.2 C18.4 37.1 30.8 35.4 34.4 27.6 C37.2 21.4 35.6 14.6 29.2 8.4"
        fill="none"
        stroke="currentColor"
        strokeWidth={kind === "urgent" ? 2.2 : 1.8}
        strokeLinecap="round"
        className={animate ? "kame-draw" : undefined}
        style={animate ? ({ "--kame-stroke-length": 110 } as CSSProperties) : undefined}
      />
    </svg>
  );
}

/** Small inline glyph version for tags and legends. */
export function DayMarkGlyph({
  kind,
  className,
}: {
  kind: Exclude<DayMarkKind, "none">;
  className?: string;
}) {
  if (kind === "today") {
    return <span aria-hidden className={cn("inline-block size-2.5 rounded-[2px] bg-current", className)} />;
  }
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-3.5 shrink-0", className)}>
      {kind === "paid" ? (
        <path d="M3 8.6 L6.6 12 L13 4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      ) : kind === "missing" || kind === "expected" ? (
        <circle
          cx="8"
          cy="8"
          r="5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeDasharray={kind === "missing" ? "2.4 1.8" : "0.1 2.4"}
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M12.2 4 C10.2 2 5.6 1.9 3.6 4.3 C1.8 6.5 2.3 10.9 4.8 12.6 C7.4 14.4 11.8 13.8 13.1 10.8 C14.1 8.4 13.5 5.8 11.2 3.4"
          fill="none"
          stroke="currentColor"
          strokeWidth={kind === "urgent" ? 1.8 : 1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
