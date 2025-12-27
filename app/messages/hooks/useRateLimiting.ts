// File Path: app/messages/hooks/useRateLimiting.ts

import { useState, useEffect, useCallback } from 'react'
import { RateLimitCheck } from '../types'

// Rate limit constants
const MESSAGE_COOLDOWN_MS = 1000
const MAX_MESSAGES_PER_MINUTE = 20
const MAX_CONVERSATIONS_PER_HOUR = 5

export function useRateLimiting() {
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([])
  const [conversationTimestamps, setConversationTimestamps] = useState<number[]>([])
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)

  // Clear rate limit error after delay
  useEffect(() => {
    if (rateLimitError) {
      const timer = setTimeout(() => setRateLimitError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [rateLimitError])

  // Rate limiting check for messages
  const checkMessageRateLimit = useCallback((): RateLimitCheck => {
    const now = Date.now()
    const recentTimestamps = messageTimestamps.filter(ts => now - ts < 60000)
    
    if (recentTimestamps.length > 0) {
      const lastMessageTime = recentTimestamps[recentTimestamps.length - 1]
      if (now - lastMessageTime < MESSAGE_COOLDOWN_MS) {
        return { allowed: false, error: 'Please wait a moment before sending another message' }
      }
    }
    
    if (recentTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, error: 'Too many messages. Please wait a minute before sending more.' }
    }
    
    return { allowed: true }
  }, [messageTimestamps])

  // Record message timestamp
  const recordMessageSent = useCallback(() => {
    const now = Date.now()
    setMessageTimestamps(prev => {
      const recent = prev.filter(ts => now - ts < 60000)
      return [...recent, now]
    })
  }, [])

  // Rate limiting check for conversation creation
  const checkConversationRateLimit = useCallback((): RateLimitCheck => {
    const now = Date.now()
    const recentTimestamps = conversationTimestamps.filter(ts => now - ts < 3600000)
    
    if (recentTimestamps.length >= MAX_CONVERSATIONS_PER_HOUR) {
      const oldestTimestamp = recentTimestamps[0]
      const minutesUntilReset = Math.ceil((3600000 - (now - oldestTimestamp)) / 60000)
      return { 
        allowed: false, 
        error: `Too many new conversations. Please wait ${minutesUntilReset} minutes before starting another.` 
      }
    }
    
    return { allowed: true }
  }, [conversationTimestamps])

  // Record conversation creation timestamp
  const recordConversationCreated = useCallback(() => {
    const now = Date.now()
    setConversationTimestamps(prev => {
      const recent = prev.filter(ts => now - ts < 3600000)
      return [...recent, now]
    })
  }, [])

  return {
    rateLimitError,
    setRateLimitError,
    checkMessageRateLimit,
    recordMessageSent,
    checkConversationRateLimit,
    recordConversationCreated
  }
}