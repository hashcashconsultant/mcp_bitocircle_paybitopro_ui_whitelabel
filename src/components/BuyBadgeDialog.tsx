'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  CircularProgress,
  Skeleton,
  Chip,
} from '@mui/material'
import { Close as CloseIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material'

const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService'

// Static badge design data - keyed by badge name keywords for flexible matching
const badgeDesignData: Record<string, {
  emoji: string
  color: string
  bgGradient: string
  benefits: string[]
  displayOrder: number
  displayName: string
}> = {
  bronze: {
    emoji: '🥉',
    color: '#CD7F32',
    bgGradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(184, 115, 51, 0.05))',
    benefits: ['Supporter badge on profile', 'Priority in comments', 'Exclusive emoji reactions'],
    displayOrder: 1,
    displayName: 'Bronze Supporter',
  },
  silver: {
    emoji: '🥈',
    color: '#C0C0C0',
    bgGradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(184, 184, 184, 0.05))',
    benefits: ['All Bronze benefits', 'Priority replies', 'Exclusive content access', 'Monthly video calls'],
    displayOrder: 2,
    displayName: 'Silver Supporter',
  },
  gold: {
    emoji: '🏆',
    color: '#FFD700',
    bgGradient: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 199, 0, 0.05))',
    benefits: ['All Silver benefits', '1-on-1 monthly consultation', 'Early access to content', 'Custom shoutouts'],
    displayOrder: 3,
    displayName: 'Gold Supporter',
  },
  diamond: {
    emoji: '💎',
    color: '#87ceeb',
    bgGradient: 'linear-gradient(135deg, rgba(185, 242, 255, 0.15), rgba(135, 206, 235, 0.05))',
    benefits: ['All Gold benefits', 'Weekly 1-on-1 sessions', 'Co-creation opportunities', 'Revenue sharing (2%)', 'VIP Discord access'],
    displayOrder: 4,
    displayName: 'Diamond VIP',
  },
}

// API Response types
interface BadgeTypeResponse {
  badgeId: number
  badgeCode: string
  badgeName: string
  priceAmount: number
  priceCurrency: string
  isLifetime: string
  isAlreadyAssigned: 'Y' | 'N'
  purchaseCount?: number
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errorCode: string | null
  totalRecords: number | null
}

// Combined badge type with design + API data
interface BadgeTier {
  badgeId: number
  badgeCode: string
  badgeName: string
  priceAmount: number
  priceCurrency: string
  isLifetime: string
  isAlreadyAssigned: 'Y' | 'N'
  purchaseCount?: number
  emoji: string
  color: string
  bgGradient: string
  benefits: string[]
  displayOrder: number
  displayName: string
}

interface BuyBadgeDialogProps {
  open: boolean
  onClose: () => void
  recipientName: string
  recipientUserId: string
  recipientPageId?: string
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const BuyBadgeDialog: React.FC<BuyBadgeDialogProps> = ({
  open,
  onClose,
  recipientName,
  recipientUserId,
  recipientPageId,
  onSuccess,
  onError,
}) => {
  const [badgeTiers, setBadgeTiers] = useState<BadgeTier[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [purchasing, setPurchasing] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate the highest purchased badge price to disable lower/equal tiers
  const highestPurchasedPrice = useMemo(() => {
    const purchasedBadges = badgeTiers.filter(b => b.isAlreadyAssigned === 'Y')
    if (purchasedBadges.length === 0) return -1
    return Math.max(...purchasedBadges.map(b => b.priceAmount))
  }, [badgeTiers])

  // Fetch badge types when dialog opens
  useEffect(() => {
    if (open) {
      fetchBadgeTypes()
    }
  }, [open])

  // Helper function to get design data by matching badge name
  const getDesignDataForBadge = (badgeName: string) => {
    const normalizedName = badgeName?.trim().toLowerCase()

    for (const key of Object.keys(badgeDesignData)) {
      if (normalizedName.includes(key)) {
        return badgeDesignData[key]
      }
    }

    return null
  }

  const fetchBadgeTypes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${MONETIZE_SERVICE_URL}/giftsBadges/getAllBadgeTypes/${recipientUserId}/${localStorage.getItem('childUserId')}`)

      if (!response.ok) {
        throw new Error('Failed to fetch badge types')
      }

      const result: ApiResponse<BadgeTypeResponse[]> = await response.json()

      if (result.success && result.data) {
        const mergedBadges: BadgeTier[] = result.data
          .map((apiBadge) => {
            const designData = getDesignDataForBadge(apiBadge.badgeName)

            if (!designData) {
              console.warn(`No design data found for badge: "${apiBadge.badgeName}"`)
              return {
                ...apiBadge,
                emoji: apiBadge.badgeCode || '🏅',
                color: '#888888',
                bgGradient: 'linear-gradient(135deg, rgba(136, 136, 136, 0.15), rgba(100, 100, 100, 0.05))',
                benefits: ['Supporter badge on profile'],
                displayOrder: 99,
                displayName: apiBadge.badgeName || 'Supporter',
              }
            }

            return {
              ...apiBadge,
              ...designData,
            }
          })
          .sort((a, b) => a.displayOrder - b.displayOrder)

        setBadgeTiers(mergedBadges)
      } else {
        throw new Error(result.message || 'Failed to fetch badge types')
      }
    } catch (err) {
      console.error('Error fetching badge types:', err)
      setError('Failed to load badge types. Please try again.')
      onError('Failed to load badge types. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBadge = async (badge: BadgeTier) => {
    setPurchasing(badge.badgeId)
    try {
      const supporterUserId = localStorage.getItem('childUserId')

      if (!supporterUserId) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`${MONETIZE_SERVICE_URL}/giftsBadges/assignBadge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supporterUserId: parseInt(supporterUserId),
          creatorUserId: parseInt(recipientUserId),
          badgeId: badge.badgeId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to purchase badge')
      }

      const result: ApiResponse<{ success: boolean; availId: number; message: string }> = await response.json()

      if (result.success) {
        const priceDisplay = badge.isLifetime === 'Y'
          ? `${badge.priceAmount} ${badge.priceCurrency} (Lifetime)`
          : `${badge.priceAmount} ${badge.priceCurrency}/month`
        onSuccess(`Successfully purchased ${badge.badgeName} for ${priceDisplay}!`)
        onClose()
      } else {
        throw new Error(result.message || 'Failed to purchase badge')
      }
    } catch (err) {
      console.error('Error purchasing badge:', err)
      onError(err instanceof Error ? err.message : 'Failed to purchase badge. Please try again.')
    } finally {
      setPurchasing(null)
    }
  }

  const getButtonLabel = (badgeName: string): string => {
    const firstWord = badgeName?.split(' ')[0] || 'Badge'
    return firstWord
  }

  const renderSkeletonCards = () => (
    <>
      {[1, 2, 3, 4].map((index) => (
        <Box
          key={index}
          sx={{
            p: 3,
            borderRadius: 3,
            border: 2,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
          <Box sx={{ mb: 2, minHeight: 120 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="text" width="80%" sx={{ mx: 'auto', mb: 0.5 }} />
            ))}
          </Box>
          <Skeleton variant="text" width="40%" sx={{ mx: 'auto', mb: 0.5 }} />
          <Skeleton variant="text" width="30%" sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 2 }} />
        </Box>
      ))}
    </>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          🏆 Support {recipientName} with a Badge
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 4 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Choose a supporter tier to unlock exclusive benefits and show your support!
        </Typography>

        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            <Button variant="outlined" onClick={fetchBadgeTypes}>
              Try Again
            </Button>
          </Box>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)'
            },
            gap: 3
          }}
        >
          {loading ? (
            renderSkeletonCards()
          ) : (
            badgeTiers.map((badge) => {
              const isAssigned = badge.isAlreadyAssigned === 'Y'
              const isDisabled = badge.priceAmount <= highestPurchasedPrice

              return (
                <Box
                  key={badge.badgeId}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    border: 2,
                    borderColor: isDisabled ? 'divider' : badge.color,
                    background: isDisabled ? 'action.disabledBackground' : badge.bgGradient,
                    textAlign: 'center',
                    cursor: purchasing || isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isDisabled ? 0.5 : (purchasing && purchasing !== badge.badgeId ? 0.6 : 1),
                    position: 'relative',
                    filter: isDisabled ? 'grayscale(0.4)' : 'none',
                    '&:hover': {
                      transform: purchasing || isDisabled ? 'none' : 'translateY(-8px)',
                      boxShadow: purchasing || isDisabled ? 'none' : `0 12px 32px ${badge.color}40`
                    }
                  }}
                >
                  {/* Show "Purchased" indicator for owned badge */}
                  {isAssigned && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: 14, color: `${badge.color} !important` }} />}
                      label="Purchased"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        bgcolor: `${badge.color}20`,
                        color: badge.color,
                        borderColor: badge.color,
                        border: '1px solid',
                      }}
                    />
                  )}

                  {/* Optional: Show purchase count if API provides it */}
                  {badge.purchaseCount && badge.purchaseCount > 0 && (
                    <Chip
                      label={`×${badge.purchaseCount}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        bgcolor: `${badge.color}20`,
                        color: badge.color,
                      }}
                    />
                  )}

                  <Typography sx={{ fontSize: '3rem', mb: 2 }}>
                    {badge.emoji}
                  </Typography>
                  <Typography variant="h6" fontWeight="700" sx={{ mb: 1 }}>
                    {badge.displayName}
                  </Typography>
                  <Box sx={{ mb: 2, minHeight: 120 }}>
                    {badge.benefits.map((benefit, index) => (
                      <Typography
                        key={index}
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5, fontSize: '0.85rem' }}
                      >
                        • {benefit}
                      </Typography>
                    ))}
                  </Box>
                  <Typography variant="h4" fontWeight="700" sx={{ mb: 0.5 }}>
                    ${badge.priceAmount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {badge.isLifetime === 'Y' ? 'lifetime' : 'per month'}
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => !isDisabled && handleSelectBadge(badge)}
                    disabled={purchasing !== null || isDisabled}
                    sx={{
                      bgcolor: isDisabled ? 'grey.400' : badge.color,
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: isDisabled ? 'grey.400' : badge.color,
                        filter: isDisabled ? 'none' : 'brightness(1.1)'
                      },
                      '&:disabled': {
                        bgcolor: isDisabled ? 'grey.300' : badge.color,
                        color: isDisabled ? 'grey.500' : 'white',
                        opacity: isDisabled ? 1 : 0.7
                      }
                    }}
                  >
                    {purchasing === badge.badgeId ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : isAssigned ? (
                      'Already Purchased'
                    ) : isDisabled ? (
                      'Locked'
                    ) : (
                      `Purchase ${getButtonLabel(badge.badgeName)}`
                    )}
                  </Button>
                </Box>
              )
            })
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default BuyBadgeDialog