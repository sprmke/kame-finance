import {
  BANK_ISSUER_LABELS,
  parseBankIssuerId,
  type BankIssuer,
} from "@/lib/db/schema/credit-cards";

const ISSUER_PATTERNS: { id: BankIssuer; patterns: RegExp[] }[] = [
  {
    id: "maya",
    patterns: [
      /\bmaya\s+black\b/i,
      /\bmaya\s+credit\s+card\b/i,
      /\bpaymaya\b/i,
      /\bmaya\s+bank\b/i,
    ],
  },
  {
    id: "uniondigital-bank",
    patterns: [/\buniondigital\b/i, /union\s+digital\s+bank/i],
  },
  {
    id: "cimb-bank-philippines",
    patterns: [/\bcimb\b/i],
  },
  {
    id: "gotyme-bank",
    patterns: [/\bgotyme\b/i, /go\s*tyme/i],
  },
  {
    id: "uno-digital-bank",
    patterns: [/\buno\s+digital\b/i, /\buno\s+bank\b/i],
  },
  {
    id: "tonik-bank",
    patterns: [/\btonik\b/i],
  },
  {
    id: "maribank",
    patterns: [/\bmaribank\b/i, /\bmari\s+bank\b/i],
  },
  {
    id: "asia-united-bank",
    patterns: [/\basia\s+united\b/i, /\baub\b/i],
  },
  {
    id: "bank-of-commerce",
    patterns: [/bank\s+of\s+commerce/i, /\bbocom\b/i],
  },
  {
    id: "robinsons-bank",
    patterns: [/robinsons?\s+bank/i],
  },
  {
    id: "eastwest-bank",
    patterns: [/\beastwest\b/i, /east\s+west\s+bank/i],
  },
  {
    id: "security-bank",
    patterns: [/security\s+bank/i],
  },
  {
    id: "land-bank",
    patterns: [/\blandbank\b/i, /land\s+bank/i],
  },
  {
    id: "psbank",
    patterns: [/\bpsbank\b/i, /\bps\s+bank\b/i],
  },
  {
    id: "chinabank",
    patterns: [/\bchinabank\b/i, /china\s+bank/i, /china\s+banking/i],
  },
  {
    id: "pnb",
    patterns: [/\bpnb\b/i, /philippine\s+national\s+bank/i],
  },
  {
    id: "bdo",
    patterns: [/\bbdo\b/i, /bdo\s+unibank/i],
  },
  {
    id: "metrobank",
    patterns: [/\bmetrobank\b/i, /\bmfree\b/i, /\bmsoa\b/i],
  },
  {
    id: "rcbc",
    patterns: [/\brcbc\b/i, /\bflex\s+visa\b/i, /rizal\s+commercial/i],
  },
  {
    id: "bpi",
    patterns: [
      /\bbpi\b/i,
      /bank of the philippine islands/i,
      /bpi credit card/i,
    ],
  },
  {
    id: "unionbank",
    patterns: [/\bunionbank\b/i, /\bunion\s+bank\b/i, /\brewards\s+visa\b/i],
  },
];

export function detectIssuerFromSoaText(text: string): BankIssuer | null {
  const flat = text.replace(/\s+/g, " ");
  let best: { id: BankIssuer; score: number } | null = null;

  for (const { id, patterns } of ISSUER_PATTERNS) {
    let score = 0;
    for (const re of patterns) {
      if (re.test(flat)) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { id, score };
    }
  }

  return best?.id ?? null;
}

export function bankLabelForIssuer(issuerId: string): string {
  const id = parseBankIssuerId(issuerId);
  if (id) return BANK_ISSUER_LABELS[id];
  return issuerId;
}

export function parseIssuerId(
  raw: string | null | undefined,
): BankIssuer | null {
  return parseBankIssuerId(raw);
}
