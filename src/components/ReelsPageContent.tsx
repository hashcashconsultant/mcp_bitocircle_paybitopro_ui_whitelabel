'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
  Chip,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon,
  FavoriteBorder as HeartIcon,
  Favorite as HeartFilledIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkFilledIcon,
  KeyboardArrowUp as ChevronUpIcon,
  ArrowBack as BackIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Campaign as SponsoredIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'
import CommentDialog from './CommentDialog'
import CreatePostDialog from '@/components/CreatePostDialog'
import { sendOnPageExit } from '@/utils/apiAuth'

interface Reel {
  id: number
  postId: number
  user: string
  username: string
  userId: number
  verified: boolean
  following: boolean
  caption: string
  tags: string[]
  likes: number
  comments: number
  shares: number
  views: string
  videoUrl: string
  thumbnailUrl?: string
  bgColor: string
  duration?: string
  isLiked: boolean
  isBookmarked: boolean
  isFollowing?: boolean
  entityType?: string
  pageId?: number
  createdAt?: string
  profilePicture?: string
  // Sponsored fields
  isSponsored?: boolean
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  campaignId?: number
}

interface FeedItem {  
  userId: number
  postId: number
  userName: string
  fullName: string
  content: string | null
  postType: string
  mediaUrls: string[]
  hashtags: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: 'Y' | 'N'
  hasBookmarked: 'Y' | 'N'
  isFollowing?: 'Y' | 'N'
  title?: string
  coverImage?: string
  reelDurtion?: number
  isUserFollowing?: number
  entityType?: string
  pageId?: number
  profilePicture?: string
  // Sponsored fields
  isSponsored?: 0 | 1
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  campaignId?: number
}

interface FeedsResponse {
  success: boolean
  message: string
  data: FeedItem[]
  errorCode: string | null
}

interface SearchReel {
  reelId: number
  userId: number
  adminUser: string | null
  title: string
  description: string
  videoUrl: string
  coverImage: string | null
  hashtags: string
  duration: number
  isActive: string
  createdAt: string
  updatedAt: string | null
  username: string
  fullName: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: string
  hasBookmarked: string
  profilePicture?: string
  // Sponsored fields
  isSponsored?: 0 | 1
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  campaignId?: number
}

export type PostType = 'text' | 'image' | 'video' | 'poll' | 'reel'

export interface BasePost {
  id: number
  type: PostType
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string
    userId?: number
    isFollowing?: boolean
    isVerified?: boolean
  }
  content: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  contentType: string
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

export interface ReelPost extends BasePost {
  type: 'reel'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
  title?: string
}

export type Post = TextPost | ImagePost | VideoPost | PollPost | ReelPost

const BITOHUBWEBSERVICE = 'https://institutional-bo.paybito.com:8443/BitohubService'

const generateAvatarColor = (userId: number): string => {
  const colors = [
    '#4267b2', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]
  return colors[userId % colors.length]
}

const extractHashtags = (text: string | null): string[] => {
  if (!text) return []
  const hashtagRegex = /#[\w]+/g
  return text.match(hashtagRegex) || []
}

const formatViews = (likes: number, shares: number): string => {
  const totalViews = likes * 5 + shares * 3
  if (totalViews >= 1000000) {
    return `${(totalViews / 1000000).toFixed(1)}M`
  } else if (totalViews >= 1000) {
    return `${(totalViews / 1000).toFixed(1)}k`
  }
  return totalViews.toString()
}

const formatTimeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  } catch (error) {
    return 'Just now'
  }
}

const convertFeedToReels = (feedItems: FeedItem[]): Reel[] => {
  return feedItems
    .filter(item => item.postType === 'REEL')
    .map(item => ({
      id: item.postId,
      postId: item.postId,
      user: item.fullName,
      username: `${item.userName}`,
      userId: item.userId,
      verified: false,
      following: item.isFollowing === 'Y',
      caption: item.content || item.title || '',
      tags: extractHashtags(item.hashtags || item.content),
      likes: item.likeCount,
      comments: item.commentCount,
      shares: item.shareCount,
      views: formatViews(item.likeCount, item.shareCount),
      videoUrl: item.mediaUrls[0] || '',
      thumbnailUrl: item.coverImage || item.mediaUrls[1],
      bgColor: generateAvatarColor(item.userId),
      duration: item.reelDurtion ? `${Math.floor(item.reelDurtion / 60)}:${String(Math.floor(item.reelDurtion % 60)).padStart(2, '0')}` : undefined,
      isLiked: item.hasLiked === 'Y',
      isBookmarked: item.hasBookmarked === 'Y',
      isFollowing: item.isUserFollowing == 1,
      entityType: item.entityType,
      pageId: item.pageId,
      createdAt: item.createdAt,
      profilePicture: item.profilePicture,
      // Sponsored fields
      isSponsored: item.isSponsored === 1,
      cta: item.cta,
      callToActionUrl: item.callToActionUrl,
      adHeadline: item.adHeadline,
      // Use profilePicture or coverImage as adHeadlineImage since API doesn't return adHeadlineImage
      adHeadlineImage: item.adHeadlineImage || item.profilePicture || item.coverImage,
      campaignId: item.campaignId || 0
    }))
}

// ==================== REEL VIEW TRACKING ====================

const TRACKING_ENDPOINT = `${BITOHUBWEBSERVICE}/tracking/event`
const IMPRESSION_STORAGE_KEY = 'bh_impressions_session'
const REACH_STORAGE_KEY = 'bh_reach_session'
const VIEW_UPDATE_INTERVAL = 5000 // Send VIEW every 5 seconds

interface TrackingPayload {
  viewerId: number
  contentId: number
  contentType: string
  durationOfView: number
  eventType: 'IMPRESSION' | 'VIEW' | 'REACH' | 'CLICK'
  campaignId: number
}

/** Check if an event was already fired this session for a given reel */
const checkSessionFired = (key: string, contentId: number): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const ids: number[] = JSON.parse(raw)
      return ids.includes(contentId)
    }
  } catch (e) {
    console.error('[ReelTracker] Error reading session:', e)
  }
  return false
}

/** Mark an event as fired for the current session */
const markSessionFired = (key: string, contentId: number): void => {
  if (typeof window === 'undefined') return
  try {
    const raw = sessionStorage.getItem(key)
    const ids: number[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(contentId)) {
      ids.push(contentId)
      sessionStorage.setItem(key, JSON.stringify(ids))
    }
  } catch (e) {
    console.error('[ReelTracker] Error writing session:', e)
  }
}

/** Build the tracking payload for a reel */
const buildTrackingPayload = (
  eventType: TrackingPayload['eventType'],
  reel: { id: number; isSponsored?: boolean; campaignId?: number },
  duration: number
): TrackingPayload | null => {
  const viewerId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
  if (!viewerId) return null
  return {
    viewerId: parseInt(viewerId),
    contentId: reel.id,
    contentType: 'REEL',
    durationOfView: Math.round(duration),
    eventType,
    campaignId: reel.isSponsored && reel.campaignId ? reel.campaignId : 0,
  }
}

/** Fire-and-forget tracking event via fetch */
const sendTrackingFetch = async (payload: TrackingPayload) => {
  try {
    console.log(`[ReelTracker] 📤 ${payload.eventType} reel=${payload.contentId} dur=${payload.durationOfView}s`)
    await fetchWithAuth(TRACKING_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error(`[ReelTracker] ❌ ${payload.eventType} failed:`, err)
  }
}

/** Send the final VIEW when the tab closes or the user leaves the page */
const sendTrackingBeacon = (payload: TrackingPayload) => {
  try {
    // Sent with the sign-in headers (a plain beacon would be refused by the API).
    sendOnPageExit(TRACKING_ENDPOINT, payload)
    console.log(`[ReelTracker] 📤 Exit VIEW reel=${payload.contentId} dur=${payload.durationOfView}s`)
  } catch (e) {
    console.error('[ReelTracker] Beacon error:', e)
  }
}

// ==================== SPONSORED SECTION FOR REELS ====================
interface ReelSponsoredSectionProps {
  adHeadline?: string
  adHeadlineImage?: string
  callToActionUrl?: string
  cta?: string
  onCtaClick?: () => void
}

const ReelSponsoredSection: React.FC<ReelSponsoredSectionProps> = ({
  adHeadline,
  adHeadlineImage,
  callToActionUrl,
  cta,
  onCtaClick
}) => {
  const theme = useTheme()

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCtaClick?.()
    if (callToActionUrl) {
      window.open(callToActionUrl, '_blank', 'noopener,noreferrer')
    }
  }

  // Don't render if no sponsored content
  if (!adHeadline && !cta) return null

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'rgba(255,255,255,0.95)',
        borderRadius: 2,
        p: 1.5,
        mb: 1.5,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        cursor: callToActionUrl ? 'pointer' : 'default',
      }}
    >
      {/* Ad Headline Image */}
      {adHeadlineImage && (
        <Box
          component="img"
          src={adHeadlineImage}
          alt="Ad"
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            objectFit: 'cover',
            flexShrink: 0,
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />
      )}

      {/* Ad Headline Text */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {adHeadline && (
          <Typography
            variant="body2"
            sx={{
              color: '#1a1a1a',
              fontWeight: 500,
              fontSize: '0.875rem',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {adHeadline}
          </Typography>
        )}
      </Box>

      {/* CTA Button */}
      {cta && (
        <Button
          variant="contained"
          size="small"
          onClick={handleCtaClick}
          sx={{
            bgcolor: '#4267b2',
            color: 'white',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            px: 2,
            py: 0.75,
            borderRadius: 1.5,
            minWidth: 'auto',
            flexShrink: 0,
            '&:hover': {
              bgcolor: '#365899'
            }
          }}
        >
          {cta}
        </Button>
      )}

      {/* CTA URL Arrow Button */}
      {callToActionUrl && (
        <IconButton
          size="small"
          onClick={handleCtaClick}
          sx={{
            bgcolor: '#4267b2',
            color: 'white',
            width: 32,
            height: 32,
            flexShrink: 0,
            '&:hover': {
              bgcolor: '#365899'
            }
          }}
        >
          <ChevronRightIcon sx={{ fontSize: 20 }} />
        </IconButton>
      )}
    </Box>
  )
}

// Expandable Caption Component
interface ExpandableCaptionProps {
  caption: string
  tags: string[]
  maxLength?: number
  maxLines?: number
}

const ExpandableCaption: React.FC<ExpandableCaptionProps> = ({
  caption,
  tags,
  maxLength = 100,
  maxLines = 2
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExpandButton, setShowExpandButton] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Calculate if content needs truncation
  const needsTruncation = caption.length > maxLength || tags.length > 3

  useEffect(() => {
    setShowExpandButton(needsTruncation)
  }, [caption, tags, needsTruncation])

  // Reset expanded state when caption changes (new reel)
  useEffect(() => {
    setIsExpanded(false)
  }, [caption])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const displayCaption = isExpanded ? caption : caption.slice(0, maxLength)
  const displayTags = isExpanded ? tags : tags.slice(0, 3)

  return (
    <Box
      ref={contentRef}
      onClick={(e) => e.stopPropagation()}
      sx={{
        maxHeight: isExpanded ? '40vh' : 'auto',
        overflowY: isExpanded ? 'auto' : 'hidden',
        transition: 'max-height 0.3s ease',
        // Custom scrollbar for expanded state
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '2px',
          '&:hover': {
            background: 'rgba(255,255,255,0.5)',
          },
        },
      }}
    >
      {/* Caption Text */}
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.mode === 'dark' ? 'white' : 'text.primary', 
          mb: 1,
          fontWeight: 500,
          fontSize: { xs: '0.95rem', sm: '1rem' },
          lineHeight: 1.5,
          whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
          wordBreak: 'break-word',
        }}
      >
        {displayCaption}
        {!isExpanded && caption.length > maxLength && '...'}
      </Typography>

      {/* Tags */}
      {displayTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          {displayTags.map((tag, tagIndex) => (
            <Typography
              key={tagIndex}
              variant="body2"
              sx={{
                color: theme.palette.mode === 'dark' ? '#60A5FA' : '#1D4ED8', 
                cursor: 'pointer',
                fontSize: { xs: '0.85rem', sm: '0.875rem' },
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {tag}
            </Typography>
          ))}
          {!isExpanded && tags.length > 3 && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: { xs: '0.85rem', sm: '0.875rem' },
              }}
            >
              +{tags.length - 3} more
            </Typography>
          )}
        </Box>
      )}

      {/* See More / See Less Button */}
      {showExpandButton && (
        <Button
          onClick={handleToggle}
          size="small"
          endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          sx={{
            color: 'rgba(255,255,255,0.8)',
            textTransform: 'none',
            fontSize: '0.8rem',
            fontWeight: 600,
            p: 0,
            minWidth: 'auto',
            mt: 0.5,
            '&:hover': {
              color: 'white',
              bgcolor: 'transparent',
            },
          }}
        >
          {isExpanded ? 'See less' : 'See more'}
        </Button>
      )}
    </Box>
  )
}

const ReelsPageContent: React.FC = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reelIdParam = searchParams.get('id')
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [reels, setReels] = useState<Reel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [isFromSearch, setIsFromSearch] = useState(false)

  // FIX: Always start unmuted and playing
  const [reelMuted, setReelMuted] = useState(false)
  const [reelPlaying, setReelPlaying] = useState(true)

  const [likedReels, setLikedReels] = useState<{ [key: number]: boolean }>({})
  const [bookmarkedReels, setBookmarkedReels] = useState<{ [key: number]: boolean }>({})
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({})
  const [followingStatus, setFollowingStatus] = useState<{ [key: number]: boolean }>({})

  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [selectedReelForComments, setSelectedReelForComments] = useState<Reel | null>(null)

  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedReelForShare, setSelectedReelForShare] = useState<Reel | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({})
  const startY = useRef(0)
  const isDragging = useRef(false)

  // FIX: Track all playing states per video
  const playingStatesRef = useRef<{ [key: number]: boolean }>({})

  // ==================== REEL VIEW TRACKING STATE ====================
  const viewStartTimeRef = useRef<number>(0)
  const totalViewDurationRef = useRef<number>(0)
  const lastViewSentAtRef = useRef<number>(0)
  const viewIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentTrackingReelRef = useRef<Reel | null>(null)

  // ---- Flush accumulated VIEW for the reel currently being tracked ----
  const flushView = useCallback((useBeacon = false) => {
    const reel = currentTrackingReelRef.current
    if (!reel) return

    // Accumulate any remaining wall-clock time
    if (viewStartTimeRef.current > 0) {
      totalViewDurationRef.current += (Date.now() - viewStartTimeRef.current) / 1000
      viewStartTimeRef.current = Date.now()
    }

    const dur = totalViewDurationRef.current
    if (dur <= 0) return

    const payload = buildTrackingPayload('VIEW', reel, dur)
    if (!payload) return

    if (useBeacon) {
      sendTrackingBeacon(payload)
    } else {
      sendTrackingFetch(payload)
    }
  }, [])

  // ---- Stop tracking the current reel (sends final VIEW) ----
  const stopTracking = useCallback(() => {
    if (viewIntervalRef.current) {
      clearInterval(viewIntervalRef.current)
      viewIntervalRef.current = null
    }
    flushView()
    currentTrackingReelRef.current = null
    totalViewDurationRef.current = 0
    viewStartTimeRef.current = 0
    lastViewSentAtRef.current = 0
  }, [flushView])

  // ---- Start tracking a new reel (REACH + IMPRESSION + periodic VIEW) ----
  const startTracking = useCallback((reel: Reel) => {
    const now = Date.now()
    currentTrackingReelRef.current = reel
    viewStartTimeRef.current = now
    lastViewSentAtRef.current = now
    totalViewDurationRef.current = 0

    // 1) REACH — once per session
    if (!checkSessionFired(REACH_STORAGE_KEY, reel.id)) {
      markSessionFired(REACH_STORAGE_KEY, reel.id)
      const p = buildTrackingPayload('REACH', reel, 0)
      if (p) sendTrackingFetch(p)
    }

    // 2) IMPRESSION — once per session, sponsored only
    if (reel.isSponsored && !checkSessionFired(IMPRESSION_STORAGE_KEY, reel.id)) {
      markSessionFired(IMPRESSION_STORAGE_KEY, reel.id)
      const p = buildTrackingPayload('IMPRESSION', reel, 0)
      if (p) sendTrackingFetch(p)
    }

    // 3) Periodic VIEW every VIEW_UPDATE_INTERVAL ms
    viewIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastViewSentAtRef.current
      if (elapsed >= VIEW_UPDATE_INTERVAL) {
        if (viewStartTimeRef.current > 0) {
          totalViewDurationRef.current += (Date.now() - viewStartTimeRef.current) / 1000
          viewStartTimeRef.current = Date.now()
        }
        const payload = buildTrackingPayload('VIEW', reel, totalViewDurationRef.current)
        if (payload) sendTrackingFetch(payload)
        lastViewSentAtRef.current = Date.now()
      }
    }, 1000)
  }, [])

  // ---- CLICK event for sponsored CTA ----
  const fireClickEvent = useCallback((reel: Reel) => {
    if (viewStartTimeRef.current > 0) {
      totalViewDurationRef.current += (Date.now() - viewStartTimeRef.current) / 1000
      viewStartTimeRef.current = Date.now()
    }
    const p = buildTrackingPayload('CLICK', reel, totalViewDurationRef.current)
    if (p) sendTrackingFetch(p)
  }, [])

  // ==================== TRACKING: React to reel changes ====================
  useEffect(() => {
    if (reels.length === 0 || isLoading) return
    const reel = reels[currentReelIndex]
    if (!reel) return

    stopTracking()
    startTracking(reel)

    return () => { stopTracking() }
  }, [currentReelIndex, reels, isLoading, startTracking, stopTracking])

  // ==================== TRACKING: Page visibility (pause / resume) ====================
  // ==================== TRACKING: Page visibility (pause / resume) ====================
useEffect(() => {
  const handleVisibility = () => {
    if (document.hidden) {
      // Tab is hidden - pause tracking and video
      if (viewStartTimeRef.current > 0) {
        totalViewDurationRef.current += (Date.now() - viewStartTimeRef.current) / 1000
        viewStartTimeRef.current = 0
      }
      flushView()
      
      // FIX: Pause the current video when tab is hidden
      const currentVideo = videoRefs.current[currentReelIndex]
      if (currentVideo) {
        currentVideo.pause()
        playingStatesRef.current[currentReelIndex] = false
        setReelPlaying(false)
      }
    } else {
      // Tab is visible again - resume tracking and video
      viewStartTimeRef.current = Date.now()
      lastViewSentAtRef.current = Date.now()
      
      // FIX: Resume playing if it was playing before
      const currentVideo = videoRefs.current[currentReelIndex]
      if (currentVideo && playingStatesRef.current[currentReelIndex]) {
        const playPromise = currentVideo.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log('Resume play failed:', err)
            playingStatesRef.current[currentReelIndex] = false
            setReelPlaying(false)
          })
        }
      }
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibility)
  return () => document.removeEventListener('visibilitychange', handleVisibility)
}, [currentReelIndex, flushView])

  // FIX 2: Cleanup all videos when component unmounts or navigation occurs
  useEffect(() => {
    const cleanupVideos = () => {
      Object.keys(videoRefs.current).forEach(key => {
        const video = videoRefs.current[parseInt(key)]
        if (video) {
          video.pause()
          video.currentTime = 0
        }
      })
      playingStatesRef.current = {}
    }

    return cleanupVideos
  }, [])

  // FIX 2: Handle route changes - pause all videos (already handled by cleanup effect above)
  // Note: Next.js App Router doesn't have router.events, cleanup is handled by the previous useEffect

  // Convert Reel to Post format for sharing
  const convertReelToPost = (reel: Reel): Post => {
    return {
      id: reel.postId,
      type: 'reel' as PostType,
      user: {
        name: reel.user,
        username: reel.username.replace('@', ''),
        avatar: reel.user.charAt(0).toUpperCase(),
        avatarColor: reel.bgColor,
        time: formatTimeAgo(new Date().toISOString()),
        userId: reel.userId,
        isFollowing: reel.following,
        isVerified: reel.verified
      },
      content: reel.caption,
      contentType: 'REEL',
      likes: reel.likes,
      comments: reel.comments,
      shares: reel.shares,
      isLiked: reel.isLiked,
      isSaved: reel.isBookmarked,
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      duration: reel.duration,
      views: parseInt(reel.views.replace(/[^0-9]/g, '')) || 0,
      title: reel.caption
    } as ReelPost
  }

  const handleShare = (reel: Reel) => {
    console.log('Opening share dialog for reel:', reel)
    setSelectedReelForShare(reel)
    setShareDialogOpen(true)
  }

  const handleShareDialogClose = () => {
    setShareDialogOpen(false)
    setTimeout(() => setSelectedReelForShare(null), 300)
  }

  const handleShareSuccess = () => {
    console.log('Reel shared successfully')
    if (selectedReelForShare) {
      setReels(prevReels =>
        prevReels.map(reel =>
          reel.id === selectedReelForShare.id
            ? { ...reel, shares: reel.shares + 1 }
            : reel
        )
      )
    }
  }

  // Convert SearchReel to Reel format
  const convertSearchReelToReel = (searchReel: SearchReel): Reel => {
    return {
      id: searchReel.reelId,
      postId: searchReel.reelId,
      user: searchReel.fullName,
      username: `@${searchReel.username}`,
      userId: searchReel.userId,
      verified: false,
      following: false,
      caption: searchReel.title || searchReel.description || '',
      tags: extractHashtags(searchReel.hashtags || searchReel.title || searchReel.description),
      likes: searchReel.likeCount,
      comments: searchReel.commentCount,
      shares: searchReel.shareCount,
      views: formatViews(searchReel.likeCount, searchReel.shareCount),
      videoUrl: searchReel.videoUrl,
      thumbnailUrl: searchReel.coverImage || undefined,
      bgColor: generateAvatarColor(searchReel.userId),
      duration: searchReel.duration ? `${Math.floor(searchReel.duration / 60)}:${String(Math.floor(searchReel.duration % 60)).padStart(2, '0')}` : undefined,
      isLiked: searchReel.hasLiked === 'Y',
      isBookmarked: searchReel.hasBookmarked === 'Y',
      profilePicture: searchReel.profilePicture,
      // Sponsored fields
      isSponsored: searchReel.isSponsored === 1,
      cta: searchReel.cta,
      callToActionUrl: searchReel.callToActionUrl,
      adHeadline: searchReel.adHeadline,
      adHeadlineImage: searchReel.adHeadlineImage || searchReel.profilePicture || searchReel.coverImage || undefined,
      campaignId: searchReel.campaignId || 0
    }
  }

  // Fetch reels from API
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setIsLoading(true)
        setError(null)

        console.log('🎬 Fetching reels...')

        // Check for selected reel from search
        const selectedReelStr = localStorage.getItem('selectedReel')
        let selectedReel: Reel | null = null

        if (selectedReelStr) {
          try {
            const searchReel: SearchReel = JSON.parse(selectedReelStr)
            selectedReel = convertSearchReelToReel(searchReel)
            console.log('🎬 Found selected reel from search:', selectedReel)
            setIsFromSearch(true)
            localStorage.removeItem('selectedReel')
          } catch (error) {
            console.error('Error parsing selected reel:', error)
            localStorage.removeItem('selectedReel')
          }
        }

        const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''

        const response = await fetchWithAuth(
          `${BITOHUBWEBSERVICE}/feeds/getReelFeeds?offset=1&limit=50&userId=${userId}&pageId=${localStorage.getItem('pageId') || ''}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const feedsResponse: FeedsResponse = await response.json()

        if (feedsResponse.success) {
          let reelPosts = convertFeedToReels(feedsResponse.data)
          
          console.log('🎬 Reels sponsored status:', reelPosts.slice(0, 5).map(r => ({
            id: r.id,
            title: r.caption?.substring(0, 20),
            isSponsored: r.isSponsored,
            cta: r.cta,
            adHeadline: r.adHeadline
          })))

          if (selectedReel) {
            console.log('🎬 Adding selected reel to the beginning:', {
              id: selectedReel.id,
              isSponsored: selectedReel.isSponsored,
              cta: selectedReel.cta
            })
            reelPosts = reelPosts.filter(reel => reel.id !== selectedReel!.id)
            reelPosts = [selectedReel, ...reelPosts]
          }

          if (reelPosts.length === 0) {
            setError('No reels available at the moment')
            setIsLoading(false)
            return
          }

          setReels(reelPosts)

          const initialLiked: { [key: number]: boolean } = {}
          const initialBookmarked: { [key: number]: boolean } = {}
          const initialFollowing: { [key: number]: boolean } = {}

          reelPosts.forEach(reel => {
            initialLiked[reel.id] = reel.isLiked
            initialBookmarked[reel.id] = reel.isBookmarked
            initialFollowing[reel.id] = reel.isFollowing || reel.following
          })

          setLikedReels(initialLiked)
          setBookmarkedReels(initialBookmarked)
          setFollowingStatus(initialFollowing)

          if (reelIdParam && !selectedReel) {
            const reelIndex = reelPosts.findIndex(r => r.id === parseInt(reelIdParam))
            if (reelIndex !== -1) {
              setCurrentReelIndex(reelIndex)
            }
          } else {
            setCurrentReelIndex(0)
          }
        } else {
          throw new Error(feedsResponse.message || 'Failed to load reels')
        }
      } catch (err) {
        console.error('Error fetching reels:', err)
        setError(err instanceof Error ? err.message : 'Failed to load reels')
      } finally {
        setIsLoading(false)
      }
    }

    fetchReels()
  }, [reelIdParam])

  const currentReel = reels[currentReelIndex]

  useEffect(() => {
    if (isFromSearch && currentReelIndex > 0) {
      setIsFromSearch(false)
    }
  }, [currentReelIndex, isFromSearch])

  // FIX 1: Handle video playback when reel changes
  // FIX 1: Handle video playback when reel changes
useEffect(() => {
  // Pause all other videos
  Object.keys(videoRefs.current).forEach(key => {
    const videoIndex = parseInt(key)
    const video = videoRefs.current[videoIndex]
    
    if (video && videoIndex !== currentReelIndex) {
      video.pause()
      video.currentTime = 0
      playingStatesRef.current[videoIndex] = false
    }
  })

  // Only play current video if tab is visible
  if (!document.hidden) {
    const currentVideo = videoRefs.current[currentReelIndex]
    if (currentVideo) {
      setReelPlaying(true)
      playingStatesRef.current[currentReelIndex] = true
      
      const playVideo = () => {
        currentVideo.muted = reelMuted
        
        const playPromise = currentVideo.play()
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log('Autoplay failed, trying with mute:', err)
            // Only try mute if autoplay with sound fails and we're not already muted
            if (!reelMuted) {
              currentVideo.muted = true
              setReelMuted(true)
              currentVideo.play().catch(error => {
                console.error('Error playing video even with mute:', error)
                playingStatesRef.current[currentReelIndex] = false
                setReelPlaying(false)
              })
            } else {
              playingStatesRef.current[currentReelIndex] = false
              setReelPlaying(false)
            }
          })
        }
      }

      if (currentVideo.readyState >= 2) {
        playVideo()
      } else {
        const onLoadedData = () => {
          playVideo()
          currentVideo.removeEventListener('loadeddata', onLoadedData)
        }
        currentVideo.addEventListener('loadeddata', onLoadedData)
      }
    }
  }
}, [currentReelIndex, reelMuted])

  // Handle play/pause state changes for current video only
  useEffect(() => {
    const currentVideo = videoRefs.current[currentReelIndex]
    if (currentVideo) {
      if (reelPlaying) {
        playingStatesRef.current[currentReelIndex] = true
        const playPromise = currentVideo.play()
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log('Play failed:', err)
            if (err.name === 'NotAllowedError') {
              currentVideo.muted = true
              setReelMuted(true)
              currentVideo.play().catch(e => {
                console.error('Failed to play even with mute:', e)
                playingStatesRef.current[currentReelIndex] = false
              })
            }
          })
        }
      } else {
        playingStatesRef.current[currentReelIndex] = false
        currentVideo.pause()
      }
    }
  }, [reelPlaying, currentReelIndex])

  // Handle mute state
  // Handle mute state - ensure all videos respect the mute setting
useEffect(() => {
  Object.keys(videoRefs.current).forEach(key => {
    const video = videoRefs.current[parseInt(key)]
    if (video) {
      video.muted = reelMuted
    }
  })
}, [reelMuted])

  // Handle mouse wheel for desktop scrolling
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return

      const target = e.target as HTMLElement
      const isInScrollableCaption = target.closest('[data-caption-scroll]')
      if (isInScrollableCaption) {
        return
      }

      e.preventDefault()

      if (e.deltaY > 50) {
        if (currentReelIndex < reels.length - 1) {
          setCurrentReelIndex(currentReelIndex + 1)
          setReelPlaying(true)
        }
      } else if (e.deltaY < -50) {
        if (currentReelIndex > 0) {
          setCurrentReelIndex(currentReelIndex - 1)
          setReelPlaying(true)
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [currentReelIndex, reels.length])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if (isInputField) {
        return
      }

      if (e.key === 'ArrowDown') {
        if (currentReelIndex < reels.length - 1) {
          setCurrentReelIndex(prev => prev + 1)
          setReelPlaying(true)
        }
      } else if (e.key === 'ArrowUp') {
        if (currentReelIndex > 0) {
          setCurrentReelIndex(prev => prev - 1)
          setReelPlaying(true)
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        setReelPlaying(prev => !prev)
      } else if (e.key === 'm' || e.key === 'M') {
        setReelMuted(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentReelIndex, reels.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-caption-area]')) {
      return
    }
    startY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return

    const endY = e.changedTouches[0].clientY
    const diff = startY.current - endY

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentReelIndex < reels.length - 1) {
        setCurrentReelIndex(Math.min(currentReelIndex + 1, reels.length - 1))
        setReelPlaying(true)
      } else if (diff < 0 && currentReelIndex > 0) {
        setCurrentReelIndex(Math.max(currentReelIndex - 1, 0))
        setReelPlaying(true)
      }
    }

    isDragging.current = false
    startY.current = 0
  }

  const handleVideoClick = () => {
    setReelPlaying(!reelPlaying)
  }

  const handleVideoLoadStart = (reelId: number) => {
    setLoadingStates(prev => ({ ...prev, [reelId]: true }))
  }

  const handleVideoCanPlay = (reelId: number) => {
    setLoadingStates(prev => ({ ...prev, [reelId]: false }))
  }

  const handleVideoError = (reelId: number, error: unknown) => {
    console.error(`Error loading video for reel ${reelId}:`, error)
    setLoadingStates(prev => ({ ...prev, [reelId]: false }))
  }

  const handleLike = async (reelId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        console.error('User not logged in')
        return
      }

      const wasLiked = likedReels[reelId]
      setLikedReels(prev => ({
        ...prev,
        [reelId]: !prev[reelId]
      }))

      setReels(prevReels =>
        prevReels.map(reel =>
          reel.id === reelId
            ? {
              ...reel,
              likes: wasLiked ? Math.max(0, reel.likes - 1) : reel.likes + 1,
              isLiked: !wasLiked
            }
            : reel
        )
      )

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/post/toggleLikePost`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            contentId: reelId,
            contentType: "REEL",
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        }
      )

      if (!response.ok) {
        setLikedReels(prev => ({
          ...prev,
          [reelId]: wasLiked
        }))
        setReels(prevReels =>
          prevReels.map(reel =>
            reel.id === reelId
              ? {
                ...reel,
                likes: wasLiked ? reel.likes + 1 : Math.max(0, reel.likes - 1),
                isLiked: wasLiked
              }
              : reel
          )
        )
        console.error('Failed to like reel')
      }
    } catch (error) {
      console.error('Error liking reel:', error)
      const wasLiked = !likedReels[reelId]
      setLikedReels(prev => ({
        ...prev,
        [reelId]: wasLiked
      }))
      setReels(prevReels =>
        prevReels.map(reel =>
          reel.id === reelId
            ? {
              ...reel,
              likes: wasLiked ? reel.likes + 1 : Math.max(0, reel.likes - 1),
              isLiked: wasLiked
            }
            : reel
        )
      )
    }
  }

  const handleBookmark = async (reelId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        console.error('User not logged in')
        return
      }

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/post/bookmarkContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId.toString(),
            contentId: reelId.toString(),
            contentType: "REEL"
          })
        }
      )

      if (response.ok) {
        setBookmarkedReels(prev => ({
          ...prev,
          [reelId]: !prev[reelId]
        }))
      }
    } catch (error) {
      console.error('Error bookmarking reel:', error)
    }
  }

  const handleFollow = async (reel: Reel) => {
    try {
      const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!currentUserId) {
        console.error('User not logged in')
        return
      }

      const followerId = localStorage.getItem('childPageId') || ''
      const followerType = localStorage.getItem('userType') || 'USER'
      const followingId = reel.userId === 0 ? String(reel.pageId) : String(reel.userId)
      const followingType = reel.entityType

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/profile/followUnfollowUser`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followerId: followerId,
            followingId: followingId,
            followerType: followerType,
            followingType: followingType
          })
        }
      )

      if (response.ok) {
        setFollowingStatus(prev => ({
          ...prev,
          [reel.id]: !prev[reel.id]
        }))
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleOpenComments = (reel: Reel) => {
    setSelectedReelForComments(reel)
    setCommentDialogOpen(true)
  }

  const handleCloseComments = () => {
    setCommentDialogOpen(false)
    setTimeout(() => setSelectedReelForComments(null), 300)
  }

  const handleCommentAdded = () => {
    if (selectedReelForComments) {
      setReels(prevReels =>
        prevReels.map(reel =>
          reel.id === selectedReelForComments.id
            ? { ...reel, comments: reel.comments + 1 }
            : reel
        )
      )
    }
  }

  const handleCommentDeleted = () => {
    if (selectedReelForComments) {
      setReels(prevReels =>
        prevReels.map(reel =>
          reel.id === selectedReelForComments.id
            ? { ...reel, comments: Math.max(0, reel.comments - 1) }
            : reel
        )
      )
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  const handleBackClick = () => {
    // FIX 2: Pause all videos before navigating back
    Object.keys(videoRefs.current).forEach(key => {
      const video = videoRefs.current[parseInt(key)]
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    })
    playingStatesRef.current = {}
    router.back()
  }

  if (isLoading) {
    return (
      <Box sx={{
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress sx={{ color: 'text.primary' }} size={60} />
        <Typography sx={{ color: 'text.primary' }}>Loading reels...</Typography>
      </Box>
    )
  }

  if (error || !currentReel) {
    return (
      <Box sx={{
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'No reels available'}
          </Alert>
          <Button
            variant="contained"
            onClick={handleBackClick}
            sx={{ textTransform: 'none' }}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    )
  }

  const isDarkMode = theme.palette.mode === 'dark'

  return (
    <Box
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => { isDragging.current = false }}
      sx={{
        height: '100vh',
        width: '100%',
        bgcolor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={handleBackClick}
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 100,
          color: 'text.primary',
          bgcolor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
          '&:hover': {
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)'
          }
        }}
      >
        <BackIcon />
      </IconButton>

      {/* Video Container */}
      <Box sx={{
        position: 'relative',
        width: '100%',
        maxWidth: { xs: '100%', sm: '450px' },
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Render all reels with transform */}
        {reels.map((reel, index) => (
          <Box
            key={reel.id}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              bgcolor: reel.bgColor || (isDarkMode ? '#1a1a1a' : '#f5f5f5'),
              transform: `translateY(${(index - currentReelIndex) * 100}%)`,
              transition: 'transform 0.3s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Video Element */}
            {reel.videoUrl ? (
  <>
    <video
      ref={el => { videoRefs.current[index] = el }}
      src={reel.videoUrl}
      poster={reel.thumbnailUrl}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        position: 'absolute',
        top: 0,
        left: 0
      }}
      loop
      playsInline
      muted={reelMuted} // FIX: Use reelMuted state instead of hardcoded false
      autoPlay={index === currentReelIndex}
      onClick={handleVideoClick}
      onLoadStart={() => handleVideoLoadStart(reel.id)}
      onCanPlay={(e) => {
        handleVideoCanPlay(reel.id)
        // Auto-play the current video when it's ready
        if (index === currentReelIndex) {
          const video = e.currentTarget
          // FIX: Always respect the current mute state
          video.muted = reelMuted
          
          // Only attempt to play if the tab is visible
          if (!document.hidden) {
            const playPromise = video.play()
            if (playPromise !== undefined) {
              playPromise.catch(err => {
                console.log('Autoplay failed:', err)
                // Only try to play with mute if autoplay fails and we're not already muted
                if (!reelMuted && err.name === 'NotAllowedError') {
                  video.muted = true
                  setReelMuted(true)
                  video.play().catch(error => {
                    console.error('Error playing video even with mute:', error)
                  })
                }
              })
            }
          } else {
            // Don't play if tab is hidden
            video.pause()
          }
        }
      }}
      onError={(e) => handleVideoError(reel.id, e)}
    />

    {/* Loading Spinner */}
    {loadingStates[reel.id] && (
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20
      }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    )}
  </>
) : (
  <Typography
    variant="h1"
    sx={{
      color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      fontSize: '120px',
      fontWeight: 'bold',
      position: 'absolute'
    }}
  >
    {index + 1}
  </Typography>
)}

            {/* Top Bar */}
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              p: 2,
              pt: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10,
              background: isDarkMode
                ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)'
                : 'linear-gradient(to bottom, rgba(255,255,255,0.9), transparent)'
            }}>
              {/* User Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={reel.profilePicture || undefined}
                  onClick={() => router.push(`/public/${reel.userId}/${reel.pageId}`)}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: reel.profilePicture ? 'transparent' : reel.bgColor,
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {!reel.profilePicture && reel.user.charAt(0)}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      onClick={() => router.push(`/public/${reel.userId}/${reel.pageId}`)}
                      variant="subtitle1" sx={{
                        color: isDarkMode ? 'white' : 'text.primary',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                      {reel.user}
                    </Typography>
                    {reel.verified && (
                      <Box sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#1DA1F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Typography sx={{ fontSize: '10px', color: 'white', fontWeight: 'bold' }}>✓</Typography>
                      </Box>
                    )}
                    {/* Sponsored Badge */}
                    {reel.isSponsored && (
                      <Chip
                        icon={<SponsoredIcon sx={{ fontSize: 14 }} />}
                        label="Sponsored"
                        size="small"
                        sx={{
                          ml: 0.5,
                          height: 20,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(251, 191, 36, 0.15)',
                          color: '#f59e0b',
                          '& .MuiChip-icon': {
                            fontSize: 14,
                            color: '#f59e0b'
                          }
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{
                    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.primary'
                  }}>
                    {reel.username}
                  </Typography>
                </Box>
              </Box>

              {/* Follow Button - Hide for sponsored reels */}
              {reel.userId.toString() !== (localStorage.getItem('childUserId')) && !reel.isSponsored && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleFollow(reel)}
                  sx={{
                    bgcolor: followingStatus[reel.id] ? 'transparent' : '#EF4444',
                    border: followingStatus[reel.id]
                      ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`
                      : 'none',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    color: followingStatus[reel.id]
                      ? (isDarkMode ? 'white' : 'text.primary')
                      : 'white',
                    px: 2.5,
                    py: 0.75,
                    '&:hover': {
                      bgcolor: followingStatus[reel.id]
                        ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                        : '#DC2626'
                    }
                  }}
                >
                  {followingStatus[reel.id] ? 'Following' : 'Follow'}
                </Button>
              )}
            </Box>

            {/* Play/Pause Overlay - Only show for current reel */}
            {index === currentReelIndex && !loadingStates[reel.id] && (
              <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
                pointerEvents: 'none'
              }}>
                <IconButton
                  size="large"
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    opacity: reelPlaying ? 0 : 1,
                    transition: 'opacity 0.3s',
                    pointerEvents: 'auto',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.5)',
                      opacity: 1
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setReelPlaying(!reelPlaying)
                  }}
                >
                  {reelPlaying ?
                    <PauseIcon sx={{ fontSize: 50 }} /> :
                    <PlayIcon sx={{ fontSize: 50 }} />
                  }
                </IconButton>
              </Box>
            )}

            {/* Right Side Actions */}
            <Box sx={{
              position: 'absolute',
              right: { xs: 12, sm: 16 },
              bottom: { xs: reel.isSponsored ? 260 : 180, sm: reel.isSponsored ? 280 : 200 },
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              zIndex: 10
            }}>
              {/* Like */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => handleLike(reel.id)}
                  sx={{
                    color: 'white',
                    p: 1,
                    bgcolor: isDarkMode ? 'transparent' : 'rgba(0,0,0,0.3)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  {likedReels[reel.id] ? (
                    <HeartFilledIcon sx={{ fontSize: 32, color: '#EF4444' }} />
                  ) : (
                    <HeartIcon sx={{ fontSize: 32 }} />
                  )}
                </IconButton>
                <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 600 }}>
                  {formatNumber(reel.likes)}
                </Typography>
              </Box>

              {/* Comment */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => handleOpenComments(reel)}
                  sx={{
                    color: 'white',
                    p: 1,
                    bgcolor: isDarkMode ? 'transparent' : 'rgba(0,0,0,0.3)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <CommentIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 600 }}>
                  {formatNumber(reel.comments)}
                </Typography>
              </Box>

              {/* Bookmark */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => handleBookmark(reel.id)}
                  sx={{
                    color: 'white',
                    p: 1,
                    cursor: 'pointer',
                    bgcolor: isDarkMode ? 'transparent' : 'rgba(0,0,0,0.3)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  {bookmarkedReels[reel.id] ? (
                    <BookmarkFilledIcon sx={{ fontSize: 32, color: '#FFC107' }} />
                  ) : (
                    <BookmarkIcon sx={{ fontSize: 32 }} />
                  )}
                </IconButton>
              </Box>

              {/* Share */}
              <Box sx={{ textAlign: 'center' }}>
                <IconButton
                  onClick={() => handleShare(reel)}
                  sx={{
                    color: 'white',
                    p: 1,
                    bgcolor: isDarkMode ? 'transparent' : 'rgba(0,0,0,0.3)',
                    '&:hover': {
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <ShareIcon sx={{ fontSize: 32 }} />
                </IconButton>
                <Typography variant="caption" sx={{ color: 'white', display: 'block', fontWeight: 600 }}>
                  Share
                </Typography>
              </Box>
            </Box>

            {/* Bottom Info - With Expandable Caption */}
            <Box
              data-caption-area="true"
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: { xs: 70, sm: 80 },
                p: { xs: 2, sm: 3 },
                pb: { xs: 3, sm: 4 },
                background: isDarkMode
                  ? 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7) 50%, transparent)'
                  : 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.9) 50%, transparent)',
                zIndex: 10
              }}
            >
              {/* Sponsored Section - Placed above caption for sponsored reels */}
              {reel.isSponsored && (
                <ReelSponsoredSection
                  adHeadline={reel.adHeadline}
                  adHeadlineImage={reel.adHeadlineImage}
                  callToActionUrl={reel.callToActionUrl}
                  cta={reel.cta}
                  onCtaClick={() => fireClickEvent(reel)}
                />
              )}

              {/* Expandable Caption Component */}
              <Box data-caption-scroll="true">
                <ExpandableCaption
                  caption={reel.caption}
                  tags={reel.tags}
                  maxLength={80}
                  maxLines={2}
                />
              </Box>

              {/* View Count */}
              <Typography variant="caption" sx={{
                color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                mt: 1,
                display: 'block'
              }}>
                {reel.views} views
              </Typography>

              {/* Swipe Indicator */}
              {index === currentReelIndex && currentReelIndex < reels.length - 1 && (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 2,
                  color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary'
                }}>
                  <ChevronUpIcon sx={{ fontSize: 20 }} />
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    Swipe up for more
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Mute Button - Only show for current reel */}
            {index === currentReelIndex && (
              <IconButton
                onClick={() => setReelMuted(!reelMuted)}
                sx={{
                  position: 'absolute',
                  bottom: { xs: reel.isSponsored ? 180 : 100, sm: reel.isSponsored ? 200 : 120 },
                  right: { xs: 20, sm: 30 },
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.3)',
                  zIndex: 10,
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.5)'
                  }
                }}
              >
                {reelMuted ?
                  <VolumeOffIcon sx={{ fontSize: 24 }} /> :
                  <VolumeUpIcon sx={{ fontSize: 24 }} />
                }
              </IconButton>
            )}
          </Box>
        ))}

        {/* Progress Indicators */}
        <Box sx={{
          position: 'absolute',
          right: { xs: 8, sm: 12 },
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          zIndex: 15
        }}>
          {reels.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 3,
                height: index === currentReelIndex ? 16 : 8,
                borderRadius: 2,
                bgcolor: index === currentReelIndex
                  ? (isDarkMode ? 'white' : 'primary.main')
                  : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onClick={() => {
                setCurrentReelIndex(index)
                setReelPlaying(true)
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Comment Dialog */}
      {selectedReelForComments && (
        <CommentDialog
          open={commentDialogOpen}
          onClose={handleCloseComments}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          post={{
            id: selectedReelForComments.postId,
            user: {
              name: selectedReelForComments.user,
              username: selectedReelForComments.username,
              avatar: selectedReelForComments.user.charAt(0).toUpperCase(),
              avatarColor: selectedReelForComments.bgColor,
              time: selectedReelForComments.createdAt || '3d ago',
              userId: selectedReelForComments.userId
            },
            content: selectedReelForComments.caption,
            contentType: "REEL"
          }}
        />
      )}

      {/* Share Dialog */}
      {selectedReelForShare && (
        <CreatePostDialog
          open={shareDialogOpen}
          onClose={handleShareDialogClose}
          sharedPost={convertReelToPost(selectedReelForShare)}
          onPostCreated={handleShareSuccess}
        />
      )}
    </Box>
  )
}

export default ReelsPageContent