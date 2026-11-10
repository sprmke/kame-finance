"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SegmentedControl } from "@/components/shared/SegmentedControl";
import { ReceiptUploadDialogs } from "@/components/shared/ReceiptUploadDialogs";
import { RemindersContentSkeleton } from "@/components/shared/skeletons";
import { PaymentReceiptPreview } from "@/features/dashboard/receipts/components/PaymentReceiptPreview";
import type { ReceiptListItem } from "@/features/dashboard/receipts/lib/receipt-utils";
import { api } from "@/lib/api/client";
import type { DueActionType } from "@/lib/due-action-progress";
import { useReceiptUploadFlow } from "@/hooks/use-receipt-upload-flow";
import { resolveBillState, type BillState } from "@/lib/due/bill-state";
import { daysUntilYmd, todayYmdLocal } from "@/lib/reminders/reminder-status";
import { normalizeCardLast4 } from "@/lib/due/normalize";
import { BillRow, type BillRowData } from "@/features/dashboard/bills/components/BillRow";
import { useQuickActions } from "@/features/dashboard/components/shell/QuickActionsProvider";
import { dueMonthPaidSummary } from "@/lib/soa/due-month";
import { receiptsForStatement } from "@/lib/soa/statement-receipts";

import {
  DueActionProgressDialog,
  type DueActionSettled,
} from "./DueActionProgressDialog";
import { MarkPaidChoiceDialog } from "./MarkPaidChoiceDialog";
import { Button } from "@/components/ui/button";

import { ReminderGroupHeader } from "./ReminderGroupHeader";
import { ReminderGroupToggle } from "./ReminderGroupToggle";
import {
  formatDueCardTitle,
  groupDueEntries,
  type DueEntryListItem,
  type ReminderGroupMode,
} from "../lib/reminder-utils";

const GROUP_MODE_KEY = "kame-finance:reminders-group-mode";

export type BillFilter = "all" | "unpaid" | "paid" | "missing";

function matchesFilter(state: BillState, filter: BillFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return state === "paid";
  if (filter === "missing") return state === "missing" || state === "expected";
  return state === "overdue" || state === "due-soon" || state === "unpaid";
}

export function ReminderDueEntriesPanel() {
  const utils = api.useUtils();
  const quickActions = useQuickActions();
  const [filter, setFilter] = useState<BillFilter>("all");
  const [justPaidId, setJustPaidId] = useState<string | null>(null);
  const [arrivedId, setArrivedId] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<ReminderGroupMode>("month");
  const [progressOpen, setProgressOpen] = useState(false);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<DueActionType>("mark_paid");
  const [actionSettled, setActionSettled] = useState<DueActionSettled>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [isActionPending, setIsActionPending] = useState(false);
  const [confirmUnpaidEntry, setConfirmUnpaidEntry] =
    useState<DueEntryListItem | null>(null);
  const [markPaidChoiceEntry, setMarkPaidChoiceEntry] =
    useState<DueEntryListItem | null>(null);
  const [paymentReceipts, setPaymentReceipts] = useState<
    ReceiptListItem[] | null
  >(null);

  useEffect(() => {
    const stored = localStorage.getItem(GROUP_MODE_KEY);
    if (stored === "month" || stored === "card") {
      setGroupMode(stored);
    }
  }, []);

  function handleGroupModeChange(mode: ReminderGroupMode) {
    setGroupMode(mode);
    localStorage.setItem(GROUP_MODE_KEY, mode);
  }

  const duesQuery = api.reminders.listDue.useQuery({
    unpaidOnly: false,
  });
  const { data: dues, isLoading } = duesQuery;
  const { data: cards } = api.creditCards.list.useQuery();
  const { data: receipts } = api.receipts.list.useQuery();
  const { data: status } = api.reminders.status.useQuery();
  const { data: integrations } = api.integrations.list.useQuery();

  const connected = useMemo(
    () => new Set(integrations?.map((i) => i.provider) ?? []),
    [integrations],
  );

  const receiptUpload = useReceiptUploadFlow(connected);

  const dueItems = (dues ?? []) as DueEntryListItem[];
  const dueForPaidSummary = useMemo(
    () =>
      dueItems.map((due) => ({
        statementPeriodKey: due.statementPeriodKey,
        paidAt: due.paidAt,
      })),
    [dueItems],
  );
  const groups = useMemo(
    () => groupDueEntries(dueItems, groupMode),
    [dueItems, groupMode],
  );

  const statusByDueId = useMemo(
    () => new Map(status?.cards.map((c) => [c.dueEntryId, c]) ?? []),
    [status?.cards],
  );

  const receiptsByDueId = useMemo(() => {
    const items = (receipts ?? []) as ReceiptListItem[];
    const dueRows = dueItems.map((due) => ({
      id: due.id,
      issuerId: due.issuerId,
      cardLast4: due.cardLast4,
      dueDateYmd: due.dueDateYmd,
      paidAt: due.paidAt,
      statementPeriodKey: due.statementPeriodKey,
    }));
    const map = new Map<string, ReceiptListItem[]>();

    for (const entry of dueItems) {
      const periodParts = entry.statementPeriodKey.split("-");
      let year = Number(periodParts[0]);
      let month = Number(periodParts[1]);
      if (!year || !month) {
        const dueParts = entry.dueDateYmd.split("-");
        year = Number(dueParts[0]);
        month = Number(dueParts[1]);
      }
      if (!year || !month) continue;
      const linked = receiptsForStatement(
        {
          issuerId: entry.issuerId,
          cardLast4: entry.cardLast4,
          dueDateYmd: entry.dueDateYmd,
          statementMonth: month,
          statementYear: year,
        },
        dueRows,
        items,
      );
      if (linked.length > 0) {
        map.set(entry.id, linked as ReceiptListItem[]);
      }
    }

    return map;
  }, [dueItems, receipts]);

  const unpaidCount = dueItems.filter(
    (d) => !d.paidAt && d.source !== "expected",
  ).length;
  const missingSoaCount = dueItems.filter((d) => d.soaMissing).length;

  const markPaid = api.reminders.markPaid.useMutation({
    onSuccess: (_data, variables) => {
      setJustPaidId(variables.dueEntryId);
      setActionSettled("success");
      toast.success("Marked as paid");
      void utils.reminders.listDue.invalidate();
      void utils.reminders.status.invalidate();
      void utils.overview.stats.invalidate();
      setIsActionPending(false);
    },
    onError: (e) => {
      setActionErrorMessage(e.message);
      setActionSettled("error");
      toast.error(e.message);
      setIsActionPending(false);
    },
  });

  const markUnpaid = api.reminders.markUnpaid.useMutation({
    onSuccess: () => {
      setActionSettled("success");
      toast.success("Marked as unpaid");
      void utils.reminders.listDue.invalidate();
      void utils.reminders.status.invalidate();
      void utils.receipts.list.invalidate();
      void utils.overview.stats.invalidate();
      setIsActionPending(false);
    },
    onError: (e) => {
      setActionErrorMessage(e.message);
      setActionSettled("error");
      toast.error(e.message);
      setIsActionPending(false);
    },
  });

  function startDueAction(dueEntryId: string, action: DueActionType) {
    const processId = crypto.randomUUID();
    setActiveProcessId(processId);
    setActiveAction(action);
    setActionSettled(null);
    setActionErrorMessage(null);
    setProgressOpen(true);
    setIsActionPending(true);

    if (action === "mark_paid") {
      markPaid.mutate({ dueEntryId, processId });
    } else {
      markUnpaid.mutate({ dueEntryId, processId });
    }
  }

  function handleProgressComplete() {
    setProgressOpen(false);
    setActiveProcessId(null);
    setActionSettled(null);
    setActionErrorMessage(null);
  }

  function handleProgressOpenChange(open: boolean) {
    if (!open && isActionPending) return;
    if (!open && actionSettled === "success") return;
    if (!open) {
      handleProgressComplete();
    } else {
      setProgressOpen(open);
    }
  }

  function handleUploadReceiptChoice() {
    if (!markPaidChoiceEntry) return;
    const dueEntryId = markPaidChoiceEntry.id;
    setMarkPaidChoiceEntry(null);
    receiptUpload.triggerFilePicker(dueEntryId);
  }

  function handleMarkWithoutReceipt() {
    if (!markPaidChoiceEntry) return;
    const dueEntryId = markPaidChoiceEntry.id;
    setMarkPaidChoiceEntry(null);
    startDueAction(dueEntryId, "mark_paid");
  }

  const actionPending =
    isActionPending ||
    markPaid.isPending ||
    markUnpaid.isPending ||
    receiptUpload.isPending;

  const asOf = todayYmdLocal();
  const colorByCard = useMemo(
    () =>
      new Map(
        (cards ?? []).map((card) => [
          `${card.issuer.toLowerCase()}:${normalizeCardLast4(card.last4)}`,
          card.color,
        ]),
      ),
    [cards],
  );

  const billFor = (entry: DueEntryListItem): BillRowData => {
    const reminder = statusByDueId.get(entry.id);
    const daysAway = entry.dueDateYmd ? daysUntilYmd(entry.dueDateYmd, asOf) : null;
    return {
      id: entry.id,
      issuerId: entry.issuerId,
      cardLast4: entry.cardLast4,
      cardDisplayLabel: entry.cardDisplayLabel,
      cardColor:
        colorByCard.get(`${entry.issuerId.toLowerCase()}:${normalizeCardLast4(entry.cardLast4)}`) ??
        null,
      dueDateYmd: entry.dueDateYmd,
      minimumDue: entry.minimumDue,
      totalDue: entry.totalDue,
      state: resolveBillState({
        paid: Boolean(entry.paidAt),
        soaMissing: entry.soaMissing,
        expected: entry.source === "expected",
        daysAway,
      }),
      daysAway,
      scheduleLabel: reminder?.statusLabel ?? null,
      scheduleTone:
        reminder?.status === "in_window_ready"
          ? "ready"
          : reminder?.status === "in_window_already_sent"
            ? "sent"
            : "muted",
      receiptCount: receiptsByDueId.get(entry.id)?.length ?? 0,
    };
  };

  const filterCounts = useMemo(() => {
    const counts: Record<BillFilter, number> = { all: 0, unpaid: 0, paid: 0, missing: 0 };
    for (const entry of dueItems) {
      const daysAway = entry.dueDateYmd ? daysUntilYmd(entry.dueDateYmd, asOf) : null;
      const state = resolveBillState({
        paid: Boolean(entry.paidAt),
        soaMissing: entry.soaMissing,
        expected: entry.source === "expected",
        daysAway,
      });
      counts.all += 1;
      for (const key of ["unpaid", "paid", "missing"] as const) {
        if (matchesFilter(state, key)) counts[key] += 1;
      }
    }
    return counts;
  }, [dueItems, asOf]);

  // Deep link: /dashboard/bills#bill-<id> scrolls to and highlights that row.
  useEffect(() => {
    if (isLoading || typeof window === "undefined") return;
    const match = /^#bill-([0-9a-f-]+)$/i.exec(window.location.hash);
    if (!match) return;
    const id = match[1]!;
    setFilter("all");
    requestAnimationFrame(() => {
      document.getElementById(`bill-${id}`)?.scrollIntoView({ block: "center" });
      setArrivedId(id);
      window.setTimeout(() => setArrivedId(null), 1500);
    });
  }, [isLoading]);

  return (
    <div className="space-y-4">
      <input
        ref={receiptUpload.fileRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={receiptUpload.handleFileInputChange}
      />

      <DueActionProgressDialog
        open={progressOpen}
        onOpenChange={handleProgressOpenChange}
        processId={activeProcessId}
        action={activeAction}
        isPending={actionPending}
        settled={actionSettled}
        errorMessage={actionErrorMessage}
        onComplete={handleProgressComplete}
      />

      <ConfirmDialog
        open={confirmUnpaidEntry !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmUnpaidEntry(null);
        }}
        title="Mark as unpaid?"
        description={
          confirmUnpaidEntry
            ? `${formatDueCardTitle(confirmUnpaidEntry)} will show as unpaid. Reminders may resume.`
            : ""
        }
        confirmLabel="Mark unpaid"
        onConfirm={() => {
          if (!confirmUnpaidEntry) return;
          const dueEntryId = confirmUnpaidEntry.id;
          setConfirmUnpaidEntry(null);
          startDueAction(dueEntryId, "mark_unpaid");
        }}
      />

      <MarkPaidChoiceDialog
        open={markPaidChoiceEntry !== null}
        onOpenChange={(open) => {
          if (!open) setMarkPaidChoiceEntry(null);
        }}
        entry={markPaidChoiceEntry}
        onUploadReceipt={handleUploadReceiptChoice}
        onMarkWithoutReceipt={handleMarkWithoutReceipt}
        disabled={actionPending}
      />

      <PaymentReceiptPreview
        receipts={paymentReceipts}
        onOpenChange={(open) => {
          if (!open) setPaymentReceipts(null);
        }}
      />

      <ReceiptUploadDialogs flow={receiptUpload} />

      {duesQuery.error && !dues ? (
        <ErrorState
          title="Couldn't load bills"
          error={duesQuery.error}
          onRetry={() => void duesQuery.refetch()}
        />
      ) : isLoading ? (
        <RemindersContentSkeleton />
      ) : !dueItems.length ? (
        <EmptyState
          title="No bills yet"
          message="Add a card and its due dates show up here every month."
          action={
            <Button onClick={quickActions.addCard}>Add card</Button>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SegmentedControl
              ariaLabel="Show bills"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: filterCounts.all },
                { value: "unpaid", label: "Unpaid", count: filterCounts.unpaid },
                { value: "paid", label: "Paid", count: filterCounts.paid },
                { value: "missing", label: "No SOA", count: filterCounts.missing },
              ]}
              className="w-full sm:w-auto"
            />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              {status ? (
                <p className="text-xs text-muted-foreground">
                  {status.readyCount > 0 ? (
                    <span className="font-semibold text-warning">
                      {status.readyCount} reminder{status.readyCount === 1 ? "" : "s"} ready
                    </span>
                  ) : (
                    <span>{status.inWindowCount} in reminder window</span>
                  )}
                </p>
              ) : null}
              <ReminderGroupToggle value={groupMode} onChange={handleGroupModeChange} />
            </div>
          </div>

          <div className="space-y-6">
            {groups.map((group) => {
              const visible = group.items.filter((entry) =>
                matchesFilter(billFor(entry).state, filter),
              );
              if (visible.length === 0) return null;
              return (
                <section key={group.key} className="space-y-2">
                  <ReminderGroupHeader
                    label={group.label}
                    showPaidSummary={groupMode === "month"}
                    paidSummary={
                      groupMode === "month"
                        ? dueMonthPaidSummary(dueForPaidSummary, group.key)
                        : undefined
                    }
                  />
                  <ul className="divide-y rounded-lg border bg-card">
                    {visible.map((entry) => {
                      const bill = billFor(entry);
                      const linked = receiptsByDueId.get(entry.id);
                      return (
                        <BillRow
                            key={entry.id}
                            bill={bill}
                            highlight={arrivedId === entry.id}
                            disabled={actionPending}
                            uploadDisabled={receiptUpload.isPending}
                            justPaid={justPaidId === entry.id && Boolean(entry.paidAt)}
                            onMarkPaid={() => setMarkPaidChoiceEntry(entry)}
                            onMarkUnpaid={() => setConfirmUnpaidEntry(entry)}
                            onUploadReceipt={() => receiptUpload.triggerFilePicker(entry.id)}
                            onViewPayment={
                              linked ? () => setPaymentReceipts(linked) : undefined
                            }
                            onRunSoa={quickActions.runSoa}
                          />
                      );
                    })}
                  </ul>
                </section>
              );
            })}
            {groups.every((group) =>
              group.items.every((entry) => !matchesFilter(billFor(entry).state, filter)),
            ) ? (
              <EmptyState
                compact
                title="Nothing here"
                message="No bills match this filter."
                action={
                  <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                    Show all
                  </Button>
                }
              />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
