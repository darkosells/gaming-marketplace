// File Path: app/messages/types/index.ts

// Messages Page Types

export interface Conversation {
  id: string
  listing_id: string | null
  order_id: string | null
  buyer_id: string
  seller_id: string
  last_message: string
  last_message_at: string
  boosting_order_id: string | null
  // Listing data (may be null if deleted or boosting conversation)
  listing: {
    title: string
    image_url: string
    game: string
  } | null
  // Order data with snapshot fields
  order: {
    status: string
    amount: number
    listing_title: string | null
    listing_game: string | null
    listing_image_url: string | null
    listing_category: string | null
  } | null
  // Boosting order data
  boosting_order: {
    id: string
    order_number: string
    game: string
    current_rank: string
    desired_rank: string
    status: string
    final_price: number
  } | null
  buyer: {
    username: string
    avatar_url: string | null
  }
  seller: {
    username: string
    avatar_url: string | null
  }
  unread_count?: number
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  message_type: string
  read: boolean
  image_url?: string | null
  replied_to?: string | null
  order_id?: string | null
  sender: {
    username: string
    is_admin: boolean
    avatar_url: string | null
  }
  reply_message?: {
    id: string
    content: string
    image_url?: string | null
    sender: {
      username: string
    }
  } | null
}

export interface TypingUser {
  user_id: string
  username: string
  timestamp: number
}

export interface UserProfile {
  username: string
  avatar_url: string | null
}

export interface ListingInfo {
  title: string
  image_url: string | null
  game: string
  category: string
  isBoosting: boolean
  boostingOrder?: {
    id: string
    order_number: string
    current_rank: string
    desired_rank: string
    status: string
  } | null
}

export interface RateLimitCheck {
  allowed: boolean
  error?: string
}

// Boosting status configuration for UI
export const BOOSTING_STATUS_CONFIG: Record<string, { label: string; colors: string }> = {
  'awaiting_credentials': { label: 'Awaiting Creds', colors: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'credentials_received': { label: 'Creds Received', colors: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'in_progress': { label: 'In Progress', colors: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  'pending_confirmation': { label: 'Boost Done', colors: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'completed': { label: 'Completed', colors: 'bg-green-500/20 text-green-400 border-green-500/30' },
  'cancelled': { label: 'Cancelled', colors: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  'dispute': { label: 'Dispute', colors: 'bg-red-500/20 text-red-400 border-red-500/30' }
}

// Helper to check if conversation is boosting type
export const isBoostingConversation = (conv: Conversation | null): boolean => {
  return !!(conv?.boosting_order_id)
}

// Helper to get the correct order view link
export const getViewOrderLink = (conv: Conversation, userId: string): string => {
  if (conv.boosting_order_id) {
    const isCustomer = conv.buyer_id === userId
    return isCustomer 
      ? `/dashboard/boosts/${conv.boosting_order_id}`
      : `/boosting/vendor/orders/${conv.boosting_order_id}`
  }
  return `/order/${conv.order_id}`
}