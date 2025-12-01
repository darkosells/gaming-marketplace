'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type {
  AdminUser,
  AdminListing,
  AdminOrder,
  AdminConversation,
  AdminReview,
  AdminWithdrawal,
  AdminVerification,
  AdminNotification,
  FraudFlag,
  AdminStats,
  AnalyticsData
} from '../types'

export function useAdminData(userId: string | undefined, isAdmin: boolean) {
  const supabase = createClient()

  // Data states
  const [users, setUsers] = useState<AdminUser[]>([])
  const [listings, setListings] = useState<AdminListing[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [conversations, setConversations] = useState<AdminConversation[]>([])
  const [activeDisputes, setActiveDisputes] = useState<AdminOrder[]>([])
  const [solvedDisputes, setSolvedDisputes] = useState<AdminOrder[]>([])
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<AdminWithdrawal[]>([])
  const [processedWithdrawals, setProcessedWithdrawals] = useState<AdminWithdrawal[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<AdminVerification[]>([])
  const [pastVerifications, setPastVerifications] = useState<AdminVerification[]>([])
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenueChart: [],
    ordersChart: [],
    disputeRate: 0,
    avgOrderValue: 0,
    topGames: [],
    topSellers: []
  })

  // Fetch functions
  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
  }, [supabase])

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
    if (data) setListings(data)
  }, [supabase])

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
  }, [supabase])

  const fetchConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(title, game, image_url),
        buyer:profiles!conversations_buyer_id_fkey(username),
        seller:profiles!conversations_seller_id_fkey(username),
        order:orders(status, amount)
      `)
      .order('last_message_at', { ascending: false })
    if (data) setConversations(data)
  }, [supabase])

  const fetchDisputes = useCallback(async () => {
    const { data: activeData } = await supabase
      .from('orders')
      .select('*, buyer:profiles!orders_buyer_id_fkey(username, id), seller:profiles!orders_seller_id_fkey(username, id)')
      .eq('status', 'dispute_raised')
      .order('dispute_opened_at', { ascending: false })
    setActiveDisputes(activeData || [])

    const { data: solvedData } = await supabase
      .from('orders')
      .select('*, buyer:profiles!orders_buyer_id_fkey(username, id), seller:profiles!orders_seller_id_fkey(username, id)')
      .not('dispute_opened_at', 'is', null)
      .neq('status', 'dispute_raised')
      .order('completed_at', { ascending: false })
    setSolvedDisputes(solvedData || [])
  }, [supabase])

  const fetchReviews = useCallback(async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*, buyer:profiles!buyer_id(username)')
      .order('created_at', { ascending: false })

    const reviewsWithSellers = await Promise.all(
      (data || []).map(async (review: any) => {
        if (review.seller_id) {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', review.seller_id)
            .single()
          return { ...review, seller: sellerData }
        }
        return { ...review, seller: null }
      })
    )
    setReviews(reviewsWithSellers)
  }, [supabase])

  const fetchWithdrawals = useCallback(async () => {
    const { data: pendingData } = await supabase
      .from('withdrawals')
      .select('*, user:profiles!user_id(username, id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setPendingWithdrawals(pendingData || [])

    const { data: processedData } = await supabase
      .from('withdrawals')
      .select('*, user:profiles!user_id(username, id), processor:profiles!processed_by(username)')
      .in('status', ['completed', 'rejected'])
      .order('processed_at', { ascending: false })
    setProcessedWithdrawals(processedData || [])
  }, [supabase])

  const fetchVerifications = useCallback(async () => {
    const { data: pendingData } = await supabase
      .from('vendor_verifications')
      .select('*, user:profiles!user_id(username, id, created_at)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setPendingVerifications(pendingData || [])

    const { data: pastData } = await supabase
      .from('vendor_verifications')
      .select('*, user:profiles!user_id(username, id), reviewer:profiles!reviewed_by(username)')
      .neq('status', 'pending')
      .order('reviewed_at', { ascending: false })
    setPastVerifications(pastData || [])
  }, [supabase])

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('admin_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }, [supabase, userId])

  const fetchFraudFlags = useCallback(async () => {
    const { data } = await supabase
      .from('fraud_flags')
      .select('*, user:profiles!user_id(username, email, created_at)')
      .order('created_at', { ascending: false })

    if (data) setFraudFlags(data)
  }, [supabase])

  const calculateAnalytics = useCallback(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })

    const revenueChart = last7Days.map(date => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(date))
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.amount || '0'), 0),
        orders: dayOrders.length
      }
    })

    const completedOrders = orders.filter(o => o.status === 'completed')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount || '0'), 0)
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
    const disputeRate = orders.length > 0 ? (activeDisputes.length / orders.length) * 100 : 0

    const gameRevenue: { [key: string]: { revenue: number; count: number } } = {}
    completedOrders.forEach(o => {
      const game = o.listing_game || 'Unknown'
      if (!gameRevenue[game]) gameRevenue[game] = { revenue: 0, count: 0 }
      gameRevenue[game].revenue += parseFloat(o.amount || '0')
      gameRevenue[game].count += 1
    })
    const topGames = Object.entries(gameRevenue)
      .map(([game, data]) => ({ game, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const sellerStats: { [key: string]: any } = {}
    users.filter(u => u.role === 'vendor').forEach(vendor => {
      const vendorSales = completedOrders.filter(o => o.seller_id === vendor.id)
      sellerStats[vendor.id] = {
        username: vendor.username,
        total_sales: vendorSales.length,
        rating: vendor.average_rating || 0
      }
    })
    const topSellers = Object.values(sellerStats)
      .sort((a: any, b: any) => b.total_sales - a.total_sales)
      .slice(0, 5)

    setAnalyticsData({
      revenueChart,
      ordersChart: revenueChart,
      disputeRate: parseFloat(disputeRate.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      topGames,
      topSellers
    })
  }, [orders, users, activeDisputes])

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchListings(),
      fetchOrders(),
      fetchConversations(),
      fetchDisputes(),
      fetchReviews(),
      fetchWithdrawals(),
      fetchVerifications(),
      fetchNotifications(),
      fetchFraudFlags()
    ])
  }, [
    fetchUsers,
    fetchListings,
    fetchOrders,
    fetchConversations,
    fetchDisputes,
    fetchReviews,
    fetchWithdrawals,
    fetchVerifications,
    fetchNotifications,
    fetchFraudFlags
  ])

  // Calculate stats
  const stats: AdminStats = {
    totalUsers: users.length,
    totalListings: listings.length,
    totalOrders: orders.length,
    activeDisputes: activeDisputes.length,
    solvedDisputes: solvedDisputes.length,
    pendingVerifications: pendingVerifications.length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.amount || '0'), 0),
    activeFraudFlags: fraudFlags.filter(f => f.status === 'active').length
  }

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAdmin) return

    fetchAllData()

    const channels = [
      supabase.channel('admin-orders-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { fetchOrders(); fetchDisputes() }),
      supabase.channel('admin-disputes-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => { fetchDisputes(); fetchOrders() }),
      supabase.channel('admin-users-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { fetchUsers(); fetchVerifications() }),
      supabase.channel('admin-listings-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchListings),
      supabase.channel('admin-withdrawals-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, fetchWithdrawals),
      supabase.channel('admin-verifications-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_verifications' }, fetchVerifications),
      supabase.channel('admin-reviews-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, fetchReviews),
      supabase.channel('admin-conversations-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversations),
      supabase.channel('admin-notifications-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchNotifications),
      supabase.channel('admin-fraud-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'fraud_flags' }, fetchFraudFlags)
    ]

    channels.forEach(ch => ch.subscribe())

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [isAdmin, fetchAllData, supabase])

  // Recalculate analytics when data changes
  useEffect(() => {
    if (isAdmin && orders.length > 0) {
      calculateAnalytics()
    }
  }, [orders, users, activeDisputes, isAdmin, calculateAnalytics])

  return {
    // Data
    users,
    listings,
    orders,
    conversations,
    activeDisputes,
    solvedDisputes,
    reviews,
    pendingWithdrawals,
    processedWithdrawals,
    pendingVerifications,
    pastVerifications,
    fraudFlags,
    notifications,
    unreadCount,
    analyticsData,
    stats,

    // Refresh functions
    fetchUsers,
    fetchListings,
    fetchOrders,
    fetchConversations,
    fetchDisputes,
    fetchReviews,
    fetchWithdrawals,
    fetchVerifications,
    fetchNotifications,
    fetchFraudFlags,
    fetchAllData
  }
}