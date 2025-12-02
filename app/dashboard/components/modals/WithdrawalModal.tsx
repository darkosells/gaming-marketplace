import type { WithdrawalFees, WithdrawalMethod } from '../../types'

// Withdrawal method configuration
const WITHDRAWAL_METHODS = [
  {
    id: 'bitcoin' as const,
    name: 'Bitcoin',
    icon: '₿',
    minAmount: 100,
    feePercentage: 6,
    flatFee: 20,
    addressLabel: 'Bitcoin Wallet Address',
    addressPlaceholder: 'Enter your Bitcoin wallet address',
    color: 'orange',
    note: 'Main BTC network'
  },
  {
    id: 'skrill' as const,
    name: 'Skrill',
    icon: '💳',
    minAmount: 10,
    feePercentage: 5,
    flatFee: 1,
    addressLabel: 'Skrill Email',
    addressPlaceholder: 'Enter your Skrill email address',
    color: 'purple',
    note: 'Sent in EUR'
  },
  {
    id: 'payoneer' as const,
    name: 'Payoneer',
    icon: '🅿️',
    minAmount: 20,
    feePercentage: 2,
    flatFee: 1.50,
    addressLabel: 'Payoneer Email',
    addressPlaceholder: 'Enter your Payoneer email address',
    color: 'red',
    note: 'Sent in USD'
  },
  {
    id: 'wise' as const,
    name: 'Wise',
    icon: '🌐',
    minAmount: 10,
    feePercentage: 1,
    flatFee: 0.50,
    addressLabel: 'Wise Email',
    addressPlaceholder: 'Enter your Wise email address',
    color: 'green',
    note: 'Low fees'
  }
]

interface WithdrawalModalProps {
  netRevenue: number
  withdrawalMethod: WithdrawalMethod
  setWithdrawalMethod: (method: WithdrawalMethod) => void
  withdrawalAmount: string
  setWithdrawalAmount: (amount: string) => void
  withdrawalAddress: string
  setWithdrawalAddress: (address: string) => void
  withdrawalProcessing: boolean
  calculateWithdrawalFees: (amount: number, method: Exclude<WithdrawalMethod, ''>) => WithdrawalFees
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
  // Get current method config
  const currentMethod = withdrawalMethod ? WITHDRAWAL_METHODS.find(m => m.id === withdrawalMethod) : null

  // Get color classes based on method
  const getColorClasses = (methodColor: string, isSelected: boolean) => {
    const colorMap: Record<string, { border: string, bg: string, borderHover: string }> = {
      orange: {
        border: isSelected ? 'border-orange-500' : 'border-white/10',
        bg: isSelected ? 'bg-orange-500/10' : 'bg-slate-800/50',
        borderHover: 'hover:border-orange-500/50'
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-white/10',
        bg: isSelected ? 'bg-purple-500/10' : 'bg-slate-800/50',
        borderHover: 'hover:border-purple-500/50'
      },
      red: {
        border: isSelected ? 'border-red-500' : 'border-white/10',
        bg: isSelected ? 'bg-red-500/10' : 'bg-slate-800/50',
        borderHover: 'hover:border-red-500/50'
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-white/10',
        bg: isSelected ? 'bg-green-500/10' : 'bg-slate-800/50',
        borderHover: 'hover:border-green-500/50'
      }
    }
    return colorMap[methodColor] || colorMap.purple
  }

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

        <div className="space-y-5">
          {/* Withdrawal Method Selection - 2x2 Grid */}
          <div>
            <label className="block text-white font-semibold mb-3 text-sm">Select Withdrawal Method</label>
            <div className="grid grid-cols-2 gap-3">
              {WITHDRAWAL_METHODS.map((method) => {
                const isSelected = withdrawalMethod === method.id
                const colors = getColorClasses(method.color, isSelected)
                
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      setWithdrawalMethod(method.id)
                      setWithdrawalAddress('') // Clear address when changing method
                    }}
                    className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${colors.border} ${colors.bg} ${!isSelected ? colors.borderHover : ''}`}
                  >
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{method.icon}</div>
                    <div className="text-white font-semibold text-sm sm:text-base">{method.name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      Min: ${method.minAmount} | Fee: {method.feePercentage}% + ${method.flatFee.toFixed(2)}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                      {method.note}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fee Comparison Table */}
          {!withdrawalMethod && (
            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
              <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                <span>📊</span> Fee Comparison
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                      <th className="text-left py-2 pr-2">Method</th>
                      <th className="text-right py-2 px-2">Min</th>
                      <th className="text-right py-2 px-2">Fee %</th>
                      <th className="text-right py-2 pl-2">Flat Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WITHDRAWAL_METHODS.map((method) => (
                      <tr key={method.id} className="text-gray-300 border-b border-white/5 last:border-0">
                        <td className="py-2 pr-2">
                          <span className="mr-1.5">{method.icon}</span>
                          {method.name}
                        </td>
                        <td className="text-right py-2 px-2">${method.minAmount}</td>
                        <td className="text-right py-2 px-2">{method.feePercentage}%</td>
                        <td className="text-right py-2 pl-2">${method.flatFee.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-500 text-[10px] sm:text-xs mt-3">
                💡 Tip: Wise has the lowest fees for most withdrawal amounts.
              </p>
            </div>
          )}

          {withdrawalMethod && currentMethod && (
            <>
              {/* Amount Input */}
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={currentMethod.minAmount}
                    max={netRevenue}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder={`Min: $${currentMethod.minAmount}`}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    Available: <span className="text-green-400 font-semibold">${netRevenue.toFixed(2)}</span>
                  </p>
                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => {
                          const amount = Math.max(currentMethod.minAmount, (netRevenue * percent / 100))
                          setWithdrawalAmount(Math.min(amount, netRevenue).toFixed(2))
                        }}
                        className="text-[10px] sm:text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 transition"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address/Email Input */}
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  {currentMethod.addressLabel}
                </label>
                <input
                  type={currentMethod.id === 'bitcoin' ? 'text' : 'email'}
                  value={withdrawalAddress}
                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                  placeholder={currentMethod.addressPlaceholder}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                />
                {currentMethod.id !== 'bitcoin' && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
                    Make sure this email is registered with your {currentMethod.name} account.
                  </p>
                )}
                {currentMethod.id === 'bitcoin' && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">
                    Only main Bitcoin network addresses are supported. Do not use Lightning or other networks.
                  </p>
                )}
              </div>

              {/* Fee Breakdown */}
              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
                    <span>💰</span> Fee Breakdown
                  </h4>
                  {(() => {
                    const amount = parseFloat(withdrawalAmount)
                    const fees = calculateWithdrawalFees(amount, withdrawalMethod)
                    const isValidAmount = amount >= currentMethod.minAmount
                    
                    return (
                      <div className="space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Withdrawal Amount:</span>
                          <span className="text-white font-medium">${amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>{currentMethod.feePercentage}% Fee:</span>
                          <span className="text-orange-400">-${fees.percentageFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Flat Fee:</span>
                          <span className="text-orange-400">-${fees.flatFee.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                          <span className="text-white">You Will Receive:</span>
                          <span className={fees.netAmount > 0 ? 'text-green-400' : 'text-red-400'}>
                            ${Math.max(0, fees.netAmount).toFixed(2)}
                          </span>
                        </div>
                        
                        {!isValidAmount && (
                          <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-yellow-400 text-xs">
                              ⚠️ Minimum amount for {currentMethod.name} is ${currentMethod.minAmount}
                            </p>
                          </div>
                        )}
                        
                        {fees.netAmount <= 0 && isValidAmount && (
                          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-xs">
                              ⚠️ Amount too low after fees. Please increase the withdrawal amount.
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Method-specific info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{currentMethod.icon}</span>
                  <div className="text-xs sm:text-sm">
                    <p className="text-white font-medium mb-1">{currentMethod.name} Withdrawal</p>
                    <p className="text-gray-400">
                      {currentMethod.id === 'bitcoin' && 'Withdrawals are processed within 24-48 hours. You will receive BTC at the current exchange rate.'}
                      {currentMethod.id === 'skrill' && 'Funds will be sent in EUR to your Skrill account within 1-2 business days.'}
                      {currentMethod.id === 'payoneer' && 'Funds will be sent in USD to your Payoneer account within 1-2 business days.'}
                      {currentMethod.id === 'wise' && 'Funds will be sent in USD to your Wise account, typically within 1 business day.'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
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