'use client'

// ============================================================================
// VENDOR BOOSTING MARKETPLACE PAGE (Updated with Navigation Tabs)
// ============================================================================
// Location: app/boosting/vendor/marketplace/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { BoostRequest, RankKey } from '@/lib/boosting/types'
import { RANKS, TIERS, RANKS_MAP } from '@/lib/boosting/ranks'
import BoostRequestCard from '@/components/boosting/BoostRequestCard'
import CounterOfferModal from '@/components/boosting/CounterOfferModal'
import { sendBoostNewOfferEmail } from '@/lib/email'

type SortOption = 'newest' | 'price_high' | 'price_low' | 'expiring_soon'

export default function VendorBoostMarketplacePage() {
  const router = useRouter()
  const supabase = createClient()

  // State
  const [user, setUser] = useState<any>(null)
  const [vendorProfile, setVendorProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<BoostRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<BoostRequest[]>([])
  
  // Navigation counts
  const [offersCount, setOffersCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  
  // Filters
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterQueue, setFilterQueue] = useState<string>('all')
  const [showPriorityOnly, setShowPriorityOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<BoostRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Check auth & fetch requests
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/login?redirect=/boosting/vendor/marketplace')
          return
        }
        
        setUser(session.user)
        
        // Fetch vendor profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', session.user.id)
          .single()
        
        setVendorProfile(profile)
        
        await Promise.all([
          fetchRequests(session.user.id),
          fetchNavigationCounts(session.user.id)
        ])
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  // Fetch navigation counts (offers and orders)
  const fetchNavigationCounts = async (userId: string) => {
    try {
      // Count pending offers
      const { count: pendingOffers } = await supabase
        .from('boost_offers')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userId)
        .eq('status', 'pending')

      setOffersCount(pendingOffers || 0)

      // Count all orders
      const { count: totalOrders } = await supabase
        .from('boosting_orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userId)

      setOrdersCount(totalOrders || 0)

      // Count active orders (need attention)
      const { count: activeOrders } = await supabase
        .from('boosting_orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userId)
        .in('status', ['awaiting_credentials', 'credentials_received', 'in_progress', 'pending_confirmation'])

      setActiveOrdersCount(activeOrders || 0)
    } catch (err) {
      console.error('Error fetching nav counts:', err)
    }
  }

  // Fetch open requests (excluding ones vendor has already submitted offers for)
  const fetchRequests = async (userId?: string) => {
    const vendorId = userId || user?.id
    if (!vendorId) return

    // First, get all request IDs that this vendor has already made offers on
    const { data: existingOffers } = await supabase
      .from('boost_offers')
      .select('request_id')
      .eq('vendor_id', vendorId)
      .in('status', ['pending', 'accepted'])

    const excludedRequestIds = existingOffers?.map(o => o.request_id) || []

    // Fetch open requests, excluding ones vendor already offered on
    let query = supabase
      .from('boost_requests')
      .select(`
        *,
        customer:profiles!boost_requests_customer_id_fkey(id, username, avatar_url, email)
      `)
      .eq('status', 'open')
      .lt('total_offers_received', 6)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    // Exclude requests vendor already has pending/accepted offers on
    if (excludedRequestIds.length > 0) {
      query = query.not('id', 'in', `(${excludedRequestIds.join(',')})`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      return
    }

    setRequests(data || [])
  }

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...requests]

    // Filter by tier
    if (filterTier !== 'all') {
      const tierRanks = RANKS.filter(r => r.tier === filterTier).map(r => r.key)
      filtered = filtered.filter(r => 
        tierRanks.includes(r.current_rank as RankKey) || tierRanks.includes(r.desired_rank as RankKey)
      )
    }

    // Filter by queue type
    if (filterQueue !== 'all') {
      filtered = filtered.filter(r => r.queue_type === filterQueue)
    }

    // Filter priority only
    if (showPriorityOnly) {
      filtered = filtered.filter(r => r.is_priority)
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'price_high':
        filtered.sort((a, b) => b.customer_offer_price - a.customer_offer_price)
        break
      case 'price_low':
        filtered.sort((a, b) => a.customer_offer_price - b.customer_offer_price)
        break
      case 'expiring_soon':
        filtered.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())
        break
    }

    setFilteredRequests(filtered)
  }, [requests, sortBy, filterTier, filterQueue, showPriorityOnly])

  // Handle accept offer
  const handleAccept = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setIsModalOpen(true)
    }
  }

  // Handle counter offer
  const handleCounterOffer = (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setIsModalOpen(true)
    }
  }

  // Submit offer
  const handleSubmitOffer = async (data: {
    requestId: string
    offerType: 'accept' | 'counter'
    offeredPrice?: number
    estimatedDays?: number
    vendorNotes?: string
  }) => {
    setIsSubmitting(true)
    
    try {
      const request = requests.find(r => r.id === data.requestId)
      if (!request) throw new Error('Request not found')

      // Calculate offer price and platform fee
      const offeredPrice = data.offerType === 'counter' && data.offeredPrice 
        ? data.offeredPrice 
        : request.customer_offer_price
      const platformFee = offeredPrice * 0.08

      // Check if vendor has a previously declined offer for this request
      const { data: existingOffer } = await supabase
        .from('boost_offers')
        .select('id')
        .eq('request_id', data.requestId)
        .eq('vendor_id', user.id)
        .eq('status', 'declined')
        .single()

      let error: any = null

      if (existingOffer) {
        // Update the existing declined offer back to pending
        const { error: updateError } = await supabase
          .from('boost_offers')
          .update({
            offer_type: data.offerType,
            offered_price: offeredPrice,
            platform_fee: platformFee,
            estimated_days: data.estimatedDays,
            vendor_notes: data.vendorNotes || null,
            status: 'pending',
            created_at: new Date().toISOString(), // Reset timestamp
          })
          .eq('id', existingOffer.id)
        
        error = updateError
      } else {
        // Insert a new offer
        const { error: insertError } = await supabase
          .from('boost_offers')
          .insert({
            request_id: data.requestId,
            vendor_id: user.id,
            offer_type: data.offerType,
            offered_price: offeredPrice,
            platform_fee: platformFee,
            estimated_days: data.estimatedDays,
            vendor_notes: data.vendorNotes || null,
          })
        
        error = insertError
      }

      if (error) throw error

      // Only update total_offers_received for NEW offers (not re-submissions)
      if (!existingOffer) {
        await supabase
          .from('boost_requests')
          .update({ total_offers_received: (request.total_offers_received || 0) + 1 })
          .eq('id', data.requestId)
      }

      // ========== SEND EMAIL TO CUSTOMER ==========
      const customer = request.customer as any
      if (customer?.email) {
        const currentRankData = RANKS_MAP[request.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[request.desired_rank as RankKey]
        
        await sendBoostNewOfferEmail({
          customerEmail: customer.email,
          customerUsername: customer.username || 'Customer',
          boosterUsername: vendorProfile?.username || 'Booster',
          currentRank: currentRankData?.name || request.current_rank,
          desiredRank: desiredRankData?.name || request.desired_rank,
          offerPrice: data.offerType === 'counter' && data.offeredPrice 
            ? data.offeredPrice 
            : request.customer_offer_price,
          offerType: data.offerType,
          requestId: request.id,
          requestNumber: request.request_number || request.id.slice(0, 8).toUpperCase()
        })
      }
      // =============================================

      // Refresh requests and counts
      await Promise.all([
        fetchRequests(),
        fetchNavigationCounts(user.id)
      ])
      setIsModalOpen(false)
      setSelectedRequest(null)
      
      // Show success modal
      setShowSuccessModal(true)
    } catch (error: any) {
      console.error('Error submitting offer:', error)
      setErrorMessage(error.message || 'Failed to submit offer')
    } finally {
      setIsSubmitting(false)
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
          <p className="text-white mt-6 text-lg">Loading marketplace...</p>
        </div>
      </div>
    )
  }

  // Count active filters
  const activeFilterCount = [
    filterTier !== 'all',
    filterQueue !== 'all', 
    showPriorityOnly
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="relative bg-slate-900 border border-green-500/30 rounded-2xl p-6 max-w-md w-full text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Offer Submitted!</h3>
            <p className="text-gray-400 mb-6">
              Your offer has been sent to the customer. You'll be notified when they respond.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Continue Browsing
              </button>
              <Link
                href="/boosting/vendor/offers"
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all text-center"
              >
                View My Offers
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setErrorMessage(null)}></div>
          <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Failed to Submit Offer</h3>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-8">
          {/* Back Link */}
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>

          {/* ========== NAVIGATION TABS ========== */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Marketplace Tab - Active */}
              <Link
                href="/boosting/vendor/marketplace"
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-center transition-all shadow-lg shadow-purple-500/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Marketplace</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{requests.length}</span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 hidden sm:block">Find boost requests</p>
              </Link>

              {/* My Offers Tab */}
              <Link
                href="/boosting/vendor/offers"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold text-center transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📋</span>
                  <span>My Offers</span>
                  {offersCount > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs">{offersCount}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Pending responses</p>
              </Link>

              {/* My Orders Tab */}
              <Link
                href="/boosting/vendor/orders"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold text-center transition-all border border-white/5 hover:border-white/10 relative"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎮</span>
                  <span>My Orders</span>
                  {ordersCount > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs">{ordersCount}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Active & completed</p>
                
                {/* Notification dot for orders needing attention */}
                {activeOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">
                      {activeOrdersCount}
                    </span>
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-6">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">🎯</span>
                  Available Boost Requests
                </h1>
                {filteredRequests.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Showing {filteredRequests.length} of {requests.length} requests
                    {filteredRequests.length !== requests.length && (
                      <span className="text-purple-400"> (filtered)</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${showFilters
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                    }`}
                >
                  <span className="text-base sm:text-lg">🔍</span>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{activeFilterCount}</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    fetchRequests()
                    fetchNavigationCounts(user?.id)
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                  title="Refresh"
                >
                  <span>🔄</span>
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Sort By */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔢 Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price_high">Highest Price</option>
                      <option value="price_low">Lowest Price</option>
                      <option value="expiring_soon">Expiring Soon</option>
                    </select>
                  </div>

                  {/* Tier Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🏆 Rank Tier</label>
                    <select
                      value={filterTier}
                      onChange={(e) => setFilterTier(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                    >
                      <option value="all">All Tiers</option>
                      {TIERS.map(tier => (
                        <option key={tier.name} value={tier.name}>{tier.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Queue Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🎮 Queue Type</label>
                    <select
                      value={filterQueue}
                      onChange={(e) => setFilterQueue(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                    >
                      <option value="all">All Queues</option>
                      <option value="solo">Solo Queue</option>
                      <option value="duo">Duo Queue</option>
                    </select>
                  </div>

                  {/* Priority Toggle */}
                  <div>
                    <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">⚡ Priority</label>
                    <button
                      onClick={() => setShowPriorityOnly(!showPriorityOnly)}
                      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        showPriorityOnly 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-slate-900/50 text-gray-400 border border-white/10 hover:border-yellow-500/30'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Priority Only
                    </button>
                  </div>
                </div>

                {activeFilterCount > 0 && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setSortBy('newest')
                        setFilterTier('all')
                        setFilterQueue('all')
                        setShowPriorityOnly(false)
                      }}
                      className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border border-red-500/30 flex items-center gap-2"
                    >
                      <span>✕</span>
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Requests Grid */}
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-5xl sm:text-6xl mb-4">{requests.length === 0 ? '📭' : '🔍'}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {requests.length === 0 ? 'No open requests' : 'No requests match your filters'}
                </h3>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  {requests.length === 0 
                    ? 'There are no open boost requests at the moment. Check back later!' 
                    : 'Try adjusting your filters to see more results'}
                </p>
                {requests.length > 0 && (
                  <button
                    onClick={() => {
                      setSortBy('newest')
                      setFilterTier('all')
                      setFilterQueue('all')
                      setShowPriorityOnly(false)
                    }}
                    className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {filteredRequests.map((request) => (
                  <BoostRequestCard
                    key={request.id}
                    request={request}
                    onAccept={handleAccept}
                    onCounterOffer={handleCounterOffer}
                    showActions={true}
                    isVendorView={true}
                  />
                ))}
              </div>
            )}

            {/* Tips Section */}
            <div className="mt-8 p-5 rounded-xl bg-slate-800/50 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>💡</span>
                Tips for Getting Orders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: 'Respond Quickly', desc: 'Customers often accept the first few offers' },
                  { title: 'Be Competitive', desc: 'Accept at customer\'s price for faster acceptance' },
                  { title: 'Add Notes', desc: 'Explain your experience and availability' },
                ].map((tip, index) => (
                  <div key={index} className="p-3 rounded-lg bg-slate-900/50">
                    <h4 className="font-semibold text-white text-sm mb-1">{tip.title}</h4>
                    <p className="text-xs text-gray-400">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* Counter Offer Modal */}
      <CounterOfferModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedRequest(null)
        }}
        request={selectedRequest}
        onSubmit={handleSubmitOffer}
        isLoading={isSubmitting}
      />
    </div>
  )
}