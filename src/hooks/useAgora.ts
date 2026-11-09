import { useState, useRef, useCallback, useEffect } from 'react'
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  ILocalVideoTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  IAgoraRTCRemoteUser
} from 'agora-rtc-sdk-ng'
import { AgoraConfig } from '../types/livestream'

// Configure Agora SDK
AgoraRTC.setLogLevel(3) // Warning level

// Agora media type (includes datachannel)
type AgoraMediaType = 'audio' | 'video' | 'datachannel'

interface UseAgoraProps {
  onUserJoined?: (user: IAgoraRTCRemoteUser) => void
  onUserLeft?: (user: IAgoraRTCRemoteUser) => void
  onUserPublished?: (user: IAgoraRTCRemoteUser, mediaType: AgoraMediaType) => void
  onUserUnpublished?: (user: IAgoraRTCRemoteUser, mediaType: AgoraMediaType) => void
  onConnectionStateChange?: (state: string) => void
  onError?: (error: Error) => void
}

interface UseAgoraReturn {
  // State
  isJoined: boolean
  isPublishing: boolean
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
  localVideoTrack: ICameraVideoTrack | ILocalVideoTrack | null
  localAudioTrack: IMicrophoneAudioTrack | null
  remoteUsers: IAgoraRTCRemoteUser[]
  remoteVideoTrack: IRemoteVideoTrack | null
  remoteAudioTrack: IRemoteAudioTrack | null
  error: string | null

  // Methods
  joinChannel: (config: AgoraConfig) => Promise<{ audioTrack: IMicrophoneAudioTrack; videoTrack: ICameraVideoTrack } | undefined>
  leaveChannel: () => Promise<void>
  publishTracks: () => Promise<void>
  unpublishTracks: () => Promise<void>
  toggleVideo: () => Promise<void>
  toggleAudio: () => Promise<void>
  switchCamera: () => Promise<void>
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
  subscribeToUser: (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video' | 'datachannel') => Promise<void>
}

export const useAgora = (props?: UseAgoraProps): UseAgoraReturn => {
  const {
    onUserJoined,
    onUserLeft,
    onUserPublished,
    onUserUnpublished,
    onConnectionStateChange,
    onError
  } = props || {}

  // State
  const [isJoined, setIsJoined] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | ILocalVideoTrack | null>(null)
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null)
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([])
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<IRemoteVideoTrack | null>(null)
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<IRemoteAudioTrack | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs
  const clientRef = useRef<IAgoraRTCClient | null>(null)
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null)
  const cameraTrackRef = useRef<ICameraVideoTrack | null>(null)

  // Refs for callbacks to avoid re-creating event handlers
  const onUserJoinedRef = useRef(onUserJoined)
  const onUserLeftRef = useRef(onUserLeft)
  const onUserPublishedRef = useRef(onUserPublished)
  const onUserUnpublishedRef = useRef(onUserUnpublished)
  const onConnectionStateChangeRef = useRef(onConnectionStateChange)
  const onErrorRef = useRef(onError)

  // Keep refs updated
  useEffect(() => {
    onUserJoinedRef.current = onUserJoined
    onUserLeftRef.current = onUserLeft
    onUserPublishedRef.current = onUserPublished
    onUserUnpublishedRef.current = onUserUnpublished
    onConnectionStateChangeRef.current = onConnectionStateChange
    onErrorRef.current = onError
  }, [onUserJoined, onUserLeft, onUserPublished, onUserUnpublished, onConnectionStateChange, onError])

  // Initialize client - only once
  useEffect(() => {
    clientRef.current = AgoraRTC.createClient({
      mode: 'live',
      codec: 'vp8'
    })

    const client = clientRef.current

    // Event handlers using refs to stay stable
    client.on('user-joined', (user) => {
      console.log('User joined:', user.uid)
      setRemoteUsers(prev => [...prev, user])
      onUserJoinedRef.current?.(user)
    })

    client.on('user-left', (user) => {
      console.log('User left:', user.uid)
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid))
      onUserLeftRef.current?.(user)
    })

    client.on('user-published', async (user, mediaType) => {
      console.log('User published event:', user.uid, mediaType)
      
      // Auto-subscribe to tracks when user publishes
      if (mediaType === 'video' || mediaType === 'audio') {
        try {
          console.log('Auto-subscribing to', mediaType, 'for user', user.uid)
          await client.subscribe(user, mediaType)
          
          if (mediaType === 'video') {
            console.log('Setting remote video track')
            setRemoteVideoTrack(user.videoTrack || null)
          } else if (mediaType === 'audio') {
            console.log('Setting remote audio track')
            setRemoteAudioTrack(user.audioTrack || null)
            user.audioTrack?.play()
          }
        } catch (err) {
          console.error('Error auto-subscribing:', err)
        }
      }
      
      onUserPublishedRef.current?.(user, mediaType)
    })

    client.on('user-unpublished', (user, mediaType) => {
      console.log('User unpublished:', user.uid, mediaType)
      // Only handle audio and video, not datachannel
      if (mediaType === 'video') {
        setRemoteVideoTrack(null)
      } else if (mediaType === 'audio') {
        setRemoteAudioTrack(null)
      }
      onUserUnpublishedRef.current?.(user, mediaType)
    })

    client.on('connection-state-change', (curState) => {
      console.log('Connection state:', curState)
      onConnectionStateChangeRef.current?.(curState)
    })

    client.on('exception', (event) => {
      console.error('Agora exception:', event)
    })

    return () => {
      client.removeAllListeners()
    }
  }, []) // Empty dependency array - only run once

  // Join channel
  const joinChannel = useCallback(async (config: AgoraConfig) => {
    const client = clientRef.current
    if (!client) {
      throw new Error('Agora client not initialized')
    }

    try {
      setError(null)

      // Set client role
      await client.setClientRole(config.role)

      // Join channel
      await client.join(config.appId, config.channel, config.token, config.uid)
      setIsJoined(true)

      console.log('Joined channel:', config.channel)

      // If host, create and publish tracks
      if (config.role === 'host') {
        console.log('Creating local tracks for host...')
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          {
            encoderConfig: 'music_standard'
          },
          {
            encoderConfig: {
              width: 1280,
              height: 720,
              frameRate: 30,
              bitrateMax: 2000
            }
          }
        )
        console.log('Local tracks created')

        setLocalAudioTrack(audioTrack)
        setLocalVideoTrack(videoTrack)
        cameraTrackRef.current = videoTrack

        await client.publish([audioTrack, videoTrack])
        setIsPublishing(true)

        console.log('Published tracks')
        
        // Return tracks so caller can use them immediately without waiting for state update
        return { audioTrack, videoTrack }
      } else {
        // For audience: wait a moment for SDK to sync remote users
        // Then check for existing remote users who are already publishing
        console.log('Audience mode - waiting for remote users to sync...')
        
        // Function to check and subscribe to remote users
        const checkAndSubscribeToRemoteUsers = async () => {
          const existingUsers = client.remoteUsers
          console.log('Remote users found:', existingUsers.length, existingUsers.map(u => ({
            uid: u.uid,
            hasVideo: u.hasVideo,
            hasAudio: u.hasAudio
          })))
          
          if (existingUsers.length > 0) {
            setRemoteUsers([...existingUsers])
            
            // Subscribe to each user's tracks
            for (const user of existingUsers) {
              console.log('Processing user:', user.uid, 'hasVideo:', user.hasVideo, 'hasAudio:', user.hasAudio)
              
              if (user.hasVideo) {
                try {
                  console.log('Subscribing to video for user:', user.uid)
                  await client.subscribe(user, 'video')
                  const videoTrack = user.videoTrack
                  console.log('Video track after subscribe:', videoTrack ? 'exists' : 'null')
                  if (videoTrack) {
                    setRemoteVideoTrack(videoTrack)
                    console.log('Set remote video track for user:', user.uid)
                  }
                } catch (err) {
                  console.error('Error subscribing to video:', err)
                }
              }
              
              if (user.hasAudio) {
                try {
                  console.log('Subscribing to audio for user:', user.uid)
                  await client.subscribe(user, 'audio')
                  const audioTrack = user.audioTrack
                  if (audioTrack) {
                    setRemoteAudioTrack(audioTrack)
                    audioTrack.play()
                    console.log('Set and playing remote audio track for user:', user.uid)
                  }
                } catch (err) {
                  console.error('Error subscribing to audio:', err)
                }
              }
            }
            return true // Found users
          }
          return false // No users found
        }

        // Try immediately
        let found = await checkAndSubscribeToRemoteUsers()
        
        // If no users found, retry after delays (SDK might need time to sync)
        if (!found) {
          console.log('No remote users yet, will retry...')
          await new Promise(resolve => setTimeout(resolve, 500))
          found = await checkAndSubscribeToRemoteUsers()
        }
        
        if (!found) {
          console.log('Still no remote users, will retry once more...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          await checkAndSubscribeToRemoteUsers()
        }
        
        console.log('Finished checking for remote users')
        
        // Audience mode doesn't return tracks
        return undefined
      }
    } catch (err) {
      console.error('Error joining channel:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to join channel'
      setError(errorMessage)
      onErrorRef.current?.(err instanceof Error ? err : new Error(errorMessage))
      throw err
    }
  }, []) // No dependencies needed since we use refs

  // Leave channel
  const leaveChannel = useCallback(async () => {
    const client = clientRef.current
    if (!client) return

    try {
      // Stop and close local tracks
      if (localAudioTrack) {
        localAudioTrack.stop()
        localAudioTrack.close()
      }
      if (localVideoTrack) {
        localVideoTrack.stop()
        localVideoTrack.close()
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop()
        screenTrackRef.current.close()
      }

      // Unpublish and leave
      await client.unpublish()
      await client.leave()

      // Reset state
      setIsJoined(false)
      setIsPublishing(false)
      setLocalAudioTrack(null)
      setLocalVideoTrack(null)
      setRemoteUsers([])
      setRemoteVideoTrack(null)
      setRemoteAudioTrack(null)
      setIsScreenSharing(false)
      screenTrackRef.current = null
      cameraTrackRef.current = null

      console.log('Left channel')
    } catch (err) {
      console.error('Error leaving channel:', err)
    }
  }, [localAudioTrack, localVideoTrack])

  // Publish tracks
  const publishTracks = useCallback(async () => {
    const client = clientRef.current
    if (!client || !localAudioTrack || !localVideoTrack) return

    try {
      await client.publish([localAudioTrack, localVideoTrack])
      setIsPublishing(true)
    } catch (err) {
      console.error('Error publishing tracks:', err)
      throw err
    }
  }, [localAudioTrack, localVideoTrack])

  // Unpublish tracks
  const unpublishTracks = useCallback(async () => {
    const client = clientRef.current
    if (!client) return

    try {
      await client.unpublish()
      setIsPublishing(false)
    } catch (err) {
      console.error('Error unpublishing tracks:', err)
    }
  }, [])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }, [localVideoTrack, isVideoEnabled])

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }, [localAudioTrack, isAudioEnabled])

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (localVideoTrack && 'switchDevice' in localVideoTrack) {
      const devices = await AgoraRTC.getCameras()
      if (devices.length > 1) {
        const currentDevice = (localVideoTrack as ICameraVideoTrack).getTrackLabel()
        const nextDevice = devices.find(d => d.label !== currentDevice)
        if (nextDevice) {
          await (localVideoTrack as ICameraVideoTrack).setDevice(nextDevice.deviceId)
        }
      }
    }
  }, [localVideoTrack])

  // Start screen share
  const startScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !isJoined) return

    try {
      // Create screen share track
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

      // Handle array return (screen + audio) or single track
      const videoTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack

      // Unpublish camera track
      if (localVideoTrack) {
        await client.unpublish(localVideoTrack)
      }

      // Publish screen track
      await client.publish(videoTrack)

      screenTrackRef.current = videoTrack
      setLocalVideoTrack(videoTrack)
      setIsScreenSharing(true)

      // Handle when user stops sharing via browser UI
      videoTrack.on('track-ended', async () => {
        await stopScreenShare()
      })

      console.log('Started screen share')
    } catch (err) {
      console.error('Error starting screen share:', err)
      throw err
    }
  }, [isJoined, localVideoTrack])

  // Stop screen share
  const stopScreenShare = useCallback(async () => {
    const client = clientRef.current
    if (!client || !screenTrackRef.current) return

    try {
      // Unpublish screen track
      await client.unpublish(screenTrackRef.current)
      screenTrackRef.current.stop()
      screenTrackRef.current.close()
      screenTrackRef.current = null

      // Re-publish camera track
      if (cameraTrackRef.current) {
        await client.publish(cameraTrackRef.current)
        setLocalVideoTrack(cameraTrackRef.current)
      }

      setIsScreenSharing(false)
      console.log('Stopped screen share')
    } catch (err) {
      console.error('Error stopping screen share:', err)
    }
  }, [])

  // Subscribe to user
  const subscribeToUser = useCallback(async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video' | 'datachannel') => {
    const client = clientRef.current
    if (!client) return

    // Skip datachannel - we only handle audio and video
    if (mediaType === 'datachannel') return

    try {
      await client.subscribe(user, mediaType)

      if (mediaType === 'video') {
        setRemoteVideoTrack(user.videoTrack || null)
      } else if (mediaType === 'audio') {
        setRemoteAudioTrack(user.audioTrack || null)
        user.audioTrack?.play()
      }

      console.log('Subscribed to user:', user.uid, mediaType)
    } catch (err) {
      console.error('Error subscribing to user:', err)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveChannel()
    }
  }, [leaveChannel])

  return {
    isJoined,
    isPublishing,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    localVideoTrack,
    localAudioTrack,
    remoteUsers,
    remoteVideoTrack,
    remoteAudioTrack,
    error,
    joinChannel,
    leaveChannel,
    publishTracks,
    unpublishTracks,
    toggleVideo,
    toggleAudio,
    switchCamera,
    startScreenShare,
    stopScreenShare,
    subscribeToUser
  }
}

export default useAgora