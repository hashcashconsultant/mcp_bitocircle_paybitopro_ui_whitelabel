'use client'
import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Avatar,
  Dialog,
  IconButton,
  Typography,
  CircularProgress,
  Badge,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Close as CloseIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  VolumeOff as VolumeOffIcon,
  VolumeUp as VolumeUpIcon
} from '@mui/icons-material'

interface Story {
  id: number
  storyId: number
  name: string
  username: string
  avatar: string
  avatarImage?: string
  avatarColor: string
  storyType: 'TEXT' | 'IMAGE' | 'VIDEO'
  storyImage?: string
  storyVideo?: string
  storyText?: string
  storyCaption?: string
  duration: number
  time: string
  viewed?: boolean
  userId: number
}

interface ProfileStoryViewerProps {
  open: boolean
  onClose: () => void
  stories: Story[]
  initialIndex?: number
  profileUserId: string
}

const ProfileStoryViewer: React.FC<ProfileStoryViewerProps> = ({
  open,
  onClose,
  stories,
  initialIndex = 0,
  profileUserId
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMediaLoaded, setIsMediaLoaded] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [viewStartTime, setViewStartTime] = useState<number | null>(null)
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = stories[currentStoryIndex]

  const calculateTimeAgo = (dateString: string): string => {
    const utcString = dateString.endsWith("Z") ? dateString : dateString + "Z"
    const date = new Date(utcString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    if (diffMs < 60000) return 'Just now'
    
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

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

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/stories/view',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          console.log('Story view recorded successfully')
        }
      }
    } catch (error) {
      console.error('Error recording story view:', error)
    }
  }

  // Reset state ONLY when dialog opens/closes — NOT on story navigation
  useEffect(() => {
    if (open && stories.length > 0) {
      setCurrentStoryIndex(initialIndex)
      setProgress(0)
      setIsMediaLoaded(false)
      setIsTransitioning(false)
      setIsPaused(false)
      setViewStartTime(Date.now())

      // Record initial view
      const initialStory = stories[initialIndex]
      if (initialStory?.storyId) {
        recordStoryView(initialStory.storyId, 0)
      }
    } else {
      // Clean up interval on close
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [open, initialIndex])

  // For TEXT stories, mark media as loaded immediately since there's nothing to load
  useEffect(() => {
    if (open && currentStory?.storyType === 'TEXT') {
      setIsMediaLoaded(true)
    }
  }, [open, currentStoryIndex, currentStory?.storyType])

  // Progress bar and auto-advance logic
  useEffect(() => {
    if (isTransitioning || !open || stories.length === 0) return

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (isPaused || !isMediaLoaded) return

    const storyDuration = (currentStory?.duration || 5) * 1000
    const intervalTime = 50
    const increment = (100 / storyDuration) * intervalTime

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
  }, [open, isPaused, isMediaLoaded, isTransitioning, currentStoryIndex, stories, currentStory])

  // Handle video play/pause
  useEffect(() => {
    if (videoRef.current && currentStory?.storyVideo) {
      if (isPaused) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(err => console.log('Video play error:', err))
      }
    }
  }, [isPaused, currentStory])

  const handleNextStory = () => {
    if (isTransitioning) return

    // Record view duration for current story
    if (viewStartTime && currentStory) {
      const viewEndTime = Date.now()
      const viewDurationSeconds = (viewEndTime - viewStartTime) / 1000
      recordStoryView(currentStory.storyId, viewDurationSeconds)
    }

    if (currentStoryIndex < stories.length - 1) {
      setIsTransitioning(true)
      const nextIndex = currentStoryIndex + 1
      setTimeout(() => {
        setCurrentStoryIndex(nextIndex)
        setProgress(0)
        setIsMediaLoaded(false)
        setIsTransitioning(false)
        setViewStartTime(Date.now())
        if (stories[nextIndex]?.storyId) {
          recordStoryView(stories[nextIndex].storyId, 0)
        }
      }, 150)
    } else {
      handleClose()
    }
  }

  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setIsTransitioning(true)
      const prevIndex = currentStoryIndex - 1
      setTimeout(() => {
        setCurrentStoryIndex(prevIndex)
        setProgress(0)
        setIsMediaLoaded(false)
        setIsTransitioning(false)
        setViewStartTime(Date.now())
        if (stories[prevIndex]?.storyId) {
          recordStoryView(stories[prevIndex].storyId, 0)
        }
      }, 150)
    }
  }

  const handleClose = async () => {
    // Record final view duration
    if (viewStartTime && currentStory) {
      const viewEndTime = Date.now()
      const viewDurationSeconds = (viewEndTime - viewStartTime) / 1000
      await recordStoryView(currentStory.storyId, viewDurationSeconds)
    }

    // Clean up interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    onClose()
  }

  const handleImageLoad = () => setIsMediaLoaded(true)
  const handleVideoLoad = () => setIsMediaLoaded(true)

  if (!open || stories.length === 0) return null

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#000',
          margin: 0,
          maxWidth: '100%',
          maxHeight: '100%',
          borderRadius: 0
        }
      }}
    >
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
          {stories.map((_, index) => (
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
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Avatar
              src={currentStory.avatarImage}
              sx={{
                bgcolor: currentStory.avatarColor,
                width: 40,
                height: 40,
                border: '2px solid white'
              }}
            >
              {currentStory.avatar}
            </Avatar>
            <Box>
              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                {currentStory.name}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                {currentStory.time}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {currentStory.storyVideo && (
              <IconButton
                onClick={() => setIsMuted(!isMuted)}
                sx={{ color: 'white' }}
              >
                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
              </IconButton>
            )}
            <IconButton onClick={handleClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Navigation areas */}
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
            '&:hover': { '& .nav-icon': { opacity: 1 } }
          }}
        >
          {currentStoryIndex > 0 && (
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
            '&:hover': { '& .nav-icon': { opacity: 1 } }
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
            position: 'relative'
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
          {currentStory.storyType === 'TEXT' && currentStory.storyText && (
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
          {currentStory.storyImage && (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img
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
          {currentStory.storyVideo && (
            <Box sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <video
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

          {/* Caption for non-text stories */}
          {currentStory.storyCaption && currentStory.storyType !== 'TEXT' && (
            <Box sx={{
              position: 'absolute',
              bottom: 20,
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
        </Box>

        {/* Play/Pause button */}
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
      </Box>
    </Dialog>
  )
}

export default ProfileStoryViewer