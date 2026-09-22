# Features inventory (rebuild scope)

**Status:** Capability checklist derived from the MVP in `apps/web` (see [application inventory](../reference/application-inventory.md)).  
**Audience:** Greenfield rebuild — use as the “what must exist” list; drop or defer items explicitly in v2.  
**Stack & phases:** [tech.md](./tech.md)

---

## 1. Public & access

| ID  | Feature                 | Notes                                         |
| --- | ----------------------- | --------------------------------------------- |
| A1  | Marketing landing       | Public `/`                                    |
| A2  | Google sign-in          | OAuth only; no email/password signup          |
| A3  | Register route          | Redirects to login                            |
| A4  | Auth error page         | Failed OAuth                                  |
| A5  | Protected dashboard     | All app routes require session                |
| A6  | Per-user data isolation | Every read/write scoped to authenticated user |

---

## 2. Dashboard shell & overview

| ID  | Feature              | Notes                                                              |
| --- | -------------------- | ------------------------------------------------------------------ |
| S1  | Sidebar navigation   | Credit cards, SOA, Reminders, Receipts, Settings                   |
| S2  | Nav data prefetch    | Warm queries on hover/focus (optional UX)                          |
| S3  | Overview home        | Current-period “mission” panel                                     |
| S4  | Period mission stats | Statement paid %, minimum met per card, cards paid, attention list |
| S5  | Spend/summary cards  | Aggregated SOA stats on overview                                   |
| S6  | Light / dark theme   | Required on all screens                                            |

---

## 3. Credit cards

| ID  | Feature                             | Notes                                                                                                                                                 |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | List / create / edit / delete cards | Full CRUD                                                                                                                                             |
| C2  | Issuers                             | Kame Homes PH banks + digital banks (20). Dedicated SOA parsers remain Metrobank, RCBC, BPI, Unionbank; others use generic parse + AI / manual upload |
| C3  | Card identity                       | Last-4, label, optional PAN, contact line                                                                                                             |
| C4  | PDF password                        | Encrypted at rest; never returned in API                                                                                                              |
| C5  | Recurring due day                   | Required 1–31; backfill from SOA history when blank                                                                                                   |
| C6  | Gmail account per card              | Multi-inbox routing                                                                                                                                   |
| C7  | Gmail month offset                  | Search prior month when bank timing differs                                                                                                           |
| C8  | Custom SOA email subject            | Optional Gmail filter                                                                                                                                 |
| C9  | Card color                          | UI accent                                                                                                                                             |
| C10 | Active / inactive                   | Disable without delete                                                                                                                                |
| C11 | Per-card reminder tuning            | Window days, interval minutes, notes                                                                                                                  |

---

## 4. SOA periods & statements

| ID  | Feature                           | Notes                                  |
| --- | --------------------------------- | -------------------------------------- |
| O1  | SOA period list & CRUD            | Date range, notify/calendar settings   |
| O2  | Period detail — Overview          | Summary per period                     |
| O3  | Period detail — Transactions      | Cross-statement list                   |
| O4  | Period detail — Analytics         | Category breakdown + donut             |
| O5  | Analytics drill-down              | Category → transactions; Back / Escape |
| O6  | Per-card statement view           | One card in one period                 |
| O7  | One statement per card per period | Dedupe Gmail/manual duplicates         |
| O8  | View / stream PDFs                | Source SOA + period summary PDF        |
| O9  | Clear history / dedupe            | Maintenance operations                 |

---

## 5. SOA ingestion (Gmail & manual)

| ID  | Feature                           | Notes                                                                                                  |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| P1  | Manual Run SOA                    | User-triggered pipeline for a period                                                                   |
| P2  | Live run progress                 | Poll steps (Gmail, parse, notify)                                                                      |
| P3  | Scheduled SOA job                 | Daily `run_soa_pipeline` automation                                                                    |
| P4  | Multi-Gmail search                | Switch inbox per card                                                                                  |
| P5  | PDF download & unlock             | Per-card passwords                                                                                     |
| P6  | Text extraction + OCR fallback    | Tesseract when text quality poor                                                                       |
| P7  | Bank parsers                      | Dedicated: Metrobank, RCBC, BPI, Unionbank. Other registered issuers use generic patterns + AI extract |
| P8  | AI SOA extract                    | Gemini/Groq; user API keys                                                                             |
| P9  | Persist statements & transactions | Same model for Gmail and manual                                                                        |
| P10 | Summary PDF generation            | Paid column from due state                                                                             |
| P11 | Post-run notify                   | Telegram (e.g. PDF), Slack (text)                                                                      |
| P12 | Google Calendar events            | Due / paid (integration config)                                                                        |
| P13 | Manual SOA upload                 | PDF or image on a period                                                                               |
| P14 | Bank / month detection            | Confirm if month out of period range                                                                   |
| P15 | Upload card assignment            | Last-4 must match existing card                                                                        |

---

## 6. Due dates, reminders & mark paid

| ID  | Feature                    | Notes                                                 |
| --- | -------------------------- | ----------------------------------------------------- |
| D1  | Due entries from SOA       | Min/total due, due date                               |
| D2  | Expected due (missing SOA) | When window opens without parsed SOA                  |
| D3  | Expected entry rules       | Cannot mark paid; missing-SOA messaging               |
| D4  | Due day clamping           | 29–31 → last day of month                             |
| D5  | SOA replaces expected      | Same card/month upgraded to SOA-backed                |
| D6  | Reminders — Due dates UI   | Cards in window; mark paid/unpaid                     |
| D7  | Reminders — Schedule UI    | Automation jobs (with legacy `/automations` redirect) |
| D8  | Mark paid / unpaid (UI)    | With progress polling                                 |
| D9  | Partial payments           | Sum receipts/payments until threshold                 |
| D10 | Payment reminders job      | Daily `send_due_reminders`                            |
| D11 | Idempotent reminder sends  | `reminder_logs` fingerprints                          |
| D12 | Channels                   | Telegram, Slack                                       |
| D13 | Calendar side effects      | On mark paid/unpaid                                   |

---

## 7. Payment receipts

| ID  | Feature                      | Notes                                  |
| --- | ---------------------------- | -------------------------------------- |
| R1  | Receipts gallery             | Grouped by period / card               |
| R2  | Multi-file upload            | Batch with per-card progress           |
| R3  | AI batch analysis            | Group by detected card/bank            |
| R4  | AI validation                | Gemini + Groq fallback                 |
| R5  | Verdict UI                   | Checklist, badges                      |
| R6  | Revalidate with AI           | Re-run on existing upload              |
| R7  | Confirm mark paid            | Link to due entry after validation     |
| R8  | Partial / multi-receipt sums | Until min (or total if configured) met |
| R9  | Preview & delete             | Authenticated file stream              |

---

## 8. Automations & scheduling

| ID  | Feature                 | Notes                                        |
| --- | ----------------------- | -------------------------------------------- |
| J1  | Automation jobs CRUD    | Custom jobs + managed types                  |
| J2  | Toggle active / run now | With progress                                |
| J3  | Run history             | Last status per job                          |
| J4  | Default seed            | Payment reminders + SOA check on first visit |
| J5  | Managed job types       | `send_due_reminders`, `run_soa_pipeline`     |
| J6  | Schedule editor         | Daily time                                   |
| J7  | Cron dispatch           | HTTP cron, overdue catch-up                  |
| J8  | Bearer-protected cron   | `CRON_SECRET`                                |

---

## 9. Integrations & settings

| ID  | Feature                     | Notes                                       |
| --- | --------------------------- | ------------------------------------------- |
| I1  | Settings hub                | Integrations + categories + AI keys         |
| I2  | Google / Gmail              | Login + link additional accounts            |
| I3  | Disconnect / assign cards   | Per Google account                          |
| I4  | Token refresh for cron      | Persist refresh tokens (no browser for SOA) |
| I5  | Google Calendar             | Calendar ID + OAuth                         |
| I6  | Telegram                    | Bot token, chat ID, web link                |
| I7  | Slack                       | Incoming webhook                            |
| I8  | AI API keys                 | Gemini + Groq, encrypted, rotation, verify  |
| I9  | Transaction categories      | Built-in + user custom                      |
| I10 | Category rules              | Keywords + learned corrections              |
| I11 | Manual transaction category | Per-line picker                             |
| I12 | AI categorize               | Statement or whole period with progress     |

---

## 10. Telegram webhook

| ID  | Feature                   | Notes                      |
| --- | ------------------------- | -------------------------- |
| T1  | Webhook endpoint          | Secret token optional      |
| T2  | Chat → user mapping       | From integration           |
| T3  | Mark paid / unpaid text   | `last4 - month year - paid | unpaid` |
| T4  | Receipt photo / image doc | AI validate → mark paid    |
| T5  | Reply confirmations       | Bot messages with outcome  |

---

## 11. Notifications (cross-cutting)

| ID  | Feature               | Notes                     |
| --- | --------------------- | ------------------------- |
| N1  | Notification service  | Telegram + Slack outbound |
| N2  | SOA run notifications | After pipeline            |
| N3  | Due reminders         | Until paid in window      |
| N4  | Missing SOA messaging | Expected entries          |

---

## 12. Data & operations

| ID  | Feature                     | Notes                           |
| --- | --------------------------- | ------------------------------- |
| X1  | Encrypted secrets           | Cards, integrations, AI keys    |
| X2  | Document storage            | SOA PDFs, summaries, receipts   |
| X3  | Activity logs               | Table exists today; **no UI**   |
| X4  | CLI migration import        | Legacy `cards.json` + due state |
| X5  | Health / engine diagnostics | PDF/qpdf (dev ops)              |

---

## 13. Not in current MVP (do not assume parity)

These appear in older platform docs or roadmap but are **not** implemented in `apps/web`:

- Organizations, workspaces, RBAC beyond single user
- Properties, bookings, forms, subscriptions, public guest flows
- Email/password registration
- Generic reminders unrelated to credit-card dues
- Bills / subscriptions modules
- Activity log viewer

---

## 14. Suggested module boundaries (rebuild)

| Module                  | Includes |
| ----------------------- | -------- |
| Identity                | A1–A6    |
| Shell & overview        | S1–S6    |
| Credit cards            | C1–C11   |
| SOA UX                  | O1–O9    |
| SOA engine              | P1–P15   |
| Dues & payments         | D1–D13   |
| Receipts                | R1–R9    |
| Automations             | J1–J8    |
| Integrations & settings | I1–I12   |
| Telegram channel        | T1–T5    |
| Notifications           | N1–N4    |
| Platform ops            | X1–X5    |

---

## Maintenance

When the **current** app gains or loses a feature, update [application-inventory.md](../reference/application-inventory.md) first, then reflect the change here if it affects rebuild scope.
