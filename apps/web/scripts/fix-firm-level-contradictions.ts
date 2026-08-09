/**
 * Correct firm-level fields that contradict the firm's own challenge rows.
 *
 * Once the pricing audits filled 413 challenge rows, the firm-level summary
 * could be checked against them for the first time, and several disagreed. A
 * profile that says "static" in its rules section while its own pricing table
 * lists trailing rows is worse than one that says nothing: the reader cannot
 * tell which to believe, and the summary is the part they will skim.
 *
 * Two classes of error, both flattering to the firm, which is the direction
 * that should worry us.
 *
 * ── 1. A single drawdown type where the firm runs several ────────────────────
 * `hybrid` exists for exactly this. Each of these firms sells programs on
 * different models, so naming one of them sitewide told the reader their
 * position was safer, or riskier, than it is.
 *
 * ── 2. A scaling ceiling recorded as the base split ──────────────────────────
 * FundingPips was stored at 100%, which no program it sells starts at. That is
 * the top of the scaling ladder, and `payout.splitScaling` already exists to
 * describe growth. It was rendering "100%" in the ranked table beside every
 * other firm's 80%, which is a straightforwardly better offer than the one on
 * sale.
 *
 * Deliberately NOT changed: FundedElite's 95%. Its split is selectable at
 * checkout across 60/70/80/95, so the "base" depends on whether our table means
 * the cheapest configuration or the headline one. That is an editorial call for
 * Ayub, not a data fix, and it is recorded here so it is not quietly decided.
 *
 * Rerunnable. Run:
 *   corepack pnpm --filter web exec payload run scripts/fix-firm-level-contradictions.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Fix = { slug: string; drawdownType?: 'hybrid'; profitSplitPct?: number; why: string }

const FIXES: Fix[] = [
  {
    slug: 'brightfunded',
    drawdownType: 'hybrid',
    why: 'was trailing-eod, but no current program uses an EOD trailing max drawdown: 1-Step is intraday trailing, both 2-Step ladders are static',
  },
  {
    slug: 'funding-pips',
    drawdownType: 'hybrid',
    profitSplitPct: 80,
    why: 'was static with intraday-trailing rows in its own table (Zero); split was 100, the scaling ceiling, against bases of 80 Pro, 85 Flex, 95 Zero',
  },
  {
    slug: 'goat-funded-trader',
    drawdownType: 'hybrid',
    why: 'was static, but its table carries static, trailing-eod and trailing-intraday rows across eight programs',
  },
  {
    slug: 'hola-prime',
    drawdownType: 'hybrid',
    why: 'was static, but Direct Accounts are trailing-eod',
  },
  {
    slug: 'maven-trading',
    drawdownType: 'hybrid',
    why: 'was static, but Instant, Mini and Buy Now Pay Later all trail on equity',
  },
  {
    slug: 'fundedelite',
    drawdownType: 'hybrid',
    why: 'was static, true only of 1-Step, 2-Step and the LITE families: INSTANT trails, Catalyst is intraday trailing on equity, and Flash Activation flips static to trailing at funding',
  },
]

const payload = await getPayload({ config })

let changed = 0
const missing: string[] = []

try {
  for (const fix of FIXES) {
    const { docs } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: fix.slug } },
      limit: 1,
      depth: 0,
    })
    const firm = docs[0]
    if (!firm) {
      missing.push(fix.slug)
      continue
    }

    const data: Record<string, unknown> = {}
    if (fix.drawdownType) {
      data.rulesSummary = { ...(firm.rulesSummary ?? {}), drawdownType: fix.drawdownType }
    }
    if (fix.profitSplitPct != null) {
      data.payout = { ...(firm.payout ?? {}), profitSplitPct: fix.profitSplitPct }
    }

    await payload.update({ collection: 'firms', id: firm.id, data })
    changed += 1
    console.log(`  ${fix.slug.padEnd(22)} ${fix.why}`)
  }

  console.log(`\nCorrected ${changed} firms.`)
  if (missing.length) console.warn(`Not found: ${missing.join(', ')}`)
} catch (err) {
  console.error('fix-firm-level-contradictions failed:', err)
  process.exit(1)
}

process.exit(0)
