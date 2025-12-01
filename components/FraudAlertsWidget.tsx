// components/FraudAlertsWidget.tsx - Real-time Fraud Alerts

'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { fetchFraudAlerts, markAlertRead, dismissAlert, markAllAlertsRead, FraudAlert } from '@/lib/fraudDetection'

interface FraudAlertsWidgetProps {
  onAlertClick?: (alert: FraudAlert) => void
}

export default function FraudAlertsWidget({ onAlertClick }: FraudAlertsWidgetProps) {
  const [alerts, setAlerts] = useState<FraudAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [playSound, setPlaySound] = useState(true)
  const supabase = createClient()

  const loadAlerts = useCallback(async () => {
    const { data } = await fetchFraudAlerts({ limit: 20 })
    setAlerts(data)
    setUnreadCount(data.filter(a => !a.is_read).length)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadAlerts()

    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('fraud-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts'
        },
        (payload) => {
          const newAlert = payload.new as FraudAlert
          setAlerts(prev => [newAlert, ...prev].slice(0, 20))
          setUnreadCount(prev => prev + 1)

          // Play sound for critical/high alerts
          if (playSound && (newAlert.severity === 'critical' || newAlert.severity === 'high')) {
            playAlertSound()
          }

          // Show browser notification
          showBrowserNotification(newAlert)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadAlerts, playSound, supabase])

  const playAlertSound = () => {
    try {
      const audio = new Audio('/sounds/alert.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {}) // Ignore autoplay errors
    } catch (e) {
      // Audio not available
    }
  }

  const showBrowserNotification = async (alert: FraudAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 Fraud Alert', {
        body: alert.title,
        icon: '/favicon.ico',
        tag: 'fraud-alert'
      })
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const handleMarkRead = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await markAlertRead(alertId)
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await dismissAlert(alertId)
    setAlerts(prev => prev.filter(a => a.id !== alertId))
    const alert = alerts.find(a => a.id === alertId)
    if (alert && !alert.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAlertsRead()
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })))
    setUnreadCount(0)
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/20 text-red-400'
      case 'high':
        return 'border-orange-500 bg-orange-500/20 text-orange-400'
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
      default:
        return 'border-blue-500 bg-blue-500/20 text-blue-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨'
      case 'high':
        return '⚠️'
      case 'medium':
        return '📋'
      default:
        return '📝'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="relative">
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition ${
          unreadCount > 0
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse'
            : 'bg-white/10 text-gray-400 hover:bg-white/20'
        }`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <h3 className="text-white font-bold">Fraud Alerts</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Sound Toggle */}
                <button
                  onClick={() => setPlaySound(!playSound)}
                  className={`p-1.5 rounded transition ${
                    playSound ? 'text-green-400 bg-green-500/20' : 'text-gray-500 bg-white/5'
                  }`}
                  title={playSound ? 'Sound on' : 'Sound off'}
                >
                  {playSound ? '🔊' : '🔇'}
                </button>
                
                {/* Mark all read */}
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-purple-400 hover:text-purple-300 transition"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Alerts List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No fraud alerts</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (onAlertClick) onAlertClick(alert)
                      setIsOpen(false)
                    }}
                    className={`p-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition ${
                      !alert.is_read ? 'bg-white/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Severity Icon */}
                      <div className={`p-2 rounded-lg border ${getSeverityStyles(alert.severity)}`}>
                        <span className="text-lg">{getSeverityIcon(alert.severity)}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-semibold text-sm truncate ${!alert.is_read ? 'text-white' : 'text-gray-300'}`}>
                            {alert.title}
                          </h4>
                          {!alert.is_read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs truncate mb-1">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatTimeAgo(alert.created_at)}</span>
                          {alert.user?.username && (
                            <>
                              <span>•</span>
                              <span className="text-purple-400">@{alert.user.username}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {!alert.is_read && (
                          <button
                            onClick={(e) => handleMarkRead(alert.id, e)}
                            className="p-1 text-gray-500 hover:text-blue-400 transition"
                            title="Mark as read"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDismiss(alert.id, e)}
                          className="p-1 text-gray-500 hover:text-red-400 transition"
                          title="Dismiss"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <button
                  onClick={() => {
                    setIsOpen(false)
                    // You can add navigation to fraud tab here
                  }}
                  className="text-sm text-purple-400 hover:text-purple-300 transition"
                >
                  View all in Fraud Detection →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// FLOATING CRITICAL ALERT BANNER
// Shows at top of screen for critical alerts
// ============================================================================

export function CriticalAlertBanner() {
  const [criticalAlert, setCriticalAlert] = useState<FraudAlert | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to new critical alerts
    const channel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fraud_alerts'
        },
        (payload) => {
          const newAlert = payload.new as FraudAlert
          if (newAlert.severity === 'critical') {
            setCriticalAlert(newAlert)
            setIsVisible(true)

            // Auto-hide after 10 seconds
            setTimeout(() => {
              setIsVisible(false)
            }, 10000)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (!isVisible || !criticalAlert) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      <div className="bg-gradient-to-r from-red-600 to-red-800 border-b-2 border-red-400 p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🚨</span>
            <div>
              <h4 className="text-white font-bold">{criticalAlert.title}</h4>
              <p className="text-red-200 text-sm">{criticalAlert.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Navigate to fraud tab
                window.location.hash = '#fraud'
              }}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-semibold"
            >
              View Details
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}