// app/checkout/components/PaymentMethods.tsx - Payment method selection

'use client'

import { RefObject, MutableRefObject } from 'react'
import PayPalButton from './PayPalButton'
import CryptoPayment from './CryptoPayment'

interface PaymentMethodsProps {
  selectedPayment: string
  setSelectedPayment: (payment: string) => void
  isFormValid: boolean
  // PayPal props
  paypalLoaded: boolean
  paypalError: string | null
  setPaypalError: (error: string | null) => void
  processing: boolean
  paypalButtonsRef: RefObject<HTMLDivElement | null>
  paypalButtonsRendered: { current: boolean }
  paypalOrderId: MutableRefObject<string | null>
  renderPayPalButtons: () => void
  // Crypto props
  cryptoLoading: boolean
  cryptoError: string | null
  setCryptoError: (error: string | null) => void
  handleCryptoPayment: () => Promise<void>
  total: number
}

export default function PaymentMethods({
  selectedPayment,
  setSelectedPayment,
  isFormValid,
  paypalLoaded,
  paypalError,
  setPaypalError,
  processing,
  paypalButtonsRef,
  paypalButtonsRendered,
  paypalOrderId,
  renderPayPalButtons,
  cryptoLoading,
  cryptoError,
  setCryptoError,
  handleCryptoPayment,
  total
}: PaymentMethodsProps) {
  return (
    <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <span className="text-purple-400">💳</span>
        Payment Method
      </h2>

      <div className="space-y-3">
        {/* PayPal - Primary Payment Method */}
        <label className={`flex items-start sm:items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors ${
          selectedPayment === 'paypal' 
            ? 'bg-blue-500/20 border-blue-500/50' 
            : 'bg-slate-800/50 border-white/10 hover:border-blue-500/30'
        }`}>
          <input
            type="radio"
            name="payment"
            value="paypal"
            checked={selectedPayment === 'paypal'}
            onChange={(e) => {
              setSelectedPayment(e.target.value)
              paypalButtonsRendered.current = false
              paypalOrderId.current = null
            }}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
            selectedPayment === 'paypal' ? 'border-blue-500' : 'border-gray-500'
          }`}>
            {selectedPayment === 'paypal' && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold flex flex-wrap items-center gap-2 text-sm sm:text-base">
              <span>PayPal</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded">RECOMMENDED</span>
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">Pay with PayPal, Credit or Debit Card</p>
          </div>
          <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#003087] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">PP</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">💳</span>
            </div>
          </div>
        </label>

        {/* Cryptocurrency via NOWPayments */}
        <label className={`flex items-start sm:items-center p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors ${
          selectedPayment === 'crypto' 
            ? 'bg-orange-500/20 border-orange-500/50' 
            : 'bg-slate-800/50 border-white/10 hover:border-orange-500/30'
        }`}>
          <input
            type="radio"
            name="payment"
            value="crypto"
            checked={selectedPayment === 'crypto'}
            onChange={(e) => setSelectedPayment(e.target.value)}
            className="sr-only"
          />
          <div className={`w-5 h-5 rounded-full border-2 mr-3 sm:mr-4 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 ${
            selectedPayment === 'crypto' ? 'border-orange-500' : 'border-gray-500'
          }`}>
            {selectedPayment === 'crypto' && (
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold flex flex-wrap items-center gap-2 text-sm sm:text-base">
              <span>Cryptocurrency</span>
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">Bitcoin, Ethereum, USDC, Litecoin & more</p>
          </div>
          <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">₿</span>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Ξ</span>
            </div>
          </div>
        </label>
      </div>

      {/* PayPal Buttons Container */}
      {selectedPayment === 'paypal' && (
        <PayPalButton
          paypalLoaded={paypalLoaded}
          paypalError={paypalError}
          setPaypalError={setPaypalError}
          processing={processing}
          isFormValid={isFormValid}
          paypalButtonsRef={paypalButtonsRef}
          paypalButtonsRendered={paypalButtonsRendered}
          renderPayPalButtons={renderPayPalButtons}
        />
      )}

      {/* Crypto Payment Section */}
      {selectedPayment === 'crypto' && (
        <CryptoPayment
          isFormValid={isFormValid}
          cryptoLoading={cryptoLoading}
          cryptoError={cryptoError}
          setCryptoError={setCryptoError}
          handleCryptoPayment={handleCryptoPayment}
          total={total}
        />
      )}
    </div>
  )
}