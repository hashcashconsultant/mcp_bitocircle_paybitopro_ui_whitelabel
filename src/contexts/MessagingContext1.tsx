'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

interface MessagingContextType {
  unreadMessageCount: number
  isConnected: boolean
  refreshMessageCount: () => void
  markConversationAsRead: (conversationId: number) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Get userId from localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('childUserId') || ''
    }
    return ''
  }

  // Fetch initial message count from API
  const fetchMessageCount = useCallback(async () => {
    try {
      const userId = getUserId()
      if (!userId) return

      const response = await fetch(
        `https://institutional-bo.paybito.com:8443/BitohubService/messaging/notificationCount/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      const result = await response.json()
      console.log('📊 API Message Count Response:', result)
      
      if (result.success && result.data) {
        const count = result.data.notificationCount || 0
        console.log('📊 Setting message count from API:', count)
        setUnreadMessageCount(count)
      }
    } catch (error) {
      console.error('❌ Error fetching message count:', error)
    }
  }, [])

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const userId = getUserId()
    if (!userId) {
      console.warn('⚠️ No userId found, skipping WebSocket connection')
      return
    }

    try {
      const client = new Client({
        brokerURL: undefined,
        connectHeaders: {},
        debug: function (str) {
          console.log('STOMP (Messaging):', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      // Use SockJS as the WebSocket factory
      client.webSocketFactory = () => {
        return new SockJS(
          `https://institutional-bo.paybito.com:8443/BitohubService/ws-messaging?userId=${userId}`
        )
      }

      client.onConnect = (frame) => {
        console.log('✅ Connected to Messaging WebSocket:', frame)
        setIsConnected(true)

        // ============================================================
        // PRIMARY SUBSCRIPTION: Notification Count Updates
        // ============================================================
        client.subscribe(`/user/queue/notification-count`, (message) => {
          console.log('📩 Notification count update received:', message.body)
          try {
            const notificationData = JSON.parse(message.body)
            console.log('📊 Parsed notification data:', notificationData)
            
            // Extract count from notificationData.notificationCount
            if (typeof notificationData.notificationCount === 'number') {
              console.log('✅ Updating message count to:', notificationData.notificationCount)
              setUnreadMessageCount(notificationData.notificationCount)
            } else if (typeof notificationData === 'number') {
              // Fallback: if the body is just a number
              console.log('✅ Updating message count to:', notificationData)
              setUnreadMessageCount(notificationData)
            } else {
              console.warn('⚠️ Unexpected notification data format:', notificationData)
            }
          } catch (e) {
            console.error('❌ Failed to parse notification count:', e)
          }
        })

        // ============================================================
        // ALTERNATIVE: User-specific notification count
        // ============================================================
        client.subscribe(`/user/${userId}/queue/notification-count`, (message) => {
          console.log('📩 User notification count update:', message.body)
          try {
            const notificationData = JSON.parse(message.body)
            if (typeof notificationData.notificationCount === 'number') {
              console.log('✅ Updating message count (user-specific) to:', notificationData.notificationCount)
              setUnreadMessageCount(notificationData.notificationCount)
            }
          } catch (e) {
            console.error('❌ Failed to parse user notification count:', e)
          }
        })

        // ============================================================
        // NEW MESSAGE NOTIFICATIONS: Increment count
        // ============================================================
        client.subscribe(`/user/queue/messages`, (message) => {
          console.log('📨 New message notification received')
          // Increment count when new message arrives
          setUnreadMessageCount((prev) => {
            const newCount = prev + 1
            console.log('📈 Incrementing message count:', prev, '->', newCount)
            return newCount
          })
        })

        // User-specific new messages
        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          console.log('📨 New user message received')
          setUnreadMessageCount((prev) => {
            const newCount = prev + 1
            console.log('📈 Incrementing message count (user-specific):', prev, '->', newCount)
            return newCount
          })
        })

        // ============================================================
        // REQUEST INITIAL MESSAGE COUNT
        // ============================================================
        if (client.connected) {
          console.log('📤 Requesting initial notification count...')
          
          // Use send() method with correct destination
          client.publish({
            destination: '/app/notification/count',
            body: userId,
            headers: {} // Empty headers as shown in your snippet
          })
          
          console.log('✅ Notification count request sent for userId:', userId)
        }

        // Fetch initial count from API as fallback
        fetchMessageCount()
      }

      client.onStompError = (frame) => {
        console.error('❌ STOMP error:', frame.headers['message'])
        console.error('Details:', frame.body)
        setIsConnected(false)
      }

      client.onDisconnect = () => {
        console.log('🔌 Disconnected from Messaging WebSocket')
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connectWebSocket()
        }, 5000)
      }

      client.onWebSocketClose = () => {
        console.log('🔌 WebSocket connection closed')
        setIsConnected(false)
      }

      // Activate the client
      client.activate()
      stompClientRef.current = client
    } catch (error) {
      console.error('❌ WebSocket connection error:', error)
      setIsConnected(false)
    }
  }, [fetchMessageCount])

  // Disconnect from WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
      setIsConnected(false)
      console.log('🔌 Messaging WebSocket disconnected')
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // Mark conversation as read (decrement count)
  const markConversationAsRead = useCallback((conversationId: number) => {
    const userId = getUserId()
    if (!userId || !stompClientRef.current?.connected) {
      console.warn('⚠️ Cannot mark as read: No userId or not connected')
      return
    }

    console.log('✅ Marking conversation as read:', conversationId)

    // Send read event to server
    stompClientRef.current.publish({
      destination: '/app/message/read',
      body: JSON.stringify({
        userId: parseInt(userId),
        conversationId: conversationId,
      }),
    })

    // Optimistically update count
    setUnreadMessageCount((prev) => {
      const newCount = Math.max(0, prev - 1)
      console.log('📉 Decrementing message count:', prev, '->', newCount)
      return newCount
    })

    // Request fresh count after marking as read
    setTimeout(() => {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: '/app/notification/count',
          body: userId,
          headers: {}
        })
      }
    }, 500)
  }, [])

  // Refresh message count
  const refreshMessageCount = useCallback(() => {
    const userId = getUserId()
    if (!userId) {
      console.warn('⚠️ Cannot refresh: No userId')
      return
    }

    console.log('🔄 Refreshing message count...')

    // Request fresh count from server via WebSocket
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/notification/count',
        body: userId,
        headers: {}
      })
      console.log('✅ Notification count refresh request sent')
    } else {
      console.warn('⚠️ WebSocket not connected, using API fallback')
    }

    // Also fetch from API
    fetchMessageCount()
  }, [fetchMessageCount])

  // Connect on mount
  useEffect(() => {
    console.log('🚀 Initializing MessagingContext...')
    
    connectWebSocket()

    // Fetch initial count from API
    fetchMessageCount()

    // Refresh count every 30 seconds as backup
    const interval = setInterval(() => {
      console.log('⏰ Periodic refresh triggered')
      fetchMessageCount()
    }, 30000)

    return () => {
      console.log('🧹 Cleaning up MessagingContext...')
      clearInterval(interval)
      disconnectWebSocket()
    }
  }, [connectWebSocket, disconnectWebSocket, fetchMessageCount])

  // Reconnect when userId changes
  useEffect(() => {
    const userId = getUserId()
    if (userId) {
      disconnectWebSocket()
      setTimeout(() => {
        connectWebSocket()
      }, 1000)
    }
  }, []) // Only run once on mount

  return (
    <MessagingContext.Provider
      value={{
        unreadMessageCount,
        isConnected,
        refreshMessageCount,
        markConversationAsRead,
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

export const useMessaging = () => {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}