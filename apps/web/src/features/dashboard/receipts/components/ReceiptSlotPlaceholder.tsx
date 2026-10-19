"use client";

import { CheckCircle2, FileText, Upload } from "lucide-react";

import {
  MISSING_SOA_LABEL,
  MissingSoaBadge,
  MissingSoaNotice,
} from "@/components/shared/MissingSoaBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveCardAccent } from "@/lib/credit-cards/card-accent";
import { cn } from "@/lib/utils/cn";

import { formatReceiptDueDate } from "../lib/receipt-utils";
import type { ReceiptSlot } from "../lib/receipt-slots";

type ReceiptSlotPlaceholderProps = {
  slot: ReceiptSlot;
  emphasizePeriod?: boolean;
  onViewSoa: (slot: ReceiptSlot) => void;
  onUpload: (slot: ReceiptSlot) => void;
  uploadDisabled?: boolean;
};

export function ReceiptSlotPlaceholder({
  slot,
  emphasizePeriod = false,
  onViewSoa,
  onUpload,
  uploadDisabled,
}: ReceiptSlotPlaceholderProps) {
  const accent = resolveCardAccent(slot.issuerId, slot.color);
  const dueDate = formatReceiptDueDate(slot.dueDateYmd);
  const heading = emphasizePeriod ? slot.periodLabel : slot.label;
  const statusLabel = slot.soaMissing
    ? MISSING_SOA_LABEL
    : slot.paid
      ? "Paid"
      : "Pending";
  const amount =
    slot.totalDue && slot.totalDue !== "—" ? slot.totalDue : null;
  const minimum =
    slot.minimumDue && slot.minimumDue !== "—" ? slot.minimumDue : null;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 shadow-sm",
        slot.paid
          ? "border-success/35"
          : slot.soaMissing
            ? "border-warning/50"
            : "border-dashed border-warning/50",
      )}
      style={accent.stripeStyle}
    >
      <button
        type="button"
        onClick={() => onViewSoa(slot)}
        className="flex min-h-[7.5rem] w-full items-stretch text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-[8rem]"
        aria-label={`View SOA for ${slot.label}, ${slot.periodLabel}. ${statusLabel}.`}
      >
        <div
          className={cn(
            "flex w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1.5 self-stretch border-r sm:w-24",
            slot.paid
              ? "border-success/25 bg-success/10 text-[hsl(var(--success))]"
              : slot.soaMissing
                ? "border-warning/30 bg-warning/10 text-warning"
                : "border-border/80 bg-muted/40 text-muted-foreground",
          )}
        >
          {slot.paid ? (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          ) : (
            <FileText className="h-5 w-5" aria-hidden />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wide">
            {statusLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate font-display text-sm font-semibold leading-snug">
              {heading}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {emphasizePeriod
                ? `${slot.label} ···· ${slot.cardLast4}`
                : `···· ${slot.cardLast4}`}
            </p>
            {dueDate ? (
              <p className="text-[11px] text-muted-foreground">Due {dueDate}</p>
            ) : null}
          </div>

          {slot.soaMissing ? (
            <MissingSoaBadge />
          ) : (
            <StatusBadge
              label={statusLabel}
              variant={slot.paid ? "success" : "warning"}
            />
          )}

          {amount || minimum ? (
            <div className="mt-auto space-y-1">
              {amount ? (
                <p className="font-display text-base font-semibold tabular-nums leading-none">
                  {amount}
                </p>
              ) : null}
              {minimum ? (
                <p className="text-[11px] text-muted-foreground">
                  Min {minimum}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {slot.soaMissing ? (
        <div className="border-t border-warning/30 px-3 py-2">
          <MissingSoaNotice className="border-0 bg-transparent p-0" />
        </div>
      ) : null}

      <div className="flex gap-2 border-t border-border/80 p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 flex-1"
          onClick={() => onViewSoa(slot)}
        >
          <FileText className="mr-1.5 h-3.5 w-3.5" />
          SOA
        </Button>
        <Button
          type="button"
          variant={slot.paid ? "outline" : "default"}
          size="sm"
          className="min-h-11 flex-1"
          disabled={uploadDisabled}
          onClick={() => onUpload(slot)}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>
      </div>
    </Card>
  );
}
