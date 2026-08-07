/**
 * E2E: the freshness loop — a CRM data edit must show up on the public page.
 *
 * Flow: login (REST) → PATCH a firm field → GET the profile HTML → assert the
 * change renders → revert. Uses Playwright request contexts only (no browser).
 *
 * Note: profile pages are currently `force-dynamic`, so every request
 * re-renders; when pages move to static + revalidate in the production build,
 * this same test validates the revalidation hooks end-to-end.
 */
import { expect, test } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL || 'e2e@local.test'
const password = process.env.E2E_ADMIN_PASSWORD || 'e2e-local-password'
const SLUG = 'funding-pips'
const MARKER = `E2E-freshness-${Date.now()}`

test('firm edit in CRM is visible on the public profile', async ({ request }) => {
  // 1. Login via Payload REST — cookie is kept by the request context.
  const login = await request.post('/api/users/login', {
    data: { email, password },
  })
  expect(login.ok(), 'admin login should succeed (run scripts/ensure-admin.ts first)').toBe(true)

  // 2. Find the firm id.
  const found = await request.get(
    `/api/firms?where[slug][equals]=${SLUG}&limit=1&depth=0`,
  )
  expect(found.ok()).toBe(true)
  const firm = (await found.json()).docs?.[0]
  expect(firm, `firm '${SLUG}' must exist (run pnpm seed)`).toBeTruthy()

  const original = firm.underReviewNote ?? null

  // 3. Edit: set a visible field (underReview banner renders the note verbatim).
  const patch = await request.patch(`/api/firms/${firm.id}`, {
    data: { underReview: true, underReviewNote: MARKER },
  })
  expect(patch.ok()).toBe(true)

  try {
    // 4. Public page must reflect the edit.
    const page = await request.get(`/prop-firms/${SLUG}`)
    expect(page.ok()).toBe(true)
    const html = await page.text()
    expect(html).toContain(MARKER)

    // Sanity: lastVerifiedAt hook fired (profile shows "data verified …").
    expect(html).toContain('data verified')
  } finally {
    // 5. Revert so the dev DB stays clean.
    await request.patch(`/api/firms/${firm.id}`, {
      data: { underReview: false, underReviewNote: original },
    })
  }

  // 6. Confirm revert rendered too — the loop works both ways.
  const after = await request.get(`/prop-firms/${SLUG}`)
  expect(await after.text()).not.toContain(MARKER)
})
