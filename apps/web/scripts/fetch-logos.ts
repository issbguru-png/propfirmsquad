/**
 * Fetch real logos for the seeded firms from their OWN official domains
 * (nominative use of the brand mark) and attach them as Media docs.
 *
 * Per firm, in order of preference:
 *   1. apple-touch-icon — /apple-touch-icon.png directly, then <link rel="apple-touch-icon"> in homepage HTML
 *   2. og:image, only when its URL clearly looks like a logo/icon
 *   3. Google favicon service fallback (128px)
 *
 * Skips firms whose logo is already set. Also fills in websiteUrl.
 * Failures are logged and skipped — the run never hard-fails on one firm.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/fetch-logos.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const DOMAINS: Record<string, string> = {
  fundednext: 'fundednext.com',
  'funding-pips': 'fundingpips.com',
  'the-5-ers': 'the5ers.com',
  brightfunded: 'brightfunded.com',
  'e8-markets': 'e8markets.com',
  'hola-prime': 'holaprime.com',
  'crypto-fund-trader': 'cryptofundtrader.com',
  'goat-funded-trader': 'goatfundedtrader.com',
  'atmos-funded': 'atmosfunded.com',
  'alpha-capital-group': 'alphacapitalgroup.uk',
  aquafunded: 'aquafunded.com',
  'trade-the-pool': 'tradethepool.com',
  'blue-guardian': 'blueguardian.com',
  'maven-trading': 'maventrading.com',
  fundedelite: 'fundedelite.com',
  ftmo: 'ftmo.com',
  // Futures vertical, added Aug 2026.
  topstep: 'topstep.com',
  'take-profit-trader': 'takeprofittrader.com',
  tradeify: 'tradeify.co',
  myfundedfutures: 'myfundedfutures.com',
}

/**
 * Explicit asset URLs for sites the discovery path cannot reach.
 *
 * Topstep serves no icon from its own domain (every /apple-touch-icon.png,
 * /favicon.ico and /favicon-32x32.png returns 404) and publishes them from a
 * Webflow CDN instead, which the homepage-parsing step could not reach. The URL
 * below is the 192px icon taken from Topstep's own <link rel="icon"> tag, so it
 * is still the firm's own published mark, just reached directly.
 */
const DIRECT: Record<string, string> = {
  topstep:
    'https://cdn.prod.website-files.com/69e902b0a74d3d99a517f56d/6a0b4dd7378bf90b37fc59b5_favicon.ico',
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,image/avif,image/webp,image/png,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/avif': 'avif',
}

type Fetched = { buffer: Buffer; mimetype: string; source: string }

async function fetchImage(url: string, source: string): Promise<Fetched | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    const mimetype = (res.headers.get('content-type') || '').split(';')[0].trim()
    if (!mimetype.startsWith('image/')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 100) return null // sentinel/empty responses
    return { buffer, mimetype, source }
  } catch {
    return null
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/** Extract an attribute value from an HTML tag string. */
const attr = (tag: string, name: string): string | null => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'))
  return m ? m[1] : null
}

async function findLogo(domain: string): Promise<Fetched | null> {
  // 1a. Direct apple-touch-icon paths
  for (const host of [`https://${domain}`, `https://www.${domain}`]) {
    const hit = await fetchImage(`${host}/apple-touch-icon.png`, `${domain}/apple-touch-icon.png`)
    if (hit) return hit
  }

  // 1b/2. Parse homepage HTML for <link rel="apple-touch-icon"> then og:image
  for (const base of [`https://${domain}/`, `https://www.${domain}/`]) {
    const html = await fetchHtml(base)
    if (!html) continue

    const links = html.match(/<link\b[^>]*>/gi) ?? []
    const touchIcons = links.filter((t) => /rel\s*=\s*["'][^"']*apple-touch-icon[^"']*["']/i.test(t))
    // Prefer the largest declared size (sizes="180x180" etc.)
    touchIcons.sort((a, b) => {
      const size = (t: string) => parseInt(attr(t, 'sizes')?.split('x')[0] ?? '0', 10) || 0
      return size(b) - size(a)
    })
    for (const tag of touchIcons) {
      const href = attr(tag, 'href')
      if (!href) continue
      const hit = await fetchImage(new URL(href, base).href, 'apple-touch-icon link')
      if (hit) return hit
    }

    const ogTag = (html.match(/<meta\b[^>]*>/gi) ?? []).find((t) =>
      /property\s*=\s*["']og:image["']/i.test(t),
    )
    const ogUrl = ogTag ? attr(ogTag, 'content') : null
    if (ogUrl && /logo|icon/i.test(ogUrl)) {
      const hit = await fetchImage(new URL(ogUrl, base).href, 'og:image')
      if (hit) return hit
    }
    break // got HTML — no need to retry the www variant
  }

  // 3. Google favicon service fallback
  return fetchImage(
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    'google favicon fallback',
  )
}

const payload = await getPayload({ config })
const ok: string[] = []
const skipped: string[] = []
const failed: string[] = []

for (const [slug, domain] of Object.entries(DOMAINS)) {
  const found = await payload.find({ collection: 'firms', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  const firm = found.docs[0]
  if (!firm) {
    console.warn(`[fetch-logos] ${slug}: firm not found in DB — skipped`)
    failed.push(`${slug} (not in DB)`)
    continue
  }
  if (firm.logo) {
    console.log(`[fetch-logos] ${slug}: logo already set — skipped`)
    skipped.push(slug)
    continue
  }

  const img = (DIRECT[slug] ? await fetchImage(DIRECT[slug], 'direct override') : null)
    ?? (await findLogo(domain))
  if (!img) {
    console.warn(`[fetch-logos] ${slug}: no logo found on ${domain} — skipped`)
    failed.push(`${slug} (${domain})`)
    continue
  }

  try {
    const ext = EXT_BY_MIME[img.mimetype] ?? 'png'
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${firm.name} logo` },
      file: {
        data: img.buffer,
        name: `${slug}-logo.${ext}`,
        mimetype: img.mimetype,
        size: img.buffer.length,
      },
    })
    await payload.update({
      collection: 'firms',
      id: firm.id,
      data: { logo: media.id, websiteUrl: `https://${domain}` },
    })
    console.log(
      `[fetch-logos] ${slug}: OK via ${img.source} (${img.mimetype}, ${img.buffer.length}b) -> media ${media.id}`,
    )
    ok.push(`${slug} (${img.source})`)
  } catch (err) {
    console.warn(`[fetch-logos] ${slug}: DB write failed —`, err instanceof Error ? err.message : err)
    failed.push(`${slug} (write failed)`)
  }
}

console.log(
  `[fetch-logos] done. ok=${ok.length} skipped=${skipped.length} failed=${failed.length}` +
    (failed.length ? `\n  failed: ${failed.join(', ')}` : ''),
)
process.exit(0)
