import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { ReceiptAiVerdict } from "@/lib/receipts/types";

export function formatReceiptAiVerdictLabel(
  verdict: ReceiptAiVerdict | string | null | undefined,
): string {
  switch (String(verdict ?? "").toLowerCase()) {
    case "valid":
      return "Valid";
    case "likely_valid":
      return "Likely valid";
    case "unclear":
      return "Unclear";
    case "invalid":
      return "Invalid";
    case "skipped":
      return "Not checked";
    default:
      return "Unknown";
  }
}

function compactBadgeClass(verdict: ReceiptAiVerdict | string): string {
  const v = String(verdict).toLowerCase();
  if (v === "valid" || v === "likely_valid") {
    return "bg-success-wash text-success ring-success/25";
  }
  if (v === "invalid") {
    return "bg-due-wash text-due ring-due/25";
  }
  return "bg-warning-wash text-warning ring-warning/25";
}

function cardClass(verdict: ReceiptAiVerdict | string): string {
  const v = String(verdict).toLowerCase();
  if (v === "valid" || v === "likely_valid") {
    return "border-success/25 bg-success-wash";
  }
  if (v === "invalid") {
    return "border-due/25 bg-due-wash";
  }
  return "border-warning/25 bg-warning-wash";
}

function NoticeIcon({ verdict }: { verdict: ReceiptAiVerdict | string }) {
  const v = String(verdict).toLowerCase();
  const className = "size-4 shrink-0 mt-0.5";
  if (v === "valid" || v === "likely_valid") {
    return (
      <CheckCircle2
        className={cn(className, "text-success")}
        aria-hidden
      />
    );
  }
  if (v === "invalid") {
    return (
      <XCircle
        className={cn(className, "text-due")}
        aria-hidden
      />
    );
  }
  if (v === "unclear") {
    return (
      <HelpCircle
        className={cn(className, "text-warning")}
        aria-hidden
      />
    );
  }
  return (
    <AlertTriangle
      className={cn(className, "text-warning")}
      aria-hidden
    />
  );
}

type Props = {
  verdict: ReceiptAiVerdict | string | null | undefined;
  summary?: string | null;
  className?: string;
  compact?: boolean;
};

export function ReceiptAiVerdictBadge({
  verdict,
  summary,
  className,
  compact = false,
}: Props) {
  if (!verdict || String(verdict).toLowerCase() === "skipped") return null;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ring-1",
          compactBadgeClass(verdict),
          className,
        )}
      >
        {formatReceiptAiVerdictLabel(verdict)}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-2.5",
        cardClass(verdict),
        className,
      )}
      role="status"
    >
      <NoticeIcon verdict={verdict} />
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium leading-snug text-foreground">
          {formatReceiptAiVerdictLabel(verdict)}
        </p>
        {summary ? (
          <p className="text-2xs leading-snug text-muted-foreground">
            {summary}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function paymentStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "marked_paid":
      return "Paid";
    case "partial":
      return "Partial";
    case "rejected":
      return "Rejected";
    case "ai_error":
      return "AI error";
    case "pending":
      return "Pending";
    default:
      return status ?? "—";
  }
}
