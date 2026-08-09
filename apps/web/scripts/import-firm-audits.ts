/**
 * Import the 20 per-firm audits from propfirmmatch-seo-data/firm-audits/*.json.
 *
 * ── THE ONE RULE THAT MATTERS ────────────────────────────────────────────────
 * A null in these files means two different things, and conflating them would
 * publish falsehoods in both directions:
 *
 *   null AND listed in `needsVerification`  =  "we could not find this"
 *       -> leave whatever the database already holds. Never clear it.
 *
 *   null AND NOT listed in `needsVerification`  =  "we checked; there is none"
 *       -> write the null. This is how a WRONG stored value gets cleared, and
 *          several needed clearing: Blue Guardian's consistencyRulePct of 15
 *          (real answer: 25 on Pro funded only, none on Standard) and
 *          Tradeify's 40 (real answer: 35 / 40-eval-only / 20-to-30 scaling).
 *
 * Everything else is additive: a non-null audit value overwrites, a field the
 * audit does not mention is untouched.
 *
 * ── OTHER GUARDS ─────────────────────────────────────────────────────────────
 * - Payout totals and registration numbers travel with their date and source or
 *   they are dropped here, because `enforceClaimSourcing` would reject the save
 *   anyway and a rejected save loses the whole firm's update.
 * - Challenges without both a price and an accountSize are skipped. Blue
 *   Guardian's two rows have verified rule data but no prices (its per-product
 *   pricing page 404s), and a priced table with blank prices is worse than a
 *   shorter one.
 * - `scores` and `verdict` are never touched: those are Ayub's editorial
 *   judgement, and no audit was allowed near them.
 *
 * Run with --dry to preview. Run with no flag to write.
 *   corepack pnpm --filter web exec payload run scripts/import-firm-audits.ts --dry
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { getPayload } from 'payload'
import config from '@payload-config'

const AUDIT_DIR = '/Users/warissalmanshah/Desktop/PF/propfirmmatch-seo-data/firm-audits'
// `payload run` does not forward script flags to process.argv reliably, and a
// --dry that silently writes is worse than no --dry at all. Env var it is.
const DRY = process.env.DRY === '1'

/**
 * Normalise a commissions row onto our enum.
 *
 * Futures firms quote per contract (ES, NQ, MES, CL, GC) rather than per asset
 * class, and one firm quoted a single figure for every contract. Rather than
 * invent asset classes or drop the data, map the contract to its real
 * underlying and keep the contract name in the human-readable cost string, so
 * nothing a trader needs is lost. Returns null when a row cannot be mapped
 * honestly, and the caller logs it rather than guessing.
 */
const CONTRACT_TO_ASSET: Record<string, string> = {
  ES: 'indices',
  NQ: 'indices',
  MES: 'indices',
  MNQ: 'indices',
  YM: 'indices',
  RTY: 'indices',
  CL: 'energy',
  NG: 'energy',
  GC: 'metals',
  SI: 'metals',
}

/**
 * `steps` is a select, not a count, and the audits split roughly evenly between
 * writing the enum value ("2-step") and the integer (2). Both are legitimate
 * readings of the field name, so accept either. 0 means instant funding.
 */
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

function normaliseCommission(
  row: { asset?: unknown; cost?: unknown },
  slug: string,
): { asset: string; cost: string } | null {
  const rawAsset = typeof row.asset === 'string' ? row.asset.trim() : ''
  const cost = row.cost == null ? '' : String(row.cost).trim()
  if (!cost) return null

  const VALID = new Set([
    'all',
    'fx',
    'indices',
    'metals',
    'energy',
    'crypto',
    'stocks',
    'other-commodities',
  ])
  if (VALID.has(rawAsset)) return { asset: rawAsset, cost }

  // "ES (E-mini S&P 500)" -> indices, keeping the contract in the cost text.
  const ticker = rawAsset.match(/^([A-Z]{1,3})\b/)?.[1]
  if (ticker && CONTRACT_TO_ASSET[ticker]) {
    const money = /^[\d.]+$/.test(cost) ? `$${cost} round turn` : cost
    return { asset: CONTRACT_TO_ASSET[ticker], cost: `${money} (${rawAsset})` }
  }

  // A firm-wide futures commission: the cost text already says which contract
  // size it applies to, so "all" is accurate and no asset class is invented.
  if (rawAsset === 'other' && /contract/i.test(cost)) return { asset: 'all', cost }

  console.warn(`  ! ${slug}: unmappable commission asset ${JSON.stringify(rawAsset)}, row dropped`)
  return null
}

type Audit = {
  slug: string
  identity?: Record<string, unknown>
  legalEntity?: Record<string, unknown>
  leadership?: Record<string, unknown>
  trading?: Record<string, unknown>
  paymentMethods?: string[] | null
  payout?: Record<string, unknown>
  rulesSummary?: Record<string, unknown>
  challenges?: Record<string, unknown>[] | null
  prosCons?: { pros?: string[] | null; cons?: string[] | null } | null
  timeLimitsVerified?: boolean
  needsVerification?: string[] | null
  notes?: string
}

const isBlank = (v: unknown) => v == null || (typeof v === 'string' && v.trim() === '')

/**
 * Build the patch for one field group, honouring the null-means-two-things rule.
 * `prefix` is the dotted path the audit uses in `needsVerification`.
 */
function groupPatch(
  src: Record<string, unknown> | null | undefined,
  prefix: string,
  unresearched: Set<string>,
  allowed: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (!src) return out
  for (const key of allowed) {
    if (!(key in src)) continue
    const value = src[key]
    // A null we could not research is a gap: leave the stored value alone.
    // A null we DID research is a finding: write it, clearing any wrong value.
    if (value == null && unresearched.has(`${prefix}${key}`)) continue
    out[key] = value
  }
  return out
}

const payload = await getPayload({ config })

const files = readdirSync(AUDIT_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
let firmsUpdated = 0
let challengesWritten = 0
const skipped: string[] = []
const cleared: string[] = []

try {
  for (const file of files.sort()) {
    const audit: Audit = JSON.parse(readFileSync(join(AUDIT_DIR, file), 'utf8'))
    const { docs } = await payload.find({
      collection: 'firms',
      where: { slug: { equals: audit.slug } },
      limit: 1,
      depth: 0,
    })
    const firm = docs[0]
    if (!firm) {
      skipped.push(`${audit.slug} (no such firm)`)
      continue
    }

    // `needsVerification` uses several prefixes across the files; normalise so
    // "rules.eaAllowed" and "rulesSummary.eaAllowed" both match.
    const unresearched = new Set(
      (audit.needsVerification ?? []).flatMap((p) => [
        p,
        p.replace(/^rules\./, 'rulesSummary.'),
        p.replace(/^rulesSummary\./, 'rules.'),
      ]),
    )

    const data: Record<string, unknown> = {}

    const identity = groupPatch(audit.identity, 'identity.', unresearched, [
      'dateEstablished',
      'country',
      'currency',
      'websiteUrl',
      'trustpilotUrl',
      'discordUrl',
      'maxAllocation',
      'programTypes',
      'assets',
    ])
    Object.assign(data, identity)

    const rules = groupPatch(audit.rulesSummary, 'rulesSummary.', unresearched, [
      'drawdownType',
      'consistencyRulePct',
      'minTradingDays',
      'newsTradingAllowed',
      'eaAllowed',
      'copyTradingAllowed',
      'hftAllowed',
      'weekendHolding',
    ])
    if (audit.timeLimitsVerified != null) rules.timeLimitsVerified = audit.timeLimitsVerified
    // "No consistency rule" is only publishable when the auditor actually
    // checked. `consistencyRulePct` absent from needsVerification means they
    // did, whether the answer was a number or none.
    if ('consistencyRulePct' in (audit.rulesSummary ?? {})) {
      rules.consistencyRuleVerified =
        !unresearched.has('rulesSummary.consistencyRulePct') &&
        !unresearched.has('rules.consistencyRulePct')
    }
    if (Object.keys(rules).length) data.rulesSummary = { ...(firm.rulesSummary ?? {}), ...rules }

    const payoutPatch = groupPatch(audit.payout, 'payout.', unresearched, [
      'methods',
      'frequency',
      'profitSplitPct',
      'firstPayoutDays',
      'minPayoutAmount',
      'splitScaling',
    ])
    // A claimed payout total only travels with its date and source.
    const p = audit.payout ?? {}
    if (!isBlank(p.totalPaidClaimed) && !isBlank(p.totalPaidClaimedAt) && !isBlank(p.totalPaidSourceUrl)) {
      payoutPatch.totalPaidClaimed = p.totalPaidClaimed
      payoutPatch.totalPaidClaimedAt = p.totalPaidClaimedAt
      payoutPatch.totalPaidSourceUrl = p.totalPaidSourceUrl
    } else if (!isBlank(p.totalPaidClaimed)) {
      skipped.push(`${audit.slug}: payout total dropped, missing date or source`)
    }
    if (Object.keys(payoutPatch).length) data.payout = { ...(firm.payout ?? {}), ...payoutPatch }

    const entity = groupPatch(audit.legalEntity, 'legalEntity.', unresearched, [
      'name',
      'registry',
      'jurisdiction',
      'sourceUrl',
    ])
    const le = audit.legalEntity ?? {}
    if (!isBlank(le.registrationNumber) && !isBlank(le.sourceUrl)) {
      entity.registrationNumber = le.registrationNumber
    } else if (!isBlank(le.registrationNumber)) {
      skipped.push(`${audit.slug}: registration number dropped, no registry sourceUrl`)
    }
    if (Object.keys(entity).length) data.legalEntity = { ...(firm.legalEntity ?? {}), ...entity }

    const leadership = groupPatch(audit.leadership, 'leadership.', unresearched, [
      'ceoName',
      'ceoRole',
      'ceoLinkedinUrl',
    ])
    if (Object.keys(leadership).length)
      data.leadership = { ...(firm.leadership ?? {}), ...leadership }

    const trading: Record<string, unknown> = {}
    const t = audit.trading ?? {}
    if (!isBlank(t.broker)) trading.broker = t.broker
    if (Array.isArray(t.leverage) && t.leverage.length) trading.leverage = t.leverage
    if (Array.isArray(t.commissions) && t.commissions.length) {
      const rows = t.commissions
        .map((c) => normaliseCommission(c as Record<string, unknown>, audit.slug))
        .filter((c): c is { asset: string; cost: string } => c !== null)
      if (rows.length) trading.commissions = rows
    }
    if (Object.keys(trading).length) data.trading = { ...(firm.trading ?? {}), ...trading }

    if (Array.isArray(audit.paymentMethods) && audit.paymentMethods.length) {
      data.paymentMethods = audit.paymentMethods
    }

    const pros = audit.prosCons?.pros ?? []
    const cons = audit.prosCons?.cons ?? []
    if (pros.length || cons.length) {
      data.prosCons = {
        pros: pros.map((text) => ({ text })),
        cons: cons.map((text) => ({ text })),
      }
    }

    // Report the deliberate clears, since they are the risky half of this import.
    for (const [k, v] of Object.entries(rules)) {
      if (v == null) cleared.push(`${audit.slug}.rulesSummary.${k}`)
    }

    if (!DRY && Object.keys(data).length) {
      await payload.update({ collection: 'firms', id: firm.id, data })
    }
    firmsUpdated += 1

    // ── Challenges: only rows that carry both a price and an account size ──
    const rows = (audit.challenges ?? []).filter(
      (c) => c && !isBlank(c.price) && !isBlank(c.accountSize),
    )
    const dropped = (audit.challenges ?? []).length - rows.length
    if (dropped > 0) skipped.push(`${audit.slug}: ${dropped} challenge rows dropped, no price/size`)

    // Replace this firm's set wholesale, but ONLY when the audit actually
    // produced priced rows. Several audits produced none (pricing pages 404'd,
    // or every price was shown net of a coupon), and for those the stored rows
    // are the best we have: wiping them would turn a stale price into no price.
    if (rows.length > 0 && !DRY) {
      const existing = await payload.find({
        collection: 'challenges',
        where: { firm: { equals: firm.id } },
        limit: 500,
        depth: 0,
      })
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
            drawdownType: (c.drawdownType as 'static' | 'trailing-eod' | 'trailing-intraday' | 'hybrid' | null) ?? null,
            profitSplitPct: c.profitSplitPct == null ? null : Number(c.profitSplitPct),
            timeLimitDays: c.timeLimitDays == null ? null : Number(c.timeLimitDays),
            refundableFee: c.refundableFee === true,
            feeNote: (c.feeNote as string) ?? null,
            isActive: true,
          },
        })
      }
    }
    challengesWritten += rows.length

    console.log(
      `  ${audit.slug.padEnd(22)} fields=${Object.keys(data).length} challenges=${rows.length}${
        dropped ? ` (${dropped} dropped)` : ''
      }`,
    )
  }

  console.log(`\n${DRY ? 'DRY RUN. ' : ''}${firmsUpdated} firms, ${challengesWritten} challenge rows.`)
  if (cleared.length) {
    console.log(`\nDeliberately cleared ${cleared.length} wrong stored values:`)
    for (const c of cleared) console.log(`  ${c}`)
  }
  if (skipped.length) {
    console.log(`\n${skipped.length} things skipped:`)
    for (const s of skipped) console.log(`  ${s}`)
  }
} catch (err) {
  console.error('import-firm-audits failed:', err)
  process.exit(1)
}

process.exit(0)
