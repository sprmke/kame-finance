---
name: credit-cards
description: Credit card SOA module for Kame Finance. Use when porting pay-credit-cards CLI logic.
---

# Credit Cards (Claude)

See full skill: `.cursor/skills/credit-cards/SKILL.md`

Key points:

- Port parsers from `automated-tasks/pay-credit-cards/src/`
- Issuers: Maya e-wallet + PH digital + traditional (`PH_BANK_ISSUERS`); dedicated parsers metrobank, rcbc, bpi, unionbank; Maya Gmail subject patterns in `soa/config.ts`
- Preserve mark-paid and reminder fingerprint behavior
- Rule: `.cursor/rules/18-credit-cards-module.mdc`
