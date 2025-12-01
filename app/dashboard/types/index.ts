// Vendor Dashboard Types

export interface Profile {
  id: string
  username: string
  email: string
  role: 'customer' | 'vendor'
  is_admin: boolean
  verified: boolean
  created_at: string
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
  created_at: string
  updated_at: string
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

// Tab types
export type VendorTab = 'listings' | 'orders' | 'balance' | 'inventory'

// Filter types for listings
export interface ListingFilters {
  searchQuery: string
  filterGame: string
  filterCategory: string
  filterStatus: string
  filterDeliveryType: string
  filterPriceMin: string
  filterPriceMax: string
  filterDateRange: string
  sortBy: string
}

// Filter types for orders
export interface OrderFilters {
  searchQuery: string
  filterStatus: string
  filterGame: string
  filterDeliveryType: string
  filterPriceMin: string
  filterPriceMax: string
  filterDateFrom: string
  filterDateTo: string
  sortBy: string
}

// Bulk action types
export type BulkActionType = 'status' | 'category' | 'price' | 'delete' | 'export' | ''

// Inventory filter types
export type InventoryFilter = 'all' | 'low' | 'out' | 'over'
export type InventorySort = 'stock' | 'value' | 'usage'

// Constants
export const LISTING_CATEGORIES = [
  { value: 'account', label: 'Accounts' },
  { value: 'currency', label: 'Currency' },
  { value: 'key', label: 'Keys' }
] as const

export const LISTING_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'draft', label: 'Draft' }
] as const

export const ORDER_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'dispute_raised', label: 'Dispute' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' }
] as const

export const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '7days', label: 'Last 7 Days' },
  { value: '30days', label: 'Last 30 Days' },
  { value: '90days', label: 'Last 90 Days' }
] as const

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'stock_high', label: 'Stock: High to Low' },
  { value: 'stock_low', label: 'Stock: Low to High' }
] as const

export const ORDER_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' }
] as const