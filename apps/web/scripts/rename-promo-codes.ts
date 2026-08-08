/**
 * Rebrand promo codes: MATCH* -> PFSQUAD* (MATCH20 -> PFSQUAD20, etc).
 *
 * The MATCH codes were inherited from the seed source and belong to another
 * affiliate. Codes must still be negotiated with each firm before launch:
 * this only aligns what we display with our own brand.
 *
 * Idempotent. Goes through the Payload API so revalidation hooks fire.
 * Run: corepack pnpm --filter web exec payload run scripts/rename-promo-codes.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const OLD = 'MATCH'
const NEW = 'PFSQUAD'

console.log('[promo-codes] starting')
try {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'promos', limit: 500, depth: 0 })

  let changed = 0
  for (const promo of docs) {
    if (!promo.code?.includes(OLD)) continue
    const next = promo.code.replaceAll(OLD, NEW)
    await payload.update({ collection: 'promos', id: promo.id, data: { code: next } })
    console.log(`[promo-codes] ${promo.code} -> ${next}`)
    changed++
  }

  const remaining = (
    await payload.find({ collection: 'promos', limit: 500, depth: 0 })
  ).docs.filter((p) => p.code?.includes(OLD))

  console.log(
    `[promo-codes] done: ${changed} updated, ${remaining.length} still containing "${OLD}"`,
  )
  process.exit(0)
} catch (err) {
  console.error('[promo-codes] FAILED:', err)
  process.exit(1)
}
