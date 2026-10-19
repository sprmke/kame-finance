import { AlertTriangle } from "lucide-react";

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
      className={className}
    />
  );
}

export function MissingSoaNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <p>{MISSING_SOA_DETAIL}</p>
    </div>
  );
}
