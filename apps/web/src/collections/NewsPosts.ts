import type { CollectionConfig } from 'payload'
import { revalidateNewsAfterChange, revalidateNewsAfterDelete } from '../payload/revalidate'

export const NewsPosts: CollectionConfig = {
  slug: 'news-posts',
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'type', 'firm', 'publishedAt', '_status'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateNewsAfterChange],
    afterDelete: [revalidateNewsAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: ['launch', 'collapse', 'rule-change', 'update', 'industry'],
    },
    { name: 'firm', type: 'relationship', relationTo: 'firms', index: true },
    { name: 'body', type: 'richText', localized: true },
    { name: 'publishedAt', type: 'date' },
  ],
}
