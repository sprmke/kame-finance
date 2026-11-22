# Orca worktrees

Each Orca worktree runs its own Next server for `apps/web` on a sticky port.

## Ports

| Checkout             | Port                 |
| -------------------- | -------------------- |
| Primary checkout     | `3005`               |
| Other Orca worktrees | Sticky `3500`-`3599` |

```bash
bun run ui          # this worktree's web app, writes .local/vite-port
bun run ui:port     # print the port only
```

A collision bumps to the next free port and never kills another worktree's
listener.

## Orca setup

Repo root [`orca.yaml`](../orca.yaml):

- `scripts.setup` → `bun install` + copy `apps/web/.env.local` from `ORCA_ROOT_PATH`
- `defaultTabs` → opens a **UI** tab that runs `bun run ui`
- `scripts.archive` → stops only this worktree's Next server

In Orca: **Settings → Projects → kame-finance → Worktree hooks → Advanced →
Command source** → **orca.yaml only**.

## Local sign-in

The web app uses the hosted Supabase project in `apps/web/.env.local`. There is
no seeded local test user in this repo; use an existing account on that project.
Password sign-in works on any local port. OAuth and email callbacks must be
registered for the port you use.

## Verify

1. `bun run ui` → open the printed URL.
2. Sign in with an account from the configured Supabase project.
3. `/dashboard`, finance, and settings pages load for that account.
