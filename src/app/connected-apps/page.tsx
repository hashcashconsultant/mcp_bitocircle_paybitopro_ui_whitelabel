import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import ConnectedAppsContent from '@/components/ConnectedAppsContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Circle - Connected Apps',
  description: 'Apps you have allowed to use your Circle account.',
  alternates: {
    canonical: '/connected-apps',
  },
  robots: { index: false },
}

export default function ConnectedAppsPage() {
  return (
    <MainLayout>
      <ConnectedAppsContent />
    </MainLayout>
  )
}
