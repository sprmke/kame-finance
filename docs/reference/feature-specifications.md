# Feature Specifications

**Status:** Stub. Add per-feature specs as modules are implemented.

## Credit cards module

See `docs/temp/pay-credit-cards-migration.md` and `.cursor/rules/18-credit-cards-module.mdc` for legacy behavior and porting requirements.

### Manual SOA upload

- **Upload:** `POST /api/soa/manual-upload` stores the file; `soa.processManualUpload` parses it.
- **Inputs:** `periodId`, `storagePath`, `originalFileName`, optional `mimeType`, `forceMonth`/`forceYear`, `allowOutOfRange`.
- **Alignment:** statement date (else due date) vs the period range. In-range months persist immediately; out-of-range or unknown month returns `needs_confirmation`.
- **Parse path:** PDF unlock with card passwords → text/OCR → bank parsers → AI fill. Images use AI vision (Gemini, Groq fallback). Settings `ai_api_keys` required for AI. OCR uses vendored Tesseract WASM (`prepare-server-native`); if WASM is missing or OCR exceeds `SOA_OCR_TIMEOUT_MS`, the run continues with pdf.js text instead of hanging.
- **Card assignment:** detect issuer + last-4 from the statement (text/OCR/AI). Prefer an existing card for that bank when the printed last-4 is an internal account suffix (e.g. BPI `…0657`) or when the period already has an unavailable/blank SOA slot for that issuer — update that row for the statement month instead of creating a duplicate bank card. If that card is not on the user’s list yet (and no single issuer slot fits), create it (`creditCardService.ensureForManualUpload`) using the unlock password when available and due day from the SOA due date. Soft-deleted matches are restored. Ambiguous last-4 across multiple cards of the same bank is rejected — not assigned to a random card. Consolidated statements that list supplementary cards (`<card no> - <holder>`, e.g. BPI `418898-4-90-3210657`) resolve to the principal card — the holder also named in the statement header. Letter-spaced pdf.js text (`B P I   A M O R E`) is collapsed before issuer/last-4 detection. OCR is capped at 3 pages on Vercel, so when the OCR text has no card number (or fewer transactions) the pdf.js text layer is used instead. Persisted identity is `(issuer, last-4, statement month/year)` — re-uploads for the same period merge/update that row.
- **Dates:** statement/due dates accept ISO (`YYYY-MM-DD`) and display (`Mon DD, YYYY`); invalid overflow dates (e.g. Feb 31) are ignored.
- **Upload safety:** MIME is sniffed from file bytes (empty `Content-Type` is not trusted). `storagePath` must belong to the authenticated user.
- **Persist:** same `soa_statements` / `soa_transactions` / `due_entries` path as Gmail runs (`sourceMessageId` prefix `manual:`). One statement row per card per billing period; leftover duplicates (two Gmail messages for the same card, or a placeholder beside a later parsed row) are collapsed on persist and when a period is listed or opened.

### Manual SOA entry

- **Procedure:** `soa.createManualEntry`.
- **Inputs:** `periodId`, `creditCardId`, `statementMonth` / `statementYear` (must fall inside the period), `statementDate`, `dueDate`, `minimumDue`, `totalDue`, and optional `transactions` (`date`, `description`, `amount`, `credit`, optional `categorySlug`).
- **Summary only:** with no transactions, total due and minimum due are the amounts entered. An existing statement for that card and month keeps its transaction lines.
- **With transactions:** total due is the net of the lines (charges add; credits, `(CR)` amounts, and payment descriptions subtract; result is clamped at zero) and replaces that statement’s lines. Minimum due stays user-entered and must be less than or equal to total due.
- **Stored shape:** same `soa_statements` / `soa_transactions` columns as a parsed SOA. New rows use `sourceEmailSubject` `Manual entry`. Category is `manual` when chosen, otherwise the existing rules. Due upsert, interest-from-lines, and statement/due-day sync run the same way as upload.

- Card create requires `statementDay` and `dueDay` (integers 1–31); card edit requires both in the UI.
- **Issuers:** create/edit bank picker uses `PH_BANK_ISSUERS` (grouped e-wallets with credit cards, digital banks, traditional banks). Validation is `z.enum(BANK_ISSUERS)` on create/update. Dedicated SOA parsers remain Metrobank, RCBC, BPI, Unionbank; other issuers use generic or tailored Gmail search, generic parse, and AI extract.
- **Maya Gmail search:** the card's SOA subject is the phrase Gmail matches, so `Your Maya Black Credit Card billing statement` hits `… billing statement is now available`. A blank subject searches that phrase and `Your Maya Credit Card billing statement`. Security-deposit mail (`security deposit billing statement`) is excluded. The statement month is the email's received month (`after`/`before`); Maya writes the period as `YYYY-MM-DD` (`2026-09-11 to 2026-10-10`), not `October 2026`.
- **PH e-wallets vs credit products (catalog policy):** only brands that issue a credit **card** with billing statements are listed under **E-wallets** — today **Maya** (`maya`, Maya Black billing email). **MariBank** Mari Credit Card uses the existing **digital bank** row. **GCash GCredit** is a CIMB-backed credit line (email SOA, in-app Manage Credit), not a GCash-branded card issuer here. **GrabPay**, **ShopeePay**, and **Coins.ph** have no credit-card product in public sources checked for this update.
- Parsed SOA statements fill a missing `dueDay` from due-date history and a missing `statementDay` from statement-date history (most frequent calendar day; latest wins ties). New SOA persist refreshes both from history when null.
- The monthly expected statement/due dates clamp to the month’s last day.
- The open billing month is the current calendar month plus `gmailMonthOffset`. Reminders and receipts list that month with one placeholder per registered card and do not open the next month early. `estimatedDueYmdForStatementMonth` keeps the due date in the statement month when the due day is after the statement day; otherwise the due date is the next month and the row still groups under the statement month (`statementMonthForDueYmd`).
- `expected-due-entry.service` seeds an `expected` due row for the open month as soon as the card has no parsed SOA, including before the statement date and before the payment reminder window. A row whose billing month is after the open month is removed. Before the statement date the row is **Pending** and the missing-SOA warning stays hidden. On or after the statement date, `creditCards.list` and reminder cards return `soaMissing`. The **SOA missing** badge appears on the cards table and grid, overview, reminder due cards, SOA period table and cards, statement detail, and receipt slots. Copy on those cards: “Statement date passed. SOA not available.”
- During the configured reminder window, an active card without an SOA-backed due entry can also get an `expected` due entry for an earlier month (unchanged overdue follow-up). That path never creates a statement month after the open one.
- Expected entries show missing-SOA guidance, generate reminders/calendar events, and cannot be marked paid.
- **SOA run + Google Calendar:** when `createCalendar` is on, `buildCalendarRowsForSoaRun` (`lib/soa/calendar-sync-rows.ts`) syncs parsed rows plus estimated due dates for every active card missing a statement in each month of the run. Event descriptions use `notification-body` copy: waiting for SOA during the billing period, or upload/check-bank after the statement period end date.
- **Re-run skip:** `runPipeline` accepts `skipExistingCards`. The Run SOA dialog shows **Skip cards with SOA** only from **Re-run**, default on. For each month in the range, a card with a real `soa_statements` row (`soaUnavailable` is not true) is left out of Gmail search and parse. Unavailable placeholders are retried. New statements still persist, refresh dues, and follow the Telegram, Slack, and Calendar toggles. Cards that were skipped are omitted from estimated calendar events so an existing statement is not replaced with a missing-SOA event. The summary PDF still includes the saved statements.
- SOA ingestion upgrades the same card/month entry to `source = soa`.

### SOA period analytics

- **Analytics tab:** category breakdown + distribution donut (analyzed spend only).
- **Drill-down:** clicking a category row, donut slice, or legend item replaces the breakdown with that category’s transactions on the same card. The URL is `?tab=analytics&category=<slug>` (built-in or `u_` custom slugs). **Back** or Escape restores the breakdown and drops `category`. Overview **Spend by category** for a month uses the same URL on that month’s SOA period. A year view does not drill down.
- Transactions match the chart totals (positive spend in that slug). Multi-card periods show bank + last-4 on each row.

## Platform

- Reminders: generic engine with `relatedEntityType` / `relatedEntityId`
- Automations: Supabase Cron + `automation_runs` logging
- Integrations: per-user OAuth and webhook config. Google login requests offline Gmail/Calendar access without forcing consent on every visit; Settings reconnect / add-account uses `prompt=consent` so Google issues a refresh token. Access-token refresh is written back to `accounts` so cron (SOA check, payment reminders) does not depend on a browser session. **Run SOA** loads those tokens from `accounts` into the Gmail client (`prepareSoaWorkdir` + per-mailbox switcher) before searching mail — reconnecting Google is enough; a second login is not required for each run.
