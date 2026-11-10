import { DayMarkGlyph, type DayMarkKind } from "@/components/calendar/DayMark";
import { Badge } from "@/components/ui/badge";
import type { BillState } from "@/lib/due/bill-state";
import { cn } from "@/lib/utils/cn";

type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "default";

const VARIANT_TO_BADGE = {
  success: "success",
  warning: "warning",
  destructive: "due",
  muted: "muted",
  default: "secondary",
} as const;

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  /** Calendar mark glyph shown before the label. */
  mark?: Exclude<DayMarkKind, "none">;
  className?: string;
}

/** Status tag (DESIGN.md › Tag): wash fill, full-color text, optional calendar mark. */
export function StatusBadge({
  label,
  variant = "default",
  mark,
  className,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={VARIANT_TO_BADGE[variant]}
      className={cn(className)}
      icon={mark ? <DayMarkGlyph kind={mark} /> : undefined}
    >
      {label}
    </Badge>
  );
}

const BILL_STATE: Record<
  BillState,
  { label: string; variant: StatusVariant; mark: Exclude<DayMarkKind, "none"> }
> = {
  paid: { label: "Paid", variant: "success", mark: "paid" },
  overdue: { label: "Overdue", variant: "destructive", mark: "urgent" },
  "due-soon": { label: "Due soon", variant: "destructive", mark: "urgent" },
  unpaid: { label: "Unpaid", variant: "default", mark: "due" },
  missing: { label: "SOA missing", variant: "warning", mark: "missing" },
  expected: { label: "Awaiting SOA", variant: "muted", mark: "expected" },
};

/** One tag per bill state so the same status reads the same on every screen. */
export function BillStatusTag({
  state,
  label,
  className,
}: {
  state: BillState;
  label?: string;
  className?: string;
}) {
  const config = BILL_STATE[state];
  return (
    <StatusBadge
      label={label ?? config.label}
      variant={config.variant}
      mark={config.mark}
      className={className}
    />
  );
}

export function billStateMark(state: BillState): DayMarkKind {
  return BILL_STATE[state].mark;
}

export { resolveBillState, type BillState } from "@/lib/due/bill-state";
