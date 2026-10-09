import { Metadata } from 'next'
import AIPanel from './AIPanel'

export const metadata: Metadata = {
  title: 'AI Studio - BitoCircle',
  description: 'Generate text, images, and videos for your crypto social posts with BitoCircle AI Studio.',
  alternates: {
    canonical: '/ai',
  },
}

export default function AIPage() {
  return <AIPanel />
}