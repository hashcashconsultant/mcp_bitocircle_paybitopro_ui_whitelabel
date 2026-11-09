import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubMainPage from '@/components/FinanceHubMainContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Crypto Finance Hub ',
  description: 'Access a powerful crypto finance hub offering insights, analytics and tools to help you track markets, discover trends and make smarter crypto decisions.',
  alternates: {
    canonical: '/finance-hub',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <FinanceHubMainPage />
    </MainLayout>
  )
}