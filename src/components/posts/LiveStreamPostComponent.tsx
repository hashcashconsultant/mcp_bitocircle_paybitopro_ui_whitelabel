'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Avatar,
  AvatarGroup,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  MoreHoriz as MoreIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FiberManualRecord as RecordIcon,
  PlayArrow as PlayIcon,
  LiveTv as LiveTvIcon,
  CheckCircle as VerifiedIcon
} from '@mui/icons-material'
import LiveStreamViewer from './LiveStreamViewer'

// Live viewer type
export interface LiveViewer {
  viewerId: number
  viewerName: string
  profilePicture?: string
}

export interface LiveStreamPostProps {
  // Stream specific fields
  streamId: string
  channelName: string
  agoraAppId: string
  title: string
  description?: string
  viewerCount: number
  likeCount: number
  streamStatus: string
  streamStartedAt: string
  liveViewers?: LiveViewer[]
  onStreamEnded?: (streamId: string) => void
  
  // User fields
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    userId?: number
    pageId?: number
    isVerified?: boolean
    profilePicture?: string
    isUserFollowing?: number
  }
  
  // Handlers
  onFollow?: () => void
  onUnfollow?: () => void
  onFollowSuccess?: (message: string) => void
  onFollowError?: (message: string) => void
}

const LiveStreamPostComponent: React.FC<LiveStreamPostProps> = ({
  streamId,
  channelName,
  agoraAppId,
  title,
  description,
  viewerCount,
  likeCount,
  streamStatus,
  streamStartedAt,
  liveViewers = [],
  user,
  onFollow,
  onUnfollow,
  onFollowSuccess,
  onFollowError,
  onStreamEnded
}) => {
  const theme = useTheme()
  const router = useRouter()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  // State
  const [viewerOpen, setViewerOpen] = useState(false)
  const [isFollowing, setIsFollowing] = useState(user.isUserFollowing === 1)
  const [isOwnStream, setIsOwnStream] = useState(false)
  const [currentViewerCount, setCurrentViewerCount] = useState(viewerCount)

  // Check if this is the current user's stream
  useEffect(() => {
    const currentUserId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
    if (currentUserId && user.userId) {
      setIsOwnStream(Number(currentUserId) === user.userId)
    }
  }, [user.userId])

  // Update following state when user prop changes
  useEffect(() => {
    setIsFollowing(user.isUserFollowing === 1)
  }, [user.isUserFollowing])

  // Format time since stream started
  const formatStreamDuration = (startedAt: string) => {
    try {
      const start = new Date(startedAt)
      const now = new Date()
      const diffMs = now.getTime() - start.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just started'
      if (diffMins < 60) return `${diffMins}m`
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}m`
    } catch {
      return 'Live'
    }
  }

  // Format viewer count
  const formatViewerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Handle watch click
  const handleWatchClick = () => {
    setViewerOpen(true)
  }

  // Handle viewer close
  const handleViewerClose = () => {
    setViewerOpen(false)
  }

  // Handle profile click
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const currentUserId = localStorage.getItem('childUserId')
    
    if (currentUserId && user.userId && Number(currentUserId) === user.userId) {
      router.push('/profile')
    } else {
      router.push(`/public/${user.userId}/${user.pageId}`)
    }
  }

  return (
    <>
      <Card
        sx={{
          mb: 2,
          borderRadius: 2,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          border: '2px solid',
          borderColor: 'error.main',
          position: 'relative'
        }}
      >
        {/* Live Indicator Banner */}
        <Box
          sx={{
            bgcolor: 'error.main',
            color: 'white',
            py: 0.5,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <RecordIcon sx={{ fontSize: 12, animation: 'pulse 1.5s infinite' }} />
            <Typography variant="caption" fontWeight={700}>
              LIVE NOW
            </Typography>
          </Stack>
          <Typography variant="caption">
            {formatStreamDuration(streamStartedAt)}
          </Typography>
        </Box>

        {/* Thumbnail / Preview Area */}
        <Box
          onClick={handleWatchClick}
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9 aspect ratio
            bgcolor: 'grey.900',
            cursor: 'pointer',
            overflow: 'hidden',
            '&:hover .play-overlay': {
              opacity: 1
            }
          }}
        >
          {/* Gradient Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f44336 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LiveTvIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.3)' }} />
          </Box>

          {/* Stats Overlay */}
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              display: 'flex',
              gap: 1
            }}
          >
            <Chip
              icon={<VisibilityIcon sx={{ fontSize: 14 }} />}
              label={formatViewerCount(currentViewerCount)}
              size="small"
              sx={{
                bgcolor: 'rgba(0,0,0,0.7)',
                color: 'white',
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'white' }
              }}
            />
            {likeCount > 0 && (
              <Chip
                icon={<FavoriteIcon sx={{ fontSize: 14 }} />}
                label={formatViewerCount(likeCount)}
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: '#ef4444' }
                }}
              />
            )}
          </Box>

          {/* Play Button Overlay */}
          <Box
            className="play-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.3)',
              opacity: 0,
              transition: 'opacity 0.2s'
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(244, 67, 54, 0.5)'
              }}
            >
              <PlayIcon sx={{ fontSize: 40, color: 'white', ml: 0.5 }} />
            </Box>
          </Box>

          {/* Stream Title Overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              p: 2,
              pt: 4
            }}
          >
            <Typography
              variant="h6"
              color="white"
              fontWeight={600}
              sx={{
                fontSize: { xs: '1rem', sm: '1.1rem' },
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              {title}
            </Typography>
            {description && (
              <Typography
                variant="body2"
                color="rgba(255,255,255,0.8)"
                sx={{
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Card Content - User Info */}
        <CardContent sx={{ p: { xs: 2, sm: '16px !important' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* User Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Avatar
                src={user.profilePicture || undefined}
                onClick={handleProfileClick}
                sx={{
                  bgcolor: user.profilePicture ? 'transparent' : user.avatarColor,
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  mr: 1.5,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: 'error.main'
                }}
              >
                {!user.profilePicture && user.avatar}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    onClick={handleProfileClick}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user.name}
                  </Typography>
                  {user.isVerified && (
                    <VerifiedIcon sx={{ fontSize: 16, color: '#1d9bf0' }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {user.username} • Streaming live
                </Typography>
              </Box>
            </Box>

            {/* Watch Button */}
            <Button
              variant="contained"
              color="error"
              size={isMobile ? 'small' : 'medium'}
              startIcon={<PlayIcon />}
              onClick={handleWatchClick}
              sx={{
                ml: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: { xs: 2, sm: 3 }
              }}
            >
              Watch
            </Button>
          </Box>

          {/* Live Viewers Section */}
          {liveViewers && liveViewers.length > 0 && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${theme.palette.divider}`
              }}
            >
              <AvatarGroup 
                max={4}
                sx={{
                  '& .MuiAvatar-root': {
                    width: 28,
                    height: 28,
                    fontSize: '0.75rem',
                    border: `2px solid ${theme.palette.background.paper}`,
                  }
                }}
              >
                {liveViewers.map((viewer) => (
                  <Tooltip key={viewer.viewerId} title={viewer.viewerName} arrow>
                    <Avatar
                      src={viewer.profilePicture || undefined}
                      alt={viewer.viewerName}
                      sx={{
                        bgcolor: !viewer.profilePicture ? theme.palette.primary.main : 'transparent'
                      }}
                    >
                      {!viewer.profilePicture && viewer.viewerName?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ ml: 1.5 }}
              >
                {liveViewers.length === 1 ? (
                  <><strong>{liveViewers[0].viewerName}</strong> is watching</>
                ) : liveViewers.length === 2 ? (
                  <><strong>{liveViewers[0].viewerName}</strong> and <strong>{liveViewers[1].viewerName}</strong> are watching</>
                ) : (
                  <><strong>{liveViewers[0].viewerName}</strong>, <strong>{liveViewers[1].viewerName}</strong> and {liveViewers.length - 2} other{liveViewers.length - 2 > 1 ? 's' : ''} watching</>
                )}
              </Typography>
            </Box>
          )}
        </CardContent>

        {/* Pulse Animation Keyframes */}
        <style jsx global>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </Card>

      {/* Live Stream Viewer Dialog */}
      <LiveStreamViewer
        open={viewerOpen}
        onClose={handleViewerClose}
        streamId={streamId}
        channelName={channelName}
        agoraAppId={agoraAppId}
        streamTitle={title}
        streamerName={user.name}
        streamerAvatar={user.profilePicture}
        streamerId={user.userId?.toString()}
        userId={localStorage.getItem('childUserId') || undefined}
        userName={localStorage.getItem('fullName') || 'Viewer'}
        onStreamEnded={onStreamEnded}
      />
    </>
  )
}

export default LiveStreamPostComponent