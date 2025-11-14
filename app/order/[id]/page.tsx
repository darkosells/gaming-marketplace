'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

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
  
  const [user, setUser] = useState<any>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null)
  
  // Dispute form state
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDescription, setDisputeDescription] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrder()
    }
  }, [user])

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
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s remaining to confirm or dispute`)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [order])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
  }

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          listing:listings(title, game, category, image_url, delivery_type),
          buyer:profiles!buyer_id(username),
          seller:profiles!seller_id(username)
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user is part of this order
      if (data.buyer_id !== user.id && data.seller_id !== user.id) {
        router.push('/dashboard')
        return
      }

      setOrder(data)

      // Fetch dispute if exists
      if (data.status === 'dispute_raised') {
        const { data: disputeData } = await supabase
          .from('disputes')
          .select('*')
          .eq('order_id', params.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (disputeData) {
          setDispute(disputeData)
        }
      }
    } catch (error: any) {
      console.error('Error fetching order:', error)
      alert('Failed to load order')
    } finally {
      setLoading(false)
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
    if (!confirm('Confirm that you received the item? This will complete the order and you can leave a review.')) return

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

      // TODO: Show review modal/form here
      alert('Order completed! Thank you for your purchase.\n\n(Review system coming soon!)')
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
      // TODO: Upload evidence files to Supabase Storage
      // For now, we'll just create the dispute without file uploads
      const evidenceUrls: string[] = []

      // If you want to implement file uploads, uncomment and modify:
      // for (const file of evidenceFiles) {
      //   const fileExt = file.name.split('.').pop()
      //   const fileName = `${user.id}/${Date.now()}.${fileExt}`
      //   const { data: uploadData, error: uploadError } = await supabase.storage
      //     .from('dispute-evidence')
      //     .upload(fileName, file)
      //   if (uploadError) throw uploadError
      //   const { data: { publicUrl } } = supabase.storage
      //     .from('dispute-evidence')
      //     .getPublicUrl(fileName)
      //   evidenceUrls.push(publicUrl)
      // }

      // Create dispute
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

      alert('✅ Payment simulated! Automatic delivery will trigger if applicable.')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Order Not Found</h1>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const isBuyer = order.buyer_id === user?.id
  const isSeller = order.seller_id === user?.id
  const serviceFee = order.amount * 0.05
  const totalAmount = order.amount + serviceFee

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Paid - Awaiting Delivery' },
      delivered: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Delivered - Awaiting Confirmation' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed' },
      dispute_raised: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Dispute Raised' },
      cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Cancelled' },
      refunded: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Refunded' }
    }
    const badge = badges[status] || badges.paid
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href={isBuyer ? '/customer-dashboard' : '/dashboard'} className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Order Details</h1>
                <p className="text-gray-400">Order #{order.id.substring(0, 8)}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* 48-Hour Timer Banner */}
          {order.status === 'delivered' && timeRemaining && isBuyer && (
            <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl p-6 mb-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="text-4xl">⏱️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-400 mb-1">Action Required</h3>
                  <p className="text-white font-semibold">{timeRemaining}</p>
                  <p className="text-gray-300 text-sm mt-1">
                    Please confirm receipt or raise a dispute. After 48 hours, this order will be automatically completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Info Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex gap-6">
              {/* Image */}
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {order.listing.image_url ? (
                  <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {order.listing.category === 'account' ? '🎮' : order.listing.category === 'topup' ? '💰' : '🔑'}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{order.listing.title}</h2>
                <p className="text-purple-400 mb-4">{order.listing.game}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Quantity</p>
                    <p className="text-white font-semibold">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Price per Item</p>
                    <p className="text-white font-semibold">${(order.amount / order.quantity).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Delivery Type</p>
                    <p className="text-white font-semibold">
                      {order.listing.delivery_type === 'automatic' ? '⚡ Automatic' : '👤 Manual'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Order Date</p>
                    <p className="text-white font-semibold">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {order.delivered_at && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm">
                      ✓ Delivered on {new Date(order.delivered_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Participants Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Participants</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Buyer</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {order.buyer.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-semibold">{order.buyer.username}</span>
                    {isBuyer && <span className="text-xs text-purple-400">(You)</span>}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Seller</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-pink-500/20 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {order.seller.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-semibold">{order.seller.username}</span>
                    {isSeller && <span className="text-xs text-pink-400">(You)</span>}
                  </div>
                </div>
              </div>

              <button
                onClick={handleContactOtherParty}
                className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg font-semibold border border-white/10 transition"
              >
                💬 Send Message
              </button>
            </div>

            {/* Payment Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Payment Details</h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white font-semibold">${order.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Service Fee (5%)</span>
                  <span className="text-white font-semibold">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-green-400 font-bold text-xl">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <span className="text-sm text-gray-400">Payment Status:</span>
                <span className={`text-sm font-semibold ${
                  order.payment_status === 'paid' ? 'text-green-400' : 
                  order.payment_status === 'failed' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>

              {/* TEMPORARY: Testing button */}
              {order.payment_status === 'pending' && isBuyer && (
                <div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                    <p className="text-yellow-400 text-xs">
                      ⚠️ TESTING MODE: In production, you would pay via Stripe here.
                    </p>
                  </div>
                  <button
                    onClick={handleSimulatePayment}
                    disabled={actionLoading}
                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-3 rounded-lg font-semibold border border-yellow-500/50 transition disabled:opacity-50"
                  >
                    💳 Simulate Payment Confirmation
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">Actions</h3>

            <div className="space-y-3">
              {/* Seller Actions */}
              {isSeller && order.status === 'paid' && order.listing.delivery_type === 'manual' && (
                <button
                  onClick={handleMarkAsDelivered}
                  disabled={actionLoading}
                  className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-lg font-semibold border border-green-500/50 transition disabled:opacity-50"
                >
                  ✓ Mark as Delivered
                </button>
              )}

              {/* Buyer Actions - Confirm Receipt or Dispute */}
              {isBuyer && order.status === 'delivered' && !showDisputeForm && (
                <>
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={actionLoading}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-lg font-semibold border border-green-500/50 transition disabled:opacity-50"
                  >
                    ✓ Confirm Receipt - Complete Order
                  </button>
                  <button
                    onClick={() => setShowDisputeForm(true)}
                    disabled={actionLoading}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition disabled:opacity-50"
                  >
                    ⚠️ Raise Dispute
                  </button>
                </>
              )}

              {/* Dispute Form */}
              {isBuyer && showDisputeForm && order.status === 'delivered' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-red-400 mb-4">Raise a Dispute</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Reason <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500/50 focus:outline-none [&>option]:bg-slate-800 [&>option]:text-white"
                      >
                        <option value="" className="bg-slate-800 text-gray-400">Select a reason...</option>
                        <option value="Item not received" className="bg-slate-800 text-white">Item not received</option>
                        <option value="Wrong item received" className="bg-slate-800 text-white">Wrong item received</option>
                        <option value="Item not as described" className="bg-slate-800 text-white">Item not as described</option>
                        <option value="Account credentials invalid" className="bg-slate-800 text-white">Account credentials invalid</option>
                        <option value="Code already used" className="bg-slate-800 text-white">Code already used</option>
                        <option value="Seller not responding" className="bg-slate-800 text-white">Seller not responding</option>
                        <option value="Other" className="bg-slate-800 text-white">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Detailed Description <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder="Please provide as much detail as possible about the issue..."
                        rows={4}
                        maxLength={1000}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-red-500/50 focus:outline-none resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {disputeDescription.length}/1000 characters (minimum 20)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Evidence (Screenshots/Files)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length > 3) {
                            alert('Maximum 3 files allowed')
                            e.target.value = '' // Reset input
                            return
                          }
                          setEvidenceFiles(files)
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-500/20 file:text-purple-400 hover:file:bg-purple-500/30"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Optional: Upload up to 3 screenshots or documents as evidence
                      </p>
                      {evidenceFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {evidenceFiles.map((file, index) => (
                            <p key={index} className="text-sm text-green-400">
                              ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmitDispute}
                        disabled={actionLoading}
                        className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition disabled:opacity-50"
                      >
                        Submit Dispute
                      </button>
                      <button
                        onClick={() => setShowDisputeForm(false)}
                        disabled={actionLoading}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Buyer Actions - Raise Dispute for paid orders */}
              {isBuyer && order.status === 'paid' && (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  disabled={actionLoading}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition disabled:opacity-50"
                >
                  ⚠️ Raise Dispute
                </button>
              )}

              {/* Dispute Info */}
              {order.status === 'dispute_raised' && dispute && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">⚠️</div>
                    <div className="flex-1">
                      <p className="text-red-400 font-bold text-lg mb-1">Dispute Active</p>
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
                      {dispute.status.charAt(0).toUpperCase() + dispute.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Reason:</p>
                      <p className="text-gray-300 text-sm">{dispute.reason}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">Description:</p>
                      <p className="text-gray-300 text-sm">{dispute.description}</p>
                    </div>
                    {dispute.evidence_urls && dispute.evidence_urls.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-white mb-2">Evidence:</p>
                        <div className="flex gap-2 flex-wrap">
                          {dispute.evidence_urls.map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded hover:bg-purple-500/30 transition"
                            >
                              View Evidence {index + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {dispute.admin_notes && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mt-3">
                        <p className="text-sm font-semibold text-blue-400 mb-1">Admin Notes:</p>
                        <p className="text-gray-300 text-sm">{dispute.admin_notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                    <p className="text-yellow-400 text-sm">
                      💬 Our support team is reviewing this dispute. You can continue chatting with the {isBuyer ? 'seller' : 'buyer'} in the messages.
                    </p>
                  </div>
                </div>
              )}

              {/* Automatic Delivery Info */}
              {order.listing.delivery_type === 'automatic' && (order.status === 'delivered' || order.status === 'completed') && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    ⚡ This order was automatically delivered. Check your messages for the delivery code.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}