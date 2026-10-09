import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import KycContent from '@/components/KycComponent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Identity Verification (KYC) | BitoCircle',
  description: 'Complete your identity verification to unlock full access to BitoCircle&apos;s financial and social features.',
  alternates: {
    canonical: '/kyc',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <KycContent />
    </MainLayout>
  )
}