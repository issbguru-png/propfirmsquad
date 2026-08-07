import type { CollectionConfig } from 'payload'

export const Countries: CollectionConfig = {
  slug: 'countries',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
    defaultColumns: ['name', 'iso2', 'flagEmoji'],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'iso2', type: 'text', required: true, unique: true, index: true, maxLength: 2 },
    { name: 'flagEmoji', type: 'text' },
    {
      name: 'paymentNotes',
      type: 'richText',
      localized: true,
      admin: { description: 'Local payment rails, payout methods that work here — for /countries pages' },
    },
  ],
}
