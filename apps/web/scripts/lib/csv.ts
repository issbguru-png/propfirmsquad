/**
 * Minimal dependency-free CSV utilities + pfm-firms.csv row parsing (lane A).
 * Pure functions — unit-tested in scripts/__tests__/csv.test.ts.
 */

// ── Generic CSV ──────────────────────────────────────────────────────

/** RFC-4180-ish parser: quoted fields, escaped quotes, newlines in quotes, CRLF. */
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let i = 0
  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }
  while (i < text.length) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else if (ch === '"') {
      inQuotes = true
      i++
    } else if (ch === ',') {
      pushField()
      i++
    } else if (ch === '\r') {
      i++ // handled with the following \n (or ignored)
      if (text[i] === '\n') i++
      pushRow()
    } else if (ch === '\n') {
      pushRow()
      i++
    } else {
      field += ch
      i++
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()
  // Drop fully-empty trailing rows (file ending in newline)
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0].trim() !== ''))
}

/** Parse CSV text into records keyed by the header row. */
export const parseCsvRecords = (
  text: string,
): { header: string[]; records: Record<string, string>[] } => {
  const rows = parseCsv(text)
  if (rows.length === 0) return { header: [], records: [] }
  const header = rows[0].map((h) => h.trim())
  const records = rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {}
    header.forEach((key, idx) => {
      rec[key] = (cells[idx] ?? '').trim()
    })
    return rec
  })
  return { header, records }
}

const escapeCsvField = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value

/** Serialize rows (header included by caller) to CSV text. */
export const toCsv = (rows: (string | number | boolean | null | undefined)[][]): string =>
  rows
    .map((row) => row.map((cell) => escapeCsvField(cell == null ? '' : String(cell))).join(','))
    .join('\n') + '\n'

// ── pfm-firms.csv row → firm data ────────────────────────────────────

export type ParsedFirmRow = {
  name: string
  slug: string
  listingType: 'listed' | 'unlisted' | 'delisted'
  firmTypes: ('cfd' | 'futures' | 'crypto' | 'options' | 'stocks')[]
  country?: string
  currency: string
  dateEstablished?: string
  maxAllocation?: number
  programTypes: ('instant' | '1-step' | '2-step' | '3-step')[]
  assets: ('fx' | 'indices' | 'metals' | 'energy' | 'crypto' | 'stocks' | 'other-commodities')[]
  platformNames: string[]
  reviewScore?: number
  reviewsCount: number
  trustPilotScore?: number
  likesCount: number
  promo?: { code: string; discountPct?: number; description?: string }
}

export type FirmRowResult =
  | { ok: true; firm: ParsedFirmRow; warnings: string[] }
  | { ok: false; errors: string[] }

const PROGRAM_TYPE_MAP: Record<string, ParsedFirmRow['programTypes'][number]> = {
  Instant: 'instant',
  instant: 'instant',
  '1 Step': '1-step',
  '1-step': '1-step',
  '2_Steps': '2-step',
  '2-step': '2-step',
  '3_Steps': '3-step',
  '3-step': '3-step',
}

const ASSET_MAP: Record<string, ParsedFirmRow['assets'][number]> = {
  fx: 'fx',
  indices: 'indices',
  metals: 'metals',
  energy: 'energy',
  crypto: 'crypto',
  stocks: 'stocks',
  otherCommodities: 'other-commodities',
  'other-commodities': 'other-commodities',
  // crypto sub-categories collapse into `crypto`
  majors: 'crypto',
  altcoins: 'crypto',
  btcEth: 'crypto',
  defi: 'crypto',
  meme: 'crypto',
}

const LISTING_TYPES = ['listed', 'unlisted', 'delisted'] as const

const splitMulti = (value: string): string[] =>
  value
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)

const parseBool = (value: string): boolean => /^(true|1|yes)$/i.test(value.trim())

const parseOptionalNumber = (
  value: string,
  field: string,
  errors: string[],
): number | undefined => {
  if (value === '') return undefined
  const n = Number(value)
  if (!Number.isFinite(n)) {
    errors.push(`${field}: "${value}" is not a number`)
    return undefined
  }
  return n
}

/**
 * Validate + normalize one pfm-firms.csv record into Payload firm data.
 * Returns per-row errors (blocking) and warnings (row still imports).
 */
export const parseFirmRow = (rec: Record<string, string>): FirmRowResult => {
  const errors: string[] = []
  const warnings: string[] = []

  const name = (rec.name ?? '').trim()
  const slug = (rec.slug ?? '').trim()
  if (!name) errors.push('name: required')
  if (!slug) errors.push('slug: required')
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    errors.push(`slug: "${slug}" must be kebab-case (lowercase letters, digits, hyphens)`)
  }

  const listingTypeRaw = (rec.listingType ?? '').trim() || 'listed'
  const listingType = LISTING_TYPES.find((t) => t === listingTypeRaw)
  if (!listingType) {
    errors.push(`listingType: "${listingTypeRaw}" not one of ${LISTING_TYPES.join('/')}`)
  }

  const firmTypes: ParsedFirmRow['firmTypes'] = []
  if (parseBool(rec.isForexCategory ?? '')) firmTypes.push('cfd')
  if (parseBool(rec.isFuturesCategory ?? '')) firmTypes.push('futures')
  if (parseBool(rec.isCryptoCategory ?? '')) firmTypes.push('crypto')
  if (firmTypes.length === 0) {
    firmTypes.push('cfd')
    warnings.push('firmTypes: no category flags set — defaulted to cfd')
  }

  const programTypes: ParsedFirmRow['programTypes'] = []
  for (const p of splitMulti(rec.programType ?? '')) {
    const mapped = PROGRAM_TYPE_MAP[p]
    if (mapped) {
      if (!programTypes.includes(mapped)) programTypes.push(mapped)
    } else {
      warnings.push(`programType: unknown value "${p}" skipped`)
    }
  }

  const assets: ParsedFirmRow['assets'] = []
  for (const a of splitMulti(rec.assets ?? '')) {
    const mapped = ASSET_MAP[a]
    if (mapped) {
      if (!assets.includes(mapped)) assets.push(mapped)
    } else {
      warnings.push(`assets: unknown value "${a}" skipped`)
    }
  }

  const platformNames = splitMulti(rec.platforms ?? '')

  const dateRaw = (rec.dateEstablished ?? '').trim()
  let dateEstablished: string | undefined
  if (dateRaw !== '') {
    const d = new Date(dateRaw)
    if (Number.isNaN(d.getTime())) errors.push(`dateEstablished: "${dateRaw}" is not a valid date`)
    else dateEstablished = d.toISOString()
  }

  const country = (rec.country ?? '').trim()
  if (country && !/^[A-Za-z]{2}$/.test(country)) {
    warnings.push(`country: "${country}" is not an ISO2 code`)
  }

  const reviewScore = parseOptionalNumber(rec.reviewScore ?? '', 'reviewScore', errors)
  if (reviewScore !== undefined && (reviewScore < 0 || reviewScore > 5)) {
    errors.push(`reviewScore: ${reviewScore} out of range 0–5`)
  }
  const trustPilotScore = parseOptionalNumber(rec.trustPilotScore ?? '', 'trustPilotScore', errors)
  if (trustPilotScore !== undefined && (trustPilotScore < 0 || trustPilotScore > 5)) {
    errors.push(`trustPilotScore: ${trustPilotScore} out of range 0–5`)
  }
  const reviewsCount = parseOptionalNumber(rec.reviewsCount ?? '', 'reviewsCount', errors) ?? 0
  const likesCount = parseOptionalNumber(rec.likesCount ?? '', 'likesCount', errors) ?? 0
  const maxAllocation = parseOptionalNumber(rec.maxAllocation ?? '', 'maxAllocation', errors)
  const promoDiscount = parseOptionalNumber(rec.promoDiscount ?? '', 'promoDiscount', errors)

  if (errors.length > 0) return { ok: false, errors }

  const promoCode = (rec.promoCode ?? '').trim()
  return {
    ok: true,
    warnings,
    firm: {
      name,
      slug,
      listingType: listingType as ParsedFirmRow['listingType'],
      firmTypes,
      country: country ? country.toUpperCase() : undefined,
      currency: (rec.currency ?? '').trim() || 'USD',
      dateEstablished,
      maxAllocation,
      programTypes,
      assets,
      platformNames,
      reviewScore,
      reviewsCount,
      trustPilotScore,
      likesCount,
      promo: promoCode
        ? {
            code: promoCode,
            discountPct: promoDiscount,
            description: (rec.promoDesc ?? '').trim() || undefined,
          }
        : undefined,
    },
  }
}
