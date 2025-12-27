// File Path: app/messages/components/ConversationItem.tsx

'use client'

import { Conversation, BOOSTING_STATUS_CONFIG } from '../types'
import { formatConversationDate, getListingInfo } from '../utils/messageHelpers'

interface ConversationItemProps {
  conversation: Conversation
  currentUserId: string
  isSelected: boolean
  onClick: () => void
}

export default function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick
}: ConversationItemProps) {
  const otherUser = conversation.buyer_id === currentUserId 
    ? conversation.seller 
    : conversation.buyer
  const hasUnread = (conversation.unread_count || 0) > 0
  const listingInfo = getListingInfo(conversation)
  const isBoosting = listingInfo.isBoosting

  const getStatusBadge = () => {
    // Boosting order status
    if (isBoosting && conversation.boosting_order?.status) {
      const config = BOOSTING_STATUS_CONFIG[conversation.boosting_order.status]
      if (!config) return null

      return (
        <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium border ${config.colors}`}>
          {config.label}
        </span>
      )
    }

    // Marketplace order status
    if (!conversation.order?.status) return null

    const statusConfig: Record<string, { label: string; classes: string }> = {
      completed: { 
        label: 'Done', 
        classes: 'bg-green-500/20 text-green-400 border-green-500/30' 
      },
      dispute_raised: { 
        label: 'Dispute', 
        classes: 'bg-red-500/20 text-red-400 border-red-500/30' 
      },
      refunded: { 
        label: 'Refunded', 
        classes: 'bg-orange-500/20 text-orange-400 border-orange-500/30' 
      },
      delivered: { 
        label: 'Delivered', 
        classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
      },
      paid: { 
        label: 'Paid', 
        classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
      },
      pending: { 
        label: 'Pending', 
        classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
      }
    }

    const config = statusConfig[conversation.order.status]
    if (!config) return null

    return (
      <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium border ${config.classes}`}>
        {config.label}
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 sm:p-4 border-b border-white/10 hover:bg-white/5 transition-all duration-300 relative group ${
        isSelected 
          ? isBoosting 
            ? 'bg-cyan-500/20 border-l-4 border-l-cyan-500' 
            : 'bg-purple-500/20 border-l-4 border-l-purple-500' 
          : ''
      } ${hasUnread ? (isBoosting ? 'bg-cyan-500/10' : 'bg-purple-500/10') : ''}`}
    >
      {/* Unread badge */}
      {hasUnread && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <span className={`text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px] text-center shadow-lg ${
            isBoosting 
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/30' 
              : 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-pink-500/30'
          }`}>
            {conversation.unread_count}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Listing/Boosting image */}
        <div className={`relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300 ${
          isBoosting 
            ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' 
            : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
        }`}>
          {listingInfo.image_url ? (
            <img 
              src={listingInfo.image_url} 
              alt={listingInfo.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">
              {isBoosting ? '⚡' : '🎮'}
            </div>
          )}
          {hasUnread && (
            <div className={`absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-slate-900 animate-pulse ${
              isBoosting 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500'
            }`} />
          )}
        </div>
        
        {/* Conversation info */}
        <div className="flex-1 min-w-0 pr-6 sm:pr-8">
          <p className="font-semibold text-white truncate text-sm sm:text-base">
            {otherUser.username}
          </p>
          <p className={`text-xs mb-1 truncate ${isBoosting ? 'text-cyan-400' : 'text-purple-400'}`}>
            {isBoosting && <span className="mr-1">⚡</span>}
            {listingInfo.title}
          </p>
          <p className={`text-xs truncate ${hasUnread ? 'text-gray-300 font-semibold' : 'text-gray-400'}`}>
            {conversation.last_message}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {formatConversationDate(conversation.last_message_at)}
            </p>
            {getStatusBadge()}
          </div>
        </div>
      </div>
    </button>
  )
}