// app/checkout/components/GuaranteeModal.tsx - Money-back guarantee modal

'use client'

interface GuaranteeModalProps {
  show: boolean
  onClose: () => void
}

export default function GuaranteeModal({ show, onClose }: GuaranteeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Money-Back Guarantee</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4 text-gray-300 text-sm">
          <p>
            Your purchase is protected by our 48-hour Money-Back Guarantee. If something goes wrong, we've got you covered.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <p className="text-white font-medium">Item Not As Described</p>
                <p className="text-gray-400 text-xs">Full refund if the item doesn't match the listing description</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <p className="text-white font-medium">Non-Delivery</p>
                <p className="text-gray-400 text-xs">Full refund if you don't receive your item</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <p className="text-white font-medium">Account Issues</p>
                <p className="text-gray-400 text-xs">Protected if account credentials don't work or get recovered</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-gray-400">
              <span className="text-white font-medium">How to claim:</span> Open a dispute within 48 hours of purchase through your order details page. Our team will review and resolve within 24 hours.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition min-h-[48px]"
        >
          Got It
        </button>
      </div>
    </div>
  )
}