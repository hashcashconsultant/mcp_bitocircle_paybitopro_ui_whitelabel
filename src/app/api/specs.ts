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

type Operation = { tags?: string[] }
type Spec = { tags?: { name: string }[]; paths?: Record<string, Record<string, Operation>> }

/**
 * API keys and Developer Portal apps belong to BitoCircle itself, not to a white-label community, so their
 * operations (and the Ad Center read access built for them) are left out of this site's docs.
 */
const BITOCIRCLE_ONLY_TAGS = new Set(['API Keys', 'App Store OAuth', 'Ad Center'])

function withoutBitoCircleOnly(spec: Spec | null) {
  if (!spec?.paths) return spec
  const paths: Record<string, Record<string, Operation>> = {}
  for (const [path, ops] of Object.entries(spec.paths)) {
    const kept = Object.fromEntries(
      Object.entries(ops).filter(([, op]) => !(op?.tags ?? []).some((tag) => BITOCIRCLE_ONLY_TAGS.has(tag))),
    )
    if (Object.keys(kept).length > 0) paths[path] = kept
  }
  return { ...spec, tags: spec.tags?.filter((tag) => !BITOCIRCLE_ONLY_TAGS.has(tag.name)), paths }
}

/** Both module specs for /api, without the BitoCircle-only API key and app operations. */
export async function loadApiSpecs() {
  const [userSpec, monetizeSpec] = await Promise.all([
    loadSpec(USER_SPEC_URL, userFallbackDocs, 'User'),
    loadSpec(MONETIZE_SPEC_URL, monetizeFallbackDocs, 'Monetize'),
  ])
  return { userSpec: withoutBitoCircleOnly(userSpec), monetizeSpec: withoutBitoCircleOnly(monetizeSpec) }
}
