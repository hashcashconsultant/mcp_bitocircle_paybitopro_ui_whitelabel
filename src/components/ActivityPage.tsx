'use client'
import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Avatar,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreIcon,
  ThumbUp as LikeIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  TrendingUp as TrendingIcon,
  Cake as CelebrationIcon,
  EmojiEvents as AchievementIcon,
  GroupAdd as NetworkIcon,
  Article as ArticleIcon,
  Poll as PollIcon,
  VideoLibrary as VideoIcon,
  Launch as LaunchIcon,
  CheckCircle as VerifiedIcon,
  FilterList as FilterIcon,
  Flag as ReportIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { fetchWithAuth } from '@/utils/fetchWithAuth'


interface Activity {
  id: string
  type: 'achievement' | 'post' | 'network' | 'trending' | 'poll' | 'launch' | 'media'
  user: {
    name: string
    avatar: string
    avatarColor: string
    isVerified?: boolean
  }
  action: string
  content?: string
  timestamp: string
  likes?: number
  comments?: number
  shares?: number
  image?: string
  tags?: string[]
  milestone?: {
    type: string
    value: string
  }
}

const ActivityPage: React.FC = () => {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  const [activeTab, setActiveTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  // Sample activity data - replace with API call
  const activities: Activity[] = [
    {
      id: '1',
      type: 'achievement',
      user: {
        name: 'David Chen',
        avatar: 'DC',
        avatarColor: '#7c3aed',
        isVerified: true
      },
      action: 'raised $5M Series A funding',
      content: 'Excited to announce that we\'ve successfully closed our Series A round! This wouldn\'t have been possible without our amazing team and supportive community. 🚀',
      timestamp: '2 hours ago',
      likes: 342,
      comments: 89,
      shares: 24,
      tags: ['#StartupFunding', '#SeriesA', '#Growth'],
      milestone: {
        type: 'Funding',
        value: '$5M'
      }
    },
    {
      id: '2',
      type: 'launch',
      user: {
        name: 'Lisa Park',
        avatar: 'LP',
        avatarColor: '#ec4899',
        isVerified: true
      },
      action: 'launched new product "AI Assistant Pro"',
      content: 'After months of hard work, we\'re thrilled to introduce AI Assistant Pro - your intelligent workflow companion. Early bird pricing available for the first 100 customers!',
      timestamp: '5 hours ago',
      likes: 256,
      comments: 67,
      shares: 45,
      image: 'https://picsum.photos/600/400?random=1',
      tags: ['#ProductLaunch', '#AI', '#Innovation']
    },
    {
      id: '3',
      type: 'network',
      user: {
        name: 'Tom Brown',
        avatar: 'TB',
        avatarColor: '#06b6d4'
      },
      action: 'hit 100K users milestone',
      content: 'We just crossed 100,000 active users! Thank you to everyone who believed in our vision from day one.',
      timestamp: '8 hours ago',
      likes: 512,
      comments: 124,
      shares: 89,
      milestone: {
        type: 'Users',
        value: '100K'
      }
    },
    {
      id: '4',
      type: 'trending',
      user: {
        name: 'Nina Patel',
        avatar: 'NP',
        avatarColor: '#f59e0b',
        isVerified: true
      },
      action: 'was featured in Forbes 30 Under 30',
      content: 'Honored to be recognized in Forbes 30 Under 30! This is just the beginning of our journey to revolutionize fintech.',
      timestamp: '1 day ago',
      likes: 892,
      comments: 234,
      shares: 167,
      tags: ['#Forbes30Under30', '#Fintech', '#Recognition']
    },
    {
      id: '5',
      type: 'poll',
      user: {
        name: 'Alex Johnson',
        avatar: 'AJ',
        avatarColor: '#10b981'
      },
      action: 'created a poll about remote work preferences',
      content: 'What\'s your ideal work setup for maximum productivity?',
      timestamp: '1 day ago',
      likes: 145,
      comments: 78,
      shares: 12
    },
    {
      id: '6',
      type: 'media',
      user: {
        name: 'Sarah Williams',
        avatar: 'SW',
        avatarColor: '#ef4444',
        isVerified: true
      },
      action: 'shared insights from Web Summit 2024',
      content: 'Key takeaways from Web Summit: AI integration is no longer optional, sustainability is driving innovation, and the creator economy is reshaping business models.',
      timestamp: '2 days ago',
      likes: 423,
      comments: 91,
      shares: 67,
      image: 'https://picsum.photos/600/400?random=2',
      tags: ['#WebSummit', '#TechTrends', '#Innovation']
    }
  ]

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, activityId: string) => {
    setAnchorEl(event.currentTarget)
    setSelectedActivity(activityId)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedActivity(null)
  }

  const handleFilterOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleBack = () => {
    router.back()
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'achievement':
        return <AchievementIcon sx={{ color: '#f59e0b' }} />
      case 'launch':
        return <LaunchIcon sx={{ color: '#8b5cf6' }} />
      case 'network':
        return <NetworkIcon sx={{ color: '#3b82f6' }} />
      case 'trending':
        return <TrendingIcon sx={{ color: '#ef4444' }} />
      case 'poll':
        return <PollIcon sx={{ color: '#10b981' }} />
      case 'media':
        return <VideoIcon sx={{ color: '#ec4899' }} />
      default:
        return <ArticleIcon sx={{ color: '#6b7280' }} />
    }
  }

  const getFilteredActivities = () => {
    switch (activeTab) {
      case 0: // All
        return activities
      case 1: // Achievements
        return activities.filter(a => a.type === 'achievement' || a.milestone)
      case 2: // Launches
        return activities.filter(a => a.type === 'launch')
      case 3: // Trending
        return activities.filter(a => a.type === 'trending' || (a.likes && a.likes > 400))
      case 4: // Network
        return activities.filter(a => a.type === 'network')
      default:
        return activities
    }
  }

  const filteredActivities = getFilteredActivities()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={handleBack} sx={{ ml: -1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                Activity Feed
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Stay updated with your connections latest achievements
              </Typography>
            </Box>
          </Box>
          
          <IconButton onClick={handleFilterOpen}>
            <FilterIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#4267b2',
              height: 3
            }
          }}
        >
          <Tab label="All Activity" />
          <Tab label="Achievements" />
          <Tab label="Launches" />
          <Tab label="Trending" />
          <Tab label="Network" />
        </Tabs>

        {/* Activity Cards */}
        {filteredActivities.map((activity) => (
          <Card 
            key={activity.id}
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
              // border: '1px solid #e4e6ea',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }
            }}
          >
            <CardContent>
              {/* Activity Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: activity.user.avatarColor,
                    width: 48,
                    height: 48
                  }}>
                    {activity.user.avatar}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {activity.user.name}
                      </Typography>
                      {activity.user.isVerified && (
                        <VerifiedIcon sx={{ fontSize: 16, color: '#1d9bf0' }} />
                      )}
                      <Box sx={{ ml: 1 }}>
                        {getActivityIcon(activity.type)}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {activity.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                </Box>
                
                <IconButton 
                  size="small" 
                  onClick={(e) => handleMenuOpen(e, activity.id)}
                >
                  <MoreIcon />
                </IconButton>
              </Box>

              {/* Milestone Badge */}
              {activity.milestone && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<CelebrationIcon />}
                    label={`${activity.milestone.type}: ${activity.milestone.value}`}
                    color="primary"
                    variant="outlined"
                    sx={{ 
                      borderColor: '#4267b2',
                      color: '#4267b2',
                      fontWeight: 600
                    }}
                  />
                </Box>
              )}

              {/* Content */}
              {activity.content && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {activity.content}
                </Typography>
              )}

              {/* Image */}
              {activity.image && (
                <Box sx={{ 
                  mb: 2, 
                  borderRadius: 2, 
                  overflow: 'hidden',
                  bgcolor: 'grey.100'
                }}>
                  <img 
                    src={activity.image} 
                    alt="Activity"
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      display: 'block'
                    }}
                  />
                </Box>
              )}

              {/* Tags */}
              {activity.tags && activity.tags.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {activity.tags.map((tag, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        color: '#4267b2',
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      {tag}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Engagement Stats */}
              {(activity.likes || activity.comments || activity.shares) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Button
                      size="small"
                      startIcon={<LikeIcon />}
                      sx={{ color: 'text.secondary' }}
                    >
                      {activity.likes || 0}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<CommentIcon />}
                      sx={{ color: 'text.secondary' }}
                    >
                      {activity.comments || 0}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ShareIcon />}
                      sx={{ color: 'text.secondary' }}
                    >
                      {activity.shares || 0}
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary'
          }}>
            <Typography variant="h6" gutterBottom>
              No activities found
            </Typography>
            <Typography variant="body2">
              Check back later for updates from your connections
            </Typography>
          </Box>
        )}

        {/* Activity Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 200, borderRadius: 2 }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <HideIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Hide this activity</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <ReportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Report activity</ListItemText>
          </MenuItem>
        </Menu>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
          PaperProps={{
            sx: { minWidth: 200, borderRadius: 2 }
          }}
        >
          <MenuItem onClick={handleFilterClose}>Most Recent</MenuItem>
          <MenuItem onClick={handleFilterClose}>Most Popular</MenuItem>
          <MenuItem onClick={handleFilterClose}>From Verified Users</MenuItem>
          <Divider />
          <MenuItem onClick={handleFilterClose}>This Week</MenuItem>
          <MenuItem onClick={handleFilterClose}>This Month</MenuItem>
        </Menu>
      </Container>
    </Box>
  )
}

export default ActivityPage