// app/page.tsx
import BitoConnectLogin from '@/components/BitoConnectLogin'
export const dynamic = 'force-dynamic' // Force dynamic rendering
import { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Crypto Discovery Login ',
  description: 'Log in to access the crypto discovery platform—explore trends, connect with the community and engage smarter in the world of digital assets.',
  alternates: {
    canonical: '/login',
  },
}

export default function Home() {
  return <BitoConnectLogin />
}

// Alternative: If you want the landing page at a different route like /landing
// Create: app/landing/page.tsx with the same content