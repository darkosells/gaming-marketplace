// lib/fraudDetection.ts - Enhanced Fraud Detection System

import { createClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export type FraudType = 
  | 'multiple_disputes'
  | 'suspicious_activity'
  | 'rapid_transactions'
  | 'low_pricing'
  | 'account_manipulation'
  | 'multiple_accounts'
  | 'payment_issue'
  | 'vpn_detected'
  | 'blacklisted_email'
  | 'location_anomaly'
  | 'device_mismatch'
  | 'chargeback'

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface FraudFlag {
  id: string
  user_id: string
  type: FraudType
  severity: FraudSeverity
  description: string
  status: 'active' | 'reviewed' | 'resolved' | 'false_positive'
  auto_detected: boolean
  detection_source: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  user?: {
    username: string
    email: string
  }
}

export interface FraudAlert {
  id: string
  flag_id: string
  user_id: string
  alert_type: string
  severity: FraudSeverity
  title: string
  description: string
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  user?: {
    username: string
  }
}

export interface FraudScanResult {
  users_scanned: number
  flags_created: number
  alerts_created: number
}

export interface FraudConfig {
  MAX_DISPUTES_RATIO: number
  MIN_ACCOUNT_AGE_DAYS: number
  MAX_RAPID_ORDERS: number
  SUSPICIOUS_PRICE_MULTIPLIER: number
  MIN_DELIVERY_TIME_MINUTES: number
  MAX_PAYMENT_FAILURES: number
  MAX_SAME_IP_ACCOUNTS: number
  MAX_LOGIN_COUNTRIES_24H: number
  HIGH_RISK_SCORE_THRESHOLD: number
}

// Default configuration
export const FRAUD_CONFIG: FraudConfig = {
  MAX_DISPUTES_RATIO: 0.3,           // 30% dispute rate
  MIN_ACCOUNT_AGE_DAYS: 7,           // New account threshold
  MAX_RAPID_ORDERS: 5,               // Orders per hour
  SUSPICIOUS_PRICE_MULTIPLIER: 0.3,  // 30% below market
  MIN_DELIVERY_TIME_MINUTES: 5,      // Instant delivery threshold
  MAX_PAYMENT_FAILURES: 3,           // Failures in 24h
  MAX_SAME_IP_ACCOUNTS: 2,           // Accounts sharing IP
  MAX_LOGIN_COUNTRIES_24H: 3,        // Countries in 24h
  HIGH_RISK_SCORE_THRESHOLD: 50      // Score to mark high risk
}

// ============================================================================
// FRAUD FLAG CREATION
// ============================================================================

export async function createFraudFlag(
  userId: string,
  type: FraudType,
  severity: FraudSeverity,
  description: string,
  autoDetected: boolean = false,
  detectionSource: string = 'manual'
): Promise<{ success: boolean; flagId?: string; error?: any }> {
  const supabase = createClient()

  try {
    // Check if similar active flag already exists (prevent duplicates)
    const { data: existingFlag } = await supabase
      .from('fraud_flags')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('status', 'active')
      .single()

    if (existingFlag) {
      return { success: true, flagId: existingFlag.id } // Already flagged
    }

    const { data, error } = await supabase
      .from('fraud_flags')
      .insert({
        user_id: userId,
        type,
        severity,
        description,
        auto_detected: autoDetected,
        detection_source: detectionSource,
        status: 'active'
      })
      .select('id')
      .single()

    if (error) throw error

    // Update user's fraud score
    await updateUserFraudScore(userId, severity)

    return { success: true, flagId: data.id }
  } catch (error) {
    console.error('Error creating fraud flag:', error)
    return { success: false, error }
  }
}

// ============================================================================
// FRAUD SCORE MANAGEMENT
// ============================================================================

async function updateUserFraudScore(userId: string, severity: FraudSeverity) {
  const supabase = createClient()
  
  const scoreIncrease = {
    low: 5,
    medium: 10,
    high: 20,
    critical: 50
  }

  try {
    // Get current score
    const { data: profile } = await supabase
      .from('profiles')
      .select('fraud_score')
      .eq('id', userId)
      .single()

    const currentScore = profile?.fraud_score || 0
    const newScore = currentScore + scoreIncrease[severity]

    await supabase
      .from('profiles')
      .update({
        fraud_score: newScore,
        fraud_flags_count: supabase.rpc('increment_fraud_count'),
        last_fraud_check: new Date().toISOString(),
        is_high_risk: newScore >= FRAUD_CONFIG.HIGH_RISK_SCORE_THRESHOLD
      })
      .eq('id', userId)
  } catch (error) {
    console.error('Error updating fraud score:', error)
  }
}

// ============================================================================
// REAL-TIME ALERTS
// ============================================================================

export async function fetchFraudAlerts(options?: {
  unreadOnly?: boolean
  limit?: number
}): Promise<{ data: FraudAlert[]; error: any }> {
  const supabase = createClient()

  try {
    let query = supabase
      .from('fraud_alerts')
      .select(`
        *,
        user:profiles!user_id (username)
      `)
      .eq('is_dismissed', false)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('is_read', false)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    console.error('Error fetching fraud alerts:', error)
    return { data: [], error }
  }
}

export async function markAlertRead(alertId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('fraud_alerts')
    .update({ is_read: true })
    .eq('id', alertId)

  return !error
}

export async function dismissAlert(alertId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('fraud_alerts')
    .update({ is_dismissed: true })
    .eq('id', alertId)

  return !error
}

export async function markAllAlertsRead(): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('fraud_alerts')
    .update({ is_read: true })
    .eq('is_read', false)

  return !error
}

// ============================================================================
// LOGIN TRACKING
// ============================================================================

export async function logUserLogin(
  userId: string,
  ipAddress?: string,
  userAgent?: string,
  deviceFingerprint?: string
): Promise<void> {
  const supabase = createClient()

  try {
    // Get geolocation from IP (you can use a service like ipapi.co)
    let country: string | null = null
    let city: string | null = null
    let isVpn = false

    if (ipAddress && ipAddress !== 'unknown') {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`)
        const geoData = await geoResponse.json()
        country = geoData.country_name
        city = geoData.city
        // Note: VPN detection requires a paid service
      } catch (e) {
        console.warn('Could not get geolocation:', e)
      }
    }

    // Insert login record
    await supabase.from('login_history').insert({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_fingerprint: deviceFingerprint,
      country,
      city,
      is_vpn: isVpn
    })

    // Check for suspicious patterns immediately
    await checkLoginPatterns(userId)
  } catch (error) {
    console.error('Error logging user login:', error)
  }
}

async function checkLoginPatterns(userId: string): Promise<void> {
  const supabase = createClient()

  try {
    // Check for multiple countries in 24h
    const { data: recentLogins } = await supabase
      .from('login_history')
      .select('country')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('country', 'is', null)

    const uniqueCountries = [...new Set(recentLogins?.map(l => l.country))]
    
    if (uniqueCountries.length >= FRAUD_CONFIG.MAX_LOGIN_COUNTRIES_24H) {
      await createFraudFlag(
        userId,
        'location_anomaly',
        'critical',
        `User logged in from ${uniqueCountries.length} countries in 24 hours: ${uniqueCountries.join(', ')}`,
        true,
        'login_monitor'
      )
    }

    // Check for multiple accounts from same IP
    const { data: userIPs } = await supabase
      .from('login_history')
      .select('ip_address')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (userIPs && userIPs[0]?.ip_address) {
      const { count } = await supabase
        .from('login_history')
        .select('user_id', { count: 'exact', head: true })
        .eq('ip_address', userIPs[0].ip_address)
        .neq('user_id', userId)

      if (count && count >= FRAUD_CONFIG.MAX_SAME_IP_ACCOUNTS) {
        await createFraudFlag(
          userId,
          'multiple_accounts',
          'high',
          `IP address shared with ${count} other accounts`,
          true,
          'login_monitor'
        )
      }
    }
  } catch (error) {
    console.error('Error checking login patterns:', error)
  }
}

// ============================================================================
// PAYMENT FAILURE TRACKING
// ============================================================================

export async function logPaymentFailure(
  userId: string,
  orderId: string | null,
  amount: number,
  failureReason: string,
  paymentMethod: string,
  ipAddress?: string,
  cardLastFour?: string
): Promise<void> {
  const supabase = createClient()

  try {
    await supabase.from('payment_failures').insert({
      user_id: userId,
      order_id: orderId,
      amount,
      failure_reason: failureReason,
      payment_method: paymentMethod,
      ip_address: ipAddress,
      card_last_four: cardLastFour
    })

    // Check for pattern
    const { count } = await supabase
      .from('payment_failures')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (count && count >= FRAUD_CONFIG.MAX_PAYMENT_FAILURES) {
      await createFraudFlag(
        userId,
        'payment_issue',
        'high',
        `${count} payment failures in 24 hours`,
        true,
        'payment_monitor'
      )
    }
  } catch (error) {
    console.error('Error logging payment failure:', error)
  }
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

export async function checkEmailForFraud(email: string): Promise<{
  isSuspicious: boolean
  reason?: string
}> {
  const supabase = createClient()

  try {
    const domain = email.split('@')[1]?.toLowerCase()

    if (!domain) {
      return { isSuspicious: true, reason: 'Invalid email format' }
    }

    // Check against blacklist
    const { data: blacklisted } = await supabase
      .from('fraud_blacklist')
      .select('reason')
      .eq('type', 'email_domain')
      .eq('value', domain)
      .single()

    if (blacklisted) {
      return { isSuspicious: true, reason: blacklisted.reason || 'Blacklisted email domain' }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /^[a-z]{1,3}\d{5,}@/i,  // Short letters + many numbers
      /^test\d*@/i,           // test accounts
      /^fake\d*@/i,           // fake accounts
      /\+.*@/,                // Plus addressing (could be legitimate but watch)
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        return { isSuspicious: true, reason: 'Suspicious email pattern' }
      }
    }

    return { isSuspicious: false }
  } catch (error) {
    console.error('Error checking email for fraud:', error)
    return { isSuspicious: false }
  }
}

// ============================================================================
// MANUAL FRAUD SCAN
// ============================================================================

export async function runManualFraudScan(
  adminId: string,
  users: any[],
  orders: any[],
  listings: any[],
  activeDisputes: any[]
): Promise<{ flagsCreated: number; errors: string[] }> {
  const supabase = createClient()
  let flagsCreated = 0
  const errors: string[] = []

  try {
    // Log scan start
    const { data: scanLog } = await supabase
      .from('fraud_scan_log')
      .insert({
        scan_type: 'manual',
        triggered_by: adminId,
        status: 'running'
      })
      .select('id')
      .single()

    const scanId = scanLog?.id

    for (const user of users) {
      try {
        const userOrders = orders.filter(o => o.buyer_id === user.id || o.seller_id === user.id)
        const userDisputes = activeDisputes.filter(d => d.buyer_id === user.id || d.seller_id === user.id)
        const userListings = listings.filter(l => l.seller_id === user.id)

        // Pattern 1: High dispute ratio
        if (userOrders.length >= 3) {
          const disputeRatio = userDisputes.length / userOrders.length
          if (disputeRatio > FRAUD_CONFIG.MAX_DISPUTES_RATIO) {
            const result = await createFraudFlag(
              user.id,
              'multiple_disputes',
              'high',
              `Dispute ratio: ${(disputeRatio * 100).toFixed(1)}% (${userDisputes.length}/${userOrders.length} orders)`,
              true,
              'manual_scan'
            )
            if (result.success && result.flagId) flagsCreated++
          }
        }

        // Pattern 2: New account high activity
        const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (accountAgeDays < FRAUD_CONFIG.MIN_ACCOUNT_AGE_DAYS && userOrders.length > 10) {
          const result = await createFraudFlag(
            user.id,
            'suspicious_activity',
            'medium',
            `New account (${Math.floor(accountAgeDays)} days) with ${userOrders.length} orders`,
            true,
            'manual_scan'
          )
          if (result.success && result.flagId) flagsCreated++
        }

        // Pattern 3: Rapid transactions
        const recentOrders = userOrders.filter(o => {
          const orderTime = new Date(o.created_at).getTime()
          return Date.now() - orderTime < 60 * 60 * 1000
        })
        if (recentOrders.length >= FRAUD_CONFIG.MAX_RAPID_ORDERS) {
          const result = await createFraudFlag(
            user.id,
            'rapid_transactions',
            'high',
            `${recentOrders.length} orders in the last hour`,
            true,
            'manual_scan'
          )
          if (result.success && result.flagId) flagsCreated++
        }

        // Pattern 4: Suspiciously low pricing
        if (userListings.length > 0) {
          const gameListings: { [key: string]: number[] } = {}
          listings.forEach(l => {
            if (!gameListings[l.game]) gameListings[l.game] = []
            gameListings[l.game].push(parseFloat(l.price))
          })

          for (const listing of userListings) {
            const gamePrices = gameListings[listing.game] || []
            if (gamePrices.length >= 3) {
              const avgPrice = gamePrices.reduce((sum, p) => sum + p, 0) / gamePrices.length
              const listingPrice = parseFloat(listing.price)
              if (listingPrice < avgPrice * FRAUD_CONFIG.SUSPICIOUS_PRICE_MULTIPLIER) {
                const result = await createFraudFlag(
                  user.id,
                  'low_pricing',
                  'medium',
                  `Listing "${listing.title}" at $${listingPrice} (${((listingPrice / avgPrice) * 100).toFixed(0)}% of avg $${avgPrice.toFixed(2)})`,
                  true,
                  'manual_scan'
                )
                if (result.success && result.flagId) flagsCreated++
              }
            }
          }
        }

        // Pattern 5: Instant deliveries
        const instantDeliveries = userOrders.filter(o => {
          if (!o.delivered_at || o.seller_id !== user.id) return false
          const deliveryTime = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 1000 / 60
          return deliveryTime < FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES
        })
        if (instantDeliveries.length >= 3) {
          const result = await createFraudFlag(
            user.id,
            'account_manipulation',
            'medium',
            `${instantDeliveries.length} orders delivered in under ${FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES} minutes`,
            true,
            'manual_scan'
          )
          if (result.success && result.flagId) flagsCreated++
        }

        // Pattern 6: Check for blacklisted email
        if (user.email) {
          const emailCheck = await checkEmailForFraud(user.email)
          if (emailCheck.isSuspicious) {
            const result = await createFraudFlag(
              user.id,
              'blacklisted_email',
              'high',
              `Suspicious email: ${emailCheck.reason}`,
              true,
              'manual_scan'
            )
            if (result.success && result.flagId) flagsCreated++
          }
        }

      } catch (userError: any) {
        errors.push(`Error scanning user ${user.id}: ${userError.message}`)
      }
    }

    // Update scan log
    if (scanId) {
      await supabase
        .from('fraud_scan_log')
        .update({
          users_scanned: users.length,
          flags_created: flagsCreated,
          alerts_created: flagsCreated,
          completed_at: new Date().toISOString(),
          status: 'completed'
        })
        .eq('id', scanId)
    }

  } catch (error: any) {
    errors.push(`Scan error: ${error.message}`)
  }

  return { flagsCreated, errors }
}

// ============================================================================
// DATABASE TRIGGER SCAN (calls the database function)
// ============================================================================

export async function runDatabaseFraudScan(adminId?: string): Promise<FraudScanResult | null> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .rpc('run_full_fraud_scan', { triggered_by_id: adminId || null })

    if (error) throw error

    return data?.[0] || null
  } catch (error) {
    console.error('Error running database fraud scan:', error)
    return null
  }
}

// ============================================================================
// BLACKLIST MANAGEMENT
// ============================================================================

export async function addToBlacklist(
  type: 'ip' | 'email_domain' | 'device_fingerprint' | 'card_bin',
  value: string,
  reason: string,
  addedBy: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('fraud_blacklist')
      .insert({
        type,
        value: value.toLowerCase(),
        reason,
        added_by: addedBy
      })

    return !error
  } catch (error) {
    console.error('Error adding to blacklist:', error)
    return false
  }
}

export async function checkBlacklist(
  type: 'ip' | 'email_domain' | 'device_fingerprint' | 'card_bin',
  value: string
): Promise<{ isBlacklisted: boolean; reason?: string }> {
  const supabase = createClient()

  try {
    const { data } = await supabase
      .from('fraud_blacklist')
      .select('reason')
      .eq('type', type)
      .eq('value', value.toLowerCase())
      .single()

    return {
      isBlacklisted: !!data,
      reason: data?.reason
    }
  } catch {
    return { isBlacklisted: false }
  }
}

// ============================================================================
// FRAUD STATISTICS
// ============================================================================

export async function getFraudStats(): Promise<{
  totalFlags: number
  activeFlags: number
  criticalFlags: number
  highRiskUsers: number
  recentAlerts: number
  flagsByType: Record<string, number>
}> {
  const supabase = createClient()

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

    // Flags by type
    const { data: flagTypes } = await supabase
      .from('fraud_flags')
      .select('type')
      .eq('status', 'active')

    const flagsByType: Record<string, number> = {}
    flagTypes?.forEach(f => {
      flagsByType[f.type] = (flagsByType[f.type] || 0) + 1
    })

    return {
      totalFlags: totalFlags || 0,
      activeFlags: activeFlags || 0,
      criticalFlags: criticalFlags || 0,
      highRiskUsers: highRiskUsers || 0,
      recentAlerts: recentAlerts || 0,
      flagsByType
    }
  } catch (error) {
    console.error('Error getting fraud stats:', error)
    return {
      totalFlags: 0,
      activeFlags: 0,
      criticalFlags: 0,
      highRiskUsers: 0,
      recentAlerts: 0,
      flagsByType: {}
    }
  }
}