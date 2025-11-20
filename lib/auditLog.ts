// Create: lib/auditLog.ts

import { createClient } from '@/lib/supabase'

export type ActionType = 
  // User actions
  | 'user_banned' 
  | 'user_unbanned'
  | 'user_role_changed'
  | 'user_deleted'
  
  // Order actions
  | 'order_refunded'
  | 'order_status_changed'
  | 'order_manually_completed'
  
  // Listing actions
  | 'listing_deleted'
  | 'listing_suspended'
  | 'listing_approved'
  
  // Dispute actions
  | 'dispute_resolved_buyer'
  | 'dispute_resolved_seller'
  | 'dispute_escalated'
  
  // Verification actions
  | 'verification_approved'
  | 'verification_rejected'
  | 'verification_documents_viewed'
  
  // Withdrawal actions
  | 'withdrawal_approved'
  | 'withdrawal_rejected'
  
  // Review actions
  | 'review_edited'
  | 'review_deleted'
  
  // Bulk actions
  | 'bulk_ban_users'
  | 'bulk_refund_orders'
  | 'bulk_delete_listings'

export type TargetType = 'user' | 'order' | 'listing' | 'verification' | 'withdrawal' | 'review' | 'dispute' | 'conversation'

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical'

interface AuditLogParams {
  adminId: string
  actionType: ActionType
  targetId?: string | null
  targetType?: TargetType
  changes?: {
    before?: any
    after?: any
  }
  reason?: string
  severity?: SeverityLevel
}

/**
 * Log an admin action to the audit trail
 */
export async function logAdminAction(params: AuditLogParams) {
  const supabase = createClient()
  
  try {
    // Get client IP and user agent (if available in browser context)
    let ipAddress = 'unknown'
    let userAgent = 'unknown'
    
    if (typeof window !== 'undefined') {
      userAgent = navigator.userAgent
      
      // Try to get IP from API (you can implement your own IP detection)
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        ipAddress = ipData.ip
      } catch {
        // Fallback if IP detection fails
        ipAddress = 'unavailable'
      }
    }

    // Determine severity if not provided
    const severity = params.severity || determineSeverity(params.actionType)

    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: params.adminId,
        action_type: params.actionType,
        target_id: params.targetId,
        target_type: params.targetType,
        changes: params.changes,
        reason: params.reason,
        ip_address: ipAddress,
        user_agent: userAgent,
        severity: severity
      })

    if (error) {
      console.error('Failed to log admin action:', error)
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error in logAdminAction:', error)
    return { success: false, error }
  }
}

/**
 * Automatically determine severity based on action type
 */
function determineSeverity(actionType: ActionType): SeverityLevel {
  const criticalActions: ActionType[] = [
    'user_deleted',
    'bulk_ban_users',
    'verification_approved'
  ]
  
  const highActions: ActionType[] = [
    'user_banned',
    'order_refunded',
    'withdrawal_approved',
    'dispute_resolved_buyer',
    'dispute_resolved_seller',
    'verification_rejected'
  ]
  
  const mediumActions: ActionType[] = [
    'listing_deleted',
    'review_edited',
    'review_deleted',
    'withdrawal_rejected',
    'listing_suspended'
  ]
  
  if (criticalActions.includes(actionType)) return 'critical'
  if (highActions.includes(actionType)) return 'high'
  if (mediumActions.includes(actionType)) return 'medium'
  return 'low'
}

/**
 * Fetch audit logs with optional filters
 */
export async function fetchAuditLogs(filters?: {
  adminId?: string
  actionType?: ActionType
  targetType?: TargetType
  severity?: SeverityLevel
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('admin_actions_detailed')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.adminId) {
    query = query.eq('admin_id', filters.adminId)
  }
  
  if (filters?.actionType) {
    query = query.eq('action_type', filters.actionType)
  }
  
  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType)
  }
  
  if (filters?.severity) {
    query = query.eq('severity', filters.severity)
  }
  
  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate.toISOString())
  }
  
  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate.toISOString())
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', error)
    return { data: [], error }
  }

  return { data: data || [], error: null }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(adminId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('admin_actions')
    .select('action_type, severity, created_at')
  
  if (adminId) {
    query = query.eq('admin_id', adminId)
  }

  const { data, error } = await query

  if (error || !data) {
    return {
      totalActions: 0,
      actionsByType: {},
      actionsBySeverity: {},
      recentActions: []
    }
  }

  // Calculate statistics
  const actionsByType: Record<string, number> = {}
  const actionsBySeverity: Record<string, number> = {}

  data.forEach(action => {
    actionsByType[action.action_type] = (actionsByType[action.action_type] || 0) + 1
    actionsBySeverity[action.severity] = (actionsBySeverity[action.severity] || 0) + 1
  })

  return {
    totalActions: data.length,
    actionsByType,
    actionsBySeverity,
    recentActions: data.slice(0, 10)
  }
}