import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubNftCreateContent from '@/components/FinanceHubNftCreateContent'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Create NFT | BitoCircle Finance Hub',
  description: 'Mint and launch your own NFTs on the BitoCircle marketplace with our secure and easy-to-use creation studio.',
  alternates: {
    canonical: '/finance-hub/nft/create-nft',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
       <MetaMaskProvider>
          <FinanceHubNftCreateContent />
       </MetaMaskProvider>
    </MainLayout>
  )
}