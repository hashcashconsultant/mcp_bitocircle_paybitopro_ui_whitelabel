import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'

import ReelsPageContent from '@/components/ReelsPageContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Social Video Reels ',
  description: 'Watch and share crypto social video reels to discover trends, learn insights and engage with creators shaping the future of the crypto community.',
  alternates: {
    canonical: '/reels',
  },
}

export default function Reels() {
  return (
    <MainLayout>
      <ReelsPageContent />
    </MainLayout>
  )
}