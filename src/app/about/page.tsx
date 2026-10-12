import { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About Circle - Social Finance Platform',
  description: 'Learn more about Circle, the first social platform built exclusively for the crypto community. Empowering crypto entrepreneurs to connect and grow.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  return <AboutClient />
}