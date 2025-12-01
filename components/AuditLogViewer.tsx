// components/AuditLogViewer.tsx - FIXED VERSION

'use client'

import { useEffect, useState } from 'react'
import { fetchAuditLogs, getAuditStats } from '@/lib/auditLog'

interface AuditLog {
  id: string
  admin_id: string
  admin_username: string
  admin_email: string
  action_type: string
  target_id: string
  target_type: string
  changes: any
  reason: string
  ip_address: string
  user_agent: string
  severity: string
  created_at: string
}

interface AuditLogViewerProps {
  currentAdminId?: string
}

export default function AuditLogViewer({ currentAdminId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  
  // Filters - DEFAULT TO 'all' so users can see existing logs
  const [actionTypeFilter, setActionTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [targetTypeFilter, setTargetTypeFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    loadAuditData()
  }, [actionTypeFilter, severityFilter, targetTypeFilter, adminFilter, dateRange])

  const loadAuditData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Calculate date range
      let startDate: Date | undefined
      const now = new Date()
      
      if (dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (dateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      // If 'all', startDate remains undefined

      const { data, error: fetchError } = await fetchAuditLogs({
        actionType: (actionTypeFilter || undefined) as any,
        severity: (severityFilter || undefined) as any,
        targetType: (targetTypeFilter || undefined) as any,
        adminId: adminFilter || undefined,
        startDate: startDate,
        limit: 500
      })

      if (fetchError) {
        console.error('Error fetching logs:', fetchError)
        setError('Failed to fetch audit logs. Please check if the admin_actions table exists.')
      } else {
        setLogs(data as AuditLog[])
      }

      // Load stats
      const statsData = await getAuditStats()
      setStats(statsData)
    } catch (err) {
      console.error('Error loading audit data:', err)
      setError('An unexpected error occurred while loading audit data.')
    }
    
    setLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getActionIcon = (actionType: string) => {
    if (actionType.includes('ban')) return '🚫'
    if (actionType.includes('refund')) return '💰'
    if (actionType.includes('delete')) return '🗑️'
    if (actionType.includes('approve')) return '✅'
    if (actionType.includes('reject')) return '❌'
    if (actionType.includes('dispute')) return '⚠️'
    if (actionType.includes('verification')) return '🔍'
    if (actionType.includes('withdrawal')) return '💸'
    if (actionType.includes('review')) return '⭐'
    if (actionType.includes('bulk')) return '📦'
    return '📝'
  }

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Pagination
  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentLogs = logs.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-white/20 rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-1">Total Actions</div>
            <div className="text-2xl font-bold text-white">{stats.totalActions}</div>
          </div>
          <div className="bg-slate-800/80 border border-red-500/30 rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-400">{stats.actionsBySeverity?.critical || 0}</div>
          </div>
          <div className="bg-slate-800/80 border border-orange-500/30 rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-1">High Priority</div>
            <div className="text-2xl font-bold text-orange-400">{stats.actionsBySeverity?.high || 0}</div>
          </div>
          <div className="bg-slate-800/80 border border-purple-500/30 rounded-xl p-4">
            <div className="text-gray-300 text-sm mb-1">Today</div>
            <div className="text-2xl font-bold text-purple-400">
              {stats.recentActions?.filter((a: any) => {
                const actionDate = new Date(a.created_at)
                const today = new Date()
                return actionDate.toDateString() === today.toDateString()
              }).length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/80 border border-white/20 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Date Range</label>
            <select 
              value={dateRange} 
              onChange={(e) => {
                setDateRange(e.target.value as any)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all" className="bg-slate-800 text-white">All Time</option>
              <option value="today" className="bg-slate-800 text-white">Today</option>
              <option value="week" className="bg-slate-800 text-white">Last 7 Days</option>
              <option value="month" className="bg-slate-800 text-white">Last 30 Days</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Severity</label>
            <select 
              value={severityFilter} 
              onChange={(e) => {
                setSeverityFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-800 text-white">All Severities</option>
              <option value="critical" className="bg-slate-800 text-white">Critical</option>
              <option value="high" className="bg-slate-800 text-white">High</option>
              <option value="medium" className="bg-slate-800 text-white">Medium</option>
              <option value="low" className="bg-slate-800 text-white">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-300 mb-2">Target Type</label>
            <select 
              value={targetTypeFilter} 
              onChange={(e) => {
                setTargetTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-800 text-white">All Types</option>
              <option value="user" className="bg-slate-800 text-white">User</option>
              <option value="order" className="bg-slate-800 text-white">Order</option>
              <option value="listing" className="bg-slate-800 text-white">Listing</option>
              <option value="dispute" className="bg-slate-800 text-white">Dispute</option>
              <option value="verification" className="bg-slate-800 text-white">Verification</option>
              <option value="withdrawal" className="bg-slate-800 text-white">Withdrawal</option>
              <option value="review" className="bg-slate-800 text-white">Review</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={adminFilter}
              onChange={(e) => {
                setAdminFilter(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search by admin name..."
              className="w-full bg-slate-800 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">
            Audit Logs ({logs.length} total)
          </h3>
          <button
            onClick={loadAuditData}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
          >
            🔄 Refresh
          </button>
        </div>

        {currentLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/80 border border-white/20 rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-300">No audit logs found</p>
            <p className="text-gray-500 text-sm mt-2">
              {dateRange !== 'all' 
                ? 'Try selecting "All Time" in the date range filter' 
                : 'Admin actions will appear here when performed'}
            </p>
          </div>
        ) : (
          currentLogs.map((log) => (
            <div
              key={log.id}
              className="bg-slate-800/80 border border-white/20 rounded-xl p-4 hover:bg-slate-700/80 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getActionIcon(log.action_type)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-semibold">
                        {formatActionType(log.action_type)}
                      </span>
                      {log.severity && (
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                          {log.severity.toUpperCase()}
                        </span>
                      )}
                      {log.target_type && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {log.target_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      by <span className="text-purple-400 font-semibold">{log.admin_username || 'Unknown'}</span>
                      {' '} • {' '}
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {log.reason && (
                <div className="bg-slate-900/50 border border-white/20 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-300 font-semibold mb-1">Reason:</p>
                  <p className="text-white text-sm">{log.reason}</p>
                </div>
              )}

              {log.changes && Object.keys(log.changes).length > 0 && (
                <details className="bg-slate-900/50 border border-white/20 rounded-lg p-3">
                  <summary className="text-xs text-gray-300 font-semibold cursor-pointer hover:text-white transition">
                    View Changes
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {log.changes.before && (
                      <div>
                        <p className="text-xs text-red-400 font-semibold mb-2">BEFORE:</p>
                        <pre className="text-xs text-white bg-black/30 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(log.changes.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.changes.after && (
                      <div>
                        <p className="text-xs text-green-400 font-semibold mb-2">AFTER:</p>
                        <pre className="text-xs text-white bg-black/30 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(log.changes.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                {log.ip_address && <span>IP: {log.ip_address}</span>}
                {log.target_id && <span>Target ID: {log.target_id.slice(0, 8)}...</span>}
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition"
            >
              ← Prev
            </button>
            <span className="text-white px-4">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}