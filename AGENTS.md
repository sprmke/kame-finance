# Codex instructions — Kame Finance

This is the business automation platform in README.md: Bun workspace, Next.js/React frontend, tRPC services, Drizzle and Supabase. Use the actual versions in package.json and workspace manifests; older rule summaries may lag them. Before feature work read docs/README.md, docs/reference/application-inventory.md and relevant feature specifications. Read .cursor/rules/00-project-context.mdc for module boundaries and documentation requirements. Keep credit-card behavior within that module and shared integrations/services in platform code. Scope queries to the authenticated user; protect financial documents and per-user integration credentials. Do not send reminders, emails or messages as a side effect of tooling setup.

Commands: bun run dev; bun run type-check; bun run lint; bun run test; bun run ci:quality. Consult package.json for exact supported scripts. Preserve existing work. Update the matching architecture, feature and application-inventory docs when behavior changes.


## Codex compatibility

Before working, read [.codex/README.md](.codex/README.md). It lists this project’s always-on Cursor rules and scoped rules to read for the affected files. Codex skills are discovered in `.agents/skills`; specialist definitions are in `.codex/agents`. Existing Cursor/Claude model aliases are not Codex model settings. Use available Codex tools and preserve project-specific architecture and authorization rules.

Superpowers workflows and subagent delegation remain opt-in; do not start them automatically. Run `python3 .codex/sync.py` after changing project skills, commands or agent definitions. Review/trust hooks through Codex before relying on their enforcement. This repository setup is independent of the hourly job-search task in the personal chat.

<!-- global-agent-skills -->
## Global agent skills

This machine has 159 shared skills in `~/.agents/skill-library` (Claude Code, Cursor,
Codex and OpenCode all read them). Only five behaviour skills are always visible.
For anything else, open `~/.agents/skill-library/agent-skills-index/SKILL.md`, find the
skill that fits, then read `~/.agents/skill-library/<skill>/SKILL.md`.
Manage with `~/.agents/bin/agent-stack.sh`. Repo skills and rules always win.

