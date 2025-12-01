// Vendor Dashboard Types

export type VendorTab = 'listings' | 'orders' | 'balance' | 'inventory' | 'guide' | 'rank'
export type InventoryFilter = 'all' | 'low' | 'out' | 'over'
export type InventorySort = 'stock' | 'value' | 'usage'

// NEW: Vendor Rank Types
export type VendorRank = 'nova' | 'star' | 'galaxy' | 'supernova'

export interface RankProgress {
  completedOrders: number
  averageRating: number
  disputeRate: number
  accountAgeDays: number
  totalReviews: number
}

export interface RankData {
  currentRank: VendorRank
  commissionRate: number
  disputeRate: number
  rankUpdatedAt: string | null
}

export interface Profile {
  id: string
  username: string
  email: string
  role: 'customer' | 'vendor'
  is_admin: boolean
  verified: boolean
  created_at: string
  // Existing optional fields
  vendor_since?: string
  average_rating?: number
  total_reviews?: number
  total_sales?: number
  avatar_url?: string | null
  // NEW: Rank fields
  vendor_rank?: VendorRank
  commission_rate?: number
  dispute_rate?: number
  vendor_rank_updated_at?: string | null
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string
  game: string
  category: 'account' | 'currency' | 'key'
  price: string
  stock: number
  status: 'active' | 'out_of_stock' | 'draft' | 'removed' | 'sold'
  delivery_type: 'automatic' | 'manual'
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: string
  status: 'pending' | 'paid' | 'delivered' | 'completed' | 'dispute_raised' | 'refunded' | 'cancelled'
  delivery_type: 'automatic' | 'manual'
  created_at: string
  updated_at: string
  listing_title?: string
  listing_game?: string
  listing_category?: string
  listing_image_url?: string
  buyer?: {
    username: string
  }
  listing?: {
    title: string
    game: string
    category: string
    image_url?: string
  }
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  method: 'bitcoin' | 'skrill'
  address: string
  fee_percentage: number
  fee_flat: number
  fee_total: number
  net_amount: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  reference_number: string
  rejection_reason?: string
  processed_at?: string
  created_at: string
}

export interface InventoryStats {
  lowStock: Listing[]
  outOfStock: Listing[]
  overstocked: Listing[]
  totalValue: number
  automaticDeliveryStats: {
    totalCodes: number
    usedCodes: number
    remainingCodes: number
    usageRate: number
  }
}

export interface WithdrawalFees {
  percentageFee: number
  flatFee: number
  totalFee: number
  netAmount: number
}

// Filter state types
export interface ListingFilterState {
  searchQuery: string
  filterGame: string
  filterCategory: string
  filterStatus: string
  filterDeliveryType: string
  filterPriceMin: string
  filterPriceMax: string
  filterDateRange: string
  sortBy: string
  showFilters: boolean
}

export interface OrderFilterState {
  orderSearchQuery: string
  orderFilterStatus: string
  orderFilterGame: string
  orderFilterDeliveryType: string
  orderFilterPriceMin: string
  orderFilterPriceMax: string
  orderFilterDateFrom: string
  orderFilterDateTo: string
  orderSortBy: string
  showOrderFilters: boolean
}

// Bulk action types
export interface BulkActionState {
  selectionMode: boolean
  selectedListings: Set<string>
  showBulkActions: boolean
  bulkActionType: string
  bulkStatusChange: string
  bulkCategoryChange: string
  bulkPriceAdjustment: string
  bulkPricePercentage: string
  bulkProcessing: boolean
}