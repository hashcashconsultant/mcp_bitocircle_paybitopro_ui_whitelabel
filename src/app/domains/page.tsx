import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import CommunityDomainsContent from '@/components/CommunityDomainsContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'BitoCircle - Community Domains',
  description: 'Verify the domain of your white-label BitoCircle community.',
  alternates: {
    canonical: '/domains',
  },
  robots: { index: false },
}

export default function DomainsPage() {
  return (
    <MainLayout>
      <CommunityDomainsContent />
    </MainLayout>
  )
}
