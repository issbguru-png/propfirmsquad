/**
 * Pick a legible box colour for every firm logo.
 *
 * ── THE BUG THIS FIXES ───────────────────────────────────────────────────────
 * `FirmMark` falls back to #2d2520 (near-black) when `logoBackgroundColor` is
 * empty, and no firm had one set. That is invisible for a transparent PNG whose
 * artwork is dark: The5ers' mark measures luminance 0 at 24% opacity, so it was
 * black-on-black and the logo simply did not appear.
 *
 * ── HOW THE COLOUR IS CHOSEN ─────────────────────────────────────────────────
 * Decided from the pixels rather than by hand, so it stays right when a firm
 * rebrands and when new firms are added:
 *
 *   - Mostly opaque logos (>= 95% of pixels solid) ship their own background
 *     baked into the image. The box only shows as a thin frame behind the 15%
 *     padding, so they keep the default and are left alone.
 *   - Transparent logos are composited against the candidate colour. We take
 *     the mean luminance of the artwork's visible pixels and require real
 *     separation from the box. Dark artwork gets white, light artwork keeps
 *     the dark default.
 *
 * Idempotent, and safe to re-run after fetch-logos.ts adds a firm.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/set-logo-backgrounds.ts
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { getPayload } from 'payload'
import config from '@payload-config'

/** FirmMark's fallback. Anything we leave unset renders against this. */
const DEFAULT_BG = '#2d2520'
const DEFAULT_BG_LUM = 0.2126 * 45 + 0.7152 * 37 + 0.0722 * 32 // ~38
const LIGHT_BG = '#ffffff'

/** Below this, artwork and box are too close to tell apart. */
const MIN_SEPARATION = 60
/** At or above this share of solid pixels, the image is its own background. */
const OPAQUE_ENOUGH = 0.95

const MEDIA_DIR = join(process.cwd(), 'media')

type Analysis = { lum: number; opaque: number }

async function analyse(filename: string): Promise<Analysis | null> {
  try {
    const buf = await readFile(join(MEDIA_DIR, filename))
    const { data, info } = await sharp(buf)
      .ensureAlpha()
      .resize(64, 64, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true })

    let sum = 0
    let visible = 0
    let solid = 0
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3]
      if (alpha > 200) solid += 1
      if (alpha > 40) {
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
        visible += 1
      }
    }
    if (visible === 0) return null
    return { lum: sum / visible, opaque: solid / (info.width * info.height) }
  } catch {
    return null
  }
}

const payload = await getPayload({ config })

let changed = 0
let leftAlone = 0
const unreadable: string[] = []

try {
  const { docs: firms } = await payload.find({
    collection: 'firms',
    where: { listingType: { equals: 'listed' } },
    limit: 200,
    depth: 1,
  })

  for (const firm of firms) {
    const logo = firm.logo
    const filename =
      logo && typeof logo === 'object' && typeof logo.filename === 'string' ? logo.filename : null
    if (!filename) continue

    const stats = await analyse(filename)
    if (!stats) {
      unreadable.push(firm.slug)
      continue
    }

    // Its own background is baked in: the box is only a frame.
    if (stats.opaque >= OPAQUE_ENOUGH) {
      leftAlone += 1
      console.log(
        `  ${firm.slug.padEnd(22)} keep default   lum=${stats.lum.toFixed(0).padStart(3)} opaque=${(stats.opaque * 100).toFixed(0)}%`,
      )
      continue
    }

    const separation = Math.abs(stats.lum - DEFAULT_BG_LUM)
    const wanted = separation < MIN_SEPARATION ? LIGHT_BG : null

    if (wanted === (firm.logoBackgroundColor || null)) {
      leftAlone += 1
      continue
    }

    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: { logoBackgroundColor: wanted },
    })
    changed += 1
    console.log(
      `  ${firm.slug.padEnd(22)} ${wanted ?? 'default'}${wanted ? '     ' : '       '} lum=${stats.lum.toFixed(0).padStart(3)} opaque=${(stats.opaque * 100).toFixed(0)}% separation=${separation.toFixed(0)}`,
    )
  }

  console.log(`\n${changed} changed, ${leftAlone} left as they were.`)
  if (unreadable.length) {
    console.warn(`Could not read: ${unreadable.join(', ')}. Those keep the default box.`)
  }
} catch (err) {
  console.error('set-logo-backgrounds failed:', err)
  process.exit(1)
}

process.exit(0)
