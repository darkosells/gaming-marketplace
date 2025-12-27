'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { BoostRequest, BoostOffer, BoostingOrder, VendorBoostingStats, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP, getRankIcon } from '@/lib/boosting/ranks'
import { formatPrice } from '@/lib/boosting/pricing'
import { OFFER_STATUS_CONFIG, ORDER_STATUS_CONFIG } from '@/lib/boosting/constants'

interface BoostingTabProps {
  userId: string
  activeTab: string
}

export default function BoostingTab({ userId, activeTab }: BoostingTabProps) {
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VendorBoostingStats | null>(null)
  const [openRequestsCount, setOpenRequestsCount] = useState(0)
  const [pendingOffers, setPendingOffers] = useState<BoostOffer[]>([])
  const [activeOrders, setActiveOrders] = useState<BoostingOrder[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === 'boosting') {
      fetchBoostingData()
    }
  }, [activeTab, userId])

  const fetchBoostingData = async () => {
    setLoading(true)
    
    try {
      // Fetch all data in parallel
      const [
        statsResult,
        openRequestsResult,
        pendingOffersResult,
        activeOrdersResult
      ] = await Promise.all([
        // Vendor stats
        supabase
          .from('vendor_boosting_stats')
          .select('*')
          .eq('vendor_id', userId)
          .single(),
        
        // Open requests count
        supabase
          .from('boost_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open')
          .lt('total_offers_received', 6)
          .gt('expires_at', new Date().toISOString()),
        
        // Pending offers (with request details)
        supabase
          .from('boost_offers')
          .select(`
            *,
            request:boost_requests(
              id, request_number, current_rank, desired_rank, 
              customer_offer_price, status, expires_at,
              customer:profiles!boost_requests_customer_id_fkey(username)
            )
          `)
          .eq('vendor_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Active orders
        supabase
          .from('boosting_orders')
          .select(`
            *,
            customer:profiles!boosting_orders_customer_id_fkey(username)
          `)
          .eq('vendor_id', userId)
          .in('status', ['credentials_received', 'in_progress', 'pending_confirmation'])
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      if (statsResult.data) setStats(statsResult.data)
      setOpenRequestsCount(openRequestsResult.count || 0)
      setPendingOffers(pendingOffersResult.data || [])
      setActiveOrders(activeOrdersResult.data || [])

      // Build recent activity from offers and orders
      const activity: any[] = []
      
      pendingOffersResult.data?.forEach((offer: any) => {
        activity.push({
          type: 'offer_pending',
          id: offer.id,
          title: `Offer pending for ${offer.request?.request_number}`,
          subtitle: `${RANKS_MAP[offer.request?.current_rank]?.name} → ${RANKS_MAP[offer.request?.desired_rank]?.name}`,
          time: offer.created_at,
          status: 'pending'
        })
      })

      activeOrdersResult.data?.forEach((order: any) => {
        activity.push({
          type: 'order_active',
          id: order.id,
          title: `Active boost ${order.order_number}`,
          subtitle: `${RANKS_MAP[order.current_rank]?.name} → ${RANKS_MAP[order.desired_rank]?.name}`,
          time: order.updated_at,
          status: order.status
        })
      })

      // Sort by time
      activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      setRecentActivity(activity.slice(0, 5))

    } catch (error) {
      console.error('Error fetching boosting data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-purple-400">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold">Loading boosting data...</span>
        </div>
      </div>
    )
  }

  return (
    <div id="boosting-section">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🚀</span>
            Boosting Services
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Offer rank boosting services to customers
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href="/boosting/vendor/marketplace"
            className="px-4 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <span>🔍</span>
            Browse Marketplace
            {openRequestsCount > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{openRequestsCount}</span>
            )}
          </Link>
          <Link
            href="/boosting/vendor/offers"
            className="px-4 py-2.5 rounded-xl font-semibold bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <span>📋</span>
            My Offers
            {pendingOffers.length > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs">{pendingOffers.length}</span>
            )}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <span className="text-xs text-gray-400">Earnings</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-400">
            {formatPrice(stats?.total_earnings || 0)}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <span className="text-lg">✅</span>
            </div>
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-400">
            {stats?.total_boosts_completed || 0}
          </p>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-yellow-500/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
            <span className="text-xs text-gray-400">Rating</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-400">
            {stats?.boost_rating?.toFixed(1) || '0.0'}
            <span className="text-sm text-gray-500 ml-1">/ 5</span>
          </p>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <span className="text-lg">📈</span>
            </div>
            <span className="text-xs text-gray-400">Divisions</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400">
            {stats?.total_divisions_boosted || 0}
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Active Orders */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-green-400">⚡</span>
              Active Orders
            </h3>
            {activeOrders.length > 0 && (
              <Link 
                href="/boosting/vendor/orders"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All →
              </Link>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-400 text-sm">No active boost orders</p>
              <p className="text-gray-500 text-xs mt-1">Accept offers to start boosting</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((order: any) => {
                const currentRank = RANKS_MAP[order.current_rank as keyof typeof RANKS_MAP]
                const desiredRank = RANKS_MAP[order.desired_rank as keyof typeof RANKS_MAP]
                const statusConfig = ORDER_STATUS_CONFIG[order.status]

                return (
                  <Link
                    key={order.id}
                    href={`/boosting/vendor/orders/${order.id}`}
                    className="block p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-mono">{order.order_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                        {statusConfig?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getRankIcon(order.current_rank as RankKey)}</span>
                        <span className="text-xs" style={{ color: currentRank?.color }}>{currentRank?.name}</span>
                      </div>
                      <span className="text-purple-400 text-xs">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getRankIcon(order.desired_rank as RankKey)}</span>
                        <span className="text-xs" style={{ color: desiredRank?.color }}>{desiredRank?.name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Customer: {order.customer?.username}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Offers */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-yellow-400">⏳</span>
              Pending Offers
            </h3>
            {pendingOffers.length > 0 && (
              <Link 
                href="/boosting/vendor/offers"
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All →
              </Link>
            )}
          </div>

          {pendingOffers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-gray-400 text-sm">No pending offers</p>
              <p className="text-gray-500 text-xs mt-1">Browse marketplace to submit offers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOffers.map((offer: any) => {
                const request = offer.request
                if (!request) return null
                
                const currentRank = RANKS_MAP[request.current_rank as keyof typeof RANKS_MAP]
                const desiredRank = RANKS_MAP[request.desired_rank as keyof typeof RANKS_MAP]

                return (
                  <div
                    key={offer.id}
                    className="p-3 rounded-lg bg-slate-900/50 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-mono">{request.request_number}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400">
                        {offer.offer_type === 'accept' ? 'Accepted Price' : 'Counter-Offer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getRankIcon(request.current_rank as RankKey)}</span>
                        <span className="text-xs" style={{ color: currentRank?.color }}>{currentRank?.name}</span>
                      </div>
                      <span className="text-purple-400 text-xs">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{getRankIcon(request.desired_rank as RankKey)}</span>
                        <span className="text-xs" style={{ color: desiredRank?.color }}>{desiredRank?.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        Customer: {request.customer?.username}
                      </p>
                      <p className="text-sm font-semibold text-green-400">
                        {formatPrice(offer.offered_price || request.customer_offer_price)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Getting Started (for new boosters) */}
      {(!stats || (stats.total_boosts_completed || 0) === 0) && (
        <div className="mt-6 p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>🚀</span>
            Getting Started with Boosting
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { step: 1, icon: '🔍', title: 'Browse Requests', desc: 'Find boost requests in marketplace' },
              { step: 2, icon: '💬', title: 'Submit Offers', desc: 'Accept or counter-offer on requests' },
              { step: 3, icon: '🔐', title: 'Get Credentials', desc: 'Receive account access securely' },
              { step: 4, icon: '💰', title: 'Get Paid', desc: 'Complete boost and receive payment' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50">
                <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open Marketplace Banner */}
      {openRequestsCount > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <p className="text-white font-semibold">
                  {openRequestsCount} Open Boost Request{openRequestsCount !== 1 ? 's' : ''}
                </p>
                <p className="text-gray-400 text-xs">
                  Customers are looking for boosters right now
                </p>
              </div>
            </div>
            <Link
              href="/boosting/vendor/marketplace"
              className="px-5 py-2.5 rounded-xl font-semibold bg-green-500 hover:bg-green-400 text-white transition-all duration-300 text-sm whitespace-nowrap"
            >
              View Requests →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}