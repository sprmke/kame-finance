import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/**
 * Figure strip: one ruled panel split into cells (not separate cards).
 * Wrap StatCards in `statGridClassName`.
 */
export const statGridClassName =
  "grid grid-cols-2 overflow-hidden rounded-lg border bg-card xl:grid-cols-4 [&>*]:border-border [&>*:nth-child(odd)]:border-r xl:[&>*]:border-r xl:[&>*:last-child]:border-r-0 [&>*:nth-child(-n+2)]:border-b xl:[&>*]:border-b-0";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  /** Kept for API compatibility; figures carry no icon tiles. */
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({ title, value, subtitle, className }: StatCardProps) {
  const text = String(value);
  const isAmount = /\d/.test(text) && /[.,]\d{2}$/.test(text);
  return (
    <div className={cn("min-w-0 px-4 py-3", className)}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="font-numeral mt-1.5 break-words text-[1.375rem] leading-none text-foreground">
        {isAmount ? (
          <span className="mr-0.5 font-sans text-[0.62em] font-medium opacity-80">₱</span>
        ) : null}
        {text}
      </p>
      {subtitle ? (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
