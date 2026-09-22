# Feature Specifications

**Status:** Stub. Add per-feature specs as modules are implemented.

## Credit cards module

See `docs/temp/pay-credit-cards-migration.md` and `.cursor/rules/18-credit-cards-module.mdc` for legacy behavior and porting requirements.

### Manual SOA upload

- **Upload:** `POST /api/soa/manual-upload` stores the file; `soa.processManualUpload` parses it.
- **Inputs:** `periodId`, `storagePath`, `originalFileName`, optional `mimeType`, `forceMonth`/`forceYear`, `allowOutOfRange`.
- **Alignment:** statement date (else due date) vs the period range. In-range months persist immediately; out-of-range or unknown month returns `needs_confirmation`.
- **Parse path:** PDF unlock with card passwords → text/OCR → bank parsers → AI fill. Images use AI vision (Gemini, Groq fallback). Settings `ai_api_keys` required for AI. OCR uses vendored Tesseract WASM (`prepare-server-native`); if WASM is missing or OCR exceeds `SOA_OCR_TIMEOUT_MS`, the run continues with pdf.js text instead of hanging.
- **Card assignment:** detect issuer + last-4 from the statement (text/OCR/AI). If that card is not on the user’s list yet, create it (`creditCardService.ensureForManualUpload`) using the unlock password when available and due day from the SOA due date. Soft-deleted matches are restored. Ambiguous last-4 (multiple candidates, no AI disambiguation) is rejected — not assigned to a random card.
- **Dates:** statement/due dates accept ISO (`YYYY-MM-DD`) and display (`Mon DD, YYYY`); invalid overflow dates (e.g. Feb 31) are ignored.
- **Upload safety:** MIME is sniffed from file bytes (empty `Content-Type` is not trusted). `storagePath` must belong to the authenticated user.
- **Persist:** same `soa_statements` / `soa_transactions` / `due_entries` path as Gmail runs (`sourceMessageId` prefix `manual:`). One statement row per card per billing period; leftover duplicates (two Gmail messages for the same card, or a placeholder beside a later parsed row) are collapsed on persist and when a period is listed or opened.

- Card create requires `dueDay` (integer 1–31); card edit requires it in the UI.
- **Issuers:** create/edit bank picker uses `PH_BANK_ISSUERS` (grouped e-wallets with credit cards, digital banks, traditional banks). Validation is `z.enum(BANK_ISSUERS)` on create/update. Dedicated SOA parsers remain Metrobank, RCBC, BPI, Unionbank; other issuers use generic or tailored Gmail search, generic parse, and AI extract.
- **PH e-wallets vs credit products (catalog policy):** only brands that issue a credit **card** with billing statements are listed under **E-wallets** — today **Maya** (`maya`, Maya Black billing email). **MariBank** Mari Credit Card uses the existing **digital bank** row. **GCash GCredit** is a CIMB-backed credit line (email SOA, in-app Manage Credit), not a GCash-branded card issuer here. **GrabPay**, **ShopeePay**, and **Coins.ph** have no credit-card product in public sources checked for this update.
- Parsed SOA statements fill a missing `dueDay` from the card’s due-date history (most frequent calendar day; latest wins ties). New SOA persist refreshes that day from the full history.
- Parsed SOA statements fill a missing `dueDay` from the card’s due-date history (most frequent calendar day; latest wins ties). New SOA persist refreshes that day from the full history.
- The monthly expected date clamps to the month’s last day.
- During the configured reminder window, an active card without an SOA-backed due entry gets an `expected` due entry.
- Expected entries show missing-SOA guidance, generate reminders/calendar events, and cannot be marked paid.
- SOA ingestion upgrades the same card/month entry to `source = soa`.

### SOA period analytics

- **Analytics tab:** category breakdown + distribution donut (analyzed spend only).
- **Drill-down:** clicking a category row, donut slice, or legend item replaces the breakdown with that category’s transactions on the same card. **Back** or Escape restores the breakdown.
- Transactions match the chart totals (positive spend in that slug). Multi-card periods show bank + last-4 on each row.

## Platform

- Reminders: generic engine with `relatedEntityType` / `relatedEntityId`
- Automations: Supabase Cron + `automation_runs` logging
- Integrations: per-user OAuth and webhook config. Google login requests offline Gmail/Calendar access without forcing consent on every visit; Settings reconnect / add-account uses `prompt=consent` so Google issues a refresh token. Access-token refresh is written back to `accounts` so cron (SOA check, payment reminders) does not depend on a browser session. **Run SOA** loads those tokens from `accounts` into the Gmail client (`prepareSoaWorkdir` + per-mailbox switcher) before searching mail — reconnecting Google is enough; a second login is not required for each run.
