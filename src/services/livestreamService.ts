import { liveSocketQuery } from '@/utils/apiAuth'
import { localApiUrl } from '@/utils/apiHosts'
import {
  CreateStreamRequest,
  CreateStreamResponse,
  EndStreamRequest,
  EndStreamResponse,
  GetTokenResponse,
  GetActiveStreamsResponse,
  GetStreamDetailsResponse
} from '../types/livestream'
import { tokenCookie } from '../hooks/useAuthRedirect';


// Base URL for API calls
const BASE_URL = 'https://institutional-bo.paybito.com:8443/BitohubService'

// Get authorization header
const getAuthHeader = (): Record<string, string> => {
  const token = tokenCookie.get()
  return token ? { authorization: `bearer ${token}` } : {}
}

// ==================== STREAM MANAGEMENT ====================

/**
 * Create a new live stream session
 * Backend should generate Agora token and channel name
 */
export const createLiveStream = async (
  request: CreateStreamRequest
): Promise<CreateStreamResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/livestream/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(request)
    })

    return await response.json()
  } catch (error) {
    console.error('Error creating live stream:', error)
    return {
      success: false,
      message: 'Failed to create live stream'
    }
  }
}

/**
 * End a live stream session
 */
export const endLiveStream = async (
  request: EndStreamRequest
): Promise<EndStreamResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/livestream/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(request)
    })

    return await response.json()
  } catch (error) {
    console.error('Error ending live stream:', error)
    return {
      success: false
    }
  }
}

/**
 * Get Agora token for viewer to join stream
 */
export const getViewerToken = async (
  streamId: string,
  userId: string
): Promise<GetTokenResponse> => {
  try {
    const response = await fetch(
      `${BASE_URL}/livestream/${streamId}/viewer-token?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          ...getAuthHeader()
        }
      }
    )

    return await response.json()
  } catch (error) {
    console.error('Error getting viewer token:', error)
    return {
      success: false
    }
  }
}

/**
 * Get all active live streams
 */
export const getActiveStreams = async (
  pageId?: string
): Promise<GetActiveStreamsResponse> => {
  try {
    const url = pageId
      ? `${BASE_URL}/livestream/active?pageId=${pageId}`
      : `${BASE_URL}/livestream/active`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getAuthHeader()
      }
    })

    return await response.json()
  } catch (error) {
    console.error('Error getting active streams:', error)
    return {
      success: false
    }
  }
}

/**
 * Get stream details by ID
 */
export const getStreamDetails = async (
  streamId: string
): Promise<GetStreamDetailsResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/livestream/getStreamDetails/${streamId}`, {
      method: 'GET',
      headers: {
        ...getAuthHeader()
      }
    })

    return await response.json()
  } catch (error) {
    console.error('Error getting stream details:', error)
    return {
      success: false
    }
  }
}

// ==================== WEBSOCKET URL ====================

/**
 * Get WebSocket URL for stream
 */
export const getWebSocketUrl = (streamId: string): string => {
  return localApiUrl(`https://institutional-bo.paybito.com:8443/BitohubService/livestream/ws/${streamId}`).replace(/^http/, 'ws') + liveSocketQuery()
}

// ==================== REACTION API ====================

/**
 * Send reaction to stream
 */
export const sendStreamReaction = async (
  streamId: string,
  userId: string,
  reactionType: string
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`${BASE_URL}/livestream/${streamId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({
        userId,
        reactionType
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Error sending reaction:', error)
    return { success: false }
  }
}
