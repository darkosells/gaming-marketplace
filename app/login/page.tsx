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

// Session storage key for "Remember Me" feature
const SESSION_PERSIST_KEY = 'nashflare_session_persist'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
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

  // Check for session persistence on mount (handle "Remember Me" feature)
  useEffect(() => {
    const checkSessionPersistence = async () => {
      // If there's no persistence flag in sessionStorage but user is logged in,
      // it means browser was closed and reopened without "Remember Me"
      const persistFlag = sessionStorage.getItem(SESSION_PERSIST_KEY)
      
      if (!persistFlag) {
        // Check if user chose not to be remembered (stored in localStorage)
        const rememberChoice = localStorage.getItem(SESSION_PERSIST_KEY)
        
        if (rememberChoice === 'false') {
          // User didn't want to be remembered and this is a new session
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            // Sign them out since they didn't want to be remembered
            await supabase.auth.signOut()
            localStorage.removeItem(SESSION_PERSIST_KEY)
          }
        }
      }
    }

    checkSessionPersistence()
  }, [supabase.auth])

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

  // Detect Caps Lock
  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'))
    }
  }

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

      // Handle "Remember Me" functionality
      if (rememberMe) {
        // User wants to be remembered - store flag in both storages
        localStorage.setItem(SESSION_PERSIST_KEY, 'true')
        sessionStorage.setItem(SESSION_PERSIST_KEY, 'true')
      } else {
        // User doesn't want to be remembered
        // Store 'false' in localStorage so we know to check on next visit
        localStorage.setItem(SESSION_PERSIST_KEY, 'false')
        // Store flag in sessionStorage - when browser closes, this disappears
        sessionStorage.setItem(SESSION_PERSIST_KEY, 'true')
      }

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
      {/* Fixed Background Layer - Optimized for performance */}
      <div className="fixed inset-0 bg-slate-950 z-0 overflow-hidden">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Static Gradient Orbs - No blur, no animation */}
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(147,51,234,0.5) 0%, transparent 70%)',
            transform: 'translateZ(0)',
          }}
        />
        <div 
          className="absolute top-3/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ 
            background: 'radial-gradient(circle, rgba(219,39,119,0.5) 0%, transparent 70%)',
            transform: 'translateZ(0)',
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ 
            background: 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)',
            transform: 'translateZ(0)',
          }}
        />
        
        {/* Static Particles - No animation */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/40 rounded-full"></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/40 rounded-full"></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/30 rounded-full"></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/35 rounded-full"></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/50 rounded-full"></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/35 rounded-full"></div>
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
                className="transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                priority
              />
              <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-300"></div>
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

          <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-colors duration-200">
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
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-200"></div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="your@email.com"
                    className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors duration-200"
                    required
                    maxLength={100}
                    autoComplete="email"
                    inputMode="email"
                    disabled={!!lockedUntil}
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2 text-sm">Password</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-200"></div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyEvent}
                    onKeyUp={handleKeyEvent}
                    placeholder="••••••••"
                    className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors duration-200"
                    required
                    maxLength={72}
                    autoComplete="current-password"
                    disabled={!!lockedUntil}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Caps Lock Warning */}
                {capsLockOn && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Caps Lock is on</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-400 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-white/10 bg-slate-800 text-purple-500 focus:ring-purple-500/50 focus:ring-2"
                  />
                  <span className="ml-2 group-hover:text-white transition-colors duration-200">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300 transition-colors duration-200">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !!lockedUntil}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors duration-200">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-gray-400 hover:text-purple-400 transition-colors duration-200 flex items-center justify-center gap-2">
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