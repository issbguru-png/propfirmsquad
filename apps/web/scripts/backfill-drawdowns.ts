/**
 * Backfill per-challenge drawdown limits for FTMO and FundedNext.
 *
 * ── WHY THESE ROWS WERE EMPTY ────────────────────────────────────────────────
 * Nine firms have challenge rows with no drawdown data, and they are exactly
 * the nine whose 2026-08 audits produced no importable challenge rows. Their
 * pricing tables are still the original seed, which carried name, size, price
 * and steps but never the limits. The audits filled the firm-level
 * `rulesSummary` instead, so the profile could say "static" while every row in
 * the pricing table showed a dash.
 *
 * That was a briefing mistake on my part: the per-firm gap lists prioritised
 * firm-level fields and never told the auditors that challenge rows were thin.
 *
 * ── SOURCES, BOTH READ 2026-08-09 ────────────────────────────────────────────
 * FTMO        https://ftmo.com/en/trading-objectives/
 * FundedNext  https://fundednext.com/general-rules
 *
 * Every number below is quoted from those pages. Nothing is inferred from an
 * aggregator, and nothing is interpolated across account sizes: both firms
 * publish the limits as percentages that apply to every size in a program.
 *
 * ── ONE DELIBERATE NULL ──────────────────────────────────────────────────────
 * Stellar Instant's max loss is published as "6% (Trailing)" with no statement
 * of whether it trails end-of-day or intraday. Our enum has to pick one, and
 * the difference decides whether an open position can breach you, so the
 * percentages are written and `drawdownType` is left null rather than guessed.
 *
 * Rerunnable: matches rows by name, writes only the drawdown fields.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/backfill-drawdowns.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Limits = {
  /** null = the firm publishes no daily loss limit for this program. */
  daily: number | null
  total: number
  type: 'static' | 'trailing-eod' | 'trailing-intraday' | null
  /** Percent target per phase, in order. Empty = the program has no target. */
  targets: number[]
  /** Base split. Both firms scale higher; the scaling lives on the firm. */
  split: number
  /** Only where the row needs an explanation the columns cannot carry. */
  note?: string
}

/**
 * Ordered rules. First match wins, so the most specific program name must come
 * first: "Stellar Lite 2-Step" is stored with steps `2-step` but carries the
 * Lite limits, and matching on steps alone would give it the wrong numbers.
 */
const RULES: Record<string, { match: (name: string, steps: string) => boolean; limits: Limits }[]> =
  {
    ftmo: [
      // "Maximum Daily Loss 3%", "Maximum Loss 10%", end-of-day trailing.
      {
        match: (_n, s) => s === '1-step',
        limits: { daily: 3, total: 10, type: 'trailing-eod', targets: [10], split: 80 },
      },
      // "Maximum Daily Loss 5%", "Maximum Loss 10%", static across both phases.
      // Covers Standard and Swing alike: Swing differs on leverage and weekend
      // holding, not on the loss limits.
      {
        // "10% for the FTMO Challenge", "5% for the Verification".
        match: (_n, s) => s === '2-step',
        limits: { daily: 5, total: 10, type: 'static', targets: [10, 5], split: 80 },
      },
    ],
    fundednext: [
      // "Stellar Lite: 4% of initial balance" daily, "8% (Static)" overall.
      {
        // "8% Phase 1 -> 4% Phase 2".
        match: (n) => /lite/i.test(n),
        limits: { daily: 4, total: 8, type: 'static', targets: [8, 4], split: 80 },
      },
      // "Stellar Instant: No daily loss limit", "6% (Trailing)". See header note.
      {
        // "No profit target, FundedNext account from day one." An empty target
        // list renders as a dash, which understates a genuine selling point,
        // so the verified fact goes in the note instead.
        match: (n) => /instant/i.test(n),
        limits: {
          daily: null,
          total: 6,
          type: null,
          targets: [],
          split: 80,
          note: 'No profit target: funded from day one. Maximum loss is 6% trailing.',
        },
      },
      // "Stellar 1-Step: 3% of initial balance" daily, "6% (Static)" overall.
      {
        match: (n) => /1-step/i.test(n),
        limits: { daily: 3, total: 6, type: 'static', targets: [10], split: 80 },
      },
      // "Stellar 2-Step: 5% of initial balance" daily, "10% (Static)" overall.
      {
        // "8% Phase 1 -> 5% Phase 2".
        match: (n) => /2-step/i.test(n),
        limits: { daily: 5, total: 10, type: 'static', targets: [8, 5], split: 80 },
      },
    ],
  }

const payload = await getPayload({ config })

let written = 0
const unmatched: string[] = []

try {
  for (const [slug, rules] of Object.entries(RULES)) {
    const { docs: firms } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const firm = firms[0]
    if (!firm) {
      unmatched.push(`${slug} (firm not found)`)
      continue
    }

    const { docs: challenges } = await payload.find({
      collection: 'challenges',
      where: { firm: { equals: firm.id } },
      limit: 200,
      depth: 0,
    })

    for (const c of challenges) {
      const hit = rules.find((r) => r.match(c.name ?? '', c.steps ?? ''))
      if (!hit) {
        unmatched.push(`${slug}: ${c.name}`)
        continue
      }
      await payload.update({
        collection: 'challenges',
        id: c.id,
        data: {
          maxDailyLossPct: hit.limits.daily,
          maxTotalDrawdownPct: hit.limits.total,
          drawdownType: hit.limits.type,
          profitTargets: hit.limits.targets.map((pct, i) => ({ phase: i + 1, targetPct: pct })),
          profitSplitPct: hit.limits.split,
          ...(hit.limits.note ? { feeNote: hit.limits.note } : {}),
        },
      })
      written += 1
    }

    console.log(`  ${slug.padEnd(12)} ${challenges.length} rows`)
  }

  console.log(`\nWrote drawdown limits to ${written} challenge rows.`)
  if (unmatched.length) {
    console.warn(`\nNo rule matched ${unmatched.length} rows, left untouched:`)
    for (const u of unmatched) console.warn(`  ${u}`)
  }
} catch (err) {
  console.error('backfill-drawdowns failed:', err)
  process.exit(1)
}

process.exit(0)
