import { Metadata } from 'next'
import AIPanel from './AIPanel'

export const metadata: Metadata = {
  title: 'AI Studio - Circle',
  description: 'Generate text, images, and videos for your crypto social posts with Circle AI Studio.',
  alternates: {
    canonical: '/ai',
  },
}

export default function AIPage() {
  return <AIPanel />
}