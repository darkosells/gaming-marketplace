'use client'

import React from 'react'
import Link from 'next/link'
import { AdminOrder, ITEMS_PER_PAGE } from '../../types'

interface OrdersTabProps {
  orders: AdminOrder[]
  filteredOrders: AdminOrder[]
  currentPage: number
  selectedItems: string[]
  isExporting: boolean
  canExportData: boolean
  onSelectItem: (id: string) => void
  onSelectAll: (items: any[]) => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function OrdersTab({
  orders,
  filteredOrders,
  currentPage,
  selectedItems,
  isExporting,
  canExportData,
  onSelectItem,
  onSelectAll,
  onExportCSV,
  renderPagination
}: OrdersTabProps) {
  const currentOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'dispute_raised':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'refunded':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'delivered':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'paid':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Orders ({filteredOrders.length})</h2>
        <div className="flex gap-2">
          {canExportData && (
            <button
              onClick={onExportCSV}
              disabled={isExporting}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30 flex items-center gap-2"
            >
              <span>📥</span>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            onClick={() => onSelectAll(filteredOrders)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
          >
            {selectedItems.length === filteredOrders.length ? '✓ Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {currentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-gray-400">No orders found</p>
          </div>
        ) : (
          currentOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(o.id)}
                  onChange={() => onSelectItem(o.id)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">
                      {o.listing_title || 'Unknown'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusStyles(o.status)}`}>
                      {o.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="font-mono text-xs text-gray-500">
                      #{o.id.slice(0, 8)}...
                    </span>
                    <span>
                      <span className="text-blue-400">{o.buyer?.username || 'Unknown'}</span>
                      {' → '}
                      <span className="text-green-400">{o.seller?.username || 'Unknown'}</span>
                    </span>
                    <span className="text-white font-semibold">${o.amount}</span>
                    {o.listing_game && (
                      <span className="text-purple-400">{o.listing_game}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(o.created_at).toLocaleString()}
                    {o.completed_at && ` • Completed: ${new Date(o.completed_at).toLocaleString()}`}
                  </p>
                </div>
              </div>
              <Link
                href={`/order/${o.id}`}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30"
              >
                View
              </Link>
            </div>
          ))
        )}
      </div>

      {renderPagination(filteredOrders)}
    </div>
  )
}