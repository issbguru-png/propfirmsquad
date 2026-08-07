/**
 * Seed real challenge pricing captured from live pages (Aug 2026):
 * - FundingPips (already seeded firm): 10 verified rows
 * - FTMO (new firm): facts + 10 verified rows (EUR)
 * Then writes a short factual verdict and flips seo.indexable on both —
 * exercising the data-density gate end-to-end (verdict + challenges present).
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-challenges.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Steps = 'instant' | '1-step' | '2-step' | '3-step'
type Row = {
  name: string
  steps: Steps
  accountSize: number
  price: number
  currency?: string
}

const FUNDING_PIPS_ROWS: Row[] = [
  { name: 'Flex 2-Step 100K', steps: '2-step', accountSize: 100_000, price: 399.2 },
  { name: 'Flex 2-Step 50K', steps: '2-step', accountSize: 50_000, price: 215.2 },
  { name: 'Flex 2-Step 25K', steps: '2-step', accountSize: 25_000, price: 127.2 },
  { name: 'Flex 2-Step 10K', steps: '2-step', accountSize: 10_000, price: 47.2 },
  { name: 'Flex 2-Step 5K', steps: '2-step', accountSize: 5_000, price: 25.6 },
  { name: 'Pro 2-Step 200K', steps: '2-step', accountSize: 200_000, price: 675.2 },
  { name: 'Pro 2-Step 100K', steps: '2-step', accountSize: 100_000, price: 337.6 },
  { name: 'Pro 2-Step 50K', steps: '2-step', accountSize: 50_000, price: 179.2 },
  { name: 'Pro 2-Step 25K', steps: '2-step', accountSize: 25_000, price: 107.2 },
  { name: 'Zero Instant 200K', steps: 'instant', accountSize: 200_000, price: 710.4 },
]

const FTMO_ROWS: Row[] = [
  { name: 'Standard 1-Step 200K', steps: '1-step', accountSize: 200_000, price: 999, currency: 'EUR' },
  { name: 'Standard 1-Step 100K', steps: '1-step', accountSize: 100_000, price: 499, currency: 'EUR' },
  { name: 'Standard 1-Step 50K', steps: '1-step', accountSize: 50_000, price: 319, currency: 'EUR' },
  { name: 'Standard 1-Step 25K', steps: '1-step', accountSize: 25_000, price: 199, currency: 'EUR' },
  { name: 'Standard 1-Step 10K', steps: '1-step', accountSize: 10_000, price: 79, currency: 'EUR' },
  { name: 'Standard 2-Step 25K', steps: '2-step', accountSize: 25_000, price: 250, currency: 'EUR' },
  { name: 'Swing 2-Step 100K', steps: '2-step', accountSize: 100_000, price: 599, currency: 'EUR' },
  { name: 'Swing 2-Step 50K', steps: '2-step', accountSize: 50_000, price: 379, currency: 'EUR' },
  { name: 'Swing 2-Step 25K', steps: '2-step', accountSize: 25_000, price: 279, currency: 'EUR' },
  { name: 'Swing 2-Step 10K', steps: '2-step', accountSize: 10_000, price: 99, currency: 'EUR' },
]

/** Minimal Lexical richText doc with one paragraph. */
const lexicalParagraph = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: null,
    children: [
      {
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction: null,
        children: [{ type: 'text', text, version: 1 }],
      },
    ],
  },
})

console.log('[seed-challenges] starting…')
try {
  const payload = await getPayload({ config })

  // ── FTMO: create firm if missing (facts from captured live page) ──
  let ftmo = (
    await payload.find({ collection: 'firms', where: { slug: { equals: 'ftmo' } }, limit: 1 })
  ).docs[0]
  if (!ftmo) {
    ftmo = await payload.create({
      collection: 'firms',
      data: {
        name: 'FTMO',
        slug: 'ftmo',
        listingType: 'listed',
        firmTypes: ['cfd'],
        country: 'CZ',
        currency: 'EUR',
        dateEstablished: '2015-01-01T00:00:00.000Z',
        trustPilotScore: 4.8,
        assets: ['fx', 'metals', 'indices', 'energy', 'crypto', 'stocks', 'other-commodities'],
        programTypes: ['1-step', '2-step'],
        _status: 'published',
      },
    })
    console.log('[seed-challenges] created FTMO firm')
  }

  const fp = (
    await payload.find({
      collection: 'firms',
      where: { slug: { equals: 'funding-pips' } },
      limit: 1,
    })
  ).docs[0]
  if (!fp) throw new Error('funding-pips firm not found — run pnpm seed first')

  const upsertRows = async (firmId: number | string, rows: Row[]) => {
    let n = 0
    for (const r of rows) {
      const existing = await payload.find({
        collection: 'challenges',
        where: { and: [{ firm: { equals: firmId } }, { name: { equals: r.name } }] },
        limit: 1,
      })
      if (existing.docs[0]) continue
      await payload.create({
        collection: 'challenges',
        data: {
          firm: firmId as number,
          name: r.name,
          steps: r.steps,
          accountSize: r.accountSize,
          price: r.price,
          currency: r.currency ?? 'USD',
          isActive: true,
        },
      })
      n++
    }
    return n
  }

  const a = await upsertRows(fp.id, FUNDING_PIPS_ROWS)
  const b = await upsertRows(ftmo.id, FTMO_ROWS)
  console.log(`[seed-challenges] challenges created: funding-pips +${a}, ftmo +${b}`)

  // ── Factual verdicts (draft-quality; founder to edit) + flip indexable ──
  const verdicts: Record<string, string> = {
    'funding-pips':
      'FundingPips is a UAE-based CFD prop firm operating since late 2022, selling 2-step evaluations from $25.60 (5K Flex) up to $675.20 (200K Pro) plus an instant-funding Zero line. It scores 4.2/5 from over 1,100 trader reviews on comparison platforms and 4.5 on Trustpilot. Pricing is among the lowest per dollar of buying power in the CFD segment; verify current payout terms before purchasing. [Draft verdict — pending editorial review.]',
    ftmo:
      'FTMO is the longest-running retail prop firm in this database, operating from Prague since 2015 and holding a 4.8 Trustpilot score. Its Standard 1-step challenges run €79 (10K) to €999 (200K), with Swing 2-step variants for traders holding positions over news and weekends. FTMO acquired OANDA in 2025, unusual institutional backing for the space. Its rules are stricter than budget rivals but its payout track record is the industry reference point. [Draft verdict — pending editorial review.]',
  }

  for (const [slug, text] of Object.entries(verdicts)) {
    const firm = (
      await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
    ).docs[0]
    if (!firm) continue
    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: {
        verdict: lexicalParagraph(text),
        seo: { ...(firm.seo ?? {}), indexable: true },
      },
    })
    const after = await payload.findByID({ collection: 'firms', id: firm.id })
    console.log(
      `[seed-challenges] ${slug}: verdict set, indexable now = ${after.seo?.indexable} (gate ${after.seo?.indexable ? 'PASSED' : 'kept noindex'})`,
    )
  }

  console.log('[seed-challenges] done')
  process.exit(0)
} catch (err) {
  console.error('[seed-challenges] FAILED:', err)
  process.exit(1)
}
