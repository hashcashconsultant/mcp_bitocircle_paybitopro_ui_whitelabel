'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useAuth } from '@/contexts/AuthContext'
import { useUserProfile } from '../contexts/UserProfileContext'
import { tokenCookie } from '../hooks/useAuthRedirect';


import {
  Box,
  Avatar,
  Typography,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Skeleton,
  useTheme,
  InputAdornment,
  Snackbar,
  Slide,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon as MuiListItemIcon,
  ListItemText as MuiListItemText
} from '@mui/material'
import { VolumeOff as VolumeOffIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import {
  Close as CloseIcon,
  PhotoCamera as PhotoIcon,
  Videocam as VideoIcon,
  Send as SendIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  EmojiEmotions as EmojiIcon,
  Favorite as HeartIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Visibility as VisibilityIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CheckCircle as CheckCircleIcon,
  InsertPhoto as ImageIcon,
  Movie as MovieIcon,
  MoreVert as MoreVertIcon,
  VisibilityOff as VisibilityOffIcon,
  Block as BlockIcon
} from '@mui/icons-material'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useBroker } from '@/contexts/BrokerContext'

interface Story {
  id: number
  name: string
  avatar: string
  avatarImage?: string
  avatarColor: string
  hasStory: boolean
  isOwn?: boolean
  viewed?: boolean
  time?: string
  storyImage?: string
  storyVideo?: string
  storyText?: string
  storyId?: number
  storyType?: 'TEXT' | 'IMAGE' | 'VIDEO'
  userId?: number
  duration?: number
  storyCaption?: string
}

interface UserStories {
  userId: number
  name: string
  username: string
  avatar: string
  avatarImage?: string
  avatarColor: string
  isOwn: boolean
  stories: Story[]
  hasUnviewed: boolean
}

interface ApiStory {
  storyId: number
  storyType: 'TEXT' | 'IMAGE' | 'VIDEO'
  content?: string
  duration: number
  isActive: string
  createdAt: string
  expiresAt: string
  username: string
  fullName: string
  profilePicture: string
  hasViewed: string
  privacyLevel: string
  userId: number
  pageId: number
  storyOrder: number
  isArchived: boolean
  updatedAt: string
  totalViews: number
  uniqueViews: number
  mediaUrl?: string
}

interface ApiResponse {
  success: boolean
  message: string
  data: ApiStory[]
  errorCode: string
}

interface StoryComponentProps {
  stories?: Story[]
  onStoryClick?: (story: Story) => void
  onAddStory?: (files: File[], caption?: string) => void
}

interface CreateStoryResponse {
  success: boolean
  message: string
  data: {
    stories: Array<{
      storyId: number
      duration: number
      privacyLevel: string | null
      mediaUrl: string
      mediaType: string
      storyType: string
      userId: number
      content: string
      visibilityType: string | null
    }>
  }
  errorCode: string | null
}

interface StoryViewerReaction {
  reactionId: number
  reaction: string
  reactionType: string
  reactionCreatedAt: string
}

interface StoryViewer {
  storyId: number
  viewId: number
  viewDuration: number
  viewCompleted: string
  isVerified: string
  username: string
  fullName: string
  profilePicture: string
  userId: number
  reactions: StoryViewerReaction[]
}

interface SelectedFile {
  file: File
  id: string
  previewUrl: string
  type: 'image' | 'video'
  size: string
  name: string
}

interface HideStoryResponse {
  success: boolean
  message: string
  data: {
    success: boolean
    returnId: number
    message: string
  }
  errorCode: string | null
  totalRecords: number | null
}

const StoryComponent: React.FC<StoryComponentProps> = ({
  onStoryClick,
  onAddStory
}) => {
  const theme = useTheme()
  const { userProfile } = useUserProfile()
  const { brokerDetails } = useBroker()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [isMuted, setIsMuted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [mentions, setMentions] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [userStoriesArray, setUserStoriesArray] = useState<UserStories[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [deletingStory, setDeletingStory] = useState(false)

  // Story progress tracking
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMediaLoaded, setIsMediaLoaded] = useState(false)

  // Story view tracking
  const [viewStartTime, setViewStartTime] = useState<number | null>(null)
  
  // Track if we've already fetched stories
  const hasFetchedRef = useRef(false)

  // Story list scroll navigation
  const storiesContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Reaction and message state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sendingReaction, setSendingReaction] = useState(false)
  const [reactionSent, setReactionSent] = useState<string | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [reactionSnackbar, setReactionSnackbar] = useState({ open: false, message: '' })
  const messageInputRef = useRef<HTMLInputElement>(null)

  // Story viewers state
  const [showViewers, setShowViewers] = useState(false)
  const [storyViewers, setStoryViewers] = useState<StoryViewer[]>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const [viewersError, setViewersError] = useState<string | null>(null)

  // Hide story menu state - UPDATED: removed menuAnchorEl
  const [showHideMenu, setShowHideMenu] = useState(false)
  const [selectedUserForHide, setSelectedUserForHide] = useState<{userId: number, name: string} | null>(null)
  const [hidingStory, setHidingStory] = useState(false)

  const [isTransitioning, setIsTransitioning] = useState(false)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isVideoStory, setIsVideoStory] = useState(false)  // ADD THIS

  // Check scroll position and update arrow visibility
  const checkScrollPosition = useCallback(() => {
    const container = storiesContainerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }, [])

  // Scroll stories left/right
  const scrollStories = (direction: 'left' | 'right') => {
    const container = storiesContainerRef.current
    if (container) {
      const scrollAmount = 200 // Scroll by 200px
      const newScrollLeft = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // Update scroll arrows when stories change or on resize
  useEffect(() => {
    checkScrollPosition()
    
    const container = storiesContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollPosition)
      window.addEventListener('resize', checkScrollPosition)
      
      return () => {
        container.removeEventListener('scroll', checkScrollPosition)
        window.removeEventListener('resize', checkScrollPosition)
      }
    }
  }, [userStoriesArray, loading, checkScrollPosition])

  const fetchStories = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false)
      return
    }

    try {
      const userId = localStorage.getItem('childUserId')

      if (!userId) {
        // Wait a bit and retry - userId might not be set yet
        console.log('[StoryComponent] childUserId not found, will retry...')
        setLoading(false)
        return
      }

      setCurrentUserId(Number(userId))

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/feed?userId=${userId}&pageSize=1&offset=1&pageId=${localStorage.getItem('pageId') || '0'}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success) {
        const groupedStories = new Map<number, ApiStory[]>()

        result.data.forEach((apiStory) => {
          const stories = groupedStories.get(apiStory.userId) || []
          stories.push(apiStory)
          groupedStories.set(apiStory.userId, stories)
        })

        const userStoriesData: UserStories[] = Array.from(groupedStories.entries()).map(([storyUserId, stories]) => {
          const firstStory = stories[0]
          const isOwnStory = storyUserId === Number(userId)

          const sortedStories = stories.sort((a, b) => {
            if (a.storyOrder !== b.storyOrder) {
              return a.storyOrder - b.storyOrder
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          })

          const hasUnviewed = sortedStories.some(s => s.hasViewed === 'N')
          const firstLetter = firstStory.fullName?.charAt(0)?.toUpperCase() || 'U'
          const colors = ['#e91e63', '#9c27b0', '#ff6f00', '#00bcd4', '#4caf50', '#f44336', '#2196f3', '#ff9800']
          const colorIndex = storyUserId % colors.length

          return {
            userId: storyUserId,
            name: firstStory.fullName,
            username: firstStory.username,
            avatar: firstLetter,
            avatarImage: firstStory.profilePicture,
            avatarColor: isOwnStory ? '#4267b2' : colors[colorIndex],
            isOwn: isOwnStory,
            hasUnviewed: hasUnviewed,
            stories: sortedStories.map(apiStory => ({
              id: apiStory.storyId,
              name: firstStory.fullName,
              avatar: firstLetter,
              avatarImage: firstStory.profilePicture,
              avatarColor: isOwnStory ? '#4267b2' : colors[colorIndex],
              hasStory: true,
              isOwn: isOwnStory,
              viewed: apiStory.hasViewed === 'Y',
              time: calculateTimeAgo(apiStory.createdAt),
              storyImage: apiStory.storyType === 'IMAGE' ? apiStory.mediaUrl : undefined,
              storyVideo: apiStory.storyType === 'VIDEO' ? apiStory.mediaUrl : undefined,
              storyText: apiStory.storyType === 'TEXT' ? apiStory.content : undefined,
              storyCaption: apiStory.content,
              storyId: apiStory.storyId,
              storyType: apiStory.storyType,
              userId: apiStory.userId,
              duration: apiStory.duration
            }))
          }
        })

        const ownStories = userStoriesData.filter(u => u.userId === Number(userId))
        const otherStories = userStoriesData.filter(u => u.userId !== Number(userId))

        // CHANGE 2: Sort other stories - unviewed first, then viewed
        const unviewedStories = otherStories.filter(u => u.hasUnviewed)
        const viewedStories = otherStories.filter(u => !u.hasUnviewed)
        const sortedOtherStories = [...unviewedStories, ...viewedStories]

        const finalUserStories: UserStories[] = ownStories.length > 0
          ? [...ownStories, ...sortedOtherStories]
          : [
            {
              userId: Number(userId),
              name: 'Your Story',
              username: '@you',
              avatar: userProfile.fullName?.[0] || brokerDetails?.firstName?.[0] || 'U',
              avatarImage: userProfile.profilePicture || undefined,
              avatarColor: '#4267b2',
              isOwn: true,
              hasUnviewed: false,
              stories: []
            },
            ...sortedOtherStories
          ]
        
        setUserStoriesArray(finalUserStories)
        setError(null)
        hasFetchedRef.current = true
        
        // Check scroll position after stories are loaded
        setTimeout(checkScrollPosition, 100)
      } else {
        throw new Error(result.message || 'Failed to fetch stories')
      }
    } catch (err) {
      console.error('Error fetching stories:', err)
      setError('Failed to load stories')

      const userId = localStorage.getItem('childUserId')
      if (userId) {
        setUserStoriesArray([{
          userId: Number(userId),
          name: 'Your Story',
          username: '@you',
          avatar: 'Y',
          avatarColor: '#4267b2',
          isOwn: true,
          hasUnviewed: false,
          stories: []
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateTimeAgo = (dateString: string): string => {
    const utcString = dateString.endsWith("Z") ? dateString : dateString + "Z";
    const date = new Date(utcString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    // Handle negative time difference (future dates or clock sync issues)
    // If the difference is negative or very small (within 1 minute), show "Just now"
    if (diffMs < 60000) {
      return 'Just now';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const recordStoryView = async (storyId: number, viewDurationSeconds: number) => {
    try {
      const userId = localStorage.getItem('childUserId')
      if (!userId) return

      const userAgent = navigator.userAgent
      const payload = {
        storyId: storyId,
        viewedByUserId: Number(userId),
        viewDuration: Math.round(viewDurationSeconds),
        viewCompleted: 'Y',
        deviceType: 'WEB',
        ipAddress: '',
        userAgent: userAgent
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/stories/view',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Story view recorded successfully')
          
          // Only mark stories as viewed WITHOUT reordering the array.
          // Reordering while the viewer is open shifts indices and causes skips.
          // The array gets properly reordered when the viewer closes (fetchStories).
          setUserStoriesArray(prev => {
            return prev.map(user => {
              if (user.userId === prev[currentUserIndex]?.userId) {
                return {
                  ...user,
                  hasUnviewed: false,
                  stories: user.stories.map(s => ({ ...s, viewed: true }))
                }
              }
              return user
            })
          })
        }
      }
    } catch (error) {
      console.error('Error recording story view:', error)
    }
  }

  // Handle reaction to story
  const handleReaction = async (reaction: string) => {
    const currentStory = currentUserStories?.stories[currentStoryIndex]
    if (!currentStory?.storyId || currentUserStories?.isOwn) return

    try {
      setSendingReaction(true)
      setIsPaused(true)
      const userId = localStorage.getItem('childUserId')
      if (!userId) return

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/${currentStory.storyId}/reaction`,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: Number(userId),
            reaction: reaction
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReactionSent(reaction)
          setReactionSnackbar({ open: true, message: `Reacted with ${reaction}` })
          setTimeout(() => {
            setReactionSent(null)
            setIsPaused(false)
          }, 1500)
        }
      }
    } catch (error) {
      console.error('Error sending reaction:', error)
      setReactionSnackbar({ open: true, message: 'Failed to send reaction' })
      setIsPaused(false)
    } finally {
      setSendingReaction(false)
      setShowEmojiPicker(false)
    }
  }

  // Handle emoji selection from picker - add to message text
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prev => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    // Keep focus on message input
    messageInputRef.current?.focus()
  }

  // Quick reactions
  const quickReactions = ['❤️', '😂', '😮', '😢', '👏', '🔥']

  // Handle sending message for a story
  const handleSendMessage = async () => {
    const currentStory = currentUserStories?.stories[currentStoryIndex]
    if (!messageText.trim() || !currentStory?.storyId || currentUserStories?.isOwn) return

    try {
      setSendingMessage(true)
      setIsPaused(true)
      const userId = localStorage.getItem('childUserId')
      if (!userId) return

      // Send message as reaction (without MESSAGE: prefix)
      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/${currentStory.storyId}/reaction`,
        {
          method: 'POST',
          body: JSON.stringify({
            userId: Number(userId),
            reaction: messageText.trim()
          })
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReactionSnackbar({ open: true, message: 'Message sent!' })
          setMessageText('')
          setTimeout(() => setIsPaused(false), 1000)
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setReactionSnackbar({ open: true, message: 'Failed to send message' })
      setIsPaused(false)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle closing emoji picker
  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false)
    setIsPaused(false)
  }

  // Fetch story viewers and reactions
  const fetchStoryViewers = async (storyId: number) => {
    try {
      setLoadingViewers(true)
      setViewersError(null)
      const userId = localStorage.getItem('childUserId')
      if (!userId) return

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/getStoryReactionDetails?storyId=${storyId}&userId=${userId}`
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setStoryViewers(result.data || [])
        } else {
          setViewersError(result.message || 'Failed to fetch viewers')
        }
      }
    } catch (error) {
      console.error('Error fetching story viewers:', error)
      setViewersError('Failed to load viewers')
    } finally {
      setLoadingViewers(false)
    }
  }

  // Handle opening viewers panel
  const handleOpenViewers = () => {
    const currentStory = currentUserStories?.stories[currentStoryIndex]
    if (currentStory?.storyId) {
      setShowViewers(true)
      setIsPaused(true)
      fetchStoryViewers(currentStory.storyId)
    }
  }

  // Handle closing viewers panel
  const handleCloseViewers = () => {
    setShowViewers(false)
    setIsPaused(false)
  }

  // CHANGE 1: Handle hide story menu open - show menu on story viewer
  const handleMenuOpen = () => {
    const currentUser = userStoriesArray[currentUserIndex]
    if (currentUser && !currentUser.isOwn) {
      setShowHideMenu(true)
      setSelectedUserForHide({ userId: currentUser.userId, name: currentUser.name })
      setIsPaused(true)
    }
  }

  // CHANGE 1: Handle hide story menu close
  const handleMenuClose = () => {
    setShowHideMenu(false)
    setSelectedUserForHide(null)
    if (storyViewerOpen) {
      setIsPaused(false)
    }
  }

  // Handle hide/unhide story API call
  const handleHideStory = async (action: 'HIDE' | 'UNHIDE') => {
    if (!selectedUserForHide || hidingStory) return

    try {
      setHidingStory(true)
      const userId = localStorage.getItem('childUserId')
      if (!userId) {
        throw new Error('User not logged in')
      }

      const payload = {
        userId: userId,
        hiddenUserId: selectedUserForHide.userId.toString(),
        action: action
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/stories/visibility',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: HideStoryResponse = await response.json()

      if (result.success) {
        setReactionSnackbar({ 
          open: true, 
          message: action === 'HIDE' 
            ? `Hidden ${selectedUserForHide.name}'s stories` 
            : `Unhidden ${selectedUserForHide.name}'s stories` 
        })

        // If hiding, close the story viewer and remove the user from the stories list
        if (action === 'HIDE') {
          // Close story viewer if it's open
          if (storyViewerOpen) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setStoryViewerOpen(false)
            setCurrentUserIndex(0)
            setCurrentStoryIndex(0)
            setProgress(0)
            setIsMediaLoaded(false)
            setIsTransitioning(false)
            setViewStartTime(null)
            setShowViewers(false)
            setStoryViewers([])
          }
          setUserStoriesArray(prev => 
            prev.filter(user => user.userId !== selectedUserForHide.userId)
          )
        } else {
          // If unhiding, refetch stories to show the user again
          await fetchStories()
        }
      } else {
        throw new Error(result.message || 'Failed to hide/unhide story')
      }
    } catch (error) {
      console.error('Error hiding/unhiding story:', error)
      setReactionSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to hide/unhide story' 
      })
    } finally {
      setHidingStory(false)
      handleMenuClose()
    }
  }

  // UPDATED: Wait for auth to be ready before fetching
  useEffect(() => {
    // Don't do anything while auth is loading
    if (isAuthLoading) {
      console.log('[StoryComponent] Auth is loading, waiting...')
      return
    }

    // If not authenticated, don't fetch but stop loading
    if (!isAuthenticated) {
      console.log('[StoryComponent] Not authenticated, skipping fetch')
      setLoading(false)
      return
    }

    // If already fetched, don't fetch again
    if (hasFetchedRef.current) {
      return
    }

    // Check if childUserId is available
    const checkAndFetch = () => {
      const userId = localStorage.getItem('childUserId')
      if (userId) {
        console.log('[StoryComponent] childUserId found, fetching stories...')
        fetchStories()
      } else {
        console.log('[StoryComponent] childUserId not yet available, retrying in 500ms...')
        // Retry after a short delay
        setTimeout(checkAndFetch, 500)
      }
    }

    // Initial delay to allow auth processing to complete
    const timeoutId = setTimeout(checkAndFetch, 500)

    return () => clearTimeout(timeoutId)
  }, [isAuthenticated, isAuthLoading])

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('[StoryComponent] Auth state changed, refetching...')
      hasFetchedRef.current = false
      if (isAuthenticated) {
        setTimeout(() => fetchStories(), 500)
      }
    }

    window.addEventListener('authStateChanged', handleAuthChange)
    return () => window.removeEventListener('authStateChanged', handleAuthChange)
  }, [isAuthenticated])

  // Clear interval on cleanup
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [])

  // Reset media loaded state when story changes
  useEffect(() => {
    if (storyViewerOpen) {
      const currentUserStories = userStoriesArray[currentUserIndex]
      const currentStory = currentUserStories?.stories[currentStoryIndex]

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setIsMediaLoaded(false)
      setProgress(0)
      setIsVideoStory(currentStory?.storyType === 'VIDEO')

      setTimeout(() => {
        setIsTransitioning(false)
      }, 150)

      if (currentStory?.storyType === 'TEXT') {
        setTimeout(() => setIsMediaLoaded(true), 100)
      }
    }
  }, [currentUserIndex, currentStoryIndex, storyViewerOpen])

  // Progress bar and auto-advance logic
  // ~line 470: Progress bar and auto-advance logic
useEffect(() => {
    if (isTransitioning) return

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (!storyViewerOpen || isPaused || !isMediaLoaded) return

    const currentUserStories = userStoriesArray[currentUserIndex]
    if (!currentUserStories || currentStoryIndex >= currentUserStories.stories.length) return

    const currentStory = currentUserStories.stories[currentStoryIndex]

    // For VIDEO stories, sync progress with actual video playback
    if (isVideoStory && videoRef.current) {
      const video = videoRef.current

      const onTimeUpdate = () => {
        if (video.duration && isFinite(video.duration)) {
          const percent = (video.currentTime / video.duration) * 100
          setProgress(Math.min(percent, 100))
        }
      }

      const onEnded = () => {
        setProgress(100)
        setIsTransitioning(true)
        setTimeout(() => handleNextStory(), 100)
      }

      video.addEventListener('timeupdate', onTimeUpdate)
      video.addEventListener('ended', onEnded)

      return () => {
        video.removeEventListener('timeupdate', onTimeUpdate)
        video.removeEventListener('ended', onEnded)
      }
    }

    // For IMAGE and TEXT stories, use timer-based progress
    const duration = (currentStory.duration || 5) * 1000
    const intervalTime = 50
    const increment = (100 / duration) * intervalTime

    const startDelay = setTimeout(() => {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + increment

          if (newProgress >= 100) {
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current)
              progressIntervalRef.current = null
            }
            setIsTransitioning(true)
            setTimeout(() => handleNextStory(), 100)
            return 100
          }
          return newProgress
        })
      }, intervalTime)
    }, 200)

    return () => {
      clearTimeout(startDelay)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [storyViewerOpen, isPaused, isMediaLoaded, currentUserIndex, currentStoryIndex, isTransitioning, isVideoStory])
  // Pause/play video when isPaused state changes
  useEffect(() => {
    const currentUserStories = userStoriesArray[currentUserIndex]
    const story = currentUserStories?.stories[currentStoryIndex]
    
    if (videoRef.current && story?.storyVideo) {
      if (isPaused) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(err => console.log('Video play error:', err))
      }
    }
  }, [isPaused, userStoriesArray, currentUserIndex, currentStoryIndex])

  const trackStoryClick = async (storyId: number) => {
  try {
    const viewerId = localStorage.getItem('childUserId')
    if (!viewerId) return

    const payload = {
      viewerId: Number(viewerId),
      contentId: storyId,
      contentType: "STORY",
      durationOfView: 0,
      eventType: "CLICK",
      campaignId: 0
    }

    const response = await fetchWithAuth(
      'https://institutional-bo.paybito.com:8443/BitohubService/tracking/event',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    )

    if (response.ok) {
      console.log('Story click tracked successfully')
    } else {
      console.error('Failed to track story click')
    }
  } catch (error) {
    console.error('Error tracking story click:', error)
    // Don't show error to user - this is non-critical tracking
  }
}

  const handleUserStoryClick = (userIndex: number) => {
  const userStory = userStoriesArray[userIndex]

  if (userStory.isOwn && userStory.stories.length === 0) {
    fileInputRef.current?.click()
  } else if (userStory.stories.length > 0) {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    setCurrentUserIndex(userIndex)
    setCurrentStoryIndex(0)
    setStoryViewerOpen(true)
    setProgress(0)
    setIsPaused(false)
    setIsMediaLoaded(false)
    setIsTransitioning(false)
    setViewStartTime(Date.now())
    setShowViewers(false)
    setStoryViewers([])

    // Track the click for the first story of this user
    const firstStory = userStory.stories[0]
    if (firstStory?.storyId) {
      trackStoryClick(firstStory.storyId)
    }

    if (!userStory.isOwn) {
      recordStoryView(userStory.stories[0].storyId!, 0)
    } else {
      // Fetch viewers for own story
      fetchStoryViewers(userStory.stories[0].storyId!)
    }
  }
}

  const handleAddMoreStory = () => {
    fileInputRef.current?.click()
  }

  const handleNextStory = () => {
  if (isTransitioning) return

  const currentUserStories = userStoriesArray[currentUserIndex]

  if (viewStartTime && !currentUserStories.isOwn) {
    const viewEndTime = Date.now()
    const viewDurationSeconds = (viewEndTime - viewStartTime) / 1000
    const currentStory = currentUserStories.stories[currentStoryIndex]
    recordStoryView(currentStory.storyId!, viewDurationSeconds)
  }

  // Close viewers panel when navigating
  setShowViewers(false)

  if (currentStoryIndex < currentUserStories.stories.length - 1) {
    const nextIndex = currentStoryIndex + 1
    setCurrentStoryIndex(nextIndex)
    setViewStartTime(Date.now())

    // Track click for next story
    const nextStory = currentUserStories.stories[nextIndex]
    if (nextStory?.storyId) {
      trackStoryClick(nextStory.storyId)
    }

    if (!currentUserStories.isOwn) {
      recordStoryView(currentUserStories.stories[nextIndex].storyId!, 0)
    } else {
      // Fetch viewers for own story
      fetchStoryViewers(currentUserStories.stories[nextIndex].storyId!)
    }
  } else if (currentUserIndex < userStoriesArray.length - 1) {
    const nextUserIndex = currentUserIndex + 1
    const nextUser = userStoriesArray[nextUserIndex]

    if (nextUser.stories.length > 0) {
      setCurrentUserIndex(nextUserIndex)
      setCurrentStoryIndex(0)
      setViewStartTime(Date.now())
      setStoryViewers([])

      // Track click for first story of next user
      const firstStory = nextUser.stories[0]
      if (firstStory?.storyId) {
        trackStoryClick(firstStory.storyId)
      }

      if (!nextUser.isOwn) {
        recordStoryView(nextUser.stories[0].storyId!, 0)
      } else {
        fetchStoryViewers(nextUser.stories[0].storyId!)
      }
    } else {
      handleCloseStoryViewer()
    }
  } else {
    handleCloseStoryViewer()
  }
}

  const handlePreviousStory = () => {
  if (currentStoryIndex > 0) {
    setIsTransitioning(true)
    setShowViewers(false)
    const prevIndex = currentStoryIndex - 1
    setCurrentStoryIndex(prevIndex)
    setViewStartTime(Date.now())
    
    // Track click for previous story
    const currentUser = userStoriesArray[currentUserIndex]
    const prevStory = currentUser?.stories[prevIndex]
    if (prevStory?.storyId) {
      trackStoryClick(prevStory.storyId)
    }
    
    // Fetch viewers for own story
    if (currentUser?.isOwn) {
      fetchStoryViewers(currentUser.stories[prevIndex].storyId!)
    }
  } else if (currentUserIndex > 0) {
    const prevUserIndex = currentUserIndex - 1
    const prevUser = userStoriesArray[prevUserIndex]

    if (prevUser.stories.length > 0) {
      setIsTransitioning(true)
      setShowViewers(false)
      setCurrentUserIndex(prevUserIndex)
      const lastStoryIndex = prevUser.stories.length - 1
      setCurrentStoryIndex(lastStoryIndex)
      setViewStartTime(Date.now())
      setStoryViewers([])
      
      // Track click for last story of previous user
      const lastStory = prevUser.stories[lastStoryIndex]
      if (lastStory?.storyId) {
        trackStoryClick(lastStory.storyId)
      }
      
      if (prevUser.isOwn) {
        fetchStoryViewers(prevUser.stories[lastStoryIndex].storyId!)
      }
    }
  }
}

  const handleCloseStoryViewer = async () => {
    const currentUserStories = userStoriesArray[currentUserIndex]
    if (viewStartTime && currentUserStories && !currentUserStories.isOwn) {
      const viewEndTime = Date.now()
      const viewDurationSeconds = (viewEndTime - viewStartTime) / 1000
      const currentStory = currentUserStories.stories[currentStoryIndex]
      if (currentStory?.storyId) {
        await recordStoryView(currentStory.storyId, viewDurationSeconds)
      }
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    setStoryViewerOpen(false)
    setCurrentUserIndex(0)
    setCurrentStoryIndex(0)
    setProgress(0)
    setIsMediaLoaded(false)
    setIsTransitioning(false)
    setViewStartTime(null)
    setShowViewers(false)
    setStoryViewers([])

    await fetchStories()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newSelectedFiles: SelectedFile[] = []
    let hasInvalidFile = false
    let invalidFileMessage = ''

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        hasInvalidFile = true
        invalidFileMessage = 'Please select only image or video files'
        return
      }

      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        hasInvalidFile = true
        invalidFileMessage = 'File size must be less than 100MB'
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string
        const fileType = isImage ? 'image' : 'video' as 'image' | 'video'
        const fileSize = formatFileSize(file.size)
        const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name

        const selectedFile: SelectedFile = {
          file,
          id: Math.random().toString(36).substr(2, 9),
          previewUrl,
          type: fileType,
          size: fileSize,
          name: fileName
        }

        setSelectedFiles(prev => [...prev, selectedFile])
      }
      reader.readAsDataURL(file)
    })

    if (hasInvalidFile) {
      setUploadError(invalidFileMessage)
    } else {
      setUploadError(null)
      setPreviewOpen(true)
    }

    if (event.target) {
      event.target.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id))
  }

  const handleClosePreview = () => {
    setPreviewOpen(false)
    setSelectedFiles([])
    setCaption('')
    setLocation('')
    setMentions('')
    setUploadError(null)
  }

  const handleShareStory = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadError(null)

    try {
      const adminUser = localStorage.getItem('uuid')
      const userId = localStorage.getItem('childUserId')

      if (!adminUser || !userId) {
        throw new Error('User not logged in. Please login to create a story.')
      }

      const formData = new FormData()
      formData.append('adminUser', adminUser)
      formData.append('storyType', 'VIDEO') // Always VIDEO as per requirement
      formData.append('userId', userId)
      formData.append('pageId', localStorage.getItem('pageId') || '0')

      if (caption) formData.append('content', caption)
      if (location) formData.append('location', location)
      // if (mentions) {
      //   const mentionsList = mentions.split(',').map(m => m.trim()).filter(m => m)
      //   if (mentionsList.length > 0) formData.append('mentions', mentionsList.join(','))
      // }

      if (mentions) formData.append('mentions', '')

      // Append multiple files with the same key 'media'
      selectedFiles.forEach(selectedFile => {
        formData.append('media', selectedFile.file)
      })

      const storedAccessToken = tokenCookie.get();
      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/stories/create',
        {
          method: 'POST',
          headers: {
            ...(storedAccessToken && { authorization: `bearer ${storedAccessToken}` })
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CreateStoryResponse = await response.json()

      if (result.success) {
        if (onAddStory) onAddStory(selectedFiles.map(f => f.file), caption)
        handleClosePreview()
        await fetchStories()
      } else {
        throw new Error(result.message || 'Failed to create stories')
      }
    } catch (error) {
      console.error('Error creating stories:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setUploadError('Network error. Please check your internet connection.')
      } else if (error instanceof Error) {
        setUploadError(error.message)
      } else {
        setUploadError('Failed to create stories. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteStory = async () => {
    const currentUserStories = userStoriesArray[currentUserIndex]
    const currentStory = currentUserStories.stories[currentStoryIndex]

    if (!currentStory?.storyId) return

    setDeletingStory(true)

    try {
      const userId = localStorage.getItem('childUserId')
      if (!userId) throw new Error('User not logged in')

      const response = await fetch(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/${currentStory.storyId}?userId=${userId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const result = await response.json()

      if (result.success) {
        if (currentUserStories.stories.length === 1) {
          await handleCloseStoryViewer()
        } else {
          if (currentStoryIndex < currentUserStories.stories.length - 1) {
            handleNextStory()
          } else {
            handlePreviousStory()
          }
        }
        await fetchStories()
      } else {
        throw new Error(result.message || 'Failed to delete story')
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Failed to delete story. Please try again.')
    } finally {
      setDeletingStory(false)
    }
  }

  const handleProfileClick = (userId: number) => {
    window.location.href = `/public/${userId}/0`;
  };

  const handleImageLoad = () => setIsMediaLoaded(true)
  const handleVideoLoad = () => setIsMediaLoaded(true)

  const renderUserStory = (userStory: UserStories, index: number) => {
    const displayName = userStory.isOwn && userStory.stories.length === 0 ? 'Your Story' : userStory.name
    const storyCount = userStory.stories.length
    const firstStoryTime = userStory.stories[0]?.time

    return (
      <Box
        key={userStory.userId}
        onClick={() => handleUserStoryClick(index)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          minWidth: { xs: 70, sm: 80 },
          '&:hover': {
            '& .MuiAvatar-root': {
              transform: 'scale(1.05)',
              transition: 'transform 0.2s'
            }
          },
          position: 'relative'
        }}
      >
        <Box sx={{ position: 'relative', mb: 1 }}>
          {userStory.hasUnviewed && !userStory.isOwn && (
            <Box sx={{
              position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              zIndex: 0
            }} />
          )}

          {userStory.stories.length > 0 && userStory.isOwn && (
            <Box sx={{
              position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #4267b2 0%, #5b7ec2 50%, #6a8ed2 100%)',
              zIndex: 0
            }} />
          )}

          {!userStory.hasUnviewed && userStory.stories.length > 0 && !userStory.isOwn && (
            <Box sx={{
              position: 'absolute', top: -3, left: -3, right: -3, bottom: -3,
              borderRadius: '50%', border: '2px solid #dadde1', zIndex: 0
            }} />
          )}

          <Avatar
            src={userStory.avatarImage}
            sx={{
              bgcolor: userStory.avatarColor,
              width: { xs: 56, sm: 60 }, height: { xs: 56, sm: 60 },
              fontSize: { xs: 20, sm: 24 }, fontWeight: 600,
              position: 'relative', zIndex: 1, border: '3px solid white',
              transition: 'transform 0.2s'
            }}
          >
            {userStory.avatar}
            
          </Avatar>

          {userStory.isOwn && (
            <Box
              sx={{
                position: 'absolute', bottom: -2, right: -2,
                bgcolor: '#42b883', borderRadius: '50%',
                width: 24, height: 24, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', zIndex: 2, cursor: 'pointer',
                '&:hover': { bgcolor: '#38a169' }
              }}
              onClick={(e) => { e.stopPropagation(); handleAddMoreStory() }}
            >
              <AddIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
          )}

          {storyCount > 1 && (
            <Box sx={{
              position: 'absolute', top: -4, right: -4,
              bgcolor: '#4267b2', color: 'white', borderRadius: '50%',
              width: 20, height: 20, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700,
              border: '2px solid white', zIndex: 2
            }}>
              {storyCount}
            </Box>
          )}
        </Box>

        <Typography variant="caption" sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          fontWeight: userStory.isOwn ? 600 : 500,
          color: userStory.hasUnviewed && !userStory.isOwn ? 'text.primary' : 'text.secondary',
          textAlign: 'center', maxWidth: { xs: 70, sm: 80 },
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {displayName}
        </Typography>

        {storyCount > 0 && firstStoryTime && !userStory.isOwn && (
          <Typography variant="caption" sx={{
            fontSize: { xs: '0.6rem', sm: '0.65rem' },
            color: 'text.secondary', mt: -0.5
          }}>
            {firstStoryTime}
          </Typography>
        )}
      </Box>
    )
  }

  // If not authenticated, show a minimal placeholder or nothing
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 2, sm: '16px' }, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Sign in to view and share stories
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const currentUserStories = userStoriesArray[currentUserIndex]
  const currentStory = currentUserStories?.stories[currentStoryIndex]

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple
      />
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 1, sm: 1 }, position: 'relative', paddingBottom: '10px !important', paddingTop: '15px !important' }}>
          {loading || isAuthLoading ? (
            <Stack direction="row" spacing={2} justifyContent="center">
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                  <Skeleton variant="circular" width={60} height={60} />
                  <Skeleton variant="text" width={60} sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          ) : (
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
  {/* Left Arrow */}
  {canScrollLeft && (
    <IconButton
      onClick={() => scrollStories('left')}
      sx={{
        position: 'absolute',
        left: -4,
        top: '50%',
        transform: 'translateY(-60%)',
        zIndex: 10,
        bgcolor: theme.palette.mode === 'light' ? 'white' : 'grey.800',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        width: 32,
        height: 32,
        '&:hover': {
          bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.700',
        }
      }}
    >
      <ChevronLeftIcon sx={{ fontSize: 20 }} />
    </IconButton>
  )}

  {/* Stories Container */}
  <Box
    ref={storiesContainerRef}
    sx={{
      display: 'flex',
      gap: 2,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
      '&::-webkit-scrollbar': {
        display: 'none'
      },
      px: 1,
      py: 0.5,
      width: '100%',
      flex: 1,
      justifyContent: 'flex-start'
    }}
  >
    {userStoriesArray.map((userStory, index) => renderUserStory(userStory, index))}
  </Box>

  {/* Right Arrow */}
  {canScrollRight && (
    <IconButton
      onClick={() => scrollStories('right')}
      sx={{
        position: 'absolute',
        right: -4,
        top: '50%',
        transform: 'translateY(-60%)',
        zIndex: 10,
        bgcolor: theme.palette.mode === 'light' ? 'white' : 'grey.800',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        width: 32,
        height: 32,
        '&:hover': {
          bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.700',
        }
      }}
    >
      <ChevronRightIcon sx={{ fontSize: 20 }} />
    </IconButton>
  )}
</Box>
          )}
        </CardContent>
      </Card>

      {/* Story Preview Dialog - UPDATED FOR MULTIPLE FILES */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>Create Stories</Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} selected
            </Typography>
          </Box>
          <IconButton onClick={handleClosePreview} size="small"><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Selected Files Preview */}
          <Box sx={{ mb: 3 }}>
  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
    Selected Files ({selectedFiles.length})
  </Typography>
  
  {selectedFiles.length > 0 && (
    <List sx={{ 
      maxHeight: 300, 
      overflow: 'auto',
      bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
      borderRadius: 2,
      p: 1,
      border: `1px solid ${theme.palette.divider}`
    }}>
      {selectedFiles.map((selectedFile, index) => (
        <ListItem
          key={selectedFile.id}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'white',
            borderRadius: 1,
            mb: 1,
            border: '1px solid',
            borderColor: theme.palette.divider,
            '&:last-child': { mb: 0 },
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
              boxShadow: theme.shadows[1]
            }
          }}
          secondaryAction={
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={() => handleRemoveFile(selectedFile.id)}
              size="small"
              sx={{
                color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.600',
                '&:hover': {
                  color: theme.palette.error.main,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : 'rgba(244, 67, 54, 0.04)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {selectedFile.type === 'image' ? (
              <ImageIcon 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main 
                }} 
              />
            ) : (
              <MovieIcon 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.main 
                }} 
              />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: theme.palette.text.primary
                  }}
                >
                  {selectedFile.name}
                </Typography>
                <Chip 
                  label={selectedFile.type.toUpperCase()} 
                  size="small" 
                  color={selectedFile.type === 'image' ? 'primary' : 'secondary'}
                  sx={{ 
                    height: 20, 
                    fontSize: '0.65rem',
                    bgcolor: selectedFile.type === 'image' 
                      ? (theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light)
                      : (theme.palette.mode === 'dark' ? theme.palette.secondary.dark : theme.palette.secondary.light),
                    color: selectedFile.type === 'image' 
                      ? (theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.primary.contrastText)
                      : (theme.palette.mode === 'dark' ? theme.palette.secondary.contrastText : theme.palette.secondary.contrastText)
                  }}
                />
              </Box>
            }
            secondary={
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? 'grey.400' : 'text.secondary'
                }}
              >
                {selectedFile.size}
              </Typography>
            }
          />
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: 1, 
            overflow: 'hidden',
            ml: 2,
            flexShrink: 0,
            border: `1px solid ${theme.palette.divider}`
          }}>
            {selectedFile.type === 'image' ? (
              <img 
                src={selectedFile.previewUrl} 
                alt={`Preview ${index + 1}`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <Box sx={{ 
                width: '100%', 
                height: '100%', 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MovieIcon 
                  sx={{ 
                    color: theme.palette.mode === 'dark' ? 'grey.500' : 'grey.600',
                    fontSize: 24 
                  }} 
                />
              </Box>
            )}
          </Box>
        </ListItem>
      ))}
    </List>
  )}
</Box>

          {/* Story Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Story Details
            </Typography>
            
            <TextField 
              fullWidth 
              multiline 
              rows={3} 
              placeholder="Add a caption for all stories..." 
              value={caption} 
              onChange={(e) => setCaption(e.target.value)} 
              sx={{ mb: 2 }} 
            />
            
            <TextField 
              fullWidth 
              placeholder="Add location..." 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{ 
                startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} /> 
              }} 
              sx={{ mb: 2 }} 
            />
            
            {/* <TextField 
              fullWidth 
              placeholder="Tag people (separate with commas)..." 
              value={mentions} 
              onChange={(e) => setMentions(e.target.value)} 
              helperText="Example: @john, @sarah" 
            /> */}
          </Box>

          {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClosePreview} disabled={uploading}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleShareStory} 
            disabled={uploading || selectedFiles.length === 0}
            startIcon={uploading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {uploading ? 'Sharing...' : `Share ${selectedFiles.length} ${selectedFiles.length === 1 ? 'Story' : 'Stories'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Story Viewer Dialog */}
<Dialog open={storyViewerOpen} onClose={handleCloseStoryViewer} maxWidth="md" fullScreen
  PaperProps={{ 
    sx: { 
      bgcolor: '#000',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    } 
  }}>
  <Box sx={{ 
    position: 'relative', 
    width: '100%', 
    height: '100%', 
    display: 'flex', 
    flexDirection: 'column',
    overflow: 'hidden'
  }}>
    {/* Progress bars */}
    <Box sx={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      p: 1, 
      display: 'flex', 
      gap: 0.5, 
      zIndex: 3,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
      pb: 2
    }}>
      {currentUserStories?.stories.map((_, index) => (
        <Box key={index} sx={{ 
          flex: 1, 
          height: 2, 
          bgcolor: 'rgba(255,255,255,0.3)', 
          borderRadius: 1, 
          overflow: 'hidden' 
        }}>
          <Box sx={{
            height: '100%', 
            bgcolor: 'white',
            width: index < currentStoryIndex ? '100%' : (index === currentStoryIndex ? `${progress}%` : '0%'),
            transition: index === currentStoryIndex ? 'none' : 'width 0.3s'
          }} />
        </Box>
      ))}
    </Box>

    {/* Header */}
    <Box sx={{
      position: 'absolute', 
      top: 12, 
      left: 0, 
      right: 0, 
      p: 2, 
      pt: 3,
      background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
      zIndex: 2, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between'
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          cursor: 'pointer'
        }}
        onClick={() => handleProfileClick(currentUserStories?.userId)}
      >
        <Avatar 
          src={currentUserStories?.avatarImage} 
          sx={{ 
            bgcolor: currentUserStories?.avatarColor, 
            width: 40, 
            height: 40, 
            border: '2px solid white',
            cursor: 'pointer'
          }}
        >
          {currentUserStories?.avatar}
        </Avatar>
        <Box>
          <Typography sx={{ color: 'white', fontWeight: 600 }}>{currentUserStories?.name}</Typography>
          {currentStory?.time && <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>{currentStory.time}</Typography>}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {currentStory?.storyVideo && (
          <IconButton 
            onClick={() => setIsMuted(!isMuted)}
            sx={{ color: 'white' }}
          >
            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
        )}

        {/* CHANGE 1: Show hide story button for others' stories */}
        {!currentUserStories?.isOwn && (
          <IconButton 
            onClick={handleMenuOpen}
            sx={{ 
              color: 'white', 
              bgcolor: 'rgba(255,255,255,0.1)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
        
        {currentUserStories?.isOwn && (
          <IconButton onClick={handleDeleteStory} disabled={deletingStory}
            sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.8)' } }}>
            {deletingStory ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <DeleteIcon />}
          </IconButton>
        )}
        <IconButton onClick={handleCloseStoryViewer} sx={{ color: 'white' }}><CloseIcon /></IconButton>
      </Box>
    </Box>

    {/* Navigation areas - Fixed tap highlight */}
    <Box 
      onClick={handlePreviousStory}
      sx={{
        position: 'absolute', 
        left: 0, 
        top: 0, 
        bottom: 0, 
        width: '30%', 
        zIndex: 1, 
        cursor: 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start', 
        pl: 2,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        '&:hover': { '& .nav-icon': { opacity: 1 } },
        '&:active': { bgcolor: 'transparent' }
      }}
    >
      {(currentStoryIndex > 0 || currentUserIndex > 0) && (
        <NavigateBeforeIcon 
          className="nav-icon" 
          sx={{ 
            color: 'white', 
            fontSize: 48, 
            opacity: 0, 
            transition: 'opacity 0.2s', 
            bgcolor: 'rgba(0,0,0,0.5)', 
            borderRadius: '50%',
            p: 0.5
          }} 
        />
      )}
    </Box>

    <Box 
      onClick={handleNextStory}
      sx={{
        position: 'absolute', 
        right: 0, 
        top: 0, 
        bottom: 0, 
        width: '30%', 
        zIndex: 1, 
        cursor: 'pointer',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-end', 
        pr: 2,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        '&:hover': { '& .nav-icon': { opacity: 1 } },
        '&:active': { bgcolor: 'transparent' }
      }}
    >
      <NavigateNextIcon 
        className="nav-icon" 
        sx={{ 
          color: 'white', 
            fontSize: 48, 
            opacity: 0, 
            transition: 'opacity 0.2s', 
            bgcolor: 'rgba(0,0,0,0.5)', 
            borderRadius: '50%',
            p: 0.5
          }} 
        />
      </Box>

      {/* Story content */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          pb: currentUserStories?.isOwn ? 0 : showHideMenu ? '200px' : '140px' // CHANGE 1: Adjust padding for hide menu
        }}
        onMouseDown={() => setIsPaused(true)} 
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)} 
        onTouchEnd={() => setIsPaused(false)}
      >
        {!isMediaLoaded && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1
          }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}

        {/* TEXT Stories */}
        {currentStory?.storyType === 'TEXT' && currentStory?.storyText && (
          <Box sx={{ 
            bgcolor: 'rgba(0,0,0,0.7)', 
            p: 4, 
            borderRadius: 2, 
            maxWidth: '90%',
            maxHeight: '90%',
            overflow: 'auto',
            wordBreak: 'break-word'
          }}>
            <Typography sx={{ 
              color: 'white', 
              fontSize: { xs: '1.2rem', md: '1.5rem' }, 
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              {currentStory.storyText}
            </Typography>
          </Box>
        )}

        {/* IMAGE Stories */}
        {currentStory?.storyImage && (
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <img
              key={`story-img-${currentUserIndex}-${currentStoryIndex}-${currentStory.storyId}`}
              src={currentStory.storyImage}
              alt="Story"
              onLoad={handleImageLoad}
              onError={() => setIsMediaLoaded(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: isMediaLoaded ? 'block' : 'none'
              }}
            />
          </Box>
        )}

        {/* VIDEO Stories */}
        {currentStory?.storyVideo && (
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <video
              key={`story-vid-${currentUserIndex}-${currentStoryIndex}-${currentStory.storyId}`}
              ref={videoRef}
              src={currentStory.storyVideo}
              autoPlay
              muted={isMuted}
              playsInline
              onLoadedData={handleVideoLoad}
              onError={() => setIsMediaLoaded(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                display: isMediaLoaded ? 'block' : 'none'
              }}
            />
          </Box>
        )}

        {/* Caption for non-text stories - positioned above bottom controls */}
        {currentStory?.storyCaption && currentStory?.storyType !== 'TEXT' && (
          <Box sx={{
            position: 'absolute',
            bottom: currentUserStories?.isOwn ? 60 : showHideMenu ? 210 : 150,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            zIndex: 2,
          }}>
            <Typography sx={{
              color: 'white',
              fontSize: { xs: '0.9rem', md: '1rem' },
              textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)',
              maxWidth: '90%',
              wordBreak: 'break-word',
              lineHeight: 1.4,
              bgcolor: 'rgba(0,0,0,0.4)',
              px: 2,
              py: 1,
              borderRadius: 2
            }}>
              {currentStory.storyCaption}
            </Typography>
          </Box>
        )}

        {/* Reaction animation */}
        {reactionSent && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              animation: 'popIn 0.3s ease-out',
              '@keyframes popIn': {
                '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
                '50%': { transform: 'translate(-50%, -50%) scale(1.3)', opacity: 1 },
                '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 }
              }
            }}
          >
            <Typography sx={{ fontSize: '4rem' }}>{reactionSent}</Typography>
          </Box>
        )}
      </Box>

      {/* CHANGE 1: Hide Story Menu - Positioned at bottom */}
      {!currentUserStories?.isOwn && showHideMenu && (
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(20px)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 4,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 1 
          }}>
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
              Story Options
            </Typography>
            <IconButton 
              onClick={handleMenuClose}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                width: 32,
                height: 32,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Button
            fullWidth
            onClick={() => handleHideStory('HIDE')}
            disabled={hidingStory}
            startIcon={hidingStory ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <VisibilityOffIcon />}
            sx={{
              justifyContent: 'flex-start',
              color: theme.palette.error.main,
              bgcolor: 'rgba(244, 67, 54, 0.1)',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(244, 67, 54, 0.2)'
              }
            }}
          >
            {hidingStory ? 'Hiding...' : `Hide ${selectedUserForHide?.name}'s Story`}
          </Button>

          <Button
            fullWidth
            onClick={handleMenuClose}
            startIcon={<CloseIcon />}
            sx={{
              justifyContent: 'flex-start',
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Bottom section - Reactions and Message (only for others' stories) */}
      {!currentUserStories?.isOwn && !showHideMenu && (
        <Box sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 70%, transparent 100%)',
          zIndex: 3,
          p: 2,
          pt: 4
        }}>
          {/* Quick Reactions */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: { xs: 1.5, sm: 2 },
            mb: 2
          }}>
            {quickReactions.map((emoji) => (
              <IconButton
                key={emoji}
                onClick={() => handleReaction(emoji)}
                disabled={sendingReaction}
                sx={{
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  fontSize: { xs: '1.3rem', sm: '1.5rem' },
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.15)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                {emoji}
              </IconButton>
            ))}
          </Box>

          {/* Message Input */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            px: 1,
            position: 'relative'
          }}>
            <TextField
              ref={messageInputRef}
              fullWidth
              placeholder="Send a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => {
                if (!messageText.trim() && !showEmojiPicker) setIsPaused(false)
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: '24px',
                  color: 'white',
                  '& fieldset': { border: 'none' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                  '&.Mui-focused': { bgcolor: 'rgba(255,255,255,0.2)' }
                },
                '& .MuiOutlinedInput-input': {
                  py: 1.2,
                  px: 1,
                  '&::placeholder': { color: 'rgba(255,255,255,0.6)', opacity: 1 }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker)
                        setIsPaused(true)
                      }}
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        '&:hover': { color: 'white', bgcolor: 'transparent' }
                      }}
                    >
                      <EmojiIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={sendingMessage || !messageText.trim()}
                      sx={{ 
                        color: messageText.trim() ? theme.palette.primary.main : 'rgba(255,255,255,0.3)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' }
                      }}
                    >
                      {sendingMessage ? (
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Play/Pause button */}
            <IconButton 
              onClick={() => setIsPaused(!isPaused)}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.1)',
                width: 40,
                height: 40,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>

            {/* Emoji Picker for Message */}
            {showEmojiPicker && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  mb: 1,
                  zIndex: 10,
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    onClick={handleCloseEmojiPicker}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      zIndex: 11,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.DARK}
                    width={320}
                    height={350}
                    searchDisabled={false}
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Own story controls - View count and Play/Pause */}
      {currentUserStories?.isOwn && (
        <>
          {/* View count button - bottom left */}
          <Box
            onClick={handleOpenViewers}
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              px: 2,
              py: 1,
              cursor: 'pointer',
              zIndex: 3,
              transition: 'all 0.3s ease',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' },
                '70%': { boxShadow: '0 0 0 10px rgba(255,255,255,0)' },
                '100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0)' }
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.25)',
                transform: 'scale(1.05)'
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            <VisibilityIcon sx={{ color: 'white', fontSize: 20 }} />
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
              {storyViewers.length > 0 ? storyViewers.length : '0'}
            </Typography>
            <KeyboardArrowUpIcon 
              sx={{ 
                color: 'white', 
                fontSize: 18,
                animation: 'bounce 1s infinite',
                '@keyframes bounce': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-3px)' }
                }
              }} 
            />
          </Box>

          {/* Play/Pause button - center */}
          <Box sx={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <IconButton 
              onClick={() => setIsPaused(!isPaused)}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
            </IconButton>
          </Box>

          {/* Viewers Panel - Slide up from bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(20px)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              zIndex: 10,
              transform: showViewers ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Panel Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <VisibilityIcon sx={{ color: 'white', fontSize: 22 }} />
                <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
                  {storyViewers.length} {storyViewers.length === 1 ? 'Viewer' : 'Viewers'}
                </Typography>
              </Box>
              <IconButton 
                onClick={handleCloseViewers}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  width: 32,
                  height: 32,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Viewers List */}
            <Box sx={{ 
              flex: 1, 
              overflowY: 'auto',
              p: 1,
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(255,255,255,0.3)',
                borderRadius: '4px'
              }
            }}>
              {loadingViewers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: 'white' }} size={32} />
                </Box>
              ) : viewersError ? (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', py: 4 }}>
                  {viewersError}
                </Typography>
              ) : storyViewers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <VisibilityIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 48, mb: 1 }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    No views yet
                  </Typography>
                </Box>
              ) : (
                storyViewers.map((viewer, index) => (
                  <Box
                    key={viewer.viewId}
                    onClick={() => handleProfileClick(viewer.userId)}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      animation: `fadeSlideIn 0.3s ease forwards`,
                      animationDelay: `${index * 0.05}s`,
                      opacity: 0,
                      '@keyframes fadeSlideIn': {
                        from: { opacity: 0, transform: 'translateX(-10px)' },
                        to: { opacity: 1, transform: 'translateX(0)' }
                      },
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                  >
                    <Avatar
                      src={viewer.profilePicture}
                      sx={{
                        width: 44,
                        height: 44,
                        border: '2px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {viewer.fullName?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ 
                          color: 'white', 
                          fontWeight: 600, 
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {viewer.fullName}
                        </Typography>
                        {viewer.isVerified === 'Y' && (
                          <Box
                            component="span"
                            sx={{
                              bgcolor: '#1d9bf0',
                              borderRadius: '50%',
                              width: 14,
                              height: 14,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Typography sx={{ color: 'white', fontSize: '8px', fontWeight: 700 }}>✓</Typography>
                          </Box>
                        )}
                      </Box>
                      <Typography sx={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: '0.75rem'
                      }}>
                        {viewer.username}
                      </Typography>
                      
                      {/* Reactions/Messages */}
                      {viewer.reactions && viewer.reactions.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {viewer.reactions.map((reaction, rIndex) => (
                            reaction.reaction && (
                              <Box
                                key={reaction.reactionId}
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  bgcolor: 'rgba(255,255,255,0.1)',
                                  borderRadius: '12px',
                                  px: 1.5,
                                  py: 0.5,
                                  maxWidth: 'fit-content'
                                }}
                              >
                                <Typography sx={{ 
                                  color: 'white', 
                                  fontSize: '0.85rem',
                                  wordBreak: 'break-word'
                                }}>
                                  {reaction.reaction}
                                </Typography>
                              </Box>
                            )
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  </Dialog>

      {/* Reaction Snackbar */}
      <Snackbar
        open={reactionSnackbar.open}
        autoHideDuration={2000}
        onClose={() => setReactionSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert 
          onClose={() => setReactionSnackbar({ open: false, message: '' })} 
          severity="success"
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.8)', 
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {reactionSnackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default StoryComponent