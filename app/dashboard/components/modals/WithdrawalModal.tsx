import type { WithdrawalFees } from '../../types'

interface WithdrawalModalProps {
  netRevenue: number
  withdrawalMethod: 'bitcoin' | 'skrill' | ''
  setWithdrawalMethod: (method: 'bitcoin' | 'skrill' | '') => void
  withdrawalAmount: string
  setWithdrawalAmount: (amount: string) => void
  withdrawalAddress: string
  setWithdrawalAddress: (address: string) => void
  withdrawalProcessing: boolean
  calculateWithdrawalFees: (amount: number, method: 'bitcoin' | 'skrill') => WithdrawalFees
  handleWithdrawalSubmit: () => Promise<void>
  onClose: () => void
}

export default function WithdrawalModal({
  netRevenue,
  withdrawalMethod,
  setWithdrawalMethod,
  withdrawalAmount,
  setWithdrawalAmount,
  withdrawalAddress,
  setWithdrawalAddress,
  withdrawalProcessing,
  calculateWithdrawalFees,
  handleWithdrawalSubmit,
  onClose
}: WithdrawalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white">Request Withdrawal</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWithdrawalMethod('bitcoin')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${withdrawalMethod === 'bitcoin'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-white/10 bg-slate-800/50 hover:border-orange-500/50'
                  }`}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">₿</div>
                <div className="text-white font-semibold text-sm sm:text-base">Bitcoin</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Min: $100 | Fee: 6% + $20</div>
              </button>
              <button
                onClick={() => setWithdrawalMethod('skrill')}
                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${withdrawalMethod === 'skrill'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-slate-800/50 hover:border-purple-500/50'
                  }`}
              >
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💳</div>
                <div className="text-white font-semibold text-sm sm:text-base">Skrill</div>
                <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Min: $10 | Fee: 5% + $1</div>
              </button>
            </div>
          </div>

          {withdrawalMethod && (
            <>
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min={withdrawalMethod === 'bitcoin' ? 100 : 10}
                  max={netRevenue}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder={`Min: $${withdrawalMethod === 'bitcoin' ? '100' : '10'} | Available: $${netRevenue.toFixed(2)}`}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  {withdrawalMethod === 'bitcoin' ? 'Bitcoin Wallet Address' : 'Skrill Email'}
                </label>
                <input
                  type="text"
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  placeholder={withdrawalMethod === 'bitcoin' ? 'Enter your Bitcoin wallet address' : 'Enter your Skrill email'}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                />
              </div>

              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3 text-sm">Fee Breakdown</h4>
                  {(() => {
                    const fees = calculateWithdrawalFees(parseFloat(withdrawalAmount), withdrawalMethod)
                    return (
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Withdrawal Amount:</span>
                          <span className="text-white">${parseFloat(withdrawalAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>{withdrawalMethod === 'bitcoin' ? '6%' : '5%'} Fee:</span>
                          <span className="text-orange-400">-${fees.percentageFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Flat Fee:</span>
                          <span className="text-orange-400">-${fees.flatFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                          <span className="text-white">You Will Receive:</span>
                          <span className="text-green-400">${fees.netAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdrawalSubmit}
              disabled={withdrawalProcessing || !withdrawalMethod || !withdrawalAmount || !withdrawalAddress}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {withdrawalProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}