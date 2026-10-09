'use client'
import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Send as SendIcon,
  RequestPage as RequestIcon,
  Wallet as WalletIcon,
  Add as AddIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'REJECTED' | 'DECLINED' | 'EXPIRED'
export type PaymentType = 'SEND' | 'REQUEST'

export interface PaymentMessageData {
  paymentId: string
  messageId?: number
  amount: number
  type: PaymentType
  status: PaymentStatus
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  createdAt: string
  completedAt?: string
  conversationId?: number
  currency?: string
}

interface PaymentMessageProps {
  payment: PaymentMessageData
  isOwn: boolean
  currentUserId: string
  walletBalance: number
  onPayRequest: (payment: PaymentMessageData) => void
  onDeclineRequest: (payment: PaymentMessageData) => Promise<boolean>
  onAddFunds: () => void
  onFetchBalance?: () => void
  isProcessing?: boolean
  processingMessageId?: string | null
}

const PaymentMessage: React.FC<PaymentMessageProps> = ({
  payment,
  isOwn,
  currentUserId,
  walletBalance,
  onPayRequest,
  onDeclineRequest,
  onAddFunds,
  onFetchBalance,
  isProcessing = false,
  processingMessageId = null,
}) => {
  const [localProcessing, setLocalProcessing] = useState<'pay' | 'decline' | null>(null)
  const [error, setError] = useState('')

  // Fetch balance when this is a pending request that user needs to pay
  useEffect(() => {
    if (payment.type === 'REQUEST' && !isOwn && payment.status === 'PENDING' && onFetchBalance) {
      onFetchBalance()
    }
  }, [payment.type, isOwn, payment.status, onFetchBalance])

  // Format currency
  const formatCurrency = (value: number) => {
    return `B$ ${value.toFixed(2)}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if user has sufficient balance
  const hasSufficientBalance = walletBalance >= payment.amount

  // Check if this message is being processed
  const isThisProcessing = processingMessageId === payment.paymentId

  // Handle pay button click - opens payment dialog
  const handlePay = () => {
    setError('')
    onPayRequest(payment)
  }

  // Handle decline
  const handleDecline = async () => {
    setError('')
    setLocalProcessing('decline')
    try {
      const success = await onDeclineRequest(payment)
      if (!success) {
        setError('Failed to decline request. Please try again.')
      }
    } catch (err) {
      console.error('Decline error:', err)
      setError('An error occurred while declining request')
    } finally {
      setLocalProcessing(null)
    }
  }

  // Check if status is declined (handles both REJECTED and DECLINED)
  const isDeclined = payment.status === 'REJECTED' || payment.status === 'DECLINED'

  // Determine if this is a completed payment (SEND type is always completed)
  const isCompleted = payment.type === 'SEND' || payment.status === 'COMPLETED'

  // Get background color based on type, status, and ownership
  const getBackgroundColor = () => {
    if (isDeclined) {
      return 'rgba(239, 68, 68, 0.15)' // Red tint
    }
    if (isCompleted || payment.type === 'SEND') {
      return 'rgba(34, 197, 94, 0.15)' // Green tint for completed/sent
    }
    if (payment.type === 'REQUEST') {
      return 'rgba(249, 115, 22, 0.15)' // Orange tint for requests
    }
    return 'rgba(34, 197, 94, 0.15)'
  }

  const getBorderColor = () => {
    if (isDeclined) {
      return '#ef4444' // Red
    }
    if (isCompleted || payment.type === 'SEND') {
      return '#22c55e' // Green
    }
    if (payment.type === 'REQUEST') {
      return '#f97316' // Orange
    }
    return '#22c55e'
  }

  // Get status chip
  const getStatusChip = () => {
    // For SEND type, always show Completed
    if (payment.type === 'SEND') {
      return (
        <Chip
          label="Completed"
          size="small"
          icon={<CheckIcon sx={{ fontSize: 14 }} />}
          sx={{
            bgcolor: '#22c55e',
            color: 'white',
            fontWeight: 600,
            height: 22,
            fontSize: '0.7rem',
            '& .MuiChip-icon': { color: 'white' },
          }}
        />
      )
    }

    switch (payment.status) {
      case 'COMPLETED':
        return (
          <Chip
            label="Completed"
            size="small"
            icon={<CheckIcon sx={{ fontSize: 14 }} />}
            sx={{
              bgcolor: '#22c55e',
              color: 'white',
              fontWeight: 600,
              height: 22,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: 'white' },
            }}
          />
        )
      case 'PENDING':
        return (
          <Chip
            label="Pending"
            size="small"
            sx={{
              bgcolor: '#f97316',
              color: 'white',
              fontWeight: 600,
              height: 22,
              fontSize: '0.7rem',
            }}
          />
        )
      case 'REJECTED':
      case 'DECLINED':
        return (
          <Chip
            label="Declined"
            size="small"
            icon={<CancelIcon sx={{ fontSize: 14 }} />}
            sx={{
              bgcolor: '#ef4444',
              color: 'white',
              fontWeight: 600,
              height: 22,
              fontSize: '0.7rem',
              '& .MuiChip-icon': { color: 'white' },
            }}
          />
        )
      case 'EXPIRED':
        return (
          <Chip
            label="Expired"
            size="small"
            sx={{
              bgcolor: '#6b7280',
              color: 'white',
              fontWeight: 600,
              height: 22,
              fontSize: '0.7rem',
            }}
          />
        )
      default:
        return null
    }
  }

  // Get icon background color
  const getIconBgColor = () => {
    if (isDeclined) return '#ef4444'
    if (isCompleted || payment.type === 'SEND') return '#22c55e'
    return '#f97316'
  }

  // Get title text
  const getTitleText = () => {
    if (isDeclined) return 'Request Declined'
    if (payment.type === 'SEND') return 'Payment Sent'
    return 'Payment Request'
  }

  // Get amount label
  const getAmountLabel = () => {
    if (isDeclined) return 'Declined Amount'
    if (payment.type === 'SEND') {
      return isOwn ? 'You sent' : 'You received'
    }
    return isOwn ? 'You requested' : 'Requested Amount'
  }

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: getBackgroundColor(),
        border: '2px solid',
        borderColor: getBorderColor(),
        borderRadius: 3,
        maxWidth: 350,
        boxShadow: 2,
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: getIconBgColor(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDeclined ? (
                <CancelIcon sx={{ color: 'white', fontSize: 20 }} />
              ) : payment.type === 'SEND' ? (
                <SendIcon sx={{ color: 'white', fontSize: 20 }} />
              ) : (
                <RequestIcon sx={{ color: 'white', fontSize: 20 }} />
              )}
            </Box>
            <Box>
              <Typography variant="body2" fontWeight="bold" sx={{ color: 'text.primary' }}>
                {getTitleText()}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDate(payment.createdAt)}
              </Typography>
            </Box>
          </Box>
          {getStatusChip()}
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />

        {/* Amount Display */}
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {getAmountLabel()}
          </Typography>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              color: isDeclined
                ? '#ef4444'
                : isCompleted || payment.type === 'SEND'
                  ? '#22c55e'
                  : '#f97316',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              textDecoration: isDeclined ? 'line-through' : 'none',
            }}
          >
            {/* <MoneyIcon sx={{ fontSize: 32 }} /> */}
            {formatCurrency(payment.amount)}
          </Typography>
        </Box>

        {/* Transaction Details */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {payment.type === 'SEND' ? 'From:' : 'Requester:'}
              </Typography>
              <Typography variant="caption" fontWeight="600" sx={{ color: 'text.primary' }}>
                {payment.senderName}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                To:
              </Typography>
              <Typography variant="caption" fontWeight="600" sx={{ color: 'text.primary' }}>
                {payment.receiverName}
              </Typography>
            </Box>
            {(isCompleted || payment.status === 'COMPLETED') && payment.completedAt && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Completed:
                </Typography>
                <Typography variant="caption" fontWeight="600" sx={{ color: 'text.primary' }}>
                  {formatDate(payment.completedAt)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Payment Request Action Buttons (only for receiver of request and PENDING status) */}
        {payment.type === 'REQUEST' &&
          !isOwn &&
          payment.status === 'PENDING' && (
            <>
              {/* Wallet Balance Display */}
              <Alert
                severity={hasSufficientBalance ? 'info' : 'error'}
                icon={<WalletIcon />}
                sx={{
                  py: 0.5,
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight="600">
                    Wallet Balance: {formatCurrency(walletBalance)}
                  </Typography>
                  {!hasSufficientBalance && (
                    <Typography variant="caption" fontWeight="bold" color="error.main">
                      Insufficient Balance!
                    </Typography>
                  )}
                </Box>
              </Alert>

              {/* Error Message */}
              {error && (
                <Alert severity="error" sx={{ py: 0.5 }}>
                  <Typography variant="caption">{error}</Typography>
                </Alert>
              )}

              {/* Action Buttons */}
              <Stack direction="row" spacing={1}>
                {!hasSufficientBalance && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onAddFunds}
                    disabled={localProcessing !== null || isThisProcessing}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  >
                    Add Funds
                  </Button>
                )}

                {/* Decline Button */}
                <Button
                  fullWidth={!hasSufficientBalance}
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={
                    localProcessing === 'decline' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CancelIcon />
                    )
                  }
                  onClick={handleDecline}
                  disabled={localProcessing !== null || isThisProcessing}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    minWidth: hasSufficientBalance ? 100 : 'auto',
                  }}
                >
                  {localProcessing === 'decline' ? 'Declining...' : 'Decline'}
                </Button>

                {/* Pay Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={
                    isThisProcessing ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PaymentIcon />
                    )
                  }
                  onClick={handlePay}
                  disabled={!hasSufficientBalance || localProcessing !== null || isThisProcessing}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    bgcolor: '#22c55e',
                    '&:hover': {
                      bgcolor: '#16a34a',
                    },
                  }}
                >
                  {isThisProcessing ? 'Processing...' : 'PAY'}
                </Button>
              </Stack>
            </>
          )}

        {/* Status Messages */}
        {payment.type === 'REQUEST' && isOwn && payment.status === 'PENDING' && (
          <Alert severity="info" sx={{ py: 0.5 }}>
            <Typography variant="caption">
              Waiting for {payment.receiverName} to respond to your request
            </Typography>
          </Alert>
        )}

        {(isCompleted || payment.status === 'COMPLETED') && payment.type !== 'SEND' && (
          <Alert severity="success" icon={<CheckIcon />} sx={{ py: 0.5 }}>
            <Typography variant="caption" fontWeight="600">
              Transaction completed successfully
            </Typography>
          </Alert>
        )}

        {isDeclined && (
          <Alert severity="error" icon={<CancelIcon />} sx={{ py: 0.5 }}>
            <Typography variant="caption" fontWeight="600">
              {isOwn
                ? 'Your payment request was declined'
                : 'You declined this payment request'}
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  )
}

export default PaymentMessage