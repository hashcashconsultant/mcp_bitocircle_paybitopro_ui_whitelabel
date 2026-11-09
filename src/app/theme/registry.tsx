'use client'
import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@/lib/theme'

interface ThemeRegistryProps {
  children: React.ReactNode
}

export default function ThemeRegistry({ children }: ThemeRegistryProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}