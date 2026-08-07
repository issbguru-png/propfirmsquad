/**
 * Ensure a local admin user exists for E2E tests (LOCAL/CI ONLY — never prod).
 * Credentials come from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD (dev defaults below).
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const email = process.env.E2E_ADMIN_EMAIL || 'e2e@local.test'
const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-local-password'

try {
  const payload = await getPayload({ config })
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (existing.docs.length === 0) {
    await payload.create({ collection: 'users', data: { email, password, role: 'admin' } })
    console.log(`[ensure-admin] created ${email}`)
  } else {
    console.log(`[ensure-admin] ${email} already exists`)
  }
  process.exit(0)
} catch (err) {
  console.error('[ensure-admin] FAILED:', err)
  process.exit(1)
}
