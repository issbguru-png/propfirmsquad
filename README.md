# PropFirmSquad

Prop-firm comparison platform. Next.js 15 + Payload 3 + Postgres, warm-paper design system.

## Local dev

```bash
# 1. Postgres (installed via Homebrew)
brew services start postgresql@16
createdb propfirmsquad

# 2. Env
cp .env.example apps/web/.env

# 3. Install & run
pnpm install
pnpm generate:importmap
pnpm dev          # site: localhost:3000 · CRM: localhost:3000/admin

# 4. Seed 15 real firms (captured PFM data)
pnpm seed
```

## Workspace

- `apps/web` — Next.js site + embedded Payload CRM (collections = data contracts)
- `packages/calc` — pure calculator logic (unit-tested)
- `docs/ROUTES.md` — frozen URL map · `docs/CONTRACTS.md` — data contracts

## Strategy docs

See `../propfirmmatch-seo-data/propfirmsquad-*.md` (tech stack, architecture, profile strategy, design system, build plan).
