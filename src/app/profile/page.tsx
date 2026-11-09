import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import ProfilePageContent from '@/components/ProfilePageContent'

export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata: Metadata = {
  title: 'Crypto Profile Page ',
  description: 'Create and manage your crypto profile page to showcase interests, track activity and connect with the community across the digital asset ecosystem.',
  alternates: {
    canonical: '/profile',
  },
}

export default function Profile() {
  return (
    <MainLayout>
      <ProfilePageContent />
    </MainLayout>
  )
}