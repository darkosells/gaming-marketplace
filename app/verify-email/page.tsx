'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email'
import Image from 'next/image'

function VerifyEmailContent() {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendTimer, setResendTimer] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const supabase = createClient()

  // Rate limiting constants
  const MIN_RESEND_INTERVAL = 60 // 60 seconds between resends
  const MAX_CODES_PER_HOUR = 5 // Maximum 5 codes per hour
  const MAX_CODES_PER_DAY = 15 // Maximum 15 codes per 24 hours

  useEffect(() => {
    if (!email) {
      router.push('/signup')
      return
    }
    
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await checkRateLimit(user.id)
      }
    }
    getCurrentUser()
  }, [email, router, supabase.auth])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }

  const checkRateLimit = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_codes_sent, verification_last_sent_at, verification_daily_reset')
        .eq('id', userId)
        .single()

      if (!profile) return

      const now = new Date()

      // Check if we need to reset daily counter (24 hours passed)
      if (profile.verification_daily_reset) {
        const resetTime = new Date(profile.verification_daily_reset)
        const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60)

        if (hoursSinceReset >= 24) {
          // Reset daily counter
          await supabase
            .from('profiles')
            .update({
              verification_codes_sent: 0,
              verification_daily_reset: now.toISOString()
            })
            .eq('id', userId)
          return // Counter reset, user can proceed
        }
      }

      // Check if last send was too recent (60 second cooldown)
      if (profile.verification_last_sent_at) {
        const lastSent = new Date(profile.verification_last_sent_at)
        const secondsSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000
        
        if (secondsSinceLastSend < MIN_RESEND_INTERVAL) {
          const remainingSeconds = Math.ceil(MIN_RESEND_INTERVAL - secondsSinceLastSend)
          setResendTimer(remainingSeconds)
          setCanResend(false)
        }
      }
    } catch (error) {
      console.error('Error checking rate limit:', error)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    if (index === 5 && value && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
    setCode(newCode)

    if (pastedData.length === 6) {
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('')
    
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign up first')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, verification_code, verification_code_expires, verification_code_attempts, username')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found. Please sign up again.')
      }

      await verifyProfile(profile, codeToVerify)

    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  const verifyProfile = async (profile: any, codeToVerify: string) => {
    // Check if code has expired
    if (new Date(profile.verification_code_expires) < new Date()) {
      setError('Verification code has expired. Please request a new one.')
      setCode(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
      return
    }

    // Check attempt limit
    if (profile.verification_code_attempts >= 5) {
      setError('Too many failed attempts. Please request a new code using "Resend Code" below.')
      setCode(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
      return
    }

    // Check if code matches
    if (profile.verification_code !== codeToVerify) {
      const newAttempts = profile.verification_code_attempts + 1
      await supabase
        .from('profiles')
        .update({ 
          verification_code_attempts: newAttempts
        })
        .eq('id', profile.id)

      if (newAttempts >= 5) {
        setError('Too many failed attempts. Please request a new code using "Resend Code" below.')
      } else {
        const attemptsLeft = 5 - newAttempts
        setError(`Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`)
      }
      
      setCode(['', '', '', '', '', ''])
      document.getElementById('code-0')?.focus()
      return
    }

    // Success! Mark email as verified
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        email_verified: true,
        verification_code: null,
        verification_code_expires: null,
        verification_code_attempts: 0
      })
      .eq('id', profile.id)

    if (updateError) throw updateError

    setSuccess(true)
    await supabase.auth.signOut()

    setTimeout(() => {
      router.push('/login?verified=true')
    }, 2000)
  }

  const handleResend = async () => {
    if (!canResend || !email) return

    setResending(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign up first')
      }

      // Get current rate limit status
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, verification_codes_sent, verification_last_sent_at, verification_daily_reset')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) throw new Error('Profile not found')

      const now = new Date()

      // Check daily reset
      let codesSent = profile.verification_codes_sent || 0
      if (profile.verification_daily_reset) {
        const resetTime = new Date(profile.verification_daily_reset)
        const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60)

        if (hoursSinceReset >= 24) {
          // Reset counter
          codesSent = 0
        }
      }

      // Check daily limit
      if (codesSent >= MAX_CODES_PER_DAY) {
        setError(`Daily limit of ${MAX_CODES_PER_DAY} codes reached. Please try again tomorrow or contact support@nashflare.com`)
        showToast('❌ Daily limit reached. Contact support if you need help.', 'error')
        setResending(false)
        return
      }

      // Check hourly limit
      if (profile.verification_last_sent_at) {
        const lastSent = new Date(profile.verification_last_sent_at)
        const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60)

        // Count codes sent in last hour
        if (minutesSinceLastSend < 60) {
          // For simplicity, we'll track that user is within hourly window
          // In production, you'd want a more sophisticated tracking system
          const recentCodes = codesSent % MAX_CODES_PER_HOUR
          if (recentCodes >= MAX_CODES_PER_HOUR && minutesSinceLastSend < 60) {
            const minutesRemaining = Math.ceil(60 - minutesSinceLastSend)
            setError(`Hourly limit of ${MAX_CODES_PER_HOUR} codes reached. Please wait ${minutesRemaining} minute(s) or contact support@nashflare.com`)
            showToast(`⏰ Please wait ${minutesRemaining} minute(s) before requesting another code.`, 'info')
            setResending(false)
            return
          }
        }
      }

      // Check 60-second cooldown
      if (profile.verification_last_sent_at) {
        const lastSent = new Date(profile.verification_last_sent_at)
        const secondsSinceLastSend = (now.getTime() - lastSent.getTime()) / 1000
        
        if (secondsSinceLastSend < MIN_RESEND_INTERVAL) {
          const remainingSeconds = Math.ceil(MIN_RESEND_INTERVAL - secondsSinceLastSend)
          setError(`Please wait ${remainingSeconds} second(s) before requesting another code.`)
          setResendTimer(remainingSeconds)
          setCanResend(false)
          setResending(false)
          return
        }
      }

      // All checks passed - generate and send new code
      const newCode = generateVerificationCode()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      // Update database with new code and increment counter
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_code: newCode,
          verification_code_expires: expiresAt.toISOString(),
          verification_code_attempts: 0,  // Reset attempts for new code
          verification_codes_sent: codesSent + 1,
          verification_last_sent_at: now.toISOString(),
          verification_daily_reset: profile.verification_daily_reset || now.toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Send email
      const result = await sendVerificationEmail({
        userEmail: email,
        username: profile.username,
        verificationCode: newCode
      })

      if (!result.success) throw new Error(result.error)

      // Set 60 second cooldown
      setCanResend(false)
      setResendTimer(MIN_RESEND_INTERVAL)
      setCode(['', '', '', '', '', ''])
      
      const codesRemaining = MAX_CODES_PER_DAY - (codesSent + 1)
      showToast(`✅ New verification code sent! (${codesRemaining} codes remaining today)`, 'success')

    } catch (error: any) {
      console.error('Resend error:', error)
      setError(error.message || 'Failed to resend code')
      showToast('❌ Failed to resend code. Please try again.', 'error')
    } finally {
      setResending(false)
    }
  }

  if (!email) {
    return null
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 max-w-md w-full text-center">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Email Verified!</h2>
            <p className="text-gray-400 mb-6">
              Your account has been successfully verified. Redirecting you to login...
            </p>
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
              <span>Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ${
          toast ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-xl min-w-[320px] ${
            toast.type === 'success' 
              ? 'bg-green-500/20 border-green-500/50' 
              : toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/50'
              : 'bg-blue-500/20 border-blue-500/50'
          }`}>
            <p className={`text-sm font-medium ${
              toast.type === 'success' 
                ? 'text-green-200' 
                : toast.type === 'error'
                ? 'text-red-200'
                : 'text-blue-200'
            }`}>
              {toast.message}
            </p>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
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
            <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium">
              📧 Check Your Email
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Verify Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Email</span>
          </h1>
          <p className="text-gray-400">
            We sent a 6-digit code to<br />
            <span className="text-white font-semibold">{email}</span>
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6">
              <p className="text-red-200 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-white font-semibold mb-4 text-sm text-center">
              Enter Verification Code
            </label>
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 bg-slate-800/80 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Code expires in 10 minutes
            </p>
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={loading || code.some(digit => !digit)}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={!canResend || resending}
              className="text-purple-400 hover:text-purple-300 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                  Sending...
                </span>
              ) : !canResend ? (
                `Resend in ${resendTimer}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>
        </div>

        {/* Skip verification option */}
        <div className="text-center mt-6">
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/')
            }}
            className="text-gray-400 hover:text-purple-400 transition flex items-center justify-center gap-2 mx-auto"
          >
            <span>←</span> Verify Later (Sign Out)
          </button>
          <p className="text-xs text-gray-500 mt-2">
            You can verify your email anytime by logging in
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}