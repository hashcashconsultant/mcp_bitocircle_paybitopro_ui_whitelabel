'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery,
  Skeleton,
  Alert
} from '@mui/material'
import {
  Close as CloseIcon,
  Favorite as LikeIcon,
  CheckCircle as VerifiedIcon
} from '@mui/icons-material'

// ==================== TYPES ====================

export interface LikedUser {
  userId: number
  pageId: number
  username: string
  fullName: string
  profilePicture: string | null
  isUserFollowing: number // 1 = following, 0 = not following
  isVerified?: boolean
  engagementScore?: number
}

interface LikesListResponse {
  success: boolean
  message: string
  data: {
    posts: Array<{
      userId: number
      pageId: number
      username: string
      fullName: string
      profilePicture: string | null
      isUserFollowing: number
      isVerified?: boolean
      engagementScore?: number
      isThirdParty?: string
      campaignId?: number
      isBanneredPost?: number
      visibilityType?: number
      taggedUsersCount?: number
    }>
    totalRecords: number
  }
  errorCode: string | null
  totalRecords: number | null
}

interface LikesListDialogProps {
  open: boolean
  onClose: () => void
  contentId: number
  contentType: string // 'POST' | 'REEL' | 'VIDEO' | 'PHOTO' | 'POLL' etc.
  totalLikes?: number
  onFollowSuccess?: (message: string) => void
  onFollowError?: (message: string) => void
}

// ==================== SKELETON LOADER ====================

const UserListSkeleton: React.FC = () => (
  <>
    {[1, 2, 3, 4, 5].map((item) => (
      <ListItem key={item} sx={{ px: 0 }}>
        <ListItemAvatar>
          <Skeleton variant="circular" width={48} height={48} />
        </ListItemAvatar>
        <ListItemText
          primary={<Skeleton variant="text" width={120} />}
          secondary={<Skeleton variant="text" width={80} />}
        />
        <ListItemSecondaryAction>
          <Skeleton variant="rounded" width={80} height={32} />
        </ListItemSecondaryAction>
      </ListItem>
    ))}
  </>
)

// ==================== MAIN COMPONENT ====================

const LikesListDialog: React.FC<LikesListDialogProps> = ({
  open,
  onClose,
  contentId,
  contentType,
  totalLikes,
  onFollowSuccess,
  onFollowError
}) => {
  const theme = useTheme()
  const router = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const listContainerRef = useRef<HTMLDivElement>(null)

  // State
  const [users, setUsers] = useState<LikedUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentOffset, setCurrentOffset] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [followingStates, setFollowingStates] = useState<Record<number, boolean>>({})
  const [loadingFollowIds, setLoadingFollowIds] = useState<Set<number>>(new Set())

  const LIMIT = 10

  // Get current user info
  const getCurrentUserId = () => {
    return localStorage.getItem('childUserId') || localStorage.getItem('userId') || ''
  }

  const getCurrentUserType = () => {
    return localStorage.getItem('userType') || 'USER'
  }

  // Fetch likes list
  const fetchLikesList = useCallback(async (offset: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const viewerId = getCurrentUserId()
      const viewerType = getCurrentUserType()

      const url = `https://institutional-bo.paybito.com:8443/BitohubService/post/getEngagementDetailsByContent?viewerId=${viewerId}&viewerType=${viewerType}&contentId=${contentId}&contentType=${contentType}&offset=${offset}&limit=${LIMIT}`

      const response = await fetchWithAuth(url, {
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: LikesListResponse = await response.json()

      if (result.success && result.data) {
        const newUsers: LikedUser[] = result.data.posts.map(user => ({
          userId: user.userId,
          pageId: user.pageId,
          username: user.username,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          isUserFollowing: user.isUserFollowing,
          isVerified: user.isVerified,
          engagementScore: user.engagementScore
        }))

        // Update following states
        const newFollowingStates: Record<number, boolean> = {}
        newUsers.forEach(user => {
          newFollowingStates[user.userId] = user.isUserFollowing === 1
        })

        if (append) {
          setUsers(prev => [...prev, ...newUsers])
          setFollowingStates(prev => ({ ...prev, ...newFollowingStates }))
        } else {
          setUsers(newUsers)
          setFollowingStates(newFollowingStates)
        }

        setTotalRecords(result.data.totalRecords)
        setHasMore(newUsers.length === LIMIT && (offset * LIMIT) < result.data.totalRecords)
        setCurrentOffset(offset)
      } else {
        throw new Error(result.message || 'Failed to load likes')
      }
    } catch (err) {
      console.error('Error fetching likes list:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError('Network error. Please check your connection.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to load likes. Please try again.')
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [contentId, contentType])

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      setUsers([])
      setCurrentOffset(1)
      setHasMore(true)
      fetchLikesList(1, false)
    }
  }, [open, contentId, contentType, fetchLikesList])

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchLikesList(currentOffset + 1, true)
    }
  }

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    const container = listContainerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const threshold = 100

    if (scrollHeight - scrollTop - clientHeight < threshold && hasMore && !isLoadingMore) {
      handleLoadMore()
    }
  }, [hasMore, isLoadingMore])

  // Handle follow/unfollow
  const handleFollowToggle = async (user: LikedUser) => {
    const currentUserId = getCurrentUserId()
    if (!currentUserId) {
      onFollowError?.('Please login to follow users')
      return
    }

    // Don't allow following yourself
    if (Number(currentUserId) === user.userId) {
      return
    }

    setLoadingFollowIds(prev => new Set(prev).add(user.userId))

    try {
      const followerId = localStorage.getItem('childPageId')
      const followerType = localStorage.getItem('userType') || 'USER'

      const followingId = (user.pageId && user.pageId !== 0) ? user.pageId : user.userId

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/followUnfollowUser',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followerId: followerId,
            followingId: followingId.toString(),
            followerType: followerType,
            followingType: 'USER'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const newFollowingState = !followingStates[user.userId]
        setFollowingStates(prev => ({
          ...prev,
          [user.userId]: newFollowingState
        }))

        onFollowSuccess?.(
          newFollowingState
            ? `Now following ${user.fullName}`
            : `Unfollowed ${user.fullName}`
        )
      } else {
        throw new Error(result.message || 'Failed to follow/unfollow user')
      }
    } catch (err) {
      console.error('Error in follow/unfollow:', err)
      
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        onFollowError?.('Network error. Please check your connection.')
      } else if (err instanceof Error) {
        onFollowError?.(err.message)
      } else {
        onFollowError?.('Failed to update follow status. Please try again.')
      }
    } finally {
      setLoadingFollowIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(user.userId)
        return newSet
      })
    }
  }

  // Handle profile navigation
  const handleProfileClick = (user: LikedUser) => {
    const currentUserId = getCurrentUserId()
    
    if (currentUserId && Number(currentUserId) === user.userId) {
      router.push('/profile')
    } else {
      router.push(`/public/${user.userId}/${user.pageId}`)
    }
    
    onClose()
  }

  // Check if user is current user
  const isCurrentUser = (userId: number): boolean => {
    const currentUserId = getCurrentUserId()
    return currentUserId ? Number(currentUserId) === userId : false
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: isMobile ? '100%' : '70vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5,
          px: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LikeIcon sx={{ color: '#ef4444', fontSize: 24 }} />
          <Typography variant="h6" fontWeight={600}>
            Likes
          </Typography>
          {(totalLikes !== undefined || totalRecords > 0) && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                bgcolor: 'action.hover',
                px: 1,
                py: 0.25,
                borderRadius: 1,
                fontSize: '0.75rem'
              }}
            >
              {totalLikes ?? totalRecords}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent
        ref={listContainerRef}
        onScroll={handleScroll}
        sx={{
          p: 0,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px'
          }
        }}
      >
        {/* Error State */}
        {error && !isLoading && (
          <Box sx={{ p: 2 }}>
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => fetchLikesList(1, false)}
                >
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Loading State */}
        {isLoading && (
          <List sx={{ px: 2, py: 1 }}>
            <UserListSkeleton />
          </List>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              px: 2
            }}
          >
            <LikeIcon
              sx={{
                fontSize: 64,
                color: 'text.disabled',
                mb: 2
              }}
            />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              No likes yet
            </Typography>
            <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ mt: 0.5 }}>
              Be the first to like this post!
            </Typography>
          </Box>
        )}

        {/* Users List */}
        {!isLoading && users.length > 0 && (
          <List sx={{ px: 2, py: 1 }}>
            {users.map((user, index) => (
              <React.Fragment key={`${user.userId}-${index}`}>
                <ListItem
                  sx={{
                    px: 0,
                    py: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  {/* Avatar */}
                  <ListItemAvatar onClick={() => handleProfileClick(user)}>
                    <Avatar
                      src={user.profilePicture || undefined}
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: user.profilePicture ? 'transparent' : 'primary.main',
                        cursor: 'pointer'
                      }}
                    >
                      {!user.profilePicture && user.fullName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>

                  {/* User Info */}
                  <ListItemText
                    onClick={() => handleProfileClick(user)}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: { xs: 120, sm: 200 },
                            cursor: 'pointer',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {user.fullName}
                        </Typography>
                        {user.isVerified && (
                          <VerifiedIcon
                            sx={{
                              fontSize: 16,
                              color: '#1d9bf0'
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: { xs: 120, sm: 200 }
                        }}
                      >
                        {user.username}
                      </Typography>
                    }
                  />

                  {/* Follow/Unfollow Button */}
                  <ListItemSecondaryAction>
                    {!isCurrentUser(user.userId) && (
                      <Button
                        variant={followingStates[user.userId] ? 'outlined' : 'contained'}
                        size="small"
                        onClick={() => handleFollowToggle(user)}
                        disabled={loadingFollowIds.has(user.userId)}
                        sx={{
                          minWidth: 90,
                          textTransform: 'none',
                          borderRadius: 2,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          ...(followingStates[user.userId] && {
                            borderColor: 'divider',
                            color: 'text.primary',
                            '&:hover': {
                              borderColor: '#ef4444',
                              color: '#ef4444',
                              bgcolor: 'rgba(239, 68, 68, 0.04)'
                            }
                          }),
                          ...(!followingStates[user.userId] && {
                            bgcolor: '#1e40af',
                            '&:hover': {
                              bgcolor: '#1e3a8a'
                            }
                          })
                        }}
                      >
                        {loadingFollowIds.has(user.userId) ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : followingStates[user.userId] ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
                      </Button>
                    )}
                    {isCurrentUser(user.userId) && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          bgcolor: 'action.hover',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1
                        }}
                      >
                        You
                      </Typography>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>

                {index < users.length - 1 && (
                  <Divider variant="inset" component="li" />
                )}
              </React.Fragment>
            ))}

            {/* Load More Indicator */}
            {isLoadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* Load More Button (optional, in case infinite scroll doesn't trigger) */}
            {!isLoadingMore && hasMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleLoadMore}
                  sx={{ textTransform: 'none' }}
                >
                  Load more
                </Button>
              </Box>
            )}

            {/* End of List Message */}
            {!hasMore && users.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  py: 2
                }}
              >
                {users.length === totalRecords
                  ? `Showing all ${totalRecords} likes`
                  : 'No more likes to load'}
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default LikesListDialog