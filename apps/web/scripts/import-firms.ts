/**
 * Bulk-import firms (+ promos, platforms) from a pfm-firms.csv style file.
 *
 * Usage:
 *   pnpm --filter web exec payload run scripts/import-firms.ts <path-to.csv>
 *   pnpm --filter web exec payload run scripts/import-firms.ts <path-to.csv> --dry-run
 *
 * Behavior:
 *   - Upserts firms by slug (creates when missing, updates when present).
 *   - Ensures referenced platforms exist (matched by slugified name).
 *   - Upserts the row's promo (matched by firm + code) when promoCode is set.
 *   - Validates each row; bad rows are reported with row number + reasons and
 *     skipped — good rows still import. Exits 1 if any row failed.
 */
import fs from 'fs'
import path from 'path'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { parseCsvRecords, parseFirmRow, type ParsedFirmRow } from './lib/csv'

const args = process.argv.slice(2).filter((a) => a !== '--')
const dryRun = args.includes('--dry-run')
const csvPathArg = args.find((a) => !a.startsWith('--'))

if (!csvPathArg) {
  console.error('Usage: payload run scripts/import-firms.ts <path-to.csv> [--dry-run]')
  process.exit(1)
}

const csvPath = path.resolve(process.cwd(), csvPathArg)
if (!fs.existsSync(csvPath)) {
  console.error(`[import-firms] file not found: ${csvPath}`)
  process.exit(1)
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

console.log(`[import-firms] reading ${csvPath}${dryRun ? ' (dry run)' : ''}`)

try {
  const { header, records } = parseCsvRecords(fs.readFileSync(csvPath, 'utf8'))
  const required = ['name', 'slug']
  const missing = required.filter((c) => !header.includes(c))
  if (missing.length > 0) {
    console.error(`[import-firms] CSV is missing required column(s): ${missing.join(', ')}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // Cache platform name → id, creating on demand.
  const platformIds = new Map<string, number | string>()
  const ensurePlatform = async (name: string): Promise<number | string> => {
    const cached = platformIds.get(name)
    if (cached !== undefined) return cached
    const slug = slugify(name)
    const existing = await payload.find({
      collection: 'platforms',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const id =
      existing.docs[0]?.id ??
      (await payload.create({ collection: 'platforms', data: { name, slug } })).id
    platformIds.set(name, id)
    return id
  }

  const upsertFirm = async (firm: ParsedFirmRow): Promise<'created' | 'updated'> => {
    const platforms: (number | string)[] = []
    for (const p of firm.platformNames) platforms.push(await ensurePlatform(p))

    const data = {
      name: firm.name,
      slug: firm.slug,
      listingType: firm.listingType,
      firmTypes: firm.firmTypes,
      country: firm.country,
      currency: firm.currency,
      dateEstablished: firm.dateEstablished,
      maxAllocation: firm.maxAllocation,
      programTypes: firm.programTypes,
      assets: firm.assets,
      platforms: platforms as number[],
      reviewScore: firm.reviewScore,
      reviewsCount: firm.reviewsCount,
      trustPilotScore: firm.trustPilotScore,
      likesCount: firm.likesCount,
    }

    const existing = await payload.find({
      collection: 'firms',
      where: { slug: { equals: firm.slug } },
      limit: 1,
      depth: 0,
    })

    let firmId: number | string
    let action: 'created' | 'updated'
    if (existing.docs[0]) {
      firmId = existing.docs[0].id
      await payload.update({ collection: 'firms', id: firmId, data, depth: 0 })
      action = 'updated'
    } else {
      const doc = await payload.create({
        collection: 'firms',
        data: { ...data, _status: 'published' },
        depth: 0,
      })
      firmId = doc.id
      action = 'created'
    }

    if (firm.promo) {
      const promoWhere: Where = {
        and: [{ firm: { equals: firmId } }, { code: { equals: firm.promo.code } }],
      }
      const promoData = {
        firm: firmId as number,
        code: firm.promo.code,
        discountPct: firm.promo.discountPct,
        description: firm.promo.description,
        active: true,
      }
      const existingPromo = await payload.find({
        collection: 'promos',
        where: promoWhere,
        limit: 1,
        depth: 0,
      })
      if (existingPromo.docs[0]) {
        await payload.update({
          collection: 'promos',
          id: existingPromo.docs[0].id,
          data: promoData,
          depth: 0,
        })
      } else {
        await payload.create({ collection: 'promos', data: promoData, depth: 0 })
      }
    }

    return action
  }

  let created = 0
  let updated = 0
  const failures: string[] = []

  for (let i = 0; i < records.length; i++) {
    const rowNo = i + 2 // header is line 1
    const rec = records[i]
    const result = parseFirmRow(rec)
    if (!result.ok) {
      failures.push(`row ${rowNo} (${rec.slug || rec.name || '?'}): ${result.errors.join('; ')}`)
      continue
    }
    for (const w of result.warnings) {
      console.warn(`[import-firms] row ${rowNo} (${result.firm.slug}) warning: ${w}`)
    }
    if (dryRun) {
      console.log(`[import-firms] row ${rowNo} (${result.firm.slug}) OK (dry run)`)
      continue
    }
    try {
      const action = await upsertFirm(result.firm)
      if (action === 'created') created++
      else updated++
      console.log(`[import-firms] row ${rowNo} (${result.firm.slug}) ${action}`)
    } catch (err) {
      failures.push(
        `row ${rowNo} (${result.firm.slug}): ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }

  console.log(
    `[import-firms] done: ${created} created, ${updated} updated, ${failures.length} failed (of ${records.length} rows)`,
  )
  if (failures.length > 0) {
    console.error('[import-firms] failures:')
    for (const f of failures) console.error(`  - ${f}`)
    process.exit(1)
  }
  process.exit(0)
} catch (err) {
  console.error('[import-firms] FAILED:', err)
  process.exit(1)
}
