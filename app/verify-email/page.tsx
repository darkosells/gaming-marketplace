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
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const supabase = createClient()

  useEffect(() => {
    if (!email) {
      router.push('/signup')
      return
    }
    
    // Get the current user (they should still be in session after signup)
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
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

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all 6 digits are entered
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign up first')
      }

      // Get profile with verification data
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
      return
    }

    // Check attempt limit
    if (profile.verification_code_attempts >= 5) {
      setError('Too many failed attempts. Please request a new code.')
      return
    }

    // Check if code matches
    if (profile.verification_code !== codeToVerify) {
      // Increment attempts
      await supabase
        .from('profiles')
        .update({ 
          verification_code_attempts: profile.verification_code_attempts + 1 
        })
        .eq('id', profile.id)

      const attemptsLeft = 5 - (profile.verification_code_attempts + 1)
      setError(`Invalid code. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`)
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

    // Sign out the user so they have to login with verified account
    await supabase.auth.signOut()

    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push('/login?verified=true')
    }, 2000)
  }

  const handleResend = async () => {
    if (!canResend || !email) return

    setResending(true)
    setError('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please sign up first')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) throw new Error('Profile not found')

      // Generate new code
      const newCode = generateVerificationCode()
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 10)

      // Update database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_code: newCode,
          verification_code_expires: expiresAt.toISOString(),
          verification_code_attempts: 0
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Send new email
      const result = await sendVerificationEmail({
        userEmail: email,
        username: profile.username,
        verificationCode: newCode
      })

      if (!result.success) throw new Error(result.error)

      // Set 60 second cooldown
      setCanResend(false)
      setResendTimer(60)
      setCode(['', '', '', '', '', ''])
      
      alert('✅ New verification code sent! Check your email.')

    } catch (error: any) {
      console.error('Resend error:', error)
      setError(error.message || 'Failed to resend code')
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
        {/* Same animated background as signup */}
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
      {/* Animated Background - same as signup */}
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

        {/* Back to signup */}
        <div className="text-center mt-6">
          <Link href="/signup" className="text-gray-400 hover:text-purple-400 transition flex items-center justify-center gap-2">
            <span>←</span> Back to Signup
          </Link>
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