import { Metadata } from 'next'
import ApiClient from './ApiClient'
import { loadApiSpecs } from './specs'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Paybito API Documentation',
  description: 'Interactive developer API explorer and documentation for Paybito User and Monetize Services.',
}

export default async function ApiPage() {
  const { userSpec, monetizeSpec } = await loadApiSpecs()
  return (
    <ApiClient
      userSpec={userSpec}
      monetizeSpec={monetizeSpec}
      allowedModules={['user', 'monetize']}
      defaultModule="user"
    />
  )
}
