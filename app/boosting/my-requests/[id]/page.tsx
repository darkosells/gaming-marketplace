'use client'

// ============================================================================
// CUSTOMER BOOST REQUEST DETAIL PAGE
// ============================================================================
// Location: app/boosting/my-requests/[id]/page.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { BoostRequest, BoostOffer, RankKey } from '@/lib/boosting/types'
import { RANKS_MAP, getRankIcon, getDivisionsBetween } from '@/lib/boosting/ranks'
import { formatPrice, calculateVendorPayout } from '@/lib/boosting/pricing'
import { REQUEST_STATUS_CONFIG, OFFER_STATUS_CONFIG, BOOSTING_COMMISSION_RATE } from '@/lib/boosting/constants'

export default function CustomerRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<BoostRequest | null>(null)
  const [offers, setOffers] = useState<BoostOffer[]>([])
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          router.push(`/login?redirect=/boosting/my-requests/${requestId}`)
          return
        }
        
        setUser(session.user)
        await fetchRequestData(session.user.id)
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router, requestId])

  const fetchRequestData = async (userId: string) => {
    // Fetch request
    const { data: requestData, error: requestError } = await supabase
      .from('boost_requests')
      .select('*')
      .eq('id', requestId)
      .eq('customer_id', userId)
      .single()

    if (requestError || !requestData) {
      console.error('Error fetching request:', requestError)
      router.push('/boosting/my-requests')
      return
    }

    setRequest(requestData)

    // Fetch offers for this request (include accepted offers)
    const { data: offersData, error: offersError } = await supabase
      .from('boost_offers')
      .select(`
        *,
        vendor:profiles!boost_offers_vendor_id_fkey(
          id, username, avatar_url, vendor_rank, average_rating, total_reviews
        )
      `)
      .eq('request_id', requestId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: true })

    if (offersError) {
      console.error('Error fetching offers:', offersError)
      return
    }

    setOffers(offersData || [])
  }

  // Accept offer
  const handleAcceptOffer = async (offerId: string) => {
    if (!user || !request) return
    
    setProcessingOfferId(offerId)
    
    try {
      const offer = offers.find(o => o.id === offerId)
      if (!offer) throw new Error('Offer not found')

      // Update offer status to accepted
      const { error: offerError } = await supabase
        .from('boost_offers')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', offerId)

      if (offerError) throw offerError

      // Update request status
      const { error: requestError } = await supabase
        .from('boost_requests')
        .update({ 
          status: 'accepted'
        })
        .eq('id', request.id)

      if (requestError) throw requestError

      // Decline other pending offers
      await supabase
        .from('boost_offers')
        .update({ status: 'declined' })
        .eq('request_id', request.id)
        .eq('status', 'pending')
        .neq('id', offerId)

      // Redirect to checkout/payment page
      router.push(`/checkout?type=boost&request=${request.id}&offer=${offerId}`)
      
    } catch (error: any) {
      console.error('Error accepting offer:', error)
      setErrorMessage(error.message || 'Failed to accept offer. Please try again.')
    } finally {
      setProcessingOfferId(null)
    }
  }

  // Decline offer
  const handleDeclineOffer = async (offerId: string) => {
    if (!user || !request) return
    
    setProcessingOfferId(offerId)
    
    try {
      console.log('Declining offer:', offerId, 'for request:', request.id)
      
      const { data, error } = await supabase
        .from('boost_offers')
        .update({ status: 'declined' })
        .eq('id', offerId)
        .eq('request_id', request.id)
        .select()

      console.log('Decline result:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message || 'Database error while declining offer')
      }
      
      if (!data || data.length === 0) {
        throw new Error('No offer was updated. You may not have permission to decline this offer. Please check RLS policies.')
      }

      // Close modal and show success
      setShowDeclineModal(null)
      setSuccessMessage('Offer declined successfully')
      
      // Refresh data
      await fetchRequestData(user.id)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
    } catch (error: any) {
      console.error('Error declining offer:', error)
      setErrorMessage(error.message || 'Failed to decline offer. Please try again.')
    } finally {
      setProcessingOfferId(null)
    }
  }

  // Cancel request
  const handleCancelRequest = async () => {
    if (!request) return
    
    setCancelling(true)
    
    try {
      // Update request status
      const { error } = await supabase
        .from('boost_requests')
        .update({ status: 'cancelled' })
        .eq('id', request.id)
        .eq('status', 'open')

      if (error) throw error

      // Decline all pending offers
      await supabase
        .from('boost_offers')
        .update({ status: 'declined' })
        .eq('request_id', request.id)
        .eq('status', 'pending')

      router.push('/boosting/my-requests')
      
    } catch (error: any) {
      console.error('Error cancelling request:', error)
      setErrorMessage(error.message || 'Failed to cancel request. Please try again.')
    } finally {
      setCancelling(false)
      setShowCancelModal(false)
    }
  }

  // Helper to get rank badge styling
  const getRankBadgeStyle = (rank: string) => {
    switch (rank) {
      case 'supernova':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'galaxy':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'star':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'nova':
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading request...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Not Found</h2>
          <p className="text-gray-400 mb-4">This request doesn't exist or you don't have access to it.</p>
          <Link href="/boosting/my-requests" className="text-purple-400 hover:text-purple-300">
            ← Back to My Requests
          </Link>
        </div>
      </div>
    )
  }

  const currentRank = RANKS_MAP[request.current_rank as keyof typeof RANKS_MAP]
  const desiredRank = RANKS_MAP[request.desired_rank as keyof typeof RANKS_MAP]
  const statusConfig = REQUEST_STATUS_CONFIG[request.status]
  const divisions = getDivisionsBetween(request.current_rank as RankKey, request.desired_rank as RankKey)

  // Time calculations
  const expiresAt = new Date(request.expires_at)
  const now = new Date()
  const timeRemaining = expiresAt.getTime() - now.getTime()
  const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24))
  const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const isExpired = timeRemaining <= 0

  // Separate offers by status
  const pendingOffers = offers.filter(o => o.status === 'pending')
  const acceptedOffer = offers.find(o => o.status === 'accepted')

  // Check if request is waiting for payment
  const isWaitingForPayment = request.status === 'accepted' && acceptedOffer

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-20 sm:pt-24 lg:pt-28 pb-8">
          {/* Success Message Toast */}
          {successMessage && (
            <div className="fixed top-24 right-4 z-50 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 flex items-center gap-3 animate-fade-in">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {successMessage}
            </div>
          )}

          {/* Back Link */}
          <Link 
            href="/boosting/my-requests"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Requests
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Header */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 font-mono mb-1">{request.request_number}</p>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">Boost Request</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                      {statusConfig?.label}
                    </span>
                    {request.is_priority && (
                      <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-yellow-500/20 text-yellow-400">
                        ⚡ Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Rank Display */}
                <div className="flex items-center justify-center gap-6 p-4 rounded-xl bg-slate-800/50 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 mx-auto relative bg-slate-900/50">
                      <Image
                        src={currentRank?.image || ''}
                        alt={currentRank?.name || ''}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                    <p className="font-semibold" style={{ color: currentRank?.color }}>{currentRank?.name}</p>
                    <p className="text-xs text-gray-500">Current</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-1">{divisions} divisions</p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 mx-auto relative bg-slate-900/50">
                      <Image
                        src={desiredRank?.image || ''}
                        alt={desiredRank?.name || ''}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    </div>
                    <p className="font-semibold" style={{ color: desiredRank?.color }}>{desiredRank?.name}</p>
                    <p className="text-xs text-gray-500">Target</p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                    <p className="text-lg">{request.queue_type === 'duo' ? '👥' : '👤'}</p>
                    <p className="text-xs text-gray-400">{request.queue_type === 'duo' ? 'Duo Queue' : 'Solo Queue'}</p>
                  </div>
                  {request.is_priority && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
                      <p className="text-lg">⚡</p>
                      <p className="text-xs text-yellow-400">Priority</p>
                    </div>
                  )}
                  {request.addon_offline_mode && (
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <p className="text-lg">👁️</p>
                      <p className="text-xs text-gray-400">Offline Mode</p>
                    </div>
                  )}
                  {request.addon_specific_agents && (
                    <div className="p-3 rounded-lg bg-slate-800/50 text-center">
                      <p className="text-lg">🎯</p>
                      <p className="text-xs text-gray-400">Specific Agents</p>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {request.customer_notes && (
                  <div className="mt-4 p-4 rounded-lg bg-slate-800/50">
                    <p className="text-xs text-gray-500 mb-1">Your Notes:</p>
                    <p className="text-sm text-gray-300">{request.customer_notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Required Section - Show when offer is accepted but not paid */}
              {isWaitingForPayment && acceptedOffer && (
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/30 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Payment Required</h2>
                      <p className="text-sm text-gray-400">Complete payment to start your boost</p>
                    </div>
                  </div>

                  {/* Accepted Offer Details */}
                  <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                          {(acceptedOffer as any).vendor?.avatar_url ? (
                            <img src={(acceptedOffer as any).vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (acceptedOffer as any).vendor?.username?.charAt(0).toUpperCase() || '?'
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{(acceptedOffer as any).vendor?.username || 'Booster'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {(acceptedOffer as any).vendor?.total_reviews > 0 ? (
                              <>
                                <span className="flex items-center gap-1">
                                  <span className="text-yellow-400">★</span>
                                  {(acceptedOffer as any).vendor.average_rating?.toFixed(1) || '0.0'}
                                </span>
                                <span className="text-gray-500">({(acceptedOffer as any).vendor.total_reviews} reviews)</span>
                              </>
                            ) : (
                              <span className="text-gray-500">New booster</span>
                            )}
                            {(acceptedOffer as any).vendor?.vendor_rank && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize border ${getRankBadgeStyle((acceptedOffer as any).vendor.vendor_rank)}`}>
                                {(acceptedOffer as any).vendor.vendor_rank}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Agreed Price</p>
                        <p className="text-2xl font-bold text-green-400">{formatPrice(acceptedOffer.offered_price || 0)}</p>
                      </div>
                    </div>

                    {acceptedOffer.estimated_days && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Estimated completion: {acceptedOffer.estimated_days} days
                      </div>
                    )}
                  </div>

                  {/* Pay Now Button */}
                  <Link
                    href={`/checkout?type=boost&request=${request.id}&offer=${acceptedOffer.id}`}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Now - {formatPrice(acceptedOffer.offered_price || 0)}
                  </Link>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    🔒 Secure payment • Funds held until boost completes
                  </p>
                </div>
              )}

              {/* Offers Section - Only show for open requests */}
              {request.status === 'open' && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>📬</span>
                      Offers Received
                      {pendingOffers.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                          {pendingOffers.length} pending
                        </span>
                      )}
                    </h2>
                  </div>

                  {pendingOffers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">⏳</div>
                      <p className="text-gray-400">No offers yet</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Vendors are reviewing your request. Check back soon!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOffers.map((offer: any) => {
                        const vendor = offer.vendor

                        return (
                          <div
                            key={offer.id}
                            className="p-4 rounded-xl bg-slate-800/50 border border-white/10 hover:border-purple-500/30 transition-all"
                          >
                            {/* Vendor Info - UPDATED */}
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                  {vendor?.avatar_url ? (
                                    <img src={vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    vendor?.username?.charAt(0).toUpperCase() || '?'
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{vendor?.username || 'Unknown'}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {/* Show rating only if they have reviews */}
                                    {vendor?.total_reviews > 0 ? (
                                      <>
                                        <span className="flex items-center gap-1">
                                          <span className="text-yellow-400">★</span>
                                          {vendor.average_rating?.toFixed(1) || '0.0'}
                                        </span>
                                        <span className="text-gray-500">({vendor.total_reviews})</span>
                                      </>
                                    ) : (
                                      <span className="text-gray-500">New booster</span>
                                    )}
                                    {/* Show rank badge */}
                                    {vendor?.vendor_rank && (
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize border ${getRankBadgeStyle(vendor.vendor_rank)}`}>
                                        {vendor.vendor_rank}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-gray-500">
                                  {offer.offer_type === 'accept' ? 'Accepted your price' : 'Counter-offer'}
                                </p>
                                <p className="text-xl font-bold text-green-400">
                                  {formatPrice(offer.offered_price)}
                                </p>
                              </div>
                            </div>

                            {/* Offer Details */}
                            <div className="flex flex-wrap gap-3 mb-4">
                              {offer.estimated_days && (
                                <div className="px-3 py-1.5 rounded-lg bg-slate-900/50 text-xs">
                                  <span className="text-gray-500">Est: </span>
                                  <span className="text-white">{offer.estimated_days} days</span>
                                </div>
                              )}
                              <div className="px-3 py-1.5 rounded-lg bg-slate-900/50 text-xs">
                                <span className="text-gray-500">Submitted: </span>
                                <span className="text-white">{new Date(offer.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Vendor Notes */}
                            {offer.vendor_notes && (
                              <div className="p-3 rounded-lg bg-slate-900/50 mb-4">
                                <p className="text-xs text-gray-500 mb-1">Vendor's message:</p>
                                <p className="text-sm text-gray-300">{offer.vendor_notes}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => handleAcceptOffer(offer.id)}
                                disabled={processingOfferId === offer.id}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                              >
                                {processingOfferId === offer.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Accept & Pay
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => setShowDeclineModal(offer.id)}
                                disabled={processingOfferId === offer.id}
                                className="py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-sm transition-all disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Accepted Offer Info for non-payment statuses */}
              {acceptedOffer && !isWaitingForPayment && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <span>✅</span>
                    Your Booster
                  </h2>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                        {(acceptedOffer as any).vendor?.avatar_url ? (
                          <img src={(acceptedOffer as any).vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          (acceptedOffer as any).vendor?.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{(acceptedOffer as any).vendor?.username || 'Booster'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {(acceptedOffer as any).vendor?.total_reviews > 0 ? (
                            <>
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-400">★</span>
                                {(acceptedOffer as any).vendor.average_rating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-gray-500">({(acceptedOffer as any).vendor.total_reviews} reviews)</span>
                            </>
                          ) : (
                            <span className="text-gray-500">New booster</span>
                          )}
                          {(acceptedOffer as any).vendor?.vendor_rank && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize border ${getRankBadgeStyle((acceptedOffer as any).vendor.vendor_rank)}`}>
                              {(acceptedOffer as any).vendor.vendor_rank}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="text-xl font-bold text-green-400">{formatPrice(acceptedOffer.offered_price || 0)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment CTA for Accepted Status - Prominent in sidebar */}
              {isWaitingForPayment && acceptedOffer && (
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-5">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-white text-lg">Offer Accepted!</h3>
                    <p className="text-sm text-gray-400 mt-1">Complete payment to start</p>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-green-400">{formatPrice(acceptedOffer.offered_price || 0)}</p>
                  </div>

                  <Link
                    href={`/checkout?type=boost&request=${request.id}&offer=${acceptedOffer.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Pay Now
                  </Link>
                </div>
              )}

              {/* Pricing Summary */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-4">Price Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Your Offer</span>
                    <span className="text-white font-medium">{formatPrice(request.customer_offer_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Platform Suggested</span>
                    <span className="text-gray-300">{formatPrice(request.platform_suggested_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Max Counter-Offer</span>
                    <span className="text-gray-300">{formatPrice(request.max_counter_price)}</span>
                  </div>
                  {acceptedOffer && (
                    <>
                      <div className="border-t border-white/10 my-3"></div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400 font-medium">Agreed Price</span>
                        <span className="text-green-400 font-bold">{formatPrice(acceptedOffer.offered_price || 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Time Remaining - Only for open requests */}
              {request.status === 'open' && (
                <div className={`
                  bg-slate-900/60 backdrop-blur-xl border rounded-2xl p-5
                  ${isExpired ? 'border-red-500/30' : daysRemaining < 2 ? 'border-orange-500/30' : 'border-white/10'}
                `}>
                  <h3 className="font-semibold text-white mb-2">Time Remaining</h3>
                  {isExpired ? (
                    <p className="text-red-400 font-medium">Expired</p>
                  ) : (
                    <>
                      <p className={`text-2xl font-bold ${daysRemaining < 2 ? 'text-orange-400' : 'text-white'}`}>
                        {daysRemaining}d {hoursRemaining}h
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Expires: {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Actions - Only for open requests */}
              {request.status === 'open' && !isExpired && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                  <h3 className="font-semibold text-white mb-4">Actions</h3>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-sm transition-all border border-red-500/30"
                  >
                    Cancel Request
                  </button>
                </div>
              )}

              {/* Help */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="font-semibold text-white mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Review vendor ratings before accepting</li>
                  <li>• Check estimated completion time</li>
                  <li>• Read vendor notes carefully</li>
                  <li>• Payment is held until boost completes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCancelModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Cancel Request?</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to cancel this boost request? All pending offers will be declined.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                Keep Request
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Cancel Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Offer Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowDeclineModal(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white text-center mb-2">Decline Offer?</h3>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to decline this offer? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                Keep Offer
              </button>
              <button
                onClick={() => handleDeclineOffer(showDeclineModal)}
                disabled={processingOfferId === showDeclineModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processingOfferId === showDeclineModal ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Decline Offer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setErrorMessage(null)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="w-full py-3 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}