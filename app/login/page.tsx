'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'

// Rate limit configuration
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMinutes: 15,
  lockMinutes: 15
}

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Rate limiting states
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [lockCountdown, setLockCountdown] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Check if user just verified their email
    if (searchParams.get('verified') === 'true') {
      setSuccess('✅ Email verified! You can now login.')
    }
  }, [searchParams])

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
        setAttemptsRemaining(LOGIN_RATE_LIMIT.maxAttempts)
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

  // Check rate limit status on mount and when email changes
  const checkRateLimit = async (emailToCheck: string) => {
    if (!emailToCheck) return
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: emailToCheck.toLowerCase(),
        p_action_type: 'login',
        p_max_attempts: LOGIN_RATE_LIMIT.maxAttempts,
        p_window_minutes: LOGIN_RATE_LIMIT.windowMinutes,
        p_lock_minutes: LOGIN_RATE_LIMIT.lockMinutes
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

  // Record failed attempt
  const recordFailedAttempt = async (emailToRecord: string) => {
    try {
      const { data, error } = await supabase.rpc('record_rate_limit_attempt', {
        p_identifier: emailToRecord.toLowerCase(),
        p_action_type: 'login',
        p_max_attempts: LOGIN_RATE_LIMIT.maxAttempts,
        p_window_minutes: LOGIN_RATE_LIMIT.windowMinutes,
        p_lock_minutes: LOGIN_RATE_LIMIT.lockMinutes,
        p_success: false,
        p_metadata: {}
      })

      if (error) {
        console.error('Record attempt error:', error)
        return
      }

      if (data) {
        setAttemptsRemaining(data.attempts_remaining)
        if (data.locked_until) {
          setLockedUntil(new Date(data.locked_until))
        }
      }
    } catch (err) {
      console.error('Record attempt failed:', err)
    }
  }

  // Clear rate limit on success
  const clearRateLimit = async (emailToClear: string) => {
    try {
      await supabase.rpc('record_rate_limit_attempt', {
        p_identifier: emailToClear.toLowerCase(),
        p_action_type: 'login',
        p_max_attempts: LOGIN_RATE_LIMIT.maxAttempts,
        p_window_minutes: LOGIN_RATE_LIMIT.windowMinutes,
        p_lock_minutes: LOGIN_RATE_LIMIT.lockMinutes,
        p_success: true,
        p_metadata: {}
      })
    } catch (err) {
      console.error('Clear rate limit failed:', err)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password')
      setLoading(false)
      return
    }

    if (email.length > 100) {
      setError('Email is too long')
      setLoading(false)
      return
    }

    if (password.length > 72) {
      setError('Password is too long')
      setLoading(false)
      return
    }

    // Check rate limit before attempting login
    try {
      const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: email.toLowerCase(),
        p_action_type: 'login',
        p_max_attempts: LOGIN_RATE_LIMIT.maxAttempts,
        p_window_minutes: LOGIN_RATE_LIMIT.windowMinutes,
        p_lock_minutes: LOGIN_RATE_LIMIT.lockMinutes
      })

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError)
      } else if (rateLimitData && !rateLimitData.allowed) {
        setLockedUntil(new Date(rateLimitData.locked_until))
        setAttemptsRemaining(0)
        setError('Too many failed attempts. Please try again later.')
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Rate limit check failed:', err)
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Record failed attempt
        await recordFailedAttempt(email)
        throw authError
      }

      // Get user profile to check role and email verification
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_admin, email_verified, username')
        .eq('id', authData.user.id)
        .single()

      if (profileError) throw profileError

      // Check if email is verified
      if (!profile.email_verified) {
        // Sign them out and redirect to verification
        await supabase.auth.signOut()
        setError('Please verify your email before logging in.')
        setTimeout(() => {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
        }, 1500)
        return
      }

      // Clear rate limit on successful login
      await clearRateLimit(email)

      // Redirect based on role
      if (profile.is_admin) {
        router.push('/admin')
      } else if (profile.role === 'vendor') {
        router.push('/dashboard')
      } else {
        router.push('/customer-dashboard')
      }

      router.refresh()
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Provide user-friendly error messages
      if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email before logging in')
      } else {
        setError(error.message || 'Failed to login')
      }
    } finally {
      setLoading(false)
    }
  }

  // Check rate limit when email field loses focus
  const handleEmailBlur = () => {
    if (email) {
      checkRateLimit(email)
    }
  }

  return (
    <>
      {/* Fixed Background Layer - Covers entire viewport */}
      <div className="fixed inset-0 bg-slate-950 z-0">
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

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
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
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                🎮 Welcome Back
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Sign In to <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Nashflare</span>
            </h1>
            <p className="text-gray-400">Access your gaming marketplace</p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
            <form onSubmit={handleLogin} className="space-y-5">
              {success && (
                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
                  <p className="text-green-200 text-sm flex items-center gap-2">
                    <span>✓</span> {success}
                  </p>
                </div>
              )}

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
                      <p className="text-orange-200 text-sm font-medium">Account Temporarily Locked</p>
                      <p className="text-orange-300/70 text-xs">
                        Try again in <span className="font-mono font-bold">{lockCountdown}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attempts Remaining Warning */}
              {attemptsRemaining !== null && attemptsRemaining > 0 && attemptsRemaining <= 2 && !lockedUntil && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3">
                  <p className="text-yellow-200 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout</span>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Email</label>
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
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Password</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                    required
                    maxLength={72}
                    disabled={!!lockedUntil}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/10 bg-slate-800 text-purple-500 focus:ring-purple-500/50 focus:ring-2"
                  />
                  <span className="ml-2 group-hover:text-white transition">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 transition">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !!lockedUntil}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : lockedUntil ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Locked - Wait {lockCountdown}
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                  Sign up
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
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}