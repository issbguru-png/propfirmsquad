/**
 * Fixture challenge pricing — used ONLY when a firm has no rows in the
 * `challenges` collection yet. These are example/industry-typical numbers,
 * clearly labeled as unverified in the UI. Replace by seeding real challenges
 * in Payload; the profile page automatically prefers DB rows.
 */
import type { Firm } from '@/payload-types'

export type FixtureChallenge = {
  name: string
  steps: 'instant' | '1-step' | '2-step' | '3-step'
  accountSize: number
  price: number
  profitTargets: { phase: number; targetPct: number }[]
  maxDailyLossPct: number | null
  maxTotalDrawdownPct: number
  drawdownType: 'static' | 'trailing-eod' | 'trailing-intraday' | 'hybrid'
  profitSplitPct: number
  refundableFee: boolean
}

const SIZES = [10_000, 25_000, 50_000, 100_000]

/** Industry-typical evaluation prices by account size (USD). */
const PRICE_BY_SIZE: Record<number, number> = {
  10_000: 89,
  25_000: 189,
  50_000: 299,
  100_000: 499,
}

const STEP_LABEL: Record<FixtureChallenge['steps'], string> = {
  instant: 'Instant Funding',
  '1-step': '1-Step',
  '2-step': '2-Step',
  '3-step': '3-Step',
}

const TARGETS: Record<FixtureChallenge['steps'], number[]> = {
  instant: [],
  '1-step': [10],
  '2-step': [8, 5],
  '3-step': [6, 6, 6],
}

/**
 * Builds an example pricing table for a firm from its program types.
 * Uses the firm's primary evaluation style (prefers 2-step) plus instant
 * funding if offered. Prices/targets are typical-market examples, not quotes.
 */
export function getFixtureChallenges(
  firm: Pick<Firm, 'name' | 'programTypes' | 'maxAllocation'>,
): FixtureChallenge[] {
  const programs = firm.programTypes ?? []
  const evalStyle: FixtureChallenge['steps'] = programs.includes('2-step')
    ? '2-step'
    : programs.includes('1-step')
      ? '1-step'
      : programs.includes('3-step')
        ? '3-step'
        : programs.includes('instant')
          ? 'instant'
          : '2-step'

  const styles: FixtureChallenge['steps'][] = [evalStyle]
  if (evalStyle !== 'instant' && programs.includes('instant')) styles.push('instant')

  const rows: FixtureChallenge[] = []
  for (const steps of styles) {
    for (const accountSize of SIZES) {
      rows.push({
        name: `${STEP_LABEL[steps]} ${accountSize / 1000}K`,
        steps,
        accountSize,
        price:
          steps === 'instant'
            ? Math.round((PRICE_BY_SIZE[accountSize] ?? 299) * 2.2)
            : (PRICE_BY_SIZE[accountSize] ?? 299),
        profitTargets: TARGETS[steps].map((targetPct, i) => ({ phase: i + 1, targetPct })),
        maxDailyLossPct: steps === 'instant' ? null : 5,
        maxTotalDrawdownPct: steps === 'instant' ? 6 : 10,
        drawdownType: steps === 'instant' ? 'trailing-eod' : 'static',
        profitSplitPct: 80,
        refundableFee: steps !== 'instant',
      })
    }
  }
  return rows
}
