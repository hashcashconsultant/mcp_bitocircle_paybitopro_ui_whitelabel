'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import {
  Box,
  Container,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Typography,
  Button,
  Snackbar,
  alpha
} from '@mui/material'
import CreatePostDialog from '@/components/CreatePostDialog'
import CreateReelDialog from '@/components/CreateReelDialog'
import CommentDialog from '@/components/CommentDialog'

// Import the new modular components
import StoryComponent from '@/components/StoryComponent'
import CreatePostComponent from '@/components/CreatePostComponent'
import SidebarComponent from '@/components/SidebarComponent'
import FeedsComponent from '@/components/FeedsComponent'
import { FeedSkeletonLoader } from '@/components/posts/PostSkeletons'

import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import useAuthReady from '@/hooks/useAuthReady '
import useWebSocketFeeds from '@/hooks/useWebSocketFeeds'
import { tokenCookie } from '../hooks/useAuthRedirect';

// ==================== POST TYPE DEFINITIONS ====================

export type PostType = 'text' | 'image' | 'video' | 'poll' | 'reel' | 'livestream'

export interface BasePost {
  id: number
  type: PostType
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string,
    userId?: number
    isUserFollowing?: number
    isVerified?: boolean
    pageId?: number
    entityType?: string
    profilePicture: string,
  }
  contentType: string
  content: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  isSponsored?: boolean
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string  
  visibilityType?: string | number
  location?: string | null
  // Tagged users fields
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: number
  // Shared post fields
  isSharedPost?: boolean
  shareId?: number
  sharedByUserId?: number
  sharerUserName?: string
  sharerFullName?: string
  sharerProfilePicture?: string
  shareMessage?: string
  shareCreatedAt?: string
  campaignId?: number
  isProductTagged?: number
  taggedProducts?: TaggedProduct[]
  isCommentAllowed?: number
  isGifAllowed?: number
}

export interface TextPost extends BasePost {
  type: 'text'
}

export interface ImagePost extends BasePost {
  type: 'image'
  images: string[]
}

export interface VideoPost extends BasePost {
  type: 'video'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
}

export interface ReelPost extends BasePost {
  type: 'reel'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
  title?: string
}

export interface PollPost extends BasePost {
  type: 'poll'
  question: string
  options: Array<{
    id: number
    text: string
    votes: number
  }>
  totalVotes: number
  hasVoted?: boolean
  votedOptionId?: number
  endTime?: string
  pollId?: number
}

// ==================== LIVESTREAM POST TYPE ====================

// Live viewer info from API
export interface LiveViewer {
  viewerId: number
  viewerName: string
  profilePicture?: string
}

export interface LiveStreamPost extends BasePost {
  type: 'livestream'
  streamId: string
  channelName: string
  agoraAppId: string
  title: string
  description?: string
  viewerCount: number
  streamStatus: string
  streamStartedAt: string
  liveViewers?: LiveViewer[]
}

export type Post = TextPost | ImagePost | VideoPost | PollPost | ReelPost | LiveStreamPost

// Regular posts (excluding livestream) - for dialogs that don't support livestream
export type RegularPost = TextPost | ImagePost | VideoPost | PollPost | ReelPost

// ==================== API RESPONSE TYPES ====================

interface PollOption {
  id: number | null
  type: string | null
  optionId: number
  optionText: string
  voteCount: number
}

interface FeedItem {
  userId: number
  pageId: number
  postId: number
  userName: string
  fullName: string
  content: string | null
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'POLL' | 'REEL' | null
  mediaUrls: string[] | null
  categoryList: PollOption[] | null
  hashtags: string | null
  location: string | null
  createdAt: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: 'Y' | 'N' | string
  hasBookmarked: 'Y' | 'N' | string
  pollId: number
  pollQuestion: string | null
  pollEndsAt: string | null
  hasVoted: 'Y' | 'N' | string
  totalVotes: number
  optionId: number | null
  optionText: string | null
  voteCount: number
  isUserFollowing?: 1 | 0
  contentType: string
  entityType?: string
  // Reel-specific fields
  title?: string
  coverImage?: string
  reelDurtion?: number
  isSponsored?: 0 | 1
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  profilePicture?: string | null
  visibilityType?: string | number
  // Tagged users fields
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: 0 | 1
  // Shared post fields
  isSharedPost?: 0 | 1
  shareId?: number
  sharedByUserId?: number
  sharerUserName?: string
  sharerFullName?: string
  sharerProfilePicture?: string
  shareMessage?: string
  shareCreatedAt?: string
  campaignId?: number
  // ==================== LIVESTREAM FIELDS ====================
  feedType?: 'POST' | 'LIVESTREAM'
  isLive?: boolean
  streamId?: string | null
  channelName?: string | null
  agoraAppId?: string | null
  viewerCount?: number | null
  streamStatus?: string | null
  streamStartedAt?: string | null
  description?: string | null
  liveViewers?: Array<{
    viewerId: number
    viewerName: string
    profilePicture?: string
  }> | null
    isProductTagged?: 0 | 1
  taggedProducts?: TaggedProduct[]
  isCommentAllowed?: number
  isGifAllowed?: number

}

interface FeedsResponse {
  success: boolean
  message: string
  data: FeedItem[]
  errorCode: string | null
}

export interface TaggedProduct {
  productId: number
  productName: string
  productType: string // "DIGITAL", "PHYSICAL", etc.
  productDescription: string
  productImageUrl: string
  productPrice: number
  shopOwnerId: number
  shopOwnerName: string
}

// ==================== HELPER FUNCTIONS ====================

// Generate consistent avatar color based on user ID
const generateAvatarColor = (userId: number): string => {
  const colors = [
    '#4267b2', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]
  return colors[userId % colors.length]
}

// Get post type from API type
const getPostType = (apiType: string | null): PostType => {
  switch (apiType) {
    case 'TEXT': return 'text'
    case 'PHOTO': return 'image'
    case 'VIDEO': return 'video'
    case 'POLL': return 'poll'
    case 'REEL': return 'reel'
    default: return 'text'
  }
}

// Format duration for reels
const formatDuration = (seconds?: number): string | undefined => {
  if (!seconds) return undefined
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}



// ==================== CONVERT FEED TO POST ====================

const convertFeedToPost = (feedItems: FeedItem[]): Post[] => {
  const posts: Post[] = []

  feedItems.forEach(item => {
    // ==================== HANDLE LIVESTREAM ====================
    // Check for LIVESTREAM feedType with LIVE status
    if (item.feedType === 'LIVESTREAM' && (item.isLive || item.streamStatus === 'LIVE')) {
      const liveStreamPost: LiveStreamPost = {
        id: typeof item.streamId === 'number' ? item.streamId : parseInt(item.streamId || '0'),
        type: 'livestream',
        user: {
          name: item.fullName || 'Unknown',
          username: item.userName || '@unknown',
          avatar: item.fullName?.charAt(0).toUpperCase() || 'U',
          avatarColor: generateAvatarColor(item.userId),
          time: item.streamStartedAt || '',
          userId: item.userId,
          isUserFollowing: item.isUserFollowing,
          pageId: item.pageId || 0,
          entityType: item.entityType,
          profilePicture: item.profilePicture || '',
        },
        content: item.description || '',
        contentType: 'LIVESTREAM',
        likes: item.likeCount || 0,
        comments: item.commentCount || 0,
        shares: item.shareCount || 0,
        isLiked: false,
        isSaved: false,
        // Live stream specific fields
        streamId: String(item.streamId || ''),
        channelName: item.channelName || '',
        agoraAppId: item.agoraAppId || '',
        title: item.title || 'Live Stream',
        description: item.description || undefined,
        viewerCount: item.viewerCount || 0,
        streamStatus: item.streamStatus || 'LIVE',
        streamStartedAt: item.streamStartedAt || new Date().toISOString(),
        // Live viewers from API
        liveViewers: item.liveViewers?.map(v => ({
          viewerId: v.viewerId,
          viewerName: v.viewerName,
          profilePicture: v.profilePicture
        })) || [],
        isProductTagged: item.isProductTagged || 0,
        taggedProducts: item.taggedProducts || [],
      }

      posts.push(liveStreamPost)
      return // Skip to next item
    }

    // ==================== HANDLE REGULAR POSTS ====================
    // Skip items without postId (invalid regular posts)
    if (!item.postId) return

    const basePost: BasePost = {
      id: item.postId,
      type: getPostType(item.postType),
      user: {
        name: item.fullName,
        username: item.userName,
        avatar: item?.fullName?.charAt(0).toUpperCase() || 'U',
        avatarColor: generateAvatarColor(item.userId),
        time: item.createdAt || '',
        userId: item.userId,
        isUserFollowing: item.isUserFollowing,
        pageId: item.pageId,
        entityType: item.entityType,
        profilePicture: item.profilePicture || '',
      },
      contentType: item.contentType,
      content: item.content || '',
      likes: item.likeCount,
      comments: item.commentCount,
      shares: item.shareCount,
      isLiked: item.hasLiked === 'Y',
      isSaved: item.hasBookmarked === 'Y',
      isSponsored: item.isSponsored === 1,
      cta: item.cta,
      callToActionUrl: item.callToActionUrl,
      adHeadline: item.adHeadline,
      adHeadlineImage: item.adHeadlineImage,
      visibilityType: item.visibilityType,
      location: item.location,
      // Tagged users fields
      taggedUserIds: item.taggedUserIds || '',
      taggedData: item.taggedData || '',
      isTaggedPost: item.isTaggedPost || 0,
      // Shared post fields
      isSharedPost: item.isSharedPost === 1,
      shareId: item.shareId || 0,
      sharedByUserId: item.sharedByUserId || 0,
      sharerUserName: item.sharerUserName || '',
      sharerFullName: item.sharerFullName || '',
      sharerProfilePicture: item.sharerProfilePicture || '',
      shareMessage: item.shareMessage || '',
      shareCreatedAt: item.shareCreatedAt || '',
      campaignId: item.campaignId || 0,
      isProductTagged: item.isProductTagged || 0,
  taggedProducts: item.taggedProducts || [],
  isCommentAllowed: item.isCommentAllowed || 0,
  isGifAllowed: item.isGifAllowed || 0
    }

    switch (item.postType) {
      case 'TEXT':
        posts.push({
          ...basePost,
          type: 'text'
        } as TextPost)
        break

      case 'PHOTO':
        posts.push({
          ...basePost,
          type: 'image',
          images: item.mediaUrls || []
        } as ImagePost)
        break

      case 'VIDEO':
        posts.push({
          ...basePost,
          type: 'video',
          videoUrl: item.mediaUrls?.[0] || '',
          thumbnailUrl: item.mediaUrls?.[1],
          duration: undefined,
          views: undefined
        } as VideoPost)
        break

      case 'REEL':
        console.log('Processing REEL:', {
          postId: item.postId,
          videoUrl: item.mediaUrls?.[0],
          duration: item.reelDurtion,
          title: item.title
        })

        const reelPost: ReelPost = {
          ...basePost,
          type: 'reel',
          videoUrl: item.mediaUrls?.[0] || '',
          thumbnailUrl: item.coverImage || item.mediaUrls?.[1] || undefined,
          duration: formatDuration(item.reelDurtion),
          views: undefined,
          title: item.title
        }

        console.log('Created reel post:', reelPost)
        posts.push(reelPost)
        break

      case 'POLL':
        const options = (item.categoryList || []).map(option => ({
          id: option.optionId,
          text: option.optionText,
          votes: option.voteCount
        }))

        const pollPost: PollPost = {
          ...basePost,
          type: 'poll',
          question: item.pollQuestion || '',
          options: options,
          totalVotes: item.totalVotes,
          hasVoted: item.hasVoted === 'Y',
          votedOptionId: item.hasVoted === 'Y' ? item.optionId || undefined : undefined,
          endTime: item.pollEndsAt || undefined,
          pollId: item.pollId
        }

        posts.push(pollPost)
        break
    }
  })

  return posts
}

// ==================== MAIN COMPONENT ====================

const BitoHubFeed = () => {
  const theme = useTheme()

  const { isAuthenticated } = useAuth()
  const { isReady: isAuthReady, isWaiting: isAuthWaiting } = useAuthReady({
    requiredKeys: ['childUserId', 'pageId'],
    timeout: 10000
  })
  // Add this near your other media queries
  const isXL = useMediaQuery(theme.breakpoints.up('xl'))  // 1536px+
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const router = useRouter()

  // Ref for sidebar to calculate sticky top
  const sidebarRef = useRef<HTMLDivElement>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const [stickyTop, setStickyTop] = useState(0)

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const INACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

  const initialPosts: Post[] = []

  // State management
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false)
  const [feedsError, setFeedsError] = useState<string | null>(null)

  // Pagination state
  const [currentOffset, setCurrentOffset] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const POSTS_LIMIT = 10

  const isFetchingRef = useRef(false)

  const [openPostDialog, setOpenPostDialog] = useState(false)
  const [openReelDialog, setOpenReelDialog] = useState(false)
  const [openCommentDialog, setOpenCommentDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<RegularPost | null>(null)
  const [sharedPost, setSharedPost] = useState<RegularPost | null>(null)
  const [editingPost, setEditingPost] = useState<RegularPost | null>(null)

  // Snackbar state for success/error messages
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  const [isCreatingReel, setIsCreatingReel] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  // Calculate sticky top value based on sidebar height
  useEffect(() => {
    if (!isDesktop) return

    const calculateStickyTop = () => {
      const sidebar = sidebarRef.current
      const container = mainContainerRef.current

      if (!sidebar || !container) return

      const sidebarHeight = sidebar.offsetHeight
      const containerHeight = container.clientHeight
      const padding = 24

      if (sidebarHeight <= containerHeight - padding * 2) {
        setStickyTop(0)
      } else {
        const topValue = containerHeight - sidebarHeight - padding
        setStickyTop(topValue)
      }
    }

    calculateStickyTop()

    window.addEventListener('resize', calculateStickyTop)

    const resizeObserver = new ResizeObserver(calculateStickyTop)
    if (sidebarRef.current) {
      resizeObserver.observe(sidebarRef.current)
    }

    return () => {
      window.removeEventListener('resize', calculateStickyTop)
      resizeObserver.disconnect()
    }
  }, [isDesktop, posts])

  // Handler for new posts from WebSocket
  const handleNewPostFromSocket = useCallback((newPostData: FeedItem) => {
    console.log('[WebSocket] New post received:', newPostData.postId, 'isSharedPost:', newPostData.isSharedPost, 'shareId:', newPostData.shareId)

    const newPost = convertFeedToPost([newPostData])[0]

    if (newPost) {
      setPosts(prevPosts => {
        // For shared posts, use shareId for uniqueness check
        if (newPost.isSharedPost && newPost.shareId) {
          const existingIndex = prevPosts.findIndex(p =>
            p.isSharedPost && p.shareId === newPost.shareId
          )

          if (existingIndex !== -1) {
            // Update existing shared post
            const updatedPosts = [...prevPosts]
            updatedPosts[existingIndex] = newPost
            return updatedPosts
          } else {
            // Add new shared post at the beginning
            return [newPost, ...prevPosts]
          }
        }

        // For non-shared posts, check by postId but only among non-shared posts
        const existingIndex = prevPosts.findIndex(p =>
          p.id === newPost.id && !p.isSharedPost
        )

        if (existingIndex !== -1) {
          const updatedPosts = [...prevPosts]
          updatedPosts[existingIndex] = newPost
          return updatedPosts
        } else {
          return [newPost, ...prevPosts]
        }
      })
    }
  }, [])

  // Handler to clean up stale livestream posts when full feed data arrives
const handleFeedReceived = useCallback((feedItems: FeedItem[]) => {
  // Get all active livestream streamIds from the latest feed
  const activeLivestreamIds = new Set(
    feedItems
      .filter(item => item.feedType === 'LIVESTREAM' && (item.isLive || item.streamStatus === 'LIVE'))
      .map(item => String(item.streamId))
  )

  setPosts(prevPosts => {
    const hasStaleStreams = prevPosts.some(
      post => post.type === 'livestream' && 
      !activeLivestreamIds.has((post as LiveStreamPost).streamId)
    )

    if (!hasStaleStreams) return prevPosts // No change needed

    console.log('[BitoHubFeed] Removing ended livestream(s) from feed')
    return prevPosts.filter(post => {
      if (post.type === 'livestream') {
        return activeLivestreamIds.has((post as LiveStreamPost).streamId)
      }
      return true // Keep all non-livestream posts
    })
  })
}, [])

  // Handler for post updates from WebSocket
  const handlePostUpdateFromSocket = useCallback((updatedPostData: FeedItem) => {
    console.log('[WebSocket] Post update received:', updatedPostData.postId, 'isSharedPost:', updatedPostData.isSharedPost, 'shareId:', updatedPostData.shareId)

    setPosts(prevPosts => {
      return prevPosts.map(post => {
        // For shared posts, match by shareId to avoid overwriting shared post with original
        if (updatedPostData.isSharedPost === 1 && updatedPostData.shareId) {
          // Only update if this is the same shared post (matching shareId)
          if (post.isSharedPost && post.shareId === updatedPostData.shareId) {
            return {
              ...post,
              likes: updatedPostData.likeCount,
              comments: updatedPostData.commentCount,
              shares: updatedPostData.shareCount,
              isLiked: updatedPostData.hasLiked === 'Y',
              isSaved: updatedPostData.hasBookmarked === 'Y'
            }
          }
          return post
        }

        // For non-shared posts, match by postId but exclude shared posts with same original postId
        if (post.id === updatedPostData.postId && !post.isSharedPost) {
          return {
            ...post,
            likes: updatedPostData.likeCount,
            comments: updatedPostData.commentCount,
            shares: updatedPostData.shareCount,
            isLiked: updatedPostData.hasLiked === 'Y',
            isSaved: updatedPostData.hasBookmarked === 'Y'
          }
        }
        return post
      })
    })
  }, [])

  // Handler for WebSocket errors
  const handleWebSocketError = useCallback((error: string) => {
    console.error('[WebSocket] Error:', error)
  }, [])

  // WebSocket for real-time feed updates
  const {
    isConnected: wsIsConnected,
    sendMessage: wsSendMessage,
    reconnect: wsReconnect,
    isPolling: wsIsPolling,
    startPolling: wsStartPolling,
    stopPolling: wsStopPolling,
    updateOffset: wsUpdateOffset,
    resetOffset: wsResetOffset
  } = useWebSocketFeeds({
    userId: localStorage.getItem('childUserId') || null,
    pageId: localStorage.getItem('pageId') || null,
    limit: POSTS_LIMIT,
    enabled: isAuthReady && isAuthenticated,
    pollingInterval: 15000,
    onNewPost: handleNewPostFromSocket,
    onPostUpdate: handlePostUpdateFromSocket,
    onError: handleWebSocketError,
    onFeedReceived: handleFeedReceived
  })

  // Update wsConnected state
  useEffect(() => {
    setWsConnected(wsIsConnected)
  }, [wsIsConnected])

  // In the fetchFeeds function, after successfully loading posts:

const fetchFeeds = useCallback(async (offset: number = 1, isLoadMore: boolean = false) => {
  if (isFetchingRef.current) return

  isFetchingRef.current = true
  setIsLoadingFeeds(true)
  setFeedsError(null)

  try {
    if (isFirstLoad && !isLoadMore && posts.length === 0) {
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    const response = await fetchWithAuth(
      `${BITOHUBWEBSERVICE}/feeds/getFeeds?offset=${offset}&limit=${POSTS_LIMIT}&userId=${localStorage.getItem('childUserId') || ''}&pageId=${localStorage.getItem('pageId') || ''}`,
      {
        method: 'GET'
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const feedsResponse: FeedsResponse = await response.json()

    if (feedsResponse.success) {
      const feedPosts = convertFeedToPost(feedsResponse.data)

      if (isLoadMore) {
        setPosts(prevPosts => {
          const existingIds = new Set(prevPosts.map(p => {
            if (p.type === 'livestream') {
              return `live-${(p as LiveStreamPost).streamId}`
            }
            // Also consider shared posts
            if (p.isSharedPost && p.shareId) {
              return `share-${p.shareId}`
            }
            return `post-${p.id}`
          }))
          const uniqueNewPosts = feedPosts.filter(p => {
            const key = p.type === 'livestream'
              ? `live-${(p as LiveStreamPost).streamId}`
              : p.isSharedPost && p.shareId
                ? `share-${p.shareId}`
                : `post-${p.id}`
            return !existingIds.has(key)
          })
          return [...prevPosts, ...uniqueNewPosts]
        })
        setHasLoadedOnce(true)
        
        // ✅ FIX: Update offset for next load
        // Check if we got fewer posts than requested, meaning no more posts
        if (feedPosts.length < POSTS_LIMIT) {
          setHasMorePosts(false)
        } else {
          // Increment offset for next fetch
          setCurrentOffset(prevOffset => prevOffset + 1)
        }
      } else {
        // Initial load or refresh
        setPosts(feedPosts)
        setHasLoadedOnce(true)
        
        // ✅ FIX: Set offset to 2 for next load (since we just loaded offset 1)
        if (feedPosts.length < POSTS_LIMIT) {
          setHasMorePosts(false)
        } else {
          setCurrentOffset(2)
          setHasMorePosts(true)
        }
      }
    } else {
      throw new Error(feedsResponse.message || 'Failed to load feeds')
    }

  } catch (error) {
    console.error('Error fetching feeds:', error)

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      setFeedsError('Network error. Please check your internet connection.')
    } else if (error instanceof Error) {
      setFeedsError(error.message)
    } else {
      setFeedsError('Unable to load feed posts. Please try again later.')
    }

    if (!isLoadMore) {
      setPosts([])
    }
  } finally {
    isFetchingRef.current = false
    setIsLoadingFeeds(false)
    setIsInitialLoad(false)
  }
}, [POSTS_LIMIT, isFirstLoad, posts.length])

  // Initial load
  useEffect(() => {
    if (!isAuthReady) {
      console.log('[BitoHubFeed] Waiting for auth to be ready...')
      return
    }

    if (isInitialLoad) {
      console.log('[BitoHubFeed] Auth ready, fetching feeds...')
      fetchFeeds(1, false)
    }
  }, [isAuthReady, isInitialLoad])

  useEffect(() => {
    const handleAuthChange = () => {
      console.log('[BitoHubFeed] Auth state changed, refetching...')
      setCurrentOffset(1)
      setHasMorePosts(true)
      setIsInitialLoad(true)
    }

    window.addEventListener('authStateChanged', handleAuthChange)
    return () => window.removeEventListener('authStateChanged', handleAuthChange)
  }, [])

  // Handler for loading more posts
  const handleLoadMore = useCallback(() => {
    if (!isFetchingRef.current && hasMorePosts) {
      fetchFeeds(currentOffset, true)
      wsUpdateOffset(currentOffset)
    }
  }, [currentOffset, hasMorePosts, fetchFeeds, wsUpdateOffset])

  // Refresh handler
  const handleRefresh = useCallback(() => {
  setCurrentOffset(1)  // Reset to 1
  setHasMorePosts(true)
  fetchFeeds(1, false)  // This will set offset to 2 after success
  wsResetOffset()
}, [fetchFeeds, wsResetOffset])

  // Auto-refresh on inactivity (5 minutes)
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }

      inactivityTimerRef.current = setTimeout(() => {
        console.log('[BitoHubFeed] No activity for 5 minutes, auto-refreshing feed...')
        handleRefresh()
      }, INACTIVITY_TIMEOUT)
    }

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ]

    activityEvents.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    })

    const container = mainContainerRef.current
    if (container) {
      container.addEventListener('scroll', resetInactivityTimer, { passive: true })
    }

    resetInactivityTimer()

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current)
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer)
      })
      if (container) {
        container.removeEventListener('scroll', resetInactivityTimer)
      }
    }
  }, [handleRefresh])

  // Sidebar data
  const trendingTopics = [
    { tag: '#AIRevolution', posts: '12.3k posts', growth: '+45%' },
    { tag: '#StartupFunding', posts: '8.7k posts', growth: '+23%' },
    { tag: '#ProductLaunch', posts: '6.2k posts', growth: '+18%' },
    { tag: '#GrowthHacking', posts: '5.1k posts', growth: '+12%' }
  ]

  // Helper functions for snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false)
  }

  // ==================== HANDLER FUNCTIONS ====================

  const handleLike = async (postId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to like posts', 'error')
        return
      }

      const currentPost = posts.find(p => p.id === postId)

      if (!currentPost) {
        showSnackbar('Post not found', 'error')
        return
      }

      // Skip like for livestream posts (they have different interaction)
      if (currentPost.type === 'livestream') {
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/toggleLikePost',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: parseInt(userId),
            contentId: postId,
            contentType: currentPost.contentType,
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            const newIsLiked = !post.isLiked
            return {
              ...post,
              isLiked: newIsLiked,
              likes: newIsLiked ? post.likes + 1 : post.likes - 1
            }
          }
          return post
        }))

        const actionMessage = currentPost.isLiked ? 'Post unliked' : 'Post liked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to like post')
      }
    } catch (error) {
      console.error('Error liking post:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to like post. Please try again.', 'error')
      }
    }
  }

  const handleSave = async (postId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to bookmark posts', 'error')
        return
      }

      const currentPost = posts.find(p => p.id === postId)
      if (!currentPost) {
        showSnackbar('Post not found', 'error')
        return
      }

      // Skip save for livestream posts
      if (currentPost.type === 'livestream') {
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/bookmarkContent',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: userId.toString(),
            contentId: postId.toString(),
            contentType: currentPost.contentType
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              isSaved: !post.isSaved
            }
          }
          return post
        }))

        const actionMessage = currentPost.isSaved ? 'Post removed from bookmarks' : 'Post bookmarked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to bookmark post')
      }
    } catch (error) {
      console.error('Error bookmarking post:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to bookmark post. Please try again.', 'error')
      }
    }
  }

  const handleComment = (postId: number) => {
    const post = posts.find(p => p.id === postId)
    if (post && post.type !== 'livestream') {
      setSelectedPost({...post as RegularPost, isGifAllowed: post.isGifAllowed})
      setOpenCommentDialog(true)
    }
  }

  const handleCommentAdded = () => {
    if (selectedPost) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === selectedPost.id) {
          return {
            ...post,
            comments: post.comments + 1
          }
        }
        return post
      }))
      setSelectedPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : null)
    }
  }

  const handleCommentDeleted = () => {
    if (selectedPost) {
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === selectedPost.id) {
          return {
            ...post,
            comments: Math.max(0, post.comments - 1)
          }
        }
        return post
      }))
      setSelectedPost(prev => prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : null)
    }
  }

  const handleShare = (postId: number) => {
    const post = posts.find(p => p.id === postId)
    if (post && post.type !== 'livestream') {
      setSharedPost(post as RegularPost)
      setOpenPostDialog(true)
    }
  }

  const handleMoreOptions = (postId: number) => {
    console.log('More options for post:', postId)
  }

  const handleVote = async (postId: number, optionId: number) => {
    const pollPost = posts.find(p => p.id === postId && p.type === 'poll') as PollPost
    if (!pollPost) {
      showSnackbar('Poll not found', 'error')
      return
    }

    if (pollPost.hasVoted) {
      showSnackbar('You have already voted in this poll', 'error')
      return
    }

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to vote', 'error')
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/poll/voteInPoll',
        {
          method: 'POST',
          body: JSON.stringify({
            userId: parseInt(userId),
            pollId: pollPost.pollId,
            optionId: optionId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setPosts(posts.map(post => {
          if (post.id === postId && post.type === 'poll') {
            return {
              ...post,
              hasVoted: true,
              votedOptionId: optionId,
              options: (post as PollPost).options.map(option => ({
                ...option,
                votes: option.id === optionId ? option.votes + 1 : option.votes
              })),
              totalVotes: (post as PollPost).totalVotes + 1
            }
          }
          return post
        }))

        showSnackbar('Vote cast successfully!', 'success')
      } else {
        throw new Error(result.message || 'Failed to cast vote')
      }
    } catch (error) {
      console.error('Error voting in poll:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to cast vote. Please try again.', 'error')
      }
    }
  }

  const handlePostCreate = (data: unknown) => {
    console.log('Creating/Updating post:', data)
    setSharedPost(null)
    setEditingPost(null)
    handleRefresh()
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        reject(new Error('Failed to load video metadata'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  const handleReelPublish = async (data: {
    title: string
    description: string
    hashtags: string
    video: File | null
    coverImage?: File
    visibilityType: string  // ✅ NEW
    campaignId?: number      // ADD
  brandId?: number          // ADD
  }) => {
    console.log('Publishing reel:', data)

    if (!data.video) {
      showSnackbar('Please select a video file', 'error')
      return
    }

    if (!data.title.trim()) {
      showSnackbar('Please enter a title for your reel', 'error')
      return
    }

    const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    if (!userId) {
      showSnackbar('Please login to create reels', 'error')
      return
    }

    setIsCreatingReel(true)
    setOpenReelDialog(false)

    try {
      const duration = await getVideoDuration(data.video)
      console.log('Video duration:', duration)

      const formData = new FormData()
      formData.append('video', data.video)
      formData.append('userId', userId)
      formData.append('adminUser', localStorage.getItem('uuid') || '')
      formData.append('title', data.title.trim())
      formData.append('description', data.description.trim() || '')
      formData.append('hashtags', data.hashtags.trim() || '')
      formData.append('duration', duration.toFixed(1))
      formData.append('videoUrl', '')
      formData.append('coverUrl', '')
      formData.append('visibilityType', data.visibilityType || '1')
      formData.append('pageId', localStorage.getItem('pageId') || '')
      formData.append('campaignId', data.campaignId?.toString() || '0')
if (data.brandId) {
  formData.append('brandId', data.brandId.toString())
}

      if (data.coverImage) {
        formData.append('cover', data.coverImage)
        console.log('Cover image added:', data.coverImage.name, data.coverImage.size)
      } else {
        formData.append('cover', '')
      }

      const storedAccessToken = tokenCookie.get();
      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/reels/createReel',
        {
          method: 'POST',
          headers: {
            ...(storedAccessToken && { authorization: `bearer ${storedAccessToken}` }),
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar('Reel published successfully! 🎉', 'success')
        console.log('Reel created:', result.data)
      } else {
        throw new Error(result.message || 'Failed to publish reel')
      }
    } catch (error) {
      console.error('Error publishing reel:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        if (error.message === 'Failed to load video metadata') {
          showSnackbar('Invalid video file. Please select a valid video.', 'error')
        } else {
          showSnackbar(error.message, 'error')
        }
      } else {
        showSnackbar('Failed to publish reel. Please try again.', 'error')
      }
    } finally {
      setIsCreatingReel(false)
    }
  }

  const handleAddStory = () => {
    console.log('Add story clicked')
  }

  const handleViewAllActivity = () => {
    console.log('View all activity clicked')
    router.push('/connection-highlights')
  }

  const handleViewPolls = () => {
    console.log('View all polls clicked')
    router.push('/polls')
  }

  const handleNotInterested = (postId: number) => {
    setCurrentOffset(1)
    setHasMorePosts(true)
    fetchFeeds(1, false)
    showSnackbar('Post removed from your feed', 'success')
  }

  const handleFollow = (userId: number) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.user.userId === userId) {
        return {
          ...post,
          user: {
            ...post.user,
            isUserFollowing: 1
          }
        }
      }
      return post
    }))
  }

  const handleUnfollow = (userId: number) => {
    setPosts(prevPosts => prevPosts.map(post => {
      if (post.user.userId === userId) {
        return {
          ...post,
          user: {
            ...post.user,
            isUserFollowing: 0
          }
        }
      }
      return post
    }))
  }

  const handleFollowSuccess = (message: string) => {
    showSnackbar(message, 'success')
  }

  const handleFollowError = (message: string) => {
    showSnackbar(message, 'error')
  }

  const handleEditPost = (postId: number) => {
    const post = posts.find(p => p.id === postId)
    if (post && post.type !== 'livestream') {
      console.log('Editing post with visibilityType:', post.visibilityType)
      setEditingPost(post as RegularPost)
      setOpenPostDialog(true)
    }
  }

  const handleDeletePost = async (postId: number) => {
    const post = posts.find(p => p.id === postId)

    if (!post || post.type === 'livestream') return

    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const userId = localStorage.getItem('childUserId')
      if (!userId) {
        showSnackbar('Please login to delete posts', 'error')
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/deletePost',
        {
          method: 'DELETE',
          body: JSON.stringify({
            userId: parseInt(userId),
            postId: postId,
            postType: post?.contentType
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setPosts(posts.filter(post => post.id !== postId))
        showSnackbar('Post deleted successfully', 'success')
      } else {
        throw new Error(result.message || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to delete post. Please try again.', 'error')
      }
    }
  }

  const handleStreamEnded = useCallback((streamId: string) => {
  console.log('[BitoHubFeed] Stream ended, removing from feed:', streamId)
  setPosts(prevPosts => 
    prevPosts.filter(post => 
      !(post.type === 'livestream' && (post as LiveStreamPost).streamId === streamId)
    )
  )
  showSnackbar('Live stream has ended', 'success')
}, [])



  // Custom scrollbar styles
  const customScrollbarStyles = {
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.2)',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.3)',
      },
    },
    scrollbarWidth: 'thin',
    scrollbarColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.2) transparent'
      : 'rgba(0, 0, 0, 0.2) transparent',
  }

  // ==================== RENDER ====================

  return (
    <>
      {/* Main scrollable container */}
      <Box
  ref={mainContainerRef}
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', lg: 'row' },
    alignItems: { lg: 'flex-start' },
    gap: { xs: 2, md: 3, xl: 4 },
    width: '100%',
    maxWidth: { xs: '100%', lg: '1200px', xl: '1400px' },
    mx: 'auto',
    px: { xs: 0.5, sm: 2, md: 3, xl: 4 },
    py: { xs: 1.5, sm: 3 },
    height: { lg: 'calc(100vh - 64px)' },
    overflowY: { xs: 'visible', lg: 'auto' },
    overflowX: 'hidden',
    boxSizing: 'border-box',
    ...customScrollbarStyles,
  }}
>
        {/* Main Content - Feeds Section */}
        <Box
          sx={{
            flex: { lg: '1 1 66.667%' },
            maxWidth: { lg: '66.667%' },
            width: { xs: '100%', lg: '66.667%' },
            minWidth: 0,
            boxSizing: 'border-box',
            pr: { lg: 1 },
          }}
        >
          <StoryComponent onAddStory={handleAddStory} />

          <CreatePostComponent
            onOpenPostDialog={() => setOpenPostDialog(true)}
            onOpenReelDialog={() => setOpenReelDialog(true)}
            onOpenStoryDialog={handleAddStory}
            onOpenLiveDialog={() => setOpenPostDialog(true)}
            onOpenAIDialog={() => setOpenPostDialog(true)}
            avatarLetter="A"
            avatarColor="#4267b2"
            placeholder="What's your next move?"
          />

          {(!hasLoadedOnce && posts.length === 0 && !feedsError) && (
  <FeedSkeletonLoader count={3} />
)}

          {feedsError && !isLoadingFeeds && posts.length === 0 && (
            <Alert
              severity="warning"
              sx={{ mb: 2 }}
              onClose={() => setFeedsError(null)}
              action={
                <Box
                  component="span"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={handleRefresh}
                >
                  Retry
                </Box>
              }
            >
              {feedsError}
            </Alert>
          )}

          {(!isInitialLoad || posts.length > 0) && (
            <FeedsComponent
              posts={posts}
              onLike={handleLike}
              onSave={handleSave}
              onComment={handleComment}
              onShare={handleShare}
              onMoreOptions={handleMoreOptions}
              onVote={handleVote}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              onFollowSuccess={handleFollowSuccess}
              onFollowError={handleFollowError}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onNotInterested={handleNotInterested}
              onStreamEnded={handleStreamEnded}
              isLoading={isLoadingFeeds}
              hasMore={hasMorePosts}
              onLoadMore={handleLoadMore}
              error={feedsError}
              isInitialLoad={isInitialLoad}
              onRetry={handleRefresh}
            />
          )}

          {hasLoadedOnce && !isLoadingFeeds && posts.length === 0 && !feedsError && (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Typography variant="body1" color="text.secondary">
      No posts available at the moment
    </Typography>
    <Button
      variant="outlined"
      size="small"
      onClick={handleRefresh}
      sx={{ mt: 2, textTransform: 'none' }}
    >
      Refresh
    </Button>
  </Box>
)}
        </Box>

        {/* Right Sidebar */}
        <Box
          ref={sidebarRef}
          sx={{
            flex: { lg: '1 1 33.333%' },
            maxWidth: { lg: '33.333%' },
            width: { lg: '33.333%' },
            minWidth: 0,
            boxSizing: 'border-box',
            pl: { lg: 1 },
            display: { xs: 'none', lg: 'block' },
            position: { lg: 'sticky' },
            top: { lg: stickyTop },
            alignSelf: { lg: 'flex-start' },
            height: { lg: 'fit-content' },
          }}
        >
          <SidebarComponent
            userId={localStorage.getItem('childUserId') || ''}
            trendingTopics={trendingTopics}
            onViewAllActivity={handleViewAllActivity}
            onViewAllPolls={handleViewPolls}
          />
        </Box>
      </Box>

      {/* Dialogs */}
      <CreatePostDialog
        open={openPostDialog}
        onClose={() => {
          setOpenPostDialog(false)
          setSharedPost(null)
          setEditingPost(null)
        }}
        onPostCreated={handlePostCreate}
        onPostUpdated={handlePostCreate}
        sharedPost={sharedPost}
        editPost={editingPost}
      />

      <CreateReelDialog
        open={openReelDialog}
        onClose={() => setOpenReelDialog(false)}
        onPublish={handleReelPublish}
      />

      {/* Creating Reel Progress Overlay */}
      {isCreatingReel && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="white" sx={{ mb: 1 }}>
            Publishing your reel...
          </Typography>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            This may take a few moments
          </Typography>
        </Box>
      )}

      {selectedPost && (
        <CommentDialog
          open={openCommentDialog}
          onClose={() => {
            setOpenCommentDialog(false)
            setSelectedPost(null)
          }}
          post={selectedPost}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
        />
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            ...(snackbarSeverity === 'success' && {
              backgroundColor: theme.palette.mode === 'light'
                ? theme.palette.success.dark
                : theme.palette.success.main,
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff'
              },
              '& .MuiIconButton-root': {
                color: '#ffffff'
              }
            }),
            ...(snackbarSeverity === 'error' && {
              backgroundColor: theme.palette.mode === 'light'
                ? theme.palette.error.dark
                : theme.palette.error.main,
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff'
              },
              '& .MuiIconButton-root': {
                color: '#ffffff'
              }
            })
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default BitoHubFeed