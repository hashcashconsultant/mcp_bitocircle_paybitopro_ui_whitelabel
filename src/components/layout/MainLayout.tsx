// app/components/MainLayout.tsx
'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material'
import Sidebar from './Sidebar'
import TopNavigation from './TopNavigation'
import BitoHubPopup from './BitoHubPopup'
import { useAuthRedirect } from '../../hooks/useAuthRedirect'
import { useAuth } from '@/contexts/AuthContext'
import CreatePostDialog from '@/components/CreatePostDialog'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

interface MainLayoutProps {
  children: React.ReactNode
  // If true, allows unauthenticated users to view the page
  allowPublicAccess?: boolean
  hideScrollbar?: boolean
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, 
  allowPublicAccess = false,
  hideScrollbar = false  // Default to showing scrollbar

 }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [showPromoPopup, setShowPromoPopup] = useState(false)
  const [openPostDialog, setOpenPostDialog] = useState(false)
  const [isRewardReceived, setIsRewardReceived] = useState<number | null>(null)
  const [isCheckingReward, setIsCheckingReward] = useState(false)
  const [rewardAmount, setRewardAmount] = useState<number>(5)
  const [hasMadeFirstPost, setHasMadeFirstPost] = useState<number>(0)
  const [profileStatus, setProfileStatus] = useState<number>(1)
  const { isAuthenticated } = useAuth()
  
  const handlePostCreate = (data: unknown) => {
    console.log('Creating post with data:', data)
  }
  
  // Only use auth redirect if not allowing public access
  const { isLoading: isAuthLoading } = useAuthRedirect({ 
    skipRedirect: allowPublicAccess 
  })

  // Fetch reward status from API
  const fetchRewardStatus = async () => {
    const uuid = localStorage.getItem('uuid')
    const pageId = localStorage.getItem('pageId') || '0'

    if (!uuid) return

    setIsCheckingReward(true)

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
        // Get isRewardReceived from API response
        localStorage.setItem('bitoHubIsRewardReceived', result.data.isRewardReceived)
        localStorage.setItem('bitoHubRewardAmount', result.data.rewardAmount)

        const rewardStatus = result.data.isRewardReceived ?? 1
        setIsRewardReceived(rewardStatus)
        setRewardAmount(result.data.rewardAmount || 5)
        setHasMadeFirstPost(result.data.hasMadeFirstPost || 0)
        setProfileStatus(result.data.status || 1)
      }
    } catch (error) {
      console.error('Error fetching reward status:', error)
      setIsRewardReceived(0) // Default to 0 on error
    } finally {
      setIsCheckingReward(false)
    }
  }

  // Fetch reward status when authenticated
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchRewardStatus()
    }
  }, [isAuthLoading, isAuthenticated])

  // Show popup based on isRewardReceived status
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && !isCheckingReward && isRewardReceived !== null) {
      const isDismissed = localStorage.getItem('bitoHubPopupDismissed')
      const isClaimed = localStorage.getItem('bitoHubPopupClaimed')
      
      // Only show popup if isRewardReceived === 0 and not dismissed
      if (isRewardReceived === 0 && isDismissed !== 'true' && isClaimed !== 'true') {
        setShowPromoPopup(true)
      } else {
        setShowPromoPopup(false)
      }
    }
  }, [isAuthLoading, isAuthenticated, isCheckingReward, isRewardReceived])

  const handleClaimProfile = () => {
    console.log('User clicked claim profile')
    localStorage.setItem('bitoHubPopupClaimed', 'true')
    setShowPromoPopup(false)
    
    // If user has already made first post, redirect to profile page
    // Otherwise, open the create post dialog
    if (hasMadeFirstPost === 1) {
      window.location.href = '/profile'
    } else {
      setOpenPostDialog(true)
    }
  }

  const handleDismissPopup = () => {
    console.log('User dismissed the promotional offer')
    localStorage.setItem('bitoHubPopupDismissed', 'true')
    setShowPromoPopup(false)
    localStorage.setItem('bitoHubPopupDismissedAt', new Date().toISOString())
  }

  // Show loading state while checking auth (only for protected pages)
  if (isAuthLoading && !allowPublicAccess) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      bgcolor: 'background.default',
      overflow: 'hidden'
    }}>
      {/* Top Navigation - All screen sizes */}
      <TopNavigation />

      {/* Main Content Area with Sidebar */}
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Desktop Only */}
        {!isMobile && (
          <Box sx={{ 
            width: 300,
            flexShrink: 0,
            height: '100%',
            overflow: 'auto',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}>
            <Sidebar />
          </Box>
        )}

        {/* Main Content */}
          <Box
    component="main"
    sx={{
      flex: 1,
      overflow: 'auto',
      bgcolor: 'background.default',
      height: '100%',
      // Conditionally hide scrollbar
      ...(hideScrollbar && {
        '&::-webkit-scrollbar': {
          display: 'none',
          width: 0,
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }),
    }}
  >
    {children}
  </Box>
      </Box>

      {/* Promotional Popup Overlay - Only show if isRewardReceived === 0 */}
      {showPromoPopup && isAuthenticated && (
        <BitoHubPopup 
          onClaim={handleClaimProfile}
          onDismiss={handleDismissPopup}
          rewardAmount={rewardAmount}
          hasMadeFirstPost={hasMadeFirstPost}
          profileStatus={profileStatus}
        />
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog 
        open={openPostDialog} 
        onClose={() => setOpenPostDialog(false)}
        onPostCreated={handlePostCreate}
      />
    </Box>
  )
}

export default MainLayout

// Keep your existing helper functions
export const resetBitoHubPopup = () => {
  localStorage.removeItem('bitoHubPopupDismissed')
  localStorage.removeItem('bitoHubPopupClaimed')
  localStorage.removeItem('bitoHubPopupDismissedAt')
  window.location.reload()
}

export const shouldShowPopupAgain = (daysToWait: number = 7): boolean => {
  const dismissedAt = localStorage.getItem('bitoHubPopupDismissedAt')
  if (!dismissedAt) return true
  
  const dismissedDate = new Date(dismissedAt)
  const currentDate = new Date()
  const daysPassed = (currentDate.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
  
  return daysPassed >= daysToWait
}