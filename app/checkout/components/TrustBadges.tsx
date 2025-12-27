// app/checkout/components/TrustBadges.tsx - Trust badges component

'use client'

interface TrustBadgesProps {
  deliveryType: 'manual' | 'automatic'
}

export default function TrustBadges({ deliveryType }: TrustBadgesProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-white/10">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-3">Your Purchase is Protected</p>
      <div className="flex items-center space-x-3 text-sm text-gray-300">
        <span className="text-green-400">🛡️</span>
        <span>48-Hour Buyer Protection</span>
      </div>
      <div className="flex items-center space-x-3 text-sm text-gray-300">
        <span className="text-green-400">💸</span>
        <span>Money-Back Guarantee</span>
      </div>
      <div className="flex items-center space-x-3 text-sm text-gray-300">
        {deliveryType === 'automatic' ? (
          <>
            <span className="text-green-400">⚡</span>
            <span>Instant Delivery</span>
          </>
        ) : (
          <>
            <span className="text-blue-400">📦</span>
            <span>Fast Delivery</span>
          </>
        )}
      </div>
      <div className="flex items-center space-x-3 text-sm text-gray-300">
        <span className="text-green-400">🔒</span>
        <span>Secure Encrypted Payment</span>
      </div>
      <div className="flex items-center space-x-3 text-sm text-gray-300">
        <span className="text-green-400">💬</span>
        <span>24/7 Customer Support</span>
      </div>
    </div>
  )
}