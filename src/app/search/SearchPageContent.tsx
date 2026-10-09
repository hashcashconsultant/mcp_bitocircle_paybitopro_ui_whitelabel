// app/search/SearchPageContent.tsx
'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  InputAdornment,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Container,
  CircularProgress,
  CardMedia,
  IconButton
} from '@mui/material'


import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Favorite as FavoriteIcon,
  VideoLibrary as VideoIcon,
  Photo as PhotoIcon,
  MoreHoriz as MoreIcon,
} from '@mui/icons-material'

import { useRouter } from 'next/navigation'
import { useBroker } from '@/contexts/BrokerContext'
import { useSearch } from '@/contexts/SearchContext'

interface SearchUser {
  userId: number
  pageId: number
  entityType: string // "USER" or "PAGE"
  username: string
  fullName: string
  email: string
  createdAt: string
  isActive: string
  isUserFollowing: number
  profilePicture: string | null
}

interface SearchPost {
  postId: number
  adminUser: string | null
  pageId: string | null
  userId: number
  content: string
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
  isScheduled: string
  engagementScore: number
  thumbnailUrl: string | null
  videoDuration: number
  websiteUrl: string | null
  isThirdParty: string
  pollQuestion: string | null
  pollOptions: string | null
  pollDurationHours: number | null
  username: string
  fullName: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: string
  hasBookmarked: string
  poll: unknown | null
  taggedUsers: unknown | null
  userIdsToUntag: unknown | null
  taggedUsersCount: number
}

interface SearchReel {
  reelId: number
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

interface SearchResponse {
  success: boolean
  message: string
  data: {
    users?: SearchUser[]
    posts?: SearchPost[]
    reels?: SearchReel[]
    usersTotal?: number
    postsTotal?: number
    reelsTotal?: number
    totalResults: number
    page: number
    size: number
  }
  errorCode: string | null
}

type SearchType = 'USERS' | 'POSTS' | 'REELS' 

const SEARCH_TABS = [
  { label: 'People', type: 'USERS' as SearchType },
  { label: 'Posts', type: 'POSTS' as SearchType },
  { label: 'Reels', type: 'REELS' as SearchType },
]

const SearchPageContent: React.FC = () => {
  const router = useRouter()
  const { brokerDetails } = useBroker()
  const { searchQuery: contextQuery, setSearchQuery: setContextQuery, lastSearchTrigger } = useSearch()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [searchQuery, setSearchQuery] = useState(contextQuery)
  const [selectedTab, setSelectedTab] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchResponse['data'] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [followLoading, setFollowLoading] = useState<Set<string>>(new Set())
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const lastSearchedRef = useRef<{ query: string; type: SearchType } | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Generate unique key for each search result (handles both USER and PAGE entities)
  const getResultKey = (user: SearchUser) => {
    return `${user.entityType}-${user.userId}-${user.pageId}`
  }

  const performSearch = useCallback(async (
    query: string, 
    type: SearchType = 'USERS', 
    page: number = 0,
    append: boolean = false
  ) => {
    if (!query || !query.trim()) {
      console.log('performSearch: Empty query, skipping')
      setSearchResults(null)
      setHasMore(false)
      return
    }

    // For initial search (page 0), check if duplicate
    if (page === 0 && lastSearchedRef.current?.query === query && lastSearchedRef.current?.type === type && !append) {
      console.log('performSearch: Duplicate search prevented', { query, type })
      return
    }

    console.log('performSearch: Starting search with:', { query, type, page, append })
    
    if (page === 0 && !append) {
      lastSearchedRef.current = { query, type }
      setIsSearching(true)
      setCurrentPage(0)
      setHasMore(true)
    } else {
      setIsLoadingMore(true)
    }
    
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/feeds/search?searchTerm=${encodeURIComponent(query)}&type=${type}&page=${page}&size=20&userId=${localStorage.getItem('childUserId') || ''}&userType=${localStorage.getItem('userType') || 'USER'}`
      console.log('performSearch: Fetching URL:', url)
      
      const response = await fetchWithAuth(url)
      const data: SearchResponse = await response.json()
      
      console.log('performSearch: Response received:', data)
      
      if (data.success) {
        console.log('performSearch: Setting results, users count:', data.data.users?.length || 0)
        console.log('performSearch: Setting results, posts count:', data.data.posts?.length || 0)
        console.log('performSearch: Setting results, reels count:', data.data.reels?.length || 0)
        
        // Check if we have more data
        const currentResults = type === 'USERS' 
          ? (data.data.users?.length || 0)
          : type === 'POSTS'
          ? (data.data.posts?.length || 0)
          : (data.data.reels?.length || 0)
        
        const hasMoreData = currentResults === 20 // If we got a full page, there might be more
        setHasMore(hasMoreData)
        
        if (append && searchResults) {
          // Append new results to existing ones
          setSearchResults({
            ...data.data,
            users: [...(searchResults.users || []), ...(data.data.users || [])],
            posts: [...(searchResults.posts || []), ...(data.data.posts || [])],
            reels: [...(searchResults.reels || []), ...(data.data.reels || [])],
          })
        } else {
          // Replace with new results
          setSearchResults(data.data)
        }
      } else {
        console.log('performSearch: API returned success=false')
        if (!append) {
          setSearchResults(null)
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('performSearch: Error occurred:', error)
      if (!append) {
        setSearchResults(null)
      }
      setHasMore(false)
    } finally {
      setIsSearching(false)
      setIsLoadingMore(false)
    }
  }, [searchResults])

  // Load more data when scrolling
  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isSearching && hasMore && searchQuery.trim()) {
      const nextPage = currentPage + 1
      console.log('loadMore: Loading page', nextPage)
      setCurrentPage(nextPage)
      performSearch(searchQuery, SEARCH_TABS[selectedTab].type, nextPage, true)
    }
  }, [isLoadingMore, isSearching, hasMore, currentPage, searchQuery, selectedTab, performSearch])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Observer: Target intersecting, loading more')
          loadMore()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore])

  useEffect(() => {
    console.log('🔍 SearchPageContent: Context query changed:', contextQuery)
    console.log('🔍 SearchPageContent: Last search trigger:', lastSearchTrigger)
    
    if (contextQuery && contextQuery.trim()) {
      setSearchQuery(contextQuery)
      setCurrentPage(0)
      setHasMore(true)
      const searchType = SEARCH_TABS[selectedTab].type
      performSearch(contextQuery, searchType, 0, false)
    }
  }, [lastSearchTrigger])

  useEffect(() => {
    const query = searchQuery || contextQuery
    if (query && query.trim()) {
      setCurrentPage(0)
      setHasMore(true)
      const searchType = SEARCH_TABS[selectedTab].type
      performSearch(query, searchType, 0, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab])

  const handleTabChangeButton = (event: React.SyntheticEvent, newValue: number) => {
    console.log('Tab changed to:', newValue)
    setSelectedTab(newValue)
    setSearchResults(null)
    setCurrentPage(0)
    setHasMore(true)
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmedQuery = searchQuery.trim()
    
    if (trimmedQuery) {
      console.log('handleSearch: Searching for:', trimmedQuery)
      lastSearchedRef.current = null
      setContextQuery(trimmedQuery)
      setCurrentPage(0)
      setHasMore(true)
      performSearch(trimmedQuery, SEARCH_TABS[selectedTab].type, 0, false)
    }
  }

  const handleFollowToggle = async (user: SearchUser) => {
    const resultKey = getResultKey(user)
    
    if (followLoading.has(resultKey)) {
      return
    }

    setFollowLoading(prev => new Set(prev).add(resultKey))

    try {
      // Get follower info from localStorage
      const followerId = localStorage.getItem('childPageId') || ''
      const followerType = localStorage.getItem('userType') || 'USER'
      
      // Determine followingId: if userId is 0, use pageId; otherwise use userId
      const followingId = user.userId === 0 ? String(user.pageId) : String(user.userId)
      const followingType = user.entityType // "USER" or "PAGE"

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/followUnfollowUser',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            followerId: followerId,
            followingId: followingId,
            followerType: followerType,
            followingType: followingType
          }),
        }
      )

      const data = await response.json()
      console.log('Follow/Unfollow response:', data)
      
      if (data.success) {
        setSearchResults(prev => {
          if (!prev || !prev.users) return prev
          
          return {
            ...prev,
            users: prev.users.map(u => 
              getResultKey(u) === resultKey
                ? { ...u, isUserFollowing: u.isUserFollowing === 1 ? 0 : 1 }
                : u
            )
          }
        })
      }
    } catch (error) {
      console.error('Follow/Unfollow error:', error)
    } finally {
      setFollowLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(resultKey)
        return newSet
      })
    }
  }

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ')
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : fullName.substring(0, 2).toUpperCase()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getTimeAgo = (dateString: string): string => {
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
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    const years = Math.floor(days / 365)
    return `${years}y ago`
  }

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'PHOTO':
        return <PhotoIcon sx={{ fontSize: 16 }} />
      case 'VIDEO':
        return <VideoIcon sx={{ fontSize: 16 }} />
      case 'REEL':
        return <VideoIcon sx={{ fontSize: 16 }} />
      default:
        return null
    }
  }

  const handleReelClick = (clickedReel: SearchReel) => {
    console.log('🔍 handleReelClick called')
    console.log('🔍 Clicked reel:', clickedReel)
    
    try {
      // Store only the clicked reel in localStorage
      localStorage.setItem('selectedReel', JSON.stringify(clickedReel))
      
      console.log('🔍 Reel stored in localStorage')
      
      // Navigate to reel page
      router.push('/reels')
    } catch (error) {
      console.error('🔍 Error storing reel:', error)
    }
  }

  const renderUserResults = () => {
    const users = searchResults?.users || []
    const total = searchResults?.usersTotal || 0
    
    if (users.length === 0 && !isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No people found for &quot;{searchQuery}&quot;
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try searching with different keywords
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {total} {total === 1 ? 'person' : 'people'} found
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {users.map((user: SearchUser) => {
            const isFollowing = user.isUserFollowing === 1
            const resultKey = getResultKey(user)
            const isLoading = followLoading.has(resultKey)
            
            return (
              <Card 
                key={resultKey}
                elevation={0}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}>
                    <Avatar 
                      src={user.profilePicture || undefined}
                      onClick={() => router.push(`/public/${user.userId}/${user.pageId}`)}
                      sx={{ 
                        width: { xs: 50, sm: 60 }, 
                        height: { xs: 50, sm: 60 }, 
                        bgcolor: 'primary.main', 
                        cursor: 'pointer',
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      {!user.profilePicture && getInitials(user.fullName)}
                    </Avatar>
                    
                    <Box sx={{ 
                      flex: 1, 
                      minWidth: 0,
                      width: { xs: '100%', sm: 'auto' }
                    }}>
                      <Typography 
                        variant="h6" 
                        fontWeight={600}
                        sx={{ 
                          mb: 0.5,
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                          fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                        onClick={() => router.push(`/public/${user.userId}/${user.pageId}`)}
                      >
                        {user.fullName}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {user.username}
                      </Typography>

                      <Typography variant="caption" color="text.secondary">
                        Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </Typography>
                    </Box>

                    <Button
                      variant={isFollowing ? "outlined" : "contained"}
                      startIcon={
                        isLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : isFollowing ? (
                          <CheckCircleIcon />
                        ) : (
                          <PersonAddIcon />
                        )
                      }
                      onClick={() => handleFollowToggle(user)}
                      disabled={isLoading}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        minWidth: { xs: '100%', sm: 120 },
                        width: { xs: '100%', sm: 'auto' },
                        mt: { xs: 2, sm: 0 },
                        ...(isFollowing && {
                          bgcolor: 'grey.200 !important',
                          color: 'text.primary !important',
                          borderColor: 'grey.300',
                          '& .MuiButton-startIcon': {
                            color: 'primary.main',
                          },
                          '&:hover': {
                            bgcolor: 'grey.300 !important',
                            borderColor: 'grey.400',
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'grey.200 !important',
                            color: 'text.primary !important', 
                            borderColor: 'grey.300',
                            WebkitTextFillColor: 'primary.main',
                            '& .MuiButton-startIcon': {
                              color: 'primary.main !important',
                            },
                          }
                        })
                      }}
                    >
                      {isLoading 
                        ? 'Loading...' 
                        : isFollowing 
                          ? 'Following' 
                          : 'Follow'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      </Box>
    )
  }

  const renderReelResults = () => {
    const reels = searchResults?.reels || []
    const total = searchResults?.reelsTotal || 0
    
    if (reels.length === 0 && !isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No reels found for &quot;{searchQuery}&quot;
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try searching with different keywords
          </Typography>
        </Box>
      )
    }

    return (
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {total} {total === 1 ? 'reel' : 'reels'} found
        </Typography>
        
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
          {reels.map((reel: SearchReel) => (
            <Card
              key={reel.reelId}
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
              onClick={() => handleReelClick(reel)}
            >
              {/* Thumbnail/Cover */}
              <Box sx={{ position: 'relative', paddingTop: '177.78%', bgcolor: '#000' }}>
                {reel.coverImage ? (
                  <CardMedia
                    component="img"
                    image={reel.coverImage}
                    alt={reel.title}
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
                  {formatDuration(reel.duration)}
                </Box>

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
                      {formatNumber(reel.likeCount)}
                    </Typography>
                  </Box>
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
                  {reel.title || reel.description || 'Untitled Reel'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      fontSize: '0.65rem',
                      bgcolor: '#4267b2'
                    }}
                  >
                    {reel.fullName.charAt(0)}
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
                    {reel.fullName}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    )
  }

  const renderPostResults = () => {
    const posts = searchResults?.posts || []
    
    if (posts.length === 0 && !isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No posts found for &quot;{searchQuery}&quot;
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {posts.map((post: SearchPost) => {
          const mediaUrls = post.mediaUrls ? post.mediaUrls.split(',').map((url: string) => url.trim()) : []
          const hasMedia = mediaUrls.length > 0 && mediaUrls[0] !== ''
          
          return (
            <Card 
              key={post.postId}
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
              onClick={() => {
                // Navigate to post detail - uncomment when ready
                // router.push(`/post/${post.postId}`)
                console.log('Navigate to post:', post.postId)
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                {/* Post Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: post.content ? 1.5 : 0 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: '#4267b2',
                      width: 40,
                      height: 40,
                      fontSize: '1rem',
                      fontWeight: 600,
                      mr: 1.5
                    }}
                  >
                    {post.fullName?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <Typography 
                        variant="body1" 
                        component="div"
                        fontWeight={600}
                        sx={{ 
                          fontSize: { xs: '0.95rem', sm: '1rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {post.fullName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography 
                        variant="caption" 
                        component="span"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.8125rem' } }}
                      >
                        {post.username}
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
                        {getTimeAgo(post.createdAt)}
                      </Typography>
                      {post.postType !== 'TEXT' && (
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
                            {getPostTypeIcon(post.postType)}
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('More options for post:', post.postId)
                    }}
                    sx={{ ml: 1 }}
                  >
                    {/* <MoreIcon fontSize="small" /> */}
                  </IconButton>
                </Box>

                {/* Post Content */}
                {post.content && (
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
                      {post.content}
                    </Typography>
                  </Box>
                )}

                {/* Post Media */}
                {hasMedia && (
                  <Box sx={{ 
                    borderRadius: 2, 
                    overflow: 'hidden',
                    bgcolor: 'grey.100'
                  }}>
                    {post.postType === 'PHOTO' ? (
                      <CardMedia
                        component="img"
                        image={mediaUrls[0]}
                        alt={post.content || 'Post image'}
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
                    ) : post.postType === 'VIDEO' ? (
                      <Box sx={{ position: 'relative', bgcolor: '#000' }}>
                        <video
                          src={mediaUrls[0]}
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
              </CardContent>
            </Card>
          )
        })}
      </Box>
    )
  }

  const renderResults = () => {
    if (!searchResults && !isSearching) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Search for people, posts, reels, and more
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Enter a keyword to start searching
          </Typography>
        </Box>
      )
    }

    if (isSearching && !searchResults) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )
    }

    return (
      <>
        {/* Render appropriate results based on selected tab */}
        {selectedTab === 0 && renderUserResults()}
        {selectedTab === 1 && renderPostResults()}
        {selectedTab === 2 && renderReelResults()}

        {/* Loading more indicator */}
        {isLoadingMore && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Intersection observer target */}
        <Box 
          ref={observerTarget}
          sx={{ height: 20, visibility: 'hidden' }}
        />

        {/* End of results message */}
        {!hasMore && searchResults && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No more results to load
            </Typography>
          </Box>
        )}
      </>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 3, md: 4 }, py: { xs: 1.5, sm: 3 }, maxWidth: { xs: '100vw', md: '1200px' } }}>
      <Typography variant="h4" sx={{ mb: { xs: 3, sm: 4 }, fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        Search
      </Typography>

      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: { xs: 3, sm: 4 }, width: '100%', alignItems: { sm: 'center' } }}>
        <TextField
          fullWidth
          placeholder="Search for people, reels, posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size={isMobile ? "small" : "medium"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 3,
              bgcolor: 'background.paper',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }
          }}
        />
        <Button 
          type="submit"
          variant="contained"
          startIcon={<SearchIcon />}
          size={isMobile ? "medium" : "large"}
          disabled={!searchQuery.trim() || isSearching}
          sx={{ 
            borderRadius: 3, 
            px: { xs: 2, sm: 3 },
            minWidth: { xs: '100%', sm: 140 },
            width: { xs: '100%', sm: 'auto' },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      <Box sx={{ mb: { xs: 3, sm: 4 }, overflowX: 'auto' }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChangeButton}
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
          {SEARCH_TABS.map((tab, index) => (
            <Tab
              key={tab.type}
              label={tab.label}
              sx={{
                bgcolor: selectedTab === index ? 'primary.dark' : 'grey.200',
                color: selectedTab === index ? 'white !important' : 'text.secondary',
                borderRadius: 3,
                minWidth: { xs: 'auto', sm: 100 },
                '&:hover': {
                  bgcolor: selectedTab === index ? 'primary.dark' : 'grey.300',
                },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {renderResults()}
    </Container>
  )
}

export default SearchPageContent