'use client'
import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Skeleton,
  useTheme,
  useMediaQuery
} from '@mui/material'

interface PostSkeletonProps {
  variant?: 'text' | 'image' | 'video' | 'poll'
}

export const PostSkeleton: React.FC<PostSkeletonProps> = ({ variant = 'text' }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Card sx={{
      mb: 2,
      borderRadius: 2,
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      border: '1px solid #e4e6ea'
    }}>
      <CardContent sx={{
        p: { xs: 2, sm: '16px !important' }
      }}>
        {/* Post Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton 
            variant="circular" 
            width={isMobile ? 36 : 40} 
            height={isMobile ? 36 : 40} 
            sx={{ mr: 1.5 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="30%" height={20} />
            <Skeleton variant="text" width="20%" height={16} />
          </Box>
          <Skeleton variant="circular" width={24} height={24} />
        </Box>

        {/* Post Content */}
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="95%" />
          <Skeleton variant="text" width="85%" />
        </Box>

        {/* Media based on variant */}
        {variant === 'image' && (
          <Box sx={{ mb: 2 }}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={isMobile ? 250 : 400}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        )}

        {variant === 'video' && (
          <Box sx={{ mb: 2, position: 'relative' }}>
            <Skeleton 
              variant="rectangular" 
              width="100%" 
              height={isMobile ? 200 : 350}
              sx={{ borderRadius: 1 }}
            />
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              bgcolor: 'rgba(255, 255, 255, 0.2)'
            }}>
              <Skeleton variant="circular" width={60} height={60} />
            </Box>
          </Box>
        )}

        {variant === 'poll' && (
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
            {[1, 2, 3, 4].map((item) => (
              <Skeleton 
                key={item}
                variant="rectangular" 
                width="100%" 
                height={40}
                sx={{ mb: 1, borderRadius: 1 }}
              />
            ))}
          </Box>
        )}

        {/* Post Actions */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={30} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={30} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={30} />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Skeleton variant="circular" width={24} height={24} />
        </Box>
      </CardContent>
    </Card>
  )
}

export const FeedSkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  // Generate random post types for variety
  const postTypes: Array<'text' | 'image' | 'video' | 'poll'> = 
    Array(count).fill(null).map((_, index) => {
      const types: Array<'text' | 'image' | 'video' | 'poll'> = ['text', 'image', 'video', 'poll']
      return types[index % types.length]
    })

  return (
    <>
      {postTypes.map((type, index) => (
        <PostSkeleton key={index} variant={type} />
      ))}
    </>
  )
}