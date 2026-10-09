'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material'
import {
  Close as CloseIcon,
  Login as LoginIcon,
  PersonAdd as SignUpIcon,
} from '@mui/icons-material'
import { tokenCookie } from '../hooks/useAuthRedirect';
import { installApiAuth } from '../utils/apiAuth';

// Every fetch() to a BitoCircle API carries the sign-in from here on.
installApiAuth();

// Login URLs - Update these to match your actual login/signup pages
const LOGIN_URL = 'https://www.bitocircle.com/login'
const SIGNUP_URL = 'https://www.bitocircle.com/signup'

// Interval to check for auth changes (in ms)
const AUTH_CHECK_INTERVAL = 500
// Maximum time to wait for auth to be ready (in ms)
const AUTH_READY_TIMEOUT = 5000

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  checkAuth: () => boolean
  requireAuth: (action?: string) => boolean
  showLoginPrompt: (action?: string) => void
  hideLoginPrompt: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to check authentication
export const isUserAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false
  const token = tokenCookie.get()
  return token !== null && token !== '' && token !== 'null'
}

// Check if URL has app parameter (meaning login redirect is being processed)
const hasAppParameter = (): boolean => {
  if (typeof window === 'undefined') return false
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('app')
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [actionMessage, setActionMessage] = useState<string>('')
  
  // Track if we've completed initial auth check
  const authCheckCompleted = useRef(false)
  const authCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check authentication status
  const checkAuth = useCallback((): boolean => {
    const authenticated = isUserAuthenticated()
    setIsAuthenticated(authenticated)
    return authenticated
  }, [])

  // Force refresh auth state
  const refreshAuth = useCallback(() => {
    const authenticated = isUserAuthenticated()
    setIsAuthenticated(authenticated)
    setIsLoading(false)
  }, [])

  // Initial auth check with smart waiting for login redirect processing
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const performAuthCheck = () => {
      // If URL has 'app' parameter, wait for useAuthRedirect to process it
      if (hasAppParameter()) {
        console.log('[AuthContext] App parameter detected, waiting for auth processing...')
        
        let elapsedTime = 0
        
        // Poll for auth token to appear
        authCheckIntervalRef.current = setInterval(() => {
          elapsedTime += AUTH_CHECK_INTERVAL
          
          const authenticated = isUserAuthenticated()
          
          if (authenticated) {
            // Token found! Auth processing complete
            console.log('[AuthContext] Auth token found after processing')
            setIsAuthenticated(true)
            setIsLoading(false)
            authCheckCompleted.current = true
            
            if (authCheckIntervalRef.current) {
              clearInterval(authCheckIntervalRef.current)
              authCheckIntervalRef.current = null
            }
          } else if (elapsedTime >= AUTH_READY_TIMEOUT) {
            // Timeout - proceed without auth
            console.log('[AuthContext] Auth check timeout, proceeding without auth')
            setIsAuthenticated(false)
            setIsLoading(false)
            authCheckCompleted.current = true
            
            if (authCheckIntervalRef.current) {
              clearInterval(authCheckIntervalRef.current)
              authCheckIntervalRef.current = null
            }
          }
        }, AUTH_CHECK_INTERVAL)
      } else {
        // No app parameter - check auth immediately
        const authenticated = isUserAuthenticated()
        console.log('[AuthContext] Direct auth check:', authenticated)
        setIsAuthenticated(authenticated)
        setIsLoading(false)
        authCheckCompleted.current = true
      }
    }

    performAuthCheck()

    // Cleanup interval on unmount
    return () => {
      if (authCheckIntervalRef.current) {
        clearInterval(authCheckIntervalRef.current)
        authCheckIntervalRef.current = null
      }
    }
  }, [])

  // Listen for storage changes (login/logout in other tabs or from useAuthRedirect)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      // Token is now in cookie, but check for other auth-related storage changes
      if (e.key === 'brokerId' || e.key === 'userId' || e.key === 'uuid') {
        console.log('[AuthContext] Storage change detected for auth data')
        checkAuth()
      }
    }

    // Also listen for custom auth events
    const handleAuthChange = () => {
      console.log('[AuthContext] Custom auth change event received')
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [checkAuth])

  // Periodic check to catch auth changes within the same tab
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!authCheckCompleted.current) return // Don't start periodic checks until initial check is done

    // Check every 2 seconds for auth state changes
    const periodicCheck = setInterval(() => {
      const currentAuth = isUserAuthenticated()
      if (currentAuth !== isAuthenticated) {
        console.log('[AuthContext] Periodic check detected auth change:', currentAuth)
        setIsAuthenticated(currentAuth)
      }
    }, 2000)

    return () => clearInterval(periodicCheck)
  }, [isAuthenticated])

  // Show login prompt dialog
  const showLoginPrompt = useCallback((action?: string) => {
    setActionMessage(action || '')
    setShowDialog(true)
  }, [])

  // Hide login prompt dialog
  const hideLoginPrompt = useCallback(() => {
    setShowDialog(false)
    setActionMessage('')
  }, [])

  // Check auth and show prompt if not authenticated
  // Returns true if authenticated, false if not (and shows prompt)
  const requireAuth = useCallback((action?: string): boolean => {
    const authenticated = checkAuth()
    if (!authenticated) {
      showLoginPrompt(action)
      return false
    }
    return true
  }, [checkAuth, showLoginPrompt])

  // Handle login redirect
  const handleLogin = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href
      localStorage.setItem('redirectAfterLogin', currentUrl)
      window.location.href = LOGIN_URL
    }
  }

  // Handle signup redirect
  const handleSignup = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href
      localStorage.setItem('redirectAfterLogin', currentUrl)
      window.location.href = SIGNUP_URL
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    checkAuth,
    requireAuth,
    showLoginPrompt,
    hideLoginPrompt,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Login Prompt Dialog */}
      <Dialog
        open={showDialog}
        onClose={hideLoginPrompt}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        {/* Header with gradient */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
            py: 3,
            px: 3,
            position: 'relative',
          }}
        >
          <IconButton
            onClick={hideLoginPrompt}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight={700}
            color="white"
            textAlign="center"
          >
            Join BitoCircle
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.8)"
            textAlign="center"
            sx={{ mt: 1 }}
          >
            Connect with crypto entrepreneurs worldwide
          </Typography>
        </Box>

        <DialogContent sx={{ py: 4, px: 3 }}>
          {/* Action message */}
          {actionMessage && (
            <Box
              sx={{
                bgcolor: 'rgba(30, 64, 175, 0.08)',
                borderRadius: 2,
                p: 2,
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Sign in to <strong>{actionMessage}</strong>
              </Typography>
            </Box>
          )}

          {/* Sign In Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              bgcolor: '#1e40af',
              '&:hover': {
                bgcolor: '#1e3a8a',
              },
            }}
          >
            Sign In
          </Button>

          {/* Create Account Button */}
          {/* <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<SignUpIcon />}
            onClick={handleSignup}
            sx={{
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              borderColor: '#1e40af',
              color: '#1e40af',
              '&:hover': {
                borderColor: '#1e3a8a',
                bgcolor: 'rgba(30, 64, 175, 0.04)',
              },
            }}
          >
            Create Account
          </Button> */}

          {/* Terms notice */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mt: 3 }}
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  
  // Return a fallback if used outside provider (for gradual migration)
  if (context === undefined) {
    // Fallback implementation for when AuthProvider is not wrapped
    const fallbackCheckAuth = () => isUserAuthenticated()
    
    return {
      isAuthenticated: isUserAuthenticated(),
      isLoading: false,
      checkAuth: fallbackCheckAuth,
      requireAuth: (action?: string) => {
        if (!isUserAuthenticated()) {
          if (typeof window !== 'undefined') {
            const currentUrl = window.location.href
            localStorage.setItem('redirectAfterLogin', currentUrl)
            window.location.href = LOGIN_URL
          }
          return false
        }
        return true
      },
      showLoginPrompt: (action?: string) => {
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.href
          localStorage.setItem('redirectAfterLogin', currentUrl)
          window.location.href = LOGIN_URL
        }
      },
      hideLoginPrompt: () => {},
      refreshAuth: () => {},
    }
  }
  
  return context
}

// Helper function to dispatch auth change event (call this after login completes)
export const dispatchAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authStateChanged'))
  }
}

export default AuthContext