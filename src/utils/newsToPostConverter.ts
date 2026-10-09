// newsToPostConverter.ts
// This file converts news API response to your Post format

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
  description: string | null
  imageUrl: string
  profilePicture: string
}

interface NewsResponse {
  newsDetails: NewsItem[]
  statusCode: number
  message: string
}

// Import your Post types (these match your existing types)
import type { Post, TextPost, ImagePost } from '@/components/BitoHubFeed'

// Utility function to format the date
const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
    return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  } catch (error) {
    return '1h ago' // fallback
  }
}

// Function to generate a color based on the source name
const getSourceColor = (source: string): string => {
  const colors: Record<string, string> = {
    'Coindesk': '#ff9500',
    'CoinTelegraph': '#00d4ff',
    'TheMerkle': '#8b5cf6',
    'NewsBTC': '#22c55e',
    'default': '#4267b2'
    // Default colors for other sources
    // 'default': ['#4267b2', '#e91e63', '#9c27b0', '#42b883', '#00bcd4', '#ff6f00', '#4caf50']
  }
  
  if (colors[source]) {
    return colors[source]
  }
  
  // Generate consistent color for unknown sources
  let hash = 0
  for (let i = 0; i < source.length; i++) {
    hash = source.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors.default[Math.abs(hash) % colors.default.length]
}

// Function to get source initials for avatar
const getSourceInitials = (source: string): string => {
  const specialCases: Record<string, string> = {
    'Coindesk': 'CD',
    'CoinTelegraph': 'CT',
    'TheMerkle': 'TM',
    'NewsBTC': 'NB'
  }
  
  if (specialCases[source]) {
    return specialCases[source]
  }
  
  const words = source.split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return source.substring(0, 2).toUpperCase()
}

// Function to clean and format content
const formatNewsContent = (title: string, description: string | null, link: string): string => {
  let content = title
  
  // Add description if available and not "N/A"
  if (description && description !== 'N/A' && description !== null) {
    content = `${title}\n\n${description}`
  }
  
  // Add a subtle link indicator (you can customize this)
  // Removed the full link to keep posts cleaner
  content += '\n\n📰 Breaking News'
  
  return content
}

// Main converter function
export function convertNewsToPost(newsResponse: NewsResponse): Post[] {
  if (!newsResponse.newsDetails || !Array.isArray(newsResponse.newsDetails)) {
    return []
  }

  return newsResponse.newsDetails.map((newsItem, index) => {
    const baseId = Date.now() + index * 1000 // Ensure unique IDs
    
    // Check if there's a valid image
    const hasValidImage = newsItem.imageUrl && 
                         newsItem.imageUrl !== 'N/A' && 
                         newsItem.imageUrl.startsWith('http')
    
    // Base post structure
    const basePost = {
      id: baseId,
      user: {
        name: newsItem.source,
        username: `@${newsItem.source.toLowerCase().replace(/\s+/g, '')}`,
        avatar: getSourceInitials(newsItem.source),
        time: formatTimeAgo(newsItem.pubDate),
        avatarColor: getSourceColor(newsItem.source),
        profilePicture: newsItem.profilePicture 
      },
      content: formatNewsContent(newsItem.title, newsItem.description, newsItem.link),
      likes: Math.floor(Math.random() * 500) + 50, // 50-550
      comments: Math.floor(Math.random() * 50) + 5, // 5-55
      shares: Math.floor(Math.random() * 30) + 2, // 2-32
      isLiked: false,
      isSaved: false
    }

    // Return as ImagePost if has valid image, otherwise TextPost
    if (hasValidImage) {
      const imagePost: ImagePost = {
        ...basePost,
        type: 'image',
        images: [newsItem.imageUrl],
        contentType: ''
      }
      return imagePost
    } else {
      const textPost: TextPost = {
        ...basePost,
        type: 'text',
        contentType: ''
      }
      return textPost
    }
  })
}

// Function to merge news with existing posts
export function mergeNewsWithPosts(
  existingPosts: Post[], 
  newsPosts: Post[],
  strategy: 'prepend' | 'append' | 'interleave' = 'interleave'
): Post[] {
  // Remove any duplicate news posts (based on content similarity)
  const existingContents = new Set(
    existingPosts.map(p => p.content.substring(0, 100)) // Compare first 100 chars
  )
  
  const uniqueNewsPosts = newsPosts.filter(
    newsPost => !existingContents.has(newsPost.content.substring(0, 100))
  )
  
  switch (strategy) {
    case 'prepend':
      // Add all news at the beginning
      return [...uniqueNewsPosts, ...existingPosts]
    
    case 'append':
      // Add all news at the end
      return [...existingPosts, ...uniqueNewsPosts]
    
    case 'interleave':
    default:
      // Mix news with regular posts (1 news per 2 regular posts)
      const mixed: Post[] = []
      let newsIndex = 0
      
      existingPosts.forEach((post, index) => {
        mixed.push(post)
        // Add a news post after every 2 regular posts
        if ((index + 1) % 2 === 0 && newsIndex < uniqueNewsPosts.length) {
          mixed.push(uniqueNewsPosts[newsIndex])
          newsIndex++
        }
      })
      
      // Add any remaining news posts at the end
      while (newsIndex < uniqueNewsPosts.length) {
        mixed.push(uniqueNewsPosts[newsIndex])
        newsIndex++
      }
      
      return mixed
  }
}

// ============================================
// Updated BitoHubFeed.tsx
// Add this to your BitoHubFeed component
// ============================================

/*
// Add these imports at the top of BitoHubFeed.tsx
import { convertNewsToPost, mergeNewsWithPosts } from '@/utils/newsToPostConverter'

// Inside BitoHubFeed component, add this effect to fetch news:

useEffect(() => {
  const fetchNews = async () => {
    try {
      // For testing with your sample data:
      const newsResponse = {
        // Your news data here
      }
      
      // For production:
      // const response = await fetch('/api/news')
      // const newsResponse = await response.json()
      
      if (newsResponse.statusCode === 0) {
        const newsPosts = convertNewsToPost(newsResponse)
        setPosts(prevPosts => mergeNewsWithPosts(prevPosts, newsPosts, 'interleave'))
      }
    } catch (error) {
      console.error('Failed to fetch news:', error)
    }
  }
  
  // Fetch news on mount
  fetchNews()
  
  // Optional: Set up periodic refresh
  const interval = setInterval(fetchNews, 5 * 60 * 1000) // Every 5 minutes
  return () => clearInterval(interval)
}, [])
*/

// ============================================
// Alternative: Custom Hook for News Integration
// ============================================

import { useState, useEffect } from 'react'

export function useNewsIntegration(
  initialPosts: Post[],
  options?: {
    enabled?: boolean
    apiUrl?: string
    refreshInterval?: number
    mergeStrategy?: 'prepend' | 'append' | 'interleave'
  }
) {
  const {
    enabled = true,
    apiUrl = '/api/news',
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    mergeStrategy = 'interleave'
  } = options || {}
  
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchAndMergeNews = async () => {
    if (!enabled) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // For development - use your sample data
      const sampleResponse: NewsResponse = {
        newsDetails: [
          // Add a few sample news items here for testing
          {
            title: "Bitcoin Reaches New Heights Amid Market Rally",
            link: "https://example.com/news/1",
            pubDate: new Date().toISOString(),
            source: "Coindesk",
            description: "The cryptocurrency market sees significant gains...",
            imageUrl: "https://picsum.photos/800/600?random=100",
            profilePicture: "https://picsum.photos/100/100?random=200"
          }
        ],
        statusCode: 0,
        message: "Success"
      }
      
      // For production:
      // const response = await fetch(apiUrl)
      // const newsResponse = await response.json()
      
      const newsResponse = sampleResponse // Remove this line in production
      
      if (newsResponse.statusCode === 0) {
        const newsPosts = convertNewsToPost(newsResponse)
        setPosts(prevPosts => mergeNewsWithPosts(prevPosts, newsPosts, mergeStrategy))
      } else {
        throw new Error(newsResponse.message || 'Failed to fetch news')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news')
      console.error('News fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Fetch news on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      fetchAndMergeNews()
    }
  }, [enabled])
  
  // Set up refresh interval
  useEffect(() => {
    if (!enabled || !refreshInterval || refreshInterval <= 0) return
    
    const interval = setInterval(fetchAndMergeNews, refreshInterval)
    return () => clearInterval(interval)
  }, [enabled, refreshInterval])
  
  // Update posts when initialPosts change
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])
  
  return {
    posts,
    setPosts,
    isLoading,
    error,
    refetch: fetchAndMergeNews
  }
}

// ============================================
// Usage Example in BitoHubFeed
// ============================================

/*
// Replace the existing posts state in BitoHubFeed with:

const { 
  posts, 
  setPosts, 
  isLoading: isLoadingNews, 
  error: newsError,
  refetch: refetchNews
} = useNewsIntegration(initialPostsArray, {
  enabled: true,
  mergeStrategy: 'interleave',
  refreshInterval: 5 * 60 * 1000 // 5 minutes
})

// Then use `posts` and `setPosts` as before
// The news will automatically be integrated
*/