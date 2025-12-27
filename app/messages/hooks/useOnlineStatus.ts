// File Path: app/messages/hooks/useOnlineStatus.ts

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { parseAsUTC } from '../utils/messageHelpers'

interface UseOnlineStatusProps {
  currentUserId: string | null
  otherUserId: string | null
}

export function useOnlineStatus({ currentUserId, otherUserId }: UseOnlineStatusProps) {
  const supabase = createClient()
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null)

  // Track other user's online status
  const trackUserOnlineStatus = useCallback(async (userId: string) => {
    if (!userId) return
    
    try {
      const checkOnlineStatus = async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('last_seen')
          .eq('id', userId)
          .single()

        if (profileData?.last_seen) {
          const lastSeen = parseAsUTC(profileData.last_seen)
          const now = new Date()
          const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
          
          const isOnline = diffMinutes < 3
          setOtherUserOnline(isOnline)
          setOtherUserLastSeen(profileData.last_seen)
        } else {
          setOtherUserOnline(false)
          setOtherUserLastSeen(null)
        }
      }

      await checkOnlineStatus()
      const interval = setInterval(checkOnlineStatus, 10000)

      return () => {
        clearInterval(interval)
      }
    } catch (error) {
      console.error('Error tracking user status:', error)
      setOtherUserOnline(false)
    }
  }, [supabase])

  // Track other user when they change
  useEffect(() => {
    if (!otherUserId) {
      setOtherUserOnline(false)
      setOtherUserLastSeen(null)
      return
    }

    let cleanup: (() => void) | undefined

    const startTracking = async () => {
      cleanup = await trackUserOnlineStatus(otherUserId)
    }

    startTracking()

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [otherUserId, trackUserOnlineStatus])

  // Update current user's last seen
  useEffect(() => {
    if (!currentUserId) return

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentUserId)
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60000)

    return () => clearInterval(interval)
  }, [currentUserId, supabase])

  return {
    otherUserOnline,
    otherUserLastSeen,
    trackUserOnlineStatus
  }
}