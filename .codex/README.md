# Codex project configuration

Root AGENTS.md is the entry point. Existing domain guidance remains in its original files. This file documents the compatibility layer, not application behavior.

## Rules

Codex does not automatically activate Cursor .mdc rules. Before work, read the always-on rules listed below. Read scoped rules when the task or files match their scope. Cursor model aliases and tool names are not Codex settings; use the current Codex model and available tools. Superpowers and delegation remain opt-in.

| Source rule | When to read |
|---|---|
| `.cursor/rules/00-project-context.mdc` | Always |
| `.cursor/rules/01-tech-stack.mdc` | Always |
| `.cursor/rules/02-architecture.mdc` | **/* |
| `.cursor/rules/03-database.mdc` | - "**/schema/**/*.ts |
| `.cursor/rules/04-api.mdc` | - "**/routers/**/*.ts |
| `.cursor/rules/05-components.mdc` | - "**/*.tsx |
| `.cursor/rules/06-state-management.mdc` | - '**/store/**/*.ts |
| `.cursor/rules/07-forms.mdc` | - '**/*Form*.tsx |
| `.cursor/rules/08-security.mdc` | - "**/services/**/*.ts |
| `.cursor/rules/09-testing.mdc` | - "**/*.test.ts |
| `.cursor/rules/10-performance.mdc` | - "**/*.tsx |
| `.cursor/rules/11-workflow.mdc` | **/* |
| `.cursor/rules/12-thinking-framework.mdc` | Always |
| `.cursor/rules/13-ui-ux-design.mdc` | - "**/*.tsx |
| `.cursor/rules/14-dashboard-ui.mdc` | - '**/features/dashboard/** |
| `.cursor/rules/15-accessibility.mdc` | **/*.tsx" "**/components/**/*" "**/app/**/*.tsx |
| `.cursor/rules/16-docs-sync.mdc` | Always |
| `.cursor/rules/17-mobile-readiness.mdc` | **/* |
| `.cursor/rules/17-supabase-platform.mdc` | - '**/env*.ts |
| `.cursor/rules/18-credit-cards-module.mdc` | - '**/credit-cards/** |
| `.cursor/rules/19-automations-integrations.mdc` | - '**/automations/** |
| `.cursor/rules/20-legacy-cli-reference.mdc` | - '**/automated-tasks/pay-credit-cards/** |
| `.cursor/rules/21-minimal-ui-copy.mdc` | Always |

## Skills and commands

Codex discovers the existing project skills through relative links under .agents/skills. Original folders and resources stay together so changes remain shared with Cursor/Claude. Do not move or copy only SKILL.md. Run `python3 .codex/sync.py` after adding or changing skills, commands or agent definitions.

Command adapters use `$source-command-<command>` and read the original command file; they do not automatically run on every task. See compatibility.json for exact names and sources. Native specialist definitions live in .codex/agents; use them only with explicit delegation requests.

## Hooks and connected tools

Existing command hooks are adapted to Codex event payloads. apply_patch file paths are extracted for migration guards and file reminders. Legacy ask decisions become a supported denial with the original reason because Codex does not support ask from PreToolUse yet. The adapter does not execute the proposed command. Review/trust project hooks in Codex before relying on them; this setup does not bypass trust. Shell commands that edit files remain subject to shell policy, not an absolute filesystem enforcement layer.

Existing .codex/config.toml MCP settings are preserved. Cursor MCP settings and editor extensions do not automatically become Codex integrations. Use connected Codex tools where available; per-server authentication and local service availability still apply. No production service or credentials are provisioned by this compatibility setup.

## Validation

Configuration validation checks skill metadata and links, original command references, TOML/JSON parsing and safe hook fixtures. It does not assert the application builds or that external MCP services are authenticated.

Skills available locally: 22. Command adapters: 0. Specialist definitions: 4.
