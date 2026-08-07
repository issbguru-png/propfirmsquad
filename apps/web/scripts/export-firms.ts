/**
 * Export all firms + challenges to CSV.
 *
 * Usage:
 *   pnpm --filter web exec payload run scripts/export-firms.ts [output-dir]
 *
 * Writes `firms.csv` (import-compatible columns + extras) and
 * `challenges.csv` (keyed by firmSlug) into the output dir
 * (default: apps/web/exports/).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '@payload-config'
import { toCsv } from './lib/csv'
import type { Challenge, Firm, Platform } from '../src/payload-types'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outDirArg = process.argv.slice(2).filter((a) => a !== '--' && !a.startsWith('--'))[0]
const outDir = outDirArg
  ? path.resolve(process.cwd(), outDirArg)
  : path.resolve(dirname, '../exports')

const joinMulti = (values: (string | null | undefined)[] | null | undefined): string =>
  (values ?? []).filter((v): v is string => Boolean(v)).join('|')

const platformNames = (platforms: Firm['platforms']): string =>
  joinMulti(
    (platforms ?? []).map((p) =>
      typeof p === 'object' && p !== null ? (p as Platform).name : null,
    ),
  )

const firmSlugOf = (firm: Challenge['firm']): string =>
  typeof firm === 'object' && firm !== null ? firm.slug : String(firm)

console.log(`[export-firms] exporting to ${outDir}`)

try {
  const payload = await getPayload({ config })
  fs.mkdirSync(outDir, { recursive: true })

  // ── Firms ──────────────────────────────────────────────────────────
  const firms: Firm[] = []
  let page = 1
  for (;;) {
    const res = await payload.find({
      collection: 'firms',
      limit: 500,
      page,
      depth: 1, // populate platforms for names
      sort: 'slug',
    })
    firms.push(...res.docs)
    if (!res.hasNextPage) break
    page++
  }

  const firmHeader = [
    'name',
    'slug',
    'country',
    'dateEstablished',
    'listingType',
    'reviewScore',
    'reviewsCount',
    'trustPilotScore',
    'likesCount',
    'maxAllocation',
    'currency',
    'programType',
    'assets',
    'platforms',
    'isForexCategory',
    'isFuturesCategory',
    'isCryptoCategory',
    'websiteUrl',
    'affiliateUrl',
    'trustpilotUrl',
    'underReview',
    'lastVerifiedAt',
    'status',
  ]
  const firmRows = firms.map((f) => [
    f.name,
    f.slug,
    f.country ?? '',
    f.dateEstablished ? f.dateEstablished.slice(0, 10) : '',
    f.listingType,
    f.reviewScore ?? '',
    f.reviewsCount ?? 0,
    f.trustPilotScore ?? '',
    f.likesCount ?? 0,
    f.maxAllocation ?? '',
    f.currency ?? 'USD',
    joinMulti(f.programTypes),
    joinMulti(f.assets),
    platformNames(f.platforms),
    f.firmTypes.includes('cfd'),
    f.firmTypes.includes('futures'),
    f.firmTypes.includes('crypto'),
    f.websiteUrl ?? '',
    f.affiliateUrl ?? '',
    f.trustpilotUrl ?? '',
    f.underReview ?? false,
    f.lastVerifiedAt ?? '',
    f._status ?? '',
  ])
  const firmsFile = path.join(outDir, 'firms.csv')
  fs.writeFileSync(firmsFile, toCsv([firmHeader, ...firmRows]))
  console.log(`[export-firms] wrote ${firms.length} firms → ${firmsFile}`)

  // ── Challenges ─────────────────────────────────────────────────────
  const challenges: Challenge[] = []
  page = 1
  for (;;) {
    const res = await payload.find({
      collection: 'challenges',
      limit: 500,
      page,
      depth: 1, // populate firm for slug
      sort: 'id',
    })
    challenges.push(...res.docs)
    if (!res.hasNextPage) break
    page++
  }

  const challengeHeader = [
    'firmSlug',
    'name',
    'steps',
    'accountSize',
    'price',
    'currency',
    'profitTargets',
    'maxDailyLossPct',
    'maxTotalDrawdownPct',
    'drawdownType',
    'profitSplitPct',
    'refundableFee',
    'isActive',
  ]
  const challengeRows = challenges.map((c) => [
    firmSlugOf(c.firm),
    c.name,
    c.steps,
    c.accountSize,
    c.price,
    c.currency ?? 'USD',
    (c.profitTargets ?? []).map((t) => `${t.phase}:${t.targetPct}`).join('|'),
    c.maxDailyLossPct ?? '',
    c.maxTotalDrawdownPct ?? '',
    c.drawdownType ?? '',
    c.profitSplitPct ?? '',
    c.refundableFee ?? false,
    c.isActive ?? true,
  ])
  const challengesFile = path.join(outDir, 'challenges.csv')
  fs.writeFileSync(challengesFile, toCsv([challengeHeader, ...challengeRows]))
  console.log(`[export-firms] wrote ${challenges.length} challenges → ${challengesFile}`)

  process.exit(0)
} catch (err) {
  console.error('[export-firms] FAILED:', err)
  process.exit(1)
}
