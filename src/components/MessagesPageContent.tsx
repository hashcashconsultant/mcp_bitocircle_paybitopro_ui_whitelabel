'use client'
import { localApiUrl } from '@/utils/apiHosts'
import React, { useState, useRef, memo, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'
import { useSearchParams } from 'next/navigation'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'
import type { IGif } from '@giphy/js-types'
import axios from 'axios'
import { getBitoHubUserInfo } from '../services/CoreDataService'
import { useMessaging } from '@/contexts/MessagingContext'


import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  Divider,
  Paper,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Stack,
  Popover,
  MenuItem,
  ListItemIcon,
  Autocomplete,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  Menu,
  Collapse,
  Card,
  CardContent,
  CardActions,
} from '@mui/material'
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  EmojiEmotions as EmojiIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  Mail as MailIcon,
  ChatBubbleOutline as ChatIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Groups as GroupsIcon,
  Campaign as ChannelIcon,
  Person as PersonIcon,
  GroupAdd as GroupAddIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as LeaveIcon,
  Info as InfoIcon,
  VolumeUp as AnnouncementIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Notifications as NotificationsIcon,
  MarkEmailRead as MarkEmailReadIcon,
  AdminPanelSettings as AdminIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
  VideoLibrary as VideoIcon,
  WifiOff as DisconnectedIcon,
  Wifi as ConnectedIcon,
  Explore as ExploreIcon,
  Settings as SettingsIcon,
  PushPin as PinIcon,
  AccessTime as AccessTimeIcon,
  Download as DownloadIcon,
  Gif as GifIcon,
} from '@mui/icons-material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { stompConnectHeaders } from '@/utils/apiAuth';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SnackbarAlert from '@/components/common/SnackbarAlert'

import PaymentDialog, { PendingPaymentRequest } from './PaymentDialog'
import PaymentAPIService from './PaymentAPIService'

import PaymentMessage, { PaymentMessageData, PaymentStatus, PaymentType } from './PaymentMessage'

type ConversationType = 'direct' | 'group' | 'channel'

interface Member {
  id: string
  name: string
  avatar: string
  avatarColor: string
  role?: 'admin' | 'member'
  isActive?: boolean
  username?: string
  profilePicture?: string | null
}

interface Conversation {
  id: string
  name: string
  type: ConversationType
  avatar?: string
  avatarColor?: string
  members?: Member[]
  lastMessage: string
  lastMessageId?: number  // ADD THIS LINE
  time: string
  unread: number
  isActive?: boolean
  description?: string
  creatorId?: string
  isPublic?: boolean
  memberCount?: number
  canSendMessage?: boolean
  userId?: number
  conversationId?: number | null
  participants?: Participant[]
  channelId?: number
  ownerId?: string
  isOwner?: boolean
  isSubscribed?: boolean
  subscriberCount?: number
  isAdmin?: boolean
}

interface Message {
  id: string
  senderId: string
  senderName?: string
  senderAvatar?: string
  text: string
  time: string
  isOwn: boolean
  isAnnouncement?: boolean
  senderUsername?: string
  senderProfilePicture?: string
  isEdited?: boolean
  mediaUrl?: string
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' | 'PAYMENT' | 'PAYMENT_REQUEST' | 'PAYMENT_DECLINE' | 'CODE'
  conversationId?: number
  reactions?: ReactionGroup[]
  isPinned?: boolean
  reactionCount?: number
  commentCount?: number
  channelId?: number
  paymentData?: PaymentMessageData  // <-- MAKE SURE THIS EXISTS
}

// API Response Interfaces
interface APILastMessage {
  messageId: number | null
  conversationId: number | null
  senderId: string
  messageText: string
  messageType: string | null
  mediaUrl: string | null
  replyToMessageId: number | null
  isEdited: string | null
  isDeleted: string | null
  createdAt: string
  updatedAt: string | null
  senderUsername: string | null
  senderFullName: string | null
  senderProfilePicture: string | null
  replyToMessage: Record<string, unknown> | null
  readBy: Record<string, unknown> | null
  readCount: number | null
  reactions: Record<string, unknown> | null
}

interface APIConversation {
  conversationId: number | null
  userId: number
  conversationType: 'DIRECT' | 'GROUP' | 'CHANNEL' | 'PRIVATE'
  conversationName: string
  conversationImage: string | null
  createdBy: string | null
  isActive: string | null
  createdAt: string | null
  updatedAt: string | null
  lastMessage: APILastMessage | null
  unreadCount: number | null
  otherParticipant: Record<string, unknown> | null
  participants: Participant[] | null
}

interface APIMessage {
  messageId: number
  conversationId: number
  senderId: string
  messageText: string
  messageType: string
  mediaUrl: string | null
  replyToMessageId: number
  isEdited: string
  isDeleted: string
  createdAt: string
  updatedAt: string
  senderUsername: string
  senderFullName: string
  senderProfilePicture: string
  replyToMessage: Record<string, unknown> | null
  readBy: Record<string, unknown> | null
  readCount: number
  messageSentTime?: string  // ADD THIS (from API response)
  reactions: Record<string, unknown> | null
  paymentData: {            // ADD THIS
    paymentId: number
    amount: number
    type: string | null
    status: string
    senderId: number | null
    receiverId: number | null
    senderName: string | null
    receiverName: string | null
    createdAt: string | null
    currency: string
  } | null
}

interface Participant {
  participantId: number
  conversationId: number
  userId: string
  role: string
  joinedAt: string
  lastReadAt: string | null
  isMuted: string
  isActive: string
  username: string
  fullName: string
  profilePicture: string | null
}

interface CreateConversationData {
  conversationId: number
  conversationType: string
  conversationName: string | null
  conversationImage: string | null
  createdBy: string
  isActive: string
  createdAt: string
  updatedAt: string
  lastMessage: Record<string, unknown> | null
  unreadCount: number
  otherParticipant: Participant
  participants: Participant[]
}

interface CreateConversationResponse {
  success: boolean
  message: string
  data: CreateConversationData
  errorCode: string | null
}

interface SearchConversationsResponse {
  success: boolean
  message: string
  data: Array<{
    conversations: APIConversation[]
    totalCount: number
    pageNo: number
    pageSize: number
  }>
  errorCode: string | null
}

interface MessagesResponse {
  success: boolean
  message: string
  data: APIMessage[]
  errorCode: string | null
  totalRecords?: number  // ADD THIS LINE
}

interface SendMessageResponse {
  success: boolean
  message: string
  data: APIMessage
  errorCode: string | null
}

interface UpdateMessageResponse {
  success: boolean
  message: string
  data: APIMessage
  errorCode: string | null
}

interface DeleteMessageResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface ReadMessageResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Message Request Interfaces
interface MessageRequest {
  requestId: number
  senderId: number
  receiverId: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  messageText: string
  createdAt: string
  updatedAt: string
  senderUsername: string
  senderFullName: string
}

interface PendingRequestsResponse {
  success: boolean
  message: string
  data: MessageRequest[]
  errorCode: string | null
}

interface AcceptRejectRequestResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Group Management Interfaces
interface FollowerUser {
  userId: number
  username: string
  email: string
  fullName: string
  bio: string | null
  profilePicture: string | null
  coverPicture: string | null
  location: string | null
  website: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  followersCount: number
  followingCount: number
  postsCount: number
  messageTag: string | null
}

interface UserFollowersResponse {
  success: boolean
  message: string
  data: {
    followerList: FollowerUser[]
    followingList: FollowerUser[]
  }
  errorCode: string | null
}

interface CreateGroupResponse {
  success: boolean
  message: string
  data: CreateConversationData
  errorCode: string | null
}

interface GroupParticipantsResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface UpdateGroupResponse {
  success: boolean
  message: string
  data: CreateConversationData
  errorCode: string | null
}

interface LeaveGroupResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}



interface UploadMediaResponse {
  success: boolean
  message: string
  data: UploadMediaItem | UploadMediaItem[]  // supports both single and array
  errorCode: string | null
}

interface UploadMediaItem {
  fileName: string
  fileUrl: string
  fileKey: string | null
  fileSize: number
  contentType: string
  folder: string
}

// Channel Interfaces
interface ChannelSettings {
  settingId: number
  channelId: number
  allowSubscriberPosts: string
  requireApproval: string
  allowComments: string
  allowReactions: string
  isDiscoverable: string
  createdAt: string
  updatedAt: string
}

interface APIChannel {
  channelId: number
  channelName: string
  channelDescription: string
  channelType: 'PUBLIC' | 'PRIVATE'
  channelImage: string | null
  ownerId: number | string
  isActive: string
  createdAt: string
  updatedAt: string
  ownerUsername: string
  ownerFullName: string
  ownerProfilePicture: string | null
  subscriberCount: number
  messageCount: number
  isSubscribed: string
  isOwner: string
  isAdmin: string | null
  settings: ChannelSettings | null
  latestMessage: APILastMessage | null
}

interface CreateChannelResponse {
  success: boolean
  message: string
  data: APIChannel
  errorCode: string | null
}

interface GetChannelResponse {
  success: boolean
  message: string
  data: APIChannel
  errorCode: string | null
}

interface GetChannelsResponse {
  success: boolean
  message: string
  data: APIChannel[]
  errorCode: string | null
}

// Channel Search Response Interfaces
interface SearchChannelsResponse {
  success: boolean
  message: string
  data: APIChannel[]
  errorCode: string | null
}

interface DiscoverChannelsResponse {
  success: boolean
  message: string
  data: APIChannel[]
  errorCode: string | null
}

// Channel Subscriber Interface
interface ChannelSubscriber {
  subscriberId: number
  channelId: number
  userId: number
  subscriptionStatus: 'ACTIVE' | 'INACTIVE'
  isAdmin: string
  subscribedAt: string
  unsubscribedAt: string | null
  isActive: string
  username: string
  fullName: string
  profilePicture: string | null
}

interface GetChannelSubscribersResponse {
  success: boolean
  message: string
  data: ChannelSubscriber[]
  errorCode: string | null
}

interface ChannelActionResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Channel Settings Response Interfaces
interface ChannelSettingsData {
  settingId: number
  channelId: number
  ownerId?: number | null
  allowSubscriberPosts: string
  requireApproval: string
  allowComments: string
  allowReactions: string
  isDiscoverable: string
  createdAt: string
  updatedAt: string
}

interface GetChannelSettingsResponse {
  success: boolean
  message: string
  data: ChannelSettingsData
  errorCode: string | null
}

interface UpdateChannelSettingsResponse {
  success: boolean
  message: string
  data: ChannelSettingsData
  errorCode: string | null
}

interface DeleteChannelResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface InviteUsersToChannelResponse {
  success: boolean
  message: string
  data: number[]
  errorCode: string | null
}

// WebSocket Message Interface for Direct/Group messages
// WebSocket Message Interface for Direct/Group messages
interface SocketMessage {
  messageId?: number
  conversationId: number
  senderId: string | number
  receiverId?: string | number
  messageText: string
  messageType: string
  mediaUrl?: string | null
  replyToMessageId?: number | null
  createdAt?: string
  senderUsername?: string
  senderFullName?: string
  senderProfilePicture?: string
  // For sending payment messages
  amount?: number
  paymentStatus?: string
  // Payment data from server response
  paymentData?: {
    paymentId: number
    amount: number
    type: string | null
    status: string
    senderId: number | null
    receiverId: number | null
    senderName: string | null
    receiverName: string | null
    createdAt: string | null
    currency: string
  } | null
}

// WebSocket Message Interface for Channel messages
interface ChannelSocketMessage {
  channelMessageId: number
  channelId: number
  senderId: string
  messageText: string
  messageType: string
  mediaUrl?: string | null
  createdAt: string
  updatedAt: string
  senderUsername: string
  senderFullName: string
  senderProfilePicture: string
  isEdited: string
  isDeleted: string
  isPinned: string
  reactionCount: number
  reactions: unknown | null
  commentCount: number
  comments: unknown | null
}

// Union type for incoming messages
type IncomingSocketMessage = SocketMessage | ChannelSocketMessage

// Typing Event Interface
interface TypingEvent {
  userId: number
  conversationId: number
  isTyping: boolean
}

// Channel Invitation Interfaces
interface ChannelInvitation {
  invitationId: number
  channelId: number
  inviterId: string
  inviteeId: string
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  invitationMessage: string
  createdAt: string
  updatedAt: string
  channelName: string
  channelImage: string | null
  inviterUsername: string
  inviterFullName: string
  inviterProfilePicture: string | null
}

interface PendingChannelInvitationsResponse {
  success: boolean
  message: string
  data: ChannelInvitation[]
  errorCode: string | null
}

interface AcceptRejectChannelInvitationResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Reaction Interfaces
interface MessageReaction {
  reactionId?: number
  messageId: number
  userId: number
  reactionType: string
  userFullName?: string
  userProfilePicture?: string
  createdAt?: string
}

interface ReactionGroup {
  emoji: string
  count: number
  users: Array<{
    userId: number
    fullName?: string
    profilePicture?: string
  }>
  hasReacted: boolean
}

interface AddReactionResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface RemoveReactionResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Add this new interface for channel messages
interface APIChannelMessage {
  channelMessageId: number
  channelId: number
  senderId: string
  messageText: string
  messageType: string
  mediaUrl: string | null
  isPinned: string
  isEdited: string
  isDeleted: string
  createdAt: string
  updatedAt: string
  senderUsername: string
  senderFullName: string
  senderProfilePicture: string
  reactionCount: number
  commentCount: number
  reactions: unknown | null
  comments: unknown | null
}

interface ChannelMessagesResponse {
  success: boolean
  message: string
  data: APIChannelMessage[]
  errorCode: string | null
}

interface UpdateChannelMessageResponse {
  success: boolean
  message: string
  data: APIChannelMessage
  errorCode: string | null
}

interface DeleteChannelMessageResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface PinChannelMessageResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface PromoteGroupAdminResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

interface UploadChannelMediaResponse {
  success: boolean
  message: string
  data: {
    fileName: string
    fileUrl: string
    fileKey: string | null
    fileSize: number
    contentType: string
    folder: string
  }
  errorCode: string | null
}

interface Asset {
  currencyCode: string
  closingBalance: number
}

interface BalanceResponse {
  error: {
    error_data: number
    error_msg: string
  }
  userBalanceList: Asset[]
}

interface Asset {
  currencyCode: string
  closingBalance: number
}

interface BalanceResponse {
  error: {
    error_data: number
    error_msg: string
  }
  userBalanceList: Asset[]
}

interface BitoHubUserInfo {
  uuid: string
  userId: number
  userTierType: string
  brokerId: string
  country: string
}

interface DeleteConversationResponse {
  success: boolean
  message: string
  data: boolean
  errorCode: string | null
}

// Move ConversationList outside and use memo for optimization
const ConversationList = memo(({
  conversations,
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
  selectedConversation,
  handleSelectConversation,
  setCreateGroupDialog,
  setCreateChannelDialog,
  isLoadingConversations,
  handleSearchConversations,
  pendingRequests,
  isPendingRequestsExpanded,
  setIsPendingRequestsExpanded,
  isLoadingRequests,
  handleAcceptRequest,
  handleRejectRequest,
  isProcessingRequest,
  isSocketConnected,
  discoveredChannels,
  isSearchingChannels,
  channelInvitations,  // ADD THIS
  isChannelInvitationsExpanded,  // ADD THIS
  setIsChannelInvitationsExpanded,  // ADD THIS
  isLoadingChannelInvitations,  // ADD THIS
  handleAcceptChannelInvitation,  // ADD THIS
  handleRejectChannelInvitation,  // ADD THIS
  isProcessingChannelInvitation,  // ADD THIS
  activeUsers,  // ADD THIS
  isUserActive,  // ADD THIS
}: {
  conversations: Conversation[]
  searchQuery: string
  setSearchQuery: (value: string) => void
  activeTab: number
  setActiveTab: (value: number) => void
  selectedConversation: string | null
  handleSelectConversation: (id: string) => void
  setCreateGroupDialog: (value: boolean) => void
  setCreateChannelDialog: (value: boolean) => void
  isLoadingConversations: boolean
  handleSearchConversations: (query: string) => void
  pendingRequests: MessageRequest[]
  isPendingRequestsExpanded: boolean
  setIsPendingRequestsExpanded: (value: boolean) => void
  isLoadingRequests: boolean
  handleAcceptRequest: (requestId: number) => void
  handleRejectRequest: (requestId: number) => void
  isProcessingRequest: number | null
  isSocketConnected: boolean
  discoveredChannels: Conversation[]
  isSearchingChannels: boolean
  channelInvitations: ChannelInvitation[]  // ADD THIS
  isChannelInvitationsExpanded: boolean  // ADD THIS
  setIsChannelInvitationsExpanded: (value: boolean) => void  // ADD THIS
  isLoadingChannelInvitations: boolean  // ADD THIS
  handleAcceptChannelInvitation: (invitationId: number) => void  // ADD THIS
  handleRejectChannelInvitation: (invitationId: number) => void  // ADD THIS
  isProcessingChannelInvitation: number | null  // ADD THIS

  activeUsers: Set<string>
  isUserActive: (userId: string | number | undefined | null) => boolean


}) => {
  const filteredConversations = conversations.filter(conv => {
    const matchesTab =
      activeTab === 0 ? true :
        activeTab === 1 ? conv.type === 'direct' :
          activeTab === 2 ? conv.type === 'group' :
            activeTab === 3 ? conv.type === 'channel' : true

    return matchesTab
  })

  // Show discovered channels when searching and on channels tab or all tab
  const displayConversations = searchQuery && (activeTab === 0 || activeTab === 3)
    ? [...filteredConversations, ...discoveredChannels.filter(dc =>
      !filteredConversations.find(fc => fc.id === dc.id)
    )]
    : filteredConversations

  console.log('displayConversations', displayConversations);


  return (
    <Box sx={{
      width: { xs: '100%', md: 360 },
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: { md: 1 },
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // Prevent double scrollbars
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Messages
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title={isSocketConnected ? "Connected" : "Disconnected"}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mr: 1,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: isSocketConnected ? 'success.light' : 'error.light'
              }}>
                {isSocketConnected ? (
                  <ConnectedIcon sx={{ fontSize: 16, color: 'success.dark' }} />
                ) : (
                  <DisconnectedIcon sx={{ fontSize: 16, color: 'error.dark' }} />
                )}
              </Box>
            </Tooltip>
            <Tooltip title="Create New Group">
              <IconButton
                onClick={() => setCreateGroupDialog(true)}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <GroupAddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create Your Channel">
              <IconButton
                onClick={() => setCreateChannelDialog(true)}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <AnnouncementIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations and channels..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            handleSearchConversations(e.target.value)
          }}
          autoComplete="off"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                {isLoadingConversations || isSearchingChannels ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSearchQuery('')
                      handleSearchConversations('')
                    }}
                    edge="end"
                    sx={{ mr: -1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': { border: 'none' },
              '&:hover': {
              },
              '&.Mui-focused': {
                outline: '2px solid',
                outlineColor: 'primary.main',
              }
            }
          }}
        />

        {/* Message Requests Section */}
        {pendingRequests.length > 0 && (
          <Card
            sx={{
              mt: 2,
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              boxShadow: 'none'
            }}
          >
            <CardContent sx={{ p: 1.5, pb: 0.5, '&:last-child': { pb: 1.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setIsPendingRequestsExpanded(!isPendingRequestsExpanded)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    badgeContent={pendingRequests.length}
                    color="error"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                  >
                    <MarkEmailReadIcon color="primary" />
                  </Badge>
                  <Box>
                    <Typography variant="body2" fontWeight="600" color="primary.dark">
                      Message Requests
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pendingRequests.length} pending {pendingRequests.length === 1 ? 'request' : 'requests'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small">
                  {isPendingRequestsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={isPendingRequestsExpanded}>
                <Box sx={{ mt: 2 }}>
                  {isLoadingRequests ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {pendingRequests.map((request) => (
                        <Card
                          key={request.requestId}
                          sx={{
                            bgcolor: 'white',
                            boxShadow: 1,
                          }}
                        >
                          <CardContent sx={{ p: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  bgcolor: 'primary.main',
                                  width: 40,
                                  height: 40,
                                  fontSize: '1rem'
                                }}
                              >
                                {request.senderFullName[0]}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight="600"
                                  noWrap
                                >
                                  {request.senderFullName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  noWrap
                                >
                                  {request.senderUsername}
                                </Typography>
                                {request.messageText && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    &quot;{request.messageText}&quot;
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 0.5 }}
                                >
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <CardActions sx={{ p: 1, pt: 0, gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              fullWidth
                              startIcon={
                                isProcessingRequest === request.requestId ?
                                  <CircularProgress size={16} color="inherit" /> :
                                  <CheckIcon />
                              }
                              onClick={() => handleAcceptRequest(request.requestId)}
                              disabled={isProcessingRequest !== null}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              fullWidth
                              startIcon={
                                isProcessingRequest === -request.requestId ?
                                  <CircularProgress size={16} color="inherit" /> :
                                  <CloseIcon />
                              }
                              onClick={() => handleRejectRequest(request.requestId)}
                              disabled={isProcessingRequest !== null}
                            >
                              Reject
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Channel Invitations Section */}
        {channelInvitations.length > 0 && (
          <Card
            sx={{
              mt: 2,
              bgcolor: 'success.50',
              border: '1px solid',
              borderColor: 'success.200',
              boxShadow: 'none'
            }}
          >
            <CardContent sx={{ p: 1.5, pb: 0.5, '&:last-child': { pb: 1.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setIsChannelInvitationsExpanded(!isChannelInvitationsExpanded)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    badgeContent={channelInvitations.length}
                    color="success"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                  >
                    <AnnouncementIcon color="success" />
                  </Badge>
                  <Box>
                    <Typography variant="body2" fontWeight="600" color="success.dark">
                      Channel Invitations
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {channelInvitations.length} pending {channelInvitations.length === 1 ? 'invitation' : 'invitations'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small">
                  {isChannelInvitationsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              <Collapse in={isChannelInvitationsExpanded}>
                <Box sx={{ mt: 2 }}>
                  {isLoadingChannelInvitations ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {channelInvitations.map((invitation) => (
                        <Card
                          key={invitation.invitationId}
                          sx={{
                            bgcolor: 'background.default',
                            boxShadow: 1,
                          }}
                        >
                          <CardContent sx={{ p: 1.5, pb: 1, '&:last-child': { pb: 1 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              <Avatar
                                src={invitation.channelImage || undefined}
                                sx={{
                                  bgcolor: 'success.main',
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                <AnnouncementIcon />
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight="600"
                                  noWrap
                                >
                                  {invitation.channelName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Avatar
                                    src={invitation.inviterProfilePicture || undefined}
                                    sx={{ width: 16, height: 16 }}
                                  >
                                    {invitation.inviterFullName[0]}
                                  </Avatar>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    noWrap
                                  >
                                    Invited by {invitation.inviterFullName}
                                  </Typography>
                                </Box>
                                {invitation.invitationMessage && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: 'block',
                                      mt: 0.5,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    &quot;{invitation.invitationMessage}&quot;
                                  </Typography>
                                )}
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: 'block', mt: 0.5 }}
                                >
                                  {new Date(invitation.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                          <CardActions sx={{ p: 1, pt: 0, gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              fullWidth
                              startIcon={
                                isProcessingChannelInvitation === invitation.invitationId ?
                                  <CircularProgress size={16} color="inherit" /> :
                                  <CheckIcon />
                              }
                              onClick={() => handleAcceptChannelInvitation(invitation.invitationId)}
                              disabled={isProcessingChannelInvitation !== null}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              fullWidth
                              startIcon={
                                isProcessingChannelInvitation === -invitation.invitationId ?
                                  <CircularProgress size={16} color="inherit" /> :
                                  <CloseIcon />
                              }
                              onClick={() => handleRejectChannelInvitation(invitation.invitationId)}
                              disabled={isProcessingChannelInvitation !== null}
                            >
                              Reject
                            </Button>
                          </CardActions>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        )}

        {/* Tabs for filtering */}
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{ mt: 2 }}
        >
          <Tab label="All" sx={{ minWidth: 0, fontSize: '0.75rem' }} />
          <Tab label="Direct" sx={{ minWidth: 0, fontSize: '0.75rem' }} />
          <Tab label="Groups" sx={{ minWidth: 0, fontSize: '0.75rem' }} />
          <Tab label="Channels" sx={{ minWidth: 0, fontSize: '0.75rem' }} />
        </Tabs>
      </Box>

      {/* Conversations List */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {isLoadingConversations && conversations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : displayConversations.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {searchQuery ? 'No conversations or channels found' : 'No conversations yet'}
            </Typography>
          </Box>
        ) : (
          displayConversations.map((conversation) => (
            <React.Fragment key={conversation.id}>
              <ListItem
                disablePadding
                sx={{
                  bgcolor: selectedConversation === conversation.id ? 'action.selected' : 'transparent',
                }}
              >
                <ListItemButton
                  onClick={() => handleSelectConversation(conversation.id)}
                  sx={{ py: 2, px: 2 }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={conversation.unread}
                      color="primary"
                      invisible={conversation.unread === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          right: 5,
                          top: 5,
                        }
                      }}
                    >
                      {conversation.type === 'group' ? (
                        <Avatar
                          src={conversation.avatar}
                          sx={{ bgcolor: '#1e40af', width: 48, height: 48 }}
                        >
                          {!conversation.avatar && <GroupsIcon />}
                        </Avatar>
                      ) : conversation.type === 'channel' ? (
                        <Avatar sx={{
                          bgcolor: conversation.isPublic ? '#10b981' : '#f59e0b',
                          width: 48,
                          height: 48
                        }}>
                          {conversation.isPublic ? <PublicIcon /> : <LockIcon />}
                        </Avatar>
                      ) : (
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          invisible={!isUserActive(conversation.userId)}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: '#44b700',
                              color: '#44b700',
                              boxShadow: `0 0 0 2px white`,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              '&::after': {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                animation: 'ripple 1.2s infinite ease-in-out',
                                border: '1px solid currentColor',
                                content: '""',
                              },
                            },
                            '@keyframes ripple': {
                              '0%': {
                                transform: 'scale(.8)',
                                opacity: 1,
                              },
                              '100%': {
                                transform: 'scale(2.4)',
                                opacity: 0,
                              },
                            },
                          }}
                        >
                          <Avatar
                            src={conversation.avatar}
                            sx={{
                              bgcolor: conversation.avatarColor,
                              width: 48,
                              height: 48,
                            }}
                          >
                            {/* {!conversation.avatar && conversation.name.charAt(0).toUpperCase()} */}
                          </Avatar>
                        </Badge>
                      )}
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body1" fontWeight={conversation.unread > 0 ? 600 : 400}>
                          {conversation.name}
                        </Typography>
                        {conversation.type === 'group' && (
                          <Chip
                            label={`${conversation.memberCount} members`}
                            size="small"
                            sx={{ height: 16, fontSize: '0.65rem' }}
                          />
                        )}
                        {conversation.type === 'channel' && (
                          <>
                            <Chip
                              label={`${conversation.subscriberCount || 0} subscribers`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.65rem' }}
                            />
                            {!conversation.isSubscribed && !conversation.isOwner && (
                              <Chip
                                label="Discover"
                                size="small"
                                color="info"
                                icon={<ExploreIcon sx={{ fontSize: 12 }} />}
                                sx={{ height: 16, fontSize: '0.65rem' }}
                              />
                            )}
                          </>
                        )}
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: conversation.unread > 0 ? 500 : 400,
                        }}
                      >
                        {conversation.lastMessage}
                      </Typography>
                    }
                  />
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    ml: 1
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {conversation.time}
                    </Typography>
                  </Box>
                </ListItemButton>
              </ListItem>
              <Divider variant="inset" component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  )
})

ConversationList.displayName = 'ConversationList'

const MessagesPageContent: React.FC = () => {
  const searchParams = useSearchParams()
  const userIdToMessage = searchParams.get('userId')

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  // Dialog states
  const [createGroupDialog, setCreateGroupDialog] = useState(false)
  const [createChannelDialog, setCreateChannelDialog] = useState(false)
  const [conversationInfoDialog, setConversationInfoDialog] = useState(false)
  const [addMembersDialog, setAddMembersDialog] = useState(false)
  const [editGroupDialog, setEditGroupDialog] = useState(false)

  // Form states for group/channel creation
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupImage, setNewGroupImage] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDescription, setNewChannelDescription] = useState('')
  const [isChannelPublic, setIsChannelPublic] = useState(true)

  // Group edit states
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupImage, setEditGroupImage] = useState('')

  // Edit message states
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editMessageText, setEditMessageText] = useState('')
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<Message | null>(null)

  // Message Request states
  const [pendingRequests, setPendingRequests] = useState<MessageRequest[]>([])
  const [isPendingRequestsExpanded, setIsPendingRequestsExpanded] = useState(true)
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [isProcessingRequest, setIsProcessingRequest] = useState<number | null>(null)

  // Available users from followers/following
  const [availableUsers, setAvailableUsers] = useState<Member[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // File upload states


  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const MAX_FILES = 5

  // WebSocket states
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Loading states
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false)
  const [isDeletingMessage, setIsDeletingMessage] = useState(false)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const [isRemovingMember, setIsRemovingMember] = useState(false)
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false)
  const [isLeavingGroup, setIsLeavingGroup] = useState(false)
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [isLoadingChannels, setIsLoadingChannels] = useState(false)

  // Channel management states
  const [channelSubscribers, setChannelSubscribers] = useState<ChannelSubscriber[]>([])
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isUnsubscribing, setIsUnsubscribing] = useState(false)
  const [isPromotingAdmin, setIsPromotingAdmin] = useState<number | null>(null)
  const [isRemovingSubscriber, setIsRemovingSubscriber] = useState<number | null>(null)
  const [isMutingChannel, setIsMutingChannel] = useState(false)
  const [channelMuted, setChannelMuted] = useState(false)

  // Channel search states
  const [discoveredChannels, setDiscoveredChannels] = useState<Conversation[]>([])
  const [isSearchingChannels, setIsSearchingChannels] = useState(false)

  // Channel settings states
  const [channelSettings, setChannelSettings] = useState<ChannelSettingsData | null>(null)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false)
  const [isDeletingChannel, setIsDeletingChannel] = useState(false)
  const [isInvitingUsers, setIsInvitingUsers] = useState(false)

  // Channel settings dialog states
  const [channelSettingsDialog, setChannelSettingsDialog] = useState(false)
  const [inviteUsersDialog, setInviteUsersDialog] = useState(false)
  const [selectedInviteUsers, setSelectedInviteUsers] = useState<Member[]>([])
  const [invitationMessage, setInvitationMessage] = useState('')

  // Channel settings form states
  const [allowSubscriberPosts, setAllowSubscriberPosts] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [allowReactions, setAllowReactions] = useState(true)
  const [isDiscoverable, setIsDiscoverable] = useState(true)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'))

  const messageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Channel Invitation states
  const [channelInvitations, setChannelInvitations] = useState<ChannelInvitation[]>([])
  const [isChannelInvitationsExpanded, setIsChannelInvitationsExpanded] = useState(false)
  const [isLoadingChannelInvitations, setIsLoadingChannelInvitations] = useState(false)
  const [isProcessingChannelInvitation, setIsProcessingChannelInvitation] = useState<number | null>(null)

  // Emoji picker states
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState<null | HTMLElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Reaction states
  const [reactionPickerAnchor, setReactionPickerAnchor] = useState<null | HTMLElement>(null)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<Message | null>(null)
  const [isSendingReaction, setIsSendingReaction] = useState(false)

  // Quick reaction emojis
  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']
  const [isPinningMessage, setIsPinningMessage] = useState(false)
  const [isPinnedMessagesExpanded, setIsPinnedMessagesExpanded] = useState(false)
  const [isPromotingGroupAdmin, setIsPromotingGroupAdmin] = useState<string | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const PAGE_SIZE = 50
  // Media lightbox states
  const [lightboxOpen, setLightboxOpen] = useState(false)
const [lightboxImages, setLightboxImages] = useState<string[]>([]);
const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string } | null>(null)


  // Edit group file upload states
  const [editGroupFile, setEditGroupFile] = useState<File | null>(null)
  const [editGroupFilePreview, setEditGroupFilePreview] = useState<string | null>(null)
  const [isUploadingGroupImage, setIsUploadingGroupImage] = useState(false)
  const editGroupFileInputRef = useRef<HTMLInputElement>(null)

  const GIPHY_API_KEY = 'gZSJ94aaaYXX9rGr6nWbQ3RswT4tsA6W'
  const giphyFetch = new GiphyFetch(GIPHY_API_KEY)
  // GIF picker states
  const [gifPickerAnchor, setGifPickerAnchor] = useState<null | HTMLElement>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearchQuery, setGifSearchQuery] = useState('')
  const [isSendingGif, setIsSendingGif] = useState(false)

  // Active users states - store as strings since API returns strings
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const [isLoadingActiveUsers, setIsLoadingActiveUsers] = useState(false)

  // Payment states


  const [selectedConvCache, setSelectedConvCache] = useState<Conversation | null>(null) // ADD THIS
  const [isDeletingConversation, setIsDeletingConversation] = useState(false)

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // NEW: Add this state for tracking which payment message is being processed
  const [processingPaymentMessageId, setProcessingPaymentMessageId] = useState<string | null>(null)

  // NEW: For accepting payment requests - ADD THESE
  const [paymentDialogMode, setPaymentDialogMode] = useState<'normal' | 'accept_request'>('normal')
  const [pendingPaymentRequest, setPendingPaymentRequest] = useState<PendingPaymentRequest | null>(null)

  const [chatProfileImageOpen, setChatProfileImageOpen] = useState(false)

  const { markConversationAsRead, resetCount, setCurrentConversation } = useMessaging()
  // Multi-image lightbox state

  const processedIncomingMsgIds = useRef<Set<string>>(new Set())




  // Add this useEffect to reset count when opening Messages page
useEffect(() => {
  // When user navigates to messages page, reset the global count
  // This assumes they'll see all unread messages in the list
  console.log('📱 Messages page opened - resetting global count')
  resetCount()
}, []) // Empty dependency array = runs once when component mounts


  // Load active users via WebSocket

  const loadActiveUsers = useCallback(() => {
    if (!stompClient || !stompClient.connected) {
      console.log('WebSocket not connected. Cannot load active users.')
      return
    }

    setIsLoadingActiveUsers(true)
    console.log('Requesting active users list')

    // Subscribe to receive the active users response
    const subscription = stompClient.subscribe('/user/queue/active-users', (message) => {
      try {
        console.log('Active users response received:', message.body)
        const users = JSON.parse(message.body)

        // Convert to array if needed - users come as strings from API
        const userArray: string[] = Array.isArray(users)
          ? users.map((u: string | number) => String(u))
          : Array.from(users).map((u: unknown) => String(u))

        setActiveUsers(new Set(userArray))

        console.log('Active users loaded:', userArray.length, 'users', userArray)

        // Unsubscribe after receiving the response
        subscription.unsubscribe()
      } catch (err) {
        console.error('Failed to parse active users:', err)
        setActiveUsers(new Set())
      } finally {
        setIsLoadingActiveUsers(false)
      }
    })

    // Send request to get active users
    console.log('Sending active user status request to /app/active-user/status')
    stompClient.publish({
      destination: '/app/active-user/status',
      body: JSON.stringify({})
    })
  }, [stompClient])

  // URL regex pattern to detect links
  const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

  // Internal BitoCircle routes pattern
  const INTERNAL_ROUTES = [
    '/profile',
    '/post',
    '/feed',
    '/messages',
    '/explore',
    '/settings',
    '/notifications',
  ]

  // Check if URL is internal BitoCircle link
  const isInternalLink = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      const currentHost = window.location.host

      // Check if same host
      if (urlObj.host === currentHost) {
        return true
      }

      // Check for known BitoCircle domains
      const bitocircleDomains = [
        'bitocircle.com',
        'bitohub.com',
        'bitoconnect.com',
        'localhost',
      ]

      return bitocircleDomains.some(domain => urlObj.host.includes(domain))
    } catch {
      return false
    }
  }

  // Extract internal path from URL
  const getInternalPath = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search + urlObj.hash
    } catch {
      return url
    }
  }

  // Render message text with clickable links
  const renderMessageWithLinks = (text: string, isOwnMessage: boolean = false) => {
    if (!text) return null

    const parts = text.split(URL_REGEX)

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (URL_REGEX.test(part)) {
        // Reset regex lastIndex
        URL_REGEX.lastIndex = 0

        const isInternal = isInternalLink(part)

        return (
          <Box
            key={index}
            component="a"
            href={isInternal ? getInternalPath(part) : part}
            target={isInternal ? '_self' : '_blank'}
            rel={isInternal ? undefined : 'noopener noreferrer'}
            onClick={(e: React.MouseEvent) => {
              if (isInternal) {
                e.preventDefault()
                // Use Next.js router for internal navigation
                window.location.href = getInternalPath(part)
              }
            }}
            sx={{
              color: isOwnMessage ? '#bbdefb' : 'primary.main',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              '&:hover': {
                color: isOwnMessage ? '#e3f2fd' : 'primary.dark',
                textDecoration: 'underline',
              },
              cursor: 'pointer',
            }}
          >
            {part}
          </Box>
        )
      }

      // Return regular text
      return <span key={index}>{part}</span>
    })
  }




  // GIF Picker handlers
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

  // Handle GIF selection
  const handleGifSelect = async (gif: IGif, e: React.SyntheticEvent<HTMLElement>) => {
    e.preventDefault()

    if (!selectedConversation) {
      showSnackbar('Please select a conversation first', 'warning')
      return
    }

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (conv?.type === 'channel' && !conv.canSendMessage) {
      showSnackbar('Only channel admins can send messages', 'warning')
      return
    }

    setIsSendingGif(true)
    handleGifPickerClose()

    try {
      // Get the GIF URL (use the downsized version for better performance)
      const gifUrl = gif.images.downsized_medium.url || gif.images.original.url

      // Get channelId if this is a channel conversation
      const channelId = conv?.type === 'channel' ? conv.channelId : undefined

      // Send GIF via WebSocket as an IMAGE type
      const success = sendMessageViaSocket(
        selectedConversation,
        '', // No text message
        gifUrl,
        'GIF', // or you can use 'GIF' if your backend supports it
        channelId
      )

      if (success) {
        showSnackbar('GIF sent!', 'success')
        if (selectedConversation) {
          moveConversationToTop(selectedConversation)
        }
      }
    } catch (error) {
      console.error('Error sending GIF:', error)
      showSnackbar('Failed to send GIF', 'error')
    } finally {
      setIsSendingGif(false)
    }
  }




  // Handle group image file selection
  const handleEditGroupFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select an image file', 'error')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        showSnackbar('Image size must be less than 5MB', 'error')
        return
      }

      setEditGroupFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditGroupFilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear group image file selection
  const handleClearEditGroupFile = () => {
    setEditGroupFile(null)
    setEditGroupFilePreview(null)
    if (editGroupFileInputRef.current) {
      editGroupFileInputRef.current.value = ''
    }
  }

  // Upload group image and return URL
  const uploadGroupImage = async (file: File): Promise<string | null> => {
    setIsUploadingGroupImage(true)
    try {
      const formData = new FormData()
      formData.append('userId', currentUserId)
      formData.append('files', file)

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/messaging/upload/media',
        {
          method: 'POST',
          body: formData,
        }
      )

      const result: UploadMediaResponse = await response.json()

      if (result.success && result.data) {
        const item = Array.isArray(result.data) ? result.data[0] : result.data
        return item.fileUrl
      } else {
        showSnackbar(result.message || 'Failed to upload image', 'error')
        return null
      }
    } catch (error) {
      console.error('Error uploading group image:', error)
      showSnackbar('Failed to upload image', 'error')
      return null
    } finally {
      setIsUploadingGroupImage(false)
    }
  }




  // Handle media click to open in lightbox
  const handleMediaClick = (mediaUrl: string, mediaType: string) => {
    setLightboxMedia({ url: mediaUrl, type: mediaType })
    setLightboxOpen(true)
  }

  // Handle lightbox close
  const handleLightboxClose = () => {
    setLightboxOpen(false)
    setLightboxMedia(null)
  }

  const handleOpenLightbox = (images: string[], startIndex: number) => {
  setLightboxImages(images);
  setLightboxIndex(startIndex);
  setLightboxOpen(true);
};


  // Get userId from localStorage
  const getUserId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('childUserId') || '435'
    }
    return '435'
  }

  const currentUserId = getUserId()

  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (messages.length > 0 && !isLoadingMoreMessages) {
      // Small delay to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const container = document.getElementById('messages-container')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 1000)

      // Cleanup timeout on unmount
      return () => clearTimeout(timeoutId)
    }
  }, [messages, isLoadingMoreMessages])

  // Format time helper
  // Format time helper
  const formatTime = (dateString: string) => {
    if (!dateString) return ''

    let date: Date

    // Check if the timestamp already has timezone info
    if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
      date = new Date(dateString)
    } else {
      // Assume server returns UTC time without 'Z' suffix - append it
      date = new Date(dateString + 'Z')
    }

    // Check for invalid date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString)
      return ''
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Handle future dates (negative diff) - show as "Just now"
    if (diffInSeconds < 0) return 'Just now'

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    // For older dates, show the actual date and time
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ========== WEBSOCKET FUNCTIONS ==========

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    try {
      const client = new Client({
        brokerURL: undefined, // We'll use webSocketFactory instead
        connectHeaders: stompConnectHeaders(),
        debug: function (str) {
          console.log('STOMP: ' + str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      // Use SockJS as the WebSocket factory
      client.webSocketFactory = () => {
        return new SockJS(localApiUrl('https://institutional-bo.paybito.com:8443/BitohubService/ws-messaging?userId=' + currentUserId))
      }

      client.onConnect = (frame) => {
        console.log('Connected to WebSocket:', frame)
        setIsSocketConnected(true)
        showSnackbar('Connected to real-time messaging', 'success')

        // Subscribe to conversation messages
        if (selectedConversation) {
          client.subscribe(`/topic/messages/${selectedConversation}`, (message) => {
            console.log('Message received on topic:', message.body)
            try {
              const msg: SocketMessage = JSON.parse(message.body)
              handleIncomingMessage(msg)
            } catch (e) {
              console.error('Failed to parse message:', e)
            }
          })
        }

        // Subscribe to user-specific messages
        client.subscribe(`/user/queue/messages`, (message) => {
          console.log('User message received:', message.body)
          try {
            const msg: SocketMessage = JSON.parse(message.body)
            handleIncomingMessage(msg)
          } catch (e) {
            console.error('Failed to parse user message:', e)
          }
        })

        // Subscribe to active user status updates (when users come online/offline)
        client.subscribe(`/user/queue/user-status`, (message) => {
          console.log('User status update received:', message.body)
          try {
            const statusUpdate = JSON.parse(message.body)
            // Expected format: { userId: string | number, isActive: boolean }
            if (statusUpdate.userId !== undefined) {
              const stringUserId = String(statusUpdate.userId)
              setActiveUsers(prev => {
                const newSet = new Set(prev)
                if (statusUpdate.isActive) {
                  newSet.add(stringUserId)
                } else {
                  newSet.delete(stringUserId)
                }
                return newSet
              })
            }
          } catch (e) {
            console.error('Failed to parse user status update:', e)
          }
        })

        // Subscribe to broadcast active user updates
        client.subscribe(`/topic/active-users`, (message) => {
          console.log('Broadcast active users update received:', message.body)
          try {
            const users = JSON.parse(message.body)
            // Convert all user IDs to strings
            const userArray: string[] = Array.isArray(users)
              ? users.map((u: string | number) => String(u))
              : Array.from(users).map((u: unknown) => String(u))
            setActiveUsers(new Set(userArray))
          } catch (e) {
            console.error('Failed to parse broadcast active users:', e)
          }
        })



        // Subscribe to user-specific messages (alternative path)
        client.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
          console.log('User message received:', message.body)
          try {
            const msg: SocketMessage = JSON.parse(message.body)
            handleIncomingMessage(msg)
          } catch (e) {
            console.error('Failed to parse user message:', e)
          }
        })

        // ADD THIS: Subscribe to channel messages
        client.subscribe(`/user/queue/channel/messages`, (message) => {
          console.log('Channel message received:', message.body)
          try {
            const msg: ChannelSocketMessage = JSON.parse(message.body)
            handleIncomingMessage(msg)
          } catch (e) {
            console.error('Failed to parse channel message:', e)
          }
        })

        // ADD THIS: Subscribe to specific channel updates (if user is subscribed to channels)
        client.subscribe(`/user/${currentUserId}/queue/channel/messages`, (message) => {
          console.log('User channel message received:', message.body)
          try {
            const msg: ChannelSocketMessage = JSON.parse(message.body)
            handleIncomingMessage(msg)
          } catch (e) {
            console.error('Failed to parse channel message:', e)
          }
        })

        // Subscribe to typing events
        client.subscribe(`/user/queue/typing`, (message) => {
          console.log('Typing event received:', message.body)
          try {
            const event: TypingEvent = JSON.parse(message.body)
            handleTypingEvent(event)
          } catch (e) {
            console.error('Failed to parse typing event:', e)
          }
        })

        // Subscribe to read receipts
        client.subscribe(`/user/queue/read-receipt`, (message) => {
          console.log('Read receipt received:', message.body)
          try {
            const event = JSON.parse(message.body)
            handleReadReceipt(event)
          } catch (e) {
            console.error('Failed to parse read receipt:', e)
          }
        })

        // Subscribe to notifications
        client.subscribe(`/user/queue/notifications`, (message) => {
          console.log('Notification received:', message.body)
          try {
            const notification = JSON.parse(message.body)
            handleNotification(notification)
          } catch (e) {
            console.error('Failed to parse notification:', e)
          }
        })
      }

      client.onStompError = (frame) => {
        console.error('STOMP error:', frame.headers['message'])
        console.error('Details:', frame.body)
        setIsSocketConnected(false)
        showSnackbar('Connection error. Retrying...', 'error')
      }

      client.onDisconnect = () => {
        console.log('Disconnected from WebSocket')
        setIsSocketConnected(false)
      }

      client.onWebSocketClose = () => {
        console.log('WebSocket connection closed')
        setIsSocketConnected(false)
      }

      // Activate the client
      client.activate()
      setStompClient(client)

    } catch (error) {
      console.error('WebSocket connection error:', error)
      setIsSocketConnected(false)
      showSnackbar('Failed to connect to real-time messaging', 'error')
    }
  }, [currentUserId, selectedConversation])

  // Disconnect from WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (stompClient) {
      stompClient.deactivate()
      setStompClient(null)
      setIsSocketConnected(false)
      console.log('WebSocket disconnected')
    }
  }, [stompClient])

  const sendReadReceipt = useCallback((conversationId: number, messageId: number) => {
    if (!stompClient || !stompClient.connected) {
      return
    }

    const readEvent = {
      userId: parseInt(currentUserId),
      conversationId: conversationId,
      messageId: messageId
    }

    try {
      stompClient.publish({
        destination: '/app/message/read',
        body: JSON.stringify(readEvent)
      })
      console.log('Read receipt sent:', readEvent)
    } catch (error) {
      console.error('Error sending read receipt:', error)
    }
  }, [stompClient, currentUserId])

  // Type guard to check if message is a channel message
  const isChannelMessage = (msg: IncomingSocketMessage): msg is ChannelSocketMessage => {
    return 'channelMessageId' in msg && 'channelId' in msg
  }

  const handleIncomingMessage = useCallback((msg: IncomingSocketMessage) => {
    console.log('Processing incoming message:', msg)

    // Deduplicate
    const dedupeKey = isChannelMessage(msg)
      ? String(msg.channelMessageId)
      : msg.messageId
        ? String(msg.messageId)
        : `${msg.conversationId}-${msg.senderId}-${msg.createdAt || Date.now()}`

    if (processedIncomingMsgIds.current.has(dedupeKey)) {
      console.log('⏭️ Duplicate incoming message, skipping:', dedupeKey)
      return
    }
    processedIncomingMsgIds.current.add(dedupeKey)

    if (processedIncomingMsgIds.current.size > 300) {
      const entries = Array.from(processedIncomingMsgIds.current)
      processedIncomingMsgIds.current = new Set(entries.slice(-150))
    }

    // ======================== CHANNEL MESSAGE ========================
    if (isChannelMessage(msg)) {
      console.log('Processing channel message:', msg)

      const newMessage: Message = {
        id: String(msg.channelMessageId),
        senderId: msg.senderId,
        senderName: msg.senderFullName,
        senderAvatar: msg.senderProfilePicture,
        text: msg.messageText,
        time: formatTime(msg.createdAt),
        isOwn: msg.senderId === currentUserId,
        senderUsername: msg.senderUsername,
        senderProfilePicture: msg.senderProfilePicture,
        mediaUrl: msg.mediaUrl || undefined,
        messageType: msg.messageType as 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' | 'PAYMENT' | 'PAYMENT_REQUEST' | 'PAYMENT_DECLINE' | 'CODE',
        isEdited: msg.isEdited === 'Y',
        conversationId: msg.channelId,
      }

      const channelConversationId = `channel-${msg.channelId}`
      const selectedConvId = localStorage.getItem('selectedConversationId')
      const isCurrentConversation = channelConversationId === selectedConvId

      if (isCurrentConversation) {
        console.log('Adding channel message to current conversation')
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMessage.id)
          if (exists) return prev
          return [...prev, newMessage]
        })
      }

      setConversations(prev => {
        const index = prev.findIndex(conv => conv.id === channelConversationId || conv.channelId === msg.channelId)
        if (index === -1) return prev

        const updatedConv = {
          ...prev[index],
          lastMessage: msg.messageText,
          // lastMessageId: msg.messageId,
          time: 'Just now',
          unread: (msg.senderId !== currentUserId && !isCurrentConversation)
            ? prev[index].unread + 1
            : (isCurrentConversation ? 0 : prev[index].unread)
        }

        const newList = prev.filter((_, i) => i !== index)
        return [updatedConv, ...newList]
      })

    } else {
      // ======================== DIRECT/GROUP MESSAGE ========================
      console.log('Processing direct/group message:', msg)

      let paymentData: PaymentMessageData | undefined = undefined
      const isPaymentMessage = msg.messageType === 'PAYMENT' || msg.messageType === 'PAYMENT_REQUEST' || msg.messageType === 'PAYMENT_DECLINE'

      if (isPaymentMessage && msg.paymentData) {
        const paymentType: PaymentType = msg.messageType === 'PAYMENT_REQUEST' || msg.messageType === 'PAYMENT_DECLINE' ? 'REQUEST' : 'SEND'

        let paymentStatus: PaymentStatus
        if (msg.paymentData.status) {
          paymentStatus = msg.paymentData.status as PaymentStatus
        } else if (msg.messageType === 'PAYMENT_DECLINE') {
          paymentStatus = 'DECLINED'
        } else if (msg.messageType === 'PAYMENT_REQUEST') {
          paymentStatus = 'PENDING'
        } else {
          paymentStatus = 'COMPLETED'
        }

        let paymentSenderId: string
        let paymentReceiverId: string

        if (msg.messageType === 'PAYMENT_REQUEST' || msg.messageType === 'PAYMENT_DECLINE') {
          paymentSenderId = String(msg.senderId)
          paymentReceiverId = currentUserId
        } else {
          paymentSenderId = msg.paymentData.senderId ? String(msg.paymentData.senderId) : String(msg.senderId)
          paymentReceiverId = msg.paymentData.receiverId ? String(msg.paymentData.receiverId) : currentUserId
        }

        let senderName: string
        let receiverName: string

        if (msg.messageType === 'PAYMENT_REQUEST' || msg.messageType === 'PAYMENT_DECLINE') {
          senderName = msg.senderFullName || msg.paymentData.senderName || 'Unknown'
          receiverName = String(msg.senderId) === currentUserId ? 'You' : (msg.paymentData.receiverName || 'You')
        } else {
          senderName = msg.paymentData.senderName || msg.senderFullName || 'Unknown'
          receiverName = msg.paymentData.receiverName || 'You'
        }

        paymentData = {
          paymentId: String(msg.paymentData.paymentId || msg.messageId),
          messageId: msg.messageId,
          amount: msg.paymentData.amount || 0,
          type: (msg.paymentData.type as PaymentType) || paymentType,
          status: paymentStatus,
          senderId: paymentSenderId,
          receiverId: paymentReceiverId,
          senderName: senderName,
          receiverName: receiverName,
          createdAt: msg.paymentData.createdAt || msg.createdAt || new Date().toISOString(),
          conversationId: msg.conversationId,
          currency: msg.paymentData.currency || 'USDB',
        }
      }

      const newMessage: Message = {
        id: msg.messageId ? String(msg.messageId) : `temp-${Date.now()}`,
        senderId: String(msg.senderId),
        senderName: msg.senderFullName,
        senderAvatar: msg.senderProfilePicture,
        text: msg.messageText,
        time: msg.createdAt ? formatTime(msg.createdAt) : 'Just now',
        isOwn: String(msg.senderId) === currentUserId,
        senderUsername: msg.senderUsername,
        senderProfilePicture: msg.senderProfilePicture,
        mediaUrl: msg.mediaUrl || undefined,
        messageType: msg.messageType as 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' | 'PAYMENT' | 'PAYMENT_REQUEST' | 'PAYMENT_DECLINE' | 'CODE',
        conversationId: msg.conversationId,
        paymentData: paymentData,
      }

      const selectedConvId = localStorage.getItem('selectedConversationId')
      const isCurrentConversation = String(msg.conversationId) === selectedConvId

      if (isCurrentConversation) {
        console.log('Adding message to current conversation')
        setMessages(prev => {
          const exists = prev.some(m => m.id === newMessage.id)
          if (exists) return prev
          return [...prev, newMessage]
        })
      }

      // Update conversation list — move to top
      setConversations(prev => {
        const index = prev.findIndex(conv => conv.id === String(msg.conversationId))
        if (index === -1) return prev

        const updatedConv = {
          ...prev[index],
          lastMessage: msg.messageText,
          lastMessageId: msg.messageId,
          time: 'Just now',
          unread: (String(msg.senderId) !== currentUserId && !isCurrentConversation)
            ? prev[index].unread + 1
            : (isCurrentConversation ? 0 : prev[index].unread)
        }

        const newList = prev.filter((_, i) => i !== index)
        return [updatedConv, ...newList]
      })

      // ====================================================================
      // FIX: AUTO-READ — If user is viewing this conversation, mark as read
      // using BOTH the STOMP receipt AND the REST API.
      //
      // The STOMP receipt notifies other clients in real-time.
      // The REST API ensures the server-side unread count is actually
      // persisted, so on page reload the message shows as read.
      // ====================================================================
      if (String(msg.senderId) !== currentUserId && isCurrentConversation) {
        console.log('📖 Auto-reading message in current conversation:', msg.messageId)

        // 1. Send STOMP read receipt (real-time notification to other clients)
        if (msg.messageId) {
          setTimeout(() => sendReadReceipt(msg.conversationId, msg.messageId!), 300)
        }

        // 2. Call REST API to mark message as read on the server
        //    This is the critical part — without this, the server still
        //    considers the message unread on page reload.
        // 2. Call REST API using fetchWithAuth (handles auth properly)
if (msg.messageId) {
  fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/messaging/readMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId: msg.conversationId,
      userId: parseInt(currentUserId),
      upToMessageId: msg.messageId,
    }),
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        console.log('✅ REST API: Message marked as read:', msg.messageId)
      } else {
        console.warn('⚠️ REST API: Failed to mark as read:', result.message)
      }
    })
    .catch(err => console.error('❌ REST API: Error marking as read:', err))
}

        // 3. Tell MessagingContext (prevents TopNav badge from incrementing)
        //    Note: The context's handleMessageNotification already skips
        //    incrementing for the current conversation, but this is a safety net.
        //    We DON'T call markConversationAsRead here because that would
        //    decrement the count (which was never incremented in the first place).
        //    Instead, we just reset to 0 if somehow the count crept up.
        // resetCount()  // Uncomment if you still see ghost counts
      }
    }
  }, [currentUserId, selectedConversation, sendReadReceipt])
  



  // Handle typing event
  const handleTypingEvent = useCallback((event: TypingEvent) => {
    const userId = String(event.userId)

    if (event.isTyping) {
      setTypingUsers(prev => new Set(prev).add(userId))

      // Clear typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      }, 3000)
    } else {
      setTypingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }, [])

  // Handle read receipt
  const handleReadReceipt = useCallback((event: unknown) => {
    console.log('Message read:', event)
    // You can implement visual feedback here (e.g., blue checkmarks)
  }, [])

  // Handle notification
  const handleNotification = useCallback((notification: unknown) => {
    console.log('Notification:', notification)
    // showSnackbar(notification.message || 'New notification', 'info')
  }, [])

  // Send message via WebSocket

  // Find this function around line 1017 and replace it:
  // Send message via WebSocket
  const sendMessageViaSocket = useCallback((
    conversationId: string,
    messageText: string,
    mediaUrl?: string,
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' = 'TEXT',
    channelId?: number
  ) => {
    if (!stompClient || !stompClient.connected) {
      showSnackbar('Not connected to real-time messaging', 'error')
      return false
    }

    try {
      // Check if this is a channel message
      if (channelId) {
        // Channel message payload and destination
        const channelMessageRequest = {
          channelId: channelId,
          senderId: parseInt(currentUserId),
          messageText: messageText,
          messageType: messageType,
          mediaUrl: mediaUrl || null
        }

        stompClient.publish({
          destination: '/app/channel/message/send',
          body: JSON.stringify(channelMessageRequest)
        })

        console.log('Channel message sent via socket:', channelMessageRequest)
      } else {
        // Direct/Group message payload and destination
        const messageRequest: SocketMessage = {
          conversationId: parseInt(conversationId),
          senderId: parseInt(currentUserId),
          receiverId: 0, // Will be determined by server
          messageText: messageText,
          messageType: messageType,
          mediaUrl: mediaUrl || null,
          replyToMessageId: null
        }

        stompClient.publish({
          destination: '/app/message/send',
          body: JSON.stringify(messageRequest)
        })

        console.log('Message sent via socket:', messageRequest)
      }

      return true
    } catch (error) {
      console.error('Error sending message via socket:', error)
      showSnackbar('Failed to send message', 'error')
      return false
    }
  }, [stompClient, currentUserId])


  // Send typing event
  const sendTypingEvent = useCallback((isTyping: boolean) => {
    if (!stompClient || !stompClient.connected || !selectedConversation) {
      return
    }

    const typingEvent: TypingEvent = {
      userId: parseInt(currentUserId),
      conversationId: parseInt(selectedConversation),
      isTyping: isTyping
    }

    try {
      stompClient.publish({
        destination: '/app/typing',
        body: JSON.stringify(typingEvent)
      })
    } catch (error) {
      console.error('Error sending typing event:', error)
    }
  }, [stompClient, selectedConversation, currentUserId])



  // Subscribe to conversation when selected conversation changes
  // Subscribe to conversation when selected conversation changes
  useEffect(() => {
    if (stompClient && stompClient.connected && selectedConversation) {
      // Check if it's a channel
      const isChannel = selectedConversation.startsWith('channel-')

      if (isChannel) {
        // Subscribe to channel messages
        const channelId = selectedConversation.replace('channel-', '')
        const subscription = stompClient.subscribe(
          `/topic/channel/${channelId}`,
          (message) => {
            console.log('Channel message received on topic:', message.body)
            try {
              const msg: ChannelSocketMessage = JSON.parse(message.body)
              handleIncomingMessage(msg)
            } catch (e) {
              console.error('Failed to parse channel message:', e)
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      } else {
        // Subscribe to conversation messages (direct/group)
        const subscription = stompClient.subscribe(
          `/topic/messages/${selectedConversation}`,
          (message) => {
            console.log('Message received on topic:', message.body)
            try {
              const msg: SocketMessage = JSON.parse(message.body)
              handleIncomingMessage(msg)
            } catch (e) {
              console.error('Failed to parse message:', e)
            }
          }
        )

        return () => {
          subscription.unsubscribe()
        }
      }
    }
  }, [stompClient, selectedConversation, handleIncomingMessage])

  // Connect to WebSocket on mount
  useEffect(() => {
    connectWebSocket()
    setTimeout(() => {
      loadActiveUsers()
    }, 1000)

    return () => {
      disconnectWebSocket()
    }


  }, [])


  // Periodically refresh active users
  useEffect(() => {
    if (isSocketConnected) {
      // Load immediately when connected
      loadActiveUsers()

      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadActiveUsers()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isSocketConnected, loadActiveUsers])

  // Check if a user is active
  // Check if a user is active - converts everything to string for comparison
  const isUserActive = useCallback((userId: string | number | undefined | null): boolean => {
    if (userId === undefined || userId === null) return false
    const stringUserId = String(userId)
    return activeUsers.has(stringUserId)
  }, [activeUsers])

  // Check connection status
  useEffect(() => {
    if (stompClient) {
      setIsSocketConnected(stompClient.connected)
    }
  }, [stompClient])

  useEffect(() => {
    handleEmojiPickerClose()
  }, [selectedConversation])

  // Handle emoji selection
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessageText(prev => prev + emojiData.emoji)
    messageInputRef.current?.focus()
  }

  // Handle emoji picker toggle
  const handleEmojiPickerToggle = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiPickerAnchor(event.currentTarget)
    setShowEmojiPicker(prev => !prev)
  }

  // Handle emoji picker close
  const handleEmojiPickerClose = () => {
    setShowEmojiPicker(false)
    setEmojiPickerAnchor(null)
  }

  // Fetch pending channel invitations
  const fetchPendingChannelInvitations = async () => {
    setIsLoadingChannelInvitations(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/getPendingInvitations/${currentUserId}`

      const response = await fetchWithAuth(url)
      const result: PendingChannelInvitationsResponse = await response.json()

      if (result.success && result.data) {
        setChannelInvitations(result.data)
      } else {
        setChannelInvitations([])
      }
    } catch (error) {
      console.error('Error fetching channel invitations:', error)
      showSnackbar('Failed to load channel invitations', 'error')
      setChannelInvitations([])
    } finally {
      setIsLoadingChannelInvitations(false)
    }
  }

  // Accept channel invitation
  const acceptChannelInvitation = async (invitationId: number) => {
    setIsProcessingChannelInvitation(invitationId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/invitation/accept'

      const payload = {
        invitationId: String(invitationId),
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: AcceptRejectChannelInvitationResponse = await response.json()

      if (result.success && result.data) {
        setChannelInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId))
        showSnackbar('Channel invitation accepted', 'success')
        // Refresh channels list to show the newly joined channel
        await fetchUserChannels()
      } else {
        showSnackbar(result.message || 'Failed to accept channel invitation', 'error')
      }
    } catch (error) {
      console.error('Error accepting channel invitation:', error)
      showSnackbar('Failed to accept channel invitation', 'error')
    } finally {
      setIsProcessingChannelInvitation(null)
    }
  }

  // Reject channel invitation
  const rejectChannelInvitation = async (invitationId: number) => {
    setIsProcessingChannelInvitation(-invitationId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/invitation/reject'

      const payload = {
        invitationId: String(invitationId),
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: AcceptRejectChannelInvitationResponse = await response.json()

      if (result.success && result.data) {
        setChannelInvitations(prev => prev.filter(inv => inv.invitationId !== invitationId))
        showSnackbar('Channel invitation rejected', 'info')
      } else {
        showSnackbar(result.message || 'Failed to reject channel invitation', 'error')
      }
    } catch (error) {
      console.error('Error rejecting channel invitation:', error)
      showSnackbar('Failed to reject channel invitation', 'error')
    } finally {
      setIsProcessingChannelInvitation(null)
    }
  }

  const handleAcceptChannelInvitation = (invitationId: number) => {
    acceptChannelInvitation(invitationId)
  }

  const handleRejectChannelInvitation = (invitationId: number) => {
    rejectChannelInvitation(invitationId)
  }

  // ========== END WEBSOCKET FUNCTIONS ==========

  // Transform API conversation to component format
  // Transform API conversation to component format
  const transformAPIConversation = (apiConv: APIConversation): Conversation => {
    const type: ConversationType =
      (apiConv.conversationType === 'DIRECT' || apiConv.conversationType === 'PRIVATE') ? 'direct' :
        apiConv.conversationType === 'GROUP' ? 'group' :
          'channel'

    const participants: Participant[] | undefined = apiConv.participants
      ? (apiConv.participants as unknown as Participant[])
      : undefined

    // Get current user ID
    const currentUserIdStr = localStorage.getItem('childUserId') || ''

    // Determine the OTHER user's ID for direct conversations
    let otherUserId: number = apiConv.userId
    let conversationName = apiConv.conversationName
    let conversationAvatar: string | undefined = apiConv.conversationImage || undefined

    if (type === 'direct') {
      // For search results (conversationId is null), userId IS the other user's ID
      if (apiConv.conversationId === null) {
        otherUserId = apiConv.userId
        // Name and avatar are already correct from API
      }
      // For existing conversations, need to find the OTHER participant
      else {
        // Try otherParticipant first
        if (apiConv.otherParticipant && Object.keys(apiConv.otherParticipant).length > 0) {
          const otherPart = apiConv.otherParticipant as {
            userId?: number | string
            fullName?: string
            profilePicture?: string
          }
          if (otherPart.userId) {
            otherUserId = typeof otherPart.userId === 'string'
              ? parseInt(otherPart.userId)
              : otherPart.userId
          }
          if (otherPart.fullName) conversationName = otherPart.fullName
          if (otherPart.profilePicture) conversationAvatar = otherPart.profilePicture
        }
        // Try participants array
        else if (participants && participants.length > 0) {
          const otherParticipant = participants.find(p => String(p.userId) !== currentUserIdStr)
          if (otherParticipant) {
            otherUserId = parseInt(String(otherParticipant.userId))
            conversationName = otherParticipant.fullName || conversationName
            conversationAvatar = otherParticipant.profilePicture || conversationAvatar
          }
        }
      }
    }

    // Generate unique ID - IMPORTANT: Use unique ID for each search result
    const id = apiConv.conversationId !== null && apiConv.conversationId > 0
      ? String(apiConv.conversationId)
      : `temp-${otherUserId}`

    return {
      id: id,
      name: conversationName,
      type: type,
      avatar: conversationAvatar,
      avatarColor: '#9ca3af',
      lastMessage: apiConv.lastMessage?.messageText || 'No messages yet',
      lastMessageId: apiConv.lastMessage?.messageId || undefined,
      time: apiConv.lastMessage ? formatTime(apiConv.lastMessage.createdAt) : '',
      unread: apiConv.unreadCount || 0,
      isActive: false,
      canSendMessage: true,
      userId: otherUserId,
      conversationId: apiConv.conversationId,
      memberCount: participants?.length || 0,
      participants: participants,
    }
  }

  // Transform API channel to component format
  const transformAPIChannel = (apiChannel: APIChannel): Conversation => {
    return {
      id: `channel-${apiChannel.channelId}`,
      name: apiChannel.channelName,
      type: 'channel',
      avatar: apiChannel.channelImage || undefined,
      avatarColor: apiChannel.channelType === 'PUBLIC' ? '#10b981' : '#f59e0b',
      lastMessage: apiChannel.latestMessage?.messageText || 'No messages yet',
      time: apiChannel.latestMessage ? formatTime(apiChannel.latestMessage.createdAt) : '',
      unread: 0,
      isActive: apiChannel.isActive === 'Y',
      isAdmin: apiChannel.isAdmin === 'Y',
      description: apiChannel.channelDescription,
      creatorId: String(apiChannel.ownerId),
      isPublic: apiChannel.channelType === 'PUBLIC',
      memberCount: apiChannel.subscriberCount,
      canSendMessage: apiChannel.isOwner === 'Y' || apiChannel.isAdmin === 'Y',
      channelId: apiChannel.channelId,
      ownerId: String(apiChannel.ownerId),
      isOwner: apiChannel.isOwner === 'Y',
      isSubscribed: apiChannel.isSubscribed === 'Y',
      subscriberCount: apiChannel.subscriberCount,
    }
  }

  // Transform API message to component format
  const transformAPIMessage = (apiMsg: APIMessage): Message => {
    const isPaymentMessage = apiMsg.messageType === 'PAYMENT' || apiMsg.messageType === 'PAYMENT_REQUEST' || apiMsg.messageType === 'PAYMENT_DECLINE'

    let paymentData: PaymentMessageData | undefined = undefined

    if (isPaymentMessage && apiMsg.paymentData) {
      // Derive type from messageType if not provided
      const paymentType: PaymentType = apiMsg.messageType === 'PAYMENT_REQUEST' || apiMsg.messageType === 'PAYMENT_DECLINE' ? 'REQUEST' : 'SEND'

      // Use status from API paymentData, or derive from messageType
      let paymentStatus: PaymentStatus
      if (apiMsg.paymentData.status) {
        paymentStatus = apiMsg.paymentData.status as PaymentStatus
      } else if (apiMsg.messageType === 'PAYMENT_DECLINE') {
        paymentStatus = 'DECLINED'
      } else if (apiMsg.messageType === 'PAYMENT_REQUEST') {
        paymentStatus = 'PENDING'
      } else {
        paymentStatus = 'COMPLETED'
      }

      // For PAYMENT_REQUEST: 
      // - The message senderId (apiMsg.senderId) is the REQUESTER (who wants money)
      // - The receiverId should be the OTHER person in the conversation (who needs to pay)

      let paymentSenderId: string
      let paymentReceiverId: string

      if (apiMsg.messageType === 'PAYMENT_REQUEST' || apiMsg.messageType === 'PAYMENT_DECLINE') {
        // For payment requests: message sender is the requester
        paymentSenderId = apiMsg.senderId  // The person who requested money
        paymentReceiverId = currentUserId   // The current user (who needs to pay if not own message)
      } else {
        // For PAYMENT (send): message sender is the payer
        paymentSenderId = apiMsg.paymentData.senderId ? String(apiMsg.paymentData.senderId) : apiMsg.senderId
        paymentReceiverId = apiMsg.paymentData.receiverId ? String(apiMsg.paymentData.receiverId) : currentUserId
      }

      // Determine sender and receiver names
      let senderName: string
      let receiverName: string

      if (apiMsg.messageType === 'PAYMENT_REQUEST' || apiMsg.messageType === 'PAYMENT_DECLINE') {
        // For payment requests: sender is the requester
        senderName = apiMsg.senderFullName || apiMsg.paymentData.senderName || 'Unknown'
        receiverName = apiMsg.senderId === currentUserId ? 'You' : (apiMsg.paymentData.receiverName || 'You')
      } else {
        // For PAYMENT: sender is the payer
        senderName = apiMsg.paymentData.senderName || apiMsg.senderFullName || 'Unknown'
        receiverName = apiMsg.paymentData.receiverName || 'You'
      }

      paymentData = {
        paymentId: String(apiMsg.paymentData.paymentId || apiMsg.messageId),
        messageId: apiMsg.messageId,
        amount: apiMsg.paymentData.amount || 0,
        type: (apiMsg.paymentData.type as PaymentType) || paymentType,
        status: paymentStatus,
        senderId: paymentSenderId,
        receiverId: paymentReceiverId,
        senderName: senderName,
        receiverName: receiverName,
        createdAt: apiMsg.paymentData.createdAt || apiMsg.createdAt,
        conversationId: apiMsg.conversationId,
        currency: apiMsg.paymentData.currency || 'USDB',
      }
    }

    return {
      id: String(apiMsg.messageId),
      senderId: apiMsg.senderId,
      senderName: apiMsg.senderFullName,
      senderAvatar: apiMsg.senderProfilePicture,
      text: apiMsg.messageText,
      time: formatTime(apiMsg.createdAt),
      isOwn: apiMsg.senderId === currentUserId,
      senderUsername: apiMsg.senderUsername,
      senderProfilePicture: apiMsg.senderProfilePicture,
      isEdited: apiMsg.isEdited === 'Y',
      mediaUrl: apiMsg.mediaUrl || undefined,
      messageType: apiMsg.messageType as 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' | 'PAYMENT' | 'PAYMENT_REQUEST' | 'PAYMENT_DECLINE' | 'CODE',
      conversationId: apiMsg.conversationId,
      paymentData: paymentData,
    }
  }

  // Upload media file
  const uploadMediaFiles = async (files: File[]): Promise<string | null> => {
    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('userId', currentUserId)
      // Append all files under the 'files' key (matches Postman screenshot)
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/messaging/upload/media',
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (result.success && result.data) {
        // result.data is an array of uploaded file objects
        const dataArray = Array.isArray(result.data) ? result.data : [result.data]
        const urls = dataArray.map((item: { fileUrl: string }) => item.fileUrl)
        const commaSeparatedUrls = urls.join(',')

        showSnackbar(`${files.length} file(s) uploaded successfully`, 'success')
        return commaSeparatedUrls  // e.g. "url1,url2,url3"
      } else {
        showSnackbar(result.message || 'Failed to upload files', 'error')
        return null
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      showSnackbar('Failed to upload files', 'error')
      return null
    } finally {
      setIsUploadingFile(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    const totalFiles = selectedFiles.length + newFiles.length

    if (totalFiles > MAX_FILES) {
      showSnackbar(`You can only send up to ${MAX_FILES} files at a time`, 'warning')
      // Reset input so same files can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB per file
    const validFiles: File[] = []

    for (const file of newFiles) {
      if (file.size > maxSize) {
        showSnackbar(`"${file.name}" exceeds 10MB limit and was skipped`, 'error')
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Final check after validation
    if (selectedFiles.length + validFiles.length > MAX_FILES) {
      showSnackbar(`You can only send up to ${MAX_FILES} files at a time`, 'warning')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFiles(prev => [...prev, ...validFiles])

    // Generate previews for image files
    validFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      } else {
        // Empty string = no preview (video/document)
        setFilePreviews(prev => [...prev, ''])
      }
    })

    // Reset input so same files can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Clear selected file
  const handleClearFiles = () => {
    setSelectedFiles([])
    setFilePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove a single file by index
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Fetch user followers and following for group creation
  const fetchUserFollowers = async () => {
    setIsLoadingUsers(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/getUserFollowers/${currentUserId}`

      const response = await fetchWithAuth(url)
      const result: UserFollowersResponse = await response.json()

      if (result.success && result.data) {
        const allUsers = [...result.data.followerList, ...result.data.followingList]
        const uniqueUsers = allUsers.filter((user, index, self) =>
          index === self.findIndex(u => u.userId === user.userId)
        )

        const members: Member[] = uniqueUsers.map(user => ({
          id: String(user.userId),
          name: user.fullName,
          avatar: user.profilePicture || user.fullName[0],
          avatarColor: '#9ca3af',
          username: user.username,
          profilePicture: user.profilePicture,
          isActive: user.isActive,
        }))

        setAvailableUsers(members)
      } else {
        setAvailableUsers([])
      }
    } catch (error) {
      console.error('Error fetching user followers:', error)
      showSnackbar('Failed to load users', 'error')
      setAvailableUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Create group via API
  const createGroupAPI = async (groupName: string, groupImage: string, participantIds: number[]) => {
    setIsCreatingGroup(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/createGroup'

      const payload = {
        userId: parseInt(currentUserId),
        groupName: groupName,
        groupImage: groupImage || '',
        participantIds: participantIds
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: CreateGroupResponse = await response.json()

      if (result.success && result.data) {
        const newGroup: Conversation = {
          id: String(result.data.conversationId),
          name: result.data.conversationName || groupName,
          type: 'group',
          avatar: result.data.conversationImage || undefined,
          avatarColor: '#1e40af',
          lastMessage: 'Group created',
          time: 'Now',
          unread: 0,
          conversationId: result.data.conversationId,
          memberCount: result.data.participants.length,
          canSendMessage: true,
          participants: result.data.participants,
        }

        setConversations(prev => [newGroup, ...prev])
        showSnackbar('Group created successfully!', 'success')
        return true
      } else {
        showSnackbar(result.message || 'Failed to create group', 'error')
        return false
      }
    } catch (error) {
      console.error('Error creating group:', error)
      showSnackbar('Failed to create group', 'error')
      return false
    } finally {
      setIsCreatingGroup(false)
    }
  }

  // ========== CHANNEL API FUNCTIONS ==========

  // Create channel via API
  const createChannelAPI = async (
    channelName: string,
    channelDescription: string,
    channelType: 'PUBLIC' | 'PRIVATE',
    channelImage: string
  ) => {
    setIsCreatingChannel(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/create'

      const payload = {
        channelName: channelName,
        channelDescription: channelDescription,
        channelType: channelType,
        channelImage: channelImage || '',
        ownerId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: CreateChannelResponse = await response.json()

      if (result.success && result.data) {
        const newChannel = transformAPIChannel(result.data)

        setConversations(prev => [newChannel, ...prev])
        showSnackbar('Channel created successfully!', 'success')
        return true
      } else {
        showSnackbar(result.message || 'Failed to create channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error creating channel:', error)
      showSnackbar('Failed to create channel', 'error')
      return false
    } finally {
      setIsCreatingChannel(false)
    }
  }

  // Fetch user channels (subscribed channels)
  const fetchUserChannels = async () => {
    setIsLoadingChannels(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/user/${currentUserId}?page=0&size=20`

      const response = await fetchWithAuth(url)
      const result: GetChannelsResponse = await response.json()

      if (result.success && result.data) {
        const channels = result.data.map(transformAPIChannel)

        // Merge with existing conversations (remove old channels and add new ones)
        setConversations(prev => {
          const nonChannels = prev.filter(c => c.type !== 'channel')
          return [...nonChannels, ...channels]
        })
      }
    } catch (error) {
      console.error('Error fetching user channels:', error)
      showSnackbar('Failed to load channels', 'error')
    } finally {
      setIsLoadingChannels(false)
    }
  }

  // Fetch owned channels
  const fetchOwnedChannels = async () => {
    setIsLoadingChannels(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/owned/${currentUserId}?page=0&size=20`

      const response = await fetchWithAuth(url)
      const result: GetChannelsResponse = await response.json()

      if (result.success && result.data) {
        const channels = result.data.map(transformAPIChannel)

        // Merge with existing conversations
        setConversations(prev => {
          const nonChannels = prev.filter(c => c.type !== 'channel')
          return [...nonChannels, ...channels]
        })
      }
    } catch (error) {
      console.error('Error fetching owned channels:', error)
      showSnackbar('Failed to load owned channels', 'error')
    } finally {
      setIsLoadingChannels(false)
    }
  }

  // Get channel by ID
  const getChannelById = async (channelId: number) => {
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/${channelId}/${currentUserId}`

      const response = await fetchWithAuth(url)
      const result: GetChannelResponse = await response.json()

      if (result.success && result.data) {
        return transformAPIChannel(result.data)
      }
      return null
    } catch (error) {
      console.error('Error fetching channel:', error)
      return null
    }
  }

  // Search channels by query
  const searchChannels = async (query: string) => {
    if (!query.trim()) {
      return []
    }

    setIsSearchingChannels(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/search?q=${encodeURIComponent(query)}&userId=${currentUserId}&page=0&size=20`

      const response = await fetchWithAuth(url)
      const result: SearchChannelsResponse = await response.json()

      if (result.success && result.data) {
        return result.data.map(transformAPIChannel)
      }
      return []
    } catch (error) {
      console.error('Error searching channels:', error)
      return []
    } finally {
      setIsSearchingChannels(false)
    }
  }

  // Discover unsubscribed public channels
  const discoverChannels = async () => {
    setIsSearchingChannels(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/discover/${currentUserId}?page=0&size=20`

      const response = await fetchWithAuth(url)
      const result: DiscoverChannelsResponse = await response.json()

      if (result.success && result.data) {
        const channels = result.data.map(transformAPIChannel)
        setDiscoveredChannels(channels)
        return channels
      }
      return []
    } catch (error) {
      console.error('Error discovering channels:', error)
      return []
    } finally {
      setIsSearchingChannels(false)
    }
  }

  // Subscribe to channel
  const subscribeToChannel = async (channelId: number) => {
    setIsSubscribing(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/subscribe/${channelId}?userId=${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'POST',
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Subscribed to channel successfully', 'success')

        // Update conversation list
        setConversations(prev => prev.map(conv => {
          if (conv.channelId === channelId) {
            return {
              ...conv,
              isSubscribed: true,
              subscriberCount: (conv.subscriberCount || 0) + 1
            }
          }
          return conv
        }))

        // Update discovered channels
        setDiscoveredChannels(prev => prev.map(conv => {
          if (conv.channelId === channelId) {
            return {
              ...conv,
              isSubscribed: true,
              subscriberCount: (conv.subscriberCount || 0) + 1
            }
          }
          return conv
        }))

        return true
      } else {
        showSnackbar(result.message || 'Failed to subscribe to channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error subscribing to channel:', error)
      showSnackbar('Failed to subscribe to channel', 'error')
      return false
    } finally {
      setIsSubscribing(false)
    }
  }

  // Unsubscribe from channel
  const unsubscribeFromChannel = async (channelId: number) => {
    setIsUnsubscribing(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/unsubscribe/${channelId}?userId=${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'POST',
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Unsubscribed from channel', 'success')

        // Update conversation list
        setConversations(prev => prev.map(conv => {
          if (conv.channelId === channelId) {
            return {
              ...conv,
              isSubscribed: false,
              subscriberCount: Math.max((conv.subscriberCount || 1) - 1, 0)
            }
          }
          return conv
        }))

        // If this was the selected conversation, deselect it
        if (selectedConversation === `channel-${channelId}`) {
          setSelectedConversation(null)
          setSelectedConvCache(null)
        }

        return true
      } else {
        showSnackbar(result.message || 'Failed to unsubscribe from channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error unsubscribing from channel:', error)
      showSnackbar('Failed to unsubscribe from channel', 'error')
      return false
    } finally {
      setIsUnsubscribing(false)
    }
  }

  // Get channel subscribers
  const getChannelSubscribers = async (channelId: number) => {
    setIsLoadingSubscribers(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/subscribers/${channelId}`

      const response = await fetchWithAuth(url, {
        method: 'GET',
      })

      const result: GetChannelSubscribersResponse = await response.json()

      if (result.success && result.data) {
        setChannelSubscribers(result.data)
        return result.data
      } else {
        setChannelSubscribers([])
        return []
      }
    } catch (error) {
      console.error('Error fetching channel subscribers:', error)
      showSnackbar('Failed to load subscribers', 'error')
      setChannelSubscribers([])
      return []
    } finally {
      setIsLoadingSubscribers(false)
    }
  }

  // Promote subscriber to admin
  const promoteToAdmin = async (channelId: number, userId: number) => {
    setIsPromotingAdmin(userId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/promoteToAdmin'

      const payload = {
        channelId: channelId,
        ownerId: parseInt(currentUserId),
        userId: userId
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('User promoted to admin', 'success')

        // Refresh subscribers list
        await getChannelSubscribers(channelId)

        return true
      } else {
        showSnackbar(result.message || 'Failed to promote user', 'error')
        return false
      }
    } catch (error) {
      console.error('Error promoting user to admin:', error)
      showSnackbar('Failed to promote user', 'error')
      return false
    } finally {
      setIsPromotingAdmin(null)
    }
  }

  // Remove subscriber from channel
  const removeSubscriber = async (channelId: number, userId: number) => {
    setIsRemovingSubscriber(userId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/removeSubscriber'

      const payload = {
        channelId: channelId,
        ownerId: parseInt(currentUserId),
        userId: userId
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Subscriber removed', 'success')

        // Update conversation list
        setConversations(prev => prev.map(conv => {
          if (conv.channelId === channelId) {
            return {
              ...conv,
              subscriberCount: Math.max((conv.subscriberCount || 1) - 1, 0)
            }
          }
          return conv
        }))

        // Refresh subscribers list
        await getChannelSubscribers(channelId)

        return true
      } else {
        showSnackbar(result.message || 'Failed to remove subscriber', 'error')
        return false
      }
    } catch (error) {
      console.error('Error removing subscriber:', error)
      showSnackbar('Failed to remove subscriber', 'error')
      return false
    } finally {
      setIsRemovingSubscriber(null)
    }
  }

  // Mute channel
  const muteChannel = async (channelId: number) => {
    setIsMutingChannel(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/muteChannel'

      const payload = {
        channelId: channelId,
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Channel muted', 'success')
        setChannelMuted(true)
        return true
      } else {
        showSnackbar(result.message || 'Failed to mute channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error muting channel:', error)
      showSnackbar('Failed to mute channel', 'error')
      return false
    } finally {
      setIsMutingChannel(false)
    }
  }

  // Unmute channel
  const unmuteChannel = async (channelId: number) => {
    setIsMutingChannel(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/unmuteChannel'

      const payload = {
        channelId: channelId,
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: ChannelActionResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Channel unmuted', 'success')
        setChannelMuted(false)
        return true
      } else {
        showSnackbar(result.message || 'Failed to unmute channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error unmuting channel:', error)
      showSnackbar('Failed to unmute channel', 'error')
      return false
    } finally {
      setIsMutingChannel(false)
    }
  }

  // Delete channel
  const deleteChannel = async (channelId: number) => {
    setIsDeletingChannel(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/${channelId}/${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'DELETE',
      })

      const result: DeleteChannelResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Channel deleted successfully', 'success')

        // Remove channel from conversations
        setConversations(prev => prev.filter(conv => conv.channelId !== channelId))

        // Clear selection if this was the selected channel
        if (selectedConversation === `channel-${channelId}`) {
          setSelectedConversation(null)
          setSelectedConvCache(null)
        }

        return true
      } else {
        showSnackbar(result.message || 'Failed to delete channel', 'error')
        return false
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
      showSnackbar('Failed to delete channel', 'error')
      return false
    } finally {
      setIsDeletingChannel(false)
    }
  }

  // Get channel settings
  const getChannelSettings = async (channelId: number) => {
    setIsLoadingSettings(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/settings/${channelId}?userId=${currentUserId}`

      const response = await fetchWithAuth(url)
      const result: GetChannelSettingsResponse = await response.json()

      if (result.success && result.data) {
        setChannelSettings(result.data)

        // Update form states
        setAllowSubscriberPosts(result.data.allowSubscriberPosts === 'Y')
        setRequireApproval(result.data.requireApproval === 'Y')
        setAllowComments(result.data.allowComments === 'Y')
        setAllowReactions(result.data.allowReactions === 'Y')
        setIsDiscoverable(result.data.isDiscoverable === 'Y')

        return result.data
      } else {
        showSnackbar(result.message || 'Failed to load channel settings', 'error')
        return null
      }
    } catch (error) {
      console.error('Error fetching channel settings:', error)
      showSnackbar('Failed to load channel settings', 'error')
      return null
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // Update channel settings
  const updateChannelSettings = async (channelId: number) => {
    setIsUpdatingSettings(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/settings/update'

      const payload = {
        channelId: channelId,
        ownerId: parseInt(currentUserId),
        allowSubscriberPosts: allowSubscriberPosts ? 'Y' : 'N',
        requireApproval: requireApproval ? 'Y' : 'N',
        allowComments: allowComments ? 'Y' : 'N',
        allowReactions: allowReactions ? 'Y' : 'N',
        isDiscoverable: isDiscoverable ? 'Y' : 'N'
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: UpdateChannelSettingsResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Channel settings updated successfully', 'success')
        setChannelSettings(result.data)
        return true
      } else {
        showSnackbar(result.message || 'Failed to update channel settings', 'error')
        return false
      }
    } catch (error) {
      console.error('Error updating channel settings:', error)
      showSnackbar('Failed to update channel settings', 'error')
      return false
    } finally {
      setIsUpdatingSettings(false)
    }
  }

  // Invite users to channel
  const inviteUsersToChannel = async (channelId: number, inviteeIds: number[], message: string) => {
    setIsInvitingUsers(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/channel/invite'

      const payload = {
        channelId: channelId,
        inviterId: parseInt(currentUserId),
        inviteeIds: inviteeIds,
        invitationMessage: message
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: InviteUsersToChannelResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar(`Successfully invited ${result.data.length} user(s) to the channel`, 'success')
        return true
      } else {
        showSnackbar(result.message || 'Failed to send invitations', 'error')
        return false
      }
    } catch (error) {
      console.error('Error inviting users to channel:', error)
      showSnackbar('Failed to send invitations', 'error')
      return false
    } finally {
      setIsInvitingUsers(false)
    }
  }

  // ========== END CHANNEL API FUNCTIONS ==========

  // Add participants to group
  const addGroupParticipants = async (conversationId: string, participantIds: number[]) => {
    setIsAddingMembers(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/group/addParticipants`

      const payload = {
        conversationId: parseInt(conversationId),
        adminUserIds: [parseInt(currentUserId)],
        participantIds: participantIds
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: GroupParticipantsResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Members added successfully', 'success')
        await fetchConversations('')
        return true
      } else {
        showSnackbar(result.message || 'Failed to add members', 'error')
        return false
      }
    } catch (error) {
      console.error('Error adding participants:', error)
      showSnackbar('Failed to add members', 'error')
      return false
    } finally {
      setIsAddingMembers(false)
    }
  }

  // Remove participant from group
  const removeGroupParticipant = async (conversationId: string, participantId: string) => {
    setIsRemovingMember(true)
    try {
      const payload = {
        conversationId: parseInt(conversationId),
        adminUserId: parseInt(currentUserId),
        participantId: parseInt(participantId)
      }

      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/group/removeParticipant`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)

      })

      const result: GroupParticipantsResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Member removed successfully', 'success')
        await fetchConversations('')
        return true
      } else {
        showSnackbar(result.message || 'Failed to remove member', 'error')
        return false
      }
    } catch (error) {
      console.error('Error removing participant:', error)
      showSnackbar('Failed to remove member', 'error')
      return false
    } finally {
      setIsRemovingMember(false)
    }
  }

  // Update group info
  const updateGroupInfo = async (conversationId: string, groupName: string, groupImage: string) => {
    setIsUpdatingGroup(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/group/updateGroupInfo`

      const payload = {
        adminUserId: parseInt(currentUserId),
        groupName: groupName,
        groupImage: groupImage || '',
        conversationId: conversationId
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: UpdateGroupResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Group updated successfully', 'success')
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              name: groupName,
              avatar: groupImage || conv.avatar
            }
          }
          return conv
        }))
        return true
      } else {
        showSnackbar(result.message || 'Failed to update group', 'error')
        return false
      }
    } catch (error) {
      console.error('Error updating group:', error)
      showSnackbar('Failed to update group', 'error')
      return false
    } finally {
      setIsUpdatingGroup(false)
    }
  }

  // Leave group
  const leaveGroup = async (conversationId: string) => {
    setIsLeavingGroup(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/group/leaveGroup`

      const payload = {
        userId: parseInt(currentUserId),
        conversationId: parseInt(conversationId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: LeaveGroupResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Left group successfully', 'success')
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))
        setSelectedConversation(null)
        setSelectedConvCache(null)
        return true
      } else {
        showSnackbar(result.message || 'Failed to leave group', 'error')
        return false
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      showSnackbar('Failed to leave group', 'error')
      return false
    } finally {
      setIsLeavingGroup(false)
    }
  }

  // Fetch pending message requests
  const fetchPendingRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/pendingRequest/${currentUserId}`

      const response = await fetchWithAuth(url)
      const result: PendingRequestsResponse = await response.json()

      if (result.success && result.data) {
        setPendingRequests(result.data)
      } else {
        setPendingRequests([])
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error)
      showSnackbar('Failed to load message requests', 'error')
      setPendingRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  // Accept message request
  const acceptMessageRequest = async (requestId: number) => {
    setIsProcessingRequest(requestId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/acceptRequest'

      const payload = {
        requestId: requestId,
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: AcceptRejectRequestResponse = await response.json()

      if (result.success && result.data) {
        setPendingRequests(prev => prev.filter(req => req.requestId !== requestId))
        showSnackbar('Message request accepted', 'success')
        await fetchConversations('')
      } else {
        showSnackbar('Failed to accept message request', 'error')
      }
    } catch (error) {
      console.error('Error accepting message request:', error)
      showSnackbar('Failed to accept message request', 'error')
    } finally {
      setIsProcessingRequest(null)
    }
  }

  // Reject message request
  const rejectMessageRequest = async (requestId: number) => {
    setIsProcessingRequest(-requestId)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/rejectRequest?requestId=${requestId}&userId=${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result: AcceptRejectRequestResponse = await response.json()

      if (result.success && result.data) {
        setPendingRequests(prev => prev.filter(req => req.requestId !== requestId))
        showSnackbar('Message request rejected', 'info')
      } else {
        showSnackbar('Failed to reject message request', 'error')
      }
    } catch (error) {
      console.error('Error rejecting message request:', error)
      showSnackbar('Failed to reject message request', 'error')
    } finally {
      setIsProcessingRequest(null)
    }
  }

  // Create direct conversation
  const createDirectConversation = async (user1Id: string, user2Id: string): Promise<number | null> => {
    setIsCreatingConversation(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/conversation/direct'

      const payload = {
        user1Id: parseInt(user1Id),
        user2Id: parseInt(user2Id)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: CreateConversationResponse = await response.json()

      if (result.success && result.data) {
        // Just return the conversation ID - don't add to state here
        // The calling function will handle updating the state
        return result.data.conversationId
      } else {
        showSnackbar(result.message || 'Failed to create conversation', 'error')
        return null
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      showSnackbar('Failed to create conversation', 'error')
      return null
    } finally {
      setIsCreatingConversation(false)
    }
  }

  // Fetch conversations from API
  const fetchConversations = async (searchTerm: string = '') => {
    setIsLoadingConversations(true)
    try {
      const searchType = 'ALL'
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/searchConversations/${currentUserId}?searchType=${searchType}&search=${encodeURIComponent(searchTerm)}`

      const response = await fetchWithAuth(url)
      const result: SearchConversationsResponse = await response.json()

      if (result.success && result.data && result.data.length > 0) {
        const conversationsList = result.data[0].conversations || []
        const transformedConversations = conversationsList.map(transformAPIConversation)

        // Keep existing channels and add/update conversations
        setConversations(prev => {
          const existingChannels = prev.filter(c => c.type === 'channel')
          return [...transformedConversations, ...existingChannels]
        })
      } else {
        // Keep channels when no conversations found
        setConversations(prev => prev.filter(c => c.type === 'channel'))
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      showSnackbar('Failed to load conversations', 'error')
    } finally {
      setIsLoadingConversations(false)
    }
  }

  // Add this useEffect to handle direct messaging from profile

  // Handle direct messaging from URL parameter (/messages?userId={userId})
  useEffect(() => {
    const handleDirectMessageFromUrl = async () => {
      // Skip if no userId in URL
      if (!userIdToMessage) return

      // Wait for conversations to load first
      if (isLoadingConversations) return

      console.log('=== Handling userId from URL ===')
      console.log('userIdToMessage:', userIdToMessage)

      // Check if conversation already exists with this user
      const existingConversation = conversations.find(
        conv => conv.type === 'direct' &&
          (String(conv.userId) === String(userIdToMessage) ||
            conv.participants?.some(p => String(p.userId) === String(userIdToMessage)))
      )

      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id)
        // Select existing conversation
        handleSelectConversation(existingConversation.id)
      } else {
        console.log('No existing conversation found, creating new one...')

        // Create new conversation
        try {
          setIsCreatingConversation(true)

          const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/conversation/direct'
          const payload = {
            user1Id: parseInt(currentUserId),
            user2Id: parseInt(userIdToMessage)
          }

          const response = await fetchWithAuth(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          })

          const result: CreateConversationResponse = await response.json()

          if (result.success && result.data) {
            console.log('Conversation created successfully:', result.data)

            // Get the other participant info
            const otherParticipant = result.data.otherParticipant ||
              result.data.participants?.find(p => String(p.userId) !== String(currentUserId))

            // Create conversation object to add to state
            const newConversation: Conversation = {
              id: String(result.data.conversationId),
              name: otherParticipant?.fullName || `User ${userIdToMessage}`,
              type: 'direct',
              avatar: otherParticipant?.profilePicture || undefined,
              avatarColor: '#9ca3af',
              lastMessage: 'No messages yet',
              time: 'Now',
              unread: 0,
              isActive: true,
              canSendMessage: true,
              userId: parseInt(userIdToMessage),
              conversationId: result.data.conversationId,
              participants: result.data.participants,
            }

            // Add to conversations list at the top
            setConversations(prev => {
              // Check if already exists (edge case)
              const exists = prev.some(c => c.id === newConversation.id)
              if (exists) return prev
              return [newConversation, ...prev]
            })

            // Small delay to ensure state is updated, then select
            setTimeout(() => {
              setSelectedConversation(String(result.data.conversationId))
              localStorage.setItem('selectedConversationId', String(result.data.conversationId))

              // Fetch messages (will be empty for new conversation)
              fetchMessages(String(result.data.conversationId), userIdToMessage)

              showSnackbar('Conversation started!', 'success')
            }, 100)

          } else {
            console.error('Failed to create conversation:', result.message)
            showSnackbar(result.message || 'Failed to start conversation', 'error')
          }
        } catch (error) {
          console.error('Error creating direct conversation:', error)
          showSnackbar('Failed to start conversation', 'error')
        } finally {
          setIsCreatingConversation(false)
        }
      }

      // Clear the URL parameter after handling
      if (window.history.replaceState) {
        const url = new URL(window.location.href)
        url.searchParams.delete('userId')
        window.history.replaceState({}, '', url.toString())
      }
    }

    handleDirectMessageFromUrl()
  }, [userIdToMessage, conversations, currentUserId, isLoadingConversations])


  const fetchMessages = async (conversationId: string, userId: string, page: number = 1, append: boolean = false) => {
    if (append) {
      setIsLoadingMoreMessages(true)
    } else {
      setIsLoadingMessages(true)
      setCurrentPage(1) // Reset page when loading fresh
    }

    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/messages/${conversationId}/${userId}?page=${page}&size=${PAGE_SIZE}`

      const response = await fetchWithAuth(url)
      const result: MessagesResponse = await response.json()

      if (result.success && result.data) {
        const transformedMessages = result.data.map(transformAPIMessage)

        // REVERSE the messages array since API returns newest first but we need oldest first
        const chronologicalMessages = transformedMessages.reverse()

        // Set total records and check if there are more messages
        const total = result.totalRecords || 0
        setTotalRecords(total)
        setHasMoreMessages(transformedMessages.length === PAGE_SIZE && (page * PAGE_SIZE) < total)

        if (append) {
          // Prepend older messages to the beginning of the array
          setMessages(prev => [...chronologicalMessages, ...prev])
        } else {
          // Replace messages (initial load)
          setMessages(chronologicalMessages)

          // Scroll to bottom after messages load
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
          }, 100)
        }

        // Get lastMessageId from the conversation (from searchConversations API)
        if (!append && chronologicalMessages.length > 0) {
  // Always use the actual last message from fetched results,
  // not the conversation object which may be stale
  const lastMessageId = chronologicalMessages[chronologicalMessages.length - 1].id
  await markMessagesAsRead(conversationId, lastMessageId)
}
      } else {
        if (!append) {
          setMessages([])
          setTotalRecords(0)
          setHasMoreMessages(false)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      if (!append) {
        setMessages([])
        setTotalRecords(0)
        setHasMoreMessages(false)
      }
    } finally {
      if (append) {
        setIsLoadingMoreMessages(false)
      } else {
        setIsLoadingMessages(false)
      }
    }
  }

  const loadMoreMessages = useCallback(async () => {
    if (!selectedConversation || !hasMoreMessages || isLoadingMoreMessages) {
      return
    }

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (!conv?.userId && !conv?.conversationId) {
      return
    }

    // Scroll detection for loading more messages


    const nextPage = currentPage + 1
    setCurrentPage(nextPage)

    const userId = conv.userId ? String(conv.userId) : currentUserId
    await fetchMessages(selectedConversation, userId, nextPage, true)
  }, [selectedConversation, hasMoreMessages, isLoadingMoreMessages, currentPage, conversations, discoveredChannels, currentUserId])


  useEffect(() => {
    const messagesContainer = messagesContainerRef.current
    if (!messagesContainer) return

    const handleScroll = () => {
      // Check if scrolled to top (with some threshold)
      const scrollTop = messagesContainer.scrollTop
      const threshold = 100 // pixels from top

      if (scrollTop < threshold && hasMoreMessages && !isLoadingMoreMessages) {
        // Save current scroll height before loading more
        const previousScrollHeight = messagesContainer.scrollHeight

        loadMoreMessages().then(() => {
          // Restore scroll position after new messages are loaded
          // This prevents the scroll from jumping to top
          requestAnimationFrame(() => {
            const newScrollHeight = messagesContainer.scrollHeight
            const scrollDifference = newScrollHeight - previousScrollHeight
            messagesContainer.scrollTop = scrollTop + scrollDifference
          })
        })
      }
    }

    messagesContainer.addEventListener('scroll', handleScroll)
    return () => messagesContainer.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, isLoadingMoreMessages, loadMoreMessages])

  const markMessagesAsRead = async (conversationId: string, upToMessageId: string) => {
  try {
    const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/readMessage'

    const payload = {
      conversationId: parseInt(conversationId),
      userId: parseInt(currentUserId),
      upToMessageId: parseInt(upToMessageId)
    }

    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    const result: ReadMessageResponse = await response.json()

    if (result.success) {
      console.log('✅ Messages marked as read on server for conversation:', conversationId)
      // Just update local state — the global counter was already
      // decremented in handleSelectConversation, don't decrement again
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? { ...conv, unread: 0 } : conv
        )
      )
    }
  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

  // Update message via API
  const updateMessageAPI = async (messageId: string, newText: string) => {
    setIsUpdatingMessage(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/messaging/updateMessage/${messageId}`

      const payload = {
        userId: currentUserId,
        newText: newText
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: UpdateMessageResponse = await response.json()

      if (result.success && result.data) {
        const updatedMessage = transformAPIMessage(result.data)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? updatedMessage : msg
        ))

        if (selectedConversation) {
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedConversation) {
              const lastMessage = messages[messages.length - 1]
              if (lastMessage?.id === messageId) {
                return {
                  ...conv,
                  lastMessage: newText
                }
              }
            }
            return conv
          }))
        }

        showSnackbar('Message updated', 'success')
        return true
      } else {
        showSnackbar('Failed to update message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error updating message:', error)
      showSnackbar('Failed to update message', 'error')
      return false
    } finally {
      setIsUpdatingMessage(false)
    }
  }

  // Delete message via API
  const deleteMessageAPI = async (messageId: string) => {
    setIsDeletingMessage(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/deleteMessage'

      const payload = {
        messageId: parseInt(messageId),
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: DeleteMessageResponse = await response.json()

      if (result.success && result.data) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))

        if (selectedConversation) {
          setConversations(prev => prev.map(conv => {
            if (conv.id === selectedConversation) {
              const lastMessage = messages[messages.length - 1]
              if (lastMessage?.id === messageId) {
                const newLastMessage = messages[messages.length - 2]
                return {
                  ...conv,
                  lastMessage: newLastMessage?.text || 'No messages yet'
                }
              }
            }
            return conv
          }))
        }

        showSnackbar('Message deleted', 'success')
        return true
      } else {
        showSnackbar('Failed to delete message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error deleting message:', error)
      showSnackbar('Failed to delete message', 'error')
      return false
    } finally {
      setIsDeletingMessage(false)
    }
  }

  // Load conversations, channels, and pending requests on mount
  useEffect(() => {
    fetchConversations('')
    fetchUserChannels()
    fetchPendingRequests()
    fetchPendingChannelInvitations()  // ADD THIS LINE
    discoverChannels() // Load discoverable channels on mount

    const interval = setInterval(() => {
      fetchPendingRequests()
      fetchPendingChannelInvitations()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Handle search with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSearchConversations = useCallback(async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(async () => {
      // Search conversations
      await fetchConversations(query)

      // Search channels if query is not empty
      if (query.trim()) {
        const channelResults = await searchChannels(query)

        // Update discovered channels with search results
        setDiscoveredChannels(channelResults)
      } else {
        // If search is cleared, load discovered channels
        await discoverChannels()
      }
    }, 500)
  }, [])

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleSelectConversation = async (conversationId: string) => {
    setMessages([])
    setCurrentPage(1)
    setTotalRecords(0)
    setHasMoreMessages(false)

    setSelectedConversation(conversationId)
    localStorage.setItem('selectedConversationId', conversationId)

    const conv = conversations.find(c => c.id === conversationId) ||
      discoveredChannels.find(c => c.id === conversationId)

    if (!conv) {
      console.error('Conversation not found:', conversationId)
      setSelectedConversation(null)
      return
    }

    // Tell global context which conversation is active
    const numericConversationId = conv.conversationId || parseInt(conversationId)
    setCurrentConversation(numericConversationId)
    console.log('🗣️ Set current conversation in context:', numericConversationId)

    // If this conversation has unreads, mark as read globally + locally
    if (conv.unread > 0) {
      console.log('📖 Marking conversation as read:', conversationId, 'unreads:', conv.unread)
      markConversationAsRead(numericConversationId, conv.unread)

      // Reset local unread badge immediately
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, unread: 0 }
            : c
        )
      )
    }

    // Handle CHANNEL selection
    if (conv.type === 'channel') {
      if (conv.channelId) {
        await fetchChannelMessages(conv.channelId)
      }
      return
    }

    // Handle GROUP selection
    if (conv.type === 'group') {
      if (conv.conversationId) {
        fetchMessages(String(conv.conversationId), currentUserId)
      }
      return
    }

    // Handle DIRECT conversation
    if (conv.type === 'direct') {
      if (!conv.userId) {
        console.error('No userId found for direct conversation')
        showSnackbar('Error loading conversation', 'error')
        return
      }

      if (conv.conversationId && conv.conversationId > 0) {
        console.log('Fetching existing conversation:', conv.conversationId)
        fetchMessages(String(conv.conversationId), String(conv.userId))
      } else {
        console.log('Creating new conversation with userId:', conv.userId)

        const newConversationId = await createDirectConversation(currentUserId, String(conv.userId))

        if (newConversationId) {
          console.log('New conversation created:', newConversationId)

          setConversations(prevConversations =>
            prevConversations.map(c =>
              c.id === conversationId
                ? { ...c, id: String(newConversationId), conversationId: newConversationId }
                : c
            )
          )

          setSelectedConversation(String(newConversationId))
          localStorage.setItem('selectedConversationId', String(newConversationId))
          setCurrentConversation(newConversationId)

          fetchMessages(String(newConversationId), String(conv.userId))
        } else {
          showSnackbar('Failed to start conversation', 'error')
          setSelectedConversation(null)
          setCurrentConversation(null)
        }
      }
    }
  }

  useEffect(() => {
  // This runs when component unmounts (user navigates away from messages)
  return () => {
    console.log('🗣️ Leaving messages page - clearing current conversation')
    setCurrentConversation(null)
  }
}, [setCurrentConversation])

useEffect(() => {
  if (!selectedConversation) {
    console.log('🗣️ No conversation selected - clearing current conversation')
    setCurrentConversation(null)
    localStorage.removeItem('selectedConversationId')  // ← ADD THIS LINE
  }
}, [selectedConversation, setCurrentConversation])

  // Find this function around line 1484 and replace it:
  const handleSendMessage = useCallback(async () => {
    if ((messageText.trim() || selectedFiles.length > 0) && selectedConversation) {
      const conv = conversations.find(c => c.id === selectedConversation) ||
        discoveredChannels.find(c => c.id === selectedConversation)

      if (conv?.type === 'channel' && !conv.canSendMessage) {
        showSnackbar('Only channel admins can send messages', 'warning')
        return
      }

      let mediaUrl: string | null = null
      let messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' = 'TEXT'

      // ========== STEP 1: UPLOAD FILES (multi-file) ==========
      if (selectedFiles.length > 0) {
        console.log(`📤 Uploading ${selectedFiles.length} file(s)...`, selectedFiles.map(f => f.name))

        if (conv?.type === 'channel') {
          console.log('📢 Channel upload initiated')
          mediaUrl = await uploadChannelMediaFiles(selectedFiles)
        } else {
          console.log('💬 Regular message upload initiated')
          mediaUrl = await uploadMediaFiles(selectedFiles)
        }

        if (!mediaUrl) {
          console.error('❌ Upload failed, aborting send')
          return
        }

        console.log('✅ Files uploaded successfully, URLs:', mediaUrl)

        // Determine message type based on file types
        const hasImages = selectedFiles.some(f => f.type.startsWith('image/'))
        const hasVideos = selectedFiles.some(f => f.type.startsWith('video/'))

        if (hasImages) {
          messageType = 'IMAGE'
        } else if (hasVideos) {
          messageType = 'VIDEO'
        } else {
          messageType = 'FILE'
        }

        console.log('📝 Message type determined:', messageType)
      }

      const textToSend = messageText.trim()

      // Save current state for potential restore on failure
      const savedFiles = [...selectedFiles]
      const savedPreviews = [...filePreviews]

      // Clear input fields
      setMessageText('')
      handleClearFiles()
      handleEmojiPickerClose()

      // ========== STEP 2: SEND VIA WEBSOCKET ==========
      const channelId = conv?.type === 'channel' ? conv.channelId : undefined

      console.log('🚀 Sending message via WebSocket...')
      console.log('  - Text:', textToSend || '(no text)')
      console.log('  - Media URL:', mediaUrl || '(no media)')
      console.log('  - Type:', messageType)
      console.log('  - Channel ID:', channelId || '(not a channel)')

      // mediaUrl is now comma-separated: "url1,url2,url3"
      const success = sendMessageViaSocket(
        selectedConversation,
        textToSend,
        mediaUrl || undefined,
        messageType,
        channelId
      )

      if (!success) {
        console.error('❌ WebSocket send failed, restoring input')
        setMessageText(textToSend)
        setSelectedFiles(savedFiles)
        setFilePreviews(savedPreviews)
      } else {
        console.log('✅ Message sent successfully via WebSocket')
        if (selectedConversation) {
          moveConversationToTop(selectedConversation)
        }
      }
    }
  }, [messageText, selectedFiles, selectedConversation, conversations, discoveredChannels, filePreviews, sendMessageViaSocket])


  const handleMessageTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value)

    // Send typing event
    if (e.target.value) {
      sendTypingEvent(true)
    }
  }, [sendTypingEvent])

  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: Message) => {
    event.stopPropagation()
    setMessageMenuAnchor(event.currentTarget)
    setSelectedMessageForMenu(message)
  }

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null)
    setSelectedMessageForMenu(null)
  }

  const handleEditMessage = () => {
    if (selectedMessageForMenu) {
      setEditingMessageId(selectedMessageForMenu.id)
      setEditMessageText(selectedMessageForMenu.text)
      handleMessageMenuClose()
    }
  }


  const handleSaveEditMessage = async () => {
    if (editingMessageId && editMessageText.trim()) {
      const conv = conversations.find(c => c.id === selectedConversation) ||
        discoveredChannels.find(c => c.id === selectedConversation)

      let success = false

      // Check if this is a channel message
      if (conv?.type === 'channel') {
        success = await editChannelMessage(editingMessageId, editMessageText.trim())
      } else {
        success = await updateMessageAPI(editingMessageId, editMessageText.trim())
      }

      if (success) {
        setEditingMessageId(null)
        setEditMessageText('')
      }
    }
  }

  const handleCancelEditMessage = () => {
    setEditingMessageId(null)
    setEditMessageText('')
  }

  const handleDeleteMessage = async () => {
    if (selectedMessageForMenu) {
      const conv = conversations.find(c => c.id === selectedConversation) ||
        discoveredChannels.find(c => c.id === selectedConversation)

      // Check if this is a channel message
      if (conv?.type === 'channel') {
        await deleteChannelMessage(selectedMessageForMenu.id)
      } else {
        await deleteMessageAPI(selectedMessageForMenu.id)
      }

      handleMessageMenuClose()
    }
  }

  const handleAcceptRequest = (requestId: number) => {
    acceptMessageRequest(requestId)
  }

  const handleRejectRequest = (requestId: number) => {
    rejectMessageRequest(requestId)
  }

  // Handle create group
  const handleCreateGroup = async () => {
    if (newGroupName && selectedMembers.length > 0) {
      const participantIds = selectedMembers.map(m => parseInt(m.id))
      const success = await createGroupAPI(newGroupName, newGroupImage, participantIds)

      if (success) {
        setCreateGroupDialog(false)
        setNewGroupName('')
        setNewGroupDescription('')
        setNewGroupImage('')
        setSelectedMembers([])
      }
    } else {
      showSnackbar('Please provide group name and select members', 'warning')
    }
  }

  // Handle add members to group
  const handleAddMembersToGroup = async (members: Member[]) => {
    if (selectedConversation && members.length > 0) {
      const participantIds = members.map(m => parseInt(m.id))
      const success = await addGroupParticipants(selectedConversation, participantIds)

      if (success) {
        setAddMembersDialog(false)
      }
    }
  }

  // Handle remove member from group
  const handleRemoveMember = async (participantId: string) => {
    if (selectedConversation) {
      await removeGroupParticipant(selectedConversation, participantId)
    }
  }

  // Handle edit group info
  // Handle edit group info
  const handleEditGroupInfo = () => {
    const conv = conversations.find(c => c.id === selectedConversation)
    if (conv) {
      setEditGroupName(conv.name)
      setEditGroupImage(conv.avatar || '')
      setEditGroupFile(null)
      setEditGroupFilePreview(null)
      setEditGroupDialog(true)
    }
  }

  // Handle save group edit
  // Handle save group edit
  const handleSaveGroupEdit = async () => {
    if (selectedConversation && editGroupName) {
      let imageUrl = editGroupImage

      // If a new file is selected, upload it first
      if (editGroupFile) {
        const uploadedUrl = await uploadGroupImage(editGroupFile)
        if (!uploadedUrl) {
          // Upload failed, don't proceed
          return
        }
        imageUrl = uploadedUrl
      }

      const success = await updateGroupInfo(selectedConversation, editGroupName, imageUrl)

      if (success) {
        setEditGroupDialog(false)
        setEditGroupName('')
        setEditGroupImage('')
        setEditGroupFile(null)
        setEditGroupFilePreview(null)
      }
    }
  }

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (selectedConversation) {
      if (window.confirm('Are you sure you want to leave this group?')) {
        await leaveGroup(selectedConversation)
        setAnchorEl(null)
      }
    }
  }

  // Handle create channel
  const handleCreateChannel = async () => {
    if (newChannelName) {
      const channelType = isChannelPublic ? 'PUBLIC' : 'PRIVATE'
      const success = await createChannelAPI(
        newChannelName,
        newChannelDescription,
        channelType,
        ''
      )

      if (success) {
        setCreateChannelDialog(false)
        setNewChannelName('')
        setNewChannelDescription('')
        setIsChannelPublic(true)

        // Refresh channels list
        await fetchUserChannels()
      }
    } else {
      showSnackbar('Please provide channel name', 'warning')
    }
  }

  // Handle open channel settings
  const handleOpenChannelSettings = async () => {
    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (conv && conv.channelId) {
      await getChannelSettings(conv.channelId)
      setChannelSettingsDialog(true)
      setAnchorEl(null)
    }
  }

  // Handle save channel settings
  const handleSaveChannelSettings = async () => {
    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (conv && conv.channelId) {
      const success = await updateChannelSettings(conv.channelId)
      if (success) {
        setChannelSettingsDialog(false)
      }
    }
  }

  // Handle delete channel
  const handleDeleteChannel = async () => {
    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (conv && conv.channelId) {
      if (window.confirm(`Are you sure you want to delete "${conv.name}"? This action cannot be undone.`)) {
        const success = await deleteChannel(conv.channelId)
        if (success) {
          setAnchorEl(null)
        }
      }
    }
  }

  // Handle open invite users dialog
  const handleOpenInviteUsers = () => {
    setInviteUsersDialog(true)
    setAnchorEl(null)
    fetchUserFollowers()
  }

  // Handle send invitations
  const handleSendInvitations = async () => {
    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (conv && conv.channelId && selectedInviteUsers.length > 0) {
      const inviteeIds = selectedInviteUsers.map(u => parseInt(u.id))
      const success = await inviteUsersToChannel(conv.channelId, inviteeIds, invitationMessage)

      if (success) {
        setInviteUsersDialog(false)
        setSelectedInviteUsers([])
        setInvitationMessage('')
      }
    } else {
      showSnackbar('Please select users to invite', 'warning')
    }
  }

  const handleJoinChannel = (channelId: string) => {
    const channel = conversations.find(c => c.id === channelId) ||
      discoveredChannels.find(c => c.id === channelId)
    if (channel) {
      showSnackbar(`Joined ${channel.name} channel`, 'success')
    }
  }

  // Open create group dialog and fetch users
  const handleOpenCreateGroupDialog = () => {
    setCreateGroupDialog(true)
    fetchUserFollowers()
  }

  // Check if current user is group admin
  const isGroupAdmin = () => {
    const conv = conversations.find(c => c.id === selectedConversation)
    if (conv && conv.participants) {
      const currentUserParticipant = conv.participants.find(p => String(p.userId) === String(currentUserId))
      return currentUserParticipant?.role === 'ADMIN'
    }
    return false
  }

  const selectedConv = conversations.find(c => c.id === selectedConversation) ||
    discoveredChannels.find(c => c.id === selectedConversation) ||
    selectedConvCache

  // Add this useEffect after the state declarations
  // Cache selected conversation to prevent header disappearing during search
  useEffect(() => {
    if (selectedConversation) {
      const conv = conversations.find(c => c.id === selectedConversation) ||
        discoveredChannels.find(c => c.id === selectedConversation)
      if (conv) {
        setSelectedConvCache(conv)
      }
    } else {
      setSelectedConvCache(null)
    }
  }, [selectedConversation, conversations, discoveredChannels])

  console.log('selectedConv', selectedConv);


  // Helper function to get file icon
  const getFileIcon = (messageType?: string) => {
    switch (messageType) {
      case 'IMAGE':
        return <ImageIcon />
      case 'GIF':
        return <GifIcon />
      case 'VIDEO':
        return <VideoIcon />
      case 'FILE':
        return <FileIcon />
      default:
        return <AttachIcon />
    }
  }

  // Get typing indicator text
  const getTypingIndicator = () => {
    if (typingUsers.size === 0) return null

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)
    if (conv?.type === 'group') {
      return `${typingUsers.size} ${typingUsers.size === 1 ? 'person is' : 'people are'} typing...`
    }
    return 'Typing...'
  }


  // Fix for mobile viewport height (URL bar issue)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)

    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])


  // Add reaction to message
  const addMessageReaction = async (messageId: string, reactionType: string) => {
    setIsSendingReaction(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/message/addReaction'

      const payload = {
        messageId: parseInt(messageId),
        userId: parseInt(currentUserId),
        reactionType: reactionType
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: AddReactionResponse = await response.json()

      if (result.success && result.data) {
        // Update local message reactions optimistically
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReactions = msg.reactions || []
            const reactionIndex = existingReactions.findIndex(r => r.emoji === reactionType)

            if (reactionIndex >= 0) {
              // Update existing reaction
              const updatedReactions = [...existingReactions]
              updatedReactions[reactionIndex] = {
                ...updatedReactions[reactionIndex],
                count: updatedReactions[reactionIndex].count + 1,
                hasReacted: true,
                users: [
                  ...updatedReactions[reactionIndex].users,
                  {
                    userId: parseInt(currentUserId),
                    fullName: 'You',
                    profilePicture: undefined
                  }
                ]
              }
              return { ...msg, reactions: updatedReactions }
            } else {
              // Add new reaction
              return {
                ...msg,
                reactions: [
                  ...existingReactions,
                  {
                    emoji: reactionType,
                    count: 1,
                    hasReacted: true,
                    users: [{
                      userId: parseInt(currentUserId),
                      fullName: 'You',
                      profilePicture: undefined
                    }]
                  }
                ]
              }
            }
          }
          return msg
        }))

        return true
      } else {
        showSnackbar(result.message || 'Failed to add reaction', 'error')
        return false
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
      showSnackbar('Failed to add reaction', 'error')
      return false
    } finally {
      setIsSendingReaction(false)
    }
  }

  // Remove reaction from message
  const removeMessageReaction = async (messageId: string, reactionType: string) => {
    setIsSendingReaction(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/message/removeReaction'

      const payload = {
        messageId: parseInt(messageId),
        userId: parseInt(currentUserId)  // Note: capital ID as per API
      }

      const response = await fetchWithAuth(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: RemoveReactionResponse = await response.json()

      if (result.success && result.data) {
        // Update local message reactions optimistically
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReactions = msg.reactions || []
            const updatedReactions = existingReactions
              .map(reaction => {
                if (reaction.emoji === reactionType && reaction.hasReacted) {
                  const newCount = reaction.count - 1
                  if (newCount === 0) {
                    return null // Will be filtered out
                  }
                  return {
                    ...reaction,
                    count: newCount,
                    hasReacted: false,
                    users: reaction.users.filter(u => u.userId !== parseInt(currentUserId))
                  }
                }
                return reaction
              })
              .filter(r => r !== null) as ReactionGroup[]

            return { ...msg, reactions: updatedReactions }
          }
          return msg
        }))

        return true
      } else {
        showSnackbar(result.message || 'Failed to remove reaction', 'error')
        return false
      }
    } catch (error) {
      console.error('Error removing reaction:', error)
      showSnackbar('Failed to remove reaction', 'error')
      return false
    } finally {
      setIsSendingReaction(false)
    }
  }


  // Handle reaction picker toggle
  const handleReactionPickerToggle = (event: React.MouseEvent<HTMLElement>, message: Message) => {
    event.stopPropagation()
    setReactionPickerAnchor(event.currentTarget)
    setSelectedMessageForReaction(message)
    setShowReactionPicker(prev => !prev)
  }

  // Handle reaction picker close
  const handleReactionPickerClose = () => {
    setShowReactionPicker(false)
    setReactionPickerAnchor(null)
    setSelectedMessageForReaction(null)
  }

  // Handle quick reaction click
  const handleQuickReaction = async (emoji: string, message: Message) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji)

    if (reaction?.hasReacted) {
      // Remove reaction if already reacted
      await removeMessageReaction(message.id, emoji)
    } else {
      // Add reaction
      await addMessageReaction(message.id, emoji)
    }
  }

  // Handle reaction selection from picker
  const handleReactionSelect = async (emojiData: EmojiClickData) => {
    if (!selectedMessageForReaction) return

    const emoji = emojiData.emoji
    const reaction = selectedMessageForReaction.reactions?.find(r => r.emoji === emoji)

    if (reaction?.hasReacted) {
      // Remove reaction if already reacted
      await removeMessageReaction(selectedMessageForReaction.id, emoji)
    } else {
      // Add reaction
      await addMessageReaction(selectedMessageForReaction.id, emoji)
    }

    handleReactionPickerClose()
  }

  // Transform API channel message to component format
  const transformAPIChannelMessage = (apiMsg: APIChannelMessage): Message => {
    return {
      id: String(apiMsg.channelMessageId),
      senderId: apiMsg.senderId,
      senderName: apiMsg.senderFullName,
      senderAvatar: apiMsg.senderProfilePicture,
      text: apiMsg.messageText,
      time: formatTime(apiMsg.createdAt),
      isOwn: apiMsg.senderId === currentUserId,
      senderUsername: apiMsg.senderUsername,
      senderProfilePicture: apiMsg.senderProfilePicture,
      isEdited: apiMsg.isEdited === 'Y',
      mediaUrl: apiMsg.mediaUrl || undefined,
      messageType: apiMsg.messageType as 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'GIF' | 'CODE',
      channelId: apiMsg.channelId,
      isPinned: apiMsg.isPinned === 'Y',
      reactionCount: apiMsg.reactionCount,
      commentCount: apiMsg.commentCount,
      reactions: apiMsg.reactions as ReactionGroup[] | undefined,
    }
  }


  // Fetch messages for a channel
  const fetchChannelMessages = async (channelId: number, page: number = 0, size: number = 50) => {
    setIsLoadingMessages(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/${channelId}/messages?userId=${currentUserId}&page=${page}&size=${size}`

      const response = await fetchWithAuth(url)
      const result: ChannelMessagesResponse = await response.json()

      if (result.success && result.data) {
        const transformedMessages = result.data.map(transformAPIChannelMessage)
        setMessages(transformedMessages)

        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
        }, 100)
      }
      else {
        setMessages([])
      }
    } catch (error) {
      console.error('Error fetching channel messages:', error)
      showSnackbar('Failed to load channel messages', 'error')
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Edit channel message
  const editChannelMessage = async (messageId: string, newText: string) => {
    setIsUpdatingMessage(true)
    try {
      const encodedText = encodeURIComponent(newText)
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/message/${messageId}?userId=${currentUserId}&newText=${encodedText}`

      const response = await fetchWithAuth(url, {
        method: 'PUT',
      })

      const result: UpdateChannelMessageResponse = await response.json()

      if (result.success && result.data) {
        const updatedMessage = transformAPIChannelMessage(result.data)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? updatedMessage : msg
        ))

        showSnackbar('Message updated', 'success')
        return true
      } else {
        showSnackbar(result.message || 'Failed to update message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error updating channel message:', error)
      showSnackbar('Failed to update message', 'error')
      return false
    } finally {
      setIsUpdatingMessage(false)
    }
  }

  // Delete channel message
  const deleteChannelMessage = async (messageId: string) => {
    setIsDeletingMessage(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/message/${messageId}?userId=${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'DELETE',
      })

      const result: DeleteChannelMessageResponse = await response.json()

      if (result.success && result.data) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        showSnackbar('Message deleted', 'success')
        return true
      } else {
        showSnackbar(result.message || 'Failed to delete message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error deleting channel message:', error)
      showSnackbar('Failed to delete message', 'error')
      return false
    } finally {
      setIsDeletingMessage(false)
    }
  }

  // Pin channel message
  const pinChannelMessage = async (messageId: string) => {
    setIsPinningMessage(true)
    try {
      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/message/${messageId}/pin?userId=${currentUserId}`

      const response = await fetchWithAuth(url, {
        method: 'POST',
      })

      const result: PinChannelMessageResponse = await response.json()

      if (result.success && result.data) {
        // Update message in state to show it's pinned
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isPinned: true } : msg
        ))
        showSnackbar('Message pinned', 'success')

        // Refresh messages to update pinned section
        const conv = conversations.find(c => c.id === selectedConversation) ||
          discoveredChannels.find(c => c.id === selectedConversation)
        if (conv?.channelId) {
          await fetchChannelMessages(conv.channelId)
        }

        return true
      } else {
        showSnackbar(result.message || 'Failed to pin message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error pinning message:', error)
      showSnackbar('Failed to pin message', 'error')
      return false
    } finally {
      setIsPinningMessage(false)
    }
  }

  // Unpin channel message
  const unpinChannelMessage = async (messageId: string) => {
    setIsPinningMessage(true)
    try {
      const payload = {
        messageId: parseInt(messageId),
        userId: parseInt(currentUserId)
      }

      const url = `https://institutional-bo.paybito.com:8443/BitohubService/channel/unpin`

      const response = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify(payload)

      })


      const result: PinChannelMessageResponse = await response.json()

      if (result.success && result.data) {
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, isPinned: false } : msg
        ))
        showSnackbar('Message unpinned', 'success')

        // Refresh messages to update pinned section
        const conv = conversations.find(c => c.id === selectedConversation) ||
          discoveredChannels.find(c => c.id === selectedConversation)
        if (conv?.channelId) {
          await fetchChannelMessages(conv.channelId)
        }

        return true
      } else {
        showSnackbar(result.message || 'Failed to unpin message', 'error')
        return false
      }
    } catch (error) {
      console.error('Error unpinning message:', error)
      showSnackbar('Failed to unpin message', 'error')
      return false
    } finally {
      setIsPinningMessage(false)
    }
  }

  // ADD THIS: Promote group participant to admin
  // Promote group participant to admin
  const promoteGroupAdmin = async (conversationId: string, userId: string) => {
    setIsPromotingGroupAdmin(userId)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/group/promoteToAdmin'

      const payload = {
        conversationId: parseInt(conversationId),
        adminUserId: parseInt(currentUserId),
        participantId: parseInt(userId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: PromoteGroupAdminResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('User promoted to admin', 'success')

        // Optimistically update local state immediately
        setConversations(prev => prev.map(conv => {
          if (conv.id === conversationId && conv.participants) {
            return {
              ...conv,
              participants: conv.participants.map(p =>
                String(p.userId) === String(userId)
                  ? { ...p, role: 'ADMIN' }
                  : p
              )
            }
          }
          return conv
        }))

        // Also refresh from server to ensure consistency
        await fetchConversations('')

        return true
      } else {
        showSnackbar(result.message || 'Failed to promote user', 'error')
        return false
      }
    } catch (error) {
      console.error('Error promoting user to admin:', error)
      showSnackbar('Failed to promote user', 'error')
      return false
    } finally {
      setIsPromotingGroupAdmin(null)
    }
  }
  // Upload media file specifically for channels
  const uploadChannelMediaFiles = async (files: File[]): Promise<string | null> => {
    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('userId', currentUserId)
      files.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/channel/upload/files',
        {
          method: 'POST',
          body: formData,
        }
      )

      const result = await response.json()

      if (result.success && result.data) {
        const dataArray = Array.isArray(result.data) ? result.data : [result.data]
        const urls = dataArray.map((item: { fileUrl: string }) => item.fileUrl)
        const commaSeparatedUrls = urls.join(',')

        console.log('✅ Channel files uploaded:', commaSeparatedUrls)
        showSnackbar(`${files.length} channel file(s) uploaded successfully`, 'success')
        return commaSeparatedUrls
      } else {
        showSnackbar(result.message || 'Failed to upload files to channel', 'error')
        return null
      }
    } catch (error) {
      console.error('Error uploading files to channel:', error)
      showSnackbar('Failed to upload files to channel', 'error')
      return null
    } finally {
      setIsUploadingFile(false)
    }
  }

  // Download media file
  // Download media file
  const handleDownloadMedia = async (url: string, filename?: string) => {
    try {
      showSnackbar('Preparing download...', 'info')

      // Extract the base URL without query parameters for the API call
      const baseUrl = url.split('?')[0]

      const response = await fetch(
        'https://institutional-bo.paybito.com:8443/BitohubService/messaging/download-image',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: baseUrl }),
        }
      )

      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`)
      }

      const blob = await response.blob()

      // Create a temporary link element
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)

      // Extract filename from URL or use default
      const urlFilename = baseUrl.split('/').pop() || 'download'
      link.download = filename || urlFilename

      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      URL.revokeObjectURL(link.href)

      showSnackbar('Download started', 'success')
    } catch (error) {
      console.error('Error downloading file:', error)
      showSnackbar('Failed to download file', 'error')
    }
  }

  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    setIsLoadingWalletBalance(true)
    try {
      const balance = await PaymentAPIService.getWalletBalance()
      setWalletBalance(balance)
      console.log('BitoDollar Balance:', balance)
    } catch (error) {
      console.error('Error fetching BitoDollar balance:', error)
      showSnackbar('Failed to load wallet balance', 'error')
      setWalletBalance(0)
    } finally {
      setIsLoadingWalletBalance(false)
    }
  }, [])

  // Handle payment icon click
  const handlePaymentIconClick = () => {
    setPaymentDialogMode('normal')
    setPendingPaymentRequest(null)
    setPaymentDialogOpen(true)
    fetchWalletBalance()
  }

  // Handle send payment
  const handleSendPayment = async (amount: number): Promise<boolean> => {
    if (!selectedConversation) return false

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (!conv || conv.type !== 'direct') {
      showSnackbar('Payments are only available in direct conversations', 'warning')
      return false
    }

    // Check if user has sufficient balance
    if (amount > walletBalance) {
      showSnackbar('Insufficient BitoDollar balance. Please add funds.', 'error')
      return false
    }

    const receiverId = conv.userId
    const conversationId = conv.conversationId || parseInt(selectedConversation)

    setIsProcessingPayment(true)
    try {
      // STEP 1: Call API first
      const apiResponse = await PaymentAPIService.sendDirectPayment(
        parseInt(currentUserId),
        receiverId!,
        conversationId,
        amount
      )

      if (!apiResponse || !apiResponse.success) {
        showSnackbar(apiResponse?.message || 'Failed to process payment', 'error')
        return false
      }

      console.log('Payment API Response:', apiResponse)

      // STEP 2: Send WebSocket message after successful API call
      if (stompClient && stompClient.connected) {
        const paymentMessage = {
          conversationId: conversationId,
          senderId: parseInt(currentUserId),
          receiverId: receiverId,
          messageText: `Payment sent: B$ ${amount.toFixed(2)}`,
          messageType: 'PAYMENT',
          mediaUrl: null,
          amount: amount,                    // <-- ADD THIS
          paymentStatus: 'COMPLETED',
          paymentData: {
            paymentId: String(apiResponse.data?.returnId || ''),
            amount: amount,
            type: 'SEND',
            status: 'COMPLETED',
            senderId: currentUserId,
            receiverId: String(receiverId),
            senderName: 'You', // Will be replaced by actual name on receiver side
            receiverName: conv.name,
            createdAt: new Date().toISOString(),
            currency: 'USDB',
          },
        }

        stompClient.publish({
          destination: '/app/message/send',
          body: JSON.stringify(paymentMessage)
        })

        console.log('Payment WebSocket message sent:', paymentMessage)
      }

      // Refresh wallet balance after successful payment
      await fetchWalletBalance()

      showSnackbar(`Successfully sent B$ ${amount.toFixed(2)}`, 'success')
      return true
    } catch (error) {
      console.error('Error sending payment:', error)
      showSnackbar('Failed to send payment', 'error')
      return false
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Handle request payment
  const handleRequestPayment = async (amount: number): Promise<boolean> => {
    if (!selectedConversation) return false

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (!conv || conv.type !== 'direct') {
      showSnackbar('Payment requests are only available in direct conversations', 'warning')
      return false
    }

    const targetUserId = conv.userId
    const conversationId = conv.conversationId || parseInt(selectedConversation)

    setIsProcessingPayment(true)
    try {
      // NO API CALL - Just send WebSocket message directly
      // The backend will handle storing the request via WebSocket
      if (stompClient && stompClient.connected) {
        const paymentRequestMessage = {
          conversationId: conversationId,
          senderId: parseInt(currentUserId),
          receiverId: targetUserId,
          messageText: `Payment request: B$ ${amount.toFixed(2)}`,
          messageType: 'PAYMENT_REQUEST',
          mediaUrl: null,
          amount: amount,                    // <-- ADD THIS
          paymentStatus: 'PENDING',
          paymentData: {
            paymentId: '', // Will be assigned by backend
            amount: amount,
            type: 'REQUEST',
            status: 'PENDING',
            senderId: currentUserId,
            receiverId: String(targetUserId),
            senderName: 'You', // Will be replaced by actual name
            receiverName: conv.name,
            createdAt: new Date().toISOString(),
            currency: 'USDB',
          },
        }

        stompClient.publish({
          destination: '/app/message/send',
          body: JSON.stringify(paymentRequestMessage)
        })

        console.log('Payment request WebSocket message sent:', paymentRequestMessage)

        showSnackbar(`Payment request of B$ ${amount.toFixed(2)} sent`, 'success')
        return true
      } else {
        showSnackbar('Not connected to messaging server', 'error')
        return false
      }
    } catch (error) {
      console.error('Error requesting payment:', error)
      showSnackbar('Failed to send payment request', 'error')
      return false
    } finally {
      setIsProcessingPayment(false)
    }
  }


  const handlePayRequestFromMessage = (payment: PaymentMessageData) => {
    // Create pending payment request object
    const pendingRequest: PendingPaymentRequest = {
      paymentId: payment.paymentId,
      messageId: payment.messageId || 0,
      amount: payment.amount,
      senderId: payment.senderId,
      receiverId: payment.receiverId,
      senderName: payment.senderName,
      receiverName: payment.receiverName,
      conversationId: payment.conversationId || parseInt(selectedConversation || '0'),
    }

    setPendingPaymentRequest(pendingRequest)
    setPaymentDialogMode('accept_request')
    setPaymentDialogOpen(true)
    fetchWalletBalance()
  }

  const handleAcceptPaymentRequest = async (pendingRequest: PendingPaymentRequest): Promise<boolean> => {

    console.log('=== handleAcceptPaymentRequest ===')
    console.log('currentUserId:', currentUserId)
    console.log('pendingRequest:', pendingRequest)
    console.log('pendingRequest.senderId:', pendingRequest.senderId)
    console.log('pendingRequest.receiverId:', pendingRequest.receiverId)


    if (!selectedConversation) return false

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (!conv) return false

    // Check balance
    if (pendingRequest.amount > walletBalance) {
      showSnackbar('Insufficient BitoDollar balance. Please add funds.', 'error')
      return false
    }

    setIsProcessingPayment(true)
    setProcessingPaymentMessageId(pendingRequest.paymentId)

    try {
      // STEP 1: Call API with action "PAYMENT_ACCEPT"
      const apiResponse = await PaymentAPIService.acceptPaymentRequest(
        parseInt(currentUserId),           // senderId (person paying)
        parseInt(pendingRequest.senderId), // receiverId (person who requested)
        pendingRequest.conversationId,
        pendingRequest.messageId,          // Required for accepting request
        pendingRequest.amount
      )

      if (!apiResponse || !apiResponse.success) {
        showSnackbar(apiResponse?.message || 'Failed to process payment', 'error')
        return false
      }

      console.log('Accept payment API Response:', apiResponse)

      // STEP 2: Send WebSocket message after successful API call
      if (stompClient && stompClient.connected) {
        const paymentMessage = {
          conversationId: pendingRequest.conversationId,
          senderId: parseInt(currentUserId),
          receiverId: parseInt(pendingRequest.senderId),
          messageText: `Payment completed: B$ ${pendingRequest.amount.toFixed(2)}`,
          messageType: 'PAYMENT',
          mediaUrl: null,
          amount: pendingRequest.amount,     // <-- ADD THIS
          paymentStatus: 'COMPLETED',        // <-- ADD THIS
          paymentData: {
            paymentId: pendingRequest.paymentId,
            messageId: pendingRequest.messageId,
            amount: pendingRequest.amount,
            type: 'SEND',
            status: 'COMPLETED',
            senderId: currentUserId,
            receiverId: pendingRequest.senderId,
            senderName: 'You',
            receiverName: pendingRequest.senderName,
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            currency: 'USDB',
          },
        }

        stompClient.publish({
          destination: '/app/message/send',
          body: JSON.stringify(paymentMessage)
        })

        console.log('Payment accepted WebSocket message sent:', paymentMessage)
      }

      // Refresh wallet balance
      await fetchWalletBalance()

      // Refresh messages to update the payment request status
      if (conv.userId) {
        await fetchMessages(selectedConversation, String(conv.userId))
      }

      showSnackbar(`Successfully paid B$ ${pendingRequest.amount.toFixed(2)}`, 'success')
      return true
    } catch (error) {
      console.error('Error accepting payment request:', error)
      showSnackbar('Failed to process payment', 'error')
      return false
    } finally {
      setIsProcessingPayment(false)
      setProcessingPaymentMessageId(null)
    }
  }

  const handleDeclinePaymentRequest = async (payment: PaymentMessageData): Promise<boolean> => {
    if (!selectedConversation) return false

    const conv = conversations.find(c => c.id === selectedConversation) ||
      discoveredChannels.find(c => c.id === selectedConversation)

    if (!conv) return false

    const conversationId = conv.conversationId || parseInt(selectedConversation)

    setProcessingPaymentMessageId(payment.paymentId)

    try {
      // Call API with action "PAYMENT_DECLINE"
      const apiResponse = await PaymentAPIService.declinePaymentRequest(
        parseInt(currentUserId),       // senderId (person declining)
        parseInt(payment.senderId),    // receiverId (person who requested)
        conversationId,
        payment.messageId || 0,        // Required for declining
        payment.amount
      )

      if (!apiResponse || !apiResponse.success) {
        showSnackbar(apiResponse?.message || 'Failed to decline request', 'error')
        return false
      }

      console.log('Decline payment API Response:', apiResponse)

      // Send WebSocket message to notify the other user about the decline
      if (stompClient && stompClient.connected) {
        const declineMessage = {
          conversationId: conversationId,
          senderId: parseInt(currentUserId),
          receiverId: parseInt(payment.senderId),
          messageText: `Payment request declined: B$ ${payment.amount.toFixed(2)}`,
          messageType: 'PAYMENT_DECLINE',
          mediaUrl: null,
          amount: payment.amount,
          paymentStatus: 'DECLINED',
          paymentData: {
            paymentId: payment.paymentId,
            messageId: payment.messageId,
            amount: payment.amount,
            type: 'REQUEST',
            status: 'DECLINED',
            senderId: payment.senderId,
            receiverId: currentUserId,
            senderName: payment.senderName,
            receiverName: payment.receiverName || 'You',
            createdAt: payment.createdAt,
            currency: 'USDB',
          },
        }

        stompClient.publish({
          destination: '/app/message/send',
          body: JSON.stringify(declineMessage)
        })

        console.log('Decline WebSocket message sent:', declineMessage)
      }

      // Update local message state to show declined status
      setMessages(prev => prev.map(msg => {
        if (msg.id === String(payment.messageId) || msg.paymentData?.paymentId === payment.paymentId) {
          return {
            ...msg,
            paymentData: msg.paymentData ? {
              ...msg.paymentData,
              status: 'DECLINED' as PaymentStatus,
            } : undefined,
          }
        }
        return msg
      }))

      showSnackbar('Payment request declined', 'info')
      return true
    } catch (error) {
      console.error('Error declining payment request:', error)
      showSnackbar('Failed to decline request', 'error')
      return false
    } finally {
      setProcessingPaymentMessageId(null)
    }
  }



  // Handle add funds
  const handleAddFunds = () => {
    PaymentAPIService.openAddFundsPage()
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (paymentDialogOpen) {
      // Refresh balance every 30 seconds while dialog is open
      intervalId = setInterval(() => {
        fetchWalletBalance()
      }, 30000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [paymentDialogOpen, fetchWalletBalance])


  // Delete conversation/group
  const deleteConversation = async (conversationId: string) => {
    setIsDeletingConversation(true)
    try {
      const url = 'https://institutional-bo.paybito.com:8443/BitohubService/messaging/conversation/delete'

      const payload = {
        conversationId: parseInt(conversationId),
        userId: parseInt(currentUserId)
      }

      const response = await fetchWithAuth(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result: DeleteConversationResponse = await response.json()

      if (result.success && result.data) {
        showSnackbar('Conversation deleted successfully', 'success')

        // Remove conversation from list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId))

        // Clear selection if this was the selected conversation
        if (selectedConversation === conversationId) {
          setSelectedConversation(null)
          setSelectedConvCache(null)
          setMessages([])
        }

        return true
      } else {
        showSnackbar(result.message || 'Failed to delete conversation', 'error')
        return false
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      showSnackbar('Failed to delete conversation', 'error')
      return false
    } finally {
      setIsDeletingConversation(false)
    }
  }
  // Handle delete conversation

  const handleDeleteConversation = async () => {
    if (selectedConversation) {
      const conv = conversations.find(c => c.id === selectedConversation)
      const confirmMessage = conv?.type === 'group'
        ? `Are you sure you want to delete the group "${conv?.name}"? This will delete the conversation for all members and cannot be undone.`
        : `Are you sure you want to delete this conversation with "${conv?.name}"? This action cannot be undone.`

      if (window.confirm(confirmMessage)) {
        await deleteConversation(selectedConversation)
        setAnchorEl(null)
      }
    }
  }

  // Move conversation to top of the list
  const moveConversationToTop = useCallback((conversationId: string) => {
    setConversations(prev => {
      const index = prev.findIndex(c => c.id === conversationId)
      if (index <= 0) return prev // Already at top or not found

      const conversation = prev[index]
      const newList = [...prev]
      newList.splice(index, 1) // Remove from current position
      newList.unshift(conversation) // Add to beginning
      return newList
    })
  }, [])

  // Simple HTML Code Message Renderer Component
  const CodeMessageRenderer: React.FC<{ htmlContent: string; isOwn: boolean }> = ({ htmlContent, isOwn }) => {
    return (
      <Paper
        sx={{
          p: 2,
          maxWidth: '85%',
          minWidth: 150,
          bgcolor: isOwn ? 'primary.main' : (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
          color: isOwn ? 'white' : 'text.primary',
          borderRadius: 2,
          borderBottomRightRadius: isOwn ? 0 : 16,
          borderBottomLeftRadius: isOwn ? 16 : 0,
          overflow: 'hidden',
        }}
      >
        <Box
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          sx={{
            '& form': {
              margin: 0,
            },
            '& button': {
              cursor: 'pointer',
            },
            '& .crypto-checkout-btn': {
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              },
              '&:active': {
                transform: 'translateY(0)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            },
          }}
        />
      </Paper>
    )
  }


  return (
    <>
      <Box sx={{
        height: {
          xs: 'calc(100dvh - 80px)', // Dynamic viewport height for mobile
          md: 'calc(100vh - 80px)'
        },
        // Fallback for browsers that don't support dvh
        '@supports not (height: 100dvh)': {
          height: 'calc(100vh - 80px)',
        },
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        // Prevent iOS bounce scroll and contain scroll
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}>
        {(!selectedConversation || !isMobile) && (
          <ConversationList
            conversations={conversations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedConversation={selectedConversation}
            handleSelectConversation={handleSelectConversation}
            setCreateGroupDialog={handleOpenCreateGroupDialog}
            setCreateChannelDialog={setCreateChannelDialog}
            isLoadingConversations={isLoadingConversations || isLoadingChannels}
            handleSearchConversations={handleSearchConversations}
            pendingRequests={pendingRequests}
            isPendingRequestsExpanded={isPendingRequestsExpanded}
            setIsPendingRequestsExpanded={setIsPendingRequestsExpanded}
            isLoadingRequests={isLoadingRequests}
            handleAcceptRequest={handleAcceptRequest}
            handleRejectRequest={handleRejectRequest}
            isProcessingRequest={isProcessingRequest}
            isSocketConnected={isSocketConnected}
            discoveredChannels={discoveredChannels}
            isSearchingChannels={isSearchingChannels}
            channelInvitations={channelInvitations}
            isChannelInvitationsExpanded={isChannelInvitationsExpanded}
            setIsChannelInvitationsExpanded={setIsChannelInvitationsExpanded}
            isLoadingChannelInvitations={isLoadingChannelInvitations}
            handleAcceptChannelInvitation={handleAcceptChannelInvitation}
            handleRejectChannelInvitation={handleRejectChannelInvitation}
            isProcessingChannelInvitation={isProcessingChannelInvitation}
            activeUsers={activeUsers}
            isUserActive={isUserActive}
          />
        )}

        {/* Chat Interface */}
        <Box sx={{
          flex: 1,
          height: '100%',
          display: selectedConversation || !isMobile ? 'flex' : 'none',
          flexDirection: 'column',
          bgcolor: 'background.default',
          overflow: 'hidden',
          minHeight: 0, // Important for flex children to scroll properly
        }}>
          {selectedConversation ? (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isMobile && (
                      <IconButton
                        onClick={() => {
                          setSelectedConversation(null)
                          setSelectedConvCache(null) // ADD THIS
                        }}
                        sx={{ mr: 1 }}
                      >
                        <ArrowBackIcon />
                      </IconButton>
                    )}

                    {/* Avatar Section with Active Status */}
                    {selectedConv?.type === 'group' ? (
                      <Avatar
                        src={selectedConv.avatar}
                        onClick={() => selectedConv.avatar && setChatProfileImageOpen(true)}
                        sx={{
                          bgcolor: 'primary.main',
                          width: 40,
                          height: 40,
                          mr: 2,
                          cursor: selectedConv.avatar ? 'pointer' : 'default',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': selectedConv.avatar ? {
                            transform: 'scale(1.05)',
                            boxShadow: 3,
                          } : {}
                        }}
                      >
                        {!selectedConv.avatar && <GroupsIcon />}
                      </Avatar>
                    ) : selectedConv?.type === 'channel' ? (
                      <Avatar sx={{
                        bgcolor: selectedConv.isPublic ? 'success.main' : 'warning.main',
                        mr: 2,
                        width: 40,
                        height: 40,
                      }}>
                        {selectedConv.isPublic ? <PublicIcon /> : <LockIcon />}
                      </Avatar>
                    ) : (
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        variant="dot"
                        invisible={!isUserActive(selectedConv?.userId)}
                        sx={{
                          mr: 2,
                          '& .MuiBadge-badge': {
                            backgroundColor: '#44b700',
                            color: '#44b700',
                            boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            '&::after': {
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              animation: 'ripple 1.2s infinite ease-in-out',
                              border: '1px solid currentColor',
                              content: '""',
                            },
                          },
                          '@keyframes ripple': {
                            '0%': {
                              transform: 'scale(.8)',
                              opacity: 1,
                            },
                            '100%': {
                              transform: 'scale(2.4)',
                              opacity: 0,
                            },
                          },
                        }}
                      >
                        <Avatar
                          src={selectedConv?.avatar}
                          onClick={() => setChatProfileImageOpen(true)}
                          sx={{
                            bgcolor: selectedConv?.avatarColor,
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: 3,
                            }
                          }}
                        >
                          {!selectedConv?.avatar && selectedConv?.name?.[0]}
                        </Avatar>
                      </Badge>
                    )}

                    {/* Name and Status Section */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="600">
                          {selectedConv?.name}
                        </Typography>
                        {selectedConv?.type === 'channel' && (
                          <Chip
                            label="Channel"
                            size="small"
                            color="primary"
                            sx={{ height: 20 }}
                          />
                        )}
                      </Box>

                      {/* Group Info */}
                      {selectedConv?.type === 'group' && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedConv.memberCount} members
                        </Typography>
                      )}

                      {/* Channel Info */}
                      {selectedConv?.type === 'channel' && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedConv.subscriberCount} subscribers • {selectedConv.isPublic ? 'Public' : 'Private'}
                        </Typography>
                      )}

                      {/* Direct Message - Active Status */}
                      {selectedConv?.type === 'direct' && !getTypingIndicator() && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {isUserActive(selectedConv?.userId) ? (
                            <>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: '#44b700',
                                  animation: 'pulse 2s infinite',
                                  '@keyframes pulse': {
                                    '0%': {
                                      boxShadow: '0 0 0 0 rgba(68, 183, 0, 0.4)',
                                    },
                                    '70%': {
                                      boxShadow: '0 0 0 6px rgba(68, 183, 0, 0)',
                                    },
                                    '100%': {
                                      boxShadow: '0 0 0 0 rgba(68, 183, 0, 0)',
                                    },
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#44b700', fontWeight: 500 }}>
                                Active now
                              </Typography>
                            </>
                          ) : (
                            <>
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'grey.400',
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Offline
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}

                      {/* Typing Indicator - Shows instead of active status when someone is typing */}
                      {getTypingIndicator() && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.3,
                              alignItems: 'center',
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 4,
                                  height: 4,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                  animation: 'typingDot 1.4s infinite ease-in-out',
                                  animationDelay: `${i * 0.2}s`,
                                  '@keyframes typingDot': {
                                    '0%, 60%, 100%': {
                                      transform: 'translateY(0)',
                                      opacity: 0.4,
                                    },
                                    '30%': {
                                      transform: 'translateY(-4px)',
                                      opacity: 1,
                                    },
                                  },
                                }}
                              />
                            ))}
                          </Box>
                          <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic', ml: 0.5 }}>
                            {getTypingIndicator()}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box>
                    {selectedConv?.type === 'direct' && (
                      <>
                        {/* <Tooltip title="Voice Call">
            <IconButton disabled>
              <PhoneIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Video Call">
            <IconButton disabled>
              <VideoCallIcon />
            </IconButton>
          </Tooltip> */}
                      </>
                    )}
                    {selectedConv?.type === 'group' && isGroupAdmin() && (
                      <Tooltip title="Add Members">
                        <IconButton onClick={() => {
                          setAddMembersDialog(true)
                          fetchUserFollowers()
                        }}>
                          <PersonAddIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Info">
                      <IconButton onClick={(e) => {
                        setConversationInfoDialog(true)
                        // Load subscribers if it's a channel and user is owner or admin
                        if (selectedConv?.type === 'channel' && selectedConv.channelId && (selectedConv.isOwner || selectedConv.isAdmin)) {
                          getChannelSubscribers(selectedConv.channelId)
                        }
                      }}>
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                    {/* Only show menu for groups and channels, not direct chats */}
                    {/* Show menu for all conversation types */}
                    <Tooltip title="More Options">
                      <IconButton
                        onClick={(event) => {
                          event.stopPropagation()
                          setAnchorEl(event.currentTarget)
                        }}
                        aria-controls="conversation-menu"
                        aria-haspopup="true"
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>

              {/* Conversation Options Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                {/* CHANNEL OPTIONS */}
                {selectedConv?.type === 'channel' && selectedConv.isOwner && (
                  <>
                    <MenuItem onClick={handleOpenChannelSettings}>
                      <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Channel Settings</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleOpenInviteUsers}>
                      <ListItemIcon>
                        <PersonAddIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Invite Users</ListItemText>
                    </MenuItem>
                    <Divider />
                  </>
                )}

                {selectedConv?.type === 'channel' && !selectedConv.isOwner && (
                  <>
                    {selectedConv.isSubscribed ? (
                      <MenuItem
                        onClick={async () => {
                          if (selectedConv.channelId) {
                            await unsubscribeFromChannel(selectedConv.channelId)
                          }
                          setAnchorEl(null)
                        }}
                        disabled={isUnsubscribing}
                      >
                        <ListItemIcon>
                          {isUnsubscribing ? <CircularProgress size={20} /> : <LeaveIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText>Unsubscribe</ListItemText>
                      </MenuItem>
                    ) : (
                      <MenuItem
                        onClick={async () => {
                          if (selectedConv.channelId) {
                            await subscribeToChannel(selectedConv.channelId)
                          }
                          setAnchorEl(null)
                        }}
                        disabled={isSubscribing}
                      >
                        <ListItemIcon>
                          {isSubscribing ? <CircularProgress size={20} /> : <AddIcon fontSize="small" />}
                        </ListItemIcon>
                        <ListItemText>Subscribe</ListItemText>
                      </MenuItem>
                    )}
                    <Divider />
                  </>
                )}

                {selectedConv?.type === 'channel' && selectedConv.isSubscribed && (
                  <MenuItem
                    onClick={async () => {
                      if (selectedConv.channelId) {
                        if (channelMuted) {
                          await unmuteChannel(selectedConv.channelId)
                        } else {
                          await muteChannel(selectedConv.channelId)
                        }
                      }
                      setAnchorEl(null)
                    }}
                    disabled={isMutingChannel}
                  >
                    <ListItemIcon>
                      {isMutingChannel ? (
                        <CircularProgress size={20} />
                      ) : channelMuted ? (
                        <NotificationsIcon fontSize="small" />
                      ) : (
                        <NotificationsIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText>{channelMuted ? 'Unmute Channel' : 'Mute Channel'}</ListItemText>
                  </MenuItem>
                )}

                {selectedConv?.type === 'channel' && selectedConv.isOwner && (
                  <>
                    <Divider />
                    <MenuItem
                      onClick={handleDeleteChannel}
                      sx={{ color: 'error.main' }}
                      disabled={isDeletingChannel}
                    >
                      <ListItemIcon>
                        {isDeletingChannel ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" color="error" />}
                      </ListItemIcon>
                      <ListItemText>Delete Channel</ListItemText>
                    </MenuItem>
                  </>
                )}

                {/* GROUP OPTIONS */}
                {selectedConv?.type === 'group' && isGroupAdmin() && (
                  <MenuItem onClick={() => {
                    setAnchorEl(null)
                    handleEditGroupInfo()
                  }}>
                    <ListItemIcon>
                      <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Edit Group Info</ListItemText>
                  </MenuItem>
                )}

                {selectedConv?.type === 'group' && (
                  <>
                    <MenuItem
                      onClick={handleLeaveGroup}
                      disabled={isLeavingGroup}
                    >
                      <ListItemIcon>
                        {isLeavingGroup ? <CircularProgress size={20} /> : <LeaveIcon fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText>Leave Group</ListItemText>
                    </MenuItem>

                    {/* Delete Group - Only for Group Admins */}
                    {isGroupAdmin() && (
                      <MenuItem
                        onClick={handleDeleteConversation}
                        sx={{ color: 'error.main' }}
                        disabled={isDeletingConversation}
                      >
                        <ListItemIcon>
                          {isDeletingConversation ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" color="error" />}
                        </ListItemIcon>
                        <ListItemText>Delete Group</ListItemText>
                      </MenuItem>
                    )}
                  </>
                )}

                {/* DIRECT CONVERSATION OPTIONS */}
                {selectedConv?.type === 'direct' && (
                  <MenuItem
                    onClick={handleDeleteConversation}
                    sx={{ color: 'error.main' }}
                    disabled={isDeletingConversation}
                  >
                    <ListItemIcon>
                      {isDeletingConversation ? <CircularProgress size={20} /> : <DeleteIcon fontSize="small" color="error" />}
                    </ListItemIcon>
                    <ListItemText>Delete Conversation</ListItemText>
                  </MenuItem>
                )}
              </Menu>

              {/* Channel Join Banner */}
              {selectedConv?.type === 'channel' && !selectedConv.isSubscribed && (
                <Alert
                  severity="info"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        if (selectedConv.channelId) {
                          subscribeToChannel(selectedConv.channelId)
                        }
                      }}
                      disabled={isSubscribing}
                      startIcon={isSubscribing ? <CircularProgress size={16} /> : null}
                    >
                      {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                    </Button>
                  }
                  sx={{ m: 2, flexShrink: 0 }}
                >
                  Subscribe to this channel to receive updates
                </Alert>
              )}

              {/* Creating Conversation Loading */}
              {isCreatingConversation && (
                <Box sx={{ p: 2, flexShrink: 0 }}>
                  <Alert severity="info" icon={<CircularProgress size={20} />}>
                    Starting conversation...
                  </Alert>
                </Box>
              )}
              {/* Pinned Messages Section - Collapsible */}
              {selectedConv?.type === 'channel' && messages.filter(m => m.isPinned).length > 0 && (
                <Card
                  sx={{
                    m: 2,
                    bgcolor: 'warning.50',
                    border: '1px solid',
                    borderColor: 'warning.200',
                    flexShrink: 0,
                    boxShadow: 1,
                  }}
                >
                  <CardContent sx={{ p: 1.5, pb: isPinnedMessagesExpanded ? 1 : 1.5, '&:last-child': { pb: isPinnedMessagesExpanded ? 1 : 1.5 } }}>
                    {/* Header - Always visible */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        '&:hover': {
                          '& .MuiTypography-root': {
                            color: 'warning.dark',
                          }
                        }
                      }}
                      onClick={() => setIsPinnedMessagesExpanded(!isPinnedMessagesExpanded)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge
                          badgeContent={messages.filter(m => m.isPinned).length}
                          color="warning"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.7rem',
                              minWidth: '18px',
                              height: '18px',
                            }
                          }}
                        >
                          <CheckIcon sx={{ color: 'warning.main' }} />
                        </Badge>
                        <Box>
                          <Typography variant="body2" fontWeight="bold" color="warning.dark">
                            Pinned Messages
                          </Typography>
                          {!isPinnedMessagesExpanded && messages.filter(m => m.isPinned).length > 0 && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: { xs: 150, sm: 300 } }}>
                              {messages.filter(m => m.isPinned)[0].text}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        sx={{
                          transform: isPinnedMessagesExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease',
                        }}
                      >
                        {isPinnedMessagesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Collapsible Content */}
                    <Collapse in={isPinnedMessagesExpanded}>
                      <Box sx={{ mt: 2 }}>
                        <Stack
                          spacing={1}
                          sx={{
                            maxHeight: 300,
                            overflow: 'auto',
                            '&::-webkit-scrollbar': {
                              width: '6px',
                            },
                            '&::-webkit-scrollbar-track': {
                              bgcolor: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              bgcolor: 'warning.300',
                              borderRadius: '3px',
                              '&:hover': {
                                bgcolor: 'warning.400',
                              },
                            },
                          }}
                        >
                          {messages.filter(m => m.isPinned).map((msg, index) => (
                            <Card
                              key={msg.id}
                              sx={{
                                cursor: 'pointer',
                                bgcolor: 'background.paper',
                                '&:hover': {
                                  bgcolor: 'action.hover',
                                  boxShadow: 2,
                                },
                                transition: 'all 0.2s',
                                border: '1px solid',
                                borderColor: 'warning.200',
                              }}
                              onClick={() => {
                                // Scroll to message in main list
                                const messageElement = document.getElementById(`message-${msg.id}`)
                                if (messageElement) {
                                  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  // Highlight the message briefly
                                  messageElement.style.transition = 'background-color 0.3s ease'
                                  messageElement.style.backgroundColor = 'rgba(255, 193, 7, 0.3)'
                                  setTimeout(() => {
                                    messageElement.style.backgroundColor = ''
                                  }, 2000)
                                }
                              }}
                            >
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                {/* Pin Badge */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                  <Chip
                                    label={`Pin ${index + 1}`}
                                    size="small"
                                    icon={<CheckIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                      height: 20,
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      bgcolor: 'warning.main',
                                      color: 'white',
                                      '& .MuiChip-icon': {
                                        color: 'white',
                                      }
                                    }}
                                  />
                                  {(selectedConv.isOwner || selectedConv.canSendMessage) && (
                                    <Tooltip title="Unpin message">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          unpinChannelMessage(msg.id)
                                        }}
                                        disabled={isPinningMessage}
                                        sx={{
                                          width: 24,
                                          height: 24,
                                          '&:hover': {
                                            bgcolor: 'error.light',
                                            color: 'error.dark',
                                          }
                                        }}
                                      >
                                        {isPinningMessage ? (
                                          <CircularProgress size={16} />
                                        ) : (
                                          <CloseIcon sx={{ fontSize: 16 }} />
                                        )}
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>

                                {/* Message Content */}
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                  <Avatar
                                    src={msg.senderProfilePicture || undefined}
                                    sx={{ width: 36, height: 36, bgcolor: 'primary.main', flexShrink: 0 }}
                                  >
                                    {msg.senderName?.[0]}
                                  </Avatar>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Typography variant="body2" fontWeight="600" noWrap>
                                        {msg.senderName}
                                      </Typography>
                                      {msg.isEdited && (
                                        <Chip
                                          label="Edited"
                                          size="small"
                                          sx={{
                                            height: 16,
                                            fontSize: '0.65rem',
                                            bgcolor: 'action.hover',
                                          }}
                                        />
                                      )}
                                    </Box>

                                    {/* Message Text */}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        color: 'text.primary',
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {msg.text}
                                    </Typography>

                                    {/* Media Preview */}
                                    {msg.mediaUrl && msg.messageType === 'IMAGE' && (
                                      <Box
                                        component="img"
                                        src={msg.mediaUrl}
                                        alt="Pinned image"
                                        sx={{
                                          maxWidth: '100%',
                                          maxHeight: 120,
                                          borderRadius: 1,
                                          mt: 1,
                                          objectFit: 'cover',
                                          border: '1px solid',
                                          borderColor: 'divider',
                                        }}
                                      />
                                    )}

                                    {msg.mediaUrl && msg.messageType !== 'IMAGE' && msg.messageType !== 'TEXT' && (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          mt: 1,
                                          p: 1,
                                          bgcolor: 'action.hover',
                                          borderRadius: 1,
                                          border: '1px solid',
                                          borderColor: 'divider',
                                        }}
                                      >
                                        {getFileIcon(msg.messageType)}
                                        <Typography variant="caption" color="text.secondary">
                                          {msg.messageType === 'VIDEO' ? 'Video' : 'File'} attachment
                                        </Typography>
                                      </Box>
                                    )}

                                    {/* Message Footer */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 12 }} />
                                        {msg.time}
                                      </Typography>

                                      {(msg.reactionCount ?? 0) > 0 && (
                                        <Chip
                                          label={`${msg.reactionCount ?? 0} reactions`}
                                          size="small"
                                          icon={<EmojiIcon sx={{ fontSize: 14 }} />}
                                          sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                          }}
                                        />
                                      )}

                                      {(msg.commentCount ?? 0) > 0 && (
                                        <Chip
                                          label={`${msg.commentCount ?? 0} comments`}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '0.65rem',
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>

                        {/* Footer Info */}
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'warning.300' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <InfoIcon sx={{ fontSize: 14 }} />
                            Click on any pinned message to jump to it in the conversation
                          </Typography>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              )}


              {/* Messages Area */}
              <Box
                id="messages-container"
                ref={messagesContainerRef}
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  minWidth: 0,
                  maxWidth: '100%',
                  // Mobile scroll fixes
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                  // Ensure proper scrolling on mobile
                  minHeight: 0,
                }}
              >
                {/* Loading more messages indicator at the top */}
                {isLoadingMoreMessages && (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2,
                    position: 'sticky',
                    top: 0,
                    bgcolor: 'background.default',
                    zIndex: 10,
                    borderRadius: 1,
                  }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'background.paper',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      boxShadow: 1,
                    }}>
                      <CircularProgress size={20} />
                      <Typography variant="caption" color="text.secondary">
                        Loading older messages...
                      </Typography>
                    </Box>
                  </Box>
                )}

                {isLoadingMessages ? (
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CircularProgress />
                  </Box>
                ) : messages.length > 0 ? (
                  <>
                    {/* Show "Load More" button if there are more messages */}
                    {hasMoreMessages && !isLoadingMoreMessages && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', pb: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={loadMoreMessages}
                          startIcon={<ExpandLessIcon />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                          }}
                        >
                          Load {totalRecords - messages.length} more messages
                        </Button>
                      </Box>
                    )}

                    {messages.map((message) => (
                      <Box key={message.id} id={`message-${message.id}`}>
                        {/* Show sender name for group messages */}
                        {selectedConv?.type === 'group' && !message.isOwn && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {message.senderName}
                          </Typography>
                        )}

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-start',
                            gap: 1,
                            maxWidth: '100%',
                            minWidth: 0,
                          }}
                        >
                          {/* Show avatar for group messages */}
                          {selectedConv?.type === 'group' && !message.isOwn && (
                            <Avatar
                              src={message.senderProfilePicture || undefined}
                              sx={{ width: 32, height: 32, bgcolor: 'grey.500' }}
                            >
                              {message.senderName?.[0]}
                            </Avatar>
                          )}

                          {/* CHECK IF IT'S A PAYMENT MESSAGE - RENDER PAYMENT COMPONENT */}
                          {(message.messageType === 'PAYMENT' || message.messageType === 'PAYMENT_REQUEST' || message.messageType === 'PAYMENT_DECLINE') && message.paymentData ? (
                            <PaymentMessage
                              payment={message.paymentData}
                              isOwn={message.isOwn}
                              currentUserId={currentUserId}
                              walletBalance={walletBalance}
                              onPayRequest={handlePayRequestFromMessage}      // Changed: Opens dialog instead of direct call
                              onDeclineRequest={handleDeclinePaymentRequest}  // NEW: Added decline handler
                              onAddFunds={handleAddFunds}
                              onFetchBalance={fetchWalletBalance}
                              isProcessing={isProcessingPayment}
                              processingMessageId={processingPaymentMessageId} // NEW: Track which message is processing
                            />
                          )
                            :
                            message.messageType === 'CODE' ? (
                              /* CODE/HTML MESSAGE - RENDER HTML CONTENT */
                              <CodeMessageRenderer
                                htmlContent={message.text}
                                isOwn={message.isOwn}
                              />
                            ) :
                              (
                                /* REGULAR MESSAGE RENDERING - YOUR EXISTING CODE */
                                <>
                                  {editingMessageId === message.id ? (
                                    /* EDIT MODE */
                                    <Box sx={{
                                      maxWidth: '70%',
                                      width: '100%',
                                      display: 'flex',
                                      gap: 1,
                                      alignItems: 'center'
                                    }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={editMessageText}
                                        onChange={(e) => setEditMessageText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleSaveEditMessage()
                                          }
                                          if (e.key === 'Escape') {
                                            handleCancelEditMessage()
                                          }
                                        }}
                                        autoFocus
                                        disabled={isUpdatingMessage}
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            bgcolor: 'background.paper'
                                          }
                                        }}
                                      />
                                      <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={handleSaveEditMessage}
                                        disabled={!editMessageText.trim() || isUpdatingMessage}
                                      >
                                        {isUpdatingMessage ? <CircularProgress size={20} /> : <CheckIcon />}
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={handleCancelEditMessage}
                                        disabled={isUpdatingMessage}
                                      >
                                        <CloseIcon />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    /* NORMAL MESSAGE DISPLAY */
                                    <Paper
                                      sx={{
                                        p: 1.5,
                                        maxWidth: '70%',
                                        minWidth: 0,
                                        bgcolor: message.isOwn
                                          ? 'primary.main'
                                          : message.isAnnouncement
                                            ? 'warning.light'
                                            : message.isPinned
                                              ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 193, 7, 0.15)' : 'warning.50'
                                              : (theme) => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                        color: message.isOwn
                                          ? 'white'
                                          : message.isAnnouncement
                                            ? 'warning.contrastText'
                                            : 'text.primary',
                                        borderRadius: 2,
                                        borderBottomRightRadius: message.isOwn ? 0 : 16,
                                        borderBottomLeftRadius: message.isOwn ? 16 : 0,
                                        position: 'relative',
                                        wordBreak: 'break-word',
                                        overflowWrap: 'break-word',
                                        hyphens: 'auto',
                                        overflow: 'hidden',
                                        ...(message.isPinned && !message.isOwn && {
                                          border: '2px solid',
                                          borderColor: 'warning.main',
                                        }),
                                        '&:hover .message-actions': {
                                          opacity: 1
                                        }
                                      }}
                                    >
                                      {/* Pin Indicator */}
                                      {message.isPinned && (
                                        <Box
                                          sx={{
                                            position: 'absolute',
                                            top: -8,
                                            left: message.isOwn ? 'auto' : 8,
                                            right: message.isOwn ? 8 : 'auto',
                                            bgcolor: 'warning.main',
                                            color: 'white',
                                            borderRadius: 1,
                                            px: 1,
                                            py: 0.25,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            boxShadow: 1,
                                            zIndex: 1,
                                          }}
                                        >
                                          <PinIcon sx={{ fontSize: 12 }} />
                                          PINNED
                                        </Box>
                                      )}

                                      {/* Message Actions Menu Button */}
                                      {message.isOwn && (
                                        <IconButton
                                          className="message-actions"
                                          size="small"
                                          onClick={(e) => handleMessageMenuOpen(e, message)}
                                          sx={{
                                            position: 'absolute',
                                            top: 4,
                                            right: 4,
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            color: 'white',
                                            bgcolor: 'rgba(0,0,0,0.2)',
                                            '&:hover': {
                                              bgcolor: 'rgba(0,0,0,0.3)'
                                            }
                                          }}
                                        >
                                          <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                      )}

                                      {message.mediaUrl && (message.messageType === 'IMAGE' || message.messageType === 'GIF') && (
  (() => {
    const allUrls = message.mediaUrl!.split(',').map((u: string) => u.trim()).filter(Boolean);

    // Helper to detect if URL is an image
    const isImageUrl = (url: string) => {
      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
    };

    // Helper to detect if URL is a video
    const isVideoUrl = (url: string) => {
      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
      return ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext);
    };

    // Get file name from URL
    const getFileName = (url: string) => {
      const parts = url.split('/').pop()?.split('_') || [];
      return parts.length > 1 ? parts.slice(1).join('_') : (url.split('/').pop() || 'file');
    };

    // Get file extension
    const getFileExt = (url: string) => {
      return (url.split('.').pop()?.split('?')[0]?.toUpperCase() || 'FILE');
    };

    // Separate images and non-image files
    const imageUrls = allUrls.filter(isImageUrl);
    const fileUrls = allUrls.filter(u => !isImageUrl(u) && !isVideoUrl(u));
    const videoUrls = allUrls.filter(isVideoUrl);

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

        {/* === IMAGE GRID === */}
        {imageUrls.length > 0 && (() => {
          const count = imageUrls.length;
          if (count === 1) {
            return (
              <Box
                component="img"
                src={imageUrls[0]}
                alt="shared image"
                onClick={() => handleMediaClick(imageUrls[0], 'IMAGE')}
                sx={{
                  maxHeight: 300,
                  maxWidth: '100%',
                  borderRadius: 1,
                  objectFit: 'contain',
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.9 },
                }}
              />
            );
          }
          // Multi-image grid
          const gridTemplateColumns =
            count === 2 ? '1fr 1fr' :
            count === 3 ? '1fr 1fr' :
            count === 4 ? '1fr 1fr' :
            '1fr 1fr 1fr'; // 5

          return (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns,
              gap: 0.5,
              borderRadius: 1,
              overflow: 'hidden',
            }}>
              {imageUrls.map((url: string, imgIdx: number) => (
                <Box
                  key={imgIdx}
                  component="img"
                  src={url}
                  alt={`image-${imgIdx}`}
                  onClick={() => handleMediaClick(imageUrls[imgIdx], 'IMAGE')}
                  sx={{
                    width: '100%',
                    height: count <= 2 ? 180 : count <= 4 ? 120 : 110,
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 0.85, transform: 'scale(1.03)' },
                    ...(count === 3 && imgIdx === 0 ? { gridColumn: '1 / -1', height: 160 } : {}),
                    ...(count === 5 && imgIdx < 2 ? { height: 140 } : {}),
                  }}
                />
              ))}
            </Box>
          );
        })()}

        {/* === VIDEO FILES === */}
        {videoUrls.map((url: string, vidIdx: number) => (
          <Box key={`vid-${vidIdx}`} sx={{ borderRadius: 1, overflow: 'hidden' }}>
            <video
              src={url}
              controls
              style={{
                maxHeight: 250,
                maxWidth: '100%',
                borderRadius: 4,
              }}
            />
          </Box>
        ))}

        {/* === NON-IMAGE FILE CARDS (PDF, DOC, etc.) === */}
        {fileUrls.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {fileUrls.map((url: string, fileIdx: number) => {
              const fileName = getFileName(url);
              const fileExt = getFileExt(url);

              // Color coding by file type
              const extColors: Record<string, { bg: string; color: string; icon: string }> = {
                PDF:  { bg: '#FFEBEE', color: '#D32F2F', icon: '📄' },
                DOC:  { bg: '#E3F2FD', color: '#1565C0', icon: '📝' },
                DOCX: { bg: '#E3F2FD', color: '#1565C0', icon: '📝' },
                XLS:  { bg: '#E8F5E9', color: '#2E7D32', icon: '📊' },
                XLSX: { bg: '#E8F5E9', color: '#2E7D32', icon: '📊' },
                ZIP:  { bg: '#FFF3E0', color: '#E65100', icon: '📦' },
                RAR:  { bg: '#FFF3E0', color: '#E65100', icon: '📦' },
                TXT:  { bg: '#F3E5F5', color: '#7B1FA2', icon: '📃' },
              };
              const style = extColors[fileExt] || { bg: '#F5F5F5', color: '#616161', icon: '📎' };

              return (
                <Box
                  key={`file-${fileIdx}`}
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: 1.5,
                    bgcolor: style.bg,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: '1px solid',
                    borderColor: 'transparent',
                    '&:hover': {
                      borderColor: style.color,
                      boxShadow: 1,
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {/* File type badge */}
                  <Box sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 1,
                    bgcolor: style.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    flexShrink: 0,
                    letterSpacing: 0.5,
                  }}>
                    {fileExt}
                  </Box>

                  {/* File info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                      }}
                    >
                      {fileName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                      {fileExt} File • Tap to download
                    </Typography>
                  </Box>

                  {/* Download icon */}
                  <DownloadIcon sx={{ fontSize: 20, color: style.color, flexShrink: 0 }} />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    );
  })()
)}

                                      {/* Display video if mediaUrl exists and type is VIDEO */}
                                      {message.mediaUrl && message.messageType === 'VIDEO' && (
                                        <Box
                                          sx={{
                                            maxWidth: '100%',
                                            borderRadius: 1,
                                            mb: message.text ? 1 : 0,
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                          }}
                                          onClick={() => handleMediaClick(message.mediaUrl!, 'VIDEO')}
                                        >
                                          <Box
                                            sx={{
                                              position: 'relative',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              bgcolor: 'rgba(0,0,0,0.8)',
                                              p: 3,
                                              borderRadius: 1,
                                              '&:hover': {
                                                bgcolor: 'rgba(0,0,0,0.9)',
                                              }
                                            }}
                                          >
                                            <VideoIcon sx={{ fontSize: 48, color: 'white', mr: 1 }} />
                                            <Typography variant="body2" sx={{ color: 'white' }}>
                                              Click to play video
                                            </Typography>
                                          </Box>
                                        </Box>
                                      )}

                                      {/* Display file attachment for FILE type */}
                                      {message.mediaUrl && message.messageType === 'FILE' && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            mb: message.text ? 1 : 0,
                                            p: 1,
                                            bgcolor: 'rgba(0,0,0,0.1)',
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            '&:hover': {
                                              bgcolor: 'rgba(0,0,0,0.15)',
                                            }
                                          }}
                                          onClick={() => window.open(message.mediaUrl, '_blank')}
                                        >
                                          <FileIcon />
                                          <Typography variant="caption">
                                            File attachment - Click to download
                                          </Typography>
                                        </Box>
                                      )}

                                      {/* Message Text with Clickable Links */}
                                      {message.text && (
                                        <Typography
                                          variant="body1"
                                          component="div"
                                          sx={{
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            hyphens: 'auto',
                                            maxWidth: '100%',
                                            '& a': {
                                              color: message.isOwn ? '#bbdefb' : 'primary.main',
                                              textDecoration: 'underline',
                                              '&:hover': {
                                                color: message.isOwn ? '#e3f2fd' : 'primary.dark',
                                              },
                                            }
                                          }}
                                        >
                                          {renderMessageWithLinks(message.text, message.isOwn)}
                                        </Typography>
                                      )}

                                      {/* Message Time and Edit Indicator */}
                                      <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        mt: 0.5
                                      }}>
                                        <Typography
                                          variant="caption"
                                          sx={{ opacity: 0.7 }}
                                        >
                                          {message.time}
                                        </Typography>
                                        {message.isEdited && (
                                          <Typography
                                            variant="caption"
                                            sx={{ opacity: 0.7, fontStyle: 'italic' }}
                                          >
                                            (edited)
                                          </Typography>
                                        )}
                                      </Box>

                                      {/* Reactions Display */}
                                      {message.reactions && message.reactions.length > 0 && (
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 0.5,
                                            mt: 1,
                                            pt: 1,
                                            borderTop: 1,
                                            borderColor: message.isOwn ? 'rgba(255,255,255,0.2)' : 'divider',
                                          }}
                                        >
                                          {message.reactions.map((reaction) => (
                                            <Tooltip
                                              key={reaction.emoji}
                                              title={
                                                <Box>
                                                  {reaction.users.slice(0, 5).map((user, idx) => (
                                                    <Typography key={idx} variant="caption" display="block">
                                                      {user.fullName || `User ${user.userId}`}
                                                    </Typography>
                                                  ))}
                                                  {reaction.users.length > 5 && (
                                                    <Typography variant="caption" display="block">
                                                      and {reaction.users.length - 5} more...
                                                    </Typography>
                                                  )}
                                                </Box>
                                              }
                                            >
                                              <Chip
                                                label={`${reaction.emoji} ${reaction.count}`}
                                                size="small"
                                                onClick={() => handleQuickReaction(reaction.emoji, message)}
                                                disabled={isSendingReaction}
                                                sx={{
                                                  height: 24,
                                                  fontSize: '0.75rem',
                                                  cursor: 'pointer',
                                                  bgcolor: reaction.hasReacted
                                                    ? (message.isOwn ? 'rgba(255,255,255,0.3)' : 'primary.light')
                                                    : (message.isOwn ? 'rgba(255,255,255,0.15)' : 'action.hover'),
                                                  color: message.isOwn ? 'white' : 'text.primary',
                                                  border: reaction.hasReacted ? 1 : 0,
                                                  borderColor: message.isOwn ? 'rgba(255,255,255,0.5)' : 'primary.main',
                                                  '&:hover': {
                                                    bgcolor: reaction.hasReacted
                                                      ? (message.isOwn ? 'rgba(255,255,255,0.4)' : 'primary.main')
                                                      : (message.isOwn ? 'rgba(255,255,255,0.25)' : 'action.selected'),
                                                  },
                                                  '& .MuiChip-label': {
                                                    px: 1,
                                                  }
                                                }}
                                              />
                                            </Tooltip>
                                          ))}

                                          {/* Add Reaction Button */}
                                          <Tooltip title="Add reaction">
                                            <IconButton
                                              size="small"
                                              onClick={(e) => handleReactionPickerToggle(e, message)}
                                              disabled={isSendingReaction}
                                              sx={{
                                                width: 24,
                                                height: 24,
                                                bgcolor: message.isOwn ? 'rgba(255,255,255,0.15)' : 'action.hover',
                                                color: message.isOwn ? 'white' : 'text.secondary',
                                                '&:hover': {
                                                  bgcolor: message.isOwn ? 'rgba(255,255,255,0.25)' : 'action.selected',
                                                }
                                              }}
                                            >
                                              <EmojiIcon sx={{ fontSize: 14 }} />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      )}

                                      {/* Quick Reactions Bar (on hover) - Only show if no reactions exist */}
                                      {!message.reactions?.length && (
                                        <Box
                                          className="message-actions"
                                          sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: message.isOwn ? 'auto' : 0,
                                            right: message.isOwn ? 0 : 'auto',
                                            display: 'flex',
                                            gap: 0.25,
                                            bgcolor: 'background.paper',
                                            borderRadius: 2,
                                            boxShadow: 2,
                                            p: 0.5,
                                            opacity: 0,
                                            transition: 'opacity 0.2s',
                                            zIndex: 1,
                                          }}
                                        >
                                          {QUICK_REACTIONS.map((emoji) => (
                                            <IconButton
                                              key={emoji}
                                              size="small"
                                              onClick={() => handleQuickReaction(emoji, message)}
                                              disabled={isSendingReaction}
                                              sx={{
                                                width: 28,
                                                height: 28,
                                                fontSize: '1rem',
                                                '&:hover': {
                                                  transform: 'scale(1.2)',
                                                },
                                                transition: 'transform 0.2s',
                                              }}
                                            >
                                              {emoji}
                                            </IconButton>
                                          ))}
                                          <IconButton
                                            size="small"
                                            onClick={(e) => handleReactionPickerToggle(e, message)}
                                            disabled={isSendingReaction}
                                            sx={{
                                              width: 28,
                                              height: 28,
                                            }}
                                          >
                                            <EmojiIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Box>
                                      )}
                                    </Paper>
                                  )}
                                </>
                              )}
                        </Box>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                  }}>
                    <ChatIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                    <Typography color="text.secondary">
                      {selectedConv?.type === 'channel'
                        ? 'No announcements yet'
                        : `Start messaging with ${selectedConv?.name}`}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Message Input */}
              {(selectedConv?.type !== 'channel' || selectedConv?.canSendMessage) && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    flexShrink: 0,
                  }}
                >
                  {/* File Previews with individual remove & Add More */}
{selectedFiles.length > 0 && (
  <Box sx={{
    display: 'flex',
    gap: 1,
    mb: 1.5,
    p: 1,
    overflowX: 'auto',
    bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    '&::-webkit-scrollbar': { height: 4 },
    '&::-webkit-scrollbar-thumb': { bgcolor: 'action.disabled', borderRadius: 2 },
  }}>
    {/* Clear All button */}
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      pr: 1,
      borderRight: '1px solid',
      borderColor: 'divider',
      flexShrink: 0,
    }}>
      <Tooltip title="Clear all files">
        <IconButton
          size="small"
          onClick={handleClearFiles}
          disabled={isUploadingFile}
          sx={{
            bgcolor: 'error.light',
            color: 'error.dark',
            width: 28,
            height: 28,
            '&:hover': { bgcolor: 'error.main', color: 'white' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Box>

    {/* Individual file preview cards */}
    {selectedFiles.map((file, index) => (
      <Card
        key={index}
        sx={{
          width: 110,
          minWidth: 110,
          flexShrink: 0,
          position: 'relative',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 1,
          overflow: 'visible',
        }}
      >
        {/* Remove button */}
        <IconButton
          size="small"
          onClick={() => handleRemoveFile(index)}
          disabled={isUploadingFile}
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            bgcolor: 'error.main',
            color: 'white',
            width: 22,
            height: 22,
            zIndex: 2,
            boxShadow: 2,
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>

        {/* Image preview or file icon */}
        {file.type.startsWith('image/') && filePreviews[index] ? (
          <Box
            component="img"
            src={filePreviews[index]}
            alt={file.name}
            sx={{
              width: '100%',
              height: 80,
              objectFit: 'cover',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: file.type.startsWith('video/')
                ? 'info.light'
                : 'action.hover',
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
            }}
          >
            {file.type.startsWith('video/') ? (
              <VideoIcon sx={{ fontSize: 36, color: 'info.dark' }} />
            ) : (
              <FileIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
            )}
          </Box>
        )}

        {/* File name */}
        <Box sx={{ px: 0.5, py: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontSize: '0.6rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'text.secondary',
              lineHeight: 1.2,
            }}
          >
            {file.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: '0.55rem', color: 'text.disabled' }}
          >
            {(file.size / 1024).toFixed(0)} KB
          </Typography>
        </Box>
      </Card>
    ))}

    {/* "Add More" card */}
    {selectedFiles.length < MAX_FILES && (
      <Card
        sx={{
          width: 110,
          minWidth: 110,
          minHeight: 105,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isUploadingFile ? 'default' : 'pointer',
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'transparent',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: isUploadingFile ? 'divider' : 'primary.main',
            bgcolor: isUploadingFile ? 'transparent' : 'action.hover',
          },
        }}
        onClick={() => !isUploadingFile && fileInputRef.current?.click()}
      >
        <CardContent sx={{ p: 1, textAlign: 'center', '&:last-child': { pb: 1 } }}>
          <AddIcon sx={{ fontSize: 28, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
            Add More
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled' }}>
            {selectedFiles.length}/{MAX_FILES}
          </Typography>
        </CardContent>
      </Card>
    )}
  </Box>
)}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      accept="image/*,video/*,.pdf,.doc,.docx,.gif"
                      multiple
                    />
                    <Tooltip title={selectedFiles.length >= MAX_FILES ? `Max ${MAX_FILES} files` : 'Attach files'}>
                      <span>
                        <IconButton
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingFile || isSendingMessage || selectedFiles.length >= MAX_FILES}
                        >
                          {isUploadingFile ? (
                            <CircularProgress size={24} />
                          ) : (
                            <Badge
                              badgeContent={selectedFiles.length > 0 ? selectedFiles.length : 0}
                              color="primary"
                              invisible={selectedFiles.length === 0}
                            >
                              <AttachIcon />
                            </Badge>
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <IconButton
                      onClick={handlePaymentIconClick}
                      disabled={
                        isSendingMessage ||
                        isCreatingConversation ||
                        !selectedConversation ||
                        selectedConv?.type !== 'direct'
                      }
                      sx={{
                        color: 'success.main',
                        '&:hover': {
                          bgcolor: 'success.light',
                        },
                        '&:disabled': {
                          color: 'action.disabled',
                        }
                      }}
                    >
                      <AttachMoneyIcon />
                    </IconButton>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder={
                        selectedConv?.type === 'channel'
                          ? "Send an announcement..."
                          : "Type a message..."
                      }
                      value={messageText}
                      onChange={handleMessageTextChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={isSendingMessage || isCreatingConversation || isUploadingFile}
                      inputRef={messageInputRef}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                          '& fieldset': {
                            borderColor: 'transparent',
                          },
                          '&:hover fieldset': {
                            borderColor: 'action.disabled',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleEmojiPickerToggle}
                      disabled={isSendingMessage || isCreatingConversation || isUploadingFile}
                      color={showEmojiPicker ? 'primary' : 'default'}
                    >
                      <EmojiIcon />
                    </IconButton>

                    <IconButton
                      onClick={handleGifPickerToggle}
                      disabled={isSendingMessage || isCreatingConversation || isUploadingFile || isSendingGif}
                      color={showGifPicker ? 'primary' : 'default'}
                    >
                      {isSendingGif ? <CircularProgress size={24} /> : <GifIcon />}
                    </IconButton>

                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={(!messageText.trim() && selectedFiles.length === 0) || isSendingMessage || isCreatingConversation || isUploadingFile || isSendingGif || !isSocketConnected}

                    >
                      {isSendingMessage ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton>
                    {/* <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={(!messageText.trim() && !selectedFile) || isSendingMessage || isCreatingConversation || isUploadingFile || !isSocketConnected}
                    >
                      {isSendingMessage ? <CircularProgress size={24} /> : <SendIcon />}
                    </IconButton> */}


                  </Box>

                  {/* Connection Warning */}
                  {!isSocketConnected && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                      Disconnected from real-time messaging. Reconnecting...
                    </Typography>
                  )}
                </Paper>
              )}
            </>
          ) : (
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
            }}>
              <MailIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start messaging
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Message Context Menu */}
      {/* Message Context Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
      >
        {selectedMessageForMenu?.isOwn && (
          <>
            <MenuItem onClick={handleEditMessage}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteMessage} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}

        {/* Pin/Unpin option for channel messages (owner/admin only) */}
        {selectedConv?.type === 'channel' &&
          (selectedConv.isOwner || selectedConv.canSendMessage) &&
          selectedMessageForMenu && (
            <>
              {selectedMessageForMenu.isOwn && <Divider />}
              <MenuItem
                onClick={async () => {
                  if (selectedMessageForMenu) {
                    if (selectedMessageForMenu.isPinned) {
                      await unpinChannelMessage(selectedMessageForMenu.id)
                    } else {
                      await pinChannelMessage(selectedMessageForMenu.id)
                    }
                  }
                  handleMessageMenuClose()
                }}
                disabled={isPinningMessage}
              >
                <ListItemIcon>
                  {isPinningMessage ? (
                    <CircularProgress size={20} />
                  ) : selectedMessageForMenu.isPinned ? (
                    <CloseIcon fontSize="small" />
                  ) : (
                    <CheckIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {selectedMessageForMenu.isPinned ? 'Unpin Message' : 'Pin Message'}
                </ListItemText>
              </MenuItem>
            </>
          )}
      </Menu>

      {/* Create Group Dialog */}
      <Dialog
        open={createGroupDialog}
        onClose={() => !isCreatingGroup && setCreateGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Create New Group
            <IconButton onClick={() => setCreateGroupDialog(false)} size="small" disabled={isCreatingGroup}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Group Name"
              fullWidth
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              disabled={isCreatingGroup}
            />
            <TextField
              label="Group Image URL (Optional)"
              fullWidth
              value={newGroupImage}
              onChange={(e) => setNewGroupImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isCreatingGroup}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ImageIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              multiple
              options={availableUsers}
              getOptionLabel={(option) => option.name}
              value={selectedMembers}
              onChange={(e, newValue) => setSelectedMembers(newValue)}
              loading={isLoadingUsers}
              disabled={isCreatingGroup}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Add Members"
                  placeholder="Search users..."
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props as { key: string;[key: string]: unknown }
                return (
                  <Box component="li" key={key} {...restProps}>
                    <Avatar
                      src={option.profilePicture || undefined}
                      sx={{ mr: 2, bgcolor: option.avatarColor, width: 32, height: 32 }}
                    >
                      {option.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.username}</Typography>
                    </Box>
                  </Box>
                )
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip
                      {...tagProps}
                      key={key}
                      label={option.name}
                      avatar={
                        <Avatar
                          src={option.profilePicture || undefined}
                          sx={{ bgcolor: option.avatarColor }}
                        >
                          {option.avatar}
                        </Avatar>
                      }
                      disabled={isCreatingGroup}
                    />
                  )
                })
              }
            />
            <Alert severity="info" icon={<InfoIcon />}>
              Select followers or people you follow to add to the group
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateGroupDialog(false)} disabled={isCreatingGroup}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroupName || selectedMembers.length === 0 || isCreatingGroup}
            startIcon={isCreatingGroup ? <CircularProgress size={20} /> : <GroupsIcon />}
          >
            {isCreatingGroup ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      {/* Edit Group Dialog */}
      <Dialog
        open={editGroupDialog}
        onClose={() => !isUpdatingGroup && !isUploadingGroupImage && setEditGroupDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Edit Group Info
            <IconButton
              onClick={() => {
                setEditGroupDialog(false)
                handleClearEditGroupFile()
              }}
              size="small"
              disabled={isUpdatingGroup || isUploadingGroupImage}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Group Name"
              fullWidth
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              placeholder="Enter group name"
              required
              disabled={isUpdatingGroup || isUploadingGroupImage}
            />

            {/* Group Image Upload Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Group Image (Optional)
              </Typography>

              {/* Hidden file input */}
              <input
                type="file"
                ref={editGroupFileInputRef}
                onChange={handleEditGroupFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Current/Preview Image Display */}
              {(editGroupFilePreview || editGroupImage) && (
                <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={editGroupFilePreview || editGroupImage}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                    variant="rounded"
                  >
                    <GroupsIcon sx={{ fontSize: 48 }} />
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={() => {
                      handleClearEditGroupFile()
                      setEditGroupImage('')
                    }}
                    disabled={isUpdatingGroup || isUploadingGroupImage}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': {
                        bgcolor: 'error.dark',
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {editGroupFilePreview && (
                    <Chip
                      label="New"
                      size="small"
                      color="success"
                      sx={{
                        position: 'absolute',
                        bottom: -8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        height: 20,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Upload Button */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<ImageIcon />}
                  onClick={() => editGroupFileInputRef.current?.click()}
                  disabled={isUpdatingGroup || isUploadingGroupImage}
                  size="small"
                >
                  {editGroupFilePreview || editGroupImage ? 'Change Image' : 'Upload Image'}
                </Button>

                {editGroupFile && (
                  <Chip
                    label={editGroupFile.name}
                    size="small"
                    onDelete={handleClearEditGroupFile}
                    disabled={isUpdatingGroup || isUploadingGroupImage}
                    sx={{ maxWidth: 200 }}
                  />
                )}
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setEditGroupDialog(false)
              handleClearEditGroupFile()
            }}
            disabled={isUpdatingGroup || isUploadingGroupImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveGroupEdit}
            variant="contained"
            disabled={!editGroupName || isUpdatingGroup || isUploadingGroupImage}
            startIcon={
              isUploadingGroupImage ? (
                <CircularProgress size={20} />
              ) : isUpdatingGroup ? (
                <CircularProgress size={20} />
              ) : (
                <CheckIcon />
              )
            }
          >
            {isUploadingGroupImage ? 'Uploading...' : isUpdatingGroup ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog
        open={addMembersDialog}
        onClose={() => !isAddingMembers && setAddMembersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Members to Group</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={availableUsers.filter(u =>
              !selectedConv?.participants?.find(p => p.userId === u.id)
            )}
            getOptionLabel={(option) => option.name}
            loading={isLoadingUsers}
            disabled={isAddingMembers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users"
                placeholder="Add members..."
                sx={{ mt: 2 }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...restProps } = props as { key: string;[key: string]: unknown }
              return (
                <Box component="li" key={key} {...restProps}>
                  <Avatar
                    src={option.profilePicture || undefined}
                    sx={{ mr: 2, bgcolor: option.avatarColor, width: 32, height: 32 }}
                  >
                    {option.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.username}</Typography>
                  </Box>
                </Box>
              )
            }}
            onChange={(e, newValue) => {
              if (newValue.length > 0) {
                handleAddMembersToGroup(newValue)
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMembersDialog(false)} disabled={isAddingMembers}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conversation Info Dialog */}
      <Dialog
        open={conversationInfoDialog}
        onClose={() => {
          setConversationInfoDialog(false)
          setChannelSubscribers([])
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedConv?.type === 'channel' ? 'Channel' :
              selectedConv?.type === 'group' ? 'Group' : 'Conversation'} Info
            <IconButton onClick={() => {
              setConversationInfoDialog(false)
              setChannelSubscribers([])
            }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {selectedConv?.type === 'group' ? (
                <Avatar
                  src={selectedConv.avatar}
                  sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}
                >
                  {!selectedConv.avatar && <GroupsIcon fontSize="large" />}
                </Avatar>
              ) : selectedConv?.type === 'channel' ? (
                <Avatar sx={{
                  bgcolor: selectedConv.isPublic ? 'success.main' : 'warning.main',
                  width: 64,
                  height: 64
                }}>
                  {selectedConv.isPublic ? <PublicIcon fontSize="large" /> : <LockIcon fontSize="large" />}
                </Avatar>
              ) : (
                <Avatar
                  src={selectedConv?.avatar}
                  sx={{ bgcolor: selectedConv?.avatarColor, width: 64, height: 64 }}
                >
                  {!selectedConv?.avatar && selectedConv?.name[0]}
                </Avatar>
              )}
              <Box>
                <Typography variant="h6">{selectedConv?.name}</Typography>
                {selectedConv?.type === 'group' && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedConv.memberCount} members
                  </Typography>
                )}
                {selectedConv?.type === 'channel' && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedConv.subscriberCount} subscribers
                  </Typography>
                )}
              </Box>
            </Box>

            {selectedConv?.description && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Description</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedConv.description}
                </Typography>
              </Box>
            )}

            {selectedConv?.type === 'group' && selectedConv.participants && (
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Members
                </Typography>
                <List dense>
                  {selectedConv.participants.map((participant) => (
                    <ListItem
                      key={participant.participantId}
                      secondaryAction={
                        isGroupAdmin() && participant.userId !== currentUserId && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {/* ADD THIS: Promote to Admin button */}
                            {participant.role !== 'ADMIN' && (
                              <Tooltip title="Promote to Admin">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => {
                                    if (selectedConversation) {
                                      promoteGroupAdmin(selectedConversation, participant.userId)
                                    }
                                  }}
                                  disabled={isPromotingGroupAdmin === participant.userId}
                                >
                                  {isPromotingGroupAdmin === participant.userId ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <AdminIcon fontSize="small" color="primary" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Existing Remove button */}
                            <Tooltip title="Remove Member">
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveMember(participant.userId)}
                                disabled={isRemovingMember}
                              >
                                {isRemovingMember ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteIcon fontSize="small" color="error" />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={participant.profilePicture || undefined}
                          sx={{ bgcolor: 'grey.500', width: 32, height: 32 }}
                        >
                          {participant.fullName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2">{participant.fullName}</Typography>
                            {participant.role === 'ADMIN' && (
                              <Chip
                                label="Admin"
                                size="small"
                                color="primary"
                                icon={<AdminIcon />}
                                sx={{ height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={participant.username}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {selectedConv?.type === 'channel' && selectedConv.channelId && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Subscribers
                  </Typography>
                  {(selectedConv.isOwner || selectedConv.isAdmin) && (
                    <Button
                      size="small"
                      onClick={() => {
                        if (selectedConv.channelId) {
                          getChannelSubscribers(selectedConv.channelId)
                        }
                      }}
                      disabled={isLoadingSubscribers}
                      startIcon={isLoadingSubscribers ? <CircularProgress size={16} /> : null}
                    >
                      {isLoadingSubscribers ? 'Loading...' : 'Load Subscribers'}
                    </Button>
                  )}
                </Box>

                {isLoadingSubscribers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : channelSubscribers.length > 0 ? (
                  <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {channelSubscribers.map((subscriber) => (
                      <ListItem
                        key={subscriber.subscriberId}
                        secondaryAction={
                          (selectedConv.isOwner || selectedConv.isAdmin) && subscriber.userId !== parseInt(currentUserId) && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {subscriber.isAdmin === 'N' && (
                                <Tooltip title="Promote to Admin">
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => {
                                      if (selectedConv.channelId) {
                                        promoteToAdmin(selectedConv.channelId, subscriber.userId)
                                      }
                                    }}
                                    disabled={isPromotingAdmin === subscriber.userId}
                                  >
                                    {isPromotingAdmin === subscriber.userId ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <AdminIcon fontSize="small" color="primary" />
                                    )}
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Remove Subscriber">
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => {
                                    if (selectedConv.channelId) {
                                      removeSubscriber(selectedConv.channelId, subscriber.userId)
                                    }
                                  }}
                                  disabled={isRemovingSubscriber === subscriber.userId}
                                >
                                  {isRemovingSubscriber === subscriber.userId ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <DeleteIcon fontSize="small" color="error" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={subscriber.profilePicture || undefined}
                            sx={{ bgcolor: 'grey.500', width: 32, height: 32 }}
                          >
                            {subscriber.fullName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2">{subscriber.fullName}</Typography>
                              {subscriber.isAdmin === 'Y' && (
                                <Chip
                                  label="Admin"
                                  size="small"
                                  color="primary"
                                  icon={<AdminIcon />}
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                              {subscriber.userId === parseInt(currentUserId) && (
                                <Chip
                                  label="You"
                                  size="small"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={subscriber.username}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                    {(selectedConv.isOwner || selectedConv.isAdmin)
                      ? 'Click "Load Subscribers" to view channel subscribers'
                      : 'No subscriber information available'}
                  </Typography>
                )}
              </Box>
            )}

            {selectedConv?.type === 'channel' && (
              <Alert severity="info">
                {selectedConv.isPublic
                  ? 'This is a public channel. Anyone can subscribe.'
                  : 'This is a private channel. Users need invitation to join.'}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConversationInfoDialog(false)
            setChannelSubscribers([])
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Channel Dialog */}
      <Dialog
        open={createChannelDialog}
        onClose={() => !isCreatingChannel && setCreateChannelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">Create Your Channel</Typography>
              <Typography variant="caption" color="text.secondary">
                You will be the channel admin and can broadcast messages
              </Typography>
            </Box>
            <IconButton onClick={() => setCreateChannelDialog(false)} size="small" disabled={isCreatingChannel}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Channel Name"
              fullWidth
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Enter channel name"
              helperText="Choose a name that describes your channel's purpose"
              disabled={isCreatingChannel}
            />
            <TextField
              label="Description (Optional)"
              fullWidth
              multiline
              rows={3}
              value={newChannelDescription}
              onChange={(e) => setNewChannelDescription(e.target.value)}
              placeholder="What will you share in this channel?"
              helperText="Tell potential subscribers what to expect"
              disabled={isCreatingChannel}
            />
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isChannelPublic}
                    onChange={(e) => setIsChannelPublic(e.target.checked)}
                    color="primary"
                    disabled={isCreatingChannel}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight="medium">
                      {isChannelPublic ? '🌍 Public Channel' : '🔒 Private Channel'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isChannelPublic
                        ? 'Anyone can find and join your channel'
                        : 'Only people you invite can join'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2" fontWeight="medium">
                As the channel owner:
              </Typography>
              <Typography variant="caption" component="ul" sx={{ mt: 0.5, pl: 2 }}>
                <li>Only you can send announcements</li>
                <li>Subscribers receive your updates</li>
                <li>You can manage channel settings</li>
                <li>You can invite or remove members</li>
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateChannelDialog(false)} color="inherit" disabled={isCreatingChannel}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateChannel}
            variant="contained"
            disabled={!newChannelName || isCreatingChannel}
            startIcon={isCreatingChannel ? <CircularProgress size={20} /> : <AnnouncementIcon />}
          >
            {isCreatingChannel ? 'Creating...' : 'Create My Channel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Channel Settings Dialog */}
      <Dialog
        open={channelSettingsDialog}
        onClose={() => !isUpdatingSettings && setChannelSettingsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Channel Settings
            <IconButton onClick={() => setChannelSettingsDialog(false)} size="small" disabled={isUpdatingSettings}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {isLoadingSettings ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allowSubscriberPosts}
                      onChange={(e) => setAllowSubscriberPosts(e.target.checked)}
                      color="primary"
                      disabled={isUpdatingSettings}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Allow Subscriber Posts</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Let subscribers post messages in the channel
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      color="primary"
                      disabled={isUpdatingSettings}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Require Approval</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Approve subscriber posts before they appear
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allowComments}
                      onChange={(e) => setAllowComments(e.target.checked)}
                      color="primary"
                      disabled={isUpdatingSettings}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Allow Comments</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Enable subscribers to comment on posts
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allowReactions}
                      onChange={(e) => setAllowReactions(e.target.checked)}
                      color="primary"
                      disabled={isUpdatingSettings}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Allow Reactions</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Let subscribers react to messages
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDiscoverable}
                      onChange={(e) => setIsDiscoverable(e.target.checked)}
                      color="primary"
                      disabled={isUpdatingSettings}
                    />
                  }
                  label={
                    <Box>
                      <Typography fontWeight="medium">Discoverable</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Show channel in search results
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Alert severity="info">
                These settings control how users can interact with your channel
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelSettingsDialog(false)} disabled={isUpdatingSettings}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChannelSettings}
            variant="contained"
            disabled={isUpdatingSettings}
            startIcon={isUpdatingSettings ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            {isUpdatingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite Users to Channel Dialog */}
      <Dialog
        open={inviteUsersDialog}
        onClose={() => !isInvitingUsers && setInviteUsersDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Invite Users to Channel
            <IconButton onClick={() => setInviteUsersDialog(false)} size="small" disabled={isInvitingUsers}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Autocomplete
              multiple
              options={availableUsers}
              getOptionLabel={(option) => option.name}
              value={selectedInviteUsers}
              onChange={(e, newValue) => setSelectedInviteUsers(newValue)}
              loading={isLoadingUsers}
              disabled={isInvitingUsers}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Users"
                  placeholder="Search users to invite..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...restProps } = props as { key: string;[key: string]: unknown }
                return (
                  <Box component="li" key={key} {...restProps}>
                    <Avatar
                      src={option.profilePicture || undefined}
                      sx={{ mr: 2, bgcolor: option.avatarColor, width: 32, height: 32 }}
                    >
                      {option.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{option.username}</Typography>
                    </Box>
                  </Box>
                )
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })
                  return (
                    <Chip
                      {...tagProps}
                      key={key}
                      label={option.name}
                      avatar={
                        <Avatar
                          src={option.profilePicture || undefined}
                          sx={{ bgcolor: option.avatarColor }}
                        >
                          {option.avatar}
                        </Avatar>
                      }
                      disabled={isInvitingUsers}
                    />
                  )
                })
              }
            />

            <TextField
              label="Invitation Message (Optional)"
              fullWidth
              multiline
              rows={3}
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              disabled={isInvitingUsers}
            />

            <Alert severity="info" icon={<InfoIcon />}>
              Selected users will receive an invitation to join your channel
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteUsersDialog(false)} disabled={isInvitingUsers}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitations}
            variant="contained"
            disabled={selectedInviteUsers.length === 0 || isInvitingUsers}
            startIcon={isInvitingUsers ? <CircularProgress size={20} /> : <PersonAddIcon />}
          >
            {isInvitingUsers ? 'Sending...' : `Send ${selectedInviteUsers.length > 0 ? `(${selectedInviteUsers.length})` : ''} Invitations`}
          </Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />

      {/* Emoji Picker Popover */}
      <Popover
        open={showEmojiPicker}
        anchorEl={emojiPickerAnchor}
        onClose={handleEmojiPickerClose}
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
          }
        }}
      >
        <Box
          sx={{
            '& .EmojiPickerReact': {
              border: 'none',
              boxShadow: 'none',
            },
            '& .EmojiPickerReact .epr-header': {
              padding: '10px 12px',
            },
            '& .EmojiPickerReact .epr-body': {
              padding: '0 12px 12px 12px',
            },
            '& .EmojiPickerReact .epr-search-container': {
              padding: '8px 0',
            },
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={theme.palette.mode === 'dark' ? Theme.DARK : Theme.LIGHT}
            width={320}
            height={400}
            searchPlaceHolder="Search emoji..."
            previewConfig={{
              showPreview: false
            }}
            skinTonesDisabled={false}
            lazyLoadEmojis={true}
          />
        </Box>
      </Popover>

      {/* Reaction Picker Popover */}
      <Popover
        open={showReactionPicker}
        anchorEl={reactionPickerAnchor}
        onClose={handleReactionPickerClose}
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
          }
        }}
      >
        <Box
          sx={{
            '& .EmojiPickerReact': {
              border: 'none',
              boxShadow: 'none',
            },
          }}
        >
          <EmojiPicker
            onEmojiClick={handleReactionSelect}
            theme={theme.palette.mode === 'dark' ? Theme.DARK : Theme.LIGHT}
            width={320}
            height={400}
            searchPlaceHolder="Search reactions..."
            previewConfig={{
              showPreview: false
            }}
            lazyLoadEmojis={true}
          />
        </Box>
      </Popover>

      {/* GIF Picker Popover */}
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

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />

      {/* Media Lightbox Dialog */}
      <Dialog
        open={lightboxOpen}
        onClose={handleLightboxClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.95)',
            boxShadow: 'none',
            maxHeight: '95vh',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          bgcolor: 'transparent',
          p: 1,
        }}>
          <Typography variant="body2" sx={{ color: 'grey.400' }}>
            {lightboxMedia?.type === 'IMAGE' ? 'Image' : lightboxMedia?.type === 'GIF' ? 'GIF' : 'Video'} Preview

          </Typography>
          <Box>
            {/* Download Button */}
            {/* Download Button */}
            <Tooltip title="Download">
              <IconButton
                onClick={() => lightboxMedia && handleDownloadMedia(
                  lightboxMedia.url,
                  `${lightboxMedia.type === 'IMAGE' ? 'image' : 'video'}_${Date.now()}`
                )}
                sx={{ color: 'white', mr: 1 }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            {/* Open in new tab Button */}
            <Tooltip title="Open in new tab">
              <IconButton
                onClick={() => lightboxMedia && window.open(lightboxMedia.url, '_blank')}
                sx={{ color: 'white', mr: 1 }}
              >
                <PublicIcon />
              </IconButton>
            </Tooltip>
            {/* Close Button */}
            <Tooltip title="Close">
              <IconButton onClick={handleLightboxClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>
        <DialogContent sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'transparent',
          overflow: 'hidden',
        }}>
          {(lightboxMedia?.type === 'IMAGE' || lightboxMedia?.type === 'GIF') && (
            <Box
              component="img"
              src={lightboxMedia.url}
              alt="Full size image"
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(95vh - 120px)',
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          )}
          {lightboxMedia?.type === 'VIDEO' && (
            <Box
              component="video"
              src={lightboxMedia.url}
              controls
              autoPlay
              sx={{
                maxWidth: '100%',
                maxHeight: 'calc(95vh - 120px)',
                borderRadius: 1,
              }}
            />
          )}
        </DialogContent>
      </Dialog>


      {/* Chat Profile Image Viewer Dialog */}
      <Dialog
        open={chatProfileImageOpen}
        onClose={() => setChatProfileImageOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            boxShadow: 24,
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Close Button */}
          <IconButton
            onClick={() => setChatProfileImageOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Profile Image */}
          {selectedConv?.avatar ? (
            <Box
              component="img"
              src={selectedConv.avatar}
              alt={selectedConv.name}
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 'auto',
                aspectRatio: '1',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <Box
              sx={{
                width: 400,
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: selectedConv?.type === 'group' ? 'primary.main' : selectedConv?.avatarColor || 'grey.500'
              }}
            >
              {selectedConv?.type === 'group' ? (
                <GroupsIcon sx={{ fontSize: 120, color: 'white' }} />
              ) : (
                <Typography sx={{ fontSize: '8rem', color: 'white' }}>
                  {selectedConv?.name?.[0]?.toUpperCase()}
                </Typography>
              )}
            </Box>
          )}

          {/* User Name Footer */}
          <Box sx={{
            p: 2,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Typography variant="h6" fontWeight="bold">
              {selectedConv?.name}
            </Typography>
            {selectedConv?.type === 'direct' && (
              <Typography variant="body2" color="text.secondary">
                {isUserActive(selectedConv?.userId) ? '🟢 Active now' : '⚫ Offline'}
              </Typography>
            )}
            {selectedConv?.type === 'group' && (
              <Typography variant="body2" color="text.secondary">
                {selectedConv.memberCount} members
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>


      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false)
          setPaymentDialogMode('normal')
          setPendingPaymentRequest(null)
        }}
        recipientId={selectedConv?.userId ? String(selectedConv.userId) : ''}
        recipientName={selectedConv?.name || ''}
        conversationId={selectedConversation || ''}
        onSendPayment={handleSendPayment}
        onRequestPayment={handleRequestPayment}
        onAcceptPaymentRequest={handleAcceptPaymentRequest}  // NEW: Added
        walletBalance={walletBalance}
        isLoadingBalance={isLoadingWalletBalance}
        onAddFunds={handleAddFunds}
        mode={paymentDialogMode}                              // NEW: Added
        pendingPaymentRequest={pendingPaymentRequest}         // NEW: Added
      />
    </>


  )


}

export default MessagesPageContent