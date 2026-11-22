import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { tableCardClassName } from "@/components/shared/TableCard";
import { statGridClassName } from "@/components/shared/StatCard";
import { cn } from "@/lib/utils/cn";

type SkeletonShellProps = {
  className?: string;
  children: React.ReactNode;
  label?: string;
};

export function SkeletonShell({
  className,
  children,
  label = "Loading content",
}: SkeletonShellProps) {
  return (
    <div
      className={className}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Muted bar for skeleton bars placed on top of muted/segmented surfaces. */
function ToggleBar({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-4 bg-muted-foreground/20", className)} />
  );
}

/* -------------------------------------------------------------------------- */
/* Header + actions                                                           */
/* -------------------------------------------------------------------------- */

export function SkeletonPageActions({ count = 1 }: { count?: number }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-11 shrink-0 rounded-lg lg:h-9",
            i === 0 ? "w-28" : "w-24",
          )}
        />
      ))}
    </div>
  );
}

/**
 * Mirrors `PageActionBar`: secondary actions are inline from `lg`, and collapse
 * into the “More actions” icon button below it. The primary action is always
 * visible and is 44px tall on mobile, 36px from `lg`.
 */
export function PageActionBarSkeleton({
  secondaryCount = 0,
  primaryWidth = "w-28",
}: {
  secondaryCount?: number;
  primaryWidth?: string;
}) {
  return (
    <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto">
      {secondaryCount > 0 ? (
        <>
          <div className="hidden items-center gap-1.5 lg:flex">
            {Array.from({ length: secondaryCount }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn("h-9 rounded-lg", i % 2 === 0 ? "w-32" : "w-28")}
              />
            ))}
          </div>
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg lg:hidden" />
        </>
      ) : null}
      <Skeleton
        className={cn("h-11 shrink-0 rounded-lg lg:h-9", primaryWidth)}
      />
    </div>
  );
}

/** Overview header: period switcher + Run SOA. */
export function OverviewHeaderActionsSkeleton() {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <Skeleton className="h-11 min-w-0 flex-1 rounded-lg sm:h-9 sm:w-[13.5rem] sm:flex-none" />
      <Skeleton className="h-11 w-[5.75rem] shrink-0 rounded-lg sm:h-9" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat cards                                                                 */
/* -------------------------------------------------------------------------- */

export function StatCardSkeleton({ title }: { title?: string }) {
  return (
    <Card className="relative overflow-hidden border-border/80 shadow-card">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-muted"
        aria-hidden
      />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-3 pb-1 pt-3">
        {title ? (
          <div className="pt-0.5 text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
            {title}
          </div>
        ) : (
          <Skeleton className="mt-0.5 h-4 w-20 sm:w-24" />
        )}
        <Skeleton className="h-[26px] w-[26px] shrink-0 rounded-md" />
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <Skeleton className="h-5 w-20 sm:h-6 sm:w-24" />
      </CardContent>
    </Card>
  );
}

export function StatCardsRowSkeleton({
  count = 4,
  titles,
}: {
  count?: number;
  titles?: string[];
}) {
  return (
    <div className={statGridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} title={titles?.[i]} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Toolbars + toggles                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors the segmented control used by `ViewToggle`, `ReceiptGroupToggle`, and
 * `ReminderGroupToggle` (two icon+label buttons inside a bordered muted pill).
 */
export function SegmentedToggleSkeleton({
  count = 2,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center overflow-x-auto rounded-lg border bg-muted p-1",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md px-2.5 sm:px-3",
            i === 0 && "bg-background shadow-sm",
          )}
        >
          <ToggleBar className="h-4 w-4 rounded-sm" />
          <ToggleBar className="hidden h-3 w-10 sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Kept for callers that only need the two-option month/card toggle. */
export function GroupToggleSkeleton({ className }: { className?: string }) {
  return <SegmentedToggleSkeleton count={2} className={className} />;
}

/**
 * Mirrors `ListViewToolbar`: count on the left, view toggle on the right which
 * is hidden below `md` (mobile always renders cards).
 */
export function ListViewToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="hidden md:block">
        <SegmentedToggleSkeleton count={2} />
      </div>
    </div>
  );
}

/**
 * Mirrors the receipts/reminders toolbar: count on top on phones and the
 * month/card toggle full width until `sm`.
 */
export function GroupedListToolbarSkeleton({
  toggleCount = 2,
}: {
  toggleCount?: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Skeleton className="h-5 w-24" />
      <SegmentedToggleSkeleton
        count={toggleCount}
        className="w-full shrink-0 sm:w-auto"
      />
    </div>
  );
}

/** @deprecated Prefer `GroupedListToolbarSkeleton` or `ListViewToolbarSkeleton`. */
export function ListCountToolbarSkeleton() {
  return <GroupedListToolbarSkeleton />;
}

/** Mirrors the reminders “Due dates” status summary card. */
export function DueDatesSummarySkeleton() {
  return (
    <Card className="border-border/80 shadow-card">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="hidden h-5 w-28 rounded-full sm:block" />
          </div>
        </div>
        <SegmentedToggleSkeleton className="w-full shrink-0 sm:w-auto" />
      </CardContent>
    </Card>
  );
}

export const StatusBarSkeleton = DueDatesSummarySkeleton;

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

function OverviewMetricSkeleton({
  label,
  valueWidth = "w-10",
  showCaption = true,
}: {
  label: string;
  valueWidth?: string;
  showCaption?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <Skeleton className={cn("h-4 shrink-0", valueWidth)} />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      {showCaption ? (
        <Skeleton className="hidden h-3 w-full max-w-[13rem] sm:block" />
      ) : null}
    </div>
  );
}

export function OverviewPeriodMissionSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <div
        className="h-1 w-full bg-muted"
        aria-hidden
      />
      <CardContent className="space-y-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              <Skeleton className="h-6 w-36" />
            </div>
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-9 w-[5.75rem] shrink-0 rounded-lg" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <OverviewMetricSkeleton label="Paid vs statement" valueWidth="w-8" />
          <OverviewMetricSkeleton label="Minimum met" valueWidth="w-14" />
          <OverviewMetricSkeleton label="Cards" valueWidth="w-8" />
        </div>

        <div className="space-y-1.5 border-t border-border/60 pt-3">
          <Skeleton className="h-3 w-28" />
          <ul className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border/80 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-3.5 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryDonutSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto flex h-44 w-full max-w-xs items-center justify-center sm:h-56 lg:h-64",
        className,
      )}
    >
      <Skeleton className="h-36 w-36 rounded-full sm:h-44 sm:w-44 lg:h-52 lg:w-52" />
      <div className="absolute flex flex-col items-center gap-1.5">
        <Skeleton className="h-2.5 w-12" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}

function CategoryLegendSkeleton({ items = 5 }: { items?: number }) {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <li
          key={i}
          className="inline-flex items-center gap-1.5 px-2 py-1.5"
        >
          <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
          <Skeleton
            className={cn("h-3", i % 3 === 0 ? "w-16" : "w-12")}
          />
        </li>
      ))}
    </ul>
  );
}

/** Mirrors `SoaPeriodSpendByCategoryCard` with the real card title. */
export function SpendByCategoryCardSkeleton({
  className,
  title = "Spend by category",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Card className={className ?? "border-border/80 shadow-card"}>
      <CardHeader>
        <div className="font-display text-base font-semibold">{title}</div>
      </CardHeader>
      <CardContent>
        <CategoryDonutSkeleton />
        <CategoryLegendSkeleton />
      </CardContent>
    </Card>
  );
}

function SummaryRowSkeleton() {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

/** Mirrors `SoaPeriodSummaryCard`. */
export function PeriodSummaryCardSkeleton({
  className,
  title = "Period summary",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Card className={className ?? "border-border/80 shadow-card"}>
      <CardHeader>
        <div className="font-display text-base font-semibold">{title}</div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <SummaryRowSkeleton />
        <SummaryRowSkeleton />
        <SummaryRowSkeleton />
        <SummaryRowSkeleton />
        <div className="hidden space-y-2 sm:block">
          <div className="border-t border-border/60 pt-2" />
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
          <SummaryRowSkeleton />
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewListCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-44" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

export function QuickActionCardSkeleton() {
  return (
    <Card className="h-full border-border/80">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardHeader>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Due entries                                                                */
/* -------------------------------------------------------------------------- */

export function DueEntryCardSkeleton() {
  return (
    <Card className="flex h-full flex-col border-border/80 shadow-card">
      <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0 space-y-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Minimum</span>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Total due</span>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DueEntryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DueEntryCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReminderGroupHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border/60 pb-2">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Automations                                                                */
/* -------------------------------------------------------------------------- */

export function AutomationCardSkeleton() {
  return (
    <Card className="border-border/80 shadow-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-full max-w-[10rem]" />
            <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-[8rem]" />
          <Skeleton className="h-3 w-full max-w-[11rem]" />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Skeleton className="h-6 w-10 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Receipts                                                                   */
/* -------------------------------------------------------------------------- */

export function ReceiptCardSkeleton() {
  return (
    <Card className="relative overflow-hidden border-border/80 shadow-sm">
      <Skeleton className="absolute right-0.5 top-0.5 z-10 h-11 w-11 rounded-lg" />
      <div className="flex min-h-[7.5rem] items-stretch sm:min-h-[8rem]">
        <Skeleton className="w-[5.25rem] shrink-0 rounded-none border-r border-border/80 sm:w-24" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 pr-12">
          <div className="min-w-0 space-y-0.5">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="mt-auto space-y-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Mirrors `ReceiptSlotPlaceholder` (the per-card placeholder in the board). */
export function ReceiptSlotSkeleton() {
  return (
    <Card className="relative overflow-hidden border-dashed border-warning/50 shadow-sm">
      <Skeleton className="absolute right-0.5 top-0.5 z-10 h-11 w-11 rounded-lg" />
      <div className="flex min-h-[7.5rem] items-stretch sm:min-h-[8rem]">
        <div className="flex w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1.5 self-stretch border-r border-border/80 bg-muted/40 px-1 sm:w-24">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-10" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 pr-12">
          <div className="min-w-0 space-y-0.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-full rounded-full" />
          <div className="mt-auto space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/80 p-2">
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 flex-1 rounded-lg" />
      </div>
    </Card>
  );
}

export function ReceiptGridSkeleton({
  count = 4,
  variant = "slot",
}: {
  count?: number;
  variant?: "slot" | "receipt";
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) =>
        variant === "receipt" ? (
          <ReceiptCardSkeleton key={i} />
        ) : (
          <ReceiptSlotSkeleton key={i} />
        ),
      )}
    </div>
  );
}

export function ReceiptGroupHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Credit cards                                                               */
/* -------------------------------------------------------------------------- */

export function CreditCardCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <Skeleton className="h-1 w-full rounded-none" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20" />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="col-span-2 hidden space-y-1 sm:block">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="hidden h-10 w-full rounded-lg sm:block" />
      </CardContent>
    </Card>
  );
}

export function CreditCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CreditCardCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CreditCardsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={tableCardClassName}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Card</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Last 4</TableHead>
            <TableHead className="hidden lg:table-cell">Gmail</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Billing</TableHead>
            <TableHead>Reminders</TableHead>
            <TableHead className="w-[52px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SOA periods                                                                */
/* -------------------------------------------------------------------------- */

export function SoaPeriodCardSkeleton() {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-border/80 shadow-card">
      <Skeleton className="h-1 w-full shrink-0 rounded-none" />
      <Skeleton className="absolute right-2 top-3 z-10 h-8 w-8 rounded-lg" />
      <CardHeader className="space-y-0 pb-3 pr-12 pt-4">
        <div className="flex min-h-10 flex-col gap-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="mt-1 h-4 w-28" />
        <div className="mt-2 flex min-h-[22px] flex-wrap items-center gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="grid grid-cols-2 gap-x-4 border-b border-border/60 pb-3">
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="min-w-0 space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="flex min-h-[22px] flex-wrap items-center gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-auto h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function SoaPeriodGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SoaPeriodCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SoaPeriodTableSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div className={tableCardClassName}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Period</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Cards</TableHead>
            <TableHead className="text-right">Outstanding</TableHead>
            <TableHead>Next due</TableHead>
            <TableHead>Channels</TableHead>
            <TableHead>Last run</TableHead>
            <TableHead className="w-[52px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              <TableCell className="font-medium">
                <div className="min-w-0 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-6" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-10 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SOA statements                                                             */
/* -------------------------------------------------------------------------- */

export function SoaStatementCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <CardHeader className="space-y-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-1 text-right">
            <Skeleton className="ml-auto h-2.5 w-14" />
            <Skeleton className="ml-auto h-5 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/80 bg-muted/30 p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="min-w-0 space-y-1.5">
              <Skeleton className="h-2.5 w-10" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </CardHeader>
    </Card>
  );
}

export function SoaStatementGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SoaStatementCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SoaStatementsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={tableCardClassName}>
      <Table className="min-w-[980px]">
        <TableHeader>
          <TableRow>
            <TableHead>Card</TableHead>
            <TableHead>Last 4</TableHead>
            <TableHead>Statement</TableHead>
            <TableHead className="text-right">Total due</TableHead>
            <TableHead className="text-right">Minimum</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="w-[104px]">Paid</TableHead>
            <TableHead className="w-[72px] text-center">SOA</TableHead>
            <TableHead className="w-[88px] text-center">Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-14 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-auto h-8 w-8 rounded-md" />
              </TableCell>
              <TableCell>
                <Skeleton className="mx-auto h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Mirrors the statement detail hero card. */
export function StatementHeroSkeleton() {
  return (
    <Card className="overflow-hidden border-border/80 shadow-card">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                               */
/* -------------------------------------------------------------------------- */

export function TransactionRowSkeleton() {
  return (
    <div className="hidden max-h-[min(70vh,720px)] overflow-auto rounded-lg border border-border/80 md:block">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[11rem]">Category</TableHead>
            <TableHead className="w-[72px] text-center">Type</TableHead>
            <TableHead className="w-[120px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, row) => (
            <TableRow key={row}>
              <TableCell className="py-2.5">
                <Skeleton className="h-4 w-14" />
              </TableCell>
              <TableCell className="py-2.5">
                <Skeleton className="h-4 w-3/4 max-w-xs" />
              </TableCell>
              <TableCell className="py-2.5">
                <Skeleton className="h-8 w-[11rem] rounded-md" />
              </TableCell>
              <TableCell className="py-2.5 text-center">
                <Skeleton className="mx-auto h-4 w-12 rounded-full" />
              </TableCell>
              <TableCell className="py-2.5">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Mobile transaction cards, mirroring `SoaTransactionCards`. */
export function TransactionCardListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <article
          key={i}
          className="rounded-lg border border-border/80 bg-card p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-[11rem] rounded-md" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function TransactionListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <TransactionCardListSkeleton count={Math.min(rows, 6)} />
      <TransactionRowSkeleton />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Forms + settings                                                           */
/* -------------------------------------------------------------------------- */

export function FieldSkeleton({
  labelWidth = "w-16",
  inputHeight = "h-10",
}: {
  labelWidth?: string;
  inputHeight?: string;
}) {
  return (
    <div className="space-y-2">
      <Skeleton className={cn("h-4", labelWidth)} />
      <Skeleton className={cn("w-full rounded-md", inputHeight)} />
    </div>
  );
}

/** Mirrors the add/edit credit card form. */
export function CardFormSkeleton() {
  return (
    <div className="space-y-4">
      <FieldSkeleton labelWidth="w-24" />
      <FieldSkeleton labelWidth="w-10" />
      <FieldSkeleton labelWidth="w-12" />
      <FieldSkeleton labelWidth="w-28" />
      <FieldSkeleton labelWidth="w-24" />
      <FieldSkeleton labelWidth="w-16" />
      <FieldSkeleton labelWidth="w-20" />
      <FieldSkeleton labelWidth="w-20" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function SwitchRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-6 w-10 rounded-full" />
    </div>
  );
}

/** Mirrors `EditSoaPeriodDialog` content while the period loads. */
export function EditSoaPeriodFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="space-y-4 py-2">
        <SwitchRowSkeleton />
        <SwitchRowSkeleton />
        <SwitchRowSkeleton />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Skeleton className="h-10 w-full rounded-lg sm:w-20" />
        <Skeleton className="h-10 w-full rounded-lg sm:w-16" />
      </div>
    </div>
  );
}

/** Mirrors the Google account rows in Settings. */
export function GoogleAccountsListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0 space-y-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-52" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-9 w-16 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
      <Skeleton className="h-10 w-44 rounded-lg" />
    </div>
  );
}

/** Mirrors a group of pickable credit cards inside the Google dialogs. */
export function CreditCardChecklistSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex min-h-[44px] items-start gap-3 px-1 py-1">
          <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1 space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CategoryRulesSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="max-h-80 divide-y divide-border/60 overflow-y-auto rounded-lg border border-border/80">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
        >
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Mirrors the two provider columns in `AiApiKeysSettings`. */
export function AiKeysCardSkeleton() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle className="text-base">Receipt AI</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg sm:w-28 sm:flex-none" />
              <Skeleton className="h-10 flex-1 rounded-lg sm:w-20 sm:flex-none" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function BreadcrumbSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-3 w-2" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

/** Static-looking tab bar so the real tab strip doesn’t change height. */
export function TabsSkeleton({
  tabs = ["Overview", "Cards", "Transactions", "Analytics"],
  active = "Overview",
}: {
  tabs?: string[];
  active?: string;
}) {
  return (
    <div className="inline-flex h-11 w-full items-center justify-start overflow-x-auto rounded-lg bg-muted p-1 sm:h-9">
      {tabs.map((tab) => (
        <span
          key={tab}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium",
            tab === active
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground",
          )}
        >
          {tab}
        </span>
      ))}
    </div>
  );
}

export function MediaPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "h-full w-full min-h-[240px] rounded-md lg:min-h-[380px]",
        className,
      )}
    />
  );
}

export function PdfPreviewSkeleton() {
  return <MediaPreviewSkeleton className="min-h-[70vh] rounded-none" />;
}

export function ReceiptPreviewDetailsSkeleton() {
  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <div className="space-y-2 rounded-lg border border-border/80 bg-muted/10 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ThumbnailSkeleton({
  layout = "sidebar",
}: {
  layout?: "sidebar" | "cover";
}) {
  return (
    <Skeleton
      className={cn(
        "rounded-none",
        layout === "cover"
          ? "aspect-[4/3] w-full"
          : "absolute inset-0 h-full w-full",
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Data table (generic, retained for callers)                                 */
/* -------------------------------------------------------------------------- */

export function DataTableSkeleton({
  columns = 6,
  rows = 7,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className={tableCardClassName}>
      <div className="border-b border-border/80 bg-muted/20 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn("h-4", i === columns - 1 ? "ml-auto w-8" : "w-20")}
            />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, col) => (
              <Skeleton
                key={col}
                className={cn(
                  "h-4",
                  col === 0
                    ? "w-32"
                    : col === columns - 1
                      ? "ml-auto w-8"
                      : "w-20",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
