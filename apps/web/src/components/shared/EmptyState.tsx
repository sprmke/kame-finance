import { type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message: string;
  action?: ReactNode;
  className?: string;
  /** Smaller variant for use inside panels and tabs. */
  compact?: boolean;
}

/** A blank calendar page: what's missing and the one action that fills it. */
export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-card text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div className="text-muted-foreground" aria-hidden>
        {icon ?? <BlankPage />}
      </div>
      <div className="max-w-sm space-y-1">
        {title ? <h3 className="text-base font-bold">{title}</h3> : null}
        <p className="text-13 text-muted-foreground">{message}</p>
      </div>
      {action ? (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}

function BlankPage() {
  return (
    <svg viewBox="0 0 40 40" className="size-10" fill="none" aria-hidden>
      <rect x="6" y="7" width="28" height="27" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 14h28" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 4v6M27 4v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M24.5 20.5c-1.8-1.6-5.9-1.7-7.7.3-1.6 1.8-1.2 5.4 1 6.9 2.3 1.6 6.3 1 7.4-1.5.9-2 .4-4.2-1.7-6.2"
        stroke="hsl(var(--due))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
