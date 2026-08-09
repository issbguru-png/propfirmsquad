/**
 * Import challenge rows from firm-audits/pricing/*.json.
 *
 * A second audit round covering only the pricing table, for the firms whose
 * rows carried a name, a size and a price and nothing else: no drawdown, no
 * targets, no split. The first round's per-firm briefs prioritised firm-level
 * fields and never mentioned the challenge rows, so those columns rendered as
 * dashes across nine firms.
 *
 * ── GUARDS, SAME AS THE MAIN IMPORT ──────────────────────────────────────────
 * - A row needs BOTH a price and an accountSize. A pricing table with blank
 *   prices is worse than a short one, and one firm's pricing pages 404 outright.
 * - A firm's existing rows are replaced ONLY when the audit produced at least
 *   one usable row. Where an audit produced none, the stale rows are still the
 *   best we have, and wiping them would turn an old price into no price.
 * - `steps` arrives as either the enum ("2-step") or an integer (2). Both are
 *   reasonable readings of the field name, so both are accepted.
 *
 * ── WHY REPLACEMENT RATHER THAN MERGE ────────────────────────────────────────
 * These audits found several firms had restructured their product lines since
 * our seed. BrightFunded relaunched on 13 April 2026 and split one 2-Step into
 * two separately priced programs, so our six stored rows match neither current
 * ladder: they are discontinued prices. Merging by name would have kept them
 * alongside the new ones and published a table half of which cannot be bought.
 *
 * Run with DRY=1 to preview.
 *   DRY=1 corepack pnpm --filter web exec payload run scripts/import-pricing.ts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'

const DIR = '/Users/warissalmanshah/Desktop/PF/propfirmmatch-seo-data/firm-audits/pricing'
const DRY = process.env.DRY === '1'

const isBlank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')

function normaliseSteps(v: unknown): 'instant' | '1-step' | '2-step' | '3-step' {
  if (typeof v === 'string' && ['instant', '1-step', '2-step', '3-step'].includes(v)) {
    return v as 'instant' | '1-step' | '2-step' | '3-step'
  }
  const n = Number(v)
  if (n === 0) return 'instant'
  if (n === 2) return '2-step'
  if (n === 3) return '3-step'
  return '1-step'
}

type Row = Record<string, unknown>

const payload = await getPayload({ config })

let firmsTouched = 0
let rowsWritten = 0
const skipped: string[] = []

try {
  if (!existsSync(DIR)) {
    console.error(`No pricing directory at ${DIR}`)
    process.exit(1)
  }
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  for (const file of files.sort()) {
    const audit = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as {
      slug: string
      challenges?: Row[] | null
    }

    const { docs } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: audit.slug } },
      limit: 1,
      depth: 0,
    })
    const firm = docs[0]
    if (!firm) {
      skipped.push(`${audit.slug}: no such firm`)
      continue
    }

    const all = audit.challenges ?? []
    const rows = all.filter((c) => c && !isBlank(c.price) && !isBlank(c.accountSize))
    const dropped = all.length - rows.length

    if (rows.length === 0) {
      skipped.push(
        `${audit.slug}: 0 of ${all.length} rows usable, existing rows kept${dropped ? ' (no price or size)' : ''}`,
      )
      console.log(`  ${audit.slug.padEnd(22)} no usable rows, left alone`)
      continue
    }
    if (dropped > 0) skipped.push(`${audit.slug}: ${dropped} rows dropped, no price or size`)

    const existing = await payload.find({
      collection: 'challenges',
      where: { firm: { equals: firm.id } },
      limit: 500,
      depth: 0,
    })

    // Never shrink a pricing table. FundedElite is the case in point: its
    // marketing pages publish rules but no numbers, and its checkout builds the
    // API host at runtime, so the audit could only price 4 of 12 rows. Replacing
    // would drop the firm from ten listings to four. Instead, enrich the rows we
    // already have with the drawdown, targets and split the audit did establish,
    // and leave their prices alone. The prices stay unverified either way, and
    // this task was about the empty columns.
    if (rows.length < existing.docs.length) {
      let enriched = 0
      // Enrich from EVERY audit row, not just the priced ones. A price is
      // required to create a row; it is irrelevant to filling in a drawdown.
      // FundedElite's only priced rows are Flash Activation, while the rows
      // that match our table are the unpriced ones carrying the rules.
      const isLite = (s: string) => /lite/i.test(s)
      for (const c of all) {
        if (isBlank(c.accountSize)) continue
        const match = existing.docs.find(
          (e) =>
            e.accountSize === Number(c.accountSize) &&
            e.steps === normaliseSteps(c.steps) &&
            // Both firms run a LITE line alongside the standard one at the same
            // size and step count, so the tier has to agree or the cheaper
            // product's limits land on the dearer one.
            isLite(e.name ?? '') === isLite(String(c.name ?? '')),
        )
        if (!match) continue
        if (!DRY) {
          const targets = Array.isArray(c.profitTargets) ? c.profitTargets : []
          await payload.update({
            collection: 'challenges',
            id: match.id,
            data: {
              profitTargets: targets.map((t: Record<string, unknown>) => ({
                phase: Number(t.phase ?? 1),
                targetPct: t.targetPct == null ? null : Number(t.targetPct),
                targetAmount: t.targetAmount == null ? null : Number(t.targetAmount),
              })),
              maxDailyLossPct: c.maxDailyLossPct == null ? null : Number(c.maxDailyLossPct),
              maxTotalDrawdownPct:
                c.maxTotalDrawdownPct == null ? null : Number(c.maxTotalDrawdownPct),
              drawdownType:
                (c.drawdownType as 'static' | 'trailing-eod' | 'trailing-intraday' | null) ?? null,
              profitSplitPct: c.profitSplitPct == null ? null : Number(c.profitSplitPct),
              feeNote: (c.feeNote as string) ?? match.feeNote ?? null,
            },
          })
        }
        enriched += 1
      }
      firmsTouched += 1
      rowsWritten += enriched
      skipped.push(
        `${audit.slug}: enriched ${enriched} of ${existing.docs.length} existing rows rather than shrink to ${rows.length}`,
      )
      console.log(`  ${audit.slug.padEnd(22)} enriched ${enriched}/${existing.docs.length} in place`)
      continue
    }

    if (!DRY) {
      for (const old of existing.docs) {
        await payload.delete({ collection: 'challenges', id: old.id })
      }
      for (const c of rows) {
        const targets = Array.isArray(c.profitTargets) ? c.profitTargets : []
        await payload.create({
          collection: 'challenges',
          data: {
            firm: firm.id,
            name: String(c.name ?? `${audit.slug} ${c.accountSize}`),
            steps: normaliseSteps(c.steps),
            accountSize: Number(c.accountSize),
            price: Number(c.price),
            currency: (c.currency as string) ?? 'USD',
            profitTargets: targets.map((t: Record<string, unknown>) => ({
              phase: Number(t.phase ?? 1),
              targetPct: t.targetPct == null ? null : Number(t.targetPct),
              targetAmount: t.targetAmount == null ? null : Number(t.targetAmount),
            })),
            maxDailyLossPct: c.maxDailyLossPct == null ? null : Number(c.maxDailyLossPct),
            maxDailyLossAmount: c.maxDailyLossAmount == null ? null : Number(c.maxDailyLossAmount),
            maxTotalDrawdownPct:
              c.maxTotalDrawdownPct == null ? null : Number(c.maxTotalDrawdownPct),
            maxTotalDrawdownAmount:
              c.maxTotalDrawdownAmount == null ? null : Number(c.maxTotalDrawdownAmount),
            drawdownType:
              (c.drawdownType as
                | 'static'
                | 'trailing-eod'
                | 'trailing-intraday'
                | null
                | undefined) ?? null,
            profitSplitPct: c.profitSplitPct == null ? null : Number(c.profitSplitPct),
            timeLimitDays: c.timeLimitDays == null ? null : Number(c.timeLimitDays),
            refundableFee: c.refundableFee === true,
            feeNote: (c.feeNote as string) ?? null,
            isActive: true,
          },
        })
      }
    }

    firmsTouched += 1
    rowsWritten += rows.length
    console.log(
      `  ${audit.slug.padEnd(22)} ${existing.docs.length} old -> ${rows.length} new${dropped ? ` (${dropped} dropped)` : ''}`,
    )
  }

  console.log(`\n${DRY ? 'DRY RUN. ' : ''}${firmsTouched} firms, ${rowsWritten} rows.`)
  if (skipped.length) {
    console.log(`\n${skipped.length} notes:`)
    for (const s of skipped) console.log(`  ${s}`)
  }
} catch (err) {
  console.error('import-pricing failed:', err)
  process.exit(1)
}

process.exit(0)
