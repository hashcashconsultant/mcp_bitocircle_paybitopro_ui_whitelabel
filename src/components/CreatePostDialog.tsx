'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useUserProfile } from '../contexts/UserProfileContext'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  Paper,
  Stack,
  Alert,
  useTheme,
  useMediaQuery,
  Popover,
  CircularProgress,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Snackbar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  Image as ImageIcon,
  VideoCall as VideoIcon,
  EmojiEmotions as SmileIcon,
  BarChart as BarChartIcon,
  Schedule as ClockIcon,
  Add as PlusIcon,
  Close as XIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  Error as ErrorIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  AutoAwesome as AIIcon,
  MovieFilter as ReelIcon,
  LiveTv as LiveTvIcon,
  CameraAlt as CameraIcon,
  Cameraswitch as CameraSwitchIcon,
  PhotoCamera as PhotoCameraIcon,
  Replay as RetakeIcon,
  Check as CheckIcon,
  LocationOn as LocationIcon,
  LocationOff as LocationOffIcon,
  Inventory as InventoryIcon,
  Campaign as CampaignIcon
} from '@mui/icons-material';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { usePollCreation, pollService } from '../services/pollService';
import { useBroker } from '../contexts/BrokerContext'

// Import Post types
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
  }
  content: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  contentType: string
  visibilityType?: string | number
  // Tagged users fields
  taggedUserIds?: string
  taggedData?: string
  isTaggedPost?: number
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

export interface ReelPost extends BasePost {
  type: 'reel'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
  title?: string
}

export type Post = TextPost | ImagePost | VideoPost | PollPost | ReelPost

// Tagged User Interface
// Update the TaggedUser interface to include new fields
interface TaggedUser {
  userId: number;
  username: string;
  fullName: string;
  profilePicture: string | null;
  isVerified: string | boolean; // Can be string 'Y'/'N' or boolean true/false
  isPrivate?: boolean;
  followersCount?: number;
}

// Update the GetFollowersResponse interface
interface GetFollowersResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    users: TaggedUser[];
  };
  errorCode: string | null;
  totalRecords: number | null;
}

// Post Service
interface CreatePostPayload {
  userId: number;
  pageId?: number;
  adminUser?: string;
  content: string;
  postType: 'TEXT' | 'PHOTO' | 'VIDEO';
  hashtags?: string;
  location?: string;
  files?: File[];
  taggedUserIds?: number[];
  visibilityType?: string;
  mediaUrlsList?: string;
  scheduledAt?: string;
  campaignId?: number; 
  brandId?: number; 
}

interface UpdatePostPayload extends CreatePostPayload {
  postId: number;
  mediaUrls?: string;
}

// Add Reel Info Update Interfaces
interface UpdateReelInfoPayload {
  adminUser?: string;
  userId: number;
  reelId: number;
  title?: string;
  description?: string;
  hashtags?: string;
  file?: File;
  pageId?: number;
}

interface UpdateReelInfoResponse {
  success: boolean;
  message: string;
  data: {
    reelId: number;
    pageId: number;
    campaignId: number;
    userId: number;
    adminUser: string | null;
    title: string;
    description: string;
    videoUrl: string;
    coverImage: string;
    hashtags: string;
    duration: number;
    isActive: string;
    createdAt: string;
    updatedAt: string | null;
    visibilityType: number;
    username: string;
    fullName: string;
    likeCount: number | null;
    commentCount: number | null;
    shareCount: number | null;
    hasLiked: string | null;
    hasBookmarked: string | null;
  };
  errorCode: string | null;
  totalRecords: number | null;
}

interface CreatePostResponse {
  success: boolean;
  message: string;
  data: {
    postId: number;
    adminUser: string | null;
    pageId: number | null;
    userId: number;
    content: string;
    postType: string;
    mediaUrls: string;
    mediaUrlsList: string[];
    mediaType: string | null;
    hashtags: string | null;
    location: string | null;
    isActive: string;
    createdAt: string;
    updatedAt: string | null;
    scheduledAt: string | null;
    isScheduled: string;
    engagementScore: number;
    pollQuestion: string | null;
    pollOptions: string | null;
    pollDurationHours: number | null;
    username: string;
    fullName: string;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    hasLiked: string;
    hasBookmarked: string;
    poll: unknown;
    visibilityType: string | null;
  };
  errorCode: string | null;
}

// Share Service
interface SharePostPayload {
  userId: number;
  contentId: number;
  shareMessage: string;
  contentType: string;
  pageId?: number;
}

interface SharePostResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}

interface MediaItem {
  id: number;
  type: 'image' | 'video';
  file?: File;
  preview: string;
  name: string;
  isExisting?: boolean;
  isAiGenerated?: boolean;
  isLiveRecording?: boolean;
  isCameraCapture?: boolean;
}

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// Add after existing interfaces
interface Product {
  productId: number;
  productName: string;
  productImage: string | null;
  price: number;
  currency: string;
  isActive: string;
  sku: string;
  description?: string;
  category?: string;
}

interface GetProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  errorCode: string | null;
  totalRecords: number;
}

interface TagProductPayload {
  mediaId: number;
  mediaType: 'POST' | 'REEL' | 'STORY';
  taggedProductIds: number[];
  shopOwnerId: number;
}

interface TagProductResponse {
  success: boolean;
  message: string;
  data: boolean;
  errorCode: string | null;
}

// Add this interface near your other interfaces
interface ShopSettingsResponse {
  success: boolean;
  message: string;
  data: {
    shopId: number;
    externalCheckoutEnabled: string;
    externalCheckoutUrl: string | null;
    shopOwnerId: number;
    shopName: string;
    description: string;
    contactEmail: string;
    policiesUrl: string;
    heroBannerUrl: string | null;
    accentColor: string;
    theme: string;
    shippingProfile: string;
    shipsTo: string;
    handlingTime: string;
    returnPolicy: string;
    showShopOnProfile: string;
    allowProductTagging: string; // This is what we need
    updatedAt: string;
  };
  errorCode: string | null;
  totalRecords: number | null;
}


// Campaign Interfaces
interface Campaign {
  campaignId: number;
  campaignName: string;
  description: string | null;
  startDate: string;
  endDate: string;
  creatorRegion: string | null;
  creatorType: string | null;
  audienceInterest: string | null;
  compensationType: string | null;
  paymentCurrency: string;
  totalBudget: number;
  kpiType: string;
  kpiTarget: string;
  status: string;
  brandId: number;
  hashtags: string[];
  campaignType: string;
  budgetPerCreator: number;
}

interface GetActiveCampaignsResponse {
  success: boolean;
  message: string;
  data: Campaign[];
  recordCount: number;
}



class PostService {
  private baseUrl = 'https://institutional-bo.paybito.com:8443/BitohubService';

  async createPost(payload: CreatePostPayload): Promise<CreatePostResponse> {
    const formData = new FormData();

    formData.append('userId', localStorage.getItem('childUserId') || '');
    formData.append('content', payload.content || '');
    formData.append('postType', payload.postType);
    formData.append('pageId', localStorage.getItem('pageId') || '');
    formData.append('adminUser', localStorage.getItem('uuid') || '');
    formData.append('hashtags', payload.hashtags || '');
    formData.append('location', payload.location || '');
    formData.append('visibilityType', payload.visibilityType || '');
    formData.append('mediaUrlsList', payload.mediaUrlsList || '');
    formData.append('isBanneredPost', '0');
    formData.append('scheduledAt', payload.scheduledAt || '');

    if (payload.campaignId) {
  formData.append('campaignId', payload.campaignId.toString());
}
if (payload.brandId) {
  formData.append('brandId', payload.brandId.toString());
}

    if (payload.taggedUserIds && payload.taggedUserIds.length > 0) {
      payload.taggedUserIds.forEach(userId => {
        formData.append('taggedUserIds', userId.toString());
      });
    }

    if (payload.files && payload.files.length > 0) {
      payload.files.forEach(file => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${this.baseUrl}/post/createPost`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CreatePostResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create post');
    }

    return data;
  }

  async updatePost(payload: UpdatePostPayload): Promise<CreatePostResponse> {
    const formData = new FormData();

    formData.append('postId', payload.postId.toString());
    formData.append('userId', localStorage.getItem('childUserId') || '');
    formData.append('content', payload.content || '');
    formData.append('postType', payload.postType);
    formData.append('adminUser', localStorage.getItem('uuid') || '');
    formData.append('hashtags', payload.hashtags || '');
    formData.append('location', payload.location || '');
    formData.append('campaignId', payload.campaignId?.toString() || '0');
    formData.append('visibilityType', payload.visibilityType || '');
    if (payload.brandId) {
  formData.append('brandId', payload.brandId.toString());
}

    if (payload.mediaUrls) {
      formData.append('mediaUrls', payload.mediaUrls);
    }

    if (payload.taggedUserIds && payload.taggedUserIds.length > 0) {
      payload.taggedUserIds.forEach(userId => {
        formData.append('taggedUserIds', userId.toString());
      });
    }

    if (payload.files && payload.files.length > 0) {
      payload.files.forEach(file => {
        formData.append('files', file);
      });
    }

    const response = await fetch(`${this.baseUrl}/post/updatePost`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CreatePostResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update post');
    }

    return data;
  }

  async updateReelInfo(payload: UpdateReelInfoPayload): Promise<UpdateReelInfoResponse> {
    const formData = new FormData();

    formData.append('adminUser', payload.adminUser || localStorage.getItem('uuid') || '');
    formData.append('userId', payload.userId.toString());
    formData.append('reelId', payload.reelId.toString());
    formData.append('title', payload.title || '');
    formData.append('description', payload.description || '');
    formData.append('hashtags', payload.hashtags || '');
    formData.append('pageId', payload.pageId?.toString() || localStorage.getItem('pageId') || '0');
    formData.append('campaignId', '0');
    formData.append('visibilityType', '0');

    if (payload.file) {
      formData.append('cover', payload.file);
    }

    const response = await fetch(`${this.baseUrl}/reels/updateReelInfo`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: UpdateReelInfoResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update reel info');
    }

    return data;
  }

  determinePostType(mediaItems: MediaItem[], hasAiMedia?: boolean, aiMediaType?: 'image' | 'video'): 'TEXT' | 'PHOTO' | 'VIDEO' {
    if (hasAiMedia && aiMediaType) {
      return aiMediaType === 'image' ? 'PHOTO' : 'VIDEO';
    }

    if (mediaItems.length === 0) return 'TEXT';

    const hasVideo = mediaItems.some(item => item.type === 'video');
    if (hasVideo) return 'VIDEO';

    const hasImages = mediaItems.some(item => item.type === 'image');
    if (hasImages) return 'PHOTO';

    return 'TEXT';
  }

  extractHashtags(content: string): string {
    const hashtags = content.match(/#[\w]+/g) || [];
    return hashtags.join(',');
  }
}

class ShareService {
  private baseUrl = 'https://institutional-bo.paybito.com:8443/BitohubService';

  async sharePost(payload: SharePostPayload): Promise<SharePostResponse> {
    const response = await fetchWithAuth(`${this.baseUrl}/share/sharePost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SharePostResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to share post');
    }

    return data;
  }
}

const postService = new PostService();
const shareService = new ShareService();

class UserService {
  private baseUrl = 'https://institutional-bo.paybito.com:8443/BitohubService';

  async getFollowers(userId: number, page: number = 1, size: number = 50): Promise<GetFollowersResponse> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/settings/tagging/allowed-users?userId=${userId}&offset=${page}&limit=${size}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetFollowersResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch followers');
    }

    return data;
  }
}

const userService = new UserService();

class ProductService {
  private baseUrl = 'https://institutional-bo.paybito.com:8443/MonetizeService';

  async getProducts(
    shopOwnerId: number,
    tab: string = 'ALL',
    searchStr: string = '',
    offset: number = 0,
    limit: number = 50
  ): Promise<GetProductsResponse> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/products/getProductsByOwner?shopOwnerId=${shopOwnerId}&tab=${tab}&searchStr=${encodeURIComponent(searchStr)}&offset=${offset}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetProductsResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch products');
    }

    return data;
  }

  async tagProductToMedia(payload: TagProductPayload): Promise<TagProductResponse> {
    const response = await fetchWithAuth(
      `${this.baseUrl}/media/tag/product`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TagProductResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to tag product');
    }

    return data;
  }
}

const productService = new ProductService();

interface UsePostCreationOptions {
  onSuccess?: (data: CreatePostResponse['data']) => void;
  onError?: (error: string) => void;
}

interface UsePostUpdateOptions {
  onSuccess?: (data: CreatePostResponse['data']) => void;
  onError?: (error: string) => void;
}

interface UseReelInfoUpdateOptions {
  onSuccess?: (data: UpdateReelInfoResponse['data']) => void;
  onError?: (error: string) => void;
}

interface UsePostShareOptions {
  onSuccess?: (data: SharePostResponse) => void;
  onError?: (error: string) => void;
}

interface UseProductTaggingOptions {
  onSuccess?: (data: TagProductResponse) => void;
  onError?: (error: string) => void;
}

const useProductTagging = (options: UseProductTaggingOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tagProductToMedia = async (payload: TagProductPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await productService.tagProductToMedia(payload);
      options.onSuccess?.(response);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to tag product';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    tagProductToMedia,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

const usePostCreation = (options: UsePostCreationOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (payload: CreatePostPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await postService.createPost(payload);
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPost,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

const usePostUpdate = (options: UsePostUpdateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePost = async (payload: UpdatePostPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await postService.updatePost(payload);
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update post';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updatePost,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

const useReelInfoUpdate = (options: UseReelInfoUpdateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReelInfo = async (payload: UpdateReelInfoPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await postService.updateReelInfo(payload);
      options.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reel info';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateReelInfo,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

const usePostShare = (options: UsePostShareOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sharePost = async (payload: SharePostPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await shareService.sharePost(payload);
      options.onSuccess?.(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to share post';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sharePost,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  userId?: number;
  pageId?: number;
  adminUser?: string;
  onPostCreated?: (postData: CreatePostResponse['data']) => void;
  onPostUpdated?: (postData: CreatePostResponse['data']) => void;
  onReelCoverUpdated?: (reelData: UpdateReelInfoResponse['data']) => void;
  sharedPost?: Post | null;
  editPost?: Post | null;
  initialContent?: string;
  initialMediaUrl?: string;
  initialMediaType?: 'image' | 'video';
  initialVideoFile?: File | null;
}

interface PrivacySetting {
  value: string;
  label: string;
  description?: string;
}

// Helper function to parse taggedData and extract names with their corresponding IDs
const parseTaggedDataToUsers = (taggedUserIds: string, taggedData: string): TaggedUser[] => {
  if (!taggedUserIds || !taggedUserIds.trim()) return [];

  const userIds = taggedUserIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

  if (userIds.length === 0) return [];

  // Extract names from taggedData
  // Format: "Sanjay Prasad Verma tagged in this post by Arnab Mitra; Souvik Dutta tagged in this post by Arnab Mitra"
  const names: string[] = [];
  if (taggedData) {
    const parts = taggedData.split(';').map(part => part.trim()).filter(Boolean);
    parts.forEach(part => {
      const match = part.match(/^(.+?)\s+tagged in this post/);
      if (match && match[1]) {
        const name = match[1].trim();
        if (!names.includes(name)) {
          names.push(name);
        }
      }
    });
  }

  // Create TaggedUser objects
  return userIds.map((userId, index) => ({
    userId,
    username: `@user${userId}`,
    fullName: names[index] || `User ${userId}`,
    profilePicture: null,
    isVerified: 'N'
  }));
};

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({
  open,
  onClose,
  userId = parseInt(localStorage.getItem('childUserId') || '0'),
  pageId = parseInt(localStorage.getItem('pageId') || '0'),
  adminUser,
  onPostCreated,
  onPostUpdated,
  onReelCoverUpdated,
  sharedPost,
  editPost,
  initialContent,
  initialMediaUrl,
  initialMediaType,
  initialVideoFile,
}) => {
  const [postText, setPostText] = useState('');
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationHours, setPollDurationHours] = useState(48);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [mediaError, setMediaError] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<null | HTMLElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState<Dayjs | null>(null);
  const [scheduleError, setScheduleError] = useState('');
  const [pollValidationErrors, setPollValidationErrors] = useState<string[]>([]);

  // Location state
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);

  const { brokerDetails } = useBroker()
  const { userProfile } = useUserProfile()  // Add this line

  // AI-generated media state
  const [aiMediaUrl, setAiMediaUrl] = useState<string | null>(null);
  const [aiMediaType, setAiMediaType] = useState<'image' | 'video' | null>(null);

  // Live recorded video state
  const [isLiveRecording, setIsLiveRecording] = useState(false);
  const [hasUserClearedMedia, setHasUserClearedMedia] = useState(false);

  // Reel editing state
  const [reelTitle, setReelTitle] = useState('');
  const [reelDescription, setReelDescription] = useState('');
  const [reelHashtags, setReelHashtags] = useState('');
  const [reelCoverFile, setReelCoverFile] = useState<File | null>(null);
  const [reelCoverPreview, setReelCoverPreview] = useState<string | null>(null);
  const [reelCoverError, setReelCoverError] = useState<string>('');

  // Privacy settings state
  const [privacySetting, setPrivacySetting] = useState<string>('1');

  // Tagged users state
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [taggedUsers, setTaggedUsers] = useState<TaggedUser[]>([]);
  const [availableUsers, setAvailableUsers] = useState<TaggedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersError, setUsersError] = useState('');

  // Camera capture state
  const [showCameraDialog, setShowCameraDialog] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [hasCapturedPhoto, setHasCapturedPhoto] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null); // To anchor the dropdown

  // Add with other state variables
  const [showProductTagDialog, setShowProductTagDialog] = useState(false);
  const [taggedProducts, setTaggedProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productsError, setProductsError] = useState('');
  // Campaign state
const [showCampaignDialog, setShowCampaignDialog] = useState(false);
const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
const [loadingCampaigns, setLoadingCampaigns] = useState(false);
const [campaignsError, setCampaignsError] = useState('');
const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
const [additionalHashtags, setAdditionalHashtags] = useState<string[]>([]);
const [newHashtagInput, setNewHashtagInput] = useState('');

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const reelCoverInputRef = useRef<HTMLInputElement>(null);
  const textFieldRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';

  // Check if scheduling should be available (pageId !== '0')
  const canSchedule = localStorage.getItem('pageId') !== '0';

  // Privacy options
  const privacyOptions: PrivacySetting[] = [
    { value: '1', label: 'Public', description: 'Anyone can see this post' },
    { value: '2', label: 'Only Followers', description: 'Only your followers can see this post' },
    { value: '3', label: 'Only Me', description: 'Only you can see this post' },
    { value: '4', label: 'Exclusive Content', description: 'This content will be visible only to your subscribed followers' }
  ];

  const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService';

  // Add this to your state variables in the CreatePostDialog component
  const [shopSettings, setShopSettings] = useState<ShopSettingsResponse['data'] | null>(null);
  const [loadingShopSettings, setLoadingShopSettings] = useState(false);
  const [shopSettingsError, setShopSettingsError] = useState('');


  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(prev => ({ ...prev, open: false }));
  };


  // Campaign functions
const fetchActiveCampaigns = async () => {
  setLoadingCampaigns(true);
  setCampaignsError('');
  try {
    const response = await fetchWithAuth(
      `${MONETIZE_SERVICE_URL}/collab/creator/deal/active/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GetActiveCampaignsResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch campaigns');
    }

    setAvailableCampaigns(data.data || []);
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    setCampaignsError('Failed to load campaigns. Please try again.');
  } finally {
    setLoadingCampaigns(false);
  }
};

const handleCampaignDialogOpen = () => {
  setShowCampaignDialog(true);
  if (availableCampaigns.length === 0) {
    fetchActiveCampaigns();
  }
};

const handleCampaignDialogClose = () => {
  setShowCampaignDialog(false);
  setCampaignSearchQuery('');
};

const handleSelectCampaign = (campaign: Campaign) => {
  setSelectedCampaign(campaign);
  setAdditionalHashtags([]);
  setNewHashtagInput('');
  setShowCampaignDialog(false);
  setCampaignSearchQuery('');
};

const handleRemoveCampaign = () => {
  setSelectedCampaign(null);
  setAdditionalHashtags([]);
  setNewHashtagInput('');
};

const handleAddHashtag = () => {
  let tag = newHashtagInput.trim();
  if (!tag) return;
  if (!tag.startsWith('#')) tag = '#' + tag;

  // Don't add if already in campaign hashtags or additional hashtags
  const campaignTags = selectedCampaign?.hashtags || [];
  if (
    campaignTags.some(t => t.toLowerCase() === tag.toLowerCase()) ||
    additionalHashtags.some(t => t.toLowerCase() === tag.toLowerCase())
  ) {
    return;
  }

  setAdditionalHashtags(prev => [...prev, tag]);
  setNewHashtagInput('');
};

const handleRemoveAdditionalHashtag = (index: number) => {
  setAdditionalHashtags(prev => prev.filter((_, i) => i !== index));
};

const getAllCampaignHashtags = (): string => {
  if (!selectedCampaign) return '';
  const campaignTags = selectedCampaign.hashtags || [];
  const allTags = [...campaignTags, ...additionalHashtags];
  return allTags.join(',');
};

const filteredCampaigns = availableCampaigns.filter(campaign => {
  const query = campaignSearchQuery.toLowerCase();
  return (
    campaign.campaignName.toLowerCase().includes(query) ||
    (campaign.description || '').toLowerCase().includes(query)
  );
});


  // Add this function with your other functions
  const fetchShopSettings = async () => {
    if (!userId) return;

    setLoadingShopSettings(true);
    setShopSettingsError('');

    try {
      const response = await fetchWithAuth(
        `${MONETIZE_SERVICE_URL}/settings/shopdetails/${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ShopSettingsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch shop settings');
      }

      setShopSettings(data.data);
    } catch (error) {
      console.error('Failed to fetch shop settings:', error);
      setShopSettingsError('Unable to load shop settings');
    } finally {
      setLoadingShopSettings(false);
    }
  };

  // Add these functions with other functions
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError('');
    try {
      const response = await productService.getProducts(
        userId,
        'ALL',
        productSearchQuery,
        0,
        50
      );
      setAvailableProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProductsError('Failed to load products. Please try again.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductTagDialogOpen = () => {
    setShowProductTagDialog(true);
    if (availableProducts.length === 0) {
      fetchProducts();
    }
  };

  const handleProductTagDialogClose = () => {
    setShowProductTagDialog(false);
    setProductSearchQuery('');
  };

  const toggleProductTag = (product: Product) => {
    setTaggedProducts(prev => {
      const isTagged = prev.some(p => p.productId === product.productId);
      if (isTagged) {
        return prev.filter(p => p.productId !== product.productId);
      } else {
        return [...prev, product];
      }
    });
  };

  const removeTaggedProduct = (productId: number) => {
    setTaggedProducts(prev => prev.filter(p => p.productId !== productId));
  };


  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length < 3) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    setIsSearchingLocation(true);
    setShowLocationDropdown(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`
      );

      // Type the response data as our interface array
      const data: LocationSuggestion[] = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error('Error fetching location:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocation = (display_name: string) => {
    setLocation(display_name);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  // Poll creation hook
  const { createPoll, isLoading: isCreatingPoll, error: pollError } = usePollCreation({
    onSuccess: (data) => {
      console.log('Poll created successfully:', data);
      showSnackbar('Poll created successfully!', 'success');
      handleClose();
    },
    onError: (error) => {
      console.error('Failed to create poll:', error);
    }
  });

  // Post creation hook
  const { createPost, isLoading: isCreatingPost, error: postError, clearError } = usePostCreation({
    onSuccess: (data) => {
      console.log('Post created successfully:', data);
      if (data && data.postId) {
        const successMessage = data.isScheduled === 'Y'
          ? `Post scheduled successfully for ${scheduledDateTime?.format('MMMM D, YYYY at h:mm A')}!`
          : `Post created successfully! Post ID: ${data.postId}`;
        showSnackbar(successMessage, 'success');
        onPostCreated?.(data);
        setTimeout(() => { handleClose(); }, 1500);
      }
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
      showSnackbar('Failed to create post. Please try again.', 'error');
    }
  });

  // Post update hook
  const { updatePost, isLoading: isUpdatingPost, error: updateError, clearError: clearUpdateError } = usePostUpdate({
    onSuccess: (data) => {
      console.log('Post updated successfully:', data);
      showSnackbar(`Post updated successfully!`, 'success');
      onPostUpdated?.(data);
      setTimeout(() => { handleClose(); }, 1500);
    },
    onError: (error) => {
      console.error('Failed to update post:', error);
      showSnackbar('Failed to update post. Please try again.', 'error');
    }
  });

  // Reel info update hook
  const { updateReelInfo, isLoading: isUpdatingReelInfo, error: reelInfoError, clearError: clearReelInfoError } = useReelInfoUpdate({
    onSuccess: (data) => {
      console.log('Reel info updated successfully:', data);
      showSnackbar('Reel updated successfully!', 'success');
      onReelCoverUpdated?.(data);
      setTimeout(() => { handleClose(); }, 1500);
    },
    onError: (error) => {
      console.error('Failed to update reel info:', error);
      showSnackbar('Failed to update reel. Please try again.', 'error');
    }
  });

  // Share hook
  const { sharePost, isLoading: isSharingPost, error: shareError, clearError: clearShareError } = usePostShare({
    onSuccess: (data) => {
      console.log('Post shared successfully:', data);
      showSnackbar('Post shared successfully!', 'success');
      setTimeout(() => { handleClose(); }, 1500);
    },
    onError: (error) => {
      console.error('Failed to share post:', error);
      showSnackbar(error, 'error');
    }
  });

  // Add with other hooks
  const { tagProductToMedia, isLoading: isTaggingProduct, error: productTagError, clearError: clearProductTagError } = useProductTagging({
    onSuccess: (data) => {
      console.log('Product tagged successfully:', data);
      showSnackbar('Product tagged successfully!', 'success');
    },
    onError: (error) => {
      console.error('Failed to tag product:', error);
      showSnackbar('Failed to tag product. Please try again.', 'error');
    }
  });

  const minDateTime = dayjs().add(15, 'minute');
  const maxDateTime = dayjs().add(6, 'month');

  const pollDurationOptions = [
    { value: 1, label: '1 hour' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '1 day' },
    { value: 48, label: '2 days' },
    { value: 72, label: '3 days' },
    { value: 168, label: '1 week' },
  ];

  const isSharing = !!sharedPost;
  const isEditing = !!editPost;
  const isReelEdit = isEditing && editPost?.type === 'reel';

  // Camera functions
  const startCamera = useCallback(async () => {
    setIsCameraLoading(true);
    setCameraError('');

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Camera access denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
        } else if (err.name === 'NotReadableError') {
          setCameraError('Camera is already in use by another application.');
        } else {
          setCameraError(`Failed to access camera: ${err.message}`);
        }
      } else {
        setCameraError('Failed to access camera. Please try again.');
      }
    } finally {
      setIsCameraLoading(false);
    }
  }, [facingMode, cameraStream]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    setHasCapturedPhoto(true);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setHasCapturedPhoto(false);
    startCamera();
  }, [startCamera]);

  const usePhoto = useCallback(() => {
    if (!capturedImage) return;

    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const timestamp = Date.now();
        const fileName = `camera_capture_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        const newMedia: MediaItem = {
          id: timestamp,
          type: 'image',
          file: file,
          preview: capturedImage,
          name: fileName,
          isExisting: false,
          isCameraCapture: true
        };

        setSelectedMedia(prev => {
          if (prev.length >= 4) {
            setMediaError('You can only upload up to 4 media files');
            return prev;
          }
          return [...prev, newMedia];
        });

        setShowCameraDialog(false);
        setCapturedImage(null);
        setHasCapturedPhoto(false);
        setCameraError('');
      })
      .catch(err => {
        console.error('Failed to process captured image:', err);
        setCameraError('Failed to process captured image. Please try again.');
      });
  }, [capturedImage]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleOpenCamera = () => {
    setShowCameraDialog(true);
    setCapturedImage(null);
    setHasCapturedPhoto(false);
    setCameraError('');
  };

  const handleCloseCamera = () => {
    stopCamera();
    setShowCameraDialog(false);
    setCapturedImage(null);
    setHasCapturedPhoto(false);
    setCameraError('');
  };

  // Handle location button click
  const handleLocationButtonClick = () => {
    setShowLocationInput(!showLocationInput);
    // If turning off location input, clear the location
    if (showLocationInput) {
      setLocation('');
    }
  };

  // Camera useEffects
  useEffect(() => {
    if (showCameraDialog && !hasCapturedPhoto) {
      startCamera();
    }
  }, [showCameraDialog, facingMode, hasCapturedPhoto]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle initial content and AI-generated media
  useEffect(() => {
    if (open && !editPost && !sharedPost) {
      if (initialContent) {
        setPostText(initialContent);
      }
      if (initialMediaUrl && initialMediaType) {
        setAiMediaUrl(initialMediaUrl);
        setAiMediaType(initialMediaType);
      }
    }
  }, [open, initialContent, initialMediaUrl, initialMediaType, editPost, sharedPost]);

  // Handle initial video file from live recording
  useEffect(() => {
    if (hasUserClearedMedia) return;

    if (open && initialVideoFile && !editPost && !sharedPost) {
      const videoUrl = URL.createObjectURL(initialVideoFile);

      const liveVideoMedia: MediaItem = {
        id: Date.now(),
        type: 'video',
        file: initialVideoFile,
        preview: videoUrl,
        name: initialVideoFile.name || 'Live Recording',
        isExisting: false,
        isLiveRecording: true
      };

      setSelectedMedia([liveVideoMedia]);
      setIsLiveRecording(true);
    }
  }, [open, initialVideoFile, hasUserClearedMedia]);

  useEffect(() => {
    if (!open) return;
    if (hasUserClearedMedia) return;

    if (initialVideoFile && selectedMedia.length === 0 && !editPost && !sharedPost) {
      const videoUrl = URL.createObjectURL(initialVideoFile);

      const liveVideoMedia: MediaItem = {
        id: Date.now(),
        type: 'video',
        file: initialVideoFile,
        preview: videoUrl,
        name: initialVideoFile.name || 'Live Recording',
        isExisting: false,
        isLiveRecording: true
      };

      setSelectedMedia([liveVideoMedia]);
      setIsLiveRecording(true);
    }
  }, [initialVideoFile, open, selectedMedia.length, editPost, sharedPost, hasUserClearedMedia]);

  // Pre-fill form when editing - including tagged users
  useEffect(() => {
    if (open && editPost) {
      setPostText(editPost.content || '');
      setLocation('');

      if (editPost.visibilityType !== undefined && editPost.visibilityType !== null) {
        setPrivacySetting(editPost.visibilityType.toString());
      } else {
        setPrivacySetting('1');
      }

      // Prepopulate tagged users from taggedUserIds and taggedData
      if (editPost.taggedUserIds && editPost.taggedUserIds.trim()) {
        const parsedTaggedUsers = parseTaggedDataToUsers(
          editPost.taggedUserIds,
          editPost.taggedData || ''
        );
        setTaggedUsers(parsedTaggedUsers);
        console.log('Prepopulated tagged users:', parsedTaggedUsers);
      } else {
        setTaggedUsers([]);
      }

      if (editPost.type === 'reel') {
        const reelPost = editPost as ReelPost;
        setReelTitle(reelPost.title || '');
        setReelDescription(editPost.content || '');
        setReelHashtags('');
        if (reelPost.thumbnailUrl) {
          setReelCoverPreview(reelPost.thumbnailUrl);
        }
        setSelectedMedia([]);
      } else if (editPost.type === 'image') {
        const imagePost = editPost as ImagePost;
        const existingMedia: MediaItem[] = imagePost.images.map((url, index) => ({
          id: Date.now() + index,
          type: 'image' as const,
          preview: url,
          name: `Image ${index + 1}`,
          isExisting: true
        }));
        setSelectedMedia(existingMedia);
      } else if (editPost.type === 'video') {
        const videoPost = editPost as VideoPost;
        const existingMedia: MediaItem[] = [{
          id: Date.now(),
          type: 'video' as const,
          preview: videoPost.videoUrl,
          name: 'Video',
          isExisting: true
        }];
        setSelectedMedia(existingMedia);
      } else {
        setSelectedMedia([]);
      }

      setShowPollCreator(false);
      setShowScheduler(false);
      setShowLocationInput(false);
    }
  }, [open, editPost]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      fetchShopSettings();
    fetchActiveCampaigns();
      
      setTimeout(() => {
        setPostText('');
        setSelectedMedia([]);
        setShowPollCreator(false);
        setShowScheduler(false);
        setScheduledDateTime(null);
        setPollQuestion('');
        setPollOptions(['', '']);
        setLocation('');
        setShowLocationInput(false);
        setMediaError('');
        setTaggedUsers([]);
        setUserSearchQuery('');
        setPrivacySetting('1');
        setAiMediaUrl(null);
        setAiMediaType(null);
        setIsLiveRecording(false);
        setHasUserClearedMedia(false);
        setReelTitle('');
        setReelDescription('');
        setReelHashtags('');
        setReelCoverFile(null);
        setReelCoverPreview(null);
        setReelCoverError('');
        setShowCameraDialog(false);
        setCapturedImage(null);
        setHasCapturedPhoto(false);
        setCameraError('');
        clearError();
        clearUpdateError();
        clearReelInfoError();
        clearShareError();
        // In the useEffect that resets the form, add:
        setTaggedProducts([]);
        setShowProductTagDialog(false);
        setProductSearchQuery('');
        setAvailableProducts([]);
        clearProductTagError();
        setSelectedCampaign(null);
setShowCampaignDialog(false);
setCampaignSearchQuery('');
setAvailableCampaigns([]);
setAdditionalHashtags([]);
setNewHashtagInput('');
setCampaignsError('');
        setSnackbar({ open: false, message: '', severity: 'success' });
      }, 300);
    }
  }, [open]);

  const shouldShowProductTagging = shopSettings?.allowProductTagging === 'Y';

  const dialogTitle = sharedPost
    ? 'Share Post'
    : isReelEdit
      ? 'Edit Reel'
      : isEditing
        ? 'Edit Post'
        : showScheduler
          ? 'Schedule Post'
          : showPollCreator
            ? 'Create Poll'
            : aiMediaUrl
              ? 'Create Post with AI Content'
              : isLiveRecording
                ? 'Create Post with Live Video'
                : 'Create Post';

  const placeholderText = sharedPost
    ? "Add your thoughts about this post..."
    : showPollCreator
      ? "Add a description to your poll (optional)"
      : aiMediaUrl
        ? "Add a caption for your AI-generated content..."
        : isLiveRecording
          ? "Add a caption for your live video..."
          : "What's your next move?";

  const handleEmojiClick = (event: React.MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(event.currentTarget);
    if (textFieldRef.current) {
      setCursorPosition(textFieldRef.current.selectionStart || 0);
    }
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const onEmojiSelect = (emojiData: EmojiClickData) => {
    const beforeText = postText.substring(0, cursorPosition);
    const afterText = postText.substring(cursorPosition);
    const newText = beforeText + emojiData.emoji + afterText;
    setPostText(newText);
    setCursorPosition(cursorPosition + emojiData.emoji.length);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostText(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleScheduleToggle = () => {
    setShowScheduler(!showScheduler);
    if (!showScheduler) {
      setScheduledDateTime(dayjs().add(1, 'hour'));
      setScheduleError('');
    } else {
      setScheduledDateTime(null);
      setScheduleError('');
    }
  };

  const handleScheduleDateTimeChange = (newValue: Dayjs | null) => {
    setScheduleError('');
    if (newValue) {
      if (newValue.isBefore(minDateTime)) {
        setScheduleError('Scheduled time must be at least 15 minutes from now');
        return;
      }
      if (newValue.isAfter(maxDateTime)) {
        setScheduleError('Scheduled time cannot be more than 6 months from now');
        return;
      }
    }
    setScheduledDateTime(newValue);
  };

  const fetchFollowers = async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const response = await userService.getFollowers(userId, 1, 50);
      setAvailableUsers(response.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
      setUsersError('Failed to load users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleTagDialogOpen = () => {
    setShowTagDialog(true);
    if (availableUsers.length === 0) {
      fetchFollowers();
    }
  };

  const handleTagDialogClose = () => {
    setShowTagDialog(false);
    setUserSearchQuery('');
  };

  const toggleUserTag = (user: TaggedUser) => {
    setTaggedUsers(prev => {
      const isTagged = prev.some(u => u.userId === user.userId);
      if (isTagged) {
        return prev.filter(u => u.userId !== user.userId);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeTaggedUser = (userId: number) => {
    setTaggedUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const filteredUsers = availableUsers.filter(user => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query)
    );
  });

  const handleReelCoverSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setReelCoverError('');
    const file = files[0];

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      setReelCoverError('Please select a valid image file (JPG, JPEG, PNG only)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setReelCoverError('Image file must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setReelCoverPreview(e.target?.result as string);
      setReelCoverFile(file);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleRemoveReelCover = () => {
    setReelCoverFile(null);
    setReelCoverPreview(null);
    setReelCoverError('');
  };

  const validatePoll = (): boolean => {
    const validation = pollService.validatePollData(pollQuestion, pollOptions);
    setPollValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleClose = () => {
    selectedMedia.forEach(media => {
      if (media.type === 'video' && media.preview && !media.isExisting) {
        URL.revokeObjectURL(media.preview);
      }
    });

    stopCamera();
    onClose();
    setPostText('');
    setShowPollCreator(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDurationHours(48);
    setSelectedMedia([]);
    setMediaError('');
    handleEmojiClose();
    setShowScheduler(false);
    setScheduledDateTime(null);
    setScheduleError('');
    setPollValidationErrors([]);
    setLocation('');
    setShowLocationInput(false);
    setTaggedUsers([]);
    setShowTagDialog(false);
    setUserSearchQuery('');
    setPrivacySetting('1');
    setAiMediaUrl(null);
    setAiMediaType(null);
    setIsLiveRecording(false);
    setHasUserClearedMedia(false);
    setReelTitle('');
    setReelDescription('');
    setReelHashtags('');
    setReelCoverFile(null);
    setReelCoverPreview(null);
    setReelCoverError('');
    setShowCameraDialog(false);
    setCapturedImage(null);
    setHasCapturedPhoto(false);
    setCameraError('');
    clearError();
    clearUpdateError();
    clearReelInfoError();
    clearShareError();
    setTaggedProducts([]);
    setShowProductTagDialog(false);
    setProductSearchQuery('');
    setAvailableProducts([]);
    clearProductTagError();
    setSelectedCampaign(null);
setShowCampaignDialog(false);
setCampaignSearchQuery('');
setAvailableCampaigns([]);
setAdditionalHashtags([]);
setNewHashtagInput('');
setCampaignsError('');

    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  const handleRemoveAiMedia = () => {
    setAiMediaUrl(null);
    setAiMediaType(null);
  };

  const formatScheduledAt = (dateTime: Dayjs | null): string => {
    if (!dateTime) return '';
    return dateTime.toISOString(); // This automatically includes UTC timezone
  };

  const handlePost = async () => {
    clearError();
    clearUpdateError();
    clearReelInfoError();
    clearShareError();
    clearProductTagError();

    if (sharedPost) {
      try {
        await sharePost({
          userId,
          contentId: sharedPost.id,
          shareMessage: postText.trim() || '',
          contentType: sharedPost.contentType || 'POST',
          pageId: parseInt(localStorage.getItem('pageId') || '0'),
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
      return;
    }

    if (isReelEdit && editPost) {
      if (!reelTitle.trim()) {
        showSnackbar('Please enter a title for the reel', 'error');
        return;
      }

      try {
        await updateReelInfo({
          adminUser: adminUser || localStorage.getItem('uuid') || undefined,
          userId,
          reelId: editPost.id,
          title: reelTitle.trim(),
          description: reelDescription.trim(),
          hashtags: reelHashtags.trim(),
          file: reelCoverFile || undefined,
          pageId: pageId || undefined,
        });
      } catch (error) {
        console.error('Reel update failed:', error);
      }
      return;
    }

    if (showScheduler && scheduledDateTime) {
      if (scheduledDateTime.isBefore(minDateTime)) {
        setScheduleError('Scheduled time must be at least 10 minutes from now');
        return;
      }
    }

    if (showPollCreator && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2) {
      if (!validatePoll()) return;

      await createPoll({
        userId,
        pageId,
        pollQuestion: pollQuestion.trim(),
        pollOptions: pollOptions.filter(opt => opt.trim()),
        pollDurationHours,
        visibilityType: privacySetting,
      });

      return;
    }

    if (!postText.trim() && selectedMedia.length === 0 && !aiMediaUrl) {
      setMediaError('Please add some content or media to your post');
      return;
    }

    try {
      const hasAiMedia = !!aiMediaUrl;
      const postType = postService.determinePostType(selectedMedia, hasAiMedia, aiMediaType || undefined);
      const hashtags = postService.extractHashtags(postText);

      const newFiles = selectedMedia
        .filter(item => !item.isExisting && item.file)
        .map(item => item.file!);

      if (isEditing && editPost) {
        const existingUrls = selectedMedia
          .filter(item => item.isExisting)
          .map(item => item.preview)
          .join(',');

        const updatePayload: UpdatePostPayload = {
          postId: editPost.id,
          userId,
          pageId: pageId || undefined,
          adminUser: adminUser || undefined,
          content: postText.trim(),
          postType,
          hashtags: hashtags || undefined,
          location: location.trim() || undefined,
          files: newFiles.length > 0 ? newFiles : undefined,
          mediaUrls: existingUrls || undefined,
          taggedUserIds: taggedUsers.length > 0 ? taggedUsers.map(u => u.userId) : undefined,
          visibilityType: privacySetting,
        };

        await updatePost(updatePayload);
      } else {
        // Prepare scheduledAt value
        const scheduledAtValue = showScheduler && scheduledDateTime
          ? formatScheduledAt(scheduledDateTime)
          : '';

        // Merge content hashtags with campaign hashtags
let allHashtags = hashtags || '';
if (selectedCampaign) {
  const campaignHashtagStr = getAllCampaignHashtags();
  if (campaignHashtagStr) {
    allHashtags = allHashtags
      ? `${allHashtags},${campaignHashtagStr}`
      : campaignHashtagStr;
  }
}

const postPayload: CreatePostPayload = {
  userId,
  pageId: pageId || undefined,
  adminUser: adminUser || undefined,
  content: postText.trim(),
  postType,
  hashtags: allHashtags || undefined,
  location: location.trim() || undefined,
  files: newFiles.length > 0 ? newFiles : undefined,
  taggedUserIds: taggedUsers.length > 0 ? taggedUsers.map(u => u.userId) : undefined,
  visibilityType: privacySetting,
  mediaUrlsList: aiMediaUrl || undefined,
  scheduledAt: scheduledAtValue,
  campaignId: selectedCampaign?.campaignId || undefined,
  brandId: selectedCampaign?.brandId || undefined,
};

        const postData = await createPost(postPayload);

        // Tag products if any are selected
        if (taggedProducts.length > 0 && postData.postId) {
          try {
            await tagProductToMedia({
              mediaId: postData.postId,
              mediaType: isReelEdit ? 'REEL' : 'POST',
              taggedProductIds: taggedProducts.map(p => p.productId),
              shopOwnerId: userId
            });
            // Success message is handled in the hook's onSuccess callback
          } catch (tagError) {
            console.error('Product tagging failed, but post was created:', tagError);
            // Don't show error here - post was created successfully
          }
        }

        // Fetch latest reward status from API
        await fetchRewardStatus();

        // Check for reward redirect after fetching latest data
        if (localStorage.getItem('bitoHubIsRewardReceived') === '0' &&
          localStorage.getItem('bitoHubHasMadeFirstPost') === '1') {
          window.location.href = '/profile';
        }

      }
    } catch (error) {
      console.error('Post operation failed:', error);
    }
  };

  // Add state for checking reward
  const [isCheckingReward, setIsCheckingReward] = useState(false);

  // Fetch reward status from API
  const fetchRewardStatus = async () => {
    const uuid = localStorage.getItem('uuid')
    const pageId = localStorage.getItem('pageId') || '0'

    if (!uuid) return

    setIsCheckingReward(true)

    try {
      const response = await fetchWithAuth('https://institutional-bo.paybito.com:8443/BitohubService/profile/getProfileDetails', {
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
        // Get isRewardReceived from API response
        localStorage.setItem('bitoHubIsRewardReceived', result.data.isRewardReceived)
        localStorage.setItem('bitoHubRewardAmount', result.data.rewardAmount)
        localStorage.setItem('bitoHubHasMadeFirstPost', result.data.hasMadeFirstPost)
      }
    } catch (error) {
      console.error('Error fetching reward status:', error)
    } finally {
      setIsCheckingReward(false)
    }
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
    if (pollValidationErrors.length > 0) {
      setPollValidationErrors([]);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setMediaError('');
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    files.forEach(file => {
      if (!validImageTypes.includes(file.type.toLowerCase())) {
        setMediaError('Please select valid image files (JPG, JPEG, PNG only)');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setMediaError('Image files must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newMedia: MediaItem = {
          id: Date.now() + Math.random(),
          type: 'image',
          file: file,
          preview: e.target?.result as string,
          name: file.name,
          isExisting: false
        };

        setSelectedMedia(prev => {
          if (prev.length >= 4) {
            setMediaError('You can only upload up to 4 media files');
            return prev;
          }
          return [...prev, newMedia];
        });
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setMediaError('');
    const file = files[0];

    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!validVideoTypes.includes(file.type.toLowerCase())) {
      setMediaError('Please select valid video files (MP4, WebM, OGG, MOV)');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setMediaError('Video files must be less than 200MB');
      return;
    }

    if (selectedMedia.length > 0) {
      setMediaError('You can only upload one video per post');
      return;
    }

    const videoUrl = URL.createObjectURL(file);
    const newMedia: MediaItem = {
      id: Date.now() + Math.random(),
      type: 'video',
      file: file,
      preview: videoUrl,
      name: file.name,
      isExisting: false
    };

    setSelectedMedia([newMedia]);
    setIsLiveRecording(false);
    event.target.value = '';
  };

  const removeMedia = (mediaId: number) => {
    setSelectedMedia(prev => {
      const updated = prev.filter(m => m.id !== mediaId);
      const removed = prev.find(m => m.id === mediaId);
      if (removed && removed.type === 'video' && removed.preview && !removed.isExisting) {
        URL.revokeObjectURL(removed.preview);
      }
      return updated;
    });
    setMediaError('');
    setIsLiveRecording(false);
    setHasUserClearedMedia(true);
  };

  const clearAllMedia = () => {
    selectedMedia.forEach(media => {
      if (media.type === 'video' && media.preview && !media.isExisting) {
        URL.revokeObjectURL(media.preview);
      }
    });
    setSelectedMedia([]);
    setIsLiveRecording(false);
    setHasUserClearedMedia(true);
  };

  useEffect(() => {
    return () => {
      selectedMedia.forEach(media => {
        if (media.type === 'video' && media.preview && !media.isExisting) {
          URL.revokeObjectURL(media.preview);
        }
      });
    };
  }, [selectedMedia]);

  const canPost = isSharing
    ? true
    : isReelEdit
      ? !!reelTitle.trim()
      : postText.trim() ||
      selectedMedia.length > 0 ||
      aiMediaUrl ||
      (showPollCreator && pollQuestion.trim() && pollOptions.filter(opt => opt.trim()).length >= 2);

  const openEmojiPicker = Boolean(emojiAnchorEl);
  const isLoading = isCreatingPost || isCreatingPoll || isSharingPost || isUpdatingPost || isUpdatingReelInfo || isTaggingProduct || isCheckingReward;
  const displayError = mediaError || postError || shareError || updateError || reelInfoError || reelCoverError || productTagError;
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {dialogTitle}
          {aiMediaUrl && (
            <Chip
              icon={<AIIcon sx={{ fontSize: 16 }} />}
              label="AI Generated"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ ml: 1, fontSize: 11 }}
            />
          )}
          {isLiveRecording && !aiMediaUrl && (
            <Chip
              icon={<LiveTvIcon sx={{ fontSize: 16 }} />}
              label="Live Recording"
              size="small"
              color="error"
              variant="outlined"
              sx={{ ml: 1, fontSize: 11 }}
            />
          )}
          {isReelEdit && (
            <Chip
              icon={<ReelIcon sx={{ fontSize: 16 }} />}
              label="Reel"
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ ml: 1, fontSize: 11 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, mt: 1 }}>
            {/* <Avatar sx={{ bgcolor: 'primary.main' }}>{brokerDetails?.firstName?.[0] || 'Y'}</Avatar> */}
            <Avatar
              src={userProfile?.profilePicture || undefined}
              sx={{ bgcolor: 'primary.main' }}
            >
              {brokerDetails?.firstName?.[0] || 'Y'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">{brokerDetails?.firstName} {brokerDetails?.lastName}</Typography>
              {!isReelEdit ? (
                <TextField
                  inputRef={textFieldRef}
                  multiline
                  rows={sharedPost ? 2 : (showPollCreator || selectedMedia.length > 0 || showScheduler || aiMediaUrl ? 2 : 4)}
                  fullWidth
                  placeholder={placeholderText}
                  value={postText}
                  onChange={handleTextChange}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    setCursorPosition(target.selectionStart || 0);
                  }}
                  onKeyUp={(e) => {
                    const target = e.target as HTMLInputElement;
                    setCursorPosition(target.selectionStart || 0);
                  }}
                  variant="outlined"
                  sx={{
                    mt: 1,
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Edit your reel details below
                </Typography>
              )}

              {/* Location Input Field - Conditionally rendered and aligned properly */}
              {!isSharing && !isReelEdit && showLocationInput && (
                <Box sx={{ mt: 2, position: 'relative' }} ref={locationRef}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add location..."
                    value={location}
                    onChange={handleLocationChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: isSearchingLocation ? (
                        <CircularProgress size={20} />
                      ) : (
                        <IconButton size="small" onClick={() => {
                          setShowLocationInput(false);
                          setLocation('');
                        }}>
                          <XIcon fontSize="small" />
                        </IconButton>
                      )
                    }}
                  />

                  {/* Suggestions Dropdown */}
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <Paper sx={{ position: 'absolute', zIndex: 10, width: '100%', mt: 1 }}>
                      <List>
                        {locationSuggestions.map((suggestion) => (
                          <ListItemButton
                            key={suggestion.place_id}
                            onClick={() => handleSelectLocation(suggestion.display_name)}
                          >
                            <ListItemText primary={suggestion.display_name} />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* Tagged Users Display */}
          {!isSharing && !isReelEdit && taggedUsers.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {taggedUsers.map(user => (
                <Chip
                  key={user.userId}
                  avatar={
                    <Avatar
                      src={user.profilePicture || undefined}
                      sx={{ width: 24, height: 24 }}
                    >
                      {user.fullName[0]}
                    </Avatar>
                  }
                  label={user.fullName}
                  onDelete={() => removeTaggedUser(user.userId)}
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      color: 'primary.main',
                      '&:hover': { color: 'primary.dark' }
                    }
                  }}
                />
              ))}
            </Box>
          )}

          {/* Tagged Products Display */}
          {!isSharing && !isReelEdit && taggedProducts.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {taggedProducts.map(product => (
                <Chip
                  key={product.productId}
                  avatar={
                    <Avatar
                      src={product.productImage || undefined}
                      sx={{ width: 24, height: 24 }}
                    >
                      {product.productName[0]}
                    </Avatar>
                  }
                  label={`${product.productName} (${product.currency} ${product.price})`}
                  onDelete={() => removeTaggedProduct(product.productId)}
                  color="secondary"
                  variant="outlined"
                  sx={{
                    fontWeight: 500,
                    maxWidth: 200,
                    '& .MuiChip-label': {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'secondary.main',
                      '&:hover': { color: 'secondary.dark' }
                    }
                  }}
                />
              ))}
            </Box>
          )}

          {/* Selected Campaign Display */}
{!isSharing && !isReelEdit && selectedCampaign && (
  <Paper sx={{
    p: 2,
    mb: 2,
    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.08)' : '#FFF8E1',
    border: '2px solid',
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.4)' : '#FFB74D',
    borderRadius: 2
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CampaignIcon sx={{ fontSize: 18, color: '#FF9800' }} />
        <Typography variant="body2" fontWeight={600} sx={{ color: '#FF9800' }}>
          Campaign: {selectedCampaign.campaignName}
        </Typography>
      </Box>
      <IconButton size="small" onClick={handleRemoveCampaign}>
        <XIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>

    {selectedCampaign.description && (
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        {selectedCampaign.description}
      </Typography>
    )}

    {/* Campaign Info Row */}
    <Box sx={{ display: 'flex', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
      <Typography variant="caption" color="text.secondary">
        Budget: {selectedCampaign.paymentCurrency} {selectedCampaign.totalBudget}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        KPI: {selectedCampaign.kpiType} ({selectedCampaign.kpiTarget})
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Ends: {selectedCampaign.endDate}
      </Typography>
    </Box>

    {/* Campaign Hashtags (non-deletable) */}
    {selectedCampaign.hashtags && selectedCampaign.hashtags.length > 0 && (
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Campaign Hashtags
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selectedCampaign.hashtags.map((tag, index) => (
            <Chip
              key={`campaign-tag-${index}`}
              label={tag}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.2)' : '#FFE0B2',
                color: theme.palette.mode === 'dark' ? '#FFB74D' : '#E65100',
                fontWeight: 600,
                fontSize: '0.75rem',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          ))}
        </Box>
      </Box>
    )}

    {/* Additional Hashtags (user-added, deletable) */}
    {additionalHashtags.length > 0 && (
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Your Additional Hashtags
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {additionalHashtags.map((tag, index) => (
            <Chip
              key={`additional-tag-${index}`}
              label={tag}
              size="small"
              onDelete={() => handleRemoveAdditionalHashtag(index)}
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </Box>
    )}
  </Paper>
)}

          {/* Reel Editing Section */}
          {isReelEdit && (
            <Paper sx={{
              p: 2,
              mb: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.1)' : '#f3e5f5',
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ReelIcon sx={{ fontSize: 18, color: 'secondary.main' }} />
                  <Typography variant="body2" fontWeight={600} color="secondary.main">
                    Edit Reel Details
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Title *"
                value={reelTitle}
                onChange={(e) => setReelTitle(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                placeholder="Enter reel title"
                InputLabelProps={{ shrink: true }}
                required
                error={!reelTitle.trim()}
                helperText={!reelTitle.trim() ? 'Title is required' : ''}
              />

              <TextField
                fullWidth
                label="Description"
                value={reelDescription}
                onChange={(e) => setReelDescription(e.target.value)}
                variant="outlined"
                size="small"
                multiline
                rows={3}
                sx={{ mb: 2 }}
                placeholder="Describe your reel..."
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Hashtags"
                value={reelHashtags}
                onChange={(e) => setReelHashtags(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                placeholder="#fun #viral #trending (separate with spaces)"
                InputLabelProps={{ shrink: true }}
                helperText="Add relevant hashtags to increase visibility"
              />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ fontSize: 16 }} />
                  Cover Image (Optional)
                </Typography>

                {reelCoverPreview ? (
                  <Box sx={{
                    position: 'relative',
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#000',
                    mb: 2
                  }}>
                    <img
                      src={reelCoverPreview}
                      alt="Current Reel Cover"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        display: 'block'
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={handleRemoveReelCover}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': { bgcolor: 'white' }
                      }}
                    >
                      <XIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      mb: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'secondary.main',
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => reelCoverInputRef.current?.click()}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload new cover image
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      JPG, JPEG, PNG (max 10MB)
                    </Typography>
                  </Box>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ImageIcon />}
                  onClick={() => reelCoverInputRef.current?.click()}
                  fullWidth
                >
                  {reelCoverPreview ? 'Change Cover Image' : 'Select Cover Image'}
                </Button>
              </Box>

              <input
                ref={reelCoverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleReelCoverSelect}
              />
            </Paper>
          )}

          {/* AI-Generated Media Preview */}
          {!isSharing && !isReelEdit && aiMediaUrl && (
            <Paper sx={{
              p: 2,
              mb: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
              border: '2px solid',
              borderColor: '#3b82f6',
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AIIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
                  <Typography variant="body2" fontWeight={600} color="primary">
                    AI-Generated {aiMediaType === 'image' ? 'Image' : 'Video'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleRemoveAiMedia}>
                  <XIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              <Box sx={{
                position: 'relative',
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: '#000'
              }}>
                {aiMediaType === 'image' ? (
                  <img
                    src={aiMediaUrl}
                    alt="AI Generated"
                    style={{
                      width: '100%',
                      maxHeight: 300,
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : (
                  <video
                    src={aiMediaUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: 300,
                      display: 'block'
                    }}
                  />
                )}
              </Box>
            </Paper>
          )}

          {/* Shared Post Preview */}
          {sharedPost && (
            <Paper sx={{
              p: 2,
              mb: 2,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0',
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Sharing this post
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: sharedPost.user.avatarColor,
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem'
                  }}
                >
                  {sharedPost.user.avatar}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {sharedPost.user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    @{sharedPost.user.username}
                  </Typography>
                </Box>
              </Box>

              {sharedPost.content && (
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    mb: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {sharedPost.content}
                </Typography>
              )}

              {sharedPost.type === 'image' && (sharedPost as ImagePost).images.length > 0 && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#000'
                  }}
                >
                  <img
                    src={(sharedPost as ImagePost).images[0]}
                    alt="Shared content"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {(sharedPost as ImagePost).images.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      +{(sharedPost as ImagePost).images.length - 1}
                    </Box>
                  )}
                </Box>
              )}

              {sharedPost.type === 'video' && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <VideoIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.7)' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    Video
                  </Typography>
                </Box>
              )}

              {sharedPost.type === 'poll' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    {(sharedPost as PollPost).question}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(sharedPost as PollPost).totalVotes} votes
                  </Typography>
                </Box>
              )}

              {sharedPost.type === 'reel' && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 1,
                    overflow: 'hidden',
                    bgcolor: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(sharedPost as ReelPost).thumbnailUrl ? (
                    <img
                      src={(sharedPost as ReelPost).thumbnailUrl}
                      alt="Reel thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <VideoIcon sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.7)' }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600
                    }}
                  >
                    🎬 Reel
                  </Typography>
                  {(sharedPost as ReelPost).duration && (
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1
                      }}
                    >
                      {(sharedPost as ReelPost).duration}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
          )}

          {/* Schedule Section - Theme Supported */}
          {!isSharing && !isEditing && !isReelEdit && showScheduler && (
            <Paper sx={{
              p: 2,
              bgcolor: isDarkMode ? 'rgba(255, 152, 0, 0.1)' : '#FFF3E0',
              border: '2px solid',
              borderColor: isDarkMode ? 'rgba(255, 152, 0, 0.5)' : '#FFB74D',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ClockIcon sx={{ color: isDarkMode ? '#FFB74D' : '#F57C00' }} />
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isDarkMode ? '#FFB74D' : '#F57C00' }}>
                    Schedule Post
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setShowScheduler(false)}>
                  <XIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <DateTimePicker
                label="Select date and time"
                value={scheduledDateTime}
                onChange={handleScheduleDateTimeChange}
                minDateTime={minDateTime}
                maxDateTime={maxDateTime}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    sx: {
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        },
                      },
                    },
                    error: !!scheduleError,
                    helperText: scheduleError || (scheduledDateTime
                      ? `Post will be published on ${scheduledDateTime.format('MMMM D, YYYY at h:mm A')}`
                      : 'Choose when to publish your post')
                  }
                }}
              />

              {scheduledDateTime && !scheduleError && (
                <Alert
                  severity="info"
                  sx={{
                    mt: 2,
                    bgcolor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : undefined,
                    '& .MuiAlert-icon': {
                      color: isDarkMode ? '#90caf9' : undefined,
                    }
                  }}
                >
                  <Typography variant="caption">
                    Your post will be automatically published at the scheduled time.
                  </Typography>
                </Alert>
              )}
            </Paper>
          )}

          {/* Media Preview Section */}
          {!isSharing && !aiMediaUrl && !isReelEdit && selectedMedia.length > 0 && !showPollCreator && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
                px: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''} selected
                  </Typography>
                  {isLiveRecording && (
                    <Chip
                      icon={<LiveTvIcon sx={{ fontSize: 14 }} />}
                      label="Live Recording"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  )}
                  {selectedMedia.some(m => m.isCameraCapture) && (
                    <Chip
                      icon={<CameraIcon sx={{ fontSize: 14 }} />}
                      label="Camera"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: 10, height: 22 }}
                    />
                  )}
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={clearAllMedia}
                  sx={{ textTransform: 'none' }}
                >
                  Clear All
                </Button>
              </Box>

              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 2,
                bgcolor: isLiveRecording
                  ? (theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.1)' : '#ffebee')
                  : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5'),
                borderRadius: 1,
                border: '1px solid',
                borderColor: isLiveRecording ? '#f44336' : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e0e0e0')
              }}>
                {selectedMedia.map((media) => (
                  <Box
                    key={media.id}
                    sx={{
                      position: 'relative',
                      width: selectedMedia.length === 1 ? '100%' : 'calc(50% - 4px)',
                      aspectRatio: selectedMedia.length === 1 ? '16 / 9' : '1',
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: '#000'
                    }}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.preview}
                        alt={media.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    ) : (
                      <video
                        src={media.preview}
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    )}

                    <IconButton
                      size="small"
                      onClick={() => removeMedia(media.id)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'white',
                        color: 'black',
                        border: '1px solid #ccc',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        '&:hover': {
                          bgcolor: '#f5f5f5',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s',
                        padding: '4px'
                      }}
                    >
                      <XIcon sx={{ fontSize: 16 }} />
                    </IconButton>

                    {/* Live Recording Badge */}
                    {media.isLiveRecording && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          bgcolor: '#f44336',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <LiveTvIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>
                          LIVE
                        </Typography>
                      </Box>
                    )}

                    {/* Camera Capture Badge */}
                    {media.isCameraCapture && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          bgcolor: '#1976d2',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <CameraIcon sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>
                          CAMERA
                        </Typography>
                      </Box>
                    )}

                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        px: 1,
                        py: 0.5
                      }}
                    >
                      <Typography variant="caption" noWrap>
                        {media.name}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Error Messages */}
          {displayError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => {
                setMediaError('');
                setReelCoverError('');
                clearError();
                clearUpdateError();
                clearReelInfoError();
                clearShareError();
              }}
            >
              {displayError}
            </Alert>
          )}

          {pollError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {pollError}
            </Alert>
          )}

          {/* Poll Creator */}
          {!isSharing && !isEditing && !isReelEdit && showPollCreator && (
            <Paper sx={{
              p: 2,
              bgcolor: 'background.paper',
              border: '2px solid',
              borderColor: 'background.default',
              mb: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BarChartIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                    Create Poll
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setShowPollCreator(false)}>
                  <XIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                placeholder="Ask a question... (min 10 characters)"
                value={pollQuestion}
                onChange={(e) => {
                  setPollQuestion(e.target.value);
                  if (pollValidationErrors.length > 0) setPollValidationErrors([]);
                }}
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
                error={pollValidationErrors.some(e => e.includes('question'))}
                helperText={
                  pollQuestion.length > 0 && pollQuestion.length < 10
                    ? `${10 - pollQuestion.length} more characters needed`
                    : pollQuestion.length > 500
                      ? 'Question is too long (max 500 characters)'
                      : ''
                }
              />

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Poll Duration</InputLabel>
                <Select
                  value={pollDurationHours}
                  label="Poll Duration"
                  onChange={(e) => setPollDurationHours(e.target.value as number)}
                >
                  {pollDurationOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Poll will end {pollService.formatPollDuration(pollDurationHours)} from posting
                </FormHelperText>
              </FormControl>

              <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                Poll Options (minimum 2, maximum 6)
              </Typography>

              <Stack spacing={1}>
                {pollOptions.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      fullWidth
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      variant="outlined"
                      size="small"
                      error={option.trim().length > 100}
                      helperText={option.length > 100 ? 'Max 100 characters' : ''}
                    />
                    {pollOptions.length > 2 && (
                      <IconButton
                        size="small"
                        onClick={() => removePollOption(index)}
                        color="error"
                      >
                        <XIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Stack>

              {pollOptions.length < 6 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlusIcon />}
                  onClick={addPollOption}
                  sx={{ mt: 2 }}
                >
                  Add Option
                </Button>
              )}

              {pollValidationErrors.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Stack spacing={0.5}>
                    {pollValidationErrors.map((error, index) => (
                      <Typography key={index} variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ErrorIcon sx={{ fontSize: 14 }} /> {error}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
              )}
            </Paper>
          )}

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageSelect}
            disabled={showPollCreator || isSharing || !!aiMediaUrl || isReelEdit || isLiveRecording}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={handleVideoSelect}
            disabled={showPollCreator || isSharing || !!aiMediaUrl || isReelEdit || isLiveRecording}
          />

          {/* Hidden canvas for camera capture */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {/* Action buttons - hide when sharing or reel edit */}
          {!isSharing && !isReelEdit && !isEditing && (
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                <IconButton
                  color="primary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={selectedMedia.some(m => m.type === 'video') || showPollCreator || !!aiMediaUrl || isLiveRecording}
                  title="Add images"
                  size={isMobile ? "small" : "medium"}
                >
                  <ImageIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                {/* Camera Capture Button */}
                <IconButton
                  color="primary"
                  onClick={handleOpenCamera}
                  disabled={selectedMedia.some(m => m.type === 'video') || showPollCreator || !!aiMediaUrl || isLiveRecording || selectedMedia.length >= 4}
                  title="Take a photo"
                  size={isMobile ? "small" : "medium"}
                >
                  <CameraIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={selectedMedia.length > 0 || showPollCreator || !!aiMediaUrl || isLiveRecording}
                  title="Add video"
                  size={isMobile ? "small" : "medium"}
                >
                  <VideoIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={handleEmojiClick}
                  title="Add emoji"
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: openEmojiPicker ? 'action.selected' : 'transparent' }}
                >
                  <SmileIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={handleTagDialogOpen}
                  title="Tag people"
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: taggedUsers.length > 0 ? 'action.selected' : 'transparent' }}
                >
                  <PersonAddIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>


                {shouldShowProductTagging && (

                  <span>
                    <IconButton
                      color="primary"
                      onClick={handleProductTagDialogOpen}
                      title="Tag products"
                      size={isMobile ? "small" : "medium"}
                      sx={{
                        bgcolor: taggedProducts.length > 0 ? 'action.selected' : 'transparent',
                        opacity: loadingShopSettings ? 0.5 : 1
                      }}
                      disabled={loadingShopSettings}
                    >
                      <InventoryIcon fontSize={isMobile ? "small" : "medium"} />
                    </IconButton>
                  </span>
                )}

                {/* Campaign Selection Button */}
                {availableCampaigns.length > 0 && (
  <IconButton
    color="primary"
    onClick={handleCampaignDialogOpen}
    title="Link to campaign"
    size={isMobile ? "small" : "medium"}
    sx={{
      bgcolor: selectedCampaign ? 'action.selected' : 'transparent',
    }}
  >
    <CampaignIcon fontSize={isMobile ? "small" : "medium"} />
  </IconButton>
)}

                {/* Tag Product Button */}
                {/* <IconButton
                  color="primary"
                  onClick={handleProductTagDialogOpen}
                  title="Tag products"
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: taggedProducts.length > 0 ? 'action.selected' : 'transparent' }}
                >
                  <InventoryIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton> */}


                {/* Location Button */}
                <IconButton
                  color={showLocationInput ? "primary" : "default"}
                  onClick={handleLocationButtonClick}
                  title="Add location"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: showLocationInput
                      ? (isDarkMode ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD')
                      : 'transparent',
                    '&:hover': {
                      bgcolor: showLocationInput
                        ? (isDarkMode ? 'rgba(33, 150, 243, 0.3)' : '#BBDEFB')
                        : 'action.hover'
                    }
                  }}
                >
                  {showLocationInput ? (
                    <LocationIcon fontSize={isMobile ? "small" : "medium"} />
                  ) : (
                    <LocationOffIcon fontSize={isMobile ? "small" : "medium"} />
                  )}
                </IconButton>
                <IconButton
                  color={showPollCreator ? "primary" : "default"}
                  onClick={() => {
                    setShowPollCreator(!showPollCreator);
                    if (!showPollCreator) {
                      clearAllMedia();
                      handleRemoveAiMedia();
                      setShowLocationInput(false);
                    }
                  }}
                  sx={{ bgcolor: showPollCreator ? (isDarkMode ? 'rgba(63, 81, 181, 0.2)' : '#E8EAF6') : 'transparent' }}
                  title="Create poll"
                  size={isMobile ? "small" : "medium"}
                  disabled={!!aiMediaUrl || isLiveRecording}
                >
                  <BarChartIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                {/* Schedule Button - Only show if pageId !== '0' */}
                {canSchedule && (
                  <IconButton
                    color={showScheduler ? "warning" : "default"}
                    onClick={handleScheduleToggle}
                    sx={{ bgcolor: showScheduler ? (isDarkMode ? 'rgba(255, 152, 0, 0.2)' : '#FFF3E0') : 'transparent' }}
                    title="Schedule post"
                    size={isMobile ? "small" : "medium"}
                  >
                    <ClockIcon fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                )}
              </Box>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={privacySetting}
                  onChange={(e) => setPrivacySetting(e.target.value)}
                  displayEmpty
                  sx={{
                    height: 36,
                    bgcolor: 'background.paper',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 0.75,
                      fontSize: '0.875rem'
                    }
                  }}
                  renderValue={(selected) => {
                    const option = privacyOptions.find(opt => opt.value === selected);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {selected === '1' && '🌐'}
                          {selected === '2' && '👥'}
                          {selected === '3' && '🔒'}
                          {selected === '4' && '⭐'}
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {option?.label}
                        </Typography>
                      </Box>
                    );
                  }}
                >
                  {privacyOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {option.value === '1' && '🌐'}
                          {option.value === '2' && '👥'}
                          {option.value === '3' && '🔒'}
                          {option.value === '4' && '⭐'}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Action buttons when editing (non-reel) */}
          {!isSharing && isEditing && !isReelEdit && (
            <Box sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              mt: 2,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
                <IconButton
                  color="primary"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={selectedMedia.some(m => m.type === 'video')}
                  title="Add images"
                  size={isMobile ? "small" : "medium"}
                >
                  <ImageIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                {/* Camera Capture Button for Edit Mode */}
                <IconButton
                  color="primary"
                  onClick={handleOpenCamera}
                  disabled={selectedMedia.some(m => m.type === 'video') || selectedMedia.length >= 4}
                  title="Take a photo"
                  size={isMobile ? "small" : "medium"}
                >
                  <CameraIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={selectedMedia.length > 0}
                  title="Add video"
                  size={isMobile ? "small" : "medium"}
                >
                  <VideoIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={handleEmojiClick}
                  title="Add emoji"
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: openEmojiPicker ? 'action.selected' : 'transparent' }}
                >
                  <SmileIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                <IconButton
                  color="primary"
                  onClick={handleTagDialogOpen}
                  title="Tag people"
                  size={isMobile ? "small" : "medium"}
                  sx={{ bgcolor: taggedUsers.length > 0 ? 'action.selected' : 'transparent' }}
                >
                  <PersonAddIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
                {/* Location Button for Edit Mode */}
                <IconButton
                  color={showLocationInput ? "primary" : "default"}
                  onClick={handleLocationButtonClick}
                  title="Add location"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: showLocationInput
                      ? (isDarkMode ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD')
                      : 'transparent',
                    '&:hover': {
                      bgcolor: showLocationInput
                        ? (isDarkMode ? 'rgba(33, 150, 243, 0.3)' : '#BBDEFB')
                        : 'action.hover'
                    }
                  }}
                >
                  {showLocationInput ? (
                    <LocationIcon fontSize={isMobile ? "small" : "medium"} />
                  ) : (
                    <LocationOffIcon fontSize={isMobile ? "small" : "medium"} />
                  )}
                </IconButton>
              </Box>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={privacySetting}
                  onChange={(e) => setPrivacySetting(e.target.value)}
                  displayEmpty
                  sx={{
                    height: 36,
                    bgcolor: 'background.paper',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 0.75,
                      fontSize: '0.875rem'
                    }
                  }}
                  renderValue={(selected) => {
                    const option = privacyOptions.find(opt => opt.value === selected);
                    return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {selected === '1' && '🌐'}
                          {selected === '2' && '👥'}
                          {selected === '3' && '🔒'}
                          {selected === '4' && '⭐'}
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {option?.label}
                        </Typography>
                      </Box>
                    );
                  }}
                >
                  {privacyOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                          {option.value === '1' && '🌐'}
                          {option.value === '2' && '👥'}
                          {option.value === '3' && '🔒'}
                          {option.value === '4' && '⭐'}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {option.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {option.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Emoji Picker Popover */}
          <Popover
            open={openEmojiPicker}
            anchorEl={emojiAnchorEl}
            onClose={handleEmojiClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{
              '& .MuiPopover-paper': {
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              }
            }}
          >
            <EmojiPicker
              onEmojiClick={onEmojiSelect}
              autoFocusSearch={false}
              theme={isDarkMode ? Theme.DARK : Theme.LIGHT}
              searchPlaceHolder="Search emoji..."
              width={isMobile ? 280 : 350}
              height={isMobile ? 350 : 450}
              previewConfig={{ showPreview: !isMobile }}
              skinTonesDisabled={false}
              lazyLoadEmojis={true}
            />
          </Popover>

          {/* Tag Users Dialog */}
          <Dialog
            open={showTagDialog}
            onClose={handleTagDialogClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
              Tag People
              <IconButton
                onClick={handleTagDialogClose}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <XIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 0, pt: 2 }}>
              <Box sx={{ px: 3, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search people..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {taggedUsers.length > 0 && (
                <Box sx={{ px: 3, mb: 1 }}>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {taggedUsers.length} {taggedUsers.length === 1 ? 'person' : 'people'} tagged
                  </Typography>
                </Box>
              )}

              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : usersError ? (
                <Box sx={{ px: 3 }}>
                  <Alert severity="error" onClose={() => setUsersError('')}>
                    {usersError}
                  </Alert>
                </Box>
              ) : filteredUsers.length === 0 ? (
                <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {userSearchQuery ? 'No users found matching your search' : 'No followers available to tag'}
                  </Typography>
                </Box>
              ) : (
                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredUsers.map(user => {
                    const isTagged = taggedUsers.some(u => u.userId === user.userId);
                    return (
                      <ListItem key={user.userId} disablePadding>
                        <ListItemButton onClick={() => toggleUserTag(user)}>
                          <Checkbox edge="start" checked={isTagged} tabIndex={-1} disableRipple />
                          <ListItemAvatar>
                            <Avatar src={user.profilePicture || undefined} sx={{ width: 40, height: 40 }}>
                              {user.fullName[0]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {user.fullName}
                                </Typography>
                                {user.isVerified === 'Y' && (
                                  <Box
                                    component="span"
                                    sx={{
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      bgcolor: 'primary.main',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: '10px',
                                    }}
                                  >
                                    ✓
                                  </Box>
                                )}
                              </Box>
                            }
                            secondary={user.username}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleTagDialogClose}>Cancel</Button>
              <Button variant="contained" onClick={handleTagDialogClose}>
                Done ({taggedUsers.length})
              </Button>
            </DialogActions>
          </Dialog>

          {/* Camera Capture Dialog */}
          <Dialog
            open={showCameraDialog}
            onClose={handleCloseCamera}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                bgcolor: '#000',
                overflow: 'hidden'
              }
            }}
          >
            <DialogTitle sx={{
              fontWeight: 600,
              color: 'white',
              bgcolor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CameraIcon sx={{ color: 'white' }} />
                <Typography variant="h6" fontWeight={600}>
                  {hasCapturedPhoto ? 'Preview Photo' : 'Take a Photo'}
                </Typography>
              </Box>
              <IconButton onClick={handleCloseCamera} sx={{ color: 'white' }}>
                <XIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
              {cameraError && (
                <Alert severity="error" sx={{ m: 2 }} onClose={() => setCameraError('')}>
                  {cameraError}
                </Alert>
              )}

              {isCameraLoading && !hasCapturedPhoto && (
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                  gap: 2
                }}>
                  <CircularProgress sx={{ color: 'white' }} />
                  <Typography color="white">Starting camera...</Typography>
                </Box>
              )}

              {!hasCapturedPhoto && !cameraError && (
                <Box sx={{
                  position: 'relative',
                  width: '100%',
                  bgcolor: '#000',
                  display: isCameraLoading ? 'none' : 'block'
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      display: 'block',
                      transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                    }}
                  />

                  <Box sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3
                  }}>
                    <IconButton
                      onClick={switchCamera}
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' }
                      }}
                    >
                      <CameraSwitchIcon />
                    </IconButton>

                    <IconButton
                      onClick={capturePhoto}
                      disabled={isCameraLoading || !cameraStream}
                      sx={{
                        bgcolor: 'white',
                        color: '#f44336',
                        width: 64,
                        height: 64,
                        border: '4px solid rgba(255, 255, 255, 0.5)',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&:disabled': {
                          bgcolor: 'rgba(255, 255, 255, 0.3)',
                          color: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    >
                      <PhotoCameraIcon sx={{ fontSize: 32 }} />
                    </IconButton>

                    <Box sx={{ width: 40 }} />
                  </Box>
                </Box>
              )}

              {hasCapturedPhoto && capturedImage && (
                <Box sx={{ position: 'relative', width: '100%', bgcolor: '#000' }}>
                  <img
                    src={capturedImage}
                    alt="Captured"
                    style={{
                      width: '100%',
                      height: 'auto',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                </Box>
              )}
            </DialogContent>

            {hasCapturedPhoto && (
              <DialogActions sx={{
                bgcolor: '#000',
                px: 3,
                py: 2,
                justifyContent: 'center',
                gap: 2
              }}>
                <Button
                  variant="outlined"
                  onClick={retakePhoto}
                  startIcon={<RetakeIcon />}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Retake
                </Button>
                <Button
                  variant="contained"
                  onClick={usePhoto}
                  startIcon={<CheckIcon />}
                  sx={{
                    bgcolor: '#4caf50',
                    '&:hover': { bgcolor: '#43a047' }
                  }}
                >
                  Use Photo
                </Button>
              </DialogActions>
            )}
          </Dialog>

          {!isSharing && !isReelEdit && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {aiMediaUrl
                ? 'AI-generated media is attached. You can add a caption above.'
                : isLiveRecording
                  ? 'Live recorded video is attached. Add a caption and post!'
                  : showPollCreator
                    ? 'Polls cannot include media attachments'
                    : selectedMedia.some(m => m.type === 'video')
                      ? 'Video selected. You cannot add more media with a video.'
                      : selectedMedia.length >= 4
                        ? 'Maximum 4 media files allowed'
                        : 'Add up to 4 images or 1 video. Use camera to take a photo. Tag friends to share with them.'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePost}
            startIcon={
              isLoading ? <CircularProgress size={20} /> :
                isSharing ? <SendIcon /> :
                  isReelEdit ? <ReelIcon /> :
                    showScheduler ? <ClockIcon /> :
                      aiMediaUrl ? <AIIcon /> :
                        isLiveRecording ? <LiveTvIcon /> :
                          <SendIcon />
            }
            disabled={isLoading || (isSharing ? false : (!canPost || !!scheduleError))}
            sx={{
              bgcolor: isSharing ? '#1976d2' :
                isReelEdit ? '#9c27b0' :
                  showScheduler ? '#F57C00' :
                    aiMediaUrl ? '#3b82f6' :
                      isLiveRecording ? '#f44336' : undefined,
              '&:hover': {
                bgcolor: isSharing ? '#1565c0' :
                  isReelEdit ? '#7b1fa2' :
                    showScheduler ? '#E65100' :
                      aiMediaUrl ? '#2563eb' :
                        isLiveRecording ? '#d32f2f' : undefined,
              }
            }}
          >
            {isLoading ?
              (isSharingPost ? 'Sharing...' :
                isUpdatingPost ? 'Updating...' :
                  isUpdatingReelInfo ? 'Updating Reel...' :
                    isCreatingPoll ? 'Creating Poll...' :
                      'Posting...') :
              isSharing ? 'Share Post' :
                isReelEdit ? 'Update Reel' :
                  isEditing ? 'Update Post' :
                    showScheduler ? 'Schedule Post' :
                      showPollCreator ? 'Create Poll' :
                        aiMediaUrl ? 'Post with AI Content' :
                          isLiveRecording ? 'Post Live Video' :
                            'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Products Dialog */}
      <Dialog
        open={showProductTagDialog}
        onClose={handleProductTagDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          Tag Products
          <IconButton
            onClick={handleProductTagDialogClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <XIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 0, pt: 2 }}>
          <Box sx={{ px: 3, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={productSearchQuery}
              onChange={(e) => {
                setProductSearchQuery(e.target.value);
                // Debounced search could be implemented here
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchProducts();
                }
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: loadingProducts ? (
                  <CircularProgress size={20} />
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => fetchProducts()}
                    disabled={loadingProducts}
                  >
                    <SearchIcon />
                  </IconButton>
                )
              }}
            />
          </Box>

          {taggedProducts.length > 0 && (
            <Box sx={{ px: 3, mb: 1 }}>
              <Typography variant="body2" color="secondary" fontWeight={600}>
                {taggedProducts.length} {taggedProducts.length === 1 ? 'product' : 'products'} tagged
              </Typography>
            </Box>
          )}

          {loadingProducts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : productsError ? (
            <Box sx={{ px: 3 }}>
              <Alert severity="error" onClose={() => setProductsError('')}>
                {productsError}
              </Alert>
            </Box>
          ) : availableProducts.length === 0 ? (
            <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {productSearchQuery ? 'No products found matching your search' : 'No products available to tag'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {availableProducts
                .filter(product =>
                  productSearchQuery === '' ||
                  product.productName.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                  product.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
                )
                .map(product => {
                  const isTagged = taggedProducts.some(p => p.productId === product.productId);
                  return (
                    <ListItem key={product.productId} disablePadding>
                      <ListItemButton onClick={() => toggleProductTag(product)}>
                        <Checkbox edge="start" checked={isTagged} tabIndex={-1} disableRipple />
                        <ListItemAvatar>
                          <Avatar
                            src={product.productImage || undefined}
                            sx={{ width: 40, height: 40 }}
                            variant="rounded"
                          >
                            {product.productName[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight={600}>
                              {product.productName}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {product.currency} {product.price}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {product.sku}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleProductTagDialogClose}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleProductTagDialogClose}>
            Done ({taggedProducts.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Campaign Selection Dialog */}
<Dialog
  open={showCampaignDialog}
  onClose={handleCampaignDialogClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{ sx: { borderRadius: 2 } }}
>
  <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CampaignIcon sx={{ color: '#FF9800' }} />
      Link to Campaign
    </Box>
    <IconButton
      onClick={handleCampaignDialogClose}
      sx={{ position: 'absolute', right: 8, top: 8 }}
    >
      <XIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent sx={{ px: 0, pt: 2 }}>
    <Box sx={{ px: 3, mb: 2 }}>
      <TextField
        fullWidth
        placeholder="Search campaigns..."
        value={campaignSearchQuery}
        onChange={(e) => setCampaignSearchQuery(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>

    {selectedCampaign && (
      <Box sx={{ px: 3, mb: 1 }}>
        <Chip
          icon={<CampaignIcon sx={{ fontSize: 16 }} />}
          label={`Selected: ${selectedCampaign.campaignName}`}
          onDelete={handleRemoveCampaign}
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
      </Box>
    )}

    {loadingCampaigns ? (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    ) : campaignsError ? (
      <Box sx={{ px: 3 }}>
        <Alert severity="error" onClose={() => setCampaignsError('')}>
          {campaignsError}
        </Alert>
      </Box>
    ) : filteredCampaigns.length === 0 ? (
      <Box sx={{ px: 3, py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {campaignSearchQuery ? 'No campaigns found matching your search' : 'No active campaigns available'}
        </Typography>
      </Box>
    ) : (
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {filteredCampaigns.map(campaign => {
          const isSelected = selectedCampaign?.campaignId === campaign.campaignId;
          return (
            <ListItem key={campaign.campaignId} disablePadding>
              <ListItemButton
                onClick={() => handleSelectCampaign(campaign)}
                selected={isSelected}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 152, 0, 0.15)'
                      : '#FFF3E0',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 152, 0, 0.25)'
                        : '#FFE0B2',
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: isSelected ? '#FF9800' : 'grey.400',
                      width: 40,
                      height: 40
                    }}
                  >
                    <CampaignIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" fontWeight={600}>
                        {campaign.campaignName}
                      </Typography>
                      {isSelected && (
                        <CheckIcon sx={{ fontSize: 18, color: '#FF9800' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {campaign.description && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300
                        }}>
                          {campaign.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${campaign.paymentCurrency} ${campaign.budgetPerCreator > 0 ? campaign.budgetPerCreator : campaign.totalBudget}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Chip
                          label={`${campaign.kpiType}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                          variant="outlined"
                        />
                        <Chip
                          label={`Ends: ${campaign.endDate}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                          variant="outlined"
                        />
                      </Box>
                      {campaign.hashtags && campaign.hashtags.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {campaign.hashtags.map((tag, idx) => (
                            <Typography key={idx} variant="caption" sx={{ color: '#FF9800', fontWeight: 500 }}>
                              {tag}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    )}
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={handleCampaignDialogClose}>Cancel</Button>
    <Button
      variant="contained"
      onClick={handleCampaignDialogClose}
      sx={{
        bgcolor: '#FF9800',
        '&:hover': { bgcolor: '#F57C00' }
      }}
    >
      {selectedCampaign ? 'Done' : 'Close'}
    </Button>
  </DialogActions>
</Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbar-root': {
            bottom: '24px !important',
            right: '24px !important',
          }
        }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            backgroundColor: snackbar.severity === 'success' ? '#1B5E20' : undefined,
            color: snackbar.severity === 'success' ? '#ffffff' : undefined,
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? '#ffffff' : undefined,
            },
            '& .MuiAlert-action': {
              color: snackbar.severity === 'success' ? '#ffffff' : undefined,
            },
            '& .MuiIconButton-root': {
              color: snackbar.severity === 'success' ? '#ffffff' : undefined,
              '&:hover': {
                backgroundColor: snackbar.severity === 'success' ? 'rgba(255,255,255,0.1)' : undefined,
              }
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default CreatePostDialog;