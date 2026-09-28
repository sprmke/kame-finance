import { normalizeCardLast4 } from "@/lib/due/normalize";
import {
  extractCardLast4Candidates,
  extractEmbossedCardLast4Candidates,
  pickDetectedCardLast4,
  resolveCardLast4FromSoaText,
} from "@/lib/soa/card-last4-from-text";
import { normalizeSoaDisplayDate } from "@/lib/soa/calendar-month";
import {
  bankLabelForIssuer,
  detectIssuerFromSoaText,
  parseIssuerId,
} from "@/lib/soa/detect-issuer";
import type { CardCredential, SoaRow, TransactionLine } from "@/lib/soa/types";

export type SoaAiExtractFields = {
  issuerId: string | null;
  cardLast4: string | null;
  statementDate: string | null;
  dueDate: string | null;
  minimumDue: string | null;
  totalDue: string | null;
  transactions: TransactionLine[];
};

export function isBlankSoaField(value: string | null | undefined): boolean {
  const t = (value ?? "").trim();
  return !t || t === "—";
}

/** True only when last-4 is a real 4-digit value on one of the user's cards. */
export function last4MatchesKnownCard(
  last4: string,
  cards: { last4: string }[],
): boolean {
  const digits = String(last4 ?? "").replace(/\D/g, "");
  if (digits.length < 4) return false;
  const norm = digits.slice(-4);
  return cards.some((c) => normalizeCardLast4(c.last4) === norm);
}

export function mergeAiIntoSoaRow(
  row: SoaRow,
  ai: SoaAiExtractFields | null,
): SoaRow {
  if (!ai) return row;
  const next = { ...row };
  if (isBlankSoaField(next.statementDate) && ai.statementDate) {
    next.statementDate = ai.statementDate;
  }
  if (isBlankSoaField(next.dueDate) && ai.dueDate) {
    next.dueDate = ai.dueDate;
  }
  if (isBlankSoaField(next.minimumDue) && ai.minimumDue) {
    next.minimumDue = ai.minimumDue;
  }
  if (isBlankSoaField(next.totalDue) && ai.totalDue) {
    next.totalDue = ai.totalDue;
  }
  if (
    (!next.transactions || next.transactions.length === 0) &&
    ai.transactions.length
  ) {
    next.transactions = ai.transactions;
  }
  if (isBlankSoaField(next.cardLast4) && ai.cardLast4) {
    next.cardLast4 = ai.cardLast4;
  }
  return next;
}

export function soaRowNeedsAiFill(row: SoaRow): boolean {
  const missing =
    Number(isBlankSoaField(row.minimumDue)) +
    Number(isBlankSoaField(row.totalDue)) +
    Number(isBlankSoaField(row.statementDate)) +
    Number(isBlankSoaField(row.dueDate));
  return missing >= 2 || !row.transactions?.length;
}

export function resolveIssuerAndLast4(input: {
  text: string;
  cards: CardCredential[];
  unlockLast4: string;
  ai: SoaAiExtractFields | null;
}): { issuerId: string; last4: string } {
  const { text, cards, ai } = input;
  const known = cards.map((c) => ({
    last4: c.last4,
    fullPan: c.fullPan,
    label: c.label,
  }));

  const unlockIsKnown = last4MatchesKnownCard(input.unlockLast4, cards);
  const textLast4 = resolveCardLast4FromSoaText(
    text,
    known,
    unlockIsKnown ? input.unlockLast4 : "0000",
  );
  const candidates = [
    textLast4,
    ai?.cardLast4,
    unlockIsKnown ? input.unlockLast4 : null,
  ];
  const last4Raw = candidates.find((v) => v && last4MatchesKnownCard(v, cards));
  const last4 = last4Raw ? normalizeCardLast4(last4Raw) : "";

  const matchingCards = last4
    ? cards.filter((c) => normalizeCardLast4(c.last4) === last4)
    : [];
  if (matchingCards.length === 1) {
    return { issuerId: matchingCards[0]!.issuer.toLowerCase(), last4 };
  }

  const detected =
    detectIssuerFromSoaText(text) ??
    ai?.issuerId ??
    matchingCards[0]?.issuer ??
    null;

  if (detected && last4) {
    return { issuerId: detected.toLowerCase(), last4 };
  }

  return {
    issuerId: matchingCards[0]?.issuer.toLowerCase() ?? "",
    last4,
  };
}

export function applyMatchedCardMeta(
  row: SoaRow,
  cards: CardCredential[],
): SoaRow {
  const matched = cards.find(
    (c) =>
      c.issuer.toLowerCase() === row.issuerId.toLowerCase() &&
      normalizeCardLast4(c.last4) === normalizeCardLast4(row.cardLast4),
  );
  if (!matched) return row;
  return {
    ...row,
    bankLabel: bankLabelForIssuer(row.issuerId),
    cardDisplayLabel: matched.label?.trim() || row.cardDisplayLabel,
    fullPan: matched.fullPan?.trim() || row.fullPan,
    contactLine: matched.contactLine?.trim() || row.contactLine,
  };
}

export function identityIsAssignedToKnownCard(
  issuerId: string,
  last4: string,
  cards: CardCredential[],
): boolean {
  const issuer = parseIssuerId(issuerId);
  if (!issuer || !last4MatchesKnownCard(last4, cards)) return false;
  return cards.some(
    (c) =>
      c.issuer.toLowerCase() === issuer &&
      normalizeCardLast4(c.last4) === normalizeCardLast4(last4),
  );
}

/** Existing SOA rows for the upload period, used to avoid duplicate bank slots. */
export type PeriodIssuerSlot = {
  issuerId: string;
  last4: string;
  soaUnavailable: boolean;
  /** False when dues/dates are still blank placeholders (`—`). */
  hasParsedAmounts: boolean;
};

function isBlankAmountField(value: string | null | undefined): boolean {
  return isBlankSoaField(value);
}

export function statementHasParsedAmounts(row: {
  minimumDue?: string | null;
  totalDue?: string | null;
  statementDate?: string | null;
  dueDate?: string | null;
}): boolean {
  return (
    !isBlankAmountField(row.minimumDue) ||
    !isBlankAmountField(row.totalDue) ||
    !isBlankAmountField(row.statementDate) ||
    !isBlankAmountField(row.dueDate)
  );
}

/**
 * When the SOA prints an internal account suffix (e.g. BPI `…0657`) that is not
 * the embossed last-4 — or when a prior upload already created that mistaken
 * card — prefer the existing bank card that still needs an SOA this period.
 */
export function preferExistingIssuerCard(input: {
  issuerId: string;
  detectedLast4: string;
  cards: CardCredential[];
  periodSlots?: PeriodIssuerSlot[];
  /** True when last-4 came from PAN / "ending in" text (safe to auto-create). */
  detectedIsEmbossed?: boolean;
}): { last4: string; matchedKnownCard: boolean } | null {
  const issuer = parseIssuerId(input.issuerId);
  if (!issuer) return null;

  const issuerCards = input.cards.filter(
    (c) => c.issuer.toLowerCase() === issuer,
  );
  const detectedNorm = input.detectedLast4
    ? normalizeCardLast4(input.detectedLast4)
    : "";
  const exactMatch =
    detectedNorm &&
    identityIsAssignedToKnownCard(issuer, detectedNorm, input.cards)
      ? detectedNorm
      : "";

  // A clear embossed/ending last-4 for a card the user does not have yet should
  // create that card — not silently attach to their other card at the same bank.
  if (detectedNorm && input.detectedIsEmbossed && !exactMatch) {
    return null;
  }

  const issuerSlots = (input.periodSlots ?? []).filter(
    (s) => s.issuerId.toLowerCase() === issuer,
  );
  const needyKnown = issuerSlots.filter(
    (s) =>
      (s.soaUnavailable || !s.hasParsedAmounts) &&
      issuerCards.some(
        (c) => normalizeCardLast4(c.last4) === normalizeCardLast4(s.last4),
      ),
  );
  const matchedSlot = exactMatch
    ? issuerSlots.find((s) => normalizeCardLast4(s.last4) === exactMatch)
    : null;
  const matchedIsBlank =
    !exactMatch ||
    !matchedSlot ||
    matchedSlot.soaUnavailable ||
    !matchedSlot.hasParsedAmounts;

  // Prefer the bank's unavailable/blank placeholder over an internal account
  // suffix (or a blank duplicate row created from that suffix on an earlier try).
  if (matchedIsBlank) {
    const unavailableOther = needyKnown.filter(
      (s) =>
        s.soaUnavailable &&
        normalizeCardLast4(s.last4) !== (detectedNorm || exactMatch),
    );
    if (unavailableOther.length === 1) {
      return {
        last4: normalizeCardLast4(unavailableOther[0]!.last4),
        matchedKnownCard: true,
      };
    }
    if (needyKnown.length === 1) {
      const slotLast4 = normalizeCardLast4(needyKnown[0]!.last4);
      if (!exactMatch || exactMatch !== slotLast4) {
        return { last4: slotLast4, matchedKnownCard: true };
      }
    }
  }

  if (exactMatch) {
    return { last4: exactMatch, matchedKnownCard: true };
  }

  if (issuerCards.length === 1) {
    return {
      last4: normalizeCardLast4(issuerCards[0]!.last4),
      matchedKnownCard: true,
    };
  }

  return null;
}

/**
 * Resolve bank + last-4 for a manual upload. Prefers a match against the user's
 * existing cards; otherwise accepts an unambiguous detection from text/AI so the
 * card can be auto-created. When the issuer is known but the printed last-4 is
 * not on the user's list, remaps to the sole card for that bank (or the sole
 * unavailable placeholder in the upload period) so uploads update instead of
 * duplicating the bank row.
 */
export function resolveManualUploadIdentity(input: {
  text: string;
  cards: CardCredential[];
  unlockLast4: string;
  ai: SoaAiExtractFields | null;
  periodSlots?: PeriodIssuerSlot[];
}): {
  issuerId: string;
  last4: string;
  matchedKnownCard: boolean;
  /** Last-4 printed/detected on the file before issuer-slot remapping. */
  detectedLast4: string;
} {
  const known = resolveIssuerAndLast4(input);

  const issuer =
    (identityIsAssignedToKnownCard(
      known.issuerId,
      known.last4,
      input.cards,
    )
      ? parseIssuerId(known.issuerId)
      : null) ??
    detectIssuerFromSoaText(input.text) ??
    parseIssuerId(input.ai?.issuerId) ??
    parseIssuerId(known.issuerId);

  const detectedLast4 = identityIsAssignedToKnownCard(
    known.issuerId,
    known.last4,
    input.cards,
  )
    ? known.last4
    : (pickDetectedCardLast4(
        input.text,
        input.ai?.cardLast4,
        input.unlockLast4,
      ) ?? "");

  if (!issuer) {
    return {
      issuerId: "",
      last4: "",
      matchedKnownCard: false,
      detectedLast4,
    };
  }

  const embossed = new Set(extractEmbossedCardLast4Candidates(input.text));
  const aiLast4 = input.ai?.cardLast4
    ? normalizeCardLast4(input.ai.cardLast4)
    : "";
  const detectedIsEmbossed = Boolean(
    detectedLast4 &&
      (embossed.has(normalizeCardLast4(detectedLast4)) ||
        (aiLast4 && aiLast4 === normalizeCardLast4(detectedLast4))),
  );
  const preferred = preferExistingIssuerCard({
    issuerId: issuer,
    detectedLast4,
    cards: input.cards,
    periodSlots: input.periodSlots,
    detectedIsEmbossed,
  });
  if (preferred) {
    return {
      issuerId: issuer,
      last4: preferred.last4,
      matchedKnownCard: preferred.matchedKnownCard,
      detectedLast4,
    };
  }

  if (
    identityIsAssignedToKnownCard(known.issuerId, known.last4, input.cards)
  ) {
    return {
      issuerId: known.issuerId,
      last4: known.last4,
      matchedKnownCard: true,
      detectedLast4: known.last4,
    };
  }

  if (!detectedLast4) {
    return {
      issuerId: "",
      last4: "",
      matchedKnownCard: false,
      detectedLast4,
    };
  }

  return {
    issuerId: issuer,
    last4: detectedLast4,
    matchedKnownCard: false,
    detectedLast4,
  };
}

/**
 * OCR is page-capped on serverless, so card numbers printed on later pages can be
 * missing from OCR text even though the pdf.js text layer has them.
 */
export function pickIdentityText(parseText: string, rawText: string): string {
  if (parseText === rawText) return parseText;
  if (extractCardLast4Candidates(parseText).length > 0) return parseText;
  return extractCardLast4Candidates(rawText).length > 0 ? rawText : parseText;
}

export function normalizeSoaRowDates(row: SoaRow): SoaRow {
  return {
    ...row,
    statementDate: normalizeSoaDisplayDate(row.statementDate),
    dueDate: normalizeSoaDisplayDate(row.dueDate),
  };
}
