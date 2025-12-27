'use client'

// ============================================================================
// VENDOR BOOST ORDER PAGE (Fixed Progress Modal + Boosting Chat + Emails)
// ============================================================================
// Location: app/boosting/vendor/orders/[id]/page.tsx
// ============================================================================

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { RANKS_MAP, getDivisionsBetween } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'
import { formatPrice } from '@/lib/boosting/pricing'
import { 
  sendBoostStartedEmail, 
  sendBoostProgressUpdateEmail, 
  sendBoostPendingConfirmationEmail 
} from '@/lib/email'

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
  status: string
  payment_status: string
  created_at: string
  credentials_submitted_at: string | null
  started_at: string | null
  vendor_completed_at: string | null
  completed_at: string | null
  estimated_days?: number
  customer?: {
    id: string
    username: string
    avatar_url: string | null
    email?: string
  }
}

interface Credentials {
  riot_username_encrypted: string
  riot_password_encrypted: string
  has_2fa: boolean
  two_fa_notes: string | null
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  awaiting_credentials: { label: 'Awaiting Credentials', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30', icon: '⏳' },
  credentials_received: { label: 'Ready to Start', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: '🔐' },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30', icon: '🎮' },
  pending_confirmation: { label: 'Awaiting Confirmation', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', icon: '✓' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: '🏆' },
  dispute: { label: 'Dispute', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', icon: '⚠️' }
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400' },
  held: { label: 'Held in Escrow', color: 'text-blue-400' },
  released: { label: 'Released', color: 'text-green-400' },
  refunded: { label: 'Refunded', color: 'text-red-400' }
}

export default function VendorBoostOrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [vendorProfile, setVendorProfile] = useState<any>(null)
  const [order, setOrder] = useState<BoostingOrder | null>(null)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [progressUpdates, setProgressUpdates] = useState<ProgressUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  // Progress form state
  const [progressRank, setProgressRank] = useState<RankKey | ''>('')
  const [progressRR, setProgressRR] = useState(0)
  const [gamesPlayed, setGamesPlayed] = useState(0)
  const [gamesWon, setGamesWon] = useState(0)
  const [boosterNotes, setBoosterNotes] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [submittingProgress, setSubmittingProgress] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [progressError, setProgressError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push(`/login?redirect=/boosting/vendor/orders/${orderId}`)
          return
        }
        
        setUser(session.user)
        
        // Fetch vendor profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', session.user.id)
          .single()
        
        setVendorProfile(profile)
        
        await fetchOrder(session.user.id)
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, orderId])

  const fetchOrder = async (userId: string) => {
    // Fetch order with customer email
    const { data: orderData, error: orderError } = await supabase
      .from('boosting_orders')
      .select(`
        *,
        customer:profiles!boosting_orders_customer_id_fkey (
          id,
          username,
          avatar_url,
          email
        )
      `)
      .eq('id', orderId)
      .eq('vendor_id', userId)
      .single()

    if (orderError || !orderData) {
      console.error('Error fetching order:', orderError)
      router.push('/dashboard')
      return
    }

    setOrder(orderData)

    // Set initial progress rank
    if (orderData.progress_current_rank) {
      setProgressRank(orderData.progress_current_rank as RankKey)
    } else {
      setProgressRank(orderData.current_rank as RankKey)
    }

    // Fetch credentials if available
    if (orderData.status !== 'awaiting_credentials') {
      const { data: credData } = await supabase
        .from('boosting_credentials')
        .select('*')
        .eq('order_id', orderId)
        .single()
      
      if (credData) {
        setCredentials(credData)
      }
    }

    // Fetch progress updates
    const { data: progressData } = await supabase
      .from('boosting_progress')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    setProgressUpdates(progressData || [])
  }

  const handleStartBoost = async () => {
    if (!order) return

    try {
      const { error } = await supabase
        .from('boosting_orders')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // ========== SEND EMAIL TO CUSTOMER ==========
      const customer = order.customer
      if (customer?.email) {
        const currentRankData = RANKS_MAP[order.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[order.desired_rank as RankKey]
        
        await sendBoostStartedEmail({
          customerEmail: customer.email,
          customerUsername: customer.username || 'Customer',
          boosterUsername: vendorProfile?.username || 'Booster',
          currentRank: currentRankData?.name || order.current_rank,
          desiredRank: desiredRankData?.name || order.desired_rank,
          orderNumber: order.order_number,
          orderId: order.id
        })
      }
      // =============================================

      await fetchOrder(user.id)
    } catch (err) {
      console.error('Error starting boost:', err)
    }
  }

  const handleOpenProgressModal = () => {
    // Reset form state when opening
    setProgressError(null)
    if (order?.progress_current_rank) {
      setProgressRank(order.progress_current_rank as RankKey)
      setProgressRR(order.progress_current_rr || 0)
    } else if (order?.current_rank) {
      setProgressRank(order.current_rank as RankKey)
      setProgressRR(order.current_rr || 0)
    }
    setGamesPlayed(0)
    setGamesWon(0)
    setBoosterNotes('')
    setScreenshotFile(null)
    setShowProgressModal(true)
  }

  const handleSubmitProgress = async () => {
    if (!order || !progressRank) {
      setProgressError('Please select a rank')
      return
    }

    setSubmittingProgress(true)
    setProgressError(null)

    try {
      let screenshotUrl: string | null = null

      // Upload screenshot if provided
      if (screenshotFile) {
        const fileExt = screenshotFile.name.split('.').pop()
        const fileName = `${orderId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('boost-screenshots')
          .upload(fileName, screenshotFile)

        if (uploadError) {
          console.error('Screenshot upload error:', uploadError)
          // Continue without screenshot - don't fail the whole operation
        } else if (data) {
          const { data: { publicUrl } } = supabase.storage
            .from('boost-screenshots')
            .getPublicUrl(fileName)
          screenshotUrl = publicUrl
        }
      }

      // Create progress update
      const { error: progressError } = await supabase
        .from('boosting_progress')
        .insert({
          order_id: orderId,
          rank_achieved: progressRank,
          rr_achieved: progressRR,
          games_played: gamesPlayed,
          games_won: gamesWon,
          screenshot_url: screenshotUrl,
          booster_notes: boosterNotes || null
        })

      if (progressError) {
        console.error('Progress insert error:', progressError)
        throw new Error('Failed to save progress update')
      }

      // Update order progress
      const { error: orderError } = await supabase
        .from('boosting_orders')
        .update({
          progress_current_rank: progressRank,
          progress_current_rr: progressRR,
          status: 'in_progress'
        })
        .eq('id', orderId)

      if (orderError) {
        console.error('Order update error:', orderError)
        throw new Error('Failed to update order progress')
      }

      // ========== SEND PROGRESS UPDATE EMAIL TO CUSTOMER ==========
      const customer = order.customer
      if (customer?.email) {
        const currentRankData = RANKS_MAP[order.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[order.desired_rank as RankKey]
        const newRankData = RANKS_MAP[progressRank as RankKey]
        
        await sendBoostProgressUpdateEmail({
          customerEmail: customer.email,
          customerUsername: customer.username || 'Customer',
          boosterUsername: vendorProfile?.username || 'Booster',
          currentRank: currentRankData?.name || order.current_rank,
          desiredRank: desiredRankData?.name || order.desired_rank,
          newRank: newRankData?.name || progressRank,
          newRR: progressRR,
          gamesPlayed: gamesPlayed,
          gamesWon: gamesWon,
          notes: boosterNotes || undefined,
          orderNumber: order.order_number,
          orderId: order.id
        })
      }
      // ============================================================

      // Close modal and refresh data
      setShowProgressModal(false)
      await fetchOrder(user.id)
    } catch (err: any) {
      console.error('Error submitting progress:', err)
      setProgressError(err.message || 'Failed to submit progress. Please try again.')
    } finally {
      setSubmittingProgress(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!order) return

    setCompleting(true)

    try {
      const { error } = await supabase
        .from('boosting_orders')
        .update({
          status: 'pending_confirmation',
          progress_current_rank: order.desired_rank,
          vendor_completed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // ========== SEND PENDING CONFIRMATION EMAIL TO CUSTOMER ==========
      const customer = order.customer
      if (customer?.email) {
        const currentRankData = RANKS_MAP[order.current_rank as RankKey]
        const desiredRankData = RANKS_MAP[order.desired_rank as RankKey]
        const startRankData = RANKS_MAP[order.current_rank as RankKey]
        const finalRankData = RANKS_MAP[order.desired_rank as RankKey]
        
        // Calculate total stats
        const totalGames = progressUpdates.reduce((sum, u) => sum + (u.games_played || 0), 0)
        const totalWins = progressUpdates.reduce((sum, u) => sum + (u.games_won || 0), 0)
        const latestProgress = progressUpdates[0]
        
        await sendBoostPendingConfirmationEmail({
          customerEmail: customer.email,
          customerUsername: customer.username || 'Customer',
          boosterUsername: vendorProfile?.username || 'Booster',
          currentRank: currentRankData?.name || order.current_rank,
          desiredRank: desiredRankData?.name || order.desired_rank,
          startRank: startRankData?.name || order.current_rank,
          finalRank: finalRankData?.name || order.desired_rank,
          finalRR: latestProgress?.rr_achieved || 0,
          totalGames: totalGames,
          totalWins: totalWins,
          orderNumber: order.order_number,
          orderId: order.id
        })
      }
      // =================================================================

      setShowCompleteModal(false)
      await fetchOrder(user.id)
    } catch (err) {
      console.error('Error marking complete:', err)
    } finally {
      setCompleting(false)
    }
  }

  // Generate chat URL for boosting orders
  const getChatUrl = () => {
    if (!order) return '/messages'
    return `/messages?boostOrder=${order.id}&vendorId=${order.vendor_id}&customerId=${order.customer_id}`
  }

  // Helper: Calculate time elapsed
  const getTimeElapsed = (startDate: string) => {
    const start = new Date(startDate)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // Helper: Calculate progress percentage
  const getProgressPercentage = (order: BoostingOrder) => {
    const allRanks = Object.keys(RANKS_MAP) as RankKey[]
    const startIndex = allRanks.indexOf(order.current_rank as RankKey)
    const endIndex = allRanks.indexOf(order.desired_rank as RankKey)
    const currentIndex = order.progress_current_rank 
      ? allRanks.indexOf(order.progress_current_rank as RankKey)
      : startIndex
    
    if (endIndex === startIndex) return 100
    const progress = ((currentIndex - startIndex) / (endIndex - startIndex)) * 100
    return Math.min(Math.max(progress, 0), 100)
  }

  // Helper: Get total stats from progress updates
  const getTotalStats = () => {
    const totalGames = progressUpdates.reduce((sum, u) => sum + (u.games_played || 0), 0)
    const totalWins = progressUpdates.reduce((sum, u) => sum + (u.games_won || 0), 0)
    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
    return { totalGames, totalWins, winRate }
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
  const progressRankInfo = order.progress_current_rank ? RANKS_MAP[order.progress_current_rank as RankKey] : currentRank
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.pending
  const progressPercent = getProgressPercentage(order)
  const totalStats = getTotalStats()
  const totalDivisions = getDivisionsBetween(order.current_rank as RankKey, order.desired_rank as RankKey)

  // Get ranks for dropdown (from current to desired)
  const allRanks = Object.keys(RANKS_MAP) as RankKey[]
  const startIndex = allRanks.indexOf(order.current_rank as RankKey)
  const endIndex = allRanks.indexOf(order.desired_rank as RankKey)
  const availableRanks = allRanks.slice(startIndex, endIndex + 1)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ================================================================ */}
      {/* PROGRESS UPDATE MODAL - Fixed Position Overlay */}
      {/* ================================================================ */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowProgressModal(false)}
          ></div>
          <div className="relative bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-cyan-400">📊</span>
                Update Progress
              </h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Error Message */}
            {progressError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {progressError}
              </div>
            )}

            <div className="space-y-4">
              {/* Rank Selection */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Current Rank Achieved <span className="text-red-400">*</span>
                </label>
                <select
                  value={progressRank}
                  onChange={(e) => setProgressRank(e.target.value as RankKey)}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                >
                  <option value="">Select rank...</option>
                  {availableRanks.map((rank) => (
                    <option key={rank} value={rank}>
                      {RANKS_MAP[rank].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* RR */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Current RR (0-100)</label>
                <input
                  type="number"
                  value={progressRR}
                  onChange={(e) => setProgressRR(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  min={0}
                  max={100}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Games */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Games Played</label>
                  <input
                    type="number"
                    value={gamesPlayed}
                    onChange={(e) => setGamesPlayed(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Games Won</label>
                  <input
                    type="number"
                    value={gamesWon}
                    onChange={(e) => setGamesWon(Math.min(gamesPlayed, Math.max(0, parseInt(e.target.value) || 0)))}
                    min={0}
                    max={gamesPlayed}
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Win Rate Display */}
              {gamesPlayed > 0 && (
                <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                  <span className="text-gray-400 text-sm">Win Rate: </span>
                  <span className={`font-bold ${Math.round((gamesWon / gamesPlayed) * 100) >= 50 ? 'text-green-400' : 'text-orange-400'}`}>
                    {Math.round((gamesWon / gamesPlayed) * 100)}%
                  </span>
                </div>
              )}

              {/* Screenshot */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Screenshot (Optional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
                >
                  {screenshotFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-cyan-400">📸</span>
                      <span className="text-cyan-400 truncate max-w-[200px]">{screenshotFile.name}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setScreenshotFile(null) }}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-400">📷 Click to upload screenshot</p>
                      <p className="text-gray-600 text-xs mt-1">PNG, JPG up to 5MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Notes for Customer (Optional)</label>
                <textarea
                  value={boosterNotes}
                  onChange={(e) => setBoosterNotes(e.target.value)}
                  placeholder="E.g., 'Reached Gold 2 with 65% win rate. Should hit Gold 3 tomorrow.'"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitProgress}
                  disabled={submittingProgress || !progressRank}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:from-cyan-400 hover:to-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submittingProgress ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>Submit Update</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* COMPLETE MODAL */}
      {/* ================================================================ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCompleteModal(false)}></div>
          <div className="relative bg-slate-900 border border-green-500/30 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Mark Boost Complete
            </h3>
            <p className="text-gray-400 mb-4">
              Confirm that you have reached <strong className="text-white">{desiredRank?.name}</strong> on the customer's account.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                ⚠️ Make sure to upload a final screenshot before marking complete. The customer will need to confirm completion before payment is released.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-400 hover:to-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Mark Complete ✓'
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
          {/* Back Link */}
          <Link 
            href="/boosting/vendor/orders"
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 mb-6"
          >
            <span>←</span> Back to My Orders
          </Link>

          {/* Header with Status-Based Border */}
          <div className={`bg-slate-900/80 border ${statusConfig.borderColor} rounded-2xl p-6 mb-6`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{statusConfig.icon}</span>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">Boost Order</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} ${statusConfig.bgColor}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <p className="text-gray-400 font-mono">{order.order_number}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {order.status === 'credentials_received' && (
                  <button
                    onClick={handleStartBoost}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:from-cyan-400 hover:to-blue-400 transition-colors flex items-center gap-2"
                  >
                    <span>🎮</span> Start Boosting
                  </button>
                )}
                {order.status === 'in_progress' && (
                  <>
                    <button
                      onClick={handleOpenProgressModal}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-400 hover:to-pink-400 transition-colors flex items-center gap-2"
                    >
                      <span>📊</span> Update Progress
                    </button>
                    <button
                      onClick={() => setShowCompleteModal(true)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-400 hover:to-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <span>✓</span> Mark Complete
                    </button>
                  </>
                )}
                <Link
                  href={getChatUrl()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors flex items-center gap-2"
                >
                  <span>💬</span> Chat with Customer
                </Link>
              </div>
            </div>
          </div>

          {/* Visual Progress Tracker */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-cyan-400">📈</span>
              Rank Progress
            </h2>
            
            <div className="relative">
              {/* Progress Bar Background */}
              <div className="flex items-center justify-between mb-2">
                {/* Start Rank */}
                <div className="text-center z-10">
                  <div className="w-16 h-16 relative mx-auto mb-2 rounded-xl bg-slate-800 p-1 ring-2 ring-cyan-500/50">
                    {currentRank?.image ? (
                      <Image
                        src={currentRank.image}
                        alt={currentRank.name}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: currentRank?.color }}>{currentRank?.name}</p>
                  <p className="text-[10px] text-gray-500">Start</p>
                </div>

                {/* Progress Bar */}
                <div className="flex-1 mx-4 relative">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">0%</span>
                    <span className="text-xs text-cyan-400 font-bold">{Math.round(progressPercent)}%</span>
                    <span className="text-xs text-gray-500">100%</span>
                  </div>
                </div>

                {/* Current Progress */}
                {order.progress_current_rank && order.progress_current_rank !== order.current_rank && order.progress_current_rank !== order.desired_rank && (
                  <div className="text-center z-10">
                    <div className="w-14 h-14 relative mx-auto mb-2 rounded-xl bg-slate-800 p-1 ring-2 ring-purple-500/50">
                      {progressRankInfo?.image ? (
                        <Image
                          src={progressRankInfo.image}
                          alt={progressRankInfo.name}
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎮</div>
                      )}
                    </div>
                    <p className="text-xs font-medium" style={{ color: progressRankInfo?.color }}>{progressRankInfo?.name}</p>
                    <p className="text-[10px] text-purple-400">Current</p>
                  </div>
                )}

                {/* End Rank */}
                <div className="text-center z-10">
                  <div className="w-16 h-16 relative mx-auto mb-2 rounded-xl bg-slate-800 p-1 ring-2 ring-pink-500/50">
                    {desiredRank?.image ? (
                      <Image
                        src={desiredRank.image}
                        alt={desiredRank.name}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                    )}
                  </div>
                  <p className="text-xs font-medium" style={{ color: desiredRank?.color }}>{desiredRank?.name}</p>
                  <p className="text-[10px] text-gray-500">Target</p>
                </div>
              </div>

              {/* Divisions Info */}
              <div className="text-center mt-4 pt-4 border-t border-white/5">
                <p className="text-gray-400 text-sm">
                  <span className="text-white font-medium">{totalDivisions}</span> divisions to climb
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Stats Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-cyan-400">{totalStats.totalGames}</p>
                  <p className="text-xs text-gray-400">Games Played</p>
                </div>
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{totalStats.totalWins}</p>
                  <p className="text-xs text-gray-400">Games Won</p>
                </div>
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-purple-400">{totalStats.winRate}%</p>
                  <p className="text-xs text-gray-400">Win Rate</p>
                </div>
                <div className="bg-slate-900/80 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-pink-400">{progressUpdates.length}</p>
                  <p className="text-xs text-gray-400">Updates</p>
                </div>
              </div>

              {/* Security Reminder */}
              {credentials && order.status !== 'completed' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">🔒</span>
                    <div>
                      <h3 className="text-red-400 font-bold text-sm">Security Reminder</h3>
                      <ul className="text-red-300/80 text-xs mt-1 space-y-1">
                        <li>• Never share credentials with anyone</li>
                        <li>• Don't modify account settings</li>
                        <li>• Credentials are encrypted and will be revoked after completion</li>
                        <li>• Play in offline mode if requested</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Card */}
              {credentials && (
                <div className={`bg-slate-900/80 border ${statusConfig.borderColor} rounded-2xl p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-400">🔐</span>
                      Account Credentials
                    </h2>
                    <button
                      onClick={() => setShowCredentials(!showCredentials)}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 transition-colors"
                    >
                      {showCredentials ? '🙈 Hide' : '👁️ Show'}
                    </button>
                  </div>

                  {showCredentials ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-800 rounded-xl">
                        <label className="text-gray-400 text-xs uppercase tracking-wide">Username</label>
                        <p className="text-white font-mono text-lg mt-1">{credentials.riot_username_encrypted}</p>
                      </div>
                      <div className="p-4 bg-slate-800 rounded-xl">
                        <label className="text-gray-400 text-xs uppercase tracking-wide">Password</label>
                        <p className="text-white font-mono text-lg mt-1">{credentials.riot_password_encrypted}</p>
                      </div>
                      {credentials.has_2fa && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-400">⚠️</span>
                            <span className="text-yellow-400 font-medium">2FA Enabled</span>
                          </div>
                          {credentials.two_fa_notes && (
                            <p className="text-yellow-300/80 text-sm">{credentials.two_fa_notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 bg-slate-800/50 rounded-xl text-center">
                      <p className="text-gray-500">Click "Show" to view credentials</p>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Progress History */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400">📜</span>
                    Progress History
                  </h2>
                  {order.status === 'in_progress' && (
                    <button
                      onClick={handleOpenProgressModal}
                      className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center gap-2"
                    >
                      <span>+</span> Add Update
                    </button>
                  )}
                </div>

                {progressUpdates.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-500">No progress updates yet</p>
                    <p className="text-gray-600 text-sm mt-1">Click "Update Progress" to submit your first update</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-purple-500 to-pink-500"></div>
                    
                    <div className="space-y-6">
                      {progressUpdates.map((update, index) => {
                        const rankInfo = RANKS_MAP[update.rank_achieved as RankKey]
                        const winRate = update.games_played > 0 
                          ? Math.round((update.games_won / update.games_played) * 100) 
                          : 0
                        
                        return (
                          <div key={update.id} className="relative pl-16">
                            {/* Timeline Node */}
                            <div className="absolute left-0 w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
                              {rankInfo?.image ? (
                                <Image
                                  src={rankInfo.image}
                                  alt={rankInfo.name}
                                  fill
                                  className="object-contain p-1"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-xl">🎮</span>
                              )}
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium" style={{ color: rankInfo?.color }}>
                                    {rankInfo?.name}
                                  </span>
                                  {update.rr_achieved > 0 && (
                                    <span className="text-gray-400 text-sm">({update.rr_achieved} RR)</span>
                                  )}
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">Latest</span>
                                  )}
                                </div>
                                <span className="text-gray-500 text-xs">
                                  {new Date(update.created_at).toLocaleString()}
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
                                  <span className="text-gray-400">
                                    Win Rate: <span className={`${winRate >= 50 ? 'text-green-400' : 'text-orange-400'}`}>{winRate}%</span>
                                  </span>
                                </div>
                              )}
                              
                              {update.booster_notes && (
                                <p className="text-gray-400 text-sm italic">"{update.booster_notes}"</p>
                              )}
                              
                              {update.screenshot_url && (
                                <a 
                                  href={update.screenshot_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1 text-cyan-400 text-sm mt-2 hover:underline"
                                >
                                  📸 View Screenshot
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Time Tracking */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-yellow-400">⏱️</span>
                  Time Tracking
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Created</span>
                    <span className="text-white">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {order.started_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Started</span>
                      <span className="text-cyan-400">{getTimeElapsed(order.started_at)} ago</span>
                    </div>
                  )}
                  
                  {order.estimated_days && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Estimated</span>
                      <span className="text-white">{order.estimated_days} days</span>
                    </div>
                  )}
                  
                  {order.vendor_completed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Completed At</span>
                      <span className="text-green-400">{new Date(order.vendor_completed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {order.started_at && !order.vendor_completed_at && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="text-center">
                        <p className="text-gray-500 text-xs mb-1">Active Time</p>
                        <p className="text-2xl font-bold text-cyan-400">{getTimeElapsed(order.started_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings Display */}
              <div className="bg-slate-900/80 border border-green-500/20 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-green-400">💰</span>
                  Earnings
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Order Total</span>
                    <span className="text-white">{formatPrice(order.final_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Fee (8%)</span>
                    <span className="text-red-400">-{formatPrice(order.platform_fee)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300 font-medium">Your Payout</span>
                      <span className="text-2xl font-bold text-green-400">{formatPrice(order.vendor_payout)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Payment Status</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${paymentConfig.color} bg-white/5`}>
                        {paymentConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Order Details</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Game</span>
                    <span className="text-white capitalize">{order.game}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Queue</span>
                    <span className="text-white capitalize">{order.queue_type}</span>
                  </div>
                  {order.is_priority && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Priority</span>
                      <span className="text-yellow-400">⚡ Yes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add-ons */}
              {(order.addon_offline_mode || order.addon_solo_queue_only || order.addon_no_5_stack || order.addon_specific_agents) && (
                <div className="bg-slate-900/80 border border-yellow-500/20 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-yellow-400">⚠️</span>
                    Requirements
                  </h2>
                  <div className="space-y-2">
                    {order.addon_offline_mode && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-400">🔇</span>
                        <span className="text-yellow-300">Play in Offline Mode</span>
                      </div>
                    )}
                    {order.addon_solo_queue_only && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-400">👤</span>
                        <span className="text-yellow-300">Solo Queue Only</span>
                      </div>
                    )}
                    {order.addon_no_5_stack && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <span className="text-yellow-400">🚫</span>
                        <span className="text-yellow-300">No 5-Stack</span>
                      </div>
                    )}
                    {order.addon_specific_agents && order.specific_agents_list && (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <span className="text-yellow-400">🎯</span>
                          <span className="text-yellow-300">Specific Agents</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {order.specific_agents_list.map((agent) => (
                            <span key={agent} className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs">
                              {agent}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Customer</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden">
                    {order.customer?.avatar_url ? (
                      <img src={order.customer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{order.customer?.username?.charAt(0).toUpperCase() || 'C'}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{order.customer?.username || 'Customer'}</p>
                    <Link href={getChatUrl()} className="text-cyan-400 text-sm hover:underline">
                      Send Message →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}