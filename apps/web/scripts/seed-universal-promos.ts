/**
 * Give every listed firm one house promo code, on the same PFSQUAD convention.
 *
 * ── READ THIS BEFORE LAUNCH ──────────────────────────────────────────────────
 * **None of these codes is real.** They are placeholders so the deals surfaces
 * can be built and tested end to end. Every row is written with
 * `codeVerified: false`, and each one has to be negotiated with the firm and
 * confirmed working before it can ship. A code that fails at the firm's
 * checkout costs a reader money and costs us the trust the whole site is built
 * on, so the unverified state is stored per promo rather than remembered.
 *
 * Run `pnpm --filter web exec payload run scripts/check-promo-codes.ts` to list
 * everything still unverified.
 *
 * ── ON AFFILIATE LINKS ───────────────────────────────────────────────────────
 * This script deliberately does NOT set `firm.affiliateUrl`, and neither should
 * anything else until real affiliate links exist. `outboundUrl()` already falls
 * back to the firm's own website, so every CTA works today. Meanwhile
 * `isAffiliateLink()` keys the commission disclosure off `affiliateUrl` being
 * set, so filling it with a placeholder would make us disclose a commission on
 * a link that earns nothing: a false statement, and a worse outcome than the
 * empty field. Leaving it null is the correct behaviour, not a gap.
 *
 * Rerunnable: one active promo per firm, matched on firm, updated in place.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/seed-universal-promos.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const CODE = 'PFSQUAD'
/** House default. Real discounts vary per firm and get set during negotiation. */
const DEFAULT_DISCOUNT = 10

const payload = await getPayload({ config })

let updated = 0
let created = 0
let renamed = 0

try {
  const { docs: firms } = await payload.find({
    collection: 'firms',
    where: { listingType: { equals: 'listed' } },
    limit: 200,
    depth: 0,
  })

  for (const firm of firms) {
    const { docs: existing } = await payload.find({
      collection: 'promos',
      where: { firm: { equals: firm.id } },
      limit: 10,
      depth: 0,
    })

    const promo = existing[0]
    if (promo) {
      const wasCode = promo.code
      await payload.update({
        collection: 'promos',
        id: promo.id,
        data: {
          code: CODE,
          active: true,
          codeVerified: false,
          // Keep whatever discount was already researched for this firm; only
          // fall back to the house default when there is nothing to keep.
          discountPct: promo.discountPct ?? DEFAULT_DISCOUNT,
        },
      })
      if (wasCode !== CODE) renamed += 1
      updated += 1
      console.log(
        `  ${firm.slug.padEnd(22)} ${wasCode === CODE ? 'kept  ' : 'renamed'} ${wasCode} -> ${CODE} (${promo.discountPct ?? DEFAULT_DISCOUNT}%)`,
      )
    } else {
      await payload.create({
        collection: 'promos',
        data: {
          firm: firm.id,
          code: CODE,
          discountPct: DEFAULT_DISCOUNT,
          active: true,
          codeVerified: false,
          description: `House code for ${firm.name}. Not yet confirmed with the firm.`,
        },
      })
      created += 1
      console.log(`  ${firm.slug.padEnd(22)} created ${CODE} (${DEFAULT_DISCOUNT}%)`)
    }
  }

  console.log(
    `\n${updated} updated (${renamed} renamed), ${created} created across ${firms.length} firms.`,
  )
  console.log('ALL are codeVerified:false. None may ship to production as is.')
} catch (err) {
  console.error('seed-universal-promos failed:', err)
  process.exit(1)
}

process.exit(0)
