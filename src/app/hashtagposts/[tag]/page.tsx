// app/hashtag/[tag]/page.tsx
import HashtagPostsPage from '@/components/Hashtagpostspage'
import MainLayout from '@/components/layout/MainLayout'

interface PageProps {
  params: Promise<{
    tag: string
  }>
}

export default async function HashtagPage({ params }: PageProps) {
  // Await params in Next.js 15+
  const { tag } = await params
  
  // Decode the hashtag from URL
  const hashtag = decodeURIComponent(tag)
  
  return (
    <MainLayout>
      <HashtagPostsPage hashtag={hashtag} />
    </MainLayout>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { tag } = await params
  const hashtag = decodeURIComponent(tag)
  
  return {
    title: `#${hashtag} - Posts`,
    description: `View all posts with hashtag #${hashtag}`,
    alternates: {
      canonical: `/hashtagposts/${tag}`,
    },
  }
}