// File: app/public/[userId]/[pageId]/page.tsx

import { Metadata } from 'next'
import MainLayout from '@/components/layout/MainLayout'
import PublicProfilePage from '@/components/PublicProfilePage'

const BITOHUBWEBSERVICE = 'https://institutional-bo.paybito.com:8443/BitohubService'
const SITE_URL = 'https://www.bitocircle.com' // Replace with your actual domain

// Define proper types for the API response
interface ProfileAPIData {
  userId: number
  pageId: number
  businessPageId?: number
  username: string
  email?: string
  fullName: string
  bio: string | null
  profilePicture: string | null
  coverPicture: string | null
  location: string | null
  website: string | null
  isVerified: 'Y' | 'N'
  isPrivate: 'Y' | 'N'
  isActive: 'Y' | 'N'
  isBlocked?: 'Y' | 'N'
  createdAt: string
  updatedAt: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  categoryList: string[] | null
  telegramLink: string | null
  discordLink: string | null
  instagramLink: string | null
  facebookLink: string | null
  youtubeLink: string | null
  tikTokLink: string | null
  twitchLink: string | null
  linkedinLink: string | null
  xlink: string | null
  entityType?: string
  status?: number
  isUserFollowing?: number
}

interface ProfileAPIResponse {
  success: boolean
  message: string
  data: ProfileAPIData | null
  errorCode: string | null
  totalRecords?: number | null
}

/**
 * Fetch profile data for SEO metadata generation (SERVER-SIDE ONLY)
 * 
 * NOTE: This uses a default viewerType='USER' because:
 * 1. This function runs on the server where localStorage doesn't exist
 * 2. For SEO purposes, we only need PUBLIC profile info (name, bio, picture, stats)
 * 3. Viewer-specific data (like isUserFollowing) isn't needed for meta tags
 * 
 * The actual PublicProfilePage component will fetch the profile again on the 
 * client-side with the correct viewerType from localStorage for full functionality.
 */
async function getProfileDataForSEO(userId: string, pageId: string): Promise<ProfileAPIData | null> {
  try {
    const response = await fetch(
      `${BITOHUBWEBSERVICE}/profile/getPublicProfileDetails`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          viewerId: '0',
          userId: userId,
          pageId: pageId,
          // Default viewerType for SEO - only public data is needed for meta tags
          // The client-side component will fetch with actual viewerType for user-specific data
          viewerType: 'USER',
        }),
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!response.ok) {
      console.error('Profile fetch failed with status:', response.status)
      return null
    }

    const result: ProfileAPIResponse = await response.json()
    
    if (result.success && result.data) {
      return result.data
    }
    
    console.error('Profile API returned:', result.message)
    return null
  } catch (error) {
    console.error('Error fetching profile for SEO:', error)
    return null
  }
}

// Format numbers for display
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

// Generate automated SEO metadata
export async function generateMetadata({
  params
}: {
  params: Promise<{ userId: string; pageId: string }>
}): Promise<Metadata> {
  const { userId, pageId } = await params
  const profile = await getProfileDataForSEO(userId, pageId)

  // Fallback metadata if profile not found
  if (!profile) {
    return {
      title: 'Profile Not Found | BitoCircle',
      description: 'This profile could not be found on BitoCircle.',
      robots: { index: false, follow: false }
    }
  }

  const fullName = profile.fullName || 'User'
  // Clean username - remove @ if present
  const username = profile.username?.replace('@', '') || ''
  const bio = profile.bio || ''
  const followersCount = profile.followersCount || 0
  const postsCount = profile.postsCount || 0
  const isVerified = profile.isVerified === 'Y'
  const profileImage = profile.profilePicture || `${SITE_URL}/default-avatar.png`
  const categories = profile.categoryList?.join(', ') || ''

  // Generate dynamic title
  const verifiedBadge = isVerified ? '✓ ' : ''
  const title = `${fullName} ${verifiedBadge}(@${username}) | BitoCircle`

  // Generate dynamic description
  let description = ''
  if (bio) {
    description = bio.length > 155 ? `${bio.substring(0, 152)}...` : bio
  } else {
    description = `${fullName} on BitoCircle. ${formatNumber(followersCount)} Followers, ${formatNumber(postsCount)} Posts.`
    if (categories) {
      description += ` ${categories}.`
    }
    description += ' Join BitoCircle to connect!'
  }

  // Keywords from bio and categories
  const keywords = [
    fullName,
    username,
    'BitoCircle',
    'crypto social',
    'blockchain',
    ...(profile.categoryList || []),
    ...(bio ? bio.split(' ').filter((w: string) => w.startsWith('#')).map((w: string) => w.replace('#', '')) : [])
  ].filter(Boolean)

  const profileUrl = `${SITE_URL}/public/${userId}/${pageId}`

  return {
    title,
    description,
    keywords: keywords.join(', '),
    
    openGraph: {
      type: 'profile',
      title: `${fullName} (@${username})`,
      description,
      url: profileUrl,
      siteName: 'BitoCircle',
      images: [
        {
          url: profileImage,
          width: 400,
          height: 400,
          alt: `${fullName}'s profile picture`
        }
      ],
      locale: 'en_US',
    },

    twitter: {
      card: 'summary',
      title: `${fullName} (@${username}) | BitoCircle`,
      description,
      images: [profileImage],
      creator: `@${username}`,
      site: '@BitoCircle'
    },

    alternates: {
      canonical: profileUrl
    },

    robots: {
      index: profile.isPrivate !== 'Y',
      follow: true,
      googleBot: {
        index: profile.isPrivate !== 'Y',
        follow: true
      }
    },

    authors: [{ name: fullName }],
    creator: fullName,
  }
}

// JSON-LD Structured Data Component
interface ProfileJsonLdProps {
  profile: ProfileAPIData | null
  userId: string
  pageId: string
}

function ProfileJsonLd({ profile, userId, pageId }: ProfileJsonLdProps) {
  if (!profile) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.fullName,
      alternateName: profile.username?.replace('@', ''),
      description: profile.bio || `${profile.fullName} on BitoCircle`,
      url: `${SITE_URL}/public/${userId}/${pageId}`,
      image: profile.profilePicture || `${SITE_URL}/default-avatar.png`,
      sameAs: [
        profile.instagramLink,
        profile.facebookLink,
        profile.youtubeLink,
        profile.linkedinLink,
        profile.xlink,
        profile.telegramLink
      ].filter(Boolean),
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/FollowAction',
          userInteractionCount: profile.followersCount || 0
        },
        {
          '@type': 'InteractionCounter', 
          interactionType: 'https://schema.org/WriteAction',
          userInteractionCount: profile.postsCount || 0
        }
      ]
    },
    dateCreated: profile.createdAt,
    dateModified: profile.updatedAt
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// Main component
export default async function PublicProfile({
  params
}: {
  params: Promise<{ userId: string; pageId: string }>
}) {
  const { userId, pageId } = await params
  
  // Fetch profile for JSON-LD (server-side with default viewerType)
  // The PublicProfilePage component will fetch again client-side with correct viewerType
  const profile = await getProfileDataForSEO(userId, pageId)

  return (
    <>
      <ProfileJsonLd profile={profile} userId={userId} pageId={pageId} />
      
      <MainLayout allowPublicAccess={true}>
        {/* 
          PublicProfilePage is a client component that will:
          1. Fetch the profile with the correct viewerType from localStorage
          2. Show user-specific data like isUserFollowing, follow/unfollow buttons, etc.
        */}
        <PublicProfilePage userId={userId} pageId={pageId} />
      </MainLayout>
    </>
  )
}