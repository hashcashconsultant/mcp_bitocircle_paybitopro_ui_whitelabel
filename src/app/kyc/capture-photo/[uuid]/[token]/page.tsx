import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import KycCapturePhotoContent from '@/components/KycCapturePhotoContent'
export const dynamic = 'force-dynamic' // Force dynamic rendering


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { uuid, token } = await params;
  return {
    title: 'KYC Photo Capture | BitoCircle',
    description: 'Securely upload your photo for BitoCircle identity verification.',
    alternates: {
      canonical: `/kyc/capture-photo/${uuid}/${token}`,
    },
  }
}

interface PageProps {
  params: Promise<{
    uuid: string;
    token : string
  }>;
}

export default async function KycCapturePage({ params }: PageProps) {
  const resolvedParams = await params
  return (
    <KycCapturePhotoContent
      uuid={resolvedParams.uuid}
      token={resolvedParams.token}
    />
  )
}