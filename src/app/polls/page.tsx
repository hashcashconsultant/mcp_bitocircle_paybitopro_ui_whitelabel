// app/activity/page.tsx
import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import PollsPage from '@/components/PollsPage'

export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Polls | Circle',
  description: 'Participate in crypto polls, share your opinion, and see what the community thinks about the latest trends on Circle.',
  alternates: {
    canonical: '/polls',
  },
}

export default function Polls() {
  return (
    <MainLayout>
      <PollsPage/>
    </MainLayout>
  )
}