'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email'
import Image from 'next/image'

// Rate limit configuration
const SIGNUP_RATE_LIMIT = {
  maxAttempts: 3,      // Max 3 signups per hour per IP
  windowMinutes: 60,
  lockMinutes: 60
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Rate limiting states
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [lockCountdown, setLockCountdown] = useState<string>('')
  
  const router = useRouter()
  const supabase = createClient()

  // Get a simple fingerprint for rate limiting (IP is handled server-side, this is for client tracking)
  const getClientFingerprint = () => {
    // Use a combination of factors for client-side tracking
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillText('fingerprint', 2, 2)
    }
    const fingerprint = canvas.toDataURL().slice(-50) + navigator.userAgent.slice(0, 50)
    return btoa(fingerprint).slice(0, 32)
  }

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
        setAttemptsRemaining(SIGNUP_RATE_LIMIT.maxAttempts)
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

  // Check rate limit on mount
  useEffect(() => {
    checkRateLimit()
  }, [])

  const checkRateLimit = async () => {
    try {
      const fingerprint = getClientFingerprint()
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: `signup_${fingerprint}`,
        p_action_type: 'signup',
        p_max_attempts: SIGNUP_RATE_LIMIT.maxAttempts,
        p_window_minutes: SIGNUP_RATE_LIMIT.windowMinutes,
        p_lock_minutes: SIGNUP_RATE_LIMIT.lockMinutes
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

  const recordSignupAttempt = async (success: boolean) => {
    try {
      const fingerprint = getClientFingerprint()
      
      const { data, error } = await supabase.rpc('record_rate_limit_attempt', {
        p_identifier: `signup_${fingerprint}`,
        p_action_type: 'signup',
        p_max_attempts: SIGNUP_RATE_LIMIT.maxAttempts,
        p_window_minutes: SIGNUP_RATE_LIMIT.windowMinutes,
        p_lock_minutes: SIGNUP_RATE_LIMIT.lockMinutes,
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

  // Validation functions
  const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return 'Username must be at least 3 characters'
    }
    if (username.length > 20) {
      return 'Username must be at most 20 characters'
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens'
    }
    if (/^[0-9]/.test(username)) {
      return 'Username cannot start with a number'
    }
    
    // Reserved usernames
    const reserved = ['admin', 'support', 'help', 'nashflare', 'moderator', 'mod', 'staff', 'official', 'system', 'null', 'undefined']
    if (reserved.includes(username.toLowerCase())) {
      return 'This username is reserved'
    }
    
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (password.length > 72) {
      return 'Password must be at most 72 characters'
    }
    
    // Check for at least one number OR one special character
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    if (!hasNumber && !hasSpecialChar) {
      return 'Password must contain at least one number or special character'
    }
    
    // Check against common weak passwords
    const weakPasswords = ['password', '12345678', 'qwerty123', 'abc12345', 'password1', 'welcome1', 'letmein1']
    if (weakPasswords.includes(password.toLowerCase())) {
      return 'This password is too common. Please choose a stronger password'
    }
    
    return null
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Check rate limit first
    try {
      const fingerprint = getClientFingerprint()
      
      const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_identifier: `signup_${fingerprint}`,
        p_action_type: 'signup',
        p_max_attempts: SIGNUP_RATE_LIMIT.maxAttempts,
        p_window_minutes: SIGNUP_RATE_LIMIT.windowMinutes,
        p_lock_minutes: SIGNUP_RATE_LIMIT.lockMinutes
      })

      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError)
      } else if (rateLimitData && !rateLimitData.allowed) {
        setLockedUntil(new Date(rateLimitData.locked_until))
        setAttemptsRemaining(0)
        setError('Too many signup attempts. Please try again later.')
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Rate limit check failed:', err)
    }

    // Validate username
    const usernameError = validateUsername(username)
    if (usernameError) {
      setError(usernameError)
      setLoading(false)
      return
    }

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('No user created')

      // Step 2: Create profile (email_verified = false by default)
      const { error: profileError } = await supabase.rpc('create_user_profile', {
        user_id: authData.user.id,
        user_name: username
      })

      if (profileError) throw profileError

      // Step 2b: Update profile with email (RPC doesn't include it)
      const { error: emailError } = await supabase
        .from('profiles')
        .update({ email: email.toLowerCase() })
        .eq('id', authData.user.id)

      if (emailError) {
        console.error('Failed to save email to profile:', emailError)
        // Don't throw - profile was created, email is secondary
      }

      // Step 3: Generate and store verification code
      const verificationCode = generateVerificationCode()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10) // Expires in 10 minutes

      const { error: codeError } = await supabase
        .from('profiles')
        .update({
          verification_code: verificationCode,
          verification_code_expires: expiresAt.toISOString(),
          verification_code_attempts: 0
        })
        .eq('id', authData.user.id)

      if (codeError) {
        console.error('Failed to save verification code:', codeError)
        throw new Error('Failed to generate verification code')
      }

      // Step 4: Send verification email (fire and forget)
      sendVerificationEmail({
        userEmail: email,
        username: username,
        verificationCode: verificationCode
      }).then(result => {
        if (result.success) {
          console.log('Verification email sent successfully!')
        } else {
          console.error('Failed to send verification email:', result.error)
        }
      }).catch(err => {
        console.error('Error sending verification email:', err)
      })

      // Record successful signup (clears rate limit)
      await recordSignupAttempt(true)

      // Step 5: DON'T sign out - keep user logged in for verification
      // Step 6: Redirect to verification page with email
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)

    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Record failed attempt
      await recordSignupAttempt(false)
      
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Fixed Background that covers entire viewport */}
      <div className="fixed inset-0 z-0 bg-slate-950">
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
            <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
              🚀 Join the Community
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Create Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Account</span>
          </h1>
          <p className="text-gray-400">Start trading gaming assets today</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
          <form onSubmit={handleSignup} className="space-y-5">
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
                    <p className="text-orange-200 text-sm font-medium">Signup Temporarily Blocked</p>
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
                  <span>Last signup attempt before temporary block</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Username</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_-]+"
                  title="Username can only contain letters, numbers, underscores, and hyphens"
                  disabled={!!lockedUntil}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">3-20 characters, letters/numbers/_ /- only</p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Email</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  minLength={8}
                  maxLength={72}
                  disabled={!!lockedUntil}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 8 characters with a number or special character</p>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">Confirm Password</label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="relative w-full bg-slate-800/80 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  required
                  minLength={8}
                  maxLength={72}
                  disabled={!!lockedUntil}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!lockedUntil}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </span>
              ) : lockedUntil ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Blocked - Wait {lockCountdown}
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
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