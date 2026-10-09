import { Metadata } from 'next'
import SingleContentPageClient from './SingleContentPageClient'

const BITOHUBWEBSERVICE = 'https://institutional-bo.paybito.com:8443/BitohubService'
const SITE_URL = 'https://www.bitocircle.com'

// ==================== TYPES ====================

interface PostAPIData {
  postId: number
  pageId: number
  userId: number
  username: string
  fullName: string
  profilePicture: string | null
  content: string | null
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'REEL' | 'POLL'
  mediaUrls: string | null
  mediaUrlsList: string[] | null
  thumbnailUrl: string | null
  hashtags: string | null
  location: string | null
  createdAt: string
  updatedAt: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  isVerified?: boolean
  pollQuestion?: string | null
  videoDuration?: number
}

interface ReelAPIData {
  reelId: number
  userId: number
  pageId?: number
  username: string
  fullName: string
  profilePicture: string | null
  title: string
  description: string
  videoUrl: string
  coverImage: string | null
  hashtags: string
  duration: number
  createdAt: string
  updatedAt: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  isVerified?: boolean
}

interface ProfileAPIData {
  userId: number
  pageId: number
  username: string
  fullName: string
  bio: string | null
  profilePicture: string | null
  coverPicture: string | null
  location: string | null
  website: string | null
  isVerified: 'Y' | 'N'
  isPrivate: 'Y' | 'N'
  isActive: 'Y' | 'N'
  createdAt: string
  updatedAt: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  categoryList: string[] | null
}

interface APIResponse<T> {
  success: boolean
  message: string
  data: T | null
  errorCode: string | null
}

interface ContentData {
  type: 'POST' | 'REEL'
  id: number
  userId: number
  pageId: number
  username: string
  fullName: string
  profilePicture: string | null
  content: string
  mediaUrl: string | null
  thumbnailUrl: string | null
  hashtags: string | null
  postType: string
  createdAt: string
  updatedAt: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  isVerified: boolean
  duration?: number
}

interface ProfileData {
  fullName: string
  username: string
  bio: string | null
  profilePicture: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified: boolean
}

// ==================== DATA FETCHING ====================

async function getProfileData(userId: string, pageId: string): Promise<ProfileData | null> {
  try {
    const response = await fetch(
      `${BITOHUBWEBSERVICE}/profile/getPublicProfileDetails`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId: '0',
          userId: userId,
          pageId: pageId,
          viewerType: localStorage.getItem('userType') || 'USER',

        }),
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) return null

    const result: APIResponse<ProfileAPIData> = await response.json()

    if (result.success && result.data) {
      return {
        fullName: result.data.fullName,
        username: result.data.username,
        bio: result.data.bio,
        profilePicture: result.data.profilePicture,
        followersCount: result.data.followersCount || 0,
        followingCount: result.data.followingCount || 0,
        postsCount: result.data.postsCount || 0,
        isVerified: result.data.isVerified === 'Y'
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching profile for SEO:', error)
    return null
  }
}

async function getPostData(postId: string, userId: string): Promise<ContentData | null> {
  try {
    const response = await fetch(
      `${BITOHUBWEBSERVICE}/post/getPostById/${postId}/${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) return null

    const result: APIResponse<PostAPIData> = await response.json()

    if (result.success && result.data) {
      const post = result.data
      return {
        type: 'POST',
        id: post.postId,
        userId: post.userId,
        pageId: post.pageId,
        username: post.username,
        fullName: post.fullName,
        profilePicture: post.profilePicture,
        content: post.content || post.pollQuestion || '',
        mediaUrl: post.mediaUrlsList?.[0] || post.mediaUrls || null,
        thumbnailUrl: post.thumbnailUrl,
        hashtags: post.hashtags,
        postType: post.postType,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        shareCount: post.shareCount,
        isVerified: post.isVerified || false,
        duration: post.videoDuration
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching post for SEO:', error)
    return null
  }
}

async function getReelData(reelId: string, userId: string, pageId: string): Promise<ContentData | null> {
  try {
    const response = await fetch(
      `${BITOHUBWEBSERVICE}/reels/getReelById/${userId}/${pageId}/${reelId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 3600 }
      }
    )

    if (!response.ok) return null

    const result: APIResponse<ReelAPIData> = await response.json()

    if (result.success && result.data) {
      const reel = result.data
      return {
        type: 'REEL',
        id: reel.reelId,
        userId: reel.userId,
        pageId: reel.pageId || 0,
        username: reel.username,
        fullName: reel.fullName,
        profilePicture: reel.profilePicture,
        content: reel.title || reel.description || '',
        mediaUrl: reel.videoUrl,
        thumbnailUrl: reel.coverImage,
        hashtags: reel.hashtags,
        postType: 'REEL',
        createdAt: reel.createdAt,
        updatedAt: reel.updatedAt,
        likeCount: reel.likeCount,
        commentCount: reel.commentCount,
        shareCount: reel.shareCount,
        isVerified: reel.isVerified || false,
        duration: reel.duration
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching reel for SEO:', error)
    return null
  }
}

async function getContentData(
  contentId: string,
  userId: string,
  pageId: string,
  type?: string | null
): Promise<ContentData | null> {
  if (type === 'REEL') {
    return await getReelData(contentId, userId, pageId)
  } else if (type === 'POST') {
    return await getPostData(contentId, userId)
  } else {
    const post = await getPostData(contentId, userId)
    if (post) return post
    return await getReelData(contentId, userId, pageId)
  }
}

// ==================== HELPER FUNCTIONS ====================

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

function extractHashtagsAsKeywords(hashtags: string | null): string[] {
  if (!hashtags) return []
  return hashtags
    .split(/[\s,]+/)
    .filter(w => w.startsWith('#'))
    .map(w => w.replace('#', ''))
    .filter(Boolean)
}

function formatDuration(seconds: number): string {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `PT${mins}M${secs}S`
}

// Generate description in format: name - @username - bio - followers - following - posts - post description
function generateMetaDescription(
  profile: ProfileData | null,
  content: ContentData | null
): string {
  if (!content) return 'Content not found on BitoCircle.'

  const parts: string[] = []

  // Name
  const fullName = profile?.fullName || content.fullName || 'User'
  parts.push(fullName)

  // @username
  const username = profile?.username || content.username || ''
  if (username) {
    parts.push(`@${username}`)
  }

  // Bio (truncated)
  if (profile?.bio) {
    const truncatedBio = truncateText(profile.bio, 50)
    parts.push(truncatedBio)
  }

  // Followers count
  if (profile) {
    parts.push(`${formatNumber(profile.followersCount)} Followers`)
  }

  // Following count
  if (profile) {
    parts.push(`${formatNumber(profile.followingCount)} Following`)
  }

  // Posts count
  if (profile) {
    parts.push(`${formatNumber(profile.postsCount)} Posts`)
  }

  // Post/Reel description (truncated to fit within 160 char limit)
  if (content.content) {
    const currentLength = parts.join(' - ').length
    const remainingSpace = Math.max(155 - currentLength - 3, 20) // -3 for " - "
    const truncatedContent = truncateText(content.content, remainingSpace)
    parts.push(truncatedContent)
  }

  let description = parts.join(' - ')

  // Ensure total length doesn't exceed 160 characters
  if (description.length > 160) {
    description = description.substring(0, 157) + '...'
  }

  return description
}

// ==================== METADATA GENERATION ====================

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ userId: string; pageId: string; postId: string }>
  searchParams: Promise<{ type?: string }>
}): Promise<Metadata> {
  const { userId, pageId, postId } = await params
  const { type } = await searchParams

  // Fetch both content and profile data in parallel
  const [content, profile] = await Promise.all([
    getContentData(postId, userId, pageId, type),
    getProfileData(userId, pageId)
  ])

  if (!content) {
    return {
      title: 'Content Not Found | BitoCircle',
      description: 'This content could not be found on BitoCircle.',
      robots: { index: false, follow: false }
    }
  }

  const fullName = profile?.fullName || content.fullName || 'User'
  const username = profile?.username || content.username || ''
  const isVerified = profile?.isVerified || content.isVerified
  const isReel = content.type === 'REEL'
  const isVideo = isReel || content.postType === 'VIDEO'
  const isPhoto = content.postType === 'PHOTO'

  // Title: Name ✓ (@username) - Post/Reel | BitoCircle
  const verifiedBadge = isVerified ? ' ✓' : ''
  const contentTypeLabel = isReel ? 'Reel' : 'Post'
  const title = `${fullName}${verifiedBadge} (@${username}) - ${contentTypeLabel} | BitoCircle`

  // Description: name - @username - bio - followers - following - posts - post description
  const description = generateMetaDescription(profile, content)

  // Keywords
  const keywords = [
    fullName,
    username,
    'BitoCircle',
    'crypto social',
    'blockchain',
    'social media',
    contentTypeLabel.toLowerCase(),
    ...extractHashtagsAsKeywords(content.hashtags)
  ].filter(Boolean)

  const contentUrl = `${SITE_URL}/post/${userId}/${pageId}/${postId}${type ? `?type=${type}` : ''}`
  const ogImage = content.thumbnailUrl || content.mediaUrl || profile?.profilePicture || content.profilePicture || `${SITE_URL}/default-post-image.png`

  return {
    title,
    description,
    keywords: keywords.join(', '),

    openGraph: {
      type: isVideo ? 'video.other' : 'article',
      title: `${fullName}'s ${contentTypeLabel}`,
      description,
      url: contentUrl,
      siteName: 'BitoCircle',
      images: ogImage ? [
        {
          url: ogImage,
          width: isReel ? 720 : 1200,
          height: isReel ? 1280 : 630,
          alt: `${contentTypeLabel} by ${fullName}`
        }
      ] : [],
      locale: 'en_US',
      ...(isVideo && content.mediaUrl ? {
        videos: [
          {
            url: content.mediaUrl,
            type: 'video/mp4',
            width: isReel ? 720 : 1280,
            height: isReel ? 1280 : 720
          }
        ]
      } : {}),
      ...(content.createdAt ? {
        publishedTime: content.createdAt,
        modifiedTime: content.updatedAt || content.createdAt
      } : {})
    },

    twitter: {
      card: isVideo ? 'player' : (isPhoto ? 'summary_large_image' : 'summary'),
      title: `${fullName}'s ${contentTypeLabel} | BitoCircle`,
      description,
      images: ogImage ? [ogImage] : [],
      creator: `@${username}`,
      site: '@BitoCircle'
    },

    alternates: {
      canonical: contentUrl
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },

    authors: [{ name: fullName }],
    creator: fullName
  }
}

// ==================== JSON-LD STRUCTURED DATA ====================

interface JsonLdProps {
  content: ContentData | null
  profile: ProfileData | null
  userId: string
  pageId: string
  postId: string
  type?: string
}

function ContentJsonLd({ content, profile, userId, pageId, postId, type }: JsonLdProps) {
  if (!content) return null

  const isReel = content.type === 'REEL'
  const isVideo = isReel || content.postType === 'VIDEO'
  const contentUrl = `${SITE_URL}/post/${userId}/${pageId}/${postId}${type ? `?type=${type}` : ''}`
  const authorUrl = `${SITE_URL}/public/${userId}/${pageId}`
  const fullName = profile?.fullName || content.fullName

  const baseJsonLd = {
    '@context': 'https://schema.org',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': contentUrl
    },
    headline: content.content ? truncateText(content.content, 110) : `${content.type} by ${fullName}`,
    description: generateMetaDescription(profile, content),
    url: contentUrl,
    datePublished: content.createdAt,
    dateModified: content.updatedAt || content.createdAt,
    author: {
      '@type': 'Person',
      name: fullName,
      url: authorUrl,
      image: profile?.profilePicture || content.profilePicture,
      description: profile?.bio || undefined,
      interactionStatistic: profile ? [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          userInteractionCount: profile.followersCount
        }
      ] : undefined
    },
    publisher: {
      '@type': 'Organization',
      name: 'BitoCircle',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 200,
        height: 200
      }
    },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: content.likeCount
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: content.commentCount
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/ShareAction',
        userInteractionCount: content.shareCount
      }
    ]
  }

  if (isVideo && content.mediaUrl) {
    const videoJsonLd = {
      ...baseJsonLd,
      '@type': 'VideoObject',
      name: content.content ? truncateText(content.content, 110) : `${isReel ? 'Reel' : 'Video'} by ${fullName}`,
      contentUrl: content.mediaUrl,
      thumbnailUrl: content.thumbnailUrl || `${SITE_URL}/default-video-thumbnail.png`,
      uploadDate: content.createdAt,
      duration: content.duration ? formatDuration(content.duration) : undefined,
      embedUrl: contentUrl,
      ...(content.thumbnailUrl ? {
        thumbnail: {
          '@type': 'ImageObject',
          url: content.thumbnailUrl,
          width: isReel ? 720 : 1280,
          height: isReel ? 1280 : 720
        }
      } : {})
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
    )
  }

  if (content.postType === 'PHOTO' && content.mediaUrl) {
    const imageJsonLd = {
      ...baseJsonLd,
      '@type': 'ImageObject',
      contentUrl: content.mediaUrl,
      image: {
        '@type': 'ImageObject',
        url: content.mediaUrl
      }
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageJsonLd) }}
      />
    )
  }

  const socialPostJsonLd = {
    ...baseJsonLd,
    '@type': 'SocialMediaPosting',
    sharedContent: content.mediaUrl ? {
      '@type': content.postType === 'PHOTO' ? 'ImageObject' : 'MediaObject',
      url: content.mediaUrl
    } : undefined,
    ...(content.thumbnailUrl || content.mediaUrl ? {
      image: {
        '@type': 'ImageObject',
        url: content.thumbnailUrl || content.mediaUrl
      }
    } : {})
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(socialPostJsonLd) }}
    />
  )
}

function BreadcrumbJsonLd({ content, profile, userId, pageId, postId }: JsonLdProps) {
  if (!content) return null

  const fullName = profile?.fullName || content.fullName

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: fullName,
        item: `${SITE_URL}/public/${userId}/${pageId}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: content.type === 'REEL' ? 'Reel' : 'Post',
        item: `${SITE_URL}/post/${userId}/${pageId}/${postId}`
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
  )
}

// ==================== MAIN PAGE COMPONENT ====================

export default async function SingleContentSEOPage({
  params,
  searchParams
}: {
  params: Promise<{ userId: string; pageId: string; postId: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { userId, pageId, postId } = await params
  const { type } = await searchParams

  // Fetch both content and profile data in parallel
  const [content, profile] = await Promise.all([
    getContentData(postId, userId, pageId, type),
    getProfileData(userId, pageId)
  ])

  return (
    <>
      <ContentJsonLd
        content={content}
        profile={profile}
        userId={userId}
        pageId={pageId}
        postId={postId}
        type={type}
      />
      <BreadcrumbJsonLd
        content={content}
        profile={profile}
        userId={userId}
        pageId={pageId}
        postId={postId}
      />
      <SingleContentPageClient />
    </>
  )
}
