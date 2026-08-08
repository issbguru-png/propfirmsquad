/**
 * Seed editorial pros/cons + subscores + trustpilotUrl/discordUrl for the nine
 * firms that had challenges/rules/payout but no editorial depth:
 * fundednext, hola-prime, crypto-fund-trader, goat-funded-trader,
 * alpha-capital-group, aquafunded, blue-guardian, maven-trading, fundedelite.
 *
 * Every claim below was read off the firm's OWN site or help centre in Aug 2026
 * (see the per-firm source URLs recorded in seed-data/firm-details.json). Where
 * a value could only be found on an aggregator it is listed in that firm's
 * `needsVerification` array in the same file and is NOT asserted here.
 *
 * Scores are 0-5 with one decimal. Rationale is documented per firm. Two
 * cross-firm anchors used for calibration, both from our own challenges table:
 *   - price of a 100K 2-step: goat 263 < fundednext 400 < blue-guardian 464 <
 *     alpha 497 = aqua 499 < hola 569 < crypto-fund-trader 619 < fundedelite 750
 *     (maven 395 is a 100K 1-step; the tracked market median sits near 495)
 *   - review base: goat 1,075 > alpha 978 > fundednext 853 > maven 763 >
 *     aqua 284 > blue-guardian 211 > fundedelite 180 > cft 109 > hola 101
 *
 * Idempotent:
 * - prosCons written ONLY if the firm currently has no pros and no cons
 * - each subscore written ONLY if that key is currently null/undefined
 * - trustpilotUrl/discordUrl written ONLY if currently empty
 * Never nulls-out an existing value.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-remaining-editorial.ts
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
  fundednext: {
    trustpilotUrl: 'https://www.trustpilot.com/review/fundednext.com',
    // "CFDs Server" invite published on the fundednext.com homepage (Aug 2026).
    discordUrl: 'https://discord.com/invite/XfcJytXGDC',
    pros: [
      'No consistency rule on any Stellar evaluation, and no time limit to pass',
      'Static 10% maximum loss with a 5% daily limit on the flagship Stellar 2-Step',
      'Four programs from one firm: Stellar 2-Step, 1-Step, the cheaper Lite line from $32.99, and Instant',
      'EAs and trading bots permitted on MT4 and MT5',
      'On-demand payouts with a published 24-hour processing guarantee, paid in USDT/USDC, via Rise, or by bank transfer',
    ],
    cons: [
      'On a funded account only 40% of profit made in the 10-minute window around high-impact news is counted',
      'EA use carries an extra fee, and EAs are blocked entirely on cTrader and Match-Trader',
      '5 minimum trading days on the Stellar 2-Step, and a 60-day inactivity rule closes dormant accounts',
      'Base split is 80% — reaching 95% needs a paid add-on',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.2: $399.99 for a 100K Stellar 2-Step undercuts the ~$495
    //   market median in our table, and Stellar Lite opens at $32.99.
    // - rulesFairness 3.9: genuinely clean evaluation (no consistency rule, no
    //   deadline, static drawdown); docked for the funded-stage 40% news profit
    //   rule and for charging to enable EAs.
    // - payoutReliability 4.4: on-demand requests, 24-hour guarantee, six
    //   withdrawal rails, 4.5 Trustpilot over a large 853-review base, 2022 start.
    // - support 4.2: 4.3/5 across 853 tracked reviews, 24/7 multilingual desk and
    //   a help centre published in 14 languages.
    // - platforms 4.2: MT4, MT5, cTrader and Match-Trader — broad, but EA support
    //   is limited to the MetaTrader pair.
    scores: {
      pricingValue: 4.2,
      rulesFairness: 3.9,
      payoutReliability: 4.4,
      support: 4.2,
      platforms: 4.2,
    },
  },

  'hola-prime': {
    trustpilotUrl: 'https://www.trustpilot.com/review/holaprime.com',
    // Official invite published on the holaprime.com homepage (Aug 2026).
    discordUrl: 'https://discord.com/invite/hjDcUcEfgA',
    pros: [
      'Payout requests are processed within one hour once the compliance review clears',
      'Pick your payout cycle: 80% bi-weekly, 95% monthly, or 80% on demand',
      'News trading, weekend holding and overnight holding are all allowed, with no time limit to pass',
      'Publishes a payout transparency report and a zero payout-denial policy',
      'Widest platform spread in this group — MT4, MT5, cTrader, DXtrade and Match Trader',
    ],
    cons: [
      'The on-demand cycle requires a 40% best-day consistency score before you can withdraw',
      'The 95% split needs the monthly cycle plus 7 profitable trading days',
      '$569 for a 100K challenge is above the market median in our pricing table',
      'Launched August 2024 — the shortest track record of the nine',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.5: $39 entry looks cheap but 100K lands at $569, seventh
    //   of nine on price; you pay for the payout speed.
    // - rulesFairness 4.0: static drawdown, news allowed, weekend holding, no
    //   deadline; the 40% consistency score on the on-demand cycle and the
    //   7-profitable-day gate on the 95% cycle pull it back.
    // - payoutReliability 4.1: 1-hour processing after review is the fastest
    //   published here and it publishes payout proofs; capped by ~2 years of
    //   history and a 101-review base.
    // - support 3.8: 4.3/5 but on only 101 tracked reviews — too thin to score
    //   higher either way.
    // - platforms 4.6: five platforms including DXtrade and Match Trader.
    scores: {
      pricingValue: 3.5,
      rulesFairness: 4.0,
      payoutReliability: 4.1,
      support: 3.8,
      platforms: 4.6,
    },
  },

  'crypto-fund-trader': {
    trustpilotUrl: 'https://www.trustpilot.com/review/cryptofundtrader.com',
    // Official invite published on the cryptofundtrader.com homepage (Aug 2026).
    discordUrl: 'https://discord.gg/PFgzUEdrGA',
    pros: [
      'Trade the evaluation directly on Bybit through an API key — rare among prop firms',
      'No minimum trading days, and news trading is allowed on the standard programs',
      'The consistency rule applies only to Break Final Stage accounts, not the two-phase route',
      '900+ instruments spanning crypto, forex, indices, commodities and stocks',
      'Spain-based operator running since 2022 with $20M+ reported paid to traders',
    ],
    cons: [
      '$619 for a 100K two-phase account is the second-highest price in our tracked set',
      'Break Final Stage accounts carry a 40% best-day consistency check at reward time',
      'The Ascend evaluation blocks new positions 2 minutes either side of high-impact news',
      'Only 109 tracked reviews, and those include reports of cancelled rewards after risk review',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.2: 100K at $619 is second-dearest here; the $40 one-phase
    //   entry only softens the first rung.
    // - rulesFairness 4.0: no minimum trading days, news allowed, consistency
    //   scoped to a single product; Ascend's 2-minute news block and copy-trading
    //   ban deduct.
    // - payoutReliability 3.9: 15-day cycle (30-day alternative, 7-day add-on),
    //   crypto and bank rails, $20M+ reported paid; docked for reward-cancellation
    //   complaints in a thin review base.
    // - support 3.6: 4.1/5 over 109 reviews — the lowest score on the smallest
    //   base in this group.
    // - platforms 3.8: MT5 and Match-Trader plus the Bybit integration; no
    //   cTrader or TradeLocker.
    scores: {
      pricingValue: 3.2,
      rulesFairness: 4.0,
      payoutReliability: 3.9,
      support: 3.6,
      platforms: 3.8,
    },
  },

  'goat-funded-trader': {
    trustpilotUrl: 'https://www.trustpilot.com/review/goatfundedtrader.com',
    // Official invite published on the goatfundedtrader.com homepage (Aug 2026).
    discordUrl: 'https://discord.gg/ZRNesgBrtv',
    pros: [
      'Cheapest 100K 2-step in our tracked set at $263, with entries from $22',
      'News trading is allowed in both the challenge and funded stages',
      'EAs permitted, excluding HFT systems and gold-arbitrage bots',
      'Five platforms: MT5, cTrader, TradeLocker, MatchTrader and Volumetrica',
      'Payouts processed in 2 business days, backed by a $1,000 late-payment guarantee',
    ],
    cons: [
      '15% consistency cap blocks payout requests until your best day shrinks relative to total profit',
      'Profit from trades around high-impact news is capped at 1% of the starting balance',
      'Minimum trading days rose from 3 to 4 for accounts bought after 25 July 2026',
      'Per-payout ceilings by method ($4K crypto, $5K Skrill, $10K bank) and no partial withdrawals',
      'Bank transfer is only offered in eight African countries; everyone else needs Rise or crypto',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.7: $263 for a 100K 2-step GOAT is the lowest 100K price in
    //   our whole tracked table, and the ladder starts at $22.
    // - rulesFairness 3.5: news and EAs allowed, but a 15% consistency cap, a
    //   2-minute minimum trade duration, a 1% news profit cap and a mid-2026
    //   increase in minimum trading days stack up.
    // - payoutReliability 3.6: 2-business-day processing with a $1,000 guarantee,
    //   yet method-level payout ceilings, all-or-nothing withdrawals and a visible
    //   cluster of payout-denial complaints across 1,075 reviews cap it.
    // - support 3.9: 4.2/5 on the largest review base here plus a detailed,
    //   frequently updated public help centre.
    // - platforms 4.7: five platforms, including US-accessible options.
    scores: {
      pricingValue: 4.7,
      rulesFairness: 3.5,
      payoutReliability: 3.6,
      support: 3.9,
      platforms: 4.7,
    },
  },

  'alpha-capital-group': {
    trustpilotUrl: 'https://www.trustpilot.com/review/alphacapitalgroup.uk',
    // Official invite published on the alphacapitalgroup.uk homepage (Aug 2026).
    discordUrl: 'https://discord.com/invite/W5aKKmPRdR',
    pros: [
      'UK-based and running since 2021, with the strongest Trustpilot score in this group at 4.7',
      'Static maximum drawdown on Alpha Pro — 8% or 10% depending on the plan you pick',
      'On-demand performance fees processed within 2 business days via Rise, Wise or wire',
      'News trading is completely unrestricted during both evaluation phases',
      'Five platforms including TradingView connectivity and a dedicated Swing plan for weekend holds',
    ],
    cons: [
      '40% best-day rule gates every payout on Alpha Pro, Swing, One and Three (15% on Alpha Direct)',
      'EAs are limited to risk-management and trade-assist tools; fully automated strategies are banned outright',
      '10-minute news blackout on funded accounts — no opening or closing on the affected instrument',
      'A 2-minute average trade duration rule and per-account-size lot caps apply',
      'No entry below $97, and the 90% split is a paid add-on',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.7: $497 at 100K sits on the market median with no budget
    //   tier below $97.
    // - rulesFairness 3.3: the heaviest rulebook of the nine — 40% best-day gate,
    //   10-minute news blackout, 2-minute duration rule, lot caps, and EAs
    //   restricted to non-executing tools.
    // - payoutReliability 4.3: on-demand or bi-weekly, 2-business-day processing,
    //   four years of operation and a 4.7 Trustpilot score.
    // - support 4.4: 4.4/5 across 978 tracked reviews and by far the deepest
    //   public help centre in this set.
    // - platforms 4.5: MT5, cTrader, DXtrade, TradeLocker and TradingView, though
    //   EAs only work on MT5.
    scores: {
      pricingValue: 3.7,
      rulesFairness: 3.3,
      payoutReliability: 4.3,
      support: 4.4,
      platforms: 4.5,
    },
  },

  aquafunded: {
    trustpilotUrl: 'https://www.trustpilot.com/review/aquafunded.com',
    // Official invite published on the aquafunded.com homepage (Aug 2026).
    discordUrl: 'https://discord.com/invite/aquafunded',
    pros: [
      '90% profit split as standard, upgradable to 100% at checkout',
      'No consistency rule on the 2-Step Standard evaluation',
      'Static drawdown on 2-Step Standard: 5% daily, 8% maximum from the starting balance',
      'EAs and personal trade copiers are both permitted',
      '24-business-hour payout guarantee with a $100 minimum and a $1,000 penalty if missed',
    ],
    cons: [
      'Profit from trades around high-impact news is capped at just 0.5% of the starting balance',
      'Instant and Pro tiers add 15-25% consistency rules the Standard evaluation does not have',
      'First two payouts on 100K+ accounts are capped at $10,000 each',
      'Rise withdrawals carry a flat $35 fee, and payouts under $5,000 must go via crypto',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.6: $499 at 100K is exactly market-median and there is no
    //   entry below $99, but the 90% default split lifts effective value.
    // - rulesFairness 3.6: the 2-Step Standard is clean (static drawdown, 3 min
    //   days, no consistency rule); the 0.5% news profit cap is the tightest here
    //   and the Instant/Pro tiers reintroduce consistency caps.
    // - payoutReliability 3.7: 14-day cycle with a 24-business-hour guarantee, but
    //   $10K caps on the first two large-account payouts and under two years of
    //   operating history.
    // - support 3.8: 4.4/5 across 284 tracked reviews with a well-maintained help
    //   centre; volume is still modest.
    // - platforms 4.4: MatchTrader, TradeLocker, MT5 and cTrader.
    scores: {
      pricingValue: 3.6,
      rulesFairness: 3.6,
      payoutReliability: 3.7,
      support: 3.8,
      platforms: 4.4,
    },
  },

  'blue-guardian': {
    // Trustpilot lists this domain under a differently-worded business name —
    // flagged for human spot-check in firm-details.json.
    trustpilotUrl: 'https://www.trustpilot.com/review/blueguardian.com',
    // Official invite published on the blueguardian.com homepage (Aug 2026).
    discordUrl: 'https://discord.gg/blueguardian',
    pros: [
      '85% profit split by default on funded accounts, rising to 90% with an add-on',
      '2-Step Standard uses a static 8% maximum drawdown, not a trailing one',
      'EAs allowed, plus copy trading between accounts you legally own',
      'Nine account sizes from $5K to $400K, scaling to $4M through the scaling plan',
      '24-business-hour payout guarantee that pays an extra 10% profit share if missed',
    ],
    cons: [
      'Every payout carries a flat 2% processing fee',
      '5 profitable trading days required, and funded accounts are blocked 5 minutes either side of high-impact news',
      'Drawdown model changes between plans — 8% static on 2-Step Standard, 10% trailing on 2-Step Pro',
      'Guardian Shield auto-closes any funded trade at 2% floating loss, and margin above 80% counts as gambling',
      'First two payouts on $200K+ accounts are capped at $10,000 each',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.8: $464 at 100K is just under the median and the default
    //   split is 85% rather than the usual 80%.
    // - rulesFairness 3.2: lowest here — 5 profitable days, a 10-minute funded
    //   news blackout, a 2-minute minimum hold, an auto-close at 2% floating loss,
    //   an 80% margin gambling rule, a shared-device policy, and consistency caps
    //   on the Pro and Instant tiers.
    // - payoutReliability 3.4: fast 24-business-hour guarantee, but a flat 2% fee
    //   on every payout, $10K caps on the first two large payouts, and the weakest
    //   public Trustpilot score in the group at 3.9.
    // - support 3.5: 4.3/5 on our 211 tracked reviews against a materially lower
    //   3.9 public score; the help centre itself is thorough.
    // - platforms 4.0: MT5, Match Trader and TradeLocker (US clients limited to
    //   the latter two).
    scores: {
      pricingValue: 3.8,
      rulesFairness: 3.2,
      payoutReliability: 3.4,
      support: 3.5,
      platforms: 4.0,
    },
  },

  'maven-trading': {
    trustpilotUrl: 'https://www.trustpilot.com/review/maventrading.com',
    // Official invite published on the maventrading.com homepage (Aug 2026).
    discordUrl: 'https://discord.gg/maven',
    pros: [
      'Cheapest entry in this group at $15, with a 100K 1-step at $395',
      'Static 8% maximum loss with a 4% daily limit on the flagship 2-step',
      '24 tracked programs — 1-step, 2-step, 3-step, instant and mini across $2K to $100K',
      'Zero swap fees on all accounts, and the challenge fee is refunded on your third withdrawal',
    ],
    cons: [
      'EAs are not permitted under any circumstances, on any platform',
      'Payouts require a scheduled video interview, and a no-show voids the payout',
      'No opening or closing trades 2 minutes either side of red-folder news (instant accounts exempt)',
      'cTrader is the only platform — no MT5, TradeLocker or Match Trader',
      'Instant accounts need a 20% consistency score before any withdrawal',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 4.5: $15 entry and $395 at 100K make this one of the two
    //   cheapest routes to size here; only Goat is cheaper at 100K.
    // - rulesFairness 2.9: the lowest score we have assigned in this round. A
    //   blanket EA ban, a 2-minute news blackout, 3 profitable days per phase, a
    //   20% consistency score on instant, and a mandatory payout interview are
    //   collectively the most restrictive package of the nine.
    // - payoutReliability 3.3: a 10-business-day cycle and a fee refund on the
    //   third withdrawal are good, but gating payouts behind an interview — with
    //   the account reset to starting balance afterwards — is a real risk.
    // - support 3.8: 4.2/5 across 763 tracked reviews; the firm has publicly
    //   stepped back from monitoring its own Trustpilot page.
    // - platforms 3.0: cTrader only, the narrowest choice of the nine.
    scores: {
      pricingValue: 4.5,
      rulesFairness: 2.9,
      payoutReliability: 3.3,
      support: 3.8,
      platforms: 3.0,
    },
  },

  fundedelite: {
    trustpilotUrl: 'https://www.trustpilot.com/review/fundedelite.com',
    // Official invite published in the fundedelite.com footer (Aug 2026).
    discordUrl: 'https://discord.gg/MDYKHSxc5Z',
    pros: [
      'Configure the challenge yourself: max loss 5-10%, phase-1 target 6-12%, split 60-95%, leverage 1:30-1:100',
      'A breached phase issues a free retry automatically on the 2-Step + Free Retry challenge',
      'No consistency rule on the 2-step, and news trading is allowed',
      'Choose your payout interval at checkout — 3, 7, 14 or 21 days',
      'Static drawdown on the 2-step, with optional scalping and weekend-trading add-ons',
    ],
    cons: [
      'EAs may only assist a manual strategy — automated, martingale and grid systems are prohibited',
      'The first payout is always 21 days out regardless of the interval you selected',
      'Crypto withdrawals are capped at $500 gross per cycle, pushing larger payouts onto Rise',
      'Second-chance accounts drop to a 50% split, and instant accounts start at 70%',
      'At $750 a 100K 2-step is the most expensive in our tracked set, and the fee moves with every option',
    ],
    // Draft editorial rationale (Aug 2026):
    // - pricingValue 3.0: lowest here. The $19 headline is a Lite entry; a 100K
    //   2-step is $750, dearest in our whole table, and configurability makes the
    //   real cost hard to compare.
    // - rulesFairness 3.7: no consistency rule on the 2-step, news allowed, free
    //   retry on a breach and a published "no hidden rules" commitment; docked for
    //   the EA restriction, a 3-minute minimum hold and a funded-stage rule capping
    //   risk at 50% of the daily loss limit per instrument.
    // - payoutReliability 3.5: interval is selectable down to 3 days, but the
    //   21-day first payout and the $500 crypto cap per cycle blunt that, and the
    //   firm is under two years old.
    // - support 3.9: 4.3/5 across 180 tracked reviews with an unusually detailed
    //   public FAQ; small base.
    // - platforms 3.4: MetaTrader 5 and TradeLocker only.
    scores: {
      pricingValue: 3.0,
      rulesFairness: 3.7,
      payoutReliability: 3.5,
      support: 3.9,
      platforms: 3.4,
    },
  },
}

console.log('[seed-remaining-editorial] starting…')
try {
  const payload = await getPayload({ config })

  for (const [slug, editorial] of Object.entries(EDITORIAL)) {
    const firm = (
      await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
    ).docs[0]
    if (!firm) {
      console.warn(`[seed-remaining-editorial] ${slug}: firm not found — skipped`)
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
    console.log(`[seed-remaining-editorial] ${slug}: ${notes.join(', ')}`)
  }

  console.log('[seed-remaining-editorial] done')
  process.exit(0)
} catch (err) {
  console.error('[seed-remaining-editorial] FAILED:', err)
  process.exit(1)
}
