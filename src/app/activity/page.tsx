// app/activity/page.tsx
import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import ActivityPageContent from '@/components/ActivityPageContent'

export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Activity Feed ',
  description: 'Track your interactions with a crypto activity feed that shows updates, engagement, notifications and insights across your crypto ecosystem.',
  alternates: {
    canonical: '/activity',
  },
}

export default function Activity() {
  return (
    <MainLayout>
      <ActivityPageContent />
    </MainLayout>
  )
}