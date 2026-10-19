import { defaultSoaSubject } from "@/lib/db/schema/credit-cards";

/** Non-Black Maya product subject. Black cards use `defaultSoaSubject("maya")`. */
export const MAYA_GENERIC_BILLING_SUBJECT =
  "Your Maya Credit Card billing statement";

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeGmailPhrase(value: string): string {
  return collapse(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Phrases Gmail should find in the message subject.
 * A saved card subject wins. The bank default (or a blank subject) searches both
 * Maya billing products. The real mail is longer ("… billing statement is now
 * available"); a phrase search still matches that prefix.
 */
export function mayaBillingSubjectPhrases(
  configured?: string | null,
): string[] {
  const trimmed = collapse(configured ?? "");
  if (trimmed) return [trimmed];
  return [defaultSoaSubject("maya"), MAYA_GENERIC_BILLING_SUBJECT];
}

/** True when this message is a Maya credit-card billing statement, not a security-deposit notice. */
export function mayaStatementSubjectMatches(
  emailSubject: string,
  configured?: string | null,
): boolean {
  const email = collapse(emailSubject).toLowerCase();
  if (!email) return false;
  const phrases = mayaBillingSubjectPhrases(configured).map((phrase) =>
    collapse(phrase).toLowerCase(),
  );
  const wantsDeposit = phrases.some((phrase) =>
    phrase.includes("security deposit"),
  );
  if (!wantsDeposit && email.includes("security deposit")) return false;
  return phrases.some(
    (phrase) => phrase.length > 0 && email.includes(phrase),
  );
}

/**
 * Gmail subject clause for Maya. Month names are intentionally absent: Maya
 * writes the period as `YYYY-MM-DD` (`2026-09-11 to 2026-10-10`), so the
 * received-date window in `buildGmailQuery` picks the statement month.
 */
export function mayaGmailSubjectClause(configured?: string | null): string {
  const phrases = mayaBillingSubjectPhrases(configured).map(escapeGmailPhrase);
  const subject =
    phrases.length === 1
      ? `subject:"${phrases[0]}"`
      : `subject:(${phrases.map((phrase) => `"${phrase}"`).join(" OR ")})`;
  const wantsDeposit = phrases.some((phrase) =>
    /security deposit/i.test(phrase),
  );
  if (wantsDeposit) return subject;
  return `${subject} -subject:"security deposit"`;
}
