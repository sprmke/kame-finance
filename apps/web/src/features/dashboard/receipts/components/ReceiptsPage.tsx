"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt, Upload } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DashboardPageHeader } from "@/components/shared/DashboardPageHeader";
import { PageActionBar } from "@/components/shared/PageActionBar";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReceiptUploadDialogs } from "@/components/shared/ReceiptUploadDialogs";
import { ReceiptsContentSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useReceiptUploadFlow } from "@/hooks/use-receipt-upload-flow";
import { api } from "@/lib/api/client";
import {
  AI_SKIP_NO_KEYS_MESSAGE,
  isReceiptAiSkippedNoKeys,
} from "@/lib/receipts/ai-skip";
import { SoaPdfPreview } from "@/features/dashboard/soa/components/SoaPdfPreview";

import { buildReceiptBoard, type ReceiptSlot } from "../lib/receipt-slots";
import { buildCardInfoFields, type CardInfoRequest } from "../lib/card-info";
import {
  dedupeReceiptsForDisplay,
  mergeReceiptFromRevalidation,
  mergeReceiptStack,
  stackReceiptsByCard,
  type ReceiptGroupMode,
  type ReceiptListItem,
  type ReceiptMonthDueContext,
} from "../lib/receipt-utils";

import { ReceiptCard } from "./ReceiptCard";
import { CardInfoDialog } from "./CardInfoDialog";
import { ReceiptGroupHeader } from "./ReceiptGroupHeader";
import { ReceiptGroupToggle } from "./ReceiptGroupToggle";
import { ReceiptPreviewDialog } from "./ReceiptPreviewDialog";
import { ReceiptSlotPlaceholder } from "./ReceiptSlotPlaceholder";

const GROUP_MODE_KEY = "kame-finance:receipts-group-mode";

export function ReceiptsPage() {
  const [groupMode, setGroupMode] = useState<ReceiptGroupMode>("month");
  const [previewStack, setPreviewStack] = useState<ReceiptListItem[] | null>(
    null,
  );
  const [deleteTargets, setDeleteTargets] = useState<ReceiptListItem[]>([]);
  const [soaSlot, setSoaSlot] = useState<ReceiptSlot | null>(null);
  const [cardInfoRequest, setCardInfoRequest] =
    useState<CardInfoRequest | null>(null);
  const utils = api.useUtils();

  useEffect(() => {
    const stored = localStorage.getItem(GROUP_MODE_KEY);
    if (stored === "month" || stored === "card") {
      setGroupMode(stored);
    }
  }, []);

  function handleGroupModeChange(mode: ReceiptGroupMode) {
    setGroupMode(mode);
    localStorage.setItem(GROUP_MODE_KEY, mode);
  }

  const { data: receipts, isLoading } = api.receipts.list.useQuery();
  const { data: dues, isLoading: duesLoading } = api.reminders.listDue.useQuery(
    { unpaidOnly: false },
  );
  const { data: cards, isLoading: cardsLoading } =
    api.creditCards.list.useQuery();
  const { data: statements } = api.soa.list.useQuery();
  const { data: integrations } = api.integrations.list.useQuery();

  const connected = useMemo(
    () => new Set(integrations?.map((i) => i.provider) ?? []),
    [integrations],
  );

  const receiptUpload = useReceiptUploadFlow(connected);

  const receiptItems = (receipts ?? []) as ReceiptListItem[];

  const dueForGrouping = useMemo((): ReceiptMonthDueContext[] => {
    return (dues ?? []).map((due) => ({
      id: due.id,
      issuerId: due.issuerId,
      cardLast4: due.cardLast4,
      dueDateYmd: due.dueDateYmd,
      statementPeriodKey: due.statementPeriodKey,
      statementPeriodLabel: due.statementPeriodLabel,
    }));
  }, [dues]);

  const visibleReceipts = useMemo(
    () => dedupeReceiptsForDisplay(receiptItems, dueForGrouping),
    [receiptItems, dueForGrouping],
  );

  const groups = useMemo(
    () =>
      buildReceiptBoard({
        mode: groupMode,
        receipts: visibleReceipts,
        cards: (cards ?? []).map((card) => ({
          issuerId: card.issuer,
          last4: card.last4,
          label: card.label,
          color: card.color,
          isActive: card.isActive,
          statementDay: card.statementDay,
        })),
        dues: (dues ?? []).map((due) => ({
          id: due.id,
          issuerId: due.issuerId,
          cardLast4: due.cardLast4,
          dueDateYmd: due.dueDateYmd,
          statementPeriodKey: due.statementPeriodKey,
          statementPeriodLabel: due.statementPeriodLabel,
          paidAt: due.paidAt,
          minimumDue: due.minimumDue,
          totalDue: due.totalDue,
          cardDisplayLabel: due.cardDisplayLabel,
          bankLabel: due.bankLabel,
        })),
        statements: (statements ?? []).map((statement) => ({
          id: statement.id,
          issuerId: statement.issuerId,
          cardLast4: statement.cardLast4,
          statementMonth: statement.statementMonth,
          statementYear: statement.statementYear,
          pdfStoragePath: statement.pdfStoragePath,
          pdfFileName: statement.pdfFileName,
          soaUnavailable: statement.soaUnavailable,
        })),
      }),
    [visibleReceipts, groupMode, cards, dues, statements],
  );

  const hasBoard = groups.some(
    (group) => group.slots.length > 0 || group.looseReceipts.length > 0,
  );

  const confirmMarkPaid = api.receipts.confirmMarkPaid.useMutation({
    onSuccess: () => {
      toast.success("Marked paid");
      void utils.receipts.list.invalidate();
      void utils.reminders.listDue.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const revalidateWithAi = api.receipts.revalidateWithAi.useMutation({
    onSuccess: (result, variables) => {
      if (isReceiptAiSkippedNoKeys(result.ai)) {
        toast.error(AI_SKIP_NO_KEYS_MESSAGE);
        return;
      }

      if (result.ai.verdict === "skipped") {
        toast.message("AI validation skipped", {
          description: result.ai.summary,
        });
        return;
      }

      if (result.ai.aiModelError) {
        toast.error("AI validation unavailable", {
          description: result.ai.aiModelError,
        });
      } else {
        toast.success("Receipt re-validated");
      }

      const updatedRows =
        result.receipts.length > 0 ? result.receipts : [result.receipt];

      setPreviewStack((prev) => {
        if (!prev) return prev;
        return prev.map((item) => {
          const updated = updatedRows.find((row) => row.id === item.id);
          return updated ? mergeReceiptFromRevalidation(item, updated) : item;
        });
      });

      utils.receipts.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((row) => {
          const updated = updatedRows.find((item) => item.id === row.id);
          return updated ? mergeReceiptFromRevalidation(row, updated) : row;
        });
      });

      void utils.receipts.list.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleRevalidate(receiptIds: string[]) {
    const receiptId = receiptIds[0];
    if (!receiptId) return;
    revalidateWithAi.mutate({ receiptId, receiptIds });
  }

  const deleteReceiptMutation = api.receipts.delete.useMutation({
    onSuccess: (_data, variables) => {
      setPreviewStack((prev) => {
        if (!prev) return prev;
        const next = prev.filter((item) => item.id !== variables.receiptId);
        return next.length > 0 ? next : null;
      });
      void utils.receipts.list.invalidate();
      void utils.overview.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function openCardInfo(request: CardInfoRequest) {
    setCardInfoRequest(request);
  }

  function cardInfoFromReceipt(receipt: ReceiptListItem): CardInfoRequest {
    const due = (dues ?? []).find((row) => row.id === receipt.dueEntryId);
    return {
      issuerId: due?.issuerId ?? null,
      cardLast4: due?.cardLast4 ?? receipt.parsedCardLast4,
      label: receipt.cardDisplayLabel,
      periodKey: receipt.statementPeriodKey ?? due?.statementPeriodKey ?? null,
      minimumDue: receipt.minimumDue,
      totalDue: receipt.totalDue,
      dueDateYmd: receipt.dueDateYmd,
      statementDate: receipt.statementDate,
    };
  }

  const cardInfoFields = useMemo(
    () =>
      cardInfoRequest
        ? buildCardInfoFields({
            request: cardInfoRequest,
            cards: (cards ?? []).map((card) => ({
              issuer: card.issuer,
              last4: card.last4,
              label: card.label,
              fullPan: card.fullPan,
              cardNetwork: card.cardNetwork,
              statementDay: card.statementDay,
            })),
            statements: (statements ?? []).map((statement) => ({
              issuerId: statement.issuerId,
              cardLast4: statement.cardLast4,
              statementMonth: statement.statementMonth,
              statementYear: statement.statementYear,
              statementDate: statement.statementDate,
              soaUnavailable: statement.soaUnavailable,
            })),
          })
        : [],
    [cardInfoRequest, cards, statements],
  );

  const previewReceipt = previewStack ? mergeReceiptStack(previewStack) : null;
  const receiptCardCount = groups.reduce(
    (sum, group) =>
      sum +
      group.slots.filter((slot) => slot.receipts.length > 0).length +
      stackReceiptsByCard(group.looseReceipts).length,
    0,
  );

  function renderReceiptStack(
    items: ReceiptListItem[],
    stackKey: string,
    soaMissing = false,
    dueEntryId?: string | null,
  ) {
    const cover = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
    if (!cover) return null;
    const display = mergeReceiptStack(items);

    return (
      <ReceiptCard
        key={stackKey}
        receipt={display}
        imageCount={items.length}
        thumbnailReceiptId={cover.id}
        thumbnailFileName={cover.originalFileName}
        onView={() => setPreviewStack(items)}
        onCardInfo={(receipt) => openCardInfo(cardInfoFromReceipt(receipt))}
        onDelete={() => setDeleteTargets(items)}
        onAddReceipt={
          dueEntryId
            ? () => receiptUpload.triggerFilePicker(dueEntryId)
            : undefined
        }
        addReceiptDisabled={receiptUpload.isPending}
        onRevalidate={() => handleRevalidate(items.map((item) => item.id))}
        soaMissing={soaMissing}
        isRevalidatePending={
          revalidateWithAi.isPending &&
          items.some(
            (item) => item.id === revalidateWithAi.variables?.receiptId,
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        title="Receipts"
        actions={
          <PageActionBar
            primary={
              <>
                <input
                  ref={receiptUpload.fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={receiptUpload.handleFileInputChange}
                />
                <Button
                  onClick={() => receiptUpload.triggerFilePicker()}
                  disabled={receiptUpload.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload receipt
                </Button>
              </>
            }
          />
        }
      />

      <ReceiptUploadDialogs flow={receiptUpload} />

      <SoaPdfPreview
        open={soaSlot !== null}
        onOpenChange={(open) => {
          if (!open) setSoaSlot(null);
        }}
        title={soaSlot ? `${soaSlot.label} · ${soaSlot.periodLabel}` : "SOA"}
        pdfUrl={
          soaSlot?.statementId
            ? `/api/soa/pdf?type=source&statementId=${soaSlot.statementId}`
            : null
        }
        actions={
          soaSlot ? (
            <Button
              size="sm"
              onClick={() =>
                receiptUpload.triggerFilePicker(soaSlot.dueEntryId ?? undefined)
              }
              disabled={receiptUpload.isPending}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Upload receipt
            </Button>
          ) : null
        }
      />

      <ReceiptPreviewDialog
        open={previewStack !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewStack(null);
        }}
        receipt={previewReceipt}
        images={previewStack ?? undefined}
        onDelete={(item) => setDeleteTargets([item])}
        onMarkPaid={(receiptId) => confirmMarkPaid.mutate({ receiptId })}
        isMarkPaidPending={confirmMarkPaid.isPending}
        onRevalidate={() => {
          if (!previewStack?.length) return;
          handleRevalidate(previewStack.map((item) => item.id));
        }}
        isRevalidatePending={
          revalidateWithAi.isPending &&
          previewStack?.some(
            (item) => item.id === revalidateWithAi.variables?.receiptId,
          ) === true
        }
      />

      <ConfirmDialog
        open={deleteTargets.length > 0}
        onOpenChange={(open) => {
          if (!open) setDeleteTargets([]);
        }}
        title={
          deleteTargets.length > 1 ? "Remove receipts?" : "Remove receipt?"
        }
        description={
          deleteTargets.length > 1
            ? `This deletes ${deleteTargets.length} uploaded files. Paid status on the due entry is kept.`
            : "This deletes the uploaded file. Paid status on the due entry is kept."
        }
        confirmLabel="Remove"
        variant="destructive"
        isLoading={deleteReceiptMutation.isPending}
        onConfirm={() => {
          const targets = deleteTargets;
          void (async () => {
            try {
              for (const item of targets) {
                await deleteReceiptMutation.mutateAsync({
                  receiptId: item.id,
                });
              }
              toast.success(
                targets.length > 1 ? "Receipts removed" : "Receipt removed",
              );
              setDeleteTargets([]);
            } catch {
              setDeleteTargets([]);
            }
          })();
        }}
      />

      <CardInfoDialog
        open={cardInfoRequest !== null}
        onOpenChange={(open) => {
          if (!open) setCardInfoRequest(null);
        }}
        fields={cardInfoFields}
      />

      {isLoading || cardsLoading || duesLoading ? (
        <ReceiptsContentSkeleton />
      ) : !hasBoard ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6 text-muted-foreground" />}
          title="No receipts"
          message="Upload a payment screenshot to validate and mark SOA paid."
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {receiptCardCount}
              </span>{" "}
              {receiptCardCount === 1 ? "receipt" : "receipts"}
            </p>
            <ReceiptGroupToggle
              value={groupMode}
              onChange={handleGroupModeChange}
              className="w-full sm:w-auto"
            />
          </div>

          {groups.map((group) => (
            <section key={group.key} className="space-y-4">
              <ReceiptGroupHeader
                label={group.label}
                showPaidSummary={group.totalCount > 0}
                paidSummary={
                  group.totalCount > 0
                    ? {
                        paidCount: group.paidCount,
                        totalCount: group.totalCount,
                      }
                    : undefined
                }
              />
              <div className="grid gap-3 md:grid-cols-2">
                {group.slots.map((slot) =>
                  slot.receipts.length > 0 ? (
                    renderReceiptStack(
                      slot.receipts,
                      slot.key,
                      slot.soaMissing,
                      slot.dueEntryId,
                    )
                  ) : (
                    <ReceiptSlotPlaceholder
                      key={slot.key}
                      slot={slot}
                      emphasizePeriod={groupMode === "card"}
                      onViewSoa={(item) => {
                        if (item.statementId) setSoaSlot(item);
                      }}
                      onUpload={(item) =>
                        receiptUpload.triggerFilePicker(
                          item.dueEntryId ?? undefined,
                        )
                      }
                      onCardInfo={(item) =>
                        openCardInfo({
                          issuerId: item.issuerId,
                          cardLast4: item.cardLast4,
                          label: item.label,
                          periodKey: item.periodKey,
                          minimumDue: item.minimumDue,
                          totalDue: item.totalDue,
                          dueDateYmd: item.dueDateYmd,
                          statementDate: null,
                        })
                      }
                      uploadDisabled={receiptUpload.isPending}
                    />
                  ),
                )}
                {stackReceiptsByCard(group.looseReceipts).map((stack) =>
                  renderReceiptStack(
                    stack.items,
                    stack.key,
                    false,
                    stack.items.find((item) => item.dueEntryId)?.dueEntryId,
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
