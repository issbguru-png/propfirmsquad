import type { CollectionConfig } from 'payload'

export const Promos: CollectionConfig = {
  slug: 'promos',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'firm', 'discountPct', 'active', 'endDate'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true, index: true },
    { name: 'code', type: 'text', required: true },
    { name: 'description', type: 'textarea', localized: true },
    { name: 'discountPct', type: 'number' },
    { name: 'exclusive', type: 'checkbox', defaultValue: false },
    { name: 'endDate', type: 'date' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'extraPerks', type: 'textarea', admin: { description: 'e.g. free account on payout' } },
  ],
}
