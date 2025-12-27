// app/checkout/components/CryptoPayment.tsx - Cryptocurrency payment component

'use client'

interface CryptoPaymentProps {
  isFormValid: boolean
  cryptoLoading: boolean
  cryptoError: string | null
  setCryptoError: (error: string | null) => void
  handleCryptoPayment: () => Promise<void>
  total: number
}

export default function CryptoPayment({
  isFormValid,
  cryptoLoading,
  cryptoError,
  setCryptoError,
  handleCryptoPayment,
  total
}: CryptoPaymentProps) {
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

      {cryptoError ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">❌</span>
            <div className="flex-1">
              <p className="text-red-400 font-semibold mb-1">Payment Failed</p>
              <p className="text-red-300 text-sm">{cryptoError}</p>
              <button
                onClick={() => setCryptoError(null)}
                className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-medium transition-colors"
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      ) : cryptoLoading ? (
        <div className="p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-400/30 border-t-orange-400 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-orange-400 font-semibold text-lg">Preparing Crypto Checkout...</p>
              <p className="text-gray-400 text-sm mt-1">You'll be redirected to NOWPayments</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl mb-4">
            <p className="text-orange-300 text-xs sm:text-sm flex items-start gap-2">
              <span className="text-lg flex-shrink-0">₿</span>
              <span>
                <span className="font-semibold">Pay with Cryptocurrency:</span> Click the button below to pay with Bitcoin, Ethereum, USDC, or 150+ other cryptocurrencies via NOWPayments.
              </span>
            </p>
          </div>

          {/* Supported Cryptocurrencies */}
          <div className="bg-slate-800 rounded-xl p-4 sm:p-6 mb-4">
            <p className="text-gray-400 text-xs mb-3 text-center">Supported Cryptocurrencies</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <span className="text-orange-400 font-bold">₿</span>
                <span className="text-white text-sm">Bitcoin</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <span className="text-blue-400 font-bold">Ξ</span>
                <span className="text-white text-sm">Ethereum</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-400/10 rounded-lg border border-blue-400/30">
                <span className="text-blue-300 font-bold">$</span>
                <span className="text-white text-sm">USDC</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-500/10 rounded-lg border border-gray-500/30">
                <span className="text-gray-300 font-bold">Ł</span>
                <span className="text-white text-sm">Litecoin</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handleCryptoPayment}
            disabled={!isFormValid || cryptoLoading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3 ${
              isFormValid
                ? 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white'
                : 'bg-slate-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="text-xl">₿</span>
            <span>Pay ${total.toFixed(2)} with Crypto</span>
          </button>

          <p className="text-center text-gray-500 text-xs mt-3">
            🔒 Secured by NOWPayments • 150+ cryptocurrencies
          </p>

          {/* How it works */}
          <div className="mt-4 p-3 bg-slate-800/50 rounded-xl">
            <p className="text-gray-400 text-xs mb-2 font-semibold">How it works:</p>
            <ol className="text-gray-500 text-xs space-y-1">
              <li className="flex items-start gap-2">
                <span className="text-orange-400">1.</span>
                <span>Click the button to open NOWPayments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">2.</span>
                <span>Choose your cryptocurrency and send payment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400">3.</span>
                <span>Once confirmed, you'll receive your order</span>
              </li>
            </ol>
          </div>
        </>
      )}
    </div>
  )
}