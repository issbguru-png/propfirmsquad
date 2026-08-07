/**
 * Seed editorial pros/cons + subscores + trustpilotUrl/discordUrl for the
 * current site top 5: e8-markets, trade-the-pool, the-5-ers, atmos-funded,
 * brightfunded. Grounded in data captured Aug 2026 — see per-firm rationale
 * comments and the source URLs recorded in seed-data/firm-details.json.
 *
 * Idempotent:
 * - prosCons written ONLY if the firm currently has no pros and no cons
 * - each subscore written ONLY if that key is currently null/undefined
 * - trustpilotUrl/discordUrl written ONLY if currently empty
 * Never nulls-out an existing value.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-top5-editorial.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Editorial = {
  trustpilotUrl?: string
  /** Only set when an official invite is published on the firm's own site. */
  discordUrl?: string
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
  'e8-markets': {
    trustpilotUrl: 'https://www.trustpilot.com/review/e8markets.com',
    // Official invite published on e8markets.com homepage (Aug 2026).
    discordUrl: 'https://discord.com/invite/e8markets',
    pros: [
      'US-based firm reporting $74M+ in payouts since launching in 2021',
      'No minimum trading days or consistency rule during the evaluation',
      'Highly configurable challenges — pick account size, drawdown, and profit split',
      'Wide platform choice: MT5, cTrader, Match Trader, and TradeLocker',
      'On-demand payout requests with 1-2 day processing',
    ],
    cons: [
      'Funded accounts carry a 35% best-day cap plus 5 profitable days (0.3%+) between payouts',
      'No trading within 5 minutes of high-impact news on funded accounts',
      'Configurable pricing makes headline fees hard to compare across firms',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.0: $48 (5K) to $1,998 (500K) at the default 6% drawdown
    //   config is mid-market; frequent codes soften it, but tighter configs
    //   cost more.
    // - rulesFairness 3.6: evaluation rules are clean (no min days, no
    //   consistency), but the funded stage adds a 35% best-day cap and
    //   5-profitable-day payout gating that the marketing underplays.
    // - payoutReliability 4.3: on-demand requests, 1-2 day processing, $74M+
    //   reported paid since 2021; docked for the payout gating conditions.
    // - support 4.2: 4.8/5 across 478 tracked reviews and an active 40K+
    //   member Discord; no systemic complaint pattern found.
    // - platforms 4.6: four platforms including TradeLocker and Match Trader
    //   — one of the broadest spreads in this set.
    scores: {
      pricingValue: 4.0,
      rulesFairness: 3.6,
      payoutReliability: 4.3,
      support: 4.2,
      platforms: 4.6,
    },
  },
  'trade-the-pool': {
    trustpilotUrl: 'https://www.trustpilot.com/review/tradethepool.com',
    // No Discord invite published on tradethepool.com — left unset.
    pros: [
      'Rare prop firm funding real US stocks and ETFs (12,000+ symbols), not CFDs',
      'News trading fully allowed, including on funded accounts',
      'Cheapest entry in our top five at $47 for a 5K day-trading account',
      'Run by Five Percent Online, the operator behind The5ers (est. 2016)',
    ],
    cons: [
      '70% profit split sits below the 80-90% industry norm',
      'EAs and automated trading are strictly prohibited',
      'Consistency caps of 30-50% depending on account type',
      '$300 minimum payout on a 14-day cycle',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.8: $47 entry is cheap, but swing accounts run to $420
    //   for 10K buying power — expensive per dollar relative to CFD rivals.
    // - rulesFairness 3.5: static drawdowns and unrestricted news trading
    //   are fair, but 30-50% consistency caps and minimum-position counts
    //   add fine print.
    // - payoutReliability 4.0: 4.4-4.5 Trustpilot, 14-day cycles via Rise or
    //   crypto; $300 floor and a shorter (2022) track record cap the score.
    // - support 4.0: reviews praise support and the trader community;
    //   smaller org than the CFD giants.
    // - platforms 3.2: single proprietary TraderEvolution stack — no
    //   MT5/cTrader option.
    scores: {
      pricingValue: 3.8,
      rulesFairness: 3.5,
      payoutReliability: 4.0,
      support: 4.0,
      platforms: 3.2,
    },
  },
  'the-5-ers': {
    trustpilotUrl: 'https://www.trustpilot.com/review/the5ers.com',
    // Official invite published on the5ers.com/community (Aug 2026).
    discordUrl: 'https://discord.gg/t7ytdt2wfX',
    pros: [
      'Operating since 2016 — one of the longest track records in prop trading',
      '4.7/5 Trustpilot score across a large review base',
      'Four program styles: High Stakes 2-step, Pro Growth 1-step, Hyper Growth instant, and Bootcamp',
      'Profit split scales to 100% with a $4M scaling ceiling',
      'EAs permitted across programs (latency/feed exploits excluded)',
    ],
    cons: [
      'No order execution within 2 minutes of high-impact news on High Stakes',
      'Bootcamp and Hyper Growth start at a 50% profit split',
      'Hyper Growth instant funding is pricey — $260 for a $5K account',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.2: High Stakes $39 (5K) to $495 (100K) is competitive;
    //   Bootcamp's $22-$225 entry fees are near the market floor, but the
    //   instant line is expensive per dollar of capital.
    // - rulesFairness 4.0: transparent static drawdowns and long-published
    //   rules; 2-minute news window and 3-profitable-day minimum deduct.
    // - payoutReliability 4.6: ~10 years of payouts every 14 days via Rise,
    //   crypto, or bank transfer — closest thing to a reference point after
    //   FTMO.
    // - support 4.4: mature multilingual org, consistently praised across
    //   its 4.7/5 review base.
    // - platforms 4.2: MT5, cTrader, and TradingView connectivity; no
    //   TradeLocker/DXtrade breadth.
    scores: {
      pricingValue: 4.2,
      rulesFairness: 4.0,
      payoutReliability: 4.6,
      support: 4.4,
      platforms: 4.2,
    },
  },
  'atmos-funded': {
    trustpilotUrl: 'https://www.trustpilot.com/review/atmosfunded.com',
    // Official invite published on atmosfunded.com (Aug 2026).
    discordUrl: 'https://discord.gg/PUCanabzr6',
    pros: [
      'Full account-type spread: 1-step, 2-step, 1-step Plus, and instant funding up to $200K',
      'EAs permitted on evaluations',
      'No consistency rule on standard 1-step and 2-step accounts',
      'Payouts processed in 2-5 business days with a low $100 minimum',
    ],
    cons: [
      'Launched late 2024 — the thinnest track record in our top five',
      'Weakest Trustpilot score of the set: 3.8 across only 36 reviews',
      '6% trailing drawdown on the 1-step is tighter than static rivals',
      'Instant accounts carry a 20% consistency rule; 1-Step Plus caps best day at 45%',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.6: $63 (5K 1-step) to $1,020 (200K) is mid-pack —
    //   neither budget nor premium.
    // - rulesFairness 3.4: mixed drawdown models across plans (trailing 6%
    //   1-step vs static 10% 2-step) plus plan-specific consistency rules
    //   make the fine print heavier than peers.
    // - payoutReliability 3.2: bi-weekly cycle and $100 minimum are fine,
    //   but under 2 years of history and a 3.8/36-review Trustpilot base
    //   leave reliability unproven.
    // - support 3.5: limited evidence either way given the small review
    //   volume.
    // - platforms 3.0: MT5 only.
    scores: {
      pricingValue: 3.6,
      rulesFairness: 3.4,
      payoutReliability: 3.2,
      support: 3.5,
      platforms: 3.0,
    },
  },
  brightfunded: {
    trustpilotUrl: 'https://www.trustpilot.com/review/brightfunded.com',
    // Official invite published in the brightfunded.com footer (Aug 2026).
    discordUrl: 'https://discord.com/invite/fKzFHQKD4s',
    pros: [
      'No consistency rules on any account type',
      '24-hour guaranteed payouts, with the challenge fee refunded at first payout',
      'Profit split scales to 100% through the scale-up plan',
      '1-Step and two 2-Step variants with entries from €47-€49',
      '15% evaluation profit reward credited to the funded account',
    ],
    cons: [
      '5 minimum trading days per phase — even on the 1-Step',
      'News trading restricted in a 5-minute window around high-impact events',
      'EUR-denominated pricing adds conversion cost for USD-based traders',
      'Founded 2023 with roughly $13M paid out — still a short history',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.0: €49-€997 (1-Step) and €47-€947 (2-Step Bright) sit
    //   in line with the market, and 15-30% promo codes run frequently.
    // - rulesFairness 4.3: zero consistency rules anywhere is genuinely
    //   trader-friendly; 5 min trading days per phase and the 5-minute news
    //   window deduct.
    // - payoutReliability 4.2: 24-hour payout guarantee with ~1-day average
    //   processing and a 4.5-4.6 review score, but only ~3 years of history.
    // - support 4.3: 24/7 multilingual live chat + WhatsApp; reviews praise
    //   responsiveness.
    // - platforms 4.3: MT5, cTrader, and DXtrade-based house platform.
    scores: {
      pricingValue: 4.0,
      rulesFairness: 4.3,
      payoutReliability: 4.2,
      support: 4.3,
      platforms: 4.3,
    },
  },
}

console.log('[seed-top5-editorial] starting…')
try {
  const payload = await getPayload({ config })

  for (const [slug, editorial] of Object.entries(EDITORIAL)) {
    const firm = (
      await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
    ).docs[0]
    if (!firm) {
      console.warn(`[seed-top5-editorial] ${slug}: firm not found — skipped`)
      continue
    }

    const data: Record<string, unknown> = {}
    const notes: string[] = []

    // ── pros/cons: only when the firm has none at all ──
    const hasPros = (firm.prosCons?.pros?.length ?? 0) > 0
    const hasCons = (firm.prosCons?.cons?.length ?? 0) > 0
    if (!hasPros && !hasCons) {
      data.prosCons = {
        pros: editorial.pros.map((text) => ({ text })),
        cons: editorial.cons.map((text) => ({ text })),
      }
      notes.push(`prosCons SET (${editorial.pros.length}/${editorial.cons.length})`)
    } else {
      notes.push('prosCons kept')
    }

    // ── scores: merge per-key, never overwrite an existing value ──
    const existingScores = firm.scores ?? {}
    const mergedScores: Record<string, number> = {}
    let scoresSet = 0
    for (const [key, value] of Object.entries(editorial.scores)) {
      const current = (existingScores as Record<string, number | null | undefined>)[key]
      if (current === null || current === undefined) {
        mergedScores[key] = value
        scoresSet++
      } else {
        mergedScores[key] = current
      }
    }
    if (scoresSet > 0) data.scores = mergedScores
    notes.push(`scores +${scoresSet}`)

    // ── URLs: only fill when empty ──
    if (editorial.trustpilotUrl && !firm.trustpilotUrl) {
      data.trustpilotUrl = editorial.trustpilotUrl
      notes.push('trustpilotUrl SET')
    }
    if (editorial.discordUrl && !firm.discordUrl) {
      data.discordUrl = editorial.discordUrl
      notes.push('discordUrl SET')
    }

    if (Object.keys(data).length > 0) {
      await payload.update({ collection: 'firms', id: firm.id, data })
    }
    console.log(`[seed-top5-editorial] ${slug}: ${notes.join(', ')}`)
  }

  console.log('[seed-top5-editorial] done')
  process.exit(0)
} catch (err) {
  console.error('[seed-top5-editorial] FAILED:', err)
  process.exit(1)
}
