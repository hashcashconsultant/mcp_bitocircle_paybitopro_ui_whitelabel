import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import BitoDollarContent from '@/components/BitoDollarContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export const metadata : Metadata = {
  title: 'BitoCircle - Finance Hub',
  description: 'Connect with entrepreneurs and professionals on BitoCircle',
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