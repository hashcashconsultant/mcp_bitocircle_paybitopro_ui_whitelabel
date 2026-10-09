import { Metadata } from 'next'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = {
  title: 'Community & Content Policy | BitoCircle',
  description: 'Read the BitoCircle Community and Content Policy to understand our standards for safe and professional crypto networking.',
  alternates: {
    canonical: '/community',
  },
}

export default function CommunityPage() {
  return <CommunityClient />
}