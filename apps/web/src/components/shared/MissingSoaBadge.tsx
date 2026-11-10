import type { ReactNode } from "react";

import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { cn } from "@/lib/utils/cn";

import { StatusBadge } from "./StatusBadge";

export const MISSING_SOA_LABEL = "SOA missing";
export const MISSING_SOA_DETAIL =
  "Statement date passed. SOA not available.";

export function MissingSoaBadge({ className }: { className?: string }) {
  return (
    <StatusBadge
      label={MISSING_SOA_LABEL}
      variant="warning"
      mark="missing"
      className={className}
    />
  );
}

export function MissingSoaNotice({
  className,
  actions,
}: {
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col gap-3 rounded-md bg-warning-wash px-3 py-2.5 text-13 text-warning sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="flex items-center gap-2 font-semibold">
        <DayMarkGlyph kind="missing" className="size-4" />
        {MISSING_SOA_DETAIL}
      </p>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
