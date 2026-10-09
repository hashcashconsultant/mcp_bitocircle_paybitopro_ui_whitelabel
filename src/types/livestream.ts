// ==================== LIVE STREAMING TYPES ====================

export interface LiveStreamDialogProps {
  open: boolean
  onClose: () => void
  userId?: string
  adminUser?: string
  userAvatar?: unknown
  userName?: string
  pageId?: string
  onStreamEnd?: (streamData: LiveStreamData) => void
}

export interface LiveStreamViewerProps {
  open: boolean
  onClose: () => void
  streamId: string
  channelName: string
  agoraAppId?: string
  streamTitle?: string
  streamerName?: string
  streamerAvatar?: string
  streamerId?: string
  userId?: string
  userName?: string
  onStreamEnded?: (streamId: string) => void
}

export interface LiveStreamData {
  streamId: string
  channelName: string
  title: string
  description: string
  duration: number
  viewerCount: number
  likeCount: number
  recordingUrl?: string
}

export interface ChatMessage {
  id: string
  oderId?: string
  userName: string
  userAvatar?: string
  message: string
  timestamp: Date
  type: 'message' | 'join' | 'reaction' | 'system'
}

export interface Viewer {
  userId: string
  userName: string
  userAvatar?: string
  joinedAt: Date
}

// Live viewer from API response (getCombinedFeeds)
export interface LiveViewer {
  viewerId: number
  viewerName: string
  profilePicture?: string
}

export interface StreamReaction {
  type: 'like' | 'love' | 'laugh' | 'fire' | 'celebrate'
  count: number
}

export interface FloatingReaction {
  id: string
  type: string
  x: number
}

// ==================== API TYPES ====================

export interface CreateStreamRequest {
  userId: string
  adminUser: string
  title: string
  description: string
  pageId: string
}

export interface CreateStreamResponse {
  success: boolean
  message?: string
  data?: {
    streamId: string
    channelName: string
    agoraToken: string
    agoraAppId: string
    uid: number
  }
}

export interface EndStreamRequest {
  streamId: string
  userId: string
  duration: number
  viewerCount: number
  likeCount: number
}

export interface EndStreamResponse {
  success: boolean
  data?: {
    recordingUrl?: string
    thumbnailUrl?: string
  }
}

export interface GetTokenResponse {
  success: boolean
  data?: {
    token: string
    uid: number
  }
}

export interface ActiveStream {
  streamId: string
  channelName: string
  userId: string
  userName: string
  userAvatar?: string
  title: string
  description?: string
  viewerCount: number
  likeCount: number
  startedAt: string
  thumbnailUrl?: string
  agoraAppId: string
}

export interface GetActiveStreamsResponse {
  success: boolean
  data?: ActiveStream[]
}

export interface StreamDetails {
  streamId: string
  channelName: string
  userId: string
  userName: string
  userAvatar?: string
  title: string
  description?: string
  viewerCount: number
  likeCount: number
  status: 'live' | 'ended'
  playbackUrl?: string
  agoraAppId: string
  agoraToken?: string
}

export interface GetStreamDetailsResponse {
  success: boolean
  data?: StreamDetails
}

// ==================== WEBSOCKET TYPES ====================

export type WebSocketMessageType =
  | 'broadcaster_join'
  | 'viewer_join'
  | 'viewer_leave'
  | 'viewer_joined'
  | 'viewer_left'
  | 'viewer_count'
  | 'chat_message'
  | 'reaction'
  | 'stream_info'
  | 'stream_ended'

export interface WebSocketMessage {
  type: WebSocketMessageType
  streamId?: string
  userId?: string
  // User name fields - backend might use any of these
  userName?: string
  viewerName?: string
  senderName?: string
  name?: string
  // Avatar fields - backend might use any of these
  userAvatar?: string
  profilePicture?: string
  avatar?: string
  // Message content fields - backend might use any of these
  message?: string
  content?: string
  text?: string
  messageId?: string
  timestamp?: string
  reactionType?: string
  count?: number
  viewerCount?: number
  likeCount?: number
}

// ==================== AGORA TYPES ====================

export type AgoraClientRole = 'host' | 'audience'

export interface AgoraConfig {
  appId: string
  channel: string
  token: string
  uid: number
  role: AgoraClientRole
}

export type StreamPhase = 'setup' | 'preview' | 'live' | 'ended'