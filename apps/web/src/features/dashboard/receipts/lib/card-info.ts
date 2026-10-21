import { expectedDueDateYmd } from "@/lib/credit-cards/expected-due";
import {
  CARD_NETWORK_LABELS,
  normalizeCardNetwork,
} from "@/lib/db/schema/credit-cards";
import { normalizeCardLast4 } from "@/lib/due/normalize";

export type CardInfoCard = {
  issuer: string;
  last4: string;
  label: string | null;
  fullPan: string | null;
  cardNetwork: string | null;
  statementDay: number | null;
};

export type CardInfoStatement = {
  issuerId: string;
  cardLast4: string;
  statementMonth: number;
  statementYear: number;
  statementDate: string | null;
  soaUnavailable: boolean | null;
};

export type CardInfoRequest = {
  issuerId: string | null;
  cardLast4: string | null;
  label: string | null;
  periodKey: string | null;
  minimumDue: string | null;
  totalDue: string | null;
  dueDateYmd: string | null;
  statementDate: string | null;
};

export type CardInfoField = {
  id: string;
  label: string;
  display: string;
  copyValue: string | null;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function usableDateText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "—" || trimmed === "-" || trimmed === "–") {
    return null;
  }
  return trimmed;
}

function isBlankAmount(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return !trimmed || trimmed === "—" || trimmed === "–" || trimmed === "-";
}

export function panDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function maskPan(digits: string): string {
  if (digits.length < 4) return "—";
  const last4 = digits.slice(-4);
  const hidden = "*".repeat(digits.length - 4)
    .replace(/(.{4})/g, "$1 ")
    .trim();
  return `${hidden} ${last4}`.trim();
}

export function copyAmount(value: string | null | undefined): string | null {
  if (isBlankAmount(value)) return null;
  const cleaned = value!.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === ".") return null;
  const [whole, fraction] = cleaned.split(".");
  if (fraction === undefined) return whole ?? null;
  return `${whole}.${fraction}`;
}

export function displayAmount(value: string | null | undefined): string {
  if (isBlankAmount(value)) return "—";
  return value!.trim();
}

export function toIsoDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "—" || trimmed === "-") return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const display = /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})$/.exec(trimmed);
  if (display) {
    const month = MONTHS.findIndex(
      (name) => name.toLowerCase() === display[1]!.toLowerCase(),
    );
    if (month >= 0) {
      const day = Number(display[2]);
      const year = Number(display[3]);
      if (day >= 1 && day <= 31) {
        return expectedDueDateYmd(year, month + 1, day);
      }
    }
  }
  return null;
}

export function displayDate(ymd: string | null): string {
  if (!ymd) return "—";
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;
  const name = MONTHS[month - 1];
  if (!name) return ymd;
  return `${name} ${day}, ${year}`;
}

function statementYmdFromDay(
  periodKey: string | null,
  statementDay: number | null | undefined,
): string | null {
  if (!periodKey || statementDay == null) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(periodKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || !month || statementDay < 1 || statementDay > 31) return null;
  return expectedDueDateYmd(year, month, statementDay);
}

function field(
  id: string,
  label: string,
  display: string,
  copyValue: string | null,
): CardInfoField {
  return {
    id,
    label,
    display: display.trim() || "—",
    copyValue: copyValue && copyValue.trim() ? copyValue.trim() : null,
  };
}

export function buildCardInfoFields(input: {
  request: CardInfoRequest;
  cards: CardInfoCard[];
  statements: CardInfoStatement[];
}): CardInfoField[] {
  const last4 = input.request.cardLast4
    ? normalizeCardLast4(input.request.cardLast4)
    : "";
  const issuer = input.request.issuerId?.trim().toLowerCase() ?? "";
  const byIssuer = input.cards.find(
    (row) =>
      row.issuer.trim().toLowerCase() === issuer &&
      normalizeCardLast4(row.last4) === last4,
  );
  const last4Matches = last4
    ? input.cards.filter((row) => normalizeCardLast4(row.last4) === last4)
    : [];
  const card = byIssuer ?? (last4Matches.length === 1 ? last4Matches[0] : undefined);

  const periodMatch = input.request.periodKey
    ? /^(\d{4})-(\d{2})$/.exec(input.request.periodKey)
    : null;
  const statementRow = input.statements.find((row) => {
    if (row.soaUnavailable) return false;
    if (normalizeCardLast4(row.cardLast4) !== last4) return false;
    if (issuer && row.issuerId.trim().toLowerCase() !== issuer) return false;
    if (!periodMatch) return Boolean(row.statementDate);
    return (
      row.statementYear === Number(periodMatch[1]) &&
      row.statementMonth === Number(periodMatch[2])
    );
  });

  const statementRaw =
    usableDateText(input.request.statementDate) ??
    usableDateText(statementRow?.statementDate);
  const statementYmd =
    toIsoDate(input.request.statementDate) ??
    toIsoDate(statementRow?.statementDate) ??
    statementYmdFromDay(input.request.periodKey, card?.statementDay);
  const dueRaw = usableDateText(input.request.dueDateYmd);
  const dueYmd = toIsoDate(input.request.dueDateYmd);
  const digits = panDigits(card?.fullPan);
  const numberDisplay =
    digits.length >= 12
      ? maskPan(digits)
      : last4
        ? `**** **** **** ${last4}`
        : "—";
  const network = normalizeCardNetwork(card?.cardNetwork);
  const name = card?.label?.trim() || input.request.label?.trim() || "";

  return [
    field("name", "Name", name || "—", name || null),
    field(
      "number",
      "Credit card number",
      numberDisplay,
      digits.length >= 12 ? digits : null,
    ),
    field(
      "type",
      "Card type",
      network ? CARD_NETWORK_LABELS[network] : "—",
      network ? CARD_NETWORK_LABELS[network] : null,
    ),
    field(
      "minimum",
      "Min due",
      displayAmount(input.request.minimumDue),
      copyAmount(input.request.minimumDue),
    ),
    field(
      "total",
      "Total due",
      displayAmount(input.request.totalDue),
      copyAmount(input.request.totalDue),
    ),
    field(
      "statement",
      "Statement date",
      statementYmd ? displayDate(statementYmd) : (statementRaw ?? "—"),
      statementYmd ?? statementRaw,
    ),
    field("due", "Due date", dueYmd ? displayDate(dueYmd) : (dueRaw ?? "—"), dueYmd ?? dueRaw),
  ];
}
