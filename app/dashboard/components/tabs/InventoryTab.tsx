'use client'

import Link from 'next/link'
import type { Listing, Order, InventoryStats, InventoryFilter, InventorySort } from '../../types'

interface InventoryTabProps {
  myListings: Listing[]
  myOrders: Order[]
  inventoryStats: InventoryStats
  inventoryFilter: InventoryFilter
  setInventoryFilter: (filter: InventoryFilter) => void
  inventorySort: InventorySort
  setInventorySort: (sort: InventorySort) => void
  getFilteredInventory: () => Listing[]
}

export default function InventoryTab({
  myListings,
  myOrders,
  inventoryStats,
  inventoryFilter,
  setInventoryFilter,
  inventorySort,
  setInventorySort,
  getFilteredInventory
}: InventoryTabProps) {
  const filteredInventory = getFilteredInventory()

  return (
    <div id="inventory-section">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-orange-400">📊</span>
            Inventory Management
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Monitor stock levels and manage your inventory
          </p>
        </div>
      </div>

      {/* Inventory Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-orange-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl">💎</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Total Value</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
            ${inventoryStats.totalValue.toFixed(2)}
          </div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Total Inventory Worth</div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-red-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl">⚠️</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Alert</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.lowStock.length}</div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Low Stock (&lt;5)</div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-yellow-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Restock</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.outOfStock.length}</div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Out of Stock</div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
              <span className="text-lg sm:text-xl lg:text-2xl">📈</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Overstocked</span>
          </div>
          <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.overstocked.length}</div>
          <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Overstocked (&gt;50)</div>
        </div>
      </div>

      {/* Automatic Delivery Stats */}
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
            <span className="text-xl sm:text-2xl">⚡</span>
          </div>
          <div>
            <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Automatic Delivery Code Stats</h3>
            <p className="text-xs sm:text-sm text-gray-400">Track your automatic delivery inventory usage</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Codes</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{inventoryStats.automaticDeliveryStats.totalCodes}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Used Codes</div>
            <div className="text-xl sm:text-2xl font-bold text-red-400">{inventoryStats.automaticDeliveryStats.usedCodes}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Remaining</div>
            <div className={`text-xl sm:text-2xl font-bold ${inventoryStats.automaticDeliveryStats.remainingCodes < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {Math.max(0, inventoryStats.automaticDeliveryStats.remainingCodes)}
            </div>
            {inventoryStats.automaticDeliveryStats.remainingCodes < 0 && (
              <div className="text-[10px] sm:text-xs text-red-400 mt-1">
                ⚠️ Stock discrepancy
              </div>
            )}
          </div>
          <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-gray-400 mb-1">Usage Rate</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{inventoryStats.automaticDeliveryStats.usageRate.toFixed(1)}%</div>
          </div>
        </div>
        {inventoryStats.automaticDeliveryStats.usageRate > 80 && (
          <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl p-3">
            <p className="text-orange-400 text-xs sm:text-sm">
              ⚠️ High usage rate detected! Consider restocking your automatic delivery codes soon.
            </p>
          </div>
        )}
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setInventoryFilter('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'all'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
          >
            All Items
          </button>
          <button
            onClick={() => setInventoryFilter('low')}
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'low'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
          >
            ⚠️ Low ({inventoryStats.lowStock.length})
          </button>
          <button
            onClick={() => setInventoryFilter('out')}
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'out'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
          >
            📦 Out ({inventoryStats.outOfStock.length})
          </button>
          <button
            onClick={() => setInventoryFilter('over')}
            className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'over'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
          >
            📈 Over ({inventoryStats.overstocked.length})
          </button>
        </div>
        <div className="sm:ml-auto">
          <select
            value={inventorySort}
            onChange={(e) => setInventorySort(e.target.value as InventorySort)}
            className="w-full sm:w-auto bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xs sm:text-sm"
          >
            <option value="stock">Sort by Stock (Low to High)</option>
            <option value="value">Sort by Value (High to Low)</option>
            <option value="usage">Sort by Usage Rate (Auto only)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table/Cards */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="text-5xl sm:text-6xl mb-4">📦</div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No items found</h3>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">No listings match the selected filter</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-900/50 border-b border-white/10">
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Item</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Game</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Stock</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Price</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Value</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Type</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((listing: any) => {
                    const itemValue = listing.stock * parseFloat(listing.price)
                    const isLowStock = listing.stock > 0 && listing.stock < 5 && listing.status === 'active'
                    const isOutOfStock = listing.stock === 0 || listing.status === 'out_of_stock'
                    const isOverstocked = listing.stock > 50 && listing.status === 'active'

                    return (
                      <tr key={listing.id} className="border-b border-white/5 hover:bg-slate-900/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {listing.image_url ? (
                                <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-xl">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-semibold text-sm">{listing.title}</div>
                              <div className="text-xs text-gray-500">{listing.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-purple-400 text-sm">{listing.game}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${isOutOfStock ? 'text-red-400' :
                                isLowStock ? 'text-orange-400' :
                                  isOverstocked ? 'text-purple-400' :
                                    'text-white'
                              }`}>
                              {listing.stock}
                            </span>
                            {isLowStock && <span className="text-xs">⚠️</span>}
                            {isOutOfStock && <span className="text-xs">🚫</span>}
                            {isOverstocked && <span className="text-xs">📈</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-green-400 font-semibold">${listing.price}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-orange-400 font-semibold">${itemValue.toFixed(2)}</span>
                        </td>
                        <td className="p-4">
                          {listing.delivery_type === 'automatic' ? (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                              ⚡ Auto
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs border border-gray-500/30">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                            {listing.status === 'out_of_stock' ? 'Out of Stock' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/listing/${listing.id}/edit`}
                            className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-all border border-purple-500/30 inline-block"
                          >
                            Restock
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {filteredInventory.map((listing: any) => {
              const itemValue = listing.stock * parseFloat(listing.price)
              const isLowStock = listing.stock > 0 && listing.stock < 5 && listing.status === 'active'
              const isOutOfStock = listing.stock === 0 || listing.status === 'out_of_stock'
              const isOverstocked = listing.stock > 50 && listing.status === 'active'

              return (
                <div key={listing.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {listing.image_url ? (
                        <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">
                          {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-sm truncate">{listing.title}</h4>
                      <p className="text-purple-400 text-xs">{listing.game}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {listing.delivery_type === 'automatic' ? (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] border border-blue-500/30">
                            ⚡ Auto
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded text-[10px] border border-gray-500/30">
                            Manual
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}>
                          {listing.status === 'out_of_stock' ? 'OOS' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                    <div>
                      <div className="text-[10px] text-gray-500">Stock</div>
                      <div className={`text-sm font-bold flex items-center gap-1 ${isOutOfStock ? 'text-red-400' :
                          isLowStock ? 'text-orange-400' :
                            isOverstocked ? 'text-purple-400' :
                              'text-white'
                        }`}>
                        {listing.stock}
                        {isLowStock && <span className="text-[10px]">⚠️</span>}
                        {isOutOfStock && <span className="text-[10px]">🚫</span>}
                        {isOverstocked && <span className="text-[10px]">📈</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Price</div>
                      <div className="text-sm font-bold text-green-400">${listing.price}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500">Value</div>
                      <div className="text-sm font-bold text-orange-400">${itemValue.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  <Link
                    href={`/listing/${listing.id}/edit`}
                    className="mt-3 w-full block px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-all border border-purple-500/30 text-center"
                  >
                    Restock / Edit
                  </Link>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Restocking Recommendations */}
      {(inventoryStats.lowStock.length > 0 || inventoryStats.outOfStock.length > 0) && (
        <div className="mt-6 sm:mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl sm:text-3xl">💡</span>
            <div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Restocking Recommendations</h3>
              <p className="text-xs sm:text-sm text-gray-400">Based on your current inventory levels</p>
            </div>
          </div>
          <div className="space-y-2">
            {inventoryStats.outOfStock.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-red-400 font-semibold mb-1 text-sm sm:text-base">🚨 Urgent: {inventoryStats.outOfStock.length} items out of stock</p>
                <p className="text-xs sm:text-sm text-gray-400">These items need immediate restocking to continue selling</p>
              </div>
            )}
            {inventoryStats.lowStock.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-orange-400 font-semibold mb-1 text-sm sm:text-base">⚠️ Warning: {inventoryStats.lowStock.length} items running low</p>
                <p className="text-xs sm:text-sm text-gray-400">Consider restocking these items soon to avoid running out</p>
              </div>
            )}
            {inventoryStats.overstocked.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-purple-400 font-semibold mb-1 text-sm sm:text-base">📈 Info: {inventoryStats.overstocked.length} items overstocked</p>
                <p className="text-xs sm:text-sm text-gray-400">Consider promotional pricing to move excess inventory</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}