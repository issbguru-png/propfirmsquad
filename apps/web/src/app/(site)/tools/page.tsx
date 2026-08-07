import type { Metadata } from 'next'
import Link from 'next/link'

export function generateMetadata(): Metadata {
  return {
    title: 'Free Prop Firm Calculators (2026)',
    description:
      'Five free prop firm calculators: consistency rule, drawdown floors, challenge ROI, payout splits, and profit targets. Instant results, no signup.',
  }
}

const tools = [
  {
    href: '/tools/consistency-calculator',
    name: 'Consistency Rule Calculator',
    description:
      'Check whether your best trading day breaks the firm’s consistency limit and how much more profit you need to pass.',
  },
  {
    href: '/tools/drawdown-calculator',
    name: 'Drawdown Calculator',
    description:
      'Find your exact breach level for static, trailing end-of-day, and trailing intraday drawdown, including the lock-at-initial-balance rule.',
  },
  {
    href: '/tools/challenge-roi-calculator',
    name: 'Challenge ROI Calculator',
    description:
      'Work out the expected value of buying a challenge, the cost per $1K of buying power, and the pass rate you need to break even.',
  },
  {
    href: '/tools/payout-split-calculator',
    name: 'Payout Split Calculator',
    description:
      'Split any payout between you and the firm, with fee refunds and scaling tiers that improve your split over time.',
  },
  {
    href: '/tools/profit-target-calculator',
    name: 'Profit Target Calculator',
    description:
      'Convert percentage targets into dollars per evaluation phase and track your overall progress toward funding.',
  },
]

export default function ToolsIndexPage() {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-widest text-accent uppercase">Free tools</p>
      <h1 className="mb-2 text-3xl font-black tracking-tight">Prop Firm Calculators</h1>
      <p className="mb-8 max-w-(--container-prose) text-ink-2">
        Five free calculators for the numbers that actually decide whether you keep a prop firm
        account: consistency, drawdown, challenge economics, payouts, and targets. Instant results,
        no signup.
      </p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block h-full rounded-lg border border-line bg-card p-5 transition-colors hover:border-accent"
            >
              <h2 className="mb-1 font-bold text-ink">{tool.name}</h2>
              <p className="text-sm text-ink-2">{tool.description}</p>
              <span className="mt-3 inline-block text-sm font-bold text-accent-dark">
                Open calculator →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
