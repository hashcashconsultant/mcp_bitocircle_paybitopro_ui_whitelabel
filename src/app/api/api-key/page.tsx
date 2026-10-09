import { Metadata } from 'next'
import ApiClient from '../ApiClient'
import { loadApiSpecs } from '../specs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BitoCircle API - API Key & Secret',
  description: 'Call the BitoCircle API as yourself with an API key and secret, protected by IP and domain whitelists.',
}

export default async function ApiDocsPage() {
  const { userSpec, monetizeSpec } = await loadApiSpecs()
  return (
    <ApiClient
      userSpec={userSpec}
      monetizeSpec={monetizeSpec}
      allowedModules={['user', 'monetize']}
      defaultModule="user"
      authMethod="apiKey"
    />
  )
}
