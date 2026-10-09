import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import BitoHubFeed from '@/components/BitoHubFeed'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Social Feed Platform | BitoCircle',
  description: 'Explore live updates on a crypto social feed platform where users share insights, discover trends and engage with the global crypto community.',
  alternates: {
    canonical: '/',
  },
}

export default function HomePage() {
  return (
    <MainLayout hideScrollbar>
      <BitoHubFeed />
    </MainLayout>
  )
}