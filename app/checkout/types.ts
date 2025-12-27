// app/checkout/types.ts - TypeScript interfaces for checkout

// ============================================================================
// EXISTING MARKETPLACE TYPES (unchanged)
// ============================================================================

export interface CartItem {
  listing_id: string
  quantity: number
  listing: {
    id: string
    title: string
    price: number
    game: string
    category: string
    image_url: string
    stock: number
    seller_id: string
    delivery_type: 'manual' | 'automatic'
    profiles: {
      username: string
      avatar_url?: string | null
      average_rating?: number
      verified?: boolean
    }
  }
}

export interface BillingInfo {
  firstName: string
  lastName: string
  email: string
}

export interface FormErrors {
  [key: string]: string
}

export interface SellerStats {
  rating: number
  totalSales: number
}

// ============================================================================
// BOOSTING CHECKOUT TYPES (new)
// ============================================================================

export type CheckoutType = 'listing' | 'boost'

export interface BoostCheckoutData {
  request: {
    id: string
    request_number: string
    customer_id: string
    game: string
    current_rank: string
    current_rr: number
    desired_rank: string
    queue_type: 'solo' | 'duo'
    is_priority: boolean
    addon_offline_mode: boolean
    addon_solo_queue_only: boolean
    addon_no_5_stack: boolean
    addon_specific_agents: boolean
    specific_agents_list: string[] | null
    addon_stream: boolean
    platform_suggested_price: number
    customer_offer_price: number
    platform_fee: number
    max_counter_price: number
    estimated_days_min: number | null
    estimated_days_max: number | null
    customer_notes: string | null
    status: string
    created_at: string
  }
  offer: {
    id: string
    request_id: string
    vendor_id: string
    offer_type: 'accept' | 'counter'
    offered_price: number
    platform_fee: number
    estimated_days: number | null
    vendor_notes: string | null
    status: string
    created_at: string
    vendor?: {
      id: string
      username: string
      avatar_url: string | null
    }
  }
  vendorStats: VendorBoostingStats | null
}

export interface VendorBoostingStats {
  id: string
  vendor_id: string
  total_boosts_completed: number
  total_divisions_boosted: number
  total_earnings: number
  average_completion_days: number | null
  on_time_completion_rate: number
  boost_rating: number
  boost_review_count: number
}