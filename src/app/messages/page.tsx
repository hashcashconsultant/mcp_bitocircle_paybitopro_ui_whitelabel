import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import MessagesPageContent from '@/components/MessagesPageContent'

export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata: Metadata = {
  title: 'Crypto Direct Messages Platform',
  description: 'Chat securely on a crypto direct messages platform that helps you connect, share insights and engage privately with users in the crypto community.',
  alternates: {
    canonical: '/messages',
  },
}

export default function Messages() {
  return (
    <MainLayout>
      <MessagesPageContent />
    </MainLayout>
  )
}