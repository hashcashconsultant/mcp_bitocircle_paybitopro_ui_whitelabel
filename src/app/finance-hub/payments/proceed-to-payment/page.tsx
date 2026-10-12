import { Metadata } from 'next'
import FinanceHubPaymentsProceedToPaymentContent from '@/components/FinanceHubPaymentsProceedToPaymentContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Secure Payment | Circle Finance Hub',
  description: 'Complete your transaction securely on the Circle Finance Hub.',
  alternates: {
    canonical: '/finance-hub/payments/proceed-to-payment',
  },
}

export default function BitoHub() {
  return (

      <FinanceHubPaymentsProceedToPaymentContent />
    
  )
}