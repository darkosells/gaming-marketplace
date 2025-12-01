// components/tabs/FraudTab.tsx - Enhanced Fraud Detection Tab

'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { FraudFlag } from '../../types'

// Import fraud detection utilities if available, otherwise define locally
// These will be available once lib/fraudDetection.ts is added
type FraudAlert = {
  id: string
  flag_id: string
  user_id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  user?: { username: string }
}

const ITEMS_PER_PAGE = 10

// Fraud detection configuration
const FRAUD_CONFIG = {
  MAX_DISPUTES_RATIO: 0.3,
  MIN_ACCOUNT_AGE_DAYS: 7,
  MAX_RAPID_ORDERS: 5,
  SUSPICIOUS_PRICE_MULTIPLIER: 0.3,
  MIN_DELIVERY_TIME_MINUTES: 5
}

interface FraudTabProps {
  fraudFlags: FraudFlag[]
  users: any[]
  orders: any[]
  listings: any[]
  activeDisputes: any[]
  userId: string
  isSuperAdmin: boolean
  onRefresh: () => void
}

export default function FraudTab({
  fraudFlags,
  users,
  orders,
  listings,
  activeDisputes,
  userId,
  isSuperAdmin,
  onRefresh
}: FraudTabProps) {
  const [subTab, setSubTab] = useState<'flags' | 'alerts' | 'blacklist' | 'scans'>('flags')
  const [flagFilter, setFlagFilter] = useState<'active' | 'reviewed' | 'all'>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{ flagsCreated: number; errors: string[] } | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [blacklist, setBlacklist] = useState<any[]>([])
  const [scanLogs, setScanLogs] = useState<any[]>([])
  const [selectedFlag, setSelectedFlag] = useState<FraudFlag | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'resolved' | 'false_positive'>('reviewed')
  
  // Blacklist form
  const [blacklistType, setBlacklistType] = useState<'ip' | 'email_domain' | 'device_fingerprint'>('ip')
  const [blacklistValue, setBlacklistValue] = useState('')
  const [blacklistReason, setBlacklistReason] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadStats()
    loadAlerts()
    loadBlacklist()
    loadScanLogs()

    // Real-time subscription for new flags
    const channel = supabase
      .channel('fraud-flags-rt')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fraud_flags' },
        () => onRefresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fraud_alerts' },
        () => loadAlerts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadStats = async () => {
    try {
      // Total flags
      const { count: totalFlags } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })

      // Active flags
      const { count: activeFlags } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Critical flags
      const { count: criticalFlags } = await supabase
        .from('fraud_flags')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .eq('status', 'active')

      // High risk users
      const { count: highRiskUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_high_risk', true)

      // Recent alerts (last 24h)
      const { count: recentAlerts } = await supabase
        .from('fraud_alerts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      setStats({
        totalFlags: totalFlags || 0,
        activeFlags: activeFlags || 0,
        criticalFlags: criticalFlags || 0,
        highRiskUsers: highRiskUsers || 0,
        recentAlerts: recentAlerts || 0
      })
    } catch (error) {
      console.error('Error loading fraud stats:', error)
      setStats({
        totalFlags: fraudFlags.length,
        activeFlags: fraudFlags.filter(f => f.status === 'active').length,
        criticalFlags: fraudFlags.filter(f => f.severity === 'critical' && f.status === 'active').length,
        highRiskUsers: 0,
        recentAlerts: 0
      })
    }
  }

  const loadAlerts = async () => {
    const { data } = await supabase
      .from('fraud_alerts')
      .select('*, user:profiles!user_id(username)')
      .order('created_at', { ascending: false })
      .limit(50)
    setAlerts(data || [])
  }

  const loadBlacklist = async () => {
    const { data } = await supabase
      .from('fraud_blacklist')
      .select('*, added_by_user:profiles!added_by(username)')
      .order('created_at', { ascending: false })
    setBlacklist(data || [])
  }

  const loadScanLogs = async () => {
    const { data } = await supabase
      .from('fraud_scan_log')
      .select('*, triggered_by_user:profiles!triggered_by(username)')
      .order('started_at', { ascending: false })
      .limit(20)
    setScanLogs(data || [])
  }

  const handleRunScan = async () => {
    if (!isSuperAdmin) return
    setIsScanning(true)
    setScanResult(null)

    let flagsCreated = 0
    const errors: string[] = []

    try {
      // Log scan start
      await supabase.from('fraud_scan_log').insert({
        scan_type: 'manual',
        triggered_by: userId,
        status: 'running'
      })

      for (const user of users) {
        try {
          const userOrders = orders.filter((o: any) => o.buyer_id === user.id || o.seller_id === user.id)
          const userDisputes = activeDisputes.filter((d: any) => d.buyer_id === user.id || d.seller_id === user.id)
          const userListings = listings.filter((l: any) => l.seller_id === user.id)

          // Pattern 1: High dispute ratio
          if (userOrders.length >= 3) {
            const disputeRatio = userDisputes.length / userOrders.length
            if (disputeRatio > FRAUD_CONFIG.MAX_DISPUTES_RATIO) {
              const { error } = await supabase.from('fraud_flags').insert({
                user_id: user.id,
                type: 'multiple_disputes',
                severity: 'high',
                description: `Dispute ratio: ${(disputeRatio * 100).toFixed(1)}% (${userDisputes.length}/${userOrders.length} orders)`,
                auto_detected: true,
                detection_source: 'manual_scan',
                status: 'active'
              })
              if (!error) flagsCreated++
            }
          }

          // Pattern 2: New account high activity
          const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
          if (accountAgeDays < FRAUD_CONFIG.MIN_ACCOUNT_AGE_DAYS && userOrders.length > 10) {
            const { error } = await supabase.from('fraud_flags').insert({
              user_id: user.id,
              type: 'suspicious_activity',
              severity: 'medium',
              description: `New account (${Math.floor(accountAgeDays)} days) with ${userOrders.length} orders`,
              auto_detected: true,
              detection_source: 'manual_scan',
              status: 'active'
            })
            if (!error) flagsCreated++
          }

          // Pattern 3: Rapid transactions
          const recentOrders = userOrders.filter((o: any) => {
            const orderTime = new Date(o.created_at).getTime()
            return Date.now() - orderTime < 60 * 60 * 1000
          })
          if (recentOrders.length >= FRAUD_CONFIG.MAX_RAPID_ORDERS) {
            const { error } = await supabase.from('fraud_flags').insert({
              user_id: user.id,
              type: 'rapid_transactions',
              severity: 'high',
              description: `${recentOrders.length} orders in the last hour`,
              auto_detected: true,
              detection_source: 'manual_scan',
              status: 'active'
            })
            if (!error) flagsCreated++
          }

          // Pattern 4: Suspiciously low pricing
          if (userListings.length > 0) {
            const gameListings: { [key: string]: number[] } = {}
            listings.forEach((l: any) => {
              if (!gameListings[l.game]) gameListings[l.game] = []
              gameListings[l.game].push(parseFloat(l.price))
            })

            for (const listing of userListings) {
              const gamePrices = gameListings[listing.game] || []
              if (gamePrices.length >= 3) {
                const avgPrice = gamePrices.reduce((sum: number, p: number) => sum + p, 0) / gamePrices.length
                const listingPrice = parseFloat(listing.price)
                if (listingPrice < avgPrice * FRAUD_CONFIG.SUSPICIOUS_PRICE_MULTIPLIER) {
                  const { error } = await supabase.from('fraud_flags').insert({
                    user_id: user.id,
                    type: 'low_pricing',
                    severity: 'medium',
                    description: `Listing "${listing.title}" at $${listingPrice} (${((listingPrice / avgPrice) * 100).toFixed(0)}% of avg $${avgPrice.toFixed(2)})`,
                    auto_detected: true,
                    detection_source: 'manual_scan',
                    status: 'active'
                  })
                  if (!error) flagsCreated++
                }
              }
            }
          }

          // Pattern 5: Instant deliveries
          const instantDeliveries = userOrders.filter((o: any) => {
            if (!o.delivered_at || o.seller_id !== user.id) return false
            const deliveryTime = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 1000 / 60
            return deliveryTime < FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES
          })
          if (instantDeliveries.length >= 3) {
            const { error } = await supabase.from('fraud_flags').insert({
              user_id: user.id,
              type: 'account_manipulation',
              severity: 'medium',
              description: `${instantDeliveries.length} orders delivered in under ${FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES} minutes`,
              auto_detected: true,
              detection_source: 'manual_scan',
              status: 'active'
            })
            if (!error) flagsCreated++
          }

        } catch (userError: any) {
          errors.push(`Error scanning user ${user.id}: ${userError.message}`)
        }
      }

      setScanResult({ flagsCreated, errors })
      onRefresh()
      loadStats()
      loadAlerts()
      loadScanLogs()
    } catch (error) {
      console.error('Scan error:', error)
      setScanResult({ flagsCreated: 0, errors: ['Scan failed. Check console for details.'] })
    }

    setIsScanning(false)
  }

  const handleRunDatabaseScan = async () => {
    if (!isSuperAdmin) return
    setIsScanning(true)
    setScanResult(null)

    try {
      // Try to call the database function if it exists
      const { data, error } = await supabase.rpc('run_full_fraud_scan', { triggered_by_id: userId })
      
      if (error) {
        // If database function doesn't exist, fall back to manual scan
        console.warn('Database scan function not available, running manual scan instead')
        await handleRunScan()
        return
      }

      if (data && data[0]) {
        setScanResult({ flagsCreated: data[0].flags_created, errors: [] })
      }
      onRefresh()
      loadStats()
      loadAlerts()
      loadScanLogs()
    } catch (error) {
      console.error('Database scan error:', error)
      setScanResult({ flagsCreated: 0, errors: ['Database scan failed. Try manual scan.'] })
    }

    setIsScanning(false)
  }

  const handleReviewFlag = async () => {
    if (!selectedFlag) return

    const { error } = await supabase
      .from('fraud_flags')
      .update({
        status: reviewStatus,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      })
      .eq('id', selectedFlag.id)

    if (!error) {
      setSelectedFlag(null)
      setReviewNotes('')
      onRefresh()
      loadStats()
    }
  }

  const handleAddToBlacklist = async () => {
    if (!blacklistValue.trim() || !blacklistReason.trim()) return

    try {
      const { error } = await supabase
        .from('fraud_blacklist')
        .insert({
          type: blacklistType,
          value: blacklistValue.toLowerCase().trim(),
          reason: blacklistReason.trim(),
          added_by: userId
        })

      if (!error) {
        setBlacklistValue('')
        setBlacklistReason('')
        loadBlacklist()
      } else {
        console.error('Error adding to blacklist:', error)
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error)
    }
  }

  const handleRemoveFromBlacklist = async (id: string) => {
    if (!confirm('Remove from blacklist?')) return
    await supabase.from('fraud_blacklist').delete().eq('id', id)
    loadBlacklist()
  }

  // Filter flags
  const filteredFlags = fraudFlags.filter(f => {
    if (flagFilter === 'active') return f.status === 'active'
    if (flagFilter === 'reviewed') return f.status !== 'active'
    return true
  })

  const paginatedFlags = filteredFlags.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )
  const totalPages = Math.ceil(filteredFlags.length / ITEMS_PER_PAGE)

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      multiple_disputes: '⚠️',
      suspicious_activity: '👀',
      rapid_transactions: '⚡',
      low_pricing: '💰',
      account_manipulation: '🤖',
      multiple_accounts: '👥',
      payment_issue: '💳',
      vpn_detected: '🌐',
      blacklisted_email: '📧',
      location_anomaly: '📍',
      device_mismatch: '📱',
      chargeback: '🔙'
    }
    return icons[type] || '🚩'
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/80 border border-white/20 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Flags</div>
            <div className="text-2xl font-bold text-white">{stats.totalFlags}</div>
          </div>
          <div className="bg-slate-800/80 border border-red-500/30 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Active</div>
            <div className="text-2xl font-bold text-red-400">{stats.activeFlags}</div>
          </div>
          <div className="bg-slate-800/80 border border-orange-500/30 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Critical</div>
            <div className="text-2xl font-bold text-orange-400">{stats.criticalFlags}</div>
          </div>
          <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">High Risk Users</div>
            <div className="text-2xl font-bold text-purple-400">{stats.highRiskUsers}</div>
          </div>
          <div className="bg-slate-800/80 border border-blue-500/30 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Alerts (24h)</div>
            <div className="text-2xl font-bold text-blue-400">{stats.recentAlerts}</div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {(['flags', 'alerts', 'blacklist', 'scans'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              subTab === tab
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {tab === 'flags' && `🚩 Flags (${stats?.activeFlags || 0})`}
            {tab === 'alerts' && `🔔 Alerts (${alerts.filter(a => !a.is_read).length})`}
            {tab === 'blacklist' && `🚫 Blacklist (${blacklist.length})`}
            {tab === 'scans' && '📊 Scan History'}
          </button>
        ))}
        
        {isSuperAdmin && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {isScanning ? '🔄 Scanning...' : '🔍 Run Full Scan'}
            </button>
          </div>
        )}
      </div>

      {/* Scan Result */}
      {scanResult && (
        <div className={`p-4 rounded-xl ${scanResult.errors.length > 0 ? 'bg-red-500/20 border border-red-500/30' : 'bg-green-500/20 border border-green-500/30'}`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{scanResult.errors.length > 0 ? '⚠️' : '✅'}</span>
            <div>
              <h4 className="text-white font-semibold">
                Scan Complete: {scanResult.flagsCreated} new flags created
              </h4>
              {scanResult.errors.length > 0 && (
                <p className="text-red-400 text-sm">{scanResult.errors.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLAGS TAB */}
      {subTab === 'flags' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex gap-2">
            {(['active', 'reviewed', 'all'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => { setFlagFilter(filter); setCurrentPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  flagFilter === filter
                    ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Flags List */}
          {paginatedFlags.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl">
              <div className="text-4xl mb-4">✅</div>
              <p className="text-gray-400">No fraud flags found</p>
            </div>
          ) : (
            paginatedFlags.map(flag => (
              <div
                key={flag.id}
                className={`bg-slate-800/80 border rounded-xl p-4 hover:bg-slate-700/80 transition ${
                  flag.severity === 'critical' ? 'border-red-500/50' :
                  flag.severity === 'high' ? 'border-orange-500/30' : 'border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{getTypeIcon(flag.type)}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-semibold">
                          {flag.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityStyles(flag.severity)}`}>
                          {flag.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          flag.status === 'active' ? 'bg-red-500/20 text-red-400' :
                          flag.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {flag.status}
                        </span>
                        {flag.auto_detected && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                            🤖 Auto
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{flag.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>User: <span className="text-purple-400">{flag.user?.username || 'Unknown'}</span></span>
                        <span>{new Date(flag.created_at).toLocaleString()}</span>
                        {flag.detection_source && <span>Source: {flag.detection_source}</span>}
                      </div>
                    </div>
                  </div>

                  {flag.status === 'active' && isSuperAdmin && (
                    <button
                      onClick={() => setSelectedFlag(flag)}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
              >
                ← Prev
              </button>
              <span className="text-white px-4">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ALERTS TAB */}
      {subTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl">
              <div className="text-4xl mb-4">🔔</div>
              <p className="text-gray-400">No alerts</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-slate-800/80 border rounded-xl p-4 ${
                  !alert.is_read ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getSeverityStyles(alert.severity)}`}>
                    {getTypeIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{alert.title}</h4>
                    <p className="text-gray-400 text-sm">{alert.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* BLACKLIST TAB */}
      {subTab === 'blacklist' && (
        <div className="space-y-4">
          {/* Add to blacklist form */}
          {isSuperAdmin && (
            <div className="bg-slate-800/80 border border-white/20 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-4">Add to Blacklist</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={blacklistType}
                  onChange={(e) => setBlacklistType(e.target.value as any)}
                  className="bg-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="ip">IP Address</option>
                  <option value="email_domain">Email Domain</option>
                  <option value="device_fingerprint">Device Fingerprint</option>
                </select>
                <input
                  type="text"
                  value={blacklistValue}
                  onChange={(e) => setBlacklistValue(e.target.value)}
                  placeholder={blacklistType === 'ip' ? '192.168.1.1' : blacklistType === 'email_domain' ? 'example.com' : 'fingerprint'}
                  className="bg-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="text"
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  placeholder="Reason for blacklisting"
                  className="bg-slate-700 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
                <button
                  onClick={handleAddToBlacklist}
                  className="bg-red-500 text-white rounded-lg px-4 py-2 hover:bg-red-600 transition"
                >
                  Add to Blacklist
                </button>
              </div>
            </div>
          )}

          {/* Blacklist entries */}
          <div className="space-y-2">
            {blacklist.map(entry => (
              <div
                key={entry.id}
                className="bg-slate-800/80 border border-white/10 rounded-lg p-3 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{entry.value}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                      {entry.type}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{entry.reason}</p>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleRemoveFromBlacklist(entry.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCANS TAB */}
      {subTab === 'scans' && (
        <div className="space-y-3">
          {scanLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-400">No scan history</p>
            </div>
          ) : (
            scanLogs.map(log => (
              <div
                key={log.id}
                className="bg-slate-800/80 border border-white/10 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                        {log.scan_type}
                      </span>
                    </div>
                    <p className="text-white">
                      {log.users_scanned} users scanned, {log.flags_created} flags created
                    </p>
                    <p className="text-gray-500 text-sm">
                      {new Date(log.started_at).toLocaleString()}
                      {log.triggered_by_user && ` by ${log.triggered_by_user.username}`}
                      {log.duration_ms && ` (${log.duration_ms}ms)`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Review Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-xl font-bold text-white mb-4">Review Fraud Flag</h3>
            
            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getTypeIcon(selectedFlag.type)}</span>
                <span className="text-white font-semibold">
                  {selectedFlag.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
              <p className="text-gray-400 text-sm">{selectedFlag.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="reviewed">Reviewed (Keep Monitoring)</option>
                  <option value="resolved">Resolved (Issue Fixed)</option>
                  <option value="false_positive">False Positive</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add review notes..."
                  className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white h-24 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedFlag(null)}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewFlag}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}