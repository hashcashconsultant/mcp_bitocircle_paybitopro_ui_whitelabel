import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import BitoDollarContent from '@/components/BitoDollarContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'Circle - Finance Hub',
  description: 'Connect with entrepreneurs and professionals on Circle',
  alternates: {
    canonical: '/bitodollar-wallet',
  },
}

export default function BitoHub() {
  return (
    <MainLayout>
      <BitoDollarContent />
    </MainLayout>
  )
}