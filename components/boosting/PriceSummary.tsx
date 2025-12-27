'use client'

// ============================================================================
// PRICE SUMMARY COMPONENT
// ============================================================================
// Location: components/boosting/PriceSummary.tsx
// ============================================================================

import Image from 'next/image'
import { PriceCalculation, QueueType, AddonSelection } from '@/lib/boosting/types'
import { formatPrice, getPriceBreakdown } from '@/lib/boosting/pricing'
import { getRankIcon, RANKS_MAP } from '@/lib/boosting/ranks'

interface PriceSummaryProps {
  calculation: PriceCalculation | null
  currentRank: string | null
  desiredRank: string | null
  queueType: QueueType
  addons: AddonSelection
  customerOfferPrice?: number
  onOfferPriceChange?: (price: number) => void
  showOfferInput?: boolean
  isLoading?: boolean
}

export default function PriceSummary({
  calculation,
  currentRank,
  desiredRank,
  queueType,
  addons,
  customerOfferPrice,
  onOfferPriceChange,
  showOfferInput = false,
  isLoading = false,
}: PriceSummaryProps) {
  if (!calculation || !currentRank || !desiredRank) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-white/10">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-400">Select your ranks to see pricing</p>
        </div>
      </div>
    )
  }

  const currentRankData = RANKS_MAP[currentRank as keyof typeof RANKS_MAP]
  const desiredRankData = RANKS_MAP[desiredRank as keyof typeof RANKS_MAP]
  const breakdown = getPriceBreakdown(calculation, queueType, addons)

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10">
      {/* Header */}
      <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>

      {/* Rank Progression - Main display */}
      <div className="flex items-center justify-center gap-3 mb-4 p-4 rounded-xl bg-slate-900/50">
        {/* Current Rank */}
        <div className="text-center flex-shrink-0">
          <div className="w-14 h-14 mx-auto relative mb-2">
            <Image
              src={currentRankData?.image || ''}
              alt={currentRankData?.name || 'Current Rank'}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="text-xs font-medium text-gray-400">
            {currentRankData?.name}
          </p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center flex-shrink-0">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="text-xs text-gray-500 mt-1">
            {calculation.divisions} div{calculation.divisions > 1 ? 's' : ''}
          </span>
        </div>

        {/* Desired Rank */}
        <div className="text-center flex-shrink-0">
          <div className="w-14 h-14 mx-auto relative mb-2">
            <Image
              src={desiredRankData?.image || ''}
              alt={desiredRankData?.name || 'Desired Rank'}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="text-xs font-medium" style={{ color: desiredRankData?.color }}>
            {desiredRankData?.name}
          </p>
        </div>
      </div>

      {/* Mini Progress Bar - Wraps to multiple rows with bar line */}
      <div className="mb-4 p-3 rounded-xl bg-slate-900/30 relative">
        {/* Background bar line */}
        <div className="absolute left-3 right-3 top-[calc(50%-8px)] h-1 bg-slate-700 rounded-full" />
        
        <div className="relative flex flex-wrap justify-between gap-1">
          {Object.values(RANKS_MAP)
            .filter(r => r.order >= (currentRankData?.order || 0) && r.order <= (desiredRankData?.order || 0))
            .map((rank, index, arr) => {
              const isStart = index === 0
              const isEnd = index === arr.length - 1
              
              return (
                <div 
                  key={rank.key} 
                  className={`
                    flex-shrink-0 rounded-full p-0.5 bg-slate-900 z-10
                    ${isStart ? 'ring-1 ring-cyan-500/50' : ''}
                    ${isEnd ? 'ring-1 ring-purple-500/50' : ''}
                  `}
                  title={rank.name}
                >
                  <div className="w-5 h-5 relative">
                    <Image
                      src={rank.image || ''}
                      alt={rank.name || ''}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              )
            })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-cyan-400">{currentRankData?.name}</span>
          <span className="text-[10px] text-purple-400">{desiredRankData?.name}</span>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-4">
        {breakdown.map((item, index) => (
          <div 
            key={index}
            className={`
              flex items-center justify-between py-2
              ${item.isSubtotal ? 'border-t border-white/10 pt-3 mt-3' : ''}
              ${item.isTotal ? 'border-t-2 border-purple-500/30 pt-3 mt-3' : ''}
            `}
          >
            <span className={`
              ${item.isTotal ? 'text-white font-bold text-lg' : ''}
              ${item.isSubtotal ? 'text-gray-300 font-medium' : ''}
              ${!item.isTotal && !item.isSubtotal ? 'text-gray-400 text-sm' : ''}
            `}>
              {item.label}
              {item.percentage && !item.isTotal && (
                <span className="ml-1 text-xs text-purple-400">
                  (+{item.percentage}%)
                </span>
              )}
            </span>
            <span className={`
              ${item.isTotal ? 'text-white font-bold text-lg' : ''}
              ${item.isSubtotal ? 'text-white font-medium' : ''}
              ${!item.isTotal && !item.isSubtotal ? 'text-gray-300 text-sm' : ''}
              ${item.isAddition && !item.isTotal ? 'text-purple-400' : ''}
            `}>
              {item.isAddition && !item.isTotal && '+'}
              {formatPrice(item.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Estimated Time */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4">
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm text-blue-300">
          Estimated completion: <strong>{calculation.estimatedDaysMin}-{calculation.estimatedDaysMax} days</strong>
        </span>
      </div>

      {/* Custom Offer Input */}
      {showOfferInput && onOfferPriceChange && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/50 border border-white/10">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Offer Price (optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customerOfferPrice ?? calculation.total}
              onChange={(e) => onOfferPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              placeholder={calculation.total.toFixed(2)}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Platform suggested: {formatPrice(calculation.total)}. You can offer a different amount.
          </p>
        </div>
      )}

      {/* Max Counter Offer Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Vendors can counter-offer up to {formatPrice(calculation.maxCounterPrice)}
      </div>
    </div>
  )
}