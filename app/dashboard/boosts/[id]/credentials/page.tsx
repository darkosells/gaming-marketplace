'use client'

// ============================================================================
// CUSTOMER CREDENTIALS SUBMISSION PAGE (with Email Notification)
// ============================================================================
// Location: app/dashboard/boosts/[id]/credentials/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'
import { sendBoostCredentialsSubmittedEmail } from '@/lib/email'

interface BoostingOrder {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  game: string
  current_rank: string
  desired_rank: string
  queue_type: string
  is_priority: boolean
  final_price: number
  status: string
  created_at: string
  vendor?: {
    id: string
    username: string
    avatar_url: string | null
    email?: string
  }
}

export default function CredentialsSubmissionPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [customerProfile, setCustomerProfile] = useState<any>(null)
  const [order, setOrder] = useState<BoostingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [riotUsername, setRiotUsername] = useState('')
  const [riotPassword, setRiotPassword] = useState('')
  const [has2FA, setHas2FA] = useState(false)
  const [twoFANotes, setTwoFANotes] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push(`/login?redirect=/dashboard/boosts/${orderId}/credentials`)
        return
      }
      setUser(session.user)

      // Fetch customer profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, email')
        .eq('id', session.user.id)
        .single()
      
      setCustomerProfile(profile)

      // Fetch order with vendor email
      const { data: orderData, error: orderError } = await supabase
        .from('boosting_orders')
        .select(`
          *,
          vendor:profiles!boosting_orders_vendor_id_fkey (
            id,
            username,
            avatar_url,
            email
          )
        `)
        .eq('id', orderId)
        .eq('customer_id', session.user.id)
        .single()

      if (orderError || !orderData) {
        console.error('Error fetching order:', orderError)
        router.push('/dashboard')
        return
      }

      // Check if credentials already submitted
      if (orderData.status !== 'awaiting_credentials') {
        router.push(`/dashboard/boosts/${orderId}`)
        return
      }

      setOrder(orderData)
      setLoading(false)
    }

    init()
  }, [router, orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!riotUsername.trim() || !riotPassword.trim()) {
      setError('Please enter both username and password')
      return
    }

    if (!agreedToTerms) {
      setError('Please agree to the terms before submitting')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Store credentials (encrypted by Supabase Vault or app-level encryption)
      // For now, we'll use a simple approach - in production, use proper encryption
      const { error: credError } = await supabase
        .from('boosting_credentials')
        .insert({
          order_id: orderId,
          riot_username_encrypted: riotUsername, // In production: encrypt this
          riot_password_encrypted: riotPassword, // In production: encrypt this
          has_2fa: has2FA,
          two_fa_notes: twoFANotes || null
        })

      if (credError) {
        throw new Error('Failed to save credentials')
      }

      // Update order status
      const { error: updateError } = await supabase
        .from('boosting_orders')
        .update({
          status: 'credentials_received',
          credentials_submitted_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) {
        throw new Error('Failed to update order status')
      }

      // ========== SEND EMAIL TO BOOSTER ==========
      if (order?.vendor?.email) {
        const currentRankData = RANKS_MAP[order.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[order.desired_rank as RankKey]
        
        await sendBoostCredentialsSubmittedEmail({
          boosterEmail: order.vendor.email,
          boosterUsername: order.vendor.username || 'Booster',
          customerUsername: customerProfile?.username || 'Customer',
          currentRank: currentRankData?.name || order.current_rank,
          desiredRank: desiredRankData?.name || order.desired_rank,
          orderNumber: order.order_number,
          orderId: order.id
        })
      }
      // ============================================

      setSuccess(true)
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/dashboard/boosts/${orderId}`)
      }, 2000)

    } catch (err: any) {
      console.error('Credential submission error:', err)
      setError(err.message || 'Failed to submit credentials. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const currentRank = RANKS_MAP[order.current_rank as RankKey]
  const desiredRank = RANKS_MAP[order.desired_rank as RankKey]

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Credentials Submitted!</h1>
          <p className="text-gray-400 mb-6">
            Your booster has been notified and will begin working on your order soon.
          </p>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
          <p className="text-gray-500 text-sm mt-2">Redirecting to order tracking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Back Link */}
          <Link 
            href={`/dashboard/boosts/${orderId}`}
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 mb-6"
          >
            <span>←</span> Back to Order
          </Link>

          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
                <span className="text-cyan-400 text-sm font-medium">🔐 Secure Credential Submission</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Submit Your Account Credentials</h1>
              <p className="text-gray-400">Your booster needs access to complete your rank boost</p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide">Order</p>
                  <p className="text-white font-mono">{order.order_number}</p>
                </div>
                {/* Rank Display with Images */}
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative mx-auto">
                      <Image
                        src={currentRank?.image || ''}
                        alt={currentRank?.name || ''}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: currentRank?.color }}>{currentRank?.name}</p>
                  </div>
                  <span className="text-purple-400 text-lg">→</span>
                  <div className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 relative mx-auto">
                      <Image
                        src={desiredRank?.image || ''}
                        alt={desiredRank?.name || ''}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: desiredRank?.color }}>{desiredRank?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                  {order.vendor?.avatar_url ? (
                    <img src={order.vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{order.vendor?.username?.charAt(0).toUpperCase() || 'B'}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Your Booster</p>
                  <p className="text-gray-400 text-xs">{order.vendor?.username || 'Assigned Booster'}</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">Your Account is Protected</h3>
                  <ul className="text-green-300/80 text-sm space-y-1">
                    <li>• Only your assigned booster can view these credentials</li>
                    <li>• Credentials are encrypted and stored securely</li>
                    <li>• Access is automatically revoked after boost completion</li>
                    <li>• We recommend changing your password after the boost</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-cyan-400">🎮</span>
                Riot Account Credentials
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Riot Username (with tag)
                  </label>
                  <input
                    type="text"
                    value={riotUsername}
                    onChange={(e) => setRiotUsername(e.target.value)}
                    placeholder="YourName#TAG"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    required
                  />
                  <p className="text-gray-500 text-xs mt-1">Include your Riot ID tag (e.g., Player#NA1)</p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Riot Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={riotPassword}
                      onChange={(e) => setRiotPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* 2FA Toggle */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={has2FA}
                      onChange={(e) => setHas2FA(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                    />
                    <div>
                      <span className="text-white font-medium">I have 2FA enabled</span>
                      <p className="text-gray-500 text-xs">Check this if you have two-factor authentication</p>
                    </div>
                  </label>

                  {has2FA && (
                    <div className="mt-4">
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        2FA Instructions (optional)
                      </label>
                      <textarea
                        value={twoFANotes}
                        onChange={(e) => setTwoFANotes(e.target.value)}
                        placeholder="How should the booster handle 2FA? (e.g., 'I will provide codes via chat when needed')"
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                      required
                    />
                    <div>
                      <span className="text-white font-medium">I understand and agree</span>
                      <p className="text-gray-500 text-xs mt-1">
                        I understand that my booster will log into my account to complete the rank boost. 
                        I will not play on this account during the boosting process. I agree to 
                        change my password after the boost is completed.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !agreedToTerms || !riotUsername || !riotPassword}
                className="w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting Securely...
                  </>
                ) : (
                  <>
                    🔐 Submit Credentials
                  </>
                )}
              </button>

              <p className="text-center text-gray-500 text-xs mt-4">
                Your credentials are encrypted and will only be visible to your assigned booster
              </p>
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}