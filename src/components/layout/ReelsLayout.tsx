'use client'
import React from 'react'
import { Box } from '@mui/material'

interface ReelsLayoutProps {
  children: React.ReactNode
}

const ReelsLayout: React.FC<ReelsLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ 
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {children}
    </Box>
  )
}

export default ReelsLayout