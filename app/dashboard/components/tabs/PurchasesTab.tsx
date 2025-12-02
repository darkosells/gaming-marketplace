'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Order, VendorTab } from '../../types'

interface PurchasesTabProps {
  myPurchases: Order[]
  activeTab: VendorTab
}

export default function PurchasesTab({ myPurchases, activeTab }: PurchasesTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const purchasesPerPage = 10

  // Filter purchases
  const filteredPurchases = myPurchases.filter(purchase => {
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        if (!['pending', 'paid', 'delivered'].includes(purchase.status)) return false
      } else if (purchase.status !== filterStatus) {
        return false
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = purchase.listing?.title?.toLowerCase() || ''
      const game = purchase.listing?.game?.toLowerCase() || ''
      const seller = purchase.seller?.username?.toLowerCase() || ''
      if (!title.includes(query) && !game.includes(query) && !seller.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredPurchases.length / purchasesPerPage)
  const startIndex = (currentPage - 1) * purchasesPerPage
  const endIndex = startIndex + purchasesPerPage
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleFilterChange = (status: string) => {
    setFilterStatus(status)
    setCurrentPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Stats
  const totalPurchases = myPurchases.length
  const activePurchases = myPurchases.filter(p => ['pending', 'paid', 'delivered'].includes(p.status)).length
  const completedPurchases = myPurchases.filter(p => p.status === 'completed').length
  const totalSpent = myPurchases
    .filter(p => p.status === 'completed' || p.status === 'delivered')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0)

  if (activeTab !== 'purchases') return null

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl">🛒</span>
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white">{totalPurchases}</div>
          <div className="text-xs text-gray-500">Purchases</div>
        </div>
        
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl">⏳</span>
            <span className="text-xs text-gray-400">Active</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-400">{activePurchases}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl">✅</span>
            <span className="text-xs text-gray-400">Done</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-green-400">{completedPurchases}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl sm:text-2xl">💸</span>
            <span className="text-xs text-gray-400">Spent</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            ${totalSpent.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Total Spent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, game, or seller..."
            className="w-full px-4 py-2.5 pl-10 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-sm"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>
        
        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 text-sm min-w-[150px]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="dispute_raised">Disputed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Results Count */}
      {filteredPurchases.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPurchases.length)} of {filteredPurchases.length} purchases
          </span>
          {(filterStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => { setFilterStatus('all'); setSearchQuery(''); setCurrentPage(1) }}
              className="text-sm text-purple-400 hover:text-purple-300 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Purchases List */}
      {myPurchases.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">🛍️</div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No purchases yet</h3>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            When you buy products from other vendors, they'll appear here.
          </p>
          <Link 
            href="/browse" 
            className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-white mb-2">No matching purchases</h3>
          <p className="text-gray-400 mb-4 text-sm">Try adjusting your filters or search query.</p>
          <button
            onClick={() => { setFilterStatus('all'); setSearchQuery(''); setCurrentPage(1) }}
            className="text-purple-400 hover:text-purple-300 transition text-sm"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {currentPurchases.map((purchase) => (
              <div 
                key={purchase.id} 
                className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-5 hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    {purchase.listing?.image_url ? (
                      <img 
                        src={purchase.listing.image_url} 
                        alt={purchase.listing?.title || 'Product'} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl">
                          {purchase.listing?.category === 'account' ? '🎮' : 
                           purchase.listing?.category === 'currency' ? '💰' : '🔑'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg line-clamp-1">
                      {purchase.listing?.title || 'Unknown Item'}
                    </h3>
                    <p className="text-purple-400 text-xs sm:text-sm">
                      {purchase.listing?.game || 'N/A'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                        ${parseFloat(String(purchase.amount)).toFixed(2)}
                      </span>
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Seller: <span className="text-gray-300">{purchase.seller?.username || 'Unknown'}</span>
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${
                        purchase.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        purchase.status === 'pending' || purchase.status === 'paid' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        purchase.status === 'delivered' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        purchase.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        purchase.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {purchase.status === 'delivered' ? 'DELIVERED' :
                         purchase.status === 'dispute_raised' ? 'DISPUTE' :
                         purchase.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="w-full sm:w-auto sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
                    <p className="text-gray-500 text-xs sm:text-sm">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </p>
                    <Link 
                      href={`/order/${purchase.id}`} 
                      className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 border border-purple-500/30 whitespace-nowrap"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mt-6 sm:mt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show limited pages on mobile
                  if (totalPages > 5) {
                    if (page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="text-gray-500 px-1">...</span>
                      }
                      return null
                    }
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 flex-shrink-0 text-sm ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                          : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}