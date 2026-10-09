'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  Box, Typography, CircularProgress, IconButton, AppBar, Toolbar, Snackbar, Alert,
  Button, useTheme, useMediaQuery, Avatar, TextField, Collapse, Menu, MenuItem,
  Divider, CardMedia, LinearProgress, Chip
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon, Home as HomeIcon, Refresh as RefreshIcon, Close as CloseIcon,
  FavoriteBorder as LikeIcon, Favorite as LikedIcon, ChatBubbleOutline as CommentIcon,
  Bookmark as BookmarkIcon, BookmarkBorder as BookmarkBorderIcon,
  CheckCircle as VerifiedIcon, Delete as DeleteIcon, Edit as EditIcon,
  MoreVert as MoreVertIcon, NavigateNext as NextIcon, NavigateBefore as PrevIcon,
  PlayArrow as PlayIcon, VolumeUp as VolumeUpIcon, VolumeOff as VolumeOffIcon,
  CheckCircle as CheckCircleIcon, MovieFilter as ReelIcon
} from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import MainLayout from '@/components/layout/MainLayout'

// ==================== TYPES ====================

type ContentType = 'POST' | 'REEL'

interface TaggedUser {
  tagId: number; postId: number | null; taggedUserId: string; taggedByUserId: string
  isActive: string; createdAt: string; taggedUsername: string; taggedFullName: string; taggedProfilePicture: string
}

interface PollOption { id: number; text: string; votes: number }

interface Poll {
  question: string; options: PollOption[]; totalVotes: number; hasVoted: boolean
  votedOptionId?: number; endTime?: string
}

interface PostData {
  postId: number; adminUser: string | null; pageId: number; userId: number
  contentOwnerId: string | null; content: string; postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'REEL' | 'POLL'
  mediaUrls: string | null; mediaUrlsList: string[] | null; mediaType: string | null
  hashtags: string | null; location: string | null; isActive: string; createdAt: string
  updatedAt: string | null; scheduledAt: string | null; isScheduled: string
  engagementScore: number; thumbnailUrl: string | null; videoDuration: number
  websiteUrl: string | null; isThirdParty: string; campaignId: number; isBanneredPost: number
  visibilityType: number; contentType: string; pollQuestion: string | null
  pollOptions: string | null; pollDurationHours: number | null; username: string
  fullName: string; likeCount: number; commentCount: number; shareCount: number
  hasLiked: string; hasBookmarked: string; poll: Poll | null; taggedUsers: TaggedUser[]
  taggedUsersCount: number; isUserFollowing?: number; isVerified?: boolean
  entityType?: string; profilePicture?: string; 
}

interface ReelData {
  reelId: number; userId: number; adminUser: string | null; title: string
  description: string; videoUrl: string; coverImage: string | null; hashtags: string
  duration: number; isActive: string; createdAt: string; updatedAt: string | null
  username: string; fullName: string; likeCount: number; commentCount: number
  shareCount: number; hasLiked: string; hasBookmarked: string; isUserFollowing?: number
  isVerified?: boolean; profilePicture?: string; pageId?: number;contentType: string;
}

interface UnifiedContent {
  id: number; type: ContentType; userId: number; pageId: number; username: string
  fullName: string; profilePicture?: string; isVerified?: boolean; isUserFollowing?: number
  content: string; mediaUrl: string | null; mediaUrls: string[]; thumbnailUrl: string | null
  hashtags: string | null; location?: string | null; duration: number; createdAt: string
  likeCount: number; commentCount: number; shareCount: number; hasLiked: boolean
  hasBookmarked: boolean; postType?: 'TEXT' | 'PHOTO' | 'VIDEO' | 'REEL' | 'POLL'
  poll?: Poll | null; pollQuestion?: string | null; pollOptions?: string | null
  taggedUsers?: TaggedUser[]; originalData: PostData | ReelData
  contentType?: string | null
}

interface Comment {
  id: number; userId: number | null; userName: string; fullName: string
  profilePicture: string | null; commentText: string; createdAt: string
  likeCount: number; hasLiked: boolean; parentCommentId: number | null; replies?: Comment[]
}

interface CommentApiResponse {
  id: number
  user: { userId: number | null; username: string; fullName: string; profilePicture: string | null }
  text: string; time: string; likes: number; isLiked: number; parentCommentId: number
}

// ==================== HELPER FUNCTIONS ====================

const formatTimeAgo = (dateString: string): string => {
  if (dateString.includes('ago') || dateString.toLowerCase() === 'just now') return dateString
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getAvatarInitials = (fullName: string): string => {
  

  if (!fullName) return '?'
    const names = fullName.trim().split(/\s+/)
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name: string): string => {
  const colors = ['#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e', '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50', '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const formatLikeCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toLocaleString()
}

const parsePollOptions = (optionsString: string | null): PollOption[] => {
  if (!optionsString) return []
  try {
    const parsed = JSON.parse(optionsString)
    if (Array.isArray(parsed)) return parsed.map((opt, index) => ({ id: opt.id || index + 1, text: opt.text || opt, votes: opt.votes || 0 }))
    return []
  } catch {
    return optionsString.split(',').map((text, index) => ({ id: index + 1, text: text.trim(), votes: 0 }))
  }
}

const transformPostToUnified = (post: PostData): UnifiedContent => ({
  id: post.postId, type: 'POST', userId: post.userId, pageId: post.pageId,
  username: post.username, fullName: post.fullName, profilePicture: post.profilePicture,
  isVerified: post.isVerified, isUserFollowing: post.isUserFollowing,
  content: post.content || '', mediaUrl: post.mediaUrls,
  mediaUrls: post.mediaUrlsList || (post.mediaUrls ? [post.mediaUrls] : []),
  thumbnailUrl: post.thumbnailUrl, hashtags: post.hashtags, location: post.location,
  duration: post.videoDuration, createdAt: post.createdAt, likeCount: post.likeCount,
  commentCount: post.commentCount, shareCount: post.shareCount,
  hasLiked: post.hasLiked === 'Y', hasBookmarked: post.hasBookmarked === 'Y',
  postType: post.postType, poll: post.poll, pollQuestion: post.pollQuestion,
  pollOptions: post.pollOptions, taggedUsers: post.taggedUsers, originalData: post
})

const transformReelToUnified = (reel: ReelData): UnifiedContent => ({
  id: reel.reelId, type: 'REEL', userId: reel.userId, pageId: reel.pageId || 0,
  username: reel.username, fullName: reel.fullName, profilePicture: reel.profilePicture,
  isVerified: reel.isVerified, isUserFollowing: reel.isUserFollowing,
  content: reel.description || reel.title || '', mediaUrl: reel.videoUrl,
  mediaUrls: reel.videoUrl ? [reel.videoUrl] : [], thumbnailUrl: reel.coverImage,
  hashtags: reel.hashtags, location: null, duration: reel.duration, createdAt: reel.createdAt,
  likeCount: reel.likeCount, commentCount: reel.commentCount, shareCount: reel.shareCount,
  hasLiked: reel.hasLiked === 'Y', hasBookmarked: reel.hasBookmarked === 'Y',
  postType: 'REEL', originalData: reel
})

// ==================== MAIN COMPONENT ====================

const SingleContentPageClient = () => {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isDark = theme.palette.mode === 'dark'

  const contentId = params?.postId as string
  const ownerUserId = params?.userId as string
  const ownerPageId = params?.pageId as string
  const contentTypeParam = searchParams.get('type') as ContentType | null

  const [content, setContent] = useState<UnifiedContent | null>(null)
  const [contentType, setContentType] = useState<ContentType>('POST')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({})
  const [showReplies, setShowReplies] = useState<{ [key: number]: boolean }>({})
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState<{ [key: number]: string }>({})
  const [isUpdatingComment, setIsUpdatingComment] = useState<number | null>(null)

  const [selectedPollOption, setSelectedPollOption] = useState<number | null>(null)
  const [localHasVoted, setLocalHasVoted] = useState(false)
  const [pollOptions, setPollOptions] = useState<PollOption[]>([])
  const [totalVotes, setTotalVotes] = useState(0)

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'info' })

  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('childUserId') || localStorage.getItem('userId') : null
  const currentPageId = typeof window !== 'undefined' ? localStorage.getItem('childPageId') || '0' : '0'

  // ==================== MOBILE APP REDIRECT ====================

  useEffect(() => {
    if (typeof window === 'undefined') return
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    // Don't redirect if user is logged in on web
    const isLoggedIn = localStorage.getItem('userId') || localStorage.getItem('childUserId')
    if (isLoggedIn) return

    if (isAndroid) {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bito.circle'
      const deepLinkPath = `post/${contentId}/${ownerUserId}/${ownerPageId}${contentTypeParam ? `?type=${contentTypeParam}` : ''}`
      const intentUrl = `intent://${deepLinkPath}#Intent;scheme=bitocircle;package=com.bito.circle;S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`
      window.location.href = intentUrl
    } else if (isiOS) {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.bito.circle'
      window.location.href = playStoreUrl
    }
  }, [contentId, ownerUserId, ownerPageId, contentTypeParam])

  // ==================== API CALLS ====================

  

  const fetchPost = async (): Promise<UnifiedContent | null> => {
    const loggedInUserId = currentUserId || '0'
    const response = await fetch(`https://institutional-bo.paybito.com:8443/BitohubService/post/getPostById/${contentId}/${loggedInUserId}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) return null
    const result = await response.json()
    return result.success && result.data ? transformPostToUnified(result.data) : null
  }

  const fetchReel = async (): Promise<UnifiedContent | null> => {
    const loggedInUserId = currentUserId || '0'
    const reelOwnerPageId = ownerPageId || currentPageId || '0'
    const response = await fetch(`https://institutional-bo.paybito.com:8443/BitohubService/reels/getReelById/${loggedInUserId}/${reelOwnerPageId}/${contentId}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    if (!response.ok) return null
    const result = await response.json()
    return result.success && result.data ? transformReelToUnified(result.data) : null
  }

  const fetchContent = async () => {
    if (!contentId) { setError('Content ID is required'); setLoading(false); return }
    try {
      setLoading(true); setError(null)
      let fetchedContent: UnifiedContent | null = null

      if (contentTypeParam === 'REEL') {
        fetchedContent = await fetchReel()
        if (fetchedContent) setContentType('REEL')
      } else if (contentTypeParam === 'POST') {
        fetchedContent = await fetchPost()
        if (fetchedContent) setContentType('POST')
      } else {
        fetchedContent = await fetchPost()
        if (fetchedContent) { setContentType('POST') }
        else { fetchedContent = await fetchReel(); if (fetchedContent) setContentType('REEL') }
      }

      if (fetchedContent) {
        setContent(fetchedContent); setIsLiked(fetchedContent.hasLiked)
        setLikeCount(fetchedContent.likeCount); setIsSaved(fetchedContent.hasBookmarked)
        setCommentCount(fetchedContent.commentCount)

        if (fetchedContent.type === 'POST' && fetchedContent.postType === 'POLL') {
          const options = fetchedContent.poll?.options || parsePollOptions(fetchedContent.pollOptions || null)
          setPollOptions(options)
          setTotalVotes(fetchedContent.poll?.totalVotes || options.reduce((sum, opt) => sum + opt.votes, 0))
          setLocalHasVoted(fetchedContent.poll?.hasVoted || false)
          setSelectedPollOption(fetchedContent.poll?.votedOptionId || null)
        }
      } else { throw new Error('Content not found') }
    } catch (err) {
      console.error('Error fetching content:', err)
      setError(err instanceof Error ? err.message : 'Failed to load content')
    } finally { setLoading(false) }
  }

  const fetchComments = async () => {
    if (!content) return
    setIsLoadingComments(true)
    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/comments/getCommentsByPost', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId ? parseInt(currentUserId) : 0, contentId: content.id })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      if (result.success) {
        const transformedComments = (result.data || []).map((c: CommentApiResponse) => ({
          id: c.id, userId: c.user.userId, userName: c.user.username, fullName: c.user.fullName,
          profilePicture: c.user.profilePicture, commentText: c.text, createdAt: c.time,
          likeCount: c.likes, hasLiked: c.isLiked === 1,
          parentCommentId: c.parentCommentId === 0 ? null : c.parentCommentId, replies: []
        }))
        const commentMap = new Map<number, Comment>()
        const rootComments: Comment[] = []
        transformedComments.forEach((c: Comment) => commentMap.set(c.id, { ...c, replies: [] }))
        transformedComments.forEach((c: Comment) => {
          const comment = commentMap.get(c.id)!
          if (c.parentCommentId === null) rootComments.push(comment)
          else { const parent = commentMap.get(c.parentCommentId); if (parent) parent.replies!.push(comment) }
        })
        setComments(rootComments)
      }
    } catch (error) { console.error('Error fetching comments:', error) }
    finally { setIsLoadingComments(false) }
  }

  useEffect(() => { fetchContent() }, [contentId, ownerUserId, ownerPageId, contentTypeParam])
  useEffect(() => { if (content) fetchComments() }, [content?.id])

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => setSnackbar({ open: true, message, severity })

  // Like handler
  const handleLike = async () => {
    if (!content) return
    console.log('content',content);
    
    const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    const pageId = localStorage.getItem('childPageId')
    if (!userId) { showSnackbar('Please login to like', 'warning'); return }

    setIsLiked(!isLiked); setLikeCount(prev => isLiked ? prev - 1 : prev + 1)

    try {
      let response: Response
      if (content.type === 'REEL') {
        response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/reels/likeReel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: parseInt(userId), reelId: content.id, pageId: parseInt(localStorage.getItem('pageId') || '0')})
        })
      } else {
        response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/post/toggleLikePost', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: parseInt(userId),
            contentId: content.id,
            contentType: content.originalData.contentType,
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        })
      }
      if (!response.ok) { setIsLiked(isLiked); setLikeCount(prev => isLiked ? prev + 1 : prev - 1); throw new Error('Failed to update like') }
    } catch (err) { console.error('Error liking content:', err); showSnackbar('Failed to update like', 'error') }
  }

  // Save/Bookmark handler - different APIs for posts and reels
  const handleSave = async () => {
    if (!content) return
    const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    if (!userId) { showSnackbar('Please login to save', 'warning'); return }

    const previousState = isSaved
    setIsSaved(!isSaved)

    try {
      let response: Response

      if (content.type === 'REEL') {
        // Reel bookmark API: POST /reels/bookmarkReel/{userId}/{reelId}
        response = await fetch(
          `https://institutional-bo.paybito.com:8443/BitohubService/reels/bookmarkReel/${userId}/${content.id}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } }
        )
      } else {
        // Post bookmark API: POST /post/bookmarkPost with payload
        response = await fetch(
          'https://institutional-bo.paybito.com:8443/BitohubService/post/bookmarkPost',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, postId: String(content.id) })
          }
        )
      }

      if (!response.ok) {
        setIsSaved(previousState)
        throw new Error('Failed to update bookmark')
      }

      const result = await response.json()
      if (result.success) {
        showSnackbar(previousState ? 'Removed from saved' : 'Saved', 'success')
      } else {
        setIsSaved(previousState)
        showSnackbar(result.message || 'Failed to save', 'error')
      }
    } catch (err) {
      console.error('Error saving content:', err)
      setIsSaved(previousState)
      showSnackbar('Failed to save', 'error')
    }
  }

  const renderClickableHashtags = (hashtags: string, router: ReturnType<typeof useRouter>) => {
  if (!hashtags) return null
  
  // Split hashtags by space or comma, filter out empty strings
  const hashtagList = hashtags.split(/[\s,]+/).filter(tag => tag.startsWith('#') && tag.length > 1)
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {hashtagList.map((tag, index) => {
        const tagName = tag.replace('#', '') // Remove # for the URL
        return (
          <Typography
            key={index}
            component="span"
            variant="body2"
            onClick={() => router.push(`/hashtagposts/${tagName}`)}
            sx={{
              color: '#00376b',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {tag}
          </Typography>
        )
      })}
    </Box>
  )
}

const renderContentWithClickableHashtags = (text: string, router: ReturnType<typeof useRouter>) => {
  if (!text) return null
  
  // Split text by hashtags while keeping the hashtags
  const parts = text.split(/(#\w+)/g)
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 1) {
          const tagName = part.replace('#', '')
          return (
            <Typography
              key={index}
              component="span"
              variant="body2"
              onClick={() => router.push(`/hashtagposts/${tagName}`)}
              sx={{
                color: '#00376b',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {part}
            </Typography>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

  // Add comment handler
  const handleAddComment = async (parentCommentId: number | null = null) => {
    const commentText = parentCommentId ? replyText[parentCommentId]?.trim() : newComment.trim()
    if (!commentText) { showSnackbar('Please enter a comment', 'error'); return }
    if (!currentUserId) { showSnackbar('Please login to comment', 'error'); return }

    setIsSubmitting(true)
    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/comments/makeComment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(currentUserId), contentId: content?.id, contentType: content?.type === 'REEL' ? 'REEL' : 'POST', commentText, parentCommentId: parentCommentId || 0, pageId: parseInt(localStorage.getItem('pageId') || '0') })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const result = await response.json()
      if (result.success) {
        if (parentCommentId) { setReplyText(prev => ({ ...prev, [parentCommentId]: '' })); setReplyToCommentId(null) }
        else { setNewComment('') }
        setCommentCount(prev => prev + 1); await fetchComments()
      } else { throw new Error(result.message || 'Failed to add comment') }
    } catch (error) { console.error('Error adding comment:', error); showSnackbar('Failed to add comment', 'error') }
    finally { setIsSubmitting(false) }
  }

  // Like comment handler
  const handleLikeComment = async (commentId: number) => {
    if (!currentUserId) { showSnackbar('Please login to like comments', 'error'); return }
    const updateCommentLike = (commentsList: Comment[]): Comment[] => commentsList.map(c => {
      if (c.id === commentId) return { ...c, hasLiked: !c.hasLiked, likeCount: c.hasLiked ? c.likeCount - 1 : c.likeCount + 1 }
      if (c.replies?.length) return { ...c, replies: updateCommentLike(c.replies) }
      return c
    })
    setComments(updateCommentLike(comments))
    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/comments/likeComment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(currentUserId), commentId })
      })
      if (!response.ok) setComments(updateCommentLike(comments))
    } catch (error) { console.error('Error liking comment:', error); setComments(updateCommentLike(comments)) }
  }

  // Delete comment handler
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUserId || !window.confirm('Delete this comment?')) return
    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/comments/deleteComment', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(currentUserId), commentId })
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) { showSnackbar('Comment deleted', 'success'); setCommentCount(prev => prev - 1); await fetchComments() }
      }
    } catch (error) { console.error('Error deleting comment:', error); showSnackbar('Failed to delete comment', 'error') }
    finally { setMenuAnchorEl(null) }
  }

  // Update comment handler
  const handleUpdateComment = async (commentId: number) => {
    const updatedText = editText[commentId]?.trim()
    if (!updatedText || !currentUserId) return
    setIsUpdatingComment(commentId)
    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/comments/updateComment', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, commentText: updatedText, userId: parseInt(currentUserId) })
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) { showSnackbar('Comment updated', 'success'); setEditingCommentId(null); setEditText(prev => { const s = { ...prev }; delete s[commentId]; return s }); await fetchComments() }
      }
    } catch (error) { console.error('Error updating comment:', error); showSnackbar('Failed to update comment', 'error') }
    finally { setIsUpdatingComment(null) }
  }

  // Poll vote handler
  const handleVote = async (optionId: number) => {
    if (localHasVoted || !content) return
    setSelectedPollOption(optionId); setLocalHasVoted(true)
    setPollOptions(prev => prev.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    setTotalVotes(prev => prev + 1)
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      await fetch('https://institutional-bo.paybito.com:8443/BitohubService/post/votePoll', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: content.id, optionId, userId })
      })
    } catch (error) { console.error('Error voting:', error) }
  }

  // Video controls
  const handlePlayPause = () => {
    if (videoRef.current) { if (isPlaying) videoRef.current.pause(); else videoRef.current.play(); setIsPlaying(!isPlaying) }
  }
  const handleMuteToggle = () => { if (videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted) } }

  // ==================== RENDER MEDIA ====================

  const renderMedia = () => {
    if (!content) return null

    if (content.postType === 'TEXT') {
      return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#262626' : '#fafafa', p: 4 }}>
          <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 500, lineHeight: 1.6 }}>{content.content}</Typography>
        </Box>
      )
    }

    if (content.postType === 'PHOTO' && content.mediaUrls.length > 0) {
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <CardMedia component="img" image={content.mediaUrls[selectedImageIndex]} alt="Post image" sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'black' }} />
          {content.mediaUrls.length > 1 && (
            <>
              <IconButton onClick={() => setSelectedImageIndex(prev => prev === 0 ? content.mediaUrls.length - 1 : prev - 1)} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, width: 32, height: 32 }}><PrevIcon sx={{ fontSize: 20 }} /></IconButton>
              <IconButton onClick={() => setSelectedImageIndex(prev => prev === content.mediaUrls.length - 1 ? 0 : prev + 1)} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: 'white' }, width: 32, height: 32 }}><NextIcon sx={{ fontSize: 20 }} /></IconButton>
              <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 0.5 }}>
                {content.mediaUrls.map((_, index) => (<Box key={index} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: index === selectedImageIndex ? '#0095f6' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => setSelectedImageIndex(index)} />))}
              </Box>
            </>
          )}
        </Box>
      )
    }

    if ((content.postType === 'VIDEO' || content.type === 'REEL' || content.postType === 'REEL') && content.mediaUrl) {
      return (
        <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={videoRef} src={content.mediaUrl} poster={content.thumbnailUrl || undefined} muted={isMuted} loop playsInline style={{ width: '100%', height: '100%', objectFit: content.type === 'REEL' ? 'cover' : 'contain' }} onClick={handlePlayPause} />
          {!isPlaying && <IconButton onClick={handlePlayPause} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, width: 64, height: 64 }}><PlayIcon sx={{ fontSize: 32 }} /></IconButton>}
          <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 1 }}>
            <IconButton onClick={handleMuteToggle} sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }, width: 36, height: 36 }}>{isMuted ? <VolumeOffIcon sx={{ fontSize: 20 }} /> : <VolumeUpIcon sx={{ fontSize: 20 }} />}</IconButton>
          </Box>
          {content.duration > 0 && <Box sx={{ position: 'absolute', bottom: 16, left: 16, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem' }}>{formatDuration(content.duration)}</Box>}
          {content.type === 'REEL' && <Box sx={{ position: 'absolute', top: 16, left: 16 }}><Chip icon={<ReelIcon sx={{ fontSize: 16 }} />} label="Reel" size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.9)', color: 'white', fontWeight: 600, '& .MuiChip-icon': { color: 'white' } }} /></Box>}
        </Box>
      )
    }

    if (content.postType === 'POLL') {
      const winningOption = localHasVoted ? pollOptions.reduce((prev, current) => (prev.votes > current.votes) ? prev : current, pollOptions[0]) : null
      return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#262626' : '#fafafa', p: 4 }}>
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3, textAlign: 'center' }}>{content.pollQuestion || content.content}</Typography>
            {pollOptions.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
              const isSelected = selectedPollOption === option.id
              const isWinning = winningOption?.id === option.id
              return (
                <Box key={option.id} sx={{ mb: 1.5 }}>
                  {!localHasVoted ? (
                    <Button variant="outlined" fullWidth onClick={() => handleVote(option.id)} sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: isDark ? '#4b5563' : '#e4e6ea', color: 'text.primary', py: 1.25, px: 2, '&:hover': { borderColor: '#0095f6', bgcolor: isDark ? 'rgba(0, 149, 246, 0.1)' : '#f0f8ff' } }}>{option.text}</Button>
                  ) : (
                    <Box sx={{ position: 'relative', bgcolor: isDark ? '#111827' : 'white', border: '1px solid', borderColor: isWinning ? '#42b883' : (isDark ? '#4b5563' : '#e4e6ea'), borderRadius: 1, overflow: 'hidden', minHeight: 44 }}>
                      <LinearProgress variant="determinate" value={percentage} sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, height: '100%', bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: isWinning ? 'rgba(66, 184, 131, 0.15)' : 'rgba(0, 149, 246, 0.1)' } }} />
                      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, zIndex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 400 }}>{option.text}</Typography>
                          {isSelected && <CheckCircleIcon sx={{ fontSize: 16, color: '#0095f6' }} />}
                          {isWinning && <Chip label="Leading" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#42b883', color: 'white' }} />}
                        </Box>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: isWinning ? '#42b883' : 'text.secondary' }}>{percentage}%</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )
            })}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</Typography>
          </Box>
        </Box>
      )
    }

    return null
  }

  // ==================== RENDER COMMENT ====================

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment = currentUserId && comment.userId && comment.userId === parseInt(currentUserId)
    const hasReplies = comment.replies && comment.replies.length > 0
    const isShowingReplies = showReplies[comment.id]
    const isReplyingToThis = replyToCommentId === comment.id
    const isEditingThis = editingCommentId === comment.id

    return (
      <Box key={comment.id} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Avatar src={comment.profilePicture || undefined} sx={{ width: isReply ? 24 : 32, height: isReply ? 24 : 32, bgcolor: getAvatarColor(comment.fullName), fontSize: isReply ? 10 : 12, cursor: 'pointer' }} onClick={() => router.push(`/public/${comment.userId}/0`)}>{getAvatarInitials(comment.fullName)}</Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isEditingThis ? (
              <Box>
                <TextField fullWidth multiline maxRows={4} value={editText[comment.id] || ''} onChange={(e) => setEditText(prev => ({ ...prev, [comment.id]: e.target.value }))} variant="outlined" size="small" disabled={isUpdatingComment === comment.id} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => { setEditingCommentId(null); setEditText(prev => { const s = { ...prev }; delete s[comment.id]; return s }) }} disabled={isUpdatingComment === comment.id}>Cancel</Button>
                  <Button size="small" variant="contained" onClick={() => handleUpdateComment(comment.id)} disabled={!editText[comment.id]?.trim() || isUpdatingComment === comment.id}>{isUpdatingComment === comment.id ? <CircularProgress size={16} /> : 'Save'}</Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.875rem', mr: 0.5, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => router.push(`/public/${comment.userId}/0`)}>{comment.fullName}</Typography>
                    <Typography component="span" sx={{ fontSize: '0.875rem', color: 'text.primary', wordBreak: 'break-word' }}>{comment.commentText}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => handleLikeComment(comment.id)} sx={{ ml: 1, p: 0.5 }}>{comment.hasLiked ? <LikedIcon sx={{ fontSize: 14, color: '#ed4956' }} /> : <LikeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />}</IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">{formatTimeAgo(comment.createdAt)}</Typography>
                  {comment.likeCount > 0 && <Typography variant="caption" color="text.secondary" fontWeight={600}>{comment.likeCount} {comment.likeCount === 1 ? 'like' : 'likes'}</Typography>}
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => setReplyToCommentId(isReplyingToThis ? null : comment.id)}>Reply</Typography>
                  {isOwnComment && <IconButton size="small" onClick={(e) => { setMenuAnchorEl(e.currentTarget); setSelectedCommentId(comment.id) }} sx={{ p: 0 }}><MoreVertIcon sx={{ fontSize: 16 }} /></IconButton>}
                </Box>
              </>
            )}

            <Collapse in={isReplyingToThis && !isEditingThis}>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <TextField fullWidth placeholder={`Reply to ${comment.fullName}...`} value={replyText[comment.id] || ''} onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(comment.id) } }} variant="standard" size="small" disabled={isSubmitting} />
                <Button size="small" onClick={() => handleAddComment(comment.id)} disabled={!replyText[comment.id]?.trim() || isSubmitting} sx={{ textTransform: 'none', fontWeight: 600, color: '#0095f6' }}>{isSubmitting ? <CircularProgress size={14} /> : 'Post'}</Button>
              </Box>
            </Collapse>

            {hasReplies && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, cursor: 'pointer' }} onClick={() => setShowReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}>
                <Box sx={{ width: 24, height: 1, bgcolor: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>{isShowingReplies ? 'Hide replies' : `View replies (${comment.replies!.length})`}</Typography>
              </Box>
            )}

            <Collapse in={isShowingReplies}><Box sx={{ mt: 2, pl: 1 }}>{comment.replies?.map(reply => renderComment(reply, true))}</Box></Collapse>
          </Box>
        </Box>
      </Box>
    )
  }

  // ==================== LOADING STATE ====================

  if (loading) {
    return <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#000' : '#fafafa' }}><CircularProgress /></Box>
  }

  // ==================== ERROR STATE ====================

  if (error || !content) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? '#000' : '#fafafa', p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>{error || 'Content not found'}</Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchContent}>Retry</Button>
          <Button variant="contained" startIcon={<HomeIcon />} onClick={() => router.push('/')}>Go Home</Button>
        </Box>
      </Box>
    )
  }

  // ==================== MOBILE VIEW ====================

  if (isMobile) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#000' : '#fff' }}>
        <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar>
            <IconButton edge="start" onClick={() => router.back()}><ArrowBackIcon /></IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'center' }}>{content.type === 'REEL' ? 'Reel' : 'Post'}</Typography>
            <IconButton onClick={() => router.push('/')}><HomeIcon /></IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, gap: 1.5 }}>
          <Avatar src={content.profilePicture || undefined} onClick={() => router.push(`/public/${content.userId}/${content.pageId}`)} sx={{ width: 32, height: 32, bgcolor: getAvatarColor(content.fullName), cursor: 'pointer' }}>{getAvatarInitials(content.fullName)}</Avatar>
          <Box sx={{ flex: 1 }} onClick={() => router.push(`/public/${content.userId}/${content.pageId}`)} style={{ cursor: 'pointer' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" fontWeight={600}>{content.fullName}</Typography>
              {content.isVerified && <VerifiedIcon sx={{ fontSize: 14, color: '#0095f6' }} />}
              {content.type === 'REEL' && <Chip icon={<ReelIcon sx={{ fontSize: 12 }} />} label="Reel" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }} />}
            </Box>
            {content.location && <Typography variant="caption" color="text.secondary">{content.location}</Typography>}
          </Box>
        </Box>

        <Box sx={{ width: '100%', aspectRatio: content.type === 'REEL' ? '9/16' : '1', maxHeight: content.type === 'REEL' ? '70vh' : 'auto', bgcolor: 'black' }}>{renderMedia()}</Box>

        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={handleLike} sx={{ p: 0 }}>{isLiked ? <LikedIcon sx={{ color: '#ed4956' }} /> : <LikeIcon />}</IconButton>
              <IconButton sx={{ p: 0 }}><CommentIcon /></IconButton>
            </Box>
            <IconButton onClick={handleSave} sx={{ p: 0 }}>{isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}</IconButton>
          </Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{formatLikeCount(likeCount)} likes</Typography>
          {content.content && content.postType !== 'TEXT' && content.postType !== 'POLL' && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" component="span" fontWeight={600} sx={{ mr: 0.5 }}>{content.fullName}</Typography>
              <Typography variant="body2" component="span">{content.content}</Typography>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary">{formatTimeAgo(content.createdAt)}</Typography>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>{isLoadingComments ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box> : comments.map(comment => renderComment(comment))}</Box>

        <Box sx={{ position: 'sticky', bottom: 0, bgcolor: isDark ? '#000' : '#fff', borderTop: '1px solid', borderColor: 'divider', p: 2, display: 'flex', gap: 1 }}>
          <TextField fullWidth placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} variant="standard" InputProps={{ disableUnderline: true }} disabled={isSubmitting} />
          <Button onClick={() => handleAddComment()} disabled={!newComment.trim() || isSubmitting} sx={{ textTransform: 'none', fontWeight: 600, color: '#0095f6' }}>{isSubmitting ? <CircularProgress size={16} /> : 'Post'}</Button>
        </Box>

        <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}><Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert></Snackbar>
      </Box>
    )
  }

  // ==================== DESKTOP VIEW (Instagram Style) ====================

  return (

    <MainLayout allowPublicAccess={true}>
<Box sx={{ minHeight: '100vh', bgcolor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <IconButton onClick={() => router.back()} sx={{ position: 'fixed', top: 16, right: 16, color: 'white', zIndex: 10 }}><CloseIcon sx={{ fontSize: 28 }} /></IconButton>

      <Box sx={{ display: 'flex', width: '100%', maxWidth: content.type === 'REEL' ? 1000 : 1200, height: { md: '85vh', lg: '90vh' }, maxHeight: 900, bgcolor: isDark ? '#000' : '#fff', borderRadius: 1, overflow: 'hidden', boxShadow: '0 4px 30px rgba(0,0,0,0.3)' }}>
        {/* Left - Media */}
        <Box sx={{ flex: content.type === 'REEL' ? '1 1 45%' : '1 1 60%', maxWidth: content.type === 'REEL' ? '45%' : '60%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{renderMedia()}</Box>

        {/* Right - Comments */}
        <Box sx={{ flex: content.type === 'REEL' ? '1 1 55%' : '1 1 40%', maxWidth: content.type === 'REEL' ? '55%' : '40%', minWidth: 335, display: 'flex', flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider' }}>
          {/* Header - Simplified without follow/menu buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid', borderColor: 'divider', gap: 1.5 }}>
            <Avatar src={content.profilePicture || undefined} sx={{ width: 32, height: 32, bgcolor: getAvatarColor(content.fullName), cursor: 'pointer' }} onClick={() => router.push(`/public/${content.userId}/${content.pageId}`)}>{getAvatarInitials(content.fullName)}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => router.push(`/public/${content.userId}/${content.pageId}`)}>{content.fullName}</Typography>
                {content.isVerified && <VerifiedIcon sx={{ fontSize: 14, color: '#0095f6' }} />}
                {content.type === 'REEL' && <Chip icon={<ReelIcon sx={{ fontSize: 14 }} />} label="Reel" size="small" sx={{ ml: 0.5, height: 20, fontSize: '0.65rem', bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6', '& .MuiChip-icon': { color: '#8B5CF6' } }} />}
              </Box>
              {content.location && <Typography variant="caption" color="text.secondary">{content.location}</Typography>}
            </Box>
          </Box>

          {/* Comments List */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, '&::-webkit-scrollbar': { width: 0 } }}>
            {content.content && content.postType !== 'TEXT' && content.postType !== 'POLL' && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
                <Avatar src={content.profilePicture || undefined} sx={{ width: 32, height: 32, bgcolor: getAvatarColor(content.fullName) }}>{getAvatarInitials(content.fullName)}</Avatar>
                <Box>
                  <Box>
                    <Typography component="span" variant="body2" fontWeight={600} sx={{ mr: 0.5 }}>{content.fullName}</Typography>
                    <Typography component="span" variant="body2">
  {renderContentWithClickableHashtags(content.content, router)}
</Typography>
                  </Box>
                  {content.hashtags && renderClickableHashtags(content.hashtags, router)}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{formatTimeAgo(content.createdAt)}</Typography>
                </Box>
              </Box>
            )}

            {isLoadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" fontWeight={700}>No comments yet.</Typography>
                <Typography variant="body2" color="text.secondary">Start the conversation.</Typography>
              </Box>
            ) : comments.map(comment => renderComment(comment))}
          </Box>

          {/* Actions - Simplified without share button */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handleLike}>{isLiked ? <LikedIcon sx={{ color: '#ed4956' }} /> : <LikeIcon />}</IconButton>
                <IconButton><CommentIcon /></IconButton>
              </Box>
              <IconButton onClick={handleSave}>{isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}</IconButton>
            </Box>
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="body2" fontWeight={600}>{formatLikeCount(likeCount)} likes</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{new Date(content.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
            </Box>
          </Box>

          {/* Comment Input */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <TextField fullWidth placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }} variant="standard" InputProps={{ disableUnderline: true }} disabled={isSubmitting} sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }} />
            <Button onClick={() => handleAddComment()} disabled={!newComment.trim() || isSubmitting} sx={{ textTransform: 'none', fontWeight: 600, color: newComment.trim() ? '#0095f6' : '#b3dbff', minWidth: 'auto' }}>{isSubmitting ? <CircularProgress size={16} /> : 'Post'}</Button>
          </Box>
        </Box>
      </Box>

      {/* Comment Menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={() => setMenuAnchorEl(null)}>
        <MenuItem onClick={() => {
          if (selectedCommentId) {
            const findComment = (cmts: Comment[]): Comment | null => { for (const c of cmts) { if (c.id === selectedCommentId) return c; if (c.replies) { const f = findComment(c.replies); if (f) return f } } return null }
            const comment = findComment(comments)
            if (comment) { setEditingCommentId(selectedCommentId); setEditText(prev => ({ ...prev, [selectedCommentId]: comment.commentText })) }
          }
          setMenuAnchorEl(null)
        }}><EditIcon sx={{ fontSize: 18, mr: 1 }} />Edit</MenuItem>
        <MenuItem onClick={() => selectedCommentId && handleDeleteComment(selectedCommentId)} sx={{ color: 'error.main' }}><DeleteIcon sx={{ fontSize: 18, mr: 1 }} />Delete</MenuItem>
      </Menu>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}><Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert></Snackbar>
    </Box>
    </MainLayout>    
    
    
  )
}

export default SingleContentPageClient