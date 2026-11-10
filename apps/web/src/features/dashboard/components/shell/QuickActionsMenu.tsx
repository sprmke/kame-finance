"use client";

import { CreditCard, Play, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

import { useQuickActions } from "./QuickActionsProvider";

export function QuickActionsMenu({
  variant,
  className,
}: {
  variant: "rail" | "icon";
  className?: string;
}) {
  const actions = useQuickActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "rail" ? (
          <Button className={cn("w-full justify-start", className)}>
            <Plus />
            New
          </Button>
        ) : (
          <Button
            size="icon"
            className={cn("h-10 w-10", className)}
            aria-label="New"
          >
            <Plus className="!size-5" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "rail" ? "start" : "end"}
        className="w-56"
      >
        <DropdownMenuItem
          disabled={actions.receiptUploadPending}
          onSelect={() => actions.uploadReceipt()}
        >
          <Upload />
          Upload receipt
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={actions.runSoaPending}
          onSelect={() => actions.runSoa()}
        >
          <Play />
          Run SOA
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.addCard()}>
          <CreditCard />
          Add card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
