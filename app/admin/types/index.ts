// Admin Dashboard Types

export const ITEMS_PER_PAGE = 10

export interface AdminUser {
  id: string
  username: string
  email: string
  role: 'customer' | 'vendor'
  is_admin: boolean
  admin_level?: 'admin' | 'super_admin'
  verified: boolean
  rating: number
  total_sales: number
  is_banned: boolean
  banned_at?: string
  ban_reason?: string
  created_at: string
}

export interface AdminListing {
  id: string
  seller_id: string
  title: string
  description: string
  game: string
  category: string
  price: string
  stock: number
  status: string
  delivery_type: string
  image_url?: string
  created_at: string
  profiles?: {
    username: string
  }
}

export interface AdminOrder {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: string
  status: string
  delivery_type: string
  created_at: string
  completed_at?: string
  delivered_at?: string
  dispute_reason?: string
  dispute_opened_at?: string
  resolution_notes?: string
  resolved_by?: string
  listing_title?: string
  listing_game?: string
  listing_category?: string
  buyer?: {
    username: string
  }
  seller?: {
    username: string
  }
}

export interface AdminConversation {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string
  order_id?: string
  last_message?: string
  last_message_at?: string
  created_at: string
  buyer?: {
    username: string
  }
  seller?: {
    username: string
  }
  listing?: {
    title: string
  }
}

export interface AdminReview {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  rating: number
  comment?: string
  edited_by_admin?: boolean
  edited_at?: string
  created_at: string
  buyer?: {
    username: string
  }
  seller?: {
    username: string
  }
  order?: {
    listing_title: string
  }
}

export interface AdminWithdrawal {
  id: string
  user_id: string
  amount: string
  fee: string
  net_amount: string
  method: 'bitcoin' | 'skrill'
  address: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  transaction_id?: string
  admin_notes?: string
  rejection_reason?: string
  processed_by?: string
  processed_at?: string
  created_at: string
  user?: {
    username: string
  }
  processor?: {
    username: string
  }
}

export interface AdminVerification {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  full_name?: string
  date_of_birth?: string
  phone_number?: string
  street_address?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  id_type?: string
  id_front_url?: string
  id_back_url?: string
  rejection_reason?: string
  rejection_type?: 'resubmission_required' | 'permanent'
  can_resubmit?: boolean
  resubmission_fields?: string[]
  resubmission_instructions?: string
  admin_notes?: string
  documents_viewed_at?: string
  documents_viewed_by?: string
  documents_cleared?: boolean
  resubmission_count?: number
  has_previous_experience?: boolean
  platform_names?: string
  platform_usernames?: string
  experience_description?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  user?: {
    id: string
    username: string
    created_at: string
  }
  reviewer?: {
    username: string
  }
}

export interface AdminNotification {
  id: string
  admin_id: string
  message: string
  type: string
  link?: string
  read: boolean
  created_at: string
}

export interface AdminStats {
  totalUsers: number
  totalListings: number
  totalOrders: number
  activeDisputes: number
  solvedDisputes: number
  pendingVerifications: number
  totalRevenue: number
  activeFraudFlags: number
}

export interface AnalyticsData {
  revenueChart: Array<{
    date: string
    revenue: number
    orders: number
  }>
  ordersChart: Array<{
    date: string
    revenue: number
    orders: number
  }>
  disputeRate: number
  avgOrderValue: number
  topGames: Array<{
    game: string
    revenue: number
    count: number
  }>
  topSellers: Array<{
    username: string
    total_sales: number
    rating: number
  }>
}

export interface FraudFlag {
  id: string
  user_id: string
  type: 'multiple_disputes' | 'suspicious_activity' | 'rapid_transactions' | 'low_pricing' | 'account_manipulation' | 'chargeback' | 'identity_fraud'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: 'active' | 'reviewed' | 'resolved' | 'false_positive'
  auto_detected: boolean
  detection_source: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  user?: {
    username: string
    email: string
    created_at: string
  }
}

// Fraud detection configuration
export const FRAUD_CONFIG = {
  MAX_FAILED_LOGINS: 5,
  MAX_DISPUTES_RATIO: 0.3,
  MIN_ACCOUNT_AGE_DAYS: 7,
  MAX_CHARGEBACKS: 2,
  SUSPICIOUS_PRICE_MULTIPLIER: 0.3,
  MAX_RAPID_ORDERS: 5,
  MIN_DELIVERY_TIME_MINUTES: 5
}