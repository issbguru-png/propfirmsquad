import type { CollectionConfig } from 'payload'
import { firmRelatedRevalidation } from '../payload/revalidate'

export const Promos: CollectionConfig = {
  slug: 'promos',
  admin: {
    useAsTitle: 'code',
    group: 'Catalog',
    defaultColumns: ['code', 'firm', 'discountPct', 'active', 'endDate'],
  },
  access: {
    read: () => true,
  },
  hooks: firmRelatedRevalidation(['/deals']),
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true, index: true },
    { name: 'code', type: 'text', required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'discountPct', type: 'number' },
    { name: 'exclusive', type: 'checkbox', defaultValue: false },
    // The PFSQUAD codes are house placeholders, not negotiated deals. Publishing
    // a code that fails at the firm's checkout is the fastest way to lose a
    // reader's trust, so the state is recorded per promo rather than remembered.
    // Flip to true only once the firm has confirmed the code works.
    {
      name: 'codeVerified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Tick ONLY after the firm confirms this exact code is live. Unverified codes must never ship to production.',
      },
    },
    { name: 'endDate', type: 'date' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'extraPerks', type: 'textarea', admin: { description: 'e.g. free account on payout' } },
  ],
}
