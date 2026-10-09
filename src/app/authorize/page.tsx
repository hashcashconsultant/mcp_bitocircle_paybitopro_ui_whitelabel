import { Suspense } from 'react'
import { Metadata } from 'next'
import AuthorizeAppContent from '@/components/AuthorizeAppContent'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BitoCircle - Authorize app',
  description: 'Allow an app to use your BitoCircle account.',
  robots: { index: false },
}

export default function AuthorizePage() {
  return (
    <Suspense fallback={null}>
      <AuthorizeAppContent sandbox={false} />
    </Suspense>
  )
}
