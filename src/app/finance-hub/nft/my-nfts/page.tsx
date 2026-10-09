import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubNftMyNftContent from '@/components/FinanceHubNftMyNftContent'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'My NFTs | BitoCircle Finance Hub',
  description: 'View and manage your personal NFT collection, track their value, and list them for sale on BitoCircle.',
  alternates: {
    canonical: '/finance-hub/nft/my-nfts',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
       <MetaMaskProvider>
          <FinanceHubNftMyNftContent />
       </MetaMaskProvider>
    </MainLayout>
  )
}