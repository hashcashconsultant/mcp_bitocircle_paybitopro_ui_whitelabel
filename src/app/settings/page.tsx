// app/settings/page.tsx
import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import SettingsPageContent from '@/components/SettingsPageContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Crypto Account Settings ',
  description: 'Manage your crypto account settings to update preferences, enhance security and personalize your experience across the crypto platform.',
  alternates: {
    canonical: '/settings',
  },
}

export default function Settings() {
  return (
    <MainLayout>
      <SettingsPageContent />
    </MainLayout>
  )
}