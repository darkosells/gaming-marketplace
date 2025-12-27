'use client'

// ============================================================================
// CUSTOMER MY BOOST REQUESTS PAGE (Enhanced with Orders)
// ============================================================================
// Location: app/boosting/my-requests/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { BoostRequest, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP, getDivisionsBetween } from '@/lib/boosting/ranks'
import { formatPrice } from '@/lib/boosting/pricing'

// Extended type to include offer count
interface BoostRequestWithOffers extends BoostRequest {
  offer_count: number
}

// Boosting order type
interface BoostingOrder {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  game: string
  current_rank: string
  desired_rank: string
  queue_type: string
  is_priority: boolean
  final_price: number
  vendor_payout: number
  platform_fee: number
  status: string
  payment_status: string
  created_at: string
  progress_current_rank: string | null
  progress_current_rr: number | null
  vendor?: {
    id: string
    username: string
    avatar_url: string | null
    vendor_rank: string | null
  }
}

// Testimonials data
const TESTIMONIALS = [
  {
    name: "Alex M.",
    rank: "Iron → Diamond",
    text: "Got boosted from Iron to Diamond in just 4 days. The booster was super professional and kept me updated throughout!",
    rating: 5,
    avatar: "A"
  },
  {
    name: "Sarah K.",
    rank: "Silver → Platinum",
    text: "Was stuck in Silver for months. The duo queue option was perfect - learned so much playing with my booster!",
    rating: 5,
    avatar: "S"
  },
  {
    name: "Mike R.",
    rank: "Gold → Immortal",
    text: "Incredible service. My booster communicated every step of the way. Account was 100% safe.",
    rating: 5,
    avatar: "M"
  }
]

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'most_offers', label: 'Most Offers' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
]

// Order status config
const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  awaiting_credentials: { label: 'Awaiting Credentials', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  credentials_received: { label: 'Starting Soon', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  pending_confirmation: { label: 'Pending Confirmation', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  dispute: { label: 'Disputed', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  refunded: { label: 'Refunded', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
}

export default function MyBoostRequestsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<BoostRequestWithOffers[]>([])
  const [orders, setOrders] = useState<BoostingOrder[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [lastVisited, setLastVisited] = useState<Record<string, string>>({})
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null)

  // Check auth & fetch data
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/login?redirect=/boosting/my-requests')
          return
        }
        
        setUser(session.user)
        
        // Load last visited timestamps from localStorage
        const stored = localStorage.getItem('boost_requests_last_visited')
        if (stored) {
          setLastVisited(JSON.parse(stored))
        }
        
        await Promise.all([
          fetchRequests(session.user.id),
          fetchOrders(session.user.id)
        ])
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  // Fetch customer's boost orders
  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from('boosting_orders')
      .select(`
        id,
        order_number,
        customer_id,
        vendor_id,
        game,
        current_rank,
        desired_rank,
        queue_type,
        is_priority,
        final_price,
        vendor_payout,
        platform_fee,
        status,
        payment_status,
        created_at,
        progress_current_rank,
        progress_current_rr,
        vendor:profiles!boosting_orders_vendor_id_fkey (
          id,
          username,
          avatar_url,
          vendor_rank
        )
      `)
      .eq('customer_id', userId)
      .not('status', 'in', '("completed","cancelled","refunded")')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    setOrders(data || [])
  }

  // Fetch customer's requests with actual offer counts
  const fetchRequests = async (userId: string) => {
    // First fetch the requests
    const { data: requestsData, error: requestsError } = await supabase
      .from('boost_requests')
      .select('*')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching requests:', requestsError)
      return
    }

    if (!requestsData || requestsData.length === 0) {
      setRequests([])
      return
    }

    // Now fetch actual offer counts for each request
    const requestIds = requestsData.map(r => r.id)
    
    const { data: offerCounts, error: offersError } = await supabase
      .from('boost_offers')
      .select('request_id')
      .in('request_id', requestIds)
      .eq('status', 'pending')

    if (offersError) {
      console.error('Error fetching offer counts:', offersError)
      // Still show requests, just without accurate counts
      setRequests(requestsData.map(r => ({ ...r, offer_count: r.total_offers_received || 0 })))
      return
    }

    // Count offers per request
    const countMap: Record<string, number> = {}
    offerCounts?.forEach(offer => {
      countMap[offer.request_id] = (countMap[offer.request_id] || 0) + 1
    })

    // Merge counts into requests
    const requestsWithCounts = requestsData.map(request => ({
      ...request,
      offer_count: countMap[request.id] || 0
    }))

    setRequests(requestsWithCounts)
  }

  // Mark request as visited (update localStorage)
  const markAsVisited = (requestId: string) => {
    const updated = { ...lastVisited, [requestId]: new Date().toISOString() }
    setLastVisited(updated)
    localStorage.setItem('boost_requests_last_visited', JSON.stringify(updated))
  }

  // Check if request has new offers since last visit
  const hasNewOffers = (request: BoostRequestWithOffers) => {
    if (request.status !== 'open' || request.offer_count === 0) return false
    const lastVisit = lastVisited[request.id]
    if (!lastVisit) return request.offer_count > 0
    return new Date(request.updated_at) > new Date(lastVisit)
  }

  // Cancel request
  const handleCancelRequest = async (requestId: string) => {
    setCancellingId(requestId)
    
    try {
      const { error } = await supabase
        .from('boost_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('status', 'open')

      if (error) throw error

      // Decline all pending offers
      await supabase
        .from('boost_offers')
        .update({ status: 'declined' })
        .eq('request_id', requestId)
        .eq('status', 'pending')

      // Refresh requests
      if (user) await fetchRequests(user.id)
      setShowCancelModal(null)
      
    } catch (error: any) {
      console.error('Error cancelling request:', error)
      alert('Failed to cancel request: ' + error.message)
    } finally {
      setCancellingId(null)
    }
  }

  // Filter requests
  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : filterStatus === 'in_progress'
      ? requests.filter(r => ['accepted', 'in_progress', 'credentials_received'].includes(r.status))
      : requests.filter(r => r.status === filterStatus)

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'price_high':
        return b.customer_offer_price - a.customer_offer_price
      case 'price_low':
        return a.customer_offer_price - b.customer_offer_price
      case 'most_offers':
        return b.offer_count - a.offer_count
      case 'expiring_soon':
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Stats - now including orders
  const stats = {
    active_orders: orders.length,
    open: requests.filter(r => r.status === 'open').length,
    completed: requests.filter(r => r.status === 'completed').length,
  }

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  // Calculate progress percentage for orders
  const getOrderProgress = (status: string) => {
    switch (status) {
      case 'awaiting_credentials': return 20
      case 'credentials_received': return 35
      case 'in_progress': return 60
      case 'pending_confirmation': return 90
      case 'completed': return 100
      default: return 0
    }
  }

  // Calculate progress percentage for in-progress requests
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'open': return 0
      case 'accepted': return 25
      case 'credentials_received': return 40
      case 'in_progress': return 60
      case 'completed': return 100
      case 'cancelled': return 0
      default: return 0
    }
  }

  const getProgressLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Waiting for payment'
      case 'credentials_received': return 'Booster reviewing'
      case 'in_progress': return 'Boost in progress'
      case 'completed': return 'Completed'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-8">
          {/* Back Link */}
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-cyan-400">{stats.active_orders}</p>
              <p className="text-xs sm:text-sm text-gray-400">Active Orders</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.open}</p>
              <p className="text-xs sm:text-sm text-gray-400">Open Requests</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-green-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-xs sm:text-sm text-gray-400">Completed</p>
            </div>
          </div>

          {/* Active Orders Section */}
          {orders.length > 0 && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-cyan-400">🎮</span>
                  Active Boost Orders
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                    {orders.length} active
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {orders.map((order) => {
                  const currentRank = RANKS_MAP[order.current_rank as RankKey]
                  const desiredRank = RANKS_MAP[order.desired_rank as RankKey]
                  const progressRank = order.progress_current_rank 
                    ? RANKS_MAP[order.progress_current_rank as RankKey] 
                    : null
                  const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.in_progress
                  const progress = getOrderProgress(order.status)

                  return (
                    <Link
                      key={order.id}
                      href={`/dashboard/boosts/${order.id}`}
                      className="block bg-slate-900/60 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Rank Display */}
                        <div className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                          <div className="w-8 h-8 relative">
                            <Image
                              src={currentRank?.image || ''}
                              alt={currentRank?.name || ''}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <span className="text-purple-400">→</span>
                          {progressRank && progressRank.name !== currentRank?.name ? (
                            <>
                              <div className="w-8 h-8 relative">
                                <Image
                                  src={progressRank.image || ''}
                                  alt={progressRank.name || ''}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <span className="text-gray-500">→</span>
                            </>
                          ) : null}
                          <div className="w-8 h-8 relative">
                            <Image
                              src={desiredRank?.image || ''}
                              alt={desiredRank?.name || ''}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-xs text-gray-500 font-mono">{order.order_number}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                            {order.is_priority && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                ⚡ Priority
                              </span>
                            )}
                          </div>
                          
                          {/* Vendor Info */}
                          {order.vendor && (
                            <p className="text-sm text-gray-400">
                              Booster: <span className="text-white">{order.vendor.username}</span>
                            </p>
                          )}

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Price & Arrow */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total Paid</p>
                            <p className="text-lg font-bold text-cyan-400">{formatPrice(order.final_price)}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-600 group-hover:text-cyan-400 transition-colors hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Action hint for awaiting credentials */}
                      {order.status === 'awaiting_credentials' && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2 text-yellow-400 text-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Action Required: Submit your account credentials to start the boost</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Main Card - Requests */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-6">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📋</span>
                  My Boost Requests
                </h1>
                {sortedRequests.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Showing {sortedRequests.length} of {requests.length} requests
                  </p>
                )}
              </div>
              <Link
                href="/boosting/valorant"
                className="px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <span>➕</span>
                New Request
              </Link>
            </div>

            {/* Filter & Sort Row */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterStatus(tab.value)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 text-sm ${
                      filterStatus === tab.value
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-gray-300 hover:text-white hover:border-purple-500/30 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                  <svg className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value)
                            setShowSortDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === option.value
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'text-gray-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Requests List */}
            {sortedRequests.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-5xl sm:text-6xl mb-4">📭</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {requests.length === 0 ? 'No boost requests yet' : 'No requests match this filter'}
                </h3>
                <p className="text-gray-400 mb-8 text-sm sm:text-base">
                  {requests.length === 0 
                    ? 'Create your first boost request and let vendors compete for your order!' 
                    : 'Try selecting a different filter'}
                </p>
                
                {requests.length === 0 && (
                  <>
                    <Link
                      href="/boosting/valorant"
                      className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 mb-12"
                    >
                      Create Boost Request
                    </Link>

                    {/* Testimonials Section */}
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-6 flex items-center justify-center gap-2">
                        <span className="text-yellow-400">⭐</span>
                        What Our Customers Say
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {TESTIMONIALS.map((testimonial, index) => (
                          <div
                            key={index}
                            className="bg-slate-800/50 border border-white/10 rounded-xl p-4 text-left"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {testimonial.avatar}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm">{testimonial.name}</p>
                                <p className="text-purple-400 text-xs">{testimonial.rank}</p>
                              </div>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">"{testimonial.text}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedRequests.map((request) => {
                  const currentRank = RANKS_MAP[request.current_rank as RankKey]
                  const desiredRank = RANKS_MAP[request.desired_rank as RankKey]
                  const isExpired = new Date(request.expires_at) < new Date()
                  const isOpen = request.status === 'open'
                  const isInProgress = ['accepted', 'in_progress', 'credentials_received'].includes(request.status)
                  const hasNew = hasNewOffers(request)
                  const progress = getProgressPercentage(request.status)
                  const offerCount = request.offer_count
                  
                  return (
                    <div
                      key={request.id}
                      className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-5 hover:border-purple-500/30 transition-all duration-300 group relative"
                    >
                      {/* NEW Badge */}
                      {hasNew && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <span className="relative flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 items-center justify-center text-[10px] font-bold text-white">
                              NEW
                            </span>
                          </span>
                        </div>
                      )}

                      <Link
                        href={`/boosting/my-requests/${request.id}`}
                        onClick={() => markAsVisited(request.id)}
                        className="block"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Rank Display with Images */}
                          <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                            <div className="flex items-center gap-1">
                              <div className="w-8 h-8 relative">
                                <Image
                                  src={currentRank?.image || ''}
                                  alt={currentRank?.name || ''}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <span className="text-sm font-medium hidden sm:inline" style={{ color: currentRank?.color }}>
                                {currentRank?.name}
                              </span>
                            </div>
                            <span className="text-purple-400">→</span>
                            <div className="flex items-center gap-1">
                              <div className="w-8 h-8 relative">
                                <Image
                                  src={desiredRank?.image || ''}
                                  alt={desiredRank?.name || ''}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>
                              <span className="text-sm font-medium hidden sm:inline" style={{ color: desiredRank?.color }}>
                                {desiredRank?.name}
                              </span>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-xs text-gray-500 font-mono">{request.request_number}</p>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                request.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                                isInProgress ? 'bg-cyan-500/20 text-cyan-400' :
                                request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {request.status.replace('_', ' ').toUpperCase()}
                              </span>
                              {request.is_priority && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                  ⚡ Priority
                                </span>
                              )}
                              {/* Pulsing dot for unread offers */}
                              {isOpen && offerCount > 0 && hasNew && (
                                <span className="flex items-center gap-1 text-xs text-green-400">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                  </span>
                                  New offers!
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {request.queue_type === 'duo' ? '👥 Duo Queue' : '👤 Solo Queue'}
                              {isOpen && offerCount > 0 && (
                                <span className="ml-2 text-purple-400">
                                  • {offerCount} offer{offerCount !== 1 ? 's' : ''} received
                                </span>
                              )}
                            </p>
                            {isOpen && !isExpired && (
                              <p className="text-xs text-gray-500 mt-1">
                                ⏱️ {getTimeRemaining(request.expires_at)}
                              </p>
                            )}
                            {isExpired && isOpen && (
                              <p className="text-xs text-red-400 mt-1">⚠️ Expired</p>
                            )}

                            {/* Progress Bar for In-Progress Orders */}
                            {isInProgress && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-400">{getProgressLabel(request.status)}</span>
                                  <span className="text-cyan-400">{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Price & Arrow */}
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Your Offer</p>
                              <p className="text-lg font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                {formatPrice(request.customer_offer_price)}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Link>

                      {/* Quick Action Buttons */}
                      {isOpen && !isExpired && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                          <Link
                            href={`/boosting/my-requests/${request.id}`}
                            onClick={() => markAsVisited(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Offers ({offerCount})
                          </Link>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setShowCancelModal(request.id)
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCancelModal(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Cancel Request?</h3>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to cancel this boost request? All pending offers will be declined. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                Keep Request
              </button>
              <button
                onClick={() => handleCancelRequest(showCancelModal)}
                disabled={cancellingId === showCancelModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancellingId === showCancelModal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Cancel Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}