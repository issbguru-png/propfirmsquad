/**
 * Pre-launch guard: fail if any active promo code is still unverified.
 *
 * The PFSQUAD codes are house placeholders. Shipping one means a reader types
 * it at a firm's checkout, it fails, and the first thing our site ever did for
 * them was waste their time. That is worth a hard gate rather than a note in a
 * handoff document nobody rereads.
 *
 * Exits 1 when anything active is unverified, so it can go straight into CI or
 * a release script.
 *
 * Run: corepack pnpm --filter web exec payload run scripts/check-promo-codes.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })

try {
  const { docs } = await payload.find({
    collection: 'promos',
    where: { active: { equals: true } },
    limit: 500,
    depth: 1,
  })

  const firmName = (p: (typeof docs)[number]) =>
    typeof p.firm === 'object' && p.firm !== null ? p.firm.name : String(p.firm)

  const unverified = docs.filter((p) => !p.codeVerified)

  if (unverified.length === 0) {
    console.log(`All ${docs.length} active promo codes are verified.`)
    process.exit(0)
  }

  console.error(
    `\n${unverified.length} of ${docs.length} active promo codes are NOT verified with the firm:\n`,
  )
  for (const p of unverified) {
    console.error(`  ${String(firmName(p)).padEnd(24)} ${p.code}  ${p.discountPct ?? '?'}% off`)
  }
  console.error(
    '\nEach must be negotiated and confirmed working, then ticked `codeVerified` in the admin.',
  )
  console.error('Until then this site must not go live with promo codes on display.\n')
  process.exit(1)
} catch (err) {
  console.error('check-promo-codes failed:', err)
  process.exit(1)
}
