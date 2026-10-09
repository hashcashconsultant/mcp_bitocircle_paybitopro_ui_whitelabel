import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import BankDetailsContent from '@/components/BankDetailsContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'BitoCircle - Bank Details',
  description: 'Manage your bank details securely on BitoCircle.',
  alternates: {
    canonical: '/bank-details',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <BankDetailsContent />
    </MainLayout>
  )
}