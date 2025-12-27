// ============================================================================
// NASHFLARE BOOSTING - TYPESCRIPT TYPES
// ============================================================================
// Location: lib/boosting/types.ts
// ============================================================================

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type QueueType = 'solo' | 'duo'

export type BoostRequestStatus = 
  | 'open' 
  | 'accepted' 
  | 'paid' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'expired' 
  | 'dispute'

export type BoostOfferStatus = 
  | 'pending' 
  | 'accepted' 
  | 'declined' 
  | 'withdrawn' 
  | 'expired'

export type BoostOfferType = 'accept' | 'counter'

export type BoostOrderStatus = 
  | 'awaiting_credentials'
  | 'credentials_received'
  | 'in_progress'
  | 'pending_confirmation'
  | 'completed'
  | 'dispute'
  | 'refunded'
  | 'partial_refund'

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial_refund'

// ============================================================================
// VALORANT RANKS
// ============================================================================

export interface ValorantRank {
  id: number
  rank_key: string
  rank_name: string
  tier: string
  division: number | null
  rank_order: number
  icon_url: string | null
  color_hex: string | null
}

export type RankTier = 
  | 'Iron' 
  | 'Bronze' 
  | 'Silver' 
  | 'Gold' 
  | 'Platinum' 
  | 'Diamond' 
  | 'Ascendant' 
  | 'Immortal' 
  | 'Radiant'

export type RankKey = 
  | 'iron_1' | 'iron_2' | 'iron_3'
  | 'bronze_1' | 'bronze_2' | 'bronze_3'
  | 'silver_1' | 'silver_2' | 'silver_3'
  | 'gold_1' | 'gold_2' | 'gold_3'
  | 'platinum_1' | 'platinum_2' | 'platinum_3'
  | 'diamond_1' | 'diamond_2' | 'diamond_3'
  | 'ascendant_1' | 'ascendant_2' | 'ascendant_3'
  | 'immortal_1' | 'immortal_2' | 'immortal_3'
  | 'radiant'

// ============================================================================
// PRICING
// ============================================================================

export interface BoostingPricingTier {
  id: string
  from_rank: string
  to_rank: string
  base_price: number
  created_at: string
}

export interface PriceCalculation {
  basePrice: number
  duoFee: number
  priorityFee: number
  addonFees: number
  subtotal: number
  platformFee: number
  total: number
  divisions: number
  maxCounterPrice: number
  estimatedDaysMin: number
  estimatedDaysMax: number
}

export interface AddonSelection {
  offlineMode: boolean
  soloQueueOnly: boolean
  no5Stack: boolean
  specificAgents: boolean
  stream: boolean // Coming soon
}

export interface BoostOptions {
  currentRank: RankKey
  desiredRank: RankKey
  queueType: QueueType
  isPriority: boolean
  addons: AddonSelection
  specificAgentsList?: string[]
}

// ============================================================================
// BOOST REQUESTS
// ============================================================================

export interface BoostRequest {
  id: string
  request_number: string
  customer_id: string
  game: string
  current_rank: string
  current_rr: number
  desired_rank: string
  queue_type: QueueType
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
  status: BoostRequestStatus
  total_offers_received: number
  max_offers: number
  created_at: string
  updated_at: string
  expires_at: string
  accepted_at: string | null
  paid_at: string | null
  completed_at: string | null
  // Joined data
  customer?: {
    id: string
    username: string
    avatar_url: string | null
  }
}

export interface CreateBoostRequestInput {
  current_rank: RankKey
  current_rr?: number
  desired_rank: RankKey
  queue_type: QueueType
  is_priority: boolean
  addon_offline_mode: boolean
  addon_solo_queue_only: boolean
  addon_no_5_stack: boolean
  addon_specific_agents: boolean
  specific_agents_list?: string[]
  addon_stream?: boolean
  platform_suggested_price: number
  customer_offer_price: number
  platform_fee: number
  max_counter_price: number
  estimated_days_min?: number
  estimated_days_max?: number
  customer_notes?: string
}

// ============================================================================
// BOOST OFFERS
// ============================================================================

export interface BoostOffer {
  id: string
  request_id: string
  vendor_id: string
  offer_type: BoostOfferType
  offered_price: number | null
  platform_fee: number | null
  estimated_days: number | null
  vendor_notes: string | null
  status: BoostOfferStatus
  created_at: string
  updated_at: string
  accepted_at: string | null
  // Joined data
  vendor?: {
    id: string
    username: string
    avatar_url: string | null
  }
  vendor_stats?: VendorBoostingStats | null
  request?: BoostRequest
}

export interface CreateBoostOfferInput {
  request_id: string
  offer_type: BoostOfferType
  offered_price?: number
  platform_fee?: number
  estimated_days?: number
  vendor_notes?: string
}

// ============================================================================
// BOOSTING ORDERS
// ============================================================================

export interface BoostingOrder {
  id: string
  order_number: string
  request_id: string
  offer_id: string
  customer_id: string
  vendor_id: string
  game: string
  current_rank: string
  current_rr: number
  desired_rank: string
  queue_type: QueueType
  is_priority: boolean
  addon_offline_mode: boolean
  addon_solo_queue_only: boolean
  addon_no_5_stack: boolean
  addon_specific_agents: boolean
  specific_agents_list: string[] | null
  progress_current_rank: string | null
  progress_current_rr: number
  final_price: number
  platform_fee: number
  vendor_payout: number
  payment_status: PaymentStatus
  payment_method: string | null
  payment_reference: string | null
  status: BoostOrderStatus
  created_at: string
  updated_at: string
  credentials_submitted_at: string | null
  started_at: string | null
  vendor_completed_at: string | null
  customer_confirmed_at: string | null
  customer_notes: string | null
  // Joined data
  customer?: {
    id: string
    username: string
    avatar_url: string | null
    email?: string
  }
  vendor?: {
    id: string
    username: string
    avatar_url: string | null
  }
  progress_updates?: BoostingProgress[]
}

export interface CreateBoostingOrderInput {
  request_id: string
  offer_id: string
  customer_id: string
  vendor_id: string
  current_rank: string
  current_rr: number
  desired_rank: string
  queue_type: QueueType
  is_priority: boolean
  addon_offline_mode: boolean
  addon_solo_queue_only: boolean
  addon_no_5_stack: boolean
  addon_specific_agents: boolean
  specific_agents_list?: string[]
  final_price: number
  platform_fee: number
  vendor_payout: number
  payment_method?: string
  payment_reference?: string
  customer_notes?: string
}

// ============================================================================
// CREDENTIALS
// ============================================================================

export interface BoostingCredentials {
  id: string
  order_id: string
  riot_username_encrypted: string
  riot_password_encrypted: string
  has_2fa: boolean
  two_fa_notes: string | null
  created_at: string
  last_viewed_at: string | null
  view_count: number
  access_revoked_at: string | null
}

export interface SubmitCredentialsInput {
  order_id: string
  riot_username: string
  riot_password: string
  has_2fa?: boolean
  two_fa_notes?: string
}

// Decrypted version for display to vendor
export interface DecryptedCredentials {
  riot_username: string
  riot_password: string
  has_2fa: boolean
  two_fa_notes: string | null
}

// ============================================================================
// PROGRESS
// ============================================================================

export interface BoostingProgress {
  id: string
  order_id: string
  rank_achieved: string
  rr_achieved: number
  games_played: number
  games_won: number
  screenshot_url: string | null
  booster_notes: string | null
  created_at: string
}

export interface CreateProgressInput {
  order_id: string
  rank_achieved: RankKey
  rr_achieved?: number
  games_played?: number
  games_won?: number
  screenshot_url?: string
  booster_notes?: string
}

// ============================================================================
// VENDOR STATS
// ============================================================================

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
  created_at: string
  updated_at: string
}

// ============================================================================
// UI COMPONENT PROPS
// ============================================================================

export interface RankSelectorProps {
  label: string
  value: RankKey | null
  onChange: (rank: RankKey) => void
  minRank?: RankKey
  maxRank?: RankKey
  disabled?: boolean
  error?: string
}

export interface BoostCalculatorProps {
  onCalculate?: (calculation: PriceCalculation) => void
  onSubmit?: (options: BoostOptions, calculation: PriceCalculation) => void
  initialOptions?: Partial<BoostOptions>
}

export interface BoostRequestCardProps {
  request: BoostRequest
  onAccept?: (requestId: string) => void
  onCounterOffer?: (requestId: string) => void
  showActions?: boolean
  isVendorView?: boolean
}

export interface BoostOfferCardProps {
  offer: BoostOffer
  onAccept?: (offerId: string) => void
  onDecline?: (offerId: string) => void
  showActions?: boolean
  isCustomerView?: boolean
}

export interface ProgressTimelineProps {
  updates: BoostingProgress[]
  currentRank: string
  desiredRank: string
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface BoostRequestsResponse {
  requests: BoostRequest[]
  total: number
  page: number
  perPage: number
}

export interface BoostOffersResponse {
  offers: BoostOffer[]
  total: number
}

export interface MarketplaceFilters {
  minRank?: RankKey
  maxRank?: RankKey
  queueType?: QueueType
  minPrice?: number
  maxPrice?: number
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'expiring_soon'
}

// ============================================================================
// VALORANT AGENTS (for specific agents add-on)
// ============================================================================

export const VALORANT_AGENTS = [
  'Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher',
  'Deadlock', 'Fade', 'Gekko', 'Harbor', 'ISO', 'Jett',
  'KAY/O', 'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze',
  'Reyna', 'Sage', 'Skye', 'Sova', 'Viper', 'Vyse', 'Yoru'
] as const

export type ValorantAgent = typeof VALORANT_AGENTS[number]