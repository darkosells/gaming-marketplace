'use client'

import Link from 'next/link'
import { AdminOrder, ITEMS_PER_PAGE } from '../../types'

interface DisputesTabProps {
  activeDisputes: AdminOrder[]
  solvedDisputes: AdminOrder[]
  disputeSubTab: 'active' | 'solved'
  setDisputeSubTab: (tab: 'active' | 'solved') => void
  currentPage: number
  isExporting: boolean
  canExportData: boolean
  onResolveDispute: (id: string, resolution: 'buyer' | 'seller') => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode
}

export default function DisputesTab({
  activeDisputes,
  solvedDisputes,
  disputeSubTab,
  setDisputeSubTab,
  currentPage,
  isExporting,
  canExportData,
  onResolveDispute,
  onExportCSV,
  renderPagination
}: DisputesTabProps) {
  const currentActiveDisputes = activeDisputes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const currentSolvedDisputes = solvedDisputes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setDisputeSubTab('active')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            disputeSubTab === 'active'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          Active ({activeDisputes.length})
        </button>
        <button
          onClick={() => setDisputeSubTab('solved')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            disputeSubTab === 'solved'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          Solved ({solvedDisputes.length})
        </button>
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

      {disputeSubTab === 'active' && (
        <div className="space-y-4">
          {currentActiveDisputes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-400">No active disputes</p>
            </div>
          ) : (
            currentActiveDisputes.map((o) => (
              <div key={o.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-bold text-lg">
                        {o.listing_title || 'Unknown Listing'}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs bg-red-500/30 text-red-300 border border-red-500/40">
                        DISPUTE
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Order ID</p>
                        <p className="text-white font-mono text-sm">{o.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Buyer</p>
                        <p className="text-blue-400 font-semibold">{o.buyer?.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Seller</p>
                        <p className="text-green-400 font-semibold">{o.seller?.username}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="text-white font-bold">${o.amount}</p>
                      </div>
                    </div>
                    {o.dispute_reason && (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
                        <p className="text-xs text-red-400 font-semibold mb-1">Dispute Reason:</p>
                        <p className="text-white text-sm">{o.dispute_reason}</p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Opened:{' '}
                      {o.dispute_opened_at
                        ? new Date(o.dispute_opened_at).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-gray-400 mb-3 font-semibold">ADMIN ACTIONS</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Link
                      href={`/admin/disputes/${o.id}/chat`}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition border border-orange-500/30 font-semibold"
                    >
                      💬 Open Dispute Chat
                    </Link>
                    <button
                      onClick={() => onResolveDispute(o.id, 'buyer')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30 font-semibold"
                    >
                      💰 Refund Buyer
                    </button>
                    <button
                      onClick={() => onResolveDispute(o.id, 'seller')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30 font-semibold"
                    >
                      ✓ Complete for Seller
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          {renderPagination(activeDisputes)}
        </div>
      )}

      {disputeSubTab === 'solved' && (
        <div className="space-y-4">
          {currentSolvedDisputes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400">No solved disputes yet</p>
            </div>
          ) : (
            currentSolvedDisputes.map((o) => (
              <div
                key={o.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between hover:bg-white/10 transition"
              >
                <div>
                  <h3 className="text-white font-bold">{o.listing_title}</h3>
                  <p className="text-gray-400 text-sm">
                    {o.buyer?.username} ↔ {o.seller?.username} | ${o.amount}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        o.status === 'refunded'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}
                    >
                      {o.status}
                    </span>
                    {o.resolution_notes && (
                      <span className="text-xs text-gray-500">
                        Notes: {o.resolution_notes.slice(0, 50)}...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved: {o.completed_at ? new Date(o.completed_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <Link
                  href={`/admin/disputes/${o.id}/chat`}
                  className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition border border-gray-500/30 h-fit"
                >
                  View Chat
                </Link>
              </div>
            ))
          )}
          {renderPagination(solvedDisputes)}
        </div>
      )}
    </div>
  )
}