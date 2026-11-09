import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import ApiKeysContent from '@/components/ApiKeysContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'BitoCircle - API Keys',
  description: 'Create and manage API keys for the BitoCircle API.',
  alternates: {
    canonical: '/api-keys',
  },
  robots: { index: false },
}

export default function ApiKeysPage() {
  return (
    <MainLayout>
      <ApiKeysContent />
    </MainLayout>
  )
}
