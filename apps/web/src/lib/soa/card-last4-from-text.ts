import { normalizeCardLast4 } from "@/lib/due/normalize";
import { collapseLetterSpacedText } from "@/lib/soa/letter-spacing";

export type KnownCardForLast4 = {
  last4: string;
  fullPan?: string;
  label?: string;
};

/**
 * BPI prints card numbers as `418898-4-90-3210657` (6-1-2-7). The customer number
 * uses the same shape but starts with `0`, so require a card-network leading digit.
 */
const BPI_CARD_NUMBER =
  /\b[2-6]\d{5}\s*-\s*\d\s*-\s*\d{2}\s*-\s*\d{3}(\d{4})\b/;

const BPI_CARD_HOLDER_ROW =
  /\b[2-6]\d{5}\s*-\s*\d\s*-\s*\d{2}\s*-\s*\d{3}(\d{4})\s*-\s*([A-Za-z][A-Za-z .,'-]*[A-Za-z])/;

/** PAN / masked / "ending in" last-4s — not bank-internal account suffixes. */
export function extractEmbossedCardLast4Candidates(text: string): string[] {
  const flat = collapseLetterSpacedText(text).replace(/\s+/g, " ");
  const found = new Set<string>();

  const panRe = /(?:\d{4}[\s-]?){3}(\d{4})\b/g;
  let m: RegExpExecArray | null;
  while ((m = panRe.exec(flat)) !== null) {
    found.add(normalizeCardLast4(m[1]!));
  }

  const maskedRe =
    /(?:X{2,4}[\s-]?){2,3}X{2,4}[\s-]?(\d{4})\b|(?:\*{2,}[\s-]?){3}\*{2,}[\s-]?(\d{4})\b/gi;
  while ((m = maskedRe.exec(flat)) !== null) {
    const digits = m[1] ?? m[2];
    if (digits) found.add(normalizeCardLast4(digits));
  }

  const endingRe =
    /(?:ending|last\s+4|card\s+(?:no\.?|number))\s*[:\s]*(?:\*{2,}\s*)?(\d{4})\b/gi;
  while ((m = endingRe.exec(flat)) !== null) {
    found.add(normalizeCardLast4(m[1]!));
  }

  return [...found];
}

/** Candidate card last-4 values found in SOA plain text (includes BPI account nos). */
export function extractCardLast4Candidates(text: string): string[] {
  const found = new Set(extractEmbossedCardLast4Candidates(text));
  const flat = collapseLetterSpacedText(text).replace(/\s+/g, " ");
  const bpiRe = new RegExp(BPI_CARD_NUMBER.source, "g");
  let m: RegExpExecArray | null;
  while ((m = bpiRe.exec(flat)) !== null) {
    found.add(normalizeCardLast4(m[1]!));
  }
  return [...found];
}

function lettersOnlyUpper(value: string): string {
  return value.replace(/[^A-Za-z]/g, "").toUpperCase();
}

/**
 * Consolidated statements list supplementary cards next to the principal card
 * (`<card no> - <holder>`). The principal holder's name is also printed in the
 * statement header, so pick the one card whose holder name appears more than once.
 */
export function principalCardLast4(
  text: string,
  candidates: string[],
): string | null {
  const collapsed = collapseLetterSpacedText(text);
  const docLetters = lettersOnlyUpper(collapsed);
  const principals = new Set<string>();

  for (const line of collapsed.split("\n")) {
    const m = line.match(BPI_CARD_HOLDER_ROW);
    if (!m) continue;
    const last4 = normalizeCardLast4(m[1]!);
    if (!candidates.includes(last4)) continue;
    const holder = lettersOnlyUpper(m[2]!);
    if (holder.length < 4) continue;
    if (docLetters.split(holder).length - 1 >= 2) principals.add(last4);
  }

  return principals.size === 1 ? [...principals][0]! : null;
}

function firstKnownLast4InText(
  text: string,
  candidates: string[],
  knownLast4s: string[],
): string | null {
  const known = new Set(knownLast4s.map(normalizeCardLast4));
  let earliest = Number.POSITIVE_INFINITY;
  let picked: string | null = null;

  for (const last4 of candidates) {
    if (!known.has(last4)) continue;
    const idx = text.indexOf(last4);
    if (idx >= 0 && idx < earliest) {
      earliest = idx;
      picked = last4;
    }
  }

  return picked;
}

function panDigits(pan: string): string {
  return pan.replace(/\D/g, "");
}

function last4FromFullPanMatch(
  text: string,
  cards: KnownCardForLast4[],
): string | null {
  const flat = text.replace(/\s+/g, " ");
  const flatDigits = text.replace(/\D/g, "");
  let best: { last4: string; length: number } | null = null;

  for (const card of cards) {
    const fullPan = card.fullPan?.trim();
    if (!fullPan) continue;

    const digits = panDigits(fullPan);
    const spaced = fullPan.replace(/\s+/g, " ").trim();
    const matches =
      (digits.length >= 8 && flatDigits.includes(digits)) ||
      flat.includes(spaced);

    if (!matches) continue;

    const length = Math.max(digits.length, spaced.length);
    if (!best || length > best.length) {
      best = { last4: card.last4, length };
    }
  }

  return best ? normalizeCardLast4(best.last4) : null;
}

const SUBJECT_STOP_WORDS = new Set([
  "unionbank",
  "rewards",
  "visa",
  "platinum",
  "credit",
  "card",
  "statement",
  "account",
  "electronic",
]);

/** Unionbank subjects: "… Credit Card ending in 6607 e-Statement" */
function last4FromSubjectEndingPattern(
  subject: string,
  cards: KnownCardForLast4[],
): string | null {
  const endingRe =
    /(?:ending|last\s+4|card\s+(?:no\.?|number))\s*(?:in|is|:)?\s*(?:\*{2,}\s*)?(\d{4})\b/i;
  const m = subject.match(endingRe);
  if (!m?.[1]) return null;

  const digits = normalizeCardLast4(m[1]);
  const known = new Set(cards.map((c) => normalizeCardLast4(c.last4)));
  return known.has(digits) ? digits : null;
}

function last4FromEmailSubject(
  subject: string,
  cards: KnownCardForLast4[],
): string | null {
  const fromEnding = last4FromSubjectEndingPattern(subject, cards);
  if (fromEnding) return fromEnding;

  const subjectLower = subject.toLowerCase();
  const labeled = cards.filter((card) => card.label?.trim());
  const byLabelLength = [...labeled].sort(
    (a, b) => b.label!.trim().length - a.label!.trim().length,
  );

  for (const card of byLabelLength) {
    const labelLower = card.label!.trim().toLowerCase();
    if (subjectLower.includes(labelLower)) {
      return normalizeCardLast4(card.last4);
    }
  }

  let best: { last4: string; score: number } | null = null;
  let secondBest = 0;

  for (const card of labeled) {
    const labelLower = card.label!.trim().toLowerCase();
    for (const rawWord of labelLower.split(/[\s+]+/)) {
      const word = rawWord.replace(/[^a-z0-9]/gi, "");
      if (word.length < 4 || SUBJECT_STOP_WORDS.has(word)) continue;
      if (!subjectLower.includes(word)) continue;

      const score = word.length;
      if (!best || score > best.score) {
        secondBest = best?.score ?? 0;
        best = { last4: card.last4, score };
      } else if (score > secondBest) {
        secondBest = score;
      }
    }
  }

  if (best && best.score > secondBest) {
    return normalizeCardLast4(best.last4);
  }

  return null;
}

/**
 * Pick a last-4 from SOA text / AI without requiring the card to already exist.
 * Returns null when multiple candidates conflict and AI does not disambiguate.
 */
export function pickDetectedCardLast4(
  text: string,
  aiLast4?: string | null,
  unlockLast4?: string,
): string | null {
  const candidates = extractCardLast4Candidates(text);
  const aiDigits = String(aiLast4 ?? "").replace(/\D/g, "");
  const ai =
    aiDigits.length >= 4 ? normalizeCardLast4(aiDigits.slice(-4)) : "";

  if (ai) {
    if (candidates.length === 0 || candidates.includes(ai)) return ai;
  }

  if (candidates.length === 1) return candidates[0]!;

  if (candidates.length > 1) {
    // Prefer the first "ending in / last 4" style match when several PANs appear.
    const endingRe =
      /(?:ending|last\s+4|card\s+(?:no\.?|number))\s*(?:in|is|:)?\s*(?:\*{2,}\s*)?(\d{4})\b/gi;
    let m: RegExpExecArray | null;
    while ((m = endingRe.exec(text.replace(/\s+/g, " "))) !== null) {
      const digits = normalizeCardLast4(m[1]!);
      if (candidates.includes(digits)) return digits;
    }
    return principalCardLast4(text, candidates);
  }

  const unlockDigits = String(unlockLast4 ?? "").replace(/\D/g, "");
  const unlock =
    unlockDigits.length >= 4
      ? normalizeCardLast4(unlockDigits.slice(-4))
      : "";
  if (unlock && unlock !== "0000") return unlock;

  return null;
}

/**
 * Prefer the card last-4 printed on the SOA over the credential that unlocked the PDF.
 * Same-bank cards often share one PDF password; the first password in CARDS_JSON would
 * otherwise label every PDF with the same last-4.
 */
export function resolveCardLast4FromSoaText(
  text: string,
  knownCards: KnownCardForLast4[],
  unlockLast4: string,
  emailSubject?: string,
): string {
  const normalizedKnown = knownCards.map((c) => normalizeCardLast4(c.last4));
  const unlockNorm = normalizeCardLast4(unlockLast4);

  const fromFullPan = last4FromFullPanMatch(text, knownCards);
  if (fromFullPan) return fromFullPan;

  const subject = emailSubject?.trim();
  if (subject) {
    const fromSubject = last4FromEmailSubject(subject, knownCards);
    if (fromSubject) return fromSubject;
  }

  const candidates = extractCardLast4Candidates(text);
  const matched = candidates.filter((c) => normalizedKnown.includes(c));
  if (matched.length === 1) return matched[0]!;

  if (matched.length > 1) {
    const principal = principalCardLast4(text, matched);
    if (principal) return principal;
    const fromText = firstKnownLast4InText(text, matched, normalizedKnown);
    if (fromText) return fromText;
  }

  if (candidates.length === 1 && normalizedKnown.includes(candidates[0]!)) {
    return candidates[0]!;
  }

  const fromText = firstKnownLast4InText(text, candidates, normalizedKnown);
  if (fromText && fromText !== unlockNorm) return fromText;

  return unlockNorm;
}
