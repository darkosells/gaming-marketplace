// app/checkout/components/PayPalButton.tsx - PayPal payment button component

'use client'

import { RefObject } from 'react'

interface PayPalButtonProps {
  paypalLoaded: boolean
  paypalError: string | null
  setPaypalError: (error: string | null) => void
  processing: boolean
  isFormValid: boolean
  paypalButtonsRef: RefObject<HTMLDivElement | null>
  paypalButtonsRendered: { current: boolean }
  renderPayPalButtons: () => void
}

export default function PayPalButton({
  paypalLoaded,
  paypalError,
  setPaypalError,
  processing,
  isFormValid,
  paypalButtonsRef,
  paypalButtonsRendered,
  renderPayPalButtons
}: PayPalButtonProps) {
  return (
    <div className="mt-6">
      {/* Form validation warning */}
      {!isFormValid && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
          <p className="text-yellow-300 text-xs sm:text-sm flex items-start gap-2">
            <span className="text-lg flex-shrink-0">⚠️</span>
            <span>
              <span className="font-semibold">Please complete your info:</span> Fill in your name and email above before paying.
            </span>
          </p>
        </div>
      )}
      
      {paypalError ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">❌</span>
            <div className="flex-1">
              <p className="text-red-400 font-semibold mb-1">Payment Failed</p>
              <p className="text-red-300 text-sm">{paypalError}</p>
              <button
                onClick={() => {
                  setPaypalError(null)
                  paypalButtonsRendered.current = false
                  renderPayPalButtons()
                }}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-colors"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      ) : !paypalLoaded ? (
        <div className="p-4 bg-slate-800 rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <span>Loading PayPal...</span>
          </div>
        </div>
      ) : processing ? (
        <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-blue-400 font-semibold text-lg">Processing Payment...</p>
              <p className="text-gray-400 text-sm mt-1">Please wait while we confirm your payment</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4">
            <p className="text-blue-300 text-xs sm:text-sm flex items-start gap-2">
              <span className="text-lg flex-shrink-0">🔒</span>
              <span>
                <span className="font-semibold">Secure Payment:</span> Click the PayPal button below to complete your purchase. 
                You can pay with your PayPal balance or any credit/debit card.
              </span>
            </p>
          </div>
          <div className={`paypal-buttons-wrapper bg-slate-800 rounded-xl p-4 sm:p-6 ${!isFormValid ? 'opacity-50 pointer-events-none' : ''}`}>
            <div 
              ref={paypalButtonsRef} 
              className="paypal-buttons-container min-h-[150px] w-full"
            ></div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-3">
            🔒 Secured by PayPal • 256-bit SSL encryption
          </p>
        </>
      )}
    </div>
  )
}