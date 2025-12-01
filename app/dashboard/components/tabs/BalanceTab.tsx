'use client'

import { useState } from 'react'
import type { Withdrawal, Order } from '../../types'

interface BalanceTabProps {
  totalEarnings: number
  totalWithdrawn: number
  netRevenue: number
  completedOrders: Order[]
  withdrawals: Withdrawal[]
  setShowWithdrawalForm: (show: boolean) => void
}

export default function BalanceTab({
  totalEarnings,
  totalWithdrawn,
  netRevenue,
  completedOrders,
  withdrawals,
  setShowWithdrawalForm
}: BalanceTabProps) {
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const [copyToast, setCopyToast] = useState<string | null>(null)
  const withdrawalsPerPage = 5

  const totalWithdrawalsPages = Math.ceil(withdrawals.length / withdrawalsPerPage)
  const startWithdrawalsIndex = (withdrawalsPage - 1) * withdrawalsPerPage
  const endWithdrawalsIndex = startWithdrawalsIndex + withdrawalsPerPage
  const paginatedWithdrawals = withdrawals.slice(startWithdrawalsIndex, endWithdrawalsIndex)

  const goToWithdrawalsPage = (page: number) => {
    setWithdrawalsPage(page)
    document.getElementById('withdrawals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCopyReference = (refNum: string) => {
    navigator.clipboard.writeText(refNum)
    setCopyToast(refNum)
    setTimeout(() => setCopyToast(null), 2000)
  }

  return (
    <div id="balance-section">
      {/* Copy Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-slate-800/95 border border-green-500/30 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Copied!</p>
              <p className="text-gray-400 text-xs font-mono">{copyToast}</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <span className="text-purple-400">💰</span>
        Balance & Withdrawals
      </h2>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-gray-400 text-xs sm:text-sm">Total Earned</span>
            <span className="text-xl sm:text-2xl">💵</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">${totalEarnings.toFixed(2)}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">From {completedOrders.length} completed orders</div>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-gray-400 text-xs sm:text-sm">Withdrawn</span>
            <span className="text-xl sm:text-2xl">📤</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">${totalWithdrawn.toFixed(2)}</div>
          <div className="text-[10px] sm:text-xs text-gray-500">{withdrawals.filter(w => w.status === 'completed').length} completed withdrawals</div>
        </div>

        <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="text-green-400 text-xs sm:text-sm font-semibold">Available Balance</span>
            <span className="text-xl sm:text-2xl">💰</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
            ${netRevenue.toFixed(2)}
          </div>
          <button
            onClick={() => setShowWithdrawalForm(true)}
            disabled={netRevenue <= 0}
            className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 sm:py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          >
            Request Withdrawal
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      <div id="withdrawals-section">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <div className="text-center py-10 sm:py-12 bg-slate-800/30 rounded-xl border border-white/5">
            <div className="text-4xl sm:text-5xl mb-3">💸</div>
            <p className="text-gray-400 text-sm">No withdrawal history yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedWithdrawals.map((withdrawal: any) => (
                <div 
                  key={withdrawal.id} 
                  className={`bg-slate-800/50 border rounded-xl p-4 sm:p-5 hover:border-purple-500/20 transition-all ${
                    withdrawal.status === 'rejected' ? 'border-red-500/30' : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        withdrawal.status === 'rejected' 
                          ? 'bg-gradient-to-br from-red-500/20 to-rose-500/20' 
                          : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                      }`}>
                        <span className="text-xl sm:text-2xl">{withdrawal.method === 'bitcoin' ? '₿' : '💳'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-white font-semibold text-sm sm:text-base">${withdrawal.amount} via {withdrawal.method === 'bitcoin' ? 'Bitcoin' : 'Skrill'}</h4>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-400">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Net: ${withdrawal.net_amount} (Fee: ${withdrawal.fee_total?.toFixed(2) || '0.00'})</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                      <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                            withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason - Only shown for rejected withdrawals */}
                  {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-red-400 text-xs font-semibold mb-1">Rejection Reason</p>
                          <p className="text-red-300/80 text-xs sm:text-sm">{withdrawal.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Reference Number - displayed at bottom */}
                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-gray-500">Reference:</span>
                      <span className="text-xs sm:text-sm font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                        {withdrawal.reference_number || `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCopyReference(withdrawal.reference_number || `WD-${withdrawal.id.slice(0, 8).toUpperCase()}`)}
                      className="text-[10px] sm:text-xs text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-500/10"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      <span className="hidden sm:inline">Copy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination for Withdrawals */}
            {totalWithdrawalsPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                {/* Results info */}
                <div className="text-xs sm:text-sm text-gray-400">
                  Showing {startWithdrawalsIndex + 1}-{Math.min(endWithdrawalsIndex, withdrawals.length)} of {withdrawals.length} withdrawals
                </div>

                {/* Pagination controls */}
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                  <button
                    onClick={() => goToWithdrawalsPage(withdrawalsPage - 1)}
                    disabled={withdrawalsPage === 1}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Prev</span>
                  </button>

                  {/* Smart pagination with ellipsis */}
                  {(() => {
                    const pages: (number | string)[] = []
                    const showEllipsisStart = withdrawalsPage > 3
                    const showEllipsisEnd = withdrawalsPage < totalWithdrawalsPages - 2

                    // Always show first page
                    pages.push(1)

                    if (showEllipsisStart) {
                      pages.push('...')
                    }

                    // Show pages around current page
                    for (let i = Math.max(2, withdrawalsPage - 1); i <= Math.min(totalWithdrawalsPages - 1, withdrawalsPage + 1); i++) {
                      if (!pages.includes(i)) {
                        pages.push(i)
                      }
                    }

                    if (showEllipsisEnd) {
                      pages.push('...')
                    }

                    // Always show last page
                    if (totalWithdrawalsPages > 1 && !pages.includes(totalWithdrawalsPages)) {
                      pages.push(totalWithdrawalsPages)
                    }

                    return pages.map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500 text-sm">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => goToWithdrawalsPage(page as number)}
                          className={`min-w-[32px] sm:min-w-[40px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${withdrawalsPage === page
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                        >
                          {page}
                        </button>
                      )
                    ))
                  })()}

                  <button
                    onClick={() => goToWithdrawalsPage(withdrawalsPage + 1)}
                    disabled={withdrawalsPage === totalWithdrawalsPages}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}