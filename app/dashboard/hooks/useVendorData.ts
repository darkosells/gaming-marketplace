'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile, Listing, Order, Withdrawal, InventoryStats, VendorRank, RankProgress, RankData } from '../types'

// Boosting order type for vendor earnings
interface BoostingOrder {
  id: string
  order_number: string
  vendor_id: string
  customer_id: string
  game: string
  vendor_payout: number
  final_price: number
  platform_fee: number
  payment_status: string
  status: string
  created_at: string
  customer_confirmed_at: string | null
}

export function useVendorData() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [myPurchases, setMyPurchases] = useState<Order[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  
  // NEW: Boosting orders state
  const [myBoostingOrders, setMyBoostingOrders] = useState<BoostingOrder[]>([])
  
  const [inventoryStats, setInventoryStats] = useState<InventoryStats>({
    lowStock: [],
    outOfStock: [],
    overstocked: [],
    totalValue: 0,
    automaticDeliveryStats: {
      totalCodes: 0,
      usedCodes: 0,
      remainingCodes: 0,
      usageRate: 0
    }
  })

  const router = useRouter()
  const supabase = createClient()

  const fetchMyListings = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch listings error:', error)
        return
      }

      setMyListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }, [supabase])

  const fetchMyOrders = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id (
            username
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch orders error:', error)
        return
      }
      
      const mappedOrders = (data || []).map(order => ({
        ...order,
        listing: {
          title: order.listing_title || 'Unknown Item',
          game: order.listing_game || 'N/A',
          category: order.listing_category || 'account',
          image_url: order.listing_image_url
        }
      }))

      setMyOrders(mappedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }, [supabase])

  // Fetch purchases (orders where vendor is the buyer)
  const fetchMyPurchases = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!seller_id (
            username
          ),
          listing:listings (
            title,
            game,
            image_url,
            category
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch purchases error:', error)
        return
      }
      
      const mappedPurchases = (data || []).map(order => ({
        ...order,
        listing: order.listing || {
          title: order.listing_title || 'Unknown Item',
          game: order.listing_game || 'N/A',
          category: order.listing_category || 'account',
          image_url: order.listing_image_url
        }
      }))

      setMyPurchases(mappedPurchases)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    }
  }, [supabase])

  // NEW: Fetch boosting orders where vendor is the booster
  const fetchMyBoostingOrders = useCallback(async (userId: string) => {
    try {
      console.log('Fetching boosting orders for vendor:', userId)
      
      const { data, error } = await supabase
        .from('boosting_orders')
        .select(`
          id,
          order_number,
          vendor_id,
          customer_id,
          game,
          vendor_payout,
          final_price,
          platform_fee,
          payment_status,
          status,
          created_at,
          customer_confirmed_at
        `)
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch boosting orders error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        return
      }

      console.log('Boosting orders fetched:', data?.length || 0)
      setMyBoostingOrders(data || [])
    } catch (error) {
      console.error('Error fetching boosting orders:', error)
    }
  }, [supabase])

  const fetchWithdrawals = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch withdrawals error:', error)
        return
      }

      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }, [supabase])

  const calculateInventoryStats = useCallback(() => {
    if (myListings.length === 0) return

    const lowStock = myListings.filter(l => l.stock > 0 && l.stock < 5 && l.status === 'active')
    const outOfStock = myListings.filter(l => l.stock === 0 || l.status === 'out_of_stock')
    const overstocked = myListings.filter(l => l.stock > 50 && l.status === 'active')
    const totalValue = myListings.reduce((sum, l) => {
      if (l.status !== 'removed') {
        return sum + (l.stock * parseFloat(String(l.price)))
      }
      return sum
    }, 0)

    const automaticListings = myListings.filter(l => l.delivery_type === 'automatic')
    const totalCodes = automaticListings.reduce((sum, l) => sum + l.stock, 0)
    const automaticListingIds = automaticListings.map(l => l.id)
    const usedCodes = myOrders.filter(o =>
      automaticListingIds.includes(o.listing_id) &&
      (o.status === 'completed' || o.status === 'delivered')
    ).length

    const remainingCodes = totalCodes - usedCodes
    const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100) : 0

    setInventoryStats({
      lowStock,
      outOfStock,
      overstocked,
      totalValue,
      automaticDeliveryStats: {
        totalCodes,
        usedCodes,
        remainingCodes,
        usageRate
      }
    })
  }, [myListings, myOrders])

  const checkUser = useCallback(async () => {
    try {
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      )

      const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Fetch profile with rank fields included
      const profilePromise = supabase
        .from('profiles')
        .select(`
          *,
          vendor_rank,
          commission_rate,
          dispute_rate,
          vendor_rank_updated_at
        `)
        .eq('id', user.id)
        .single()

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 10000))
      ]) as any

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Failed to load profile. Please try again.')
        setLoading(false)
        return
      }

      // Set defaults for rank fields if not present (backwards compatibility)
      const profileWithDefaults: Profile = {
        ...profileData,
        vendor_rank: profileData.vendor_rank || 'nova',
        commission_rate: profileData.commission_rate ?? 5.00,
        dispute_rate: profileData.dispute_rate ?? 0,
        vendor_rank_updated_at: profileData.vendor_rank_updated_at || null
      }

      setProfile(profileWithDefaults)

      if (profileData?.role !== 'vendor') {
        router.push('/customer-dashboard')
        return
      }

      // UPDATED: Include fetchMyBoostingOrders in parallel fetch
      const results = await Promise.allSettled([
        fetchMyListings(user.id),
        fetchMyOrders(user.id),
        fetchMyPurchases(user.id),
        fetchMyBoostingOrders(user.id), // NEW: Fetch boosting orders
        fetchWithdrawals(user.id)
      ])

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch data ${index}:`, result.reason)
        }
      })

      setLoading(false)
    } catch (error: any) {
      console.error('Check user error:', error)
      setLoading(false)

      if (error.message?.includes('timeout')) {
        setError('Connection timed out. Please refresh the page.')
      } else {
        router.push('/login')
      }
    }
  }, [supabase, router, fetchMyListings, fetchMyOrders, fetchMyPurchases, fetchMyBoostingOrders, fetchWithdrawals])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    calculateInventoryStats()
  }, [myListings, myOrders, calculateInventoryStats])

  // ============================================
  // DERIVED VALUES - MARKETPLACE
  // ============================================
  const activeListings = myListings.filter(l => l.status === 'active')
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(String(o.amount)), 0)
  
  // Use dynamic commission rate from profile (rank-based) instead of hardcoded 0.05
  const commissionRate = profile?.commission_rate ?? 5.00
  const totalCommission = grossRevenue * (commissionRate / 100)
  const marketplaceEarnings = grossRevenue * (1 - commissionRate / 100)
  
  const pendingOrders = myOrders.filter(o =>
    o.status === 'paid' ||
    o.status === 'delivered' ||
    o.status === 'dispute_raised'
  )
  const marketplacePendingEarnings = pendingOrders.reduce((sum, o) => sum + (parseFloat(String(o.amount)) * (1 - commissionRate / 100)), 0)

  // ============================================
  // DERIVED VALUES - BOOSTING
  // ============================================
 // Completed boosting orders (status completed + payment was made/released)
const completedBoostingOrders = myBoostingOrders.filter(o => 
  o.status === 'completed' && ['paid', 'released'].includes(o.payment_status)
)
  const boostingEarnings = completedBoostingOrders.reduce((sum, o) => sum + parseFloat(String(o.vendor_payout)), 0)
  
  // Pending boosting orders (in progress or awaiting confirmation, payment received)
  const pendingBoostingOrders = myBoostingOrders.filter(o => 
    o.payment_status === 'paid' && 
    o.status !== 'completed' &&
    !['cancelled', 'refunded'].includes(o.status)
  )
  const boostingPendingEarnings = pendingBoostingOrders.reduce((sum, o) => sum + parseFloat(String(o.vendor_payout)), 0)

  // ============================================
  // COMBINED TOTALS
  // ============================================
  const totalEarnings = marketplaceEarnings + boostingEarnings
  const totalPendingEarnings = marketplacePendingEarnings + boostingPendingEarnings
  
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(String(w.amount)), 0)
  
  const netRevenue = totalEarnings - totalWithdrawn

  // Other derived values
  const uniqueGames = Array.from(new Set(myListings.map(l => l.game))).sort()
  const uniqueOrderGames = Array.from(new Set(myOrders.map(o => o.listing?.game || o.listing_game).filter((g): g is string => Boolean(g)))).sort()

  // Purchase derived values
  const completedPurchases = myPurchases.filter(p => p.status === 'completed')
  const pendingPurchases = myPurchases.filter(p => 
    p.status === 'pending' || p.status === 'paid' || p.status === 'delivered'
  )

  // Rank data for VendorRankCard
  const rankData: RankData = {
    currentRank: (profile?.vendor_rank || 'nova') as VendorRank,
    commissionRate: profile?.commission_rate ?? 5.00,
    disputeRate: profile?.dispute_rate ?? 0,
    rankUpdatedAt: profile?.vendor_rank_updated_at || null
  }

  // Calculate account age in days
  const accountAgeDays = profile?.vendor_since 
    ? Math.floor((Date.now() - new Date(profile.vendor_since).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Rank progress data for VendorRankCard
  const rankProgress: RankProgress = {
    completedOrders: completedOrders.length,
    averageRating: profile?.average_rating ?? 0,
    disputeRate: profile?.dispute_rate ?? 0,
    accountAgeDays,
    totalReviews: profile?.total_reviews ?? 0
  }

  return {
    user,
    profile,
    loading,
    error,
    myListings,
    myOrders,
    myPurchases,
    withdrawals,
    inventoryStats,
    activeListings,
    completedOrders,
    grossRevenue,
    totalCommission,
    
    // Marketplace earnings (separate)
    marketplaceEarnings,
    marketplacePendingEarnings,
    
    // Boosting earnings (separate)
    myBoostingOrders,
    completedBoostingOrders,
    boostingEarnings,
    pendingBoostingOrders,
    boostingPendingEarnings,
    
    // Combined totals
    totalEarnings,
    totalPendingEarnings,
    totalWithdrawn,
    netRevenue,
    
    // Legacy (keeping for backwards compatibility)
    pendingOrders,
    pendingEarnings: totalPendingEarnings,
    
    uniqueGames,
    uniqueOrderGames,
    completedPurchases,
    pendingPurchases,
    fetchMyListings,
    fetchMyOrders,
    fetchMyPurchases,
    fetchMyBoostingOrders,
    fetchWithdrawals,
    supabase,
    // Rank exports
    rankData,
    rankProgress
  }
}