'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  useMediaQuery,
  Divider,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  CircularProgress,
  Snackbar,
  AlertColor
} from '@mui/material'
import {
  Poll as PollIcon,
  TrendingUp as TrendingIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  BookmarkBorder as BookmarkIcon,
  BookmarkBorderOutlined as SavedIcon,
  AccessTime as TimeIcon,
  People as PeopleIcon,
  HowToVote as VoteIcon,
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  Verified as VerifiedIcon,
  Undo as UndoIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'

interface PollOption {
  id: number
  text: string
  votes: number
  votePercentage: number
}

interface Poll {
  id: number
  question: string
  options: PollOption[]
  creator: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    isVerified?: boolean
    profilePicture?: string
  }
  category: string
  totalVotes: number
  hasVoted: boolean
  votedOptionId?: number
  createdAt: string
  endTime: string
  status: 'active' | 'ended' | 'upcoming'
  description?: string
  tags?: string[]
  isPublic: boolean
  isSaved?: boolean
  username?: string
  ownerUserId?: number
}

// API Response Interfaces
interface APIPollOption {
  optionId: number
  pollId: number | null
  optionText: string | null
  voteCount: number
  optionOrder: number | null
  votePercentage: number | null
}

interface APIPollItem {
  pollId: number
  postId: number
  question: string
  durationHours: number | null
  isActive: boolean | null
  endsAt: string | null
  createdAt: string | null
  startsAt: string
  expiresAt: string
  statusCode: number
  message: string | null
  ownerUserId: number
  userVotedOptionId: number
  userVotedAt: string | null
  hasVoted: string | null // "Y" or "N"
  totalVotes: number
  options: APIPollOption[]
  username: string
  fullName: string
  profilePicture: string
}

interface PollInsightsAPIResponse {
  success: boolean
  message: string
  data: {
    activePolls: number
    totalVotes: number
    votesThisWeek: number
    pollList: APIPollItem[]
  }
  errorCode: string | null
}

// Voting API Interfaces
interface VoteRequest {
  userId: number
  pollId: number
  optionId: number
}

interface VoteResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Delete Poll API Interfaces
interface DeletePollRequest {
  userId: number
  pollId: number
}

interface DeletePollResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
  totalRecords: null
}

// Snackbar interface
interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
}

// Track last vote for undo functionality
interface LastVoteInfo {
  pollId: number
  optionId: number
  optionText: string
}

const PollsPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Get userId from localStorage (with SSR safety check)
  const [userId, setUserId] = useState<number>(0)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserId = localStorage.getItem('childUserId') || '0'
      setUserId(parseInt(storedUserId) || 0)
    }
  }, [])

  const [activeTab, setActiveTab] = useState(0)
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [createPollOpen, setCreatePollOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('MYPOLLS')
  const [sortBy, setSortBy] = useState<'recent' | 'ending' | 'trending'>('recent')

  // API State
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollInsights, setPollInsights] = useState({
    activePolls: 0,
    totalVotes: 0,
    votesThisWeek: 0
  })

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Voting in progress state
  const [votingInProgress, setVotingInProgress] = useState<number | null>(null)

  // Undo vote state - tracks the last vote made in this session
  const [lastVote, setLastVote] = useState<LastVoteInfo | null>(null)
  const [undoingVote, setUndoingVote] = useState(false)

  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null)
  const [deletingPoll, setDeletingPoll] = useState(false)

  // Map component tab to API tab
  // Map component tab to API tab
const getAPITab = (tabIndex: number): 'ALL' | 'MYPOLLS' | 'PARTICIPATED' | 'ACTIVE' | '' => {
  switch (tabIndex) {
    case 0: return 'ALL'          // All Polls
    case 1: return 'ACTIVE'          // Active - should use ALL with onlyActive='Y'
    case 2: return 'PARTICIPATED' // Participated
    case 3: return 'MYPOLLS'      // Saved (local filter)
    case 4: return 'MYPOLLS'      // My Polls
    default: return 'MYPOLLS'
  }
}

  // Determine which userId to send based on tab
  const getAPIUserId = (tabIndex: number): string => {
    switch (tabIndex) {
      case 2: return userId.toString() // Participated - send actual userId
      case 4: return userId.toString() // My Polls - send actual userId
      default: return '0'   // All other tabs - send 0
    }
  }

  // Get onlyActive parameter based on tab
  // Inside the PollsPage component, after sortBy is defined

// Get onlyActive parameter based on tab and sortBy
const getOnlyActive = (tabIndex: number): 'Y' | 'N' => {
  // If sorting by "ending soon", only show active polls
  if (sortBy === 'ending') {
    return 'Y'
  }
  
  // Otherwise, use tab-based filtering
  if (tabIndex === 1) return 'Y' // Active tab only
  return 'N' // All other tabs
}

  // Map component sortBy to API sortBy
  const getAPISortBy = (sort: string): 'MOST RECENT' | 'ENDING SOON' => {
    if (sort === 'ending') return 'ENDING SOON'
    return 'MOST RECENT'
  }

  // Helper functions
  const getAvatarColor = (id: number) => {
    const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#ef4444']
    return colors[id % colors.length]
  }

  const getAvatarInitials = (userId: number) => {
    return `U${userId.toString().slice(-2)}`
  }

  // Transform API data to component format
  const transformAPIPollToComponentPoll = (apiPoll: APIPollItem): Poll => {
    // Check if poll is ended - API returns "Ended" string for expired polls
    const isEnded = apiPoll.expiresAt?.toLowerCase() === 'ended'
    
    return {
      id: apiPoll.pollId,
      question: apiPoll.question,
      options: apiPoll.options.map(opt => ({
        id: opt.optionId,
        text: opt.optionText || '',
        votes: opt.voteCount,
        votePercentage: opt.votePercentage || 0
      })),
      creator: {
        name: apiPoll.fullName || `User ${apiPoll.ownerUserId}`,
        username: apiPoll.username || `@user${apiPoll.ownerUserId}`,
        avatar: getAvatarInitials(apiPoll.ownerUserId),
        avatarColor: getAvatarColor(apiPoll.ownerUserId),
        isVerified: false,
        profilePicture: apiPoll.profilePicture || undefined
      },
      category: 'General',
      totalVotes: apiPoll.totalVotes,
      hasVoted: apiPoll.hasVoted === 'Y', // Convert "Y"/"N" to boolean
      votedOptionId: apiPoll.userVotedOptionId || undefined,
      createdAt: apiPoll.startsAt,
      endTime: apiPoll.expiresAt,
      status: isEnded ? 'ended' : 'active',
      description: undefined,
      tags: [],
      isPublic: true,
      isSaved: false,
      username: apiPoll.username || `@user${apiPoll.ownerUserId}`,
      ownerUserId: apiPoll.ownerUserId
    }
  }

  // Fetch polls from API
  const fetchPollsData = async () => {
    // Only require userId for Participated and My Polls tabs
    if (!userId && (activeTab === 2 || activeTab === 4)) return

    try {
      setLoading(true)
      setError(null)

      const apiTab = getAPITab(activeTab)
      const onlyActive = getOnlyActive(activeTab)
      const apiSortBy = getAPISortBy(sortBy)
      const apiUserId = getAPIUserId(activeTab) // Use dynamic userId based on tab
      
      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/poll/getPollInsights?userId=${apiUserId}&sortBy=${apiSortBy}&onlyActive=${onlyActive}&tab=${apiTab}&viewerId=${localStorage.getItem('childUserId')}`
      )
      const result: PollInsightsAPIResponse = await response.json()
      
      if (result.success && result.data) {
        const transformedPolls = result.data.pollList.map(transformAPIPollToComponentPoll)
        setPolls(transformedPolls)
        setPollInsights({
          activePolls: result.data.activePolls,
          totalVotes: result.data.totalVotes,
          votesThisWeek: result.data.votesThisWeek
        })
      } else {
        setError('Failed to load polls')
      }
    } catch (err) {
      setError('Error loading polls')
      console.error('Error fetching polls:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPollsData()
  }, [userId, activeTab, sortBy])

  useEffect(() => {
    if (selectedPoll && detailsOpen) {
      const updatedPoll = polls.find(p => p.id === selectedPoll.id)
      if (updatedPoll) {
        setSelectedPoll(updatedPoll)
      }
    }
  }, [polls])

  // Handle vote API call
  const handleVoteAPI = async (pollId: number, optionId: number, optionText: string) => {
    if (!userId || userId === 0) {
      setSnackbar({
        open: true,
        message: 'Please login to vote',
        severity: 'error'
      })
      return
    }

    // Check if poll is active
    const poll = polls.find(p => p.id === pollId)
    if (!poll || poll.status !== 'active') {
      setSnackbar({
        open: true,
        message: 'This poll is no longer active',
        severity: 'error'
      })
      return
    }

    try {
      setVotingInProgress(pollId)

      const votePayload: VoteRequest = {
        userId: userId,
        pollId: pollId,
        optionId: optionId
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/poll/voteInPoll',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(votePayload)
        }
      )

      const result: VoteResponse = await response.json()

      if (result.success) {
        // Store the last vote for undo functionality
        setLastVote({
          pollId: pollId,
          optionId: optionId,
          optionText: optionText
        })

        // Refresh poll data from server to ensure consistency
        await fetchPollsData()

        setSnackbar({
          open: true,
          message: `Voted for "${optionText}" successfully!`,
          severity: 'success'
        })
      } else {
        throw new Error(result.message || 'Failed to cast vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to cast vote',
        severity: 'error'
      })

      // Refresh data on error
      await fetchPollsData()
    } finally {
      setVotingInProgress(null)
    }
  }

  // Handle Undo Vote - uses the same API to reset/toggle the vote
  const handleUndoVote = async () => {
    if (!lastVote || !userId) return

    try {
      setUndoingVote(true)

      // Use the same voting API with the same payload to undo/toggle the vote
      const votePayload: VoteRequest = {
        userId: userId,
        pollId: lastVote.pollId,
        optionId: lastVote.optionId
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/poll/voteInPoll',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(votePayload)
        }
      )

      const result: VoteResponse = await response.json()

      if (result.success) {
        // Clear the last vote after undoing
        setLastVote(null)

        // Refresh poll data
        await fetchPollsData()

        setSnackbar({
          open: true,
          message: 'Vote has been undone successfully!',
          severity: 'info'
        })

        // Update selected poll if in details dialog
        if (selectedPoll && selectedPoll.id === lastVote.pollId) {
          const updatedPoll = polls.find(p => p.id === lastVote.pollId)
          if (updatedPoll) {
            setSelectedPoll(updatedPoll)
          }
        }
      } else {
        throw new Error(result.message || 'Failed to undo vote')
      }
    } catch (error) {
      console.error('Error undoing vote:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to undo vote',
        severity: 'error'
      })
    } finally {
      setUndoingVote(false)
    }
  }

  // Handle Delete Poll API call
  const handleDeletePoll = async () => {
    if (!pollToDelete || !userId) return

    try {
      setDeletingPoll(true)

      const deletePayload: DeletePollRequest = {
        userId: userId,
        pollId: pollToDelete.id
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/poll/deletePoll',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(deletePayload)
        }
      )

      const result: DeletePollResponse = await response.json()

      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Poll deleted successfully!',
          severity: 'success'
        })

        // Close dialogs
        setDeleteConfirmOpen(false)
        if (selectedPoll?.id === pollToDelete.id) {
          setDetailsOpen(false)
        }

        // Refresh poll data
        await fetchPollsData()
        
        setPollToDelete(null)
      } else {
        throw new Error(result.message || 'Failed to delete poll')
      }
    } catch (error) {
      console.error('Error deleting poll:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to delete poll',
        severity: 'error'
      })
    } finally {
      setDeletingPoll(false)
    }
  }

  // Open delete confirmation dialog
  const handleOpenDeleteConfirm = (poll: Poll) => {
    setPollToDelete(poll)
    setDeleteConfirmOpen(true)
  }

  // Handle vote in poll details
  const handleVoteInDetails = async (optionId: number, optionText: string) => {
    if (!selectedPoll) return
    await handleVoteAPI(selectedPoll.id, optionId, optionText)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setLastVote(null) // Clear undo state when changing tabs
  }

  const handleViewDetails = (poll: Poll) => {
    setSelectedPoll(poll)
    setDetailsOpen(true)
  }

  const handleSavePoll = (pollId: number) => {
    setPolls(prevPolls =>
      prevPolls.map(poll => 
        poll.id === pollId ? { ...poll, isSaved: !poll.isSaved } : poll
      )
    )
  }

  const getFilteredPolls = () => {
    let filtered = [...polls]
    
    // Filter by tab (client-side for Saved and My Polls)
    switch (activeTab) {
      case 1: // Active - filter by status
        filtered = filtered.filter(p => p.status === 'active')
        break
      case 3: // Saved
        filtered = filtered.filter(p => p.isSaved)
        break
      case 4: // My Polls
        filtered = filtered.filter(p => p.ownerUserId === userId)
        break
    }
    
    // Filter by category
    if (filterCategory !== 'MYPOLLS') {
      filtered = filtered.filter(p => p.category === filterCategory)
    }
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Client-side sort for trending (since API doesn't support it)
    if (sortBy === 'trending') {
      filtered.sort((a, b) => b.totalVotes - a.totalVotes)
    }
    
    return filtered
  }

  // Check if poll is owned by current user
  const isOwnPoll = (poll: Poll): boolean => {
    return poll.ownerUserId === userId
  }

  const renderPollCard = (poll: Poll) => {
    const winningOption = poll.options.reduce((prev, current) =>
      prev.votes > current.votes ? prev : current
    )
    
    // Check if this poll has an undo available
    const canUndoThisPoll = lastVote?.pollId === poll.id
    const isOwner = isOwnPoll(poll)

    return (
      <Card
        key={poll.id}
        sx={{
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
          border: `1px solid ${theme.palette.divider}`,
          transition: 'all 0.2s',
          bgcolor: theme.palette.background.paper,
          '&:hover': {
            boxShadow: theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)',
            transform: 'translateY(-2px)'
          }
        }}
      >
        <CardContent>
          {/* Poll Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar 
                src={poll.creator.profilePicture}
                sx={{
                  bgcolor: poll.creator.avatarColor,
                  width: 36,
                  height: 36,
                  fontSize: 14
                }}
              >
                {poll.creator.avatar}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {poll.creator.name}
                  </Typography>
                  {poll.creator.isVerified && (
                    <VerifiedIcon sx={{ fontSize: 14, color: '#1d9bf0' }} />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {poll.createdAt}
                </Typography>
              </Box>
            </Box>
            
            {/* Delete button for own polls */}
            {isOwner && (
              <IconButton
                size="small"
                onClick={() => handleOpenDeleteConfirm(poll)}
                sx={{
                  color: theme.palette.error.main,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(211, 47, 47, 0.2)' 
                      : 'rgba(211, 47, 47, 0.1)'
                  }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* Category and Status */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={poll.category}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(66, 103, 178, 0.2)' 
                  : 'rgba(66, 103, 178, 0.1)',
                color: theme.palette.mode === 'dark' ? '#90caf9' : '#4267b2',
                fontWeight: 500
              }}
            />
            {poll.status === 'active' ? (
              <Chip
                icon={<TimeIcon sx={{ fontSize: 14 }} />}
                label={poll.endTime}
                size="small"
                color="success"
                variant="outlined"
              />
            ) : (
              <Chip
                label="Ended"
                size="small"
                color="default"
                variant="outlined"
              />
            )}
            {poll.hasVoted && (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                label="Voted"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          {/* Question */}
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            {poll.question}
          </Typography>

          {/* Options Preview */}
          <Box sx={{ mb: 2 }}>
            {poll.options.slice(0, 2).map((option) => {
              const percentage = poll.totalVotes > 0 
                ? Math.round((option.votes / poll.totalVotes) * 100) 
                : 0
              const isWinning = option.id === winningOption.id && poll.totalVotes > 0
              const isVotedOption = poll.votedOptionId === option.id

              return (
                <Box key={option.id} sx={{ mb: 1 }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: isVotedOption 
                      ? theme.palette.primary.main 
                      : isWinning && poll.hasVoted 
                        ? theme.palette.success.main 
                        : theme.palette.divider,
                    bgcolor: poll.hasVoted 
                      ? theme.palette.action.hover
                      : theme.palette.background.paper,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {poll.hasVoted && (
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
                            bgcolor: isVotedOption
                              ? theme.palette.mode === 'dark'
                                ? 'rgba(33, 150, 243, 0.2)'
                                : 'rgba(33, 150, 243, 0.1)'
                              : isWinning 
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(76, 175, 80, 0.2)'
                                  : 'rgba(66, 184, 131, 0.1)'
                                : theme.palette.mode === 'dark'
                                  ? 'rgba(66, 103, 178, 0.15)'
                                  : 'rgba(66, 103, 178, 0.05)'
                          }
                        }}
                      />
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
                      <Typography variant="body2">
                        {option.text}
                      </Typography>
                      {isVotedOption && (
                        <CheckCircleIcon sx={{ fontSize: 14, color: theme.palette.primary.main }} />
                      )}
                    </Box>
                    {poll.hasVoted && (
                      <Typography variant="caption" fontWeight={600} sx={{ zIndex: 1 }}>
                        {percentage}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              )
            })}
            {poll.options.length > 2 && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => handleViewDetails(poll)}
              >
                +{poll.options.length - 2} more options
              </Typography>
            )}
          </Box>

          {/* Poll Stats */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                <PeopleIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                {poll.totalVotes} votes
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Undo Vote Button - shows only if this poll was just voted on */}
              {canUndoThisPoll && poll.status === 'active' && (
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={undoingVote ? <CircularProgress size={14} /> : <UndoIcon />}
                  onClick={handleUndoVote}
                  disabled={undoingVote}
                  sx={{
                    textTransform: 'none',
                    minWidth: 100
                  }}
                >
                  Undo Vote
                </Button>
              )}

              {/* Vote Now / View Details Button */}
              {poll.status === 'active' ? (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleViewDetails(poll)}
                  disabled={votingInProgress === poll.id}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    textTransform: 'none',
                    '&:hover': { bgcolor: theme.palette.primary.dark },
                    minWidth: 100,
                    position: 'relative'
                  }}
                >
                  {votingInProgress === poll.id ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : poll.hasVoted ? (
                    'Vote Again'
                  ) : (
                    'Vote Now'
                  )}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewDetails(poll)}
                  sx={{ textTransform: 'none' }}
                >
                  View Details
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const filteredPolls = getFilteredPolls()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PollIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
              Polls Hub
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Participate in community polls and share your opinions
            </Typography>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3
        }}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(66, 103, 178, 0.2)' 
                    : 'rgba(66, 103, 178, 0.1)',
                  borderRadius: 2,
                  p: 1.5
                }}>
                  <PollIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {pollInsights.activePolls}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Polls
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 2,
                  p: 1.5
                }}>
                  <VoteIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {pollInsights.totalVotes.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Votes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.1)',
            bgcolor: theme.palette.background.paper
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(245, 158, 11, 0.2)' 
                    : 'rgba(245, 158, 11, 0.1)',
                  borderRadius: 2,
                  p: 1.5
                }}>
                  <TrendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {pollInsights.votesThisWeek}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Votes This Week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          mb: 3,
          flexWrap: 'wrap'
        }}>
          <TextField
            placeholder="Search polls..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'ending' | 'trending')}
              label="Sort By"
            >
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="ending">Ending Soon</MenuItem>
              <MenuItem value="trending">Trending</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
          sx={{
            mb: 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab label="All Polls" />
          <Tab 
            label={
              <Badge badgeContent={pollInsights.activePolls} color="primary">
                Active
              </Badge>
            } 
          />
          <Tab label="Participated" />
          <Tab label="Saved" />
          <Tab label="My Polls" />
        </Tabs>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={40} />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Polls Grid */}
        {!loading && !error && (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3 
          }}>
            {filteredPolls.map((poll) => (
              <Box key={poll.id}>
                {renderPollCard(poll)}
              </Box>
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPolls.length === 0 && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary'
          }}>
            <PollIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              No polls found
            </Typography>
            <Typography variant="body2">
              Try adjusting your filters or create a new poll
            </Typography>
          </Box>
        )}

        {/* Poll Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: theme.palette.background.paper
            }
          }}
        >
          {selectedPoll && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Poll Details</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {isOwnPoll(selectedPoll) && (
                      <IconButton
                        onClick={() => handleOpenDeleteConfirm(selectedPoll)}
                        size="small"
                        sx={{ color: theme.palette.error.main }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                    <IconButton onClick={() => setDetailsOpen(false)} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                {/* Creator Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar 
                    src={selectedPoll.creator.profilePicture}
                    sx={{
                      bgcolor: selectedPoll.creator.avatarColor,
                      width: 48,
                      height: 48
                    }}
                  >
                    {selectedPoll.creator.avatar}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedPoll.creator.name}
                      </Typography>
                      {selectedPoll.creator.isVerified && (
                        <VerifiedIcon sx={{ fontSize: 16, color: '#1d9bf0' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPoll.username} • {selectedPoll.createdAt}
                    </Typography>
                  </Box>
                </Box>

                {/* Status Chips */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {selectedPoll.status === 'active' ? (
                    <Chip
                      icon={<TimeIcon sx={{ fontSize: 14 }} />}
                      label={`Ends in ${selectedPoll.endTime}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  ) : (
                    <Chip
                      label="Poll Ended"
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                  {selectedPoll.hasVoted && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                      label="You voted"
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>

                {/* Question */}
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  {selectedPoll.question}
                </Typography>

                {/* Description */}
                {selectedPoll.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {selectedPoll.description}
                  </Typography>
                )}

                {/* Tags */}
                {selectedPoll.tags && selectedPoll.tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    {selectedPoll.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: theme.palette.primary.main, 
                          color: theme.palette.primary.main 
                        }}
                      />
                    ))}
                  </Box>
                )}

                {/* All Options */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                    {selectedPoll.status === 'active' 
                      ? (selectedPoll.hasVoted ? 'Options (You can vote again)' : 'Select an option to vote')
                      : 'Final Results'
                    }
                  </Typography>
                  {selectedPoll.options.map((option) => {
                    const percentage = selectedPoll.totalVotes > 0
                      ? Math.round((option.votes / selectedPoll.totalVotes) * 100)
                      : 0
                    const isVoted = selectedPoll.votedOptionId === option.id
                    const isWinning = option.votes === Math.max(...selectedPoll.options.map(o => o.votes)) && selectedPoll.totalVotes > 0

                    return (
                      <Box key={option.id} sx={{ mb: 1.5 }}>
                        {/* Show voting buttons only for active polls */}
                        {selectedPoll.status === 'active' ? (
                          <Button
                            variant={isVoted ? "contained" : "outlined"}
                            fullWidth
                            onClick={() => handleVoteInDetails(option.id, option.text)}
                            disabled={votingInProgress === selectedPoll.id}
                            sx={{
                              justifyContent: 'space-between',
                              textTransform: 'none',
                              py: 1.5,
                              position: 'relative',
                              borderColor: isVoted ? theme.palette.primary.main : theme.palette.divider,
                              bgcolor: isVoted ? theme.palette.primary.main : 'transparent',
                              color: isVoted ? 'white' : 'inherit',
                              '&:hover': {
                                bgcolor: isVoted ? theme.palette.primary.dark : theme.palette.action.hover,
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {option.text}
                              {isVoted && <CheckCircleIcon sx={{ fontSize: 16 }} />}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {selectedPoll.hasVoted && (
                                <Typography variant="caption">
                                  {option.votes} votes • {percentage}%
                                </Typography>
                              )}
                              {votingInProgress === selectedPoll.id && (
                                <CircularProgress size={16} color="inherit" />
                              )}
                            </Box>
                          </Button>
                        ) : (
                          /* Show results for ended polls */
                          <Box sx={{
                            position: 'relative',
                            border: '1px solid',
                            borderColor: isWinning ? theme.palette.success.main : theme.palette.divider,
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: theme.palette.background.paper
                          }}>
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
                                  bgcolor: isWinning
                                    ? theme.palette.mode === 'dark'
                                      ? 'rgba(76, 175, 80, 0.25)'
                                      : 'rgba(66, 184, 131, 0.15)'
                                    : theme.palette.mode === 'dark'
                                      ? 'rgba(66, 103, 178, 0.2)'
                                      : 'rgba(66, 103, 178, 0.1)'
                                }
                              }}
                            />
                            <Box sx={{
                              position: 'relative',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              zIndex: 1
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={isVoted ? 600 : 400}>
                                  {option.text}
                                </Typography>
                                {isVoted && (
                                  <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.primary.main }} />
                                )}
                                {isWinning && (
                                  <TrophyIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {option.votes} votes
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                  {percentage}%
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Box>

                {/* Undo Vote Button in Dialog */}
                {lastVote?.pollId === selectedPoll.id && selectedPoll.status === 'active' && (
                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      color="warning"
                      startIcon={undoingVote ? <CircularProgress size={16} /> : <UndoIcon />}
                      onClick={handleUndoVote}
                      disabled={undoingVote}
                      sx={{ textTransform: 'none' }}
                    >
                      Undo Your Vote
                    </Button>
                  </Box>
                )}

                {/* Poll Stats */}
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  p: 2,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 1
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedPoll.totalVotes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Votes
                    </Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={600}>
                      {selectedPoll.status === 'active' ? selectedPoll.endTime : 'Ended'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedPoll.status === 'active' ? 'Time Left' : 'Status'}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => !deletingPoll && setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Delete Poll</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this poll? This action cannot be undone.
            </Typography>
            {pollToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {pollToDelete.question}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pollToDelete.totalVotes} votes
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deletingPoll}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeletePoll}
              color="error"
              variant="contained"
              disabled={deletingPoll}
              startIcon={deletingPoll ? <CircularProgress size={16} /> : <DeleteIcon />}
            >
              {deletingPoll ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

export default PollsPage