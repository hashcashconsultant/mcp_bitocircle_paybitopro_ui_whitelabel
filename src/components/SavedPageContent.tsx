// components/SavedPageContent.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { 
  Container, 
  Typography, 
  Box,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Modal,
  Snackbar,
} from '@mui/material';
import { 
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  FavoriteBorder as HeartIcon,
  ChatBubbleOutline as MessageCircleIcon,
  Share as ShareIcon,
  VideoLibrary as VideoIcon,
  Photo as PhotoIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// TypeScript Interfaces
interface BookmarkedPost {
  postId: number;
  adminUser: string | null;
  pageId: string | null;
  userId: number;
  content: string | null;
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'REEL' | 'POLL';
  contentType: string;
  mediaUrls: string | null;
  mediaUrlsList: string[] | null;
  mediaType: string | null;
  hashtags: string | null;
  location: string | null;
  isActive: string | null;
  createdAt: string;
  updatedAt: string | null;
  scheduledAt: string | null;
  isScheduled: string | null;
  engagementScore: number;
  thumbnailUrl: string | null;
  videoDuration: number | null;
  websiteUrl: string | null;
  isThirdParty: string;
  pollQuestion: string | null;
  pollOptions: string | null;
  pollDurationHours: number | null;
  username: string;
  fullName: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  hasLiked: string;
  hasBookmarked: string;
  poll: unknown | null;
  taggedUsers: unknown | null;
  userIdsToUntag: unknown | null;
  taggedUsersCount: number;
}

interface BookmarkedPostsResponse {
  success: boolean;
  message: string;
  data: {
    content: BookmarkedPost[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  errorCode: string | null;
}

const BITOHUBWEBSERVICE = 'https://institutional-bo.paybito.com:8443/BitohubService';

const SavedPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('All Posts');
  const [posts, setPosts] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  
  const [unbookmarkingPost, setUnbookmarkingPost] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  
  const tabs: string[] = ['All Posts', 'Reels'];
  const pageSize = 12;

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Fetch bookmarked posts
  const fetchBookmarkedPosts = async (page: number = 0) => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId');
      
      if (!userId) {
        setError('Please log in to view saved posts');
        setIsLoading(false);
        return;
      }

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/activity/getBookmarkedPosts?userId=${userId}&page=${page}&size=${pageSize}&pageId=${localStorage.getItem('pageId') || '0'}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BookmarkedPostsResponse = await response.json();

      if (data.success) {
        setPosts(data.data.content);
        setCurrentPage(data.data.pageNumber);
        setTotalPages(data.data.totalPages);
        setHasNext(data.data.hasNext);
      } else {
        throw new Error(data.message || 'Failed to load bookmarked posts');
      }
    } catch (err) {
      console.error('Error fetching bookmarked posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookmarked posts');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unbookmark
  const handleUnbookmark = async (postId: number, postType: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the modal

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId');
      
      if (!userId) {
        showSnackbar('Please log in to unbookmark posts', 'error');
        return;
      }

      setUnbookmarkingPost(postId);

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/post/bookmarkContent`,
        {
          method: 'POST',
          body: JSON.stringify({
  contentType: postType,
  contentId: postId,
  userId: parseInt(userId)
})
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Remove the post from the list
        setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
        showSnackbar('Post removed from saved', 'success');
      } else {
        throw new Error(result.message || 'Failed to unbookmark post');
      }
    } catch (err) {
      console.error('Error unbookmarking post:', err);
      showSnackbar(
        err instanceof Error ? err.message : 'Failed to unbookmark post',
        'error'
      );
    } finally {
      setUnbookmarkingPost(null);
    }
  };

  // Fetch posts on component mount
  useEffect(() => {
    fetchBookmarkedPosts(0);
  }, []);

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Reels') {
      return post.postType === 'REEL';
    }
    return true; // All Posts
  });

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'PHOTO':
        return <PhotoIcon sx={{ fontSize: 16, color: 'white' }} />;
      case 'VIDEO':
      case 'REEL':
        return <VideoIcon sx={{ fontSize: 16, color: 'white' }} />;
      default:
        return null;
    }
  };

  // const handlePostClick = (post: BookmarkedPost) => {
  //   setSelectedPost(post);
  //   setSelectedImageIndex(0);
  //   setOpenModal(true);
  // };

  const handlePostClick = (post: BookmarkedPost) => {
  const { postId, userId, pageId, contentType } = post;
  
  if (contentType === 'REEL') {
    router.push(`/post/${postId}/${userId}/${pageId || '0'}?REEL`);
  } else {
    router.push(`/post/${postId}/${userId}/${pageId || '0'}`);
  }
};

  

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleLoadMore = () => {
    if (hasNext) {
      fetchBookmarkedPosts(currentPage + 1);
    }
  };

  const handleRefresh = () => {
    fetchBookmarkedPosts(0);
  };

  return (
    <Box sx={{ 
      bgcolor: theme.palette.background.default, 
      minHeight: '100vh',
      pb: 4
    }}>
      <Container maxWidth="lg" sx={{ 
        py: { xs: 2, sm: 3 },
        px: { xs: 2, sm: 3 }
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.text.primary,
              fontSize: { xs: '1.75rem', sm: '2.125rem' }
            }}
          >
            Saved
          </Typography>
          <IconButton
            onClick={handleRefresh}
            disabled={isLoading}
            sx={{ 
              bgcolor: theme.palette.background.paper,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Box sx={{ 
          mb: 4, 
          display: 'flex', 
          gap: 1,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}>
          {tabs.map((tab) => (
            <Chip
              key={tab}
              label={tab}
              onClick={() => handleTabChange(tab)}
              sx={{
                px: { xs: 2, sm: 2.5 },
                py: 2.5,
                height: 'auto',
                borderRadius: 10,
                fontSize: { xs: '0.85rem', sm: '0.9rem' },
                fontWeight: activeTab === tab ? 600 : 400,
                bgcolor: activeTab === tab ? '#1e40af' : 'white',
                color: activeTab === tab ? 'white' : '#6B7280',
                border: activeTab === tab ? 'none' : '1px solid ' + theme.palette.divider,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: activeTab === tab ? '#1e40af' : '#F3F4F6'
                },
                '& .MuiChip-label': {
                  px: 0
                }
              }}
            />
          ))}
        </Box>

        {/* Loading State */}
        {isLoading && posts.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredPosts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BookmarkIcon sx={{ fontSize: 64, color: theme.palette.text.disabled, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No saved posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start saving posts to see them here
            </Typography>
          </Box>
        )}

        {/* Saved Posts Grid */}
        {!isLoading && !error && filteredPosts.length > 0 && (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: { xs: 2, sm: 2, md: 3 }
              }}
            >
              {filteredPosts.map((post) => (
                <Box
                  key={post.postId}
                  onClick={() => handlePostClick(post)}
                  sx={{
                    position: 'relative',
                    paddingTop: '100%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    bgcolor: theme.palette.background.paper,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                      boxShadow: { xs: '0 1px 3px rgba(0,0,0,0.06)', sm: '0 8px 16px rgba(0,0,0,0.12)' }
                    }
                  }}
                >
                  {/* Media Display */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      bgcolor: '#000',
                      overflow: 'hidden'
                    }}
                  >
                    {post.postType === 'TEXT' ? (
                      // Placeholder for TEXT posts
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          position: 'relative'
                        }}
                      >
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
                            p: 3
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'white',
                              textAlign: 'center',
                              fontWeight: 600,
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              lineHeight: 1.4,
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 5,
                              WebkitBoxOrient: 'vertical',
                              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                          >
                            {post.content || 'Text Post'}
                          </Typography>
                        </Box>
                      </Box>
                    ) : post.postType === 'PHOTO' && post.mediaUrls ? (
                      // Display actual image for PHOTO posts
                      <Box
                        component="img"
                        src={post.mediaUrls.split(',')[0].trim()}
                        alt={post.content || 'Post image'}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                        }}
                      />
                    ) : post.postType === 'VIDEO' && post.mediaUrls ? (
                      // Display video thumbnail or poster for VIDEO posts
                      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video
                          src={post.mediaUrls.split(',')[0].trim()}
                          poster={post.thumbnailUrl || undefined}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                          }}
                        />
                        {/* Video play icon overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PlayArrowIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                      </Box>
                    ) : post.postType === 'REEL' && post.mediaUrls ? (
                      // Display reel thumbnail
                      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        <video
                          src={post.mediaUrls.split(',')[0].trim()}
                          poster={post.thumbnailUrl || undefined}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e: React.SyntheticEvent<HTMLVideoElement>) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                          }}
                        />
                        {/* Reel icon overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <VideoIcon sx={{ fontSize: 32, color: 'white' }} />
                        </Box>
                      </Box>
                    ) : (
                      // Fallback for unknown types
                      <Box
                        sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: theme.palette.grey[700]
                        }}
                      >
                        <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                          No preview available
                        </Typography>
                      </Box>
                    )}

                    {/* Bottom Info Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                        p: { xs: 1.5, sm: 2 }
                      }}
                    >
                      {/* User Info */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        mb: 1
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ 
                            width: { xs: 24, sm: 28 }, 
                            height: { xs: 24, sm: 28 }, 
                            bgcolor: '#1e40af', 
                            fontSize: { xs: '0.7rem', sm: '0.8rem' }
                          }}>
                            {post.fullName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 600, 
                                color: 'white',
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: 'block',
                                lineHeight: 1.2
                              }}
                            >
                              {post.fullName}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                display: 'block'
                              }}
                            >
                              {getTimeAgo(post.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        {getPostTypeIcon(post.postType)}
                      </Box>

                      {/* Stats */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 1.5, sm: 2 }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <HeartIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: 'white' }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'white',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {formatNumber(post.likeCount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MessageCircleIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: 'white' }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'white',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {formatNumber(post.commentCount)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShareIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: 'white' }} />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'white',
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {formatNumber(post.shareCount)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Bookmark Button */}
                  <IconButton
                    onClick={(e) => handleUnbookmark(post.postId, post.contentType, e)}
                    disabled={unbookmarkingPost === post.postId}
                    sx={{
                      position: 'absolute',
                      top: { xs: 8, sm: 12 },
                      right: { xs: 8, sm: 12 },
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      bgcolor: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      zIndex: 10,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,1)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {unbookmarkingPost === post.postId ? (
                      <CircularProgress size={16} />
                    ) : (
                      <BookmarkIcon sx={{ 
                        fontSize: { xs: 16, sm: 18 }, 
                        color: '#1e40af' 
                      }} />
                    )}
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* Load More Button */}
            {hasNext && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5
                  }}
                >
                  {isLoading ? <CircularProgress size={20} /> : 'Load More'}
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Post Viewer Modal */}
        

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default SavedPageContent;