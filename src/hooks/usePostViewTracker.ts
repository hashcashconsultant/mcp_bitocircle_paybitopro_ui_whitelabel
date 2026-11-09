'use client'
import { useEffect, useRef, useCallback } from 'react'
import { fetchWithAuth } from '@/utils/fetchWithAuth'
import { sendOnPageExit } from '@/utils/apiAuth'

// ==================== TYPES ====================

type EventType = 'IMPRESSION' | 'VIEW' | 'REACH' | 'CLICK'

interface UsePostViewTrackerProps {
  postId: number
  contentType: string
  minViewDuration?: number
  updateInterval?: number
  enabled?: boolean
  isVideoPlaying?: boolean
  videoDuration?: number
  currentVideoTime?: number
  isSponsored?: boolean
  campaignId?: number
}

interface ViewerCountPayload {
  viewerId: number
  contentId: number
  contentType: string
  durationOfView: number
  eventType: EventType
  campaignId: number
}

// ==================== CONSTANTS ====================

const MIN_VISIBILITY_RATIO = 0.5 // 50% visible
const VIEW_UPDATE_INTERVAL = 5000 // Send VIEW event every 5 seconds while visible

// Session storage for tracking
const IMPRESSION_STORAGE_KEY = 'bh_impressions_session'
const REACH_STORAGE_KEY = 'bh_reach_session'

// ==================== HOOK ====================

const usePostViewTracker = ({
  postId,
  contentType,
  minViewDuration = 3,
  updateInterval = 30,
  enabled = true,
  isVideoPlaying = false,
  videoDuration = 0,
  currentVideoTime = 0,
  isSponsored = false,
  campaignId = 0
}: UsePostViewTrackerProps) => {
  // console.log(`[ViewTracker] 🚀 Hook initialized for post ${postId}:`, {
  //   contentType,
  //   isSponsored,
  //   campaignId,
  //   enabled
  // })
  
  const trackingRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  
  // Timing refs
  const viewStartTimeRef = useRef<number | null>(null)
  const totalViewDurationRef = useRef<number>(0)
  const lastViewUpdateRef = useRef<number>(0)
  
  // Video tracking refs
  const videoWatchedTimeRef = useRef<number>(0)
  const lastVideoTimeRef = useRef<number>(0)
  
  // Event tracking refs
  const impressionFiredRef = useRef<boolean>(false)
  const reachFiredRef = useRef<boolean>(false)
  const isVisibleRef = useRef<boolean>(false)
  const currentIntersectionRatioRef = useRef<number>(0)
  
  // Interval for periodic VIEW updates
  const viewUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check if reach was already fired (in this session)
  const checkReachFired = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const reachData = sessionStorage.getItem(REACH_STORAGE_KEY)
      if (reachData) {
        const reachSet: number[] = JSON.parse(reachData)
        return reachSet.includes(postId)
      }
    } catch (e) {
      console.error('[ViewTracker] ❌ Error checking reach:', e)
    }
    return false
  }, [postId])

  // Mark reach as fired
  const markReachFired = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const reachData = sessionStorage.getItem(REACH_STORAGE_KEY)
      let reachSet: number[] = []
      if (reachData) {
        reachSet = JSON.parse(reachData)
      }
      if (!reachSet.includes(postId)) {
        reachSet.push(postId)
        sessionStorage.setItem(REACH_STORAGE_KEY, JSON.stringify(reachSet))
        // console.log(`[ViewTracker] 💾 Marked REACH as fired for post ${postId}`)
      }
    } catch (e) {
      console.error('[ViewTracker] ❌ Error marking reach:', e)
    }
  }, [postId])

  // Check if impression was already fired
  const checkImpressionFired = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    try {
      const impressions = sessionStorage.getItem(IMPRESSION_STORAGE_KEY)
      if (impressions) {
        const impressionSet: number[] = JSON.parse(impressions)
        return impressionSet.includes(postId)
      }
    } catch (e) {
      console.error('[ViewTracker] ❌ Error checking impression:', e)
    }
    return false
  }, [postId])

  // Mark impression as fired
  const markImpressionFired = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      const impressions = sessionStorage.getItem(IMPRESSION_STORAGE_KEY)
      let impressionSet: number[] = []
      if (impressions) {
        impressionSet = JSON.parse(impressions)
      }
      if (!impressionSet.includes(postId)) {
        impressionSet.push(postId)
        sessionStorage.setItem(IMPRESSION_STORAGE_KEY, JSON.stringify(impressionSet))
        // console.log(`[ViewTracker] 💾 Marked IMPRESSION as fired for post ${postId}`)
      }
    } catch (e) {
      console.error('[ViewTracker] ❌ Error marking impression:', e)
    }
  }, [postId])

  // Send event to API
  const sendViewerCount = useCallback(async (
    eventType: EventType,
    duration: number
  ) => {
    try {
      const viewerId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
      
      if (!viewerId) {
        // console.log(`[ViewTracker] ⚠️ No viewer ID found for post ${postId}, skipping ${eventType} API call`)
        return
      }

      const payload: ViewerCountPayload = {
        viewerId: parseInt(viewerId),
        contentId: postId,
        contentType: contentType,
        durationOfView: Math.round(duration),
        eventType: eventType,
        campaignId: (isSponsored && campaignId > 0) ? campaignId : 0
      }

      // console.log(`[ViewTracker] 📤 Sending ${eventType} for post ${postId}:`, payload)

      const response = await fetchWithAuth(
        'https://institutional-bo.paybito.com:8443/BitohubService/tracking/event',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      // console.log(`[ViewTracker] ✅ ${eventType} response for post ${postId}:`, result)
      
    } catch (error) {
      console.error(`[ViewTracker] ❌ Error sending ${eventType} for post ${postId}:`, error)
    }
  }, [postId, contentType, isSponsored, campaignId])

  // Fire REACH event (once per session when post first becomes visible)
  const fireReach = useCallback(() => {
    if (reachFiredRef.current || checkReachFired()) {
      // console.log(`[ViewTracker] ⏭️ Skipping REACH - already fired for post ${postId}`)
      return
    }
    
    reachFiredRef.current = true
    markReachFired()
    sendViewerCount('REACH', 0)
    // console.log(`[ViewTracker] ✅ REACH fired for post ${postId}`)
  }, [postId, checkReachFired, markReachFired, sendViewerCount])

  // Fire IMPRESSION event (once per session for sponsored posts when they become visible)
  const fireImpression = useCallback(() => {
    if (!isSponsored) {
      // console.log(`[ViewTracker] ⏭️ Skipping IMPRESSION - post ${postId} not sponsored`)
      return
    }
    
    if (impressionFiredRef.current || checkImpressionFired()) {
      // console.log(`[ViewTracker] ⏭️ Skipping IMPRESSION - already fired for post ${postId}`)
      return
    }
    
    impressionFiredRef.current = true
    markImpressionFired()
    sendViewerCount('IMPRESSION', 0)
    // console.log(`[ViewTracker] ✅ IMPRESSION fired for sponsored post ${postId}`)
  }, [isSponsored, postId, checkImpressionFired, markImpressionFired, sendViewerCount])

  // Fire VIEW event (periodic updates while post is visible)
  const fireView = useCallback((duration: number) => {
    sendViewerCount('VIEW', duration)
    // console.log(`[ViewTracker] ✅ VIEW sent for post ${postId}, duration: ${duration}s`)
  }, [postId, sendViewerCount])

  // Fire CLICK event (when user clicks on post content)
  const fireClick = useCallback(() => {
    // console.log(`[ViewTracker] 🖱️ CLICK event triggered for post ${postId}`)
    sendViewerCount('CLICK', totalViewDurationRef.current)
  }, [postId, sendViewerCount])

  // Start periodic VIEW updates
  const startViewUpdates = useCallback(() => {
    if (viewUpdateIntervalRef.current) {
      // console.log(`[ViewTracker] ⏰ View updates already running for post ${postId}`)
      return
    }
    
    // console.log(`[ViewTracker] ⏰ Starting VIEW updates for post ${postId}`)
    
    viewUpdateIntervalRef.current = setInterval(() => {
      if (isVisibleRef.current && viewStartTimeRef.current) {
        const now = Date.now()
        const additionalDuration = (now - viewStartTimeRef.current) / 1000
        totalViewDurationRef.current += additionalDuration
        viewStartTimeRef.current = now
        
        const timeSinceLastUpdate = now - lastViewUpdateRef.current
        
        // Send VIEW event every 5 seconds
        if (timeSinceLastUpdate >= VIEW_UPDATE_INTERVAL) {
          fireView(totalViewDurationRef.current)
          lastViewUpdateRef.current = now
        }
        
        // console.log(`[ViewTracker] ⏱️ Post ${postId} viewing: ${totalViewDurationRef.current.toFixed(2)}s (will update at ${VIEW_UPDATE_INTERVAL / 1000}s)`)
      }
    }, 1000) // Check every second
  }, [postId, fireView])

  // Stop periodic VIEW updates
  const stopViewUpdates = useCallback(() => {
    if (viewUpdateIntervalRef.current) {
      clearInterval(viewUpdateIntervalRef.current)
      viewUpdateIntervalRef.current = null
      // console.log(`[ViewTracker] ⏰ Stopped VIEW updates for post ${postId}`)
      
      // Send final VIEW event if there's accumulated time
      if (totalViewDurationRef.current > 0) {
        fireView(totalViewDurationRef.current)
        totalViewDurationRef.current = 0
        lastViewUpdateRef.current = 0
      }
    }
  }, [postId, fireView])

  // Handle visibility change
  const handleVisibilityChange = useCallback((
    isVisible: boolean, 
    intersectionRatio: number
  ) => {
    const now = Date.now()
    currentIntersectionRatioRef.current = intersectionRatio
    
    const meetsVisibilityThreshold = intersectionRatio >= MIN_VISIBILITY_RATIO
    const wasVisible = isVisibleRef.current
    isVisibleRef.current = isVisible && meetsVisibilityThreshold

    // console.log(`[ViewTracker] 👁️ Visibility change for post ${postId}:`, {
    //   isVisible,
    //   intersectionRatio,
    //   meetsVisibilityThreshold,
    //   wasVisible,
    //   nowVisible: isVisibleRef.current
    // })

    if (isVisible && meetsVisibilityThreshold && !wasVisible) {
      // Post became visible
      //console.log(`[ViewTracker] ✨ Post ${postId} became visible (${Math.round(intersectionRatio * 100)}% visible)`)
      
      // 1. Fire REACH immediately (first time only)
      if (!reachFiredRef.current) {
        fireReach()
      }
      
      // 2. Fire IMPRESSION for sponsored posts (first time only)
      if (isSponsored && !impressionFiredRef.current) {
        fireImpression()
      }
      
      // 3. Start tracking view duration
      viewStartTimeRef.current = now
      lastViewUpdateRef.current = now
      totalViewDurationRef.current = 0
      
      // 4. Start periodic VIEW updates
      startViewUpdates()
      
    } else if ((!isVisible || !meetsVisibilityThreshold) && wasVisible) {
      // Post became hidden
      // console.log(`[ViewTracker] 🌑 Post ${postId} became hidden/below threshold`)
      
      // Update total duration
      if (viewStartTimeRef.current) {
        const additionalDuration = (now - viewStartTimeRef.current) / 1000
        totalViewDurationRef.current += additionalDuration
        viewStartTimeRef.current = null
        // console.log(`[ViewTracker] 📊 Total viewing time for post ${postId}: ${totalViewDurationRef.current.toFixed(2)}s`)
      }
      
      // Stop VIEW updates and send final VIEW event
      stopViewUpdates()
    }
  }, [isSponsored, fireReach, fireImpression, startViewUpdates, stopViewUpdates, postId])

  // Track video playback time
  useEffect(() => {
    if (contentType !== 'VIDEO' && contentType !== 'REEL') return
    if (!isVisibleRef.current) return
    
    if (isVideoPlaying) {
      lastVideoTimeRef.current = currentVideoTime
      // console.log(`[ViewTracker] ▶️ Video playing for post ${postId} at ${currentVideoTime.toFixed(2)}s`)
    } else {
      if (lastVideoTimeRef.current > 0 && currentVideoTime > lastVideoTimeRef.current) {
        const watchedDelta = currentVideoTime - lastVideoTimeRef.current
        videoWatchedTimeRef.current += watchedDelta
        totalViewDurationRef.current += watchedDelta
        
        // console.log(`[ViewTracker] ⏸️ Video paused for post ${postId}:`, {
        //   delta: watchedDelta,
        //   totalWatched: videoWatchedTimeRef.current,
        //   current: currentVideoTime
        // })
      }
      lastVideoTimeRef.current = 0
    }
  }, [isVideoPlaying, currentVideoTime, contentType, postId])

  // Update watched time continuously while playing
  useEffect(() => {
    if (contentType !== 'VIDEO' && contentType !== 'REEL') return
    if (!isVideoPlaying || !isVisibleRef.current) return
    
    const intervalId = setInterval(() => {
      if (lastVideoTimeRef.current > 0 && currentVideoTime > lastVideoTimeRef.current) {
        const watchedDelta = currentVideoTime - lastVideoTimeRef.current
        videoWatchedTimeRef.current += watchedDelta
        totalViewDurationRef.current += watchedDelta
        lastVideoTimeRef.current = currentVideoTime
        
        // console.log(`[ViewTracker] 🎬 Video watching post ${postId}: ${videoWatchedTimeRef.current.toFixed(2)}s watched`)
      }
    }, 500)
    
    return () => clearInterval(intervalId)
  }, [currentVideoTime, isVideoPlaying, contentType, postId])

  // Set up intersection observer
  useEffect(() => {
    if (!enabled || !trackingRef.current) {
      // console.log(`[ViewTracker] ⏭️ Tracker not enabled or ref not ready for post ${postId}`)
      return
    }

    // console.log(`[ViewTracker] 🎬 Setting up observer for post ${postId}`)

    // Reset refs on mount
    viewStartTimeRef.current = null
    totalViewDurationRef.current = 0
    lastViewUpdateRef.current = 0
    videoWatchedTimeRef.current = 0
    lastVideoTimeRef.current = 0
    reachFiredRef.current = checkReachFired()
    impressionFiredRef.current = checkImpressionFired()
    
    // console.log(`[ViewTracker] 🔄 Reset tracking for post ${postId}:`, {
    //   reachAlreadyFired: reachFiredRef.current,
    //   impressionAlreadyFired: impressionFiredRef.current
    // })

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handleVisibilityChange(entry.isIntersecting, entry.intersectionRatio)
        })
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      }
    )

    observerRef.current.observe(trackingRef.current)
    // console.log(`[ViewTracker] 👀 Observer started for post ${postId}`)

    return () => {
      // console.log(`[ViewTracker] 🧹 Cleanup for post ${postId}`)
      
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      
      // Stop VIEW updates and send final event
      stopViewUpdates()
    }
  }, [enabled, handleVisibilityChange, checkReachFired, checkImpressionFired, stopViewUpdates, postId])

  // Handle page visibility
  useEffect(() => {
    if (!enabled) return

    const handlePageVisibility = () => {
      // console.log(`[ViewTracker] 📄 Page visibility changed:`, {
      //   hidden: document.hidden,
      //   postId
      // })
      
      if (document.hidden && isVisibleRef.current) {
        handleVisibilityChange(false, 0)
      } else if (!document.hidden && trackingRef.current) {
        const rect = trackingRef.current.getBoundingClientRect()
        const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
        if (isInViewport) {
          const ratio = Math.min(1, (Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)) / rect.height)
          handleVisibilityChange(true, ratio)
        }
      }
    }

    document.addEventListener('visibilitychange', handlePageVisibility)
    return () => document.removeEventListener('visibilitychange', handlePageVisibility)
  }, [enabled, handleVisibilityChange, postId])

  // Handle page unload
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      // console.log(`[ViewTracker] 👋 Page unloading, final check for post ${postId}:`, {
      //   totalDuration: totalViewDurationRef.current
      // })
      
      // Send final VIEW event if there's accumulated time
      if (totalViewDurationRef.current > 0 && isVisibleRef.current) {
        const viewerId = localStorage.getItem('childUserId') || localStorage.getItem('userId')
        if (!viewerId) return

        const payload: ViewerCountPayload = {
          viewerId: parseInt(viewerId),
          contentId: postId,
          contentType: contentType,
          durationOfView: Math.round(totalViewDurationRef.current),
          eventType: 'VIEW',
          campaignId: (isSponsored && campaignId > 0) ? campaignId : 0
        }

        // console.log(`[ViewTracker] 📤 Sending beacon for post ${postId}:`, payload)

        // Sent with the sign-in headers (a plain beacon would be refused by the API).
        sendOnPageExit('https://institutional-bo.paybito.com:8443/BitohubService/tracking/event', payload)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [enabled, postId, contentType, isSponsored, campaignId])

  return {
    trackingRef,
    fireClick,
    getState: () => ({
      totalDuration: totalViewDurationRef.current,
      videoWatchedTime: videoWatchedTimeRef.current,
      reachFired: reachFiredRef.current,
      impressionFired: impressionFiredRef.current,
      isVisible: isVisibleRef.current,
      visibilityRatio: currentIntersectionRatioRef.current
    })
  }
}

export default usePostViewTracker