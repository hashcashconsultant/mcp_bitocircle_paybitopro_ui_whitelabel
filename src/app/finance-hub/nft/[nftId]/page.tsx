import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubNftDetailPage from '@/components/FinanceHubNftDetailsContent'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'

export const dynamic = 'force-dynamic' // Force dynamic rendering

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nftId } = await params;
  return {
    title: `NFT Details - ${nftId} | BitoCircle`,
    description: `View details for NFT ${nftId} on BitoCircle Finance Hub.`,
    alternates: {
      canonical: `/finance-hub/nft/${nftId}`,
    },
  }
}

interface PageProps {
  params: Promise<{
    nftId: string;
  }>;
}

export default async function BitoHub({ params }: PageProps) {
  const { nftId } = await params;
  
  console.log('Page params received:', nftId);
  console.log('nftId from params:', nftId);
  
  return (
    <MainLayout>
       <MetaMaskProvider>
          <FinanceHubNftDetailPage nftId={nftId}/>
       </MetaMaskProvider>
    </MainLayout>
  )
}