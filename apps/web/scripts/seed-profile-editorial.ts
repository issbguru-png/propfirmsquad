/**
 * Seed editorial pros/cons + subscores for FTMO and FundingPips ONLY.
 * Grounded in captured live data (Aug 2026) — see rationale comments below.
 * Idempotent: overwrites prosCons + scores on each run (draft editorial).
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-profile-editorial.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Editorial = {
  pros: string[]
  cons: string[]
  scores: {
    pricingValue: number
    rulesFairness: number
    payoutReliability: number
    support: number
    platforms: number
  }
}

const EDITORIAL: Record<string, Editorial> = {
  ftmo: {
    pros: [
      'Longest track record in the industry — operating since 2015',
      '4.8/5 Trustpilot score across a large review base',
      'Free repeatable trial, and the challenge fee is refunded on funded accounts',
      'Institutional backing after acquiring OANDA in 2025',
    ],
    cons: [
      'Pricier than budget rivals — €999 for the 200K 1-step challenge',
      'Stricter rules, including news-trading restrictions on Standard accounts',
      'EUR-denominated pricing adds conversion cost for USD-based traders',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.5: €999/200K 1-step is at the top of the market; the
    //   refundable fee and free trial soften but don't offset the premium.
    // - rulesFairness 3.8: transparent and long-published, but news
    //   restrictions on Standard and min trading days cost points.
    // - payoutReliability 4.8: 10+ years of payouts; the industry reference
    //   point, matching its 4.8 Trustpilot.
    // - support 4.6: mature multilingual support org, consistently praised
    //   in reviews.
    // - platforms 4.5: MT4/MT5/cTrader/DXtrade spread; no proprietary
    //   platform innovation beyond that.
    scores: {
      pricingValue: 3.5,
      rulesFairness: 3.8,
      payoutReliability: 4.8,
      support: 4.6,
      platforms: 4.5,
    },
  },
  'funding-pips': {
    pros: [
      'Among the cheapest per dollar of buying power — $25.60 for a 5K challenge',
      '1,100+ trader reviews averaging 4.2/5',
      'Instant-funding Zero line for traders who want to skip evaluations',
      'Scales up to $400K in funded capital',
    ],
    cons: [
      'Young firm — operating only since late 2022',
      'Flex line is excluded from some promotions',
      'Payout terms still need independent verification',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.8: $25.60/5K Flex is near the floor of the CFD
    //   segment per dollar of buying power.
    // - rulesFairness 4.0: mainstream 2-step terms, but promo exclusions on
    //   the Flex line complicate the fine print.
    // - payoutReliability 4.0: solid 4.2/5 across 1,100+ reviews, but only a
    //   ~4-year history and payout terms not yet independently verified.
    // - support 3.8: generally responsive per reviews; scale-up growing
    //   pains reported.
    // - platforms 4.0: standard MT5-centric offering; adequate, not a
    //   differentiator.
    scores: {
      pricingValue: 4.8,
      rulesFairness: 4.0,
      payoutReliability: 4.0,
      support: 3.8,
      platforms: 4.0,
    },
  },
}

console.log('[seed-profile-editorial] starting…')
try {
  const payload = await getPayload({ config })

  for (const [slug, editorial] of Object.entries(EDITORIAL)) {
    const firm = (
      await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
    ).docs[0]
    if (!firm) {
      console.warn(`[seed-profile-editorial] ${slug}: firm not found — skipped`)
      continue
    }
    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: {
        prosCons: {
          pros: editorial.pros.map((text) => ({ text })),
          cons: editorial.cons.map((text) => ({ text })),
        },
        scores: editorial.scores,
      },
    })
    console.log(
      `[seed-profile-editorial] ${slug}: ${editorial.pros.length} pros, ${editorial.cons.length} cons, 5 subscores written`,
    )
  }

  console.log('[seed-profile-editorial] done')
  process.exit(0)
} catch (err) {
  console.error('[seed-profile-editorial] FAILED:', err)
  process.exit(1)
}
