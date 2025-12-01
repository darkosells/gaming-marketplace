// lib/userIntelligence.ts - User Intelligence Collection & Analysis

import { createClient } from '@/lib/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface UserMetadata {
  id: string
  user_id: string
  signup_ip: string | null
  signup_country: string | null
  signup_city: string | null
  signup_device_fingerprint: string | null
  signup_user_agent: string | null
  signup_referrer: string | null
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: string[]
  email_domain: string
  is_disposable_email: boolean
  email_domain_reputation: string
  total_logins: number
  unique_ips_count: number
  unique_devices_count: number
  unique_countries_count: number
  last_login_at: string | null
  last_login_ip: string | null
  last_login_country: string | null
  has_vpn_usage: boolean
  has_proxy_usage: boolean
  has_tor_usage: boolean
  has_multiple_accounts_same_ip: boolean
  has_multiple_accounts_same_device: boolean
  admin_notes: string | null
}

export interface UserSession {
  id: string
  user_id: string
  ip_address: string
  country: string | null
  city: string | null
  timezone: string | null
  device_fingerprint: string | null
  user_agent: string
  browser_name: string | null
  os_name: string | null
  device_type: string | null
  is_vpn: boolean
  is_proxy: boolean
  referrer: string | null
  created_at: string
}

export interface RelatedAccount {
  id: string
  related_user_id: string
  relation_type: 'same_ip' | 'same_device' | 'same_email_pattern'
  confidence_score: number
  evidence: any
  status: 'detected' | 'confirmed' | 'dismissed'
  related_user?: {
    username: string
    email: string
    created_at: string
    is_banned: boolean
  }
}

export interface UserIntelligence {
  profile: any
  metadata: UserMetadata | null
  recentSessions: UserSession[]
  relatedAccounts: RelatedAccount[]
  fraudFlags: any[]
  orderStats: {
    total: number
    completed: number
    disputed: number
    asVendor: number
    asBuyer: number
  }
}

// ============================================================================
// DEVICE FINGERPRINTING (Basic, privacy-respecting)
// ============================================================================

export function generateDeviceFingerprint(): string {
  const components: string[] = []

  // Screen info
  if (typeof window !== 'undefined') {
    components.push(`${window.screen.width}x${window.screen.height}`)
    components.push(`${window.screen.colorDepth}`)
    components.push(window.devicePixelRatio?.toString() || '1')
  }

  // Navigator info
  if (typeof navigator !== 'undefined') {
    components.push(navigator.language || '')
    components.push(navigator.hardwareConcurrency?.toString() || '')
    components.push(navigator.platform || '')
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '')
  }

  // Create hash
  const fingerprint = components.join('|')
  return hashString(fingerprint)
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

// ============================================================================
// BROWSER/DEVICE DETECTION
// ============================================================================

export function parseUserAgent(ua: string): {
  browser: string
  browserVersion: string
  os: string
  osVersion: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
} {
  let browser = 'Unknown'
  let browserVersion = ''
  let os = 'Unknown'
  let osVersion = ''
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'

  // Browser detection
  if (ua.includes('Firefox/')) {
    browser = 'Firefox'
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Edg/')) {
    browser = 'Edge'
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome'
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] || ''
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari'
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] || ''
  }

  // OS detection
  if (ua.includes('Windows NT 10')) {
    os = 'Windows'
    osVersion = '10/11'
  } else if (ua.includes('Windows')) {
    os = 'Windows'
  } else if (ua.includes('Mac OS X')) {
    os = 'macOS'
    osVersion = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
  } else if (ua.includes('iPhone')) {
    os = 'iOS'
    deviceType = 'mobile'
  } else if (ua.includes('iPad')) {
    os = 'iOS'
    deviceType = 'tablet'
  } else if (ua.includes('Android')) {
    os = 'Android'
    deviceType = ua.includes('Mobile') ? 'mobile' : 'tablet'
  } else if (ua.includes('Linux')) {
    os = 'Linux'
  }

  // Mobile detection fallback
  if (ua.includes('Mobile') || ua.includes('Android')) {
    if (deviceType === 'desktop') deviceType = 'mobile'
  }

  return { browser, browserVersion, os, osVersion, deviceType }
}

// ============================================================================
// IP & GEOLOCATION
// ============================================================================

export async function getClientIP(): Promise<string> {
  try {
    // Use a free IP detection service
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}

export async function getIPGeolocation(ip: string): Promise<{
  country: string | null
  countryCode: string | null
  city: string | null
  region: string | null
  timezone: string | null
  isp: string | null
  isVpn: boolean
  isProxy: boolean
}> {
  try {
    // Using ipapi.co free tier (1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    const data = await response.json()

    return {
      country: data.country_name || null,
      countryCode: data.country_code || null,
      city: data.city || null,
      region: data.region || null,
      timezone: data.timezone || null,
      isp: data.org || null,
      isVpn: false, // Free API doesn't detect VPN
      isProxy: false
    }
  } catch {
    return {
      country: null,
      countryCode: null,
      city: null,
      region: null,
      timezone: null,
      isp: null,
      isVpn: false,
      isProxy: false
    }
  }
}

// ============================================================================
// SESSION TRACKING
// ============================================================================

export async function trackUserSession(userId: string): Promise<void> {
  const supabase = createClient()

  try {
    const ip = await getClientIP()
    const geo = await getIPGeolocation(ip)
    const fingerprint = generateDeviceFingerprint()
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const parsed = parseUserAgent(ua)
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Create session record
    await supabase.from('user_sessions').insert({
      user_id: userId,
      ip_address: ip,
      country: geo.country,
      country_code: geo.countryCode,
      city: geo.city,
      region: geo.region,
      timezone: timezone,
      isp: geo.isp,
      is_vpn: geo.isVpn,
      is_proxy: geo.isProxy,
      device_fingerprint: fingerprint,
      user_agent: ua,
      browser_name: parsed.browser,
      browser_version: parsed.browserVersion,
      os_name: parsed.os,
      os_version: parsed.osVersion,
      device_type: parsed.deviceType,
      language: typeof navigator !== 'undefined' ? navigator.language : null,
      referrer: referrer || null,
      landing_page: typeof window !== 'undefined' ? window.location.pathname : null
    })

    // Update user metadata
    await supabase.rpc('update_user_login_metadata', {
      p_user_id: userId,
      p_ip_address: ip,
      p_country: geo.country,
      p_city: geo.city,
      p_device_fingerprint: fingerprint,
      p_user_agent: ua,
      p_is_vpn: geo.isVpn
    })

    // Find related accounts by IP
    await supabase.rpc('find_related_accounts_by_ip', {
      p_user_id: userId
    })

  } catch (error) {
    console.error('Error tracking user session:', error)
  }
}

// ============================================================================
// SIGNUP TRACKING
// ============================================================================

export async function trackUserSignup(userId: string): Promise<void> {
  const supabase = createClient()

  try {
    const ip = await getClientIP()
    const geo = await getIPGeolocation(ip)
    const fingerprint = generateDeviceFingerprint()
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    
    // Get UTM parameters
    const urlParams = typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search) 
      : new URLSearchParams()

    // Update user metadata with signup info
    await supabase.from('user_metadata').upsert({
      user_id: userId,
      signup_ip: ip,
      signup_country: geo.country,
      signup_city: geo.city,
      signup_device_fingerprint: fingerprint,
      signup_user_agent: ua,
      signup_referrer: referrer || null,
      signup_utm_source: urlParams.get('utm_source'),
      signup_utm_medium: urlParams.get('utm_medium'),
      signup_utm_campaign: urlParams.get('utm_campaign')
    }, { onConflict: 'user_id' })

    // Update profiles with signup IP
    await supabase.from('profiles').update({
      signup_ip: ip
    }).eq('id', userId)

    // Track first session
    await trackUserSession(userId)

  } catch (error) {
    console.error('Error tracking user signup:', error)
  }
}

// ============================================================================
// ADMIN: FETCH USER INTELLIGENCE
// ============================================================================

export async function fetchUserIntelligence(userId: string): Promise<UserIntelligence | null> {
  const supabase = createClient()

  try {
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) return null

    // Fetch metadata
    const { data: metadata } = await supabase
      .from('user_metadata')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch recent sessions (last 20)
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

    // Fetch order stats
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

    return {
      profile,
      metadata,
      recentSessions: sessions || [],
      relatedAccounts: related || [],
      fraudFlags: flags || [],
      orderStats
    }
  } catch (error) {
    console.error('Error fetching user intelligence:', error)
    return null
  }
}

// ============================================================================
// ADMIN: UPDATE ADMIN NOTES
// ============================================================================

export async function updateAdminNotes(
  userId: string, 
  notes: string, 
  adminId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('user_metadata')
      .update({
        admin_notes: notes,
        admin_notes_updated_by: adminId,
        admin_notes_updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    return !error
  } catch {
    return false
  }
}

// ============================================================================
// ADMIN: CALCULATE RISK SCORE
// ============================================================================

export function calculateRiskScore(intel: UserIntelligence): {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: { factor: string; impact: number }[]
} {
  const factors: { factor: string; impact: number }[] = []
  let score = 0

  const metadata = intel.metadata

  // Email factors
  if (metadata?.is_disposable_email) {
    factors.push({ factor: 'Disposable email address', impact: 30 })
    score += 30
  }

  // VPN/Proxy usage
  if (metadata?.has_vpn_usage) {
    factors.push({ factor: 'VPN usage detected', impact: 10 })
    score += 10
  }
  if (metadata?.has_proxy_usage) {
    factors.push({ factor: 'Proxy usage detected', impact: 15 })
    score += 15
  }
  if (metadata?.has_tor_usage) {
    factors.push({ factor: 'Tor usage detected', impact: 25 })
    score += 25
  }

  // Multiple accounts
  if (metadata?.has_multiple_accounts_same_ip) {
    factors.push({ factor: 'Multiple accounts from same IP', impact: 30 })
    score += 30
  }
  if (metadata?.has_multiple_accounts_same_device) {
    factors.push({ factor: 'Multiple accounts from same device', impact: 40 })
    score += 40
  }

  // High device/IP count
  if ((metadata?.unique_ips_count || 0) > 10) {
    factors.push({ factor: `High IP count (${metadata?.unique_ips_count})`, impact: 15 })
    score += 15
  }
  if ((metadata?.unique_devices_count || 0) > 5) {
    factors.push({ factor: `High device count (${metadata?.unique_devices_count})`, impact: 20 })
    score += 20
  }
  if ((metadata?.unique_countries_count || 0) > 3) {
    factors.push({ factor: `Multiple countries (${metadata?.unique_countries_count})`, impact: 25 })
    score += 25
  }

  // Dispute ratio
  if (intel.orderStats.total >= 3) {
    const disputeRatio = intel.orderStats.disputed / intel.orderStats.total
    if (disputeRatio > 0.3) {
      factors.push({ factor: `High dispute ratio (${(disputeRatio * 100).toFixed(0)}%)`, impact: 35 })
      score += 35
    }
  }

  // Active fraud flags
  const activeFlags = intel.fraudFlags.filter(f => f.status === 'active')
  if (activeFlags.length > 0) {
    const flagImpact = activeFlags.length * 15
    factors.push({ factor: `${activeFlags.length} active fraud flag(s)`, impact: flagImpact })
    score += flagImpact
  }

  // Determine level
  let level: 'low' | 'medium' | 'high' | 'critical'
  if (score >= 70) level = 'critical'
  else if (score >= 50) level = 'high'
  else if (score >= 25) level = 'medium'
  else level = 'low'

  return { score, level, factors }
}