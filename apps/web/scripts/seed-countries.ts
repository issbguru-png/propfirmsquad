/**
 * Seed the countries collection and FTMO's restricted-country list.
 *
 * The availability checker on firm profiles could never answer "restricted"
 * because `countries` was empty. This seeds the countries the checker offers
 * plus every country FTMO excludes, then links FTMO's restrictions.
 *
 * Country names come from Intl.DisplayNames so we don't hand-maintain them.
 * Source for the FTMO list: ftmo.com restricted countries, captured 2026-08.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-countries.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

/** Countries the profile availability checker offers. */
const PICKER = [
  'US', 'GB', 'IN', 'PK', 'NG', 'ID', 'VN', 'MY', 'PH', 'BR', 'ZA', 'AE', 'EG', 'TR',
  'DE', 'FR', 'ES', 'IT', 'NL', 'CA', 'AU', 'KE', 'GH', 'BD', 'LK', 'TH', 'MX', 'CO',
  'AR', 'SA', 'MA', 'DZ', 'UA', 'PL', 'RO', 'CZ', 'PT', 'SE', 'SG', 'HK',
]

/**
 * FTMO restricted countries (ISO2). Their published list also names sub-national
 * regions (Crimea, Donetsk, Luhansk, Zaporizhzhia) which have no ISO2 code and
 * are therefore not represented here.
 */
const FTMO_RESTRICTED = [
  'AF', 'AI', 'AQ', 'AG', 'BY', 'BZ', 'BT', 'BV', 'BI', 'CV', 'CF', 'TD', 'KM', 'CK',
  'CU', 'DJ', 'DM', 'GQ', 'ER', 'SZ', 'FJ', 'GA', 'GM', 'GD', 'GN', 'GW', 'ID', 'IR',
  'IQ', 'KZ', 'KI', 'XK', 'KG', 'LS', 'LR', 'MW', 'ML', 'MH', 'MR', 'FM', 'MM', 'NR',
  'NE', 'NU', 'KP', 'PG', 'CG', 'RU', 'BL', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SC',
  'SL', 'SB', 'SO', 'SS', 'SD', 'SR', 'SY', 'TJ', 'TL', 'TK', 'TO', 'TM', 'TV', 'UZ',
  'VU', 'VA', 'VE', 'EH',
]

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })

const flagEmoji = (iso2: string) =>
  iso2.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))

console.log('[countries] starting')
try {
  const payload = await getPayload({ config })

  const all = [...new Set([...PICKER, ...FTMO_RESTRICTED])].sort()
  const idByIso2 = new Map<string, number | string>()
  let created = 0

  for (const iso2 of all) {
    const existing = await payload.find({
      collection: 'countries',
      where: { iso2: { equals: iso2 } },
      limit: 1,
    })
    if (existing.docs[0]) {
      idByIso2.set(iso2, existing.docs[0].id)
      continue
    }
    let name: string
    try {
      name = displayNames.of(iso2) ?? iso2
    } catch {
      name = iso2
    }
    const doc = await payload.create({
      collection: 'countries',
      data: { name, iso2, flagEmoji: flagEmoji(iso2) },
    })
    idByIso2.set(iso2, doc.id)
    created++
  }
  console.log(`[countries] ${created} created, ${all.length} total on record`)

  // ── Link FTMO's restrictions ──
  const ftmo = (
    await payload.find({ collection: 'firms', where: { slug: { equals: 'ftmo' } }, limit: 1 })
  ).docs[0]
  if (!ftmo) throw new Error('ftmo firm not found')

  const ids = FTMO_RESTRICTED.map((iso2) => idByIso2.get(iso2)).filter(
    (id): id is number => typeof id === 'number',
  )
  await payload.update({
    collection: 'firms',
    id: ftmo.id,
    data: { restrictedCountries: ids },
  })
  console.log(`[countries] ftmo: ${ids.length} restricted countries linked`)

  console.log('[countries] done')
  process.exit(0)
} catch (err) {
  console.error('[countries] FAILED:', err)
  process.exit(1)
}
