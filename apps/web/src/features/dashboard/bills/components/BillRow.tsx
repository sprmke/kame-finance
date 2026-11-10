"use client";

import { forwardRef } from "react";
import {
  CheckCircle2,
  MoreHorizontal,
  Play,
  Receipt,
  RotateCcw,
  Upload,
} from "lucide-react";

import { DateNumeral } from "@/components/calendar/DateNumeral";
import { Amount } from "@/components/shared/Amount";
import { CardChip } from "@/components/shared/CardChip";
import { BillStatusTag } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markForState } from "@/lib/calendar/month-grid";
import { formatDaysAway, type BillState } from "@/lib/due/bill-state";
import { cn } from "@/lib/utils/cn";

export type BillRowData = {
  id: string;
  issuerId: string;
  cardLast4: string;
  cardDisplayLabel: string | null;
  cardColor: string | null;
  dueDateYmd: string;
  minimumDue: string;
  totalDue: string;
  state: BillState;
  daysAway: number | null;
  scheduleLabel?: string | null;
  scheduleTone?: "ready" | "sent" | "muted";
  receiptCount: number;
};

type BillRowProps = {
  bill: BillRowData;
  disabled?: boolean;
  uploadDisabled?: boolean;
  justPaid?: boolean;
  /** Arrival highlight for a deep-linked row. */
  highlight?: boolean;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onUploadReceipt: () => void;
  onViewPayment?: () => void;
  onRunSoa: () => void;
};

/** One card's bill for the month: when, how much, status, proof, and the next action. */
export const BillRow = forwardRef<HTMLLIElement, BillRowProps>(function BillRow(
  {
    bill,
    disabled,
    uploadDisabled,
    justPaid,
    highlight,
    onMarkPaid,
    onMarkUnpaid,
    onUploadReceipt,
    onViewPayment,
    onRunSoa,
  },
  ref,
) {
  const paid = bill.state === "paid";
  const awaiting = bill.state === "missing" || bill.state === "expected";
  const when = paid ? null : formatDaysAway(bill.daysAway);

  return (
    <li
      ref={ref}
      id={`bill-${bill.id}`}
      className={cn("scroll-mt-24 px-3 py-3 sm:px-4", highlight && "kame-arrive")}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 md:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
        <DateNumeral
          ymd={bill.dueDateYmd}
          mark={markForState(bill.state)}
          size="md"
          animate={justPaid}
        />

        <div className="min-w-0 space-y-1.5">
          <CardChip
            issuerId={bill.issuerId}
            last4={bill.cardLast4}
            label={bill.cardDisplayLabel}
            color={bill.cardColor}
          />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <BillStatusTag state={bill.state} />
            {when && !awaiting ? (
              <span
                className={cn(
                  "text-xs font-medium",
                  bill.state === "overdue" || bill.state === "due-soon"
                    ? "text-due"
                    : "text-muted-foreground",
                )}
              >
                {when}
              </span>
            ) : null}
            {!paid && bill.scheduleLabel && !/^(due|overdue)/i.test(bill.scheduleLabel) ? (
              <span
                className={cn(
                  "text-xs",
                  bill.scheduleTone === "ready" ? "font-semibold text-warning" : "text-muted-foreground",
                )}
              >
                · {bill.scheduleLabel}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="col-start-3 row-start-1 flex flex-col items-end gap-1 text-right md:col-start-auto md:row-start-auto md:flex-row md:items-baseline md:justify-end md:gap-6">
          <div className="hidden md:block">
            <dt className="text-xs text-muted-foreground">Minimum</dt>
            <dd>
              <Amount value={bill.minimumDue} tone={paid ? "muted" : "default"} />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground max-md:sr-only">Total due</dt>
            <dd>
              <Amount
                value={bill.totalDue}
                size="md"
                tone={paid ? "muted" : bill.state === "overdue" ? "due" : "default"}
                className={cn(paid && "line-through decoration-1")}
              />
            </dd>
          </div>
          <div className="md:hidden">
            <dt className="sr-only">Minimum</dt>
            <dd className="text-xs text-muted-foreground">
              Min <Amount value={bill.minimumDue} className="text-xs font-medium" tone="muted" />
            </dd>
          </div>
        </dl>

        <div className="col-span-3 flex items-center gap-2 md:col-span-1 md:justify-end">
          {awaiting ? (
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" onClick={onRunSoa}>
              <Play />
              Run SOA
            </Button>
          ) : paid ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none"
              disabled={bill.receiptCount === 0 || !onViewPayment}
              onClick={onViewPayment}
            >
              <Receipt />
              {bill.receiptCount > 1 ? `${bill.receiptCount} receipts` : "Receipt"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
                disabled={uploadDisabled}
                onClick={onUploadReceipt}
              >
                <Upload />
                Receipt
              </Button>
              <Button size="sm" className="flex-1 md:flex-none" disabled={disabled} onClick={onMarkPaid}>
                <CheckCircle2 />
                Mark paid
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0 max-md:h-9 max-md:w-9" aria-label="More bill actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                disabled={bill.receiptCount === 0 || !onViewPayment}
                onSelect={() => onViewPayment?.()}
              >
                <Receipt />
                {bill.receiptCount > 1 ? `View ${bill.receiptCount} payments` : "View payment"}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={uploadDisabled || awaiting} onSelect={onUploadReceipt}>
                <Upload />
                {paid ? "Add receipt" : "Upload receipt"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {paid ? (
                <DropdownMenuItem disabled={disabled} onSelect={onMarkUnpaid}>
                  <RotateCcw />
                  Mark unpaid
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled={disabled || awaiting} onSelect={onMarkPaid}>
                  <CheckCircle2 />
                  Mark paid
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
});
