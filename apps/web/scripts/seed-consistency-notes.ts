/**
 * Per-program consistency rules, written from the 2026-08-09 firm audits.
 *
 * ── WHY THIS FILE EXISTS ─────────────────────────────────────────────────────
 * `rulesSummary.consistencyRulePct` holds one number, and the audit found that
 * one number is the wrong shape for this rule. Of the six firms whose rule we
 * verified at source, exactly ONE has a simple "no consistency rule" answer.
 * The other five vary by program, or apply the cap only once funded, which is
 * precisely when it can cost a trader a payout they have already earned.
 *
 * Leaving the percentage empty renders "None", which is both wrong and
 * flattering to the firm, so each of these carries an explicit note instead.
 * Every line below is the firm's own published position, from the audit files
 * in propfirmmatch-seo-data/firm-audits/.
 *
 * Rerunnable. Run:
 *   corepack pnpm --filter web exec payload run scripts/seed-consistency-notes.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

/** slug -> the note, or null where "None" is genuinely the whole answer. */
const NOTES: Record<string, string | null> = {
  // Verified as having no consistency rule at all. The only one.
  brightfunded: null,

  'blue-guardian':
    '25% on 2-Step Pro, and only on the funded account, not during either challenge phase. 2-Step Standard has none.',
  tradeify:
    'Varies by plan: 35% on Growth once funded, 40% on Select during evaluation only, and 20% rising to 30% by payout number on Lightning. The "no consistency once funded" headline is true on Select alone.',
  'e8-markets':
    'None during the Challenge stage on any account, and none for E8 Pro or E8 Zero when funded. E8 One in Performance is subject to Payout on Demand rules, a 40% best-day cap on total profit.',
  'atmos-funded':
    '20% of payout-period profit on Instant Funded accounts only. Nova is advertised with no consistency rule.',
  'crypto-fund-trader':
    'None on the 1-Phase, 2-Phase, Ascend and Instant programs. A 40% single-day cap applies only to Break Final Stage payout requests.',
  ftmo: 'Best Day Rule: your single best day must stay under 50% of the profit from all positive days.',
}

const payload = await getPayload({ config })

let updated = 0
const missing: string[] = []

try {
  for (const [slug, note] of Object.entries(NOTES)) {
    const { docs } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const firm = docs[0]
    if (!firm) {
      missing.push(slug)
      continue
    }
    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: {
        rulesSummary: {
          ...(firm.rulesSummary ?? {}),
          consistencyRuleNote: note,
          consistencyRuleVerified: true,
        },
      },
    })
    updated += 1
    console.log(`  ${slug.padEnd(22)} ${note ? note.slice(0, 62) + '...' : 'None (no rule)'}`)
  }
  console.log(`\nUpdated ${updated}.`)
  if (missing.length) console.warn(`Not found: ${missing.join(', ')}`)
} catch (err) {
  console.error('seed-consistency-notes failed:', err)
  process.exit(1)
}

process.exit(0)
