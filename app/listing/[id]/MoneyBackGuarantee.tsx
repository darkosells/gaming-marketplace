'use client'

interface MoneyBackGuaranteeProps {
  onLearnMore?: () => void
  variant?: 'default' | 'compact'
}

export default function MoneyBackGuarantee({ onLearnMore, variant = 'default' }: MoneyBackGuaranteeProps) {
  if (variant === 'compact') {
    return (
      <button
        onClick={onLearnMore}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl hover:from-green-500/20 hover:to-emerald-500/20 transition-all group"
      >
        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-green-400 font-semibold text-sm">48h Money-Back Guarantee</span>
        <svg className="w-4 h-4 text-green-400/60 group-hover:text-green-400 transition ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 animate-pulse" style={{ animationDuration: '3s' }}></div>
      
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Shield Icon */}
          <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-green-500/30">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-green-400 font-bold text-base">48h Money-Back Guarantee</h4>
              {onLearnMore && (
                <button 
                  onClick={onLearnMore}
                  className="text-green-400/60 hover:text-green-400 transition p-1"
                  aria-label="Learn more about guarantee"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Not as described? Get a full refund within 48 hours. Your purchase is protected.
            </p>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-green-500/20">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-green-400">✓</span>
            <span>Verified Sellers</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-green-400">✓</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}