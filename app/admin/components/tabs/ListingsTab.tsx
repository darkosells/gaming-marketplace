'use client'

import React from 'react'
import Link from 'next/link'
import { AdminListing, ITEMS_PER_PAGE } from '../../types'

interface ListingsTabProps {
  listings: AdminListing[]
  filteredListings: AdminListing[]
  currentPage: number
  selectedItems: string[]
  isExporting: boolean
  canExportData: boolean
  onSelectItem: (id: string) => void
  onSelectAll: (items: any[]) => void
  onDeleteListing: (id: string) => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function ListingsTab({
  listings,
  filteredListings,
  currentPage,
  selectedItems,
  isExporting,
  canExportData,
  onSelectItem,
  onSelectAll,
  onDeleteListing,
  onExportCSV,
  renderPagination
}: ListingsTabProps) {
  const currentListings = filteredListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Listings ({filteredListings.length})</h2>
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
            onClick={() => onSelectAll(filteredListings)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
          >
            {selectedItems.length === filteredListings.length ? '✓ Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {currentListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-400">No listings found</p>
          </div>
        ) : (
          currentListings.map((l) => (
            <div
              key={l.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(l.id)}
                  onChange={() => onSelectItem(l.id)}
                  className="w-5 h-5 rounded"
                />
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-white/10 overflow-hidden">
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">
                      {l.category === 'account' ? '🎮' : l.category === 'topup' ? '💰' : '🔑'}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">{l.title}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        l.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {l.game} | ${l.price} | Stock: {l.stock} | Seller: {l.profiles?.username || 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/listing/${l.id}`}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30"
                >
                  View
                </Link>
                <button
                  onClick={() => onDeleteListing(l.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition border border-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {renderPagination(filteredListings)}
    </div>
  )
}