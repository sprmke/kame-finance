"use client";

import type { ReactNode } from "react";
import { CreditCard, FileText, MoreVertical, Upload } from "lucide-react";

import {
  MISSING_SOA_LABEL,
  MissingSoaBadge,
  MissingSoaNotice,
} from "@/components/shared/MissingSoaBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveCardAccent } from "@/lib/credit-cards/card-accent";
import { cn } from "@/lib/utils/cn";
import { DayMarkGlyph } from "@/components/calendar/DayMark";
import { Amount } from "@/components/shared/Amount";
import { CardSwatch } from "@/components/shared/CardChip";

import { formatReceiptDueDate } from "../lib/receipt-utils";
import type { ReceiptSlot } from "../lib/receipt-slots";

type ReceiptSlotPlaceholderProps = {
  slot: ReceiptSlot;
  emphasizePeriod?: boolean;
  onViewSoa: (slot: ReceiptSlot) => void;
  onUpload: (slot: ReceiptSlot) => void;
  onCardInfo: (slot: ReceiptSlot) => void;
  uploadDisabled?: boolean;
};

export function ReceiptSlotPlaceholder({
  slot,
  emphasizePeriod = false,
  onViewSoa,
  onUpload,
  onCardInfo,
  uploadDisabled,
}: ReceiptSlotPlaceholderProps) {
  const accent = resolveCardAccent(slot.issuerId, slot.color);
  const dueDate = formatReceiptDueDate(slot.dueDateYmd);
  const heading = emphasizePeriod ? slot.periodLabel : slot.label;
  const hasSoa = Boolean(slot.statementId);
  const statusLabel = slot.soaMissing
    ? MISSING_SOA_LABEL
    : slot.paid
      ? "Paid"
      : hasSoa
        ? "Pending"
        : "SOA not yet available";
  const amount =
    slot.totalDue && slot.totalDue !== "—" ? slot.totalDue : null;
  const minimum =
    slot.minimumDue && slot.minimumDue !== "—" ? slot.minimumDue : null;

  return (
    <Card
      className="relative overflow-hidden"
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 z-10 h-9 w-9"
            aria-label="Card actions"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="min-h-11"
            onSelect={() => onCardInfo(slot)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Card info
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SlotFace
        interactive={hasSoa}
        onOpen={() => onViewSoa(slot)}
        ariaLabel={`View SOA for ${slot.label}, ${slot.periodLabel}. ${statusLabel}.`}
      >
        <div
          className={cn(
            "flex w-[5.25rem] shrink-0 flex-col items-center justify-center gap-1.5 self-stretch border-r px-1 sm:w-24",
            slot.paid
              ? "bg-success-wash text-success"
              : slot.soaMissing
                ? "bg-warning-wash text-warning"
                : "bg-muted/60 text-muted-foreground",
          )}
        >
          {slot.paid ? (
            <DayMarkGlyph kind="paid" className="size-5" />
          ) : (
            <FileText className="h-5 w-5" aria-hidden />
          )}
          <span
            className={cn(
              "text-center text-2xs font-semibold leading-tight",
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 pr-12">
          <div className="min-w-0 space-y-0.5">
            <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold leading-snug">
              <CardSwatch color={accent.color} size="sm" />
              <span className="truncate">{heading}</span>
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {emphasizePeriod
                ? `${slot.label} ···· ${slot.cardLast4}`
                : `···· ${slot.cardLast4}`}
            </p>
            {dueDate ? (
              <p className="text-xs text-muted-foreground">Due {dueDate}</p>
            ) : null}
          </div>

          {slot.soaMissing ? (
            <MissingSoaBadge />
          ) : (
            <StatusBadge
              label={statusLabel}
              variant={slot.paid ? "success" : "muted"}
              mark={slot.paid ? "paid" : "expected"}
              className="self-start"
            />
          )}

          {amount || minimum ? (
            <div className="mt-auto space-y-1">
              {amount ? (
                <Amount value={amount} size="md" tone={slot.paid ? "muted" : "default"} />
              ) : null}
              {minimum ? (
                <p className="text-xs text-muted-foreground">
                  Min {minimum}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </SlotFace>

      {slot.soaMissing ? (
        <MissingSoaNotice className="rounded-none border-t" />
      ) : null}

      <div className="flex gap-2 border-t p-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 max-lg:h-10"
          disabled={!hasSoa}
          aria-label={
            hasSoa
              ? `View SOA for ${slot.label}`
              : "SOA not yet available"
          }
          onClick={() => onViewSoa(slot)}
        >
          <FileText />
          SOA
        </Button>
        <Button
          type="button"
          variant={slot.paid ? "outline" : "default"}
          size="sm"
          className="flex-1 max-lg:h-10"
          disabled={uploadDisabled}
          onClick={() => onUpload(slot)}
        >
          <Upload />
          Upload
        </Button>
      </div>
    </Card>
  );
}

function SlotFace({
  interactive,
  onOpen,
  ariaLabel,
  children,
}: {
  interactive: boolean;
  onOpen: () => void;
  ariaLabel: string;
  children: ReactNode;
}) {
  const className =
    "flex min-h-[7.5rem] w-full items-stretch text-left sm:min-h-[8rem]";

  if (!interactive) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        className,
        "transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
