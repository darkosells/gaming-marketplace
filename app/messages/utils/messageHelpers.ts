// File Path: app/messages/utils/messageHelpers.ts

// Message Helper Utilities

import { Conversation, ListingInfo } from '../types'

// ============================================
// DATE & TIME HELPERS
// ============================================

/**
 * Parse timestamp as UTC
 */
export const parseAsUTC = (timestamp: string): Date => {
  if (!timestamp) return new Date()
  // If timestamp doesn't have timezone info, treat it as UTC
  if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
    return new Date(timestamp + 'Z')
  }
  return new Date(timestamp)
}

/**
 * Format time consistently (HH:MM)
 */
export const formatTime = (timestamp: string): string => {
  if (!timestamp) return ''
  const date = parseAsUTC(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format date and time (Month Day, HH:MM)
 */
export const formatDateTime = (timestamp: string): string => {
  if (!timestamp) return ''
  const date = parseAsUTC(timestamp)
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/**
 * Format date for separators (Today, Yesterday, or full date)
 */
export const formatDateSeparator = (timestamp: string): string => {
  const messageDate = parseAsUTC(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (messageDate.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return messageDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    })
  }
}

/**
 * Format last seen time
 */
export const formatLastSeen = (lastSeenDate: string | null): string => {
  if (!lastSeenDate) return 'Last seen recently'
  
  const lastSeen = parseAsUTC(lastSeenDate)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
  
  if (diffMinutes < 1) return 'Active now'
  if (diffMinutes < 60) return `Last active ${diffMinutes}m ago`
  
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `Last active ${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Last active yesterday'
  if (diffDays < 7) return `Last active ${diffDays}d ago`
  
  return 'Last active long ago'
}

/**
 * Format conversation date (Month Day)
 */
export const formatConversationDate = (timestamp: string): string => {
  const date = parseAsUTC(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// SCAM & SECURITY DETECTION
// ============================================

// Scam patterns to detect
const scamPatterns = [
  /password/i,
  /credit card/i,
  /ssn|social security/i,
  /bank account/i,
  /routing number/i,
  /cvv|cvc/i,
  /verify.*account/i,
  /suspended.*account/i,
  /click.*here.*urgent/i,
  /won.*prize/i,
  /claim.*reward/i,
  /tax.*refund/i,
]

const suspiciousLinkPatterns = [
  /bit\.ly/i,
  /tinyurl/i,
  /discord\.gg/i,
  /\.ru\//i,
  /\.tk\//i,
  /free.*nitro/i,
]

/**
 * Detect scam patterns in text
 */
export const detectScamPattern = (text: string): string | null => {
  for (const pattern of scamPatterns) {
    if (pattern.test(text)) {
      return 'This message contains potentially sensitive information'
    }
  }
  
  for (const pattern of suspiciousLinkPatterns) {
    if (pattern.test(text)) {
      return 'This message contains a suspicious link'
    }
  }
  
  return null
}

/**
 * Check if image filename contains sensitive keywords
 */
export const checkImageForSensitiveContent = (file: File): boolean => {
  const filename = file.name.toLowerCase()
  const sensitiveKeywords = ['password', 'ssn', 'license', 'card', 'bank', 'id']
  return sensitiveKeywords.some(keyword => filename.includes(keyword))
}

// ============================================
// CONVERSATION HELPERS
// ============================================

/**
 * Format rank for display (bronze_3 -> Bronze 3)
 */
export const formatRankDisplay = (rank: string): string => {
  return rank
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get listing info from conversation (uses snapshot as fallback, supports boosting)
 */
export const getListingInfo = (conv: Conversation): ListingInfo => {
  // Check if this is a boosting conversation
  if (conv.boosting_order_id && conv.boosting_order) {
    const currentRank = formatRankDisplay(conv.boosting_order.current_rank)
    const desiredRank = formatRankDisplay(conv.boosting_order.desired_rank)
    
    return {
      title: `${currentRank} → ${desiredRank}`,
      image_url: null,
      game: conv.boosting_order.game,
      category: 'boosting',
      isBoosting: true,
      boostingOrder: {
        id: conv.boosting_order.id,
        order_number: conv.boosting_order.order_number,
        current_rank: conv.boosting_order.current_rank,
        desired_rank: conv.boosting_order.desired_rank,
        status: conv.boosting_order.status
      }
    }
  }
  
  // If listing still exists, use it
  if (conv.listing?.title) {
    return {
      title: conv.listing.title,
      image_url: conv.listing.image_url,
      game: conv.listing.game,
      category: 'account',
      isBoosting: false,
      boostingOrder: null
    }
  }
  
  // Otherwise use snapshot from order
  if (conv.order?.listing_title) {
    return {
      title: conv.order.listing_title,
      image_url: conv.order.listing_image_url,
      game: conv.order.listing_game || 'N/A',
      category: conv.order.listing_category || 'account',
      isBoosting: false,
      boostingOrder: null
    }
  }
  
  // Fallback
  return {
    title: 'Deleted Listing',
    image_url: null,
    game: 'N/A',
    category: 'account',
    isBoosting: false,
    boostingOrder: null
  }
}

// ============================================
// MESSAGE HELPERS
// ============================================

/**
 * Check if two messages should show a date separator between them
 */
export const shouldShowDateSeparator = (
  currentTimestamp: string, 
  previousTimestamp: string | null
): boolean => {
  if (!previousTimestamp) return true
  const currentDate = parseAsUTC(currentTimestamp)
  const previousDate = parseAsUTC(previousTimestamp)
  return currentDate.toDateString() !== previousDate.toDateString()
}

// Common emojis for quick picker
export const commonEmojis = ['😊', '😂', '❤️', '👍', '🎮', '🔥', '✨', '🎉', '👋', '🙌', '💯', '✅', '❌', '🤔', '😎', '🥳']