/**
 * Skeleton kit: shade blocks in the exact shape of the final layouts
 * (DESIGN.md › Skeletons). Every route's loading.tsx and in-page loading state
 * uses these so the page never jumps when data lands.
 */
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-lg border bg-card", className)}>{children}</div>;
}

export function SkeletonPageActions({ count = 1 }: { count?: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn("h-10 rounded-md", i === count - 1 ? "w-32" : "w-24")} />
      ))}
    </div>
  );
}

export function PageHeaderSkeleton({
  actions = 1,
  figures = 0,
  breadcrumb = false,
}: {
  actions?: number;
  figures?: number;
  breadcrumb?: boolean;
}) {
  return (
    <div className="space-y-4">
      {breadcrumb ? <Skeleton className="h-4 w-40" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-8 w-44" />
        {actions > 0 ? <SkeletonPageActions count={actions} /> : null}
      </div>
      {figures > 0 ? <FigureLineSkeleton count={figures} /> : null}
    </div>
  );
}

export function FigureLineSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("space-y-1.5", i > 0 && "sm:border-l sm:pl-5")}>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SegmentedSkeleton({ items = 2 }: { items?: number }) {
  return (
    <div className="inline-flex gap-0.5 rounded-md border bg-muted p-0.5">
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className={cn("h-9 w-20 rounded-[5px]", i === 0 ? "bg-card" : "bg-transparent")} />
      ))}
    </div>
  );
}

function RowSkeleton({ amount = true }: { amount?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:px-4">
      <div className="flex w-12 shrink-0 flex-col items-center gap-1.5">
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-2.5 w-10" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-[18px] w-7 rounded-[3px]" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-[22px] w-24 rounded-sm" />
      </div>
      {amount ? <Skeleton className="h-6 w-24 shrink-0" /> : null}
      <Skeleton className="hidden h-9 w-28 shrink-0 rounded-md md:block" />
    </div>
  );
}

export function RowListSkeleton({ rows = 4, amount = true }: { rows?: number; amount?: boolean }) {
  return (
    <Panel className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} amount={amount} />
      ))}
    </Panel>
  );
}

function CalendarSkeleton() {
  return (
    <Panel className="px-2 pb-1 pt-3 sm:px-3">
      <div className="grid grid-cols-7 border-b pb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="mx-auto h-3 w-3" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, w) => (
        <div key={w} className="grid grid-cols-7 border-b last:border-b-0">
          {Array.from({ length: 7 }).map((_, d) => (
            <div key={d} className="flex h-[3.25rem] items-start justify-center border-r pt-2 last:border-r-0 sm:h-16 sm:justify-start sm:pl-2">
              <Skeleton className="h-5 w-5" />
            </div>
          ))}
        </div>
      ))}
    </Panel>
  );
}

function LedgerPanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Panel>
      <div className="border-b px-4 py-3">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-3 px-4 py-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** Home: calendar + needs-you, then ledger + spend. */
export function OverviewContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <CalendarSkeleton />
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <RowListSkeleton rows={4} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <LedgerPanelSkeleton />
        <Panel className="flex min-h-72 items-center justify-center p-6">
          <Skeleton className="size-44 rounded-full" />
        </Panel>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          <SegmentedSkeleton />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </div>
      <OverviewContentSkeleton />
    </div>
  );
}

/** Bills › Due: filters + grouped bill rows. */
export function RemindersContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <SegmentedSkeleton items={4} />
        <SegmentedSkeleton items={2} />
      </div>
      <Skeleton className="h-4 w-32" />
      <RowListSkeleton rows={5} />
    </div>
  );
}

export const RemindersHubContentSkeleton = RemindersContentSkeleton;

export function BillsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actions={1} figures={3} />
      <SegmentedSkeleton items={2} />
      <RemindersContentSkeleton />
    </div>
  );
}

/** Bills › Receipts board. */
export function ReceiptsContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-24" />
        <SegmentedSkeleton items={2} />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i} className="overflow-hidden">
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

/** Statements list. */
export function SoaListContentSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading">
      <FigureLineSkeleton count={3} />
      <RowListSkeleton rows={6} />
    </div>
  );
}

export function StatementsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actions={1} />
      <SoaListContentSkeleton />
    </div>
  );
}

export function TabsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex h-11 items-end gap-5 border-b">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="mb-3 h-4 w-20" />
      ))}
    </div>
  );
}

/** Statement month: header, figures, tabs, rows. */
export function SoaPeriodDetailContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <PageHeaderSkeleton breadcrumb actions={2} figures={4} />
      <TabsSkeleton />
      <RowListSkeleton rows={5} />
    </div>
  );
}

export function TransactionListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Panel className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4 max-w-xs" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </Panel>
  );
}

/** One card's statement. */
export function SoaStatementDetailContentSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <PageHeaderSkeleton breadcrumb actions={2} />
      <Panel className="grid gap-4 p-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-28" />
          </div>
        ))}
      </Panel>
      <TransactionListSkeleton />
    </div>
  );
}

/** Cards list. */
export function CreditCardsContentSkeleton() {
  return <RowListSkeleton rows={5} amount={false} />;
}

export function CardsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton actions={1} />
      <CreditCardsContentSkeleton />
    </div>
  );
}

export function CardFormSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-3">
          <Skeleton className="h-4 w-28" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SettingsFormPanel({ fields = 2 }: { fields?: number }) {
  return (
    <Panel className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-[22px] w-20 rounded-sm" />
      </div>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
    </Panel>
  );
}

export function IntegrationsSettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading">
      <RowListSkeleton rows={2} amount={false} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsFormPanel fields={3} />
        <SettingsFormPanel fields={1} />
      </div>
    </div>
  );
}

export function AutomationCardSkeleton() {
  return (
    <Panel className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-28" />
        </div>
        <Skeleton className="h-6 w-10 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>
    </Panel>
  );
}

export function AutomationsContentSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <AutomationCardSkeleton />
      <AutomationCardSkeleton />
    </div>
  );
}

export function AiKeysCardSkeleton() {
  return <SettingsFormPanel fields={2} />;
}

export function TransactionCategoryRulesContentSkeleton() {
  return (
    <Panel className="space-y-4 p-4">
      <Skeleton className="h-5 w-40" />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md sm:w-48" />
        <Skeleton className="h-10 w-full rounded-md sm:w-24" />
      </div>
      <RowListSkeleton rows={3} amount={false} />
    </Panel>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <div className="flex gap-4 border-b pb-3 lg:flex-col lg:gap-2 lg:border-b-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-24 lg:h-10 lg:w-full lg:rounded-md" />
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <IntegrationsSettingsSkeleton />
        </div>
      </div>
    </div>
  );
}

export function MediaPreviewSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("h-full min-h-[240px] w-full rounded-md lg:min-h-[380px]", className)}
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
        <Skeleton className="h-[22px] w-20 rounded-sm" />
        <Skeleton className="h-[22px] w-16 rounded-sm" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-20 w-full rounded-md" />
    </div>
  );
}

export function ThumbnailSkeleton({ layout = "sidebar" }: { layout?: "sidebar" | "cover" }) {
  return (
    <Skeleton
      className={cn(
        "rounded-none",
        layout === "cover" ? "aspect-[4/3] w-full" : "absolute inset-0 h-full w-full",
      )}
    />
  );
}
