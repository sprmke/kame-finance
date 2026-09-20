# Project Structure

See also `.cursor/rules/02-architecture.mdc` for the canonical layout.

## Monorepo

```
kame-finance/
├── apps/web/                 # Next.js dashboard (local port 3005)
├── packages/                 # Shared packages (database, types, ui, emails, …)
├── docs/
├── scripts/                  # Local setup, port helpers, CLI migration
├── .vscode/                  # Run tasks, launch configs, editor settings
└── .cursor/                  # Rules, skills, hooks, agents
```

## App (`apps/web/src`)

| Path                  | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `app/`                | Routes only                                  |
| `features/dashboard/` | Feature modules (credit-cards, reminders, …) |
| `features/shared/`    | Shared auth forms/hooks                      |
| `components/`         | Shared UI (shadcn)                           |
| `lib/`                | db, api client, auth, env                    |
| `server/`             | tRPC, services, jobs                         |

## Credit cards module

`features/dashboard/credit-cards/` + `server/services/soa*.ts` + routers `credit-cards`, `soa`.

## Legacy CLI

`automated-tasks/pay-credit-cards/` — port into services; do not extend CLI long-term.
