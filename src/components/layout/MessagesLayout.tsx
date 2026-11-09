'use client'
import React from 'react'
import { Box } from '@mui/material'

interface MessagesLayoutProps {
  children: React.ReactNode
}

const MessagesLayout: React.FC<MessagesLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      bgcolor: 'background.default'
    }}>
      {children}
    </Box>
  )
}

export default MessagesLayout