'use client'

// ============================================================================
// BOOST REQUEST CARD COMPONENT
// ============================================================================
// Location: components/boosting/BoostRequestCard.tsx
// ============================================================================

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BoostRequest, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { formatPrice } from '@/lib/boosting/pricing'
import { REQUEST_STATUS_CONFIG } from '@/lib/boosting/constants'

interface BoostRequestCardProps {
  request: BoostRequest
  onAccept?: (requestId: string) => void
  onCounterOffer?: (requestId: string) => void
  showActions?: boolean
  isVendorView?: boolean
  isLoading?: boolean
}

export default function BoostRequestCard({
  request,
  onAccept,
  onCounterOffer,
  showActions = true,
  isVendorView = true,
  isLoading = false,
}: BoostRequestCardProps) {
  const currentRank = RANKS_MAP[request.current_rank as keyof typeof RANKS_MAP]
  const desiredRank = RANKS_MAP[request.desired_rank as keyof typeof RANKS_MAP]
  
  // Calculate time remaining
  const expiresAt = new Date(request.expires_at)
  const now = new Date()
  const timeRemaining = expiresAt.getTime() - now.getTime()
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  const isExpiringSoon = daysRemaining < 1
  const isFull = request.total_offers_received >= request.max_offers
  const statusConfig = REQUEST_STATUS_CONFIG[request.status]

  // Collect active options
  const activeOptions: string[] = []
  if (request.queue_type === 'duo') activeOptions.push('Duo Queue')
  if (request.is_priority) activeOptions.push('Priority')
  if (request.addon_offline_mode) activeOptions.push('Offline')
  if (request.addon_solo_queue_only) activeOptions.push('Solo Only')
  if (request.addon_no_5_stack) activeOptions.push('No 5 Stack')
  if (request.addon_specific_agents) activeOptions.push('Specific Agents')

  return (
    <div className="p-5 rounded-2xl bg-slate-800/40 border border-white/10 hover:border-purple-500/30 transition-all duration-300 flex flex-col h-full">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 font-mono mb-1">{request.request_number}</p>
          {request.customer && (
            <p className="text-sm text-gray-400">
              by <span className="text-white font-medium">{request.customer.username}</span>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Offers Counter */}
          <div className={`
            px-2.5 py-1 rounded-lg text-xs font-medium
            ${isFull ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-gray-400'}
          `}>
            {request.total_offers_received}/{request.max_offers} offers
          </div>
          
          {/* Status Badge */}
          {request.status !== 'open' && (
            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
              {statusConfig?.label}
            </div>
          )}
        </div>
      </div>

      {/* Rank Display */}
      <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-slate-900/50">
        {/* Current Rank */}
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: `${currentRank?.color}20` }}
          >
            {currentRank?.image ? (
              <Image
                src={currentRank.image}
                alt={currentRank.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-xl">🎮</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="font-semibold" style={{ color: currentRank?.color }}>
              {currentRank?.name}
            </p>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>

        {/* Desired Rank */}
        <div className="flex items-center gap-2">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: `${desiredRank?.color}20` }}
          >
            {desiredRank?.image ? (
              <Image
                src={desiredRank.image}
                alt={desiredRank.name}
                fill
                className="object-contain p-1"
                unoptimized
              />
            ) : (
              <span className="text-xl">🎮</span>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">To</p>
            <p className="font-semibold" style={{ color: desiredRank?.color }}>
              {desiredRank?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Options Tags - Always render with min-height for consistent alignment */}
      <div className="min-h-[32px] mb-4">
        {activeOptions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeOptions.map((option) => (
              <span 
                key={option}
                className="px-2 py-1 rounded-md text-xs font-medium bg-purple-500/20 text-purple-400"
              >
                {option}
              </span>
            ))}
          </div>
        ) : (
          // Empty placeholder to maintain consistent height
          <div className="h-[26px]" />
        )}
      </div>

      {/* Pricing Row */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Customer Offer</p>
          <p className="text-xl font-bold text-green-400">
            {formatPrice(request.customer_offer_price)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">Platform Suggested</p>
          <p className="text-sm text-gray-300">
            {formatPrice(request.platform_suggested_price)}
          </p>
        </div>
      </div>

      {/* Customer Notes - Optional section that grows */}
      {request.customer_notes && (
        <div className="mb-4 p-3 rounded-xl bg-slate-900/50 border border-white/5">
          <p className="text-xs text-gray-500 mb-1">Customer Notes:</p>
          <p className="text-sm text-gray-300 line-clamp-2">{request.customer_notes}</p>
        </div>
      )}

      {/* Spacer to push footer to bottom */}
      <div className="flex-grow" />

      {/* Footer Row */}
      <div className="flex items-center justify-between">
        {/* Time Remaining */}
        <div className={`flex items-center gap-1.5 text-sm ${isExpiringSoon ? 'text-orange-400' : 'text-gray-400'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {timeRemaining > 0 ? (
            <span>
              {daysRemaining > 0 && `${daysRemaining}d `}
              {hoursRemaining}h remaining
            </span>
          ) : (
            <span className="text-red-400">Expired</span>
          )}
        </div>

        {/* Estimated Time */}
        {request.estimated_days_min && request.estimated_days_max && (
          <div className="text-xs text-gray-500">
            Est: {request.estimated_days_min}-{request.estimated_days_max} days
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && isVendorView && request.status === 'open' && !isFull && (
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => onAccept?.(request.id)}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept {formatPrice(request.customer_offer_price)}
              </>
            )}
          </button>
          
          <button
            onClick={() => onCounterOffer?.(request.id)}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Counter-Offer
          </button>
        </div>
      )}

      {/* Full Message */}
      {isFull && isVendorView && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-center text-sm text-gray-500">
            Maximum offers reached for this request
          </p>
        </div>
      )}
    </div>
  )
}