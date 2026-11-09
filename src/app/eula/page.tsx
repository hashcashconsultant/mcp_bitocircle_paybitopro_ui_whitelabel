import { Metadata } from 'next'
import EULAClient from './EULAClient'

export const metadata: Metadata = {
  title: 'End-User License Agreement | Circle',
  description: 'Read the End-User License Agreement (EULA) for using the Circle Technology Platform and related software.',
  alternates: {
    canonical: '/eula',
  },
}

export default function EULAPage() {
  return <EULAClient />
}