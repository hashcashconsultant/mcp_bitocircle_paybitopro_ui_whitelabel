import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import FinanceHubPaymentsInvoiceContent from '@/components/FinanceHubPaymentsInvoiceContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Payment Invoice | BitoCircle Finance Hub',
  description: 'View and download your BitoCircle payment invoices and transaction details.',
  alternates: {
    canonical: '/finance-hub/payments/invoice',
  },
}

export default function BitoHub() {
  return (
      <FinanceHubPaymentsInvoiceContent />
    
  )
}