'use client'
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  Divider,
  Stack,
  Chip,
  IconButton,
} from '@mui/material'
import {
  AttachMoney as MoneyIcon,
  AccountBalanceWallet as WalletIcon,
  Send as SendIcon,
  Close as CloseIcon,
  Add as AddIcon,
  RequestPage as RequestIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material'

// Payment request data for accepting payment
export interface PendingPaymentRequest {
  paymentId: string
  messageId: number
  amount: number
  senderId: string
  receiverId: string
  senderName: string
  receiverName: string
  conversationId: number
}

interface PaymentDialogProps {
  open: boolean
  onClose: () => void
  recipientId: string
  recipientName: string
  conversationId: string
  onSendPayment: (amount: number) => Promise<boolean>
  onRequestPayment: (amount: number) => Promise<boolean>
  onAcceptPaymentRequest?: (pendingRequest: PendingPaymentRequest) => Promise<boolean>
  walletBalance: number
  isLoadingBalance: boolean
  onAddFunds: () => void
  // For accepting payment requests
  pendingPaymentRequest?: PendingPaymentRequest | null
  mode?: 'normal' | 'accept_request'
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onClose,
  recipientId,
  recipientName,
  conversationId,
  onSendPayment,
  onRequestPayment,
  onAcceptPaymentRequest,
  walletBalance,
  isLoadingBalance,
  onAddFunds,
  pendingPaymentRequest = null,
  mode = 'normal',
}) => {
  const [activeTab, setActiveTab] = useState(0) // 0 = Send, 1 = Request
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError('')
      setSuccess('')
      setIsProcessing(false)
      
      // If accepting a payment request, pre-fill the amount and lock it
      if (mode === 'accept_request' && pendingPaymentRequest) {
        setAmount(pendingPaymentRequest.amount.toString())
        setActiveTab(0) // Force to Send tab
      } else {
        setAmount('')
        setActiveTab(0)
      }
    }
  }, [open, mode, pendingPaymentRequest])

  // Validate amount
  const isValidAmount = () => {
    const numAmount = parseFloat(amount)
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return false
    }
    if (activeTab === 0 && numAmount > walletBalance) {
      setError('Insufficient wallet balance')
      return false
    }
    return true
  }

  // Handle send payment (direct or accepting request)
  const handleSend = async () => {
    setError('')
    setSuccess('')

    if (!isValidAmount()) return

    const numAmount = parseFloat(amount)
    
    if (numAmount > walletBalance) {
      setError('Insufficient wallet balance. Please add funds.')
      return
    }

    setIsProcessing(true)
    try {
      let success = false

      // Check if we're accepting a payment request
      if (mode === 'accept_request' && pendingPaymentRequest && onAcceptPaymentRequest) {
        success = await onAcceptPaymentRequest(pendingPaymentRequest)
        if (success) {
          setSuccess(`Successfully paid B$ ${numAmount.toFixed(2)} to ${pendingPaymentRequest.senderName}`)
        }
      } else {
        // Direct payment
        success = await onSendPayment(numAmount)
        if (success) {
          setSuccess(`Successfully sent B$ ${numAmount.toFixed(2)} to ${recipientName}`)
        }
      }

      if (success) {
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError('Failed to send payment. Please try again.')
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('An error occurred while processing payment')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle request payment (WebSocket only, no API call)
  const handleRequest = async () => {
    setError('')
    setSuccess('')

    if (!isValidAmount()) return

    const numAmount = parseFloat(amount)

    setIsProcessing(true)
    try {
      const success = await onRequestPayment(numAmount)
      if (success) {
        setSuccess(`Payment request of B$ ${numAmount.toFixed(2)} sent to ${recipientName}`)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError('Failed to send payment request. Please try again.')
      }
    } catch (err) {
      console.error('Payment request error:', err)
      setError('An error occurred while sending request')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle tab change (disabled when accepting payment request)
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (mode === 'accept_request') return // Don't allow tab change when accepting request
    setActiveTab(newValue)
    setError('')
    setSuccess('')
    setAmount('')
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return `B$ ${value.toFixed(2)}`
  }

  // Determine display name based on mode
  const getRecipientDisplayName = () => {
    if (mode === 'accept_request' && pendingPaymentRequest) {
      return pendingPaymentRequest.senderName
    }
    return recipientName
  }

  // Get dialog title based on mode
  const getDialogTitle = () => {
    if (mode === 'accept_request') {
      return 'Accept Payment Request'
    }
    return 'BitoCircle Payment'
  }

  // Get dialog subtitle based on mode
  const getDialogSubtitle = () => {
    if (mode === 'accept_request' && pendingPaymentRequest) {
      return `Pay ${pendingPaymentRequest.senderName}'s request`
    }
    return `${activeTab === 0 ? 'Send money to' : 'Request money from'} ${recipientName}`
  }

  return (
    <Dialog
      open={open}
      onClose={!isProcessing ? onClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 5,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {mode === 'accept_request' ? (
              <PaymentIcon color="success" sx={{ fontSize: 28 }} />
            ) : (
              <MoneyIcon color="primary" sx={{ fontSize: 28 }} />
            )}
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {getDialogTitle()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {getDialogSubtitle()}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            size="small" 
            disabled={isProcessing}
            sx={{ 
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Tabs for Send/Request - Hidden when accepting payment request */}
          {mode !== 'accept_request' && (
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2,
                '& .MuiTab-root': {
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                }
              }}
            >
              <Tab 
                label="Send" 
                icon={<SendIcon />} 
                iconPosition="start"
                disabled={isProcessing}
              />
              <Tab 
                label="Request" 
                icon={<RequestIcon />} 
                iconPosition="start"
                disabled={isProcessing}
              />
            </Tabs>
          )}

          {/* Accept Request Info Banner */}
          {mode === 'accept_request' && pendingPaymentRequest && (
            <Alert 
              severity="info" 
              icon={<RequestIcon />}
              sx={{ 
                bgcolor: 'warning.50', 
                border: '1px solid',
                borderColor: 'warning.main'
              }}
            >
              <Typography variant="body2" fontWeight="600">
                {pendingPaymentRequest.senderName} requested {formatCurrency(pendingPaymentRequest.amount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click &quot;Pay Now&quot; to complete this payment
              </Typography>
            </Alert>
          )}

          {/* Wallet Balance Display - Always show for Send tab or accept request mode */}
          {(activeTab === 0 || mode === 'accept_request') && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.50',
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WalletIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="600">
                    Wallet Balance
                  </Typography>
                  {isLoadingBalance ? (
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  ) : (
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {formatCurrency(walletBalance)}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={onAddFunds}
                disabled={isProcessing}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Add Funds
              </Button>
            </Box>
          )}

          {/* Amount Input */}
          <Box>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              {mode === 'accept_request' 
                ? 'Amount to Pay'
                : activeTab === 0 
                  ? 'Enter Amount to Send' 
                  : 'Enter Amount to Request'}
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={amount}
              onChange={(e) => {
                // Don't allow amount change when accepting request
                if (mode === 'accept_request') return
                setAmount(e.target.value)
                setError('')
              }}
              placeholder="0.00"
              disabled={isProcessing || mode === 'accept_request'}
              inputProps={{
                min: 0,
                step: 0.01,
                style: { fontSize: '1.5rem', fontWeight: 600 },
                readOnly: mode === 'accept_request',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="h5" fontWeight="bold" color="text.secondary">
                      B$
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: mode === 'accept_request' ? 'action.disabledBackground' : 'background.paper',
                  '& fieldset': {
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}
            />
            {(activeTab === 0 || mode === 'accept_request') && amount && parseFloat(amount) > 0 && (
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Remaining balance: {formatCurrency(Math.max(0, walletBalance - parseFloat(amount)))}
                </Typography>
                {parseFloat(amount) > walletBalance && (
                  <Chip
                    label="Insufficient Balance"
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            )}
          </Box>

          {/* Success Message */}
          {success && (
            <Alert severity="success" icon={<MoneyIcon />}>
              {success}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Info Alert */}
          {!success && !error && (
            <Alert severity="info" sx={{ bgcolor: 'info.50' }}>
              {mode === 'accept_request'
                ? `You are about to pay ${pendingPaymentRequest?.senderName}'s payment request. The amount will be deducted from your wallet.`
                : activeTab === 0 
                  ? `You are about to send BitoCircle dollars to ${recipientName}. The amount will be deducted from your wallet.`
                  : `${recipientName} will receive a payment request and can choose to pay you.`
              }
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          disabled={isProcessing}
          sx={{ 
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={activeTab === 0 || mode === 'accept_request' ? handleSend : handleRequest}
          variant="contained"
          color={mode === 'accept_request' ? 'success' : 'primary'}
          disabled={
            isProcessing || 
            !amount || 
            parseFloat(amount) <= 0 || 
            ((activeTab === 0 || mode === 'accept_request') && parseFloat(amount) > walletBalance)
          }
          startIcon={
            isProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : mode === 'accept_request' ? (
              <PaymentIcon />
            ) : activeTab === 0 ? (
              <SendIcon />
            ) : (
              <RequestIcon />
            )
          }
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            minWidth: 120,
          }}
        >
          {isProcessing 
            ? 'Processing...' 
            : mode === 'accept_request'
              ? 'Pay Now'
              : activeTab === 0 
                ? 'Send' 
                : 'Request'
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PaymentDialog