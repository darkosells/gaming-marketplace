// app/checkout/components/OrderSummary.tsx - Desktop order summary sidebar

'use client'

import Image from 'next/image'
import { CartItem, SellerStats, BoostCheckoutData, CheckoutType } from '../types'
import TrustBadges from './TrustBadges'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'

interface OrderSummaryProps {
  cartItem: CartItem | null
  sellerStats: SellerStats | null
  subtotal: number
  serviceFee: number
  total: number
  selectedPayment: string
  isFormValid: boolean
  cryptoLoading: boolean
  handlePlaceOrder: () => Promise<void>
  // Boosting props (optional)
  checkoutType?: CheckoutType
  boostData?: BoostCheckoutData | null
}

export default function OrderSummary({
  cartItem,
  sellerStats,
  subtotal,
  serviceFee,
  total,
  selectedPayment,
  isFormValid,
  cryptoLoading,
  handlePlaceOrder,
  checkoutType = 'listing',
  boostData
}: OrderSummaryProps) {
  
  // Helper to get rank info
  const getRankInfo = (rankKey: string) => {
    return RANKS_MAP[rankKey as RankKey] || { name: rankKey, color: '#ffffff', image: '' }
  }

  // For boosting checkout
  if (checkoutType === 'boost' && boostData) {
    const { request, offer, vendorStats } = boostData
    const currentRank = getRankInfo(request.current_rank)
    const desiredRank = getRankInfo(request.desired_rank)

    return (
      <div className="hidden lg:block lg:col-span-1">
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 sticky top-24">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-purple-400">🚀</span>
            Boost Summary
          </h2>

          {/* Boost Info */}
          <div className="mb-4 pb-4 border-b border-white/10">
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
              {/* Rank Display with Images */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <div className="w-14 h-14 relative mx-auto mb-1">
                    {currentRank.image ? (
                      <Image
                        src={currentRank.image}
                        alt={currentRank.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: currentRank.color }}>
                    {currentRank.name}
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center px-3">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-transparent"></div>
                    <span className="text-purple-400 text-lg">→</span>
                    <div className="w-8 h-0.5 bg-gradient-to-l from-pink-500 to-transparent"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-14 h-14 relative mx-auto mb-1">
                    {desiredRank.image ? (
                      <Image
                        src={desiredRank.image}
                        alt={desiredRank.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎮</div>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: desiredRank.color }}>
                    {desiredRank.name}
                  </p>
                </div>
              </div>

              {/* Game & Queue Type */}
              <div className="flex items-center justify-center gap-2 text-xs">
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg font-medium capitalize">
  {request.game}
</span>
                <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded-lg">
                  {request.queue_type === 'duo' ? '👥 Duo Queue' : '👤 Solo Queue'}
                </span>
                {request.is_priority && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg">
                    ⚡ Priority
                  </span>
                )}
              </div>
            </div>

            {/* Add-ons */}
            {(request.addon_offline_mode || request.addon_solo_queue_only || request.addon_no_5_stack || request.addon_specific_agents) && (
              <div className="mt-3 flex flex-wrap gap-1">
                {request.addon_offline_mode && (
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs">🔇 Offline Mode</span>
                )}
                {request.addon_solo_queue_only && (
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs">👤 Solo Only</span>
                )}
                {request.addon_no_5_stack && (
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs">🚫 No 5-Stack</span>
                )}
                {request.addon_specific_agents && (
                  <span className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs">🎯 Specific Agents</span>
                )}
              </div>
            )}
          </div>

          {/* Booster Info */}
          <div className="mb-4 pb-4 border-b border-white/10">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Your Booster</p>
            <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-cyan-500/30">
                {offer.vendor?.avatar_url ? (
                  <img 
                    src={offer.vendor.avatar_url} 
                    alt={offer.vendor?.username || 'Booster'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg">
                    {offer.vendor?.username?.charAt(0).toUpperCase() || 'B'}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{offer.vendor?.username || 'Booster'}</p>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  {vendorStats && vendorStats.boost_review_count > 0 && (
                    <>
                      <span className="text-yellow-400 flex items-center gap-0.5">
                        ★ {vendorStats.boost_rating.toFixed(1)}
                      </span>
                      <span className="text-gray-500">•</span>
                    </>
                  )}
                  <span className="text-gray-400">
                    {vendorStats ? `${vendorStats.total_boosts_completed} boosts` : 'New Booster'}
                  </span>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            {offer.estimated_days && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-400">⏱️ Estimated:</span>
                <span className="text-white font-medium">
                  {offer.estimated_days} {offer.estimated_days === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 mb-6">
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

          {/* Desktop Place Order Button - Only show for crypto */}
          {selectedPayment === 'crypto' && (
            <>
              <button
                onClick={handlePlaceOrder}
                disabled={cryptoLoading || !isFormValid}
                className="w-full py-4 rounded-xl font-semibold transition-colors mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cryptoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Preparing Checkout...
                  </span>
                ) : (
                  `₿ Pay $${total.toFixed(2)} with Crypto`
                )}
              </button>
              <p className="text-center text-gray-500 text-xs mb-6">
                You'll be redirected to NOWPayments
              </p>
            </>
          )}

          {/* Payment Status Messages */}
          {selectedPayment === 'paypal' && (
            <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-blue-500/10 border-blue-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
              {isFormValid ? (
                <>
                  <div className="text-blue-400 text-2xl mb-2">👈</div>
                  <p className="text-blue-300 text-sm font-medium">Complete payment using the PayPal buttons</p>
                  <p className="text-gray-400 text-xs mt-1">Select PayPal, Credit or Debit Card</p>
                </>
              ) : (
                <>
                  <div className="text-yellow-400 text-2xl mb-2">📝</div>
                  <p className="text-yellow-300 text-sm font-medium">Fill in your info first</p>
                  <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
                </>
              )}
            </div>
          )}

          {selectedPayment === 'crypto' && (
            <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
              {isFormValid ? (
                <>
                  <div className="text-orange-400 text-2xl mb-2">₿</div>
                  <p className="text-orange-300 text-sm font-medium">Click the button to pay with crypto</p>
                  <p className="text-gray-400 text-xs mt-1">Bitcoin, Ethereum, USDC & more</p>
                </>
              ) : (
                <>
                  <div className="text-yellow-400 text-2xl mb-2">📝</div>
                  <p className="text-yellow-300 text-sm font-medium">Fill in your info first</p>
                  <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
                </>
              )}
            </div>
          )}

          {!selectedPayment && (
            <div className="text-center py-4 px-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
              <div className="text-purple-400 text-2xl mb-2">💳</div>
              <p className="text-purple-300 text-sm font-medium">Select a payment method</p>
              <p className="text-gray-400 text-xs mt-1">Choose PayPal or Cryptocurrency above</p>
            </div>
          )}

          {/* Boosting Trust Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-green-400">🛡️</span>
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-blue-400">🔒</span>
              <span>Secure credential handling</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-purple-400">📊</span>
              <span>Progress tracking with screenshots</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-cyan-400">💬</span>
              <span>Direct chat with your booster</span>
            </div>
          </div>

          {/* Trustpilot Badge */}
          <a 
            href="https://www.trustpilot.com/review/nashflare.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-4 block bg-slate-800 border border-white/10 rounded-xl p-3 hover:border-[#00B67A]/30 transition-colors"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-gray-400 text-xs">Rated <span className="text-white font-semibold">Excellent</span> on</p>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
                </svg>
                <span className="text-white font-bold text-sm">Trustpilot</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-[#00B67A] flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    )
  }

  // ============================================================================
  // EXISTING LISTING CHECKOUT (unchanged)
  // ============================================================================
  if (!cartItem) return null

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 sticky top-24">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-purple-400">📦</span>
          Order Summary
        </h2>

        {/* Product Info */}
        <div className="flex gap-3 mb-4 pb-4 border-b border-white/10">
          <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
            {cartItem.listing.image_url ? (
              <img
                src={cartItem.listing.image_url}
                alt={cartItem.listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl">
                  {cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm line-clamp-2">{cartItem.listing.title}</p>
            <p className="text-purple-400 text-xs">{cartItem.listing.game}</p>
            <p className="text-gray-400 text-xs">Qty: {cartItem.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</p>
          </div>
        </div>

        {/* Seller Info */}
        <div className="mb-4 pb-4 border-b border-white/10">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Sold by</p>
          <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-purple-500/30">
              {cartItem.listing.profiles?.avatar_url ? (
                <img 
                  src={cartItem.listing.profiles.avatar_url} 
                  alt={cartItem.listing.profiles?.username || 'Seller'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">
                  {cartItem.listing.profiles?.username?.charAt(0).toUpperCase() || 'S'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-semibold text-sm truncate">{cartItem.listing.profiles?.username || 'Seller'}</p>
                {cartItem.listing.profiles?.verified && (
                  <span className="text-blue-400 text-sm" title="Verified Seller">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                {(cartItem.listing.profiles?.average_rating || (sellerStats && sellerStats.rating > 0)) && (
                  <>
                    <span className="text-yellow-400 flex items-center gap-0.5">
                      ★ {(cartItem.listing.profiles?.average_rating || sellerStats?.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-gray-500">•</span>
                  </>
                )}
                <span className="text-gray-400">
                  {sellerStats ? `${sellerStats.totalSales} sales` : 'Verified Seller'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 mb-6">
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

        {/* Desktop Place Order Button - Only show for crypto */}
        {selectedPayment === 'crypto' && (
          <>
            <button
              onClick={handlePlaceOrder}
              disabled={cryptoLoading || !isFormValid}
              className="w-full py-4 rounded-xl font-semibold transition-colors mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cryptoLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Preparing Checkout...
                </span>
              ) : (
                `₿ Pay $${total.toFixed(2)} with Crypto`
              )}
            </button>
            <p className="text-center text-gray-500 text-xs mb-6">
              You'll be redirected to NOWPayments
            </p>
          </>
        )}

        {/* Payment Status Messages */}
        {selectedPayment === 'paypal' && (
          <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-blue-500/10 border-blue-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
            {isFormValid ? (
              <>
                <div className="text-blue-400 text-2xl mb-2">👈</div>
                <p className="text-blue-300 text-sm font-medium">Complete payment using the PayPal buttons</p>
                <p className="text-gray-400 text-xs mt-1">Select PayPal, Credit or Debit Card</p>
              </>
            ) : (
              <>
                <div className="text-yellow-400 text-2xl mb-2">📝</div>
                <p className="text-yellow-300 text-sm font-medium">Fill in your info first</p>
                <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
              </>
            )}
          </div>
        )}

        {selectedPayment === 'crypto' && (
          <div className={`text-center py-4 px-3 ${isFormValid ? 'bg-orange-500/10 border-orange-500/30' : 'bg-yellow-500/10 border-yellow-500/30'} border rounded-xl mb-6`}>
            {isFormValid ? (
              <>
                <div className="text-orange-400 text-2xl mb-2">₿</div>
                <p className="text-orange-300 text-sm font-medium">Click the button to pay with crypto</p>
                <p className="text-gray-400 text-xs mt-1">Bitcoin, Ethereum, USDC & more</p>
              </>
            ) : (
              <>
                <div className="text-yellow-400 text-2xl mb-2">📝</div>
                <p className="text-yellow-300 text-sm font-medium">Fill in your info first</p>
                <p className="text-gray-400 text-xs mt-1">Name and email are required</p>
              </>
            )}
          </div>
        )}

        {!selectedPayment && (
          <div className="text-center py-4 px-3 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
            <div className="text-purple-400 text-2xl mb-2">💳</div>
            <p className="text-purple-300 text-sm font-medium">Select a payment method</p>
            <p className="text-gray-400 text-xs mt-1">Choose PayPal or Cryptocurrency above</p>
          </div>
        )}

        {/* Trust Badges */}
        <TrustBadges deliveryType={cartItem.listing.delivery_type} />

        {/* Trustpilot Badge */}
        <a 
          href="https://www.trustpilot.com/review/nashflare.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 block bg-slate-800 border border-white/10 rounded-xl p-3 hover:border-[#00B67A]/30 transition-colors"
        >
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-400 text-xs">Rated <span className="text-white font-semibold">Excellent</span> on</p>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#00B67A"/>
              </svg>
              <span className="text-white font-bold text-sm">Trustpilot</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-[#00B67A] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}