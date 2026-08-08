/**
 * Seed registry-verified legal entities.
 *
 * "Who am I actually contracting with" is one of the cheapest, sharpest trust
 * signals available, and almost no prop firm marketing page answers it. Every
 * row here was opened on the public registry and read, not inferred from a
 * firm's own about page.
 *
 * ── WHAT DOES NOT GO IN THIS FILE ────────────────────────────────────────────
 * A registration number with no registry record behind it is worse than no
 * number, because it looks verified. `enforceClaimSourcing` rejects a save
 * carrying a registrationNumber without a sourceUrl, so the rule is structural.
 *
 * Two deliberate omissions, recorded so nobody "fixes" them later by pasting in
 * a number from an aggregator:
 *
 *   - FundedNext. Research cited a Comoros registration (FundedNext Ltd,
 *     HY01023052, Moheli). Re-reading fundednext.com/company on 2026-08-08 did
 *     not surface it; the page discloses an FSCA FSP number, a Seychelles
 *     licence for FNmarkets Ltd, and two MASKED numbers ("700XXX", "12XXXX").
 *     A masked licence number is not a disclosure. Left null.
 *   - Attributing FNmarkets Ltd (Seychelles SD No. 137) to FundedNext as its
 *     contracting entity would be an inference: it is a related broker licence,
 *     not necessarily the party a trader contracts with for a challenge.
 *
 * Rerunnable: upserts the legalEntity group by slug, touches nothing else.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-legal-entities.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type EntityRow = {
  slug: string
  name: string
  registrationNumber: string
  registry: string
  jurisdiction: string
  sourceUrl: string
  /** Recorded when the registered name differs from the trading name, which is
   *  itself worth surfacing: it is what a trader would see on a card statement
   *  or a chargeback, and what they would have to sue. */
  note?: string
}

const ROWS: EntityRow[] = [
  {
    slug: 'the-5-ers',
    name: 'FIVE PERCENT ONLINE LTD',
    registrationNumber: '12553363',
    registry: 'Companies House (UK)',
    jurisdiction: 'GB',
    sourceUrl: 'https://find-and-update.company-information.service.gov.uk/company/12553363',
    note: 'Incorporated 9 April 2020, active. Registered name differs from the trading name.',
  },
  {
    slug: 'alpha-capital-group',
    name: 'ALPHA CAPITAL GROUP LIMITED',
    registrationNumber: '13719951',
    registry: 'Companies House (UK)',
    jurisdiction: 'GB',
    sourceUrl: 'https://find-and-update.company-information.service.gov.uk/company/13719951',
    note: 'Incorporated 2 November 2021, active.',
  },
]

const payload = await getPayload({ config })

const missing: string[] = []
let updated = 0

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
        legalEntity: {
          name: row.name,
          registrationNumber: row.registrationNumber,
          registry: row.registry,
          jurisdiction: row.jurisdiction,
          sourceUrl: row.sourceUrl,
        },
      },
    })
    updated += 1
    console.log(`  ${row.slug.padEnd(22)} ${row.name} (${row.registrationNumber})`)
  }

  console.log(`\nUpdated ${updated} of ${ROWS.length}.`)
  if (missing.length > 0) console.warn(`Slugs not found: ${missing.join(', ')}`)
} catch (err) {
  console.error('seed-legal-entities failed:', err)
  process.exit(1)
}

process.exit(0)
