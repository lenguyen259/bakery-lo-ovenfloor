# Security — Lò Ovenfloor

## What this demo protects

- Batch quantities are computed in TypeScript, not by the model.
- Role checks on release, plan writes, waste, and suggestions.
- Audit rows for role changes, suggestion, release, and waste.
- No customer PII in the schema.

## Trust boundaries

- Browser → Next.js API → Prisma → Postgres
- Model receives plan JSON only, never raw POS notes.

## What the model sees

- SKU ids, planned qtys, flags, oven load/capacity, and the user question.

## What a person must confirm

- Applying the ginger cut when ovens are over capacity.
- Releasing the plan (supervisor only).

## Role matrix

| Action | supervisor | planner | sponsor |
| --- | --- | --- | --- |
| Read | yes | yes | yes |
| Draft / suggestion | yes | yes | no |
| Release | yes | no | no |
| Waste | yes | no | no |

The `demo_role` cookie is **not authentication**. Production would use SSO.

## Production gaps

- No SSO, field encryption, or penetration test.
- In-process AI rate limit (demo only).
- Fictional seed data only.

## Secrets

- Never commit `.env`. Use Vercel env for `DATABASE_URL`, `DIRECT_URL`, optional `OPENAI_API_KEY`.

## Fictional data

All outlets, SKUs, and people are invented for HCMC demo storytelling.
