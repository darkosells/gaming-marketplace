'use client'

// ============================================================================
// VENDOR BOOST ORDERS LIST PAGE
// ============================================================================
// Location: app/boosting/vendor/orders/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { RANKS_MAP, getDivisionsBetween } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'
import { formatPrice, calculateVendorPayout } from '@/lib/boosting/pricing'

interface BoostingOrder {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  game: string
  current_rank: string
  desired_rank: string
  progress_current_rank: string | null
  final_price: number
  platform_fee: number
  vendor_payout: number
  status: string
  payment_status: string
  is_priority: boolean
  created_at: string
  started_at: string | null
  vendor_completed_at: string | null
  completed_at: string | null
  customer?: {
    id: string
    username: string
    avatar_url: string | null
  }
}

type FilterStatus = 'all' | 'active' | 'awaiting_credentials' | 'credentials_received' | 'in_progress' | 'pending_confirmation' | 'completed' | 'dispute'
type SortOption = 'newest' | 'oldest' | 'payout_high' | 'payout_low'

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  awaiting_credentials: { label: 'Awaiting Credentials', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', icon: '⏳' },
  credentials_received: { label: 'Ready to Start', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: '🔐' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', icon: '🎮' },
  pending_confirmation: { label: 'Awaiting Confirmation', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: '✓' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: '🏆' },
  dispute: { label: 'Dispute', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '⚠️' }
}

export default function VendorBoostOrdersPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<BoostingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push('/login?redirect=/boosting/vendor/orders')
          return
        }
        
        setUser(session.user)
        await fetchOrders(session.user.id)
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from('boosting_orders')
      .select(`
        *,
        customer:profiles!boosting_orders_customer_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .eq('vendor_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    setOrders(data || [])
  }

  // Calculate progress percentage
  const getProgressPercentage = (order: BoostingOrder) => {
    const allRanks = Object.keys(RANKS_MAP) as RankKey[]
    const startIndex = allRanks.indexOf(order.current_rank as RankKey)
    const endIndex = allRanks.indexOf(order.desired_rank as RankKey)
    const currentIndex = order.progress_current_rank 
      ? allRanks.indexOf(order.progress_current_rank as RankKey)
      : startIndex
    
    if (endIndex === startIndex) return 100
    const progress = ((currentIndex - startIndex) / (endIndex - startIndex)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  // Filter and sort orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') {
      return ['awaiting_credentials', 'credentials_received', 'in_progress', 'pending_confirmation'].includes(order.status)
    }
    return order.status === filterStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'payout_high':
        return b.vendor_payout - a.vendor_payout
      case 'payout_low':
        return a.vendor_payout - b.vendor_payout
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Calculate stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => ['awaiting_credentials', 'credentials_received', 'in_progress', 'pending_confirmation'].includes(o.status)).length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalEarned: orders.filter(o => o.status === 'completed' && o.payment_status === 'released').reduce((sum, o) => sum + o.vendor_payout, 0),
    pendingEarnings: orders.filter(o => o.payment_status === 'held').reduce((sum, o) => sum + o.vendor_payout, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-8">
          {/* Back Link */}
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
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Find boost requests</p>
              </Link>

              {/* My Offers Tab */}
              <Link
                href="/boosting/vendor/offers"
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/50 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold text-center transition-all border border-white/5 hover:border-white/10"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📋</span>
                  <span>My Offers</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Pending responses</p>
              </Link>

              {/* My Orders Tab - Active */}
              <Link
                href="/boosting/vendor/orders"
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-center transition-all shadow-lg shadow-purple-500/20"
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎮</span>
                  <span>My Orders</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{orders.length}</span>
                </div>
                <p className="text-xs text-white/70 mt-0.5 hidden sm:block">Active & completed</p>
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-cyan-400">🎮</span>
                My Boost Orders
              </h1>
              <p className="text-gray-400 mt-1">Manage your active and completed boost orders</p>
            </div>
            <button
              onClick={() => fetchOrders(user?.id)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:shadow-lg hover:shadow-green-500/30 transition-colors flex items-center gap-2"
            >
              <span>🔄</span> Refresh
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total Orders</p>
            </div>
            <div className="bg-slate-900/60 border border-cyan-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-cyan-400">{stats.active}</p>
              <p className="text-xs text-gray-400">Active</p>
            </div>
            <div className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-blue-400">{stats.inProgress}</p>
              <p className="text-xs text-gray-400">In Progress</p>
            </div>
            <div className="bg-slate-900/60 border border-green-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400">{formatPrice(stats.totalEarned)}</p>
              <p className="text-xs text-gray-400">Total Earned</p>
            </div>
            <div className="bg-slate-900/60 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">{formatPrice(stats.pendingEarnings)}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {/* Status Filter */}
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All', count: orders.length },
                  { value: 'active', label: 'Active', count: stats.active },
                  { value: 'in_progress', label: 'In Progress', count: stats.inProgress },
                  { value: 'pending_confirmation', label: 'Pending', count: orders.filter(o => o.status === 'pending_confirmation').length },
                  { value: 'completed', label: 'Completed', count: stats.completed },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value as FilterStatus)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === filter.value
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="sm:ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="payout_high">Highest Payout</option>
                  <option value="payout_low">Lowest Payout</option>
                </select>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-white mb-2">No boost orders yet</h3>
                <p className="text-gray-400 mb-6">
                  {filterStatus === 'all' 
                    ? "You don't have any boost orders yet. Browse the marketplace to find customers!"
                    : "No orders match this filter."}
                </p>
                {filterStatus === 'all' && (
                  <Link
                    href="/boosting/vendor/marketplace"
                    className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                  >
                    Browse Marketplace →
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const currentRank = RANKS_MAP[order.current_rank as RankKey]
                  const desiredRank = RANKS_MAP[order.desired_rank as RankKey]
                  const progressRank = order.progress_current_rank ? RANKS_MAP[order.progress_current_rank as RankKey] : null
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress
                  const progressPercent = getProgressPercentage(order)
                  const divisions = getDivisionsBetween(order.current_rank as RankKey, order.desired_rank as RankKey)

                  return (
                    <Link
                      key={order.id}
                      href={`/boosting/vendor/orders/${order.id}`}
                      className={`block bg-slate-800/50 border ${statusConfig.borderColor} rounded-xl p-4 sm:p-5 hover:bg-slate-800/70 transition-all group`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* Rank Display */}
                        <div className="flex items-center gap-3">
                          {/* Current Rank */}
                          <div className="w-12 h-12 relative rounded-lg bg-slate-900/50 p-1">
                            {currentRank?.image ? (
                              <Image
                                src={currentRank.image}
                                alt={currentRank.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                            )}
                          </div>
                          
                          <div className="text-gray-500">→</div>
                          
                          {/* Desired Rank */}
                          <div className="w-12 h-12 relative rounded-lg bg-slate-900/50 p-1">
                            {desiredRank?.image ? (
                              <Image
                                src={desiredRank.image}
                                alt={desiredRank.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                            )}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{currentRank?.name}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-white font-medium">{desiredRank?.name}</span>
                            <span className="text-gray-500 text-sm">({divisions} div)</span>
                            {order.is_priority && (
                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                ⚡ Priority
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500 font-mono">{order.order_number}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400">{order.customer?.username || 'Customer'}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 capitalize">{order.game}</span>
                          </div>
                          
                          {/* Progress Bar */}
                          {['in_progress', 'pending_confirmation', 'completed'].includes(order.status) && (
                            <div className="mt-2">
                              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500">
                                  {progressRank ? `Current: ${progressRank.name}` : 'Not started'}
                                </span>
                                <span className="text-xs text-cyan-400">{Math.round(progressPercent)}%</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status & Payout */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">{formatPrice(order.vendor_payout)}</p>
                            <p className="text-xs text-gray-500">
                              {order.payment_status === 'released' ? 'Earned' : 'Pending'}
                            </p>
                          </div>
                          
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color} flex items-center gap-1.5`}>
                            <span>{statusConfig.icon}</span>
                            <span className="hidden sm:inline">{statusConfig.label}</span>
                          </div>
                          
                          <svg className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Tips */}
          {stats.active > 0 && (
            <div className="mt-6 bg-slate-900/60 border border-white/10 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <span>💡</span> Tips for Active Orders
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-cyan-400 font-medium mb-1">📊 Update Progress</p>
                  <p className="text-gray-400">Keep customers informed with regular updates</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-purple-400 font-medium mb-1">💬 Communicate</p>
                  <p className="text-gray-400">Use the chat to coordinate with customers</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-green-400 font-medium mb-1">📸 Screenshots</p>
                  <p className="text-gray-400">Upload screenshots to prove progress</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}