'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import usePostViewTracker from '@/hooks/usePostViewTracker'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Zoom,
  useMediaQuery,
  useTheme,
  Button,
  Chip,
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
  CheckCircle as VerifiedIcon,
  LocalOffer as TagIcon,
  Reply as SharedIcon
} from '@mui/icons-material'
import PostOptionsMenu from './PostOptionsMenu'
import { Campaign as SponsoredIcon } from '@mui/icons-material'
import SponsoredSection from './SponsoredSection'
import LikesListDialog from './LikesListDialog'

import { LocationOn as LocationOnIcon } from '@mui/icons-material'
import Link from 'next/link'
import TaggedProductsSection, { TaggedProduct } from './TaggedProductsSection'

export interface TextPostProps {
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
    pageId?: number
    entityType?: string
    profilePicture?: string
  }
  content: string
  contentType?: string
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
  onFollow?: () => void
  onUnfollow?: () => void
  onFollowSuccess?: (message: string) => void
  onFollowError?: (message: string) => void
  onEdit?: () => void
  onDelete?: () => void
  onNotInterested?: () => void
  isSponsored?: boolean
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  location?: string | null
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
  // NEW: Campaign ID for sponsored posts
  campaignId?: number
  isProductTagged?: number
  taggedProducts?: TaggedProduct[]
    isCommentAllowed?: number
    isGifAllowed?: number

}

const TextPostComponent: React.FC<TextPostProps> = ({
  id,
  user,
  content,
  contentType,
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
  onFollow,
  onUnfollow,
  onFollowSuccess,
  onFollowError,
  onEdit,
  onDelete,
  onNotInterested,
  isSponsored = false,
  cta,
  callToActionUrl,
  adHeadline,
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
  campaignId = 0,
  isProductTagged,
  taggedProducts,
  isCommentAllowed = 1,
  isGifAllowed = 1
  

}) => {
  const theme = useTheme()
  const router = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [showFullContent, setShowFullContent] = useState(false)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [isFollowing, setIsFollowing] = useState((user.isUserFollowing === 1) || false)
  const [isHoveringFollow, setIsHoveringFollow] = useState(false)
  const [isFollowLoading, setIsFollowLoading] = useState(false)
  const [isOwnPost, setIsOwnPost] = useState(false)

  const [likesDialogOpen, setLikesDialogOpen] = useState(false)

  const { isAuthenticated } = useAuth()

  // UPDATED: View tracking with new props
  const { trackingRef, fireClick } = usePostViewTracker({
    postId: id,
    contentType: 'POST',
    minViewDuration: 3,
    updateInterval: 30,
    enabled: true,
    isSponsored: isSponsored,
    campaignId: campaignId
  })

  const CONTENT_CHAR_LIMIT = 150
  const shouldTruncate = content && content.length > CONTENT_CHAR_LIMIT

  const isSharedByMe = () => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    return currentUserId && sharedByUserId && Number(currentUserId) === sharedByUserId
  }

  useEffect(() => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    if (currentUserId && user.userId) {
      setIsOwnPost(Number(currentUserId) === user.userId)
    }
  }, [user.userId])

  useEffect(() => {
    setIsFollowing(user.isUserFollowing === 1)
  }, [user.isUserFollowing])

  const parseContentWithLinks = (text: string, truncated = false) => {
    if (!text) return null

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        try {
          const url = new URL(part)
          const displayUrl = url.hostname + url.pathname

          let displayText = displayUrl
          if (truncated && displayText.length > 30) {
            displayText = displayText.substring(0, 30) + '...'
          }

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
              {displayText}
            </MuiLink>
          )
        } catch {
          return <span key={index}>{part}</span>
        }
      }
      return <span key={index}>{part}</span>
    })
  }

  const handlePostClick = (e: React.MouseEvent) => {
    fireClick()
    if (isAuthenticated) return

    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="button"]') ||
      target.closest('a') ||
      target.closest('.MuiIconButton-root') ||
      target.closest('.MuiButton-root') ||
      target.closest('.MuiLink-root')
    ) {
      return
    }

    const postId = id
    const userId = user.userId || 0
    const pageId = user.pageId || 0
    router.push(`/post/${postId}/${userId}/${pageId}`)
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    const currentUserId = localStorage.getItem('childUserId')
    const profileId = user.userId
    const pageId = user.pageId

    if (currentUserId && profileId && Number(currentUserId) === profileId) {
      router.push('/profile')
    } else {
      router.push(`/public/${profileId}/${pageId}`)
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setMenuAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const handleLikesCountClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (likes > 0) {
      setLikesDialogOpen(true)
    }
  }

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

  const handleFollowFromMenu = async () => {
    handleMenuClose()
    await handleFollowToggle()
  }

  const handleSavePost = () => {
    onSave?.()
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

  const formatTaggedData = (data: string): string => {
    if (!data) return ''

    const tagParts = data.split(';').map(part => part.trim()).filter(Boolean)

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

  return (
    <>
      <div ref={trackingRef}>
        <Card
          onClick={handlePostClick}
          sx={{
            mb: 2,
            borderRadius: 2,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            ...(!isAuthenticated && {
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            })
          }}
        >
          <CardContent sx={{ p: { xs: 2, sm: '16px !important' } }}>
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
                  sx={{ width: 20, height: 20, fontSize: 10 }}
                >
                  {!sharerProfilePicture && sharerFullName?.charAt(0)}
                </Avatar>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem' }}
                >
                  {isSharedByMe() ? (
                    <><strong>You</strong> shared this post</>
                  ) : (
                    <>
                      <strong
                        onClick={(e) => e.stopPropagation()}
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

            {/* User Header */}
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
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {user.name}
                  </Typography>

                  {user.isVerified && (
                    <VerifiedIcon sx={{ fontSize: { xs: 16, sm: 18 }, color: '#1d9bf0' }} />
                  )}

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

                  {isSponsored && (
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
                        '& .MuiChip-icon': { fontSize: 14, color: '#f59e0b' }
                      }}
                    />
                  )}

                  {!isOwnPost && !isSponsored && !isFollowing && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFollowToggle()
                      }}
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
                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' },
                        '&:disabled': { color: '#9ca3af' }
                      }}
                    >
                      • Follow
                    </Button>
                  )}

                  {!isOwnPost && !isSponsored && isFollowing && (
                    <Button
                      variant="text"
                      size="small"
                      onMouseEnter={() => setIsHoveringFollow(true)}
                      onMouseLeave={() => setIsHoveringFollow(false)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleFollowToggle()
                      }}
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
                          bgcolor: isHoveringFollow ? 'rgba(239, 68, 68, 0.08)' : 'rgba(107, 114, 128, 0.08)'
                        },
                        '&:disabled': { color: '#9ca3af' }
                      }}
                    >
                      • {isHoveringFollow ? 'Unfollow' : 'Following'}
                    </Button>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ lineHeight: 1.2, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                >
                  {user.username} • {user.time}
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

              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Box>

            {/* Content */}
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
              {shouldTruncate && !showFullContent ? (
                <>
                  {parseContentWithLinks(content.slice(0, CONTENT_CHAR_LIMIT), true)}...
                  <Typography
                    component="span"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowFullContent(true)
                    }}
                    sx={{
                      color: 'primary.main',
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {' '}Show more
                  </Typography>
                </>
              ) : (
                <>
                  {parseContentWithLinks(content)}
                  {shouldTruncate && (
                    <Typography
                      component="span"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFullContent(false)
                      }}
                      sx={{
                        color: 'primary.main',
                        cursor: 'pointer',
                        fontSize: 'inherit',
                        fontWeight: 500,
                        ml: 0.5,
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {' '}Show less
                    </Typography>
                  )}
                </>
              )}
            </Typography>

            {/* Tagged Products Section - CORRECT PLACEMENT: after content, before actions */}
            {isProductTagged === 1 && taggedProducts && taggedProducts.length > 0 && (
              <TaggedProductsSection products={taggedProducts} />
            )}

            {/* Sponsored Section */}
            {isSponsored && (
              <SponsoredSection
                adHeadline={adHeadline}
                callToActionUrl={callToActionUrl}
                cta={cta}
              />
            )}

            {/* Actions Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, color: 'text.secondary' }}>

              {/* Like Section */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {/* Like/Unlike Button */}
                <Zoom in={isLiked} timeout={300}>
                  <Box sx={{ display: isLiked ? 'block' : 'none' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onLike?.()
                      }}
                      sx={{ color: '#ef4444' }}
                    >
                      <LikedIcon fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </Box>
                </Zoom>
                {!isLiked && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onLike?.()
                    }}
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
                    ml: -0.25,
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

              {/* Share Button */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onShare?.()
                }}
                sx={{ color: 'text.secondary', ml: 0.5 }}
              >
                <ShareIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
              <Typography
                variant="body2"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, ml: -0.5 }}
              >
                {shares}
              </Typography>


              {isSponsored && (
                <SponsoredSection
                  adHeadline={adHeadline}
                  callToActionUrl={callToActionUrl}
                  cta={cta}
                />
              )}

              <Box sx={{ flexGrow: 1 }} />

              {/* Bookmark Button */}
              <Zoom in={isSaved} timeout={300}>
                <Box sx={{ display: isSaved ? 'block' : 'none' }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSave?.()
                    }}
                    sx={{ color: '#4267b2' }}
                  >
                    <BookmarkIcon fontSize={isMobile ? 'small' : 'medium'} />
                  </IconButton>
                </Box>
              </Zoom>
              {!isSaved && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSave?.()
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <BookmarkBorderIcon fontSize={isMobile ? 'small' : 'medium'} />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Post Options Menu */}
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
        contentType={contentType || 'POST'}
        userId={user.userId}
        pageId={user.pageId}
      />

      {/* Likes List Dialog */}
      <LikesListDialog
        open={likesDialogOpen}
        onClose={() => setLikesDialogOpen(false)}
        contentId={id}
        contentType={contentType || 'POST'}
        totalLikes={likes}
        onFollowSuccess={onFollowSuccess}
        onFollowError={onFollowError}
      />
    </>
  )
}

export default TextPostComponent