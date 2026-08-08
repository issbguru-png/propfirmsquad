import { describe, expect, it } from 'vitest'
import type { Firm } from '@/payload-types'
import {
  RISK_STATUS,
  RISK_STATUS_ORDER,
  riskStatusOf,
  sourceHost,
  sourcedRiskEvents,
} from './risk'

/**
 * Deliberately loose: several cases build *malformed* rows (missing date, null
 * sourceUrl) that the generated Firm type forbids, because the whole point of
 * these helpers is surviving bad data that reached the DB before the required
 * fields were enforced.
 */
const firm = (props: Record<string, unknown>) => props as unknown as Firm

describe('sourcedRiskEvents', () => {
  /**
   * The legal guardrail: /firms-to-avoid publishes status claims about named
   * companies, so an event a reader cannot click through and verify must never
   * render. These cases lock that in.
   */
  it('drops events missing a source URL', () => {
    const events = sourcedRiskEvents(
      firm({
        riskEvents: [
          { date: '2024-01-01', event: 'Sourced', sourceUrl: 'https://www.cftc.gov/x' },
          { date: '2024-02-01', event: 'Unsourced', sourceUrl: null },
        ],
      }),
    )
    expect(events.map((e) => e.event)).toEqual(['Sourced'])
  })

  it('drops events missing a date or event text', () => {
    const events = sourcedRiskEvents(
      firm({
        riskEvents: [
          { date: null, event: 'No date', sourceUrl: 'https://example.com' },
          { date: '2024-02-01', event: null, sourceUrl: 'https://example.com' },
          { date: '2024-03-01', event: 'Complete', sourceUrl: 'https://example.com' },
        ],
      }),
    )
    expect(events.map((e) => e.event)).toEqual(['Complete'])
  })

  it('orders events newest first', () => {
    const events = sourcedRiskEvents(
      firm({
        riskEvents: [
          { date: '2023-09-02', event: 'filed', sourceUrl: 'https://example.com/a' },
          { date: '2025-05-13', event: 'dismissed', sourceUrl: 'https://example.com/c' },
          { date: '2024-07-01', event: 'interim', sourceUrl: 'https://example.com/b' },
        ],
      }),
    )
    expect(events.map((e) => e.event)).toEqual(['dismissed', 'interim', 'filed'])
  })

  it('returns an empty list when the firm has no events', () => {
    expect(sourcedRiskEvents(firm({}))).toEqual([])
    expect(sourcedRiskEvents(firm({ riskEvents: [] }))).toEqual([])
  })
})

describe('riskStatusOf', () => {
  it('treats "none", null and undefined as not-a-risk-entry', () => {
    expect(riskStatusOf(firm({ riskStatus: 'none' }))).toBeNull()
    expect(riskStatusOf(firm({ riskStatus: null }))).toBeNull()
    expect(riskStatusOf(firm({}))).toBeNull()
  })

  it('returns the status for real entries', () => {
    expect(riskStatusOf(firm({ riskStatus: 'regulatory' }))).toBe('regulatory')
    expect(riskStatusOf(firm({ riskStatus: 'rebranded' }))).toBe('rebranded')
  })
})

describe('RISK_STATUS vocabulary', () => {
  it('covers every ordered status', () => {
    expect(RISK_STATUS_ORDER.every((s) => s in RISK_STATUS)).toBe(true)
    expect(RISK_STATUS_ORDER).toHaveLength(Object.keys(RISK_STATUS).length)
  })

  it('keeps acquisitions/rebrands neutral rather than negative', () => {
    // A firm changing hands is news, not a warning — styling it negative would
    // make an accusation the source material does not support.
    expect(RISK_STATUS.rebranded.tone).toBe('neutral')
    expect(RISK_STATUS.watch.tone).toBe('neutral')
    expect(RISK_STATUS.regulatory.tone).toBe('negative')
  })
})

describe('sourceHost', () => {
  it('strips the www prefix', () => {
    expect(sourceHost('https://www.cftc.gov/PressRoom/PressReleases/8771-23')).toBe('cftc.gov')
    expect(sourceHost('https://tradeinformer.com/broker-news/x')).toBe('tradeinformer.com')
  })

  it('falls back rather than throwing on a malformed URL', () => {
    expect(sourceHost('not a url')).toBe('source')
  })
})
