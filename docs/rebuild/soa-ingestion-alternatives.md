# SOA ingestion — alternatives to the Gmail API

**Status:** Research / decision doc for the v2 rebuild
**Date:** 2026-09-22
**Question:** Can we get credit-card Statements of Account without the Gmail API, which requires an annual paid third-party security assessment (CASA) to ship in production?

---

## TL;DR — recommendation

**Adopt a forwarding inbox as the primary ingestion path; keep manual upload as the fallback; drop Gmail OAuth from the default product.**

Each user gets a private, unguessable address (`soa-<token>@inbox.kame.app`). They either:

1. set a Gmail filter that auto-forwards bank SOA mail to it (30 seconds, one-time), or
2. change the e-statement address at the bank itself to that address (cleanest — no Gmail involvement at all).

Inbound mail hits a webhook, the PDF is extracted, and it feeds **the exact pipeline `soa-manual-upload.service.ts` already runs today**. No Google verification, no CASA, no annual fee, no restricted scope, and it works for users on Outlook, Yahoo, and iCloud — which the Gmail integration never did.

Keep Google OAuth only for **Calendar** (`calendar.events` is a *sensitive*, not *restricted*, scope — it needs brand verification but no CASA).

---

## 1. Why the current approach is a problem

[`apps/web/src/lib/auth/google-scopes.ts`](../../apps/web/src/lib/auth/google-scopes.ts) requests:

```
https://www.googleapis.com/auth/gmail.readonly   ← RESTRICTED
https://www.googleapis.com/auth/calendar.events  ← sensitive only
```

`gmail.readonly` is on Google's **restricted scope** list. The consequences for a public production app:

| Constraint | Detail |
| --- | --- |
| Unverified cap | 100 test users, hard ceiling. Consent screen shows an "unsafe app" interstitial. |
| Security assessment | Mandatory, annual, by a Google-approved third-party assessor. |
| Self-scan | **No longer an option** for Tier 2 — an independent assessor must be paid. |
| Cost | ~$540–$1,800/yr via a budget assessor; commonly quoted $500–$4,500. Some assessors push `gmail.readonly` apps to a full penetration test (weeks, thousands of dollars). |
| Recurring | Due every year, forever, or access is revoked. |
| Other burdens | Annual re-verification, demo video, privacy policy review, in-transit/at-rest encryption evidence, incident response policy, data-retention proof. |

There is also a **product** cost that is easy to miss: the Gmail path only ever works for Gmail users. Anyone on Outlook/Yahoo/iCloud is already relegated to manual upload.

> **Conclusion:** a recurring four-figure annual fee plus an audit cycle is disproportionate for a personal-finance app whose entire need is *"read four PDFs a month."*

---

## 2. Options evaluated

### Option A — Forwarding inbox (**recommended**)

A per-user alias on a domain we own. Two ways the user can wire it up:

**A1. Gmail filter → forward** (works with any provider)
`Settings → Filters → Create filter` on `from:(bpi.com.ph OR metrobank.com.ph OR …) has:attachment` → *Forward to* the alias. Attachments are preserved on auto-forward.

*Caveat:* Gmail requires the destination address to be **verified** once — it mails a confirmation code to the alias. Our inbound handler must detect that mail and surface the code/link in the UI for the user to confirm. This is a known, solvable onboarding step and the single most common reason a forwarding filter silently does nothing.

**A2. Change the e-statement address at the bank** (cleanest)
The user points the bank at the alias directly, so the SOA never touches their personal inbox. Confirmed paths:

| Bank | How |
| --- | --- |
| BPI | eStatement enrollment via branch or 24-hour contact centre (+632) 889-10000 |
| UnionBank | Update contact details — (+632) 8841-8600 or customer.service@unionbankph.com |
| RCBC | Branch visit to update e-mail on record |
| Metrobank | Contact centre — no public self-service path found |

A2 has the best privacy story (we never see non-bank mail) but the worst activation friction (phone/branch). **Offer both; default to A1.**

**Transport choices:**

| Provider | Cost | Notes |
| --- | --- | --- |
| Cloudflare Email Routing + Workers | **Free** | 25MB/message cap; base64 overhead makes the practical attachment limit notably lower. Parse with `postal-mime`. |
| Mailgun Inbound Routes | ~$0.002/inbound msg (~$20/mo @ 10k) | Base64 attachments in the webhook payload. |
| Postmark Inbound | from $15/mo (Pro tier) | Parsed JSON webhook, full body, headers, spam score, base64 attachments. |

At Kame's volume (a handful of SOAs per user per month) **Cloudflare is free and sufficient**; Postmark is the paid fallback if deliverability or parsing ergonomics disappoint.

**Verdict:** ✅ No CASA. No annual fee. Provider-agnostic. Reuses the existing pipeline.

---

### Option B — Open Finance PH / account aggregation APIs

BSP's Open Finance Framework (Circular 1122) is real and advancing — House Bill 9149 was reported out on 2026-05-12 and would compel all BSP-supervised institutions to expose consumer-permissioned data APIs.

**But, today:**

- Pilot scope is **payments and savings accounts** — *not* credit-card statements.
- Aggregators (e.g. Brankas) are still bringing BPI, RCBC and Metrobank online for basic banking; statement-level credit-card data is not a shipping product.
- Access requires BSP accreditation and/or a commercial aggregator contract — enterprise pricing, KYB, compliance review. Strictly worse gatekeeping than CASA for a solo project.

**Verdict:** ⏳ Correct long-term destination, not viable in this rebuild. Re-evaluate in 12–18 months. Design the ingestion layer so a future `OpenFinanceSource` can slot in beside `EmailSource`.

---

### Option C — Bank screen-scraping / headless login

Automating online-banking logins to pull PDFs.

**Verdict:** ❌ Reject. Violates every PH bank's ToS, requires storing full banking credentials, breaks on every UI change, and trips bot detection and MFA. The liability is unacceptable for a personal-finance product.

---

### Option D — IMAP with an app password

User generates a Google App Password; we connect over IMAP, sidestepping OAuth.

**Verdict:** ❌ Reject. Requires the user to enable 2FA and hand over a credential granting **full mailbox access** — strictly worse for the user than `gmail.readonly`, and worse for us (we now custody a password-equivalent secret). Google is also steadily restricting app passwords.

---

### Option E — Narrower Gmail scopes

`gmail.metadata` is sensitive rather than restricted — but it exposes headers only, **no bodies and no attachments**. Useless for pulling a PDF. `gmail.addons.*` scopes only run inside a Workspace Add-on UI context, not a background pipeline.

**Verdict:** ❌ No non-restricted Gmail scope can deliver an attachment.

---

### Option F — Manual upload only

Already built and working: [`soa-manual-upload.service.ts`](../../apps/web/src/server/services/soa-manual-upload.service.ts).

**Verdict:** ✅ Keep as the guaranteed-correct fallback, but too much monthly friction to be the only path.

---

## 3. Comparison

| Option | Cost/yr | Verification burden | Non-Gmail users | Friction | Verdict |
| --- | --- | --- | --- | --- | --- |
| **A. Forwarding inbox** | **$0** | **None** | ✅ | One-time setup | ✅ **Adopt** |
| B. Open Finance | Enterprise | BSP accreditation | ✅ | Contracts | ⏳ Later |
| C. Scraping | $0 | — | ✅ | — | ❌ ToS/liability |
| D. IMAP app password | $0 | None | Partial | High + unsafe | ❌ |
| E. Narrow Gmail scope | $0 | Low | ❌ | — | ❌ Can't fetch PDFs |
| F. Manual only | $0 | None | ✅ | Every month | ✅ Fallback |
| *Status quo: Gmail API* | *$540–4,500* | *CASA, annual* | *❌* | *Low* | *Drop* |

---

## 4. Proposed architecture

Model ingestion as pluggable **sources** feeding one shared processing core. The core already exists — it is what manual upload runs — so this is mostly a refactor of the *entry points*, not the parser.

```
┌──────────────────────┐
│ Forwarding inbox     │ ─┐
│ soa-<token>@…        │  │
├──────────────────────┤  │   ┌──────────────────────────────┐
│ Manual upload (UI)   │ ─┼──▶│ SOA processing core          │
├──────────────────────┤  │   │ sniff mime → unlock PDF →    │
│ Open Finance (future)│ ─┘   │ extract text/OCR → AI parse →│
└──────────────────────┘      │ match card → persist         │
                              └──────────────────────────────┘
```

**Reusable as-is:** `pdf-unlock.service.ts`, `soa-ai-extract.service.ts`, `parse-soa.ts`, `detect-issuer.ts`, `card-last4-from-text.ts`, `soa-persist.service.ts`, `statement-identity.ts`, `manual-upload-align.ts`, the OCR path, and the whole `soa-period` / dedupe layer.

**New work:**

1. `inbound_addresses` table — `userId`, `token`, `verifiedAt`, `createdAt`.
2. Inbound webhook route — verify provider signature, resolve token → user, extract PDF parts.
3. **Sender allowlist** — only accept mail whose envelope sender matches known bank domains; drop everything else unparsed. Prevents the alias becoming an attack surface.
4. Gmail forwarding-confirmation detector — surface the code in the UI so the user can complete verification.
5. Onboarding UI — show the alias, copy button, per-provider filter instructions, live "waiting for first statement…" state.
6. Encrypted-PDF handling — banks password-protect SOAs; the existing per-card credential flow already covers this, just needs wiring to the inbound path.

---

## 5. Risks

| Risk | Mitigation |
| --- | --- |
| Gmail forwarding verification confuses users | Detect the confirmation mail, show the code inline, step-by-step screenshots |
| User forgets to set the filter | "No statements received yet" nudge + manual upload always visible |
| Alias leaks / receives spam | Unguessable token, strict bank-domain allowlist, rotatable alias |
| Attachment exceeds provider cap | SOAs are small (<1MB); alert and fall back to manual upload if ever exceeded |
| Forwarded mail loses original headers | Match on sender + subject + PDF content, which the parser already does |
| Bank changes SOA format | Pre-existing risk, unchanged by this decision |

---

## 6. Recommended path

1. **Phase 1** — Build the forwarding inbox on Cloudflare Email Routing (free). Refactor the manual-upload core into a shared, source-agnostic processing service.
2. **Phase 2** — Onboarding UX: alias display, filter instructions per mail provider, forwarding-confirmation handling, bank e-statement redirection guide (option A2).
3. **Phase 3** — Remove `gmail.readonly` from the OAuth scope list. Keep `calendar.events` (sensitive-only → brand verification, no CASA). Migrate existing Gmail users onto an alias before cutover.
4. **Phase 4** — Revisit Open Finance PH once HB 9149 passes and credit-card statement data appears in aggregator coverage.

---

## Sources

- [Restricted Scopes — Google Cloud Console Help](https://support.google.com/cloud/answer/13464325)
- [Gmail API scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google CASA — Cloud Application Security Assessment](https://deepstrike.io/blog/google-casa-security-assessment-2025)
- [What Google's CASA certification really costs](https://bright-softwares.com/blog/en/google-workspace/the-50000-gmail-add-on-myth-what-google-s-casa-certification-really-costs)
- [BSP Open Finance PH](https://www.bsp.gov.ph/Pages/InclusiveFinance/Open%20Finance/Open%20Finance.aspx)
- [BSP Open Finance Pilot FAQ (Annex H)](https://www.bsp.gov.ph/Pages/InclusiveFinance/Open%20Finance/Annex%20H.pdf)
- [Open Banking Tracker — Philippines](https://www.openbankingtracker.com/regulation/philippines-open-finance)
- [Brankas — bank coverage](https://www.brankas.com/coverage)
- [Cloudflare Email Routing — Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [postal-mime on Cloudflare Workers](https://postal-mime.postalsys.com/docs/guides/cloudflare-workers/)
- [Mailgun inbound email routing](https://www.mailgun.com/features/inbound-email-routing/)
- [Automatically forward Gmail messages — Gmail Help](https://support.google.com/mail/answer/10957)
- [Ways to check credit card balance — top PH banks](https://www.moneymax.ph/credit-card/articles/credit-card-balance)
