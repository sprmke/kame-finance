# Rebuild plan — tech stack & approach

**Status:** Locked for the greenfield rebuild (not the current `apps/web` stack).  
**Audience:** Anyone implementing v2.  
**Product scope:** [features-inventory.md](./features-inventory.md)  
**Visual system:** [design-system.md](./design-system.md)

This document is the **how to rebuild** companion to those two files. It records the stack chosen in the 2026 Vue research conversation: Nuxt-native core, plus auth, files, email, and jobs. It is **not** a port of today’s Next.js / tRPC / Supabase Auth stack.

**Current production stack** stays in [architecture/tech-stack.md](../architecture/tech-stack.md) until cutover.

---

## 1. Locked decisions

| Decision        | Choice                                   | Why                                                                                 |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| UI runtime      | Vue 3.5 (`<script setup>`)               | Stable. Vue 3.6 + Vapor is still RC — do not bet v2 on it                           |
| App framework   | Nuxt 4                                   | Full-stack Vue: routing, SSR, middleware, Nitro server                              |
| Server          | Nitro (inside Nuxt)                      | API routes, webhooks, cron targets, secrets. No separate Node API                   |
| UI kit          | Nuxt UI v4                               | Official Vue kit (Reka UI + Tailwind v4), forms via Standard Schema                 |
| Styling         | Tailwind CSS v4                          | What Nuxt UI uses; custom screens still use utilities                               |
| Client state    | Pinia                                    | UI-only: sidebar, filters, wizard step, theme                                       |
| Page data       | Nuxt `useFetch` / `useAsyncData`         | SSR lists and detail pages                                                          |
| Utilities       | VueUse                                   | Composables instead of one-off helpers                                              |
| Validation      | Zod 4                                    | One schema language for forms, API bodies, env                                      |
| Auth            | Better Auth                              | Sessions in our Postgres; Google OAuth (inventory A2)                               |
| API style       | Typed Nitro `server/api`                 | Nuxt already types `$fetch` / `useFetch`                                            |
| ORM             | Drizzle                                  | TypeScript-first SQL; port existing schema                                          |
| Database        | PostgreSQL                               | Source of truth (any managed host; Neon is the default pick)                        |
| Files           | Cloudflare R2                            | Private SOA PDFs, summaries, receipts                                               |
| Email           | Resend                                   | Transactional mail (password/reset later; alerts if email is a channel)             |
| Jobs            | Nitro tasks                              | SOA pipeline + due reminders. Trigger.dev only if retries/queues outgrow this       |
| Tests           | Vitest + `@nuxt/test-utils` + Playwright | Unit/component + real browser flows                                                 |
| Package manager | pnpm (Bun optional)                      | Nuxt-native default; Bun is speed, not capability                                   |
| Design          | AtomIQ “playful depth”                   | [design-system.md](./design-system.md) from day one — not the current amber SaaS UI |

---

## 2. Final tech stack

| Tech                                 | Purpose in v2                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Vue 3.5**                          | UI runtime. Pages, forms, dashboard widgets.                                                                                     |
| **Nuxt 4**                           | App shell: file routing, layouts, middleware, SSR, env, deploy. Replaces Next.js.                                                |
| **TypeScript (strict)**              | Types from UI through API and DB.                                                                                                |
| **Nitro**                            | Server inside Nuxt. HTTP surface, Telegram webhook, cron dispatch, server-only secrets. Replaces Next.js route handlers.         |
| **Nuxt UI v4**                       | Buttons, tables, dialogs, forms, dashboard chrome. Replaces shadcn/ui. Theme tokens from the rebuild design system.              |
| **Tailwind CSS v4**                  | Layout, spacing, light/dark.                                                                                                     |
| **Pinia**                            | Client-only UI state. Not for server records.                                                                                    |
| **VueUse**                           | `useClipboard`, `useDebounce`, `useColorMode`, and similar.                                                                      |
| **Nuxt `useFetch` / `useAsyncData`** | Load page data with SSR. Replaces TanStack Query for most screens.                                                               |
| **Better Auth**                      | Sign-in, sessions, Google OAuth (Gmail/Calendar scopes), optional 2FA later. Users live in our Postgres. Replaces Supabase Auth. |
| **Zod 4**                            | Validate forms (Nuxt UI `UForm`), API bodies, and env.                                                                           |
| **Drizzle ORM**                      | Cards, dues, reminders, jobs, integrations. Same role as today.                                                                  |
| **PostgreSQL**                       | Source of truth. Host: Neon (or any managed Postgres).                                                                           |
| **Cloudflare R2**                    | Object storage for SOA PDFs, period summaries, receipts. Private objects; signed URLs or authenticated streams.                  |
| **Resend**                           | Transactional email.                                                                                                             |
| **Nitro tasks**                      | Scheduled `run_soa_pipeline` and `send_due_reminders` (inventory J5). Bearer-protected HTTP catch-up remains (J8).               |
| **Vitest + `@nuxt/test-utils`**      | Parsers, services, Vue components.                                                                                               |
| **Playwright**                       | Login, mark paid, dashboard flows.                                                                                               |

### Layer diagram

```
Browser
  Vue 3.5 + Nuxt UI v4 + Tailwind v4   →  screens
  Pinia + VueUse                       →  UI state and small helpers
  useFetch / useAsyncData              →  read/write app data

Nuxt 4 / Nitro
  Better Auth                          →  who the user is
  server/api + webhooks                →  HTTP surface
  Nitro tasks                          →  cron / SOA / reminders
  Zod 4                                →  validate every input

Data
  Drizzle → PostgreSQL                 →  records
  Cloudflare R2                        →  PDFs / receipts
  Resend                               →  email
```

**Rule:** page data in `useFetch`; sidebar/filters in Pinia; form values in Nuxt UI `UForm` + Zod. Do not put server records in Pinia.

---

## 3. Do not start with

These were considered and rejected as **day-one** defaults. Add only when the need is real.

| Skip                                | Why                                                                                                 |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| **oRPC / tRPC**                     | Nitro already types `/api` for the Vue app. Add oRPC when a mobile client or public OpenAPI exists. |
| **Pinia Colada / TanStack Query**   | `useFetch` is enough until many screens share cached, mutated lists.                                |
| **Vue 3.6 Vapor**                   | Still RC. Stay on Vue 3.5.                                                                          |
| **Prisma**                          | Drizzle is enough and stays close to SQL.                                                           |
| **Separate Node API**               | Nitro is the API. Splitting it is extra ops.                                                        |
| **Vite SPA + Vue Router only**      | This product needs SSR sessions, webhooks, and scheduled jobs.                                      |
| **Supabase Auth**                   | Better Auth owns sessions in our DB.                                                                |
| **Supabase Storage**                | Recode files on R2. Do not keep Supabase only for buckets if Postgres also leaves Supabase.         |
| **VeeValidate**                     | Nuxt UI forms + Zod cover validation.                                                               |
| **shadcn-vue / PrimeVue / Vuetify** | Nuxt UI v4 is the kit.                                                                              |

Keep a **storage service abstraction** (same idea as today’s `storage.service.ts`) so R2 is not called from UI code.

---

## 4. Target layout

Nuxt 4 app directory. Pages compose features; features do not import each other.

```
apps/web/                         # Nuxt 4 (or a new repo with the same shape)
  app/
    pages/                        # routes only
    layouts/
    middleware/                   # auth
    components/                   # Nuxt UI wrappers + domain UI
    composables/
    emails/                       # Vue email templates (optional until email is live)
  server/
    api/
      auth/[...all].ts            # Better Auth
      webhooks/telegram.ts
      cron/                       # bearer-protected dispatch (J8)
    db/                           # Drizzle schema + client
    auth.ts
    services/                     # domain logic (port from current services)
    tasks/                        # Nitro scheduled tasks
packages/                         # optional monorepo split later
  types/
  database/                       # if schema is extracted
```

Module boundaries stay as in [features-inventory.md §14](./features-inventory.md):

| Module                  | Inventory IDs |
| ----------------------- | ------------- |
| Identity                | A1–A6         |
| Shell & overview        | S1–S6         |
| Credit cards            | C1–C11        |
| SOA UX                  | O1–O9         |
| SOA engine              | P1–P15        |
| Dues & payments         | D1–D13        |
| Receipts                | R1–R9         |
| Automations             | J1–J8         |
| Integrations & settings | I1–I12        |
| Telegram channel        | T1–T5         |
| Notifications           | N1–N4         |
| Platform ops            | X1–X5         |

Unidirectional flow: `pages → feature UI → composables → Nitro / services`. No cross-feature imports; compose on pages.

---

## 5. Port vs rewrite

The expensive part of this product is **not** the UI framework.

| Rewrite (new Vue/Nuxt shell)            | Port (keep TypeScript behavior)                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Pages, layouts, sidebar                 | Bank parsers (Metrobank, RCBC, BPI, Unionbank; other PH issuers use generic + AI) |
| Nuxt UI screens + design tokens         | SOA pipeline (Gmail search, PDF unlock, OCR fallback, persist)                    |
| Better Auth + Google OAuth              | Due-entry upsert, expected-due (missing SOA), due-day clamping                    |
| Nitro API + webhook routes              | Mark paid / unpaid, partial payments, reminder fingerprints                       |
| R2 storage adapter                      | Receipt AI validation (Gemini/Groq)                                               |
| Nitro tasks instead of Next cron routes | Notification routing (Telegram/Slack), calendar side effects                      |

**Do not reimplement finance rules from scratch.** Port `server/services/` and `lib/soa/` behavior unless the inventory explicitly drops a feature. Legacy CLI notes: [temp/pay-credit-cards-migration.md](../temp/pay-credit-cards-migration.md).

---

## 6. Current → v2 platform map

| Concern      | Today (`apps/web`)                 | Rebuild                                             |
| ------------ | ---------------------------------- | --------------------------------------------------- |
| App          | Next.js 16 App Router              | Nuxt 4                                              |
| UI           | React 19 + shadcn/ui               | Vue 3.5 + Nuxt UI v4                                |
| API          | tRPC                               | Nitro `server/api`                                  |
| Auth         | Supabase Auth / Google OAuth       | Better Auth + Google OAuth                          |
| DB           | Supabase Postgres + Drizzle        | PostgreSQL + Drizzle (Neon or any managed Postgres) |
| Files        | Supabase Storage + `/tmp` fallback | Cloudflare R2 + local disk fallback in dev          |
| Jobs         | Supabase Cron → Next HTTP          | Nitro tasks + bearer HTTP catch-up                  |
| Email        | Resend (if used)                   | Resend                                              |
| Server state | TanStack Query                     | `useFetch` / `useAsyncData`                         |
| Client state | Zustand                            | Pinia                                               |
| Forms        | React Hook Form + Zod              | Nuxt UI `UForm` + Zod 4                             |
| Tests        | Vitest + Playwright                | Vitest + `@nuxt/test-utils` + Playwright            |

Data that **must** stay user-scoped and encrypted: card PDF passwords, integration tokens, AI keys (inventory X1). Google refresh tokens must still persist so cron can run SOA without a browser (I4).

### Storage rules (R2)

Same contract as today’s `storage.service.ts`:

- Server-only upload/download
- User-prefixed keys: `{folder}/{userId}/{timestamp}-{filename}`
- MIME sniffed from bytes; do not trust `Content-Type`
- Private objects only for SOA PDFs, summaries, receipts
- DB stores a storage key (e.g. `r2:...`); never a world-readable URL
- Local `/tmp` fallback when R2 env is unset (dev)

---

## 7. Constraints that carry over

These are product rules, not stack rules. They still apply.

1. **User scoping** — every query filtered by authenticated `userId` (A6). No org/RBAC in v2 unless the inventory is updated (see §13 of the inventory).
2. **Services own logic** — Nitro handlers stay thin.
3. **Google sign-in only** — no email/password signup (A2, A3).
4. **Minimal UI copy** — labels, badges, data; no unsolicited helper paragraphs.
5. **Light and dark** — required (S6 + design system).
6. **Design system from day one** — Nunito + Baloo 2, hard offset shadows, pressable slabs. Do not recreate DM Sans / soft-shadow amber SaaS.
7. **Currency / locale** — PHP, Asia/Manila.
8. **Not in MVP** — organizations, bills module, generic non-CC reminders, activity log UI. Do not build them “while we are here.”

---

## 8. Rebuild phases

Use inventory IDs as acceptance criteria. A phase is done when those IDs work in the new app, not when the old app is patched.

### Phase 0 — Foundation

- Nuxt 4 + Vue 3.5 + TypeScript + pnpm
- Nuxt UI v4 + Tailwind v4 + design tokens from [design-system.md](./design-system.md)
- Pinia, VueUse, Zod 4
- Drizzle + PostgreSQL
- Better Auth + Google OAuth (A2, A5)
- R2 storage service + local fallback (X2)
- Vitest / Playwright smoke (login)

**Exit:** signed-in user, themed shell, empty DB, file upload round-trip.

### Phase 1 — Identity & shell

- Landing (A1), auth error (A4), register → login (A3)
- Sidebar + overview placeholders (S1, S3, S6)
- Per-user isolation wired in every query (A6)

### Phase 2 — Credit cards

- C1–C11 (CRUD, issuers, encrypted PDF password, due day, Gmail account, color, reminder tuning)

### Phase 3 — SOA engine + SOA UX

- Port parsers, Gmail fetch, unlock, OCR, persist (P1–P15)
- Periods, statements, transactions, analytics, PDF stream (O1–O9)
- Summary PDF + post-run Telegram/Slack/Calendar (P10–P12)

### Phase 4 — Dues, reminders, mark paid

- D1–D13 including expected-due, clamping, partial payments, idempotent reminder logs
- Reminders Due dates + Schedule UI (D6, D7)

### Phase 5 — Receipts

- R1–R9 (gallery, multi-upload, AI validate, confirm mark paid, authenticated preview)

### Phase 6 — Automations & cron

- J1–J8: job CRUD, seed managed jobs, Nitro tasks, `CRON_SECRET` dispatch

### Phase 7 — Integrations & Telegram

- I1–I12 (Gmail multi-account, Calendar, Telegram, Slack, AI keys, categories)
- T1–T5 webhook (text mark paid + receipt photo)
- N1–N4 notification service

### Phase 8 — Cutover

- CLI/legacy import if still needed (X4)
- Health/engine diagnostics if still useful (X5)
- Data migration from current Postgres + Supabase Storage → new Postgres + R2
- Freeze feature work on `apps/web`; production traffic on v2

Do not skip Phase 0–2. SOA without cards and auth is not a rebuild.

---

## 9. Suggested Nuxt modules (Phase 0)

Turn on immediately:

- `@nuxt/ui`
- `@pinia/nuxt`
- `@vueuse/nuxt`
- `@nuxt/fonts` (Nunito, Baloo 2)
- `@nuxt/image`
- `@nuxt/test-utils`

Add later only if needed: Pinia Colada, oRPC, Trigger.dev, Nuxt Email.

---

## 10. How to use this pack

| Step                       | Doc                                                                         |
| -------------------------- | --------------------------------------------------------------------------- |
| What must exist            | [features-inventory.md](./features-inventory.md)                            |
| How it should look         | [design-system.md](./design-system.md)                                      |
| What to build it with      | **This doc** ([tech.md](./tech.md))                                         |
| Journeys / edge cases      | [product/user-flows.md](../product/user-flows.md)                           |
| Tables to port             | [database/schema.md](../database/schema.md)                                 |
| Legacy SOA behavior        | [temp/pay-credit-cards-migration.md](../temp/pay-credit-cards-migration.md) |
| What production is _today_ | [reference/application-inventory.md](../reference/application-inventory.md) |

When v2 ships a module, tick the inventory IDs here and keep a **new** application inventory in the v2 repo. Do not overwrite [architecture/tech-stack.md](../architecture/tech-stack.md) until cutover — that file describes the live Next.js app.

---

## 11. One-line stack

**Vue 3.5 + Nuxt 4 + Nuxt UI v4 + Tailwind v4 + Pinia + VueUse + Better Auth + Zod 4 + Nitro + Drizzle + PostgreSQL + Cloudflare R2 + Resend + Vitest / Playwright.**
