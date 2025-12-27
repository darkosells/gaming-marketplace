// File Path: app/messages/components/modals/SecurityWarningBanner.tsx

'use client'

interface SecurityWarningBannerProps {
  isVisible: boolean
  onDismiss: () => void
  onCancelUpload: () => void
}

export default function SecurityWarningBanner({
  isVisible,
  onDismiss,
  onCancelUpload
}: SecurityWarningBannerProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 sm:max-w-md">
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-400/30 rounded-2xl p-3 sm:p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-xl">⚠️</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-orange-300 font-bold text-xs sm:text-sm mb-1">Security Warning</h3>
            <p className="text-white text-xs leading-relaxed mb-2 sm:mb-3">
              This image filename suggests it may contain sensitive information. Never share passwords, credit cards, IDs, or personal documents.
            </p>
            <button
              onClick={onDismiss}
              className="text-xs text-orange-300 hover:text-orange-200 font-semibold"
            >
              I understand →
            </button>
          </div>
          <button
            onClick={onCancelUpload}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}