'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Order } from '../../types'

interface OrdersTabProps {
  myOrders: Order[]
  filteredOrders: Order[]
  displayedOrders: Order[]
  uniqueOrderGames: string[]
  // Filter state
  orderSearchQuery: string
  setOrderSearchQuery: (q: string) => void
  orderFilterStatus: string
  setOrderFilterStatus: (s: string) => void
  orderFilterGame: string
  setOrderFilterGame: (g: string) => void
  orderFilterDeliveryType: string
  setOrderFilterDeliveryType: (d: string) => void
  orderFilterPriceMin: string
  setOrderFilterPriceMin: (p: string) => void
  orderFilterPriceMax: string
  setOrderFilterPriceMax: (p: string) => void
  orderFilterDateFrom: string
  setOrderFilterDateFrom: (d: string) => void
  orderFilterDateTo: string
  setOrderFilterDateTo: (d: string) => void
  orderSortBy: string
  setOrderSortBy: (s: string) => void
  showOrderFilters: boolean
  setShowOrderFilters: (s: boolean) => void
  activeOrderFilterCount: number
  clearOrderFilters: () => void
  exportOrdersToCSV: () => void
  // Infinite scroll
  hasMoreOrders: boolean
  isLoadingMoreOrders: boolean
  ordersObserverTarget: React.RefObject<HTMLDivElement | null>
  loadMoreOrders: () => void
  // Active tab check
  activeTab: string
}

export default function OrdersTab({
  myOrders,
  filteredOrders,
  displayedOrders,
  uniqueOrderGames,
  orderSearchQuery, setOrderSearchQuery,
  orderFilterStatus, setOrderFilterStatus,
  orderFilterGame, setOrderFilterGame,
  orderFilterDeliveryType, setOrderFilterDeliveryType,
  orderFilterPriceMin, setOrderFilterPriceMin,
  orderFilterPriceMax, setOrderFilterPriceMax,
  orderFilterDateFrom, setOrderFilterDateFrom,
  orderFilterDateTo, setOrderFilterDateTo,
  orderSortBy, setOrderSortBy,
  showOrderFilters, setShowOrderFilters,
  activeOrderFilterCount,
  clearOrderFilters,
  exportOrdersToCSV,
  hasMoreOrders,
  isLoadingMoreOrders,
  ordersObserverTarget,
  loadMoreOrders,
  activeTab
}: OrdersTabProps) {
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreOrders && !isLoadingMoreOrders && activeTab === 'orders') {
          loadMoreOrders()
        }
      },
      { threshold: 0.1 }
    )

    if (ordersObserverTarget.current) {
      observer.observe(ordersObserverTarget.current)
    }

    return () => {
      if (ordersObserverTarget.current) {
        observer.unobserve(ordersObserverTarget.current)
      }
    }
  }, [hasMoreOrders, isLoadingMoreOrders, activeTab, loadMoreOrders, ordersObserverTarget])

  return (
    <div id="orders-section">
      {/* Header with Filter Toggle and Export */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">🛒</span>
            My Orders
          </h2>
          {filteredOrders.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Showing {displayedOrders.length} of {filteredOrders.length} orders
              {filteredOrders.length !== myOrders.length && (
                <span className="text-purple-400"> (filtered from {myOrders.length} total)</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowOrderFilters(!showOrderFilters)}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${showOrderFilters
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
          >
            <span className="text-base sm:text-lg">🔍</span>
            Filters
            {activeOrderFilterCount > 0 && (
              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{activeOrderFilterCount}</span>
            )}
          </button>
          <button
            onClick={exportOrdersToCSV}
            disabled={myOrders.length === 0}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📥</span>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Order Filter Panel */}
      {showOrderFilters && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔍 Search Orders</label>
            <input
              type="text"
              value={orderSearchQuery}
              onChange={(e) => setOrderSearchQuery(e.target.value)}
              placeholder="Search by Order ID, buyer username, game, or item..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📊 Status</label>
              <select
                value={orderFilterStatus}
                onChange={(e) => setOrderFilterStatus(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
                <option value="dispute_raised">Dispute</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Game Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🎮 Game</label>
              <select
                value={orderFilterGame}
                onChange={(e) => setOrderFilterGame(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Games</option>
                {uniqueOrderGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>

            {/* Delivery Type Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">⚡ Delivery</label>
              <select
                value={orderFilterDeliveryType}
                onChange={(e) => setOrderFilterDeliveryType(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Types</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔢 Sort By</label>
              <select
                value={orderSortBy}
                onChange={(e) => setOrderSortBy(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
              </select>
            </div>

            {/* Price Min */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Min Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderFilterPriceMin}
                onChange={(e) => setOrderFilterPriceMin(e.target.value)}
                placeholder="$0.00"
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>

            {/* Price Max */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Max Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderFilterPriceMax}
                onChange={(e) => setOrderFilterPriceMax(e.target.value)}
                placeholder="$999.99"
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 From Date</label>
              <input
                type="date"
                value={orderFilterDateFrom}
                onChange={(e) => setOrderFilterDateFrom(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm [color-scheme:dark]"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 To Date</label>
              <input
                type="date"
                value={orderFilterDateTo}
                onChange={(e) => setOrderFilterDateTo(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {activeOrderFilterCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearOrderFilters}
                className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border border-red-500/30 flex items-center gap-2"
              >
                <span>✕</span>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">{myOrders.length === 0 ? '📭' : '🔍'}</div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {myOrders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
          </h3>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            {myOrders.length === 0 
              ? 'Your sales will appear here once customers start buying!' 
              : 'Try adjusting your filters to see more results'}
          </p>
          {myOrders.length > 0 && (
            <button
              onClick={clearOrderFilters}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {displayedOrders.map((order: any) => {
              const orderNetEarning = parseFloat(order.amount) * 0.95
              const orderCommission = parseFloat(order.amount) * 0.05

              return (
                <div key={order.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-5 hover:border-purple-500/30 transition-all duration-300">
                  {/* Mobile Layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Image */}
                    <div className="flex items-center gap-3 sm:block">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {order.listing?.image_url ? (
                          <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg sm:text-xl lg:text-2xl">
                            {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'currency' ? '💰' : '🔑'}
                          </span>
                        )}
                      </div>
                      {/* Mobile: Show status badge next to image */}
                      <div className="sm:hidden">
                        <h4 className="text-white font-semibold text-sm">{order.listing?.title || 'Unknown Item'}</h4>
                        <p className="text-xs text-gray-400">Buyer: <span className="text-purple-400">{order.buyer?.username}</span></p>
                      </div>
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 hidden sm:block">
                      <h4 className="text-white font-semibold text-sm lg:text-base">{order.listing?.title || 'Unknown Item'}</h4>
                      <p className="text-xs sm:text-sm text-gray-400">Buyer: <span className="text-purple-400">{order.buyer?.username}</span></p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        {new Date(order.created_at).toLocaleDateString()} • {order.listing?.game}
                      </p>
                    </div>
                    
                    {/* Mobile: Date and Game */}
                    <div className="sm:hidden flex justify-between items-center text-xs text-gray-500 -mt-1">
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span>{order.listing?.game}</span>
                    </div>
                    
                    {/* Price and Status */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${orderNetEarning.toFixed(2)}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                          Gross: ${order.amount} | Fee: -${orderCommission.toFixed(2)}
                        </p>
                      </div>
                      <span className={`inline-block mt-0 sm:mt-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${order.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          order.status === 'delivered' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            order.status === 'paid' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                  order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                    'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        }`}>
                        {order.status === 'delivered' ? 'Awaiting' :
                          order.status === 'dispute_raised' ? 'Dispute' :
                            order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    
                    {/* View Button */}
                    <Link
                      href={`/order/${order.id}`}
                      className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 border border-purple-500/30 text-center"
                    >
                      View Details
                    </Link>
                  </div>
                  
                  {/* Order ID - Small text at bottom */}
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] sm:text-xs text-gray-600 font-mono">
                      Order ID: {order.id.slice(0, 8)}...{order.id.slice(-4)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {hasMoreOrders && (
            <div ref={ordersObserverTarget} className="flex justify-center py-6 sm:py-8">
              {isLoadingMoreOrders ? (
                <div className="flex items-center gap-3 text-purple-400">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm font-semibold">Loading more orders...</span>
                </div>
              ) : (
                <div className="text-gray-500 text-xs sm:text-sm">Scroll for more</div>
              )}
            </div>
          )}

          {!hasMoreOrders && displayedOrders.length > 20 && (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-gray-400 text-xs sm:text-sm">
                <span>✓</span>
                You've reached the end of your orders
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}