import { formatBankIssuer } from "@/lib/db/schema/credit-cards";

/** User-facing card name; falls back to issuer when no custom label is set. */
export function formatCardDisplayLabel(
  issuerId: string,
  cardLabel?: string | null,
): string {
  const trimmed = cardLabel?.trim();
  if (trimmed) return trimmed;
  return formatBankIssuer(issuerId);
}
