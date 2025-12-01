// components/UserDetailsModal.tsx - Comprehensive User Intelligence View

'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface UserIntelligence {
  profile: any
  metadata: any
  recentSessions: any[]
  relatedAccounts: any[]
  fraudFlags: any[]
  orderStats: {
    total: number
    completed: number
    disputed: number
    asVendor: number
    asBuyer: number
  }
}

interface UserDetailsModalProps {
  isOpen: boolean
  userId: string | null
  onClose: () => void
  onBanUser?: (userId: string) => void
  onUnbanUser?: (userId: string) => void
  currentAdminId: string
}

export default function UserDetailsModal({
  isOpen,
  userId,
  onClose,
  onBanUser,
  onUnbanUser,
  currentAdminId
}: UserDetailsModalProps) {
  const [loading, setLoading] = useState(true)
  const [intel, setIntel] = useState<UserIntelligence | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'related' | 'flags' | 'notes'>('overview')
  const [adminNotes, setAdminNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && userId) {
      loadUserIntelligence()
    }
  }, [isOpen, userId])

  const loadUserIntelligence = async () => {
    if (!userId) return
    setLoading(true)

    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Fetch metadata
      const { data: metadata } = await supabase
        .from('user_metadata')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Fetch recent sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Fetch related accounts
      const { data: related } = await supabase
        .from('related_accounts')
        .select(`
          *,
          related_user:profiles!related_user_id (
            username,
            email,
            created_at,
            is_banned
          )
        `)
        .eq('user_id', userId)

      // Fetch fraud flags
      const { data: flags } = await supabase
        .from('fraud_flags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, buyer_id, seller_id')
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

      const orderStats = {
        total: orders?.length || 0,
        completed: orders?.filter(o => o.status === 'completed').length || 0,
        disputed: orders?.filter(o => o.status === 'dispute_raised').length || 0,
        asVendor: orders?.filter(o => o.seller_id === userId).length || 0,
        asBuyer: orders?.filter(o => o.buyer_id === userId).length || 0
      }

      setIntel({
        profile,
        metadata,
        recentSessions: sessions || [],
        relatedAccounts: related || [],
        fraudFlags: flags || [],
        orderStats
      })

      setAdminNotes(metadata?.admin_notes || '')
    } catch (error) {
      console.error('Error loading user intelligence:', error)
    }

    setLoading(false)
  }

  const handleSaveNotes = async () => {
    if (!userId) return
    setSavingNotes(true)

    try {
      await supabase
        .from('user_metadata')
        .upsert({
          user_id: userId,
          admin_notes: adminNotes,
          admin_notes_updated_by: currentAdminId,
          admin_notes_updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
    } catch (error) {
      console.error('Error saving notes:', error)
    }

    setSavingNotes(false)
  }

  const calculateRiskScore = (): { score: number; level: string; factors: { factor: string; impact: number }[] } => {
    if (!intel?.metadata) return { score: 0, level: 'low', factors: [] }
    
    const factors: { factor: string; impact: number }[] = []
    let score = 0
    const m = intel.metadata

    if (m.is_disposable_email) {
      factors.push({ factor: 'Disposable email', impact: 30 })
      score += 30
    }
    if (m.has_vpn_usage) {
      factors.push({ factor: 'VPN detected', impact: 10 })
      score += 10
    }
    if (m.has_multiple_accounts_same_ip) {
      factors.push({ factor: 'Multiple accounts (same IP)', impact: 30 })
      score += 30
    }
    if (m.has_multiple_accounts_same_device) {
      factors.push({ factor: 'Multiple accounts (same device)', impact: 40 })
      score += 40
    }
    if ((m.unique_ips_count || 0) > 10) {
      factors.push({ factor: `Many IPs (${m.unique_ips_count})`, impact: 15 })
      score += 15
    }
    if ((m.unique_countries_count || 0) > 3) {
      factors.push({ factor: `Many countries (${m.unique_countries_count})`, impact: 25 })
      score += 25
    }
    if (intel.orderStats.total >= 3) {
      const ratio = intel.orderStats.disputed / intel.orderStats.total
      if (ratio > 0.3) {
        factors.push({ factor: `High disputes (${(ratio * 100).toFixed(0)}%)`, impact: 35 })
        score += 35
      }
    }
    const activeFlags = intel.fraudFlags.filter(f => f.status === 'active').length
    if (activeFlags > 0) {
      factors.push({ factor: `${activeFlags} fraud flag(s)`, impact: activeFlags * 15 })
      score += activeFlags * 15
    }

    let level = 'low'
    if (score >= 70) level = 'critical'
    else if (score >= 50) level = 'high'
    else if (score >= 25) level = 'medium'

    return { score, level, factors }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50'
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50'
      default: return 'text-green-400 bg-green-500/20 border-green-500/50'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

  const formatRelativeTime = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (!isOpen) return null

  const risk = calculateRiskScore()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {intel?.profile?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{intel?.profile?.username || 'Loading...'}</h2>
              <p className="text-gray-400">{intel?.profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getRiskColor(risk.level)}`}>
                  Risk: {risk.level.toUpperCase()} ({risk.score})
                </span>
                {intel?.profile?.is_banned && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50">
                    BANNED
                  </span>
                )}
                {intel?.profile?.verified && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/50">
                    VERIFIED
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'sessions', label: `🌐 Sessions (${intel?.recentSessions?.length || 0})` },
            { id: 'related', label: `👥 Related (${intel?.relatedAccounts?.length || 0})` },
            { id: 'flags', label: `🚨 Flags (${intel?.fraudFlags?.length || 0})` },
            { id: 'notes', label: '📝 Notes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm">Total Orders</div>
                      <div className="text-2xl font-bold text-white">{intel?.orderStats.total || 0}</div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm">Completed</div>
                      <div className="text-2xl font-bold text-green-400">{intel?.orderStats.completed || 0}</div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm">Disputes</div>
                      <div className="text-2xl font-bold text-red-400">{intel?.orderStats.disputed || 0}</div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <div className="text-gray-400 text-sm">Member Since</div>
                      <div className="text-lg font-bold text-white">
                        {intel?.profile?.created_at 
                          ? new Date(intel.profile.created_at).toLocaleDateString() 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {risk.factors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                      <h3 className="text-red-400 font-bold mb-3">⚠️ Risk Factors</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {risk.factors.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2">
                            <span className="text-white text-sm">{f.factor}</span>
                            <span className="text-red-400 text-xs font-bold">+{f.impact}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Details */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Signup Info */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-bold mb-3">📝 Signup Info</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">IP Address</span>
                          <span className="text-white font-mono">{intel?.metadata?.signup_ip || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location</span>
                          <span className="text-white">
                            {intel?.metadata?.signup_city && intel?.metadata?.signup_country 
                              ? `${intel.metadata.signup_city}, ${intel.metadata.signup_country}`
                              : intel?.metadata?.signup_country || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Referrer</span>
                          <span className="text-white truncate max-w-[200px]">
                            {intel?.metadata?.signup_referrer || 'Direct'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email Domain</span>
                          <span className={`font-mono ${intel?.metadata?.is_disposable_email ? 'text-red-400' : 'text-white'}`}>
                            {intel?.metadata?.email_domain || 'N/A'}
                            {intel?.metadata?.is_disposable_email && ' ⚠️'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white font-bold mb-3">📊 Activity Stats</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Logins</span>
                          <span className="text-white">{intel?.metadata?.total_logins || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Unique IPs</span>
                          <span className={`${(intel?.metadata?.unique_ips_count || 0) > 10 ? 'text-orange-400' : 'text-white'}`}>
                            {intel?.metadata?.unique_ips_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Unique Devices</span>
                          <span className={`${(intel?.metadata?.unique_devices_count || 0) > 5 ? 'text-orange-400' : 'text-white'}`}>
                            {intel?.metadata?.unique_devices_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Countries</span>
                          <span className={`${(intel?.metadata?.unique_countries_count || 0) > 3 ? 'text-orange-400' : 'text-white'}`}>
                            {intel?.metadata?.unique_countries_count || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Login</span>
                          <span className="text-white">
                            {intel?.metadata?.last_login_at 
                              ? formatRelativeTime(intel.metadata.last_login_at)
                              : 'Never'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Flags/Indicators */}
                  <div className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white font-bold mb-3">🚩 Indicators</h3>
                    <div className="flex flex-wrap gap-2">
                      {intel?.metadata?.has_vpn_usage && (
                        <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          🌐 VPN Detected
                        </span>
                      )}
                      {intel?.metadata?.has_proxy_usage && (
                        <span className="px-3 py-1 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          🔄 Proxy Detected
                        </span>
                      )}
                      {intel?.metadata?.has_tor_usage && (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                          🧅 Tor Detected
                        </span>
                      )}
                      {intel?.metadata?.has_multiple_accounts_same_ip && (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                          👥 Multi-Account (IP)
                        </span>
                      )}
                      {intel?.metadata?.has_multiple_accounts_same_device && (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                          📱 Multi-Account (Device)
                        </span>
                      )}
                      {intel?.metadata?.is_disposable_email && (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                          📧 Disposable Email
                        </span>
                      )}
                      {!intel?.metadata?.has_vpn_usage && 
                       !intel?.metadata?.has_proxy_usage && 
                       !intel?.metadata?.has_tor_usage && 
                       !intel?.metadata?.has_multiple_accounts_same_ip &&
                       !intel?.metadata?.has_multiple_accounts_same_device &&
                       !intel?.metadata?.is_disposable_email && (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                          ✅ No Red Flags
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SESSIONS TAB */}
              {activeTab === 'sessions' && (
                <div className="space-y-3">
                  {intel?.recentSessions?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">🌐</div>
                      <p>No session data available</p>
                    </div>
                  ) : (
                    intel?.recentSessions?.map((session, i) => (
                      <div key={session.id || i} className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-white">{session.ip_address}</span>
                              {session.is_vpn && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">VPN</span>}
                              {session.is_proxy && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Proxy</span>}
                            </div>
                            <div className="text-sm text-gray-400 space-y-1">
                              <div>📍 {session.city ? `${session.city}, ` : ''}{session.country || 'Unknown'}</div>
                              <div>💻 {session.browser_name} on {session.os_name} ({session.device_type})</div>
                              <div>🕐 {formatDate(session.created_at)}</div>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            {formatRelativeTime(session.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* RELATED ACCOUNTS TAB */}
              {activeTab === 'related' && (
                <div className="space-y-3">
                  {intel?.relatedAccounts?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">👤</div>
                      <p>No related accounts detected</p>
                    </div>
                  ) : (
                    intel?.relatedAccounts?.map((related, i) => (
                      <div key={related.id || i} className="bg-slate-800/80 rounded-xl p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                              {related.related_user?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-bold">{related.related_user?.username || 'Unknown'}</span>
                                {related.related_user?.is_banned && (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">BANNED</span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">{related.related_user?.email}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                related.relation_type === 'same_device' ? 'bg-red-500/20 text-red-400' :
                                related.relation_type === 'same_ip' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {related.relation_type.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Confidence: {related.confidence_score}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* FLAGS TAB */}
              {activeTab === 'flags' && (
                <div className="space-y-3">
                  {intel?.fraudFlags?.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-4xl mb-2">✅</div>
                      <p>No fraud flags on this account</p>
                    </div>
                  ) : (
                    intel?.fraudFlags?.map((flag, i) => (
                      <div key={flag.id || i} className={`rounded-xl p-4 border ${
                        flag.status === 'active' 
                          ? flag.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                            flag.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                            'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-slate-800/80 border-white/10'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                flag.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                flag.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                flag.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {flag.severity?.toUpperCase()}
                              </span>
                              <span className="text-white font-semibold">
                                {flag.type?.replace(/_/g, ' ')}
                              </span>
                              {flag.auto_detected && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">🤖 Auto</span>
                              )}
                            </div>
                            <p className="text-gray-300 text-sm">{flag.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(flag.created_at)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            flag.status === 'active' ? 'bg-red-500/20 text-red-400' :
                            flag.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {flag.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add private admin notes about this user..."
                    className="w-full h-48 bg-slate-800 border border-white/20 rounded-xl p-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {intel?.metadata?.admin_notes_updated_at && (
                        <>Last updated: {formatDate(intel.metadata.admin_notes_updated_at)}</>
                      )}
                    </div>
                    <button
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                    >
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            User ID: <span className="font-mono">{userId}</span>
          </div>
          <div className="flex gap-3">
            {intel?.profile?.is_banned ? (
              <button
                onClick={() => onUnbanUser?.(userId!)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Unban User
              </button>
            ) : (
              <button
                onClick={() => onBanUser?.(userId!)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Ban User
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}