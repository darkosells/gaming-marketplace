// File Path: app/messages/components/modals/DeliverySecurityModal.tsx

'use client'

interface DeliverySecurityModalProps {
  isOpen: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function DeliverySecurityModal({
  isOpen,
  onConfirm,
  onClose
}: DeliverySecurityModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-orange-500/50 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl animate-slide-up sm:animate-fade-in max-h-[85vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 flex-shrink-0">
            <span className="text-2xl sm:text-3xl">🔐</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-orange-400">Security Notice</h3>
            <p className="text-xs sm:text-sm text-gray-400">Reveal Delivery Information</p>
          </div>
        </div>
        
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 sm:p-4">
            <p className="text-orange-200 text-xs sm:text-sm leading-relaxed">
              <strong className="text-orange-300">⚠️ Important:</strong> Only reveal when you're ready to use this information. For your security, this action is logged.
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              <p className="text-gray-300 text-xs sm:text-sm">Keep credentials private</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5">✓</span>
              <p className="text-gray-300 text-xs sm:text-sm">Test immediately to verify</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-red-400 mt-0.5">✕</span>
              <p className="text-gray-300 text-xs sm:text-sm">Never share with anyone</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>This reveal will be logged for security purposes</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button 
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all min-h-[48px]"
          >
            🔓 I Understand, Reveal
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all min-h-[48px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}