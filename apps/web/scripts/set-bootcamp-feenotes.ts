/**
 * The5ers Bootcamp rows advertise the upfront entry fee, but a second fee is
 * due on passing (official FAQ). Record the total honestly as a pricing
 * footnote. Idempotent.
 * Run: corepack pnpm --filter web exec payload run scripts/set-bootcamp-feenotes.ts
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const NOTES: Record<string, string> = {
  'Bootcamp 3-Step 20K': 'Entry fee. A further $50 is due on passing; total cost $72.',
  'Bootcamp 3-Step 100K': 'Entry fee. A further $205 is due on passing; total cost $300.',
  'Bootcamp 3-Step 250K': 'Entry fee. A further $350 is due on passing; total cost $575.',
}

console.log('[feenotes] starting')
try {
  const payload = await getPayload({ config })
  const firm = (
    await payload.find({ collection: 'firms', where: { slug: { equals: 'the-5-ers' } }, limit: 1 })
  ).docs[0]
  if (!firm) throw new Error('the-5-ers not found')

  for (const [name, feeNote] of Object.entries(NOTES)) {
    const c = (
      await payload.find({
        collection: 'challenges',
        where: { and: [{ firm: { equals: firm.id } }, { name: { equals: name } }] },
        limit: 1,
      })
    ).docs[0]
    if (!c) {
      console.log(`[feenotes] MISSING row: ${name}`)
      continue
    }
    if (c.feeNote === feeNote) {
      console.log(`[feenotes] unchanged: ${name}`)
      continue
    }
    await payload.update({ collection: 'challenges', id: c.id, data: { feeNote } })
    console.log(`[feenotes] set: ${name}`)
  }
  process.exit(0)
} catch (err) {
  console.error('[feenotes] FAILED:', err)
  process.exit(1)
}
