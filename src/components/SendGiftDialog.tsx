'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Badge,
  Skeleton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { useRouter } from 'next/navigation'
import { tokenCookie } from '../hooks/useAuthRedirect';


// API Base URL
const MONETIZE_SERVICE_URL = 'https://institutional-bo.paybito.com:8443/MonetizeService'
const BROKER_ADMIN_API = 'https://institutional-bo.paybito.com:8443/BrokerAdminApi'

// Gift interface based on API response
interface Gift {
  giftId: number
  giftCode: string
  giftName: string
  priceAmount: number
  priceCurrency: string
  iconPath: string
}

interface GiftApiResponse {
  success: boolean
  message: string
  data: Gift[]
  errorCode: string | null
  totalRecords: number | null
}

interface SendGiftApiResponse {
  success: boolean
  message: string
  data: unknown
  errorCode: string | null
}

// Balance API Response
interface BalanceResponse {
  error: {
    error_data: number
    error_msg: string
  }
  userBalanceList: Array<{
    currencyCode: string
    currencyName: string
    closingBalance: number
    totalBalance: number
    sendAccess: number
    receiveAccess: number
    lastPrice: string
    holdingInUsd: number
  }>
  totalCount: number
  checkBeforeBuy: boolean
  transactionId: number
  usdValue: number
}

// Selected gift with quantity
interface SelectedGift {
  gift: Gift
  quantity: number
}

interface SendGiftDialogProps {
  open: boolean
  onClose: () => void
  recipientName: string
  recipientUserId: string
  recipientPageId?: string
  userBalance: number
  onBalanceUpdate: (newBalance: number) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const SendGiftDialog: React.FC<SendGiftDialogProps> = ({
  open,
  onClose,
  recipientName,
  recipientUserId,
  recipientPageId,
  userBalance,
  onBalanceUpdate,
  onSuccess,
  onError,
}) => {
  // State
  const router = useRouter()
  const [gifts, setGifts] = useState<Gift[]>([])
  const [selectedGifts, setSelectedGifts] = useState<Map<number, SelectedGift>>(new Map())
  const [giftMessage, setGiftMessage] = useState('')
  const [isLoadingGifts, setIsLoadingGifts] = useState(false)
  const [isSendingGift, setIsSendingGift] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [realBalance, setRealBalance] = useState<number>(userBalance)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)

  // Get current user ID
  const currentUserId = localStorage.getItem('childUserId') || '0'

  

  // Fetch gifts and balance on dialog open
  useEffect(() => {
    if (open) {
      fetchGifts()
      fetchUserBalance()
    }
  }, [open])

  // Fetch user balance from API
  const fetchUserBalance = async () => {
    setIsLoadingBalance(true)
    try {
      const adminUser = localStorage.getItem('uuid') 
      const userUuid = localStorage.getItem('financeHubUuid') 
      
      const response = await fetch(
        `${BROKER_ADMIN_API}/finance-hub/getUserBalance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authorization': `bearer ${tokenCookie.get()}`

          },
          body: JSON.stringify({
            adminUser,
            userUuid
          })
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: BalanceResponse = await response.json()

      if (result.error.error_data === 0 && result.userBalanceList) {
        // Find USDB balance
        const usdbBalance = result.userBalanceList.find(
          (currency) => currency.currencyCode === 'USDB'
        )
        
        if (usdbBalance) {
          setRealBalance(usdbBalance.closingBalance)
        } else {
          setRealBalance(0)
          onError('USDB balance not found')
        }
      } else {
        throw new Error(result.error.error_msg || 'Failed to fetch balance')
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
      // Keep current balance on error
      setRealBalance(userBalance)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Fetch all gifts from API
  const fetchGifts = async () => {
    setIsLoadingGifts(true)
    setLoadError(null)

    try {
      const response = await fetch(
        `${MONETIZE_SERVICE_URL}/giftsBadges/getAllGiftTypes/${recipientUserId}`,
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

      const result: GiftApiResponse = await response.json()

      if (result.success && result.data) {
        setGifts(result.data)
      } else {
        throw new Error(result.message || 'Failed to fetch gifts')
      }
    } catch (error) {
      console.error('Error fetching gifts:', error)
      setLoadError(error instanceof Error ? error.message : 'Failed to load gifts')
    } finally {
      setIsLoadingGifts(false)
    }
  }

  // Calculate total price
  const calculateTotalPrice = (): number => {
    let total = 0
    selectedGifts.forEach((selectedGift) => {
      total += selectedGift.gift.priceAmount * selectedGift.quantity
    })
    return total
  }

  // Handle gift selection (add/increase quantity)
  const handleAddGift = (gift: Gift) => {
    setSelectedGifts((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(gift.giftId)

      if (existing) {
        newMap.set(gift.giftId, {
          ...existing,
          quantity: existing.quantity + 1
        })
      } else {
        newMap.set(gift.giftId, {
          gift,
          quantity: 1
        })
      }

      return newMap
    })
  }

  // Handle gift removal (decrease quantity)
  const handleRemoveGift = (giftId: number) => {
    setSelectedGifts((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(giftId)

      if (existing) {
        if (existing.quantity > 1) {
          newMap.set(giftId, {
            ...existing,
            quantity: existing.quantity - 1
          })
        } else {
          newMap.delete(giftId)
        }
      }

      return newMap
    })
  }

  // Get quantity for a specific gift
  const getGiftQuantity = (giftId: number): number => {
    return selectedGifts.get(giftId)?.quantity || 0
  }

  // Build array of gift IDs for API
  const buildGiftIdsArray = (): number[] => {
    const giftIds: number[] = []

    selectedGifts.forEach((selectedGift) => {
      const { giftId } = selectedGift.gift
      for (let i = 0; i < selectedGift.quantity; i++) {
        giftIds.push(Number(giftId))
      }
    })

    console.log('Gift IDs array:', giftIds) // Debug log
    return giftIds
  }

  // Get selected gifts summary for display
  const getSelectedGiftsSummary = (): string => {
    if (selectedGifts.size === 0) return '-'

    const summaryParts: string[] = []
    selectedGifts.forEach((selectedGift) => {
      if (selectedGift.quantity > 1) {
        summaryParts.push(`${selectedGift.gift.giftName} x${selectedGift.quantity}`)
      } else {
        summaryParts.push(selectedGift.gift.giftName)
      }
    })

    return summaryParts.join(', ')
  }

  // Get total gift count
  const getTotalGiftCount = (): number => {
    let count = 0
    selectedGifts.forEach((selectedGift) => {
      count += selectedGift.quantity
    })
    return count
  }

  // Send gift API call
  const handleSendGift = async () => {
    if (selectedGifts.size === 0) {
      onError('Please select at least one gift')
      return
    }

    const totalPrice = calculateTotalPrice()

    if (realBalance < totalPrice) {
      onError('Insufficient balance. Please add funds.')
      return
    }

    setIsSendingGift(true)

    try {
      const giftIdsArray = buildGiftIdsArray()
      
      const payload = {
        senderUserId: parseInt(currentUserId),
        receiverUserId: parseInt(recipientUserId),
        giftId: giftIdsArray, // Changed to array
        giftMessage: giftMessage.trim() || null
      }

      console.log('Payload being sent:', JSON.stringify(payload)) // Debug log

      const response = await fetchWithAuth(
        `${MONETIZE_SERVICE_URL}/giftsBadges/sendGift`,
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

      const result: SendGiftApiResponse = await response.json()

      if (result.success) {
        // Update local balance
        const newBalance = realBalance - totalPrice
        setRealBalance(newBalance)
        
        // Notify parent
        onBalanceUpdate(newBalance)

        // Build success message
        const giftCount = getTotalGiftCount()
        const giftText = giftCount > 1 ? `${giftCount} gifts` : 'gift'
        onSuccess(`🎁 Sent ${giftText} to ${recipientName}!`)

        handleClose()
      } else {
        throw new Error(result.message || 'Failed to send gift')
      }
    } catch (error) {
      console.error('Error sending gift:', error)
      onError(error instanceof Error ? error.message : 'Failed to send gift. Please try again.')
    } finally {
      setIsSendingGift(false)
    }
  }

  // Reset and close dialog
  const handleClose = () => {
    setSelectedGifts(new Map())
    setGiftMessage('')
    setLoadError(null)
    onClose()
  }

  const totalPrice = calculateTotalPrice()
  const totalGiftCount = getTotalGiftCount()

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
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
    🎁 Send Gifts to {recipientName}
  </Typography>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'action.hover',
        px: 2,
        py: 1,
        borderRadius: 3,
        border: 1,
        borderColor: 'divider',
        minWidth: 220
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Your Balance:
      </Typography>
      {isLoadingBalance ? (
        <CircularProgress size={16} sx={{ color: 'primary.main' }} />
      ) : (
        <Typography variant="body1" fontWeight="600" color="primary">
          ${realBalance.toFixed(2)}
        </Typography>
      )}
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
        onClick={() => router.push('/bitodollar-wallet')}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '0.75rem',
          py: 0.5,
          px: 1.5,
          minWidth: 'auto',
          bgcolor: '#1e40af',
          '&:hover': { bgcolor: '#1e3a8a' }
        }}
      >
        Add Funds
      </Button>
    </Box>
    <IconButton onClick={handleClose} size="small">
      <CloseIcon />
    </IconButton>
  </Box>
</DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Loading State */}
        {isLoadingGifts ? (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(3, 1fr)',
                  md: 'repeat(4, 1fr)',
                  lg: 'repeat(5, 1fr)'
                },
                gap: 2
              }}
            >
              {[...Array(8)].map((_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={160}
                  sx={{ borderRadius: 3 }}
                />
              ))}
            </Box>
          </Box>
        ) : loadError ? (
          /* Error State */
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
            <Button
              variant="outlined"
              onClick={fetchGifts}
              sx={{ textTransform: 'none' }}
            >
              Retry
            </Button>
          </Box>
        ) : (
          <>
            {/* Selected Gifts Count Badge */}
            {totalGiftCount > 0 && (
              <Box
                sx={{
                  mx: 3,
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(30, 64, 175, 0.08)',
                  border: 1,
                  borderColor: 'rgba(30, 64, 175, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="body2" color="primary" fontWeight="600">
                  🎁 {totalGiftCount} gift{totalGiftCount > 1 ? 's' : ''} selected
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setSelectedGifts(new Map())}
                  sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                >
                  Clear All
                </Button>
              </Box>
            )}

            {/* Gift Grid */}
<Box sx={{ p: 3 }}>
  <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
    Select Gifts (tap to add, you can select multiple)
  </Typography>
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(2, 1fr)',
        sm: 'repeat(3, 1fr)',
        md: 'repeat(4, 1fr)',
        lg: 'repeat(5, 1fr)'
      },
      gap: 2
    }}
  >
    {gifts.map((gift) => {
      const quantity = getGiftQuantity(gift.giftId)
      const isSelected = quantity > 0

      return (
        <Box
          key={gift.giftId}
          sx={{
            p: 2,
            borderRadius: 3,
            border: 2,
            borderColor: isSelected ? '#1e40af' : 'divider',
            bgcolor: isSelected ? 'rgba(30, 64, 175, 0.08)' : 'background.paper',
            textAlign: 'center',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: '#1e40af',
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 24px rgba(30, 64, 175, 0.2)'
            }
          }}
        >
          {/* Quantity Badge */}
          {isSelected && (
            <Badge
              badgeContent={quantity}
              color="primary"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  minWidth: 22,
                  height: 22,
                  borderRadius: '50%'
                }
              }}
            />
          )}

          {/* Gift Emoji */}
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem', // Larger font size for emoji
              lineHeight: 1,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
              userSelect: 'none'
            }}
          >
            {gift.giftCode}
          </Box>

          {/* Gift Name */}
          <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
            {gift.giftName}
          </Typography>

          {/* Gift Price */}
          <Typography variant="h6" fontWeight="700" color="primary" sx={{ mb: 1.5 }}>
            ${gift.priceAmount}
          </Typography>

          {/* Add/Remove Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            {isSelected && (
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveGift(gift.giftId)
                }}
                sx={{
                  bgcolor: 'error.main',
                  color: 'white',
                  width: 28,
                  height: 28,
                  '&:hover': {
                    bgcolor: 'error.dark'
                  }
                }}
              >
                <RemoveIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}

            <Button
              variant={isSelected ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handleAddGift(gift)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.8rem',
                px: 2,
                minWidth: 'auto',
                bgcolor: isSelected ? '#1e40af' : 'transparent',
                borderColor: '#1e40af',
                color: isSelected ? 'white' : '#1e40af',
                '&:hover': {
                  bgcolor: isSelected ? '#1e3a8a' : 'rgba(30, 64, 175, 0.08)',
                  borderColor: '#1e40af'
                }
              }}
            >
              <AddIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Add
            </Button>
          </Box>
        </Box>
      )
    })}
  </Box>
</Box>

            {/* Message Input */}
            <Box sx={{ px: 3, pb: 2 }}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                Add a message (optional)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Write a personal message to accompany your gift..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value.slice(0, 200))}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
                {giftMessage.length} / 200 characters
              </Typography>
            </Box>

            {/* Summary Section */}
            <Box
              sx={{
                mx: 3,
                mb: 3,
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.1), rgba(30, 58, 138, 0.05))',
                border: 1,
                borderColor: 'rgba(30, 64, 175, 0.3)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Selected Gifts</Typography>
                <Typography
                  variant="body2"
                  fontWeight="600"
                  sx={{
                    maxWidth: '60%',
                    textAlign: 'right',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {getSelectedGiftsSummary()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Total Gifts</Typography>
                <Typography variant="body2" fontWeight="600">
                  {totalGiftCount} gift{totalGiftCount !== 1 ? 's' : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">Platform Fee (0%)</Typography>
                <Typography variant="body2" fontWeight="600">$0.00</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1 }}>
                <Typography variant="body1" fontWeight="600">Total Amount</Typography>
                <Typography variant="h6" fontWeight="700" color="primary">
                  ${totalPrice.toFixed(2)}
                </Typography>
              </Box>

              {/* Insufficient Balance Warning */}
              {totalPrice > realBalance && totalPrice > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Insufficient balance. You need ${(totalPrice - realBalance).toFixed(2)} more.
                </Alert>
              )}
            </Box>

            {/* Send Gift Button */}
            <Box sx={{ px: 3, pb: 3 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSendGift}
                disabled={selectedGifts.size === 0 || isSendingGift || totalPrice > realBalance}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
                  boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(30, 64, 175, 0.4)'
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    background: 'linear-gradient(135deg, #1e40af, #1e3a8a)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {isSendingGift ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    Sending...
                  </Box>
                ) : (
                  `Send ${totalGiftCount > 0 ? totalGiftCount : ''} Gift${totalGiftCount !== 1 ? 's' : ''} - $${totalPrice.toFixed(2)}`
                )}
              </Button>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SendGiftDialog