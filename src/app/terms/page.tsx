import { Metadata } from 'next'
import BitoConnectLogin from '@/components/BitoConnectLogin'
import TermsPage from '@/components/TermsPage'
export const dynamic = 'force-dynamic' // Force dynamic rendering

export const metadata: Metadata = {
  title: 'Terms and Conditions | BitoCircle',
  description: 'Read the Terms and Conditions of BitoCircle - The first social platform for the crypto community.',
  alternates: {
    canonical: '/terms',
  },
}

export default function Home() {
  return <TermsPage />
}

// Alternative: If you want the landing page at a different route like /landing
// Create: app/landing/page.tsx with the same content