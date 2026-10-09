'use client'
import React, { useState, useRef, useCallback } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useRouter } from 'next/navigation'
import CreatePostDialog from './CreatePostDialog'
import LiveStreamDialog from './LiveStreamDialog'  // Import the LiveStreamDialog component
import { tokenCookie } from '../hooks/useAuthRedirect';
import {
  Box,
  Avatar,
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem
} from '@mui/material'
import {
  LiveTv as LiveTvIcon,
  MovieFilter as ReelIcon,
  AutoStories as StoryIcon,
  AutoAwesome as AIIcon,
  CloudUpload as UploadIcon,
  Videocam as VideocamIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Replay as ReplayIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  FiberManualRecord as RecordIcon,
  Lightbulb as LightbulbIcon,
  Mic as MicIcon,
  Wifi as WifiIcon,
  Timer as TimerIcon,
  PhotoCamera as PhotoIcon,
  Send as SendIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { useBroker } from '@/contexts/BrokerContext'
import { useUserProfile } from '../contexts/UserProfileContext'


interface CreatePostComponentProps {
  onOpenPostDialog?: (videoFile?: File | null) => void
  onOpenReelDialog?: () => void
  onOpenStoryDialog?: () => void
  onOpenLiveDialog?: () => void
  onOpenAIDialog?: () => void
  onPostCreated?: (postData: unknown) => void  // Callback when a post is created from live video
  avatarLetter?: string
  avatarColor?: string
  placeholder?: string
  userId?: string
  adminUser?: string
}

interface ReelData {
  title: string
  description: string
  hashtags: string
}

interface CreateStoryResponse {
  success: boolean
  message: string
  data: {
    storyId: number
    storyType: string
    content: string
    mediaUrl: string
    duration: number
    location: string
    mentions: string[]
    userId: number
    pageId: number
  }
  errorCode: string | null
}

// LiveStreamData interface for stream end callback
interface LiveStreamData {
  streamId: string
  channelName: string
  title: string
  description: string
  duration: number
  viewerCount: number
  likeCount: number
  recordingUrl?: string
}

const CreatePostComponent: React.FC<CreatePostComponentProps> = ({
  onOpenPostDialog,
  onOpenReelDialog,
  onOpenLiveDialog,
  onOpenAIDialog,
  onPostCreated,
  avatarLetter = 'B',
  avatarColor = '#4267b2',
  placeholder = "What's your next move?",
  userId = '',
  adminUser = ''
}) => {
  const router = useRouter()
  const { brokerDetails } = useBroker()
  const { userProfile } = useUserProfile()


  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Existing reel states
  const [isReelDialogOpen, setIsReelDialogOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [reelData, setReelData] = useState<ReelData>({
    title: '',
    description: '',
    hashtags: ''
  })
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [reelVisibilityType, setReelVisibilityType] = useState('1')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  // ==================== LIVE STREAM STATE ====================
  const [isLiveStreamDialogOpen, setIsLiveStreamDialogOpen] = useState(false)

  // Live video recording states (for local recording - kept for backward compatibility)
  const [isLiveInstructionDialogOpen, setIsLiveInstructionDialogOpen] = useState(false)
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [recordedVideoFile, setRecordedVideoFile] = useState<File | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Story creation states
  const [isStoryDialogOpen, setIsStoryDialogOpen] = useState(false)
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null)
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string>('')
  const [storyFileType, setStoryFileType] = useState<'image' | 'video' | null>(null)
  const [storyCaption, setStoryCaption] = useState('')
  const [storyLocation, setStoryLocation] = useState('')
  const [storyMentions, setStoryMentions] = useState('')
  const [uploadingStory, setUploadingStory] = useState(false)
  const [storyUploadError, setStoryUploadError] = useState<string | null>(null)

  // Refs for video recording
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Refs for story file input
  const storyFileInputRef = useRef<HTMLInputElement>(null)

  // Function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        resolve(video.duration)
      }

      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }

      video.src = URL.createObjectURL(file)
    })
  }

  // Handle video file selection
  const handleVideoSelect = async (file: File) => {
    try {
      const duration = await getVideoDuration(file)
      setVideoDuration(duration)
      setSelectedVideo(file)

      if (duration < 60) {
        setIsReelDialogOpen(true)
      } else {
        if (onOpenPostDialog) {
          onOpenPostDialog()
        }
      }
    } catch (error) {
      console.error('Error processing video:', error)
      setUploadMessage('Error processing video file')
    }
  }

  // Create reel API call
  const createReel = async () => {
    if (!selectedVideo) return

    setIsUploading(true)
    setUploadMessage('')

    try {
      const formData = new FormData()
      formData.append('video', selectedVideo)
      formData.append('userId', localStorage.getItem('childUserId') || '')
      formData.append('adminUser', localStorage.getItem('uuid') || '')
      formData.append('description', reelData.description)
      formData.append('hashtags', reelData.hashtags)
      formData.append('title', reelData.title)
      formData.append('duration', videoDuration.toString())
      formData.append('videoUrl', '')
      formData.append('coverUrl', '')

      // Append cover image if provided, otherwise send empty string
      if (coverImage) {
        formData.append('cover', coverImage)
        console.log('Cover image added:', coverImage.name, coverImage.size)
      } else {
        formData.append('cover', '')
      }

      formData.append('visibilityType', reelVisibilityType || '1')
      formData.append('pageId', localStorage.getItem('pageId') || '')
      formData.append('campaignId', '0')

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/reels/createReel',
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (result.success) {
        setUploadMessage('Reel created successfully!')
        setTimeout(() => {
          setIsReelDialogOpen(false)
          resetReelForm()
        }, 2000)
      } else {
        setUploadMessage('Failed to create reel. Please try again.')
      }
    } catch (error) {
      console.error('Error creating reel:', error)
      setUploadMessage('Error creating reel. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Reset form data
  const resetReelForm = () => {
    setSelectedVideo(null)
    setVideoDuration(0)
    setCoverImage(null)
    setReelData({ title: '', description: '', hashtags: '' })
    setUploadMessage('')
    setReelVisibilityType('1')  // ✅ Reset visibility
  }

  // Handle file input change
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoSelect(file)
    }
  }

  // ==================== LIVE STREAM HANDLERS ====================

  const handleOpenLiveStream = () => {
    setIsLiveStreamDialogOpen(true)
  }

  const handleCloseLiveStream = () => {
    setIsLiveStreamDialogOpen(false)
  }

  const handleLiveStreamEnd = (streamData: LiveStreamData) => {
    console.log('Live stream ended:', streamData)
    
    // If there's a recording URL, you could offer to create a post with it
    if (streamData.recordingUrl && onPostCreated) {
      // The recording URL can be used to create a post if needed
      console.log('Recording available at:', streamData.recordingUrl)
    }
  }

  // ==================== STORY CREATION FUNCTIONS ====================

  // Open story dialog
  const handleOpenStoryDialog = () => {
    setIsStoryDialogOpen(true)
    // Trigger file selection automatically
    setTimeout(() => {
      storyFileInputRef.current?.click()
    }, 100)
  }

  // Close story dialog
  const handleCloseStoryDialog = () => {
    setIsStoryDialogOpen(false)
    setSelectedStoryFile(null)
    setStoryPreviewUrl('')
    setStoryFileType(null)
    setStoryCaption('')
    setStoryLocation('')
    setStoryMentions('')
    setStoryUploadError(null)
  }

  // Handle story file selection
  const handleStoryFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setStoryUploadError('Please select an image or video file')
      return
    }

    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      setStoryUploadError('File size must be less than 100MB')
      return
    }

    setSelectedStoryFile(file)
    setStoryFileType(isImage ? 'image' : 'video')
    setStoryUploadError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setStoryPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    if (event.target) {
      event.target.value = ''
    }
  }

  // Create story API call
  const handleShareStory = async () => {
    if (!selectedStoryFile) return

    setUploadingStory(true)
    setStoryUploadError(null)

    try {
      const adminUser = localStorage.getItem('uuid')
      const userId = localStorage.getItem('childUserId')

      if (!adminUser || !userId) {
        throw new Error('User not logged in. Please login to create a story.')
      }

      const formData = new FormData()
      formData.append('adminUser', adminUser)
      formData.append('storyType', storyFileType === 'image' ? 'IMAGE' : 'VIDEO')
      formData.append('userId', userId)
      formData.append('pageId', localStorage.getItem('pageId') || '')

      if (storyCaption) {
        formData.append('content', storyCaption)
      }

      if (storyLocation) {
        formData.append('location', storyLocation)
      }

      if (storyMentions) {
        const mentionsList = storyMentions.split(',').map(m => m.trim()).filter(m => m)
        if (mentionsList.length > 0) {
          formData.append('mentions', mentionsList.join(','))
        }
      }

      formData.append('media', selectedStoryFile)

      const storedAccessToken = tokenCookie.get()
      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/stories/create',
        {
          method: 'POST',
          headers: {
            ...(storedAccessToken && { authorization: `bearer ${storedAccessToken}` })
          },
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CreateStoryResponse = await response.json()

      if (result.success) {
        console.log('Story created successfully:', result.data)
        handleCloseStoryDialog()

        // Show success message
        setStoryUploadError('Story created successfully!')
        setTimeout(() => {
          handleCloseStoryDialog()
        }, 2000)
      } else {
        throw new Error(result.message || 'Failed to create story')
      }
    } catch (error) {
      console.error('Error creating story:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setStoryUploadError('Network error. Please check your internet connection.')
      } else if (error instanceof Error) {
        setStoryUploadError(error.message)
      } else {
        setStoryUploadError('Failed to create story. Please try again.')
      }
    } finally {
      setUploadingStory(false)
    }
  }

  // ==================== LIVE VIDEO RECORDING FUNCTIONS (Local Recording - Kept for backward compatibility) ====================

  // Open live instruction dialog
  const handleOpenLiveInstructions = () => {
    setIsLiveInstructionDialogOpen(true)
  }

  // Close live instruction dialog
  const handleCloseLiveInstructions = () => {
    setIsLiveInstructionDialogOpen(false)
  }

  // Start webcam after user understands instructions
  const handleUnderstandClick = async () => {
    setIsLiveInstructionDialogOpen(false)
    setIsRecordingDialogOpen(true)
    setCameraError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setCameraError('Unable to access camera or microphone. Please check your permissions.')
    }
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []
    setRecordingTime(0)

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedVideoUrl(url)

      // Create a File object from the blob
      const file = new File([blob], `live-video-${Date.now()}.webm`, {
        type: 'video/webm'
      })
      setRecordedVideoFile(file)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // Collect data every second
    setIsRecording(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1)
    }, 1000)
  }, [])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  // Re-record video
  const handleReRecord = useCallback(() => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl)
    }
    setRecordedVideoUrl(null)
    setRecordedVideoFile(null)
    setRecordingTime(0)

    // Restart the video preview
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play()
    }
  }, [recordedVideoUrl])

  // Close recording dialog and cleanup
  const handleCloseRecordingDialog = useCallback(() => {
    // Stop recording if active
    if (isRecording) {
      stopRecording()
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Revoke URL
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl)
    }

    // Reset states
    setIsRecordingDialogOpen(false)
    setRecordedVideoUrl(null)
    setRecordedVideoFile(null)
    setRecordingTime(0)
    setCameraError(null)
  }, [isRecording, recordedVideoUrl, stopRecording])

  // State for internal post dialog (for live video only)
  const [showInternalPostDialog, setShowInternalPostDialog] = useState(false)
  const [liveVideoFileForDialog, setLiveVideoFileForDialog] = useState<File | null>(null)

  // Submit recorded video to create post dialog
  const handleSubmitRecordedVideo = useCallback(() => {
    console.log('handleSubmitRecordedVideo called');
    console.log('recordedVideoFile:', recordedVideoFile);

    if (recordedVideoFile) {
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      setIsRecordingDialogOpen(false)

      // Store the file for the internal dialog
      setLiveVideoFileForDialog(recordedVideoFile)

      // Open the internal post dialog
      setShowInternalPostDialog(true)

      console.log('Opening internal post dialog with file:', recordedVideoFile.name, recordedVideoFile.size);

      // Reset recording states
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
      }
      setRecordedVideoUrl(null)
      setRecordedVideoFile(null)
      setRecordingTime(0)
    } else {
      console.warn('Cannot submit: recordedVideoFile is missing');
    }
  }, [recordedVideoFile, recordedVideoUrl])

  // Handle internal post dialog close
  const handleInternalPostDialogClose = useCallback(() => {
    setShowInternalPostDialog(false)
    setLiveVideoFileForDialog(null)
  }, [])

  // Format time for display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Card sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'light'
          ? '0 1px 2px rgba(0,0,0,0.1)'
          : '0 1px 3px rgba(0,0,0,0.3)',
        bgcolor: theme.palette.background.paper
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* TextField and Post Button in one line */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            mb: 2
          }}>
            {/* <Avatar sx={{
              bgcolor: avatarColor,
              width: { xs: 36, sm: 40 },
              height: { xs: 36, sm: 40 },
              fontSize: { xs: 14, sm: 16 }
            }}>
              {brokerDetails?.firstName?.[0]}
            </Avatar> */}
            <Avatar
              src={userProfile.profilePicture || undefined}
              sx={{ bgcolor: '#4267b2', width: 34, height: 34, fontSize: 13, fontWeight: 600 }}
            >
              {(userProfile.fullName?.[0] || brokerDetails?.firstName?.[0] || 'U').toUpperCase()}
            </Avatar>

            <TextField
              fullWidth
              placeholder={placeholder}
              variant="outlined"
              onClick={() => onOpenPostDialog?.()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(0, 0, 0, 0.04)'
                    : 'rgba(255, 255, 255, 0.05)',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '& fieldset': {
                    border: 'none'
                  },
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'light'
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'rgba(255, 255, 255, 0.08)',
                  },
                  '&.Mui-focused': {
                    bgcolor: theme.palette.mode === 'light'
                      ? 'rgba(0, 0, 0, 0.06)'
                      : 'rgba(255, 255, 255, 0.08)',
                    '& fieldset': {
                      border: 'none'
                    }
                  }
                },
                '& .MuiOutlinedInput-input': {
                  cursor: 'pointer'
                }
              }}
            />

            <Button
              variant="contained"
              onClick={() => onOpenPostDialog?.()}
              sx={{
                borderRadius: '24px',
                bgcolor: theme.palette.primary.main,
                textTransform: 'none',
                px: { xs: 2.5, sm: 3 },
                py: { xs: 0.75, sm: 1 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                fontWeight: 600,
                minWidth: { xs: 'auto', sm: 'auto' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
            >
              Post
            </Button>
          </Box>

          {/* Divider */}
          <Box sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            my: 2
          }} />

          {/* Feature buttons row - Live video, Reel, Story, AI */}
          <Stack
            direction="row"
            spacing={{ xs: 0.5, sm: 2 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'space-around', sm: 'center' },
              flexWrap: 'wrap',
              gap: { xs: 0.5, sm: 0 }
            }}
          >
            {/* Live Video Button - Now opens actual live streaming */}
            <Button
              variant="text"
              startIcon={
                <LiveTvIcon sx={{
                  color: '#f02849',
                  fontSize: { xs: 18, sm: 20 }
                }} />
              }
              onClick={handleOpenLiveStream}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(240, 40, 73, 0.08)'
                    : 'rgba(240, 40, 73, 0.15)',
                  color: '#f02849'
                }
              }}
            >
              {!isMobile && 'Live video'}
              {isMobile && 'Live'}
            </Button>

            <Button
              variant="text"
              startIcon={
                <ReelIcon sx={{
                  color: '#e91e63',
                  fontSize: { xs: 18, sm: 20 }
                }} />
              }
              onClick={onOpenReelDialog}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(233, 30, 99, 0.08)'
                    : 'rgba(233, 30, 99, 0.15)',
                  color: '#e91e63'
                }
              }}
            >
              Reel
            </Button>

            <Button
              variant="text"
              startIcon={
                <StoryIcon sx={{
                  color: '#9c27b0',
                  fontSize: { xs: 18, sm: 20 }
                }} />
              }
              onClick={handleOpenStoryDialog}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(156, 39, 176, 0.08)'
                    : 'rgba(156, 39, 176, 0.15)',
                  color: '#9c27b0'
                }
              }}
            >
              Story
            </Button>

            <Button
              variant="text"
              startIcon={
                <AIIcon sx={{
                  color: theme.palette.primary.main,
                  fontSize: { xs: 18, sm: 20 }
                }} />
              }
              onClick={() => {
                const a = document.createElement('a')
                a.href = '/ai'
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                a.click()
              }}
              sx={{
                textTransform: 'none',
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.8rem', sm: '0.95rem' },
                fontWeight: 500,
                px: { xs: 1, sm: 2 },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'light'
                    ? `${theme.palette.primary.main}14`
                    : `${theme.palette.primary.main}26`,
                  color: theme.palette.primary.main
                }
              }}
            >
              AI
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ==================== LIVE STREAM DIALOG ==================== */}
      <LiveStreamDialog
        open={isLiveStreamDialogOpen}
        onClose={handleCloseLiveStream}
        userId={localStorage.getItem('childUserId') || undefined}
        adminUser={localStorage.getItem('uuid') || undefined}
        userName={userProfile.fullName || brokerDetails?.firstName || 'User'}
        userAvatar={userProfile.profilePicture || undefined}
        pageId={localStorage.getItem('pageId') || undefined}
        onStreamEnd={handleLiveStreamEnd}
      />

      {/* Reel Creation Dialog */}
      <Dialog
        open={isReelDialogOpen}
        onClose={() => setIsReelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary
        }}>
          Create Reel ({videoDuration < 60 ? `${Math.round(videoDuration)}s - Auto-detected as Reel` : 'Manual Reel'})
        </DialogTitle>
        <DialogContent>
          {uploadMessage && (
            <Alert
              severity={uploadMessage.includes('successfully') ? 'success' : 'error'}
              sx={{ mb: 2 }}
            >
              {uploadMessage}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            value={reelData.title}
            onChange={(e) => setReelData({ ...reelData, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            fullWidth
            label="Description"
            multiline
            rows={3}
            value={reelData.description}
            onChange={(e) => setReelData({ ...reelData, description: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Hashtags (e.g., #trending #viral)"
            value={reelData.hashtags}
            onChange={(e) => setReelData({ ...reelData, hashtags: e.target.value })}
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: theme.palette.mode === 'light'
                    ? 'rgba(30, 64, 175, 0.04)'
                    : 'rgba(30, 64, 175, 0.08)'
                }
              }}
            >
              {coverImage ? 'Change Cover Image' : 'Upload Cover Image (Optional)'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setCoverImage(file)
                }}
              />
            </Button>
            {coverImage && (
              <Box sx={{
                mt: 1,
                fontSize: '0.875rem',
                color: theme.palette.text.secondary
              }}>
                Selected: {coverImage.name}
              </Box>
            )}
          </Box>
          {/* Visibility Selector */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
              Who can see this reel?
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={reelVisibilityType}
              onChange={(e) => setReelVisibilityType(e.target.value)}
            >
              <MenuItem value="1">🌍 Public - Anyone can see this reel</MenuItem>
              <MenuItem value="2">👥 Only Followers - Only your followers can see</MenuItem>
              <MenuItem value="3">🔒 Only Me - Only you can see</MenuItem>
              <MenuItem value="4">⭐ Exclusive Content - Only subscribed followers</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 2
        }}>
          <Button
            onClick={() => setIsReelDialogOpen(false)}
            disabled={isUploading}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={createReel}
            variant="contained"
            disabled={isUploading || !reelData.title || !reelData.description}
            startIcon={isUploading ? <CircularProgress size={20} /> : null}
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': {
                bgcolor: theme.palette.primary.dark
              },
              '&:disabled': {
                bgcolor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled
              }
            }}
          >
            {isUploading ? 'Creating...' : 'Create Reel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Story Creation Dialog */}
      <Dialog
        open={isStoryDialogOpen}
        onClose={handleCloseStoryDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1
        }}>
          <Typography variant="h6" fontWeight={600}>
            Create Story
          </Typography>
          <IconButton onClick={handleCloseStoryDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {!storyPreviewUrl && (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              mb: 3,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: theme.palette.action.hover
              }
            }}
              onClick={() => storyFileInputRef.current?.click()}
            >
              <PhotoIcon sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Click to select an image or video
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Supports JPG, PNG, MP4, MOV (Max 100MB)
              </Typography>
            </Box>
          )}

          {storyPreviewUrl && (
            <Box sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'center',
              bgcolor: '#000',
              borderRadius: 2,
              overflow: 'hidden',
              maxHeight: 400
            }}>
              {storyFileType === 'image' ? (
                <img
                  src={storyPreviewUrl}
                  alt="Story preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <video
                  src={storyPreviewUrl}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a caption..."
            value={storyCaption}
            onChange={(e) => setStoryCaption(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            placeholder="Add location..."
            value={storyLocation}
            onChange={(e) => setStoryLocation(e.target.value)}
            InputProps={{
              startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            placeholder="Tag people (separate with commas)..."
            value={storyMentions}
            onChange={(e) => setStoryMentions(e.target.value)}
            helperText="Example: @john, @sarah"
          />

          {storyUploadError && (
            <Alert
              severity={storyUploadError.includes('successfully') ? 'success' : 'error'}
              sx={{ mt: 2 }}
            >
              {storyUploadError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {storyPreviewUrl && (
            <Button
              onClick={() => storyFileInputRef.current?.click()}
              startIcon={<PhotoIcon />}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              Change Media
            </Button>
          )}

          <Button onClick={handleCloseStoryDialog} disabled={uploadingStory}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleShareStory}
            disabled={uploadingStory || !selectedStoryFile}
            startIcon={uploadingStory ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{
              bgcolor: '#9c27b0',
              '&:hover': {
                bgcolor: '#7b1fa2'
              }
            }}
          >
            {uploadingStory ? 'Sharing...' : 'Share Story'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden file input for story */}
      <input
        ref={storyFileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleStoryFileSelect}
        style={{ display: 'none' }}
      />

      {/* Live Video Instructions Dialog (Local Recording - kept for backward compatibility) */}
      <Dialog
        open={isLiveInstructionDialogOpen}
        onClose={handleCloseLiveInstructions}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LiveTvIcon sx={{ color: '#f02849', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={600}>
              Record Live Video
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseLiveInstructions}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: theme.palette.text.secondary,
              textAlign: 'center'
            }}
          >
            Before you start recording, please ensure the following for the best experience:
          </Typography>

          <List sx={{ mb: 2 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <LightbulbIcon sx={{ color: '#ffc107' }} />
              </ListItemIcon>
              <ListItemText
                primary="Good Lighting"
                secondary="Make sure you're in a well-lit area for better video quality"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <MicIcon sx={{ color: '#4caf50' }} />
              </ListItemIcon>
              <ListItemText
                primary="Audio Permission"
                secondary="Allow microphone access when prompted for audio recording"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <VideocamIcon sx={{ color: '#2196f3' }} />
              </ListItemIcon>
              <ListItemText
                primary="Camera Permission"
                secondary="Grant camera access to start recording your video"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <WifiIcon sx={{ color: '#9c27b0' }} />
              </ListItemIcon>
              <ListItemText
                primary="Stable Connection"
                secondary="Ensure you have a stable internet connection"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 44 }}>
                <TimerIcon sx={{ color: '#ff5722' }} />
              </ListItemIcon>
              <ListItemText
                primary="Recording Duration"
                secondary="You can record videos of any length for your post"
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          </List>

          <Alert
            severity="info"
            sx={{
              borderRadius: 2,
              '& .MuiAlert-icon': {
                alignItems: 'center'
              }
            }}
          >
            Your video will be saved locally and you can preview it before creating your post.
          </Alert>
        </DialogContent>

        <DialogActions sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 2,
          gap: 1
        }}>
          <Button
            onClick={handleCloseLiveInstructions}
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUnderstandClick}
            variant="contained"
            startIcon={<CheckCircleIcon />}
            sx={{
              bgcolor: '#f02849',
              px: 3,
              '&:hover': {
                bgcolor: '#d32f2f'
              }
            }}
          >
            I Understand, Start Recording
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Recording Dialog (Local Recording - kept for backward compatibility) */}
      <Dialog
        open={isRecordingDialogOpen}
        onClose={handleCloseRecordingDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          py: 1.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isRecording && (
              <RecordIcon
                sx={{
                  color: '#f02849',
                  fontSize: 20,
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 }
                  }
                }}
              />
            )}
            <Typography variant="h6" fontWeight={600}>
              {recordedVideoUrl ? 'Preview Recording' : isRecording ? 'Recording...' : 'Camera Ready'}
            </Typography>
            {(isRecording || recordedVideoUrl) && (
              <Typography
                variant="body2"
                sx={{
                  bgcolor: isRecording ? '#f02849' : theme.palette.grey[700],
                  color: '#fff',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontFamily: 'monospace'
                }}
              >
                {formatTime(recordingTime)}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={handleCloseRecordingDialog}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, position: 'relative' }}>
          {cameraError ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400,
              p: 4
            }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {cameraError}
              </Alert>
              <Button
                variant="contained"
                onClick={handleUnderstandClick}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          ) : (
            <Box sx={{
              position: 'relative',
              width: '100%',
              bgcolor: '#000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: { xs: 300, sm: 400, md: 450 }
            }}>
              {/* Live camera preview */}
              {!recordedVideoUrl && (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'contain',
                    transform: 'scaleX(-1)' // Mirror effect for front camera
                  }}
                />
              )}

              {/* Recorded video preview */}
              {recordedVideoUrl && (
                <video
                  src={recordedVideoUrl}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '450px',
                    objectFit: 'contain'
                  }}
                />
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          px: 3,
          py: 2,
          justifyContent: 'center',
          gap: 2
        }}>
          {!recordedVideoUrl ? (
            // Recording controls
            <>
              <Button
                onClick={handleCloseRecordingDialog}
                sx={{
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover
                  }
                }}
              >
                Cancel
              </Button>

              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  variant="contained"
                  startIcon={<RecordIcon />}
                  disabled={!!cameraError}
                  sx={{
                    bgcolor: '#f02849',
                    px: 4,
                    py: 1.2,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: '#d32f2f'
                    }
                  }}
                >
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="contained"
                  startIcon={<StopIcon />}
                  sx={{
                    bgcolor: theme.palette.grey[800],
                    px: 4,
                    py: 1.2,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: theme.palette.grey[900]
                    }
                  }}
                >
                  Stop Recording
                </Button>
              )}
            </>
          ) : (
            // Preview controls
            <>
              <Button
                onClick={handleReRecord}
                variant="outlined"
                startIcon={<ReplayIcon />}
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: theme.palette.text.primary,
                    bgcolor: theme.palette.action.hover
                  }
                }}
              >
                Re-record
              </Button>

              <Button
                onClick={handleSubmitRecordedVideo}
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{
                  bgcolor: theme.palette.primary.main,
                  px: 4,
                  py: 1.2,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark
                  }
                }}
              >
                Use This Video
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Internal CreatePostDialog for Live Video Recording */}
      <CreatePostDialog
        open={showInternalPostDialog}
        onClose={handleInternalPostDialogClose}
        initialVideoFile={liveVideoFileForDialog}
        onPostCreated={(postData) => {
          console.log('Post created from live video:', postData);
          handleInternalPostDialogClose();
          // Notify parent component if callback is provided
          if (onPostCreated) {
            onPostCreated(postData);
          }
        }}
      />
    </>
  )
}

export default CreatePostComponent