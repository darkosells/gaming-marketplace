'use client'

// ============================================================================
// VENDOR MY OFFERS PAGE (Updated with Navigation Tabs)
// ============================================================================
// Location: app/boosting/vendor/offers/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { BoostOffer, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { formatPrice, calculateVendorPayout } from '@/lib/boosting/pricing'
import { OFFER_STATUS_CONFIG, BOOSTING_COMMISSION_RATE } from '@/lib/boosting/constants'

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'expiring_soon', label: 'Expiring Soon' },
]

export default function VendorMyOffersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [offers, setOffers] = useState<BoostOffer[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null)
  const [showWithdrawModal, setShowWithdrawModal] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Navigation counts
  const [marketplaceCount, setMarketplaceCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)

  // Check auth & fetch offers
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/login?redirect=/boosting/vendor/offers')
          return
        }
        
        setUser(session.user)
        await Promise.all([
          fetchOffers(session.user.id),
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

  // Fetch navigation counts
  const fetchNavigationCounts = async (userId: string) => {
    try {
      // Count open marketplace requests
      const { count: openRequests } = await supabase
        .from('boost_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open')
        .lt('total_offers_received', 6)
        .gt('expires_at', new Date().toISOString())

      setMarketplaceCount(openRequests || 0)

      // Count all orders
      const { count: totalOrders } = await supabase
        .from('boosting_orders')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', userId)

      setOrdersCount(totalOrders || 0)

      // Count active orders
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

  // Fetch vendor's offers - FIXED to fetch all requests regardless of status
  const fetchOffers = async (userId: string) => {
    try {
      const { data: offersData, error: offersError } = await supabase
        .from('boost_offers')
        .select('*')
        .eq('vendor_id', userId)
        .order('created_at', { ascending: false })

      if (offersError) {
        console.error('Error fetching offers:', offersError)
        return
      }

      if (!offersData || offersData.length === 0) {
        setOffers([])
        return
      }

      const requestIds = [...new Set(offersData.map(o => o.request_id))]

      // FIXED: Removed status filter - fetch ALL requests regardless of their current status
      const { data: requestsData, error: requestsError } = await supabase
        .from('boost_requests')
        .select(`
          id,
          request_number,
          current_rank,
          desired_rank,
          queue_type,
          is_priority,
          customer_offer_price,
          platform_suggested_price,
          status,
          expires_at,
          customer_id
        `)
        .in('id', requestIds)

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
      }

      const customerIds = [...new Set((requestsData || []).map(r => r.customer_id).filter(Boolean))]
      
      let customersData: any[] = []
      if (customerIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', customerIds)
        customersData = data || []
      }

      const offersWithRequests = offersData.map(offer => {
        const request = requestsData?.find(r => r.id === offer.request_id)
        const customer = request ? customersData?.find(c => c.id === request.customer_id) : null
        return {
          ...offer,
          request: request ? {
            ...request,
            customer
          } : null
        }
      })

      setOffers(offersWithRequests)
    } catch (err) {
      console.error('Error in fetchOffers:', err)
    }
  }

  const handleWithdraw = async (offerId: string) => {
    setWithdrawingId(offerId)
    
    try {
      const { error } = await supabase
        .from('boost_offers')
        .update({ status: 'withdrawn' })
        .eq('id', offerId)
        .eq('status', 'pending')

      if (error) throw error

      setShowWithdrawModal(null)
      if (user) await fetchOffers(user.id)
    } catch (error: any) {
      console.error('Error withdrawing offer:', error)
      setErrorMessage(error.message || 'Failed to withdraw offer. Please try again.')
    } finally {
      setWithdrawingId(null)
    }
  }

  const filteredOffers = filterStatus === 'all' 
    ? offers 
    : offers.filter(o => o.status === filterStatus)

  const sortedOffers = [...filteredOffers].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'price_high':
        return (b.offered_price || 0) - (a.offered_price || 0)
      case 'price_low':
        return (a.offered_price || 0) - (b.offered_price || 0)
      case 'expiring_soon':
        const aExpires = a.request?.expires_at ? new Date(a.request.expires_at).getTime() : Infinity
        const bExpires = b.request?.expires_at ? new Date(b.request.expires_at).getTime() : Infinity
        return aExpires - bExpires
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  const stats = {
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    declined: offers.filter(o => o.status === 'declined').length,
    totalEarnings: offers
      .filter(o => o.status === 'accepted')
      .reduce((sum, o: any) => sum + calculateVendorPayout(o.offered_price || o.request?.customer_offer_price || 0), 0),
    acceptanceRate: offers.length > 0 
      ? Math.round((offers.filter(o => o.status === 'accepted').length / 
          offers.filter(o => ['accepted', 'declined'].includes(o.status)).length) * 100) || 0
      : 0,
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return { text: 'Expired', isExpired: true, isUrgent: false }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    const isUrgent = days < 1
    
    if (days > 0) return { text: `${days}d ${hours}h left`, isExpired: false, isUrgent }
    return { text: `${hours}h left`, isExpired: false, isUrgent }
  }

  const getTimeSinceSubmitted = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diff = now.getTime() - created.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return `${minutes}m ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading offers...</p>
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
          {/* Back Link - Updated to go to Marketplace */}
          <Link 
            href="/boosting/vendor/marketplace"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </Link>

          {/* ========== NAVIGATION TABS ========== */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-6">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Marketplace Tab */}
              <Link
                href="/boosting/vendor/marketplace"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold text-center transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎯</span>
                  <span>Marketplace</span>
                  {marketplaceCount > 0 && (
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">{marketplaceCount}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Find boost requests</p>
              </Link>

              {/* My Offers Tab - Active */}
              <Link
                href="/boosting/vendor/offers"
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-center transition-all shadow-lg shadow-purple-500/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📋</span>
                  <span>My Offers</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{offers.length}</span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 hidden sm:block">Pending responses</p>
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

          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-xs sm:text-sm text-gray-400">Pending</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-green-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.accepted}</p>
              <p className="text-xs sm:text-sm text-gray-400">Accepted</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-red-400">{stats.declined}</p>
              <p className="text-xs sm:text-sm text-gray-400">Declined</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/20 rounded-xl p-3 sm:p-4">
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">{formatPrice(stats.totalEarnings)}</p>
              <p className="text-xs sm:text-sm text-gray-400">Total Earnings</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/20 rounded-xl p-3 sm:p-4 col-span-2 sm:col-span-1">
              <p className="text-xl sm:text-2xl font-bold text-purple-400">{stats.acceptanceRate}%</p>
              <p className="text-xs sm:text-sm text-gray-400">Acceptance Rate</p>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-6">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📋</span>
                  My Boost Offers
                </h1>
                {sortedOffers.length > 0 && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Showing {sortedOffers.length} of {offers.length} offers
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  fetchOffers(user?.id)
                  fetchNavigationCounts(user?.id)
                }}
                className="px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>

            {/* Filter & Sort Row */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 border-b border-white/10 pb-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'declined', label: 'Declined' },
                  { value: 'withdrawn', label: 'Withdrawn' },
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

            {/* Offers List */}
            {sortedOffers.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-5xl sm:text-6xl mb-4">{offers.length === 0 ? '📭' : '🔍'}</div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {offers.length === 0 ? 'No offers yet' : 'No offers match this filter'}
                </h3>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  {offers.length === 0 
                    ? "You haven't made any offers yet. Browse the marketplace to get started!" 
                    : 'Try selecting a different filter'}
                </p>
                <Link
                  href="/boosting/vendor/marketplace"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedOffers.map((offer: any) => {
                  const request = offer.request
                  const statusConfig = OFFER_STATUS_CONFIG[offer.status]
                  
                  // Handle offers without request data (fallback UI)
                  if (!request) {
                    const vendorEarnings = calculateVendorPayout(offer.offered_price || 0)
                    return (
                      <div 
                        key={offer.id}
                        className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                                {statusConfig?.label}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                offer.offer_type === 'accept' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {offer.offer_type === 'accept' ? 'Accepted Price' : 'Counter-Offer'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              Offer Price: <span className="text-white font-bold">{formatPrice(offer.offered_price || 0)}</span>
                              <span className="text-emerald-400 ml-2">(You earn: {formatPrice(vendorEarnings)})</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted {getTimeSinceSubmitted(offer.created_at)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {offer.status === 'accepted' && offer.order_id && (
                              <Link
                                href={`/boosting/vendor/orders/${offer.order_id}`}
                                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium transition-colors border border-green-500/30"
                              >
                                View Order →
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  const currentRank = RANKS_MAP[request.current_rank as RankKey]
                  const desiredRank = RANKS_MAP[request.desired_rank as RankKey]
                  
                  const displayPrice = offer.offer_type === 'accept' 
                    ? request.customer_offer_price 
                    : offer.offered_price
                  
                  const vendorEarnings = calculateVendorPayout(displayPrice || 0)
                  const timeRemaining = getTimeRemaining(request.expires_at)
                  const timeSinceSubmitted = getTimeSinceSubmitted(offer.created_at)

                  return (
                    <div 
                      key={offer.id}
                      className={`bg-slate-800/50 border rounded-xl p-4 sm:p-5 hover:border-purple-500/30 transition-all duration-300 relative ${
                        offer.status === 'pending' && timeRemaining.isUrgent 
                          ? 'border-orange-500/30' 
                          : timeRemaining.isExpired && offer.status === 'pending'
                          ? 'border-red-500/30'
                          : 'border-white/10'
                      }`}
                    >
                      {offer.status === 'pending' && !timeRemaining.isExpired && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 relative">
                              {currentRank?.image ? (
                                <Image src={currentRank.image} alt={currentRank.name} fill className="object-contain" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                              )}
                            </div>
                            <span className="text-xs font-medium hidden sm:inline" style={{ color: currentRank?.color }}>
                              {currentRank?.name}
                            </span>
                          </div>
                          <span className="text-purple-400">→</span>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 relative">
                              {desiredRank?.image ? (
                                <Image src={desiredRank.image} alt={desiredRank.name} fill className="object-contain" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                              )}
                            </div>
                            <span className="text-xs font-medium hidden sm:inline" style={{ color: desiredRank?.color }}>
                              {desiredRank?.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-xs text-gray-500 font-mono">{request.request_number}</p>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                              {statusConfig?.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              offer.offer_type === 'accept' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {offer.offer_type === 'accept' ? 'Accepted Price' : 'Counter-Offer'}
                            </span>
                            {request.is_priority && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                ⚡ Priority
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400">
                            Customer: <span className="text-purple-400">{request.customer?.username || 'Unknown'}</span>
                          </p>
                          
                          {offer.vendor_notes && (
                            <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                              "{offer.vendor_notes}"
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>Submitted {timeSinceSubmitted}</span>
                            {offer.estimated_days && (
                              <>
                                <span>•</span>
                                <span>Est: {offer.estimated_days} days</span>
                              </>
                            )}
                            {offer.status === 'pending' && (
                              <>
                                <span>•</span>
                                <span className={`${
                                  timeRemaining.isExpired ? 'text-red-400' : 
                                  timeRemaining.isUrgent ? 'text-orange-400' : 'text-gray-500'
                                }`}>
                                  {timeRemaining.isExpired ? '⚠️ Request Expired' : `⏱️ ${timeRemaining.text}`}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Your Offer</p>
                            <p className="text-lg font-bold text-white">
                              {formatPrice(displayPrice || 0)}
                            </p>
                            <p className="text-xs text-emerald-400">
                              You earn: {formatPrice(vendorEarnings)}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            {offer.status === 'pending' && !timeRemaining.isExpired && (
                              <button
                                onClick={() => setShowWithdrawModal(offer.id)}
                                disabled={withdrawingId === offer.id}
                                className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 border border-red-500/30"
                              >
                                {withdrawingId === offer.id ? '...' : 'Withdraw'}
                              </button>
                            )}
                            
                            {offer.status === 'accepted' && (
                              <Link
                                href={`/boosting/vendor/orders/${offer.order_id || request.id}`}
                                className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs sm:text-sm font-medium transition-colors border border-green-500/30"
                              >
                                View Order
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {offer.status === 'accepted' && offer.accepted_at && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <p className="text-xs text-green-400">
                            ✓ Accepted on {new Date(offer.accepted_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-emerald-400 font-medium">
                            💰 Earned: {formatPrice(vendorEarnings)}
                          </p>
                        </div>
                      )}
                      
                      {offer.status === 'declined' && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-xs text-red-400">
                            ✗ Declined - Customer chose another offer
                          </p>
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

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWithdrawModal(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Withdraw Offer?</h3>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to withdraw this offer? You won't be able to undo this action.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowWithdrawModal(null)} className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all">
                Keep Offer
              </button>
              <button
                onClick={() => handleWithdraw(showWithdrawModal)}
                disabled={withdrawingId === showWithdrawModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {withdrawingId === showWithdrawModal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Withdraw'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setErrorMessage(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="w-full py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}