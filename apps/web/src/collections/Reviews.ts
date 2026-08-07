import type { CollectionConfig } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'firm', 'rating', 'status'],
  },
  access: {
    // Public API only exposes approved reviews (CONTRACTS.md)
    read: ({ req }) => {
      if (req.user) return true
      return { status: { equals: 'approved' } }
    },
  },
  fields: [
    { name: 'firm', type: 'relationship', relationTo: 'firms', required: true, index: true },
    { name: 'rating', type: 'number', required: true, min: 1, max: 5 },
    { name: 'title', type: 'text', required: true },
    { name: 'body', type: 'textarea', required: true },
    { name: 'authorName', type: 'text', required: true },
    { name: 'verified', type: 'checkbox', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'approved', 'rejected'],
    },
  ],
}
