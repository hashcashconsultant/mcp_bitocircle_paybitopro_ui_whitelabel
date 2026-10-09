'use client'
import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Avatar,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Badge,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  Fade,
  Slide,
  useTheme,
  Divider
} from '@mui/material'
import {
  Close as CloseIcon,
  LiveTv as LiveTvIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Cameraswitch as CameraswitchIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  Settings as SettingsIcon,
  FiberManualRecord as RecordIcon,
  Stop as StopIcon,
  Chat as ChatIcon,
  EmojiEmotions as EmojiIcon,
  ThumbUp as ThumbUpIcon,
  Celebration as CelebrationIcon,
  LocalFireDepartment as FireIcon,
  SentimentVerySatisfied as LaughIcon,
  Timer as TimerIcon // ✅ CHANGE 1a: Added TimerIcon import
} from '@mui/icons-material'
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  ILocalVideoTrack
} from 'agora-rtc-sdk-ng'
import { createLiveStream, endLiveStream, getWebSocketUrl } from '../services/livestreamService'
import {
  LiveStreamDialogProps,
  LiveStreamData,
  ChatMessage,
  Viewer,
  StreamReaction,
  FloatingReaction,
  StreamPhase,
  WebSocketMessage
} from '../types/livestream'

import { tokenCookie } from '../hooks/useAuthRedirect';
import { sendOnPageExit } from '@/utils/apiAuth'


// Configure Agora SDK
AgoraRTC.setLogLevel(3)

// ==================== LIVE STREAM DIALOG COMPONENT ====================

const LiveStreamDialog: React.FC<LiveStreamDialogProps> = ({
  open,
  onClose,
  userId,
  adminUser,
  userAvatar,
  userName = 'You',
  pageId,
  onStreamEnd
}) => {
  const theme = useTheme()

  // Stream states
  const [streamPhase, setStreamPhase] = useState<StreamPhase>('setup')
  const [streamTitle, setStreamTitle] = useState('')
  const [streamDescription, setStreamDescription] = useState('')
  const [streamId, setStreamId] = useState<string | null>(null)
  const [channelName, setChannelName] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track states - manage directly without useAgora hook
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isJoined, setIsJoined] = useState(false)

  // Stream stats
  const [viewerCount, setViewerCount] = useState(0)
  const [likeCount, setLikeCount] = useState(0)
  const [streamDuration, setStreamDuration] = useState(0)
  const [reactions, setReactions] = useState<StreamReaction[]>([
    { type: 'like', count: 0 },
    { type: 'love', count: 0 },
    { type: 'laugh', count: 0 },
    { type: 'fire', count: 0 },
    { type: 'celebrate', count: 0 }
  ])

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showChat, setShowChat] = useState(true)
  const [viewers, setViewers] = useState<Viewer[]>([])

  // Floating reactions animation
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([])

  // ==================== ✅ CHANGE 1: Stream time limit states ====================
  const MAX_STREAM_DURATION = 3600 // 1 hour in seconds
  const WARNING_THRESHOLD = MAX_STREAM_DURATION - 120 // Show warning at 58 minutes (2 min remaining)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(120)
  // ==============================================================================

  // Refs - SINGLE video container that persists across phases
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // Agora refs - manage client and tracks directly
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const videoTrackRef = useRef<ICameraVideoTrack | null>(null)
  const audioTrackRef = useRef<IMicrophoneAudioTrack | null>(null)
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null)

  // ==================== AGORA CLIENT INITIALIZATION ====================

  useEffect(() => {
    // Create Agora client once
    clientRef.current = AgoraRTC.createClient({
      mode: 'live',
      codec: 'vp8'
    })

    return () => {
      // Cleanup on unmount
      if (clientRef.current) {
        clientRef.current.removeAllListeners()
      }
    }
  }, [])

  // ==================== ✅ CHANGE 2: Monitor stream duration for time limit ====================
  useEffect(() => {
    if (streamPhase !== 'live') return

    // Show warning popup when 2 minutes remain
    if (streamDuration >= WARNING_THRESHOLD && streamDuration < MAX_STREAM_DURATION) {
      const timeLeft = MAX_STREAM_DURATION - streamDuration
      setRemainingSeconds(timeLeft)

      if (!showTimeWarning) {
        setShowTimeWarning(true)

        // Notify viewers via WebSocket that stream is ending soon
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.send(JSON.stringify({
            type: 'stream_ending_soon',
            streamId: streamId,
            remainingSeconds: timeLeft
          }))
        }

        // Add system message in chat
        setChatMessages(prev => [...prev, {
          id: `time-warning-${Date.now()}`,
          oderId: 'system',
          userName: 'System',
          message: `⏰ This live stream will automatically end in 2 minutes.`,
          timestamp: new Date(),
          type: 'system'
        }])
      }
    }

    // Auto-end stream when max duration is reached
    if (streamDuration >= MAX_STREAM_DURATION) {
      console.log('⏰ Max stream duration reached (1 hour). Auto-ending stream...')

      setChatMessages(prev => [...prev, {
        id: `time-up-${Date.now()}`,
        oderId: 'system',
        userName: 'System',
        message: '⏰ Stream time limit reached. Ending stream automatically.',
        timestamp: new Date(),
        type: 'system'
      }])

      // Small delay so the message is visible before ending
      setTimeout(() => {
        endLiveStreamHandler()
      }, 1500)
    }
  }, [streamDuration, streamPhase])
  // ============================================================================================

  // ==================== CAMERA FUNCTIONS ====================

  const startPreview = useCallback(async () => {
    try {
      setError(null)
      
      // Create local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
        { encoderConfig: 'music_standard' },
        {
          encoderConfig: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrateMax: 2000
          }
        }
      )

      // Store in refs
      audioTrackRef.current = audioTrack
      videoTrackRef.current = videoTrack

      // Play video in container
      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current)
        console.log('Preview started, video playing')
      }

      setIsVideoEnabled(true)
      setIsAudioEnabled(true)
      setStreamPhase('preview')
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera or microphone. Please check permissions.')
    }
  }, [])

  const toggleVideo = useCallback(async () => {
  if (videoTrackRef.current) {
    const newState = !isVideoEnabled
    
    if (streamPhase === 'live') {
      await videoTrackRef.current.setEnabled(newState)
    } else {
      await videoTrackRef.current.setEnabled(newState)
    }
    
    setIsVideoEnabled(newState)
    console.log('Video toggled to:', newState)
  }
}, [isVideoEnabled, streamPhase])

const toggleAudio = useCallback(async () => {
  if (audioTrackRef.current) {
    const newState = !isAudioEnabled
    
    if (streamPhase === 'live') {
      await audioTrackRef.current.setEnabled(newState)
    } else {
      await audioTrackRef.current.setEnabled(newState)
    }
    
    setIsAudioEnabled(newState)
    console.log('Audio toggled to:', newState)
  }
}, [isAudioEnabled, streamPhase])

  const switchCamera = useCallback(async () => {
    if (videoTrackRef.current) {
      try {
        const devices = await AgoraRTC.getCameras()
        if (devices.length > 1) {
          const currentDevice = videoTrackRef.current.getTrackLabel()
          const nextDevice = devices.find(d => d.label !== currentDevice)
          if (nextDevice) {
            await videoTrackRef.current.setDevice(nextDevice.deviceId)
            console.log('Camera switched')
          }
        }
      } catch (err) {
        console.error('Error switching camera:', err)
      }
    }
  }, [])

  const startScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !isJoined) return

    try {
      const screenTrack = await AgoraRTC.createScreenVideoTrack(
        {
          encoderConfig: {
            width: 1920,
            height: 1080,
            frameRate: 15,
            bitrateMax: 3000
          }
        },
        'disable'
      )

      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack

      // Unpublish camera track
      if (videoTrackRef.current) {
        await client.unpublish(videoTrackRef.current)
      }

      // Publish screen track
      await client.publish(videoTrack)

      // Play screen share in container
      if (videoContainerRef.current) {
        videoTrack.play(videoContainerRef.current)
      }

      screenTrackRef.current = videoTrack
      setIsScreenSharing(true)

      videoTrack.on('track-ended', async () => {
        await stopScreenShare()
      })

      console.log('Screen share started')
    } catch (err) {
      console.error('Error starting screen share:', err)
    }
  }, [isJoined])

  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !screenTrackRef.current) return

    try {
      await client.unpublish(screenTrackRef.current)
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null

      // Re-publish and play camera track
      if (videoTrackRef.current) {
        await client.publish(videoTrackRef.current)
        if (videoContainerRef.current) {
          videoTrackRef.current.play(videoContainerRef.current)
        }
      }

      setIsScreenSharing(false)
      console.log('Screen share stopped')
    } catch (err) {
      console.error('Error stopping screen share:', err)
    }
  }, [])

   // Initialize WebSocket connection
  const initializeWebSocket = useCallback(async (streamId: string) => {
    return new Promise<void>((resolve, reject) => {
      const wsUrl = getWebSocketUrl(streamId)
      const ws = new WebSocket(wsUrl)
      websocketRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')

        ws.send(JSON.stringify({
          type: 'broadcaster_join',
          streamId: streamId,
          userId: localStorage.getItem('childUserId'),
          userName: localStorage.getItem('fullName') || userName,
          pageId: localStorage.getItem('pageId') || '0',
          profilePicture : localStorage.getItem('profilePhoto') || ''
        }))

        resolve()
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      ws.onclose = () => {
        console.log('WebSocket closed')
      }

      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket connection timeout'))
        }
      }, 10000)
    })
  }, [userName])

  // ==================== STREAMING FUNCTIONS ====================

  const startLiveStream = useCallback(async () => {
  if (!streamTitle.trim()) {
    setError('Please enter a stream title')
    return
  }

  const client = clientRef.current
  const videoTrack = videoTrackRef.current
  const audioTrack = audioTrackRef.current

  if (!client) {
    setError('Client not initialized')
    return
  }

  if (!videoTrack && !audioTrack) {
    setError('Camera not initialized. Please go back and try again.')
    return
  }

  setIsConnecting(true)
  setError(null)

  // Store current states before going live
  const wasVideoEnabled = isVideoEnabled
  const wasAudioEnabled = isAudioEnabled

  try {
    // 1. Create stream session on backend
    console.log('🎬 Creating live stream session...')
    const createResult = await createLiveStream({
      userId: localStorage.getItem('childUserId') || userId || '',
      adminUser: localStorage.getItem('uuid') || adminUser || '',
      title: streamTitle,
      description: streamDescription,
      pageId: localStorage.getItem('pageId') || pageId || '0'
    })

    if (!createResult.success || !createResult.data) {
      throw new Error(createResult.message || 'Failed to create stream')
    }

    const { streamId: newStreamId, channelName: newChannelName, agoraToken, agoraAppId, uid } = createResult.data

    console.log('✅ Stream created:', { newStreamId, newChannelName, agoraAppId, uid })

    setStreamId(newStreamId)
    setChannelName(newChannelName)

    // 2. Initialize WebSocket
    console.log('🔌 Initializing WebSocket...')
    await initializeWebSocket(newStreamId)
    console.log('✅ WebSocket connected')

    // 3. Set client role to host
    await client.setClientRole('host')

    // 4. Join Agora channel
    console.log('📡 Joining Agora channel...')
    await client.join(agoraAppId, newChannelName, agoraToken, uid)
    console.log('✅ Joined Agora channel')

    // 5. Temporarily enable tracks for publishing (if they were disabled)
    if (videoTrack && !wasVideoEnabled) {
      await videoTrack.setEnabled(true)
    }
    if (audioTrack && !wasAudioEnabled) {
      await audioTrack.setEnabled(true)
    }

    // 6. Publish tracks
    const tracksToPublish = []
    if (audioTrack) tracksToPublish.push(audioTrack)
    if (videoTrack) tracksToPublish.push(videoTrack)

    if (tracksToPublish.length > 0) {
      console.log('📤 Publishing tracks...')
      await client.publish(tracksToPublish)
      console.log('✅ Published tracks to Agora:', tracksToPublish.length)
    }

    // 7. Restore original enabled states after publishing
    if (videoTrack && !wasVideoEnabled) {
      await videoTrack.setEnabled(false)
    }
    if (audioTrack && !wasAudioEnabled) {
      await audioTrack.setEnabled(false)
    }

    setIsJoined(true)

    // 8. Start duration timer
    durationTimerRef.current = setInterval(() => {
      setStreamDuration(prev => prev + 1)
    }, 1000)

    // 9. Switch to live phase — reset time warning states
    setShowTimeWarning(false)       // ✅ Reset warning on new stream
    setRemainingSeconds(120)        // ✅ Reset remaining seconds
    setStreamPhase('live')
    setIsConnecting(false)

    console.log('🎥 Stream is now LIVE!')

    // Add system message
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      oderId: 'system',
      userName: 'System',
      message: 'You are now live! 🎬',
      timestamp: new Date(),
      type: 'system'
    }])

  } catch (err) {
    console.error('❌ Error starting stream:', err)
    setError(err instanceof Error ? err.message : 'Failed to start live stream')
    setIsConnecting(false)
    
    // Cleanup on error
    if (client) {
      try {
        await client.leave()
      } catch (leaveErr) {
        console.error('Error leaving channel after failure:', leaveErr)
      }
    }
  }
}, [streamTitle, streamDescription, userId, adminUser, pageId, initializeWebSocket, isVideoEnabled, isAudioEnabled])

 

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((data: WebSocketMessage) => {
    switch (data.type) {
      case 'viewer_joined':
        setViewerCount(prev => prev + 1)
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          oderId: data.userId || '',
          userName: data.userName || 'Anonymous',
          userAvatar: data.userAvatar || '',
          message: 'joined the live',
          timestamp: new Date(),
          type: 'join'
        }])
        break

      case 'viewer_left':
        setViewerCount(prev => Math.max(0, prev - 1))
        break

      case 'chat_message':
        setChatMessages(prev => [...prev, {
          id: data.messageId || Date.now().toString(),
          oderId: data.userId || '',
          userName: data.userName || 'Anonymous',
          userAvatar: data.userAvatar,
          message: data.message || '',
          timestamp: new Date(data.timestamp || Date.now()),
          type: 'message'
        }])
        break

      case 'reaction':
        handleReaction(data.reactionType || 'like')
        break

      case 'viewer_count':
        setViewerCount(data.count || 0)
        break

      default:
        console.log('Unknown message type:', data.type)
    }
  }, [])

  // Handle reaction
  const handleReaction = useCallback((type: string) => {
    setReactions(prev =>
      prev.map(r => r.type === type ? { ...r, count: r.count + 1 } : r)
    )
    if (type === 'like' || type === 'love') {
      setLikeCount(prev => prev + 1)
    }

    const reactionId = `${Date.now()}-${Math.random()}`
    const xPosition = Math.random() * 80 + 10
    setFloatingReactions(prev => [...prev, { id: reactionId, type, x: xPosition }])

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId))
    }, 2000)
  }, [])

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !websocketRef.current) return

    websocketRef.current.send(JSON.stringify({
      type: 'chat_message',
      streamId: streamId,
      userId: localStorage.getItem('childUserId'),
      userName: userName,
      message: newMessage.trim(),
      profilePicture : localStorage.getItem('profilePhoto') || ''

    }))

    setNewMessage('')
  }, [newMessage, streamId, userName])

  // End live stream
  const endLiveStreamHandler = useCallback(async () => {
    try {
      console.log('🛑 Ending live stream...')

      // ✅ Hide time warning when stream ends
      setShowTimeWarning(false)

      // Stop duration timer
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current)
        durationTimerRef.current = null
      }

      // Send stream ended message via WebSocket
      if (websocketRef.current) {
        websocketRef.current.send(JSON.stringify({
          type: 'stream_ended',
          streamId: streamId
        }))
        websocketRef.current.close()
        websocketRef.current = null
      }

      // Leave Agora channel
      const client = clientRef.current
      if (client) {
        await client.unpublish()
        await client.leave()
      }

      setIsJoined(false)

      // Notify backend
      if (streamId) {
        console.log('🔴 Calling endLiveStream API with:', {
          streamId,
          userId: localStorage.getItem('childUserId'),
          duration: streamDuration,
          viewerCount,
          likeCount,
          endpoint: 'https://institutional-bo.paybito.com:8443/BitohubService/livestream/end'
        })

        const result = await endLiveStream({
          streamId: streamId,
          userId: localStorage.getItem('childUserId') || '',
          duration: streamDuration,
          viewerCount: viewerCount,
          likeCount: likeCount
        })

        console.log('✅ endLiveStream API response:', result)

        if (!result.success) {
          console.warn('⚠️ endLiveStream API returned success: false', result)
        }
      } else {
        console.warn('⚠️ No streamId available to end stream')
      }

      const streamData: LiveStreamData = {
        streamId: streamId || '',
        channelName: channelName || '',
        title: streamTitle,
        description: streamDescription,
        duration: streamDuration,
        viewerCount: viewerCount,
        likeCount: likeCount
      }

      setStreamPhase('ended')
      onStreamEnd?.(streamData)

      console.log('✅ Stream ended successfully')

    } catch (err) {
      console.error('❌ Error ending stream:', err)
    }
  }, [streamId, channelName, streamTitle, streamDescription, streamDuration, viewerCount, likeCount, onStreamEnd])

  // Cleanup tracks
  const cleanupTracks = useCallback(() => {
    if (videoTrackRef.current) {
      videoTrackRef.current.stop()
      videoTrackRef.current.close()
      videoTrackRef.current = null
    }
    if (audioTrackRef.current) {
      audioTrackRef.current.stop()
      audioTrackRef.current.close()
      audioTrackRef.current = null
    }
    if (screenTrackRef.current) {
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null
    }
  }, [])

  // Handle close
  const handleClose = useCallback(() => {
    if (streamPhase === 'live') {
      if (window.confirm('Are you sure you want to end your live stream?')) {
        endLiveStreamHandler()
        cleanupTracks()
        onClose()
      }
    } else {
      cleanupTracks()
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {})
      }
      onClose()
    }
  }, [streamPhase, endLiveStreamHandler, cleanupTracks, onClose])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      cleanupTracks()
      if (clientRef.current) {
        clientRef.current.leave().catch(() => {})
      }
      
      setStreamPhase('setup')
      setStreamTitle('')
      setStreamDescription('')
      setStreamId(null)
      setChannelName(null)
      setViewerCount(0)
      setLikeCount(0)
      setStreamDuration(0)
      setChatMessages([])
      setViewers([])
      setError(null)
      setIsVideoEnabled(true)
      setIsAudioEnabled(true)
      setIsScreenSharing(false)
      setIsJoined(false)
      setShowTimeWarning(false)     // ✅ Reset on dialog close
      setRemainingSeconds(120)      // ✅ Reset on dialog close
      setReactions([
        { type: 'like', count: 0 },
        { type: 'love', count: 0 },
        { type: 'laugh', count: 0 },
        { type: 'fire', count: 0 },
        { type: 'celebrate', count: 0 }
      ])
    }
  }, [open, cleanupTracks])

  // ==================== HANDLE PAGE RELOAD/CLOSE ====================

// End stream when broadcaster reloads or closes the page
useEffect(() => {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // Only handle if stream is live
    if (streamPhase === 'live' && streamId) {
      console.log('🚨 Page unload detected - ending stream via beacon')

      // Send stream ended message via WebSocket
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'stream_ended',
          streamId: streamId
        }))
        websocketRef.current.close()
      }

      // Leave Agora channel
      const client = clientRef.current
      if (client) {
        client.unpublish()
        client.leave()
      }

      // Cleanup tracks
      if (videoTrackRef.current) {
        videoTrackRef.current.stop()
        videoTrackRef.current.close()
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
        audioTrackRef.current.close()
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop()
        screenTrackRef.current.close()
      }

      const endStreamData = JSON.stringify({
        streamId: streamId,
        userId: localStorage.getItem('childUserId') || '',
        adminUser: localStorage.getItem('uuid') || '',
        accessToken: tokenCookie.get() || '',
        duration: streamDuration,
        viewerCount: viewerCount,
        likeCount: likeCount
      })
      
      console.log('🔴 Sending beacon to end stream:', {
        streamId,
        endpoint: 'https://institutional-bo.paybito.com:8443/BitohubService/livestream/end',
        hasToken: !!tokenCookie.get()
      })
      
      // Sent with the sign-in headers (a plain beacon would be refused by the API).
      sendOnPageExit('https://institutional-bo.paybito.com:8443/BitohubService/livestream/end', JSON.parse(endStreamData))

      // Show confirmation dialog
      event.preventDefault()
      event.returnValue = 'Your live stream will end if you leave this page. Are you sure?'
      return event.returnValue
    }
  }

  // Add event listener when stream is live
  if (streamPhase === 'live') {
    window.addEventListener('beforeunload', handleBeforeUnload)
    console.log('👂 Listening for page unload events')
  }

  // Cleanup
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
}, [streamPhase, streamId, streamDuration, viewerCount, likeCount])

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Format duration
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ✅ Format remaining time for warning popup (MM:SS)
  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  // Determine if video container should be visible
  const showVideo = streamPhase === 'preview' || streamPhase === 'live'

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          bgcolor: theme.palette.mode === 'dark' ? '#000' : '#1a1a1a'
        }
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header - changes based on phase */}
        <DialogTitle sx={{ 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {streamPhase === 'setup' && <LiveTvIcon color="error" />}
            <Typography variant="h6">
              {streamPhase === 'setup' && 'Start Live Stream'}
              {streamPhase === 'preview' && 'Preview'}
              {streamPhase === 'live' && streamTitle}
              {streamPhase === 'ended' && 'Stream Ended'}
            </Typography>
          </Stack>
          <IconButton onClick={handleClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left side - Video or Setup Form */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Setup Phase Content */}
            {streamPhase === 'setup' && (
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <TextField
                  label="Stream Title"
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  fullWidth
                  required
                  placeholder="What's your stream about?"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#f44336' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                  }}
                />

                <TextField
                  label="Description (optional)"
                  value={streamDescription}
                  onChange={(e) => setStreamDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Tell viewers what to expect..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused fieldset': { borderColor: '#f44336' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
                  }}
                />

                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                  <Typography variant="subtitle2" color="white" gutterBottom>
                    📝 Tips for a great live stream:
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    • Find good lighting and a quiet environment<br />
                    • Test your camera and microphone before going live<br />
                    • Engage with your viewers in the chat<br />
                    • Have a topic or plan in mind<br />
                    • Maximum stream duration is 1 hour
                  </Typography>
                </Paper>
              </DialogContent>
            )}

            {/* PERSISTENT Video Container - stays mounted for preview and live */}
            <Box
              ref={videoContainerRef}
              sx={{
                flex: 1,
                bgcolor: 'black',
                position: 'relative',
                display: showVideo ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                '& video': {
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }
              }}
            >
              {/* Live Phase Overlays */}
              {streamPhase === 'live' && (
                <>
                  {/* Live indicator */}
                  <Chip
                    icon={<RecordIcon sx={{ color: '#fff !important' }} />}
                    label="LIVE"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      bgcolor: '#f44336',
                      color: 'white',
                      fontWeight: 'bold',
                      zIndex: 10,
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />

                  {/* Stats */}
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      zIndex: 10
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
                    <Chip
                      label={formatDuration(streamDuration)}
                      size="small"
                      sx={{ bgcolor: 'rgba(0,0,0,0.6)', color: 'white' }}
                    />
                  </Stack>

                  {/* Stream title */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      right: 16,
                      zIndex: 10
                    }}
                  >
                    <Typography variant="h6" color="white" sx={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                      {streamTitle}
                    </Typography>
                  </Box>

                  {/* Floating reactions */}
                  {floatingReactions.map((reaction) => (
                    <Fade key={reaction.id} in timeout={200}>
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 100,
                          left: `${reaction.x}%`,
                          zIndex: 10,
                          animation: 'floatUp 2s ease-out forwards',
                          '@keyframes floatUp': {
                            '0%': { opacity: 1, transform: 'translateY(0)' },
                            '100%': { opacity: 0, transform: 'translateY(-200px)' }
                          }
                        }}
                      >
                        {getReactionIcon(reaction.type)}
                      </Box>
                    </Fade>
                  ))}
                </>
              )}
            </Box>

            {/* Ended Phase Content */}
            {streamPhase === 'ended' && (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 4
                }}
              >
                <Typography variant="h4" color="white" gutterBottom>
                  Stream Ended! 🎬
                </Typography>

                <Paper sx={{ p: 4, mt: 3, bgcolor: 'rgba(255,255,255,0.05)', textAlign: 'center' }}>
                  <Typography variant="h6" color="white" gutterBottom>
                    Stream Summary
                  </Typography>
                  <Stack spacing={2} sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={4} justifyContent="center">
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary.main">{viewerCount}</Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">Peak Viewers</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main">{likeCount}</Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">Likes</Typography>
                      </Box>
                      <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      <Box textAlign="center">
                        <Typography variant="h4" color="white">{formatDuration(streamDuration)}</Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.7)">Duration</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                <Button
                  variant="contained"
                  onClick={onClose}
                  sx={{ mt: 4 }}
                >
                  Close
                </Button>
              </Box>
            )}

            {/* Error display for preview/live */}
            {error && showVideo && (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            )}

            {/* Controls Bar */}
            {showVideo && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'rgba(0,0,0,0.9)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                  flexShrink: 0
                }}
              >
                <Tooltip title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                  <IconButton
                    onClick={toggleVideo}
                    sx={{
                      bgcolor: isVideoEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: isVideoEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark' }
                    }}
                  >
                    {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title={isAudioEnabled ? 'Mute' : 'Unmute'}>
                  <IconButton
                    onClick={toggleAudio}
                    sx={{
                      bgcolor: isAudioEnabled ? 'rgba(255,255,255,0.1)' : 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: isAudioEnabled ? 'rgba(255,255,255,0.2)' : 'error.dark' }
                    }}
                  >
                    {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Switch camera">
                  <IconButton
                    onClick={switchCamera}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                    }}
                  >
                    <CameraswitchIcon />
                  </IconButton>
                </Tooltip>

                {/* Live-only controls */}
                {streamPhase === 'live' && (
                  <>
                    <Tooltip title={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                      <IconButton
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        sx={{
                          bgcolor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      >
                        {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Toggle chat">
                      <IconButton
                        onClick={() => setShowChat(!showChat)}
                        sx={{
                          bgcolor: showChat ? 'primary.main' : 'rgba(255,255,255,0.1)',
                          color: 'white'
                        }}
                      >
                        <ChatIcon />
                      </IconButton>
                    </Tooltip>

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={endLiveStreamHandler}
                      sx={{ ml: 2 }}
                    >
                      End Live
                    </Button>
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Chat Sidebar - only in live phase */}
          {streamPhase === 'live' && showChat && (
            <Paper
              sx={{
                width: 350,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#262626',
                flexShrink: 0
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
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={sendMessage} size="small" sx={{ color: 'primary.main' }}>
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
          )}
        </Box>

        {/* Bottom Actions - only for setup and preview */}
        {(streamPhase === 'setup' || streamPhase === 'preview') && (
          <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2, flexShrink: 0 }}>
            {streamPhase === 'setup' && (
              <Button
                variant="contained"
                color="error"
                size="large"
                startIcon={<VideocamIcon />}
                onClick={startPreview}
                disabled={!streamTitle.trim()}
                sx={{ px: 4 }}
              >
                Preview Camera
              </Button>
            )}

            {streamPhase === 'preview' && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    cleanupTracks()
                    setStreamPhase('setup')
                  }}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <LiveTvIcon />}
                  onClick={startLiveStream}
                  disabled={isConnecting}
                  sx={{ px: 4 }}
                >
                  {isConnecting ? 'Starting...' : 'Go Live'}
                </Button>
              </>
            )}
          </DialogActions>
        )}

        {/* ==================== ✅ CHANGE 3: Time Limit Warning Popup ==================== */}
        <Slide direction="left" in={showTimeWarning} mountOnEnter unmountOnExit>
          <Paper
            elevation={8}
            sx={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              zIndex: 9999,
              borderRadius: 3,
              overflow: 'hidden',
              minWidth: 280,
              maxWidth: 320,
              border: '1px solid',
              borderColor: remainingSeconds <= 30 ? 'error.main' : 'warning.main',
              animation: remainingSeconds <= 30 ? 'urgentPulse 1s infinite' : 'none',
            }}
          >
            {/* Warning Header */}
            <Box
              sx={{
                bgcolor: remainingSeconds <= 30 ? 'error.main' : 'warning.main',
                color: 'white',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <TimerIcon sx={{ fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>
                  Stream Ending Soon
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => setShowTimeWarning(false)}
                sx={{ color: 'white', p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* Warning Body */}
            <Box
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#fff',
                px: 2,
                py: 2,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h3"
                fontWeight={700}
                sx={{
                  color: remainingSeconds <= 30 ? 'error.main' : 'warning.main',
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}
              >
                {formatRemainingTime(remainingSeconds)}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                {remainingSeconds <= 10
                  ? 'Stream ending now...'
                  : remainingSeconds <= 30
                    ? 'Almost out of time!'
                    : 'Your stream will automatically end when the timer reaches 0.'}
              </Typography>

              {/* Progress bar showing time remaining */}
              <Box
                sx={{
                  mt: 1.5,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    bgcolor: remainingSeconds <= 30 ? 'error.main' : 'warning.main',
                    width: `${(remainingSeconds / 120) * 100}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </Box>

              <Button
                variant="outlined"
                color={remainingSeconds <= 30 ? 'error' : 'warning'}
                size="small"
                startIcon={<StopIcon />}
                onClick={endLiveStreamHandler}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
              >
                End Stream Now
              </Button>
            </Box>

            {/* Urgent pulse animation for last 30 seconds */}
            <style jsx global>{`
              @keyframes urgentPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
                50% { box-shadow: 0 0 0 8px rgba(244, 67, 54, 0); }
              }
            `}</style>
          </Paper>
        </Slide>
        {/* ================================================================================== */}

      </Box>
    </Dialog>
  )
}

export default LiveStreamDialog