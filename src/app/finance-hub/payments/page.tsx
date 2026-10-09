import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubPaymentsPage from '@/components/FinanceHubPaymentsContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Payments | BitoCircle Finance Hub',
  description: 'Manage your payments, view transaction history, and handle financial operations securely on BitoCircle.',
  alternates: {
    canonical: '/finance-hub/payments',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <FinanceHubPaymentsPage />
    </MainLayout>
  )
}