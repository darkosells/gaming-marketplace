'use client'

import { useState, useEffect, Suspense, useCallback, useMemo, useRef, memo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { sendVerificationEmail, generateVerificationCode } from '@/lib/email'
import Image from 'next/image'

// ============================================
// CONSTANTS (moved outside component)
// ============================================
const MIN_RESEND_INTERVAL = 60
const MAX_CODES_PER_HOUR = 5
const MAX_CODES_PER_DAY = 15
const INITIAL_CODE = ['', '', '', '', '', '']
const TOAST_DURATION = 4000
const REDIRECT_DELAY = 2000

// ============================================
// MEMOIZED BACKGROUND COMPONENT
// Prevents re-renders when parent state changes
// ============================================
const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 contain-strict">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse will-change-transform gpu-accelerate"
        style={{ contain: 'strict' }}
      />
      <div 
        className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse will-change-transform gpu-accelerate"
        style={{ animationDelay: '1s', contain: 'strict' }}
      />
      <div 
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse will-change-transform gpu-accelerate"
        style={{ animationDelay: '2s', contain: 'strict' }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  )
})

// ============================================
// MEMOIZED SUCCESS VIEW COMPONENT
// ============================================
const SuccessView = memo(function SuccessView() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
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
            <div className="w-5 h-5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    </div>
  )
})

// ============================================
// MEMOIZED TOAST COMPONENT
// ============================================
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
}

const Toast = memo(function Toast({ message, type }: ToastProps) {
  const styles = useMemo(() => {
    switch (type) {
      case 'success':
        return { bg: 'bg-green-500/20 border-green-500/50', text: 'text-green-200' }
      case 'error':
        return { bg: 'bg-red-500/20 border-red-500/50', text: 'text-red-200' }
      default:
        return { bg: 'bg-blue-500/20 border-blue-500/50', text: 'text-blue-200' }
    }
  }, [type])

  return (
    <div className="fixed top-6 right-6 z-50 transform transition-all duration-300 translate-x-0 opacity-100">
      <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-xl min-w-[320px] ${styles.bg}`}>
        <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
      </div>
    </div>
  )
})

// ============================================
// MEMOIZED CODE INPUT COMPONENT
// ============================================
interface CodeInputProps {
  index: number
  value: string
  inputRef: (el: HTMLInputElement | null) => void
  onChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
}

const CodeInput = memo(function CodeInput({ 
  index, 
  value, 
  inputRef, 
  onChange, 
  onKeyDown, 
  onPaste 
}: CodeInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(index, e.target.value)
  }, [index, onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    onKeyDown(index, e)
  }, [index, onKeyDown])

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={index === 0 ? onPaste : undefined}
      className="w-12 h-14 bg-slate-800/80 border border-white/10 rounded-xl text-center text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
      autoFocus={index === 0}
    />
  )
})

// ============================================
// MAIN CONTENT COMPONENT
// ============================================
function VerifyEmailContent() {
  const [code, setCode] = useState<string[]>(INITIAL_CODE)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [canResend, setCanResend] = useState(true)
  const [resendTimer, setResendTimer] = useState(0)
  const [toast, setToast] = useState<ToastProps | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  
  // Memoize supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), [])
  
  // Use refs for input elements instead of document.getElementById
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // Ref callback for setting input refs
  const setInputRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[index] = el
  }, [])

  // Focus helper using refs
  const focusInput = useCallback((index: number) => {
    inputRefs.current[index]?.focus()
  }, [])

  // Memoized toast function
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type })
  }, [])

  // Check rate limit - memoized
  const checkRateLimit = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('verification_codes_sent, verification_last_sent_at, verification_daily_reset')
        .eq('id', userId)
        .single()

      if (!profile) return

      const now = new Date()

      if (profile.verification_daily_reset) {
        const resetTime = new Date(profile.verification_daily_reset)
        const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60)

        if (hoursSinceReset >= 24) {
          await supabase
            .from('profiles')
            .update({
              verification_codes_sent: 0,
              verification_daily_reset: now.toISOString()
            })
            .eq('id', userId)
          return
        }
      }

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
  }, [supabase])

  // Initial load effect
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
  }, [email, router, supabase, checkRateLimit])

  // Resend timer effect
  useEffect(() => {
    if (resendTimer <= 0) {
      setCanResend(true)
      return
    }
    
    const timer = setTimeout(() => setResendTimer(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendTimer])

  // Toast auto-dismiss effect
  useEffect(() => {
    if (!toast) return
    
    const timer = setTimeout(() => setToast(null), TOAST_DURATION)
    return () => clearTimeout(timer)
  }, [toast])

  // Verify profile helper - memoized
  const verifyProfile = useCallback(async (profile: any, codeToVerify: string) => {
    if (new Date(profile.verification_code_expires) < new Date()) {
      setError('Verification code has expired. Please request a new one.')
      setCode(INITIAL_CODE)
      focusInput(0)
      return
    }

    if (profile.verification_code_attempts >= 5) {
      setError('Too many failed attempts. Please request a new code using "Resend Code" below.')
      setCode(INITIAL_CODE)
      focusInput(0)
      return
    }

    if (profile.verification_code !== codeToVerify) {
      const newAttempts = profile.verification_code_attempts + 1
      await supabase
        .from('profiles')
        .update({ verification_code_attempts: newAttempts })
        .eq('id', profile.id)

      if (newAttempts >= 5) {
        setError('Too many failed attempts. Please request a new code using "Resend Code" below.')
      } else {
        const attemptsLeft = 5 - newAttempts
        setError(`Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`)
      }
      
      setCode(INITIAL_CODE)
      focusInput(0)
      return
    }

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
    }, REDIRECT_DELAY)
  }, [supabase, router, focusInput])

  // Handle verify - memoized
  const handleVerify = useCallback(async (verificationCode?: string) => {
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
  }, [code, supabase, verifyProfile])

  // Handle code change - memoized
  const handleCodeChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (!/^\d*$/.test(value)) {
      return
    }

    setCode(prevCode => {
      const newCode = [...prevCode]
      newCode[index] = value
      
      // Auto-submit when complete
      if (index === 5 && value && newCode.every(digit => digit !== '')) {
        // Use setTimeout to allow state to update first
        setTimeout(() => handleVerify(newCode.join('')), 0)
      }
      
      return newCode
    })

    if (value && index < 5) {
      focusInput(index + 1)
    }
  }, [focusInput, handleVerify])

  // Handle keydown - memoized
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      focusInput(index - 1)
    }
  }, [code, focusInput])

  // Handle paste - memoized
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
    setCode(newCode)

    if (pastedData.length === 6) {
      handleVerify(pastedData)
    }
  }, [handleVerify])

  // Handle resend - memoized
  const handleResend = useCallback(async () => {
    if (!canResend || !email) return

    setResending(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign up first')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, verification_codes_sent, verification_last_sent_at, verification_daily_reset')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) throw new Error('Profile not found')

      const now = new Date()

      let codesSent = profile.verification_codes_sent || 0
      if (profile.verification_daily_reset) {
        const resetTime = new Date(profile.verification_daily_reset)
        const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60)

        if (hoursSinceReset >= 24) {
          codesSent = 0
        }
      }

      if (codesSent >= MAX_CODES_PER_DAY) {
        setError(`Daily limit of ${MAX_CODES_PER_DAY} codes reached. Please try again tomorrow or contact support@nashflare.com`)
        showToast('❌ Daily limit reached. Contact support if you need help.', 'error')
        setResending(false)
        return
      }

      if (profile.verification_last_sent_at) {
        const lastSent = new Date(profile.verification_last_sent_at)
        const minutesSinceLastSend = (now.getTime() - lastSent.getTime()) / (1000 * 60)

        if (minutesSinceLastSend < 60) {
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

      const newCode = generateVerificationCode()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_code: newCode,
          verification_code_expires: expiresAt.toISOString(),
          verification_code_attempts: 0,
          verification_codes_sent: codesSent + 1,
          verification_last_sent_at: now.toISOString(),
          verification_daily_reset: profile.verification_daily_reset || now.toISOString()
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      const result = await sendVerificationEmail({
        userEmail: email,
        username: profile.username,
        verificationCode: newCode
      })

      if (!result.success) throw new Error(result.error)

      setCanResend(false)
      setResendTimer(MIN_RESEND_INTERVAL)
      setCode(INITIAL_CODE)
      
      const codesRemaining = MAX_CODES_PER_DAY - (codesSent + 1)
      showToast(`✅ New verification code sent! (${codesRemaining} codes remaining today)`, 'success')

    } catch (error: any) {
      console.error('Resend error:', error)
      setError(error.message || 'Failed to resend code')
      showToast('❌ Failed to resend code. Please try again.', 'error')
    } finally {
      setResending(false)
    }
  }, [canResend, email, supabase, showToast])

  // Handle sign out - memoized
  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/')
  }, [supabase, router])

  // Handle opening live chat - placeholder for Crisp integration
  const handleOpenLiveChat = useCallback(() => {
    // TODO: Integrate with Crisp live chat
    // window.$crisp.push(['do', 'chat:open'])
    console.log('Live chat placeholder - Crisp integration pending')
  }, [])

  // Memoize button disabled state
  const isVerifyDisabled = useMemo(() => 
    loading || code.some(digit => !digit), 
    [loading, code]
  )

  // Early returns
  if (!email) {
    return null
  }

  if (success) {
    return <SuccessView />
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Animated Background - Memoized */}
      <AnimatedBackground />

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
            <div className="absolute -inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
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
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <CodeInput
                  key={index}
                  index={index}
                  value={digit}
                  inputRef={setInputRef(index)}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Code expires in 10 minutes
            </p>
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={isVerifyDisabled}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              'Verify Email'
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={!canResend || resending}
              className="text-purple-400 hover:text-purple-300 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                  Sending...
                </span>
              ) : !canResend ? (
                `Resend Code in ${resendTimer}s`
              ) : (
                'Resend Code'
              )}
            </button>
          </div>

          {/* Not getting any code? Help Section */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <details className="group">
              <summary className="flex items-center justify-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300 transition text-sm">
                <svg 
                  className="w-4 h-4 transition-transform group-open:rotate-180" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Not getting any code?</span>
              </summary>
              
              <div className="mt-4 space-y-4 text-left">
                {/* Check Spam Tip */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-lg">📁</span>
                    </div>
                    <div>
                      <h4 className="text-yellow-200 font-semibold text-sm mb-1">Check your Spam/Junk folder</h4>
                      <p className="text-yellow-200/70 text-xs leading-relaxed">
                        Our verification emails sometimes land in spam, especially for new accounts. Look for an email from <span className="font-mono text-yellow-300">noreply@nashflare.com</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tips List */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <span>💡</span> Quick tips
                  </h4>
                  <ul className="space-y-2.5 text-xs text-gray-400">
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Add <span className="text-purple-300 font-mono">noreply@nashflare.com</span> to your contacts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Check your Promotions or Updates tab (Gmail users)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Make sure <span className="text-white">{email}</span> is spelled correctly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Wait a few minutes — emails can take up to 2 min to arrive</span>
                    </li>
                  </ul>
                </div>

                {/* Still having issues - Live Chat Button */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500 mb-3">
                    Still having trouble?
                  </p>
                  <button
                    onClick={handleOpenLiveChat}
                    className="inline-flex items-center justify-between gap-3 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-white/20 rounded-full transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Chat bubble icon */}
                      <svg 
                        className="w-5 h-5 text-emerald-400" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                        <circle cx="8" cy="10" r="1.5"/>
                        <circle cx="12" cy="10" r="1.5"/>
                        <circle cx="16" cy="10" r="1.5"/>
                      </svg>
                      <span className="text-gray-300 text-sm font-medium">Need help? Support available</span>
                    </div>
                    {/* Chevron */}
                    <svg 
                      className="w-4 h-4 text-gray-500 group-hover:text-gray-400 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Skip verification option */}
        <div className="text-center mt-6">
          <button
            onClick={handleSignOut}
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

// ============================================
// PAGE EXPORT WITH SUSPENSE
// ============================================
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}