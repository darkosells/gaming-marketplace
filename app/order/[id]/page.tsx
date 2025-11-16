'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { sendOrderEmails, sendDeliveredEmail, sendDisputeEmails, getSiteUrl } from '@/lib/email'

interface Order {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount: number
  quantity: number
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  completed_at: string | null
  delivered_at: string | null
  dispute_reason: string | null
  dispute_opened_at: string | null
  resolved_by: string | null
  resolution_notes: string | null
  resolution_type: string | null
  listing: {
    title: string
    game: string
    category: string
    image_url: string
    delivery_type: string
  }
  buyer: {
    username: string
  }
  seller: {
    username: string
  }
}

interface Dispute {
  id: string
  reason: string
  description: string
  evidence_urls: string[]
  status: string
  admin_notes: string | null
  created_at: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const mountedRef = useRef(true)
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [adminActions, setAdminActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  
  // Review form state
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [hasReviewed, setHasReviewed] = useState(false)

  useEffect(() => {
    mountedRef.current = true
    checkAuth()
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    if (user && profile) {
      fetchOrder()
    }
  }, [user, profile])

  // Timer effect for 48-hour countdown
  useEffect(() => {
    if (order?.status === 'delivered' && order.delivered_at) {
      const interval = setInterval(() => {
        const deliveredTime = new Date(order.delivered_at!).getTime()
        const now = Date.now()
        const millisecondsSinceDelivery = now - deliveredTime
        const hoursSinceDelivery = millisecondsSinceDelivery / (1000 * 60 * 60)
        const hoursRemaining = 48 - hoursSinceDelivery

        if (hoursRemaining <= 0) {
          setTimeRemaining('Auto-completing soon...')
          clearInterval(interval)
        } else {
          const hours = Math.floor(hoursRemaining)
          const minutes = Math.floor((hoursRemaining - hours) * 60)
          const seconds = Math.floor(((hoursRemaining - hours) * 60 - minutes) * 60)
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [order])

  const checkAuth = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      )
      
      const { data: { user }, error: authError } = await Promise.race([
        supabase.auth.getUser(),
        timeoutPromise
      ]) as any
      
      if (!mountedRef.current) return
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!mountedRef.current) return

      if (profileError) {
        setError('Failed to load profile')
        setLoading(false)
        return
      }

      setProfile(profileData)
    } catch (error: any) {
      console.error('Auth error:', error)
      if (!mountedRef.current) return
      
      if (error.message?.includes('timeout')) {
        setError('Connection timed out. Please refresh.')
      } else {
        router.push('/login')
      }
      setLoading(false)
    }
  }

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id(username),
          seller:profiles!seller_id(username)
        `)
        .eq('id', params.id)
        .single()

      if (!mountedRef.current) return

      if (error) throw error

      const isAdmin = profile?.is_admin === true
      if (data.buyer_id !== user.id && data.seller_id !== user.id && !isAdmin) {
        router.push('/dashboard')
        return
      }

      const orderWithListing = {
        ...data,
        listing: {
          title: data.listing_title || 'Unknown Item',
          game: data.listing_game || 'N/A',
          category: data.listing_category || 'account',
          image_url: data.listing_image_url || null,
          delivery_type: data.listing_delivery_type || 'manual'
        }
      }

      setOrder(orderWithListing)

      // Fetch additional data in parallel
      await Promise.allSettled([
        fetchDispute(data.status, params.id as string),
        fetchReviewStatus(data.status, data.buyer_id, params.id as string),
        fetchAdminActions(profile?.is_admin || data.dispute_opened_at)
      ])
    } catch (error: any) {
      console.error('Error fetching order:', error)
      if (mountedRef.current) {
        setError('Failed to load order details')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  const fetchDispute = async (status: string, orderId: string) => {
    if (status !== 'dispute_raised') return
    
    try {
      const { data: disputeData } = await supabase
        .from('disputes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (mountedRef.current && disputeData) {
        setDispute(disputeData)
      }
    } catch (error) {
      console.error('Error fetching dispute:', error)
    }
  }

  const fetchReviewStatus = async (status: string, buyerId: string, orderId: string) => {
    if (status !== 'completed' || buyerId !== user?.id) return

    try {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id')
        .eq('order_id', orderId)
        .single()

      if (mountedRef.current && reviewData) {
        setHasReviewed(true)
      }
    } catch (error) {
      // No review exists, which is fine
    }
  }

  const fetchAdminActions = async (shouldFetch: boolean) => {
    if (!shouldFetch) return

    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select(`
          *,
          admin:profiles!admin_actions_admin_id_fkey(username)
        `)
        .eq('target_type', 'order')
        .eq('target_id', params.id)
        .order('created_at', { ascending: false })

      if (!mountedRef.current) return
      if (!error) {
        setAdminActions(data || [])
      }
    } catch (error) {
      console.error('Error fetching admin actions:', error)
    }
  }

  const handleMarkAsDelivered = async () => {
    if (!confirm('Mark this order as delivered? The buyer will have 48 hours to confirm receipt or raise a dispute.')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      // Send delivery notification email to buyer
      if (order) {
        const { data: buyerData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.buyer_id)
          .single()

        if (buyerData?.email) {
          sendDeliveredEmail({
            id: order.id,
            listing_title: order.listing.title,
            buyer_email: buyerData.email,
            seller_username: order.seller.username,
            site_url: getSiteUrl()
          }).then(result => {
            if (result.success) {
              console.log('Delivery notification email sent!')
            } else {
              console.error('Failed to send delivery email:', result.error)
            }
          }).catch(err => {
            console.error('Error sending delivery email:', err)
          })
        }
      }

      alert('Order marked as delivered! The buyer has 48 hours to confirm or dispute.')
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to update order: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!confirm('Confirm that you received the item? This will complete the order.')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      setShowReviewModal(true)
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to confirm receipt: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim()) {
      alert('Please select a reason for the dispute')
      return
    }
    if (!disputeDescription.trim() || disputeDescription.length < 20) {
      alert('Please provide a detailed description (at least 20 characters)')
      return
    }

    setActionLoading(true)
    try {
      const evidenceUrls: string[] = []

      const { error } = await supabase
        .from('disputes')
        .insert({
          order_id: params.id,
          raised_by: user.id,
          reason: disputeReason,
          description: disputeDescription,
          evidence_urls: evidenceUrls,
          status: 'open'
        })

      if (error) throw error

      // Update order status to disputed
      await supabase
        .from('orders')
        .update({ 
          status: 'dispute_raised',
          dispute_reason: disputeReason,
          dispute_opened_at: new Date().toISOString()
        })
        .eq('id', params.id)

      // Send dispute notification emails to both parties
      if (order) {
        const { data: buyerData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.buyer_id)
          .single()

        const { data: sellerData } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.seller_id)
          .single()

        if (buyerData?.email && sellerData?.email) {
          sendDisputeEmails({
            id: order.id,
            listing_title: order.listing.title,
            buyer_email: buyerData.email,
            seller_email: sellerData.email,
            dispute_reason: disputeReason,
            is_buyer_raising: isBuyer,
            site_url: getSiteUrl()
          }).then(result => {
            if (result.success) {
              console.log('Dispute notification emails sent!')
            } else {
              console.error('Failed to send dispute emails:', result.error)
            }
          }).catch(err => {
            console.error('Error sending dispute emails:', err)
          })
        }
      }

      alert('Dispute raised successfully! Our support team will review it shortly.')
      setShowDisputeForm(false)
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to raise dispute: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Please select a star rating')
      return
    }

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: params.id,
          buyer_id: user.id,
          rating: rating,
          comment: reviewComment.trim() || null
        })

      if (error) throw error

      setShowReviewModal(false)
      setHasReviewed(true)
      alert('Thank you for your review!')
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to submit review: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleContactOtherParty = () => {
    router.push(`/messages?conversation=${order?.listing_id}`)
  }

  const handleSimulatePayment = async () => {
    if (!confirm('⚠️ TESTING ONLY: Simulate payment for this order?')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid'
        })
        .eq('id', params.id)

      if (error) throw error

      // Send email notifications
      if (order) {
        // Fetch buyer and seller emails from profiles
        const { data: buyerData } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('id', order.buyer_id)
          .single()

        const { data: sellerData } = await supabase
          .from('profiles')
          .select('email, username')
          .eq('id', order.seller_id)
          .single()

        if (buyerData?.email && sellerData?.email) {
          const emailResult = await sendOrderEmails({
            id: order.id,
            listing_title: order.listing.title,
            quantity: order.quantity,
            total_amount: order.amount + (order.amount * 0.05), // Include service fee
            seller_amount: order.amount * 0.95, // After 5% platform fee
            buyer_email: buyerData.email,
            seller_email: sellerData.email,
            buyer_username: buyerData.username,
            seller_username: sellerData.username,
            site_url: getSiteUrl()
          })

          if (emailResult.success) {
            console.log('Order notification emails sent!')
          } else {
            console.error('Failed to send emails:', emailResult.error)
          }
        }
      }

      alert('✅ Payment simulated! Email notifications sent.')
      setTimeout(() => {
        fetchOrder()
      }, 1000)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to simulate payment: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading order details...</p>
        </div>
      </div>
    )
  }

  // Not Found State
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-3xl font-bold text-white mb-4">Order Not Found</h1>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 transition">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isBuyer = order.buyer_id === user?.id
  const isSeller = order.seller_id === user?.id
  const isAdmin = profile?.is_admin === true
  const serviceFee = order.amount * 0.05
  const totalAmount = order.amount + serviceFee

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; border: string; text: string; icon: string; label: string }> = {
      paid: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '💳', label: 'Paid - Awaiting Delivery' },
      delivered: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '📦', label: 'Delivered - Awaiting Confirmation' },
      completed: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: '✅', label: 'Completed' },
      dispute_raised: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: '⚠️', label: 'Dispute Raised' },
      cancelled: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', icon: '❌', label: 'Cancelled' },
      refunded: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', icon: '💰', label: 'Refunded' }
    }
    return configs[status] || configs.paid
  }

  const statusConfig = getStatusConfig(order.status)

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* 2D Comic Space Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Stars */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        
        {/* Planet */}
        <div className="absolute top-[15%] right-[10%]">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative opacity-30">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-5xl mx-auto">
            {/* Admin View Notice */}
            {isAdmin && !isBuyer && !isSeller && (
              <div className="bg-orange-500/10 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👑</div>
                  <div>
                    <h3 className="text-orange-400 font-bold">Admin View</h3>
                    <p className="text-orange-200 text-sm">You are viewing this order as an administrator.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <Link 
                href={isAdmin && !isBuyer && !isSeller ? '/admin' : (isBuyer ? '/customer-dashboard' : '/dashboard')} 
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 transition group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {isAdmin && !isBuyer && !isSeller ? 'Admin Dashboard' : 'Dashboard'}
              </Link>
              
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="inline-block mb-3">
                      <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                        📋 Order #{order.id.substring(0, 8)}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Order Details</span>
                    </h1>
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
                    <span className="text-xl">{statusConfig.icon}</span>
                    <span className={`font-semibold ${statusConfig.text}`}>{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 48-Hour Timer Banner */}
            {order.status === 'delivered' && timeRemaining && isBuyer && (
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-xl border-2 border-yellow-500/50 rounded-2xl p-6 mb-6 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">⏱️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-yellow-400 mb-1">Action Required</h3>
                    <p className="text-2xl font-mono font-bold text-white mb-1">{timeRemaining}</p>
                    <p className="text-gray-300 text-sm">
                      Confirm receipt or raise a dispute. After 48 hours, this order auto-completes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Main Order Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 group">
                  {order.listing?.image_url ? (
                    <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'topup' ? '💰' : '🔑'}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{order.listing?.title || 'Unknown Item'}</h2>
                  <p className="text-purple-400 font-medium mb-4">{order.listing?.game || 'Unknown Game'}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Quantity</p>
                      <p className="text-white font-bold text-lg">{order.quantity}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Unit Price</p>
                      <p className="text-white font-bold text-lg">${(order.amount / order.quantity).toFixed(2)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Delivery</p>
                      <p className="text-white font-bold text-lg">
                        {order.listing?.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual'}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-xs text-gray-400 mb-1">Order Date</p>
                      <p className="text-white font-bold text-lg">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {order.delivered_at && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 inline-block">
                      <p className="text-green-400 text-sm font-medium">
                        ✓ Delivered on {new Date(order.delivered_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Participants Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">👥</span>
                  Participants
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Buyer</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {order.buyer.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-semibold text-lg">{order.buyer.username}</span>
                        {isBuyer && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">You</span>}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Seller</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {order.seller.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-white font-semibold text-lg">{order.seller.username}</span>
                        {isSeller && <span className="ml-2 text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full">You</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleContactOtherParty}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white py-3 rounded-xl font-semibold border border-purple-500/30 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>💬</span>
                  Send Message
                </button>
              </div>

              {/* Payment Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">💳</span>
                  Payment Details
                </h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-semibold">${order.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Service Fee (5%)</span>
                    <span className="text-white font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Total Paid</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Vendor Earnings - Only visible to seller */}
                {isSeller && (
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                    <h4 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <span>💰</span>
                      Your Earnings
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Order Amount</span>
                        <span className="text-white">${order.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Fee (5%)</span>
                        <span className="text-red-400">-${(order.amount * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-green-500/20 pt-2">
                        <div className="flex justify-between">
                          <span className="text-white font-bold">Net Earnings</span>
                          <span className="text-green-400 font-bold">${(order.amount * 0.95).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {order.status === 'completed' && (
                      <p className="text-xs text-green-400 mt-2 bg-green-500/10 px-2 py-1 rounded">✓ Released to balance</p>
                    )}
                    {order.status === 'delivered' && (
                      <p className="text-xs text-yellow-400 mt-2 bg-yellow-500/10 px-2 py-1 rounded">⏳ On hold (48h)</p>
                    )}
                    {order.status === 'paid' && (
                      <p className="text-xs text-blue-400 mt-2 bg-blue-500/10 px-2 py-1 rounded">📦 Deliver to release</p>
                    )}
                    {order.status === 'dispute_raised' && (
                      <p className="text-xs text-red-400 mt-2 bg-red-500/10 px-2 py-1 rounded">⚠️ Frozen - dispute</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                  <span className="text-sm text-gray-400">Payment Status</span>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 
                    order.payment_status === 'failed' ? 'bg-red-500/20 text-red-400' : 
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {order.payment_status.toUpperCase()}
                  </span>
                </div>

                {/* Testing Payment Button */}
                {order.payment_status === 'pending' && isBuyer && (
                  <div className="mt-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                      <p className="text-yellow-400 text-xs">
                        ⚠️ TESTING: In production, you'd pay via Stripe.
                      </p>
                    </div>
                    <button
                      onClick={handleSimulatePayment}
                      disabled={actionLoading}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/30 transition-all disabled:opacity-50"
                    >
                      💳 Simulate Payment
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 hover:border-purple-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">⚡</span>
                Actions
              </h3>

              <div className="space-y-3">
                {/* Seller: Mark as Delivered */}
                {isSeller && order.status === 'paid' && order.listing.delivery_type === 'manual' && (
                  <button
                    onClick={handleMarkAsDelivered}
                    disabled={actionLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Mark as Delivered
                  </button>
                )}

                {/* Buyer: Confirm or Dispute */}
                {isBuyer && order.status === 'delivered' && !showDisputeForm && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <button
                      onClick={handleConfirmReceipt}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>✓</span>
                      Confirm Receipt
                    </button>
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      disabled={actionLoading}
                      className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 py-4 rounded-xl font-bold border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span>⚠️</span>
                      Raise Dispute
                    </button>
                  </div>
                )}

                {/* Dispute Form */}
                {isBuyer && showDisputeForm && order.status === 'delivered' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <h4 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span>
                      Raise a Dispute
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Reason <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all [&>option]:bg-slate-800"
                        >
                          <option value="">Select a reason...</option>
                          <option value="Item not received">Item not received</option>
                          <option value="Wrong item received">Wrong item received</option>
                          <option value="Item not as described">Item not as described</option>
                          <option value="Account credentials invalid">Account credentials invalid</option>
                          <option value="Code already used">Code already used</option>
                          <option value="Seller not responding">Seller not responding</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={disputeDescription}
                          onChange={(e) => setDisputeDescription(e.target.value)}
                          placeholder="Provide detailed information about the issue..."
                          rows={4}
                          maxLength={1000}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {disputeDescription.length}/1000 (min 20)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Evidence (Optional)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            if (files.length > 3) {
                              alert('Maximum 3 files')
                              e.target.value = ''
                              return
                            }
                            setEvidenceFiles(files)
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-red-500/20 file:text-red-400 hover:file:bg-red-500/30 transition-all"
                        />
                        {evidenceFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {evidenceFiles.map((file, idx) => (
                              <p key={idx} className="text-sm text-green-400">✓ {file.name}</p>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSubmitDispute}
                          disabled={actionLoading}
                          className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                        >
                          Submit Dispute
                        </button>
                        <button
                          onClick={() => setShowDisputeForm(false)}
                          disabled={actionLoading}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold border border-white/10 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buyer: Raise Dispute for paid orders */}
                {isBuyer && order.status === 'paid' && (
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    disabled={actionLoading}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-xl font-semibold border border-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>⚠️</span>
                    Raise Dispute
                  </button>
                )}

                {/* Dispute Info */}
                {order.status === 'dispute_raised' && dispute && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-red-400 font-bold text-lg">Dispute Active</p>
                        <p className="text-sm text-gray-400">
                          Opened: {new Date(dispute.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        dispute.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' :
                        dispute.status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
                        dispute.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {dispute.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Reason:</p>
                        <p className="text-gray-300">{dispute.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Description:</p>
                        <p className="text-gray-300 text-sm">{dispute.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-400 text-sm">
                        💬 Support is reviewing. You can message the {isBuyer ? 'seller' : 'buyer'} directly.
                      </p>
                    </div>
                  </div>
                )}

                {/* Leave Review */}
                {isBuyer && order.status === 'completed' && !hasReviewed && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-yellow-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>⭐</span>
                    Leave a Review
                  </button>
                )}

                {/* Already Reviewed */}
                {isBuyer && order.status === 'completed' && hasReviewed && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-400 text-center font-medium">
                      ✓ You have reviewed this order. Thank you!
                    </p>
                  </div>
                )}

                {/* Admin Notice */}
                {isAdmin && !isBuyer && !isSeller && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-orange-400 text-sm">
                      👑 Admin view - manage via Admin Dashboard.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6 hover:border-purple-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-purple-400">📋</span>
                Order Timeline
              </h3>
              
              <div className="space-y-0">
                {/* Order Created */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                      <span className="text-blue-400 text-xl">🛒</span>
                    </div>
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/30 to-transparent min-h-[40px]"></div>
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="text-white font-semibold">Order Created</p>
                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Placed by {order.buyer.username}</p>
                  </div>
                </div>

                {/* Payment */}
                {order.payment_status === 'paid' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                        <span className="text-green-400 text-xl">💳</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-green-500/30 to-transparent min-h-[40px]"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-white font-semibold">Payment Confirmed</p>
                      <p className="text-sm text-gray-400">Payment received</p>
                    </div>
                  </div>
                )}

                {/* Delivered */}
                {order.delivered_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
                        <span className="text-yellow-400 text-xl">📦</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-yellow-500/30 to-transparent min-h-[40px]"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-white font-semibold">Item Delivered</p>
                      <p className="text-sm text-gray-400">{new Date(order.delivered_at).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">By {order.seller.username}</p>
                    </div>
                  </div>
                )}

                {/* Dispute */}
                {order.dispute_opened_at && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                        <span className="text-red-400 text-xl">⚠️</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-red-500/30 to-transparent min-h-[40px]"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-white font-semibold">Dispute Raised</p>
                      <p className="text-sm text-gray-400">{new Date(order.dispute_opened_at).toLocaleString()}</p>
                      {order.dispute_reason && (
                        <p className="text-xs text-red-400 mt-1">Reason: {order.dispute_reason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {adminActions.map((action) => (
                  <div key={action.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                        <span className="text-orange-400 text-xl">👑</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-500/30 to-transparent min-h-[40px]"></div>
                    </div>
                    <div className="flex-1 pb-6">
                      <p className="text-white font-semibold">
                        {action.action_type === 'dispute_resolved_buyer' ? 'Dispute - Buyer Refunded' :
                         action.action_type === 'dispute_resolved_seller' ? 'Dispute - Order Completed' :
                         action.description}
                      </p>
                      <p className="text-sm text-gray-400">{new Date(action.created_at).toLocaleString()}</p>
                      <p className="text-xs text-orange-400 mt-1">Admin: {action.admin?.username || 'Unknown'}</p>
                      {action.metadata?.notes && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-2 mt-2">
                          <p className="text-xs text-gray-400">Notes:</p>
                          <p className="text-sm text-white">{action.metadata.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Completed/Refunded */}
                {order.completed_at && (order.status === 'completed' || order.status === 'refunded') && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        order.status === 'refunded' 
                          ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/30' 
                          : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30'
                      }`}>
                        <span className={order.status === 'refunded' ? 'text-orange-400 text-xl' : 'text-green-400 text-xl'}>
                          {order.status === 'refunded' ? '💰' : '✅'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {order.status === 'refunded' ? 'Order Refunded' : 'Order Completed'}
                      </p>
                      <p className="text-sm text-gray-400">{new Date(order.completed_at).toLocaleString()}</p>
                      {order.resolution_notes && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-2 mt-2">
                          <p className="text-xs text-gray-400">Resolution:</p>
                          <p className="text-sm text-white">{order.resolution_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Rate Your Experience</h2>
            <p className="text-gray-300 mb-6">How was your purchase from {order?.seller.username}?</p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="text-5xl transition-all hover:scale-125"
                >
                  {star <= (hoveredRating || rating) ? (
                    <span className="text-yellow-400 drop-shadow-lg">★</span>
                  ) : (
                    <span className="text-gray-600">★</span>
                  )}
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-center text-white font-semibold mb-4">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}

            {/* Review Comment */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-white mb-2">
                Your Review (Optional)
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">{reviewComment.length}/500</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitReview}
                disabled={rating === 0 || actionLoading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50"
              >
                Submit Review
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                disabled={actionLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold border border-white/10 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}