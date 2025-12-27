// File Path: app/messages/components/modals/ReportSuccessBanner.tsx

'use client'

interface ReportSuccessBannerProps {
  isVisible: boolean
  onDismiss: () => void
}

export default function ReportSuccessBanner({
  isVisible,
  onDismiss
}: ReportSuccessBannerProps) {
  if (!isVisible) return null

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 sm:max-w-md">
      <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-400/30 rounded-2xl p-3 sm:p-4 shadow-2xl animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-xl">✓</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-green-300 font-bold text-xs sm:text-sm mb-1">Report Submitted</h3>
            <p className="text-white text-xs leading-relaxed">
              Thank you for your report. Our team will review it shortly and take appropriate action.
            </p>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}