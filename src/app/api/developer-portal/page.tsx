import { Metadata } from 'next'
import ApiClient from '../ApiClient'
import { loadApiSpecs } from '../specs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BitoCircle API - Developer Portal Apps',
  description: 'Build developer-portal apps for the BitoCircle Platform: authorize users, get scoped tokens and call the BitoCircle API.',
}

export default async function ApiDocsPage() {
  const { userSpec, monetizeSpec } = await loadApiSpecs()
  return (
    <ApiClient
      userSpec={userSpec}
      monetizeSpec={monetizeSpec}
      allowedModules={['user', 'monetize']}
      defaultModule="user"
      authMethod="developerPortal"
    />
  )
}
