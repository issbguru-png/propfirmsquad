/**
 * Keep the top N firms published and unlist the rest.
 *
 * "Quality not quantity" is the site's whole pitch, so shipping fewer, better
 * profiles is a real editorial position rather than a retreat. This makes that
 * position reversible: unlisting is not deletion. Every unlisted firm keeps its
 * data, its challenges and its audit trail, and comes back with one rerun at a
 * higher N.
 *
 * What unlisting does:
 *   - `listingType: 'unlisted'` drops the firm from every ranked surface.
 *     getFirms() allow-lists 'listed', so the homepage table, the /best hubs,
 *     the directory and the alternatives block all lose it automatically.
 *   - `seo.indexable: false` takes it out of the sitemap and marks the profile
 *     noindex, so Google is not asked to rank a page we have stopped promoting.
 *
 * The profile URL still resolves, deliberately. Anyone holding a link keeps a
 * working page rather than a 404, and we are not asking search engines to
 * index it.
 *
 * Ordering matches the site exactly: squad score descending, unscored last.
 * That is why the four futures firms unlist first at any N below 17. They are
 * unscored because Ayub has not rated them, not because they rank badly.
 *
 * Run:  TOP_N=10 corepack pnpm --filter web exec payload run scripts/set-published-top-n.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { compareFirmsByRating, squadScore } from '../src/app/(site)/_lib/profile'

const TOP_N = Number(process.env.TOP_N ?? 10)
const payload = await getPayload({ config })

try {
  // Every non-delisted firm, so a rerun at a higher N can re-publish.
  const { docs } = await payload.find({
    collection: 'firms',
    where: { listingType: { not_equals: 'delisted' } },
    limit: 200,
    depth: 0,
  })

  const ranked = docs.slice().sort(compareFirmsByRating)
  const keep = new Set(ranked.slice(0, TOP_N).map((f) => f.id))

  let published = 0
  let unlisted = 0
  for (const [i, firm] of ranked.entries()) {
    const shouldPublish = keep.has(firm.id)
    const listingType = shouldPublish ? 'listed' : 'unlisted'
    const indexable = shouldPublish ? (firm.seo?.indexable ?? false) : false

    if (firm.listingType !== listingType || firm.seo?.indexable !== indexable) {
      await payload.update({
        collection: 'firms',
        id: firm.id,
        data: { listingType, seo: { ...(firm.seo ?? {}), indexable } },
      })
    }
    shouldPublish ? published++ : unlisted++
    const score = squadScore(firm)
    console.log(
      `  ${String(i + 1).padStart(2)}. ${firm.slug.padEnd(22)} ${(score ?? 'unscored').toString().padStart(8)}  ${shouldPublish ? 'PUBLISHED' : 'unlisted'}`,
    )
  }

  console.log(`\n${published} published, ${unlisted} unlisted. Rerun with a higher TOP_N to restore.`)
} catch (err) {
  console.error('set-published-top-n failed:', err)
  process.exit(1)
}
process.exit(0)
