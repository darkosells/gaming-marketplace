'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

// Rate limit configuration
const PASSWORD_RESET_RATE_LIMIT = {
  maxAttempts: 3,      // Max 3 reset requests per hour per email
  windowMinutes: 60,
  lockMinutes: 60
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Rate limiting states
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [lockCountdown, setLockCountdown] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClient()

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) {
      setLockCountdown('')
      return
    }

    const updateCountdown = () => {
      const now = new Date()
      const diff = lockedUntil.getTime() - now.getTime()
      
      if (diff <= 0) {
        setLockedUntil(null)
        setLockCountdown('')
        setAttemptsRemaining(PASSWORD_RESET_RATE_LIMIT.maxAttempts)
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setLockCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  // Check rate limit when email changes
  const checkRateLimit = async (emailToCheck: string) => {
    if (!emailToCheck) return
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: `reset_${emailToCheck.toLowerCase()}`,
        p_action_type: 'password_reset',
        p_max_attempts: PASSWORD_RESET_RATE_LIMIT.maxAttempts,
        p_window_minutes: PASSWORD_RESET_RATE_LIMIT.windowMinutes,
        p_lock_minutes: PASSWORD_RESET_RATE_LIMIT.lockMinutes
      })

      if (error) {
        console.error('Rate limit check error:', error)
        return
      }

      if (data) {
        setAttemptsRemaining(data.attempts_remaining)
        if (data.locked_until) {
          setLockedUntil(new Date(data.locked_until))
        } else {
          setLockedUntil(null)
        }
      }
    } catch (err) {
      console.error('Rate limit check failed:', err)
    }
  }

  // Record password reset attempt
  const recordResetAttempt = async (emailToRecord: string, success: boolean) => {
    try {
      const { data, error } = await supabase.rpc('record_rate_limit_attempt', {
        p_identifier: `reset_${emailToRecord.toLowerCase()}`,
        p_action_type: 'password_reset',
        p_max_attempts: PASSWORD_RESET_RATE_LIMIT.maxAttempts,
        p_window_minutes: PASSWORD_RESET_RATE_LIMIT.windowMinutes,
        p_lock_minutes: PASSWORD_RESET_RATE_LIMIT.lockMinutes,
        p_success: success,
        p_metadata: {}
      })

      if (error) {
        console.error('Record attempt error:', error)
        return
      }

      if (data && !success) {
        setAttemptsRemaining(data.attempts_remaining)
        if (data.locked_until) {
          setLockedUntil(new Date(data.locked_until))
        }
      }
    } catch (err) {
      console.error('Record attempt failed:', err)
    }
  }

  const handleEmailBlur = () => {
    if (email) {
      checkRateLimit(email)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check rate limit before attempting
    try {
      const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: `reset_${email.toLowerCase()}`,
        p_action_type: 'password_reset',
        p_max_attempts: PASSWORD_RESET_RATE_LIMIT.maxAttempts,
        p_window_minutes: PASSWORD_RESET_RATE_LIMIT.windowMinutes,
        p_lock_minutes: PASSWORD_RESET_RATE_LIMIT.lockMinutes
      })

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError)
      } else if (rateLimitData && !rateLimitData.allowed) {
        setLockedUntil(new Date(rateLimitData.locked_until))
        setAttemptsRemaining(0)
        setError('Too many reset requests. Please try again later.')
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Rate limit check failed:', err)
    }

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        // Record failed attempt
        await recordResetAttempt(email, false)
        throw new Error(data.error || 'Failed to send reset code')
      }

      // Record successful attempt (still counts toward rate limit to prevent email bombing)
      await recordResetAttempt(email, false) // We use false here because we still want to count it

      // Redirect to reset password page with email
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center space-x-3 mb-8 group">
          <div className="relative">
            <Image
              src="/logo6.svg"
              alt="Nashflare"
              width={48}
              height={48}
              className="transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"
              priority
            />
            <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white tracking-tight">
              Nash<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">flare</span>
            </span>
            <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase -mt-1">Marketplace</span>
          </div>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Forgot <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Password?</span>
          </h1>
          <p className="text-gray-400">No worries! We'll send you a reset code</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-200 text-sm flex items-center gap-2">
                  <span>❌</span> {error}
                </p>
              </div>
            )}

            {/* Rate Limit Warning */}
            {lockedUntil && (
              <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-orange-200 text-sm font-medium">Too Many Requests</p>
                    <p className="text-orange-300/70 text-xs">
                      Try again in <span className="font-mono font-bold">{lockCountdown}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Attempts Remaining Warning */}
            {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 1 && !lockedUntil && (
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3">
                <p className="text-yellow-200 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Last reset request before temporary block</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Email Address</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleEmailBlur}
                  placeholder="your@email.com"
                  className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                  maxLength={100}
                  disabled={!!lockedUntil}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">We'll send a 6-digit verification code to this email</p>
            </div>

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending Code...
                </span>
              ) : lockedUntil ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Blocked - Wait {lockCountdown}
                </span>
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Remember your password?{' '}
              <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-purple-400 transition flex items-center justify-center gap-2">
            <span>←</span> Back to Home
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="text-green-400">🔒</span>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-400">✓</span>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-purple-400">⚡</span>
            <span>Fast</span>
          </div>
        </div>
      </div>
    </div>
  )
}