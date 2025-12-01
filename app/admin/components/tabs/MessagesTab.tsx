'use client'

import React from 'react'
import Link from 'next/link'
import { AdminConversation, ITEMS_PER_PAGE } from '../../types'

interface MessagesTabProps {
  conversations: AdminConversation[]
  filteredConversations: AdminConversation[]
  currentPage: number
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function MessagesTab({
  conversations,
  filteredConversations,
  currentPage,
  renderPagination
}: MessagesTabProps) {
  const currentConversations = filteredConversations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getOrderStatusStyles = (status: string | undefined) => {
    if (!status) return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'dispute_raised':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'refunded':
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
      case 'delivered':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      default:
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Conversations ({filteredConversations.length})
      </h2>

      <div className="space-y-4">
        {currentConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-gray-400">No conversations found</p>
          </div>
        ) : (
          currentConversations.map((c) => (
            <div
              key={c.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
            >
              {/* Listing Image */}
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl border border-white/10 overflow-hidden flex-shrink-0">
                {c.listing?.image_url ? (
                  <img
                    src={c.listing.image_url}
                    alt={c.listing.title || 'Listing'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🎮</span>
                )}
              </div>

              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-semibold truncate">
                    {c.listing?.title || 'Unknown Listing'}
                  </h3>
                  {c.listing?.game && (
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {c.listing.game}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  <span className="text-blue-400">{c.buyer?.username || 'Unknown'}</span>
                  {' ↔ '}
                  <span className="text-green-400">{c.seller?.username || 'Unknown'}</span>
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {c.last_message || 'No messages yet'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Last activity: {c.last_message_at ? new Date(c.last_message_at).toLocaleString() : 'N/A'}
                </p>
              </div>

              {/* Order Status (if exists) */}
              {c.order && (
                <div className="text-right flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs ${getOrderStatusStyles(c.order.status)}`}>
                    {c.order.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                  </span>
                  <p className="text-white font-semibold mt-1">${c.order.amount}</p>
                </div>
              )}

              {/* View Button */}
              <Link
                href={`/admin/messages/${c.id}`}
                className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition border border-purple-500/30 flex-shrink-0"
              >
                👁️ View Chat
              </Link>
            </div>
          ))
        )}
      </div>

      {renderPagination(filteredConversations)}
    </div>
  )
}