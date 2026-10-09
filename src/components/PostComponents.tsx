'use client'
import React, { useState, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Button,
  LinearProgress,
  Chip,
  Zoom,
  Modal,
  useMediaQuery,
  useTheme
} from '@mui/material'
import {
  MoreHoriz as MoreIcon,
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ChatBubbleOutline as CommentIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  Poll as PollIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material'

// Common props interface
interface BasePostProps {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string
  }
  content: string
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
}

// TEXT POST COMPONENT
export const TextPostComponent: React.FC<BasePostProps> = ({
  user,
  content,
  likes,
  comments,
  shares,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  onShare,
  onMoreOptions
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card sx={{
      mb: 2,
      borderRadius: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #e4e6ea'
    }}>
      <CardContent sx={{
        p: { xs: 2, sm: '16px !important' }
      }}>
        {/* Post Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{
            bgcolor: user.avatarColor,
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            mr: 1.5,
            fontSize: { xs: 14, sm: 16 },
            fontWeight: 600
          }}>
            {user.avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            >
              {user.username} • {user.time}
            </Typography>
          </Box>
          <IconButton 
            size="small"
            onClick={onMoreOptions}
          >
            <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>

        {/* Post Content */}
        <Typography
          variant="body1"
          sx={{
            mb: 2,
            lineHeight: 1.6,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            whiteSpace: 'pre-wrap'
          }}
        >
          {content}
        </Typography>

        {/* Post Actions */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          color: 'text.secondary'
        }}>
          {/* Like Button */}
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
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {likes}
          </Typography>

          {/* Comment Button */}
          <IconButton
            size="small"
            onClick={onComment}
            sx={{ color: 'text.secondary', ml: 1 }}
          >
            <CommentIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {comments}
          </Typography>

          {/* Share Button */}
          <IconButton
            size="small"
            onClick={onShare}
            sx={{ color: 'text.secondary', ml: 1 }}
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
          
          {/* Save Button */}
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
  )
}

// IMAGE POST COMPONENT
export interface ImagePostProps extends BasePostProps {
  images: string[]
}

export const ImagePostComponent: React.FC<ImagePostProps> = ({
  user,
  content,
  images,
  likes,
  comments,
  shares,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  onShare,
  onMoreOptions
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [openImageModal, setOpenImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  const handleImageClick = (image: string) => {
    setSelectedImage(image)
    setOpenImageModal(true)
  }

  const getImageLayout = () => {
    if (images.length === 1) {
      return (
        <CardMedia
          component="img"
          image={images[0]}
          alt="Post image"
          onClick={() => handleImageClick(images[0])}
          sx={{
            width: '100%',
            maxHeight: 500,
            objectFit: 'cover',
            cursor: 'pointer',
            borderRadius: 1,
            mb: 2
          }}
        />
      )
    } else if (images.length === 2) {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          {images.map((image, index) => (
            <CardMedia
              key={index}
              component="img"
              image={image}
              alt={`Post image ${index + 1}`}
              onClick={() => handleImageClick(image)}
              sx={{
                width: '100%',
                height: 250,
                objectFit: 'cover',
                cursor: 'pointer',
                borderRadius: 1
              }}
            />
          ))}
        </Box>
      )
    } else if (images.length === 3) {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1, mb: 2 }}>
          <CardMedia
            component="img"
            image={images[0]}
            alt="Post image 1"
            onClick={() => handleImageClick(images[0])}
            sx={{
              width: '100%',
              height: 300,
              objectFit: 'cover',
              cursor: 'pointer',
              borderRadius: 1,
              gridRow: 'span 2'
            }}
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {images.slice(1).map((image, index) => (
              <CardMedia
                key={index}
                component="img"
                image={image}
                alt={`Post image ${index + 2}`}
                onClick={() => handleImageClick(image)}
                sx={{
                  width: '100%',
                  height: 146,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 1
                }}
              />
            ))}
          </Box>
        </Box>
      )
    } else {
      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
          {images.slice(0, 4).map((image, index) => (
            <Box key={index} sx={{ position: 'relative' }}>
              <CardMedia
                component="img"
                image={image}
                alt={`Post image ${index + 1}`}
                onClick={() => handleImageClick(image)}
                sx={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  borderRadius: 1,
                  filter: index === 3 && images.length > 4 ? 'brightness(0.5)' : 'none'
                }}
              />
              {index === 3 && images.length > 4 && (
                <Typography
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleImageClick(image)}
                >
                  +{images.length - 4}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )
    }
  }

  return (
    <>
      <Card sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        border: '1px solid #e4e6ea'
      }}>
        <CardContent sx={{
          p: { xs: 2, sm: '16px !important' }
        }}>
          {/* Post Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{
              bgcolor: user.avatarColor,
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              mr: 1.5,
              fontSize: { xs: 14, sm: 16 },
              fontWeight: 600
            }}>
              {user.avatar}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="body1"
                fontWeight={600}
                sx={{
                  lineHeight: 1.2,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {user.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  lineHeight: 1.2,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {user.username} • {user.time} • 📷
              </Typography>
            </Box>
            <IconButton 
              size="small"
              onClick={onMoreOptions}
            >
              <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
          </Box>

          {/* Post Content */}
          {content && (
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                lineHeight: 1.6,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {content}
            </Typography>
          )}

          {/* Images */}
          {getImageLayout()}

          {/* Post Actions - Same as TextPost */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            color: 'text.secondary'
          }}>
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
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                ml: -0.5
              }}
            >
              {likes}
            </Typography>

            <IconButton
              size="small"
              onClick={onComment}
              sx={{ color: 'text.secondary', ml: 1 }}
            >
              <CommentIcon fontSize={isMobile ? 'small' : 'medium'} />
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                ml: -0.5
              }}
            >
              {comments}
            </Typography>

            <IconButton
              size="small"
              onClick={onShare}
              sx={{ color: 'text.secondary', ml: 1 }}
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

      {/* Image Modal */}
      <Modal
        open={openImageModal}
        onClose={() => setOpenImageModal(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}>
          <IconButton
            onClick={() => setOpenImageModal(false)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={selectedImage}
            alt="Full size"
            style={{
              maxWidth: '100%',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
          />
        </Box>
      </Modal>
    </>
  )
}

// VIDEO POST COMPONENT
export interface VideoPostProps extends BasePostProps {
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
}

export const VideoPostComponent: React.FC<VideoPostProps> = ({
  user,
  content,
  videoUrl,
  thumbnailUrl,
  duration,
  likes,
  comments,
  shares,
  views = 0,
  isLiked = false,
  isSaved = false,
  onLike,
  onSave,
  onComment,
  onShare,
  onMoreOptions
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const formatViews = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  return (
    <Card sx={{
      mb: 2,
      borderRadius: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #e4e6ea'
    }}>
      <CardContent sx={{
        p: { xs: 2, sm: '16px !important' }
      }}>
        {/* Post Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{
            bgcolor: user.avatarColor,
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            mr: 1.5,
            fontSize: { xs: 14, sm: 16 },
            fontWeight: 600
          }}>
            {user.avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            >
              {user.username} • {user.time} • 🎥
            </Typography>
          </Box>
          <IconButton 
            size="small"
            onClick={onMoreOptions}
          >
            <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>

        {/* Post Content */}
        {content && (
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            {content}
          </Typography>
        )}

        {/* Video Player */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%', // 16:9 aspect ratio
            mb: 2,
            bgcolor: 'black',
            borderRadius: 1,
            overflow: 'hidden'
          }}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={thumbnailUrl}
            muted={isMuted}
            loop
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onClick={handlePlayPause}
          />

          {/* Video Controls Overlay */}
          {showControls && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  onClick={handleFullscreen}
                  sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                  size="small"
                >
                  <FullscreenIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <IconButton
                  onClick={handlePlayPause}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(0,0,0,0.7)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                    width: 64,
                    height: 64
                  }}
                >
                  {isPlaying ? <PauseIcon sx={{ fontSize: 32 }} /> : <PlayIcon sx={{ fontSize: 32 }} />}
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <IconButton
                  onClick={handleMuteToggle}
                  sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)' }}
                  size="small"
                >
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
                {duration && (
                  <Typography
                    sx={{
                      color: 'white',
                      bgcolor: 'rgba(0,0,0,0.5)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem'
                    }}
                  >
                    {duration}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Play button when video is not playing */}
          {!isPlaying && !showControls && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <IconButton
                onClick={handlePlayPause}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.7)',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' },
                  width: 64,
                  height: 64
                }}
              >
                <PlayIcon sx={{ fontSize: 32 }} />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* View count */}
        {views > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
          >
            {formatViews(views)} views
          </Typography>
        )}

        {/* Post Actions - Same as other posts */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          color: 'text.secondary'
        }}>
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
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {likes}
          </Typography>

          <IconButton
            size="small"
            onClick={onComment}
            sx={{ color: 'text.secondary', ml: 1 }}
          >
            <CommentIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {comments}
          </Typography>

          <IconButton
            size="small"
            onClick={onShare}
            sx={{ color: 'text.secondary', ml: 1 }}
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
  )
}

// POLL POST COMPONENT
export interface PollOption {
  id: number
  text: string
  votes: number
}

export interface PollPostProps extends BasePostProps {
  question: string
  options: PollOption[]
  totalVotes: number
  hasVoted?: boolean
  votedOptionId?: number
  endTime?: string
  onVote?: (optionId: number) => void
}

export const PollPostComponent: React.FC<PollPostProps> = ({
  user,
  content,
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
  onVote
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [selectedOption, setSelectedOption] = useState<number | null>(votedOptionId || null)
  const [localHasVoted, setLocalHasVoted] = useState(hasVoted)

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

  const winningOption = localHasVoted ? getWinningOption() : null

  return (
    <Card sx={{
      mb: 2,
      borderRadius: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #e4e6ea'
    }}>
      <CardContent sx={{
        p: { xs: 2, sm: '16px !important' }
      }}>
        {/* Post Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{
            bgcolor: user.avatarColor,
            width: { xs: 36, sm: 40 },
            height: { xs: 36, sm: 40 },
            mr: 1.5,
            fontSize: { xs: 14, sm: 16 },
            fontWeight: 600
          }}>
            {user.avatar}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="body1"
              fontWeight={600}
              sx={{
                lineHeight: 1.2,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              {user.name}
            </Typography>
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
          </Box>
          <IconButton 
            size="small"
            onClick={onMoreOptions}
          >
            <MoreIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>

        {/* Post Content */}
        {content && (
          <Typography
            variant="body1"
            sx={{
              mb: 2,
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            {content}
          </Typography>
        )}

        {/* Poll Card */}
        <Card variant="outlined" sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          bgcolor: '#f8f9fa',
          borderColor: '#e4e6ea'
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

          {/* Poll Options */}
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
                      borderColor: '#e4e6ea',
                      color: 'text.primary',
                      fontSize: { xs: '0.85rem', sm: '0.9rem' },
                      py: { xs: 1, sm: 1.25 },
                      px: 2,
                      '&:hover': {
                        borderColor: '#4267b2',
                        bgcolor: '#f0f8ff'
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
                        bgcolor: 'white',
                        border: '1px solid',
                        borderColor: isWinning ? '#42b883' : '#e4e6ea',
                        borderRadius: 1,
                        overflow: 'hidden',
                        minHeight: { xs: 40, sm: 44 }
                      }}
                    >
                      {/* Progress bar background */}
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
                      
                      {/* Option content */}
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

          {/* Poll Footer */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 2,
            borderTop: '1px solid #e4e6ea'
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

        {/* Post Actions - Same as other posts */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          color: 'text.secondary'
        }}>
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
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {likes}
          </Typography>

          <IconButton
            size="small"
            onClick={onComment}
            sx={{ color: 'text.secondary', ml: 1 }}
          >
            <CommentIcon fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              ml: -0.5
            }}
          >
            {comments}
          </Typography>

          <IconButton
            size="small"
            onClick={onShare}
            sx={{ color: 'text.secondary', ml: 1 }}
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
  )
}