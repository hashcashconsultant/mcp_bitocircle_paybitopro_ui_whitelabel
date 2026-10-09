'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useRouter } from 'next/navigation'


import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Zoom,
  useMediaQuery,
  useTheme,
  Link as MuiLink
} from '@mui/material'
import {
  MoreHoriz as MoreIcon,
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Poll as PollIcon,
  CheckCircle as CheckCircleIcon,
  CheckCircle as VerifiedIcon,
  LocationOn as LocationOnIcon,
    LocalOffer as TagIcon,
    Reply as SharedIcon
  
} from '@mui/icons-material'

import PostOptionsMenu from './PostOptionsMenu'
import { Campaign as SponsoredIcon } from '@mui/icons-material'
import SponsoredSection from './SponsoredSection'
import LikesListDialog from './LikesListDialog'  // <-- ADD THIS IMPORT


export interface PollOption {
  id: number
  text: string
  votes: number
}

export interface PollPostProps {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string
    isUserFollowing?: number
    isVerified?: boolean
    userId?: number
    pageId?: number          // ADD THIS
    entityType?: string      // ADD THIS
    profilePicture?: string

  }
  content: string
  contentType?: string
  question: string
  options: PollOption[]
  totalVotes: number
  hasVoted?: boolean
  votedOptionId?: number
  endTime?: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  onLike?: () => void
  onSave?: () => void
  onComment?: () => void
  onShare?: () => void
  onMoreOptions?: () => void
  onVote?: (optionId: number) => void
  onFollow?: () => void
  onUnfollow?: () => void
  onFollowSuccess?: (message: string) => void
  onFollowError?: (message: string) => void
  onEdit?: () => void
  onDelete?: () => void
  onNotInterested?: () => void
  location?: string | null
  // Tagged users fields
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: number

  isSharedPost?: boolean
  shareId?: number
  sharedByUserId?: number
  sharerUserName?: string
  sharerFullName?: string
  sharerProfilePicture?: string
  shareMessage?: string
  shareCreatedAt?: string
  isCommentAllowed?: number
  isGifAllowed?: number

  
}

const PollPostComponent: React.FC<PollPostProps> = ({
  id,
  user,
  content,
  contentType,
  question,
  options,
  totalVotes,
  hasVoted = false,
  votedOptionId,
  endTime,
  likes,
  comments,
  shares,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  onShare,
  onMoreOptions,
  onVote,
  onFollow,
  onUnfollow,
  onFollowSuccess,
  onFollowError,
  onEdit,
  onDelete,
  onNotInterested,
  location,
  taggedUserIds,
  taggedData,
  isTaggedPost,
  isSharedPost = false,
  sharedByUserId,
  sharerUserName,
  sharerFullName,
  sharerProfilePicture,
  shareMessage,
  shareCreatedAt,
  isCommentAllowed = 1,
  isGifAllowed = 1
  

}) => {
  const theme = useTheme()
    const router = useRouter()
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isDark = theme.palette.mode === 'dark'
  const [selectedOption, setSelectedOption] = useState<number | null>(votedOptionId || null)
  const [localHasVoted, setLocalHasVoted] = useState(hasVoted)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [isFollowing, setIsFollowing] = useState((user.isUserFollowing === 1) || false)
  const [isHoveringFollow, setIsHoveringFollow] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isOwnPost, setIsOwnPost] = useState(false)
  
  // ADD THIS: Likes dialog state
  const [likesDialogOpen, setLikesDialogOpen] = useState(false)

  // Check if current user shared this post
  const isSharedByMe = () => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    return currentUserId && sharedByUserId && Number(currentUserId) === sharedByUserId
  }

  // Check if this is the current user's post
  useEffect(() => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    if (currentUserId && user.userId) {
      setIsOwnPost(Number(currentUserId) === user.userId)
    }
  }, [user.userId])
  // Update following state when user prop changes (e.g., after page reload)
  useEffect(() => {
    setIsFollowing(user.isUserFollowing === 1)
  }, [user.isUserFollowing])

  // Function to parse links in content
  const parseContentWithLinks = (text: string) => {
    if (!text) return null
    
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Check if it's a valid URL
        try {
          const url = new URL(part)
          const displayUrl = url.hostname + url.pathname
          
          return (
            <MuiLink
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                wordBreak: 'break-all',
                '&:hover': {
                  textDecoration: 'underline'
                }
              }}
            >
              {displayUrl}
            </MuiLink>
          )
        } catch {
          // If it's not a valid URL, return as plain text
          return <span key={index}>{part}</span>
        }
      }
      return <span key={index}>{part}</span>
    })
  }

  const handleVote = (optionId: number) => {
    if (!localHasVoted) {
      setSelectedOption(optionId)
      setLocalHasVoted(true)
      onVote?.(optionId)
    }
  }

  const getWinningOption = () => {
    return options.reduce((prev, current) =>
      (prev.votes > current.votes) ? prev : current
    )
  }

  const handleProfileClick = (e: React.MouseEvent) => {
      e.stopPropagation()
      
      const currentUserId = localStorage.getItem('childUserId')
      const profileId = user.userId
      const pageId = user.pageId
      
      // If it's the current user's profile, go to profile page
      if (currentUserId && profileId && Number(currentUserId) === profileId) {
        router.push('/profile')
      } else {
        // Otherwise go to public profile
        router.push(`/public/${profileId}/${pageId}`)
      }
    }

  // ADD THIS: Handler for likes count click
  const handleLikesCountClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likes > 0) {
      setLikesDialogOpen(true)
    }
  }

  // Replace the handleFollowToggle function with this:
  const handleFollowToggle = async () => {
    if (isFollowLoading) return

    try {
      setIsFollowLoading(true)

      const followerId = localStorage.getItem('childPageId')
      const followerType = localStorage.getItem('userType')

      if (!followerId) {
        onFollowError?.('Please login to follow users')
        return
      }

      // Determine followingId: if pageId is 0 or undefined, use userId
      const followingId = (user.pageId && user.pageId !== 0)
        ? user.pageId
        : user.userId

      if (!followingId) {
        onFollowError?.('User information not available')
        return
      }

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
            followerType: followerType || 'USER',
            followingType: user.entityType || 'USER'
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const newFollowingState = !isFollowing
        setIsFollowing(newFollowingState)

        if (user.userId) {
          if (newFollowingState) {
            onFollow?.()
          } else {
            onUnfollow?.()
          }
        }

        onFollowSuccess?.(newFollowingState
          ? `Now following ${user.name}`
          : `Unfollowed ${user.name}`)
      } else {
        throw new Error(result.message || 'Failed to follow/unfollow user')
      }
    } catch (error: unknown) {
      console.error('Error in follow/unfollow:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        onFollowError?.('Network error. Please check your connection.')
      } else if (error instanceof Error) {
        onFollowError?.(error.message)
      } else {
        onFollowError?.('Failed to update follow status. Please try again.')
      }
    } finally {
      setIsFollowLoading(false)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  // Handler for follow/unfollow from menu
  const handleFollowFromMenu = async () => {
    handleMenuClose()
    await handleFollowToggle()
  }

  const handleSavePost = () => {
    onSave?.()
  }

  const handleNotInterested = () => {
    console.log('Marking as not interested')
  }

  const handleReport = () => {
    console.log('Reporting post')
  }

  const handleEditPost = () => {
    console.log('Editing post:', id)
    onEdit?.()
    handleMenuClose()
  }

  const handleDeletePost = () => {
    console.log('Deleting post:', id)
    onDelete?.()
    handleMenuClose()
  }

  // Format tagged data for display
  const formatTaggedData = (data: string): string => {
    if (!data) return ''
    
    // Split by semicolon and get unique tagged users
    const tagParts = data.split(';').map(part => part.trim()).filter(Boolean)
    
    // Extract just the names being tagged (before "tagged in this post")
    const taggedNames: string[] = []
    tagParts.forEach(part => {
      const match = part.match(/^(.+?)\s+tagged in this post/)
      if (match && match[1]) {
        const name = match[1].trim()
        if (!taggedNames.includes(name)) {
          taggedNames.push(name)
        }
      }
    })
    
    if (taggedNames.length === 0) return ''
    
    if (taggedNames.length === 1) {
      return `with ${taggedNames[0]}`
    } else if (taggedNames.length === 2) {
      return `with ${taggedNames[0]} and ${taggedNames[1]}`
    } else {
      const displayNames = taggedNames.slice(0, 2)
      const remaining = taggedNames.length - 2
      return `with ${displayNames.join(', ')} and ${remaining} other${remaining > 1 ? 's' : ''}`
    }
  }

  const formattedTaggedText = taggedData ? formatTaggedData(taggedData) : ''

  const winningOption = localHasVoted ? getWinningOption() : null

  return (
    <>
      <Card sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      }}>
        <CardContent sx={{
          p: { xs: 2, sm: '16px !important' }
        }}>
          {/* Shared Post Indicator */}
                      {isSharedPost && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 1.5,
                            pb: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <SharedIcon
                            sx={{
                              fontSize: 16,
                              color: 'text.secondary',
                              transform: 'scaleX(-1)'
                            }}
                          />
                          <Avatar
                            src={sharerProfilePicture || undefined}
                            sx={{
                              width: 20,
                              height: 20,
                              fontSize: 10
                            }}
                          >
                            {!sharerProfilePicture && sharerFullName?.charAt(0)}
                          </Avatar>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            {isSharedByMe() ? (
                              <>
                                <strong>You</strong> shared this post
                              </>
                            ) : (
                              <>
                                <strong
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Navigate to sharer's profile if needed
                                  }}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {sharerFullName}
                                </strong>
                                {' '}shared this post
                              </>
                            )}
                            {shareCreatedAt && (
                              <span style={{ marginLeft: 4 }}>• {shareCreatedAt}</span>
                            )}
                          </Typography>
                        </Box>
                      )}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              src={user.profilePicture || undefined}
              sx={{
                bgcolor: user.profilePicture ? 'transparent' : user.avatarColor,
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                mr: 1.5,
                fontSize: { xs: 14, sm: 16 },
                fontWeight: 600
              }}
            >
              {!user.profilePicture && user.avatar}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography
                  variant="body1"
                  fontWeight={600}
                  onClick={handleProfileClick}
                  sx={{
                    lineHeight: 1.2,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  {user.name}
                </Typography>
                {user.isVerified && (
                  <VerifiedIcon
                    sx={{
                      fontSize: { xs: 16, sm: 18 },
                      color: '#1d9bf0'
                    }}
                  />
                )}
                 {/* Tagged users indicator */}
                                  {formattedTaggedText && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                      }}
                                    >
                                      <TagIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                                      {formattedTaggedText}
                                    </Typography>
                                  )}
                {/* Only show follow button if it's not own post */}
                {!isOwnPost && !isFollowing && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    sx={{
                      ml: 0.5,
                      minWidth: 'auto',
                      borderRadius: 1,
                      textTransform: 'none',
                      px: { xs: 0.75, sm: 1 },
                      py: 0.25,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontWeight: 600,
                      color: '#1e40af',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                      },
                      '&:disabled': {
                        color: '#9ca3af',
                      }
                    }}
                  >
                    • Follow
                  </Button>
                )}
                {!isOwnPost && isFollowing && (
                  <Button
                    variant="text"
                    size="small"
                    onMouseEnter={() => setIsHoveringFollow(true)}
                    onMouseLeave={() => setIsHoveringFollow(false)}
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    sx={{
                      ml: 0.5,
                      minWidth: 'auto',
                      borderRadius: 1,
                      textTransform: 'none',
                      px: { xs: 0.75, sm: 1 },
                      py: 0.25,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      fontWeight: 600,
                      color: isHoveringFollow ? '#ef4444' : '#6b7280',
                      '&:hover': {
                        bgcolor: isHoveringFollow
                          ? (isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)')
                          : (isDark ? 'rgba(107, 114, 128, 0.15)' : 'rgba(107, 114, 128, 0.08)'),
                      },
                      '&:disabled': {
                        color: '#9ca3af',
                      }
                    }}
                  >
                    • {isHoveringFollow ? 'Unfollow' : 'Following'}
                  </Button>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  lineHeight: 1.2,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {user.username} • {user.time} • <PollIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
              </Typography>
              {location && (
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    lineHeight: 1.2,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    mt: 0.25
                  }}
                >
                  <LocationOnIcon sx={{ fontSize: { xs: 10, sm: 12 } }} />
                  {location}
                </Typography>
              )}
            </Box>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>

          {content && (
            <Typography
              variant="body1"
              component="div"
              sx={{
                mb: 2,
                lineHeight: 1.6,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {parseContentWithLinks(content)}
            </Typography>
          )}

          <Card variant="outlined" sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2,
            bgcolor: isDark ? '#1f2937' : '#f8f9fa',
            borderColor: isDark ? '#374151' : '#e4e6ea'
          }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{
                mb: 2,
                fontSize: { xs: '1rem', sm: '1.1rem' }
              }}
            >
              {question}
            </Typography>

            {options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
              const isSelected = selectedOption === option.id
              const isWinning = winningOption?.id === option.id

              return (
                <Box key={option.id} sx={{ mb: 1.5 }}>
                  {!localHasVoted ? (
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleVote(option.id)}
                      sx={{
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderColor: isDark ? '#4b5563' : '#e4e6ea',
                        color: 'text.primary',
                        fontSize: { xs: '0.85rem', sm: '0.9rem' },
                        py: { xs: 1, sm: 1.25 },
                        px: 2,
                        '&:hover': {
                          borderColor: '#4267b2',
                          bgcolor: isDark ? 'rgba(66, 103, 178, 0.1)' : '#f0f8ff'
                        }
                      }}
                    >
                      {option.text}
                    </Button>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'relative',
                          bgcolor: isDark ? '#111827' : 'white',
                          border: '1px solid',
                          borderColor: isWinning ? '#42b883' : (isDark ? '#4b5563' : '#e4e6ea'),
                          borderRadius: 1,
                          overflow: 'hidden',
                          minHeight: { xs: 40, sm: 44 }
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: '100%',
                            bgcolor: 'transparent',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: isWinning ? 'rgba(66, 184, 131, 0.15)' : 'rgba(66, 103, 178, 0.1)'
                            }
                          }}
                        />

                        <Box
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            py: { xs: 1, sm: 1.25 },
                            zIndex: 1
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              sx={{
                                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {option.text}
                            </Typography>
                            {isSelected && (
                              <CheckCircleIcon sx={{ fontSize: 16, color: '#4267b2' }} />
                            )}
                            {isWinning && (
                              <Chip
                                label="Leading"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  bgcolor: '#42b883',
                                  color: 'white'
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: { xs: '0.8rem', sm: '0.85rem' },
                              fontWeight: 600,
                              color: isWinning ? '#42b883' : 'text.secondary'
                            }}
                          >
                            {percentage}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              )
            })}

            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 2,
              pt: 2,
              borderTop: isDark ? '1px solid #374151' : '1px solid #e4e6ea'
            }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
              >
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </Typography>
              {endTime && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  Ends {endTime}
                </Typography>
              )}
            </Box>
          </Card>

          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            color: 'text.secondary'
          }}>
            {/* Like Section */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {/* Like/Unlike Button */}
              <Zoom in={isLiked} timeout={300}>
                <Box sx={{ display: isLiked ? 'block' : 'none' }}>
                  <IconButton
                    size="small"
                    onClick={onLike}
                    sx={{ color: '#ef4444' }}
                  >
                    <LikedIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                </Box>
              </Zoom>
              {!isLiked && (
                <IconButton
                  size="small"
                  onClick={onLike}
                  sx={{ color: 'text.secondary' }}
                >
                  <LikeIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              )}

              {/* Clickable Likes Count */}
              <Box
                component="span"
                onClick={handleLikesCountClick}
                role={likes > 0 ? "button" : undefined}
                tabIndex={likes > 0 ? 0 : undefined}
                onKeyDown={(e) => {
                  if (likes > 0 && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    setLikesDialogOpen(true)
                  }
                }}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 14,
                  minHeight: 16,
                  px: 0.75,
                  py: 0.5,
                  ml: -0.5,
                  borderRadius: 1,
                  cursor: likes > 0 ? 'pointer' : 'default',
                  userSelect: 'none',
                  transition: 'all 0.15s ease',
                  '&:hover': likes > 0 ? {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  } : {},
                  '&:active': likes > 0 ? {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)' 
                      : 'rgba(0, 0, 0, 0.08)',
                    transform: 'scale(0.98)'
                  } : {}
                }}
              >
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: likes > 0 ? 500 : 400,
                    color: likes > 0 ? 'text.primary' : 'text.secondary',
                  }}
                >
                  {likes}
                </Typography>
              </Box>
            </Box>

            {isCommentAllowed === 1 && (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onComment?.()
                    }}
                    sx={{ color: 'text.secondary', ml: 0.5 }}
                  >
                    <CommentIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, ml: -0.5 }}
                  >
                    {comments}
                  </Typography>
                </>
              )}

            <IconButton
              size="small"
              onClick={onShare}
              sx={{ color: 'text.secondary', ml: 0.5 }}
            >
              <ShareIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                ml: -0.5
              }}
            >
              {shares}
            </Typography>

            <Box sx={{ flexGrow: 1 }} />

            <Zoom in={isSaved} timeout={300}>
              <Box sx={{ display: isSaved ? 'block' : 'none' }}>
                <IconButton
                  size="small"
                  onClick={onSave}
                  sx={{ color: '#4267b2' }}
                >
                  <BookmarkIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              </Box>
            </Zoom>
            {!isSaved && (
              <IconButton
                size="small"
                onClick={onSave}
                sx={{ color: 'text.secondary' }}
              >
                <BookmarkBorderIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            )}
          </Box>
        </CardContent>
      </Card>

      <PostOptionsMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        postId={id}
        userName={user.name}
        isOwnPost={isOwnPost}
        isFollowing={isFollowing}
        onFollow={handleFollowFromMenu}
        onUnfollow={handleFollowFromMenu}
        onSave={handleSavePost}
        onNotInterested={onNotInterested}
        onReport={handleReport}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        contentType={contentType || 'PHOTO'}
        userId={user.userId}
        pageId={user.pageId}
      />

      {/* ADD THIS: Likes List Dialog */}
      <LikesListDialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        contentId={id}
        contentType={contentType || 'PHOTO'}
        totalLikes={likes}
        onFollowSuccess={onFollowSuccess}
        onFollowError={onFollowError}
      />
    </>
  )
}

export default PollPostComponent