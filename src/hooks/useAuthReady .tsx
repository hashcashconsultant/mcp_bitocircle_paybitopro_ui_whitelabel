'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UseAuthReadyOptions {
  /** Keys to check in localStorage before considering auth ready */
  requiredKeys?: string[]
  /** Maximum time to wait for auth data (ms) */
  timeout?: number
  /** Interval to check for auth data (ms) */
  checkInterval?: number
}

interface UseAuthReadyResult {
  /** Whether auth is fully ready (authenticated AND required data is available) */
  isReady: boolean
  /** Whether we're still waiting for auth data */
  isWaiting: boolean
  /** Whether the user is authenticated */
  isAuthenticated: boolean
  /** Error message if timeout occurred */
  error: string | null
  /** Force re-check auth readiness */
  recheck: () => void
}

const DEFAULT_REQUIRED_KEYS = ['childUserId']
const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_CHECK_INTERVAL = 300 // 300ms

/**
 * Hook that waits for authentication to be fully ready.
 * This includes waiting for the auth token AND for required localStorage keys
 * (like childUserId) to be populated by the auth process.
 * 
 * Usage:
 * ```tsx
 * const { isReady, isWaiting, isAuthenticated } = useAuthReady()
 * 
 * useEffect(() => {
 *   if (isReady) {
 *     // Safe to fetch user-specific data
 *     fetchUserData()
 *   }
 * }, [isReady])
 * ```
 */
export const useAuthReady = (options: UseAuthReadyOptions = {}): UseAuthReadyResult => {
  const {
    requiredKeys = DEFAULT_REQUIRED_KEYS,
    timeout = DEFAULT_TIMEOUT,
    checkInterval = DEFAULT_CHECK_INTERVAL
  } = options

  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  
  const [isReady, setIsReady] = useState(false)
  const [isWaiting, setIsWaiting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasCheckedRef = useRef(false)

  // Check if all required keys are present in localStorage
  const checkRequiredKeys = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    for (const key of requiredKeys) {
      const value = localStorage.getItem(key)
      if (!value || value === 'null' || value === 'undefined') {
        return false
      }
    }
    return true
  }, [requiredKeys])

  // Start checking for auth readiness
  const startChecking = useCallback(() => {
    // Clear any existing intervals/timeouts
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current)
      checkIntervalRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setIsWaiting(true)
    setError(null)

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      
      // Check one more time
      if (checkRequiredKeys()) {
        setIsReady(true)
        setIsWaiting(false)
      } else {
        setError('Timeout waiting for authentication data')
        setIsWaiting(false)
      }
    }, timeout)

    // Start polling
    checkIntervalRef.current = setInterval(() => {
      if (checkRequiredKeys()) {
        console.log('[useAuthReady] All required keys found, auth is ready')
        
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current)
          checkIntervalRef.current = null
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        setIsReady(true)
        setIsWaiting(false)
        hasCheckedRef.current = true
      }
    }, checkInterval)
  }, [checkRequiredKeys, timeout, checkInterval])

  // Force recheck
  const recheck = useCallback(() => {
    hasCheckedRef.current = false
    setIsReady(false)
    startChecking()
  }, [startChecking])

  // Main effect
  useEffect(() => {
    // If auth is still loading, wait
    if (isAuthLoading) {
      console.log('[useAuthReady] Auth context is loading, waiting...')
      return
    }

    // If not authenticated, we're done waiting (not ready, but not waiting either)
    if (!isAuthenticated) {
      console.log('[useAuthReady] Not authenticated, setting not ready')
      setIsReady(false)
      setIsWaiting(false)
      return
    }

    // If already checked and ready, don't check again
    if (hasCheckedRef.current && isReady) {
      return
    }

    // Check immediately
    if (checkRequiredKeys()) {
      console.log('[useAuthReady] Required keys already available')
      setIsReady(true)
      setIsWaiting(false)
      hasCheckedRef.current = true
      return
    }

    // Start polling
    console.log('[useAuthReady] Starting to poll for required keys:', requiredKeys)
    startChecking()

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
        checkIntervalRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isAuthenticated, isAuthLoading, checkRequiredKeys, startChecking, isReady, requiredKeys])

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('[useAuthReady] Auth state changed event received')
      // Reset and recheck
      hasCheckedRef.current = false
      if (isAuthenticated) {
        startChecking()
      }
    }

    window.addEventListener('authStateChanged', handleAuthChange)
    return () => window.removeEventListener('authStateChanged', handleAuthChange)
  }, [isAuthenticated, startChecking])

  return {
    isReady,
    isWaiting,
    isAuthenticated,
    error,
    recheck
  }
}

export default useAuthReady