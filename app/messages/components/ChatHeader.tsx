// File Path: app/messages/components/ChatHeader.tsx

'use client'

import Link from 'next/link'
import { Conversation, BOOSTING_STATUS_CONFIG, isBoostingConversation, getViewOrderLink } from '../types'
import { formatLastSeen, getListingInfo, formatRankDisplay } from '../utils/messageHelpers'
import Avatar from './common/Avatar'

interface ChatHeaderProps {
  conversation: Conversation
  currentUserId: string
  otherUserOnline: boolean
  otherUserLastSeen: string | null
  onBackClick: () => void
  onReportClick: () => void
  onMarkDelivered?: () => void
}

export default function ChatHeader({
  conversation,
  currentUserId,
  otherUserOnline,
  otherUserLastSeen,
  onBackClick,
  onReportClick,
  onMarkDelivered
}: ChatHeaderProps) {
  const isSeller = conversation.seller_id === currentUserId
  const otherUser = conversation.buyer_id === currentUserId 
    ? conversation.seller 
    : conversation.buyer
  const listingInfo = getListingInfo(conversation)
  const isBoosting = isBoostingConversation(conversation)

  // Get boosting status config
  const getBoostingStatusBadge = () => {
    if (!isBoosting || !conversation.boosting_order?.status) return null
    const config = BOOSTING_STATUS_CONFIG[conversation.boosting_order.status]
    if (!config) return null
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${config.colors}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        {/* Back button (mobile only) */}
        <button
          onClick={onBackClick}
          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* User info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-shrink-0">
              <Avatar
                avatarUrl={otherUser.avatar_url}
                username={otherUser.username}
                size="sm"
              />
              {otherUserOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold text-sm sm:text-base truncate">
                {otherUser.username}
              </span>
              <span className="text-xs font-normal text-gray-400">
                {otherUserOnline ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Active now
                  </span>
                ) : (
                  formatLastSeen(otherUserLastSeen)
                )}
              </span>
            </div>
          </div>
          
          {/* Listing/Boosting Order link */}
          {isBoosting ? (
            // Boosting order link
            <Link 
              href={getViewOrderLink(conversation, currentUserId)}
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition flex items-center gap-1 mt-1 truncate"
            >
              <span>⚡</span>
              <span className="truncate">
                {conversation.boosting_order?.game.charAt(0).toUpperCase()}{conversation.boosting_order?.game.slice(1)} Boost: {listingInfo.title} →
              </span>
            </Link>
          ) : listingInfo.title !== 'Deleted Listing' ? (
            // Marketplace listing link
            <Link 
              href={`/listing/${conversation.listing_id}`}
              className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition flex items-center gap-1 mt-1 truncate"
            >
              <span>🏷️</span>
              <span className="truncate">{listingInfo.title} →</span>
            </Link>
          ) : (
            <p className="text-xs text-gray-500 italic mt-1 flex items-center gap-1">
              <span>🏷️</span>
              <span className="truncate">{listingInfo.title}</span>
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Report button */}
          <button
            onClick={onReportClick}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Report user"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
          
          {/* View Order button for boosting */}
          {isBoosting && (
            <Link
              href={getViewOrderLink(conversation, currentUserId)}
              className="hidden sm:flex bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap items-center gap-1.5"
            >
              <span>⚡</span>
              View Order
            </Link>
          )}
          
          {/* Mark delivered button (seller only, pending marketplace orders) */}
          {!isBoosting && isSeller && conversation.order && conversation.order.status === 'pending' && onMarkDelivered && (
            <button
              onClick={onMarkDelivered}
              className="hidden sm:block bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              ✓ Mark Delivered
            </button>
          )}
        </div>
      </div>

      {/* Boosting Order Info Banner */}
      {isBoosting && conversation.boosting_order && (
        <div className="mt-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚡</span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  {conversation.boosting_order.game.charAt(0).toUpperCase()}{conversation.boosting_order.game.slice(1)} Rank Boost
                </p>
                <p className="text-cyan-300 text-xs">
                  {formatRankDisplay(conversation.boosting_order.current_rank)} → {formatRankDisplay(conversation.boosting_order.desired_rank)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getBoostingStatusBadge()}
              <span className="text-xs text-gray-400 font-mono">
                #{conversation.boosting_order.order_number.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}