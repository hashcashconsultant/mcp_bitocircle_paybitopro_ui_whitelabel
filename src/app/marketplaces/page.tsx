import { Metadata } from 'next'
import MarketplacesClient from './MarketplacesClient'

export const metadata: Metadata = {
  title: 'Crypto Marketplace Platform | BitoCircle',
  description: 'Discover, trade and connect on a crypto marketplace platform designed to explore projects, access deals and engage with the global crypto ecosystem.',
  alternates: {
    canonical: '/marketplaces',
  },
}

export default function MarketplacesPage() {
  return <MarketplacesClient />
}