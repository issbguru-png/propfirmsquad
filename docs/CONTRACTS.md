# PropFirmSquad — Data Contracts (Phase 0)

Source of truth: Payload collection configs in `apps/web/src/collections/`.
Generated TS types: `apps/web/src/payload-types.ts` (via `pnpm generate:types`).
Lanes import types from there — never redefine entity shapes.

## Collections

- **firms** — core entity. Identity (name, slug, listingType, firmTypes[]), company facts (country, currency, dateEstablished, jurisdiction), links (websiteUrl, affiliateUrl, trustpilotUrl, discordUrl), media (logo, logoBackgroundColor), offering (maxAllocation, programTypes[], assets[], platforms rel[]), social proof (reviewScore, reviewsCount, trustPilotScore, trustpilotHistory[], likesCount), editorial (verdict richText localized, rulesSummary group, payout group), trust (underReview, lastVerifiedAt), drafts+versions on.
- **challenges** — rows in profile pricing tables. firm rel, name, accountSize, steps, price, profitTargets[], drawdown fields, profitSplit, refundable, isActive.
- **promos** — firm rel, code, discountPct, description (localized), exclusive, endDate, active.
- **platforms** — name, icon.
- **countries** — name, iso2, localized paymentNotes; used by firms.restrictedCountries and /countries pages.
- **reviews** — firm rel, rating 1–5, title, body, authorName, verified, status pending/approved. Public API only exposes approved.
- **news-posts** — title, slug, type (launch/collapse/rule-change/update), firm rel, body, publishedAt. Drafts on.
- **rule-changes** — firm rel, date, summary, details, source. Feeds per-firm rule-change log (moat).
- **media** — uploads (logos, icons). Local disk in dev; R2 in prod.
- **users** — admin auth, role: admin | editor.

## Conventions
- Slugs: kebab-case, unique, immutable after publish (redirects handled if renamed).
- All public-facing text fields localized (en default; hi, es enabled).
- Every firm-data edit must update `lastVerifiedAt` (hook enforces).
- Revalidation: afterChange hooks call revalidatePath for affected routes (lane A implements; route map in ROUTES.md).
- Publishing gate: firms render noindex until `verdict`, ≥1 challenge, and rulesSummary present.
