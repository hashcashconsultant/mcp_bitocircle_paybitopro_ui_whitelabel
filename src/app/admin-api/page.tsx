import { Metadata } from 'next'
import ApiClient from '@/app/api/ApiClient'
import monetizeFallbackDocs from '@/utils/monetizeApiDocsFallback.json'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Paybito Monetize API Documentation',
  description: 'Interactive developer API explorer and documentation for Paybito Monetize Services.',
}

async function getMonetizeApiDocs() {
  try {
    const res = await fetch('https://institutional-bo.paybito.com:8443/MonetizeService/v3/api-docs', {
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    if (!res.ok) {
      console.warn('Paybito Monetize API docs server returned status', res.status)
      return monetizeFallbackDocs
    }
    return await res.json()
  } catch (error) {
    console.error('Error fetching live Monetize API docs, using local fallback:', error)
    return monetizeFallbackDocs
  }
}

export default async function AdminApiPage() {
  const monetizeSpec = await getMonetizeApiDocs()
  return <ApiClient monetizeSpec={monetizeSpec} allowedModules={['monetize']} defaultModule="monetize" />
}
