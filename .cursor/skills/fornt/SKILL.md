---
name: fornt
description: Implements Kame Finance dashboard frontend for credit card billing dates (statement day, due day), missing-SOA prompts after statement date, and reminders UX. Use when editing credit card forms, SOA period cards, due/reminder UI, or billing-cycle display in apps/web.
---

# Kame Finance frontend — billing dates & missing SOA

## Scope

Credit cards store **statement day** and **due day** (1–31). Business rules live in `@/lib/credit-cards/billing-cycle.ts` and `@/server/services/expected-due-entry.service.ts` — UI must reflect them, not reimplement.

## Card form (Credit cards)

- Show **Statement date** and **Due date** as paired day-of-month inputs (`type="number"`, min 1, max 31), side-by-side from `sm` breakpoint.
- Both required on create/update; validate before tRPC mutate.
- Persist in add-card draft (`statementDay` + `dueDay`).
- List/table: compact `Stmt N · Due M` (omit missing parts gracefully).

## When to show “SOA missing” nudge

Only when **all** are true:

1. Statement row is unavailable / no parsed SOA for that billing month.
2. Card has a due day (expected rows depend on it).
3. Today (local YMD) is **on or after** the expected statement date for that statement month — use `isOnOrPastStatementDateForPeriod(asOf, statementYear, statementMonth, { statementDay })`, not due date.

Do **not** show missing-SOA messaging before the statement date.

## Reminders UI

- `source === "expected"` means SOA missing; copy can mention checking email / manual upload once statement date has passed (server sets `statementPeriodEnded` on notification bodies when applicable).
- Do not add unsolicited helper paragraphs (see project `21-minimal-ui-copy`).

## Files to touch together

| Change | Files |
|--------|--------|
| Schema/API | `credit-cards` schema, router, `credit-card.service.ts` |
| Logic | `billing-cycle.ts`, `expected-due-entry.service.ts`, `calendar-sync-rows.ts` |
| UI | `CreditCardsPage.tsx`, `SoaStatementCard.tsx`, `OverviewPage.tsx`, reminders cards |
| Docs | `docs/database/schema.md`, `docs/reference/application-inventory.md`, `docs/reference/feature-specifications.md` |

## Stack

Next.js App Router, shadcn/ui, tRPC, semantic tokens (`bg-background`, `text-foreground`, `text-warning` for missing-SOA alerts).
