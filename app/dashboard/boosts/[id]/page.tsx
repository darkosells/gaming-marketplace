'use client'

// ============================================================================
// CUSTOMER BOOST ORDER TRACKING PAGE (Enhanced with Completion Emails)
// ============================================================================
// Location: app/dashboard/boosts/[id]/page.tsx
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
import { sendBoostCompletionEmails } from '@/lib/email'

interface BoostingOrder {
  id: string
  order_number: string
  customer_id: string
  vendor_id: string
  game: string
  current_rank: string
  current_rr: number
  desired_rank: string
  queue_type: string
  is_priority: boolean
  addon_offline_mode: boolean
  addon_solo_queue_only: boolean
  addon_no_5_stack: boolean
  addon_specific_agents: boolean
  specific_agents_list: string[] | null
  progress_current_rank: string | null
  progress_current_rr: number
  final_price: number
  platform_fee: number
  vendor_payout: number
  payment_status: string
  status: string
  created_at: string
  credentials_submitted_at: string | null
  started_at: string | null
  vendor_completed_at: string | null
  customer_confirmed_at: string | null
  completed_at: string | null
  vendor?: {
    id: string
    username: string
    avatar_url: string | null
    email?: string
  }
}

interface ProgressUpdate {
  id: string
  order_id: string
  rank_achieved: string
  rr_achieved: number
  games_played: number
  games_won: number
  screenshot_url: string | null
  booster_notes: string | null
  created_at: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string; description: string }> = {
  awaiting_credentials: {
    label: 'Awaiting Credentials',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    icon: '🔐',
    description: 'Please submit your account credentials to begin'
  },
  credentials_received: {
    label: 'Credentials Received',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    icon: '✓',
    description: 'Your booster has received your credentials and will start soon'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    icon: '🎮',
    description: 'Your boost is actively being worked on'
  },
  pending_confirmation: {
    label: 'Pending Confirmation',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    icon: '✅',
    description: 'Your booster has completed the boost - please confirm'
  },
  completed: {
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    icon: '🏆',
    description: 'Your boost has been completed successfully'
  },
  dispute: {
    label: 'Dispute',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    icon: '⚠️',
    description: 'There is an issue with this order - our team is reviewing'
  },
  refunded: {
    label: 'Refunded',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/30',
    icon: '↩️',
    description: 'This order has been refunded'
  }
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; description: string }> = {
  held: {
    label: 'Held in Escrow',
    color: 'text-yellow-400',
    icon: '🔒',
    description: 'Payment is securely held until you confirm completion'
  },
  released: {
    label: 'Released',
    color: 'text-green-400',
    icon: '✓',
    description: 'Payment has been released to the booster'
  },
  refunded: {
    label: 'Refunded',
    color: 'text-blue-400',
    icon: '↩️',
    description: 'Payment has been refunded to you'
  },
  disputed: {
    label: 'Under Review',
    color: 'text-orange-400',
    icon: '⚠️',
    description: 'Payment is on hold pending dispute resolution'
  }
}

export default function CustomerBoostOrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [customerProfile, setCustomerProfile] = useState<any>(null)
  const [order, setOrder] = useState<BoostingOrder | null>(null)
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [submittingDispute, setSubmittingDispute] = useState(false)
  const [disputeError, setDisputeError] = useState<string | null>(null)
  
  // Screenshot lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push(`/login?redirect=/dashboard/boosts/${orderId}`)
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
      
      await fetchOrder(session.user.id)
      setLoading(false)
    }
    init()
  }, [router, orderId])

  const fetchOrder = async (userId: string) => {
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
      .eq('customer_id', userId)
      .single()

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError)
      router.push('/customer-dashboard')
      return
    }

    setOrder(orderData)

    const { data: progressData } = await supabase
      .from('boosting_progress')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    setProgressUpdates(progressData || [])
  }

  // FIXED: Now also sets payment_status to 'released' so vendor gets paid
  const handleConfirmCompletion = async () => {
    if (!order || !user) return
    
    setConfirming(true)
    try {
      const { error } = await supabase
        .from('boosting_orders')
        .update({
          status: 'completed',
          payment_status: 'released',
          customer_confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // ========== SEND COMPLETION EMAILS TO BOTH PARTIES ==========
      const currentRankData = RANKS_MAP[order.current_rank as RankKey]
      const desiredRankData = RANKS_MAP[order.desired_rank as RankKey]
      const finalRankData = order.progress_current_rank 
        ? RANKS_MAP[order.progress_current_rank as RankKey] 
        : desiredRankData
      
      // Calculate total games from progress updates
      const totalGames = progressUpdates.reduce((sum, u) => sum + (u.games_played || 0), 0)
      
      // Calculate completion time
      const startDate = order.started_at ? new Date(order.started_at) : new Date(order.created_at)
      const endDate = new Date()
      const diffMs = endDate.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const completionTime = diffDays > 0 ? `${diffDays} days, ${diffHours} hours` : `${diffHours} hours`
      
      if (customerProfile?.email && order.vendor?.email) {
        await sendBoostCompletionEmails({
          customerEmail: customerProfile.email,
          customerUsername: customerProfile.username || 'Customer',
          boosterEmail: order.vendor.email,
          boosterUsername: order.vendor.username || 'Booster',
          currentRank: currentRankData?.name || order.current_rank,
          desiredRank: desiredRankData?.name || order.desired_rank,
          finalRank: finalRankData?.name || order.desired_rank,
          totalGames: totalGames,
          completionTime: completionTime,
          boosterPayout: order.vendor_payout,
          orderNumber: order.order_number,
          orderId: order.id
        })
      }
      // ============================================================

      await fetchOrder(user.id)
      setShowConfirmModal(false)
    } catch (err) {
      console.error('Error confirming completion:', err)
    } finally {
      setConfirming(false)
    }
  }

  const handleSubmitDispute = async () => {
    if (!order || !user || !disputeReason.trim()) return

    setSubmittingDispute(true)
    setDisputeError(null)

    try {
      // Update order status to dispute
      const { error: orderError } = await supabase
        .from('boosting_orders')
        .update({
          status: 'dispute',
          payment_status: 'disputed'
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('boosting_disputes')
        .insert({
          order_id: orderId,
          initiated_by: user.id,
          reason: disputeReason.trim(),
          status: 'open'
        })

      if (disputeError) throw disputeError

      await fetchOrder(user.id)
      setShowDisputeModal(false)
      setDisputeReason('')
    } catch (err: any) {
      console.error('Error submitting dispute:', err)
      setDisputeError(err.message || 'Failed to submit dispute. Please try again.')
    } finally {
      setSubmittingDispute(false)
    }
  }

  // Calculate time remaining for auto-completion (48 hours from vendor_completed_at)
  const getAutoCompleteInfo = () => {
    if (!order?.vendor_completed_at || order.status !== 'pending_confirmation') {
      return null
    }

    const completedAt = new Date(order.vendor_completed_at)
    const autoCompleteAt = new Date(completedAt.getTime() + 48 * 60 * 60 * 1000)
    const now = new Date()
    const remainingMs = autoCompleteAt.getTime() - now.getTime()

    if (remainingMs <= 0) {
      return { expired: true, text: 'Auto-completing soon...' }
    }

    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))

    return {
      expired: false,
      text: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      isUrgent: hours < 6
    }
  }

  // Generate chat URL for boosting orders
  const getChatUrl = () => {
    if (!order) return '/messages'
    return `/messages?boostOrder=${order.id}&vendorId=${order.vendor_id}&customerId=${order.customer_id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const currentRank = RANKS_MAP[order.current_rank as RankKey]
  const desiredRank = RANKS_MAP[order.desired_rank as RankKey]
  const progressRank = order.progress_current_rank ? RANKS_MAP[order.progress_current_rank as RankKey] : currentRank
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.held
  const autoCompleteInfo = getAutoCompleteInfo()

  // Calculate progress percentage
  const allRanks = Object.keys(RANKS_MAP) as RankKey[]
  const startIndex = allRanks.indexOf(order.current_rank as RankKey)
  const endIndex = allRanks.indexOf(order.desired_rank as RankKey)
  const currentIndex = order.progress_current_rank 
    ? allRanks.indexOf(order.progress_current_rank as RankKey)
    : startIndex
  const progressPercent = startIndex < endIndex 
    ? Math.round(((currentIndex - startIndex) / (endIndex - startIndex)) * 100)
    : 0

  const totalPaid = order.final_price + order.platform_fee

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Screenshot Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button 
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-5xl max-h-[90vh] w-full">
            <img 
              src={lightboxImage} 
              alt="Screenshot" 
              className="w-full h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <p className="absolute bottom-4 text-gray-400 text-sm">Click anywhere to close</p>
        </div>
      )}

      {/* Confirm Completion Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
          <div className="relative bg-slate-900 border border-green-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-white text-center mb-2">Confirm Boost Completion</h3>
            <p className="text-gray-400 text-center mb-6">
              By confirming, you acknowledge that your account has reached the desired rank and the boost service was completed satisfactorily.
            </p>

            {/* Confirmation Notice */}
<div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-lg">✅</span>
    </div>
    <div>
      <p className="text-emerald-400 font-medium text-sm">This action is final</p>
      <p className="text-gray-400 text-xs">
        Once confirmed, the order will be marked as complete and cannot be disputed
      </p>
    </div>
  </div>
</div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmCompletion}
                disabled={confirming}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-400 hover:to-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming...
                  </>
                ) : (
                  <>Confirm ✓</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDisputeModal(false)}></div>
          <div className="relative bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">Open a Dispute</h3>
            <p className="text-gray-400 text-center mb-6">
              If there's an issue with your boost, please describe the problem below. Our team will review and respond within 24 hours.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                What's the issue?
              </label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Please describe the problem in detail..."
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 resize-none"
                rows={4}
              />
            </div>

            {disputeError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{disputeError}</p>
              </div>
            )}

            {/* Warning Notice */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-orange-400 font-medium text-sm">Payment will be held</p>
                  <p className="text-gray-400 text-xs">
                    The booster's payment will be frozen until the dispute is resolved
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDisputeModal(false)
                  setDisputeReason('')
                  setDisputeError(null)
                }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDispute}
                disabled={submittingDispute || !disputeReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingDispute ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>Submit Dispute</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
            <Link 
              href="/customer-dashboard"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-gray-600">/</span>
            <Link 
              href="/boosting/my-requests"
              className="text-gray-400 hover:text-white transition-colors"
            >
              My Boosts
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400 truncate max-w-[150px]">{order.order_number}</span>
          </div>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Boost Order</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} bg-white/5 border ${statusConfig.bgColor}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
              <p className="text-gray-400 font-mono text-sm">{order.order_number}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {order.status === 'awaiting_credentials' && (
                <Link
                  href={`/dashboard/boosts/${orderId}/credentials`}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:from-cyan-400 hover:to-purple-400 transition-colors text-sm"
                >
                  🔐 Submit Credentials
                </Link>
              )}
              {order.status === 'pending_confirmation' && (
                <>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-400 hover:to-emerald-400 transition-colors text-sm"
                  >
                    ✓ Confirm Completion
                  </button>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors border border-red-500/30 text-sm"
                  >
                    ⚠️ Open Dispute
                  </button>
                </>
              )}
              {['credentials_received', 'in_progress'].includes(order.status) && (
                <button
                  onClick={() => setShowDisputeModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-gray-300 font-medium hover:bg-slate-600 hover:text-white transition-colors text-sm"
                >
                  Report Issue
                </button>
              )}
              <Link
                href={getChatUrl()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors text-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Chat with Booster
              </Link>
            </div>
          </div>

          {/* Auto-Completion Warning */}
          {autoCompleteInfo && (
            <div className={`mb-6 p-4 rounded-xl border ${
              autoCompleteInfo.isUrgent 
                ? 'bg-orange-500/10 border-orange-500/30' 
                : 'bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  autoCompleteInfo.isUrgent ? 'bg-orange-500/20' : 'bg-yellow-500/20'
                }`}>
                  <span className="text-lg">⏱️</span>
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${autoCompleteInfo.isUrgent ? 'text-orange-400' : 'text-yellow-400'}`}>
                    Auto-completion in {autoCompleteInfo.text}
                  </p>
                  <p className="text-gray-400 text-xs">
                    This order will automatically complete if not confirmed or disputed within 48 hours of booster completion.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                  >
                    Confirm Now
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Alert */}
              <div className={`bg-slate-900/80 border rounded-2xl p-6 ${statusConfig.bgColor}`}>
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{statusConfig.icon}</div>
                  <div className="flex-1">
                    <h2 className={`text-xl font-bold ${statusConfig.color}`}>{statusConfig.label}</h2>
                    <p className="text-gray-400 mt-1">{statusConfig.description}</p>
                  </div>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-cyan-400">📊</span>
                  Boost Progress
                </h2>

                {/* Rank Progress */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto">
                      {currentRank?.image ? (
                        <Image
                          src={currentRank.image}
                          alt={currentRank.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎮</div>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-2" style={{ color: currentRank?.color }}>
                      {currentRank?.name}
                    </p>
                    <p className="text-xs text-gray-500">Start</p>
                  </div>

                  {order.progress_current_rank && order.progress_current_rank !== order.current_rank && (
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto">
                        {progressRank?.image ? (
                          <Image
                            src={progressRank.image}
                            alt={progressRank.name}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎮</div>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-2" style={{ color: progressRank?.color }}>
                        {progressRank?.name}
                      </p>
                      <p className="text-xs text-gray-500">Current</p>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative mx-auto">
                      {desiredRank?.image ? (
                        <Image
                          src={desiredRank.image}
                          alt={desiredRank.name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🎮</div>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-2" style={{ color: desiredRank?.color }}>
                      {desiredRank?.name}
                    </p>
                    <p className="text-xs text-gray-500">Target</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">{progressPercent}%</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* RR Progress */}
                {order.progress_current_rr > 0 && (
                  <div className="text-center p-3 bg-slate-800 rounded-xl">
                    <span className="text-gray-400 text-sm">Current RR: </span>
                    <span className="text-white font-bold">{order.progress_current_rr}</span>
                  </div>
                )}
              </div>

              {/* Progress Timeline */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📜</span>
                  Progress Timeline
                </h2>

                {progressUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No progress updates yet</p>
                    <p className="text-gray-600 text-sm mt-1">Updates will appear here as your booster makes progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {progressUpdates.map((update) => {
                      const rankInfo = RANKS_MAP[update.rank_achieved as RankKey]
                      return (
                        <div key={update.id} className="relative pl-8 pb-4 border-l-2 border-purple-500/30 last:border-transparent">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-purple-500"></div>
                          
                          <div className="bg-slate-800/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 relative flex-shrink-0">
                                  {rankInfo?.image ? (
                                    <Image
                                      src={rankInfo.image}
                                      alt={rankInfo.name}
                                      fill
                                      className="object-contain"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                                  )}
                                </div>
                                <span className="text-white font-medium" style={{ color: rankInfo?.color }}>
                                  {rankInfo?.name}
                                </span>
                                {update.rr_achieved > 0 && (
                                  <span className="text-gray-400 text-sm">({update.rr_achieved} RR)</span>
                                )}
                              </div>
                              <span className="text-gray-500 text-xs">
                                {new Date(update.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            {update.games_played > 0 && (
                              <div className="flex gap-4 text-sm mb-2">
                                <span className="text-gray-400">
                                  Games: <span className="text-white">{update.games_played}</span>
                                </span>
                                <span className="text-gray-400">
                                  Wins: <span className="text-green-400">{update.games_won}</span>
                                </span>
                              </div>
                            )}

                            {update.booster_notes && (
                              <p className="text-gray-400 text-sm italic">"{update.booster_notes}"</p>
                            )}

                            {update.screenshot_url && (
                              <button
                                onClick={() => setLightboxImage(update.screenshot_url)}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium transition-colors mt-2"
                              >
                                📸 View Screenshot
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Status Card */}
              <div className={`bg-slate-900/80 border rounded-2xl p-6 ${
                order.payment_status === 'held' ? 'border-yellow-500/30' :
                order.payment_status === 'released' ? 'border-green-500/30' :
                order.payment_status === 'disputed' ? 'border-orange-500/30' :
                'border-white/10'
              }`}>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>{paymentConfig.icon}</span>
                  Payment Status
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${paymentConfig.color}`}>{paymentConfig.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{paymentConfig.description}</p>
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount Paid</span>
                      <span className="text-white font-bold">${totalPaid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Order Details</h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Game</span>
                    <span className="text-white">{order.game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue Type</span>
                    <span className="text-white capitalize">{order.queue_type}</span>
                  </div>
                  {order.is_priority && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority</span>
                      <span className="text-yellow-400">⚡ Yes</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 my-3"></div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Paid</span>
                    <span className="text-green-400 font-bold">${totalPaid.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {(order.addon_offline_mode || order.addon_solo_queue_only || order.addon_no_5_stack || order.addon_specific_agents) && (
                <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Add-ons</h2>
                  <div className="space-y-2">
                    {order.addon_offline_mode && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">Offline Mode</span>
                      </div>
                    )}
                    {order.addon_solo_queue_only && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">Solo Queue Only</span>
                      </div>
                    )}
                    {order.addon_no_5_stack && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">No 5-Stack</span>
                      </div>
                    )}
                    {order.addon_specific_agents && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-400">✓</span>
                        <span className="text-gray-300">Specific Agents</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Your Booster */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Your Booster</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {order.vendor?.avatar_url ? (
                      <img src={order.vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{order.vendor?.username?.charAt(0).toUpperCase() || 'B'}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{order.vendor?.username || 'Booster'}</p>
                    <Link 
                      href={getChatUrl()}
                      className="text-cyan-400 text-sm hover:underline"
                    >
                      Send Message →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Timeline</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Created</span>
                    <span className="text-white">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  {order.credentials_submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credentials Sent</span>
                      <span className="text-white">{new Date(order.credentials_submitted_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.started_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Boost Started</span>
                      <span className="text-white">{new Date(order.started_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.vendor_completed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Boost Completed</span>
                      <span className="text-white">{new Date(order.vendor_completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  {order.customer_confirmed_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confirmed</span>
                      <span className="text-green-400">{new Date(order.customer_confirmed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Completed Status - Payment Released */}
              {order.status === 'completed' && order.payment_status === 'released' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h3 className="text-lg font-bold text-green-400 mb-1">Boost Complete!</h3>
                  <p className="text-gray-400 text-sm">Thank you for using Nashflare</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}