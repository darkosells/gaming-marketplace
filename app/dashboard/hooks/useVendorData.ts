'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Profile, Listing, Order, Withdrawal, InventoryStats } from '../types'

export function useVendorData() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])

  // Inventory stats
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

  // Fetch my listings
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

  // Fetch my orders
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

  // Fetch withdrawals
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

  // Calculate inventory stats
  const calculateInventoryStats = useCallback(() => {
    const lowStock = myListings.filter(l => l.stock > 0 && l.stock < 5 && l.status === 'active')
    const outOfStock = myListings.filter(l => l.stock === 0 || l.status === 'out_of_stock')
    const overstocked = myListings.filter(l => l.stock > 50 && l.status === 'active')
    const totalValue = myListings.reduce((sum, l) => {
      if (l.status !== 'removed') {
        return sum + (l.stock * parseFloat(l.price))
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

  // Check user and load all data
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

      const profilePromise = supabase
        .from('profiles')
        .select('*')
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

      setProfile(profileData)

      if (profileData?.role !== 'vendor') {
        router.push('/customer-dashboard')
        return
      }

      const results = await Promise.allSettled([
        fetchMyListings(user.id),
        fetchMyOrders(user.id),
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
  }, [supabase, router, fetchMyListings, fetchMyOrders, fetchWithdrawals])

  // Initial load
  useEffect(() => {
    checkUser()
  }, [])

  // Calculate inventory stats when data changes
  useEffect(() => {
    if (myListings.length > 0) {
      calculateInventoryStats()
    }
  }, [myListings, myOrders, calculateInventoryStats])

  // Computed values
  const activeListings = myListings.filter(l => l.status === 'active')
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0)
  const totalCommission = grossRevenue * 0.05
  const totalEarnings = grossRevenue * 0.95
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(String(w.amount)), 0)
  const netRevenue = totalEarnings - totalWithdrawn
  const pendingOrders = myOrders.filter(o =>
    o.status === 'paid' ||
    o.status === 'delivered' ||
    o.status === 'dispute_raised'
  )
  const pendingEarnings = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.amount) * 0.95), 0)

  // Get unique games from listings
  const uniqueGames = Array.from(new Set(myListings.map(l => l.game))).sort()

  // Get unique games from orders
  const uniqueOrderGames = Array.from(
    new Set(myOrders.map(o => o.listing?.game || o.listing_game).filter(Boolean))
  ).sort() as string[]

  return {
    // Auth & Profile
    user,
    profile,
    loading,
    error,
    
    // Data
    myListings,
    myOrders,
    withdrawals,
    inventoryStats,
    
    // Computed values
    activeListings,
    completedOrders,
    grossRevenue,
    totalCommission,
    totalEarnings,
    totalWithdrawn,
    netRevenue,
    pendingOrders,
    pendingEarnings,
    uniqueGames,
    uniqueOrderGames,
    
    // Actions
    fetchMyListings,
    fetchMyOrders,
    fetchWithdrawals,
    
    // Supabase client for actions
    supabase
  }
}