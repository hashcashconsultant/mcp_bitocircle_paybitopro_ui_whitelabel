import userFallbackDocs from '@/utils/userApiDocsFallback.json'
import monetizeFallbackDocs from '@/utils/monetizeApiDocsFallback.json'
import { localApiUrl } from '@/utils/apiHosts'

const USER_SPEC_URL = 'https://institutional-bo.paybito.com:8443/BitohubService/v3/api-docs'
const MONETIZE_SPEC_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService/v3/api-docs'

/** Live OpenAPI spec from a BitoCircle service, or the bundled copy if the service cannot be reached. */
async function loadSpec(url: string, fallback: unknown, label: string) {
  try {
    const res = await fetch(localApiUrl(url), { cache: 'no-store', next: { revalidate: 0 } })
    if (!res.ok) {
      console.warn(`Paybito ${label} API docs server returned status`, res.status)
      return fallback
    }
    return await res.json()
  } catch (error) {
    console.error(`Error fetching live ${label} API docs, using local fallback:`, error)
    return fallback
  }
}

/** Both module specs, used by /api, /api/api-key and /api/developer-portal. */
export async function loadApiSpecs() {
  const [userSpec, monetizeSpec] = await Promise.all([
    loadSpec(USER_SPEC_URL, userFallbackDocs, 'User'),
    loadSpec(MONETIZE_SPEC_URL, monetizeFallbackDocs, 'Monetize'),
  ])
  return { userSpec, monetizeSpec }
}
