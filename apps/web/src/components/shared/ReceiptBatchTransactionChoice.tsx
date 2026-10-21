"use client";

import { useEffect, useState } from "react";
import { Layers, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ReceiptBatchTransactionMode } from "@/lib/receipts/batch-transaction-mode";
import { cn } from "@/lib/utils/cn";

const OPTIONS: Array<{
  value: ReceiptBatchTransactionMode;
  title: string;
  detail: string;
  icon: typeof Layers;
}> = [
  {
    value: "combined",
    title: "One payment",
    detail: "Count this upload once.",
    icon: Layers,
  },
  {
    value: "separate",
    title: "Separate payments",
    detail: "Each receipt is its own payment.",
    icon: Receipt,
  },
];

type ReceiptBatchTransactionChoiceProps = {
  open: boolean;
  fileCount: number;
  onConfirm: (mode: ReceiptBatchTransactionMode) => void;
  onCancel: () => void;
};

export function ReceiptBatchTransactionChoice({
  open,
  fileCount,
  onConfirm,
  onCancel,
}: ReceiptBatchTransactionChoiceProps) {
  const [mode, setMode] = useState<ReceiptBatchTransactionMode>("combined");
  const [labelCount, setLabelCount] = useState(fileCount);

  useEffect(() => {
    if (open) setMode("combined");
  }, [open]);

  useEffect(() => {
    if (fileCount > 0) setLabelCount(fileCount);
  }, [fileCount]);

  const countLabel = `${labelCount} ${labelCount === 1 ? "receipt" : "receipts"}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tabular-nums">
            {countLabel}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose one payment for the set, or a payment for each receipt.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={mode}
          onValueChange={(value) =>
            setMode(value as ReceiptBatchTransactionMode)
          }
          aria-label="How to record these receipts"
          className="gap-2"
        >
          {OPTIONS.map((option) => {
            const selected = mode === option.value;
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border-2 px-3 py-3 transition-colors duration-200 motion-reduce:transition-none touch-manipulation",
                  "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
                  selected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:bg-accent/70",
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`receipt-batch-${option.value}`}
                  className="shrink-0"
                />
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    selected
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {option.detail}
                  </span>
                </span>
              </label>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => onConfirm(mode)}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
