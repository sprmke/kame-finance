# Feature Specifications

**Status:** Stub. Add per-feature specs as modules are implemented.

## Credit cards module

See `docs/temp/pay-credit-cards-migration.md` and `.cursor/rules/18-credit-cards-module.mdc` for legacy behavior and porting requirements.

### Manual SOA upload

- **Upload:** `POST /api/soa/manual-upload` stores the file; `soa.processManualUpload` parses it.
- **Inputs:** `periodId`, `storagePath`, `originalFileName`, optional `mimeType`, `forceMonth`/`forceYear`, `allowOutOfRange`.
- **Alignment:** statement date (else due date) vs the period range. In-range months persist immediately; out-of-range or unknown month returns `needs_confirmation`.
- **Parse path:** PDF unlock with card passwords → text/OCR → bank parsers → AI fill. Images use AI vision (Gemini, Groq fallback). Settings `ai_api_keys` required for AI.
- **Card assignment:** last-4 must match a card the user owns; issuer is taken from that card (or from statement text when last-4 is shared). Unknown last-4 is rejected — not assigned to a random card.
- **Dates:** statement/due dates accept ISO (`YYYY-MM-DD`) and display (`Mon DD, YYYY`); invalid overflow dates (e.g. Feb 31) are ignored.
- **Upload safety:** MIME is sniffed from file bytes (empty `Content-Type` is not trusted). `storagePath` must belong to the authenticated user.
- **Persist:** same `soa_statements` / `soa_transactions` / `due_entries` path as Gmail runs (`sourceMessageId` prefix `manual:`). One statement row per card per billing period; leftover duplicates (two Gmail messages for the same card, or a placeholder beside a later parsed row) are collapsed on persist and when a period is listed or opened.

- Card create requires `dueDay` (integer 1–31); card edit requires it in the UI.
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
