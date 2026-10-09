import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubCreateTokenContent from '@/components/FinanceHubCreateTokenContent';
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Create Your Token | BitoCircle Finance Hub',
  description: 'Launch your own cryptocurrency token with ease using BitoCircle&apos;s powerful and intuitive token creation tools.',
  alternates: {
    canonical: '/finance-hub/create-token',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <FinanceHubCreateTokenContent />
    </MainLayout>
  )
}