/**
 * The ranking is the site's central editorial claim, so the properties that
 * make it defensible are pinned here:
 *
 *   - it is keyed on OUR score, never on the borrowed `reviewScore`
 *   - unscored firms sort last, not first (Postgres nulls-first once put an
 *     unrated FTMO at #1 sitewide)
 *   - third-party numbers can only ever break a tie
 */
import { describe, expect, it } from 'vitest'
import type { Firm } from '@/payload-types'
import { compareFirmsByRating, squadScore } from './profile'

type Scores = NonNullable<Firm['scores']>

const firm = (name: string, scores: Partial<Scores> | null, extra: Partial<Firm> = {}): Firm =>
  ({ name, slug: name, scores, ...extra }) as unknown as Firm

/** All five subscores at one value, so the average is that value. */
const flat = (v: number): Scores => ({
  pricingValue: v,
  rulesFairness: v,
  payoutReliability: v,
  support: v,
  platforms: v,
})

const order = (firms: Firm[]) =>
  firms
    .slice()
    .sort(compareFirmsByRating)
    .map((f) => f.name)

describe('squadScore', () => {
  it('averages the five subscores to 1dp', () => {
    expect(
      squadScore(
        firm('x', {
          pricingValue: 4.7,
          rulesFairness: 3.5,
          payoutReliability: 3.6,
          support: 3.9,
          platforms: 4.7,
        }),
      ),
    ).toBe(4.1)
  })

  it('averages only the subscores that are set', () => {
    expect(squadScore(firm('x', { pricingValue: 4, payoutReliability: 5 }))).toBe(4.5)
  })

  it('is null when nothing has been scored', () => {
    expect(squadScore(firm('x', {}))).toBeNull()
    expect(squadScore(firm('x', null))).toBeNull()
  })
})

describe('compareFirmsByRating', () => {
  it('ranks by squad score descending', () => {
    expect(order([firm('mid', flat(4)), firm('high', flat(4.6)), firm('low', flat(3.2))])).toEqual([
      'high',
      'mid',
      'low',
    ])
  })

  it('ignores the borrowed reviewScore entirely', () => {
    // The regression this whole change exists to prevent: propfirmmatch rated
    // `weak` far higher than `strong`, and that must not move our order.
    const strong = firm('strong', flat(4.5), { reviewScore: 4.1, reviewsCount: 10 })
    const weak = firm('weak', flat(3.3), { reviewScore: 4.8, reviewsCount: 99_999 })
    expect(order([weak, strong])).toEqual(['strong', 'weak'])
  })

  it('puts unscored firms last, whatever their third-party numbers', () => {
    const unscored = firm('unscored', null, { reviewScore: 5, trustPilotScore: 5 })
    const scored = firm('scored', flat(3))
    expect(order([unscored, scored])).toEqual(['scored', 'unscored'])
  })

  it('keeps a stable order when every firm is unscored', () => {
    const a = firm('a', null)
    const b = firm('b', null)
    expect(order([a, b])).toEqual(['a', 'b'])
  })

  it('breaks an exact tie on Trustpilot score', () => {
    const better = firm('better', flat(4), { trustPilotScore: 4.8 })
    const worse = firm('worse', flat(4), { trustPilotScore: 3.1 })
    expect(order([worse, better])).toEqual(['better', 'worse'])
  })

  it('falls through to review volume when Trustpilot also ties', () => {
    const many = firm('many', flat(4), { trustPilotScore: 4, reviewsCount: 5000 })
    const few = firm('few', flat(4), { trustPilotScore: 4, reviewsCount: 12 })
    expect(order([few, many])).toEqual(['many', 'few'])
  })

  it('does not let a tiebreaker override the squad score', () => {
    // A firm with a perfect Trustpilot and huge volume still loses to a firm
    // that scores higher on our own criteria.
    const ours = firm('ours', flat(4.2), { trustPilotScore: 2, reviewsCount: 0 })
    const theirs = firm('theirs', flat(4.1), { trustPilotScore: 5, reviewsCount: 99_999 })
    expect(order([theirs, ours])).toEqual(['ours', 'theirs'])
  })
})

describe('flagged firms are not silently penalised', () => {
  const warned = (score: number) => ({
    active: true,
    checkedAt: '2026-08-08T00:00:00.000Z',
    profileUrl: 'https://www.trustpilot.com/review/x.com',
    underlyingScore: score,
  })

  it('uses the suppressed score in a tiebreak rather than treating it as zero', () => {
    // A warned profile scrapes trustPilotScore as null because Trustpilot hides
    // it. Falling back to 0 would auto-demote every flagged firm, which is a
    // rank penalty we deliberately do not apply.
    const flagged = firm('flagged', flat(4), {
      trustPilotScore: null,
      trustpilotWarning: warned(4.7),
    } as Partial<Firm>)
    const clean = firm('clean', flat(4), { trustPilotScore: 4.1 })
    expect(order([clean, flagged])).toEqual(['flagged', 'clean'])
  })

  it('still ranks a flagged firm below a genuinely better-rated one', () => {
    const flagged = firm('flagged', flat(4), {
      trustPilotScore: null,
      trustpilotWarning: warned(2.3),
    } as Partial<Firm>)
    const clean = firm('clean', flat(4), { trustPilotScore: 4.1 })
    expect(order([flagged, clean])).toEqual(['clean', 'flagged'])
  })
})
