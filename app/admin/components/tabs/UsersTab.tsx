'use client'

import React, { useState } from 'react'
import { AdminUser, ITEMS_PER_PAGE } from '../../types'
import UserDetailsModal from '@/components/UserDetailsModal'
import MaskedText, { RevealAllButton } from '@/components/MaskedText'

interface UsersTabProps {
  users: AdminUser[]
  filteredUsers: AdminUser[]
  currentPage: number
  selectedItems: string[]
  isExporting: boolean
  canExportData: boolean
  currentAdminId: string
  onSelectItem: (id: string) => void
  onSelectAll: (items: any[]) => void
  onBanUser: (id: string, isBanned: boolean) => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function UsersTab({
  users,
  filteredUsers,
  currentPage,
  selectedItems,
  isExporting,
  canExportData,
  currentAdminId,
  onSelectItem,
  onSelectAll,
  onBanUser,
  onExportCSV,
  renderPagination
}: UsersTabProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all')
  
  // NEW: Global reveal state for all sensitive data
  const [revealAllSensitive, setRevealAllSensitive] = useState(false)

  // Apply risk filter
  const riskFilteredUsers = riskFilter === 'all' 
    ? filteredUsers 
    : filteredUsers.filter(u => (u as any).risk_level === riskFilter)

  const currentUsers = riskFilteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getRiskBadge = (user: AdminUser) => {
    const riskLevel = (user as any).risk_level || 'low'
    const riskScore = (user as any).risk_score || 0
    
    const styles: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/50',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      low: 'bg-green-500/20 text-green-400 border-green-500/50'
    }

    if (riskScore === 0 && riskLevel === 'low') return null

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${styles[riskLevel] || styles.low}`}>
        Risk: {riskScore}
      </span>
    )
  }

  const getIndicatorBadges = (user: AdminUser) => {
    const badges: React.ReactNode[] = []
    const u = user as any

    if (u.is_high_risk) {
      badges.push(
        <span key="high-risk" className="px-2 py-0.5 rounded text-xs bg-red-500/30 text-red-300 border border-red-500/50">
          ⚠️ High Risk
        </span>
      )
    }

    if (u.fraud_flags_count > 0) {
      badges.push(
        <span key="flags" className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
          🚩 {u.fraud_flags_count} flag{u.fraud_flags_count > 1 ? 's' : ''}
        </span>
      )
    }

    return badges
  }

  // Count users by risk level
  const riskCounts = {
    all: filteredUsers.length,
    low: filteredUsers.filter(u => !(u as any).risk_level || (u as any).risk_level === 'low').length,
    medium: filteredUsers.filter(u => (u as any).risk_level === 'medium').length,
    high: filteredUsers.filter(u => (u as any).risk_level === 'high').length,
    critical: filteredUsers.filter(u => (u as any).risk_level === 'critical').length
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">All Users ({riskFilteredUsers.length})</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Risk Filter Pills */}
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
            {(['all', 'low', 'medium', 'high', 'critical'] as const).map(level => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                  riskFilter === level
                    ? level === 'all' ? 'bg-purple-500 text-white' :
                      level === 'critical' ? 'bg-red-500 text-white' :
                      level === 'high' ? 'bg-orange-500 text-white' :
                      level === 'medium' ? 'bg-yellow-500 text-black' :
                      'bg-green-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
                {riskCounts[level] > 0 && (
                  <span className="ml-1 opacity-80">({riskCounts[level]})</span>
                )}
              </button>
            ))}
          </div>

          {/* NEW: Reveal All Button */}
          <RevealAllButton
            isRevealed={revealAllSensitive}
            onToggle={() => setRevealAllSensitive(!revealAllSensitive)}
          />

          {canExportData && (
            <button
              onClick={onExportCSV}
              disabled={isExporting}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30 flex items-center gap-2"
            >
              <span>📥</span>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            onClick={() => onSelectAll(riskFilteredUsers)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
          >
            {selectedItems.length === riskFilteredUsers.length ? '✓ Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* Sensitive Data Notice */}
      <div className="bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 mb-4 flex items-center gap-2 text-sm">
        <span className="text-purple-400">🔒</span>
        <span className="text-gray-400">
          Sensitive data (emails, IPs) is masked for security. Click to reveal individual items or use "Reveal All" button.
        </span>
      </div>

      {/* Risk Summary Cards */}
      {(riskCounts.high > 0 || riskCounts.critical > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            <div className="text-red-400 text-xs font-semibold">Critical Risk</div>
            <div className="text-2xl font-bold text-red-400">{riskCounts.critical}</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
            <div className="text-orange-400 text-xs font-semibold">High Risk</div>
            <div className="text-2xl font-bold text-orange-400">{riskCounts.high}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
            <div className="text-yellow-400 text-xs font-semibold">Medium Risk</div>
            <div className="text-2xl font-bold text-yellow-400">{riskCounts.medium}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="text-green-400 text-xs font-semibold">Low Risk</div>
            <div className="text-2xl font-bold text-green-400">{riskCounts.low}</div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {currentUsers.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 rounded-xl">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-400">No users found with this filter</p>
          </div>
        ) : (
          currentUsers.map((u) => {
            const riskLevel = (u as any).risk_level || 'low'
            const borderColor = 
              riskLevel === 'critical' ? 'border-red-500/50' :
              riskLevel === 'high' ? 'border-orange-500/30' :
              riskLevel === 'medium' ? 'border-yellow-500/30' :
              'border-white/10'

            return (
              <div
                key={u.id}
                className={`bg-white/5 border ${borderColor} rounded-xl p-4 hover:bg-white/10 transition`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Checkbox + User Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(u.id)}
                      onChange={() => onSelectItem(u.id)}
                      disabled={u.is_admin}
                      className="w-5 h-5 rounded mt-1 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {/* Username + Role Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-semibold">{u.username}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            u.is_admin
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : u.role === 'vendor'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {u.is_admin ? 'ADMIN' : u.role}
                        </span>
                        {u.admin_level === 'super_admin' && (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            SUPER ADMIN
                          </span>
                        )}
                        {u.verified && (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            ✓ Verified
                          </span>
                        )}
                        {u.is_banned && (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                            BANNED
                          </span>
                        )}
                      </div>

                      {/* Risk + Fraud Badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {getRiskBadge(u)}
                        {getIndicatorBadges(u)}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                        <span>⭐ {u.rating?.toFixed(1) || '0.0'}</span>
                        <span>💰 {u.total_sales || 0} sales</span>
                        <span>📅 {new Date(u.created_at).toLocaleDateString()}</span>
                        
                        {/* MASKED: Last IP */}
                        {(u as any).last_ip && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-500">🌐</span>
                            {revealAllSensitive ? (
                              <span className="font-mono text-xs text-gray-400">{(u as any).last_ip}</span>
                            ) : (
                              <MaskedText 
                                text={(u as any).last_ip} 
                                type="generic" 
                                size="sm"
                                autoHideSeconds={30}
                              />
                            )}
                          </span>
                        )}
                      </div>

                      {/* MASKED: Email */}
                      <div className="mt-2">
                        {u.email && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-xs">📧</span>
                            {revealAllSensitive ? (
                              <span className="text-xs text-gray-400">{u.email}</span>
                            ) : (
                              <MaskedText 
                                text={u.email} 
                                type="email" 
                                size="sm"
                                autoHideSeconds={30}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* View Details Button */}
                    <button
                      onClick={() => setSelectedUserId(u.id)}
                      className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30 text-sm font-semibold"
                    >
                      👁️ Details
                    </button>

                    {/* Ban/Unban Button */}
                    {!u.is_admin && (
                      <button
                        onClick={() => onBanUser(u.id, u.is_banned)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                          u.is_banned
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                        }`}
                      >
                        {u.is_banned ? '✓ Unban' : '🚫 Ban'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {renderPagination(riskFilteredUsers)}

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={!!selectedUserId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onBanUser={(id) => {
          onBanUser(id, false)
          setSelectedUserId(null)
        }}
        onUnbanUser={(id) => {
          onBanUser(id, true)
          setSelectedUserId(null)
        }}
        currentAdminId={currentAdminId}
      />
    </div>
  )
}