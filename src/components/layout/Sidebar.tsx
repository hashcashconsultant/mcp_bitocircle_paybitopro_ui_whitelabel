'use client'
import React, { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '../../contexts/SearchContext'
// import { generateFCMToken, getDeviceId } from '../../services/firebase';
import axios from 'axios';


import SnackbarAlert from '@/components/common/SnackbarAlert'
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  IconButton,
  ListItemButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputBase,
  alpha,
  useMediaQuery
} from '@mui/material'
import {
  Home as HomeIcon,
  VideoLibrary as ReelsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ShowChart as ShowChartIcon,
  Bookmark as BookmarkIcon,
  Close as CloseIcon,
  KeyboardArrowDown,
  KeyboardArrowRight,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  OndemandVideo as VideosIcon,
  FiberManualRecord as DotIcon,
  Login as LoginIcon,
  Delete as DeleteIcon,
  AccountBalance as FinanceIcon,
  Campaign as AdvertiseIcon,
  MonetizationOn as MonetizeIcon,
  Store as MarketplaceIcon,
  Search as SearchIcon,
  Check as CheckIcon
} from '@mui/icons-material'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import CreatePostDialog from '@/components/CreatePostDialog'
import CreateReelDialog from '@/components/CreateReelDialog'
import CreatePageDialog from './CreatePageDialog'
import SwitchAccountDialog from './SwitchAccountDialog'
import { useBroker } from '../../contexts/BrokerContext'
import { useUserProfile } from '../../contexts/UserProfileContext'
import { useThemeMode } from '../../contexts/ThemeContext'

interface Page {
  id: string
  name: string
  category: string
  followers: string
  avatar: string
  avatarBgColor: string
  isOnline?: boolean
  handle?: string
  isCompleted?: number
  profilePicture?: string | null
}

interface PageDetailsResponse {
  success: boolean
  message: string
  data: Array<{
    adminUser: string | null
    userId: number
    pageId: number
    pageName: string
    pageType: string | null
    pageHandle: string
    email: string | null
    location: string | null
    website: string | null
    description: string | null
    categoryIds: string | null
    isCompleted?: number
    profilePicture?: string | null
  }> | {
    adminUser: string | null
    pageId: number
    pageName: string
    pageHandle: string
    isCompleted?: number
    profilePicture?: string | null
  }
  errorCode: string | null
}

interface SidebarProps {
  temporary?: boolean
  onClose?: () => void
}

interface NavItem {
  text: string
  icon: React.ReactNode
  href?: string
  requiresAuth?: boolean
  isExternal?: boolean
  showOnMobileOnly?: boolean
}
// Add this interface near the other interfaces at the top
interface FCMTokenResponse {
  success: boolean;
  message: string;
  data?: {
    tokenId: number;
    userId: number;
    fcmToken: string;
    deviceType: string;
    deviceId: string;
    isActive: string;
    createdAt: string;
    updatedAt: string;
  };
}
const Sidebar: React.FC<SidebarProps> = ({ temporary = false, onClose }) => {
  const theme = useTheme()
  const router = useRouter()
  const { isAuthenticated, requireAuth, showLoginPrompt } = useAuth()
  const { mode } = useThemeMode()
  const { triggerSearch } = useSearch()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMsg, setSnackbarMsg] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')
  const { brokerDetails } = useBroker()
  const { userProfile } = useUserProfile()

  const pathname = usePathname()
  const [openPostDialog, setOpenPostDialog] = useState(false)
  const [openReelDialog, setOpenReelDialog] = useState(false)
  const [openPageDialog, setOpenPageDialog] = useState(false)
  const [showAllPages, setShowAllPages] = useState(false)
  const [switchAccountDialog, setSwitchAccountDialog] = useState<{
    open: boolean
    page: Page | null
  }>({ open: false, page: null })

  const [userPages, setUserPages] = useState<Page[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(false)
  const [pagesError, setPagesError] = useState<string | null>(null)
  const [businessStatus, setBusinessStatus] = useState<number>(0)
  const [businessPageId, setBusinessPageId] = useState<string | null>(null)

  // Track current page ID
  const [currentPageId, setCurrentPageId] = useState<string>('0')

  // Track if data has been loaded
  const [hasLoadedData, setHasLoadedData] = useState(false)

  // Delete page states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mobile search state
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize current page ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pageId = localStorage.getItem('pageId') || '0'
      setCurrentPageId(pageId)
    }
  }, [])

  // Helper functions for external links
  const getAdvertiseHref = () => {
    if (typeof window === 'undefined') return '/advertise'
    const appData = localStorage.getItem('appDataRaw') || ''
    return `http://ad-center.bitocircle.com/?app=${appData}`
  }
  const getMonetizeHref = () => `https://www.bitocircle.com/monetize/`
  const getMarketplaceHref = () => `https://www.bitocircle.com/marketplaces/`

  const generateAvatarColor = (name: string): string => {
    const colors = [
      '#7c3aed', '#ec4899', '#8b5cf6', '#06b6d4',
      '#f59e0b', '#10b981', '#ef4444', '#3b82f6'
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getPageInitials = (name: string): string => {
    const words = name.split(/\s+/)
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const fetchProfileStatus = async () => {
    if (!isAuthenticated) return

    const uuid = localStorage.getItem('uuid')
    const pageId = localStorage.getItem('pageId') || '0'

    if (!uuid) return

    try {
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/profile/getProfileDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUser: uuid,
          pageId: pageId,
        }),
      })
      const result = await response.json()
      if (result.success && result.data) {
        setBusinessStatus(result.data.status || 0)
        if (result.data.businessPageId) {
          setBusinessPageId(result.data.businessPageId.toString())
        }
        localStorage.setItem('childUserId', result.data.userId)
        localStorage.setItem('shopOwnerId', result.data.userId)

        if (result.data.pageId == '0' || result.data.pageId == 0) {
          localStorage.setItem('userType', 'USER')
          localStorage.setItem('childPageId', result.data.userId)
          // Store personal profile photo separately - this is the fix!
          localStorage.setItem('personalProfilePhoto', result.data.profilePicture || '')
        }
        else {
          localStorage.setItem('childPageId', localStorage.getItem('pageId') || '0')
          localStorage.setItem('userType', 'PAGE')
        }

        // Store current profile photo (for current context - page or personal)
        localStorage.setItem('profilePhoto', result.data.profilePicture || '')

        // const userId= localStorage.getItem('childUserId') || ''
        // const accessToken = localStorage.getItem('access_token_us') || ''

        // Register FCM token after successful auth from URL app param
        // await registerFCMToken(userId, accessToken);
      }
    } catch (error) {
      console.error('Error fetching profile status:', error)
    }
  }

  // Register FCM token with the backend
  // const registerFCMToken = async (userId: string, accessToken: string): Promise<void> => {
  //   try {
  //     const existingFcmToken = localStorage.getItem('fcm_token');
  //     if (existingFcmToken) {
  //       console.log('FCM token already registered.');
  //       return;
  //     }

  //     const fcmToken = await generateFCMToken();
  //     if (!fcmToken) {
  //       console.warn('Could not generate FCM token.');
  //       return;
  //     }

  //     const deviceId = getDeviceId();

  //     const response = await axios.post<FCMTokenResponse>(
  //       'https://institutional-bo.paybito.com:8443/BitohubService/push/token/register',
  //       {
  //         userId: localStorage.getItem('childUserId'),
  //         fcmToken: fcmToken,
  //         deviceType: 'WEB',
  //         deviceId: deviceId,
  //       },
  //       {
  //         headers: { authorization: `bearer ${accessToken}` },
  //       }
  //     );

  //     if (response.data.success) {
  //       console.log('FCM token registered successfully:', response.data.data);
  //       localStorage.setItem('fcm_token', fcmToken);
  //     } else {
  //       console.warn('FCM token registration failed:', response.data.message);
  //     }
  //   } catch (error) {
  //     console.error('Failed to register FCM token:', error);
  //   }
  // };

  const handleCompleteBusinessProfile = () => {
    if (!requireAuth('complete your business profile')) return

    if (businessPageId) {
      localStorage.setItem('pageId', businessPageId)
      setCurrentPageId(businessPageId)
      console.log('Saved businessPageId to localStorage:', businessPageId)
    }
    window.location.href = '/profile'
  }

  const fetchUserPages = async () => {
    if (!isAuthenticated) return

    const adminUser = localStorage.getItem('uuid') || brokerDetails?.brokerId

    if (!adminUser) {
      console.error('No adminUser found')
      setPagesError('User ID not found')
      return
    }

    setIsLoadingPages(true)
    setPagesError(null)

    try {
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/profile/getPageDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUser: adminUser
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: PageDetailsResponse = await response.json()

      if (result.success && result.data) {
        const pagesArray = Array.isArray(result.data) ? result.data : [result.data]

        const businessPages = pagesArray.map(pageData => ({
          id: pageData.pageId.toString(),
          name: pageData.pageName,
          handle: pageData.pageHandle,
          category: 'Business Page',
          followers: '0',
          avatar: getPageInitials(pageData.pageName),
          avatarBgColor: generateAvatarColor(pageData.pageName),
          isOnline: false,
          isCompleted: pageData.isCompleted || 0,
          profilePicture: pageData.profilePicture
        }))

        // Use personalProfilePhoto for the "You" profile - this is the fix!
        const personalProfilePhoto = localStorage.getItem('personalProfilePhoto') || userProfile.profilePicture
        const personalProfile: Page = {
          id: '0',
          name: 'You',
          category: 'Personal Profile',
          followers: '',
          avatar: brokerDetails?.firstName?.[0] || 'Y',
          avatarBgColor: '#7c3aed',
          isOnline: true,
          profilePicture: personalProfilePhoto || undefined
        }

        setUserPages([personalProfile, ...businessPages])
      } else {
        // Use personalProfilePhoto for the "You" profile - this is the fix!
        const personalProfilePhoto = localStorage.getItem('personalProfilePhoto') || userProfile.profilePicture
        const personalProfile: Page = {
          id: '0',
          name: 'You',
          category: 'Personal Profile',
          followers: '',
          avatar: brokerDetails?.firstName?.[0] || 'Y',
          avatarBgColor: '#7c3aed',
          isOnline: true,
          profilePicture: personalProfilePhoto || undefined
        }
        setUserPages([personalProfile])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
      setPagesError('Failed to load pages')

      // Use personalProfilePhoto for the "You" profile - this is the fix!
      const personalProfilePhoto = localStorage.getItem('personalProfilePhoto') || userProfile.profilePicture
      const personalProfile: Page = {
        id: '0',
        name: 'You',
        category: 'Personal Profile',
        followers: '',
        avatar: brokerDetails?.firstName?.[0] || 'Y',
        avatarBgColor: '#7c3aed',
        isOnline: true,
        profilePicture: personalProfilePhoto || undefined
      }
      setUserPages([personalProfile])
    } finally {
      setIsLoadingPages(false)
      setHasLoadedData(true)
    }
  }

  // Load data when component mounts and when authentication status changes
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated && (brokerDetails || localStorage.getItem('uuid'))) {
        await Promise.all([
          fetchUserPages(),
          fetchProfileStatus()
        ])
      }
    }

    loadData()
  }, [isAuthenticated, brokerDetails])

  // Also load data when sidebar is opened (temporary mode)
  useEffect(() => {
    if (temporary && isAuthenticated && !hasLoadedData) {
      const loadData = async () => {
        await Promise.all([
          fetchUserPages(),
          fetchProfileStatus()
        ])
      }
      loadData()
    }
  }, [temporary, isAuthenticated, hasLoadedData])

  // Update current page ID when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const pageId = localStorage.getItem('pageId') || '0'
      setCurrentPageId(pageId)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handlePostCreate = (data: unknown) => {
    console.log('Creating post with data:', data)
  }

  const handleReelPublish = (data: unknown) => {
    console.log('Publishing reel with data:', data)
  }

  const handlePageCreate = (data: unknown) => {
    console.log('Creating page with data:', data)
    fetchUserPages()
  }

  const handlePageClick = (e: React.MouseEvent, page: Page) => {
    e.preventDefault()

    if (!requireAuth('switch accounts')) return

    const currentPageId = localStorage.getItem('pageId') || '0'

    if (currentPageId === page.id) {
      console.log('Already on this page')
      return
    }

    setSwitchAccountDialog({ open: true, page })
  }

  const handleSwitchAccount = () => {
    if (switchAccountDialog.page) {
      console.log('Switching to page:', switchAccountDialog.page.name)

      if (switchAccountDialog.page.id === '0' || switchAccountDialog.page.name === 'You') {
        localStorage.setItem('pageId', '0')
        setCurrentPageId('0')
        console.log('Switched to personal profile')
      } else {
        localStorage.setItem('pageId', switchAccountDialog.page.id)
        setCurrentPageId(switchAccountDialog.page.id)
        console.log('Switched to page:', switchAccountDialog.page.id)
      }

      setSwitchAccountDialog({ open: false, page: null })
      window.location.href = '/profile'
    }
  }

  const handleRefreshPages = () => {
    if (!requireAuth('refresh pages')) return
    fetchUserPages()
  }

  const handleCreatePage = () => {
    if (!requireAuth('create a page')) return
    setOpenPageDialog(true)
  }

  // Delete page handlers
  const handleDeleteClick = (e: React.MouseEvent, page: Page) => {
    e.stopPropagation()
    if (!requireAuth('delete a page')) return
    setPageToDelete(page)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setPageToDelete(null)
  }

  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return

    const userId = localStorage.getItem('childUserId')

    if (!userId) {
      setSnackbarMsg('User ID not found')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/profile/deletePage', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          pageId: parseInt(pageToDelete.id)
        })
      })

      const result = await response.json()

      if (result.success) {
        setSnackbarMsg(result.message || 'Page deleted successfully')
        setSnackbarSeverity('success')
        setSnackbarOpen(true)

        // If the deleted page is the current page, switch to personal profile
        const currentPageId = localStorage.getItem('pageId')
        if (currentPageId === pageToDelete.id) {
          localStorage.setItem('pageId', '0')
          setCurrentPageId('0')
        }

        // Refresh the pages list
        fetchUserPages()
      } else {
        setSnackbarMsg(result.message || 'Failed to delete page')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Error deleting page:', error)
      setSnackbarMsg('Failed to delete page. Please try again.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setPageToDelete(null)
    }
  }

  // Handle navigation with auth check
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      e.preventDefault()
      showLoginPrompt(`access ${item.text}`)
      return
    }

    // Close sidebar on mobile after navigation
    if (temporary && onClose) {
      onClose()
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query) {
      triggerSearch(query)
      router.push('/search')
      setSearchQuery('')
      if (temporary && onClose) {
        onClose()
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  // Main navigation items (always shown)
  const mainNavItems: NavItem[] = [
    { icon: <HomeIcon />, text: 'Home', href: '/', requiresAuth: false },
    { icon: <PersonIcon />, text: 'Profile', href: '/profile', requiresAuth: true },
    { icon: <ReelsIcon />, text: 'Reels', href: '/reels', requiresAuth: false },
    { icon: <SettingsIcon />, text: 'Settings', href: '/settings', requiresAuth: true },
    { icon: <ShowChartIcon />, text: 'Your Activity', href: '/activity', requiresAuth: true },
    { icon: <BookmarkIcon />, text: 'Saved', href: '/saved', requiresAuth: true }
  ]

  // Additional navigation items (shown on mobile/tablet only - these are from top nav)
  const mobileNavItems: NavItem[] = [
    { icon: <FinanceIcon />, text: 'Finance Hub', href: '/finance-hub', requiresAuth: true, showOnMobileOnly: true },
    { icon: <AdvertiseIcon />, text: 'Advertise', href: getAdvertiseHref(), requiresAuth: true, isExternal: true, showOnMobileOnly: true },
    { icon: <MonetizeIcon />, text: 'Monetize', href: getMonetizeHref(), requiresAuth: true, isExternal: true, showOnMobileOnly: true },
    { icon: <MarketplaceIcon />, text: 'Marketplaces', href: getMarketplaceHref(), requiresAuth: false, isExternal: true, showOnMobileOnly: true }
  ]

  const isActive = (href?: string) => href ? pathname === href : false

  // Check if a page is selected
  const isPageSelected = (pageId: string) => {
    return pageId === currentPageId
  }

  const renderNavItem = (item: NavItem, index: number) => {
    const needsAuth = item.requiresAuth && !isAuthenticated

    if (needsAuth) {
      return (
        <ListItem
          key={index}
          onClick={(e) => handleNavClick(e, item)}
          sx={{
            py: 0,
            px: 1,
            mb: 0.5,
            borderRadius: 2,
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            // '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <ListItemButton
            sx={{
              py: '8px',
              px: '12px',
              borderRadius: 2,
              position: 'relative'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: 15,
                fontWeight: 500
              }}
            />
          </ListItemButton>
        </ListItem>
      )
    }

    // External link
    if (item.isExternal) {
      return (
        <ListItem
          key={index}
          component="a"
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item)}
          sx={{
            py: 0,
            px: 1,
            mb: 0.5,
            borderRadius: 2,
            textDecoration: 'none',
            color: 'inherit',
            // '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <ListItemButton
            sx={{
              py: '8px',
              px: '12px',
              borderRadius: 2,
              position: 'relative'
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: 15,
                fontWeight: 500
              }}
            />
          </ListItemButton>
        </ListItem>
      )
    }

    return (
      <ListItem
        key={index}
        component={Link}
        href={item.href!}
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) => handleNavClick(e, item)}
        sx={{
          py: 0,
          px: 1,
          mb: 0.5,
          borderRadius: 2,
          textDecoration: 'none',
          color: 'inherit',
          // '&:hover': { backgroundColor: 'action.hover' }
        }}
      >
        <ListItemButton
          sx={{
            py: '8px',
            px: '12px',
            borderRadius: 2,
            position: 'relative',
            ...(isActive(item.href) && {
              backgroundColor: 'action.selected',
              color: 'primary.main',
              fontWeight: 600,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                backgroundColor: 'primary.main',
                borderRadius: '0 2px 2px 0'
              }
            })
          }}
        >
          <ListItemIcon sx={{
            minWidth: 40,
            color: isActive(item.href) ? 'primary.main' : 'inherit'
          }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.text}
            primaryTypographyProps={{
              fontSize: 15,
              fontWeight: isActive(item.href) ? 600 : 500
            }}
          />
        </ListItemButton>
      </ListItem>
    )
  }

  // Function to render a page item with selection styling
  const renderPageItem = (page: Page) => {
    const isSelected = isPageSelected(page.id)

    return (
      <ListItem
        key={page.id}
        onClick={(e) => handlePageClick(e, page)}
        secondaryAction={
          page.id !== '0' && page.name !== 'You' ? (
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => handleDeleteClick(e, page)}
              sx={{
                color: 'text.secondary',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                '&:hover': {
                  color: 'error.main',
                  bgcolor: 'error.light',
                  opacity: 1
                },
                '.MuiListItem-root:hover &': {
                  opacity: 0.7
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          ) : null
        }
        sx={{
          px: 1,
          py: 0.75,
          borderRadius: 1,
          textDecoration: 'none',
          color: 'inherit',
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: isSelected ? 'action.selected' : 'action.hover'
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 40, position: 'relative' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              page.isOnline ? (
                <DotIcon
                  sx={{
                    fontSize: 14,
                    color: '#44b700',
                    bgcolor: 'background.paper',
                    borderRadius: '50%'
                  }}
                />
              ) : null
            }
          >
            <Avatar
              src={page.profilePicture || undefined}
              sx={{
                bgcolor: page.avatarBgColor,
                width: 32,
                height: 32,
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {page.avatar}
            </Avatar>
          </Badge>
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'text.primary'
                }}
              >
                {page.name}
              </Typography>
              {isSelected && (
                <Box
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'success.main',
                    bgcolor: 'success.50',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'success.100'
                  }}
                >
                  Active
                </Box>
              )}
            </Box>
          }
          secondary={
            <Box>
              <Typography
                component="div"
                sx={{
                  fontSize: 11,
                  color: 'text.secondary'
                }}
              >
                {page.handle || page.category}
              </Typography>
              {page.isCompleted === 0 && page.id !== '0' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <WarningIcon sx={{ fontSize: 12, color: '#f59e0b' }} />
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 11,
                      color: '#f59e0b',
                      fontWeight: 500
                    }}
                  >
                    Incomplete Profile
                  </Typography>
                </Box>
              )}
            </Box>
          }
        />
      </ListItem>
    )
  }

  // Render login prompt for non-authenticated users
  const renderLoginPrompt = () => (
    <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'primary.light',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
          opacity: 0.8
        }}
      >
        <LoginIcon sx={{ fontSize: 32, color: 'primary.main' }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sign in to access your profile, pages, and more features
      </Typography>
      <Button
        fullWidth
        variant="contained"
        startIcon={<LoginIcon />}
        onClick={() => showLoginPrompt('access all features')}
        sx={{
          py: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          bgcolor: '#1e40af',
          '&:hover': {
            bgcolor: '#1e3a8a'
          }
        }}
      >
        Sign In
      </Button>
    </Box>
  )

  return (
    <>
      <Box sx={{
        width: temporary ? 300 : '100%',
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: temporary ? 'none' : '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {temporary && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            p: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}>
            {/* Mobile Search - only show in temporary (drawer) mode */}
            {temporary && (
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Box
                  component="form"
                  onSubmit={handleSearch}
                  sx={{
                    position: 'relative',
                    borderRadius: 3,
                    backgroundColor: mode === 'light' ? alpha('#000', 0.05) : alpha('#fff', 0.1),
                    '&:hover': { backgroundColor: mode === 'light' ? alpha('#000', 0.08) : alpha('#fff', 0.15) },
                    display: 'flex',
                    alignItems: 'center',
                    border: '2px solid transparent',
                    '&:focus-within': {
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <Box sx={{
                    padding: '0 10px',
                    height: '100%',
                    position: 'absolute',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </Box>
                  <InputBase
                    placeholder="Search BitoCircle"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      color: 'text.primary',
                      width: '100%',
                      '& .MuiInputBase-input': {
                        padding: '10px 32px 10px 0',
                        paddingLeft: 'calc(1em + 28px)',
                        fontSize: 14
                      }
                    }}
                  />
                  {searchQuery && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{
                        position: 'absolute',
                        right: 8,
                        p: 0.5,
                        '&:hover': { bgcolor: alpha('#000', 0.1) }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
            )}

            {/* Main Navigation Items */}
            <List sx={{ py: 1, px: 1 }}>
              {mainNavItems.map((item, index) => renderNavItem(item, index))}
            </List>

            {/* Mobile-only Navigation Items (Finance Hub, Advertise, Monetize, Marketplaces) */}
            {(temporary || isMobile) && (
              <>
                <Divider sx={{ mx: 2, my: 1 }} />
                <Box sx={{ px: 2, py: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}
                  >
                    More
                  </Typography>
                </Box>
                <List sx={{ py: 0, px: 1 }}>
                  {mobileNavItems.map((item, index) => renderNavItem(item, index))}
                </List>
              </>
            )}

            {/* Show login prompt or authenticated content */}
            {!isAuthenticated ? (
              renderLoginPrompt()
            ) : (
              <>
                <Box sx={{ mt: 2, px: 2 }}>
                  {businessStatus === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        fullWidth
                        onClick={() => {
                          if (!requireAuth('access Business Owner Panel')) return
                          window.open(
                            `https://launch-platform.paybito.com?app=${encodeURIComponent(
                              localStorage.getItem('appData') || ''
                            )}`,
                            '_blank'
                          )
                        }}
                        sx={{
                          py: 1,
                          background: 'linear-gradient(135deg, #0916fdff 0%, #ff3333 100%)',
                          color: '#fafafaff',
                          textTransform: 'none',
                          fontSize: 13,
                          fontWeight: 600,
                          borderRadius: 2,
                          border: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                          },
                        }}
                      >
                        My Business Owner Panel
                      </Button>
                    </Box>
                  )}

                  {businessStatus === 2 && (
                    <Button
                      fullWidth
                      // onClick={() => {
                      //   if (!requireAuth('access Business Owner Panel')) return
                      //   window.location.href = 'https://institutional-bo.paybito.com/build-your-exchange.html'
                      // }}
                      onClick={() => {
                        if (!requireAuth('access Business Owner Panel')) return
                        window.open(
                          `https://launch-platform.paybito.com?app=${encodeURIComponent(
                            localStorage.getItem('appData') || ''
                          )}`,
                          '_blank'
                        )
                      }}
                      sx={{
                        mb: 0,
                        py: 1.2,
                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                        color: '#fafafaff',
                        textTransform: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        borderRadius: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                          background: 'linear-gradient(135deg, #059669 0%, #0891b2 100%)',
                        },
                      }}
                    >
                      My Business Owner Panel
                    </Button>
                  )}
                </Box>

                <Box sx={{ mt: 2, px: 2 }}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5
                  }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        fontSize: 13,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}
                    >
                      Your Pages
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={handleRefreshPages}
                        disabled={isLoadingPages}
                        sx={{
                          padding: 0.5,
                          color: 'text.secondary',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <RefreshIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                        onClick={handleCreatePage}
                        sx={{
                          bgcolor: 'primary.dark',
                          color: 'white',
                          textTransform: 'none',
                          fontSize: 12,
                          fontWeight: 600,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            filter: 'brightness(1.1)'
                          }
                        }}
                      >
                        Create
                      </Button>
                    </Box>
                  </Box>

                  {isLoadingPages && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  )}

                  {pagesError && (
                    <Alert
                      severity="error"
                      sx={{ mb: 1 }}
                      onClose={() => setPagesError(null)}
                    >
                      {pagesError}
                    </Alert>
                  )}

                  {!isLoadingPages && (
                    <List sx={{ p: 0 }}>
                      {userPages.slice(0, showAllPages ? userPages.length : 3).map((page) => (
                        renderPageItem(page)
                      ))}

                      {userPages.length > 3 && (
                        <ListItem
                          onClick={() => setShowAllPages(!showAllPages)}
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            '&:hover': {
                              bgcolor: 'action.hover'
                            },
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                        >
                          <ListItemButton
                            sx={{
                              py: 0.5,
                              px: 1,
                              borderRadius: 1,
                              '&:hover': {
                                bgcolor: 'transparent'
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'action.disabledBackground',
                                  borderRadius: '50%'
                                }}
                              >
                                {showAllPages ? (
                                  <KeyboardArrowDown sx={{ fontSize: 20, color: 'text.secondary' }} />
                                ) : (
                                  <KeyboardArrowRight sx={{ fontSize: 20, color: 'text.secondary' }} />
                                )}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={showAllPages ? 'Show less' : `Show ${userPages.length - 3} more`}
                              primaryTypographyProps={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: 'primary.main'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      )}
                    </List>
                  )}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Bottom user section - only show when authenticated */}
        {isAuthenticated && (
          <Box sx={{
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              p: 0.5,
              m: 0.5,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: 'action.selected'
              }
            }}>
              <Avatar
                src={userProfile.profilePicture || undefined}
                sx={{
                  bgcolor: '#4267b2',
                  width: 30,
                  height: 30,
                  fontSize: 12,
                  fontWeight: 600,
                  mr: 1
                }}
              >
                {(userProfile.fullName?.[0] || brokerDetails?.firstName?.[0] || 'A').toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.primary'
                  }}
                >
                  {userProfile.fullName || `${brokerDetails?.firstName} ${brokerDetails?.lastName}`}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: 11,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {userProfile.username || brokerDetails?.brokerId}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Page
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              src={pageToDelete?.profilePicture || undefined}
              sx={{
                bgcolor: pageToDelete?.avatarBgColor,
                width: 48,
                height: 48,
                fontSize: 16,
                fontWeight: 600
              }}
            >
              {pageToDelete?.avatar}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {pageToDelete?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageToDelete?.handle || pageToDelete?.category}
              </Typography>
            </Box>
          </Box>
          <DialogContentText>
            Are you sure you want to delete this page? This action cannot be undone and all content associated with this page will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
            sx={{
              textTransform: 'none',
              borderRadius: 2
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <CreatePostDialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        onPostCreated={handlePostCreate}
      />

      <CreateReelDialog
        open={openReelDialog}
        onClose={() => setOpenReelDialog(false)}
        onPublish={handleReelPublish}
      />

      <CreatePageDialog
        open={openPageDialog}
        onClose={() => setOpenPageDialog(false)}
        onCreate={handlePageCreate}
      />

      <SwitchAccountDialog
        open={switchAccountDialog.open}
        onClose={() => setSwitchAccountDialog({ open: false, page: null })}
        onSwitch={handleSwitchAccount}
        pageName={switchAccountDialog.page?.name || ''}
        pageAvatar={switchAccountDialog.page?.avatar}
        pageAvatarBgColor={switchAccountDialog.page?.avatarBgColor}
        pageCategory={switchAccountDialog.page?.category || switchAccountDialog.page?.handle}
        profilePicture={switchAccountDialog.page?.profilePicture}
      />

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        severity={snackbarSeverity}
      />
    </>
  )
}

export default Sidebar