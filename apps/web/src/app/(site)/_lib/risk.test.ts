import { describe, expect, it } from 'vitest'
import type { Firm } from '@/payload-types'
import {
  RISK_STATUS,
  RISK_STATUS_ORDER,
  documentKind,
  documentLabel,
  isPdfUrl,
  pickPrimaryDocument,
  riskStatusOf,
  sourceHost,
  sourcedRiskEvents,
  topRiskEntries,
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
   * The legal guardrail: the homepage table publishes status claims about named
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

/* Real URLs from the seed script: these tests are what stops a re-source from
   quietly relabelling a court filing as a press release. */
const CFTC_SRO = 'https://www.cftc.gov/media/9191/enftradersglobalgrouporder082923/download'
const CFTC_DISMISSAL =
  'https://www.cftc.gov/media/12106/ogc_KazmiReportRecommendationSactions051325/download'
const CFTC_RELEASE = 'https://www.cftc.gov/PressRoom/PressReleases/9083-25'
const FIRM_POST = 'https://www.tx3funding.com/en/ttt-to-tx3'
const PRESS = 'https://www.financemagnates.com/forex/some-story/'

describe('isPdfUrl', () => {
  it('recognises a plain .pdf path', () => {
    expect(isPdfUrl('https://example.com/a/b.pdf')).toBe(true)
  })

  it("recognises the CFTC's extensionless /media/<id>/<name>/download PDFs", () => {
    // These serve application/pdf with no extension; treating them as HTML
    // would label a 41-page court filing "press release".
    expect(isPdfUrl(CFTC_SRO)).toBe(true)
    expect(isPdfUrl(CFTC_DISMISSAL)).toBe(true)
  })

  it('is false for ordinary pages and malformed input', () => {
    expect(isPdfUrl(CFTC_RELEASE)).toBe(false)
    expect(isPdfUrl('https://example.com/media/x/y/download')).toBe(false)
    expect(isPdfUrl('not a url')).toBe(false)
  })
})

describe('documentKind / documentLabel', () => {
  it('detects a regulator structurally, from a "gov" label in the host', () => {
    expect(documentKind(CFTC_RELEASE)).toBe('regulator-release')
    expect(documentLabel(CFTC_RELEASE)).toBe('CFTC press release')
    expect(documentLabel('https://www.sec.gov/news/press-release/2024-1')).toBe(
      'SEC press release',
    )
    expect(documentLabel('https://asic.gov.au/media/1/x.pdf')).toBe('ASIC court filing (PDF)')
  })

  it('labels a regulator-hosted PDF as a court filing', () => {
    expect(documentKind(CFTC_DISMISSAL)).toBe('regulator-filing')
    expect(documentLabel(CFTC_DISMISSAL)).toBe('CFTC court filing (PDF)')
  })

  it('separates the firm’s own post from independent reporting', () => {
    // An unknown host defaults to "firm", never to "press": calling a company
    // blog post trade-press reporting would overstate our sourcing.
    expect(documentKind(FIRM_POST)).toBe('firm')
    expect(documentLabel(FIRM_POST)).toBe('Firm announcement')
    expect(documentKind(PRESS)).toBe('press')
    expect(documentLabel(PRESS)).toBe('Trade press report')
  })
})

describe('pickPrimaryDocument', () => {
  it('prefers a regulator filing over the firm and the press', () => {
    const doc = pickPrimaryDocument(
      firm({
        riskEvents: [
          { date: '2026-01-01', event: 'later story', sourceUrl: PRESS },
          { date: '2025-01-01', event: 'firm post', sourceUrl: FIRM_POST },
          { date: '2024-01-01', event: 'filing', sourceUrl: CFTC_SRO },
        ],
      }),
    )
    expect(doc).toMatchObject({
      url: CFTC_SRO,
      kind: 'regulator-filing',
      label: 'CFTC court filing (PDF)',
      host: 'cftc.gov',
    })
  })

  it('picks the newest document within the best class', () => {
    // My Forex Funds in miniature: linking the 2023 asset-freeze order instead
    // of the 2025 dismissal would point readers at a case that no longer exists.
    const doc = pickPrimaryDocument(
      firm({
        riskEvents: [
          { date: '2023-08-29', event: 'restraining order', sourceUrl: CFTC_SRO },
          { date: '2025-05-13', event: 'dismissed with prejudice', sourceUrl: CFTC_DISMISSAL },
        ],
      }),
    )
    expect(doc?.url).toBe(CFTC_DISMISSAL)
  })

  it('ranks a regulator page above the firm, and the firm above the press', () => {
    expect(
      pickPrimaryDocument(
        firm({
          riskEvents: [
            { date: '2025-01-01', event: 'a', sourceUrl: PRESS },
            { date: '2024-01-01', event: 'b', sourceUrl: CFTC_RELEASE },
          ],
        }),
      )?.url,
    ).toBe(CFTC_RELEASE)
    expect(
      pickPrimaryDocument(
        firm({
          riskEvents: [
            { date: '2025-01-01', event: 'a', sourceUrl: PRESS },
            { date: '2024-01-01', event: 'b', sourceUrl: FIRM_POST },
          ],
        }),
      )?.url,
    ).toBe(FIRM_POST)
  })

  it('returns null when nothing is sourced', () => {
    expect(pickPrimaryDocument(firm({}))).toBeNull()
    expect(
      pickPrimaryDocument(firm({ riskEvents: [{ date: '2024-01-01', event: 'x', sourceUrl: null }] })),
    ).toBeNull()
  })
})

describe('topRiskEntries', () => {
  const entry = (name: string, riskStatus: string, date: string) =>
    firm({ id: name, name, riskStatus, riskEvents: [{ date, event: 'e', sourceUrl: PRESS }] })

  it('puts regulatory action and closures ahead of rebrands', () => {
    const picked = topRiskEntries(
      [
        entry('rebrand', 'rebranded', '2026-01-01'),
        entry('watch', 'watch', '2026-01-01'),
        entry('closed', 'ceased', '2024-01-01'),
        entry('charged', 'regulatory', '2023-01-01'),
      ],
      4,
    )
    expect(picked.map((f) => f.name)).toEqual(['charged', 'closed', 'watch', 'rebrand'])
  })

  it('breaks ties on recency and caps the list', () => {
    const picked = topRiskEntries(
      [
        entry('old', 'ceased', '2024-01-01'),
        entry('new', 'ceased', '2026-01-01'),
        entry('mid', 'ceased', '2025-01-01'),
      ],
      2,
    )
    expect(picked.map((f) => f.name)).toEqual(['new', 'mid'])
  })

  it('drops firms with no status and firms with no linkable document', () => {
    const picked = topRiskEntries(
      [
        entry('sourced', 'ceased', '2025-01-01'),
        firm({ id: 2, name: 'listed', riskStatus: 'none' }),
        firm({
          id: 3,
          name: 'unsourced',
          riskStatus: 'ceased',
          riskEvents: [{ date: '2025-06-01', event: 'e', sourceUrl: null }],
        }),
      ],
      5,
    )
    expect(picked.map((f) => f.name)).toEqual(['sourced'])
  })
})
