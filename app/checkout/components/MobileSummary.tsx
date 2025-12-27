// app/checkout/components/MobileSummary.tsx - Mobile bottom bar and summary modal

'use client'

import { CartItem, SellerStats, BoostCheckoutData, CheckoutType } from '../types'
import TrustBadges from './TrustBadges'
import { RANKS_MAP, getRankIcon } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'

interface MobileSummaryProps {
  cartItem: CartItem | null
  sellerStats: SellerStats | null
  subtotal: number
  serviceFee: number
  total: number
  selectedPayment: string
  isFormValid: boolean
  cryptoLoading: boolean
  handlePlaceOrder: () => Promise<void>
  showMobileSummary: boolean
  setShowMobileSummary: (show: boolean) => void
  checkoutType?: CheckoutType
  boostData?: BoostCheckoutData | null
}

export default function MobileSummary({
  cartItem,
  sellerStats,
  subtotal,
  serviceFee,
  total,
  selectedPayment,
  isFormValid,
  cryptoLoading,
  handlePlaceOrder,
  showMobileSummary,
  setShowMobileSummary,
  checkoutType = 'listing',
  boostData
}: MobileSummaryProps) {
  
  const getRankInfo = (rankKey: string) => {
    return RANKS_MAP[rankKey as RankKey] || { name: rankKey, color: '#ffffff' }
  }

  // BOOSTING CHECKOUT MOBILE
  if (checkoutType === 'boost' && boostData) {
    const { request, offer, vendorStats } = boostData
    const currentRank = getRankInfo(request.current_rank)
    const desiredRank = getRankInfo(request.desired_rank)

    return (
      <>
        {showMobileSummary && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowMobileSummary(false)}></div>
            <div className="relative w-full bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">🚀 Boost Summary</h3>
                <button onClick={() => setShowMobileSummary(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-center">
                      <span className="text-3xl">{getRankIcon(request.current_rank as RankKey)}</span>
                      <p className="text-xs font-medium mt-1" style={{ color: currentRank.color }}>{currentRank.name}</p>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-3">
                      <span className="text-purple-400 text-lg">→</span>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl">{getRankIcon(request.desired_rank as RankKey)}</span>
                      <p className="text-xs font-medium mt-1" style={{ color: desiredRank.color }}>{desiredRank.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg font-medium">{request.game}</span>
                    <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded-lg">{request.queue_type === 'duo' ? '👥 Duo' : '👤 Solo'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {offer.vendor?.avatar_url ? (
                      <img src={offer.vendor.avatar_url} alt={offer.vendor?.username || 'Booster'} className="w-full h-full object-cover" />
                    ) : (
                      <span>{offer.vendor?.username?.charAt(0).toUpperCase() || 'B'}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{offer.vendor?.username || 'Booster'}</p>
                    <div className="flex items-center gap-2 text-xs">
                      {vendorStats && vendorStats.boost_review_count > 0 && (
                        <span className="text-yellow-400">★ {vendorStats.boost_rating.toFixed(1)}</span>
                      )}
                      <span className="text-gray-400">{vendorStats ? `${vendorStats.total_boosts_completed} boosts` : 'New Booster'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Boost Price</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Service Fee (8%)</span>
                    <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-white text-xl font-bold">
                      <span>Total</span>
                      <span className="text-green-400">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-green-400">🛡️</span><span>Money-back guarantee</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-blue-400">🔒</span><span>Secure credential handling</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-purple-400">📊</span><span>Progress tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 z-40 safe-area-bottom">
          <div className="flex items-center justify-center gap-4 py-2 px-3 bg-cyan-500/10 border-b border-cyan-500/20">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs">
              <span>🛡️</span><span className="font-medium">Protected</span>
            </div>
            <div className="w-px h-3 bg-cyan-500/30"></div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-purple-400">🚀</span><span className="font-medium text-purple-400">Boosting</span>
            </div>
            <div className="w-px h-3 bg-cyan-500/30"></div>
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs">
              <span>🔒</span><span className="font-medium">Secure</span>
            </div>
          </div>
          <div className="p-3 sm:p-4">
            {selectedPayment === 'crypto' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
                  </div>
                  <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
                </div>
                <button onClick={handlePlaceOrder} disabled={cryptoLoading || !isFormValid} className="w-full py-3.5 rounded-xl font-bold transition-colors text-sm sm:text-base min-h-[48px] bg-gradient-to-r from-orange-500 to-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {cryptoLoading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Preparing...</span></>) : (<><span>🔒</span><span>Complete Secure Purchase</span></>)}
                </button>
              </div>
            )}
            {selectedPayment === 'paypal' && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
                </div>
                <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
                <div className="bg-blue-500/20 text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap border border-blue-500/30 min-h-[44px] flex items-center gap-2">
                  <span>👆</span><span>Pay Above</span>
                </div>
              </div>
            )}
            {!selectedPayment && (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
                </div>
                <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
                <div className="bg-purple-500/20 text-purple-400 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap border border-purple-500/30 min-h-[44px] flex items-center gap-2">
                  <span>💳</span><span>Select Payment</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // EXISTING LISTING CHECKOUT
  if (!cartItem) return null

  return (
    <>
      {showMobileSummary && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowMobileSummary(false)}></div>
          <div className="relative w-full bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Order Summary</h3>
              <button onClick={() => setShowMobileSummary(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3 pb-4 border-b border-white/10">
                <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
                  {cartItem.listing.image_url ? (
                    <img src={cartItem.listing.image_url} alt={cartItem.listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-2xl">{cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm line-clamp-2">{cartItem.listing.title}</p>
                  <p className="text-purple-400 text-xs">{cartItem.listing.game}</p>
                  <p className="text-gray-400 text-xs">Qty: {cartItem.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Service Fee (5%)</span>
                  <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between text-white text-xl font-bold">
                    <span>Total</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <TrustBadges deliveryType={cartItem.listing.delivery_type} />
              <a href="https://www.trustpilot.com/review/nashflare.com" target="_blank" rel="noopener noreferrer" className="block bg-slate-800 border border-white/10 rounded-xl p-3">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-gray-400 text-xs">Rated <span className="text-white font-semibold">Excellent</span> on</p>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/></svg>
                    <span className="text-white font-bold text-sm">Trustpilot</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 h-4 bg-[#00B67A] flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 z-40 safe-area-bottom">
        <div className="flex items-center justify-center gap-4 py-2 px-3 bg-green-500/10 border-b border-green-500/20">
          <div className="flex items-center gap-1.5 text-green-400 text-xs">
            <span>🛡️</span><span className="font-medium">Buyer Protected</span>
          </div>
          <div className="w-px h-3 bg-green-500/30"></div>
          <div className="flex items-center gap-1.5 text-xs">
            {cartItem.listing.delivery_type === 'automatic' ? (
              <><span className="text-green-400">⚡</span><span className="font-medium text-green-400">Instant Delivery</span></>
            ) : (
              <><span className="text-blue-400">📦</span><span className="font-medium text-blue-400">Fast Delivery</span></>
            )}
          </div>
          <div className="w-px h-3 bg-green-500/30"></div>
          <div className="flex items-center gap-1.5 text-green-400 text-xs">
            <span>🔒</span><span className="font-medium">Secure</span>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          {selectedPayment === 'crypto' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
                </div>
                <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
              </div>
              <button onClick={handlePlaceOrder} disabled={cryptoLoading || !isFormValid} className="w-full py-3.5 rounded-xl font-bold transition-colors text-sm sm:text-base min-h-[48px] bg-gradient-to-r from-orange-500 to-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {cryptoLoading ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Preparing...</span></>) : (<><span>🔒</span><span>Complete Secure Purchase</span></>)}
              </button>
            </div>
          )}
          {selectedPayment === 'paypal' && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
              <div className="bg-blue-500/20 text-blue-400 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap border border-blue-500/30 min-h-[44px] flex items-center gap-2">
                <span>👆</span><span>Pay Above</span>
              </div>
            </div>
          )}
          {!selectedPayment && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Total Price</p>
                <p className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</p>
              </div>
              <button onClick={() => setShowMobileSummary(true)} className="bg-slate-800 text-white px-3 py-2.5 rounded-xl font-semibold border border-white/20 min-h-[44px] text-sm whitespace-nowrap">📋 Details</button>
              <div className="bg-purple-500/20 text-purple-400 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap border border-purple-500/30 min-h-[44px] flex items-center gap-2">
                <span>💳</span><span>Select Payment</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}