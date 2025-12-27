'use client'

// ============================================================================
// COUNTER OFFER MODAL COMPONENT
// ============================================================================
// Location: components/boosting/CounterOfferModal.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { BoostRequest, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP, getRankIcon } from '@/lib/boosting/ranks'
import { formatPrice, validateCounterOfferPrice, calculateOfferPlatformFee, calculateVendorPayout } from '@/lib/boosting/pricing'
import { BOOSTING_COMMISSION_RATE, MAX_COUNTER_OFFER_MULTIPLIER, MAX_VENDOR_NOTES_LENGTH } from '@/lib/boosting/constants'

interface CounterOfferModalProps {
  isOpen: boolean
  onClose: () => void
  request: BoostRequest | null
  onSubmit: (data: {
    requestId: string
    offerType: 'accept' | 'counter'
    offeredPrice?: number
    estimatedDays?: number
    vendorNotes?: string
  }) => Promise<void>
  isLoading?: boolean
}

export default function CounterOfferModal({
  isOpen,
  onClose,
  request,
  onSubmit,
  isLoading = false,
}: CounterOfferModalProps) {
  const [offeredPrice, setOfferedPrice] = useState<number>(0)
  const [estimatedDays, setEstimatedDays] = useState<number>(3)
  const [vendorNotes, setVendorNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Reset form when request changes
  useEffect(() => {
    if (request) {
      setOfferedPrice(request.customer_offer_price)
      setEstimatedDays(request.estimated_days_max || 3)
      setVendorNotes('')
      setError(null)
    }
  }, [request])

  if (!isOpen || !request) return null

  const currentRank = RANKS_MAP[request.current_rank as keyof typeof RANKS_MAP]
  const desiredRank = RANKS_MAP[request.desired_rank as keyof typeof RANKS_MAP]
  
  const platformFee = calculateOfferPlatformFee(offeredPrice)
  const vendorPayout = calculateVendorPayout(offeredPrice)
  const validation = validateCounterOfferPrice(offeredPrice, request.platform_suggested_price)
  
  const priceDifference = offeredPrice - request.customer_offer_price
  const isAcceptingAsIs = offeredPrice === request.customer_offer_price

  const handleSubmit = async () => {
    if (!validation.valid) {
      setError(validation.error || 'Invalid price')
      return
    }

    setError(null)
    
    await onSubmit({
      requestId: request.id,
      offerType: isAcceptingAsIs ? 'accept' : 'counter',
      offeredPrice: isAcceptingAsIs ? undefined : offeredPrice,
      estimatedDays,
      vendorNotes: vendorNotes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">
            {isAcceptingAsIs ? 'Accept Offer' : 'Make Counter-Offer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Request Summary */}
          <div className="p-4 rounded-xl bg-slate-800/50 border border-white/10">
            <p className="text-xs text-gray-500 mb-3">{request.request_number}</p>
            
            {/* Ranks */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${currentRank?.color}20` }}
                >
                  {getRankIcon(request.current_rank as RankKey)}
                </div>
                <span className="font-medium" style={{ color: currentRank?.color }}>
                  {currentRank?.name}
                </span>
              </div>
              
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${desiredRank?.color}20` }}
                >
                  {getRankIcon(request.desired_rank as RankKey)}
                </div>
                <span className="font-medium" style={{ color: desiredRank?.color }}>
                  {desiredRank?.name}
                </span>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {request.queue_type === 'duo' && (
                <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">Duo</span>
              )}
              {request.is_priority && (
                <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">Priority</span>
              )}
              {request.addon_offline_mode && (
                <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">Offline</span>
              )}
              {request.addon_solo_queue_only && (
                <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">Solo Only</span>
              )}
            </div>
          </div>

          {/* Price Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-xs text-gray-500 mb-1">Customer Offer</p>
              <p className="text-lg font-bold text-green-400">
                {formatPrice(request.customer_offer_price)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/50">
              <p className="text-xs text-gray-500 mb-1">Platform Suggested</p>
              <p className="text-lg font-bold text-gray-300">
                {formatPrice(request.platform_suggested_price)}
              </p>
            </div>
          </div>

          {/* Your Offer Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Offer Price
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={request.max_counter_price}
                value={offeredPrice}
                onChange={(e) => {
                  setOfferedPrice(parseFloat(e.target.value) || 0)
                  setError(null)
                }}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-lg font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            
            {/* Price Change Indicator */}
            {priceDifference !== 0 && (
              <p className={`mt-2 text-sm ${priceDifference > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                {priceDifference > 0 ? '+' : ''}{formatPrice(priceDifference)} from customer's offer
              </p>
            )}
            
            {/* Max Counter Price */}
            <p className="mt-1 text-xs text-gray-500">
              Max allowed: {formatPrice(request.max_counter_price)} (+50% of platform price)
            </p>

            {/* Error */}
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Payout Calculation */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Your Offer</span>
              <span className="text-white font-medium">{formatPrice(offeredPrice)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Platform Fee ({Math.round(BOOSTING_COMMISSION_RATE * 100)}%)</span>
              <span className="text-red-400">-{formatPrice(platformFee)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-white font-semibold">You Receive</span>
              <span className="text-green-400 font-bold text-lg">{formatPrice(vendorPayout)}</span>
            </div>
          </div>

          {/* Estimated Days */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Completion (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Vendor Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes for Customer <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={vendorNotes}
              onChange={(e) => setVendorNotes(e.target.value.slice(0, MAX_VENDOR_NOTES_LENGTH))}
              placeholder="Explain your offer, availability, or credentials..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
              rows={3}
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {vendorNotes.length}/{MAX_VENDOR_NOTES_LENGTH}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-white/10 bg-slate-800/50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !validation.valid}
            className={`
              flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
              ${isAcceptingAsIs 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white'
              }
            `}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isAcceptingAsIs ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept Offer
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Submit Counter-Offer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}