// File Path: app/messages/hooks/useTypingIndicator.ts

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { TypingUser } from '../types'

interface UseTypingIndicatorProps {
  conversationId: string | null
  userId: string | null
  username: string | null
}

export function useTypingIndicator({ conversationId, userId, username }: UseTypingIndicatorProps) {
  const supabase = createClient()
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingBroadcastRef = useRef<number>(0)

  // Broadcast typing status
  const broadcastTyping = useCallback(async () => {
    if (!conversationId || !userId || !username) return

    const channel = supabase.channel(`typing-${conversationId}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        username: username
      }
    })
  }, [conversationId, userId, username, supabase])

  // Handle input change for typing indicator
  const handleTypingChange = useCallback((hasText: boolean) => {
    if (hasText && conversationId && username) {
      const now = Date.now()
      if (now - lastTypingBroadcastRef.current > 2000) {
        broadcastTyping()
        lastTypingBroadcastRef.current = now
      }

      if (!isTyping) {
        setIsTyping(true)
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 3000)
    } else {
      setIsTyping(false)
    }
  }, [conversationId, username, isTyping, broadcastTyping])

  // Subscribe to typing events
  useEffect(() => {
    if (!conversationId || !userId) return

    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== userId) {
          setTypingUsers(prev => {
            const newMap = new Map(prev)
            newMap.set(payload.user_id, {
              user_id: payload.user_id,
              username: payload.username,
              timestamp: Date.now()
            })
            return newMap
          })

          // Clear typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => {
              const newMap = new Map(prev)
              newMap.delete(payload.user_id)
              return newMap
            })
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(typingChannel)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [conversationId, userId, supabase])

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return {
    typingUsers,
    isTyping,
    setIsTyping,
    handleTypingChange
  }
}