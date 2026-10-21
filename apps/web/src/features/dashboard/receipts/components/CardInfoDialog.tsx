"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CardInfoField } from "../lib/card-info";

type CardInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: CardInfoField[];
};

export function CardInfoDialog({
  open,
  onOpenChange,
  fields,
}: CardInfoDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyField(field: CardInfoField) {
    if (!field.copyValue) return;
    try {
      await navigator.clipboard.writeText(field.copyValue);
      setCopiedId(field.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === field.id ? null : current));
      }, 1500);
    } catch {
      toast.error(`Could not copy ${field.label.toLowerCase()}`);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCopiedId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Card info</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border/70">
          {fields.map((field) => {
            const copied = copiedId === field.id;
            return (
              <li
                key={field.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="truncate font-medium tabular-nums text-sm">
                    {field.display}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0"
                  disabled={!field.copyValue}
                  aria-label={
                    copied ? `Copied ${field.label}` : `Copy ${field.label}`
                  }
                  onClick={() => void copyField(field)}
                >
                  {copied ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="sr-only" aria-live="polite">
          {copiedId
            ? `Copied ${fields.find((field) => field.id === copiedId)?.label ?? "field"}`
            : ""}
        </p>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
