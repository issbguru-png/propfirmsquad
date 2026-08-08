/**
 * Import researched firm details from seed-data/firm-details.json:
 * - upserts challenges keyed by (firm, name)
 * - merges rulesSummary / payout onto firms (only keys present in JSON;
 *   never overwrites an existing non-null DB value with null)
 * - sets verdict only if currently empty
 * - flips seo.indexable=true only for firms with >=3 challenges AND a verdict
 *   AND rulesSummary.drawdownType present after merge
 *
 * Idempotent — safe to re-run.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/import-firm-details.ts
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Firm } from '../src/payload-types'

type Steps = 'instant' | '1-step' | '2-step' | '3-step'

type ChallengeRow = {
  name: string
  steps: Steps
  accountSize: number
  price: number
  currency?: string
  /** Omit entirely when the firm advertises no time limit (see Challenges.timeLimitDays). */
  timeLimitDays?: number
}

type Asset = 'fx' | 'indices' | 'metals' | 'energy' | 'crypto' | 'stocks' | 'other-commodities'

type FirmDetails = {
  sources: string[]
  /**
   * Field paths whose value came ONLY from an aggregator/third party and was
   * NOT confirmed on the firm's own site. Documentation for human reviewers —
   * the importer does not read it.
   */
  needsVerification?: string[]
  challenges?: ChallengeRow[]
  rules?: {
    drawdownType?: 'static' | 'trailing-eod' | 'trailing-intraday' | 'hybrid'
    consistencyRulePct?: number
    newsTradingAllowed?: boolean
    eaAllowed?: boolean
    minTradingDays?: number
    weekendHolding?: 'allowed' | 'not-allowed' | 'swing-only'
    copyTradingAllowed?: boolean
    hftAllowed?: boolean
    timeLimitsVerified?: boolean
  }
  trading?: {
    broker?: string
    leverage?: { asset: Asset | 'all'; programType?: 'all' | Steps; ratio: string }[]
    commissions?: { asset: Asset; cost: string }[]
  }
  paymentMethods?: (
    | 'card'
    | 'apple-pay'
    | 'google-pay'
    | 'paypal'
    | 'crypto'
    | 'bank-transfer'
    | 'other'
  )[]
  leadership?: { ceoName?: string; ceoRole?: string; ceoLinkedinUrl?: string }
  payout?: {
    methods?: ('crypto' | 'bank-transfer' | 'wise' | 'paypal' | 'other')[]
    frequency?: string
    profitSplitPct?: number
    avgPayoutDays?: number
    firstPayoutDays?: number
    minPayoutAmount?: number
    splitScaling?: string
  }
  verdictText?: string
}

const here = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(here, '../seed-data/firm-details.json')
const dataset: Record<string, FirmDetails> = JSON.parse(readFileSync(dataPath, 'utf8'))

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

/** True when a Lexical verdict doc actually contains visible text. */
const hasVerdictText = (verdict: Firm['verdict']): boolean => {
  if (!verdict?.root?.children) return false
  const walk = (nodes: unknown[]): boolean =>
    nodes.some((n) => {
      const node = n as { text?: string; children?: unknown[] }
      if (typeof node.text === 'string' && node.text.trim().length > 0) return true
      return Array.isArray(node.children) ? walk(node.children) : false
    })
  return walk(verdict.root.children)
}

/**
 * Merge helper: prefer the researched value when it is non-null, otherwise
 * keep whatever the DB already has (never null-out an existing value).
 */
const mergeGroup = <T extends Record<string, unknown>>(
  existing: T | undefined | null,
  incoming: Partial<T> | undefined,
): T => {
  const out: Record<string, unknown> = { ...(existing ?? {}) }
  for (const [k, v] of Object.entries(incoming ?? {})) {
    if (v !== null && v !== undefined) out[k] = v
  }
  return out as T
}

console.log('[import-firm-details] starting…')
try {
  const payload = await getPayload({ config })

  type Summary = {
    slug: string
    challengesCreated: number
    challengesTotal: number
    rulesFields: number
    payoutFields: number
    verdictSet: boolean
    indexable: boolean
  }
  const summaries: Summary[] = []

  for (const [slug, details] of Object.entries(dataset)) {
    const firm = (
      await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1 })
    ).docs[0]
    if (!firm) {
      console.warn(`[import-firm-details] SKIP ${slug}: firm not found`)
      continue
    }

    // ── challenges: upsert keyed by (firm, name) ──
    let created = 0
    for (const row of details.challenges ?? []) {
      const existing = await payload.find({
        collection: 'challenges',
        where: { and: [{ firm: { equals: firm.id } }, { name: { equals: row.name } }] },
        limit: 1,
      })
      if (existing.docs[0]) {
        // Time limits are researched after the initial import, so backfill them
        // onto rows that already exist. Absent in JSON = no time limit = null.
        if (existing.docs[0].timeLimitDays !== (row.timeLimitDays ?? null)) {
          await payload.update({
            collection: 'challenges',
            id: existing.docs[0].id,
            data: { timeLimitDays: row.timeLimitDays ?? null },
          })
        }
        continue
      }
      await payload.create({
        collection: 'challenges',
        data: {
          firm: firm.id,
          name: row.name,
          steps: row.steps,
          accountSize: row.accountSize,
          price: row.price,
          currency: row.currency ?? 'USD',
          timeLimitDays: row.timeLimitDays ?? null,
          isActive: true,
        },
      })
      created++
    }

    // ── rules + payout + trading merge ──
    const rulesSummary = mergeGroup(firm.rulesSummary ?? undefined, details.rules)
    const payout = mergeGroup(firm.payout ?? undefined, details.payout)
    const trading = mergeGroup(firm.trading ?? undefined, details.trading)

    const updateData: Record<string, unknown> = { rulesSummary, payout, trading }
    if (details.paymentMethods?.length) updateData.paymentMethods = details.paymentMethods
    if (details.leadership) {
      updateData.leadership = mergeGroup(firm.leadership ?? undefined, details.leadership)
    }

    // ── verdict only when empty ──
    let verdictSet = false
    if (details.verdictText && !hasVerdictText(firm.verdict)) {
      updateData.verdict = lexicalParagraph(details.verdictText)
      verdictSet = true
    }

    await payload.update({ collection: 'firms', id: firm.id, data: updateData })

    // ── indexable gate: >=3 challenges AND verdict AND drawdownType ──
    const after = await payload.findByID({ collection: 'firms', id: firm.id })
    const challengesTotal = (
      await payload.find({
        collection: 'challenges',
        where: { firm: { equals: firm.id } },
        limit: 0,
      })
    ).totalDocs

    let indexable = Boolean(after.seo?.indexable)
    if (
      !indexable &&
      challengesTotal >= 3 &&
      hasVerdictText(after.verdict) &&
      after.rulesSummary?.drawdownType
    ) {
      await payload.update({
        collection: 'firms',
        id: firm.id,
        data: { seo: { ...(after.seo ?? {}), indexable: true } },
      })
      indexable = true
    }

    const rulesFields = Object.values(after.rulesSummary ?? {}).filter(
      (v) => v !== null && v !== undefined,
    ).length
    const payoutFields = Object.values(after.payout ?? {}).filter(
      (v) => v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0),
    ).length

    summaries.push({
      slug,
      challengesCreated: created,
      challengesTotal,
      rulesFields,
      payoutFields,
      verdictSet,
      indexable,
    })
    console.log(
      `[import-firm-details] ${slug}: challenges +${created} (total ${challengesTotal}), ` +
        `rules fields ${rulesFields}, payout fields ${payoutFields}, ` +
        `verdict ${verdictSet ? 'SET' : 'kept'}, indexable=${indexable}`,
    )
  }

  const totalChallenges = (await payload.find({ collection: 'challenges', limit: 0 })).totalDocs
  const indexableCount = summaries.filter((s) => s.indexable).length
  console.log(
    `[import-firm-details] done — firms processed: ${summaries.length}, ` +
      `challenges in DB: ${totalChallenges}, indexable firms (this run's set): ${indexableCount}`,
  )
  process.exit(0)
} catch (err) {
  console.error('[import-firm-details] FAILED:', err)
  process.exit(1)
}
