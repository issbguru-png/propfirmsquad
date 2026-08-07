/**
 * Seed local DB from captured PFM firm data (seed-data/firms-source.json).
 * Run: pnpm seed  (uses `payload run`, which loads payload.config + env)
 */
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '@payload-config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

type SourceFirm = {
  name: string
  slug: string
  country: string | null
  currency: string | null
  dateEstablished: string | null
  listingType: string
  reviewScore: number | null
  reviewsCount: number | null
  trustPilotScore: number | null
  likesCount: number | null
  maxAllocation: number | null
  programType: string[] | null
  assets: { type: string }[] | null
  firmPlatforms: { name: string }[] | null
  isForexCategory: boolean
  isFuturesCategory: boolean
  isCryptoCategory: boolean
  underReview: boolean
  preferredPromo?: {
    promo?: {
      code?: string
      description?: string
      discounts?: { type: string; amount: number | null }[]
      endDate?: string | null
      exclusive?: boolean | null
    }
  } | null
}

const mapProgramType = (p: string): string => {
  const m: Record<string, string> = {
    Instant: 'instant',
    '1 Step': '1-step',
    '2_Steps': '2-step',
    '3_Steps': '3-step',
  }
  return m[p] ?? '2-step'
}

const mapAsset = (a: string): string | null => {
  const m: Record<string, string> = {
    fx: 'fx',
    indices: 'indices',
    metals: 'metals',
    energy: 'energy',
    crypto: 'crypto',
    stocks: 'stocks',
    otherCommodities: 'other-commodities',
  }
  return m[a] ?? null
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

console.log('[seed] starting…')
try {
  const payload = await getPayload({ config })
  const raw = JSON.parse(
    fs.readFileSync(path.resolve(dirname, '../seed-data/firms-source.json'), 'utf8'),
  )
  const firms: SourceFirm[] = raw.firms.data

  // 1. Platforms (dedup across firms)
  const platformNames = new Set<string>()
  for (const f of firms) for (const p of f.firmPlatforms ?? []) platformNames.add(p.name)

  const platformIds: Record<string, number | string> = {}
  for (const name of platformNames) {
    const slug = slugify(name)
    const existing = await payload.find({
      collection: 'platforms',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs[0]) {
      platformIds[name] = existing.docs[0].id
    } else {
      const doc = await payload.create({ collection: 'platforms', data: { name, slug } })
      platformIds[name] = doc.id
    }
  }
  payload.logger.info(`Platforms ready: ${Object.keys(platformIds).length}`)

  // 2. Firms + promos
  let created = 0
  for (const f of firms) {
    const existing = await payload.find({
      collection: 'firms',
      where: { slug: { equals: f.slug } },
      limit: 1,
    })
    if (existing.docs[0]) continue

    const firmTypes: string[] = []
    if (f.isForexCategory) firmTypes.push('cfd')
    if (f.isFuturesCategory) firmTypes.push('futures')
    if (f.isCryptoCategory) firmTypes.push('crypto')
    if (firmTypes.length === 0) firmTypes.push('cfd')

    const doc = await payload.create({
      collection: 'firms',
      data: {
        name: f.name,
        slug: f.slug,
        listingType: (f.listingType as 'listed') ?? 'listed',
        firmTypes: firmTypes as ('cfd' | 'futures' | 'crypto')[],
        country: f.country ?? undefined,
        currency: f.currency ?? 'USD',
        dateEstablished: f.dateEstablished ?? undefined,
        maxAllocation: f.maxAllocation ?? undefined,
        programTypes: (f.programType ?? []).map(mapProgramType) as (
          | 'instant'
          | '1-step'
          | '2-step'
          | '3-step'
        )[],
        assets: (f.assets ?? [])
          .map((a) => mapAsset(a.type))
          .filter((x): x is string => x !== null) as (
          | 'fx'
          | 'indices'
          | 'metals'
          | 'energy'
          | 'crypto'
          | 'stocks'
          | 'other-commodities'
        )[],
        platforms: (f.firmPlatforms ?? [])
          .map((p) => platformIds[p.name])
          .filter(Boolean) as number[],
        reviewScore: f.reviewScore ?? undefined,
        reviewsCount: f.reviewsCount ?? 0,
        trustPilotScore: f.trustPilotScore ?? undefined,
        likesCount: f.likesCount ?? 0,
        underReview: f.underReview ?? false,
        _status: 'published',
      },
    })
    created++

    const promo = f.preferredPromo?.promo
    if (promo?.code) {
      const std = (promo.discounts ?? []).find((d) => d.type === 'standard')
      await payload.create({
        collection: 'promos',
        data: {
          firm: doc.id,
          code: promo.code,
          description: promo.description ?? undefined,
          discountPct: std?.amount ?? undefined,
          exclusive: promo.exclusive ?? false,
          endDate: promo.endDate ?? undefined,
          active: true,
        },
      })
    }
  }

  console.log(`[seed] complete: ${created} firms created (of ${firms.length} in source)`)
  process.exit(0)
} catch (err) {
  console.error('[seed] FAILED:', err)
  process.exit(1)
}
