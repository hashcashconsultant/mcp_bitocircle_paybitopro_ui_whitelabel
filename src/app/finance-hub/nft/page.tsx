import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubNftContent from '@/components/FinanceHubNftContent'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'NFT Marketplace | BitoCircle Finance Hub',
  description: 'Discover, buy, and sell unique digital assets in the BitoCircle NFT marketplace.',
  alternates: {
    canonical: '/finance-hub/nft',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
       <MetaMaskProvider>
          <FinanceHubNftContent />
       </MetaMaskProvider>
    </MainLayout>
  )
}