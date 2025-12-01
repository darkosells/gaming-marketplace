// lib/auditLog.ts - FIXED VERSION

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
      
      // Try to get IP from API
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        ipAddress = ipData.ip
      } catch {
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
 * FIXED: Now queries admin_actions table directly with join to profiles
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
  
  try {
    // Query admin_actions table directly with join to profiles for admin info
    let query = supabase
      .from('admin_actions')
      .select(`
        *,
        admin:profiles!admin_id (
          username,
          email
        )
      `)
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

    // Transform data to include admin_username and admin_email at top level
    const transformedData = (data || []).map(log => ({
      ...log,
      admin_username: log.admin?.username || 'Unknown',
      admin_email: log.admin?.email || ''
    }))

    return { data: transformedData, error: null }
  } catch (error) {
    console.error('Error in fetchAuditLogs:', error)
    return { data: [], error }
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(adminId?: string) {
  const supabase = createClient()
  
  try {
    let query = supabase
      .from('admin_actions')
      .select('action_type, severity, created_at')
    
    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    const { data, error } = await query

    if (error || !data) {
      console.error('Error fetching audit stats:', error)
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
      if (action.severity) {
        actionsBySeverity[action.severity] = (actionsBySeverity[action.severity] || 0) + 1
      }
    })

    return {
      totalActions: data.length,
      actionsByType,
      actionsBySeverity,
      recentActions: data.slice(0, 10)
    }
  } catch (error) {
    console.error('Error in getAuditStats:', error)
    return {
      totalActions: 0,
      actionsByType: {},
      actionsBySeverity: {},
      recentActions: []
    }
  }
}

/**
 * Simple wrapper for quick audit logging
 * FIXED: Now writes to admin_actions table (same as logAdminAction)
 */
export async function logAdminActionSimple(
  adminId: string,
  actionType: string,
  details: string
) {
  const supabase = createClient()
  
  try {
    // Get client IP and user agent
    let ipAddress = 'unknown'
    let userAgent = 'unknown'
    
    if (typeof window !== 'undefined') {
      userAgent = navigator.userAgent
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        ipAddress = ipData.ip
      } catch {
        ipAddress = 'unavailable'
      }
    }

    // Determine target type from action type
    let targetType: TargetType | null = null
    if (actionType.includes('user') || actionType.includes('ban')) targetType = 'user'
    else if (actionType.includes('order') || actionType.includes('refund')) targetType = 'order'
    else if (actionType.includes('listing')) targetType = 'listing'
    else if (actionType.includes('verification') || actionType.includes('vendor')) targetType = 'verification'
    else if (actionType.includes('withdrawal')) targetType = 'withdrawal'
    else if (actionType.includes('review')) targetType = 'review'
    else if (actionType.includes('dispute')) targetType = 'dispute'

    // Determine severity
    let severity: SeverityLevel = 'low'
    if (actionType.includes('delete') || actionType.includes('ban') || actionType.includes('reject')) {
      severity = 'high'
    } else if (actionType.includes('approve') || actionType.includes('refund')) {
      severity = 'high'
    } else if (actionType.includes('edit')) {
      severity = 'medium'
    }
    if (actionType.includes('bulk')) {
      severity = 'critical'
    }

    const { error } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: adminId,
        action_type: actionType,
        target_type: targetType,
        reason: details,
        ip_address: ipAddress,
        user_agent: userAgent,
        severity: severity,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error logging admin action:', error.message, error.details, error.hint, error.code)
    }
  } catch (error) {
    console.error('Error in logAdminActionSimple:', error)
  }
}