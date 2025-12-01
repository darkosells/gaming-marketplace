'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import type { Listing } from '../../types'

interface ListingsTabProps {
  myListings: Listing[]
  filteredListings: Listing[]
  displayedListings: Listing[]
  uniqueGames: string[]
  // Filter state
  searchQuery: string
  setSearchQuery: (q: string) => void
  filterGame: string
  setFilterGame: (g: string) => void
  filterCategory: string
  setFilterCategory: (c: string) => void
  filterStatus: string
  setFilterStatus: (s: string) => void
  filterDeliveryType: string
  setFilterDeliveryType: (d: string) => void
  filterPriceMin: string
  setFilterPriceMin: (p: string) => void
  filterPriceMax: string
  setFilterPriceMax: (p: string) => void
  filterDateRange: string
  setFilterDateRange: (d: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  showFilters: boolean
  setShowFilters: (s: boolean) => void
  activeFilterCount: number
  clearFilters: () => void
  // Infinite scroll
  hasMoreListings: boolean
  isLoadingMoreListings: boolean
  listingsObserverTarget: React.RefObject<HTMLDivElement | null>
  loadMoreListings: () => void
  // Selection mode
  selectionMode: boolean
  setSelectionMode: (s: boolean) => void
  selectedListings: Set<string>
  toggleSelectListing: (id: string) => void
  selectAllDisplayedListings: () => void
  selectAllFilteredListings: () => void
  deselectAll: () => void
  exitSelectionMode: () => void
  setShowBulkActions: (s: boolean) => void
  // Active tab check
  activeTab: string
}

export default function ListingsTab({
  myListings,
  filteredListings,
  displayedListings,
  uniqueGames,
  searchQuery, setSearchQuery,
  filterGame, setFilterGame,
  filterCategory, setFilterCategory,
  filterStatus, setFilterStatus,
  filterDeliveryType, setFilterDeliveryType,
  filterPriceMin, setFilterPriceMin,
  filterPriceMax, setFilterPriceMax,
  filterDateRange, setFilterDateRange,
  sortBy, setSortBy,
  showFilters, setShowFilters,
  activeFilterCount,
  clearFilters,
  hasMoreListings,
  isLoadingMoreListings,
  listingsObserverTarget,
  loadMoreListings,
  selectionMode,
  setSelectionMode,
  selectedListings,
  toggleSelectListing,
  selectAllDisplayedListings,
  selectAllFilteredListings,
  deselectAll,
  exitSelectionMode,
  setShowBulkActions,
  activeTab
}: ListingsTabProps) {
  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreListings && !isLoadingMoreListings && activeTab === 'listings') {
          loadMoreListings()
        }
      },
      { threshold: 0.1 }
    )

    if (listingsObserverTarget.current) {
      observer.observe(listingsObserverTarget.current)
    }

    return () => {
      if (listingsObserverTarget.current) {
        observer.unobserve(listingsObserverTarget.current)
      }
    }
  }, [hasMoreListings, isLoadingMoreListings, activeTab, loadMoreListings, listingsObserverTarget])

  return (
    <div id="listings-section">
      {/* Header with Bulk Actions and Selection Mode */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">📦</span>
            My Listings
          </h2>
          {filteredListings.length > 0 && (
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Showing {displayedListings.length} of {filteredListings.length} listings
              {filteredListings.length !== myListings.length && (
                <span className="text-purple-400"> (filtered from {myListings.length} total)</span>
              )}
              {selectionMode && selectedListings.size > 0 && (
                <span className="text-purple-400"> • {selectedListings.size} selected</span>
              )}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          {!selectionMode ? (
            <>
              {displayedListings.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <span>☑️</span>
                  <span className="hidden sm:inline">Select Multiple</span>
                  <span className="sm:hidden">Select</span>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${showFilters
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
              >
                <span className="text-base sm:text-lg">🔍</span>
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{activeFilterCount}</span>
                )}
              </button>
              <Link
                href="/sell"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              >
                + <span className="hidden sm:inline">Create </span>Listing
              </Link>
            </>
          ) : (
            <>
              {selectedListings.size === 0 ? (
                <>
                  <button
                    onClick={selectAllDisplayedListings}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 text-xs sm:text-sm"
                  >
                    Select Displayed ({displayedListings.length})
                  </button>
                  <button
                    onClick={selectAllFilteredListings}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 text-xs sm:text-sm"
                  >
                    Select All ({filteredListings.length})
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={deselectAll}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 text-xs sm:text-sm"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => setShowBulkActions(true)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 text-xs sm:text-sm"
                  >
                    Bulk Actions ({selectedListings.size})
                  </button>
                </>
              )}
              <button
                onClick={exitSelectionMode}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
          {/* Search Bar */}
          <div>
            <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔍 Search Listings</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, game, or category..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Game Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🎮 Game</label>
              <select
                value={filterGame}
                onChange={(e) => setFilterGame(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Games</option>
                {uniqueGames.map(game => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📁 Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Categories</option>
                <option value="account">Account</option>
                <option value="currency">Currency</option>
                <option value="key">Key</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📊 Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="draft">Draft</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            {/* Delivery Type Filter */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">⚡ Delivery</label>
              <select
                value={filterDeliveryType}
                onChange={(e) => setFilterDeliveryType(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Types</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Price Min */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Min Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
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
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                placeholder="$999.99"
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 Created</label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔢 Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
                <option value="stock_high">Stock: High to Low</option>
                <option value="stock_low">Stock: Low to High</option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={clearFilters}
                className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border border-red-500/30 flex items-center gap-2"
              >
                <span>✕</span>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">{myListings.length === 0 ? '📦' : '🔍'}</div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {myListings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
          </h3>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">
            {myListings.length === 0
              ? 'Create your first listing to start selling!'
              : 'Try adjusting your filters to see more results'}
          </p>
          {myListings.length === 0 ? (
            <Link
              href="/sell"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              Create Listing
            </Link>
          ) : (
            <button
              onClick={clearFilters}
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {displayedListings.map((listing) => (
              <div key={listing.id} className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group relative">
                {selectionMode && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedListings.has(listing.id)}
                      onChange={() => toggleSelectListing(listing.id)}
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-white/30 bg-slate-900/80 checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                    />
                  </div>
                )}

                <div className="relative h-28 sm:h-36 lg:h-44 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl group-hover:scale-125 transition-transform duration-300">
                      {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        listing.status === 'sold' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                          listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                      {listing.status === 'out_of_stock' ? 'Out of Stock' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                  {/* Delivery Type Badge */}
                  <div className={`absolute ${selectionMode ? 'bottom-2 sm:bottom-3 left-2 sm:left-3' : 'top-2 sm:top-3 left-2 sm:left-3'}`}>
                    <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${
                      listing.delivery_type === 'automatic' 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                        : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    }`}>
                      {listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual'}
                    </span>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-white font-semibold mb-1 truncate group-hover:text-purple-300 transition text-sm sm:text-base">{listing.title}</h3>
                  <p className="text-xs sm:text-sm text-purple-400 mb-2 sm:mb-3">{listing.game}</p>
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <div>
                      <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${listing.price}</span>
                      <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">You earn: ${(parseFloat(listing.price) * 0.95).toFixed(2)}</p>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-400 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                      Stock: {listing.stock}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/listing/${listing.id}`}
                      className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all duration-300 border border-purple-500/30"
                    >
                      View
                    </Link>
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all duration-300 border border-blue-500/30"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMoreListings && (
            <div ref={listingsObserverTarget} className="flex justify-center py-6 sm:py-8">
              {isLoadingMoreListings ? (
                <div className="flex items-center gap-3 text-purple-400">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm font-semibold">Loading more listings...</span>
                </div>
              ) : (
                <div className="text-gray-500 text-xs sm:text-sm">Scroll for more</div>
              )}
            </div>
          )}

          {!hasMoreListings && displayedListings.length > 20 && (
            <div className="text-center py-6 sm:py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-gray-400 text-xs sm:text-sm">
                <span>✓</span>
                You've reached the end of your listings
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}