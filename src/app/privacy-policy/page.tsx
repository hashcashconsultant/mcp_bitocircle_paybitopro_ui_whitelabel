import { Metadata } from 'next'
import PrivacyClient from './PrivacyClient'

export const metadata: Metadata = {
  title: 'Privacy Policy | BitoCircle',
  description: 'Your privacy is our priority. Read the BitoCircle Privacy Policy to understand how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default function PrivacyPage() {
  return <PrivacyClient />
}