import { describe, expect, it } from 'vitest'
import { formatDate, splitDraftMarker, yearOf, limitLabel } from './format'
import { formatDate as kitFormatDate } from '@/components/utils'

describe('yearOf', () => {
  it('reads date-only strings in UTC (no timezone year-shift)', () => {
    // Regression: "2015-01-01" must never render as Est. 2014.
    expect(yearOf('2015-01-01')).toBe(2015)
    expect(yearOf('2015-12-31')).toBe(2015)
  })

  it('reads full ISO timestamps in UTC', () => {
    expect(yearOf('2015-01-01T00:00:00.000Z')).toBe(2015)
    expect(yearOf('2026-08-07T20:58:11.662Z')).toBe(2026)
  })

  it('returns null for missing or invalid input', () => {
    expect(yearOf(null)).toBeNull()
    expect(yearOf(undefined)).toBeNull()
    expect(yearOf('not-a-date')).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats date-only strings in UTC (no timezone day-shift)', () => {
    expect(formatDate('2015-01-01')).toBe('Jan 1, 2015')
    expect(formatDate('2026-08-07')).toBe('Aug 7, 2026')
  })

  it('formats full ISO timestamps in UTC', () => {
    expect(formatDate('2015-01-01T00:00:00.000Z')).toBe('Jan 1, 2015')
    expect(formatDate('2026-08-07T20:58:11.662Z')).toBe('Aug 7, 2026')
  })

  it('returns an em dash for missing or invalid input', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('components/utils formatDate', () => {
  it('formats date-only strings in UTC', () => {
    expect(kitFormatDate('2015-01-01')).toBe('Jan 1, 2015')
  })

  it('formats ISO timestamps in UTC and rejects invalid input', () => {
    expect(kitFormatDate('2026-08-07T20:58:11.662Z')).toBe('Aug 7, 2026')
    expect(kitFormatDate('not-a-date')).toBeNull()
    expect(kitFormatDate(null)).toBeNull()
  })
})

describe('splitDraftMarker', () => {
  it('strips a marker-only trailing paragraph and flags draft', () => {
    const input = ['Solid firm overall.', '[Draft verdict — pending editorial review.]']
    expect(splitDraftMarker(input)).toEqual({
      paragraphs: ['Solid firm overall.'],
      isDraft: true,
    })
  })

  it('strips a trailing marker embedded in the last paragraph', () => {
    const input = ['Intro.', 'Final thoughts. [Draft verdict — pending editorial review.]']
    expect(splitDraftMarker(input)).toEqual({
      paragraphs: ['Intro.', 'Final thoughts.'],
      isDraft: true,
    })
  })

  it('passes unmarked paragraphs through untouched', () => {
    const input = ['Intro.', 'Conclusion.']
    expect(splitDraftMarker(input)).toEqual({ paragraphs: input, isDraft: false })
  })

  it('handles empty input', () => {
    expect(splitDraftMarker([])).toEqual({ paragraphs: [], isDraft: false })
  })

  it('ignores a marker that is not at the end', () => {
    const input = ['[Draft verdict — pending editorial review.] Then real copy follows.']
    expect(splitDraftMarker(input)).toEqual({ paragraphs: input, isDraft: false })
  })
})

describe('limitLabel', () => {
  it('prefers the absolute amount over a percentage', () => {
    // A futures trader searching Topstep's site finds "$2,000", never "4%".
    expect(limitLabel(4, 2000)).toBe('$2,000')
  })

  it('falls back to the percentage when no amount is held', () => {
    expect(limitLabel(6, null)).toBe('6%')
  })

  it('returns null when neither is held, so callers can render a dash', () => {
    // Distinct from zero: Take Profit Trader removed its daily loss limit, and
    // we hold no value rather than a value of nothing.
    expect(limitLabel(null, null)).toBeNull()
    expect(limitLabel(undefined, undefined)).toBeNull()
  })

  it('does not treat a zero amount as absent', () => {
    expect(limitLabel(5, 0)).toBe('$0')
  })

  it('honours a non-USD challenge currency', () => {
    expect(limitLabel(null, 2000, 'EUR')).toBe('€2,000')
  })
})
