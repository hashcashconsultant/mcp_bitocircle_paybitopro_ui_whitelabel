'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  AvatarGroup,
  IconButton,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Skeleton,
  Slider
} from '@mui/material';
import {
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  ChatBubbleOutline as CommentIcon,
  PersonAdd as FollowIcon,
  AlternateEmail as MentionIcon,
  Replay as ShareIcon,
  SwapHoriz as InteractionsIcon,
  PhotoLibrary as PhotosIcon,
  History as HistoryIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  PlayCircleOutline as PlayIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

type MenuOption = 'interactions' | 'photos' | 'history';
type SortOrder = 'newest' | 'oldest';
type ActivityType = 'LIKE' | 'COMMENT' | 'REPLY' | 'REVIEW';

interface SortFilterState {
  sortOrder: SortOrder;
  startMonth: string;
  startDay: string;
  startYear: string;
  endMonth: string;
  endDay: string;
  endYear: string;
}

interface APIInteraction {
  id: number;
  actorId: number;
  actorUsername: string;
  actorName: string;
  type: string;
  contentType: string;
  contentId: number;
  isRead: string;
  date: string;
  contentPreview: string;
  url: string;
  likes?: number;
  comments?: number;
  mediaType?: string;
  userId?: number;
  pageId?: number;
  likeCount?: number;    
  commentCount?: number;
}

interface APIResponse {
  success: boolean;
  message: string;
  data: {
    interactions: APIInteraction[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  errorCode: string | null;
}

// Account History specific interfaces
interface AccountHistoryItem {
  id: number;
  date: string;
  action: string;
  description: string;
}

interface AccountHistoryAPIResponse {
  success: boolean;
  message: string;
  data: {
    errorCode: number;
    errorMessage: string;
    interactions: AccountHistoryItem[];
    totalCount: number;
    pageNo: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
  errorCode: string | null;
}

interface ActivityItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  users: Array<{
    name: string;
    username: string;
    avatar?: string;
    avatarColor?: string;
  }>;
  content?: string;
  postImage?: string;
  postType?: 'post' | 'reel' | 'reply';
  time: string;
  isFollowBack?: boolean;
  postId?: string;
}

interface PhotoItem {
  id: string;
  url: string;
  type: 'photo' | 'video' | 'reel';
  date: string;
  likes: number;
  comments: number;
}

interface HistoryItem {
  id: string;
  action: string;
  description: string;
  date: string;
  type: string;
}

const InstagramStyleActivity: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedMenu, setSelectedMenu] = useState<MenuOption>('interactions');
  const [followStatus, setFollowStatus] = useState<{ [key: string]: boolean }>({});
  const [selectedTab, setSelectedTab] = useState(0);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [currentSortOrder, setCurrentSortOrder] = useState<SortOrder>('newest');
  
  // Mobile view state - tracks whether to show content or menu on mobile
  const [showMobileContent, setShowMobileContent] = useState(false);
  
  const [sortFilterState, setSortFilterState] = useState<SortFilterState>(() => {
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      sortOrder: 'newest',
      startMonth: 'March',
      startDay: '3',
      startYear: '2024',
      endMonth: monthNames[today.getMonth()],
      endDay: today.getDate().toString(),
      endYear: today.getFullYear().toString()
    };
  });

  // API data states
  const [likesData, setLikesData] = useState<APIInteraction[]>([]);
  const [commentsData, setCommentsData] = useState<APIInteraction[]>([]);
  const [storyRepliesData, setStoryRepliesData] = useState<APIInteraction[]>([]);
  const [reviewsData, setReviewsData] = useState<APIInteraction[]>([]);
  const [postsData, setPostsData] = useState<APIInteraction[]>([]);
  const [accountHistoryData, setAccountHistoryData] = useState<AccountHistoryItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  
  const [currentOffset, setCurrentOffset] = useState(1);
  const [postsOffset, setPostsOffset] = useState<number | null>(null);
  const [historyPageNumber, setHistoryPageNumber] = useState(1);
  
  const [hasMore, setHasMore] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);

  // Get userId from localStorage
  const getUserId = () => {
    const uuid = localStorage.getItem('childUserId');
    return uuid;
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (month: string, day: string, year: string): string => {
    const monthMap: { [key: string]: string } = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const monthNum = monthMap[month] || '01';
    const dayPadded = day.padStart(2, '0');
    return `${year}-${monthNum}-${dayPadded}`;
  };

  // Helper function to check if URL is a video
  const isVideoUrl = (url: string, contentType?: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    const isVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
    const isReelContent = contentType?.toUpperCase() === 'REEL';
    const isVideoContent = contentType?.toUpperCase() === 'VIDEO';
    return isVideoExtension || isReelContent || isVideoContent;
  };

  // Navigate to post page based on content type
  const handleNavigateToPost = (interaction: APIInteraction) => {
    const contentId = interaction.contentId || interaction.id;
    const userId = interaction.userId || interaction.actorId || 0;
    const pageId = interaction.pageId || 0;
    const contentType = interaction.contentType?.toUpperCase();

    if (contentType === 'REEL') {
      window.location.href = `/post/${contentId}/${userId}/${pageId}?REEL`;
    } else {
      window.location.href = `/post/${contentId}/${userId}/${pageId}`;
    }
  };

  // Handle menu item click - show content on mobile
  const handleMenuClick = (menuId: MenuOption) => {
    setSelectedMenu(menuId);
    if (isMobile) {
      setShowMobileContent(true);
    }
  };

  // Handle back button on mobile
  const handleMobileBack = () => {
    setShowMobileContent(false);
  };

  // Fetch account history from API
  const fetchAccountHistory = async (pageNum: number = 1, isLoadMore: boolean = false) => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Format dates
      const startDate = formatDateForAPI(
        sortFilterState.startMonth,
        sortFilterState.startDay,
        sortFilterState.startYear
      );
      const endDate = formatDateForAPI(
        sortFilterState.endMonth,
        sortFilterState.endDay,
        sortFilterState.endYear
      );

      // Map sort order to API format
      const apiSortOrder = currentSortOrder === 'newest' ? 'DESC' : 'ASC';

      const url = `https://institutional-bo.paybito.com:8443/BitohubService/activity/getAccountHistory?userId=${userId}&pageNumber=${pageNum}&pageSize=20&sortOrder=${apiSortOrder}&startDate=${startDate}&endDate=${endDate}&searchString=`;

      const response = await fetchWithAuth(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account history');
      }

      const result: AccountHistoryAPIResponse = await response.json();
      
      if (result.success) {
        if (isLoadMore) {
          setAccountHistoryData(prev => [...prev, ...result.data.interactions]);
        } else {
          setAccountHistoryData(result.data.interactions);
        }
        setHasMoreHistory(result.data.hasMore);
        setHistoryPageNumber(pageNum);
      } else {
        throw new Error(result.data.errorMessage || 'Failed to load account history');
      }
    } catch (err) {
      console.error('Error fetching account history:', err);
      setHistoryError(err instanceof Error ? err.message : 'Failed to load account history. Please try again.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch activities from API
  const fetchActivities = async (activityType: ActivityType, offset: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userId = getUserId();
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/activity/getActivities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          activityType: activityType,
          offset: offset,
          limit: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const result: APIResponse = await response.json();
      
      if (result.success && result.data) {
        switch (activityType) {
          case 'LIKE':
            setLikesData(offset === 1 ? result.data.interactions : [...likesData, ...result.data.interactions]);
            break;
          case 'COMMENT':
            setCommentsData(offset === 1 ? result.data.interactions : [...commentsData, ...result.data.interactions]);
            break;
          case 'REPLY':
            setStoryRepliesData(offset === 1 ? result.data.interactions : [...storyRepliesData, ...result.data.interactions]);
            break;
          case 'REVIEW':
            setReviewsData(offset === 1 ? result.data.interactions : [...reviewsData, ...result.data.interactions]);
            break;
        }
        setHasMore(result.data.hasMore);
      } else {
        setError(result.message || 'Failed to load activities');
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch posts from API
  const fetchPosts = async (offset: number | null = null, limit: number | null = null) => {
    setIsLoadingPosts(true);
    setPostsError(null);
    
    try {
      const userId = getUserId();
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/activity/getPosts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          pageId: localStorage.getItem('pageId') || '',
          offset: "1",
          limit: "20"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const result: APIResponse = await response.json();
      
      if (result.success && result.data) {
        if (!offset || offset === 0) {
          setPostsData(result.data.interactions);
        } else {
          setPostsData(prevPosts => [...prevPosts, ...result.data.interactions]);
        }
        setHasMorePosts(result.data.hasMore);
        
        if (result.data.interactions.length > 0) {
          setPostsOffset((offset || 0) + result.data.interactions.length);
        }
      } else {
        setPostsError(result.message || 'Failed to load posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPostsError('Failed to load posts. Please try again.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    const activityTypes: ActivityType[] = ['LIKE', 'COMMENT', 'REPLY', 'REVIEW'];
    const currentActivityType = activityTypes[selectedTab];
    
    const hasData: Record<number, boolean> = {
      0: likesData.length > 0,
      1: commentsData.length > 0,
      2: storyRepliesData.length > 0,
      3: reviewsData.length > 0
    };

    if (!hasData[selectedTab]) {
      fetchActivities(currentActivityType, 1);
    }
  }, [selectedTab]);

  // Fetch posts when Photos menu is selected
  useEffect(() => {
    if (selectedMenu === 'photos' && postsData.length === 0) {
      fetchPosts(null, null);
    }
  }, [selectedMenu]);

  // Fetch account history when History menu is selected
  useEffect(() => {
    if (selectedMenu === 'history' && accountHistoryData.length === 0) {
      fetchAccountHistory(1, false);
    }
  }, [selectedMenu]);

  // Refetch account history when sort order changes
  useEffect(() => {
    if (selectedMenu === 'history') {
      fetchAccountHistory(1, false);
    }
  }, [currentSortOrder]);

  // Initial load - fetch likes data
  useEffect(() => {
    fetchActivities('LIKE', 1);
  }, []);

  // Generate random color for avatar
  const getRandomAvatarColor = () => {
    const colors = ['#e91e63', '#4267b2', '#42b883', '#9c27b0', '#ff6f00', '#00bcd4', '#4caf50', '#ff5722'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Convert API interaction to display format
  const convertToDisplayFormat = (interaction: APIInteraction) => {
    return {
      id: interaction.id.toString(),
      user: {
        name: interaction.actorName,
        username: interaction.actorUsername,
        avatarColor: getRandomAvatarColor()
      },
      content: interaction.contentPreview,
      time: interaction.date,
      postImage: interaction.url || `https://picsum.photos/100/100?random=${interaction.id}`,
      type: interaction.type.toLowerCase()
    };
  };

  // Determine media type for posts
  const getPostMediaType = (post: APIInteraction): 'photo' | 'video' | 'reel' => {
    if (post.contentType) {
      const contentType = post.contentType.toLowerCase();
      if (contentType.includes('video')) return 'video';
      if (contentType.includes('reel')) return 'reel';
    }
    return 'photo';
  };

  // Get icon for history action type
  const getHistoryIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('website') || actionLower === 'website') return '🔗';
    if (actionLower.includes('messaging') || actionLower.includes('message')) return '💬';
    if (actionLower.includes('password')) return '🔐';
    if (actionLower.includes('phone')) return '📱';
    if (actionLower.includes('username')) return '@';
    if (actionLower.includes('bio')) return '📝';
    if (actionLower.includes('account') || actionLower.includes('created')) return '👤';
    if (actionLower.includes('email')) return '📧';
    if (actionLower.includes('profile')) return '🖼️';
    if (actionLower.includes('privacy')) return '🔒';
    return '📋';
  };

  const handleFollowToggle = (activityId: string) => {
    setFollowStatus(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const handleSortFilterApply = () => {
    setCurrentSortOrder(sortFilterState.sortOrder);
    setSortDialogOpen(false);
  };

  const handleLoadMore = () => {
    const activityTypes: ActivityType[] = ['LIKE', 'COMMENT', 'REPLY', 'REVIEW'];
    const currentActivityType = activityTypes[selectedTab];
    const newOffset = currentOffset + 10;
    setCurrentOffset(newOffset);
    fetchActivities(currentActivityType, newOffset);
  };

  const handleLoadMorePosts = () => {
    if (postsOffset !== null) {
      fetchPosts(postsOffset, null);
    }
  };

  const handleLoadMoreHistory = () => {
    fetchAccountHistory(historyPageNumber + 1, true);
  };

  const menuOptions = [
    {
      id: 'interactions' as MenuOption,
      title: 'Interactions',
      subtitle: 'Review and delete likes, comments, and your other interactions.',
      icon: <InteractionsIcon />
    },
    {
      id: 'photos' as MenuOption,
      title: 'Photos and videos',
      subtitle: 'View, archive or delete photos and videos you\'ve shared.',
      icon: <PhotosIcon />
    },
    {
      id: 'history' as MenuOption,
      title: 'Account history',
      subtitle: 'Review changes you\'ve made to your account since you created it.',
      icon: <HistoryIcon />
    }
  ];

  const renderSortButtons = () => (
    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
      <Button 
        size="small" 
        sx={{ 
          textTransform: 'none', 
          color: 'text.primary',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          '&:hover': { bgcolor: 'transparent', cursor: 'default'}
        }}
      >
        {currentSortOrder === 'newest' ? 'Newest to oldest' : 'Oldest to newest'}
      </Button>
      <Button 
        size="small" 
        onClick={() => setSortDialogOpen(true)}
        sx={{ 
          textTransform: 'none', 
          color: 'text.primary',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
        }}
      >
        Sort & filter
      </Button>
    </Box>
  );

  const renderLoadingState = () => (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {[1, 2, 3].map((item) => (
        <Box key={item} sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ ml: 2, flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="40%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width={44} height={44} />
        </Box>
      ))}
    </Box>
  );

  const renderLoadingGrid = () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5, p: 0.5 }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
        <Box key={item}>
          <Box sx={{ position: 'relative', paddingTop: '100%' }}>
            <Skeleton 
              variant="rectangular" 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }} 
            />
          </Box>
        </Box>
      ))}
    </Box>
  );

  // Mobile header with back button
  const renderMobileHeader = (title: string) => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      px: 1,
      py: 1.5,
      borderBottom: `1px solid ${theme.palette.divider}`,
      position: 'sticky',
      top: 0,
      bgcolor: 'background.paper',
      zIndex: 10
    }}>
      <IconButton onClick={handleMobileBack} size="small">
        <BackIcon />
      </IconButton>
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
        {title}
      </Typography>
    </Box>
  );

  const renderInteractionsContent = () => {
    const renderLikesTab = () => {
      // Filter out TEXT content type
      const filteredLikes = likesData.filter(like => 
        like.contentType !== 'TEXT' && like.contentType !== 'text'
      );

      return (
        <>
          {isLoading && likesData.length === 0 ? (
            renderLoadingGrid()
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={() => fetchActivities('LIKE', 1)} sx={{ mt: 2 }}>
                Retry
              </Button>
            </Box>
          ) : filteredLikes.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No likes yet</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
                {filteredLikes.map((like) => {
                  const displayData = convertToDisplayFormat(like);
                  const contentType = like.contentType?.toUpperCase();
                  const isVideo = contentType === 'REEL' || contentType === 'VIDEO';
                  const mediaUrl = like.url || '';

                  return (
                    <Box key={like.id} onClick={() => handleNavigateToPost(like)}>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          cursor: 'pointer',
                          bgcolor: theme.palette.action.hover,
                          '&:hover .overlay': { opacity: 1 },
                          '&:hover video': { opacity: 0.7 }
                        }}
                      >
                        {isVideo && mediaUrl ? (
                          // Video/Reel content
                          <>
                            <Box
                              component="video"
                              src={mediaUrl}
                              muted
                              loop
                              playsInline
                              onMouseEnter={(e) => {
                                const video = e.target as HTMLVideoElement;
                                video.play().catch(() => {});
                              }}
                              onMouseLeave={(e) => {
                                const video = e.target as HTMLVideoElement;
                                video.pause();
                                video.currentTime = 0;
                              }}
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'opacity 0.2s'
                              }}
                            />
                            {/* Play icon indicator */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                color: 'white',
                                zIndex: 1,
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                              }}
                            >
                              <PlayIcon sx={{ fontSize: 24 }} />
                            </Box>
                          </>
                        ) : (
                          // Photo content
                          <Box
                            component="img"
                            src={mediaUrl || `https://picsum.photos/300/300?random=${like.id}`}
                            alt={like.contentPreview || 'Post'}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        
                        {/* Hover overlay with user info */}
                        <Box
                          className="overlay"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            color: 'white',
                            p: 2,
                            zIndex: 2
                          }}
                        >
                          <Avatar sx={{ bgcolor: displayData.user.avatarColor, mb: 1 }}>
                            {displayData.user.name[0]}
                          </Avatar>
                          <Typography variant="caption" align="center" sx={{ fontWeight: 500 }}>
                            {displayData.user.username}
                          </Typography>
                          <Typography variant="caption" align="center" sx={{ opacity: 0.8, mt: 0.5 }}>
                            {like.contentType} • {displayData.time}
                          </Typography>
                          {like.contentPreview && (
                            <Typography 
                              variant="caption" 
                              align="center" 
                              sx={{ 
                                opacity: 0.9, 
                                mt: 1,
                                maxWidth: '90%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}
                            >
                              {like.contentPreview}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              {hasMore && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Button onClick={handleLoadMore} disabled={isLoading}>
                    {isLoading ? <CircularProgress size={20} /> : 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      );
    };

    const renderCommentsTab = () => (
      <>
        <Box sx={{ 
          position: { xs: 'relative', md: 'absolute' }, 
          top: { md: 112 }, 
          right: { md: 24 },
          zIndex: 10,
          px: { xs: 2, md: 0 },
          py: { xs: 1, md: 0 }
        }}>
          {/* {renderSortButtons()} */}
        </Box>
        {isLoading && commentsData.length === 0 ? (
          renderLoadingState()
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={() => fetchActivities('COMMENT', 1)} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : commentsData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', mt: { xs: 2, md: 6 } }}>
            <Typography color="text.secondary">No comments yet</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0, mt: { xs: 0, md: 6 } }}>
              {commentsData.map((comment, index) => {
                const displayData = convertToDisplayFormat(comment);
                const hasMedia = !!comment.url;
                const isVideo = isVideoUrl(comment.url, comment.contentType);

                return (
                  <React.Fragment key={comment.id}>
                    <ListItem
                      sx={{
                        py: { xs: 1.5, sm: 2 },
                        px: { xs: 2, sm: 3 },
                        display: 'flex',
                        alignItems: 'flex-start',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                        <Avatar
                          sx={{
                            bgcolor: displayData.user.avatarColor,
                            width: { xs: 36, sm: 44 },
                            height: { xs: 36, sm: 44 }
                          }}
                        >
                          {displayData.user.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ flex: 1, ml: { xs: 0, sm: 1 } }}
                        primary={
                          <Box>
                            <Typography
                              component="span"
                              sx={{
                                fontWeight: 600,
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                mr: 1
                              }}
                            >
                              {displayData.user.username}
                            </Typography>
                            <Typography
                              component="span"
                              sx={{
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                color: 'text.primary'
                              }}
                            >
                              {displayData.content}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' }
                              }}
                            >
                              {displayData.time}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                bgcolor: 'action.hover',
                                px: 1,
                                py: 0.25,
                                borderRadius: 1
                              }}
                            >
                              {comment.contentType}
                            </Typography>
                          </Box>
                        }
                      />
                      
                      {/* Media Thumbnail - Clickable to navigate */}
                      <Box
                        onClick={() => handleNavigateToPost(comment)}
                        sx={{
                          position: 'relative',
                          width: { xs: 44, sm: 54 },
                          height: { xs: 44, sm: 54 },
                          flexShrink: 0,
                          borderRadius: 1,
                          overflow: 'hidden',
                          bgcolor: theme.palette.action.hover,
                          cursor: 'pointer',
                          '&:hover': {
                            '& .media-overlay': { opacity: 1 }
                          }
                        }}
                      >
                        {hasMedia ? (
                          isVideo ? (
                            // Video thumbnail
                            <>
                              <Box
                                component="video"
                                src={comment.url}
                                muted
                                preload="metadata"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                onLoadedData={(e) => {
                                  const video = e.target as HTMLVideoElement;
                                  video.currentTime = 1;
                                }}
                              />
                              {/* Play icon overlay */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  bgcolor: 'rgba(0,0,0,0.2)'
                                }}
                              >
                                <PlayIcon sx={{ 
                                  fontSize: 20, 
                                  color: 'white',
                                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                                }} />
                              </Box>
                              {/* Hover overlay */}
                              <Box
                                className="media-overlay"
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.4)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.2s'
                                }}
                              >
                                <PlayArrowIcon sx={{ fontSize: 24, color: 'white' }} />
                              </Box>
                            </>
                          ) : (
                            // Image thumbnail
                            <>
                              <Box
                                component="img"
                                src={comment.url}
                                alt="Post"
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                              {/* Hover overlay */}
                              <Box
                                className="media-overlay"
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  bgcolor: 'rgba(0,0,0,0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity 0.2s'
                                }}
                              >
                                <FullscreenIcon sx={{ fontSize: 20, color: 'white' }} />
                              </Box>
                            </>
                          )
                        ) : (
                          // No media - show text post placeholder
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: theme.palette.grey[200]
                            }}
                          >
                            <CommentIcon sx={{ 
                              fontSize: 20, 
                              color: theme.palette.grey[500] 
                            }} />
                          </Box>
                        )}
                      </Box>
                    </ListItem>
                    {index < commentsData.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
            {hasMore && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button onClick={handleLoadMore} disabled={isLoading}>
                  {isLoading ? <CircularProgress size={20} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </>
    );

    const renderStoryRepliesTab = () => (
      <>
        {isLoading && storyRepliesData.length === 0 ? (
          renderLoadingState()
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={() => fetchActivities('REPLY', 1)} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : storyRepliesData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No story replies yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {storyRepliesData.map((reply, index) => {
              const displayData = convertToDisplayFormat(reply);
              return (
                <React.Fragment key={reply.id}>
                  <ListItem
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                      <Avatar
                        sx={{
                          bgcolor: displayData.user.avatarColor,
                          width: { xs: 36, sm: 44 },
                          height: { xs: 36, sm: 44 }
                        }}
                      >
                        {displayData.user.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '0.85rem', sm: '0.95rem' },
                              mr: 1
                            }}
                          >
                            {displayData.user.username}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontSize: { xs: '0.85rem', sm: '0.95rem' }
                            }}
                          >
                            replied to your story: &ldquo;{displayData.content}&rdquo;
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {displayData.time}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < storyRepliesData.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </>
    );

    const renderReviewsTab = () => (
      <>
        {isLoading && reviewsData.length === 0 ? (
          renderLoadingState()
        ) : error ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={() => fetchActivities('REVIEW', 1)} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : reviewsData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No reviews yet</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {reviewsData.map((review, index) => {
              const displayData = convertToDisplayFormat(review);
              return (
                <React.Fragment key={review.id}>
                  <ListItem
                    onClick={() => handleNavigateToPost(review)}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: { xs: 48, sm: 56 } }}>
                      <Avatar
                        sx={{
                          bgcolor: displayData.user.avatarColor,
                          width: { xs: 36, sm: 44 },
                          height: { xs: 36, sm: 44 }
                        }}
                      >
                        {displayData.user.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      sx={{ flex: 1 }}
                      primary={
                        <Box>
                          <Typography
                            component="span"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: '0.85rem', sm: '0.95rem' },
                              mr: 1
                            }}
                          >
                            {displayData.user.username}
                          </Typography>
                          <Typography
                            component="span"
                            sx={{
                              fontSize: { xs: '0.85rem', sm: '0.95rem' }
                            }}
                          >
                            {displayData.content}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {displayData.time}
                        </Typography>
                      }
                    />
                    {displayData.postImage && (
                      <Box
                        component="img"
                        src={displayData.postImage}
                        alt="Product"
                        sx={{
                          width: { xs: 36, sm: 44 },
                          height: { xs: 36, sm: 44 },
                          objectFit: 'cover',
                          borderRadius: 1,
                          cursor: 'pointer'
                        }}
                      />
                    )}
                  </ListItem>
                  {index < reviewsData.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </>
    );

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Mobile back header */}
        {isMobile && renderMobileHeader('Interactions')}
        
        {/* Desktop header */}
        {!isMobile && (
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Interactions
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Review and delete likes, comments, and your other interactions.
            </Typography>
          </Box>
        )}

        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          variant="fullWidth"
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'uppercase',
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              fontWeight: 600,
              letterSpacing: { xs: 0.5, sm: 1 },
              minHeight: { xs: 40, sm: 48 },
              px: { xs: 0.5, sm: 2 }
            }
          }}
        >
          <Tab label="❤️ Likes" />
          <Tab label="💬 Comments" />
          <Tab label="✅ Reviews" />
        </Tabs>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', position: 'relative' }}>
          {selectedTab === 0 && (
            <Box sx={{ p: 0.5 }}>
              {renderLikesTab()}
            </Box>
          )}
          {selectedTab === 1 && renderCommentsTab()}
          {selectedTab === 2 && renderReviewsTab()}
        </Box>
      </Box>
    );
  };

  const renderPhotosContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile back header */}
      {isMobile && renderMobileHeader('Photos and videos')}
      
      {/* Desktop header */}
      {!isMobile && (
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Photos and videos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View, archive or delete photos and videos you have shared.
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0.5 }}>
        {isLoadingPosts && postsData.length === 0 ? (
          renderLoadingGrid()
        ) : postsError ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{postsError}</Typography>
            <Button onClick={() => fetchPosts(null, null)} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : postsData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No posts yet</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
              {postsData.map((post) => {
                const mediaType = getPostMediaType(post);
                const imageUrl = post.url || `https://picsum.photos/300/300?random=${post.id}`;
                const isVideo = mediaType === 'video' || mediaType === 'reel';
                
                return (
                  <Box key={post.id} onClick={() => handleNavigateToPost(post)}>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingTop: '100%',
                        bgcolor: theme.palette.action.hover,
                        cursor: 'pointer',
                        '&:hover .stats': { opacity: 1 }
                      }}
                    >
                      {isVideo ? (
                        <Box
                          component="video"
                          src={imageUrl}
                          muted
                          preload="metadata"
                          onLoadedData={(e) => {
                            const video = e.target as HTMLVideoElement;
                            video.currentTime = 1;
                          }}
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
                          component="img"
                          src={imageUrl}
                          alt="Media"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      
                      {(mediaType === 'video' || mediaType === 'reel') && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: 'white',
                            zIndex: 1
                          }}
                        >
                          <PlayIcon sx={{ fontSize: 24, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                        </Box>
                      )}
                      
                      <Box
                        className="stats"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          bgcolor: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          color: 'white'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LikedIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{post.likeCount ?? post.likes ?? 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CommentIcon sx={{ fontSize: 18 }} />
                          <Typography variant="body2">{post.commentCount ?? post.comments ?? 0}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {hasMorePosts && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button onClick={handleLoadMorePosts} disabled={isLoadingPosts}>
                  {isLoadingPosts ? <CircularProgress size={20} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );

  const renderHistoryContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Mobile back header */}
      {isMobile && renderMobileHeader('Account history')}
      
      {/* Desktop header */}
      {!isMobile && (
        <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Account history
            </Typography>
            {renderSortButtons()}
          </Box>
          <Typography variant="body2" color="text.secondary">
            Review changes you have made to your account since you created it.
          </Typography>
        </Box>
      )}

      {/* Mobile sort buttons */}
      {isMobile && (
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
          {renderSortButtons()}
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {isLoadingHistory && accountHistoryData.length === 0 ? (
          renderLoadingState()
        ) : historyError ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error">{historyError}</Typography>
            <Button onClick={() => fetchAccountHistory(1, false)} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : accountHistoryData.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No account history available</Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {accountHistoryData.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ListItem sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                    <ListItemIcon sx={{ minWidth: { xs: 48, sm: 56 } }}>
                      <Box sx={{
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        borderRadius: '50%',
                        bgcolor: theme.palette.action.hover,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: { xs: '1rem', sm: '1.2rem' }
                      }}>
                        {getHistoryIcon(item.action)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.action}
                      secondary={`${item.description} · ${item.date}`}
                      primaryTypographyProps={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                      secondaryTypographyProps={{
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  </ListItem>
                  {index < accountHistoryData.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            
            {hasMoreHistory && (
              <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={handleLoadMoreHistory} disabled={isLoadingHistory}>
                  {isLoadingHistory ? <CircularProgress size={20} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );

  const renderContent = () => {
    switch (selectedMenu) {
      case 'interactions':
        return renderInteractionsContent();
      case 'photos':
        return renderPhotosContent();
      case 'history':
        return renderHistoryContent();
      default:
        return renderInteractionsContent();
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 0 } }}>
        <Paper elevation={0} sx={{ borderRadius: 0, minHeight: '100vh' }}>
          {/* Header - Only show on menu view for mobile */}
          {(!isMobile || !showMobileContent) && (
            <Box sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                Your Activity
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', minHeight: { xs: 'calc(100vh - 57px)', md: 'calc(100vh - 65px)' } }}>
            {/* Left Menu - Hide on mobile when content is shown */}
            <Box sx={{
              width: { xs: '100%', md: '350px', lg: '400px' },
              borderRight: { md: `1px solid ${theme.palette.divider}` },
              height: { md: 'calc(100vh - 65px)' },
              overflowY: 'auto',
              flexShrink: 0,
              display: { 
                xs: showMobileContent ? 'none' : 'block', 
                md: 'block' 
              }
            }}>
              <List sx={{ p: 0 }}>
                {menuOptions.map((option) => (
                  <ListItemButton
                    key={option.id}
                    selected={selectedMenu === option.id}
                    onClick={() => handleMenuClick(option.id)}
                    sx={{
                      py: { xs: 2, sm: 2.5 },
                      px: { xs: 2, sm: 3 },
                      borderLeft: selectedMenu === option.id ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      bgcolor: selectedMenu === option.id ? 'action.selected' : 'transparent',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      '&.Mui-selected': {
                        bgcolor: 'action.selected'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 40, sm: 48 } }}>
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={option.title}
                      secondary={option.subtitle}
                      primaryTypographyProps={{
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: selectedMenu === option.id ? 600 : 500
                      }}
                      secondaryTypographyProps={{
                        fontSize: { xs: '0.7rem', sm: '0.875rem' },
                        sx: { mt: 0.5 }
                      }}
                    />
                    {/* Chevron for mobile */}
                    {isMobile && (
                      <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                    )}
                  </ListItemButton>
                ))}
              </List>
            </Box>

            {/* Right Content Area */}
            <Box sx={{
              display: { 
                xs: showMobileContent ? 'block' : 'none', 
                md: 'block' 
              },
              flexGrow: 1,
              bgcolor: 'background.paper',
              height: { xs: '100%', md: 'calc(100vh - 65px)' },
              overflowY: 'auto',
              width: { xs: '100%', md: 'auto' }
            }}>
              {renderContent()}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Sort & Filter Dialog */}
      <Dialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            m: { xs: 1, sm: 2 },
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2,
          px: { xs: 2, sm: 3 }
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Sort & filter
          </Typography>
          <IconButton
            onClick={() => setSortDialogOpen(false)}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              Sort by
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant={sortFilterState.sortOrder === 'newest' ? 'contained' : 'outlined'}
                onClick={() => setSortFilterState(prev => ({ ...prev, sortOrder: 'newest' }))}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  bgcolor: sortFilterState.sortOrder === 'newest' ? theme.palette.primary.main : 'transparent',
                  color: sortFilterState.sortOrder === 'newest' ? '#fff' : 'text.primary',
                  '&:hover': {
                    bgcolor: sortFilterState.sortOrder === 'newest' ? theme.palette.primary.dark : 'action.hover',
                  }
                }}
              >
                Newest to oldest
              </Button>
              <Button
                variant={sortFilterState.sortOrder === 'oldest' ? 'contained' : 'outlined'}
                onClick={() => setSortFilterState(prev => ({ ...prev, sortOrder: 'oldest' }))}
                sx={{
                  flex: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  bgcolor: sortFilterState.sortOrder === 'oldest' ? theme.palette.primary.main : 'transparent',
                  color: sortFilterState.sortOrder === 'oldest' ? '#fff' : 'text.primary',
                  '&:hover': {
                    bgcolor: sortFilterState.sortOrder === 'oldest' ? theme.palette.primary.dark : 'action.hover',
                  }
                }}
              >
                Oldest to newest
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              Start Date
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 'auto' } }}>
                <Select
                  value={sortFilterState.startMonth}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, startMonth: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 80 } }}>
                <Select
                  value={sortFilterState.startDay}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, startDay: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i} value={(i + 1).toString()}>{i + 1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 100 } }}>
                <Select
                  value={sortFilterState.startYear}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, startYear: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {['2020', '2021', '2022', '2023', '2024', '2025'].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 500 }}>
              End Date
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
              <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 'auto' } }}>
                <Select
                  value={sortFilterState.endMonth}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, endMonth: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 80 } }}>
                <Select
                  value={sortFilterState.endDay}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, endDay: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i} value={(i + 1).toString()}>{i + 1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 100 } }}>
                <Select
                  value={sortFilterState.endYear}
                  onChange={(e) => setSortFilterState(prev => ({ ...prev, endYear: e.target.value }))}
                  sx={{ borderRadius: 2 }}
                >
                  {['2020', '2021', '2022', '2023', '2024', '2025', '2026'].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleSortFilterApply}
            sx={{
              mt: 2,
              py: 1.5,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2
            }}
          >
            Apply
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default InstagramStyleActivity;