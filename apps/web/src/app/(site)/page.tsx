import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const payload = await getPayload({ config })
  const firms = await payload.find({
    collection: 'firms',
    limit: 20,
    sort: '-reviewScore',
    depth: 0,
  })

  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">
        — Phase 0 vertical slice —
      </p>
      <h1 className="mb-6 text-4xl font-black tracking-tight">
        Best Prop Trading Firms, ranked by real data
      </h1>
      {firms.docs.length === 0 ? (
        <div className="rounded-sm border border-line bg-card p-6 text-ink-2">
          No firms yet — run <code className="rounded bg-accent-pale px-1 text-accent-dark">pnpm seed</code>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {firms.docs.map((firm, i) => (
            <li
              key={firm.id}
              className="flex items-center gap-3 rounded-sm border border-line bg-card p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-pale text-sm font-bold text-accent-dark">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <div className="font-bold">{firm.name}</div>
                <div className="text-sm text-ink-2">
                  {firm.reviewScore != null ? `${firm.reviewScore}★` : '—'}
                  {firm.reviewsCount ? ` · ${firm.reviewsCount} reviews` : ''}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
