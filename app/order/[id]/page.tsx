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

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchOrder()
    }
  }, [user])

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
    } catch (error: any) {
      console.error('Error fetching order:', error)
      alert('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsDelivered = async () => {
    if (!confirm('Mark this order as delivered?')) return

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

      alert('Order marked as delivered! Waiting for buyer confirmation.')
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to update order: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDispute = async () => {
    const reason = prompt('Please describe the issue with this order:')
    if (!reason || !reason.trim()) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'dispute_raised',
          dispute_reason: reason.trim(),
          dispute_opened_at: new Date().toISOString()
        })
        .eq('id', params.id)

      if (error) throw error

      alert('Dispute raised. Our support team will review it shortly.')
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to open dispute: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmReceipt = async () => {
    if (!confirm('Confirm that you received the item?')) return

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

      alert('Order completed! Thank you for your purchase.')
      fetchOrder()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Failed to confirm receipt: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleContactOtherParty = () => {
    router.push(`/messages?conversation=${order?.listing_id}`)
  }

  const handleSimulatePayment = async () => {
    // TEMPORARY: For testing - simulate payment confirmation
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
      // Wait a bit for the trigger to fire, then refresh
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
      dispute_solved: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Dispute Solved' },
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
                      For now, click below to simulate payment confirmation.
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

              {/* Buyer Actions - Confirm Receipt */}
              {isBuyer && order.status === 'delivered' && (
                <>
                  <button
                    onClick={handleConfirmReceipt}
                    disabled={actionLoading}
                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 rounded-lg font-semibold border border-green-500/50 transition disabled:opacity-50"
                  >
                    ✓ Confirm Receipt - Complete Order
                  </button>
                  <button
                    onClick={handleOpenDispute}
                    disabled={actionLoading}
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition disabled:opacity-50"
                  >
                    ⚠️ Raise Dispute
                  </button>
                </>
              )}

              {/* Buyer Actions - Dispute for paid orders */}
              {isBuyer && order.status === 'paid' && (
                <button
                  onClick={handleOpenDispute}
                  disabled={actionLoading}
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition disabled:opacity-50"
                >
                  ⚠️ Raise Dispute
                </button>
              )}

              {/* Dispute Info */}
              {order.status === 'dispute_raised' && order.dispute_reason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 font-semibold mb-2">Dispute Details:</p>
                  <p className="text-gray-300 text-sm">{order.dispute_reason}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Opened: {new Date(order.dispute_opened_at!).toLocaleString()}
                  </p>
                  <p className="text-yellow-400 text-sm mt-3">
                    Our support team is reviewing this dispute.
                  </p>
                </div>
              )}

              {/* Dispute Solved Info */}
              {order.status === 'dispute_solved' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-400 text-sm">
                    ✓ This dispute has been resolved by our support team.
                  </p>
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