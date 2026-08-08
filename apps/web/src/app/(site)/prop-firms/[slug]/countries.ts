/** Country data shared by the availability checker and the availability chip. */

/** ~40 common trader countries (ISO2 → display name). */
export const COUNTRIES: [string, string][] = [
  ['US', 'United States'],
  ['GB', 'United Kingdom'],
  ['IN', 'India'],
  ['PK', 'Pakistan'],
  ['NG', 'Nigeria'],
  ['ID', 'Indonesia'],
  ['VN', 'Vietnam'],
  ['MY', 'Malaysia'],
  ['PH', 'Philippines'],
  ['BR', 'Brazil'],
  ['ZA', 'South Africa'],
  ['AE', 'United Arab Emirates'],
  ['EG', 'Egypt'],
  ['TR', 'Türkiye'],
  ['DE', 'Germany'],
  ['FR', 'France'],
  ['ES', 'Spain'],
  ['IT', 'Italy'],
  ['NL', 'Netherlands'],
  ['CA', 'Canada'],
  ['AU', 'Australia'],
  ['KE', 'Kenya'],
  ['GH', 'Ghana'],
  ['BD', 'Bangladesh'],
  ['LK', 'Sri Lanka'],
  ['TH', 'Thailand'],
  ['MX', 'Mexico'],
  ['CO', 'Colombia'],
  ['AR', 'Argentina'],
  ['SA', 'Saudi Arabia'],
  ['MA', 'Morocco'],
  ['DZ', 'Algeria'],
  ['UA', 'Ukraine'],
  ['PL', 'Poland'],
  ['RO', 'Romania'],
  ['CZ', 'Czechia'],
  ['PT', 'Portugal'],
  ['SE', 'Sweden'],
  ['SG', 'Singapore'],
  ['HK', 'Hong Kong'],
]

export const COUNTRY_NAMES: Record<string, string> = Object.fromEntries(COUNTRIES)

/**
 * ISO2 → flag emoji via regional indicator symbols. No image requests, no CDN.
 * Windows desktop renders letters instead of a flag, which is why the country
 * name is always shown alongside: the label never depends on the glyph.
 */
export function flagEmoji(iso2: string): string {
  return iso2
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}
