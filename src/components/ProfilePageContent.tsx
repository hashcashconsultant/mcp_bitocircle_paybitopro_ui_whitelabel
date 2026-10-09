'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useUserProfile } from '@/contexts/UserProfileContext'
import Link from 'next/link';
import Cropper, { Area } from 'react-easy-crop'
import { tokenCookie } from '../hooks/useAuthRedirect';

import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Stack,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Divider,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  Slider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material'
import {
  Edit as EditIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Link as LinkIcon,
  Close as CloseIcon,
  GridOn as GridIcon,
  PlayCircleOutline as ReelsIcon,
  BookmarkBorder as SavedIcon,
  PersonOutline as TaggedIcon,
  CameraAlt as CameraIcon,
  AddAPhoto as AddPhotoIcon,
  Telegram as TelegramIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  YouTube as YouTubeIcon,
  LinkedIn as LinkedInIcon,
  X as XIcon,
  Category as CategoryIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RotateRight as RotateRightIcon,
  Crop as CropIcon,
  Wc as GenderIcon,
  Cake as CakeIcon
} from '@mui/icons-material'
import { Search as SearchIcon, KeyboardArrowDown as ChevronDownIcon } from '@mui/icons-material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'
import SnackbarAlert from '@/components/common/SnackbarAlert'

// Import your post components
import TextPostComponent from '@/components/posts/TextPostComponent'
import ImagePostComponent from '@/components/posts/ImagePostComponent'
import VideoPostComponent from '@/components/posts/VideoPostComponent'
import PollPostComponent from '@/components/posts/PollPostComponent'
import ReelPostComponent from '@/components/posts/ReelPostComponent'
import { PostSkeleton } from '@/components/posts/PostSkeletons'
import CreatePostDialog from '@/components/CreatePostDialog'
import CommentDialog from '@/components/CommentDialog'

import { useRouter } from 'next/navigation'

import DiamondIcon from '@mui/icons-material/Diamond';
import BuyBadgeDialog from '@/components/BuyBadgeDialog'


// Custom Discord icon component
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

interface ProfileStats {
  followers: string
  following: string
  posts: string
}

interface SocialMediaLinks {
  telegramLink?: string
  discordLink?: string
  instagramLink?: string
  facebookLink?: string
  youtubeLink?: string
  tikTokLink?: string
  twitchLink?: string
  linkedinLink?: string
  xLink?: string
}

interface ProfileData {
  name: string
  username: string
  bio: string | null
  location: string | null
  website: string | null
  joinedDate: string
  email: string
  coverImage: string | null
  profileImage: string | null
  socialMedia?: SocialMediaLinks
  categories?: string[]
  followersCount?: number
  followingCount?: number
  pageType?: string
  selectedCountry?: { country: string; code: string; dialCode: string } | null
  phoneNumber?: string
  countryCode?: string
  isKycSubmitted?: number
  gender?: string  // ADD THIS
  dob?: string | null  // ADD THIS
  dobVisibility?: number
}

// Define post types
export type PostType = 'text' | 'image' | 'video' | 'poll' | 'reel'

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
    isFollowing?: boolean
    isVerified?: boolean
    profilePicture?: string
  }
  contentType: string
  content: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  visibilityType?: string | number
  location?: string | null
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: number
  isSharedPost?: boolean
  shareId?: number
  sharedByUserId?: number
  sharerUserName?: string
  sharerFullName?: string
  sharerProfilePicture?: string
  shareMessage?: string
  shareCreatedAt?: string
  // Sponsored post fields
  isSponsored?: boolean
  campaignId?: number
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  // Product tagging fields
  isProductTagged?: number
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

export type Post = TextPost | ImagePost | VideoPost | PollPost | ReelPost

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
  contentType?: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  likes: number
  comments: number
  shares: number
  views?: number
  isLiked?: boolean
  isSaved?: boolean
  location?: string | null
  // Sponsored post fields
  isSponsored?: boolean
  campaignId?: number
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  // Product tagging fields
  isProductTagged?: number
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

// API Response types
interface APIPost {
  postId: number
  userId: number
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
  visibilityType?: string | number
  pollQuestion: string | null
  taggedUserIds: string | null
  taggedData: string | null
  isTaggedPost: number | null
  isSharedPost: boolean | null
  shareId: number | null
  sharedByUserId: number | null
  sharerUserName: string | null
  sharerFullName: string | null
  sharerProfilePicture: string | null
  shareMessage: string | null
  shareCreatedAt: string | null
  isSponsored?: number  // 0 or 1
  campaignId?: number
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
  adHeadlineImage?: string
  // Product tagging fields
  isProductTagged?: number  // 0 or 1
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
  profilePicture: string | null
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

export interface ReelPost extends BasePost {
  type: 'reel'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
  title?: string
}


// Badge Popup Creator interface
interface BadgeCreator {
  creatorUserId: number
  username: string
  fullName: string
  profilePicture: string | null
  followersCount: number | null
  enableBadges: number | null
  enableGifts: number | null
  alreadyPurchasedBadge: number | null
  purchasedBadgeLevel: string | null
}

// Categories list with IDs
const availableCategories = [
  { id: 1, name: 'Financial Tips' },
  { id: 2, name: 'Personal Finance' },
  { id: 3, name: 'Financial Myths' },
  { id: 4, name: 'Budgeting' },
  { id: 5, name: 'Expert Interviews' },
  { id: 6, name: 'Investment Tips' },
  { id: 7, name: 'Investing Guides' },
  { id: 8, name: 'Financial Trends' },
  { id: 9, name: 'Financial Literacy' },
  { id: 10, name: 'Financial Resources' },
  { id: 11, name: 'Stock Market' },
  { id: 12, name: 'Financial Freedom' },
  { id: 13, name: 'Wealth' },
  { id: 14, name: 'Retirement Planning' },
  { id: 15, name: 'Financial Advisor' },
  { id: 16, name: 'Passive Income' },
  { id: 17, name: 'Credit cards' },
  { id: 18, name: 'Mindset' },
  { id: 19, name: 'Rich vs. Wealthy' },
  { id: 20, name: 'Side Hustle' },
  { id: 21, name: 'Cryptocurrency' },
  { id: 22, name: 'Crypto Payments' },
  { id: 23, name: 'Crypto Trading' },
  { id: 24, name: 'Trading Strategies' },
  { id: 25, name: 'Blockchain' },
  { id: 26, name: 'DApps' },
  { id: 27, name: 'Crypto Market Recap' },
  { id: 28, name: 'Spot a Crypto Scam' },
  { id: 29, name: 'NFT Trends' },
  { id: 30, name: 'Staking' },
  { id: 31, name: 'DEX' },
  { id: 32, name: 'Crypto Exchanges' },
  { id: 33, name: 'Crypto Regulations' },
  { id: 34, name: 'DAOs' },
  { id: 35, name: 'Web3 Topics' },
  { id: 36, name: 'DeFi' },
  { id: 37, name: 'Tokenomics' },
  { id: 38, name: 'Altcoins' },
  { id: 39, name: 'Mining Pools' }
]

// Helper function to convert API post type to component post type
const getPostType = (apiType: string): PostType => {
  switch (apiType) {
    case 'TEXT': return 'text'
    case 'PHOTO': return 'image'
    case 'VIDEO': return 'video'
    case 'POLL': return 'poll'
    case 'REEL': return 'reel'

    default: return 'text'
  }
}

// Generate consistent avatar color based on user ID
const generateAvatarColor = (userId: number): string => {
  const colors = [
    '#4267b2', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]
  return colors[userId % colors.length]
}

// Format time ago
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

// Format duration from seconds to MM:SS
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Convert API posts to component format
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
        isFollowing: false,
        isVerified: false,
        profilePicture: item.profilePicture || ''
      },
      contentType: item.contentType,
      content: item.content || '',
      likes: item.likeCount,
      comments: item.commentCount,
      shares: item.shareCount,
      isLiked: item.hasLiked === 'Y',
      isSaved: item.hasBookmarked === 'Y',
      visibilityType: item.visibilityType,
      location: item.location,
      taggedUserIds: item.taggedUserIds || '',
      taggedData: item.taggedData || '',
      isTaggedPost: item.isTaggedPost || 0,
      isSharedPost: item.isSharedPost || false,
      shareId: item.shareId || 0,
      sharedByUserId: item.sharedByUserId || 0,
      sharerUserName: item.sharerUserName || '',
      sharerFullName: item.sharerFullName || '',
      sharerProfilePicture: item.sharerProfilePicture || '',
      shareMessage: item.shareMessage || '',
      shareCreatedAt: item.shareCreatedAt || '',
      // Sponsored post fields
      isSponsored: item.isSponsored === 1,
      campaignId: item.campaignId || 0,
      cta: item.cta || '',
      callToActionUrl: item.callToActionUrl || '',
      adHeadline: item.adHeadline || '',
      adHeadlineImage: item.adHeadlineImage || '',
      // Product tagging fields
      isProductTagged: item.isProductTagged || 0,
      taggedProducts: item.taggedProducts || [],

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

// Convert API reels to component format
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
      isVerified: false,
      profilePicture: item.profilePicture || ''


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

// ============ IMAGE CROPPER HELPER FUNCTIONS ============

// Create image element from URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Get radians from degrees
function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

// Returns the new bounding area of a rotated rectangle
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

// Get cropped image as a blob
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Draw rotated image
  ctx.drawImage(image, 0, 0)

  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) {
    return null
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // As a blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas is empty'))
      }
    }, 'image/jpeg', 0.95)
  })
}

// ============ IMAGE CROPPER DIALOG COMPONENT ============

interface ImageCropperDialogProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => void
  aspectRatio?: number
  cropShape?: 'rect' | 'round'
  title?: string
}

const ImageCropperDialog: React.FC<ImageCropperDialogProps> = ({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  cropShape = 'round',
  title = 'Crop Image'
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )
      if (croppedImage) {
        onCropComplete(croppedImage)
      }
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    // Reset states
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    onClose()
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={isProcessing}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {/* Cropper Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: { xs: 300, sm: 400 },
            bgcolor: '#1a1a2e'
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropCompleteCallback}
          />
        </Box>

        {/* Controls */}
        <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
          {/* Zoom Control */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              Zoom
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ZoomOutIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, value) => setZoom(value as number)}
                sx={{
                  color: '#1e40af',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(30, 64, 175, 0.16)'
                    }
                  }
                }}
              />
              <ZoomInIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
          </Box>

          {/* Rotation Control */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              Rotation: {rotation}°
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Slider
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e, value) => setRotation(value as number)}
                sx={{
                  color: '#1e40af',
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0 0 0 8px rgba(30, 64, 175, 0.16)'
                    }
                  }
                }}
              />
              <IconButton
                onClick={handleRotate}
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <RotateRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Instructions */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
            Drag to reposition • Pinch or use slider to zoom • Rotate as needed
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          disabled={isProcessing}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCropConfirm}
          disabled={isProcessing || !croppedAreaPixels}
          startIcon={isProcessing ? <CircularProgress size={16} color="inherit" /> : <CropIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            bgcolor: '#1e40af',
            '&:hover': {
              bgcolor: '#5558dd'
            }
          }}
        >
          {isProcessing ? 'Processing...' : 'Apply Crop'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ============ MAIN COMPONENT ============

const ProfilePageContent: React.FC = () => {
  const router = useRouter()
  const { updateProfile, updateProfilePicture, updateCoverPicture, updateFullName } = useUserProfile()

  const [activeTab, setActiveTab] = useState(0)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success')

  // Validation state - ADD THESE
  const [isValidatingUsername, setIsValidatingUsername] = useState(false)
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [usernameValid, setUsernameValid] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [initialUsername, setInitialUsername] = useState('')
  const [initialEmail, setInitialEmail] = useState('')

  // Debounce timers - ADD THESE
  const usernameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const emailTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Refs for file inputs
  const profileImageInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)

  // ============ IMAGE CROPPER STATES ============
  const [cropperOpen, setCropperOpen] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState('')
  const [cropperType, setCropperType] = useState<'profile' | 'cover'>('profile')
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)

  // ============ PROFILE IMAGE VIEWER STATE ============
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

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

  // Saved Posts state
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [isLoadingSavedPosts, setIsLoadingSavedPosts] = useState(false)
  const [savedPostsError, setSavedPostsError] = useState<string | null>(null)
  const [currentSavedPage, setCurrentSavedPage] = useState(0)
  const [totalSavedPages, setTotalSavedPages] = useState(1)
  const [hasMoreSavedPosts, setHasMoreSavedPosts] = useState(false)

  // State for original userId from API
  const [originalUserId, setOriginalUserId] = useState<number>(0)

  // Followers/Following dialog state
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false)
  const [followersDialogTab, setFollowersDialogTab] = useState<'followers' | 'following'>('followers')
  const [followers, setFollowers] = useState<FollowerUser[]>([])
  const [following, setFollowing] = useState<FollowerUser[]>([])
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false)
  const [followersError, setFollowersError] = useState<string | null>(null)

  // Add this state near your other state declarations
  const [editingReel, setEditingReel] = useState<Reel | null>(null)
  // Add state for selected reel for comments
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null)
  // Add state for sharing
  const [sharingPost, setSharingPost] = useState<Post | null>(null)

  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    joinedDate: '',
    email: '',
    coverImage: '',
    profileImage: '',
    gender: '',
    dob: null,
    socialMedia: {
      telegramLink: '',
      discordLink: '',
      instagramLink: '',
      facebookLink: '',
      youtubeLink: '',
      tikTokLink: '',
      twitchLink: '',
      linkedinLink: '',
      xLink: '',
    },
    categories: [],
    pageType: '',
    isKycSubmitted: 1,
    dobVisibility: 1,
  })

  const [editFormData, setEditFormData] = useState(profileData)
  const [tempProfileImage, setTempProfileImage] = useState('')

  // Add these state variables with your other state declarations
  const [openPostDialog, setOpenPostDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [openCommentDialog, setOpenCommentDialog] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  // Add this with other state declarations
  const [isRemovingFollower, setIsRemovingFollower] = useState<number | null>(null)
  const [imageCacheBuster, setImageCacheBuster] = useState<number>(Date.now())

  const [coverImageViewerOpen, setCoverImageViewerOpen] = useState(false)

  // Country dropdown states
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [countrySearchQuery, setCountrySearchQuery] = useState('')
  const [countries, setCountries] = useState<Array<{ country: string; code: string; dialCode: string }>>([])
  const [countriesLoading, setCountriesLoading] = useState(true)
  const [isKycSubmitted, setIsKycSubmitted] = useState<boolean>(false)
  // Gender and DOB states
  const [customGender, setCustomGender] = useState('')
  const [dobYear, setDobYear] = useState<number | ''>('')
  const [dobMonth, setDobMonth] = useState<number | ''>('')
  const [dobDay, setDobDay] = useState<number | ''>('')

  // ============ BADGE POPUP STATES ============
  const [badgePopupOpen, setBadgePopupOpen] = useState(false)
  const [badgeCreators, setBadgeCreators] = useState<BadgeCreator[]>([])
  const [isLoadingBadgeCreators, setIsLoadingBadgeCreators] = useState(false)
  const [selectedBadgeCreator, setSelectedBadgeCreator] = useState<BadgeCreator | null>(null)
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false)

  // Purchased badge state
  const [purchasedBadge, setPurchasedBadge] = useState<string | null>(null)
  const [isLoadingBadge, setIsLoadingBadge] = useState(false)

  // Gender options
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Others', label: 'Others' },
    { value: 'Custom', label: 'Custom' }
  ]

  const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService'

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

  const fetchPurchasedBadge = async () => {
    const userId = localStorage.getItem('childUserId') || '0'
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

  // Helper function to generate years (from 1900 to current year)
  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year)
    }
    return years
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }

  // Helper function to generate months
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ]

  // DOB Visibility options
  const dobVisibilityOptions = [
    { value: 1, label: 'Public' },
    { value: 2, label: 'Followers' },
    { value: 3, label: 'Only Me' }
  ]

  // Helper function to generate days based on month and year
  const generateDays = (month: number, year: number) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = []
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }


  // ============ BADGE POPUP FUNCTIONS ============
  const fetchBadgeCreators = async () => {
    const loggedInUserId = localStorage.getItem('childUserId') || '0'
    setIsLoadingBadgeCreators(true)
    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/giftsBadges/getBadgePopupCreators?userId=${loggedInUserId}`,
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
        setBadgeCreators(result.data)
      } else {
        setBadgeCreators([])
      }
    } catch (error) {
      console.error('Error fetching badge creators:', error)
      showSnackbar('Failed to load badge creators', 'error')
      setBadgeCreators([])
    } finally {
      setIsLoadingBadgeCreators(false)
    }
  }

  const handleDiamondClick = () => {
    setBadgePopupOpen(true)
    fetchBadgeCreators()
  }

  const handleSelectBadgeCreator = (creator: BadgeCreator) => {
    setSelectedBadgeCreator(creator)
    setBadgePopupOpen(false)
    setBadgeDialogOpen(true)
  }

  // Handle gender change
  const handleGenderChange = (event: unknown) => {
    const value = (event as React.ChangeEvent<HTMLSelectElement>).target.value
    setEditFormData({
      ...editFormData,
      gender: value
    })
    if (value !== 'Custom') {
      setCustomGender('')
    }
  }

  // Get the final gender value for submission
  const getFinalGender = () => {
    if (editFormData.gender === 'Custom' && customGender.trim()) {
      return customGender.trim()
    }
    return editFormData.gender || ''
  }

  // Format DOB for API (YYYY-MM-DD)
  // Format DOB for API (MM-DD-YYYY)
  const formatDobForApi = () => {
    if (dobYear && dobMonth && dobDay) {
      const year = dobYear.toString()
      const month = dobMonth.toString().padStart(2, '0')
      const day = dobDay.toString().padStart(2, '0')
      return `${month}-${day}-${year}`  // Returns "05-15-1990"
    }
    return ''
  }


  const handleCountrySelect = (country: { country: string; code: string; dialCode: string }) => {
    setEditFormData(prev => ({
      ...prev,
      selectedCountry: country
    }))
    setCountryDropdownOpen(false)
    setCountrySearchQuery('')
  }



  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.country.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.dialCode.includes(countrySearchQuery)
  )

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true)
      try {
        const response = await fetch('https://accounts.paybito.com/api/home/getExchangeCountries/PAYB18022021121103')
        const data = await response.json()

        if (data.countries && Array.isArray(data.countries)) {
          const sortedCountries = data.countries.sort((a: { country: string }, b: { country: string }) =>
            a.country.toLowerCase().localeCompare(b.country.toLowerCase())
          )
          setCountries(sortedCountries)
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error)
        // Fallback countries
        const fallbackCountries = [
          { country: "United States", code: "US", dialCode: "1" },
          { country: "United Kingdom", code: "GB", dialCode: "44" },
          { country: "India", code: "IN", dialCode: "91" },
          { country: "Canada", code: "CA", dialCode: "1" }
        ]
        setCountries(fallbackCountries)
      } finally {
        setCountriesLoading(false)
      }
    }

    fetchCountries()
  }, [])




  // Validate username
  const validateUsername = async (username: string) => {
    // Skip validation if username hasn't changed
    if (username === initialUsername) {
      setUsernameValid(true)
      setUsernameError(null)
      return
    }

    if (!username || username.trim() === '') {
      setUsernameError(null)
      setUsernameValid(false)
      return
    }

    setIsValidatingUsername(true)
    setUsernameError(null)
    setUsernameValid(false)

    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/users/validateBitocircleUserInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          username: `@${username.replace('@', '')}`
        })
      })

      const data = await response.json()

      if (data.success) {
        setUsernameValid(true)
        setUsernameError(null)
      } else {
        setUsernameValid(false)
        setUsernameError(data.message || 'Username is not available')
      }
    } catch (error) {
      console.error('Error validating username:', error)
      setUsernameError('Failed to validate username. Please try again.')
      setUsernameValid(false)
    } finally {
      setIsValidatingUsername(false)
    }
  }

  // Validate email
  const validateEmail = async (email: string) => {
    // Skip validation if email hasn't changed
    if (email === initialEmail) {
      setEmailValid(true)
      setEmailError(null)
      return
    }

    if (!email || email.trim() === '') {
      setEmailError(null)
      setEmailValid(false)
      return
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      setEmailValid(false)
      return
    }

    setIsValidatingEmail(true)
    setEmailError(null)
    setEmailValid(false)

    try {
      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/users/validateBitocircleUserInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          username: ''
        })
      })

      const data = await response.json()

      if (data.success) {
        setEmailValid(true)
        setEmailError(null)
      } else {
        setEmailValid(false)
        setEmailError(data.message || 'Email is already in use')
      }
    } catch (error) {
      console.error('Error validating email:', error)
      setEmailError('Failed to validate email. Please try again.')
      setEmailValid(false)
    } finally {
      setIsValidatingEmail(false)
    }
  }


  // Remove follower handler
  const handleRemoveFollower = async (followerUserId: number, followerPageId: number) => {
    try {
      setIsRemovingFollower(followerUserId)

      const myUserId = localStorage.getItem('childUserId')
      const myUserType = localStorage.getItem('userType') || 'USER'

      if (!myUserId) {
        showSnackbar('Please login to perform this action', 'error')
        return
      }

      const followerId = (followerPageId && followerPageId !== 0)
        ? followerPageId
        : followerUserId
        const folowerType = (followerPageId && followerPageId !== 0) ? 'PAGE' : 'USER'

      const payload = {
        followerId: followerId.toString(),
        followerType: folowerType,
        followingId: myUserId,
        followingType: myUserType
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/profile/removeFollower',
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
        setFollowers(prev => prev.filter(f => f.userId !== followerUserId))

        setProfileData(prev => ({
          ...prev,
          followersCount: Math.max(0, (prev.followersCount || 0) - 1)
        }))

        showSnackbar(result.message || 'Follower removed successfully', 'success')
      } else {
        throw new Error(result.message || 'Failed to remove follower')
      }
    } catch (error) {
      console.error('Error removing follower:', error)
      showSnackbar('Failed to remove follower. Please try again.', 'error')
    } finally {
      setIsRemovingFollower(null)
    }
  }

  const stats: ProfileStats = {
    followers: '1.2k',
    following: '567',
    posts: userPosts.length.toString(),
  }

  // Add this function
  const handleReelCoverUpdated = (data: unknown) => {
    console.log('Reel updated:', data)
    setEditingPost(null)
    setOpenPostDialog(false)
    fetchUserReels(currentReelPage)
    showSnackbar('Reel updated successfully!', 'success')
  }

  // Add this function after handleEditPost
  const handleEditReel = (reelId: number) => {
    console.log('Editing reel with ID:', reelId)

    const reel = userReels.find(r => r.id === reelId)

    console.log('Found reel:', reel)

    if (reel) {
      const reelAsPost: Post = {
        id: reel.id,
        type: 'reel' as PostType,
        user: reel.user,
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
        views: reel.views,
        title: reel.content,
      } as ReelPost

      setEditingPost(reelAsPost)
      setOpenPostDialog(true)
    }
  }

  // Handler for sharing a reel
  const handleShareReel = (reelId: number) => {
    const reel = userReels.find(r => r.id === reelId)

    if (reel) {
      const reelAsPost: Post = {
        id: reel.id,
        type: 'reel' as PostType,
        user: reel.user,
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
        views: reel.views,
        title: reel.content,
      } as ReelPost

      setSharingPost(reelAsPost)
      setOpenPostDialog(true)
    }
  }

  // Handler for sharing a post
  const handleSharePost = (postId: number) => {
    let post: Post | undefined

    switch (activeTab) {
      case 0:
        post = userPosts.find(p => p.id === postId)
        break
      case 2:
        post = taggedPosts.find(p => p.id === postId)
        break
      case 3:
        post = savedPosts.find(p => p.id === postId)
        break
    }

    if (post) {
      setSharingPost(post)
      setOpenPostDialog(true)
    }
  }

  // Function to show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleViewUserProfile = (userId: number, pageId: number) => {
    setFollowersDialogOpen(false)
    router.push(`/public/${userId}/${pageId}`)
  }

  const handleCoverImageClick = () => {
    if (profileData.coverImage) {
      setCoverImageViewerOpen(true)
    }
  }

  // Handler for reel comments
  const handleReelComment = (reelId: number) => {
    const reel = userReels.find(r => r.id === reelId)

    if (reel) {
      const reelAsPost: Post = {
        id: reel.id,
        type: 'video' as PostType,
        user: reel.user,
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
        views: reel.views,
      } as VideoPost

      setSelectedPost(reelAsPost)
      setOpenCommentDialog(true)
    }
  }

  const fetchFollowersData = async () => {
    setIsLoadingFollowers(true)
    setFollowersError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/messaging/getUserFollowers/${localStorage.getItem('childPageId') || '0'}`,
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

  const handleOpenFollowersDialog = (tab: 'followers' | 'following') => {
    setFollowersDialogTab(tab)
    setFollowersDialogOpen(true)
    if (followers.length === 0 && following.length === 0) {
      fetchFollowersData()
    }
  }

  // Fetch user posts
  const fetchUserPosts = async (page: number = 1) => {
    setIsLoadingPosts(true)
    setPostsError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/post/getUserPosts?userId=${userId}&viewerId=${localStorage.getItem('childUserId')}&pageId=${localStorage.getItem('pageId')}&page=${page}&size=50&viewerType=${localStorage.getItem('userType') || 'USER'}`,
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

  // Fetch user reels
  const fetchUserReels = async (page: number = 0) => {
    setIsLoadingReels(true)
    setReelsError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/reels/getUserReels/${userId}?&pageId=${localStorage.getItem('pageId')}&page=${page}&viewerType=${localStorage.getItem('userType') || 'USER'}&viewerId=${userId}&size=10`,
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

  // Fetch tagged posts
  const fetchTaggedPosts = async (page: number = 1) => {
    setIsLoadingTaggedPosts(true)
    setTaggedPostsError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/post/getTaggedPostsByUser?userId=${userId}&page=${page}&size=50&pageId=${localStorage.getItem('pageId') || '0'}`,
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

  // Fetch saved/bookmarked posts
  const fetchSavedPosts = async (page: number = 0) => {
    setIsLoadingSavedPosts(true)
    setSavedPostsError(null)

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        throw new Error('User ID not found')
      }

      const response = await fetchWithAuth(
        `https://institutional-bo.paybito.com:8443/BitohubService/activity/getBookmarkedPosts?userId=${userId}&page=${page}&size=12&pageId=${localStorage.getItem('pageId') || '0'}`,
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
        setSavedPosts(convertedPosts)
        setTotalSavedPages(result.data.totalPages)
        setHasMoreSavedPosts(result.data.hasNext)
        setCurrentSavedPage(page)
      } else {
        throw new Error(result.message || 'Failed to load saved posts')
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error)
      if (error instanceof Error) {
        setSavedPostsError(error.message)
      } else {
        setSavedPostsError('Failed to load saved posts. Please try again later.')
      }
    } finally {
      setIsLoadingSavedPosts(false)
    }
  }

  // Fetch profile data from API on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const uuid = localStorage.getItem('uuid')
      const pageId = localStorage.getItem('pageId')
      if (!uuid) return
      try {
        const response = await fetchWithAuth(BITOHUBWEBSERVICE + '/profile/getProfileDetails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminUser: uuid,
            pageId: pageId,
          }),
        })
        const result = await response.json()
        if (result.success && result.data) {
          const d = result.data
          localStorage.setItem('profilePhoto', d.profilePicture || '')

          setImageCacheBuster(Date.now())
          if (d.userId) {
            setOriginalUserId(d.userId)
          }

          let categoryNames: string[] = []
          if (pageId !== '0') {
            if (d.categoryList && Array.isArray(d.categoryList) && d.categoryList.length > 0) {
              categoryNames = d.categoryList
                .map((cat: { id: number; type: string }) => cat.type)
                .filter((name: string) => name && name !== '')
            }
            else if (d.categories) {
              if (typeof d.categories === 'string') {
                const categoryIds = d.categories.split(',').map((id: string) => parseInt(id.trim()))
                categoryNames = categoryIds.map((id: number) => {
                  const cat = availableCategories.find(c => c.id === id)
                  return cat ? cat.name : ''
                }).filter((name: string) => name !== '')
              } else if (Array.isArray(d.categories)) {
                categoryNames = d.categories
              }
            }
          }

          let selectedCountryObj = null
          if (d.country && countries.length > 0) {
            selectedCountryObj = countries.find(c => c.country === d.country) || null
          }

          setIsKycSubmitted(d.isKycSubmitted === 1)

          const newProfileData = {
            name: d.fullName || '',
            username: d.username || '',
            bio: d.bio || '',
            location: d.location || '',
            website: d.website || '',
            joinedDate: d.createdAt ? new Date(d.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }) : '',
            email: d.email || '',
            coverImage: addCacheBuster(d.coverPicture) || '',  // Add cache buster
            profileImage: addCacheBuster(d.profilePicture) || '',  // Add cache buster
            followersCount: d.followersCount || 0,
            followingCount: d.followingCount || 0,
            isKycSubmitted: d.isKycSubmitted || 1,
            pageType: d.pageType || '',
            selectedCountry: selectedCountryObj,
            socialMedia: {
              telegramLink: d.telegramLink || '',
              discordLink: d.discordLink || '',
              instagramLink: d.instagramLink || '',
              facebookLink: d.facebookLink || '',
              youtubeLink: d.youtubeLink || '',
              tikTokLink: d.tikTokLink || '',
              twitchLink: d.twitchLink || '',
              linkedinLink: d.linkedinLink || '',
              xLink: d.xLink || '',
            },
            categories: categoryNames,
            gender: d.gender || '',
            dob: d.dob || null,
            dobVisibility: d.dobVisibility || 1,
          }

          setProfileData(newProfileData)

          // Parse DOB if exists (expecting MM-DD-YYYY format)
          if (d.dob) {
            const parts = d.dob.split('-')
            if (parts.length === 3) {
              const month = parseInt(parts[0], 10)
              const day = parseInt(parts[1], 10)
              const year = parseInt(parts[2], 10)
              if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
                setDobMonth(month)
                setDobDay(day)
                setDobYear(year)
              }
            }
          }

          // Handle custom gender
          if (d.gender && !['Male', 'Female', 'Others'].includes(d.gender)) {
            setCustomGender(d.gender)
          }
        }
      } catch (e) {
        console.error('Error fetching profile:', e)
        showSnackbar('Failed to load profile data', 'error')
      }
    }
    fetchProfile()
  }, [countries])

  useEffect(() => {
    if (originalUserId) {
      fetchUserPosts(1)
      fetchPurchasedBadge()
    }
  }, [originalUserId])

  // Fetch data when tab changes
  useEffect(() => {
    if (originalUserId) {
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
        case 3:
          if (savedPosts.length === 0) {
            fetchSavedPosts(0)
          }
          break
      }
    }
  }, [activeTab, originalUserId])

  useEffect(() => {
    setEditFormData(profileData)
  }, [profileData])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Handle DOB visibility change
  const handleDobVisibilityChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setEditFormData({
      ...editFormData,
      dobVisibility: event.target.value as number
    })
  }

  const handleEditProfile = () => {
    setEditFormData(profileData)
    setTempProfileImage(profileData.profileImage || '')

    // Store initial values for validation
    setInitialUsername(profileData.username)
    setInitialEmail(profileData.email)

    // Set validation as valid initially (since these are existing values)
    setUsernameValid(true)
    setEmailValid(true)
    setUsernameError(null)
    setEmailError(null)

    if (profileData.dob) {
      const dobDate = new Date(profileData.dob)
      if (!isNaN(dobDate.getTime())) {
        setDobYear(dobDate.getFullYear())
        setDobMonth(dobDate.getMonth() + 1)
        setDobDay(dobDate.getDate())
      }
    } else {
      setDobYear('')
      setDobMonth('')
      setDobDay('')
    }

    // Handle custom gender
    if (profileData.gender && !['Male', 'Female', 'Others'].includes(profileData.gender)) {
      setCustomGender(profileData.gender)
    } else {
      setCustomGender('')
    }

    setEditModalOpen(true)
  }

  const handleCloseEdit = () => {
    // Clear timers
    if (usernameTimerRef.current) {
      clearTimeout(usernameTimerRef.current)
    }
    if (emailTimerRef.current) {
      clearTimeout(emailTimerRef.current)
    }

    setEditModalOpen(false)
    setTempProfileImage('')
    setUsernameError(null)
    setEmailError(null)
    setUsernameValid(false)
    setEmailValid(false)
    setInitialUsername('')
    setInitialEmail('')
    setCustomGender('')
    setDobYear('')
    setDobMonth('')
    setDobDay('')
  }

  // ============ UPDATED IMAGE UPLOAD FUNCTIONS WITH CROPPER ============

  const uploadProfilePicture = async (file: File | Blob): Promise<string | null> => {
    try {
      const uuid = localStorage.getItem('uuid')
      const pageId = localStorage.getItem('pageId')

      if (!uuid) {
        showSnackbar('User session not found. Please log in again.', 'error')
        return null
      }

      const userIdToSend = pageId === '0' ? originalUserId : originalUserId

      const formData = new FormData()
      formData.append('userId', userIdToSend.toString())
      formData.append('adminUser', uuid)
      formData.append('pageId', pageId || '0')
      formData.append('pageName', profileData.name || '')

      // Convert Blob to File if necessary
      if (file instanceof Blob && !(file instanceof File)) {
        const fileFromBlob = new File([file], 'profile-image.jpg', { type: 'image/jpeg' })
        formData.append('file', fileFromBlob)
      } else {
        formData.append('file', file)
      }

      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/profile/updateProfilePicture', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${tokenCookie.get()}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success && result.data?.fileUrl) {
        showSnackbar('Profile picture uploaded successfully!', 'success')
        return result.data.fileUrl
      } else {
        console.error('Failed to upload profile picture:', result.message)
        showSnackbar(result.message || 'Failed to upload profile picture', 'error')
        return null
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      showSnackbar('Error uploading profile picture. Please try again.', 'error')
      return null
    }
  }

  const uploadCoverPicture = async (file: File | Blob): Promise<string | null> => {
    try {
      const uuid = localStorage.getItem('uuid')
      const pageId = localStorage.getItem('pageId')

      if (!uuid) {
        showSnackbar('User session not found. Please log in again.', 'error')
        return null
      }

      const userIdToSend = pageId === '0' ? originalUserId : originalUserId

      const formData = new FormData()
      formData.append('userId', userIdToSend.toString())
      formData.append('adminUser', uuid)
      formData.append('pageId', pageId || '0')
      formData.append('pageName', profileData.name || '')

      // Convert Blob to File if necessary
      if (file instanceof Blob && !(file instanceof File)) {
        const fileFromBlob = new File([file], 'cover-image.jpg', { type: 'image/jpeg' })
        formData.append('coverPic', fileFromBlob)
      } else {
        formData.append('coverPic', file)
      }

      const response = await fetch('https://institutional-bo.paybito.com:8443/BitohubService/profile/updateCoverPicture', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${tokenCookie.get()}`
        },
        body: formData
      })

      const result = await response.json()

      if (result.success && result.data?.fileUrl) {
        showSnackbar('Cover photo uploaded successfully!', 'success')
        return result.data.fileUrl
      } else {
        console.error('Failed to upload cover picture:', result.message)
        showSnackbar(result.message || 'Failed to upload cover photo', 'error')
        return null
      }
    } catch (error) {
      console.error('Error uploading cover picture:', error)
      showSnackbar('Error uploading cover photo. Please try again.', 'error')
      return null
    }
  }

  // Add this helper function near the top of the component
  const addCacheBuster = (url: string | null): string | null => {
    if (!url) return null
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}t=${Date.now()}`
  }

  // Add this helper function
  const getImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url) return undefined
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${imageCacheBuster}`
  }

  const handleSaveChanges = async () => {
    try {
      if (!usernameValid || !emailValid) {
        showSnackbar('Please ensure username and email are valid before saving', 'error')
        return
      }
      const uuid = localStorage.getItem('uuid')
      const pageId = localStorage.getItem('pageId')

      if (!uuid) {
        showSnackbar('User session not found. Please log in again.', 'error')
        return
      }

      setIsUpdating(true)

      let categoryIds: number[] = []
      if (pageId !== '0' && editFormData.categories && editFormData.categories.length > 0) {
        categoryIds = editFormData.categories.map(catName => {
          const cat = availableCategories.find(c => c.name === catName)
          return cat ? cat.id : null
        }).filter(id => id !== null) as number[]
      }

      const userIdToSend = pageId === '0' ? originalUserId : originalUserId

      const payload = {
        adminUser: uuid,
        userId: userIdToSend,
        pageId: pageId ? parseInt(pageId) : 0,
        username: editFormData.username,
        email: editFormData.email,
        fullName: editFormData.name,
        bio: editFormData.bio || '',
        country: editFormData.selectedCountry?.country || '',
        exchangeUserUuid: localStorage.getItem('financeHubUuid') || '',
        location: editFormData.location || '',
        website: editFormData.website || '',
        telegramLink: editFormData.socialMedia?.telegramLink || '',
        discordLink: editFormData.socialMedia?.discordLink || '',
        instagramLink: editFormData.socialMedia?.instagramLink || '',
        facebookLink: editFormData.socialMedia?.facebookLink || '',
        youtubeLink: editFormData.socialMedia?.youtubeLink || '',
        tikTokLink: editFormData.socialMedia?.tikTokLink || '',
        twitchLink: editFormData.socialMedia?.twitchLink || '',
        linkedinLink: editFormData.socialMedia?.linkedinLink || '',
        xLink: editFormData.socialMedia?.xLink || '',
        categories: categoryIds,
        gender: getFinalGender(),
        dob: formatDobForApi(),
        dobVisibility: editFormData.dobVisibility || 1,
      }

      const response = await fetchWithAuth(BITOHUBWEBSERVICE + '/profile/updateProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        const updatedProfileImage = tempProfileImage || editFormData.profileImage

        setProfileData({
          ...editFormData,
          profileImage: updatedProfileImage,
          gender: getFinalGender(),
          dob: formatDobForApi(),
          dobVisibility: editFormData.dobVisibility,
        })

        updateProfile({
          fullName: editFormData.name,
          username: editFormData.username,
          profilePicture: updatedProfileImage || null,
          bio: editFormData.bio,
          location: editFormData.location,
          website: editFormData.website
        })

        setEditModalOpen(false)
        setTempProfileImage('')

        showSnackbar('Profile updated successfully!', 'success')
      } else {
        showSnackbar(result.message || 'Failed to update profile. Please try again.', 'error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      showSnackbar('An error occurred while updating your profile. Please try again.', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value

    setEditFormData({
      ...editFormData,
      [field]: value,
    })

    // Debounced validation for username
    if (field === 'username') {
      if (usernameTimerRef.current) {
        clearTimeout(usernameTimerRef.current)
      }

      // If username hasn't changed from initial, mark as valid
      if (value === initialUsername) {
        setUsernameValid(true)
        setUsernameError(null)
      } else {
        setUsernameValid(false)
        setUsernameError(null)

        if (value.trim() !== '') {
          usernameTimerRef.current = setTimeout(() => {
            validateUsername(value)
          }, 800)
        }
      }
    }

    // Debounced validation for email
    if (field === 'email') {
      if (emailTimerRef.current) {
        clearTimeout(emailTimerRef.current)
      }

      // If email hasn't changed from initial, mark as valid
      if (value === initialEmail) {
        setEmailValid(true)
        setEmailError(null)
      } else {
        setEmailValid(false)
        setEmailError(null)

        if (value.trim() !== '') {
          emailTimerRef.current = setTimeout(() => {
            validateEmail(value)
          }, 800)
        }
      }
    }
  }

  const handleSocialMediaChange = (platform: keyof SocialMediaLinks) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditFormData({
      ...editFormData,
      socialMedia: {
        ...editFormData.socialMedia,
        [platform]: event.target.value,
      }
    })
  }

  const handleCategoriesChange = (event: unknown, newValue: string[]) => {
    if (newValue.length <= 5) {
      setEditFormData({
        ...editFormData,
        categories: newValue
      })
    }
  }

  // ============ UPDATED FILE CHANGE HANDLERS - NOW OPENS CROPPER ============

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    // Reset input value immediately
    if (profileImageInputRef.current) {
      profileImageInputRef.current.value = ''
    }

    if (file) {
      if (file.type.startsWith('image/')) {
        // Store the file and create preview URL
        setSelectedImageFile(file)
        const imageUrl = URL.createObjectURL(file)
        setCropperImageSrc(imageUrl)
        setCropperType('profile')
        setCropperOpen(true)
      } else {
        showSnackbar('Please select a valid image file', 'error')
      }
    }
  }

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    // Reset input value immediately
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = ''
    }

    if (file) {
      if (file.type.startsWith('image/')) {
        // Store the file and create preview URL
        setSelectedImageFile(file)
        const imageUrl = URL.createObjectURL(file)
        setCropperImageSrc(imageUrl)
        setCropperType('cover')
        setCropperOpen(true)
      } else {
        showSnackbar('Please select a valid image file', 'error')
      }
    }
  }

  // ============ CROPPER COMPLETE HANDLER ============

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setCropperOpen(false)

    if (cropperImageSrc) {
      URL.revokeObjectURL(cropperImageSrc)
    }

    if (cropperType === 'profile') {
      setIsUploadingImage(true)
      const previewUrl = URL.createObjectURL(croppedImageBlob)
      setTempProfileImage(previewUrl)

      const uploadedUrl = await uploadProfilePicture(croppedImageBlob)

      if (uploadedUrl) {
        URL.revokeObjectURL(previewUrl)

        // Update cache buster to force re-fetch
        setImageCacheBuster(Date.now())

        setTempProfileImage(uploadedUrl)
        setEditFormData(prev => ({
          ...prev,
          profileImage: uploadedUrl
        }))
        setProfileData(prev => ({
          ...prev,
          profileImage: uploadedUrl
        }))
        updateProfilePicture(uploadedUrl)
      } else {
        URL.revokeObjectURL(previewUrl)
        setTempProfileImage(profileData.profileImage || '')
      }

      setIsUploadingImage(false)
    } else if (cropperType === 'cover') {
      setIsUploadingCover(true)

      const uploadedUrl = await uploadCoverPicture(croppedImageBlob)

      if (uploadedUrl) {
        // Update cache buster to force re-fetch
        setImageCacheBuster(Date.now())

        setProfileData(prev => ({
          ...prev,
          coverImage: uploadedUrl
        }))
        setEditFormData(prev => ({
          ...prev,
          coverImage: uploadedUrl
        }))
        updateCoverPicture(uploadedUrl)
      }

      setIsUploadingCover(false)
    }

    setSelectedImageFile(null)
    setCropperImageSrc('')
  }

  const handleCropperClose = () => {
    setCropperOpen(false)
    // Revoke the object URL to free memory
    if (cropperImageSrc) {
      URL.revokeObjectURL(cropperImageSrc)
    }
    setCropperImageSrc('')
    setSelectedImageFile(null)
  }

  const handleChangePhotoClick = () => {
    profileImageInputRef.current?.click()
  }

  const handleChangeCoverClick = () => {
    coverImageInputRef.current?.click()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
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
      case 3:
        post = savedPosts.find(p => p.id === postId)
        break
    }

    if (post) {
      setSelectedPost(post)
      setOpenCommentDialog(true)
    }
  }

  const handleCommentAdded = () => {
    if (!selectedPost) return

    const postId = selectedPost.id

    switch (activeTab) {
      case 0:
        setUserPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        ))
        break
      case 1:
        setUserReels(prev => prev.map(r =>
          r.id === postId ? { ...r, comments: r.comments + 1 } : r
        ))
        break
      case 2:
        setTaggedPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        ))
        break
      case 3:
        setSavedPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: p.comments + 1 } : p
        ))
        break
    }

    setSelectedPost(prev => prev ? { ...prev, comments: prev.comments + 1 } : prev)
  }

  const handleCommentDeleted = () => {
    if (!selectedPost) return

    const postId = selectedPost.id

    switch (activeTab) {
      case 0:
        setUserPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
        ))
        break
      case 1:
        setUserReels(prev => prev.map(r =>
          r.id === postId ? { ...r, comments: Math.max(0, r.comments - 1) } : r
        ))
        break
      case 2:
        setTaggedPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
        ))
        break
      case 3:
        setSavedPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p
        ))
        break
    }

    setSelectedPost(prev => prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev)
  }

  const handleLikePost = async (postId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
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
        case 3:
          currentPost = savedPosts.find(p => p.id === postId)
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
            userId: parseInt(userId),
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
            const newIsLiked = !post.isLiked
            return {
              ...post,
              isLiked: newIsLiked,
              likes: newIsLiked ? post.likes + 1 : post.likes - 1
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
          case 3:
            setSavedPosts(posts => posts.map(updatePost))
            break
        }

        const actionMessage = currentPost.isLiked ? 'Post unliked' : 'Post liked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to like post')
      }
    } catch (error) {
      console.error('Error liking post:', error)
      showSnackbar('Failed to like post. Please try again.', 'error')
    }
  }

  const handleLikeReel = async (reelId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to like reels', 'error')
        return
      }

      const currentReel = userReels.find(r => r.id === reelId)
      if (!currentReel) return

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/reels/likeReel',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
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
            const newIsLiked = !reel.isLiked
            return {
              ...reel,
              isLiked: newIsLiked,
              likes: newIsLiked ? reel.likes + 1 : reel.likes - 1
            }
          }
          return reel
        }))

        const actionMessage = currentReel.isLiked ? 'Reel unliked' : 'Reel liked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to like reel')
      }
    } catch (error) {
      console.error('Error liking reel:', error)
      showSnackbar('Failed to like reel. Please try again.', 'error')
    }
  }

  const handleSavePost = async (postId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
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
        case 3:
          currentPost = savedPosts.find(p => p.id === postId)
          break
      }

      if (!currentPost) return

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/bookmarkPost',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId.toString(),
            postId: postId.toString()
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
          case 3:
            if (currentPost.isSaved) {
              setSavedPosts(posts => posts.filter(p => p.id !== postId))
            } else {
              setSavedPosts(posts => posts.map(updatePost))
            }
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

  const handleSaveReel = async (reelId: number) => {
    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to bookmark reels', 'error')
        return
      }

      const currentReel = userReels.find(r => r.id === reelId)
      if (!currentReel) return

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/reels/bookmarkReel',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            reelId: reelId
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
              isSaved: !reel.isSaved
            }
          }
          return reel
        }))

        const actionMessage = currentReel.isSaved ? 'Reel removed from bookmarks' : 'Reel bookmarked'
        showSnackbar(actionMessage, 'success')
      } else {
        throw new Error(result.message || 'Failed to bookmark reel')
      }
    } catch (error) {
      console.error('Error bookmarking reel:', error)
      showSnackbar('Failed to bookmark reel. Please try again.', 'error')
    }
  }

  const handleVotePost = async (postId: number, optionId: number) => {
    let pollPost: PollPost | undefined

    switch (activeTab) {
      case 0:
        pollPost = userPosts.find(p => p.id === postId && p.type === 'poll') as PollPost
        break
      case 2:
        pollPost = taggedPosts.find(p => p.id === postId && p.type === 'poll') as PollPost
        break
      case 3:
        pollPost = savedPosts.find(p => p.id === postId && p.type === 'poll') as PollPost
        break
    }

    if (!pollPost) return

    if (pollPost.hasVoted) {
      showSnackbar('You have already voted in this poll', 'error')
      return
    }

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to vote', 'error')
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/poll/voteInPoll',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
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
          case 3:
            setSavedPosts(posts => posts.map(updatePost))
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

  const handleEditPost = (postId: number) => {
    console.log('Editing post with ID:', postId)

    let post: Post | undefined

    switch (activeTab) {
      case 0:
        post = userPosts.find(p => p.id === postId)
        break
      case 2:
        post = taggedPosts.find(p => p.id === postId)
        break
      case 3:
        post = savedPosts.find(p => p.id === postId)
        break
    }

    console.log('Found post:', post)
    console.log('Editing post with visibilityType:', post?.visibilityType)

    if (post) {
      setEditingPost(post)
      setOpenPostDialog(true)
    }
  }

  const handleDeletePost = async (postId: number, postType: string) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return
    }

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to delete posts', 'error')
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/post/deletePost',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            postId: postId,
            postType: postType
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        switch (activeTab) {
          case 0:
            setUserPosts(posts => posts.filter(post => post.id !== postId))
            break
          case 2:
            setTaggedPosts(posts => posts.filter(post => post.id !== postId))
            break
          case 3:
            setSavedPosts(posts => posts.filter(post => post.id !== postId))
            break
        }

        showSnackbar('Post deleted successfully', 'success')
      } else {
        throw new Error(result.message || 'Failed to delete post')
      }
    } catch (error) {
      console.error('Error deleting post:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to delete post. Please try again.', 'error')
      }
    }
  }

  const handleDeleteReel = async (reelId: number) => {
    if (!window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
      return
    }

    try {
      const userId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      if (!userId) {
        showSnackbar('Please login to delete reels', 'error')
        return
      }

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/reels/deleteReel',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: parseInt(userId),
            reelId: reelId
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setUserReels(reels => reels.filter(reel => reel.id !== reelId))
        showSnackbar('Reel deleted successfully', 'success')
      } else {
        throw new Error(result.message || 'Failed to delete reel')
      }
    } catch (error) {
      console.error('Error deleting reel:', error)

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        showSnackbar('Network error. Please check your connection.', 'error')
      } else if (error instanceof Error) {
        showSnackbar(error.message, 'error')
      } else {
        showSnackbar('Failed to delete reel. Please try again.', 'error')
      }
    }
  }

  const handlePostCreateOrUpdate = (data: unknown) => {
    console.log('Post created/updated:', data)
    setEditingPost(null)
    setOpenPostDialog(false)
    fetchUserPosts(currentPage)
    showSnackbar('Post updated successfully!', 'success')
  }

  const handlePostShared = () => {
    setSharingPost(null)
    setOpenPostDialog(false)
    showSnackbar('Shared successfully!', 'success')
  }

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownOpen) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-country-dropdown]')) {
          setCountryDropdownOpen(false)
          setCountrySearchQuery('')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [countryDropdownOpen])

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
          onEdit={() => handleEditPost(post.id)}
          onDelete={() => handleDeletePost(post.id, post.contentType)}
          location={post.location}
          taggedUserIds={post.taggedUserIds}
          taggedData={post.taggedData}
          isTaggedPost={post.isTaggedPost}
          isSharedPost={post.isSharedPost}
          shareId={post.shareId}
          sharedByUserId={post.sharedByUserId}
          sharerUserName={post.sharerUserName}
          sharerFullName={post.sharerFullName}
          sharerProfilePicture={post.sharerProfilePicture}
          shareMessage={post.shareMessage}
          shareCreatedAt={post.shareCreatedAt}

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
          onEdit={() => handleEditPost(post.id)}
          onDelete={() => handleDeletePost(post.id, post.contentType)}
          location={post.location}
          taggedUserIds={post.taggedUserIds}
          taggedData={post.taggedData}
          isTaggedPost={post.isTaggedPost}
          isSharedPost={post.isSharedPost}
          shareId={post.shareId}
          sharedByUserId={post.sharedByUserId}
          sharerUserName={post.sharerUserName}
          sharerFullName={post.sharerFullName}
          sharerProfilePicture={post.sharerProfilePicture}
          shareMessage={post.shareMessage}
          shareCreatedAt={post.shareCreatedAt}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
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
          onEdit={() => handleEditPost(post.id)}
          onDelete={() => handleDeletePost(post.id, post.contentType)}
          location={post.location}
          taggedUserIds={post.taggedUserIds}
          taggedData={post.taggedData}
          isTaggedPost={post.isTaggedPost}
          isSharedPost={post.isSharedPost}
          shareId={post.shareId}
          sharedByUserId={post.sharedByUserId}
          sharerUserName={post.sharerUserName}
          sharerFullName={post.sharerFullName}
          sharerProfilePicture={post.sharerProfilePicture}
          shareMessage={post.shareMessage}
          shareCreatedAt={post.shareCreatedAt}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
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
          onEdit={() => handleEditPost(post.id)}
          onDelete={() => handleDeletePost(post.id, post.contentType)}
          location={post.location}

          taggedUserIds={post.taggedUserIds}
          taggedData={post.taggedData}
          isTaggedPost={post.isTaggedPost}
          isSharedPost={post.isSharedPost}
          shareId={post.shareId}
          sharedByUserId={post.sharedByUserId}
          sharerUserName={post.sharerUserName}
          sharerFullName={post.sharerFullName}
          sharerProfilePicture={post.sharerProfilePicture}
          shareMessage={post.shareMessage}
          shareCreatedAt={post.shareCreatedAt}
          isSponsored={post.isSponsored}
          campaignId={post.campaignId}
          cta={post.cta}
          callToActionUrl={post.callToActionUrl}
          adHeadline={post.adHeadline}
          isProductTagged={post.isProductTagged}
        // taggedProducts={post.taggedProducts}

        />
      )
    }
    return null
  }

  const renderContent = () => {
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
                  Share your first post to get started
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
                    onSave={() => handleSaveReel(reel.id)}
                    onComment={() => handleReelComment(reel.id)}
                    onShare={() => handleShareReel(reel.id)}
                    onFollowSuccess={(message) => showSnackbar(message, 'success')}
                    onFollowError={(message) => showSnackbar(message, 'error')}
                    onEdit={() => handleEditReel(reel.id)}
                    onDelete={() => handleDeleteReel(reel.id)}
                    location={reel.location}
                    isSponsored={reel.isSponsored}
                    campaignId={reel.campaignId}
                    cta={reel.cta}
                    callToActionUrl={reel.callToActionUrl}
                    adHeadline={reel.adHeadline}
                    isProductTagged={reel.isProductTagged}

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
                  Share your first reel to get started
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
                  Posts you&apos;re tagged in will appear here
                </Typography>
              </Box>
            )}
          </Box>
        )

      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            {isLoadingSavedPosts ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                <PostSkeleton variant="text" />
                <PostSkeleton variant="image" />
                <PostSkeleton variant="poll" />
              </Box>
            ) : savedPostsError ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {savedPostsError}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={() => fetchSavedPosts(0)}
                  sx={{ textTransform: 'none' }}
                >
                  Retry
                </Button>
              </Box>
            ) : savedPosts.length > 0 ? (
              <Box sx={{ maxWidth: 600, mx: 'auto' }}>
                {savedPosts.map((post) => renderPostComponent(post))}

                {hasMoreSavedPosts && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => fetchSavedPosts(currentSavedPage + 1)}
                      disabled={isLoadingSavedPosts}
                      sx={{ textTransform: 'none' }}
                    >
                      {isLoadingSavedPosts ? 'Loading...' : 'Load More Posts'}
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <SavedIcon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                  No Saved Posts
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Save posts to view them later
                </Typography>
              </Box>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <input
        type="file"
        ref={profileImageInputRef}
        onChange={handleProfileImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      <input
        type="file"
        ref={coverImageInputRef}
        onChange={handleCoverImageChange}
        accept="image/*"
        style={{ display: 'none' }}
      />




      <Box
        sx={{
          height: { xs: 200, sm: 250, md: 400 },
          width: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: { xs: 0, md: '0 0 16px 16px' },
          position: 'relative',
          overflow: 'hidden',
          opacity: isUploadingCover ? 0.7 : 1,
          cursor: profileData.coverImage ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': profileData.coverImage ? {
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
        {/* Cover Image */}
        {profileData.coverImage ? (
          <Box
            component="img"
            src={getImageUrl(profileData.coverImage) || ''}
            alt="Cover"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          />
        )}

        <IconButton
          onClick={(e) => {
            e.stopPropagation()
            handleChangeCoverClick()
          }}
          disabled={isUploadingCover}
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            color: 'white',
            zIndex: 4,
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            }
          }}
        >
          {isUploadingCover ? <CircularProgress size={24} color="inherit" /> : <CameraIcon />}
        </IconButton>
      </Box>


      <Container maxWidth="md" sx={{ mt: { xs: -10, sm: -12, md: -15 } }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            mb: 3,
            px: { xs: 2, sm: 0 }
          }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ position: 'relative' }}>
                {profileData.profileImage ? (
                  <Avatar
                    key={imageCacheBuster}
                    src={profileData.profileImage ? `${profileData.profileImage}${profileData.profileImage.includes('?') ? '&' : '?'}cb=${Date.now()}` : undefined}
                    onClick={() => setImageViewerOpen(true)}

                    sx={{
                      width: { xs: 100, sm: 120, md: 150 },
                      height: { xs: 100, sm: 120, md: 150 },
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.9
                      }
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: { xs: 100, sm: 120, md: 150 },
                      height: { xs: 100, sm: 120, md: 150 },
                      bgcolor: '#e5e7eb',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      border: '4px solid white',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  >
                    {getInitials(profileData.name)}
                  </Avatar>
                )}

                <Box
                  sx={{
                    position: 'absolute',
                    bottom: { xs: 4, sm: 6, md: 8 },
                    right: { xs: 4, sm: 6, md: 8 },
                    width: { xs: 18, sm: 22, md: 26 },
                    height: { xs: 18, sm: 22, md: 26 },
                    bgcolor: '#44b700',
                    border: '3px solid white',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 2px rgba(68, 183, 0, 0.2)',
                    '&::after': {
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      animation: 'ripple 1.2s infinite ease-in-out',
                      border: '1px solid #44b700',
                      content: '""',
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
              </Box>
            </Box>


            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditProfile}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                px: 3,
                py: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                bgcolor: '#1e40af',
                '&:hover': {
                  bgcolor: '#5558dd',
                },
              }}
            >
              Edit Profile
            </Button>
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
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {profileData.name}
              </Typography>
              {/* Diamond Badge Icon */}
              <IconButton
                onClick={handleDiamondClick}
                size="small"
                sx={{
                  p: 0.5,
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: 'white',
                  width: 28,
                  height: 28,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #9333ea, #4f46e5)',
                    transform: 'scale(1.15)',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5)',
                  },
                }}
              >
                <DiamondIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profileData.username}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {profileData.bio}
            </Typography>

            {/* In the main profile view, find the categories section and update it */}
            {localStorage.getItem('pageId') !== '0' &&
              profileData.pageType &&
              profileData.pageType !== 'Personal' &&
              profileData.pageType !== 'Personal Page' &&
              profileData.categories && profileData.categories.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {profileData.categories.map((category, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          px: 2,
                          py: 0.75,
                          borderRadius: 20,
                          bgcolor: '#f3f4f6',
                          border: '1px solid #e5e7eb',
                          transition: 'all 0.2s',
                          cursor: 'default',
                          '&:hover': {
                            bgcolor: '#e5e7eb',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: '#4b5563',
                            fontSize: '0.875rem'
                          }}
                        >
                          {category}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 3 }}
              sx={{ mb: 3, flexWrap: 'wrap' }}
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

              {profileData.location && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {profileData.location}
                  </Typography>
                </Box>
              )}

              {profileData.joinedDate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Joined {profileData.joinedDate}
                  </Typography>
                </Box>
              )}

              {profileData.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Link
                    href={
                      profileData.website.startsWith('http')
                        ? profileData.website
                        : `https://${profileData.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: '#1e40af', cursor: 'pointer' }}
                    >
                      {profileData.website}
                    </Typography>
                  </Link>
                </Box>
              )}
            </Stack>

            {profileData.socialMedia && Object.values(profileData.socialMedia).some(link => link) && (
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}
              >
                {profileData.socialMedia.telegramLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.telegramLink}
                    target="_blank"
                    sx={{ color: '#0088cc' }}
                  >
                    <TelegramIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.discordLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.discordLink}
                    target="_blank"
                    sx={{ color: '#5865F2' }}
                  >
                    <DiscordIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.instagramLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.instagramLink}
                    target="_blank"
                    sx={{ color: '#E4405F' }}
                  >
                    <InstagramIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.facebookLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.facebookLink}
                    target="_blank"
                    sx={{ color: '#1877F2' }}
                  >
                    <FacebookIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.youtubeLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.youtubeLink}
                    target="_blank"
                    sx={{ color: '#FF0000' }}
                  >
                    <YouTubeIcon />
                  </IconButton>
                )}

                {profileData.socialMedia.tikTokLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.tikTokLink}
                    target="_blank"
                  >
                    <TikTokIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.twitchLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.twitchLink}
                    target="_blank"
                    sx={{ color: '#9146FF' }}
                  >
                    <TwitchIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.linkedinLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.linkedinLink}
                    target="_blank"
                    sx={{ color: '#0A66C2' }}
                  >
                    <LinkedInIcon />
                  </IconButton>
                )}
                {profileData.socialMedia.xLink && (
                  <IconButton
                    size="small"
                    href={profileData.socialMedia.xLink}
                    target="_blank"
                  >
                    <XIcon />
                  </IconButton>
                )}
              </Stack>
            )}

            <Stack direction="row" spacing={4}>
              <Box
                onClick={() => handleOpenFollowersDialog('followers')}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {profileData.followersCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              <Box
                onClick={() => handleOpenFollowersDialog('following')}
                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
              >
                <Typography variant="h6" fontWeight="bold">
                  {profileData.followingCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {userPosts.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posts
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
            <Tab label="Saved" />
          </Tabs>
        </Box>

        {renderContent()}
      </Container>

      {/* ============ IMAGE CROPPER DIALOG ============ */}
      <ImageCropperDialog
        open={cropperOpen}
        onClose={handleCropperClose}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={cropperType === 'profile' ? 1 : 3 / 1}  // Changed to 3:1 for wider cover
        cropShape={cropperType === 'profile' ? 'round' : 'rect'}
        title={cropperType === 'profile' ? 'Crop Profile Picture' : 'Crop Cover Photo'}
      />

      {/* ============ PROFILE IMAGE VIEWER DIALOG ============ */}
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
        <Box sx={{ position: 'relative' }}>
          {/* Close Button */}
          <IconButton
            onClick={() => setImageViewerOpen(false)}
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
          {profileData.profileImage ? (
            <Box
              component="img"
              src={profileData.profileImage}
              alt={profileData.name}
              sx={{
                width: '100%',
                maxWidth: 350,
                height: 'auto',
                aspectRatio: '1',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <Box
              sx={{
                width: 350,
                height: 350,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#1e40af'
              }}
            >
              <Typography sx={{ fontSize: '6rem', color: 'white' }}>
                {getInitials(profileData.name)}
              </Typography>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog
        open={editModalOpen}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2
        }}>
          <Typography variant="h6" fontWeight="bold">
            Edit Profile
          </Typography>
          <IconButton onClick={handleCloseEdit} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
              {tempProfileImage ? (
                <Avatar
                  key={`edit-${imageCacheBuster}`}
                  src={getImageUrl(tempProfileImage)}
                  sx={{
                    width: 80,
                    height: 80,
                    border: '2px solid #e5e7eb',
                    opacity: isUploadingImage ? 0.5 : 1
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: '#1e40af',
                    fontSize: '2rem',
                    opacity: isUploadingImage ? 0.5 : 1
                  }}
                >
                  {getInitials(editFormData.name)}
                </Avatar>
              )}

              {isUploadingImage && (
                <Box sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: 80,
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CircularProgress size={30} />
                </Box>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddPhotoIcon />}
                  onClick={handleChangePhotoClick}
                  disabled={isUploadingImage}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    bgcolor: '#1e40af',
                    '&:hover': {
                      bgcolor: '#5558dd',
                    },
                  }}
                >
                  {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                </Button>
              </Box>
            </Box>

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>
              Basic Information
            </Typography>

            <TextField
              label="Name"
              fullWidth
              value={editFormData.name}
              onChange={handleInputChange('name')}
              variant="outlined"
            />

            <TextField
              label="Display name"
              fullWidth
              value={editFormData.username}
              onChange={handleInputChange('username')}
              variant="outlined"
              error={!!usernameError}
              helperText={usernameError || (usernameValid && editFormData.username !== initialUsername ? 'Username is available' : '')}
              disabled={isUpdating}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isValidatingUsername && <CircularProgress size={20} />}
                    {!isValidatingUsername && usernameValid && editFormData.username !== initialUsername && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 20, color: 'success.main' }}>✓</Typography>
                      </Box>
                    )}
                    {!isValidatingUsername && usernameError && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 20, color: 'error.main' }}>✗</Typography>
                      </Box>
                    )}
                  </InputAdornment>
                )
              }}
              FormHelperTextProps={{
                sx: {
                  color: usernameValid && editFormData.username !== initialUsername ? 'success.main' : 'error.main'
                }
              }}
            />

            <TextField
              label="Email"
              fullWidth
              value={editFormData.email}
              onChange={handleInputChange('email')}
              variant="outlined"
              error={!!emailError}
              helperText={emailError || (emailValid && editFormData.email !== initialEmail ? 'Email is available' : '')}
              disabled={isUpdating}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {isValidatingEmail && <CircularProgress size={20} />}
                    {!isValidatingEmail && emailValid && editFormData.email !== initialEmail && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 20, color: 'success.main' }}>✓</Typography>
                      </Box>
                    )}
                    {!isValidatingEmail && emailError && (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ fontSize: 20, color: 'error.main' }}>✗</Typography>
                      </Box>
                    )}
                  </InputAdornment>
                )
              }}
              FormHelperTextProps={{
                sx: {
                  color: emailValid && editFormData.email !== initialEmail ? 'success.main' : 'error.main'
                }
              }}
            />

            <TextField
              label="Bio"
              fullWidth
              multiline
              rows={4}
              value={editFormData.bio}
              onChange={handleInputChange('bio')}
              variant="outlined"
            />

            {/* Gender Selection */}
            <FormControl fullWidth>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
                labelId="gender-label"
                id="gender-select"
                value={editFormData.gender && ['Male', 'Female', 'Others'].includes(editFormData.gender)
                  ? editFormData.gender
                  : editFormData.gender ? 'Custom' : ''}
                label="Gender"
                onChange={handleGenderChange}
                startAdornment={
                  <InputAdornment position="start">
                    <GenderIcon sx={{ color: 'action.active', ml: 1 }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>Select Gender</em>
                </MenuItem>
                {genderOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Custom Gender Text Field - shown when "Custom" is selected */}
            {(editFormData.gender === 'Custom' ||
              (editFormData.gender && !['Male', 'Female', 'Others', ''].includes(editFormData.gender))) && (
                <TextField
                  label="Custom Gender"
                  fullWidth
                  value={customGender || (editFormData.gender && !['Male', 'Female', 'Others', 'Custom'].includes(editFormData.gender) ? editFormData.gender : '')}
                  onChange={(e) => setCustomGender(e.target.value)}
                  variant="outlined"
                  placeholder="Enter your gender identity"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <GenderIcon sx={{ color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

            {/* Date of Birth Selection with Visibility */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CakeIcon sx={{ fontSize: 20 }} />
                Date of Birth
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                {/* Month */}
                <FormControl sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <InputLabel id="dob-month-label">Month</InputLabel>
                  <Select
                    labelId="dob-month-label"
                    id="dob-month-select"
                    value={dobMonth}
                    label="Month"
                    onChange={(e) => {
                      setDobMonth(e.target.value as number | '')
                      if (dobYear && e.target.value) {
                        const daysInNewMonth = new Date(dobYear as number, e.target.value as number, 0).getDate()
                        if (dobDay && (dobDay as number) > daysInNewMonth) {
                          setDobDay('')
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Month</em>
                    </MenuItem>
                    {months.map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Day */}
                <FormControl sx={{ minWidth: { xs: '100%', sm: 80 } }}>
                  <InputLabel id="dob-day-label">Day</InputLabel>
                  <Select
                    labelId="dob-day-label"
                    id="dob-day-select"
                    value={dobDay}
                    label="Day"
                    onChange={(e) => setDobDay(e.target.value as number | '')}
                    disabled={!dobMonth || !dobYear}
                  >
                    <MenuItem value="">
                      <em>Day</em>
                    </MenuItem>
                    {dobMonth && dobYear && generateDays(dobMonth as number, dobYear as number).map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Year */}
                <FormControl sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                  <InputLabel id="dob-year-label">Year</InputLabel>
                  <Select
                    labelId="dob-year-label"
                    id="dob-year-select"
                    value={dobYear}
                    label="Year"
                    onChange={(e) => {
                      setDobYear(e.target.value as number | '')
                      if (dobMonth && e.target.value) {
                        const daysInMonth = new Date(e.target.value as number, dobMonth as number, 0).getDate()
                        if (dobDay && (dobDay as number) > daysInMonth) {
                          setDobDay('')
                        }
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300
                        }
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Year</em>
                    </MenuItem>
                    {generateYears().map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Visibility Dropdown */}
                <FormControl sx={{ minWidth: { xs: '100%', sm: 130 } }}>
                  <InputLabel id="dob-visibility-label">Visibility</InputLabel>
                  <Select
                    labelId="dob-visibility-label"
                    id="dob-visibility-select"
                    value={editFormData.dobVisibility || 1}
                    label="Visibility"
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      dobVisibility: e.target.value as number
                    })}
                  >
                    {dobVisibilityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {dobYear && dobMonth && dobDay && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {months.find(m => m.value === dobMonth)?.label} {dobDay}, {dobYear}
                </Typography>
              )}
            </Box>

            {/* Conditionally show categories field - only for non-personal pages */}
            {localStorage.getItem('pageId') !== '0' &&
              editFormData.pageType &&
              editFormData.pageType !== 'Personal' &&
              editFormData.pageType !== 'Personal Page' && (
                <Autocomplete
                  multiple
                  id="categories-select"
                  options={availableCategories.map(cat => cat.name)}
                  value={editFormData.categories || []}
                  onChange={handleCategoriesChange}
                  disableCloseOnSelect
                  getOptionLabel={(option) => option}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...otherProps } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
                    return (
                      <li key={key} {...otherProps}>
                        <input
                          type="checkbox"
                          checked={selected}
                          style={{ marginRight: 8 }}
                        />
                        {option}
                      </li>
                    );
                  }}
                  renderTags={(value: string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...otherProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key || index}
                          variant="outlined"
                          label={option}
                          {...otherProps}
                          size="small"
                          sx={{
                            bgcolor: '#e3f2fd',
                            borderColor: '#1877f2'
                          }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Categories"
                      placeholder={editFormData.categories?.length === 0 ? "Select up to 5 categories" : ""}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <CategoryIcon sx={{ color: 'action.active', fontSize: 20 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                      helperText={`${editFormData.categories?.length || 0}/5 categories selected`}
                    />
                  )}
                  sx={{ width: '100%' }}
                />
              )}

            {/* Country Selection */}
            <Box sx={{ position: 'relative' }} data-country-dropdown>
              <Box
                onClick={() => {
                  if (!isKycSubmitted) {
                    setCountryDropdownOpen(!countryDropdownOpen)
                  }
                }}
                sx={{
                  position: 'relative',
                  border: '1px solid',
                  borderColor: countryDropdownOpen ? 'primary.main' : 'rgba(255, 255, 255, 0.23)',
                  borderWidth: countryDropdownOpen ? 2 : 1,
                  borderRadius: 1,
                  px: 1.75,
                  py: 2,
                  cursor: isKycSubmitted ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'background.paper',
                  opacity: isKycSubmitted ? 0.6 : 1,
                  transition: 'border-color 0.2s, opacity 0.2s',
                  '&:hover': {
                    borderColor: isKycSubmitted
                      ? 'rgba(255, 255, 255, 0.23)'
                      : (countryDropdownOpen ? 'primary.main' : 'rgba(255, 255, 255, 0.87)'),
                  }
                }}
              >
                {/* Floating Label */}
                <Typography
                  component="label"
                  sx={{
                    position: 'absolute',
                    top: -9,
                    left: 12,
                    px: 0.5,
                    bgcolor: 'background.paper',
                    fontSize: '0.75rem',
                    color: countryDropdownOpen ? 'primary.main' : 'text.secondary',
                    transition: 'color 0.2s'
                  }}
                >
                  Country
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {editFormData.selectedCountry ? (
                    <>
                      <Box
                        component="img"
                        src={`https://flagcdn.com/w40/${editFormData.selectedCountry.code.toLowerCase()}.png`}
                        alt={editFormData.selectedCountry.country}
                        sx={{ width: 24, height: 16, objectFit: 'cover', borderRadius: 0.5 }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <Typography variant="body1">
                        {editFormData.selectedCountry.country}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Select Country
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isKycSubmitted && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      KYC Submitted / Verified
                    </Typography>
                  )}
                  <ChevronDownIcon
                    sx={{
                      color: 'text.secondary',
                      transition: 'transform 0.2s',
                      transform: countryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </Box>
              </Box>

              {/* Dropdown Menu - Only show if not KYC submitted */}
              {countryDropdownOpen && !isKycSubmitted && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 0.5,
                    zIndex: 1300,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                  }}
                >
                  {/* Search Input */}
                  <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Search country..."
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      autoFocus
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Box>

                  {/* Country List */}
                  <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                    {countriesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <Box
                          key={`${country.code}-${country.dialCode}`}
                          onClick={() => handleCountrySelect(country)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1.5,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            },
                            bgcolor: editFormData.selectedCountry?.code === country.code
                              ? 'action.selected'
                              : 'transparent'
                          }}
                        >
                          <Box
                            component="img"
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={country.country}
                            sx={{
                              width: 24,
                              height: 16,
                              objectFit: 'cover',
                              borderRadius: 0.5,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {country.country}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No countries found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>




            <TextField
              label="Location"
              fullWidth
              value={editFormData.location}
              onChange={handleInputChange('location')}
              variant="outlined"
            />

            <TextField
              label="Website"
              fullWidth
              value={editFormData.website}
              onChange={handleInputChange('website')}
              variant="outlined"
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" fontWeight="bold">
              Social Media Links
            </Typography>

            <TextField
              label="Telegram"
              fullWidth
              value={editFormData.socialMedia?.telegramLink || ''}
              onChange={handleSocialMediaChange('telegramLink')}
              variant="outlined"
              placeholder="https://t.me/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TelegramIcon sx={{ color: '#0088cc' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Discord"
              fullWidth
              value={editFormData.socialMedia?.discordLink || ''}
              onChange={handleSocialMediaChange('discordLink')}
              variant="outlined"
              placeholder="https://discord.gg/invite"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DiscordIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Instagram"
              fullWidth
              value={editFormData.socialMedia?.instagramLink || ''}
              onChange={handleSocialMediaChange('instagramLink')}
              variant="outlined"
              placeholder="https://instagram.com/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InstagramIcon sx={{ color: '#E4405F' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Facebook"
              fullWidth
              value={editFormData.socialMedia?.facebookLink || ''}
              onChange={handleSocialMediaChange('facebookLink')}
              variant="outlined"
              placeholder="https://facebook.com/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FacebookIcon sx={{ color: '#1877F2' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="YouTube"
              fullWidth
              value={editFormData.socialMedia?.youtubeLink || ''}
              onChange={handleSocialMediaChange('youtubeLink')}
              variant="outlined"
              placeholder="https://youtube.com/@channel"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <YouTubeIcon sx={{ color: '#FF0000' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="TikTok"
              fullWidth
              value={editFormData.socialMedia?.tikTokLink || ''}
              onChange={handleSocialMediaChange('tikTokLink')}
              variant="outlined"
              placeholder="https://tiktok.com/@username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TikTokIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Twitch"
              fullWidth
              value={editFormData.socialMedia?.twitchLink || ''}
              onChange={handleSocialMediaChange('twitchLink')}
              variant="outlined"
              placeholder="https://twitch.tv/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TwitchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="LinkedIn"
              fullWidth
              value={editFormData.socialMedia?.linkedinLink || ''}
              onChange={handleSocialMediaChange('linkedinLink')}
              variant="outlined"
              placeholder="https://linkedin.com/in/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkedInIcon sx={{ color: '#0A66C2' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="X (formerly Twitter)"
              fullWidth
              value={editFormData.socialMedia?.xLink || ''}
              onChange={handleSocialMediaChange('xLink')}
              variant="outlined"
              placeholder="https://x.com/username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <XIcon sx={{ color: '#000000' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button
                onClick={handleCloseEdit}
                disabled={isUpdating}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveChanges}
                disabled={isUpdating || !usernameValid || !emailValid || isValidatingUsername || isValidatingEmail}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  bgcolor: '#1e40af',
                  '&:hover': {
                    bgcolor: '#5558dd',
                  },
                }}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {selectedPost && (
        <CommentDialog
          open={openCommentDialog}
          onClose={() => {
            setOpenCommentDialog(false)
            setSelectedPost(null)
          }}
          onCommentAdded={handleCommentAdded}
          onCommentDeleted={handleCommentDeleted}
          post={selectedPost as Post}
        />
      )}

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />

      <CreatePostDialog
        open={openPostDialog}
        onClose={() => {
          setOpenPostDialog(false)
          setEditingPost(null)
          setSharingPost(null)
        }}
        onPostCreated={handlePostCreateOrUpdate}
        onPostUpdated={handlePostCreateOrUpdate}
        onReelCoverUpdated={handleReelCoverUpdated}
        editPost={editingPost}
        sharedPost={sharingPost}
      />

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
            <Tab label={`Followers (${profileData.followersCount || 0})`} />
            <Tab label={`Following (${profileData.followingCount || 0})`} />
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

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewUserProfile(user.userId, user.pageId)
                        }}
                        sx={{
                          textTransform: 'none',
                          borderRadius: 2,
                          minWidth: 60
                        }}
                      >
                        View
                      </Button>

                      {followersDialogTab === 'followers' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFollower(user.userId, user.pageId)
                          }}
                          disabled={isRemovingFollower === user.userId}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 2,
                            minWidth: 70
                          }}
                        >
                          {isRemovingFollower === user.userId ? (
                            <CircularProgress size={16} color="error" />
                          ) : (
                            'Remove'
                          )}
                        </Button>
                      )}
                    </Stack>
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
          {profileData.coverImage ? (
            <Box
              component="img"
              src={profileData.coverImage}
              alt="Cover"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain', // This fits the entire image in the container
                objectPosition: 'center',
                backgroundColor: '#f0f0f0', // Background color for empty space
                opacity: isUploadingCover ? 0.7 : 1,
                transition: 'opacity 0.3s ease'
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
                bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: '1.5rem'
              }}
            >
              No cover image
            </Box>
          )}
        </Box>
      </Dialog>


      {/* ============ BADGE CREATORS POPUP DIALOG ============ */}
      <Dialog
        open={badgePopupOpen}
        onClose={() => setBadgePopupOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            maxHeight: '80vh',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DiamondIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                Buy a Badge
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Support your favorite creators
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setBadgePopupOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {isLoadingBadgeCreators ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: '#6366f1' }} />
            </Box>
          ) : badgeCreators.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <DiamondIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.5 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Badge Creators Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow creators who have badges enabled to see them here.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              {badgeCreators.map((creator, index) => (
                <React.Fragment key={creator.creatorUserId}>
                  <Box
                    onClick={() => handleSelectBadgeCreator(creator)}
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
                    {/* Creator Avatar */}
                    {creator.profilePicture ? (
                      <Avatar
                        src={creator.profilePicture}
                        alt={creator.fullName}
                        sx={{ width: 52, height: 52 }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 52,
                          height: 52,
                          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                        }}
                      >
                        {creator.fullName?.charAt(0)?.toUpperCase() || 'C'}
                      </Avatar>
                    )}

                    {/* Creator Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600" noWrap>
                          {creator.fullName}
                        </Typography>
                        {creator.alreadyPurchasedBadge === 1 && (
                          <Chip
                            label={creator.purchasedBadgeLevel || 'Owned'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              bgcolor: '#fef3c7',
                              color: '#92400e',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {creator.username}
                      </Typography>
                      {creator.followersCount !== null && (
                        <Typography variant="caption" color="text.secondary">
                          {formatNumber(creator.followersCount)} followers
                        </Typography>
                      )}
                    </Box>

                    {/* Buy Badge Button */}
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DiamondIcon sx={{ fontSize: 14 }} />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectBadgeCreator(creator)
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        px: 2,
                        py: 0.8,
                        background: creator.alreadyPurchasedBadge === 1
                          ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                          : 'linear-gradient(135deg, #a855f7, #6366f1)',
                        boxShadow: creator.alreadyPurchasedBadge === 1
                          ? '0 2px 8px rgba(34, 197, 94, 0.3)'
                          : '0 2px 8px rgba(139, 92, 246, 0.3)',
                        '&:hover': {
                          background: creator.alreadyPurchasedBadge === 1
                            ? 'linear-gradient(135deg, #16a34a, #15803d)'
                            : 'linear-gradient(135deg, #9333ea, #4f46e5)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {creator.alreadyPurchasedBadge === 1 ? 'Upgrade' : 'Buy Badge'}
                    </Button>
                  </Box>
                  {index < badgeCreators.length - 1 && (
                    <Divider sx={{ mx: 3 }} />
                  )}
                </React.Fragment>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Buy Badge Dialog */}
      <BuyBadgeDialog
        open={badgeDialogOpen}
        onClose={() => {
          setBadgeDialogOpen(false)
          setSelectedBadgeCreator(null)
        }}
        recipientName={selectedBadgeCreator?.fullName || ''}
        recipientUserId={selectedBadgeCreator ? String(selectedBadgeCreator.creatorUserId) : '0'}
        recipientPageId={'0'}
        onSuccess={(message) => {
          showSnackbar(message, 'info')
          setSelectedBadgeCreator(null)
        }}
        onError={(message) => showSnackbar(message, 'error')}
      />

    </Box>
  )
}

export default ProfilePageContent