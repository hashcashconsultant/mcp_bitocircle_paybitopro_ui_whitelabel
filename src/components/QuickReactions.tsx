'use client'

import React from 'react'
import { Box } from '@mui/material'

const quickReactions = [
  { emoji: '❤️', price: 5 },
  { emoji: '👍', price: 2 },
  { emoji: '🔥', price: 10 },
  { emoji: '💯', price: 15 },
]

interface QuickReactionsProps {
  recipientName: string
  userBalance: number
  onSendReaction: (emoji: string, price: number) => void
  onInsufficientBalance: () => void
}

const QuickReactions: React.FC<QuickReactionsProps> = ({
  recipientName,
  userBalance,
  onSendReaction,
  onInsufficientBalance,
}) => {
  const handleQuickGift = async (emoji: string, price: number) => {
    if (userBalance < price) {
      onInsufficientBalance()
      return
    }

    onSendReaction(emoji, price)
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: 3,
        p: 1,
        display: 'flex',
        gap: 1,
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        zIndex: 1000
      }}
    >
      {quickReactions.map((reaction, index) => (
        <Box
          key={index}
          onClick={() => handleQuickGift(reaction.emoji, reaction.price)}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.3s ease',
            '&:hover': {
              bgcolor: 'rgba(30, 64, 175, 0.1)',
              transform: 'scale(1.1)'
            }
          }}
        >
          {reaction.emoji}
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: '#1e40af',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 600,
              px: 0.8,
              py: 0.3,
              borderRadius: 2
            }}
          >
            ${reaction.price}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default QuickReactions