'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Container,
  CircularProgress,
  CardMedia,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  Tabs,
  Tab
} from '@mui/material'
import {
  TrendingUp as TrendingIcon,
  VideoLibrary as VideoIcon,
  Photo as PhotoIcon,
  MoreHoriz as MoreIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  Share as ShareIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

interface PostDetails {
  postId: number | null
  adminUser: string | null
  pageId: number
  userId: number
  contentOwnerId: number
  content: string | null
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'REEL' | 'POLL'
  mediaUrls: string | null
  mediaUrlsList: string[] | null
  mediaType: string | null
  hashtags: string | null
  location: string | null
  isActive: string
  createdAt: string
  updatedAt: string | null
  scheduledAt: string | null
  isScheduled: string | null
  engagementScore: number
  thumbnailUrl: string | null
  videoDuration: number
  websiteUrl: string | null
  isThirdParty: string
  pollQuestion: string | null
  pollOptions: string | null
  pollDurationHours: number | null
  username: string | null
  fullName: string | null
  likeCount: number | null
  commentCount: number | null
  shareCount: number | null
  hasLiked: string | null
  hasBookmarked: string | null
  poll: unknown | null
  taggedUsers: unknown | null
  userIdsToUntag: unknown | null
  taggedUsersCount: number
}

interface HashtagPost {
  scoreId: number | null
  topicId: number
  metricId: number | null
  mentions: number | null
  engagementRate: number | null
  viralityBoost: number | null
  influencerWeight: number | null
  timeVelocity: number | null
  noiseFactor: number | null
  trendScore: number
  maxTrendScore: number
  trendPercentage: number
  calculationMethod: string | null
  calculatedDate: string | null
  titleOrType: string
  contentText: string
  viewCount: number
  postDetails: PostDetails
}

interface HashtagPostsResponse {
  success: boolean
  message: string
  data: HashtagPost[]
  errorCode: string | null
}

// Reel interface compatible with the reel player page
interface ReelData {
  reelId: number | null
  userId: number
  adminUser: string | null
  title: string
  description: string
  videoUrl: string
  coverImage: string | null
  hashtags: string
  duration: number
  isActive: string
  createdAt: string
  updatedAt: string | null
  username: string
  fullName: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: string
  hasBookmarked: string
}

interface HashtagPostsPageProps {
  hashtag: string
}

type ViewTab = 'all' | 'posts' | 'reels'

const HashtagPostsPage: React.FC<HashtagPostsPageProps> = ({ hashtag }) => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [allPosts, setAllPosts] = useState<HashtagPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<ViewTab>('all')

  useEffect(() => {
    fetchHashtagPosts()
  }, [hashtag])

  const fetchHashtagPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/trending/getPostDetailsByHashtag?hashtag=${encodeURIComponent(hashtag)}&page=1&pageSize=50`
      
      const response = await  fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data: HashtagPostsResponse = await response.json()

      if (data.success && data.data) {
        setAllPosts(data.data)
      } else {
        setError(data.message || 'Failed to load posts')
      }
    } catch (err) {
      console.error('Error fetching hashtag posts:', err)
      setError('Error loading posts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter posts based on selected tab
  const filteredPosts = allPosts.filter(post => {
    if (selectedTab === 'all') return true
    if (selectedTab === 'reels') return post.postDetails.postType === 'REEL'
    if (selectedTab === 'posts') return post.postDetails.postType !== 'REEL'
    return true
  })

  const postsCount = allPosts.filter(p => p.postDetails.postType !== 'REEL').length
  const reelsCount = allPosts.filter(p => p.postDetails.postType === 'REEL').length

  const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  
  // Show weeks for 7-29 days
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return `${weeks}w ago`
  }
  
  // Show months for 30-364 days
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  
  // Show years for 365+ days
  const years = Math.floor(days / 365)
  return `${years}y ago`
}

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'VIDEO':
      case 'REEL':
        return <VideoIcon fontSize="small" sx={{ fontSize: { xs: 14, sm: 16 } }} />
      case 'PHOTO':
        return <PhotoIcon fontSize="small" sx={{ fontSize: { xs: 14, sm: 16 } }} />
      default:
        return null
    }
  }

  const getAvatarInitials = (fullName: string | null) => {
    console.log('fullName',fullName);
    
    if (!fullName) return '?'
    const names = fullName.trim().split(/\s+/)
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return fullName.slice(0, 2).toUpperCase()
    
  }

  const getAvatarColor = (userId: number) => {
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
      '#00bcd4', '#009688', '#4caf50', '#ff9800', '#ff5722'
    ]
    return colors[userId % colors.length]
  }

  const handlePostClick = (postId: number | null) => {
    if (postId) {
      router.push(`/post/${postId}`)
    }
  }

  // Handle reel click - store in localStorage and navigate to /reels
  const handleReelClick = (post: HashtagPost) => {
    console.log('🎬 handleReelClick called')
    console.log('🎬 Clicked reel post:', post)
    
    try {
      // Convert HashtagPost to ReelData format
      const reelData: ReelData = {
        reelId: post.postDetails.postId,
        userId: post.postDetails.userId,
        adminUser: post.postDetails.adminUser,
        title: post.titleOrType || '',
        description: post.contentText || post.postDetails.content || '',
        videoUrl: post.postDetails.mediaUrls || '',
        coverImage: post.postDetails.thumbnailUrl,
        hashtags: post.postDetails.hashtags || '',
        duration: post.postDetails.videoDuration,
        isActive: post.postDetails.isActive,
        createdAt: post.postDetails.createdAt,
        updatedAt: post.postDetails.updatedAt,
        username: post.postDetails.username || '',
        fullName: post.postDetails.fullName || '',
        likeCount: post.postDetails.likeCount || 0,
        commentCount: post.postDetails.commentCount || 0,
        shareCount: post.postDetails.shareCount || 0,
        hasLiked: post.postDetails.hasLiked || 'N',
        hasBookmarked: post.postDetails.hasBookmarked || 'N'
      }
      
      // Store only the clicked reel in localStorage
      localStorage.setItem('selectedReel', JSON.stringify(reelData))
      
      console.log('🎬 Reel stored in localStorage')
      
      // Navigate to reel page
      router.push('/reels')
    } catch (error) {
      console.error('🎬 Error storing reel:', error)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: ViewTab) => {
    setSelectedTab(newValue)
  }

  const renderReels = () => {
    const reels = filteredPosts.filter(p => p.postDetails.postType === 'REEL')

    if (reels.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <VideoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No reels found for #{hashtag}
          </Typography>
        </Box>
      )
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)'
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {reels.map((post) => (
          <Card
            key={`${post.postDetails.postId}-${post.postDetails.contentOwnerId}`}
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: theme.shadows[8],
              }
            }}
            onClick={() => handleReelClick(post)}
          >
            {/* Thumbnail/Cover */}
            <Box sx={{ position: 'relative', paddingTop: '177.78%', bgcolor: '#000' }}>
              {post.postDetails.thumbnailUrl ? (
                <CardMedia
                  component="img"
                  image={post.postDetails.thumbnailUrl}
                  alt={post.titleOrType}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.900',
                    color: 'white'
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                </Box>
              )}
              
              {/* Play Icon Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  borderRadius: '50%',
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.9,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>

              {/* Duration Badge */}
              {post.postDetails.videoDuration > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.75)',
                    color: 'white',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  {formatDuration(post.postDetails.videoDuration)}
                </Box>
              )}

              {/* Stats Overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center'
                }}
              >
                {post.postDetails.likeCount !== null && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    bgcolor: 'rgba(0,0,0,0.75)',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1
                  }}>
                    <FavoriteIcon sx={{ fontSize: 14, color: '#EF4444' }} />
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, fontSize: '0.7rem' }}>
                      {formatNumber(post.postDetails.likeCount || 0)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Reel Info */}
            <CardContent sx={{ p: 1.5 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  lineHeight: 1.3,
                  minHeight: '2.6em'
                }}
              >
                {post.titleOrType || post.contentText || 'Untitled Reel'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    width: 20,
                    height: 20,
                    fontSize: '0.65rem',
                    bgcolor: getAvatarColor(post.postDetails.userId)
                  }}
                >
                  {getAvatarInitials(post.postDetails.fullName)}
                </Avatar>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  {post.postDetails.fullName || 'Unknown User'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  const renderPosts = () => {
    const posts = filteredPosts.filter(p => p.postDetails.postType !== 'REEL')

    if (posts.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PhotoIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No posts found for #{hashtag}
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: { xs: 2, sm: 2 },
        width: '100%'
      }}>
        {posts.map((post) => {
          const postDetails = post.postDetails
          const mediaUrls = postDetails.mediaUrls 
            ? postDetails.mediaUrls.split(',').map((url: string) => url.trim())
            : []
          const hasMedia = mediaUrls.length > 0 && 
            (postDetails.postType === 'PHOTO' || 
             postDetails.postType === 'VIDEO')

          return (
            <Card
              key={`${postDetails.postId}-${postDetails.contentOwnerId}`}
              onClick={() => handlePostClick(postDetails.postId)}
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { 
                  boxShadow: theme.shadows[2],
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                {/* Post Header */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  mb: hasMedia || postDetails.content ? 1.5 : 0 
                }}>
                  <Avatar
                    sx={{
                      bgcolor: getAvatarColor(postDetails.userId),
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      fontSize: { xs: 16, sm: 18 },
                      mr: 1.5
                    }}
                  >
                    {getAvatarInitials(postDetails.fullName)}
                    
                  </Avatar>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {postDetails.fullName || 'Unknown User'}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.75,
                      flexWrap: 'wrap'
                    }}>
                      <Typography
                        variant="caption"
                        component="span"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        {postDetails.username || 'unknown'}
                      </Typography>
                      <Box sx={{ 
                        width: 3, 
                        height: 3, 
                        borderRadius: '50%', 
                        bgcolor: 'text.secondary',
                        opacity: 0.5
                      }} />
                      <Typography 
                        variant="caption" 
                        component="span"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        {getTimeAgo(postDetails.createdAt)}
                      </Typography>
                      {postDetails.postType !== 'TEXT' && (
                        <>
                          <Box sx={{ 
                            width: 3, 
                            height: 3, 
                            borderRadius: '50%', 
                            bgcolor: 'text.secondary',
                            opacity: 0.5
                          }} />
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            color: 'text.secondary' 
                          }}>
                            {getPostTypeIcon(postDetails.postType)}
                          </Box>
                        </>
                      )}
                    </Box>

                    {/* Trending Stats */}
                    {(post.trendScore > 0 || post.trendPercentage > 0) && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        {post.trendPercentage > 0 && (
                          <Chip
                            icon={<TrendingIcon />}
                            label={`+${post.trendPercentage.toFixed(1)}% trending`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: 'rgba(66, 103, 178, 0.1)',
                              color: '#4267b2',
                              '& .MuiChip-icon': { fontSize: 14 }
                            }}
                          />
                        )}
                        {post.viewCount > 0 && (
                          <Chip
                            label={`${post.viewCount.toLocaleString()} views`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: 'rgba(0, 0, 0, 0.05)'
                            }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('More options for post:', postDetails.postId)
                    }}
                    sx={{ ml: 1 }}
                  >
                    {/* <MoreIcon fontSize="small" /> */}
                  </IconButton>
                </Box>

                {/* Post Content */}
                {(postDetails.content || post.contentText) && (
                  <Box 
                    sx={{
                      mb: hasMedia ? 1.5 : 0,
                    }}
                  >
                    <Typography
                      variant="body1"
                      component="div"
                      sx={{
                        lineHeight: 1.5,
                        fontSize: { xs: '0.9rem', sm: '0.9375rem' },
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {postDetails.content || post.contentText || post.titleOrType}
                    </Typography>
                  </Box>
                )}

                {/* Post Media */}
                {hasMedia && (
                  <Box sx={{ 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    bgcolor: 'grey.100',
                    mb: 2
                  }}>
                    {postDetails.postType === 'PHOTO' ? (
                      <CardMedia
                        component="img"
                        image={mediaUrls[0]}
                        alt={postDetails.content || 'Post image'}
                        sx={{
                          width: '100%',
                          maxHeight: 500,
                          objectFit: 'contain',
                          bgcolor: '#000'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : postDetails.postType === 'VIDEO' ? (
                      <Box sx={{ position: 'relative', bgcolor: '#000' }}>
                        <video
                          src={mediaUrls[0]}
                          poster={postDetails.thumbnailUrl || undefined}
                          controls
                          style={{
                            width: '100%',
                            maxHeight: '500px',
                            objectFit: 'contain'
                          }}
                          onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </Box>
                    ) : null}
                  </Box>
                )}

                {/* Engagement Stats */}
                {(postDetails.likeCount || postDetails.commentCount || postDetails.shareCount) && (
                  <Box sx={{
                    display: 'flex',
                    gap: 3,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    {postDetails.likeCount !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FavoriteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {postDetails.likeCount}
                        </Typography>
                      </Box>
                    )}
                    {postDetails.commentCount !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CommentIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {postDetails.commentCount}
                        </Typography>
                      </Box>
                    )}
                    {postDetails.shareCount !== null && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ShareIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {postDetails.shareCount}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )
        })}
      </Box>
    )
  }

  const renderContent = () => {
    if (selectedTab === 'reels') {
      return renderReels()
    } else if (selectedTab === 'posts') {
      return renderPosts()
    } else {
      // Show all - posts first, then reels in grid
      const posts = filteredPosts.filter(p => p.postDetails.postType !== 'REEL')
      const reels = filteredPosts.filter(p => p.postDetails.postType === 'REEL')

      return (
        <>
          {posts.length > 0 && renderPosts()}
          {reels.length > 0 && (
            <Box sx={{ mt: posts.length > 0 ? 4 : 0 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Reels
              </Typography>
              {renderReels()}
            </Box>
          )}
        </>
      )
    }
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        px: { xs: 1, sm: 3, md: 4 }, 
        py: { xs: 1.5, sm: 3 }, 
        maxWidth: { xs: '100vw', md: '1200px' } 
      }}
    >
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: { xs: 3, sm: 4 },
        gap: 2
      }}>
        <IconButton 
          onClick={() => router.back()}
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <TrendingIcon sx={{ color: '#4267b2' }} />
            #{hashtag}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {allPosts.length} {allPosts.length === 1 ? 'result' : 'results'}
            {postsCount > 0 && ` • ${postsCount} ${postsCount === 1 ? 'post' : 'posts'}`}
            {reelsCount > 0 && ` • ${reelsCount} ${reelsCount === 1 ? 'reel' : 'reels'}`}
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: { xs: 3, sm: 4 }, overflowX: 'auto' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              minHeight: { xs: 40, sm: 48 },
              px: { xs: 2, sm: 3 },
              mr: { xs: 1, sm: 2 },
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab
            value="all"
            label={`All (${allPosts.length})`}
            sx={{
              bgcolor: selectedTab === 'all' ? 'primary.dark' : 'grey.200',
              color: selectedTab === 'all' ? 'white !important' : 'text.secondary',
              borderRadius: 3,
              minWidth: { xs: 'auto', sm: 100 },
              '&:hover': {
                bgcolor: selectedTab === 'all' ? 'primary.dark' : 'grey.300',
              },
            }}
          />
          <Tab
            value="posts"
            label={`Posts (${postsCount})`}
            sx={{
              bgcolor: selectedTab === 'posts' ? 'primary.dark' : 'grey.200',
              color: selectedTab === 'posts' ? 'white !important' : 'text.secondary',
              borderRadius: 3,
              minWidth: { xs: 'auto', sm: 100 },
              '&:hover': {
                bgcolor: selectedTab === 'posts' ? 'primary.dark' : 'grey.300',
              },
            }}
          />
          <Tab
            value="reels"
            label={`Reels (${reelsCount})`}
            sx={{
              bgcolor: selectedTab === 'reels' ? 'primary.dark' : 'grey.200',
              color: selectedTab === 'reels' ? 'white !important' : 'text.secondary',
              borderRadius: 3,
              minWidth: { xs: 'auto', sm: 100 },
              '&:hover': {
                bgcolor: selectedTab === 'reels' ? 'primary.dark' : 'grey.300',
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={40} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : allPosts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <TrendingIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No posts found for #{hashtag}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Be the first to post with this hashtag!
          </Typography>
        </Box>
      ) : (
        renderContent()
      )}
    </Container>
  )
}

export default HashtagPostsPage