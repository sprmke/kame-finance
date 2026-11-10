"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUserFacingErrorMessage } from "@/lib/errors/user-facing-message";
import { cn } from "@/lib/utils/cn";

/** Load failure: what failed, the server's reason, and a retry. */
export function ErrorState({
  title = "Couldn't load this page",
  error,
  onRetry,
  className,
}: {
  title?: string;
  error?: { message?: string } | null;
  onRetry?: () => void;
  className?: string;
}) {
  const detail = error?.message ? formatUserFacingErrorMessage(error.message) : null;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-due/30 bg-due-wash px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="font-bold text-due">{title}</p>
        {detail ? <p className="text-13 text-foreground/80">{detail}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
