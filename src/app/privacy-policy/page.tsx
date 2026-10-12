import { Metadata } from 'next'
import PrivacyClient from './PrivacyClient'

export const metadata: Metadata = {
  title: 'Privacy Policy | Circle',
  description: 'Your privacy is our priority. Read the Circle Privacy Policy to understand how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy-policy',
  },
}

export default function PrivacyPage() {
  return <PrivacyClient />
}