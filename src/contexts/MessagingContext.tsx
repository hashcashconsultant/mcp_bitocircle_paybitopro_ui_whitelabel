'use client'
import { localApiUrl } from '@/utils/apiHosts'
import { stompConnectHeaders } from '@/utils/apiAuth'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

interface MessagingContextType {
  unreadMessageCount: number
  isConnected: boolean
  markConversationAsRead: (conversationId: number, unreadCount?: number) => void
  resetCount: () => void
  setCurrentConversation: (conversationId: number | null) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export const MessagingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const stompClientRef = useRef<Client | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ref for current conversation (no stale closures, no reconnects)
  const currentConversationIdRef = useRef<number | null>(null)

  // Deduplication set
  const processedMessageIdsRef = useRef<Set<string>>(new Set())

  // ====================================================================
  // FIX: Suppression window for notification-count updates
  // When we send a read receipt, the server may push back a stale
  // notificationCount BEFORE it processes the read. This timestamp
  // tells us to ignore server-side count updates for a brief window.
  // ====================================================================
  const suppressCountUntilRef = useRef<number>(0)

  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('childUserId') || ''
    }
    return ''
  }

  const isDuplicateMessage = (msgData: Record<string, unknown>): boolean => {
    const messageKey = msgData.messageId
      ? String(msgData.messageId)
      : `${msgData.conversationId}-${msgData.senderId}-${msgData.createdAt || Date.now()}`

    if (processedMessageIdsRef.current.has(messageKey)) {
      console.log('⏭️ Duplicate message detected, skipping:', messageKey)
      return true
    }

    processedMessageIdsRef.current.add(messageKey)

    if (processedMessageIdsRef.current.size > 200) {
      const entries = Array.from(processedMessageIdsRef.current)
      processedMessageIdsRef.current = new Set(entries.slice(-100))
    }

    return false
  }

  const handleMessageNotification = (messageBody: string, userId: string) => {
    try {
      const msgData = JSON.parse(messageBody)
      console.log('📨 Message data:', msgData)

      if (isDuplicateMessage(msgData)) return

      const senderId = String(msgData.senderId)
      const messageConversationId = msgData.conversationId

      if (senderId !== userId) {
        // Normalize both to Number for comparison
        if (Number(messageConversationId) === Number(currentConversationIdRef.current)) {
          console.log('⏭️ Message for current conversation - NOT incrementing count')

          // ====================================================================
          // FIX: Set suppression window — ignore any notification-count updates
          // from the server for the next 3 seconds. The server will likely push
          // a stale count that includes this message as "unread" before it
          // processes our read receipt.
          // ====================================================================
          suppressCountUntilRef.current = Date.now() + 3000
          console.log('🛡️ Suppressing notification-count updates for 3 seconds')
        } else {
          setUnreadMessageCount((prev) => {
            const newCount = prev + 1
            console.log('📈 Incrementing message count:', prev, '->', newCount)
            return newCount
          })
        }
      } else {
        console.log('⏭️ Ignoring own message - not incrementing count')
      }
    } catch (e) {
      console.error('❌ Failed to parse message:', e)
    }
  }

  // ====================================================================
  // FIX: Handler for notification-count that respects suppression window
  // ====================================================================
  const handleNotificationCount = (messageBody: string) => {
    try {
      const notificationData = JSON.parse(messageBody)
      const newCount = typeof notificationData.notificationCount === 'number'
        ? notificationData.notificationCount
        : typeof notificationData === 'number'
          ? notificationData
          : null

      if (newCount === null) return

      // Check if we're in a suppression window
      if (Date.now() < suppressCountUntilRef.current) {
        console.log('🛡️ Ignoring server notification-count during suppression window:', newCount)

        // Only accept the count if it's LOWER than current (means server processed our read)
        setUnreadMessageCount((prev) => {
          if (newCount < prev) {
            console.log('📉 Server count is lower, accepting:', prev, '->', newCount)
            return newCount
          }
          console.log('🛡️ Server count would increase during suppression, keeping:', prev)
          return prev
        })
        return
      }

      // Outside suppression window — accept the server count
      console.log('📊 Setting notification count from server:', newCount)
      setUnreadMessageCount(newCount)
    } catch (e) {
      console.error('❌ Failed to parse notification count:', e)
    }
  }

  const connectWebSocket = useCallback(() => {
    const userId = getUserId()
    if (!userId) {
      console.warn('⚠️ No userId found, skipping WebSocket connection')
      return
    }

    try {
      const client = new Client({
        brokerURL: undefined,
        connectHeaders: stompConnectHeaders(),
        debug: function (str) {
          console.log('STOMP (Messaging):', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      client.webSocketFactory = () => {
        return new SockJS(
          localApiUrl(`https://institutional-bo.paybito.com:8443/BitohubService/ws-messaging?userId=${userId}`)
        )
      }

      client.onConnect = (frame) => {
        console.log('✅ Connected to Messaging WebSocket:', frame)
        setIsConnected(true)

        // Clear dedup set on new connection
        processedMessageIdsRef.current.clear()

        // Message subscriptions (both kept, dedup prevents double-count)
        client.subscribe(`/user/queue/messages`, (message) => {
          console.log('📨 New message (queue):', message.body)
          handleMessageNotification(message.body, userId)
        })

        client.subscribe(`/user/${userId}/queue/messages`, (message) => {
          console.log('📨 New message (user-specific):', message.body)
          handleMessageNotification(message.body, userId)
        })

        // Read receipts
        client.subscribe(`/user/queue/read-receipt`, (message) => {
          console.log('✅ Read receipt received:', message.body)
          try {
            const readData = JSON.parse(message.body)
            console.log('📖 Read data:', readData)

            setUnreadMessageCount((prev) => {
              const newCount = Math.max(0, prev - 1)
              console.log('📉 Decrementing message count (read receipt):', prev, '->', newCount)
              return newCount
            })
          } catch (e) {
            console.error('❌ Failed to parse read receipt:', e)
          }
        })

        // ====================================================================
        // FIX: Notification count subscriptions now use the suppression-aware handler
        // ====================================================================
        client.subscribe(`/user/queue/notification-count`, (message) => {
          console.log('📊 Notification count update:', message.body)
          handleNotificationCount(message.body)
        })

        client.subscribe(`/user/${userId}/queue/notification-count`, (message) => {
          console.log('📊 User-specific notification count:', message.body)
          handleNotificationCount(message.body)
        })

        // Request initial count
        setTimeout(() => {
          if (client.connected) {
            console.log('📤 Requesting initial notification count...')
            client.publish({
              destination: '/app/notification/count',
              body: userId,
              headers: {}
            })
          }
        }, 1000)
      }

      client.onStompError = (frame) => {
        console.error('❌ STOMP error:', frame.headers['message'])
        setIsConnected(false)
      }

      client.onDisconnect = () => {
        console.log('🔌 Disconnected from Messaging WebSocket')
        setIsConnected(false)

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...')
          connectWebSocket()
        }, 5000)
      }

      client.onWebSocketClose = () => {
        console.log('🔌 WebSocket connection closed')
        setIsConnected(false)
      }

      client.activate()
      stompClientRef.current = client
    } catch (error) {
      console.error('❌ WebSocket connection error:', error)
      setIsConnected(false)
    }
  }, []) // Stable — no dependencies

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.deactivate()
      stompClientRef.current = null
      setIsConnected(false)
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const markConversationAsRead = useCallback((conversationId: number, unreadCount: number = 1) => {
    const userId = getUserId()
    if (!userId) return

    console.log('✅ Marking conversation as read:', conversationId, 'unreads:', unreadCount)

    suppressCountUntilRef.current = Date.now() + 3000

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/message/read',
        body: JSON.stringify({
          userId: parseInt(userId),
          conversationId: conversationId,
        }),
      })
    }

    setUnreadMessageCount((prev) => {
      const newCount = Math.max(0, prev - unreadCount)
      console.log('📉 Decrementing message count:', prev, '->', newCount, `(removed ${unreadCount})`)
      return newCount
    })
  }, [])

  const setCurrentConversation = useCallback((conversationId: number | null) => {
    console.log('🗣️ Setting current conversation:', conversationId)
    currentConversationIdRef.current = conversationId !== null ? Number(conversationId) : null
  }, [])

  const resetCount = useCallback(() => {
    console.log('🔄 Resetting message count to 0')
    setUnreadMessageCount(0)
  }, [])

  useEffect(() => {
    console.log('🚀 Initializing MessagingContext...')
    connectWebSocket()

    return () => {
      console.log('🧹 Cleaning up MessagingContext...')
      disconnectWebSocket()
    }
  }, [connectWebSocket, disconnectWebSocket])

  return (
    <MessagingContext.Provider
      value={{
        unreadMessageCount,
        isConnected,
        markConversationAsRead,
        resetCount,
        setCurrentConversation,
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