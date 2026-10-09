// app/components/TopNavigation.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useAuth } from '@/contexts/AuthContext'
import { tokenCookie, logoutUser } from '@/hooks/useAuthRedirect'
import {
  AppBar, Toolbar, Box, IconButton, Badge, Avatar, Menu, MenuItem,
  Typography, Button, Divider, InputBase, alpha, ListItemIcon, Paper,
  ClickAwayListener, CircularProgress, List, ListItem, ListItemButton,
  ListItemAvatar, ListItemText, Popover, Chip, Drawer, Dialog, DialogContent,
  Tooltip
} from '@mui/material'
import {
  Home as HomeIcon, AccountBalance as FinanceIcon, Campaign as AdvertiseIcon,
  MonetizationOn as MonetizeIcon, Store as MarketplaceIcon, Message as MessageIcon,
  Notifications as NotificationIcon, Person as PersonIcon, Search as SearchIcon,
  Settings as SettingsIcon, Logout as LogoutIcon, HelpOutline as HelpIcon,
  Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon, Close as CloseIcon,
  PersonAdd as PersonAddIcon, CheckCircle as CheckCircleIcon,
  Favorite as LikeIcon, ChatBubble as CommentIcon, Reply as ReplyIcon,
  Share as ShareIcon, AlternateEmail as MentionIcon, PlayCircle as PlayCircleIcon,
  Image as PostIcon, Login as LoginIcon, FiberManualRecord as DotIcon,
  Menu as MenuIcon, Widgets as WidgetsIcon, Check as CheckIcon,
  PersonOff as PersonOffIcon, LocalOffer as TagIcon, Mic as MicIcon, Code as CodeIcon
} from '@mui/icons-material'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useBroker } from '../../contexts/BrokerContext'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useSearch } from '../../contexts/SearchContext'
import { useUserProfile } from '../../contexts/UserProfileContext'
import logo from '../../app/Assets/img/bitoHubTextLogo.png'
import SnackbarAlert from '../common/SnackbarAlert'
import Sidebar from './Sidebar'
import SidebarComponent from '@/components/SidebarComponent'
  // In TopNavigation.tsx
import { useMessaging } from '@/contexts/MessagingContext'

// Speech Recognition Types
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
        confidence: number
      }
      isFinal: boolean
      length: number
    }
    length: number
  }
}

interface SpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface TopNavItem { 
  icon: React.ReactNode
  text: string
  href: string
  requiresAuth?: boolean
  moduleKey?: string // Add moduleKey for API-controlled visibility
}
interface SearchUser {
  userId: number; pageId: number; entityType: string; username: string
  fullName: string; email: string; createdAt: string; isActive: string; isUserFollowing: number; profilePicture: string | null
}
interface SearchResponse {
  success: boolean; message: string
  data: { users: SearchUser[]; usersTotal: number; totalResults: number; page: number; size: number }
  errorCode: string | null
}
interface AppNotification {
  notificationId: number; recipientUserId: number; actorUserId: number; actorPageId: number
  notificationType: string; contentType: string; contentId: number; message: string
  isRead: string; isActive: string; createdAt: string; offset: number; limit: number
  actorUsername: string; actorFullName: string; actorProfilePicture: string | null
  contentPreview: string | null; contentMediaUrl: string | null, actorType: string, recipientType: string
}
interface NotificationResponse {
  success: boolean; message: string
  data: {
    content: AppNotification[]; pageNumber: number; pageSize: number
    totalElements: number; totalPages: number; hasNext: boolean; hasPrevious: boolean
  }
  errorCode: string | null
}

interface ProcessFollowRequestResponse {
  success: boolean
  message: string
  data: null
  errorCode: string | null
}

// Module API interfaces
interface Module {
  moduleId: number
  moduleKey: string
  moduleName: string
}

interface ModulesResponse {
  success: boolean
  message: string
  data: Module[] | null
  errorCode: string | null
  totalRecords: number | null
}

const LOGIN_URL = 'https://www.bitocircle.com/login'

const TopNavigation: React.FC = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { brokerDetails } = useBroker()
  const { mode, toggleTheme } = useThemeMode()
  const { triggerSearch } = useSearch()



// Inside the component:
const { unreadMessageCount, isConnected } = useMessaging()


  const { isAuthenticated, requireAuth, showLoginPrompt } = useAuth()
  const { userProfile } = useUserProfile()

  const getAdvertiseHref = () => {
    if (typeof window === 'undefined') return '/advertise'
    const appData = localStorage.getItem('appDataRaw') || ''
    return `http://ad-center.bitocircle.com/?app=${appData}`
  }
  const getMonetizeHref = () => `https://www.bitocircle.com/monetize/`
  const getMarketplaceHref = () => `https://www.bitocircle.com/marketplaces/`

  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set())
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)

  // Follow request processing state
  const [processingFollowRequest, setProcessingFollowRequest] = useState<number | null>(null)

  // Voice Search States
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Module visibility state
  const [enabledModules, setEnabledModules] = useState<Set<string>>(new Set())
  const [isLoadingModules, setIsLoadingModules] = useState(true)

  // All navigation items with moduleKey for API-controlled items
  const allTopNavItems: TopNavItem[] = [
    { icon: <HomeIcon />, text: 'Home', href: '/feeds', requiresAuth: false },
    { icon: <FinanceIcon />, text: 'Finance Hub', href: '/finance-hub', requiresAuth: true, moduleKey: 'FINANCE_HUB' },
    { icon: <AdvertiseIcon />, text: 'Advertise', href: getAdvertiseHref(), requiresAuth: true, moduleKey: 'ADVERTISE' },
    { icon: <MonetizeIcon />, text: 'Monetize', href: getMonetizeHref(), requiresAuth: true, moduleKey: 'MONETIZE' },
    { icon: <MarketplaceIcon />, text: 'Marketplaces', href: getMarketplaceHref(), requiresAuth: false, moduleKey: 'MARKETPLACE' }
  ]

  // Filter nav items based on enabled modules
  // const topNavItems = allTopNavItems.filter(item => {
  //   // Always show items without moduleKey (like Home)
  //   if (!item.moduleKey) return true
  //   // Show module-controlled items only if they're in the enabled set
  //   return enabledModules.has(item.moduleKey)
  // })

  const topNavItems = allTopNavItems;
  const isActive = (href: string) => pathname === href

  // Fetch enabled modules from API
  useEffect(() => {
    const fetchModules = async () => {
      setIsLoadingModules(true)
      try {
        const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''
        
        // If no user is logged in, show all modules by default (or hide all, depending on your requirement)
        if (!userId) {
          // Show all modules for non-authenticated users
          setEnabledModules(new Set(['FINANCE_HUB', 'ADVERTISE', 'MONETIZE', 'MARKETPLACE']))
          setIsLoadingModules(false)
          return
        }

        const response = await fetch(
          `https://institutional-bo.paybito.com:8443/BitohubService/settings/modules?userId=${userId}`
        )
        const data: ModulesResponse = await response.json()

        if (data.success && data.data) {
          const moduleKeys = data.data.map(module => module.moduleKey)
          setEnabledModules(new Set(moduleKeys))
        } else {
          // If API fails, show all modules by default
          setEnabledModules(new Set(['FINANCE_HUB', 'ADVERTISE', 'MONETIZE', 'MARKETPLACE']))
        }
      } catch (error) {
        console.error('Error fetching modules:', error)
        // On error, show all modules by default
        setEnabledModules(new Set(['FINANCE_HUB', 'ADVERTISE', 'MONETIZE', 'MARKETPLACE']))
      } finally {
        setIsLoadingModules(false)
      }
    }

    fetchModules()
  }, [isAuthenticated]) // Re-fetch when auth state changes

  // Helper function to get media preview URL and check if it's a video
  const getMediaPreview = (contentMediaUrl: string | null): { url: string | null; isVideo: boolean } => {
    if (!contentMediaUrl) return { url: null, isVideo: false }

    // Handle comma-separated URLs - take the first one
    const firstUrl = contentMediaUrl.split(',')[0].trim()

    // Check if it's a video
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v', '.ogg', '.3gp', '.flv']
    const isVideo = videoExtensions.some(ext => firstUrl.toLowerCase().includes(ext))

    return { url: firstUrl, isVideo }
  }

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        setSpeechSupported(true)
        const recognition = new SpeechRecognitionAPI()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => {
          setIsListening(true)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript
          setSearchQuery(transcript)
          setIsListening(false)

          // Auto-trigger search after voice input
          if (transcript.trim()) {
            setTimeout(() => {
              triggerSearch(transcript.trim())
              router.push('/search')
              setShowSearchResults(false)
              setMobileSearchOpen(false)
            }, 300)
          }
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)

          if (event.error === 'not-allowed') {
            setSnackbarMsg('Microphone access denied. Please enable it in your browser settings.')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
          } else if (event.error === 'no-speech') {
            setSnackbarMsg('No speech detected. Please try again.')
            setSnackbarSeverity('info')
            setSnackbarOpen(true)
          } else if (event.error === 'network') {
            setSnackbarMsg('Network error. Please check your connection.')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
          }
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [triggerSearch, router])

  // Voice Search Handler
  const handleVoiceSearch = (e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (!speechSupported || !recognitionRef.current) {
      setSnackbarMsg('Voice search is not supported in your browser. Try Chrome or Edge.')
      setSnackbarSeverity('warning')
      setSnackbarOpen(true)
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        // Clear previous search
        setSearchQuery('')
        setSearchResults([])
        recognitionRef.current.start()
      } catch (error) {
        console.error('Speech recognition start error:', error)
        setIsListening(false)

        // Handle already started error
        if ((error as Error).message?.includes('already started')) {
          recognitionRef.current.stop()
          setTimeout(() => {
            recognitionRef.current?.start()
          }, 100)
        }
      }
    }
  }

  useEffect(() => {
    if (pathname !== '/search') setShowSearchResults(false)
  }, [pathname])

  useEffect(() => {
    setMobileDrawerOpen(false)
  }, [pathname])

  const fetchNotifications = async () => {
    if (!isAuthenticated) return
    setIsLoadingNotifications(true)
    try {
      const userId = localStorage.getItem('childUserId') || ''
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/notification/getUserNotifications',
        { method: 'POST', body: JSON.stringify({ recipientUserId: parseInt(userId), offset: 0, limit: 10, notificationType: "null", recipientPageId: localStorage.getItem('pageId') || '0' }) }
      )
      const data: NotificationResponse = await response.json()
      if (data.success && data.data.content) {
        const newNotifications = data.data.content
        const newUnreadCount = newNotifications.filter(n => n.isRead === "N").length
        setNotifications(newNotifications)
        setUnreadCount(newUnreadCount)
      }
    } catch (error) { console.error('Notification fetch error:', error) }
    finally { setIsLoadingNotifications(false) }
  }

 

    useEffect(() => {
  if (isAuthenticated) {
    fetchNotifications()
    
    // // Add this - Refresh message count periodically
    // refreshMessageCount()
    // const messageInterval = setInterval(() => {
    //   refreshMessageCount()
    // }, 30000) // Every 30 seconds
    
    const notificationInterval = setInterval(fetchNotifications, 30000)
    
    return () => {
      clearInterval(notificationInterval)
      // clearInterval(messageInterval)
    }
  }
}, [isAuthenticated, 
  // refreshMessageCount
])

  const performSearch = async (term: string) => {
    if (!term.trim()) { setSearchResults([]); setShowSearchResults(false); return }
    setIsSearching(true)
    try {
      const userId = isAuthenticated ? localStorage.getItem('childUserId') || '' : '0'
      const response = await fetchWithAuth(`https://institutional-bo.paybito.com:8443/BitohubService/feeds/search?searchTerm=${encodeURIComponent(term)}&type=USERS&page=0&size=10&userId=${userId}&userType=${localStorage.getItem('userType') || 'USER'} `)
      const data: SearchResponse = await response.json()
      if (data.success && data.data.users) { setSearchResults(data.data.users); setShowSearchResults(true) }
    } catch (error) { console.error('Search error:', error); setSearchResults([]) }
    finally { setIsSearching(false) }
  }

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => performSearch(searchQuery), 300)
    } else { setSearchResults([]); setShowSearchResults(false) }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current) }
  }, [searchQuery])

  const handleProfileMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!isAuthenticated) { showLoginPrompt('access your profile'); return }
    setProfileMenuAnchor(e.currentTarget)
  }
  const handleProfileMenuClose = () => setProfileMenuAnchor(null)

  const handleNotificationOpen = (e: React.MouseEvent<HTMLElement>) => {
    if (!isAuthenticated) { showLoginPrompt('view notifications'); return }
    setNotificationAnchor(e.currentTarget)
    if (!notificationAnchor) fetchNotifications()
  }
  const handleNotificationClose = () => setNotificationAnchor(null)

  const handleMessagesClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) { e.preventDefault(); showLoginPrompt('view messages'); return }
  }

  const handleMarkAsRead = async (notificationId: number) => {
    if (!isAuthenticated) return
    try {
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/notification/markAsRead', { method: 'PUT', body: JSON.stringify({ notificationId: String(notificationId) }) })
      const data = await response.json()
      if (data.success) {
        setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: "Y" } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) { console.error('Mark as read error:', error) }
  }

  const handleMarkAllAsRead = async () => {
    if (!isAuthenticated) return
    try {
      const userId = localStorage.getItem('childUserId') || ''
      const response = await fetchWithAuth(`https://institutional-bo.paybito.com:8443/BitohubService/notification/markAllAsRead?recipientUserId=${userId}`, { method: 'PUT' })
      const data = await response.json()
      if (data.success) { setNotifications(prev => prev.map(n => ({ ...n, isRead: "Y" }))); setUnreadCount(0) }
    } catch (error) { console.error('Mark all as read error:', error) }
  }

  // Process Follow Request (Accept/Decline)
  const handleProcessFollowRequest = async (
    notification: AppNotification,
    action: 'ACCEPT' | 'DECLINE'
  ) => {
    if (!isAuthenticated) return

    const currentUserId = localStorage.getItem('childUserId') || ''

    const followerId =
  notification.actorType === 'PAGE'
    ? notification.actorPageId
    : notification.actorUserId

    // Use negative ID for decline to differentiate in loading state
    setProcessingFollowRequest(action === 'ACCEPT' ? notification.notificationId : -notification.notificationId)

    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/processFollowRequest',
        {
          method: 'POST',
          body: JSON.stringify({
            followerId: followerId,
            followingId: parseInt(currentUserId),
            followerType: notification.actorType,
            followingType: localStorage.getItem('userType') || 'USER',
            followAction: action
          })
        }
      )

      const data: ProcessFollowRequestResponse = await response.json()

      if (data.success) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.notificationId !== notification.notificationId))

        // Update unread count if the notification was unread
        if (notification.isRead === 'N') {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }

        // Show success message
        setSnackbarMsg(data.message || `Follow request ${action.toLowerCase()}ed`)
        setSnackbarSeverity('success')
        setSnackbarOpen(true)
      } else {
        setSnackbarMsg(data.message || `Failed to ${action.toLowerCase()} follow request`)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Process follow request error:', error)
      setSnackbarMsg(`Failed to ${action.toLowerCase()} follow request`)
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setProcessingFollowRequest(null)
    }
  }

  const handleActorClick = (e: React.MouseEvent, notification: AppNotification) => {
    e.stopPropagation()
    if (notification.isRead === "N") handleMarkAsRead(notification.notificationId)
    router.push(`/public/${notification.actorUserId}/${notification.actorPageId || 0}`)
    handleNotificationClose()
  }

  const handleContentClick = (e: React.MouseEvent, notification: AppNotification) => {
    e.stopPropagation()
    if (notification.isRead === "N") handleMarkAsRead(notification.notificationId)
    if ((notification.contentType === 'POST' || notification.contentType === 'REEL') && notification.contentId) {
      const pageId = localStorage.getItem('pageId') || '0'
      const typeParam = notification.contentType === 'REEL' ? '?type=REEL' : ''
      router.push(`/post/${notification.contentId}/${notification.recipientUserId}/${pageId}${typeParam}`)
      handleNotificationClose()
    }
  }

  const handleNotificationClick = (notification: AppNotification) => {
    // Don't mark as read for FOLLOW_REQUEST - user needs to take action
    if (notification.notificationType === 'FOLLOW_REQUEST') return
    if (notification.isRead === "N") handleMarkAsRead(notification.notificationId)
  }

  const handleLogout = async () => {
    handleProfileMenuClose();
    const success = await logoutUser();
    if (success) {
      router.push('/login');
    }
  }

  const handleLogin = () => {
    if (typeof window !== 'undefined') { localStorage.setItem('redirectAfterLogin', window.location.href) }
    window.location.href = LOGIN_URL
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) { setShowSearchResults(false); setMobileSearchOpen(false); triggerSearch(query); router.push('/search') }
  }

  const handleUserClick = (user: SearchUser) => {
    const query = searchQuery.trim()
    if (query) { setShowSearchResults(false); setMobileSearchOpen(false); triggerSearch(query); router.push('/search') }
  }

  const getResultKey = (user: SearchUser) => `${user.entityType}-${user.userId}-${user.pageId}`

  const handleFollowToggle = async (e: React.MouseEvent, user: SearchUser) => {
    e.stopPropagation()
    if (!isAuthenticated) { showLoginPrompt('follow users'); return }
    const resultKey = getResultKey(user)
    if (followLoading.has(resultKey)) return
    setFollowLoading(prev => new Set(prev).add(resultKey))
    try {
      const followerId = localStorage.getItem('childPageId') || ''
      const followerType = localStorage.getItem('userType') || 'USER'
      const followingId = user.userId === 0 ? String(user.pageId) : String(user.userId)
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/profile/followUnfollowUser', { method: 'POST', body: JSON.stringify({ followerId, followingId, followerType, followingType: user.entityType }) })
      const data = await response.json()
      if (data.success) {
        setSearchResults(prev => prev.map(u => getResultKey(u) === resultKey ? { ...u, isUserFollowing: u.isUserFollowing === 1 ? 0 : 1 } : u))
        setSnackbarMsg(data.message || 'Action successful'); setSnackbarSeverity('success'); setSnackbarOpen(true)
      }
    } catch (error) { console.error('Follow/Unfollow error:', error) }
    finally { setFollowLoading(prev => { const s = new Set(prev); s.delete(resultKey); return s }) }
  }

  const handleClearSearch = () => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false) }
  const handleThemeToggle = () => { toggleTheme(); handleProfileMenuClose() }
  const handleHelpSupport = () => { handleProfileMenuClose(); window.open('https://www.bitocircle.com/creators/help/', '_blank') }

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ')
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : fullName.substring(0, 2).toUpperCase()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString + 'Z')
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getNotificationStyle = (notificationType: string) => {
    const styles: Record<string, { icon: React.ReactNode; color: string }> = {
      LIKE: { icon: <LikeIcon sx={{ fontSize: 11 }} />, color: '#ed4956' },
      COMMENT: { icon: <CommentIcon sx={{ fontSize: 11 }} />, color: '#5b5fc7' },
      FOLLOW: { icon: <PersonAddIcon sx={{ fontSize: 11 }} />, color: '#1877f2' },
      FOLLOW_REQUEST: { icon: <PersonAddIcon sx={{ fontSize: 11 }} />, color: '#f5a623' },
      MENTION: { icon: <MentionIcon sx={{ fontSize: 11 }} />, color: '#f5a623' },
      SHARE: { icon: <ShareIcon sx={{ fontSize: 11 }} />, color: '#17a2b8' },
      REPLY: { icon: <ReplyIcon sx={{ fontSize: 11 }} />, color: '#28a745' },
      TAG: { icon: <TagIcon sx={{ fontSize: 11 }} />, color: '#9c27b0' },
    }
    return styles[notificationType] || { icon: <NotificationIcon sx={{ fontSize: 11 }} />, color: '#6c757d' }
  }

  const isContentClickable = (n: AppNotification) => (n.contentType === 'POST' || n.contentType === 'REEL') && n.contentId

  // useEffect(() => {
  //   if (isAuthenticated && pathname === '/messages') refreshMessageCount()
  // }, [pathname, refreshMessageCount, isAuthenticated])

  const handleNavItemClick = (e: React.MouseEvent, item: TopNavItem) => {
    if (item.requiresAuth && !isAuthenticated) { e.preventDefault(); showLoginPrompt(`access ${item.text}`) }
  }

  const handleMobileDrawerToggle = () => { setMobileDrawerOpen(!mobileDrawerOpen) }
  const handleMobileSearchOpen = () => { setMobileSearchOpen(true) }
  const handleMobileSearchClose = () => { 
    setMobileSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
    // Stop voice recognition if active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }



  const renderSearchContent = (isMobile: boolean = false) => (
    <ClickAwayListener onClickAway={() => !isMobile && setShowSearchResults(false)}>
      <Box ref={!isMobile ? searchBoxRef : undefined} sx={{ position: 'relative', width: isMobile ? '100%' : 'auto' }}>
        <Box component="form" onSubmit={handleSearch} sx={{
          position: 'relative', borderRadius: 3,
          backgroundColor: mode === 'light' ? alpha('#000', 0.05) : alpha('#fff', 0.1),
          '&:hover': { backgroundColor: mode === 'light' ? alpha('#000', 0.08) : alpha('#fff', 0.15) },
          width: isMobile ? '100%' : { xs: 140, sm: 170, md: 220 }, display: 'flex', alignItems: 'center',
          border: showSearchResults || isListening ? '2px solid' : '2px solid transparent', 
          borderColor: isListening ? 'error.main' : 'primary.main',
          transition: 'all 0.2s ease'
        }}>
          <Box sx={{ padding: '0 10px', height: '100%', position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          </Box>
          <InputBase 
            placeholder={isListening ? "Listening..." : "Search BitoCircle"} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true) }} 
            autoFocus={isMobile}
            sx={{ 
              color: 'text.primary', 
              width: '100%', 
              '& .MuiInputBase-input': { 
                padding: '10px 70px 10px 0', 
                paddingLeft: 'calc(1em + 28px)', 
                fontSize: 14,
                '&::placeholder': {
                  color: isListening ? 'error.main' : 'text.secondary',
                  opacity: isListening ? 1 : 0.7
                }
              } 
            }}
          />
          <Box sx={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isSearching && <CircularProgress size={16} sx={{ color: 'text.secondary' }} />}
            {searchQuery && !isSearching && (
              <IconButton size="small" onClick={handleClearSearch} sx={{ p: 0.5, '&:hover': { bgcolor: alpha('#000', 0.1) } }}>
                <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </IconButton>
            )}
            {/* Voice Search Button */}
            {speechSupported && (
              <Tooltip title={isListening ? "Stop listening" : "Voice search"}>
                <IconButton 
                  size="small" 
                  onClick={handleVoiceSearch}
                  sx={{ 
                    p: 0.5, 
                    '&:hover': { bgcolor: alpha('#000', 0.1) },
                    ...(isListening && {
                      color: 'error.main',
                      bgcolor: alpha('#f44336', 0.1),
                      animation: 'pulse 1.5s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)' },
                        '50%': { transform: 'scale(1.05)', boxShadow: '0 0 0 8px rgba(244, 67, 54, 0)' },
                        '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' },
                      },
                    })
                  }}
                >
                  <MicIcon 
                    sx={{ 
                      fontSize: 18, 
                      color: isListening ? 'error.main' : 'text.secondary',
                      transition: 'color 0.2s ease'
                    }} 
                  />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Listening Indicator */}
        {isListening && (
          <Paper 
            elevation={3} 
            sx={{ 
              position: 'absolute', 
              top: 'calc(100% + 8px)', 
              left: 0, 
              right: 0, 
              p: 2, 
              borderRadius: 2, 
              zIndex: 1200, 
              bgcolor: mode === 'light' ? 'white' : 'background.paper',
              minWidth: isMobile ? '100%' : { xs: 280, sm: 320 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: 'blink 1s infinite',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />
              <Typography variant="body2" fontWeight={600} color="error.main">
                Listening...
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Speak now to search BitoCircle
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    height: 20,
                    bgcolor: 'error.main',
                    borderRadius: 1,
                    animation: `wave 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    '@keyframes wave': {
                      '0%, 100%': { transform: 'scaleY(0.5)' },
                      '50%': { transform: 'scaleY(1)' },
                    },
                  }}
                />
              ))}
            </Box>
            <Button 
              size="small" 
              variant="outlined" 
              color="error"
              onClick={handleVoiceSearch}
              sx={{ mt: 1, textTransform: 'none', fontSize: 12 }}
            >
              Cancel
            </Button>
          </Paper>
        )}

        {showSearchResults && !isListening && (
          <Paper elevation={3} sx={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, maxHeight: 400, overflow: 'auto', borderRadius: 2, zIndex: 1200, bgcolor: mode === 'light' ? 'white' : 'background.paper', minWidth: isMobile ? '100%' : { xs: 320, sm: 360 } }}>
            {searchResults.length > 0 ? (
              <>
                <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">People</Typography>
                </Box>
                <List sx={{ py: 0 }}>
                  {searchResults.map((user) => {
                    const isFollowing = user.isUserFollowing === 1
                    const resultKey = getResultKey(user)
                    const isLoading = followLoading.has(resultKey)
                    return (
                      <ListItem key={resultKey} disablePadding secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => handleFollowToggle(e, user)}
                          disabled={isFollowing || isLoading}
                          sx={{
                            bgcolor: isFollowing ? 'grey.200' : 'primary.main',
                            color: isFollowing ? 'primary.main' : 'white',
                            '&:hover': {
                              bgcolor: isFollowing ? 'grey.300' : 'primary.dark'
                            },
                            '&.Mui-disabled': {
                              bgcolor: isFollowing ? 'grey.200' : 'grey.300',
                              color: isFollowing ? 'primary.main' : 'text.disabled'
                            },
                            width: 32,
                            height: 32
                          }}
                        >
                          {isLoading ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : isFollowing ? (
                            <CheckCircleIcon sx={{ fontSize: 18 }} />
                          ) : (
                            <PersonAddIcon sx={{ fontSize: 18 }} />
                          )}
                        </IconButton>
                      }>
                        <ListItemButton onClick={() => handleUserClick(user)} sx={{ py: 1.5, pr: 6, '&:hover': { bgcolor: mode === 'light' ? '#f5f5f5' : alpha('#fff', 0.05) } }}>
                          <ListItemAvatar>
                            <Avatar
                              src={user.profilePicture || undefined}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/public/${user.userId}/${user.pageId}`);
                                setShowSearchResults(false);
                                isMobile && setMobileSearchOpen(false)
                              }}
                              sx={{
                                bgcolor: '#4267b2',
                                width: 40,
                                height: 40,
                                fontSize: 14,
                                fontWeight: 600,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                            >
                              {!user.profilePicture && getInitials(user.fullName)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText primary={<Typography variant="body2" fontWeight={600}>{user.fullName}</Typography>}
                            secondary={<Typography variant="caption" color="text.secondary">{user.username}</Typography>} />
                        </ListItemButton>
                      </ListItem>
                    )
                  })}
                </List>
                {searchResults.length >= 10 && (
                  <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
                    <Button fullWidth size="small" onClick={(e) => { e.preventDefault(); handleSearch(e as React.FormEvent) }} sx={{ textTransform: 'none', fontWeight: 600 }}>
                      See all results for &quot;{searchQuery}&quot;
                    </Button>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No results found for &quot;{searchQuery}&quot;</Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  )

  // Render notification item
  const renderNotificationItem = (notification: AppNotification) => {
    const style = getNotificationStyle(notification.notificationType)
    const isUnread = notification.isRead === "N"
    const isFollowRequest = notification.notificationType === 'FOLLOW_REQUEST'
    const isAccepting = processingFollowRequest === notification.notificationId
    const isDeclining = processingFollowRequest === -notification.notificationId
    const isProcessing = isAccepting || isDeclining

    // Get media preview info
    const mediaPreview = getMediaPreview(notification.contentMediaUrl)

    return (
      <Box
        key={notification.notificationId}
        onClick={() => handleNotificationClick(notification)}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          px: 2,
          py: 1.5,
          mx: 0.75,
          my: 0.5,
          borderRadius: 2,
          cursor: isFollowRequest ? 'default' : 'pointer',
          bgcolor: isUnread ? alpha('#1877f2', 0.06) : 'transparent',
          '&:hover': { bgcolor: alpha('#000', 0.04) },
          ...(isFollowRequest && {
            borderLeft: '3px solid',
            borderLeftColor: '#f5a623',
          })
        }}
      >
        {/* Main notification content */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              src={notification.actorProfilePicture || undefined}
              onClick={(e) => handleActorClick(e, notification)}
              sx={{ width: 44, height: 44, bgcolor: '#4267b2', cursor: 'pointer' }}
            >
              {getInitials(notification.actorFullName)}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: -1,
                right: -1,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: style.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                border: '2px solid white'
              }}
            >
              {style.icon}
            </Box>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.4, fontSize: '0.8125rem' }}>
              <Typography
                component="span"
                onClick={(e) => handleActorClick(e, notification)}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              >
                {notification.actorFullName}
              </Typography>{' '}
              <Typography
                component="span"
                onClick={(e) => { if (isContentClickable(notification)) handleContentClick(e, notification) }}
                sx={{ color: 'text.secondary', cursor: isContentClickable(notification) ? 'pointer' : 'default' }}
              >
                {notification.message}
              </Typography>
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: isUnread ? 'primary.main' : 'text.secondary', fontWeight: isUnread ? 600 : 400 }}
            >
              {getTimeAgo(notification.createdAt)}
            </Typography>
          </Box>

          {/* Media Preview - Updated to handle comma-separated URLs and videos */}
          {mediaPreview.url && (
            <Box
              onClick={(e) => { if (isContentClickable(notification)) handleContentClick(e, notification) }}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1.5,
                overflow: 'hidden',
                flexShrink: 0,
                position: 'relative',
                bgcolor: mediaPreview.isVideo ? 'grey.800' : 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isContentClickable(notification) ? 'pointer' : 'default'
              }}
            >
              {mediaPreview.isVideo ? (
                <>
                  {/* Video thumbnail using video element */}
                  <video
                    src={mediaPreview.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                    muted
                    preload="metadata"
                    onLoadedData={(e) => {
                      // Seek to first frame for thumbnail
                      const video = e.target as HTMLVideoElement
                      video.currentTime = 0.1
                    }}
                  />
                  {/* Play icon overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(0,0,0,0.4)',
                      zIndex: 1
                    }}
                  >
                    <PlayCircleIcon sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                </>
              ) : (
                <img
                  src={mediaPreview.url}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    // Hide broken images
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Accept/Decline buttons for FOLLOW_REQUEST */}
        {isFollowRequest && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              ml: 7,
              mt: 0.5
            }}
          >
            <Button
              variant="contained"
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleProcessFollowRequest(notification, 'ACCEPT')
              }}
              disabled={isProcessing}
              startIcon={isAccepting ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                bgcolor: '#1877f2',
                '&:hover': { bgcolor: '#166fe5' },
                minWidth: 90
              }}
            >
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleProcessFollowRequest(notification, 'DECLINE')
              }}
              disabled={isProcessing}
              startIcon={isDeclining ? <CircularProgress size={14} color="inherit" /> : <CloseIcon sx={{ fontSize: 16 }} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                borderColor: 'divider',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'error.main',
                  color: 'error.main',
                  bgcolor: alpha('#f44336', 0.04)
                },
                minWidth: 90
              }}
            >
              {isDeclining ? 'Declining...' : 'Decline'}
            </Button>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: mode === 'light' ? 'white' : 'background.paper', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', borderBottom: '1px solid', borderColor: mode === 'light' ? '#e4e6ea' : 'divider', zIndex: 1100 }}>
        <Toolbar
          disableGutters
          sx={{
            px: { xs: 1, sm: 2 },
            minHeight: { xs: 56, sm: 64 },
            justifyContent: 'space-between'
          }}
        >
          {/* LEFT SECTION */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={handleMobileDrawerToggle}
              sx={{ display: { xs: 'inline-flex', lg: 'none' }, color: 'text.primary' }}
            >
              <MenuIcon />
            </IconButton>
            <Link href="/feeds" style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo.src} alt="BitoCircle" style={{ height: 32 }} />
            </Link>
            <Box sx={{ display: { xs: 'none', md: 'block' }, ml: 1 }}>
              {renderSearchContent(false)}
            </Box>
          </Box>

          {/* CENTER SECTION - Desktop Nav */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, position: 'absolute', left: '50%', transform: 'translateX(-50%)', gap: 0.5 }}>
            {topNavItems.map((item) => {
              const isExternal = ['Advertise', 'Monetize', 'Marketplaces'].includes(item.text)
              const needsAuth = item.requiresAuth && !isAuthenticated
              if (needsAuth) {
                return (
                  <Button key={item.href} onClick={(e) => handleNavItemClick(e, item)}
                    sx={{ minWidth: 80, height: 56, borderRadius: 2, color: 'text.secondary', px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, textTransform: 'none', '&:hover': { bgcolor: mode === 'light' ? '#f2f3f5' : alpha('#fff', 0.05) } }}>
                    {item.icon}
                    <Typography sx={{ fontSize: 10.5, fontWeight: 500, lineHeight: 1 }}>{item.text}</Typography>
                  </Button>
                )
              }
              const Wrapper = isExternal ? 'a' : Link
              const wrapperProps = isExternal ? { href: item.href, target: '_blank', rel: 'noopener', style: { textDecoration: 'none' } } : { href: item.href, style: { textDecoration: 'none' } }
              return (
                <Wrapper key={item.href} {...wrapperProps}>
                  <Button sx={{ minWidth: 80, height: 56, borderRadius: 2, color: isActive(item.href) ? 'primary.main' : 'text.secondary', px: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, textTransform: 'none', position: 'relative', '&:hover': { bgcolor: mode === 'light' ? '#f2f3f5' : alpha('#fff', 0.05) }, ...(isActive(item.href) && { '&::after': { content: '""', position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, bgcolor: 'primary.main', borderRadius: '3px 3px 0 0' } }) }}>
                    {item.icon}
                    <Typography sx={{ fontSize: 10.5, fontWeight: isActive(item.href) ? 600 : 500, lineHeight: 1 }}>{item.text}</Typography>
                  </Button>
                </Wrapper>
              )
            })}
          </Box>

          {/* RIGHT SECTION - ALWAYS VISIBLE ICONS */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Search Icon - Mobile/Tablet */}
            <IconButton
              onClick={handleMobileSearchOpen}
              sx={{
                display: { xs: 'inline-flex', md: 'none' },
                color: 'text.primary'
              }}
            >
              <SearchIcon />
            </IconButton>

            {/* Messages Icon - ALWAYS VISIBLE */}
            <IconButton
  component={Link}
  href="/messages"
  onClick={handleMessagesClick}
  sx={{ color: 'text.primary' }}
>
  <Badge 
    badgeContent={isAuthenticated ? unreadMessageCount : 0} 
    color="error" 
    max={99}
  >
    <MessageIcon />
  </Badge>
</IconButton>

            {/* Notifications Icon - ALWAYS VISIBLE */}
            <IconButton
              onClick={handleNotificationOpen}
              sx={{ color: 'text.primary' }}
            >
              <Badge badgeContent={isAuthenticated ? unreadCount : 0} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>

            {/* Profile Avatar or Sign In */}
            {isAuthenticated ? (
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5, position: 'relative' }}>
                <DotIcon sx={{ position: 'absolute', bottom: 0, right: 2, zIndex: 1, fontSize: 14, color: '#44b700', bgcolor: 'background.paper', borderRadius: '50%' }} />
                <Avatar src={userProfile.profilePicture || undefined} sx={{ bgcolor: '#4267b2', width: 32, height: 32, fontSize: 12 }}>
                  {(userProfile.fullName?.[0] || brokerDetails?.firstName?.[0] || 'U').toUpperCase()}
                </Avatar>
              </IconButton>
            ) : (
              <Button variant="contained" size="small" onClick={handleLogin} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: { xs: 1, sm: 2 }, bgcolor: '#1e40af', fontSize: { xs: 11, sm: 14 }, ml: 0.5 }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sign In</Box>
                <LoginIcon sx={{ display: { xs: 'inline', sm: 'none' }, fontSize: 18 }} />
              </Button>
            )}

            {/* Right Sidebar Toggle - Mobile/Tablet Only */}
            <IconButton
              onClick={() => setRightDrawerOpen(true)}
              sx={{
                display: { xs: 'inline-flex', lg: 'none' },
                color: 'text.primary'
              }}
            >
              <WidgetsIcon />
            </IconButton>
          </Box>
        </Toolbar>

        {/* NOTIFICATION POPOVER */}
        <Popover open={Boolean(notificationAnchor)} anchorEl={notificationAnchor} onClose={handleNotificationClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1, '& .MuiPaper-root': { width: { xs: 'calc(100vw - 32px)', sm: 400 }, maxWidth: 400, maxHeight: 520, borderRadius: 3 } }}>
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography fontWeight={700} fontSize={17}>Notifications</Typography>
              {unreadCount > 0 && <Chip label={unreadCount} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#ed4956', color: 'white' }} />}
            </Box>
            {unreadCount > 0 && <Button size="small" onClick={handleMarkAllAsRead} sx={{ textTransform: 'none', fontSize: 12, fontWeight: 600, color: 'primary.main' }}>Mark all read</Button>}
          </Box>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {isLoadingNotifications ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                <CircularProgress size={28} sx={{ mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">Loading...</Typography>
              </Box>
            ) : notifications.length > 0 ? (
              <Box sx={{ py: 0.75 }}>
                {notifications.map((notification) => renderNotificationItem(notification))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 5 }}>
                <NotificationIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography fontWeight={600}>No notifications yet</Typography>
              </Box>
            )}
          </Box>
        </Popover>

        {/* PROFILE MENU */}
        <Menu anchorEl={profileMenuAnchor} open={Boolean(profileMenuAnchor)} onClose={handleProfileMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 1.5, '& .MuiPaper-root': { minWidth: 280, borderRadius: 2 } }}>
          <Box sx={{ px: 2, py: 1.5, bgcolor: mode === 'light' ? '#f8f9fa' : alpha('#fff', 0.05) }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={userProfile.profilePicture || undefined} sx={{ bgcolor: '#4267b2', width: 48, height: 48 }}>
                {(userProfile.fullName?.[0] || brokerDetails?.firstName?.[0] || 'U').toUpperCase()}
              </Avatar>
              <Box>
                <Typography fontWeight={600}>{userProfile.fullName || `${brokerDetails?.firstName} ${brokerDetails?.lastName}`}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{userProfile.email || brokerDetails?.email}</Typography>
              </Box>
            </Box>
          </Box>
          <Divider />
          <MenuItem component={Link} href="/profile" onClick={handleProfileMenuClose} sx={{ py: 1.5, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></ListItemIcon>
            <Typography variant="body2">Profile</Typography>
          </MenuItem>
          <MenuItem component={Link} href="/settings" onClick={handleProfileMenuClose} sx={{ py: 1.5, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><SettingsIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></ListItemIcon>
            <Typography variant="body2">Settings</Typography>
          </MenuItem>
          <MenuItem onClick={handleHelpSupport} sx={{ py: 1.5, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><HelpIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></ListItemIcon>
            <Typography variant="body2">Help & Support</Typography>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleThemeToggle} sx={{ py: 1.5, gap: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>{mode === 'light' ? <DarkModeIcon sx={{ color: 'text.secondary', fontSize: 20 }} /> : <LightModeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}</ListItemIcon>
            <Typography variant="body2">{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</Typography>
          </MenuItem>
          <Divider />
          <Typography variant="caption" sx={{ px: 2, pt: 1, pb: 0.5, display: 'block', color: 'text.secondary', fontWeight: 700 }}>
            Developers: API docs
          </Typography>
          {[
            { href: '/api', label: 'White-label (sign-in token)' },
            { href: '/api/api-key', label: 'API key & secret' },
            { href: '/api/developer-portal', label: 'Developer Portal apps' },
          ].map((doc) => (
            <MenuItem
              key={doc.href}
              component="a"
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleProfileMenuClose}
              sx={{ py: 1.25, gap: 1.5 }}
            >
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <CodeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              </ListItemIcon>
              <Typography variant="body2">{doc.label}</Typography>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1.5, gap: 1.5, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}><LogoutIcon sx={{ fontSize: 20, color: 'error.main' }} /></ListItemIcon>
            <Typography variant="body2" fontWeight={500}>Log out</Typography>
          </MenuItem>
        </Menu>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer anchor="left" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: 300 } }}>
        <Sidebar temporary onClose={() => setMobileDrawerOpen(false)} />
      </Drawer>

      {/* RIGHT SIDEBAR DRAWER - Mobile/Tablet Only */}
      <Drawer
        anchor="right"
        open={rightDrawerOpen}
        onClose={() => setRightDrawerOpen(false)}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 360 },
            maxWidth: 400,
            p: 2,
            boxSizing: 'border-box'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" fontWeight={600}>
            Discover
          </Typography>
          <IconButton onClick={() => setRightDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{
          overflowY: 'auto',
          height: 'calc(100% - 60px)',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
            borderRadius: '3px',
          },
        }}>
          <SidebarComponent
            userId={typeof window !== 'undefined' ? localStorage.getItem('childUserId') || '' : ''}
            onViewAllActivity={() => {
              setRightDrawerOpen(false)
              router.push('/connection-highlights')
            }}
            onViewAllPolls={() => {
              setRightDrawerOpen(false)
              router.push('/polls')
            }}
          />
        </Box>
      </Drawer>

      {/* MOBILE SEARCH DIALOG */}
      <Dialog fullScreen open={mobileSearchOpen} onClose={handleMobileSearchClose}>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <IconButton onClick={handleMobileSearchClose}><CloseIcon /></IconButton>
            <Box sx={{ flex: 1 }}>{renderSearchContent(true)}</Box>
          </Box>
          {!showSearchResults && !searchQuery && !isListening && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">Search for people on BitoCircle</Typography>
              {speechSupported && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Or try voice search
                  </Typography>
                  <IconButton
                    onClick={handleVoiceSearch}
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'primary.dark' },
                      boxShadow: 2
                    }}
                  >
                    <MicIcon sx={{ fontSize: 32 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <SnackbarAlert open={snackbarOpen} onClose={() => setSnackbarOpen(false)} message={snackbarMsg} severity={snackbarSeverity} />
    </>
  )
}

export default TopNavigation