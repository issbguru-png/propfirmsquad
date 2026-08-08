# PropFirmSquad — Frozen URL Map (Contract)

Any change to this file requires founder approval. Lanes build ONLY these routes.

## Public routes

| Route | Owner lane | Notes |
|---|---|---|
| `/` | C | Head terms; AI-answer format |
| `/prop-firms` | C | Filterable directory (one URL; Meilisearch phase 2) |
| `/prop-firms/[slug]` | C | Mega-profile (consolidated; anchor sections) |
| `/prop-firms/[slug]/promo-code` | C | Only child page (coupon intent) |
| `/best/[list]` | C | ~25 curated ranking pages (template + CMS-driven) |
| `/compare` + `/compare/[pair]` | C (phase 2) | Volume-justified pairs only |
| `/tools/consistency-calculator` etc. | D | 5 calculators |
| `/countries/[country]` | phase 2 | Top ~25, dense pages |
| `/news` + `/news/[slug]` + `/rule-changes` | phase 3 | News engine |
| `/payouts` | phase 3 | Payout analytics hub |
| `/deals` | C | Single offers hub |
| `/firms-to-avoid` | C | Sourced register of firms that closed, rebranded, or drew regulatory action. Every entry requires a dated public source URL (see the legal frame in the route file); firms live in `firms` as `listingType: 'delisted'` so they never enter a ranking |
| `/learn/[slug]` | E | MDX pipeline |
| `/methodology`, `/about`, `/contact`, legal | C | Static |
| `/hi/*`, `/es/*` | phase 3 | next-intl subpaths, mirror above |

## SEO conventions (E owns implementation, all lanes comply)
- Titles from metadata factory only. Profile: `{Firm} Review {Year}: Rules, Payouts & Real Trader Data ({rating}★)`
- Promo page: `{Firm} Promo Code {Month} {Year}: {X}% Off (Verified)`
- JSON-LD via builders in `src/lib/seo/` only — no hand-rolled schema
- New/thin pages default to noindex until data-density threshold met
- Sitemaps: segmented (firms/best/news/learn) with real lastmod

## Admin
- `/admin` — Payload CRM (lane A)
- `/api/*` — Payload REST + custom endpoints
