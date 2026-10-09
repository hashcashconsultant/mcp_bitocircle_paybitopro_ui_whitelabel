'use client'
import React, { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  IconButton
} from '@mui/material'
import {
  TrendingUp as TrendingIcon,
  BarChart as ChartIcon,
  GroupAdd as GroupAddIcon,
  LocalOffer as TagIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import Link from 'next/link';


interface TrendingTopic {
  tag: string
  posts: string
  growth: string
}

interface TrendingAPIResponse {
  topicId: number
  mentions: number
  hashtag: string
  trendScore: number
  maxTrendScore: number
  trendPercentage: number
  calculationMethod: string
  calculatedDate: string
}

interface FriendHighlight {
  friendId: number
  pageId: number
  friendName: string
  profilePictureUrl: string | null
  totalScore: number
  interactionScore: number
  engagementScore: number
  lifeEventScore: number
  sharedContextScore: number
  interactionCount: number | null
  profileViewCount: number | null
  storyViewCount: number | null
  hasRecentLifeEvent: boolean | null
  mostRecentInteractionType: string | null
  connectionActivity: string | null
}

// Updated interface to match new API response structure
interface ConnectionHighlightsData {
  userId: number
  totalFriendsCount: number
  highlights: FriendHighlight[]
  calculatedAt: string
  connectionActivity: string
}

interface ConnectionHighlightsResponse {
  success: boolean
  message: string
  data: ConnectionHighlightsData
  errorCode: string | null
  totalRecords: number | null
}

interface PollInsight {
  activePolls: number
  totalVotes: number
  votesThisWeek: number
}

interface PollOption {
  optionId: number
  pollId: number | null
  optionText: string | null
  voteCount: number
  optionOrder: number | null
  votePercentage: number | null
}

interface PollItem {
  pollId: number
  postId: number
  question: string
  durationHours: number | null
  isActive: boolean | null
  endsAt: string | null
  createdAt: string | null
  startsAt: string
  expiresAt: string
  statusCode: number
  message: string | null
  ownerUserId: number
  userVotedOptionId: number
  userVotedAt: string | null
  hasVoted: boolean | null
  totalVotes: number
  options: PollOption[]
}

interface PollInsightsAPIResponse {
  success: boolean
  message: string
  data: {
    activePolls: number
    totalVotes: number
    votesThisWeek: number
    pollList: PollItem[]
  }
  errorCode: string | null
}

interface SuggestedUser {
  userId: number
  username: string
  displayName: string
  fullName: string
  profilePicture: string | null
  bio: string | null
  isVerified: string
  totalFollowers: number
  mutualFollowCount: number
  handler: string | null
  pageId: number
  entityType: string
}

// Sponsored Hashtag interfaces
interface SponsoredHashtag {
  hashtagId: number
  hashtagName: string
  isPublished: number
}

interface SponsoredHashtagsAPIResponse {
  success: boolean
  message: string
  data: SponsoredHashtag[]
  errorCode: string | null
  totalRecords: number
}

// Banner Post interfaces
interface BannerPost {
  userId: number
  postId: number
  title: string
  userName: string
  fullName: string
  content: string
  postType: string
  contentType: string
  coverImage: string
  reelDurtion: number
  mediaUrls: string[]
  categoryList: unknown[]
  hashtags: string | null
  location: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: string
  hasBookmarked: string
  pollId: number
  pollQuestion: string | null
  pollEndsAt: string | null
  hasVoted: string
  totalVotes: number
  optionId: number | null
  optionText: string | null
  voteCount: number
  isUserFollowing: number
  isSponsored: number
  cta: string | null
  callToActionUrl: string | null
  adHeadline: string | null
  websiteUrl: string | null
}

interface BannerPostsAPIResponse {
  success: boolean
  message: string
  data: BannerPost[]
  errorCode: string | null
  totalRecords: number | null
}

interface SidebarComponentProps {
  userId: string | number
  trendingTopics?: TrendingTopic[]
  onViewAllActivity?: () => void
  onViewAllPolls?: () => void
  pollSortBy?: 'MOST RECENT' | 'ENDING SOON'
  pollOnlyActive?: 'Y' | 'N'
  pollTab?: 'MYPOLLS' | 'PARTICIPATED' | ''
}

const SidebarComponent: React.FC<SidebarComponentProps> = ({
  userId = localStorage.getItem('childUserId') || '',
  onViewAllActivity,
  onViewAllPolls,
  pollSortBy = 'MOST RECENT',
  pollOnlyActive = 'Y',
  pollTab = 'MYPOLLS'
}) => {
  const router = useRouter()

  // Banner Posts State
  const [bannerPosts, setBannerPosts] = useState<BannerPost[]>([])
  const [bannerLoading, setBannerLoading] = useState(true)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({})
  const autoScrollIntervals = useRef<{ [key: number]: NodeJS.Timeout }>({})

  // Sponsored Hashtags State
  const [sponsoredHashtags, setSponsoredHashtags] = useState<SponsoredHashtag[]>([])
  const [sponsoredLoading, setSponsoredLoading] = useState(true)
  const [sponsoredError, setSponsoredError] = useState<string | null>(null)

  // Trending Topics State
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [trendingError, setTrendingError] = useState<string | null>(null)

  // Connection Highlights State
  const [connectionHighlights, setConnectionHighlights] = useState<FriendHighlight[]>([])
  const [highlightsLoading, setHighlightsLoading] = useState(true)
  const [highlightsError, setHighlightsError] = useState<string | null>(null)

  // Poll Insights State
  const [pollInsights, setPollInsights] = useState<PollInsight>({
    activePolls: 0,
    totalVotes: 0,
    votesThisWeek: 0
  })
  const [pollInsightsLoading, setPollInsightsLoading] = useState(true)
  const [pollInsightsError, setPollInsightsError] = useState<string | null>(null)

  // Suggested Users State
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [followingUsers, setFollowingUsers] = useState<Set<number>>(new Set())
  const [followLoading, setFollowLoading] = useState<Set<number>>(new Set())

  // Fetch banner posts on component mount
  useEffect(() => {
    const fetchBannerPosts = async () => {
      if (!userId) return

      try {
        setBannerLoading(true)
        setBannerError(null)
        const response = await fetchWithAuth(
          `https://institutional-bo.paybito.com:8443/BitohubService/feeds/getBannerPosts?userId=${userId}&offset=1&limit=10`
        )
        const result: BannerPostsAPIResponse = await response.json()

        if (result.success && result.data && result.data.length > 0) {
          setBannerPosts(result.data)
          // Initialize image index for each post
          const initialIndices: { [key: number]: number } = {}
          result.data.forEach(post => {
            initialIndices[post.postId] = 0
          })
          setCurrentImageIndex(initialIndices)
        } else {
          setBannerPosts([])
        }
      } catch (err) {
        setBannerError('Error loading banner posts')
        console.error('Error fetching banner posts:', err)
        setBannerPosts([])
      } finally {
        setBannerLoading(false)
      }
    }

    fetchBannerPosts()
  }, [userId])

  // Auto-scroll images for banner posts with multiple media
  useEffect(() => {
    bannerPosts.forEach(post => {
      if (post.mediaUrls && post.mediaUrls.length > 1) {
        // Clear existing interval if any
        if (autoScrollIntervals.current[post.postId]) {
          clearInterval(autoScrollIntervals.current[post.postId])
        }

        // Set up new auto-scroll interval
        autoScrollIntervals.current[post.postId] = setInterval(() => {
          setCurrentImageIndex(prev => ({
            ...prev,
            [post.postId]: ((prev[post.postId] || 0) + 1) % post.mediaUrls.length
          }))
        }, 3000) // Change image every 3 seconds
      }
    })

    // Cleanup intervals on unmount
    return () => {
      Object.values(autoScrollIntervals.current).forEach(interval => {
        clearInterval(interval)
      })
    }
  }, [bannerPosts])

  // Manual image navigation
  const handlePrevImage = (postId: number, mediaLength: number) => {
    // Clear auto-scroll interval when manually navigating
    if (autoScrollIntervals.current[postId]) {
      clearInterval(autoScrollIntervals.current[postId])
    }
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + mediaLength) % mediaLength
    }))
  }

  const handleNextImage = (postId: number, mediaLength: number) => {
    // Clear auto-scroll interval when manually navigating
    if (autoScrollIntervals.current[postId]) {
      clearInterval(autoScrollIntervals.current[postId])
    }
    setCurrentImageIndex(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % mediaLength
    }))
  }

  const handleCallToAction = (url: string | null) => {
    if (url) {
      let finalUrl = url.trim()
      // Add https:// if no protocol is specified
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl
      }
      window.open(finalUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Fetch sponsored hashtags on component mount
  useEffect(() => {
    const fetchSponsoredHashtags = async () => {
  try {
    setSponsoredLoading(true)
    setSponsoredError(null)

    const adminUser = localStorage.getItem('uuid')

    const response = await fetchWithAuth(
      `https://institutional-bo.paybito.com:8443/BitohubService/feeds/getHashtagsByUser?adminUser=${adminUser}&offset=1&limit=10`
    )

    const result: SponsoredHashtagsAPIResponse = await response.json()

    if (result.success && result.data) {
      // Filter only published hashtags
      const publishedHashtags = result.data.filter(
        (item) => item.isPublished === 1
      )

      // Show max 6
      setSponsoredHashtags(publishedHashtags.slice(0, 6))
    } else {
      setSponsoredHashtags([])
    }
  } catch (err) {
    setSponsoredError('Error loading sponsored hashtags')
    console.error('Error fetching sponsored hashtags:', err)
    setSponsoredHashtags([])
  } finally {
    setSponsoredLoading(false)
  }
}


    fetchSponsoredHashtags()
  }, [])

  // Fetch trending topics on component mount
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        setTrendingLoading(true)
        setTrendingError(null)
        const response = await fetchWithAuth(
          'https://institutional-bo.paybito.com:8443/BitohubService/trending/getTopTrendingTopics?limit=10'
        )
        const result = await response.json()

        if (result.success && result.data) {
          const transformedTopics: TrendingTopic[] = result.data.map((topic: TrendingAPIResponse) => ({
            tag: `${topic.hashtag}`,
            posts: `${topic.mentions.toLocaleString()} ${topic.mentions === 1 ? 'post' : 'posts'}`,
            growth: topic.trendPercentage > 0
              ? `+${topic.trendPercentage.toFixed(1)}%`
              : topic.trendScore > 0
                ? `${topic.trendScore.toFixed(0)}`
                : 'New'
          }))
          setTrendingTopics(transformedTopics.slice(0, 4))
        } else {
          setTrendingError('Failed to load trending topics')
        }
      } catch (err) {
        setTrendingError('Error loading trending topics')
        console.error('Error fetching trending topics:', err)
      } finally {
        setTrendingLoading(false)
      }
    }

    fetchTrendingTopics()
  }, [])

  // Fetch connection highlights on component mount
  useEffect(() => {
    const fetchConnectionHighlights = async () => {
      if (!userId) return

      try {
        setHighlightsLoading(true)
        setHighlightsError(null)

        const response = await fetchWithAuth(
          'https://institutional-bo.paybito.com:8443/BitohubService/feeds/getConnectionHighlights',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: Number(userId),
              topN: 10,
              useCache: true
            })
          }
        )

        const result: ConnectionHighlightsResponse = await response.json()

        // Updated to access highlights from result.data.highlights
        if (result.success && result.data && result.data.highlights) {
          // Filter out connections with 0 total score and take top 4
          // const activeHighlights = result.data.highlights
          // .filter(h => h.totalScore > 0)
          // .slice(0, 4)
            const activeHighlights = result.data.highlights.filter(
    (h) => h.friendName && h.friendName.trim() !== ''
  )

          setConnectionHighlights(activeHighlights)
        } else {
          setHighlightsError(result.message || 'Failed to load connection highlights')
        }
      } catch (err) {
        setHighlightsError('Error loading connection highlights')
        console.error('Error fetching connection highlights:', err)
      } finally {
        setHighlightsLoading(false)
      }
    }

    fetchConnectionHighlights()
  }, [userId])

  // Fetch poll insights on component mount
  useEffect(() => {
    const fetchPollInsights = async () => {
      if (!userId) return

      try {
        setPollInsightsLoading(true)
        setPollInsightsError(null)

        // API Parameters:
        // userId: The logged-in user ID (0 for no user context)
        // sortBy: 'MOST RECENT' (default) or 'ENDING SOON'
        // onlyActive: 'Y' for active polls only, 'N' for all polls
        // tab: 'ALL' (default), 'PARTICIPATED', or blank
        const response = await fetchWithAuth(
          `https://institutional-bo.paybito.com:8443/BitohubService/poll/getPollInsights?userId=0&sortBy=${pollSortBy}&onlyActive=N&tab=${pollTab}&viewerId=${localStorage.getItem('childUserId')}`
        )
        const result: PollInsightsAPIResponse = await response.json()

        if (result.success && result.data) {
          setPollInsights({
            activePolls: result.data.activePolls,
            totalVotes: result.data.totalVotes,
            votesThisWeek: result.data.votesThisWeek
          })
        } else {
          setPollInsightsError('Failed to load poll insights')
        }
      } catch (err) {
        setPollInsightsError('Error loading poll insights')
        console.error('Error fetching poll insights:', err)
      } finally {
        setPollInsightsLoading(false)
      }
    }

    fetchPollInsights()
  }, [userId, pollSortBy, pollOnlyActive, pollTab])

  // Fetch users to follow on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const userType = localStorage.getItem('userType');
        const actorId =
          userType === 'USER'
            ? localStorage.getItem('childUserId')
            : localStorage.getItem('childPageId');

        const actor = localStorage.getItem('userType');

        const url = `https://institutional-bo.paybito.com:8443/BitohubService/feeds/whoToFollowSuggestion?actorId=${actorId}&actorType=${actor}&limit=50`;

        const response = await fetchWithAuth(url);
        const result = await response.json();

        if (result.success && result.data) {
          setSuggestedUsers(result.data);
        } else {
          setError('Failed to load suggestions');
        }
      } catch (err) {
        setError('Error loading suggestions');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => {
    fetchUsers()
      
    }, 2000);
  }, [userId])

  // Handle follow/unfollow action
  const handleFollow = async (followingId: number, entityType: string, followerId: string, followingType: string) => {
    try {
      setFollowLoading(prev => new Set(prev).add(followingId))

      const isCurrentlyFollowing = followingUsers.has(followingId)
      const endpoint = 'https://institutional-bo.paybito.com:8443/BitohubService/profile/followUnfollowUser'

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: Number(followerId),
          followingId: followingId,

          followerType: followingType,
          followingType: entityType,

        })
      })

      const result = await response.json()

      if (result.success) {
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          if (isCurrentlyFollowing) {
            newSet.delete(followingId)
          } else {
            newSet.add(followingId)
          }
          return newSet
        })
      } else {
        console.error('Follow/Unfollow failed:', result.message)
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err)
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(followingId)
        return newSet
      })
    }
  }

  const handleProfileClick = (userId: number, pageId:number) => {
    router.push(`/public/${userId}/${pageId}`)
  }

  const getAvatarColor = (id: number) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DFE6E9']
    return colors[id % colors.length]
  }

  const getAvatarInitials = (fullName: string) => {
    if (!fullName) return '?'
    const nameParts = fullName.trim().split(' ')
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }

  const displayedUsers = showAll ? suggestedUsers : suggestedUsers.slice(0, 5)
  const hasMoreUsers = suggestedUsers.length > 5

  return (
    <>
      

      {/* Sponsored Banner Posts - Each banner in its own compact card */}
      {!bannerLoading && bannerPosts.length > 0 && (
        <>
          {bannerPosts.slice(0, 2).map((post) => (
            <Card 
              key={post.postId}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }
              }}
              onClick={() => handleCallToAction(post.callToActionUrl)}
            >
              <CardContent sx={{ p: '0 !important' }}>
                {/* Header - compact */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 0.5
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    Sponsored
                  </Typography>
                  <Chip
                    label="Ad"
                    size="small"
                    sx={{
                      bgcolor: '#FF5722',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.5rem',
                      height: 14,
                      '& .MuiChip-label': { px: 0.5 }
                    }}
                  />
                </Box>

                {/* Media Content - 4:1 aspect ratio for very compact banner */}
                {post.mediaUrls && post.mediaUrls.length > 0 && (
                  <Box sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 80, // Fixed height instead of aspect ratio
                    bgcolor: '#f5f5f5',
                    overflow: 'hidden'
                  }}>
                    <Box
                      component="img"
                      src={post.mediaUrls[currentImageIndex[post.postId] || 0]}
                      alt={post.adHeadline || 'Sponsored content'}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />

                    {/* Navigation dots - Only show if multiple images */}
                    {post.mediaUrls.length > 1 && (
                      <Box sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 0.4
                      }}>
                        {post.mediaUrls.map((_, index) => (
                          <Box
                            key={index}
                            sx={{
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              bgcolor: (currentImageIndex[post.postId] || 0) === index ? 'white' : 'rgba(255, 255, 255, 0.5)',
                              transition: 'all 0.3s'
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Ad Details - compact */}
                <Box sx={{ px: 1.5, py: 0.75 }}>
                  {/* Ad Headline and CTA in same row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      {/* Ad Headline */}
                      {post.adHeadline && (
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{
                            fontSize: '0.7rem',
                            color: 'text.primary',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.2
                          }}
                        >
                          {post.adHeadline}
                        </Typography>
                      )}

                      {/* Website URL */}
                      {post.websiteUrl && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.6rem',
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {post.websiteUrl}
                          </Typography>
                          <OpenInNewIcon sx={{ fontSize: 9, ml: 0.3, color: 'text.secondary', flexShrink: 0 }} />
                        </Box>
                      )}
                    </Box>

                    {/* Call to Action Button - compact */}
                    {post.cta && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCallToAction(post.callToActionUrl)
                        }}
                        sx={{
                          bgcolor: '#0095f6',
                          color: 'white',
                          textTransform: 'none',
                          fontSize: '0.6rem',
                          fontWeight: 600,
                          py: 0.25,
                          px: 1.25,
                          minHeight: 22,
                          minWidth: 'auto',
                          borderRadius: 1,
                          flexShrink: 0,
                          '&:hover': {
                            bgcolor: '#0077cc'
                          }
                        }}
                      >
                        {post.cta}
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Sponsored Hashtags - Moved up, show first */}
      {!sponsoredLoading && sponsoredHashtags.length > 0 && (
        <Card sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TagIcon sx={{ color: '#FF9800', mr: 1, fontSize: { xs: 18, sm: 20 } }} />
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                  Sponsored
                </Typography>
              </Box>
              <Chip
                label="Ad"
                size="small"
                sx={{
                  bgcolor: '#FF9800',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 18
                }}
              />
            </Box>

            {sponsoredError ? (
              <Alert severity="error" sx={{ mb: 2 }}>{sponsoredError}</Alert>
            ) : (
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75
              }}>
                {sponsoredHashtags.map((hashtag) => (
                  <Link
                    key={hashtag.hashtagId}
                    href={`/hashtagposts/${hashtag.hashtagName}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Chip
                      label={`#${hashtag.hashtagName}`}
                      variant="outlined"
                      size="small"
                      sx={{
                        borderColor: '#FF9800',
                        color: '#FF9800',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: '#FFF3E0',
                          borderColor: '#F57C00',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 4px rgba(255, 152, 0, 0.2)'
                        }
                      }}
                    />
                  </Link>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trending Topics */}
      <Card sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: '16px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingIcon sx={{ color: '#4267b2', mr: 1, fontSize: { xs: 20, sm: 24 } }} />
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Trending Topics
            </Typography>
          </Box>

          {trendingLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : trendingError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{trendingError}</Alert>
          ) : trendingTopics.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No trending topics available
            </Typography>
          ) : (
            trendingTopics.map((topic, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link
                    href={`/hashtagposts/${topic.tag}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#4267b2'
                        }
                      }}
                    >
                      #{topic.tag}
                    </Typography>
                  </Link>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingIcon sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5, color: '#4267b2' }} />
                    <Typography variant="caption" sx={{ color: '#4267b2', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {topic.growth}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                  {topic.posts}
                </Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      {/* Connection Highlights */}
      <Card sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: '16px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ color: '#4267b2', mr: 1, fontSize: { xs: 20, sm: 24 } }}>⭐</Box>
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Connection Highlights
            </Typography>
          </Box>

          {highlightsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : highlightsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{highlightsError}</Alert>
          ) : connectionHighlights.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No highlights available
            </Typography>
          ) : (
            <>
              {connectionHighlights.slice(0, 4).map((highlight) => (
                <Box
                  key={highlight.friendId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                    p: 1,
                    borderRadius: 1
                  }}
                  onClick={() => handleProfileClick(highlight.friendId,highlight.pageId)}
                >
                  <Avatar
                    src={highlight.profilePictureUrl || undefined}
                    sx={{
                      bgcolor: getAvatarColor(highlight.friendId),
                      mr: 1.5,
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      fontSize: { xs: 14, sm: 16 }
                    }}
                  >
                    {!highlight.profilePictureUrl && getAvatarInitials(highlight.friendName)}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {highlight.friendName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {highlight.connectionActivity }
                    </Typography>
                  </Box>
                </Box>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Poll Insights */}
      <Card sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: '16px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ChartIcon sx={{ color: '#4267b2', mr: 1, fontSize: { xs: 20, sm: 24 } }} />
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Poll Insights
            </Typography>
          </Box>

          {pollInsightsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : pollInsightsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{pollInsightsError}</Alert>
          ) : (
            <>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: '1fr' },
                gap: 2
              }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Active Polls
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                    {pollInsights.activePolls}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    Total Votes
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                    {pollInsights.totalVotes.toLocaleString()}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    This Week
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ fontSize: { xs: '1.2rem', sm: '2rem' } }}>
                    {pollInsights.votesThisWeek}
                  </Typography>
                </Box>
              </Box>
              <Button
                size="small"
                onClick={onViewAllPolls}
                sx={{
                  color: '#4267b2',
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '&:hover': { bgcolor: 'rgba(66, 103, 178, 0.08)' }
                }}
              >
                View All Polls
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Who to Follow */}
      <Card sx={{
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: '16px' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <GroupAddIcon sx={{ color: '#4267b2', mr: 1, fontSize: { xs: 20, sm: 24 } }} />
            <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Who to Follow
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={30} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : suggestedUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No suggestions available
            </Typography>
          ) : (
            <>
              <Box sx={{
                maxHeight: showAll ? 400 : 'none',
                overflowY: showAll ? 'auto' : 'visible',
                pr: showAll ? 1 : 0,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}>
                {displayedUsers.map((user) => (
                  <Box key={user.userId} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={user.profilePicture || undefined}
                      sx={{
                        bgcolor: getAvatarColor(user.userId),
                        mr: 1.5,
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        fontSize: { xs: 14, sm: 16 },
                        cursor: 'pointer'
                      }}
                      onClick={() => handleProfileClick(user.userId, user.pageId)}
                    >
                      {!user.profilePicture && getAvatarInitials(user.displayName)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{
                            fontSize: { xs: '0.85rem', sm: '0.875rem' },
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleProfileClick(user.userId, user.pageId)}
                        >
                          {user.displayName}
                        </Typography>
                        {user.isVerified === 'Y' && (
                          <Box sx={{ color: '#4267b2', ml: 0.5, fontSize: { xs: 12, sm: 14 } }}>⭐</Box>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}
                      >
                        {user.username}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      >
                        {user.totalFollowers} followers
                        {user.mutualFollowCount > 0 && ` • ${user.mutualFollowCount} mutual`}
                      </Typography>
                    </Box>
                    <Button
                      variant={followingUsers.has(user.userId) ? "outlined" : "contained"}
                      size="small"
                      disabled={followLoading.has(user.userId)}
                      // onClick={() => handleFollow(user.userId)}
                      onClick={() => handleFollow(user.userId && user.userId !== 0 ? user.userId : (user.pageId || 0),
                        user.entityType,
                        (localStorage.getItem('childPageId') || ''),
                        (localStorage.getItem('userType') || ''),
                      )}
                      sx={{
                        borderRadius: '16px',
                        bgcolor: followingUsers.has(user.userId) ? 'transparent' : '#4267b2',
                        borderColor: '#4267b2',
                        color: followingUsers.has(user.userId) ? '#4267b2' : 'white',
                        textTransform: 'none',
                        fontSize: { xs: 10, sm: 12 },
                        px: { xs: 1.5, sm: 2 },
                        minWidth: { xs: 70, sm: 80 },
                        '&:hover': {
                          bgcolor: followingUsers.has(user.userId) ? 'rgba(66, 103, 178, 0.08)' : '#365899',
                          borderColor: '#4267b2'
                        }
                      }}
                    >
                      {followLoading.has(user.userId) ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : followingUsers.has(user.userId) ? (
                        'Following'
                      ) : (
                        'Follow'
                      )}
                    </Button>
                  </Box>
                ))}
              </Box>

              {hasMoreUsers && (
                <Button
                  size="small"
                  onClick={() => setShowAll(!showAll)}
                  sx={{
                    color: '#4267b2',
                    textTransform: 'none',
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    width: '100%',
                    mt: 1,
                    '&:hover': { bgcolor: 'rgba(66, 103, 178, 0.08)' }
                  }}
                >
                  {showAll ? 'Show Less' : `Show More (${suggestedUsers.length - 5} more)`}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}

export default SidebarComponent