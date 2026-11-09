import { Metadata } from 'next'
import CommunityClient from './CommunityClient'

export const metadata: Metadata = {
  title: 'Community & Content Policy | Circle',
  description: 'Read the Circle Community and Content Policy to understand our standards for safe and professional crypto networking.',
  alternates: {
    canonical: '/community',
  },
}

export default function CommunityPage() {
  return <CommunityClient />
}