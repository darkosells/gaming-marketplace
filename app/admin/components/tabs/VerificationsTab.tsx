'use client'

import React from 'react'
import { AdminVerification, ITEMS_PER_PAGE } from '../../types'

interface VerificationsTabProps {
  pendingVerifications: AdminVerification[]
  pastVerifications: AdminVerification[]
  verificationSubTab: 'pending' | 'past'
  setVerificationSubTab: (tab: 'pending' | 'past') => void
  currentPage: number
  onViewDetails: (verification: AdminVerification) => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function VerificationsTab({
  pendingVerifications,
  pastVerifications,
  verificationSubTab,
  setVerificationSubTab,
  currentPage,
  onViewDetails,
  renderPagination
}: VerificationsTabProps) {
  const currentPendingVerifications = pendingVerifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const currentPastVerifications = pastVerifications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setVerificationSubTab('pending')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            verificationSubTab === 'pending'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          Pending ({pendingVerifications.length})
        </button>
        <button
          onClick={() => setVerificationSubTab('past')}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            verificationSubTab === 'past'
              ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
          }`}
        >
          Past ({pastVerifications.length})
        </button>
      </div>

      {/* Pending Verifications */}
      {verificationSubTab === 'pending' && (
        <div className="space-y-4">
          {currentPendingVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-gray-400">No pending verifications</p>
            </div>
          ) : (
            currentPendingVerifications.map((v) => (
              <div
                key={v.id}
                className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-3xl border border-white/10 flex-shrink-0">
                  🔍
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-bold">{v.full_name}</h3>
                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      PENDING
                    </span>
                    {v.resubmission_count && v.resubmission_count > 0 && (
                      <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        🔄 RESUBMISSION #{v.resubmission_count}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">
                    Username: <span className="text-purple-400 font-semibold">{v.user?.username}</span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    {v.city}, {v.country} | ID: {v.id_type?.replace('_', ' ')}
                  </p>
                  {v.resubmission_count && v.resubmission_count > 0 && (
                    <p className="text-orange-400 text-xs mt-1">
                      ⚠️ This is a resubmission - check previous rejection
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-2">
                    Submitted: {new Date(v.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => onViewDetails(v)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition flex-shrink-0"
                >
                  🔎 Review
                </button>
              </div>
            ))
          )}
          {renderPagination(pendingVerifications)}
        </div>
      )}

      {/* Past Verifications */}
      {verificationSubTab === 'past' && (
        <div className="space-y-4">
          {currentPastVerifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400">No past verifications</p>
            </div>
          ) : (
            currentPastVerifications.map((v) => (
              <div
                key={v.id}
                className={`border rounded-xl p-4 ${
                  v.status === 'approved'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {v.status === 'approved' ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-bold">{v.full_name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          v.status === 'approved'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {v.status?.toUpperCase()}
                      </span>
                      {v.rejection_type === 'resubmission_required' && (
                        <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          CAN RESUBMIT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">
                      Username: <span className="text-purple-400">{v.user?.username}</span>
                      {' | '}
                      Reviewed by: <span className="text-blue-400">{v.reviewer?.username || 'Unknown'}</span>
                    </p>
                    <p className="text-gray-400 text-sm">
                      {v.city}, {v.country}
                    </p>
                    {v.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2">
                        <p className="text-red-400 text-xs">
                          <span className="font-semibold">Reason:</span> {v.rejection_reason}
                        </p>
                      </div>
                    )}
                    {v.admin_notes && (
                      <div className="bg-white/5 border border-white/10 rounded p-2 mt-2">
                        <p className="text-gray-400 text-xs">
                          <span className="font-semibold">Admin Notes:</span> {v.admin_notes}
                        </p>
                      </div>
                    )}
                    <p className="text-gray-500 text-xs mt-2">
                      Reviewed: {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          {renderPagination(pastVerifications)}
        </div>
      )}
    </div>
  )
}