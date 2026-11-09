import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubBuySwapContent from '@/components/FinanceHubBuySwapContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Buy & Swap Crypto | Circle Finance Hub',
  description: 'Easily buy and swap cryptocurrencies with secure tools and real-time market data on Circle Finance Hub.',
  alternates: {
    canonical: '/finance-hub/buy-and-swap-crypto',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <FinanceHubBuySwapContent />
    </MainLayout>
  )
}