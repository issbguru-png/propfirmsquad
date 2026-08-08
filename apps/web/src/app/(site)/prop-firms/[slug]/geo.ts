/**
 * Country detection with zero recurring cost and zero privacy exposure.
 *
 * We read the browser's IANA time zone (and fall back to the locale region).
 * No IP-geolocation API, no request leaves the device, and because detection
 * happens client-side the page HTML stays identical for every visitor, so it
 * remains fully cacheable at the edge.
 *
 * If we ever want higher accuracy on Cloudflare, the `cf-ipcountry` request
 * header is also free, but reading it server-side would make the route vary
 * per country and fragment the cache. Not worth it for this feature.
 */

/** IANA time zone → ISO2, covering the countries the checker offers. */
export const TZ_TO_ISO2: Record<string, string> = {
  // Americas
  'America/New_York': 'US',
  'America/Detroit': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Montreal': 'CA',
  'America/Winnipeg': 'CA',
  'America/Edmonton': 'CA',
  'America/Vancouver': 'CA',
  'America/Halifax': 'CA',
  'America/St_Johns': 'CA',
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Cancun': 'MX',
  'America/Tijuana': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Bahia': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Manaus': 'BR',
  'America/Bogota': 'CO',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  // Europe
  'Europe/London': 'GB',
  'Europe/Dublin': 'GB',
  'Europe/Berlin': 'DE',
  'Europe/Paris': 'FR',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Lisbon': 'PT',
  'Europe/Stockholm': 'SE',
  'Europe/Warsaw': 'PL',
  'Europe/Bucharest': 'RO',
  'Europe/Prague': 'CZ',
  'Europe/Kyiv': 'UA',
  'Europe/Kiev': 'UA',
  'Europe/Istanbul': 'TR',
  // Africa & Middle East
  'Africa/Lagos': 'NG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Nairobi': 'KE',
  'Africa/Accra': 'GH',
  'Africa/Cairo': 'EG',
  'Africa/Casablanca': 'MA',
  'Africa/Algiers': 'DZ',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  // Asia
  'Asia/Karachi': 'PK',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK',
  'Asia/Bangkok': 'TH',
  'Asia/Jakarta': 'ID',
  'Asia/Pontianak': 'ID',
  'Asia/Makassar': 'ID',
  'Asia/Jayapura': 'ID',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Kuching': 'MY',
  'Asia/Manila': 'PH',
  'Asia/Singapore': 'SG',
  'Asia/Hong_Kong': 'HK',
  // Oceania
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Adelaide': 'AU',
  'Australia/Perth': 'AU',
}

/**
 * Best-effort ISO2 for the current visitor. Returns null when we cannot tell,
 * in which case the caller should just leave the picker empty.
 * Browser-only: call this from an effect, never during render.
 */
export function detectCountry(allowed: Set<string>): string | null {
  if (typeof window === 'undefined') return null

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    const fromTz = tz ? TZ_TO_ISO2[tz] : undefined
    if (fromTz && allowed.has(fromTz)) return fromTz
  } catch {
    // Intl unavailable; fall through to locale.
  }

  // Fallback: region subtag of the browser locale ("en-PK" → "PK"). Weaker
  // than time zone (it reflects language preference), so it is only a backstop.
  try {
    const lang = navigator.language
    const region = lang?.split('-')[1]?.toUpperCase()
    if (region && allowed.has(region)) return region
  } catch {
    // ignore
  }

  return null
}
