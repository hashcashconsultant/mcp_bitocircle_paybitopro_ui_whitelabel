/** Host rules for sign-in headers. No imports, so both the auth hook and apiAuth can use it. */
const OWN_API = /^https:\/\/institutional-bo\.paybito\.com(:8443)?\/(BitohubService|MonetizeService)\//i;
const PAYBITO_HOST = /^https:\/\/([a-z0-9-]+\.)*paybito\.com(:\d+)?\//i;

/** BitoCircle's own APIs: send bearer token + uuid. */
export const isOwnApi = (url: string): boolean => OWN_API.test(url);

/** Any PayBito API: send the bearer token. Anything else gets no PayBito credentials. */
export const isPaybitoApi = (url: string): boolean => PAYBITO_HOST.test(url);

const PROD_BITOHUB = 'https://institutional-bo.paybito.com:8443/BitohubService'
const PROD_MONETIZE = 'https://institutional-bo.paybito.com:8443/MonetizeService'

/**
 * Local testing only: when NEXT_PUBLIC_BITOHUB_API_URL / NEXT_PUBLIC_MONETIZE_API_URL are set (e.g. in .env.local to
 * http://localhost:8099 and http://localhost:7099), calls to the production services go to those instead.
 * Unset in production, so URLs are returned unchanged.
 */
export const localApiUrl = (url: string): string => {
  const bitohub = process.env.NEXT_PUBLIC_BITOHUB_API_URL
  const monetize = process.env.NEXT_PUBLIC_MONETIZE_API_URL
  if (bitohub && url.startsWith(PROD_BITOHUB)) return bitohub.replace(/\/$/, '') + url.slice(PROD_BITOHUB.length)
  if (monetize && url.startsWith(PROD_MONETIZE)) return monetize.replace(/\/$/, '') + url.slice(PROD_MONETIZE.length)
  return url
}
