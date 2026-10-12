// app/activity/page.tsx
import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import ActivityPage from '@/components/ActivityPage'

export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Activity - Circle',
  description: 'Track your activity and insights on Circle',
  alternates: {
    canonical: '/connection-highlights',
  },
}

export default function Connection() {
  return (
    <MainLayout>
      <ActivityPage/>
    </MainLayout>
  )
}