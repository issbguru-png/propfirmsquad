# Phase 2 Handoff — exact next steps

State (2026-08-08): Phase 0+1 DONE, merged to main (cda4e1a). 82/82 tests, typecheck green, all 12 routes 200.
Dev: `brew services start postgresql@16` · `corepack pnpm dev` (pnpm NOT on PATH — always `corepack pnpm`; root scripts calling bare `pnpm` fail locally, use `corepack pnpm -r <cmd>` or `--filter`). DB `propfirmsquad` seeded: 15 firms, 15 promos, 12 platforms, 0 challenges.

## Status update (2026-08-08, later session)
Tasks 1–4 DONE: SEO factory + JSON-LD wired (profile/promo/layout), TrendChart/RatingStars swapped in, 20 real challenges seeded (FundingPips + new FTMO firm — both indexable, gate verified), Playwright E2E green (`corepack pnpm --filter web test:e2e`; e2e admin = e2e@local.test, local only).
Remaining: task 5 (CF deploy — needs user's Cloudflare acct), task 6 (GitHub push — needs remote). Known debt: /tools pages still use inline metadata instead of toolMeta (ROUTES compliance); full B-kit swap on directory/home cards; C's _lib/ui duplicates some kit primitives.

## Ordered tasks (original)

1. **Wire E→C**: replace inline `generateMetadata` in `src/app/(site)/prop-firms/[slug]/page.tsx` + `promo-code/page.tsx` + tools/learn pages with factories from `src/lib/seo/metadata.ts`. Add `<JsonLd>` (src/lib/seo/json-ld.tsx) to profile (firmLd + breadcrumbLd + faqLd), promo page (offerLd), layout (organizationLd).
2. **Swap C primitives→B kit**: profile page uses `_lib/ui.tsx` placeholders; replace with `@/components` (FirmCard, VerdictBox, ChallengePriceTable, TrendChart, DataBlock, RatingStars). Delete duplicated primitives from `_lib/ui.tsx` after swap.
3. **Seed challenges**: create `apps/web/seed-data/challenges.csv` (real FTMO/FundedNext/E8 challenge pricing from research: /Users/warissalmanshah/Desktop/PF/propfirmmatch-seo-data/scraped/pages/*.txt) → extend `scripts/import-firms.ts` pattern or write `scripts/import-challenges.ts`. Then flip `seo.indexable` on 2–3 dense firms to test the gate.
4. **E2E test**: Playwright — CRM edit → revalidate → page reflects change (the freshness loop).
5. **CF deploy hello-world** (needs user's Cloudflare account): OpenNext adapter, decide Payload-on-Workers vs admin-on-Node NOW.
6. Push repo to GitHub (CI is ready in .github/workflows/ci.yml).

## Founder tasks (user)
Buy propfirmsquad.com · GSC + GA4 · Trustpilot/Discord presence · affiliate signups.

## Key docs
Strategy: ../propfirmmatch-seo-data/propfirmsquad-{tech-stack,site-architecture,profile-strategy,design-system,build-plan}.md
Contracts: docs/CONTRACTS.md, docs/ROUTES.md (frozen).
