'use client'
import { localApiUrl } from '@/utils/apiHosts'
import { stompConnectHeaders } from '@/utils/apiAuth'
import { useEffect, useRef, useCallback, useState } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'


const WS_URL = localApiUrl('https://institutional-bo.paybito.com:8443/BitohubService/ws-feeds')
const POLLING_INTERVAL = 5000 // 5 seconds

// Feed Item type matching the API response
interface PollOption {
  id: number | null
  type: string | null
  optionId: number
  optionText: string
  voteCount: number
}

export interface FeedItem {
  userId: number
  pageId: number
  postId: number
  userName: string
  fullName: string
  content: string | null
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'POLL' | 'REEL'
  mediaUrls: string[]
  categoryList: PollOption[]
  hashtags: string | null
  location: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: 'Y' | 'N'
  hasBookmarked: 'Y' | 'N'
  pollId: number
  pollQuestion: string | null
  pollEndsAt: string | null
  hasVoted: 'Y' | 'N'
  totalVotes: number
  optionId: number | null
  optionText: string | null
  voteCount: number
  isUserFollowing?: 1 | 0
  contentType: string
  entityType?: string
  title?: string
  coverImage?: string
  reelDurtion?: number
  isSponsored?: 0 | 1
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  profilePicture?: string | null
  visibilityType?: string | number
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: 0 | 1
  isSharedPost?: 0 | 1
  shareId?: number
  sharedByUserId?: number
  sharerUserName?: string
  sharerFullName?: string
  sharerProfilePicture?: string
  shareMessage?: string
  shareCreatedAt?: string
}

interface FeedSocketPayload {
  userId: number
  pageId: number
  offset: number
  limit: number
}

interface FeedSocketResponse {
  success: boolean
  message: string
  data: FeedItem[]
  type?: 'NEW_POST' | 'POST_UPDATE'
  errorCode: string | null
}

interface UseWebSocketFeedsOptions {
  userId: string | null
  pageId: string | null
  limit?: number
  enabled?: boolean
  pollingInterval?: number
  onNewPost?: (data: FeedItem) => void
  onPostUpdate?: (data: FeedItem) => void
  onError?: (error: string) => void
  onFeedReceived?: (data: FeedItem[]) => void
}

interface UseWebSocketFeedsReturn {
  isConnected: boolean
  sendMessage: (payload: FeedSocketPayload) => void
  reconnect: () => void
  startPolling: () => void
  stopPolling: () => void
  isPolling: boolean
  updateOffset: (newOffset: number) => void
  resetOffset: () => void
}

const useWebSocketFeeds = ({
  userId,
  pageId,
  limit = 10,
  enabled = true,
  pollingInterval = POLLING_INTERVAL,
  onNewPost,
  onPostUpdate,
  onError,
  onFeedReceived
}: UseWebSocketFeedsOptions): UseWebSocketFeedsReturn => {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const reconnectAttemptRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Store the latest payload for polling - ALWAYS start at 1
  const currentOffsetRef = useRef(1)
  const currentLimitRef = useRef(limit)

  // Update limit ref when prop changes
  useEffect(() => {
    currentLimitRef.current = limit
  }, [limit])

  // Manual offset update function - for when user scrolls/loads more
  const updateOffset = useCallback((newOffset: number) => {
    currentOffsetRef.current = newOffset
    // console.log('[WebSocket] Offset manually updated to:', newOffset)
  }, [])

  // Reset offset to 1 - for refresh scenarios
  const resetOffset = useCallback(() => {
    currentOffsetRef.current = 1
    // console.log('[WebSocket] Offset reset to 1')
  }, [])

  const handleMessage = useCallback((message: IMessage) => {
    try {
      const response: FeedSocketResponse = JSON.parse(message.body)
      // console.log('[WebSocket] Received message:', response)

      if (response.success && response.data) {
        const posts: FeedItem[] = Array.isArray(response.data) ? response.data : [response.data]

        // Send full feed data for cleanup (e.g., removing ended livestreams)
      onFeedReceived?.(posts)

        
        posts.forEach((post: FeedItem) => {
          if (response.type === 'NEW_POST') {
            onNewPost?.(post)
          } else if (response.type === 'POST_UPDATE') {
            onPostUpdate?.(post)
          } else {
            // Default: treat as potential new post or update
            onNewPost?.(post)
          }
        })
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error)
      onError?.('Failed to parse WebSocket message')
    }
  }, [onNewPost, onPostUpdate, onError, onFeedReceived])

  // Function to send the polling request with current offset
  const sendPollingRequest = useCallback(() => {
    if (clientRef.current?.active && userId) {
      const payload: FeedSocketPayload = {
        userId: parseInt(userId),
        pageId: parseInt(pageId || '0'),
        offset: currentOffsetRef.current,
        limit: currentLimitRef.current
      }
      
      // console.log('[WebSocket] Sending polling request - offset:', payload.offset, 'limit:', payload.limit)
      clientRef.current.publish({
        destination: '/app/feeds',
        body: JSON.stringify(payload)
      })
    } else {
      console.warn('[WebSocket] Cannot send polling request - not connected or no userId')
    }
  }, [userId, pageId])

  // Start polling interval
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    // Send immediately first
    sendPollingRequest()

    // Then set up interval
    pollingIntervalRef.current = setInterval(() => {
      sendPollingRequest()
    }, pollingInterval)

    setIsPolling(true)
    // console.log(`[WebSocket] Polling started - interval: ${pollingInterval}ms, initial offset: ${currentOffsetRef.current}`)
  }, [pollingInterval, sendPollingRequest])

  // Stop polling interval
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
    // console.log('[WebSocket] Polling stopped')
  }, [])

  const connect = useCallback(() => {
    if (!userId || !enabled) {
      // console.log('[WebSocket] Not connecting - userId missing or disabled')
      return
    }

    // Disconnect existing client if any
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
    }

    // Stop any existing polling
    stopPolling()

    // Reset offset to 1 on new connection
    currentOffsetRef.current = 1

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      
      connectHeaders: stompConnectHeaders(),

      debug: (str) => {
        if (process.env.NODE_ENV === 'development') {
          // console.log('[WebSocket Debug]', str)
        }
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        // console.log('[WebSocket] Connected successfully')
        setIsConnected(true)
        reconnectAttemptRef.current = 0

        // Subscribe to user-specific feed topic
        const subscriptionTopic = `/topic/feeds/${userId}`
        // console.log('[WebSocket] Subscribing to:', subscriptionTopic)
        
        client.subscribe(subscriptionTopic, handleMessage)

        // Start polling after successful connection (offset is already 1)
        startPolling()
      },

      onDisconnect: () => {
        // console.log('[WebSocket] Disconnected')
        setIsConnected(false)
        stopPolling()
      },

      onStompError: (frame) => {
        console.error('[WebSocket] STOMP error:', frame.headers['message'])
        onError?.(`WebSocket error: ${frame.headers['message']}`)
        setIsConnected(false)
        stopPolling()
      },

      onWebSocketError: () => {
        console.error('[WebSocket] WebSocket error')
        setIsConnected(false)
        stopPolling()
        
        // Attempt reconnection
        if (reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000)
          // console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          onError?.('Max reconnection attempts reached')
        }
      },

      onWebSocketClose: () => {
        // console.log('[WebSocket] Connection closed')
        setIsConnected(false)
        stopPolling()
      }
    })

    clientRef.current = client
    client.activate()
  }, [userId, pageId, enabled, handleMessage, onError, startPolling, stopPolling])

  const disconnect = useCallback(() => {
    stopPolling()

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (clientRef.current?.active) {
      clientRef.current.deactivate()
    }
    
    setIsConnected(false)
  }, [stopPolling])

  const sendMessage = useCallback((payload: FeedSocketPayload) => {
    if (clientRef.current?.active) {
      // Update the current offset ref
      currentOffsetRef.current = payload.offset
      currentLimitRef.current = payload.limit
      
      clientRef.current.publish({
        destination: '/app/feeds',
        body: JSON.stringify(payload)
      })
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    disconnect()
    setTimeout(connect, 100)
  }, [connect, disconnect])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled && userId) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, userId, connect, disconnect])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    sendMessage,
    reconnect,
    startPolling,
    stopPolling,
    isPolling,
    updateOffset,
    resetOffset
  }
}

export default useWebSocketFeeds