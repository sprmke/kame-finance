# Greenfield rebuild — reference pack

**Purpose:** Single place for planning a **new** Kame Finance application (new stack or full rewrite). These docs describe **what to build**, **how it should look**, and **what to build it with** — not the current `apps/web` implementation.

**Current production baseline:** [`reference/application-inventory.md`](../reference/application-inventory.md) (keep in sync with the existing app until cutover).

## Contents

| Document | Description |
| -------- | ----------- |
| [Tech stack](./tech.md) | Locked Vue/Nuxt tech stack, platform map, port-vs-rewrite, phases |
| [Features inventory](./features-inventory.md) | Capability checklist — routes, modules, integrations, automations, edge cases |
| [Design system](./design-system.md) | AtomIQ-style “playful depth” tokens, components, rollout notes for the new UI |
| [SOA ingestion alternatives](./soa-ingestion-alternatives.md) | Research: replacing the Gmail API (CASA-gated) with a forwarding inbox; Open Finance PH outlook |

## Related docs (behavior & data)

Use these when turning features into specs for the rebuild:

| Topic | Doc |
| ----- | --- |
| User journeys | [product/user-flows.md](../product/user-flows.md) |
| Legacy CLI parity | [temp/pay-credit-cards-migration.md](../temp/pay-credit-cards-migration.md) |
| Schema (today) | [database/schema.md](../database/schema.md) |
| Tech choices (today — Next.js app) | [architecture/tech-stack.md](../architecture/tech-stack.md) |
| Tech choices (v2 rebuild) | [tech.md](./tech.md) |
| Current design (amber SaaS) | [product/design-system.md](../product/design-system.md) |

## How to use this folder

1. **Stack** — Follow [tech.md](./tech.md). Do not copy [architecture/tech-stack.md](../architecture/tech-stack.md) into v2; that file is the live Next.js app.
2. **Scope** — Treat [features-inventory.md](./features-inventory.md) as the product backlog for parity (add/remove items explicitly for v2).
3. **UX** — Implement [design-system.md](./design-system.md) from day one on the new app; do not assume the current DM Sans / soft-shadow UI.
4. **Traceability** — When a rebuild feature ships, note it in your new repo’s inventory doc; optionally tick items in the inventory here.

Exploratory notes that are **only** for the legacy app stay in [`temp/`](../temp/README.md).
