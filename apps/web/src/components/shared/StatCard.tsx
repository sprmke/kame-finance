import { type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export const statGridClassName =
  "grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/80 shadow-card transition-shadow hover:shadow-card-hover",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[hsl(var(--chart-2))] to-primary/50"
        aria-hidden
      />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-1 pt-3">
        <CardTitle className="text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
          {title}
        </CardTitle>
        {Icon ? (
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="break-words font-display text-lg font-semibold tabular-nums leading-none text-foreground sm:text-xl">
          {value}
        </div>
        {subtitle ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
