'use client'
import React, { useEffect, useRef } from 'react'
import { Box, Typography, Button } from '@mui/material'
import TextPostComponent from '@/components/posts/TextPostComponent'
import ImagePostComponent from '@/components/posts/ImagePostComponent'
import VideoPostComponent from '@/components/posts/VideoPostComponent'
import PollPostComponent from '@/components/posts/PollPostComponent'
import ReelPostComponent from '@/components/posts/ReelPostComponent'
import LiveStreamPostComponent from '@/components/posts/LiveStreamPostComponent'
import { PostSkeleton } from '@/components/posts/PostSkeletons'

// ==================== POST TYPES ====================

export type PostType = 'text' | 'image' | 'video' | 'poll' | 'reel' | 'livestream'

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
    isUserFollowing?: number
    isVerified?: boolean
    pageId?: number
    entityType?: string
    profilePicture?: string
  }
  content: string
  contentType?: string
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isSaved?: boolean
  isSponsored?: boolean
  cta?: string
  callToActionUrl?: string
  adHeadline?: string
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
  campaignId?: number
  isProductTagged?: number
  taggedProducts?: TaggedProduct[]
  isCommentAllowed?: number
  isGifAllowed?: number
}
export interface TaggedProduct {
  productId: number
  productName: string
  productType: string // "DIGITAL", "PHYSICAL", etc.
  productDescription: string
  productImageUrl: string
  productPrice: number
  shopOwnerId: number
  shopOwnerName: string
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
}

export interface ReelPost extends BasePost {
  type: 'reel'
  videoUrl: string
  thumbnailUrl?: string
  duration?: string
  views?: number
  title?: string
}

// ==================== LIVESTREAM POST TYPE ====================
export interface LiveStreamPost extends BasePost {
  type: 'livestream'
  streamId: string
  channelName: string
  agoraAppId: string
  title: string
  description?: string
  viewerCount: number
  streamStatus: string
  streamStartedAt: string
}

export type Post = TextPost | ImagePost | VideoPost | PollPost | ReelPost | LiveStreamPost

// ==================== COMPONENT PROPS ====================

interface FeedsComponentProps {
  posts?: Post[]
  onLike?: (postId: number) => void
  onSave?: (postId: number) => void
  onComment?: (postId: number) => void
  onShare?: (postId: number) => void
  onMoreOptions?: (postId: number) => void
  onVote?: (postId: number, optionId: number) => void
  onFollow?: (userId: number) => void
  onUnfollow?: (userId: number) => void
  onFollowSuccess?: (message: string) => void
  onFollowError?: (message: string) => void
  onEdit?: (postId: number) => void
  onDelete?: (postId: number) => void
  onNotInterested?: (postId: number) => void
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  error?: string | null
  isInitialLoad?: boolean
  onRetry?: () => void
  onStreamEnded?: (streamId: string) => void
}

// ==================== FEEDS COMPONENT ====================

const FeedsComponent: React.FC<FeedsComponentProps> = ({
  posts = [],
  onLike,
  onSave,
  onComment,
  onShare,
  onMoreOptions,
  onVote,
  onFollow,
  onUnfollow,
  onFollowSuccess,
  onFollowError,
  onEdit,
  onDelete,
  onNotInterested,
  onStreamEnded,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  error = null,
  isInitialLoad = false,
  onRetry
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!isLoading) {
      hasTriggeredRef.current = false
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true
          onLoadMore?.()
        }
      },
      {
        root: null,
        rootMargin: '400px',
        threshold: 0
      }
    )

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, onLoadMore])

  // Render individual post based on type
  const renderPost = (post: Post) => {
    // Common props for regular posts
    const commonProps = {
      id: post.id,
      user: post.user,
      content: post.content,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      isLiked: post.isLiked,
      isSaved: post.isSaved,
      onLike: () => onLike?.(post.id),
      onSave: () => onSave?.(post.id),
      onComment: () => onComment?.(post.id),
      onShare: () => onShare?.(post.id),
      onMoreOptions: () => onMoreOptions?.(post.id),
      onFollow: post.user.userId ? () => onFollow?.(post.user.userId!) : undefined,
      onUnfollow: post.user.userId ? () => onUnfollow?.(post.user.userId!) : undefined,
      onFollowSuccess,
      onFollowError,
      onEdit: () => onEdit?.(post.id),
      onDelete: () => onDelete?.(post.id),
      onNotInterested: () => onNotInterested?.(post.id),
      isSponsored: post.isSponsored,
      cta: post.cta,
      callToActionUrl: post.callToActionUrl,
      adHeadline: post.adHeadline,
      contentType: post.contentType,
      location: post.location,
      taggedUserIds: post.taggedUserIds,
      taggedData: post.taggedData,
      isTaggedPost: post.isTaggedPost,
      isSharedPost: post.isSharedPost,
      shareId: post.shareId,
      sharedByUserId: post.sharedByUserId,
      sharerUserName: post.sharerUserName,
      sharerFullName: post.sharerFullName,
      sharerProfilePicture: post.sharerProfilePicture,
      shareMessage: post.shareMessage,
      shareCreatedAt: post.shareCreatedAt,
      campaignId: post.campaignId,
      isProductTagged: post.isProductTagged,
      taggedProducts: post.taggedProducts,
      isCommentAllowed: post.isCommentAllowed,
      isGifAllowed: post.isGifAllowed,
    }

    switch (post.type) {
      case 'text':
        return <TextPostComponent key={post.id} {...commonProps} />

      case 'image':
        return (
          <ImagePostComponent
            key={post.id}
            {...commonProps}
            images={(post as ImagePost).images}
          />
        )

      case 'video':
        return (
          <VideoPostComponent
            key={post.id}
            {...commonProps}
            videoUrl={(post as VideoPost).videoUrl}
            thumbnailUrl={(post as VideoPost).thumbnailUrl}
            duration={(post as VideoPost).duration}
            views={(post as VideoPost).views}
          />
        )

      case 'reel':
        return (
          <ReelPostComponent
            key={post.id}
            {...commonProps}
            videoUrl={(post as ReelPost).videoUrl}
            thumbnailUrl={(post as ReelPost).thumbnailUrl}
            duration={(post as ReelPost).duration}
            views={(post as ReelPost).views}
          />
        )

      case 'poll':
        const pollPost = post as PollPost
        return (
          <PollPostComponent
            key={post.id}
            {...commonProps}
            question={pollPost.question}
            options={pollPost.options}
            totalVotes={pollPost.totalVotes}
            hasVoted={pollPost.hasVoted}
            votedOptionId={pollPost.votedOptionId}
            endTime={pollPost.endTime}
            onVote={(optionId) => onVote?.(post.id, optionId)}
          />
        )

      // ==================== LIVESTREAM RENDERING ====================
      case 'livestream':
        const livePost = post as LiveStreamPost
        return (
          <LiveStreamPostComponent
            key={`live-${livePost.streamId}`}
            streamId={livePost.streamId}
            channelName={livePost.channelName}
            agoraAppId={livePost.agoraAppId}
            title={livePost.title}
            description={livePost.description}
            viewerCount={livePost.viewerCount}
            likeCount={livePost.likes}
            streamStatus={livePost.streamStatus}
            streamStartedAt={livePost.streamStartedAt}
            user={livePost.user}
            onFollow={livePost.user.userId ? () => onFollow?.(livePost.user.userId!) : undefined}
            onUnfollow={livePost.user.userId ? () => onUnfollow?.(livePost.user.userId!) : undefined}
            onFollowSuccess={onFollowSuccess}
            onFollowError={onFollowError}
            onStreamEnded={onStreamEnded}
          />
        )

      default:
        return null
    }
  }

  if (isInitialLoad && isLoading && posts.length === 0) {
    return (
      <>
        <PostSkeleton variant="text" />
        <PostSkeleton variant="image" />
        <PostSkeleton variant="poll" />
      </>
    )
  }

  const triggerIndex = Math.max(0, posts.length - 3)

  return (
    <>
      {posts.map((post, index) => (
        <React.Fragment key={
          post.type === 'livestream'
            ? `live-${(post as LiveStreamPost).streamId}`
            : post.isSharedPost && post.shareId
              ? `share-${post.shareId}`
              : `post-${post.id}`
        }>
          {renderPost(post)}

          {index === triggerIndex && hasMore && (
            <div ref={triggerRef} style={{ height: 1, background: 'transparent' }} />
          )}
        </React.Fragment>
      ))}

      {isLoading && posts.length > 0 && (
        <>
          <PostSkeleton variant="text" />
          <PostSkeleton variant="image" />
        </>
      )}

      {!isLoading && !hasMore && posts.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 3,
            minHeight: 80
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No more posts to load
          </Typography>
        </Box>
      )}

      {error && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body2" color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={onRetry}
            sx={{ textTransform: 'none' }}
          >
            Retry
          </Button>
        </Box>
      )}
    </>
  )
}

export default FeedsComponent