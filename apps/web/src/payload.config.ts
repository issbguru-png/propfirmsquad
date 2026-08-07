import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Platforms } from './collections/Platforms'
import { Countries } from './collections/Countries'
import { Firms } from './collections/Firms'
import { Challenges } from './collections/Challenges'
import { Promos } from './collections/Promos'
import { Reviews } from './collections/Reviews'
import { NewsPosts } from './collections/NewsPosts'
import { RuleChanges } from './collections/RuleChanges'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [
    Firms,
    Challenges,
    Promos,
    Reviews,
    NewsPosts,
    RuleChanges,
    Platforms,
    Countries,
    Media,
    Users,
  ],
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'हिन्दी', code: 'hi' },
      { label: 'Español', code: 'es' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'dev-only-secret',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || 'postgres://localhost:5432/propfirmsquad',
    },
  }),
  sharp,
})
