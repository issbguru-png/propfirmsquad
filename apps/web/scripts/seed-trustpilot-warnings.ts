/**
 * Seed the Trustpilot "rating unavailable due to a breach of our guidelines"
 * state for every listed firm.
 *
 * ── WHY THIS MATTERS ─────────────────────────────────────────────────────────
 * Trustpilot applies this label when its systems detect a breach of its
 * business guidelines, most commonly review manipulation, and it suppresses the
 * public star rating while leaving the underlying score in the page data. It
 * cannot be bought off, it is visible to any trader, and in our own research it
 * correlated with almost nothing else we track, which is exactly what makes it
 * informative. It is also adverse to firms we earn commission from, which is
 * why no affiliate site reports it.
 *
 * ── LEGAL CONTRACT (read before editing) ─────────────────────────────────────
 *   1. Every active warning MUST carry `checkedAt` and `profileUrl`. The
 *      `enforceClaimSourcing` hook rejects the save otherwise, so this is a
 *      structural guarantee rather than a convention.
 *   2. We publish ONLY the dated observation: what the profile displayed, when
 *      we looked, and where to look yourself. We never assert why Trustpilot
 *      applied it, and never characterise the firm's conduct in our own voice.
 *      "Trustpilot flagged this profile" is defensible. "This firm fakes
 *      reviews" is not, and we do not know it.
 *   3. `active: false` rows are seeded too. Recording that we checked and found
 *      nothing is what makes the absence of a warning meaningful.
 *
 * Trustpilot returns HTTP 403 to automated fetchers, so these figures cannot be
 * scraped. Every row below was read from the live profile in a real browser on
 * the date in `CHECKED_AT`, and four of them (goat-funded-trader,
 * alpha-capital-group, blue-guardian, aquafunded) were independently re-read
 * against the research file and matched exactly on review counts.
 *
 * Rerunnable: upserts the trustpilotWarning group by slug, touches nothing else.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-trustpilot-warnings.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

/** The single date every row below was observed. Pinned UTC: a bare date string
 *  is read in the session timezone and has shifted a day on us before. */
const CHECKED_AT = '2026-08-08T00:00:00.000Z'

type WarningRow = {
  slug: string
  active: boolean
  profileUrl: string
  /** TrustScore present in page data but hidden from visitors when active. */
  underlyingScore: number
  underlyingReviews: number
  reviewsLast12m: number
  /** Only where the Trustpilot profile name differs from our firm name. */
  note?: string
}

const ROWS: WarningRow[] = [
  // ── Flagged: warning visible on the profile ──────────────────────────────
  {
    slug: 'goat-funded-trader',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/goatfundedtrader.com',
    underlyingScore: 2.3,
    underlyingReviews: 4197,
    reviewsLast12m: 1312,
  },
  {
    slug: 'aquafunded',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/aquafunded.com',
    underlyingScore: 2.4,
    underlyingReviews: 1192,
    reviewsLast12m: 456,
    note: 'Profile is named "AquaFunds"',
  },
  {
    slug: 'blue-guardian',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/blueguardian.com',
    underlyingScore: 3.4,
    underlyingReviews: 2038,
    reviewsLast12m: 820,
    note: 'Profile is named "Guardian Markets"',
  },
  {
    slug: 'brightfunded',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/brightfunded.com',
    underlyingScore: 3.7,
    underlyingReviews: 544,
    reviewsLast12m: 238,
  },
  {
    slug: 'maven-trading',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/maventrading.com',
    underlyingScore: 4.1,
    underlyingReviews: 5159,
    reviewsLast12m: 948,
    note: 'Profile is named "Maven"',
  },
  {
    slug: 'e8-markets',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/e8markets.com',
    underlyingScore: 4.2,
    underlyingReviews: 3296,
    reviewsLast12m: 689,
  },
  {
    slug: 'crypto-fund-trader',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/cryptofundtrader.com',
    underlyingScore: 4.3,
    underlyingReviews: 1145,
    reviewsLast12m: 267,
  },
  {
    slug: 'fundedelite',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/fundedelite.com',
    underlyingScore: 4.3,
    underlyingReviews: 737,
    reviewsLast12m: 462,
  },
  {
    slug: 'alpha-capital-group',
    active: true,
    profileUrl: 'https://www.trustpilot.com/review/alphacapitalgroup.uk',
    underlyingScore: 4.7,
    underlyingReviews: 21408,
    reviewsLast12m: 8872,
  },
  // ── Checked, no warning. Seeded so the absence means something. ──────────
  {
    slug: 'atmos-funded',
    active: false,
    profileUrl: 'https://www.trustpilot.com/review/atmosfunded.com',
    underlyingScore: 3.7,
    underlyingReviews: 348,
    reviewsLast12m: 0,
  },
  {
    slug: 'trade-the-pool',
    active: false,
    profileUrl: 'https://www.trustpilot.com/review/tradethepool.com',
    underlyingScore: 4.5,
    underlyingReviews: 773,
    reviewsLast12m: 0,
  },
]

const payload = await getPayload({ config })

let updated = 0
const missing: string[] = []

try {
  for (const row of ROWS) {
    const { docs } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: row.slug } },
      limit: 1,
      depth: 0,
    })
    const firm = docs[0]
    if (!firm) {
      missing.push(row.slug)
      continue
    }

    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: {
        trustpilotWarning: {
          active: row.active,
          checkedAt: CHECKED_AT,
          profileUrl: row.profileUrl,
          underlyingScore: row.underlyingScore,
          underlyingReviews: row.underlyingReviews,
          // 0 means "not recorded" for the unflagged rows; store null instead
          // so the UI can tell "no recent reviews" from "we did not note it".
          reviewsLast12m: row.reviewsLast12m || null,
        },
      },
    })
    updated += 1
    const state = row.active ? 'FLAGGED' : 'clean   '
    console.log(
      `  ${state} ${row.slug.padEnd(22)} ${row.underlyingScore} / ${row.underlyingReviews.toLocaleString('en-US')}`,
    )
  }

  console.log(`\nUpdated ${updated} firms (${ROWS.filter((r) => r.active).length} flagged).`)
  if (missing.length > 0) console.warn(`Slugs not found: ${missing.join(', ')}`)
} catch (err) {
  console.error('seed-trustpilot-warnings failed:', err)
  process.exit(1)
}

process.exit(0)
