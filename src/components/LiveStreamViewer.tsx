'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Tooltip,
  Fade,
  CircularProgress,
  useTheme
} from '@mui/material'
import {
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  ThumbUp as ThumbUpIcon,
  Send as SendIcon,
  Share as ShareIcon,
  FiberManualRecord as RecordIcon,
  VolumeUp as VolumeUpIcon,
  VolumeOff as VolumeOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Celebration as CelebrationIcon,
  LocalFireDepartment as FireIcon,
  SentimentVerySatisfied as LaughIcon
} from '@mui/icons-material'
import { IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng'
import { useAgora } from '../hooks/useAgora'
import { getStreamDetails, getViewerToken, getWebSocketUrl } from '../services/livestreamService'
import {
  LiveStreamViewerProps,
  ChatMessage,
  FloatingReaction,
  WebSocketMessage
} from '../types/livestream'

// ==================== LIVE STREAM VIEWER COMPONENT ====================

const LiveStreamViewer: React.FC<LiveStreamViewerProps> = ({
  open,
  onClose,
  streamId,
  channelName,
  agoraAppId: propAgoraAppId,
  streamTitle = 'Live Stream',
  streamerName = 'Streamer',
  streamerAvatar,
  streamerId,
  userId,
  userName = 'Viewer',
  onStreamEnded
}) => {
  const theme = useTheme()

  // Agora hook - auto-subscribes to remote tracks now
  const {
    isJoined,
    remoteVideoTrack,
    remoteAudioTrack,
    remoteUsers,
    error: agoraError,
    joinChannel,
    leaveChannel,
    subscribeToUser
  } = useAgora({
    onUserPublished: async (user, mediaType) => {
      // Hook now auto-subscribes, but we can log here
      console.log('LiveStreamViewer: user published callback', user.uid, mediaType)
    },
    onError: (err) => setError(err.message)
  })

  // Stream states
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [streamEnded, setStreamEnded] = useState(false)

  // Media states
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Stats
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  // Floating reactions
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])

  // Refs
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // ==================== VIDEO DISPLAY ====================

  // Play remote video in container when track is available
  useEffect(() => {
    if (remoteVideoTrack && videoContainerRef.current) {
      console.log('Playing remote video track in container')
      remoteVideoTrack.play(videoContainerRef.current)
    }
  }, [remoteVideoTrack])

  // Handle remote audio
  useEffect(() => {
    if (remoteAudioTrack) {
      if (isMuted) {
        remoteAudioTrack.stop()
      } else {
        remoteAudioTrack.play()
      }
    }
  }, [remoteAudioTrack, isMuted])

  // ==================== CONNECTION FUNCTIONS ====================

  // Ref to track connection state (prevents duplicate connections)
  const isConnectingRef = useRef(false)

  // Connect to stream
  const connectToStream = useCallback(async () => {
    // Prevent duplicate connection attempts
    if (isConnectingRef.current || isJoined) {
      console.log('Already connecting or joined, skipping...')
      return
    }

    isConnectingRef.current = true
    setIsConnecting(true)
    setError(null)

    try {
      // Use passed agoraAppId or fetch from API
      let agoraAppId = propAgoraAppId

      // If agoraAppId not passed, try to get from stream details
      if (!agoraAppId) {
        console.log('No agoraAppId passed, fetching from API...')
        const streamDetails = await getStreamDetails(streamId)
        
        if (!streamDetails.success || !streamDetails.data) {
          throw new Error('Stream not found or has ended')
        }
        
        agoraAppId = streamDetails.data.agoraAppId
      }

      if (!agoraAppId) {
        throw new Error('Missing Agora App ID')
      }

      // Get viewer token from backend
      const tokenResponse = await getViewerToken(
        streamId, 
        localStorage.getItem('childUserId') || userId || ''
      )

      console.log('Token response:', tokenResponse)

      if (!tokenResponse.success || !tokenResponse.data) {
        throw new Error('Failed to get viewer token')
      }

      const { token, uid } = tokenResponse.data

      if (!token) {
        throw new Error('No token received from server')
      }

      console.log('Connecting to stream:', {
        streamId,
        channelName,
        agoraAppId,
        uid,
        tokenLength: token?.length
      })

      // Initialize WebSocket for chat
      initializeWebSocket()

      // Join Agora channel as audience
      await joinChannel({
        appId: agoraAppId,
        channel: channelName,
        token: token,
        uid: uid,
        role: 'audience'
      })

      // IMPORTANT: After joining, check for existing remote users who are already publishing
      // This handles the case where broadcaster started before viewer joined
      console.log('Checking for existing remote users...', remoteUsers)
      
      setIsConnecting(false)
      isConnectingRef.current = false

    } catch (err) {
      console.error('Connection error:', err)
      setError(err instanceof Error ? err.message : 'Failed to connect to stream')
      setIsConnecting(false)
      isConnectingRef.current = false
    }
  }, [streamId, channelName, userId, joinChannel, propAgoraAppId, isJoined])

  // Retry connection - first leave, then reconnect
  const retryConnection = useCallback(async () => {
    console.log('Retrying connection...')
    
    // Close existing WebSocket
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    // Leave channel if joined
    if (isJoined) {
      await leaveChannel()
    }

    // Reset state
    isConnectingRef.current = false
    setError(null)
    setStreamEnded(false)

    // Small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Reconnect
    await connectToStream()
  }, [isJoined, leaveChannel, connectToStream])

  // Initialize WebSocket
  const initializeWebSocket = useCallback(() => {
    // Close existing WebSocket if any
    if (websocketRef.current) {
      websocketRef.current.close()
      websocketRef.current = null
    }

    const wsUrl = getWebSocketUrl(streamId)
    const ws = new WebSocket(wsUrl)
    websocketRef.current = ws

    ws.onopen = () => {
      console.log('Viewer WebSocket connected')

      // Send viewer join message
      ws.send(JSON.stringify({
        type: 'viewer_join',
        streamId: streamId,
        userId: localStorage.getItem('childUserId') || userId,
        userName: localStorage.getItem('fullName') || userName,
        pageId: localStorage.getItem('pageId') || '0',
        userAvatar : localStorage.getItem('profilePhoto') || ''
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        handleWebSocketMessage(data)
      } catch (err) {
        console.error('Error parsing message:', err)
      }
    }

    ws.onerror = () => {
      console.error('WebSocket error')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }
  }, [streamId, userId, userName])

  // Handle reaction received (defined before handleWebSocketMessage since it's used there)
  const handleReactionReceived = useCallback((type: string) => {
    // Add floating reaction animation
    const reactionId = `${Date.now()}-${Math.random()}`
    const xPosition = Math.random() * 80 + 10
    setFloatingReactions(prev => [...prev, { id: reactionId, type, x: xPosition }])

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId))
    }, 2000)
  }, [])

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    // Get current user ID for comparison
    const currentUserId = localStorage.getItem('childUserId')
    
    // Log incoming message for debugging
    console.log('WebSocket message received:', data)
    
    switch (data.type) {
      case 'stream_info':
        setViewerCount(data.viewerCount || 0)
        setLikeCount(data.likeCount || 0)
        break

      case 'viewer_count':
        setViewerCount(data.count || 0)
        break

      case 'viewer_joined':
        // Skip our own join message
        if (data.userId === currentUserId) {
          break
        }
        // Handle multiple possible field names from backend
        const joinedName = data.userName || data.viewerName || data.name || 'Someone'
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          oderId: data.userId || '',
          userName: joinedName,
          userAvatar: data.userAvatar || data.profilePicture,
          message: 'joined the live',
          timestamp: new Date(),
          type: 'join'
        }])
        break

      case 'chat_message':
        // Skip if this is our own message (already added locally when sent)
        if (data.userId === currentUserId) {
          console.log('Skipping own message from WebSocket')
          break
        }
        
        // Handle multiple possible field names from backend
        const senderName = data.userName || data.viewerName || data.senderName || data.name || 'Anonymous'
        const senderAvatar = data.userAvatar || data.profilePicture || data.avatar
        const messageContent = data.message || data.content || data.text || ''
        
        console.log('Chat message from:', senderName, 'content:', messageContent)
        
        setChatMessages(prev => [...prev, {
          id: data.messageId || Date.now().toString(),
          oderId: data.userId || '',
          userName: senderName,
          userAvatar: senderAvatar,
          message: messageContent,
          timestamp: new Date(data.timestamp || Date.now()),
          type: 'message'
        }])
        break

      case 'reaction':
        handleReactionReceived(data.reactionType || 'like')
        break

      case 'stream_ended':
        setStreamEnded(true)
        onStreamEnded?.(streamId)
        break

      default:
        console.log('Unknown message:', data.type)
    }
  }, [handleReactionReceived])

  // Send reaction
  const sendReaction = useCallback((type: string) => {
    if (!websocketRef.current) return

    websocketRef.current.send(JSON.stringify({
      type: 'reaction',
      streamId: streamId,
      userId: localStorage.getItem('childUserId') || userId,
      reactionType: type
    }))

    // Show local feedback
    handleReactionReceived(type)
    setLikeCount(prev => prev + 1)
  }, [streamId, userId, handleReactionReceived])

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !websocketRef.current) return

    const messageData = {
      type: 'chat_message',
      streamId: streamId,
      userId: localStorage.getItem('childUserId') || userId,
      userName: localStorage.getItem('fullName') || userName,
      message: newMessage.trim(),
      profilePicture : localStorage.getItem('profilePhoto') || ''

    }

    websocketRef.current.send(JSON.stringify(messageData))

      setChatMessages(prev => [...prev, {
    id: Date.now().toString(),
    oderId: localStorage.getItem('childUserId') || userId || '',
    userName: localStorage.getItem('fullName') || userName,
    userAvatar: localStorage.getItem('profilePhoto') || '',  // <-- ADD THIS
    message: newMessage.trim(),
    timestamp: new Date(),
    type: 'message'
  }])

    // Add to local messages
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      oderId: localStorage.getItem('childUserId') || userId || '',
      userName: localStorage.getItem('fullName') || userName,
      userAvatar: localStorage.getItem('profilePhoto') || '',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'message'
    }])

    setNewMessage('')
  }, [newMessage, streamId, userId, userName])

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Handle close
  const handleClose = useCallback(() => {
    // Reset connecting state
    isConnectingRef.current = false

    // Send viewer leave message
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'viewer_leave',
        streamId: streamId,
        userId: localStorage.getItem('childUserId') || userId,
        pageId: localStorage.getItem('pageId') || '0'
      }))
      websocketRef.current.close()
      websocketRef.current = null
    }

    // Leave Agora channel
    leaveChannel()

    onClose()
  }, [streamId, userId, leaveChannel, onClose])

  // Connect when dialog opens
  useEffect(() => {
    if (open && streamId && channelName && !isJoined && !isConnectingRef.current) {
      connectToStream()
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
        websocketRef.current = null
      }
    }
  }, [open, streamId, channelName]) // Removed connectToStream from deps to prevent re-runs

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Get reaction icon
  const getReactionIcon = (type: string, size: 'small' | 'medium' = 'medium') => {
    const iconProps = { fontSize: size }
    switch (type) {
      case 'like': return <ThumbUpIcon {...iconProps} />
      case 'love': return <FavoriteIcon {...iconProps} />
      case 'laugh': return <LaughIcon {...iconProps} />
      case 'fire': return <FireIcon {...iconProps} />
      case 'celebrate': return <CelebrationIcon {...iconProps} />
      default: return <ThumbUpIcon {...iconProps} />
    }
  }

  // ==================== RENDER ====================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: '#000'
        }
      }}
    >
      <DialogContent
        ref={containerRef}
        sx={{
          p: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          height: '100%'
        }}
      >
        {/* Main Video Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            bgcolor: 'black'
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Video Container */}
          <Box
            ref={videoContainerRef}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              '& video': {
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }
            }}
          >
            {/* Loading State */}
            {isConnecting && (
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CircularProgress color="error" />
                <Typography color="white">Connecting to stream...</Typography>
              </Box>
            )}

            {/* Waiting for Video State */}
            {!isConnecting && !error && !streamEnded && !remoteVideoTrack && (
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <CircularProgress color="error" size={40} />
                <Typography color="white">Waiting for broadcaster video...</Typography>
                <Typography color="rgba(255,255,255,0.5)" variant="caption">
                  Connected to stream, waiting for video
                </Typography>
              </Box>
            )}

            {/* Error State */}
            {error && (
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 4
                }}
              >
                <Typography color="error" variant="h6">{error}</Typography>
                <Button variant="contained" onClick={retryConnection}>
                  Retry
                </Button>
              </Box>
            )}

            {/* Stream Ended State */}
            {streamEnded && (
              <Box
                sx={{
                  position: 'absolute',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2
                }}
              >
                <Typography color="white" variant="h5">Stream has ended</Typography>
                <Typography color="rgba(255,255,255,0.7)">Thanks for watching!</Typography>
                <Button variant="contained" onClick={handleClose} sx={{ mt: 2 }}>
                  Close
                </Button>
              </Box>
            )}

            {/* Live Indicator & Stats */}
            {!isConnecting && !error && !streamEnded && (
              <>
                <Chip
                  icon={<RecordIcon sx={{ color: '#fff !important' }} />}
                  label="LIVE"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: '#f44336',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 100
                  }}
                >
                  <Chip
                    icon={<VisibilityIcon />}
                    label={viewerCount}
                    size="small"
                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                  />
                  <Chip
                    icon={<FavoriteIcon />}
                    label={likeCount}
                    size="small"
                    sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                  />
                </Stack>
              </>
            )}

            {/* Floating reactions */}
            {floatingReactions.map((reaction) => (
              <Fade key={reaction.id} in timeout={200}>
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 150,
                    left: `${reaction.x}%`,
                    animation: 'floatUp 2s ease-out forwards',
                    color: 'white',
                    '@keyframes floatUp': {
                      '0%': { opacity: 1, transform: 'translateY(0) scale(1)' },
                      '50%': { transform: 'translateY(-100px) scale(1.2)' },
                      '100%': { opacity: 0, transform: 'translateY(-200px) scale(0.8)' }
                    }
                  }}
                >
                  {getReactionIcon(reaction.type)}
                </Box>
              </Fade>
            ))}

            {/* Streamer Info */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 80,
                left: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Avatar src={streamerAvatar} sx={{ width: 48, height: 48 }}>
                {streamerName[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" color="white" fontWeight="bold">
                  {streamerName}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  {streamTitle}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Controls */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: 'rgba(0,0,0,0.8)'
            }}
          >
            {/* Left controls */}
            <Stack direction="row" spacing={1}>
              <Tooltip title={isMuted ? 'Unmute' : 'Mute'}>
                <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                  {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
                <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Reactions */}
            <Stack direction="row" spacing={1}>
              {['like', 'love', 'laugh', 'fire', 'celebrate'].map((type) => (
                <Tooltip key={type} title={type.charAt(0).toUpperCase() + type.slice(1)}>
                  <IconButton
                    onClick={() => sendReaction(type)}
                    sx={{
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    {getReactionIcon(type, 'small')}
                  </IconButton>
                </Tooltip>
              ))}
            </Stack>

            {/* Right controls */}
            <Tooltip title="Share">
              <IconButton sx={{ color: 'white' }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Chat Sidebar */}
        <Paper
          sx={{
            width: { xs: '100%', md: 350 },
            height: { xs: '40%', md: '100%' },
            display: 'flex',
            flexDirection: 'column',
            bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#262626',
            borderRadius: 0
          }}
        >
          {/* Chat Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" color="white" fontWeight="bold">
                Live Chat
              </Typography>
              <Chip
                size="small"
                label={`${viewerCount} watching`}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
              />
            </Stack>
          </Box>

          {/* Messages */}
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 1
            }}
          >
            <List dense>
              {chatMessages.map((msg) => (
                <ListItem
                  key={msg.id}
                  sx={{
                    py: 0.5,
                    px: 1,
                    bgcolor: msg.type === 'join' ? 'rgba(76,175,80,0.1)' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 36 }}>
                    <Avatar
                      src={msg.userAvatar}
                      sx={{ width: 28, height: 28, fontSize: 12 }}
                    >
                      {msg.userName[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="white">
                        <strong style={{ color: '#90caf9' }}>{msg.userName}</strong>
                        {msg.type === 'join' ? (
                          <span style={{ color: '#4caf50', marginLeft: 4 }}>{msg.message}</span>
                        ) : (
                          <span style={{ marginLeft: 8 }}>{msg.message}</span>
                        )}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Say something..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={streamEnded}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={sendMessage}
                      size="small"
                      disabled={streamEnded}
                      sx={{ color: 'primary.main' }}
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                }
              }}
            />
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  )
}

export default LiveStreamViewer