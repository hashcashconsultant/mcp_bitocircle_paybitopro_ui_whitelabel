'use client'

import React, { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  CircularProgress,
  Avatar,
  Divider,
  Link,
} from '@mui/material'
import {
  Close as CloseIcon,
  Groups as GroupsIcon,
  Lock as LockIcon,
  Videocam as VideocamIcon,
  Poll as PollIcon,
  Star as StarIcon,
  EmojiEvents as BadgeIcon,
  Reply as ReplyIcon,
  BlockOutlined as AdFreeIcon,
  AccessTime as EarlyAccessIcon,
  QuestionAnswer as QAIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'

const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService'

// Feature icon mapping based on feature name keywords
const getFeatureIcon = (featureName: string) => {
  const name = featureName.toLowerCase()
  
  if (name.includes('group') || name.includes('community')) {
    return <GroupsIcon sx={{ color: 'white' }} />
  }
  if (name.includes('exclusive') && (name.includes('post') || name.includes('content'))) {
    return <LockIcon sx={{ color: 'white' }} />
  }
  if (name.includes('video') || name.includes('live') || name.includes('broadcast')) {
    return <VideocamIcon sx={{ color: 'white' }} />
  }
  if (name.includes('poll')) {
    return <PollIcon sx={{ color: 'white' }} />
  }
  if (name.includes('badge') || name.includes('highlight')) {
    return <BadgeIcon sx={{ color: 'white' }} />
  }
  if (name.includes('reply') || name.includes('priorit')) {
    return <ReplyIcon sx={{ color: 'white' }} />
  }
  if (name.includes('ad-free') || name.includes('ad free')) {
    return <AdFreeIcon sx={{ color: 'white' }} />
  }
  if (name.includes('early access')) {
    return <EarlyAccessIcon sx={{ color: 'white' }} />
  }
  if (name.includes('qa') || name.includes('q&a') || name.includes('session')) {
    return <QAIcon sx={{ color: 'white' }} />
  }
  
  // Default icon
  return <StarIcon sx={{ color: 'white' }} />
}

// Feature description mapping
const getFeatureDescription = (featureName: string, creatorName: string): string => {
  const name = featureName.toLowerCase()
  
  if (name.includes('group') || name.includes('community')) {
    return `A place for subscribers of ${creatorName} to discuss topics and see exclusive posts.`
  }
  if (name.includes('exclusive') && (name.includes('post') || name.includes('content'))) {
    return `Posts, videos, photos and polls that only subscribers can see.`
  }
  if (name.includes('video') || name.includes('live') || name.includes('broadcast')) {
    return `Exclusive Broadcasts only accessible to subscribers of ${creatorName}.`
  }
  if (name.includes('poll')) {
    return `Participate in exclusive polls and surveys from ${creatorName}.`
  }
  if (name.includes('badge') || name.includes('highlight')) {
    return `Get a special badge on your profile showing your support.`
  }
  if (name.includes('reply') || name.includes('priorit')) {
    return `Your messages and comments get priority attention from ${creatorName}.`
  }
  if (name.includes('ad-free') || name.includes('ad free')) {
    return `Enjoy content without any advertisements or interruptions.`
  }
  if (name.includes('early access')) {
    return `Get early access to new content before anyone else.`
  }
  if (name.includes('qa') || name.includes('q&a') || name.includes('session')) {
    return `Join monthly Q&A sessions with ${creatorName}.`
  }
  
  return `Exclusive benefit for subscribers of ${creatorName}.`
}

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

interface SubscriptionDialogProps {
  open: boolean
  onClose: () => void
  subscriptionDetails: SubscriptionDetails | null
  creatorName: string
  creatorProfileImage: string | null
  viewerProfileImage: string | null
  onSubscribe: () => Promise<void>
  isSubscribing: boolean
}

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({
  open,
  onClose,
  subscriptionDetails,
  creatorName,
  creatorProfileImage,
  viewerProfileImage,
  onSubscribe,
  isSubscribing,
}) => {
  if (!subscriptionDetails) {
    return null
  }

  const formatPrice = (price: number, period: string): string => {
    // Format period for display
    const formattedPeriod = period.toLowerCase().replace('_', ' ')
    return `$${price.toFixed(2)} per ${formattedPeriod.replace('1 ', '')} | Cancel anytime`
  }

  const handleSubscribe = async () => {
    await onSubscribe()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }
      }}
    >
      {/* Header with back and close buttons */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton onClick={onClose} size="small">
          <BackIcon />
        </IconButton>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Overlapping Avatars Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Viewer Avatar */}
            <Avatar
              src={viewerProfileImage || undefined}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1,
              }}
            >
              {!viewerProfileImage && 'Y'}
            </Avatar>
            
            {/* Creator Avatar - overlapping */}
            <Avatar
              src={creatorProfileImage || undefined}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                ml: -3,
                zIndex: 2,
              }}
            >
              {!creatorProfileImage && creatorName.charAt(0)}
            </Avatar>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Typography
            variant="subtitle1"
            fontWeight="600"
            sx={{ mb: 2, color: 'text.primary' }}
          >
            Included with subscription
          </Typography>

          {/* Features List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {subscriptionDetails.features.map((feature) => (
              <Box
                key={feature.featureId}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                {/* Icon Circle */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: '#00a884', // Teal/green color like in screenshot
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getFeatureIcon(feature.name)}
                </Box>

                {/* Feature Text */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="600"
                    sx={{ mb: 0.25, color: 'text.primary' }}
                  >
                    {feature.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', lineHeight: 1.4 }}
                  >
                    {getFeatureDescription(feature.name, creatorName)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Free Trial Notice */}
          {subscriptionDetails.freeTrialDays > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'rgba(0, 168, 132, 0.1)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CheckIcon sx={{ color: '#00a884', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: '#00a884', fontWeight: 500 }}>
                {subscriptionDetails.freeTrialDays}-day free trial included!
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bottom Section - Price & Subscribe */}
        <Box
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Price Display */}
          <Typography
            variant="body1"
            fontWeight="600"
            sx={{ textAlign: 'center', mb: 2, color: 'text.primary' }}
          >
            {formatPrice(subscriptionDetails.price, subscriptionDetails.minSubscriptionPeriod)}
          </Typography>

          {/* Subscribe Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSubscribe}
            disabled={isSubscribing}
            startIcon={!isSubscribing && <CheckIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              bgcolor: '#1e40af',
              '&:hover': {
                bgcolor: '#1e3a8a',
              },
              '&:disabled': {
                bgcolor: '#1e40af',
                opacity: 0.7,
              },
            }}
          >
            {isSubscribing ? (
              <CircularProgress size={24} sx={{ color: 'white' }} />
            ) : (
              'Subscribe'
            )}
          </Button>

          {/* Disclaimer */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              color: 'text.secondary',
              lineHeight: 1.5,
            }}
          >
            By subscribing, you agree to share your primary email address with {creatorName}. 
            Your subscription includes a recurring {subscriptionDetails.minSubscriptionPeriod.toLowerCase()} payment of ${subscriptionDetails.price.toFixed(2)} to support {creatorName}.
            By continuing, you agree to the{' '}
            <Link href="#" sx={{ color: '#1e40af' }}>
              Subscription terms
            </Link>
            .
          </Typography>

          {/* Provider Info */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 2,
              color: 'text.disabled',
            }}
          >
            Subscription provided by BitoHub |{' '}
            <Link href="#" sx={{ color: '#1e40af' }}>
              Help Center
            </Link>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionDialog