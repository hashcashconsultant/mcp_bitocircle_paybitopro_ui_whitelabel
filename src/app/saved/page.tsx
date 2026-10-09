// app/saved/page.tsx
import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import SavedPageContent from '@/components/SavedPageContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Saved Items ',
  description: 'Access your crypto saved items to revisit favourite posts, insights and projects, helping you stay organised and engaged in the crypto space.',
  alternates: {
    canonical: '/saved',
  },
}

export default function Saved() {
  return (
    <MainLayout>
      <SavedPageContent />
    </MainLayout>
  )
}