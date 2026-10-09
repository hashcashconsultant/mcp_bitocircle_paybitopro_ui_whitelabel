import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubNftCollectionPage from '@/components/FinanceHubNftCollectionContent'
import { MetaMaskProvider } from '@/contexts/MetaMaskContext'

export const dynamic = 'force-dynamic' // Force dynamic rendering

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collectionId } = await params;
  return {
    title: `NFT Collection - ${collectionId} | BitoCircle`,
    description: `Explore the ${collectionId} NFT collection on BitoCircle Finance Hub.`,
    alternates: {
      canonical: `/finance-hub/nft/collection/${collectionId}`,
    },
  }
}

interface PageProps {
  params: Promise<{
    collectionId: string;
  }>;
}

export default async function BitoHub({ params }: PageProps) {
  
  console.log('=== DEBUGGING PAGE COMPONENT ===');
  console.log('Raw params (before await):', params);
  
  const resolvedParams = await params;
  console.log('Resolved params:', resolvedParams);
  console.log('Available keys in params:', Object.keys(resolvedParams || {}));
  
  const { collectionId } = resolvedParams;
  console.log('Extracted collectionId:', collectionId);
  console.log('Type of collectionId:', typeof collectionId);
  console.log('Is undefined?', collectionId === undefined);
  console.log('=================================');
  
  return (
    <MainLayout>
       <MetaMaskProvider>
          <FinanceHubNftCollectionPage collectionId={collectionId}/>
       </MetaMaskProvider>
    </MainLayout>
  )
}