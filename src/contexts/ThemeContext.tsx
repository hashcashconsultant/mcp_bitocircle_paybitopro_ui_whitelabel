// contexts/ThemeContext.tsx (Dark Mode Default)
'use client'
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from '../lib/theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

// Provide default values - changed to dark mode
const defaultContext: ThemeContextType = {
  mode: 'dark',
  toggleTheme: () => {
    console.warn('ThemeProvider not found. Using default theme.')
  },
  setTheme: () => {
    console.warn('ThemeProvider not found. Using default theme.')
  }
}

const ThemeContext = createContext<ThemeContextType>(defaultContext)

export const useThemeMode = () => {
  const context = useContext(ThemeContext)
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Changed default state to 'dark'
  const [mode, setMode] = useState<ThemeMode>('dark')
  const [mounted, setMounted] = useState(false)

  // Load theme preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode)
    }
    // If no savedMode exists, it will stay as 'dark' (the initial state)
    setMounted(true)
  }, [])

  // Save theme preference to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('themeMode', mode)
      window.dispatchEvent(new CustomEvent('themeChange', { detail: mode }))
    }
  }, [mode, mounted])

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))

  }

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode)
  }

  const theme = useMemo(() => createAppTheme(mode), [mode])

  const value = {
    mode,
    toggleTheme,
    setTheme,
  }

  // Prevent flash of unstyled content
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export default ThemeProvider