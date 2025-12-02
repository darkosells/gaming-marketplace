'use client'

import React, { useState } from 'react'
import { AdminWithdrawal, ITEMS_PER_PAGE } from '../../types'
import MaskedText, { RevealAllButton } from '@/components/MaskedText'

interface WithdrawalsTabProps {
  pendingWithdrawals: AdminWithdrawal[]
  processedWithdrawals: AdminWithdrawal[]
  withdrawalSubTab: 'pending' | 'processed'
  setWithdrawalSubTab: (tab: 'pending' | 'processed') => void
  currentPage: number
  isExporting: boolean
  canExportData: boolean
  onApproveWithdrawal: (id: string) => void
  onRejectWithdrawal: (id: string) => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function WithdrawalsTab({
  pendingWithdrawals,
  processedWithdrawals,
  withdrawalSubTab,
  setWithdrawalSubTab,
  currentPage,
  isExporting,
  canExportData,
  onApproveWithdrawal,
  onRejectWithdrawal,
  onExportCSV,
  renderPagination
}: WithdrawalsTabProps) {
  // NEW: Global reveal state for all sensitive data
  const [revealAllSensitive, setRevealAllSensitive] = useState(false)

  const currentPendingWithdrawals = pendingWithdrawals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const currentProcessedWithdrawals = processedWithdrawals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setWithdrawalSubTab('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            withdrawalSubTab === 'pending'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          Pending ({pendingWithdrawals.length})
        </button>
        <button
          onClick={() => setWithdrawalSubTab('processed')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            withdrawalSubTab === 'processed'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
          }`}
        >
          Processed ({processedWithdrawals.length})
        </button>

        {/* NEW: Reveal All Button */}
        <RevealAllButton
          isRevealed={revealAllSensitive}
          onToggle={() => setRevealAllSensitive(!revealAllSensitive)}
        />

        {canExportData && (
          <button
            onClick={onExportCSV}
            disabled={isExporting}
            className="ml-auto px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30 flex items-center gap-2"
          >
            <span>📥</span>
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        )}
      </div>

      {/* Sensitive Data Notice */}
      <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-sm">
        <span className="text-purple-400">🔒</span>
        <span className="text-gray-400">
          Payment addresses and transaction IDs are masked for security. Click to reveal individual items or use "Reveal All" button.
        </span>
      </div>

      {/* Pending Withdrawals */}
      {withdrawalSubTab === 'pending' && (
        <div className="space-y-4">
          {currentPendingWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-400">No pending withdrawals</p>
            </div>
          ) : (
            currentPendingWithdrawals.map((w) => (
              <div
                key={w.id}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">
                        {w.method === 'bitcoin' ? '₿' : '💳'}
                      </span>
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {w.method === 'bitcoin' ? 'Bitcoin Withdrawal' : 'Skrill Withdrawal'}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          User: <span className="text-purple-400 font-semibold">{w.user?.username}</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Gross Amount</p>
                        <p className="text-white font-semibold">${parseFloat(w.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fee</p>
                        <p className="text-red-400 font-semibold">-${parseFloat(w.fee).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Net Amount</p>
                        <p className="text-green-400 font-bold text-xl">${parseFloat(w.net_amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Requested</p>
                        <p className="text-white text-sm">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* MASKED: Payment Address */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-2">
                        {w.method === 'bitcoin' ? '₿ Bitcoin Address' : '📧 Skrill Email'}
                      </p>
                      {revealAllSensitive ? (
                        <p className="text-white font-mono text-sm break-all">{w.address}</p>
                      ) : (
                        <MaskedText 
                          text={w.address} 
                          type={w.method === 'bitcoin' ? 'address' : 'email'} 
                          size="md"
                          autoHideSeconds={60}
                          showCopyButton={true}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => onApproveWithdrawal(w.id)}
                      className="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition border border-green-500/30"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => onRejectWithdrawal(w.id)}
                      className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg font-semibold hover:bg-red-500/30 transition border border-red-500/30"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {renderPagination(pendingWithdrawals)}
        </div>
      )}

      {/* Processed Withdrawals */}
      {withdrawalSubTab === 'processed' && (
        <div className="space-y-4">
          {currentProcessedWithdrawals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400">No processed withdrawals</p>
            </div>
          ) : (
            currentProcessedWithdrawals.map((w) => (
              <div
                key={w.id}
                className={`border rounded-xl p-4 ${
                  w.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl">
                      {w.method === 'bitcoin' ? '₿' : '💳'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-white font-bold">{w.user?.username}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            w.status === 'completed'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {w.status?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {w.method === 'bitcoin' ? 'Bitcoin' : 'Skrill'} •{' '}
                        <span className="text-white font-semibold">
                          ${parseFloat(w.net_amount).toFixed(2)}
                        </span>
                      </p>

                      {/* MASKED: Transaction ID */}
                      {w.transaction_id && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">TX:</span>
                          {revealAllSensitive ? (
                            <span className="font-mono text-xs text-gray-400">{w.transaction_id}</span>
                          ) : (
                            <MaskedText 
                              text={w.transaction_id} 
                              type="generic" 
                              size="sm"
                              autoHideSeconds={30}
                              showCopyButton={true}
                            />
                          )}
                        </div>
                      )}

                      {/* MASKED: Payment Address (in processed view) */}
                      {w.address && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {w.method === 'bitcoin' ? '₿' : '📧'}
                          </span>
                          {revealAllSensitive ? (
                            <span className="font-mono text-xs text-gray-400 break-all">{w.address}</span>
                          ) : (
                            <MaskedText 
                              text={w.address} 
                              type={w.method === 'bitcoin' ? 'address' : 'email'} 
                              size="sm"
                              autoHideSeconds={30}
                            />
                          )}
                        </div>
                      )}

                      {w.admin_notes && (
                        <p className="text-xs text-gray-400 mt-2 bg-white/5 rounded px-2 py-1">
                          📝 Notes: {w.admin_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-500">
                      Processed: {w.processed_at ? new Date(w.processed_at).toLocaleString() : 'N/A'}
                    </p>
                    {w.processor && (
                      <p className="text-xs text-gray-500">
                        By: <span className="text-purple-400">{w.processor.username}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {renderPagination(processedWithdrawals)}
        </div>
      )}
    </div>
  )
}