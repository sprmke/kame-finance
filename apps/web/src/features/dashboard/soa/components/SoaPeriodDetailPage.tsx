"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import type { inferRouterOutputs } from "@trpc/server";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  CreditCard,
  FileText,
  Loader2,
  PhilippinePeso,
  Play,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";

import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { PageActionBar } from "@/components/shared/PageActionBar";
import { ReceiptUploadDialogs } from "@/components/shared/ReceiptUploadDialogs";
import { SoaPeriodDetailContentSkeleton } from "@/components/shared/skeletons";
import { StatCard, statGridClassName } from "@/components/shared/StatCard";
import { ViewToggle } from "@/components/shared/ViewToggle";
import { ViewModeLayout } from "@/components/shared/ViewModeLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/config/routes";
import { api } from "@/lib/api/client";
import type { AppRouter } from "@/server/routers/_app";
import { useReceiptUploadFlow } from "@/hooks/use-receipt-upload-flow";
import { type StatementDueEntryRow } from "@/lib/soa/statement-due-entry";
import { isMissingSoaForStatementPeriod } from "@/lib/credit-cards/billing-cycle";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { todayYmdLocal } from "@/lib/reminders/reminder-status";
import { formatPhpAmount } from "@/lib/utils/format-money";
import { cn } from "@/lib/utils/cn";

import {
  CategorizeWithAiProvider,
  useCategorizeWithAiActions,
} from "./CategorizeWithAiProvider";
import { ManualSoaEntryDialog } from "./ManualSoaEntryDialog";
import { ManualSoaMonthConfirmDialog } from "./ManualSoaMonthConfirmDialog";
import { RunSoaDialog } from "./RunSoaDialog";
import { SoaPdfPreview } from "./SoaPdfPreview";
import {
  SoaPeriodAnalyticsTab,
  SoaPeriodOverviewTab,
} from "./SoaPeriodAnalyticsTabs";
import { SoaPeriodTransactionsTab } from "./SoaPeriodTransactionsTab";
import { SoaStatementCard } from "./SoaStatementCard";
import { SoaStatementTable } from "./SoaStatementTable";
import { PaymentReceiptPreview } from "@/features/dashboard/receipts/components/PaymentReceiptPreview";
import { usePersistedViewMode } from "@/hooks/use-persisted-view-mode";
import { isStatementMarkedPaid } from "@/lib/soa/paid-status";
import { receiptsForStatement } from "@/lib/soa/statement-receipts";
import type { ReceiptListItem } from "@/features/dashboard/receipts/lib/receipt-utils";
import {
  groupStatementsByPeriod,
  periodLabel,
  statementTitle,
  type SoaStatement,
} from "../lib/soa-utils";
import { periodToRunInitial } from "../lib/run-soa-progress";
import {
  parseSoaPeriodQuery,
  soaPeriodSearch,
  type SoaPeriodTab,
} from "../lib/soa-period-query";
import { useSoaManualUpload } from "../hooks/use-soa-manual-upload";
import { useSoaRunDialog } from "../hooks/use-soa-run-dialog";

type PdfPreviewState =
  | { kind: "closed" }
  | { kind: "source"; statementId: string; title: string }
  | { kind: "summary"; periodId: string; title: string };

type SoaPeriodDetail = NonNullable<
  inferRouterOutputs<AppRouter>["soa"]["getPeriod"]
>;

type CategorizeTransactionInput = {
  categorySlug?: string | null;
  categorySource?: string | null;
};

export function SoaPeriodDetailPage({ periodId }: { periodId: string }) {
  const { data: period, isLoading } = api.soa.getPeriod.useQuery({ periodId });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SoaPeriodDetailContentSkeleton />
      </div>
    );
  }

  if (!period) {
    return (
      <div className="py-10 space-y-3 text-center">
        <p className="text-muted-foreground">SOA period not found.</p>
        <Button asChild variant="outline">
          <Link href={ROUTES.dashboard.soa}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Link>
        </Button>
      </div>
    );
  }

  const statementGroups = groupStatementsByPeriod(
    period.statements as SoaStatement[],
  );
  const flatStatements = statementGroups.flatMap((group) => group.statements);
  const periodTransactions: CategorizeTransactionInput[] =
    flatStatements.flatMap((statement) => statement.transactions ?? []);

  return (
    <CategorizeWithAiProvider
      periodId={periodId}
      transactions={periodTransactions}
    >
      <SoaPeriodDetailBody
        periodId={periodId}
        period={period}
        statementGroups={statementGroups}
        flatStatements={flatStatements}
        periodTransactions={periodTransactions}
      />
    </CategorizeWithAiProvider>
  );
}

function SoaPeriodDetailBody({
  periodId,
  period,
  statementGroups,
  flatStatements,
  periodTransactions,
}: {
  periodId: string;
  period: SoaPeriodDetail;
  statementGroups: ReturnType<typeof groupStatementsByPeriod>;
  flatStatements: SoaStatement[];
  periodTransactions: CategorizeTransactionInput[];
}) {
  const utils = api.useUtils();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { tab, category } = parseSoaPeriodQuery(searchParams);

  const writePeriodQuery = useCallback(
    (next: { tab: SoaPeriodTab; category?: string | null }) => {
      const query = soaPeriodSearch({
        tab: next.tab,
        category: next.tab === "analytics" ? next.category : null,
      });
      const href = (query ? `${pathname}?${query}` : pathname) as Route;
      router.replace(href, { scroll: false });
    },
    [pathname, router],
  );

  const selectCategory = useCallback(
    (slug: string) => {
      writePeriodQuery({ tab: "analytics", category: slug });
    },
    [writePeriodQuery],
  );

  const clearCategory = useCallback(() => {
    writePeriodQuery({ tab: "analytics", category: null });
  }, [writePeriodQuery]);

  const redirectToReceiptsAfterUploadRef = useRef(false);
  const { data: dues, isSuccess: duesReady } = api.reminders.listDue.useQuery({
    unpaidOnly: false,
  });
  const { data: receipts } = api.receipts.list.useQuery();
  const { data: cards } = api.creditCards.list.useQuery();
  const { data: integrations } = api.integrations.list.useQuery();
  const categorize = useCategorizeWithAiActions();

  const connected = useMemo(
    () => new Set(integrations?.map((i) => i.provider) ?? []),
    [integrations],
  );

  const receiptUpload = useReceiptUploadFlow(connected, {
    onBatchSuccess: () => {
      redirectToReceiptsAfterUploadRef.current = true;
      void utils.soa.getPeriod.invalidate({ periodId });
      void utils.soa.listPeriods.invalidate();
    },
  });

  function handleReceiptUploadDialogComplete() {
    receiptUpload.handleProgressComplete();
    if (redirectToReceiptsAfterUploadRef.current) {
      redirectToReceiptsAfterUploadRef.current = false;
      router.push(ROUTES.dashboard.receipts);
    }
  }

  const [pdfPreview, setPdfPreview] = useState<PdfPreviewState>({
    kind: "closed",
  });
  const [paymentReceipts, setPaymentReceipts] = useState<
    ReceiptListItem[] | null
  >(null);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const { viewMode, setViewMode } = usePersistedViewMode(
    "kame-finance:soa-view-mode",
  );

  const { openRun, runPipeline, runDialogProps } = useSoaRunDialog({
    initial: periodToRunInitial(period),
    onRunSuccess: () => {
      void utils.soa.getPeriod.invalidate({ periodId });
      void utils.soa.getStatement.invalidate();
      void utils.soa.listPeriods.invalidate();
      void utils.reminders.listDue.invalidate();
      void utils.overview.stats.invalidate();
    },
  });

  const manualUpload = useSoaManualUpload(periodId, () => {
    void utils.soa.getPeriod.invalidate({ periodId });
    void utils.soa.getStatement.invalidate();
    void utils.soa.listPeriods.invalidate();
    void utils.reminders.listDue.invalidate();
    void utils.overview.stats.invalidate();
    void utils.creditCards.list.invalidate();
  });

  const dueEntries = useMemo((): StatementDueEntryRow[] => {
    return (dues ?? []).map((due) => ({
      id: due.id,
      issuerId: due.issuerId,
      cardLast4: due.cardLast4,
      dueDateYmd: due.dueDateYmd,
      paidAt: due.paidAt,
      statementPeriodKey: due.statementPeriodKey,
    }));
  }, [dues]);

  const paymentReceiptsByStatementId = useMemo(() => {
    const items = (receipts ?? []) as ReceiptListItem[];
    const map = new Map<string, ReceiptListItem[]>();
    for (const statement of flatStatements) {
      const linked = receiptsForStatement(statement, dueEntries, items);
      if (linked.length > 0) {
        map.set(statement.id, linked as ReceiptListItem[]);
      }
    }
    return map;
  }, [flatStatements, dueEntries, receipts]);

  function openPaymentPreview(statement: SoaStatement) {
    const linked = paymentReceiptsByStatementId.get(statement.id);
    if (!linked?.length) return;
    setPaymentReceipts(linked);
  }

  const paidDues = useMemo(
    () =>
      (dues ?? []).map((due) => ({
        issuerId: due.issuerId,
        cardLast4: due.cardLast4,
        dueDateYmd: due.dueDateYmd,
        paidAt: due.paidAt,
        statementPeriodKey: due.statementPeriodKey,
      })),
    [dues],
  );

  const asOfYmd = todayYmdLocal();

  function showMissingSoaNudge(statement: SoaStatement): boolean {
    const card = (cards ?? []).find(
      (c) =>
        c.issuer.toLowerCase() === statement.issuerId.toLowerCase() &&
        normalizeCardLast4(c.last4) === normalizeCardLast4(statement.cardLast4),
    );
    return isMissingSoaForStatementPeriod(
      asOfYmd,
      statement,
      card?.statementDay,
    );
  }

  const pdfUrl =
    pdfPreview.kind === "source"
      ? `/api/soa/pdf?type=source&statementId=${pdfPreview.statementId}`
      : pdfPreview.kind === "summary"
        ? `/api/soa/pdf?type=summary&periodId=${pdfPreview.periodId}`
        : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={ROUTES.dashboard.soa}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            SOA
          </Link>
        </Button>
      </div>

      <DashboardPageHeader
        title={period.label}
        actions={
          <PageActionBar
            secondary={
              <>
                <Button
                  variant="outline"
                  onClick={() => setManualEntryOpen(true)}
                  disabled={manualUpload.isPending || runPipeline.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  disabled={manualUpload.isPending || runPipeline.isPending}
                  onClick={() => manualUpload.fileRef.current?.click()}
                >
                  {manualUpload.isPending ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 w-4 h-4" />
                  )}
                  {manualUpload.progressLabel
                    ? `Uploading ${manualUpload.progressLabel}`
                    : "Upload"}
                </Button>
                {periodTransactions.length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => categorize.openChoiceDialog()}
                    disabled={categorize.isPending}
                  >
                    <Sparkles className="mr-2 w-4 h-4" />
                    Categorize with AI
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() =>
                    setPdfPreview({
                      kind: "summary",
                      periodId,
                      title: `${period.label} summary`,
                    })
                  }
                >
                  <FileText className="mr-2 w-4 h-4" />
                  Summary PDF
                </Button>
              </>
            }
            primary={
              <Button
                onClick={() => openRun(undefined, { rerun: true })}
                disabled={runPipeline.isPending}
              >
                <Play className="mr-2 w-4 h-4" />
                Re-run
              </Button>
            }
          />
        }
      />

      <input
        ref={manualUpload.fileRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={manualUpload.isPending || runPipeline.isPending}
        onChange={manualUpload.handleFileInputChange}
      />

      <RunSoaDialog {...runDialogProps} />
      <ManualSoaEntryDialog
        periodId={periodId}
        period={period}
        cards={(cards ?? []).map((card) => ({
          id: card.id,
          issuer: card.issuer,
          last4: card.last4,
          label: card.label,
          isActive: card.isActive,
        }))}
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
      />
      <ManualSoaMonthConfirmDialog
        pending={manualUpload.confirmPending}
        onSkip={() => manualUpload.resolveConfirm({ action: "skip" })}
        onForce={(month, year) =>
          manualUpload.resolveConfirm({ action: "force", month, year })
        }
        onSaveDetected={() =>
          manualUpload.resolveConfirm({ action: "outOfRange" })
        }
      />

      <PaymentReceiptPreview
        receipts={paymentReceipts}
        onOpenChange={(open) => {
          if (!open) setPaymentReceipts(null);
        }}
      />

      <SoaPdfPreview
        open={pdfPreview.kind !== "closed"}
        onOpenChange={(open) => {
          if (!open) setPdfPreview({ kind: "closed" });
        }}
        title={pdfPreview.kind !== "closed" ? pdfPreview.title : "PDF"}
        pdfUrl={pdfUrl}
      />

      <input
        ref={receiptUpload.fileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="hidden"
        onChange={receiptUpload.handleFileInputChange}
      />
      <ReceiptUploadDialogs
        flow={receiptUpload}
        onComplete={handleReceiptUploadDialogComplete}
      />

      <div className={statGridClassName}>
        <StatCard
          title="Outstanding"
          value={formatPhpAmount(period.totalDue)}
          icon={PhilippinePeso}
        />
        <StatCard
          title="Minimum due"
          value={formatPhpAmount(period.grossMinimumDue)}
          icon={CreditCard}
        />
        <StatCard
          title="Total paid"
          value={formatPhpAmount(period.totalPaid)}
          icon={CircleCheck}
        />
        <StatCard
          title="Next due"
          value={
            period.nextDueYmd
              ? new Date(`${period.nextDueYmd}T00:00:00`).toLocaleDateString(
                  "en-PH",
                  { month: "short", day: "numeric" },
                )
              : "—"
          }
          icon={CalendarDays}
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (
            value === "overview" ||
            value === "cards" ||
            value === "transactions" ||
            value === "analytics"
          ) {
            writePeriodQuery({ tab: value, category: null });
          }
        }}
        className="space-y-3"
      >
        <TabsList className="h-11 w-full justify-start overflow-x-auto sm:h-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <SoaPeriodOverviewTab
            statements={flatStatements}
            totalPaid={period.totalPaid}
            outstandingDue={period.totalDue}
            grossStatementDue={period.grossStatementDue}
            grossMinimumDue={period.grossMinimumDue}
            minimumRemaining={period.totalMinimum}
            minimumMetCardCount={period.minimumMetCardCount}
            cardCount={period.cardCount}
            paidCardCount={period.paidCardCount}
            nextDueYmd={period.nextDueYmd}
            onSelectCategory={selectCategory}
          />
        </TabsContent>

        <TabsContent value="cards" className="mt-0 space-y-4">
          {!!period.statements.length && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium tabular-nums text-foreground">
                  {flatStatements.length}
                </span>{" "}
                {flatStatements.length === 1 ? "statement" : "statements"}
              </p>
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
                options={["table", "grid"]}
                className="w-full sm:w-auto"
              />
            </div>
          )}

          <div className="space-y-5">
            <ViewModeLayout
              viewMode={viewMode}
              table={
                flatStatements.length > 0 ? (
                  <SoaStatementTable
                    periodId={periodId}
                    statements={flatStatements}
                    paidDues={paidDues}
                    dueEntries={dueEntries}
                    onPayNow={(dueEntryId) =>
                      receiptUpload.triggerFilePicker(dueEntryId)
                    }
                    payNowDisabled={receiptUpload.isPending}
                    onPreviewSource={(s) =>
                      setPdfPreview({
                        kind: "source",
                        statementId: s.id,
                        title: statementTitle(s),
                      })
                    }
                    onPreviewPayment={openPaymentPreview}
                    paymentCountFor={(statement) =>
                      paymentReceiptsByStatementId.get(statement.id)?.length ??
                      0
                    }
                    paidReady={duesReady}
                    showPeriodColumn={statementGroups.length > 1}
                    isMissingSoa={showMissingSoaNudge}
                  />
                ) : (
                  <p className="py-12 text-sm text-center text-muted-foreground">
                    No statements in this period.
                  </p>
                )
              }
              grid={
                <>
                  {statementGroups.map((group) => (
                    <section key={group.key} className="space-y-4">
                      {statementGroups.length > 1 && (
                        <div className="pb-3 border-b border-border/60">
                          <h2 className="text-lg font-semibold font-display">
                            {periodLabel(group.month, group.year)}
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {group.cardCount} cards ·{" "}
                            {formatPhpAmount(group.totalDue)} statement total
                          </p>
                        </div>
                      )}

                      <div
                        className={cn(
                          "grid gap-4",
                          "md:grid-cols-2 xl:grid-cols-3",
                        )}
                      >
                        {group.statements.map((s) => (
                          <SoaStatementCard
                            key={s.id}
                            periodId={periodId}
                            statement={s}
                            paid={isStatementMarkedPaid(s, paidDues)}
                            dueEntries={dueEntries}
                            onPayNow={(dueEntryId) =>
                              receiptUpload.triggerFilePicker(dueEntryId)
                            }
                            payNowDisabled={receiptUpload.isPending}
                            showMissingSoaNudge={showMissingSoaNudge(s)}
                            onPreviewSource={() =>
                              setPdfPreview({
                                kind: "source",
                                statementId: s.id,
                                title: statementTitle(s),
                              })
                            }
                            onPreviewPayment={() => openPaymentPreview(s)}
                            paymentCount={
                              paymentReceiptsByStatementId.get(s.id)?.length ??
                              0
                            }
                            paidReady={duesReady}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                  {!period.statements.length && (
                    <p className="py-12 text-sm text-center text-muted-foreground">
                      No statements in this period.
                    </p>
                  )}
                </>
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="mt-0">
          <SoaPeriodTransactionsTab statements={flatStatements} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <SoaPeriodAnalyticsTab
            statements={flatStatements}
            categorySlug={category}
            onSelectCategory={selectCategory}
            onClearCategory={clearCategory}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
