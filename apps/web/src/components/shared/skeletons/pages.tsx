import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, Mail, MessageCircle, Slack } from "lucide-react";

import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { DashboardSection } from "@/components/shared/DashboardSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/config/routes";
import type { ViewMode } from "@/components/shared/ViewToggle";

/** Kept local so shared skeletons do not import feature modules. */
export type SoaPeriodSkeletonTab =
  | "overview"
  | "cards"
  | "transactions"
  | "analytics";

import {
  AiKeysCardSkeleton,
  AutomationCardSkeleton,
  BreadcrumbSkeleton,
  CardFormSkeleton,
  CategoryDonutSkeleton,
  CategoryRulesSkeleton,
  CreditCardCardSkeleton,
  CreditCardsTableSkeleton,
  DueDatesSummarySkeleton,
  DueEntryGridSkeleton,
  GoogleAccountsListSkeleton,
  GroupedListToolbarSkeleton,
  ListViewToolbarSkeleton,
  OverviewHeaderActionsSkeleton,
  OverviewPeriodMissionSkeleton,
  PageActionBarSkeleton,
  PeriodSummaryCardSkeleton,
  ReceiptGroupHeaderSkeleton,
  ReceiptGridSkeleton,
  ReminderGroupHeaderSkeleton,
  SegmentedToggleSkeleton,
  SkeletonShell,
  SoaPeriodCardSkeleton,
  SoaPeriodGridSkeleton,
  SoaPeriodTableSkeleton,
  SoaStatementGridSkeleton,
  SoaStatementsTableSkeleton,
  SpendByCategoryCardSkeleton,
  StatementHeroSkeleton,
  StatCardsRowSkeleton,
  TabsSkeleton,
  TransactionListSkeleton,
} from "./parts";

/* -------------------------------------------------------------------------- */
/* Shared chrome                                                              */
/* -------------------------------------------------------------------------- */

function DynamicPageHeaderSkeleton({
  titleWidth = "w-48",
  actions,
}: {
  titleWidth?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 border-l border-primary pl-3">
        <Skeleton className={`h-6 ${titleWidth}`} />
      </div>
      {actions ? (
        <div className="min-w-0 sm:max-w-[70%] sm:shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

export function OverviewContentSkeleton() {
  return (
    <SkeletonShell label="Loading overview">
      <div className="space-y-4">
        <OverviewPeriodMissionSkeleton />
        <div className="grid gap-3 lg:grid-cols-2">
          <SpendByCategoryCardSkeleton />
          <PeriodSummaryCardSkeleton className="hidden border-border/80 shadow-card lg:block" />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function OverviewPageSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Overview"
        actions={<OverviewHeaderActionsSkeleton />}
      />
      <OverviewContentSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reminders                                                                  */
/* -------------------------------------------------------------------------- */

function ReminderGroupsSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, group) => (
        <div key={group} className="space-y-4">
          <ReminderGroupHeaderSkeleton />
          <DueEntryGridSkeleton count={4} />
        </div>
      ))}
    </div>
  );
}

export function RemindersContentSkeleton() {
  return (
    <SkeletonShell label="Loading due dates">
      <div className="space-y-4">
        <DueDatesSummarySkeleton />
        <Card className="border-border/80 shadow-card">
          <CardContent className="p-3 sm:p-4">
            <ReminderGroupsSkeleton />
          </CardContent>
        </Card>
      </div>
    </SkeletonShell>
  );
}

export function RemindersHubContentSkeleton() {
  return (
    <SkeletonShell label="Loading reminders">
      <div className="space-y-4">
        <DashboardSection title="Due dates">
          <DueDatesSummarySkeleton />
          <Card className="border-border/80 shadow-card">
            <CardContent className="p-3 sm:p-4">
              <ReminderGroupsSkeleton />
            </CardContent>
          </Card>
        </DashboardSection>

        <DashboardSection title="Schedule">
          <div className="grid gap-3 lg:grid-cols-2">
            <AutomationCardSkeleton />
            <AutomationCardSkeleton />
          </div>
        </DashboardSection>
      </div>
    </SkeletonShell>
  );
}

export function RemindersPageSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardPageHeader title="Reminders" />
      <RemindersHubContentSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Receipts                                                                   */
/* -------------------------------------------------------------------------- */

export function ReceiptsContentSkeleton() {
  return (
    <SkeletonShell label="Loading receipts">
      <div className="space-y-6">
        <GroupedListToolbarSkeleton />
        {Array.from({ length: 2 }).map((_, group) => (
          <section key={group} className="space-y-4">
            <ReceiptGroupHeaderSkeleton />
            <ReceiptGridSkeleton count={4} variant="slot" />
          </section>
        ))}
      </div>
    </SkeletonShell>
  );
}

export function ReceiptsPageSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Receipts"
        actions={<PageActionBarSkeleton primaryWidth="w-32" />}
      />
      <ReceiptsContentSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Credit cards                                                               */
/* -------------------------------------------------------------------------- */

export function CreditCardsContentSkeleton({
  viewMode = "table",
}: {
  viewMode?: ViewMode;
}) {
  return (
    <SkeletonShell label="Loading credit cards">
      <div className="space-y-4">
        <ListViewToolbarSkeleton />
        {viewMode === "table" ? (
          <>
            <div className="hidden md:block">
              <CreditCardsTableSkeleton rows={5} />
            </div>
            <div className="md:hidden">
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CreditCardCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CreditCardCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    </SkeletonShell>
  );
}

export function CreditCardsPageSkeleton({
  viewMode = "table",
}: {
  viewMode?: ViewMode;
}) {
  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Credit cards"
        actions={<PageActionBarSkeleton primaryWidth="w-24" />}
      />
      <CreditCardsContentSkeleton viewMode={viewMode} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SOA list                                                                   */
/* -------------------------------------------------------------------------- */

export function SoaListContentSkeleton({
  viewMode = "table",
}: {
  viewMode?: ViewMode;
}) {
  return (
    <SkeletonShell label="Loading SOA runs">
      <div className="space-y-4">
        <StatCardsRowSkeleton
          titles={["SOA runs", "Statements", "Latest total due", "Last run"]}
        />
        <ListViewToolbarSkeleton />
        {viewMode === "table" ? (
          <>
            <div className="hidden md:block">
              <SoaPeriodTableSkeleton rows={4} />
            </div>
            <div className="md:hidden">
              <div className="grid auto-rows-fr gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SoaPeriodCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <SoaPeriodGridSkeleton />
        )}
      </div>
    </SkeletonShell>
  );
}

export function SoaListPageSkeleton({
  viewMode = "table",
}: {
  viewMode?: ViewMode;
}) {
  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Statement of account"
        actions={
          <PageActionBarSkeleton secondaryCount={1} primaryWidth="w-24" />
        }
      />
      <SoaListContentSkeleton viewMode={viewMode} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SOA period detail                                                          */
/* -------------------------------------------------------------------------- */

const TAB_KEYS: Record<SoaPeriodSkeletonTab, string> = {
  overview: "Overview",
  cards: "Cards",
  transactions: "Transactions",
  analytics: "Analytics",
};

function SoaOverviewTabSkeleton() {
  return (
    <div className="space-y-4">
      <StatCardsRowSkeleton
        titles={["Spend tracked", "Transactions", "Categories", "Cannot analyze"]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <SpendByCategoryCardSkeleton />
        <PeriodSummaryCardSkeleton />
      </div>
    </div>
  );
}

function SoaStatementsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-5 w-24" />
        <div className="hidden md:block">
          <SegmentedToggleSkeleton count={2} />
        </div>
      </div>
      <div className="space-y-5">
        <div className="hidden md:block">
          <SoaStatementsTableSkeleton rows={4} />
        </div>
        <div className="md:hidden">
          <SoaStatementGridSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}

function SoaTransactionsTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <Skeleton className="h-10 min-w-[12rem] flex-1 rounded-md" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[11rem] lg:w-[11rem]" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[11rem] lg:w-[11rem]" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[9.5rem] lg:w-[9.5rem]" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[9.5rem] lg:w-[9.5rem]" />
        <Skeleton className="h-10 w-full rounded-md sm:w-[10.5rem] lg:w-[10.5rem]" />
      </div>
      <Skeleton className="h-5 w-32" />
      <TransactionListSkeleton rows={6} />
    </div>
  );
}

function SoaAnalyticsTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-5">
        <Card className="border-border/80 xl:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-lg px-2 py-2">
                <div className="mb-1.5 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/80 xl:col-span-2">
          <CardHeader>
            <div className="font-display text-base font-semibold">
              Distribution
            </div>
          </CardHeader>
          <CardContent>
            <CategoryDonutSkeleton />
            <ul className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="inline-flex items-center gap-1.5 px-2 py-1.5">
                  <Skeleton className="h-2 w-2 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-12" />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <div className="font-display text-base font-semibold">Tips</div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 w-full" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SoaTabContentSkeleton({ tab }: { tab: SoaPeriodSkeletonTab }) {
  if (tab === "cards") return <SoaStatementsTabSkeleton />;
  if (tab === "transactions") return <SoaTransactionsTabSkeleton />;
  if (tab === "analytics") return <SoaAnalyticsTabSkeleton />;
  return <SoaOverviewTabSkeleton />;
}

export function SoaPeriodDetailContentSkeleton({
  tab = "overview",
}: {
  tab?: SoaPeriodSkeletonTab;
}) {
  return (
    <SkeletonShell label="Loading SOA period">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={ROUTES.dashboard.soa as Route}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              SOA
            </Link>
          </Button>
        </div>

        <DynamicPageHeaderSkeleton
          titleWidth="w-52"
          actions={
            <PageActionBarSkeleton
              secondaryCount={4}
              primaryWidth="w-24"
            />
          }
        />

        <StatCardsRowSkeleton
          titles={["Outstanding", "Minimum due", "Total paid", "Next due"]}
        />

        <div className="space-y-3">
          <TabsSkeleton active={TAB_KEYS[tab]} />
          <SoaTabContentSkeleton tab={tab} />
        </div>
      </div>
    </SkeletonShell>
  );
}

export function SoaPeriodPageSkeleton({
  tab = "overview",
}: {
  tab?: SoaPeriodSkeletonTab;
}) {
  return (
    <div className="space-y-4">
      <SoaPeriodDetailContentSkeleton tab={tab} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SOA statement detail                                                       */
/* -------------------------------------------------------------------------- */

export function SoaStatementDetailContentSkeleton() {
  return (
    <SkeletonShell label="Loading statement">
      <div className="space-y-4">
        <BreadcrumbSkeleton />

        <DynamicPageHeaderSkeleton
          titleWidth="w-40"
          actions={
            <PageActionBarSkeleton secondaryCount={1} primaryWidth="w-20" />
          }
        />

        <StatementHeroSkeleton />

        <StatCardsRowSkeleton
          count={3}
          titles={["Transactions", "Charges", "Credits"]}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold">
              Transactions
            </h2>
            <Skeleton className="h-4 w-16" />
          </div>
          <TransactionListSkeleton />
        </section>
      </div>
    </SkeletonShell>
  );
}

export function SoaStatementPageSkeleton() {
  return (
    <div className="space-y-4">
      <SoaStatementDetailContentSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Automations                                                                */
/* -------------------------------------------------------------------------- */

export function AutomationsContentSkeleton() {
  return (
    <SkeletonShell label="Loading automations">
      <div className="grid gap-3 lg:grid-cols-2">
        <AutomationCardSkeleton />
        <AutomationCardSkeleton />
      </div>
    </SkeletonShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

function FieldRowSkeleton({ labelWidth = "w-20" }: { labelWidth?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-4 ${labelWidth}`} />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

export function IntegrationsSettingsSkeleton() {
  return (
    <SkeletonShell label="Loading integrations">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-base">
                  Gmail &amp; Google Calendar
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <GoogleAccountsListSkeleton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle
                  className="h-5 w-5 text-primary"
                  aria-hidden
                />
                <CardTitle className="text-base">Telegram</CardTitle>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldRowSkeleton labelWidth="w-16" />
            <FieldRowSkeleton labelWidth="w-14" />
            <FieldRowSkeleton labelWidth="w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Slack className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-base">Slack</CardTitle>
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <FieldRowSkeleton labelWidth="w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </CardContent>
        </Card>

        <AiKeysCardSkeleton />
      </div>
    </SkeletonShell>
  );
}

export function SoaWorkflowSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SOA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <Skeleton className="h-10 w-16 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export function CustomTransactionCategoriesSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custom categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 w-full rounded-md sm:flex-1" />
          <Skeleton className="h-10 w-full rounded-lg sm:w-20" />
        </div>
        <CategoryRulesSkeleton />
      </CardContent>
    </Card>
  );
}

export function TransactionCategoryRulesSettingsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Category rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-10 w-full rounded-md sm:flex-1" />
          <Skeleton className="h-10 w-full rounded-md sm:w-[200px]" />
          <Skeleton className="h-10 w-full rounded-lg sm:w-20" />
        </div>
        <CategoryRulesSkeleton />
      </CardContent>
    </Card>
  );
}

export function TransactionCategoryRulesContentSkeleton() {
  return (
    <SkeletonShell label="Loading category rules">
      <CategoryRulesSkeleton />
    </SkeletonShell>
  );
}

export function SettingsPageSkeleton() {
  return (
    <div className="space-y-4">
      <DashboardPageHeader title="Settings" />
      <IntegrationsSettingsSkeleton />
      <SoaWorkflowSettingsSkeleton />
      <CustomTransactionCategoriesSettingsSkeleton />
      <TransactionCategoryRulesSettingsSkeleton />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog content                                                             */
/* -------------------------------------------------------------------------- */

export function CreditCardFormDialogSkeleton() {
  return (
    <SkeletonShell label="Loading card">
      <div className="py-2">
        <CardFormSkeleton />
      </div>
    </SkeletonShell>
  );
}

export * from "./parts";
