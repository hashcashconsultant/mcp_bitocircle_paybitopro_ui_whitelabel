'use client'
import { localApiUrl } from '@/utils/apiHosts'
import React, { useState, useEffect } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useAuth } from '@/contexts/AuthContext'

import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Badge,
  Chip,
  TextField

} from '@mui/material'
import {
  MoreVert as MoreIcon,
  PersonAdd as FollowIcon,
  PersonRemove as UnfollowIcon,
  Message as MessageIcon,
  Close as CloseIcon,

  NotificationsActive as NotificationIcon,
  NotificationsOff as MuteIcon,
  Link as LinkIcon,
  Flag as ReportIcon,
  Block as BlockIcon,
  Share as ShareIcon,
  QrCode as QrCodeIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Link as WebsiteIcon,
  GridOn as GridIcon,
  PlayCircleOutline as ReelsIcon,
  Lock as PrivateIcon,
  CheckCircle as VerifiedIcon,
  Telegram as TelegramIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  LinkedIn as LinkedInIcon,
  X as XIcon,
  PersonOutline as TaggedIcon,
  HourglassEmpty as PendingIcon,
  CardGiftcard as GiftIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Cancel as CancelIcon,
  Wc as GenderIcon,
  Cake as CakeIcon,
} from '@mui/icons-material'
import { PlayCircleOutline } from '@mui/icons-material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { stompConnectHeaders } from '@/utils/apiAuth';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'
import ReportDialog from './posts/ReportDialog'

// Import your post components
import TextPostComponent from '@/components/posts/TextPostComponent'
import ImagePostComponent from '@/components/posts/ImagePostComponent'
import VideoPostComponent from '@/components/posts/VideoPostComponent'
import PollPostComponent from '@/components/posts/PollPostComponent'
import ReelPostComponent from '@/components/posts/ReelPostComponent'
import { PostSkeleton } from '@/components/posts/PostSkeletons'
import CommentDialog from '@/components/CommentDialog'
import SendGiftDialog from '@/components/SendGiftDialog'
import BuyBadgeDialog from '@/components/BuyBadgeDialog'
import QuickReactions from '@/components/QuickReactions'
import SubscriptionDialog from '@/components/SubscriptionDialog'

// Import CreatePostDialog for sharing
import CreatePostDialog from '@/components/CreatePostDialog'

// Import ProfileStoryViewer
import ProfileStoryViewer from '@/components/ProfileStoryViewer'

import { useRouter } from 'next/navigation'

import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import { profile } from 'console'

const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService'

// Custom Discord icon
const DiscordIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
  </svg>
)

const TikTokIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.34 6.34 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
)

const TwitchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 2L3.43 4.571v14.858h5.142V22l2.572-2.571h4.286L20.571 14.286V2zm13.428 11.571l-3.428 3.429h-3.429l-3 3v-3H6.857V3.429h12.571z" />
  </svg>
)

// Gift data
const giftCategories = ['Popular', 'Reactions', 'Premium', 'Crypto Special', 'Limited Edition']

const giftsData: Record<string, Array<{
  id: number
  emoji: string
  name: string
  priceUSD: number
  priceETH: string
  tag?: string
}>> = {
  'Popular': [
    { id: 1, emoji: '⭐', name: 'Star', priceUSD: 10, priceETH: '0.004 ETH' },
    { id: 2, emoji: '🔥', name: 'Fire', priceUSD: 25, priceETH: '0.011 ETH', tag: 'HOT' },
    { id: 3, emoji: '🚀', name: 'Rocket', priceUSD: 50, priceETH: '0.022 ETH' },
    { id: 4, emoji: '💎', name: 'Diamond', priceUSD: 100, priceETH: '0.043 ETH' },
    { id: 5, emoji: '❤️', name: 'Heart', priceUSD: 15, priceETH: '0.006 ETH' },
    { id: 6, emoji: '🌈', name: 'Rainbow', priceUSD: 30, priceETH: '0.013 ETH' },
    { id: 7, emoji: '🏆', name: 'Trophy', priceUSD: 75, priceETH: '0.032 ETH' },
    { id: 8, emoji: '👑', name: 'Crown', priceUSD: 500, priceETH: '0.215 ETH', tag: 'VIP' },
    { id: 9, emoji: '🦄', name: 'Unicorn', priceUSD: 250, priceETH: '0.107 ETH' },
  ],
  'Reactions': [
    { id: 10, emoji: '👍', name: 'Thumbs Up', priceUSD: 2, priceETH: '0.001 ETH' },
    { id: 11, emoji: '👏', name: 'Clap', priceUSD: 5, priceETH: '0.002 ETH' },
    { id: 12, emoji: '😍', name: 'Love Eyes', priceUSD: 8, priceETH: '0.003 ETH' },
    { id: 13, emoji: '🎉', name: 'Party', priceUSD: 10, priceETH: '0.004 ETH' },
    { id: 14, emoji: '💯', name: 'Hundred', priceUSD: 15, priceETH: '0.006 ETH' },
    { id: 15, emoji: '🙌', name: 'Raise Hands', priceUSD: 12, priceETH: '0.005 ETH' },
  ],
  'Premium': [
    { id: 16, emoji: '🎸', name: 'Guitar', priceUSD: 150, priceETH: '0.064 ETH' },
    { id: 17, emoji: '🎹', name: 'Piano', priceUSD: 200, priceETH: '0.086 ETH' },
    { id: 18, emoji: '🏎️', name: 'Race Car', priceUSD: 300, priceETH: '0.129 ETH' },
    { id: 19, emoji: '✈️', name: 'Airplane', priceUSD: 500, priceETH: '0.215 ETH' },
    { id: 20, emoji: '🚁', name: 'Helicopter', priceUSD: 750, priceETH: '0.322 ETH' },
    { id: 21, emoji: '🛸', name: 'UFO', priceUSD: 1000, priceETH: '0.430 ETH', tag: 'RARE' },
  ],
  'Crypto Special': [
    { id: 22, emoji: '₿', name: 'Bitcoin', priceUSD: 100, priceETH: '0.043 ETH' },
    { id: 23, emoji: '⟠', name: 'Ethereum', priceUSD: 75, priceETH: '0.032 ETH' },
    { id: 24, emoji: '🪙', name: 'Gold Coin', priceUSD: 50, priceETH: '0.022 ETH' },
    { id: 25, emoji: '💰', name: 'Money Bag', priceUSD: 200, priceETH: '0.086 ETH' },
    { id: 26, emoji: '📈', name: 'To The Moon', priceUSD: 150, priceETH: '0.064 ETH', tag: 'TRENDING' },
  ],
  'Limited Edition': [
    { id: 27, emoji: '🎄', name: 'Christmas Tree', priceUSD: 50, priceETH: '0.022 ETH', tag: 'SEASONAL' },
    { id: 28, emoji: '🎃', name: 'Pumpkin', priceUSD: 40, priceETH: '0.017 ETH', tag: 'SEASONAL' },
    { id: 29, emoji: '🐲', name: 'Dragon', priceUSD: 500, priceETH: '0.215 ETH', tag: 'EXCLUSIVE' },
    { id: 30, emoji: '🦋', name: 'Butterfly', priceUSD: 35, priceETH: '0.015 ETH' },
  ],
}

// Badge tiers data
const badgeTiers = [
  {
    id: 'bronze',
    name: 'Bronze Supporter',
    emoji: '🥉',
    price: 10,
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.05))',
    benefits: ['Supporter badge on profile', 'Priority in comments', 'Exclusive emoji reactions'],
  },
  {
    id: 'silver',
    name: 'Silver Supporter',
    emoji: '🥈',
    price: 25,
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(184, 184, 184, 0.05))',
    benefits: ['All Bronze benefits', 'Priority replies', 'Exclusive content access', 'Monthly video calls'],
  },
  {
    id: 'gold',
    name: 'Gold Supporter',
    emoji: '🏆',
    price: 50,
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 199, 0, 0.05))',
    benefits: ['All Silver benefits', '1-on-1 monthly consultation', 'Early access to content', 'Custom shoutouts'],
  },
  {
    id: 'diamond',
    name: 'Diamond VIP',
    emoji: '💎',
    price: 100,
    color: '#87ceeb',
    bgGradient: 'linear-gradient(135deg, rgba(185, 242, 255, 0.15), rgba(135, 206, 235, 0.05))',
    benefits: ['All Gold benefits', 'Weekly 1-on-1 sessions', 'Co-creation opportunities', 'Revenue sharing (2%)', 'VIP Discord access'],
  },
]

// Quick reactions data
const quickReactions = [
  { emoji: '❤️', price: 5 },
  { emoji: '👍', price: 2 },
  { emoji: '🔥', price: 10 },
  { emoji: '💯', price: 15 },
]

// Subscription Details Interface
interface Feature {
  featureId: number
  name: string
}

interface SubscriptionDetails {
  settingsId: number
  creatorId: number
  autoRenewal: number
  isSubscriptionNotificationEnabled: string
  isSubscriptionsEnabled: string
  welcomeMessage: string
  minSubscriptionPeriod: string
  freeTrialDays: number
  currentTierId: number
  price: number
  features: Feature[]
}

// Subscription Status Interface
interface SubscriptionStatus {
  id: number
  subscriberId: number
  creatorId: number
  tierId: number
  tierName: string
  amount: number
  status: string
  startDate: string | null
  endDate: string | null
  nextBillingDate: string | null
  lifetimeValue: number | null
  monthsSubscribed: number
  createdAt: string | null
  updatedAt: string | null
  isSubscribed: 'Y' | 'N'
  trialPeriod: string | null
  freeTrialDays: number
}

interface ProfileStats {
  followers: string
  following: string
  posts: string
}

interface SocialMediaLinks {
  telegram?: string
  discord?: string
  instagram?: string
  facebook?: string
  youtube?: string
  tiktok?: string
  twitch?: string
  linkedin?: string
  x?: string
}

interface Category {
  id: number
  type: string
  optionId: number | null
  optionText: string | null
  voteCount: number
}

interface PublicProfileData {
  userId: string
  pageId?: number
  entityType?: string
  name: string
  username: string
  bio: string | null
  location: string | null
  website: string | null
  joinedDate: string
  coverImage: string | null
  profileImage: string | null
  isVerified: boolean
  isPrivate: boolean
  isFollowing: boolean
  isFollower: boolean
  isMuted: boolean
  isBlocked: boolean
  socialMedia?: SocialMediaLinks
  stats: ProfileStats,
  isUserFollowing?: number,
  categories?: Category[],
  gender?: string | null,
  dob?: string | null,
  dobVisibility?: number,
}

// API Response Interface
interface PublicProfileAPIResponse {
  success: boolean
  message: string
  data: {
    adminUser: string | null
    userId: number
    pageId: number
    businessPageId: number
    username: string
    email: string
    fullName: string
    bio: string | null
    profilePicture: string | null
    coverPicture: string | null
    categories: string | null
    location: string | null
    website: string | null
    isVerified: 'Y' | 'N'
    isPrivate: 'Y' | 'N'
    isActive: 'Y' | 'N'
    isBlocked: 'Y' | 'N'
    createdAt: string
    updatedAt: string
    telegramLink: string | null
    discordLink: string | null
    instagramLink: string | null
    facebookLink: string | null
    youtubeLink: string | null
    tikTokLink: string | null
    twitchLink: string | null
    linkedinLink: string | null
    xlink: string | null
    viewerId: number | null
    followersCount: number
    followingCount: number
    postsCount: number
    status: number
    categoryList: Category[]
    isUserFollowing: number
    entityType: string
    gender: string | null
    dob: string | null
    dobVisibility: number | null
  }
  errorCode: string | null
}

// Post types
export type PostType = 'text' | 'image' | 'video' | 'poll'

export interface BasePost {
  id: number
  type: PostType
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string
    userId?: number
    pageId?: number
    isFollowing?: boolean
    isVerified?: boolean
    isUserFollowing?: number
    profilePicture?: string
  }
  contentType: string
  content: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  // Sponsored post fields
  isSponsored?: boolean
  campaignId?: number
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  // Product tagging fields
  isProductTagged?: number
  isCommentAllowed?: number
  taggedProducts?: Array<{
    productId: number
    productName: string
    productType: string
    description: string
    imageUrl: string
    price: number
    shopOwnerId: number
    shopOwnerName: string
  }>
}

export interface TextPost extends BasePost {
  type: 'text'
}

export interface ImagePost extends BasePost {
  type: 'image'
  images: string[]
}

export interface VideoPost extends BasePost {
  type: 'video'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
}

export interface PollPost extends BasePost {
  type: 'poll'
  question: string
  options: Array<{
    id: number
    text: string
    votes: number
  }>
  totalVotes: number
  hasVoted?: boolean
  votedOptionId?: number
  endTime?: string
  pollId?: number
}

export type Post = TextPost | ImagePost | VideoPost | PollPost

// Reel interface
export interface Reel {
  id: number
  user: {
    name: string
    username: string
    avatar: string
    avatarColor: string
    time: string
    userId?: number
    isFollowing?: boolean
    isVerified?: boolean
  }
  content: string
  contentType: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  likes: number
  comments: number
  shares: number
  views?: number
  isLiked?: boolean
  isSaved?: boolean
}

// API Response types
interface APIPost {
  postId: number
  userId: number
  pageId: number
  username: string
  profilePicture: string | null
  fullName: string
  content: string | null
  postType: 'TEXT' | 'PHOTO' | 'VIDEO' | 'POLL'
  contentType: string
  mediaUrls: string
  hashtags: string | null
  location: string | null
  createdAt: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: 'Y' | 'N'
  hasBookmarked: 'Y' | 'N'
  pollQuestion: string | null
  isUserFollowing?: number
  isSponsored?: number  // 0 or 1
  campaignId?: number
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  // Product tagging fields
  isProductTagged?: number  // 0 or 1
  isCommentAllowed?: number // 0 or 1
  taggedProducts?: Array<{
    productId: number
    productName: string
    productType: string
    description: string
    imageUrl: string
    price: number
    shopOwnerId: number
    shopOwnerName: string
  }>
  poll: {
    pollId: number
    question: string
    options: Array<{
      optionId: number
      optionText: string
      voteCount: number
    }>
    totalVotes: number
    hasVoted: boolean
    votedOptionId: number | null
    endsAt: string | null
  } | null
}

interface UserPostsResponse {
  success: boolean
  message: string
  data: {
    content: APIPost[]
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  errorCode: string | null
}

// API Reel Response types
interface APIReel {
  reelId: number
  userId: number
  adminUser: string | null
  title: string
  description: string | null
  videoUrl: string
  coverImage: string | null
  hashtags: string | null
  duration: number
  isActive: string
  createdAt: string
  updatedAt: string | null
  username: string
  fullName: string
  likeCount: number
  commentCount: number
  shareCount: number
  hasLiked: 'Y' | 'N'
  hasBookmarked: 'Y' | 'N'
}

interface UserReelsResponse {
  success: boolean
  message: string
  data: {
    content: APIReel[]
    pageNumber: number
    pageSize: number
    totalElements: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  errorCode: string | null
}

interface FollowerUser {
  userId: number
  pageId: number
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

// Story interfaces
interface ApiStory {
  storyId: number
  storyType: 'TEXT' | 'IMAGE' | 'VIDEO'
  content?: string
  duration: number
  isActive: string
  createdAt: string
  expiresAt: string
  username: string
  fullName: string
  profilePicture: string
  hasViewed: string
  privacyLevel: string
  userId: number
  pageId: number
  storyOrder: number
  isArchived: boolean
  updatedAt: string
  totalViews: number
  uniqueViews: number
  mediaUrl?: string
}

interface StoryApiResponse {
  success: boolean
  message: string
  data: ApiStory[]
  errorCode: string
}

interface Story {
  id: number
  storyId: number
  name: string
  username: string
  avatar: string
  avatarImage?: string
  avatarColor: string
  storyType: 'TEXT' | 'IMAGE' | 'VIDEO'
  storyImage?: string
  storyVideo?: string
  storyText?: string
  storyCaption?: string
  duration: number
  time: string
  viewed?: boolean
  userId: number
}

// Format DOB for display (e.g., "January 15, 1990")
const formatDobForDisplay = (dob: string | null | undefined): string => {
  if (!dob) return ''

  const parts = dob.split('-')
  if (parts.length !== 3) return ''

  const month = parseInt(parts[0], 10)
  const day = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)

  if (isNaN(month) || isNaN(day) || isNaN(year)) return ''

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return `${monthNames[month - 1]} ${day}, ${year}`
}

// Helper functions
const getPostType = (apiType: string): PostType => {
  switch (apiType) {
    case 'TEXT': return 'text'
    case 'PHOTO': return 'image'
    case 'VIDEO': return 'video'
    case 'POLL': return 'poll'
    default: return 'text'
  }
}

const generateAvatarColor = (userId: number): string => {
  const colors = [
    '#4267b2', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]
  return colors[userId % colors.length]
}

const formatTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp + 'Z');
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString();
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const convertAPIPostsToComponentFormat = (apiPosts: APIPost[]): Post[] => {
  const posts: Post[] = []

  apiPosts.forEach(item => {
    const basePost: BasePost = {
      id: item.postId,
      type: getPostType(item.postType),
      user: {
        name: item.fullName,
        username: item.username,
        avatar: item.fullName.charAt(0).toUpperCase(),
        avatarColor: generateAvatarColor(item.userId),
        time: formatTimeAgo(item.createdAt),
        userId: item.userId,
        pageId: item.pageId,
        isFollowing: false,
        isVerified: false,
        isUserFollowing: item.isUserFollowing,
        profilePicture: item.profilePicture || ''
      },
      contentType: item.contentType,
      content: item.content || '',
      likes: item.likeCount,
      comments: item.commentCount,
      shares: item.shareCount,
      isLiked: item.hasLiked === 'Y',
      isSaved: item.hasBookmarked === 'Y',
      isSponsored: item.isSponsored === 1,
      campaignId: item.campaignId || 0,
      cta: item.cta || '',
      callToActionUrl: item.callToActionUrl || '',
      adHeadline: item.adHeadline || '',
      adHeadlineImage: item.adHeadlineImage || '',
      // Product tagging fields
      isProductTagged: item.isProductTagged || 0,
      taggedProducts: item.taggedProducts || [],
      isCommentAllowed: item.isCommentAllowed, // Assuming API doesn't provide this info, defaulting to false
    }

    switch (item.postType) {
      case 'TEXT':
        posts.push({
          ...basePost,
          type: 'text'
        } as TextPost)
        break

      case 'PHOTO':
        const imageUrls = item.mediaUrls ? item.mediaUrls.split(',').map(url => url.trim()) : []
        posts.push({
          ...basePost,
          type: 'image',
          images: imageUrls
        } as ImagePost)
        break

      case 'VIDEO':
        const videoUrls = item.mediaUrls ? item.mediaUrls.split(',').map(url => url.trim()) : []
        posts.push({
          ...basePost,
          type: 'video',
          videoUrl: videoUrls[0] || '',
          thumbnailUrl: videoUrls[1],
          duration: undefined,
          views: undefined
        } as VideoPost)
        break

      case 'POLL':
        if (item.poll) {
          const options = item.poll.options.map(option => ({
            id: option.optionId,
            text: option.optionText,
            votes: option.voteCount
          }))

          const pollPost: PollPost = {
            ...basePost,
            type: 'poll',
            question: item.poll.question || '',
            options: options,
            totalVotes: item.poll.totalVotes,
            hasVoted: item.poll.hasVoted,
            votedOptionId: item.poll.votedOptionId || undefined,
            endTime: item.poll.endsAt ? formatTimeAgo(item.poll.endsAt) : undefined,
            pollId: item.poll.pollId
          }

          posts.push(pollPost)
        }
        break
    }
  })

  return posts
}

const convertAPIReelsToComponentFormat = (apiReels: APIReel[]): Reel[] => {
  return apiReels.map(item => ({
    id: item.reelId,
    user: {
      name: item.fullName,
      username: `@${item.username}`,
      avatar: item.fullName.charAt(0).toUpperCase(),
      avatarColor: generateAvatarColor(item.userId),
      time: formatTimeAgo(item.createdAt),
      userId: item.userId,
      isFollowing: false,
      isVerified: false
    },
    content: item.description || item.title || '',
    contentType: 'REEL',
    videoUrl: item.videoUrl,
    thumbnailUrl: item.coverImage || undefined,
    duration: formatDuration(item.duration),
    likes: item.likeCount,
    comments: item.commentCount,
    shares: item.shareCount,
    views: 0,
    isLiked: item.hasLiked === 'Y',
    isSaved: item.hasBookmarked === 'Y'
  }))
}

const PublicProfilePage: React.FC<{ userId: string; pageId: string }> = ({
  userId,
  pageId
}) => {
  const router = useRouter()
  const { isAuthenticated, requireAuth } = useAuth()

  const [activeTab, setActiveTab] = useState(0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [profileData, setProfileData] = useState<PublicProfileData | null>(null)

  // Posts state
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(false)

  // Reels state
  const [userReels, setUserReels] = useState<Reel[]>([])
  const [isLoadingReels, setIsLoadingReels] = useState(false)
  const [reelsError, setReelsError] = useState<string | null>(null)
  const [currentReelPage, setCurrentReelPage] = useState(0)
  const [totalReelPages, setTotalReelPages] = useState(1)
  const [hasMoreReels, setHasMoreReels] = useState(false)

  // Tagged Posts state
  const [taggedPosts, setTaggedPosts] = useState<Post[]>([])
  const [isLoadingTaggedPosts, setIsLoadingTaggedPosts] = useState(false)
  const [taggedPostsError, setTaggedPostsError] = useState<string | null>(null)
  const [currentTaggedPage, setCurrentTaggedPage] = useState(1)
  const [totalTaggedPages, setTotalTaggedPages] = useState(1)
  const [hasMoreTaggedPosts, setHasMoreTaggedPosts] = useState(false)

  // Comment dialog state
  const [openCommentDialog, setOpenCommentDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // Share dialog state
  const [openShareDialog, setOpenShareDialog] = useState(false)
  const [postToShare, setPostToShare] = useState<Post | null>(null)

  const [followersDialogOpen, setFollowersDialogOpen] = useState(false)
  const [followersDialogTab, setFollowersDialogTab] = useState<'followers' | 'following'>('followers')
  const [followers, setFollowers] = useState<FollowerUser[]>([])
  const [following, setFollowing] = useState<FollowerUser[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [followersError, setFollowersError] = useState<string | null>(null)
  const [isEligibleToView, setIsEligibleToView] = useState<boolean | null>(null)

  // Active users states
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set())
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Selected reel for comments
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  const [openReelCommentDialog, setOpenReelCommentDialog] = useState(false)

  // Profile image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  // Get current user ID
  const currentUserId = localStorage.getItem('childUserId') || '0'

  const [coverImageViewerOpen, setCoverImageViewerOpen] = useState(false)

  // ============ GIFT & BADGE STATES ============
  const [giftDialogOpen, setGiftDialogOpen] = useState(false)
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)
  const [selectedGiftCategory, setSelectedGiftCategory] = useState('Popular')
  const [selectedGift, setSelectedGift] = useState<typeof giftsData['Popular'][0] | null>(null)
  const [giftMessage, setGiftMessage] = useState('')
  const [isSendingGift, setIsSendingGift] = useState(false)
  const [userBalance, setUserBalance] = useState(850.00)

  // ============ SUBSCRIPTION STATES ============
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoadingSubscriptionStatus, setIsLoadingSubscriptionStatus] = useState(false)
  const [cancelSubscriptionDialogOpen, setCancelSubscriptionDialogOpen] = useState(false)
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false)

  // Gift/Badge enable status state
  const [isGiftsEnabled, setIsGiftsEnabled] = useState<boolean>(false)
  const [isLoadingGiftStatus, setIsLoadingGiftStatus] = useState(false)

  // Profile avatar choice dialog (photo vs story)
  const [avatarChoiceDialogOpen, setAvatarChoiceDialogOpen] = useState(false)

  // Shop status state
  const [shopDetails, setShopDetails] = useState<{
    showShopOnProfile: 'Y' | 'N'
    shopName?: string
    shopId?: number
    externalCheckoutEnabled: 'Y' | 'N'
    externalCheckoutUrl?: string
  } | null>(null)
  const [isLoadingShop, setIsLoadingShop] = useState(false)

  // ============ STORY STATES ============
  const [profileStories, setProfileStories] = useState<Story[]>([])
  const [isLoadingStories, setIsLoadingStories] = useState(false)
  const [storyViewerOpen, setStoryViewerOpen] = useState(false)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  // Purchased badge state
  const [purchasedBadge, setPurchasedBadge] = useState<string | null>(null)
  const [isLoadingBadge, setIsLoadingBadge] = useState(false)

  const fetchShopDetails = async () => {
    setIsLoadingShop(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/settings/shopdetails/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch shop details')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setShopDetails({
          showShopOnProfile: result.data.showShopOnProfile,
          shopName: result.data.shopName,
          shopId: result.data.shopId,
          externalCheckoutEnabled: result.data.externalCheckoutEnabled,
          externalCheckoutUrl: result.data.externalCheckoutUrl
        })
      } else {
        setShopDetails(null)
      }
    } catch (error) {
      console.error('Error fetching shop details:', error)
      setShopDetails(null)
    } finally {
      setIsLoadingShop(false)
    }
  }

  // Helper function to get shop URL based on checkout settings
  const getShopUrl = (): string => {
    const currentUserId = localStorage.getItem('childUserId') || '0'

    if (shopDetails?.externalCheckoutEnabled === 'Y' && shopDetails.externalCheckoutUrl) {
      return shopDetails.externalCheckoutUrl
    }

    return `https://www.bitocircle.com/merchandise/shop/?shopCreatorId=${userId}&userId=${currentUserId}`
  }

  // Get viewer's profile image from localStorage or use a default
  const viewerProfileImage = localStorage.getItem('profilePicture') || null

  const fetchGiftBadgeStatus = async () => {
    setIsLoadingGiftStatus(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/giftsBadges/getEnableGiftStatus/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch gift/badge status')
      }

      const result = await response.json()

      if (result.success && result.data !== undefined) {
        setIsGiftsEnabled(result.data === 1)
      } else {
        setIsGiftsEnabled(false)
      }
    } catch (error) {
      console.error('Error fetching gift/badge status:', error)
      setIsGiftsEnabled(false)
    } finally {
      setIsLoadingGiftStatus(false)
    }
  }

  // Add this function near your other handlers (around line 850)
  const handleCoverImageClick = () => {
    if (profileData?.coverImage) {
      setCoverImageViewerOpen(true)
    }
  }

  const fetchPurchasedBadge = async () => {
    setIsLoadingBadge(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/giftsBadges/my-purchased?supporterId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setPurchasedBadge(result.data.trim())
      } else {
        setPurchasedBadge(null)
      }
    } catch (error) {
      console.error('Error fetching purchased badge:', error)
      setPurchasedBadge(null)
    } finally {
      setIsLoadingBadge(false)
    }
  }

  // Badge emoji mapping
  const getBadgeEmoji = (badge: string | null): string => {
    if (!badge) return ''
    const lower = badge.toLowerCase()
    if (lower.includes('diamond')) return '💎'
    if (lower.includes('gold')) return '🏆'
    if (lower.includes('silver')) return '🥈'
    if (lower.includes('bronze')) return '🥉'
    return '🏅'
  }

  const getBadgeColor = (badge: string | null): string => {
    if (!badge) return '#9e9e9e'
    const lower = badge.toLowerCase()
    if (lower.includes('diamond')) return '#87ceeb'
    if (lower.includes('gold')) return '#FFD700'
    if (lower.includes('silver')) return '#C0C0C0'
    if (lower.includes('bronze')) return '#CD7F32'
    return '#9e9e9e'
  }

  // Check if a user is active
  const isUserActive = (targetUserId: string | number | undefined | null): boolean => {
    if (targetUserId === undefined || targetUserId === null) return false
    return activeUsers.has(String(targetUserId))
  }

  // Handle reel share
  const handleShareReel = (reelId: number) => {
    if (!requireAuth('share reels')) return

    const reel = userReels.find(r => r.id === reelId)
    if (reel) {
      const reelAsPost: Post = {
        id: reel.id,
        type: 'video' as PostType,
        user: {
          name: reel.user.name,
          username: reel.user.username,
          avatar: reel.user.avatar,
          avatarColor: reel.user.avatarColor,
          time: reel.user.time,
          userId: reel.user.userId,
          isFollowing: reel.user.isFollowing,
          isVerified: reel.user.isVerified
        },
        content: reel.content,
        contentType: 'REEL',
        likes: reel.likes,
        comments: reel.comments,
        shares: reel.shares,
        isLiked: reel.isLiked,
        isSaved: reel.isSaved,
        videoUrl: reel.videoUrl,
        thumbnailUrl: reel.thumbnailUrl,
        duration: reel.duration,
        views: reel.views
      } as VideoPost

      setPostToShare(reelAsPost)
      setOpenShareDialog(true)
    }
  }

  // Handle reel comment dialog
  const handleReelComment = (reelId: number) => {
    const reel = userReels.find(r => r.id === reelId)
    if (reel) {
      setSelectedReel(reel)
      setOpenReelCommentDialog(true)
    }
  }

  // Load active users via WebSocket
  const loadActiveUsers = () => {
    if (!stompClient || !stompClient.connected) {
      console.log('WebSocket not connected. Cannot load active users.')
      return
    }

    console.log('Requesting active users list')

    const subscription = stompClient.subscribe('/user/queue/active-users', (message) => {
      try {
        console.log('Active users response received:', message.body)
        const users = JSON.parse(message.body)
        const userArray: string[] = Array.isArray(users)
          ? users.map((u: string | number) => String(u))
          : Array.from(users).map((u: unknown) => String(u))

        setActiveUsers(new Set(userArray))
        console.log('Active users loaded:', userArray.length, 'users')
        subscription.unsubscribe()
      } catch (err) {
        console.error('Failed to parse active users:', err)
        setActiveUsers(new Set())
      }
    })

    stompClient.publish({
      destination: '/app/active-user/status',
      body: JSON.stringify({})
    })
  }

  // Connect to WebSocket
  const connectWebSocket = () => {
    try {
      const client = new Client({
        brokerURL: undefined,
        connectHeaders: stompConnectHeaders(),
        debug: function (str) {
          console.log('STOMP: ' + str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      client.webSocketFactory = () => {
        return new SockJS(localApiUrl('https://institutional-bo.paybito.com:8443/BitohubService/ws-messaging?userId=' + currentUserId))
      }

      client.onConnect = (frame) => {
        console.log('Connected to WebSocket:', frame)
        setIsSocketConnected(true)

        client.subscribe(`/user/queue/user-status`, (message) => {
          try {
            const statusUpdate = JSON.parse(message.body)
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

        client.subscribe(`/topic/active-users`, (message) => {
          try {
            const users = JSON.parse(message.body)
            const userArray: string[] = Array.isArray(users)
              ? users.map((u: string | number) => String(u))
              : Array.from(users).map((u: unknown) => String(u))
            setActiveUsers(new Set(userArray))
          } catch (e) {
            console.error('Failed to parse broadcast active users:', e)
          }
        })
      }

      client.onStompError = (frame) => {
        console.error('STOMP error:', frame.headers['message'])
        setIsSocketConnected(false)
      }

      client.onDisconnect = () => {
        console.log('Disconnected from WebSocket')
        setIsSocketConnected(false)
      }

      client.onWebSocketClose = () => {
        console.log('WebSocket connection closed')
        setIsSocketConnected(false)
      }

      client.activate()
      setStompClient(client)
    } catch (error) {
      console.error('WebSocket connection error:', error)
      setIsSocketConnected(false)
    }
  }

  // Disconnect from WebSocket
  const disconnectWebSocket = () => {
    if (stompClient) {
      stompClient.deactivate()
      setStompClient(null)
      setIsSocketConnected(false)
    }
  }

  // Connect to WebSocket on mount
  useEffect(() => {
    connectWebSocket()

    return () => {
      disconnectWebSocket()
    }
  }, [])

  // Load active users when socket connects
  useEffect(() => {
    if (isSocketConnected) {
      loadActiveUsers()

      const interval = setInterval(() => {
        loadActiveUsers()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [isSocketConnected, stompClient])

  const checkViewEligibility = async () => {
    try {
      const viewerId = localStorage.getItem('childUserId') || '0'
      const viewerPageId = localStorage.getItem('pageId') || '0'

      const response = await fetch(
        `${BITOHUBWEBSERVICE}/profile/isUserEligibleToView?viewerId=${viewerId}&viewerPageId=${viewerPageId}&userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      const result = await response.json()

      if (result.success) {
        setIsEligibleToView(result.data === true)
      } else {
        setIsEligibleToView(false)
      }
    } catch (error) {
      console.error('Error checking view eligibility:', error)
      setIsEligibleToView(false)
    }
  }

  // ============ SUBSCRIPTION FUNCTIONS ============
  const fetchSubscriptionDetails = async () => {
    setIsLoadingSubscription(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/subscription/creator/${userId}/details`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscription details')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSubscriptionDetails(result.data)
      } else {
        setSubscriptionDetails(null)
      }
    } catch (error) {
      console.error('Error fetching subscription details:', error)
      setSubscriptionDetails(null)
    } finally {
      setIsLoadingSubscription(false)
    }
  }

  // Fetch subscription status to check if user is already subscribed
  const fetchSubscriptionStatus = async () => {
    const subscriberId = localStorage.getItem('childUserId')
    if (!subscriberId) return

    setIsLoadingSubscriptionStatus(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/subscription/getSubscriberStatus/${subscriberId}/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setSubscriptionStatus(result.data)
      } else {
        setSubscriptionStatus(null)
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      setSubscriptionStatus(null)
    } finally {
      setIsLoadingSubscriptionStatus(false)
    }
  }

  // ============ STORY FUNCTIONS ============
  const fetchProfileStories = async () => {
    setIsLoadingStories(true)
    try {
      const viewerId = localStorage.getItem('childUserId')
      if (!viewerId) {
        throw new Error('User not logged in')
      }

      const response = await fetch(
        `https://institutional-bo.paybito.com:8443/BitohubService/stories/getStoriesByProfile?viewerId=${viewerId}&userId=${userId}&viewerPageId=${pageId}&userPageId=${localStorage.getItem('pageId') || '0'}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: StoryApiResponse = await response.json()

      if (result.success && result.data) {
        const stories: Story[] = result.data.map(apiStory => {
          const firstLetter = apiStory.fullName?.charAt(0)?.toUpperCase() || 'U'
          const colors = ['#e91e63', '#9c27b0', '#ff6f00', '#00bcd4', '#4caf50', '#f44336', '#2196f3', '#ff9800']
          const colorIndex = apiStory.userId % colors.length

          return {
            id: apiStory.storyId,
            storyId: apiStory.storyId,
            name: apiStory.fullName,
            username: apiStory.username,
            avatar: firstLetter,
            avatarImage: apiStory.profilePicture,
            avatarColor: colors[colorIndex],
            storyType: apiStory.storyType,
            storyImage: apiStory.storyType === 'IMAGE' ? apiStory.mediaUrl : undefined,
            storyVideo: apiStory.storyType === 'VIDEO' ? apiStory.mediaUrl : undefined,
            storyText: apiStory.storyType === 'TEXT' ? apiStory.content : undefined,
            storyCaption: apiStory.content,
            duration: apiStory.duration,
            time: formatTimeAgo(apiStory.createdAt),
            viewed: apiStory.hasViewed === 'Y',
            userId: apiStory.userId
          }
        })

        setProfileStories(stories)
      } else {
        setProfileStories([])
      }
    } catch (error) {
      console.error('Error fetching profile stories:', error)
      setProfileStories([])
    } finally {
      setIsLoadingStories(false)
    }
  }

  const handleOpenStoryViewer = () => {
    if (profileStories.length > 0) {
      setSelectedStoryIndex(0)
      setStoryViewerOpen(true)
    }
  }

  // Open subscription dialog
  const handleOpenSubscriptionDialog = () => {
    if (!requireAuth('subscribe')) return
    setSubscriptionDialogOpen(true)
  }

  // Handle subscribe action (called from dialog)
  const handleSubscribe = async () => {
    if (!subscriptionDetails) return

    setIsSubscribing(true)
    try {
      const subscriberId = localStorage.getItem('childUserId')

      if (!subscriberId) {
        showSnackbar('Please login to subscribe', 'error')
        return
      }

      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/subscription/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creatorId: parseInt(userId),
            subscriberId: parseInt(subscriberId),
            currentTierId: subscriptionDetails.currentTierId,
            freeTrialDays: subscriptionDetails.freeTrialDays,
            minSubscriptionPeriod: subscriptionDetails.minSubscriptionPeriod
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar(
          subscriptionDetails.freeTrialDays > 0
            ? `Successfully subscribed! Enjoy your ${subscriptionDetails.freeTrialDays}-day free trial.`
            : `Successfully subscribed to ${profileData?.name}!`,
          'success'
        )
        setSubscriptionDialogOpen(false)
        // Refresh subscription status
        await fetchSubscriptionStatus()
      } else {
        throw new Error(result.message || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to subscribe. Please try again.',
        'error'
      )
    } finally {
      setIsSubscribing(false)
    }
  }

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!subscriptionStatus) return

    setIsCancellingSubscription(true)
    try {
      const subscriberId = localStorage.getItem('childUserId')

      if (!subscriberId) {
        showSnackbar('Please login to cancel subscription', 'error')
        return
      }

      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/subscription/${subscriberId}/cancel/subscription/${subscriptionStatus.id}?status=3`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar('Subscription cancelled successfully', 'success')
        setCancelSubscriptionDialogOpen(false)
        // Refresh subscription status
        await fetchSubscriptionStatus()
      } else {
        throw new Error(result.message || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      showSnackbar(
        error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.',
        'error'
      )
    } finally {
      setIsCancellingSubscription(false)
    }
  }

  const formatJoinedDate = (dateString: string): string => {
    const date = new Date(dateString)
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' }
    return date.toLocaleDateString('en-US', options)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleViewUserProfile = (userId: number, pageId: number) => {
    if (profileData?.isPrivate && !profileData?.isFollowing) {
      showSnackbar('Follow this account to view profile details', 'warning')
      return
    }

    setFollowersDialogOpen(false)
    router.push(`/public/${userId}/${pageId}`)
  }

  const handleOpenFollowersDialog = (tab: 'followers' | 'following') => {
    if (!requireAuth('view followers')) return
    setFollowersDialogTab(tab)
    setFollowersDialogOpen(true)
    if (followers.length === 0 && following.length === 0) {
      fetchFollowersData()
    }
  }

  const fetchFollowersData = async () => {
    setIsLoadingFollowers(true)
    setFollowersError(null)

    try {
      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/messaging/getUserFollowers/${userId || '0'}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setFollowers(result.data.followerList || [])
        setFollowing(result.data.followingList || [])
      } else {
        throw new Error(result.message || 'Failed to load followers data')
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
      if (error instanceof Error) {
        setFollowersError(error.message)
      } else {
        setFollowersError('Failed to load followers. Please try again later.')
      }
    } finally {
      setIsLoadingFollowers(false)
    }
  }

  const fetchPublicProfile = async () => {
    setLoading(true)
    setError(null)

    const loggedInUserId =
      localStorage.getItem('userType') === 'USER'
        ? localStorage.getItem('childUserId') || '0'
        : localStorage.getItem('childPageId') || '0';



    if (!loggedInUserId) {
      throw new Error('User not logged in')
    }

    const payload = {
      viewerId: loggedInUserId,
      userId: userId,
      pageId: pageId,
      viewerType: localStorage.getItem('userType') || 'USER',

    }

    const response = await fetch(
      BITOHUBWEBSERVICE + '/profile/getPublicProfileDetails',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: PublicProfileAPIResponse = await response.json()

    if (result.success && result.data) {
      const apiData = result.data

      const transformedData: PublicProfileData = {
        userId: apiData.userId.toString(),
        pageId: apiData.pageId,
        entityType: apiData.entityType,
        name: apiData.fullName,
        username: apiData.username,
        bio: apiData.bio,
        location: apiData.location,
        website: apiData.website,
        joinedDate: formatJoinedDate(apiData.createdAt),
        coverImage: apiData.coverPicture,
        profileImage: apiData.profilePicture,
        isVerified: apiData.isVerified === 'Y',
        isPrivate: apiData.isPrivate === 'Y',
        isFollowing: apiData.isUserFollowing === 1,
        isUserFollowing: apiData.isUserFollowing,
        isFollower: false,
        isMuted: false,
        isBlocked: apiData.isBlocked === 'Y',
        gender: apiData.gender || null,
        dob: apiData.dob || null,
        dobVisibility: apiData?.dobVisibility || 1,
        socialMedia: {
          telegram: apiData.telegramLink || undefined,
          discord: apiData.discordLink || undefined,
          instagram: apiData.instagramLink || undefined,
          facebook: apiData.facebookLink || undefined,
          youtube: apiData.youtubeLink || undefined,
          tiktok: apiData.tikTokLink || undefined,
          twitch: apiData.twitchLink || undefined,
          linkedin: apiData.linkedinLink || undefined,
          x: apiData.xlink || undefined
        },
        categories: apiData.categoryList && apiData.categoryList.length > 0
          ? apiData.categoryList
          : [],
        stats: {
          followers: formatNumber(apiData.followersCount),
          following: formatNumber(apiData.followingCount),
          posts: formatNumber(apiData.postsCount)
        }
      }

      setProfileData(transformedData)
      setLoading(false)

    } else {
      throw new Error(result.message || 'Failed to fetch profile data')
    }
  }

  const fetchUserPosts = async (page: number = 1) => {
    setIsLoadingPosts(true)
    setPostsError(null)

    try {
      const viewerId =
        localStorage.getItem('userType') === 'USER'
          ? localStorage.getItem('childUserId') || '0'
          : localStorage.getItem('childPageId') || '0';

      const profileUserId = profileData?.userId || userId
      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/post/getUserPosts?userId=${profileUserId}&viewerId=${viewerId}&pageId=${pageId}&page=${page}&size=50&viewerType=${localStorage.getItem('userType') || 'USER'}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: UserPostsResponse = await response.json()

      if (result.success && result.data) {
        const convertedPosts = convertAPIPostsToComponentFormat(result.data.content)
        setUserPosts(convertedPosts)
        setTotalPages(result.data.totalPages)
        setHasMorePosts(result.data.hasNext)
        setCurrentPage(page)
      } else {
        throw new Error(result.message || 'Failed to load posts')
      }
    } catch (error) {
      console.error('Error fetching user posts:', error)
      if (error instanceof Error) {
        setPostsError(error.message)
      } else {
        setPostsError('Failed to load posts. Please try again later.')
      }
    } finally {
      setIsLoadingPosts(false)
    }
  }

  const fetchUserReels = async (page: number = 0) => {
    setIsLoadingReels(true)
    setReelsError(null)

    try {
      const userPageId = localStorage.getItem('pageId') || '0'
      const response = await fetch(
        `${BITOHUBWEBSERVICE}/reels/getUserReels/${userId}?pageId=${userPageId}&page=${page}&viewerType=${localStorage.getItem('userType') || 'USER'}&viewerId=${localStorage.getItem('childUserId') || '0'}&size=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: UserReelsResponse = await response.json()

      if (result.success && result.data) {
        const convertedReels = convertAPIReelsToComponentFormat(result.data.content)
        setUserReels(convertedReels)
        setTotalReelPages(result.data.totalPages)
        setHasMoreReels(result.data.hasNext)
        setCurrentReelPage(page)
      } else {
        throw new Error(result.message || 'Failed to load reels')
      }
    } catch (error) {
      console.error('Error fetching user reels:', error)
      if (error instanceof Error) {
        setReelsError(error.message)
      } else {
        setReelsError('Failed to load reels. Please try again later.')
      }
    } finally {
      setIsLoadingReels(false)
    }
  }

  const fetchTaggedPosts = async (page: number = 1) => {
    setIsLoadingTaggedPosts(true)
    setTaggedPostsError(null)

    try {
      const response = await fetch(
        `${BITOHUBWEBSERVICE}/post/getTaggedPostsByUser?userId=${userId}&page=${page}&size=50&pageId=${localStorage.getItem('pageId') || '0'}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: UserPostsResponse = await response.json()

      if (result.success && result.data) {
        const convertedPosts = convertAPIPostsToComponentFormat(result.data.content)
        setTaggedPosts(convertedPosts)
        setTotalTaggedPages(result.data.totalPages)
        setHasMoreTaggedPosts(result.data.hasNext)
        setCurrentTaggedPage(page)
      } else {
        throw new Error(result.message || 'Failed to load tagged posts')
      }
    } catch (error) {
      console.error('Error fetching tagged posts:', error)
      if (error instanceof Error) {
        setTaggedPostsError(error.message)
      } else {
        setTaggedPostsError('Failed to load tagged posts. Please try again later.')
      }
    } finally {
      setIsLoadingTaggedPosts(false)
    }
  }

  const handleMessageUser = () => {
    if (!requireAuth('send messages')) return
    if (!profileData) return

    router.push(`/messages?userId=${userId}`)
  }

  useEffect(() => {
    if (userId) {
      fetchPublicProfile()
      checkViewEligibility()
      fetchSubscriptionDetails()
      fetchSubscriptionStatus()
      fetchGiftBadgeStatus()
      fetchShopDetails()
      fetchProfileStories() 
      fetchPurchasedBadge()
    }
  }, [userId])

  useEffect(() => {
    if (userId && profileData && isEligibleToView === true) {
      fetchUserPosts(1)
    }
  }, [userId, profileData, isEligibleToView])

  useEffect(() => {
    if (userId && profileData && !profileData.isPrivate) {
      switch (activeTab) {
        case 0:
          if (userPosts.length === 0) {
            fetchUserPosts(1)
          }
          break
        case 1:
          if (userReels.length === 0) {
            fetchUserReels(0)
          }
          break
        case 2:
          if (taggedPosts.length === 0) {
            fetchTaggedPosts(1)
          }
          break
      }
    }
  }, [activeTab, userId, profileData])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleFollow = async () => {
    if (!requireAuth('follow users')) return
    if (!profileData) return

    try {
      const followerId = localStorage.getItem('childPageId')
      const followerType = localStorage.getItem('userType')

      if (!followerId) {
        showSnackbar('Please login to follow users', 'error')
        return
      }

      const followingId = (profileData.pageId && profileData.pageId !== 0)
        ? profileData.pageId
        : profileData.userId

      const payload = {
        followerId: followerId,
        followingId: followingId.toString(),
        followerType: followerType || 'USER',
        followingType: profileData.entityType || 'USER'
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/followUnfollowUser',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar(result.message || 'Action successful', 'success')
        // Refresh profile to get updated isUserFollowing status
        await fetchPublicProfile()
      } else {
        throw new Error(result.message || 'Failed to follow/unfollow user')
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      showSnackbar('Failed to perform action. Please try again.', 'error')
    }
  }

  const handleCancelRequest = async () => {
    if (!requireAuth('follow users')) return
    if (!profileData) return

    try {
      const followerId = localStorage.getItem('childPageId')
      const followerType = localStorage.getItem('userType')

      if (!followerId) {
        showSnackbar('Please login to follow users', 'error')
        return
      }

      const followingId = (profileData.pageId && profileData.pageId !== 0)
        ? profileData.pageId
        : profileData.userId

      const payload = {
        followerId: followerId,
        followingId: followingId.toString(),
        followerType: followerType || 'USER',
        followingType: profileData.entityType || 'USER',
        followAction: 'CANCEL'
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/processFollowRequest',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        showSnackbar(result.message || 'Action successful', 'success')
        // Refresh profile to get updated isUserFollowing status
        await fetchPublicProfile()
      } else {
        throw new Error(result.message || 'Failed to follow/unfollow user')
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      showSnackbar('Failed to perform action. Please try again.', 'error')
    }
  }

  const handleNotificationToggle = () => {
    if (!profileData) return

    setProfileData(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null)
    showSnackbar(
      profileData.isMuted ? 'Notifications turned on' : 'Notifications muted',
      'info'
    )
    handleMenuClose()
  }

  const handleCopyProfileLink = () => {
    if (!profileData) return

    const profileUrl = `${window.location.origin}/public/${userId}`
    navigator.clipboard.writeText(profileUrl)
    showSnackbar('Profile link copied to clipboard', 'success')
    handleMenuClose()
  }

  const handleShareProfile = () => {
    if (!profileData) return

    if (navigator.share) {
      navigator.share({
        title: `${profileData.name} on BitoCircle`,
        text: `Check out ${profileData.name}'s profile on BitoCircle`,
        url: `${window.location.origin}/public/${userId}`
      })
    } else {
      handleCopyProfileLink()
    }
    handleMenuClose()
  }

  const handleBlock = async () => {
    if (!requireAuth('block users')) return
    if (!profileData) return

    try {
      const loggedInUserId = localStorage.getItem('childUserId')

      if (!loggedInUserId) {
        showSnackbar('Please login to perform this action', 'error')
        handleMenuClose()
        return
      }

      const isCurrentlyBlocked = profileData.isBlocked

      const endpoint = isCurrentlyBlocked
        ? `${BITOHUBWEBSERVICE}/settings/unblockUser/${loggedInUserId}/${userId}`
        : `${BITOHUBWEBSERVICE}/settings/blockUser/${loggedInUserId}/${userId}`

      const method = isCurrentlyBlocked ? 'DELETE' : 'POST'

      const response = await fetchWithAuth(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setProfileData(prev => prev ? { ...prev, isBlocked: !prev.isBlocked } : null)

        showSnackbar(
          isCurrentlyBlocked ? `Unblocked ${profileData.name}` : `Blocked ${profileData.name}`,
          'success'
        )
      } else {
        throw new Error(result.message || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error blocking/unblocking user:', error)
      showSnackbar(
        `Failed to ${profileData.isBlocked ? 'unblock' : 'block'} user. Please try again.`,
        'error'
      )
    } finally {
      handleMenuClose()
    }
  }

  const handleReport = () => {
    if (!requireAuth('report users')) return
    setReportDialogOpen(true)
    handleMenuClose()
  }

  const handleReportSubmit = (success: boolean, message: string) => {
    if (success) {
      showSnackbar(message || 'Report submitted successfully', 'success')
    } else {
      showSnackbar(message || 'Failed to submit report', 'error')
    }
  }

  const handleSharePost = (postId: number) => {
    if (!requireAuth('share posts')) return

    let post: Post | undefined
    switch (activeTab) {
      case 0:
        post = userPosts.find(p => p.id === postId)
        break
      case 2:
        post = taggedPosts.find(p => p.id === postId)
        break
    }

    if (post) {
      setPostToShare(post)
      setOpenShareDialog(true)
    }
  }

  const handleShareDialogClose = () => {
    setOpenShareDialog(false)
    setPostToShare(null)
  }

  const handleShareSuccess = () => {
    if (postToShare) {
      if (postToShare.contentType === 'REEL') {
        setUserReels(reels => reels.map(reel => {
          if (reel.id === postToShare.id) {
            return {
              ...reel,
              shares: reel.shares + 1
            }
          }
          return reel
        }))
      } else {
        const updateShareCount = (post: Post) => {
          if (post.id === postToShare.id) {
            return {
              ...post,
              shares: post.shares + 1
            }
          }
          return post
        }

        switch (activeTab) {
          case 0:
            setUserPosts(posts => posts.map(updateShareCount))
            break
          case 2:
            setTaggedPosts(posts => posts.map(updateShareCount))
            break
        }
      }
    }

    showSnackbar('Shared successfully!', 'success')
    handleShareDialogClose()
  }

  const handleLikePost = async (postId: number) => {
    if (!requireAuth('like posts')) return
    try {
      const loggedInUserId = localStorage.getItem('childUserId')
      if (!loggedInUserId) {
        showSnackbar('Please login to like posts', 'error')
        return
      }

      let currentPost: Post | undefined
      switch (activeTab) {
        case 0:
          currentPost = userPosts.find(p => p.id === postId)
          break
        case 2:
          currentPost = taggedPosts.find(p => p.id === postId)
          break
      }

      if (!currentPost) return

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/toggleLikePost',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(loggedInUserId),
            contentId: postId,
            contentType: currentPost.contentType,
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const updatePost = (post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          }
          return post
        }

        switch (activeTab) {
          case 0:
            setUserPosts(posts => posts.map(updatePost))
            break
          case 2:
            setTaggedPosts(posts => posts.map(updatePost))
            break
        }
      } else {
        throw new Error(result.message || 'Failed to like post')
      }
    } catch (error) {
      console.error('Error liking post:', error)
      showSnackbar('Failed to like post. Please try again.', 'error')
    }
  }

  const handleSavePost = async (postId: number) => {
    if (!requireAuth('comment on posts')) return
    try {
      const loggedInUserId = localStorage.getItem('childUserId')
      if (!loggedInUserId) {
        showSnackbar('Please login to bookmark posts', 'error')
        return
      }

      let currentPost: Post | undefined
      switch (activeTab) {
        case 0:
          currentPost = userPosts.find(p => p.id === postId)
          break
        case 2:
          currentPost = taggedPosts.find(p => p.id === postId)
          break
      }

      if (!currentPost) return

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/post/bookmarkContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(loggedInUserId),
            contentId: postId,
            contentType: currentPost.contentType
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const updatePost = (post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              isSaved: !post.isSaved
            }
          }
          return post
        }

        switch (activeTab) {
          case 0:
            setUserPosts(posts => posts.map(updatePost))
            break
          case 2:
            setTaggedPosts(posts => posts.map(updatePost))
            break
        }

        const actionMessage = currentPost.isSaved ? 'Post removed from bookmarks' : 'Post bookmarked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to bookmark post')
      }
    } catch (error) {
      console.error('Error bookmarking post:', error)
      showSnackbar('Failed to bookmark post. Please try again.', 'error')
    }
  }

  const handleComment = (postId: number) => {
    let post: Post | undefined
    switch (activeTab) {
      case 0:
        post = userPosts.find(p => p.id === postId)
        break
      case 2:
        post = taggedPosts.find(p => p.id === postId)
        break
    }

    if (post) {
      setSelectedPost(post)
      setOpenCommentDialog(true)
    }
  }

  const handleVotePost = async (postId: number, optionId: number) => {
    if (!requireAuth('vote in polls')) return
    let pollPost: PollPost | undefined

    switch (activeTab) {
      case 0:
        pollPost = userPosts.find(p => p.id === postId && p.type === 'poll') as PollPost
        break
      case 2:
        pollPost = taggedPosts.find(p => p.id === postId && p.type === 'poll') as PollPost
        break
    }

    if (!pollPost) return

    if (pollPost.hasVoted) {
      showSnackbar('You have already voted in this poll', 'error')
      return
    }

    try {
      const loggedInUserId = localStorage.getItem('childUserId')
      if (!loggedInUserId) {
        showSnackbar('Please login to vote', 'error')
        return
      }

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/poll/voteInPoll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(loggedInUserId),
            pollId: pollPost.pollId,
            optionId: optionId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        const updatePost = (post: Post) => {
          if (post.id === postId && post.type === 'poll') {
            return {
              ...post,
              hasVoted: true,
              votedOptionId: optionId,
              options: post.options.map(option => ({
                ...option,
                votes: option.id === optionId ? option.votes + 1 : option.votes
              })),
              totalVotes: post.totalVotes + 1
            }
          }
          return post
        }

        switch (activeTab) {
          case 0:
            setUserPosts(posts => posts.map(updatePost))
            break
          case 2:
            setTaggedPosts(posts => posts.map(updatePost))
            break
        }

        showSnackbar('Vote cast successfully!', 'success')
      } else {
        throw new Error(result.message || 'Failed to cast vote')
      }
    } catch (error) {
      console.error('Error voting in poll:', error)
      showSnackbar('Failed to cast vote. Please try again.', 'error')
    }
  }

  const handleLikeReel = async (reelId: number) => {
    if (!requireAuth('like reels')) return
    try {
      const loggedInUserId = localStorage.getItem('childUserId')
      if (!loggedInUserId) {
        showSnackbar('Please login to like reels', 'error')
        return
      }

      const response = await fetchWithAuth(
        `${BITOHUBWEBSERVICE}/reels/likeReel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(loggedInUserId),
            reelId: reelId,
            pageId: parseInt(localStorage.getItem('pageId') || '0')
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setUserReels(reels => reels.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              isLiked: !reel.isLiked,
              likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1
            }
          }
          return reel
        }))
      }
    } catch (error) {
      console.error('Error liking reel:', error)
      showSnackbar('Failed to like reel. Please try again.', 'error')
    }
  }

  // ============ GIFT & BADGE HANDLERS ============
  const handleOpenGiftDialog = () => {
    if (!requireAuth('send gifts')) return
    setGiftDialogOpen(true)
  }

  const handleOpenBadgeDialog = () => {
    if (!requireAuth('buy badges')) return
    setBadgeDialogOpen(true)
  }

  const handleSelectGift = (gift: typeof giftsData['Popular'][0]) => {
    setSelectedGift(gift)
  }

  const handleQuickReaction = async (emoji: string, price: number) => {
    if (!requireAuth('send gifts')) return
    if (!profileData) return

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      setUserBalance(prev => prev - price)
      showSnackbar(`${emoji} Sent $${price} to ${profileData.name}!`, 'success')
    } catch (error) {
      console.error('Error sending quick gift:', error)
      showSnackbar('Failed to send gift. Please try again.', 'error')
    }
  }

  const handleSendGift = async () => {
    if (!selectedGift || !profileData) return

    if (userBalance < selectedGift.priceUSD) {
      showSnackbar('Insufficient balance. Please add funds.', 'error')
      return
    }

    setIsSendingGift(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      setUserBalance(prev => prev - selectedGift.priceUSD)
      showSnackbar(`🎁 ${selectedGift.emoji} ${selectedGift.name} sent to ${profileData.name}!`, 'success')
      setGiftDialogOpen(false)
      setSelectedGift(null)
      setGiftMessage('')
    } catch (error) {
      console.error('Error sending gift:', error)
      showSnackbar('Failed to send gift. Please try again.', 'error')
    } finally {
      setIsSendingGift(false)
    }
  }

  const handleQuickGift = async (emoji: string, price: number) => {
    if (!requireAuth('send gifts')) return
    if (!profileData) return

    if (userBalance < price) {
      showSnackbar('Insufficient balance. Please add funds.', 'error')
      return
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      setUserBalance(prev => prev - price)
      showSnackbar(`${emoji} Sent $${price} to ${profileData.name}!`, 'success')
    } catch (error) {
      console.error('Error sending quick gift:', error)
      showSnackbar('Failed to send gift. Please try again.', 'error')
    }
  }

  const handleSelectBadge = async (badge: typeof badgeTiers[0]) => {
    if (!profileData) return

    showSnackbar(`Selected ${badge.name} for $${badge.price}/month. Subscription will be activated after payment confirmation.`, 'info')
    setBadgeDialogOpen(false)
  }

  const renderPostComponent = (post: Post) => {
    if (post.type === 'poll') {
      return (
        <PollPostComponent
          key={post.id}
          id={post.id}
          user={post.user}
          content={post.content}
          question={post.question}
          options={post.options}
          totalVotes={post.totalVotes}
          hasVoted={post.hasVoted}
          votedOptionId={post.votedOptionId}
          endTime={post.endTime}
          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
          isLiked={post.isLiked}
          isSaved={post.isSaved}
          onLike={() => handleLikePost(post.id)}
          onSave={() => handleSavePost(post.id)}
          onComment={() => handleComment(post.id)}
          onShare={() => handleSharePost(post.id)}
          onVote={(optionId) => handleVotePost(post.id, optionId)}
          onEdit={() => showSnackbar('You cannot edit this post', 'info')}
          onDelete={() => showSnackbar('You cannot delete this post', 'info')}
          isCommentAllowed={post.isCommentAllowed}


        />
      )
    } else if (post.type === 'image') {
      return (
        <ImagePostComponent
          key={post.id}
          id={post.id}
          user={post.user}
          content={post.content}
          contentType={post.contentType}
          images={post.images}
          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
          isLiked={post.isLiked}
          isSaved={post.isSaved}
          onLike={() => handleLikePost(post.id)}
          onSave={() => handleSavePost(post.id)}
          onComment={() => handleComment(post.id)}
          onShare={() => handleSharePost(post.id)}
          onEdit={() => showSnackbar('You cannot edit this post', 'info')}
          onDelete={() => showSnackbar('You cannot delete this post', 'info')}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
          isCommentAllowed={post.isCommentAllowed}

        // taggedProducts={post.taggedProducts}
        />
      )
    } else if (post.type === 'video') {
      return (
        <VideoPostComponent
          key={post.id}
          id={post.id}
          user={post.user}
          content={post.content}
          contentType={post.contentType}

          videoUrl={post.videoUrl}
          thumbnailUrl={post.thumbnailUrl}
          duration={post.duration}
          views={post.views}
          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
          isLiked={post.isLiked}
          isSaved={post.isSaved}
          onLike={() => handleLikePost(post.id)}
          onSave={() => handleSavePost(post.id)}
          onComment={() => handleComment(post.id)}
          onShare={() => handleSharePost(post.id)}
          onEdit={() => showSnackbar('You cannot edit this post', 'info')}
          onDelete={() => showSnackbar('You cannot delete this post', 'info')}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
          isCommentAllowed={post.isCommentAllowed}

        // taggedProducts={post.taggedProducts}
        />
      )
    } else if (post.type === 'text') {
      return (
        <TextPostComponent
          key={post.id}
          id={post.id}
          user={post.user}
          content={post.content}
          contentType={post.contentType}

          likes={post.likes}
          comments={post.comments}
          shares={post.shares}
          isLiked={post.isLiked}
          isSaved={post.isSaved}
          onLike={() => handleLikePost(post.id)}
          onSave={() => handleSavePost(post.id)}
          onComment={() => handleComment(post.id)}
          onShare={() => handleSharePost(post.id)}
          onEdit={() => showSnackbar('You cannot edit this post', 'info')}
          onDelete={() => showSnackbar('You cannot delete this post', 'info')}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
          isCommentAllowed={post.isCommentAllowed}
        // taggedProducts={post.taggedProducts}
        />
      )
    }
    return null
  }

  // Check if user is subscribed
  const isSubscribed = subscriptionStatus?.isSubscribed === 'Y'

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={isMobile ? 200 : 400}
          sx={{ borderRadius: { xs: 0, md: '0 0 16px 16px' } }}
        />

        <Container maxWidth="md" sx={{ mt: { xs: -10, sm: -12, md: -15 } }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              mb: 3,
              px: { xs: 2, sm: 0 }
            }}>
              {/* Avatar Skeleton - position adjusted for taller cover */}
              <Skeleton
                variant="circular"
                width={isMobile ? 100 : 150}
                height={isMobile ? 100 : 150}
                sx={{
                  border: '4px solid white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Skeleton variant="rounded" width={120} height={40} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rounded" width={110} height={40} sx={{ borderRadius: 3 }} />
              </Box>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 0 } }}>
              <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="90%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="85%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="35%" height={20} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="30%" height={20} sx={{ mb: 3 }} />

              <Stack direction="row" spacing={4} sx={{ mb: 3 }}>
                <Box>
                  <Skeleton variant="text" width={50} height={32} />
                  <Skeleton variant="text" width={60} height={20} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={50} height={32} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
                <Box>
                  <Skeleton variant="text" width={50} height={32} />
                  <Skeleton variant="text" width={80} height={20} />
                </Box>
              </Stack>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
                <Stack direction="row" spacing={3} sx={{ justifyContent: 'center' }}>
                  <Skeleton variant="text" width={60} height={48} />
                  <Skeleton variant="text" width={60} height={48} />
                  <Skeleton variant="text" width={70} height={48} />
                </Stack>
              </Box>

              <Box sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
                <PostSkeleton variant="text" />
                <PostSkeleton variant="image" />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    )
  }

  if (error || !profileData) {
    return (
      <Box sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" gutterBottom color="error">
              Failed to Load Profile
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {error || 'Unable to load profile data. Please try again.'}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchPublicProfile}
              sx={{
                bgcolor: '#1e40af',
                '&:hover': {
                  bgcolor: '#5558dd',
                },
              }}
            >
              Retry
            </Button>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Cover Image */}
      <Box
        sx={{
          height: { xs: 200, sm: 250, md: 400 },
          background: profileData.coverImage
            ? `url(${profileData.coverImage}) center/cover no-repeat`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: { xs: 0, md: '0 0 16px 16px' },
          position: 'relative',
          overflow: 'hidden',
          opacity: loading ? 0.7 : 1,
          cursor: profileData?.coverImage ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': profileData?.coverImage ? {
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              zIndex: 1
            },
            '&::after': {
              content: '"Click to view full image"',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              zIndex: 2,
              transition: 'all 0.3s ease',
              textAlign: 'center',
              padding: '8px 16px',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '4px'
            }
          } : {}
        }}
        onClick={handleCoverImageClick}
      >
        {/* If no cover image, show gradient background */}
        {!profileData?.coverImage && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          />
        )}

        {localStorage.getItem('childUserId') != userId && (
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              handleMenuOpen(e)
            }}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 3,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <MoreIcon />
          </IconButton>
        )}
      </Box>

      {/* ============ SUPPORT ACTIONS BAR ============ */}
      {localStorage.getItem('childUserId') !== userId && (
        (isGiftsEnabled ||
          (shopDetails?.showShopOnProfile === 'Y') ||
          (subscriptionDetails?.isSubscriptionsEnabled === 'Y')) ? (
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderBottom: 1,
              borderColor: 'divider',
              py: 2,
              px: { xs: 2, sm: 3 },
              display: 'flex',
              justifyContent: 'center',
              gap: { xs: 1, sm: 2 },
              flexWrap: 'wrap',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              backdropFilter: 'blur(10px)',
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(37, 37, 41, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Show loading spinner while checking gift status */}
            {isLoadingGiftStatus ? (
              <CircularProgress size={24} />
            ) : (
              <>
                {/* Gift and Badge buttons - only show if gifts enabled */}
                {isGiftsEnabled && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<span style={{ fontSize: '18px' }}>🎁</span>}
                      onClick={handleOpenGiftDialog}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: { xs: 2, sm: 3 },
                        py: 1.2,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                        boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(30, 64, 175, 0.4)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Send Gift
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<span style={{ fontSize: '18px' }}>🏆</span>}
                      onClick={handleOpenBadgeDialog}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: { xs: 2, sm: 3 },
                        py: 1.2,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        fontWeight: 600,
                        borderColor: 'divider',
                        color: 'text.secondary',
                        '&:hover': {
                          borderColor: '#1e40af',
                          bgcolor: 'rgba(30, 64, 175, 0.04)',
                          transform: 'translateY(-2px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Buy Badge
                    </Button>
                  </>
                )}

                {/* View Shop button - only show if shop is enabled and showOnProfile is Y */}
                {!isLoadingShop && shopDetails?.showShopOnProfile === 'Y' && (
                  <Button
                    variant="outlined"
                    startIcon={<StorefrontIcon />}
                    onClick={() => {
                      const shopUrl = getShopUrl()
                      window.open(shopUrl, '_blank')
                    }}
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      px: { xs: 2, sm: 3 },
                      py: 1.2,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      fontWeight: 600,
                      borderColor: '#22c55e',
                      color: '#22c55e',
                      '&:hover': {
                        borderColor: '#16a34a',
                        bgcolor: 'rgba(34, 197, 94, 0.04)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    View Shop
                    {shopDetails?.externalCheckoutEnabled === 'Y' && (
                      <Chip
                        label="External"
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: '0.65rem',
                          bgcolor: '#fef3c7',
                          color: '#92400e',
                        }}
                      />
                    )}
                  </Button>
                )}

                {/* Dynamic Subscribe/Cancel Button - only show if subscriptions are enabled */}
                {subscriptionDetails?.isSubscriptionsEnabled === 'Y' && (
                  isSubscribed ? (
                    // Cancel Subscription Button
                    <Button
                      variant="outlined"
                      startIcon={isCancellingSubscription ? null : <CancelIcon />}
                      onClick={() => setCancelSubscriptionDialogOpen(true)}
                      disabled={isCancellingSubscription || isLoadingSubscriptionStatus}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: { xs: 2, sm: 3 },
                        py: 1.2,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        fontWeight: 600,
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        minWidth: 160,
                        '&:hover': {
                          borderColor: '#dc2626',
                          bgcolor: 'rgba(239, 68, 68, 0.04)',
                          transform: 'translateY(-2px)',
                        },
                        '&:disabled': {
                          borderColor: '#ef4444',
                          opacity: 0.7,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isCancellingSubscription ? (
                        <CircularProgress size={24} sx={{ color: '#ef4444' }} />
                      ) : (
                        <>
                          Cancel Subscription
                          {subscriptionStatus?.status && (
                            <Chip
                              label={subscriptionStatus.status}
                              size="small"
                              sx={{
                                ml: 1,
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: subscriptionStatus.status === 'TRIAL PERIOD' ? '#fef3c7' : '#e0f2fe',
                                color: subscriptionStatus.status === 'TRIAL PERIOD' ? '#92400e' : '#0369a1',
                              }}
                            />
                          )}
                        </>
                      )}
                    </Button>
                  ) : (
                    // Subscribe Button
                    <Button
                      variant="contained"
                      startIcon={isSubscribing ? null : <span style={{ fontSize: '18px' }}>⭐</span>}
                      onClick={handleOpenSubscriptionDialog}
                      disabled={isSubscribing || isLoadingSubscription}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: { xs: 2, sm: 3 },
                        py: 1.2,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #FF3B3B, #E62E2E)',
                        boxShadow: '0 4px 15px rgba(255, 59, 59, 0.3)',
                        minWidth: 160,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #ff5252, #FF3B3B)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(255, 59, 59, 0.4)',
                        },
                        '&:disabled': {
                          background: 'linear-gradient(135deg, #FF3B3B, #E62E2E)',
                          opacity: 0.7,
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {isSubscribing ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : isLoadingSubscription ? (
                        'Loading...'
                      ) : (
                        <>
                          Subscribe ${subscriptionDetails.price}
                          {subscriptionDetails.minSubscriptionPeriod && (
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.75rem',
                                ml: 0.5,
                                opacity: 0.9
                              }}
                            >
                              /{subscriptionDetails.minSubscriptionPeriod.toLowerCase().replace(' ', '')}
                            </Typography>
                          )}
                        </>
                      )}
                    </Button>
                  )
                )}
              </>
            )}
          </Box>
        ) : null
      )}

      <Container maxWidth="md" sx={{ mt: { xs: -10, sm: -12, md: -15 }, pt: localStorage.getItem('childUserId') !== userId ? { xs: 12, sm: 14, md: 17 } : 0 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            mb: 3,
            px: { xs: 2, sm: 0 }
          }}>
            {/* Profile Avatar with Story Ring and Active Status */}
            <Box sx={{ position: 'relative', display: 'inline-block' }}>
              {/* Active Status Dot */}
              {isUserActive(userId) && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 6, sm: 8, md: 10 },
                    right: { xs: 6, sm: 8, md: 10 },
                    width: 22,
                    height: 22,
                    backgroundColor: '#44b700',
                    borderRadius: '50%',
                    border: (theme) => `3px solid ${theme.palette.background.paper}`,
                    zIndex: 10,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      animation: 'ripple 1.2s infinite ease-in-out',
                      border: '1px solid #44b700',
                    },
                    '@keyframes ripple': {
                      '0%': { transform: 'scale(.8)', opacity: 1 },
                      '100%': { transform: 'scale(2.4)', opacity: 0 },
                    },
                  }}
                />
              )}

              {/* Story Ring Wrapper */}
              <Box
                onClick={() => {
                  // If stories exist, show choice dialog
                  if (profileStories.length > 0) {
                    setAvatarChoiceDialogOpen(true)
                  } else if (profileData.profileImage) {
                    // No stories, just open profile image viewer
                    setImageViewerOpen(true)
                  }
                }}
                sx={{
                  borderRadius: '50%',
                  background: profileStories.length > 0
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : 'transparent',
                  padding: profileStories.length > 0 ? '3px' : '0',
                  cursor: (profileStories.length > 0 || profileData.profileImage) ? 'pointer' : 'default',
                  display: 'inline-flex',
                  transition: 'all 0.3s ease',
                  '&:hover': (profileStories.length > 0 || profileData.profileImage) ? {
                    transform: 'scale(1.03)',
                  } : {},
                }}
              >
                <Avatar
                  src={profileData.profileImage || undefined}
                  alt={profileData.name}
                  sx={{
                    width: { xs: 100, sm: 120, md: 150 },
                    height: { xs: 100, sm: 120, md: 150 },
                    border: '4px solid white',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    bgcolor: '#e3f2fd',
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    cursor: (profileStories.length > 0 || profileData.profileImage) ? 'pointer' : 'default',
                    '&:hover': (profileStories.length > 0 || profileData.profileImage) ? {
                      opacity: 0.9
                    } : {}
                  }}
                >
                  {!profileData.profileImage && profileData.name[0]}
                </Avatar>
              </Box>
            </Box>

            <Stack direction="row" spacing={2}>
              {userId != localStorage.getItem('childUserId') ?
                <>
                  <Button
                    variant="contained"
                    startIcon={
                      profileData.isUserFollowing === 2
                        ? <PendingIcon />
                        : profileData.isUserFollowing === 1
                          ? <UnfollowIcon />
                          : <FollowIcon />
                    }


                    onClick={
                      profileData.isUserFollowing === 2
                        ? () => { } // Empty function for disabled state
                        : () => handleFollow()
                    }
                    sx={{
                      borderRadius: 3,
                      textTransform: 'none',
                      px: 3,
                      py: 1,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      bgcolor: profileData.isUserFollowing === 1
                        ? 'grey.400'
                        : profileData.isUserFollowing === 2
                          ? '#f59e0b'
                          : '#1e40af',
                      '&:hover': {
                        bgcolor: profileData.isUserFollowing === 1
                          ? 'grey.500'
                          : profileData.isUserFollowing === 2
                            ? '#d97706'
                            : '#5558dd',
                      },
                    }}
                  >
                    {profileData.isUserFollowing === 2
                      ? 'Requested'
                      : profileData.isUserFollowing === 1
                        ? 'Following'
                        : 'Follow'}
                  </Button>

                  {/* Show Message button only when following (isUserFollowing === 1) */}
                  {profileData.isUserFollowing === 1 && (
                    <Button
                      variant="outlined"
                      startIcon={<MessageIcon />}
                      onClick={handleMessageUser}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        borderColor: '#1e40af',
                        color: '#1e40af',
                        '&:hover': {
                          borderColor: '#5558dd',
                          bgcolor: 'rgba(30, 64, 175, 0.04)',
                        },
                      }}
                    >
                      Message
                    </Button>
                  )}

                  {/* Show Cancel Request button when request is pending (isUserFollowing === 2) */}
                  {profileData.isUserFollowing === 2 && (
                    <Button
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={handleCancelRequest}
                      sx={{
                        borderRadius: 3,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        borderColor: '#ef4444',
                        color: '#ef4444',
                        '&:hover': {
                          borderColor: '#dc2626',
                          bgcolor: 'rgba(239, 68, 68, 0.04)',
                        },
                      }}
                    >
                      Cancel Request
                    </Button>
                  )}
                </>
                : ''
              }
            </Stack>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 0 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {/* Purchased Badge Display */}
              {purchasedBadge && (
                <Chip
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span style={{ fontSize: '14px' }}>{getBadgeEmoji(purchasedBadge)}</span>
                      <span>{purchasedBadge}</span>
                    </Box>
                  }
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    bgcolor: `${getBadgeColor(purchasedBadge)}20`,
                    color: getBadgeColor(purchasedBadge),
                    border: `1.5px solid ${getBadgeColor(purchasedBadge)}`,
                    borderRadius: 2,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              )}
              <Typography variant="h5" fontWeight="bold">
                {profileData.name}
              </Typography>
              {profileData.isVerified && (
                <VerifiedIcon sx={{ color: '#1e40af', fontSize: 24 }} />
              )}
              {profileData.isPrivate && (
                <PrivateIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              )}
            </Box>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profileData.username}
            </Typography>

            {profileData.categories && profileData.categories.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {profileData.categories.map((category, index) => (
                  <Box
                    key={index}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: '#e3f2fd',
                      borderRadius: 2,
                      fontSize: '0.875rem',
                      color: '#1e40af',
                      fontWeight: 500
                    }}
                  >
                    {category.type}
                  </Box>
                ))}
              </Stack>
            )}

            {profileData.bio && (isEligibleToView === true) && (
              <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {profileData.bio}
              </Typography>
            )}

            {(isEligibleToView === true) && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 1, sm: 3 }}
                sx={{ mb: 2, flexWrap: 'wrap' }}
              >
                {/* Gender */}
                {profileData.gender && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GenderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {profileData.gender}
                    </Typography>
                  </Box>
                )}

                {/* Date of Birth */}
                {profileData.dob && formatDobForDisplay(profileData.dob) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CakeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDobForDisplay(profileData.dob)}
                    </Typography>
                  </Box>
                )}

                {/* Location */}
                {profileData.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {profileData.location}
                    </Typography>
                  </Box>
                )}

                {/* Joined Date */}
                {profileData.joinedDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Joined {profileData.joinedDate}
                    </Typography>
                  </Box>
                )}

                {/* Website */}
                {profileData.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WebsiteIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography
                      variant="body2"
                      sx={{ color: '#1e40af', cursor: 'pointer' }}
                      onClick={() => {
                        if (profileData.website) {
                          const url = profileData.website.startsWith('http')
                            ? profileData.website
                            : `https://${profileData.website}`
                          window.open(url, '_blank')
                        }
                      }}
                    >
                      {profileData.website}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {profileData.socialMedia && Object.values(profileData.socialMedia).some(link => link) && (isEligibleToView === true) && (
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
              >
                {profileData.socialMedia.telegram && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.telegram}
                    target="_blank"
                    sx={{ color: '#0088cc' }}
                  >
                    <TelegramIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.discord && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.discord}
                    target="_blank"
                    sx={{ color: '#5865F2' }}
                  >
                    <DiscordIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.instagram && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.instagram}
                    target="_blank"
                    sx={{ color: '#E4405F' }}
                  >
                    <InstagramIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.facebook && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.facebook}
                    target="_blank"
                    sx={{ color: '#1877F2' }}
                  >
                    <FacebookIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.youtube && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.youtube}
                    target="_blank"
                    sx={{ color: '#FF0000' }}
                  >
                    <YouTubeIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.tiktok && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.tiktok}
                    target="_blank"
                  >
                    <TikTokIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.twitch && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.twitch}
                    target="_blank"
                    sx={{ color: '#9146FF' }}
                  >
                    <TwitchIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.linkedin && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.linkedin}
                    target="_blank"
                    sx={{ color: '#0A66C2' }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.x && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.x}
                    target="_blank"
                  >
                    <XIcon />
                  </IconButton>
                )}
              </Stack>
            )}

            <Stack direction="row" spacing={4}>
              <Box
                onClick={() => {
                  if (isEligibleToView === true) {
                    handleOpenFollowersDialog('followers')
                  }
                }}
                sx={{
                  cursor: isEligibleToView === false ? 'default' : 'pointer',
                  '&:hover': { opacity: isEligibleToView === false ? 1 : 0.7 },
                  opacity: 1,
                  pointerEvents: isEligibleToView === false ? 'none' : 'auto'
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {profileData.stats.followers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              <Box
                onClick={() => {
                  if (isEligibleToView === true) {
                    handleOpenFollowersDialog('following')
                  }
                }}
                sx={{
                  cursor: isEligibleToView === false ? 'default' : 'pointer',
                  '&:hover': { opacity: isEligibleToView === false ? 1 : 0.7 },
                  opacity: 1,
                  pointerEvents: isEligibleToView === false ? 'none' : 'auto'
                }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {profileData.stats.following}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
              </Box>
              {(isEligibleToView === true) && (
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {userPosts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Posts
                  </Typography>
                </Box>
              )}
            </Stack>

            {profileData.isFollower && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 2, display: 'block' }}
              >
                Follows you
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            centered={!isMobile}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                color: 'text.secondary',
              },
              '& .Mui-selected': {
                color: '#1e40af',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1e40af',
                height: 3,
              },
            }}
          >
            <Tab label="Posts" />
            <Tab label="Reels" />
            <Tab label="Tagged" />
          </Tabs>
        </Box>

        {renderContent()}
      </Container>

      {/* Menu for other users */}
      {localStorage.getItem('childUserId') != userId ?
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              minWidth: 250,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem onClick={handleCopyProfileLink}>
            <ListItemIcon>
              <LinkIcon />
            </ListItemIcon>
            <ListItemText>Copy profile link</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleBlock}>
            <ListItemIcon>
              <BlockIcon sx={{ color: 'warning.main' }} />
            </ListItemIcon>
            <ListItemText sx={{ color: 'warning.main' }}>
              {profileData?.isBlocked ? 'Unblock' : 'Block'}
            </ListItemText>
          </MenuItem>

          <MenuItem onClick={handleReport}>
            <ListItemIcon>
              <ReportIcon sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>
              Report
            </ListItemText>
          </MenuItem>
        </Menu>
        : ''
      }

      {/* Report Dialog */}
      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        contentType="profile"
        contentId={userId}
        onSubmit={handleReportSubmit}
      />

      {/* Comment Dialog */}
      {selectedPost && (
        <CommentDialog
          open={openCommentDialog}
          onClose={() => {
            setOpenCommentDialog(false)
            setSelectedPost(null)
          }}
          post={selectedPost as Post}
        />
      )}

      {/* Share Post Dialog */}
      <CreatePostDialog
        open={openShareDialog}
        onClose={handleShareDialogClose}
        sharedPost={postToShare}
        onPostCreated={handleShareSuccess}
      />

      {/* Profile Image Viewer Dialog */}
      <Dialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper'
          }
        }}
      >
        {/* Replace the entire Badge section for profile photo with this */}
        <Box sx={{ position: 'relative' }}>
          {/* Active Status Dot */}
          {isUserActive(userId) && (
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: 6, sm: 8, md: 10 },
                right: { xs: 6, sm: 8, md: 10 },
                width: { xs: 16, sm: 18, md: 20 },
                height: { xs: 16, sm: 18, md: 20 },
                backgroundColor: '#44b700',
                borderRadius: '50%',
                border: '3px solid white',
                zIndex: 10,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  animation: 'ripple 1.2s infinite ease-in-out',
                  border: '1px solid #44b700',
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
            />
          )}

          {/* Story Ring and Avatar */}
          <Box
            onClick={handleOpenStoryViewer}
            sx={{
              position: 'relative',
              cursor: profileStories.length > 0 ? 'pointer' : 'default',
              display: 'inline-block',
              borderRadius: '50%',
              background: profileStories.length > 0
                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                : 'transparent',
              padding: profileStories.length > 0 ? '3px' : '0',
              transition: 'all 0.3s ease',
              '&:hover': profileStories.length > 0 ? {
                transform: 'scale(1.05)',
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              } : {},
            }}
          >
            <Avatar
              src={profileData.profileImage || undefined}
              alt={profileData.name}
              onClick={() => profileData.profileImage && setImageViewerOpen(true)}
              sx={{
                width: { xs: 100, sm: 120, md: 150 },
                height: { xs: 100, sm: 120, md: 150 },
                border: '4px solid white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                bgcolor: '#e3f2fd',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                cursor: profileData.profileImage ? 'pointer' : 'default',
                '&:hover': profileData.profileImage ? {
                  opacity: 0.9
                } : {}
              }}
            >
              {!profileData.profileImage && profileData.name[0]}
            </Avatar>
          </Box>
        </Box>
      </Dialog>

      {/* Followers/Following Dialog */}
      <Dialog
        open={followersDialogOpen}
        onClose={() => setFollowersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 0
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Connections
          </Typography>
          <IconButton onClick={() => setFollowersDialogOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs
            value={followersDialogTab === 'followers' ? 0 : 1}
            onChange={(e, newValue) => setFollowersDialogTab(newValue === 0 ? 'followers' : 'following')}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '1rem',
                color: 'text.secondary',
                minWidth: 0,
                flex: 1
              },
              '& .Mui-selected': {
                color: '#1e40af'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1e40af',
                height: 3
              }
            }}
          >
            <Tab label={`Followers (${profileData.stats.followers || 0})`} />
            <Tab label={`Following (${profileData.stats.following || 0})`} />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0, overflowY: 'auto' }}>
          {isLoadingFollowers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : followersError ? (
            <Box sx={{ py: 2, px: 3 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {followersError}
              </Alert>
              <Button
                variant="outlined"
                onClick={fetchFollowersData}
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                Retry
              </Button>
            </Box>
          ) : (followersDialogTab === 'followers' ? followers : following).length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <PersonOutlineIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                {followersDialogTab === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              {(followersDialogTab === 'followers' ? followers : following).map((user, index) => (
                <React.Fragment key={user.userId}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    {user.profilePicture ? (
                      <Avatar
                        src={user.profilePicture}
                        alt={user.fullName}
                        sx={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: '#1e40af'
                        }}
                      >
                        {getInitials(user.fullName)}
                      </Avatar>
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600" noWrap>
                          {user.fullName}
                        </Typography>
                        {user.isVerified && (
                          <Typography variant="caption" sx={{ color: '#1e40af' }}>
                            ✓
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {user.username}
                      </Typography>
                      {user.bio && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mt: 0.5
                          }}
                        >
                          {user.bio}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {user.followersCount} followers · {user.postsCount} posts
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewUserProfile(user.userId, user.pageId)
                      }}
                      disabled={isEligibleToView === false}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        minWidth: 80
                      }}
                    >
                      View
                    </Button>
                  </Box>
                  {index < (followersDialogTab === 'followers' ? followers : following).length - 1 && (
                    <Divider />
                  )}
                </React.Fragment>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Reel Comment Dialog */}
      {selectedReel && (
        <CommentDialog
          open={openReelCommentDialog}
          onClose={() => {
            setOpenReelCommentDialog(false)
            setSelectedReel(null)
          }}
          post={{
            id: selectedReel.id,
            user: {
              name: selectedReel.user.name,
              username: selectedReel.user.username,
              avatar: selectedReel.user.avatar,
              avatarColor: selectedReel.user.avatarColor,
              time: selectedReel.user.time,
              userId: selectedReel.user.userId
            },
            content: selectedReel.content,
            contentType: 'REEL'
          }}
        />
      )}

      {/* ============ COVER IMAGE VIEWER DIALOG ============ */}
      <Dialog
        open={coverImageViewerOpen}
        onClose={() => setCoverImageViewerOpen(false)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {/* Close Button */}
          <IconButton
            onClick={() => setCoverImageViewerOpen(false)}
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

          {/* Cover Image */}
          {profileData?.coverImage ? (
            <Box
              component="img"
              src={profileData.coverImage}
              alt={`${profileData.name}'s cover`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                backgroundColor: '#f0f0f0',
                display: 'block'
              }}
            />
          ) : (
            <Box
              sx={{
                width: 800,
                height: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.5rem'
              }}
            >
              No cover image
            </Box>
          )}
        </Box>
      </Dialog>

      <SendGiftDialog
        open={giftDialogOpen}
        onClose={() => setGiftDialogOpen(false)}
        recipientName={profileData?.name || ''}
        recipientUserId={userId}
        recipientPageId={pageId || ''}
        userBalance={userBalance}
        onBalanceUpdate={setUserBalance}
        onSuccess={(message) => showSnackbar(message, 'success')}
        onError={(message) => showSnackbar(message, 'error')}
      />

      {/* Buy Badge Dialog */}
      <BuyBadgeDialog
        open={badgeDialogOpen}
        onClose={() => setBadgeDialogOpen(false)}
        recipientName={profileData?.name || ''}
        recipientUserId={userId}
        recipientPageId={pageId || ''}
        onSuccess={(message) => showSnackbar(message, 'info')}
        onError={(message) => showSnackbar(message, 'error')}
      />

      {/* Subscription Dialog */}
      <SubscriptionDialog
        open={subscriptionDialogOpen}
        onClose={() => setSubscriptionDialogOpen(false)}
        subscriptionDetails={subscriptionDetails}
        creatorName={profileData?.name || ''}
        creatorProfileImage={profileData?.profileImage || null}
        viewerProfileImage={viewerProfileImage}
        onSubscribe={handleSubscribe}
        isSubscribing={isSubscribing}
      />

      {/* Cancel Subscription Confirmation Dialog */}
      <Dialog
        open={cancelSubscriptionDialogOpen}
        onClose={() => setCancelSubscriptionDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Cancel Subscription?
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription to <strong>{profileData?.name}</strong>?
          </Typography>
          {subscriptionStatus && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Current Plan:</strong> {subscriptionStatus.tierName}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong> {subscriptionStatus.status}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> ${subscriptionStatus.amount}/month
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="text.secondary">
            You will lose access to all subscriber-only content and benefits. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCancelSubscriptionDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Keep Subscription
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={isCancellingSubscription}
            sx={{ textTransform: 'none' }}
          >
            {isCancellingSubscription ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Yes, Cancel'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Avatar Choice Dialog - View Photo or Story */}
      <Dialog
        open={avatarChoiceDialogOpen}
        onClose={() => setAvatarChoiceDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            minWidth: { xs: 280, sm: 340 },
            bgcolor: 'background.paper',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Box sx={{ textAlign: 'center', pt: 3, pb: 1, px: 3 }}>
          {/* Mini avatar preview */}
          <Box
            sx={{
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              padding: '3px',
              display: 'inline-flex',
              mb: 2,
            }}
          >
            <Avatar
              src={profileData?.profileImage || undefined}
              alt={profileData?.name}
              sx={{
                width: 72,
                height: 72,
                border: '3px solid white',
                bgcolor: '#e3f2fd',
                fontSize: '1.8rem',
              }}
            >
              {!profileData?.profileImage && profileData?.name?.[0]}
            </Avatar>
          </Box>

          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
            {profileData?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            What would you like to view?
          </Typography>
        </Box>

        <Divider />

        {/* View Story Option */}
        <Box
          onClick={() => {
            setAvatarChoiceDialogOpen(false)
            handleOpenStoryViewer()
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PlayCircleOutline sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="body1" fontWeight={600}>
              View Story
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {profileStories.length} {profileStories.length === 1 ? 'story' : 'stories'} available
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* View Profile Photo Option */}
        {profileData?.profileImage && (
          <>
            <Box
              onClick={() => {
                setAvatarChoiceDialogOpen(false)
                setImageViewerOpen(true)
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 2,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: '#e3f2fd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PersonOutlineIcon sx={{ color: '#1e40af', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="body1" fontWeight={600}>
                  View Profile Photo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  See full size profile picture
                </Typography>
              </Box>
            </Box>
            <Divider />
          </>
        )}

        {/* Cancel */}
        <Box
          onClick={() => setAvatarChoiceDialogOpen(false)}
          sx={{
            textAlign: 'center',
            py: 2,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            Cancel
          </Typography>
        </Box>
      </Dialog>

      {/* Profile Story Viewer */}
      <ProfileStoryViewer
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
        stories={profileStories}
        initialIndex={selectedStoryIndex}
        profileUserId={userId}
      />
    </Box>
  )

  function renderContent() {
    if (!profileData) return null

    if (isEligibleToView === false) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PrivateIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            This Account is Private
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Posts and activity of this account are private. Follow to see their content.
          </Typography>
          <Button
            variant="contained"
            startIcon={<FollowIcon />}
            onClick={handleFollow}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              bgcolor: '#1e40af',
              '&:hover': {
                bgcolor: '#5558dd',
              },
            }}
          >
            Follow Account
          </Button>
        </Box>
      )
    }

    if (profileData.isBlocked) {
      return (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BlockIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            You have blocked this account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unblock to see their content
          </Typography>
        </Box>
      )
    }

    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            {isLoadingPosts ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <PostSkeleton variant="text" />
                <PostSkeleton variant="image" />
                <PostSkeleton variant="poll" />
              </Box>
            ) : postsError ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {postsError}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => fetchUserPosts(1)}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              </Box>
            ) : userPosts.length > 0 ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {userPosts.map((post) => renderPostComponent(post))}

                {hasMorePosts && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchUserPosts(currentPage + 1)}
                      disabled={isLoadingPosts}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLoadingPosts ? 'Loading...' : 'Load More Posts'}
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <GridIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No Posts Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {profileData.name} hasn&apos;t shared any posts yet
                </Typography>
              </Box>
            )}
          </Box>
        )

      case 1:
        return (
          <Box sx={{ mt: 3 }}>
            {isLoadingReels ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <PostSkeleton variant="video" />
                <PostSkeleton variant="video" />
                <PostSkeleton variant="video" />
              </Box>
            ) : reelsError ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {reelsError}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => fetchUserReels(0)}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              </Box>
            ) : userReels.length > 0 ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {userReels.map((reel) => (
                  <ReelPostComponent
                    key={reel.id}
                    id={reel.id}
                    user={reel.user}
                    content={reel.content}
                    contentType={reel.contentType}
                    videoUrl={reel.videoUrl}
                    thumbnailUrl={reel.thumbnailUrl}
                    duration={reel.duration}
                    likes={reel.likes}
                    comments={reel.comments}
                    shares={reel.shares}
                    views={reel.views}
                    isLiked={reel.isLiked}
                    isSaved={reel.isSaved}
                    onLike={() => handleLikeReel(reel.id)}
                    onSave={() => showSnackbar('Bookmark functionality coming soon', 'info')}
                    onComment={() => handleReelComment(reel.id)}
                    onShare={() => handleShareReel(reel.id)}
                    onFollowSuccess={(message) => showSnackbar(message, 'success')}
                    onFollowError={(message) => showSnackbar(message, 'error')}
                    onEdit={() => showSnackbar('You cannot edit this reel', 'info')}
                    onDelete={() => showSnackbar('You cannot delete this reel', 'info')}
                  />
                ))}

                {hasMoreReels && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchUserReels(currentReelPage + 1)}
                      disabled={isLoadingReels}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLoadingReels ? 'Loading...' : 'Load More Reels'}
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ReelsIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No Reels Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {profileData.name} hasn&apos;t shared any reels yet
                </Typography>
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            {isLoadingTaggedPosts ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <PostSkeleton variant="text" />
                <PostSkeleton variant="image" />
                <PostSkeleton variant="poll" />
              </Box>
            ) : taggedPostsError ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {taggedPostsError}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => fetchTaggedPosts(1)}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              </Box>
            ) : taggedPosts.length > 0 ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {taggedPosts.map((post) => renderPostComponent(post))}

                {hasMoreTaggedPosts && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchTaggedPosts(currentTaggedPage + 1)}
                      disabled={isLoadingTaggedPosts}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLoadingTaggedPosts ? 'Loading...' : 'Load More Posts'}
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <TaggedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No Tagged Posts
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Posts {profileData.name} is tagged in will appear here
                </Typography>
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }
}

export default PublicProfilePage