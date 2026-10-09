'use client'
import React, { useState } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  PersonRemove as UnfollowIcon,
  PersonAdd as FollowIcon,
  Link as LinkIcon,
  BookmarkBorder as SaveIcon,
  NotInterested as NotInterestedIcon,
  Flag as ReportIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import ReportDialog from './ReportDialog'

export interface PostOptionsMenuProps {
  anchorEl: HTMLElement | null
  open: boolean
  onClose: () => void
  postId: number
  userName: string
  isOwnPost?: boolean
  isFollowing?: boolean
  contentType?: string  // Added to determine URL format (REEL, PHOTO, VIDEO, TEXT, POLL)
  userId?: number       // Post owner's userId - used for URL construction and contentOwnerId
  pageId?: number       // Added for URL construction
  onFollow?: () => void
  onUnfollow?: () => void
  onCopyLink?: () => void
  onSave?: () => void
  onNotInterested?: (postId: number) => void  // Callback to notify parent to remove/hide post
  onReport?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

// Menu options for OTHER users' posts - dynamic based on follow status
const getOtherUserMenuOptions = (isFollowing: boolean) => [
  {
    id: 'followToggle',
    label: isFollowing ? 'Unfollow' : 'Follow',
    icon: isFollowing ? UnfollowIcon : FollowIcon,
    action: isFollowing ? 'onUnfollow' : 'onFollow',
    showDividerAfter: false
  },
  {
    id: 'copyLink',
    label: 'Copy link',
    icon: LinkIcon,
    action: 'onCopyLink',
    showDividerAfter: false
  },
  {
    id: 'save',
    label: 'Save post',
    icon: SaveIcon,
    action: 'onSave',
    showDividerAfter: true
  },
  {
    id: 'notInterested',
    label: 'Not interested',
    icon: NotInterestedIcon,
    action: 'onNotInterested',
    showDividerAfter: false
  },
  {
    id: 'report',
    label: 'Report post',
    icon: ReportIcon,
    action: 'onReport',
    showDividerAfter: false,
    danger: true
  }
]

// Menu options for OWN posts
const ownPostMenuOptions = [
  {
    id: 'edit',
    label: 'Edit post',
    icon: EditIcon,
    action: 'onEdit',
    showDividerAfter: false
  },
  {
    id: 'copyLink',
    label: 'Copy link',
    icon: LinkIcon,
    action: 'onCopyLink',
    showDividerAfter: true
  },
  {
    id: 'delete',
    label: 'Delete post',
    icon: DeleteIcon,
    action: 'onDelete',
    showDividerAfter: false,
    danger: true
  }
]

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = ({
  anchorEl,
  open,
  onClose,
  postId,
  userName,
  isOwnPost = false,
  isFollowing = false,
  contentType,
  userId,
  pageId,
  onFollow,
  onUnfollow,
  onCopyLink,
  onSave,
  onNotInterested,
  onReport,
  onEdit,
  onDelete
}) => {
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [isNotInterestedLoading, setIsNotInterestedLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handlers: Record<string, (() => void) | undefined> = {
    onFollow,
    onUnfollow,
    onCopyLink,
    onSave,
    onReport,
    onEdit,
    onDelete
  }

  // Select menu options based on post ownership
  // For other users' posts, use dynamic options based on follow status
  const menuOptions = isOwnPost ? ownPostMenuOptions : getOtherUserMenuOptions(isFollowing)

  // Handle Not Interested API call
  const handleNotInterested = async () => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    
    if (!currentUserId) {
      setSnackbar({
        open: true,
        message: 'Please login to perform this action',
        severity: 'error'
      })
      onClose()
      return
    }

    if (!userId) {
      setSnackbar({
        open: true,
        message: 'Unable to process request. Post owner information is missing.',
        severity: 'error'
      })
      onClose()
      return
    }

    setIsNotInterestedLoading(true)

    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/markAsNotInterested',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(currentUserId),
            contentId: postId,
            contentOwnerId: userId,
            contentType: contentType || 'POST',
            reason: '',
            content: '',
            hashtags: '',
            status: 'ACTIVE'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message || 'Post marked as not interested',
          severity: 'success'
        })
        
        // Notify parent component to remove/hide the post from feed
        if (onNotInterested) {
          onNotInterested(postId)
        }
      } else {
        throw new Error(result.message || 'Failed to mark post as not interested')
      }
    } catch (error) {
      console.error('Error marking post as not interested:', error)
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setSnackbar({
          open: true,
          message: 'Network error. Please check your connection.',
          severity: 'error'
        })
      } else if (error instanceof Error) {
        setSnackbar({
          open: true,
          message: error.message,
          severity: 'error'
        })
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to mark post as not interested. Please try again.',
          severity: 'error'
        })
      }
    } finally {
      setIsNotInterestedLoading(false)
      onClose()
    }
  }

  const handleMenuItemClick = (action: string) => {
    if (action === 'onReport') {
      setReportDialogOpen(true)
      onClose()
      return
    }

    if (action === 'onNotInterested') {
      handleNotInterested()
      return
    }

    const handler = handlers[action]
    if (handler) {
      handler()
    }
    onClose()
  }

  const handleCopyLink = () => {
    // Construct the proper URL based on content type
    const baseUrl = 'https://www.bitocircle.com'
    const userIdParam = userId || 0
    const pageIdParam = pageId || 0
    
    // Check if content type is REEL (case-insensitive)
    const isReel = contentType?.toUpperCase() === 'REEL'
    
    // Build the URL
    let postUrl = `${baseUrl}/post/${postId}/${userIdParam}/${pageIdParam}`
    
    // Append ?REEL query param if it's a reel
    if (isReel) {
      postUrl += '?REEL'
    }
    
    navigator.clipboard.writeText(postUrl).then(() => {
      setSnackbar({
        open: true,
        message: 'Link copied to clipboard',
        severity: 'success'
      })
    }).catch(err => {
      console.error('Failed to copy link:', err)
      setSnackbar({
        open: true,
        message: 'Failed to copy link',
        severity: 'error'
      })
    })
    onClose()
  }

  // ReportDialog calls onSubmit(success: boolean, message: string)
  const handleReportSubmit = (success: boolean, message: string) => {
    console.log('ReportDialog onSubmit:', { postId, success, message })

    if (success) {
      setSnackbar({
        open: true,
        message: message || 'Thank you for your report. We\'ll review it soon.',
        severity: 'info'
      })
    } else {
      setSnackbar({
        open: true,
        message: message || 'Failed to submit report. Please try again.',
        severity: 'error'
      })
    }

    // Also call the optional onReport prop to let parent know a report action occurred
    if (onReport) {
      try {
        onReport()
      } catch (err) {
        // swallow any errors from optional handler
        console.error('onReport handler threw an error:', err)
      }
    }
  }

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Build menu items array without fragments
  const renderMenuItems = () => {
    const items: React.ReactNode[] = []
    
    menuOptions.forEach((option, index) => {
      // Add the menu item
      items.push(
        <MenuItem
          key={option.id}
          onClick={() => {
            if (option.id === 'copyLink') {
              handleCopyLink()
            } else {
              handleMenuItemClick(option.action)
            }
          }}
          disabled={option.id === 'notInterested' && isNotInterestedLoading}
          sx={{
            color: option.danger ? 'error.main' : 'text.primary',
            '&:hover': {
              backgroundColor: option.danger 
                ? 'rgba(211, 47, 47, 0.04)' 
                : 'action.hover'
            }
          }}
        >
          <ListItemIcon 
            sx={{ 
              minWidth: '36px !important',
              color: option.danger ? 'error.main' : 'text.secondary'
            }}
          >
            {option.id === 'notInterested' && isNotInterestedLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <option.icon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={
              option.id === 'followToggle' 
                ? `${option.label} ${userName}`
                : option.id === 'notInterested' && isNotInterestedLoading
                  ? 'Processing...'
                  : option.label
            }
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: option.danger ? 500 : 400
            }}
          />
        </MenuItem>
      )
      
      // Add divider if needed
      if (option.showDividerAfter) {
        items.push(
          <Divider key={`divider-${option.id}`} sx={{ my: 0.5 }} />
        )
      }
    })
    
    return items
  }

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        disableScrollLock={true}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            borderRadius: 2,
            mt: 1,
            overflow: 'visible',
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              gap: 1.5,
              fontSize: '0.95rem'
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiModal-backdrop': {
            backgroundColor: 'transparent'
          }
        }}
      >
        {renderMenuItems()}
      </Menu>

      {/* Report Dialog - Only show for other users' posts */}
      {!isOwnPost && (
        <ReportDialog
          open={reportDialogOpen}
          onClose={() => setReportDialogOpen(false)}
          contentType="post"
          contentId={postId}
          onSubmit={handleReportSubmit}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default PostOptionsMenu