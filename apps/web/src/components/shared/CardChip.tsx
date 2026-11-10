import { formatCardDisplayLabel } from "@/lib/credit-cards/card-display-label";
import { resolveCardAccent } from "@/lib/credit-cards/card-accent";
import { formatBankIssuer } from "@/lib/db/schema/credit-cards";
import { cn } from "@/lib/utils/cn";

type CardChipProps = {
  issuerId: string;
  last4?: string | null;
  label?: string | null;
  color?: string | null;
  /** Second line under the name (e.g. "BPI · •••• 1234" when a custom label exists). */
  showIssuer?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** A card plastic in miniature: bank color swatch, card name, masked number. */
export function CardChip({
  issuerId,
  last4,
  label,
  color,
  showIssuer = true,
  size = "md",
  className,
}: CardChipProps) {
  const accent = resolveCardAccent(issuerId, color);
  const name = formatCardDisplayLabel(issuerId, label);
  const issuer = formatBankIssuer(issuerId);
  const hasCustomLabel = name !== issuer;
  const masked = last4 ? `•••• ${last4}` : null;

  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <CardSwatch color={accent.color} size={size} />
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block truncate font-semibold text-foreground",
            size === "sm" ? "text-13" : "text-sm",
          )}
        >
          {name}
        </span>
        {showIssuer && (hasCustomLabel || masked) ? (
          <span className="block truncate text-xs text-muted-foreground">
            {[hasCustomLabel ? issuer : null, masked].filter(Boolean).join(" · ")}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function CardSwatch({
  color,
  size = "md",
  className,
}: {
  color: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-black/15 dark:ring-white/15",
        size === "sm" ? "h-3.5 w-5" : "h-[18px] w-7",
        className,
      )}
      style={{ backgroundColor: color }}
    >
      <span className="absolute left-[18%] top-[30%] h-[28%] w-[22%] rounded-[1px] bg-white/45" />
    </span>
  );
}
