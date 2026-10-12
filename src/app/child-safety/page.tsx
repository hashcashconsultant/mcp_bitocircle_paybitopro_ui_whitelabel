import { Metadata } from 'next'
import ChildSafetyClient from './ChildSafetyClient'

export const metadata: Metadata = {
  title: 'Child Safety Standards & CSAE Policy | Circle',
  description: 'Read about the child safety standards and CSAE policy enforced by Circle and Hashcash Consultants.',
  alternates: {
    canonical: '/child-safety',
  },
}

export default function ChildSafetyPage() {
  return <ChildSafetyClient />
}