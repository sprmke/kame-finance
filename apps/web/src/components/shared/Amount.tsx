import { cn } from "@/lib/utils/cn";
import { formatPhpAmount, parsePhpAmount } from "@/lib/utils/format-money";

type AmountProps = {
  /** A number, or an SOA amount string such as "20,920.72" / "₱20,920.72" / "-". */
  value: number | string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "default" | "muted" | "due" | "success" | "warning";
  /** Hide centavos for large display figures. */
  wholePesos?: boolean;
  className?: string;
};

const SIZE = {
  sm: "text-sm font-semibold tabular-nums",
  md: "font-numeral text-lg leading-none",
  lg: "font-numeral text-2xl leading-none",
  xl: "font-numeral text-4xl leading-none",
} as const;

const TONE = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  due: "text-due",
  success: "text-success",
  warning: "text-warning",
} as const;

function toDisplay(
  value: AmountProps["value"],
  wholePesos: boolean,
): { text: string; empty: boolean } {
  if (value === null || value === undefined) return { text: "—", empty: true };
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return { text: "—", empty: true };
    return {
      text: wholePesos
        ? Math.round(value).toLocaleString("en-PH")
        : formatPhpAmount(value),
      empty: false,
    };
  }
  const trimmed = value.trim();
  if (!trimmed || ["—", "–", "-"].includes(trimmed)) {
    return { text: "—", empty: true };
  }
  const parsed = parsePhpAmount(trimmed);
  if (parsed <= 0 && !/\d/.test(trimmed)) return { text: trimmed, empty: false };
  return {
    text: wholePesos
      ? Math.round(parsed).toLocaleString("en-PH")
      : parsed > 0
        ? formatPhpAmount(parsed)
        : trimmed.replace(/^₱\s?/, ""),
    empty: false,
  };
}

/** Peso amount set in calendar numerals; the ₱ sign is lighter so the figure leads. */
export function Amount({
  value,
  size = "sm",
  tone = "default",
  wholePesos = false,
  className,
}: AmountProps) {
  const { text, empty } = toDisplay(value, wholePesos);
  return (
    <span
      className={cn(
        "inline-flex items-baseline whitespace-nowrap",
        SIZE[size],
        empty ? "text-muted-foreground" : TONE[tone],
        className,
      )}
    >
      {empty ? (
        text
      ) : (
        <>
          <span
            className={cn(
              "mr-[0.08em] font-sans font-medium",
              size === "sm" ? "" : "text-[0.62em] opacity-80",
            )}
            aria-hidden
          >
            ₱
          </span>
          <span className="sr-only">PHP </span>
          {text}
        </>
      )}
    </span>
  );
}
