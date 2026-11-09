// components/CommentDialog.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'

import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'

// GIF imports
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'
import type { IGif } from '@giphy/js-types'

import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Collapse,
  Popover,
  InputAdornment,
  useTheme,
} from '@mui/material'
import {
  Close as CloseIcon,
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  Reply as ReplyIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Gif as GifIcon,
  Search as SearchIcon,
} from '@mui/icons-material'

// GIPHY API Setup
const GIPHY_API_KEY = 'gZSJ94aaaYXX9rGr6nWbQ3RswT4tsA6W'
const giphyFetch = new GiphyFetch(GIPHY_API_KEY)

// API Response interface
interface CommentApiResponse {
  id: number
  user: {
    userId: number | null
    username: string
    fullName: string
    profilePicture: string | null
  }
  text: string
  gifUrl: string | null
  time: string
  likes: number
  isLiked: number
  parentCommentId: number
}

// Internal Comment interface with nested replies support
interface Comment {
  id: number
  userId: number | null
  userName: string
  fullName: string
  profilePicture: string | null
  commentText: string
  gifUrl: string | null
  createdAt: string
  likeCount: number
  hasLiked: boolean
  parentCommentId: number | null
  replies?: Comment[]
}

interface CommentDialogProps {
  open: boolean
  onClose: () => void
  onCommentAdded?: () => void
  onCommentDeleted?: () => void
  post: {
    id: number
    user: {
      name: string
      username: string
      avatar: string
      avatarColor: string
      time: string
      userId?: number
    }
    content: string
    contentType: string
    isGifAllowed?: number
  }
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onClose,
  onCommentAdded,
  onCommentDeleted,
  post
}) => {
  const theme = useTheme()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({})
  const [showReplies, setShowReplies] = useState<{ [key: number]: boolean }>({})

  // Edit state
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState<{ [key: number]: string }>({})

  // Loading states
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeletingComment, setIsDeletingComment] = useState<number | null>(null)
  const [isUpdatingComment, setIsUpdatingComment] = useState<number | null>(null)

  // Error handling
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success')

  // Menu state for comment options
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null)

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState<number | null>(null)
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState<number | null>(null)

  // GIF picker states - Main comment
  const [gifPickerAnchor, setGifPickerAnchor] = useState<null | HTMLElement>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearchQuery, setGifSearchQuery] = useState('')
  const [selectedGifUrl, setSelectedGifUrl] = useState<string | null>(null)
  const [isSendingGif, setIsSendingGif] = useState(false)

  // GIF picker states - Reply
  const [replyGifPickerAnchor, setReplyGifPickerAnchor] = useState<null | HTMLElement>(null)
  const [showReplyGifPicker, setShowReplyGifPicker] = useState<number | null>(null)
  const [replyGifSearchQuery, setReplyGifSearchQuery] = useState('')
  const [selectedReplyGifUrl, setSelectedReplyGifUrl] = useState<{ [key: number]: string | null }>({})

  const currentUserId = localStorage.getItem('childUserId')

  // Emoji handlers
  const handleEmojiSelectForComment = (emojiData: EmojiClickData) => {
    setNewComment(prev => prev + emojiData.emoji)
  }

  const handleEmojiSelectForReply = (commentId: number, emojiData: EmojiClickData) => {
    setReplyText(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || '') + emojiData.emoji
    }))
  }

  const handleEmojiSelectForEdit = (commentId: number, emojiData: EmojiClickData) => {
    setEditText(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || '') + emojiData.emoji
    }))
  }

  // GIF Picker handlers - Main comment
  const handleGifPickerToggle = (event: React.MouseEvent<HTMLElement>) => {
    setGifPickerAnchor(event.currentTarget)
    setShowGifPicker(prev => !prev)
  }

  const handleGifPickerClose = () => {
    setShowGifPicker(false)
    setGifPickerAnchor(null)
    setGifSearchQuery('')
  }

  // Fetch GIFs from GIPHY
  const fetchGifs = (offset: number) => {
    if (gifSearchQuery.trim()) {
      return giphyFetch.search(gifSearchQuery, { offset, limit: 10 })
    }
    return giphyFetch.trending({ offset, limit: 10 })
  }

  // Fetch GIFs for reply
  const fetchReplyGifs = (offset: number) => {
    if (replyGifSearchQuery.trim()) {
      return giphyFetch.search(replyGifSearchQuery, { offset, limit: 10 })
    }
    return giphyFetch.trending({ offset, limit: 10 })
  }

  // Handle GIF selection for main comment
  const handleGifSelect = (gif: IGif, e: React.SyntheticEvent<HTMLElement>) => {
    e.preventDefault()
    const gifUrl = gif.images.downsized_medium.url || gif.images.original.url
    setSelectedGifUrl(gifUrl)
    handleGifPickerClose()
  }

  // Clear selected GIF
  const handleClearGif = () => {
    setSelectedGifUrl(null)
  }

  // GIF Picker handlers - Reply
  const handleReplyGifPickerToggle = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
    setReplyGifPickerAnchor(event.currentTarget)
    setShowReplyGifPicker(prev => prev === commentId ? null : commentId)
  }

  const handleReplyGifPickerClose = () => {
    setShowReplyGifPicker(null)
    setReplyGifPickerAnchor(null)
    setReplyGifSearchQuery('')
  }

  // Handle GIF selection for reply
  const handleReplyGifSelect = (gif: IGif, e: React.SyntheticEvent<HTMLElement>, commentId: number) => {
    e.preventDefault()
    const gifUrl = gif.images.downsized_medium.url || gif.images.original.url
    setSelectedReplyGifUrl(prev => ({
      ...prev,
      [commentId]: gifUrl
    }))
    handleReplyGifPickerClose()
  }

  // Clear selected reply GIF
  const handleClearReplyGif = (commentId: number) => {
    setSelectedReplyGifUrl(prev => ({
      ...prev,
      [commentId]: null
    }))
  }

  // Helper function to show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  // Function to format time ago
  const formatTimeAgo = (timestamp: string): string => {
    if (timestamp.includes('ago') || timestamp.toLowerCase() === 'just now') {
      return timestamp
    }

    try {
      const date = new Date(timestamp)
      const now = new Date()
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

      if (seconds < 60) return 'Just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      return timestamp
    }
  }

  // Transform API response to internal Comment structure
  const transformApiResponse = (apiComments: CommentApiResponse[]): Comment[] => {
    return apiComments.map(apiComment => ({
      id: apiComment.id,
      userId: apiComment.user.userId,
      userName: apiComment.user.username,
      fullName: apiComment.user.fullName,
      profilePicture: apiComment.user.profilePicture,
      commentText: apiComment.text,
      gifUrl: apiComment.gifUrl,
      createdAt: apiComment.time,
      likeCount: apiComment.likes,
      hasLiked: apiComment.isLiked === 1,
      parentCommentId: apiComment.parentCommentId === 0 ? null : apiComment.parentCommentId,
      replies: []
    }))
  }

  // Organize comments into parent and replies
  const organizeComments = (commentsList: Comment[]): Comment[] => {
    const commentMap = new Map<number, Comment>()
    const rootComments: Comment[] = []

    commentsList.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    commentsList.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!

      if (comment.parentCommentId === null) {
        rootComments.push(commentWithReplies)
      } else {
        const parentComment = commentMap.get(comment.parentCommentId)
        if (parentComment) {
          parentComment.replies = parentComment.replies || []
          parentComment.replies.push(commentWithReplies)
        }
      }
    })

    return rootComments
  }

  // 2. GET COMMENTS - Fetch comments when dialog opens
  const fetchComments = async () => {
    if (!post.id) return

    setIsLoadingComments(true)
    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/comments/getCommentsByPost',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUserId ? parseInt(currentUserId) : 0,
            contentId: post.id
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const transformedComments = transformApiResponse(result.data || [])
        const organizedComments = organizeComments(transformedComments)
        setComments(organizedComments)
      } else {
        throw new Error(result.message || 'Failed to load comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Load comments when dialog opens
  useEffect(() => {
    if (open) {
      fetchComments()
    }
  }, [open, post.id])

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedGifUrl(null)
      setSelectedReplyGifUrl({})
      setShowGifPicker(false)
      setShowReplyGifPicker(null)
      setGifSearchQuery('')
      setReplyGifSearchQuery('')
    }
  }, [open])

  // 1. CREATE COMMENT - Add a new comment or reply
  const handleAddComment = async (parentCommentId: number | null = null) => {
    const commentText = parentCommentId
      ? replyText[parentCommentId]?.trim()
      : newComment.trim()

    const gifUrl = parentCommentId
      ? selectedReplyGifUrl[parentCommentId]
      : selectedGifUrl

    // Allow comment if there's text OR a GIF
    if (!commentText && !gifUrl) {
      showSnackbar('Please enter a comment or select a GIF', 'error')
      return
    }

    if (!currentUserId) {
      showSnackbar('Please login to comment', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/comments/makeComment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(currentUserId),
            contentId: post.id,
            contentType: post.contentType,
            commentText: commentText || '',
            gifUrl: gifUrl || null,
            parentCommentId: parentCommentId || 0,
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar(parentCommentId ? 'Reply added successfully' : 'Comment added successfully', 'success')

        if (parentCommentId) {
          setReplyText(prev => ({ ...prev, [parentCommentId]: '' }))
          setSelectedReplyGifUrl(prev => ({ ...prev, [parentCommentId]: null }))
          setReplyToCommentId(null)
        } else {
          setNewComment('')
          setSelectedGifUrl(null)
        }

        // Notify parent component about new comment
        if (onCommentAdded) {
          onCommentAdded()
        }

        await fetchComments()
      } else {
        throw new Error(result.message || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to add comment. Please try again.', 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 3. LIKE COMMENT - Toggle like on a comment
  const handleLikeComment = async (commentId: number) => {
    if (!currentUserId) {
      showSnackbar('Please login to like comments', 'error')
      return
    }

    const updateCommentLike = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            hasLiked: !comment.hasLiked,
            likeCount: comment.hasLiked ? comment.likeCount - 1 : comment.likeCount + 1
          }
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateCommentLike(comment.replies)
          }
        }
        return comment
      })
    }

    setComments(updateCommentLike(comments))

    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/comments/likeComment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(currentUserId),
            commentId: commentId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        setComments(updateCommentLike(comments))
        throw new Error(result.message || 'Failed to like comment')
      }
    } catch (error) {
      console.error('Error liking comment:', error)
      setComments(updateCommentLike(comments))

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to like comment. Please try again.', 'error')
      }
    }
  }

  // 4. UPDATE COMMENT - Update own comment
  const handleUpdateComment = async (commentId: number) => {
    const updatedText = editText[commentId]?.trim()

    if (!updatedText) {
      showSnackbar('Comment cannot be empty', 'error')
      return
    }

    if (!currentUserId) {
      showSnackbar('Please login to update comments', 'error')
      return
    }

    setIsUpdatingComment(commentId)
    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/comments/updateComment',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            commentId: commentId,
            commentText: updatedText,
            userId: parseInt(currentUserId)
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar('Comment updated successfully', 'success')
        setEditingCommentId(null)
        setEditText(prev => {
          const newState = { ...prev }
          delete newState[commentId]
          return newState
        })
        await fetchComments()
      } else {
        throw new Error(result.message || 'Failed to update comment')
      }
    } catch (error) {
      console.error('Error updating comment:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to update comment. Please try again.', 'error')
      }
    } finally {
      setIsUpdatingComment(null)
    }
  }

  // 5. DELETE COMMENT - Delete own comment
  const handleDeleteComment = async (commentId: number) => {
    if (!currentUserId) {
      showSnackbar('Please login to delete comments', 'error')
      return
    }

    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return
    }

    setIsDeletingComment(commentId)
    try {
      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/comments/deleteComment',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(currentUserId),
            commentId: commentId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar('Comment deleted successfully', 'success')

        // Notify parent component about deleted comment
        if (onCommentDeleted) {
          onCommentDeleted()
        }

        await fetchComments()
      } else {
        throw new Error(result.message || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to delete comment. Please try again.', 'error')
      }
    } finally {
      setIsDeletingComment(null)
      setMenuAnchorEl(null)
    }
  }

  // Toggle showing replies for a comment
  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }))
  }

  // Handle reply button click
  const handleReplyClick = (commentId: number) => {
    setReplyToCommentId(replyToCommentId === commentId ? null : commentId)
  }

  // Handle edit button click
  const handleEditClick = (commentId: number, currentText: string) => {
    setEditingCommentId(commentId)
    setEditText(prev => ({ ...prev, [commentId]: currentText }))
    setMenuAnchorEl(null)
  }

  // Handle cancel edit
  const handleCancelEdit = (commentId: number) => {
    setEditingCommentId(null)
    setEditText(prev => {
      const newState = { ...prev }
      delete newState[commentId]
      return newState
    })
  }

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedCommentId(commentId)
  }

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedCommentId(null)
  }

  // Render a single comment with its replies
  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isOwnComment =
      currentUserId && comment.userId && comment.userId === parseInt(currentUserId)

    const hasReplies = comment.replies && comment.replies.length > 0
    const isShowingReplies = showReplies[comment.id]
    const isReplyingToThis = replyToCommentId === comment.id
    const isEditingThis = editingCommentId === comment.id

    const avatarColor = comment.userId
      ? `hsl(${(comment.userId * 137.5) % 360}, 70%, 50%)`
      : `hsl(${(comment.userName.charCodeAt(0) * 137.5) % 360}, 70%, 50%)`

    return (
      <Box key={comment.id} sx={{ mb: isReply ? 1.5 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Avatar */}
          {comment.profilePicture ? (
            <Avatar
              src={comment.profilePicture}
              sx={{
                width: isReply ? 28 : 32,
                height: isReply ? 28 : 32
              }}
            />
          ) : (
            <Avatar
              sx={{
                bgcolor: avatarColor,
                width: isReply ? 28 : 32,
                height: isReply ? 28 : 32,
                fontSize: isReply ? 12 : 14
              }}
            >
              {comment.fullName.charAt(0).toUpperCase()}
            </Avatar>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* ================= EDIT MODE ================= */}
            {isEditingThis ? (
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  p: 1.5,
                  border: '2px solid',
                  borderColor: 'primary.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {comment.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Editing...
                  </Typography>
                </Box>

                {/* Edit input + Emoji */}
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={editText[comment.id] || ''}
                    onChange={(e) =>
                      setEditText(prev => ({
                        ...prev,
                        [comment.id]: e.target.value
                      }))
                    }
                    variant="outlined"
                    size="small"
                    disabled={isUpdatingComment === comment.id}
                    sx={{
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.875rem',
                        pr: 4
                      }
                    }}
                  />

                  <IconButton
                    size="small"
                    onClick={() =>
                      setShowEditEmojiPicker(prev =>
                        prev === comment.id ? null : comment.id
                      )
                    }
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8
                    }}
                  >
                    <EmojiEmotionsIcon fontSize="small" />
                  </IconButton>

                  {showEditEmojiPicker === comment.id && (
                    <>
                      {/* Backdrop to close picker on outside click */}
                      <Box
                        onClick={() => setShowEditEmojiPicker(null)}
                        sx={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1999,
                          bgcolor: 'rgba(0,0,0,0.3)'
                        }}
                      />
                      <Box
                        sx={{
                          position: 'fixed',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          zIndex: 2000,
                          boxShadow: 6,
                          borderRadius: 2
                        }}
                      >
                        <EmojiPicker
                          theme={Theme.AUTO}
                          onEmojiClick={(emoji) =>
                            handleEmojiSelectForEdit(comment.id, emoji)
                          }
                        />
                      </Box>
                    </>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button
                    size="small"
                    onClick={() => handleCancelEdit(comment.id)}
                    disabled={isUpdatingComment === comment.id}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={
                      !editText[comment.id]?.trim() ||
                      isUpdatingComment === comment.id
                    }
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    {isUpdatingComment === comment.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      'Save'
                    )}
                  </Button>
                </Box>
              </Box>
            ) : (
              /* ================= DISPLAY MODE ================= */
              <>
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {comment.fullName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimeAgo(comment.createdAt)}
                      </Typography>
                    </Box>

                    {isOwnComment && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, comment.id)}
                      >
                        <MoreIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>

                  {/* Comment Text */}
                  {comment.commentText && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.5, wordBreak: 'break-word' }}
                    >
                      {comment.commentText}
                    </Typography>
                  )}

                  {/* GIF Display */}
                  {comment.gifUrl && (
                    <Box
                      component="img"
                      src={comment.gifUrl}
                      alt="GIF"
                      sx={{
                        mt: 1,
                        maxWidth: '100%',
                        maxHeight: 200,
                        borderRadius: 1,
                        objectFit: 'contain',
                        cursor: 'pointer',
                        '&:hover': {
                          opacity: 0.9
                        }
                      }}
                      onClick={() => window.open(comment.gifUrl!, '_blank')}
                    />
                  )}
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mt: 0.5,
                    ml: 1
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleLikeComment(comment.id)}
                    sx={{
                      color: comment.hasLiked ? '#ef4444' : 'text.secondary'
                    }}
                  >
                    {comment.hasLiked ? (
                      <LikedIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <LikeIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>

                  {comment.likeCount > 0 && (
                    <Typography variant="caption">
                      {comment.likeCount}
                    </Typography>
                  )}

                  <IconButton
                    size="small"
                    onClick={() => handleReplyClick(comment.id)}
                  >
                    <ReplyIcon sx={{ fontSize: 16 }} />
                  </IconButton>

                  {hasReplies && (
                    <Button
                      size="small"
                      onClick={() => toggleReplies(comment.id)}
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.75rem'
                      }}
                    >
                      {isShowingReplies ? 'Hide' : 'View'} {comment.replies!.length}{' '}
                      replies
                    </Button>
                  )}
                </Box>
              </>
            )}

            {/* ================= REPLY INPUT ================= */}
            <Collapse in={isReplyingToThis && !isEditingThis}>
              <Box sx={{ mt: 1, ml: 1 }}>
                {/* Selected GIF Preview for Reply */}
                {selectedReplyGifUrl[comment.id] && (
                  <Box sx={{ mb: 1, position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={selectedReplyGifUrl[comment.id]!}
                      alt="Selected GIF"
                      sx={{
                        maxWidth: 150,
                        maxHeight: 100,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleClearReplyGif(comment.id)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        width: 20,
                        height: 20,
                        '&:hover': { bgcolor: 'error.dark' }
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    placeholder={`Reply to ${comment.fullName}...`}
                    value={replyText[comment.id] || ''}
                    onChange={(e) =>
                      setReplyText(prev => ({
                        ...prev,
                        [comment.id]: e.target.value
                      }))
                    }
                    size="small"
                  />
                  
                  {/* Emoji Button for Reply */}
                  <IconButton
                    size="small"
                    onClick={() =>
                      setShowReplyEmojiPicker(prev =>
                        prev === comment.id ? null : comment.id
                      )
                    }
                  >
                    <EmojiEmotionsIcon fontSize="small" />
                  </IconButton>

                  {/* GIF Button for Reply */}
                   {post.isGifAllowed === 1 && (
        <IconButton
          size="small"
          onClick={(e) => handleReplyGifPickerToggle(e, comment.id)}
          color={showReplyGifPicker === comment.id ? 'primary' : 'default'}
        >
          <GifIcon fontSize="small" />
        </IconButton>
      )}

                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleAddComment(comment.id)}
                    disabled={
                      (!replyText[comment.id]?.trim() && !selectedReplyGifUrl[comment.id]) ||
                      isSubmitting
                    }
                  >
                    {isSubmitting ? <CircularProgress size={16} /> : 'Reply'}
                  </Button>
                </Box>

                {/* Reply Emoji Picker */}
                {showReplyEmojiPicker === comment.id && (
                  <>
                    <Box
                      onClick={() => setShowReplyEmojiPicker(null)}
                      sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1999,
                        bgcolor: 'rgba(0,0,0,0.3)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2000,
                        boxShadow: 6,
                        borderRadius: 2
                      }}
                    >
                      <EmojiPicker
                        theme={Theme.AUTO}
                        onEmojiClick={(emoji) =>
                          handleEmojiSelectForReply(comment.id, emoji)
                        }
                      />
                    </Box>
                  </>
                )}
              </Box>
            </Collapse>

            {/* ================= REPLIES ================= */}
            <Collapse in={isShowingReplies}>
              <Box
                sx={{
                  mt: 1.5,
                  ml: 2,
                  pl: 2,
                  borderLeft: '2px solid',
                  borderColor: 'divider'
                }}
              >
                {comment.replies?.map(reply => renderComment(reply, true))}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Box>
    )
  }


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '85vh'
          }
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h6" fontWeight={600}>
            Comments
            {comments.length > 0 && (() => {
              const countAllComments = (commentsList: Comment[]): number => {
                return commentsList.reduce((total, comment) => {
                  return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
                }, 0)
              }
              const totalCount = countAllComments(comments)
              return ` (${totalCount})`
            })()}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {/* Original Post */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Avatar sx={{
                bgcolor: post.user.avatarColor,
                width: 40,
                height: 40,
                fontSize: 16
              }}>
                {post.user.avatar}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {post.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {post.user.time}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                  {post.content}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Comments List */}
          <Box sx={{
            maxHeight: '45vh',
            overflowY: 'auto',
            p: 2
          }}>
            {isLoadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to comment!
                </Typography>
              </Box>
            ) : (
              comments.map(comment => renderComment(comment))
            )}
          </Box>

          {/* Add Comment Section */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
            }}
          >
            {/* Selected GIF Preview */}
            {selectedGifUrl && (
              <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                <Box
                  component="img"
                  src={selectedGifUrl}
                  alt="Selected GIF"
                  sx={{
                    maxWidth: 200,
                    maxHeight: 150,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleClearGif}
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    bgcolor: 'error.main',
                    color: 'white',
                    width: 24,
                    height: 24,
                    '&:hover': { bgcolor: 'error.dark' }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            )}

            {/* Input Row */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
              }}
            >
              {/* Input + Emoji */}
              <Box sx={{ position: 'relative', flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleAddComment()
                    }
                  }}
                  variant="outlined"
                  size="small"
                  disabled={isSubmitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '20px',
                      bgcolor: 'background.default',
                      pr: 4
                    }
                  }}
                />

                {/* Emoji button inside input */}
                <IconButton
                  size="small"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                >
                  <EmojiEmotionsIcon fontSize="small" />
                </IconButton>

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <>
                    <Box
                      onClick={() => setShowEmojiPicker(false)}
                      sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1999,
                        bgcolor: 'rgba(0,0,0,0.3)'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 2000,
                        boxShadow: 6,
                        borderRadius: 2
                      }}
                    >
                      <EmojiPicker
                        theme={Theme.AUTO}
                        onEmojiClick={handleEmojiSelectForComment}
                      />
                    </Box>
                  </>
                )}
              </Box>

              {/* GIF Button */}
              {post.isGifAllowed === 1 && (
      <IconButton
        onClick={handleGifPickerToggle}
        disabled={isSubmitting || isSendingGif}
        color={showGifPicker ? 'primary' : 'default'}
      >
        {isSendingGif ? <CircularProgress size={24} /> : <GifIcon />}
      </IconButton>
    )}

              {/* Post Button */}
              <Button
                variant="contained"
                onClick={() => {
                  handleAddComment()
                  setShowEmojiPicker(false)
                }}
                disabled={(!newComment.trim() && !selectedGifUrl) || isSubmitting}
                sx={{
                  borderRadius: '20px',
                  textTransform: 'none',
                  minWidth: '70px',
                  height: 40
                }}
              >
                {isSubmitting ? <CircularProgress size={20} /> : 'Post'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* GIF Picker Popover - Main Comment */}
      <Popover
        open={showGifPicker}
        anchorEl={gifPickerAnchor}
        onClose={handleGifPickerClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden',
            width: 350,
            maxHeight: 450,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search GIFs..."
            value={gifSearchQuery}
            onChange={(e) => setGifSearchQuery(e.target.value)}
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: gifSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setGifSearchQuery('')}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* GIF Grid */}
          <Box
            sx={{
              height: 350,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'action.hover',
                borderRadius: '3px',
              },
            }}
          >
            <Grid
              key={gifSearchQuery}
              columns={2}
              width={318}
              fetchGifs={fetchGifs}
              onGifClick={handleGifSelect}
              noLink={true}
              hideAttribution={false}
            />
          </Box>

          {/* Powered by GIPHY */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 1,
            pt: 1,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary">
              Powered by GIPHY
            </Typography>
          </Box>
        </Box>
      </Popover>

      {/* GIF Picker Popover - Reply */}
      <Popover
        open={showReplyGifPicker !== null}
        anchorEl={replyGifPickerAnchor}
        onClose={handleReplyGifPickerClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        sx={{
          '& .MuiPopover-paper': {
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden',
            width: 350,
            maxHeight: 450,
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search GIFs..."
            value={replyGifSearchQuery}
            onChange={(e) => setReplyGifSearchQuery(e.target.value)}
            autoComplete="off"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: replyGifSearchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setReplyGifSearchQuery('')}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* GIF Grid */}
          <Box
            sx={{
              height: 350,
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'action.hover',
                borderRadius: '3px',
              },
            }}
          >
            <Grid
              key={replyGifSearchQuery}
              columns={2}
              width={318}
              fetchGifs={fetchReplyGifs}
              onGifClick={(gif, e) => {
                if (showReplyGifPicker !== null) {
                  handleReplyGifSelect(gif, e, showReplyGifPicker)
                }
              }}
              noLink={true}
              hideAttribution={false}
            />
          </Box>

          {/* Powered by GIPHY */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 1,
            pt: 1,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="caption" color="text.secondary">
              Powered by GIPHY
            </Typography>
          </Box>
        </Box>
      </Popover>

      {/* Comment Options Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedCommentId) {
              const findComment = (comments: Comment[]): Comment | null => {
                for (const comment of comments) {
                  if (comment.id === selectedCommentId) return comment
                  if (comment.replies) {
                    const found = findComment(comment.replies)
                    if (found) return found
                  }
                }
                return null
              }
              const comment = findComment(comments)
              if (comment) {
                handleEditClick(selectedCommentId, comment.commentText)
              }
            }
          }}
          sx={{ fontSize: '0.875rem' }}
        >
          <EditIcon sx={{ fontSize: 18, mr: 1 }} />
          Edit Comment
        </MenuItem>
        <MenuItem
          onClick={() => selectedCommentId && handleDeleteComment(selectedCommentId)}
          sx={{ color: 'error.main', fontSize: '0.875rem' }}
        >
          <DeleteIcon sx={{ fontSize: 18, mr: 1 }} />
          Delete Comment
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default CommentDialog