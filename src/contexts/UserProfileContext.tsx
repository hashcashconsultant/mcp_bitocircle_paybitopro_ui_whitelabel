'use client'

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { BITOHUBWEBSERVICE } from '@/services/CoreDataService'

// Define the user profile data structure
export interface UserProfile {
  userId: number | null
  pageId: string | null
  fullName: string
  username: string
  email: string
  profilePicture: string | null
  coverPicture: string | null
  bio: string | null
  location: string | null
  website: string | null
  followersCount: number
  followingCount: number
  isVerified: boolean
}

// Define the context type
interface UserProfileContextType {
  userProfile: UserProfile
  isLoading: boolean
  error: string | null
  updateProfile: (updates: Partial<UserProfile>) => void
  updateProfilePicture: (url: string) => void
  updateCoverPicture: (url: string) => void
  updateFullName: (name: string) => void
  refreshProfile: () => Promise<void>
}

// Default profile state
const defaultProfile: UserProfile = {
  userId: null,
  pageId: null,
  fullName: '',
  username: '',
  email: '',
  profilePicture: null,
  coverPicture: null,
  bio: null,
  location: null,
  website: null,
  followersCount: 0,
  followingCount: 0,
  isVerified: false
}

// Create the context
const UserProfileContext = createContext<UserProfileContextType | null>(null)

// Provider props
interface UserProfileProviderProps {
  children: ReactNode
}

// Provider component
export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultProfile)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    const uuid = localStorage.getItem('uuid')
    const pageId = localStorage.getItem('pageId')

    if (!uuid) {
      setUserProfile(defaultProfile)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetchWithAuth(BITOHUBWEBSERVICE + '/profile/getProfileDetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUser: uuid,
          pageId: pageId || '0',
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const d = result.data

        const newProfile: UserProfile = {
          userId: d.userId || null,
          pageId: pageId || '0',
          fullName: d.fullName || '',
          username: d.username || '',
          email: d.email || '',
          profilePicture: d.profilePicture || null,
          coverPicture: d.coverPicture || null,
          bio: d.bio || null,
          location: d.location || null,
          website: d.website || null,
          followersCount: d.followersCount || 0,
          followingCount: d.followingCount || 0,
          isVerified: d.isVerified || false
        }

        setUserProfile(newProfile)

        // Also update localStorage for backward compatibility
        localStorage.setItem('profilePhoto', d.profilePicture || '')
        localStorage.setItem('fullName', d.fullName || '')
        localStorage.setItem('username', d.username || '')
      } else {
        setError(result.message || 'Failed to fetch profile')
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initialize profile on mount and when auth changes
  useEffect(() => {
    // Check if user is authenticated
    const uuid = localStorage.getItem('uuid')
    if (uuid) {
      fetchProfile()
    }

    // Listen for storage changes (e.g., when pageId changes from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pageId' || e.key === 'uuid') {
        fetchProfile()
      }
    }

    // Listen for auth state changes (e.g., when user logs in within same tab)
    const handleAuthChange = () => {
      const newUuid = localStorage.getItem('uuid')
      if (newUuid) {
        // Small delay to ensure all localStorage items are set
        setTimeout(() => {
          fetchProfile()
        }, 100)
      } else {
        setUserProfile(defaultProfile)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthChange)
    }
  }, [fetchProfile])

  // Update full profile
  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...updates }

      // Update localStorage for backward compatibility
      if (updates.profilePicture !== undefined) {
        localStorage.setItem('profilePhoto', updates.profilePicture || '')
      }
      if (updates.fullName !== undefined) {
        localStorage.setItem('fullName', updates.fullName)
      }
      if (updates.username !== undefined) {
        localStorage.setItem('username', updates.username)
      }

      return updated
    })
  }, [])

  // Update just profile picture
  const updateProfilePicture = useCallback((url: string) => {
    setUserProfile(prev => ({ ...prev, profilePicture: url }))
    localStorage.setItem('profilePhoto', url)
  }, [])

  // Update just cover picture
  const updateCoverPicture = useCallback((url: string) => {
    setUserProfile(prev => ({ ...prev, coverPicture: url }))
  }, [])

  // Update just full name
  const updateFullName = useCallback((name: string) => {
    setUserProfile(prev => ({ ...prev, fullName: name }))
    localStorage.setItem('fullName', name)
  }, [])

  // Refresh profile from API
  const refreshProfile = useCallback(async () => {
    await fetchProfile()
  }, [fetchProfile])

  const value: UserProfileContextType = {
    userProfile,
    isLoading,
    error,
    updateProfile,
    updateProfilePicture,
    updateCoverPicture,
    updateFullName,
    refreshProfile
  }

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  )
}

// Custom hook to use the context
export const useUserProfile = (): UserProfileContextType => {
  const context = useContext(UserProfileContext)
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
}

export default UserProfileContext
