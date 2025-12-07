'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { sendOrderEmails, sendDeliveredEmail, sendDisputeEmails, getSiteUrl } from '@/lib/email'

const STATUS_CONFIG: Record<string, any> = {
  pending: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', icon: '⏳', label: 'Pending Payment' },
  paid: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '💳', label: 'Paid - Awaiting Delivery' },
  delivered: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '📦', label: 'Delivered - Awaiting Confirmation' },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: '✅', label: 'Completed' },
  dispute_raised: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: '⚠️', label: 'Dispute Raised' },
  cancelled: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', icon: '❌', label: 'Cancelled' },
  refunded: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', icon: '💰', label: 'Refunded' }
}

// Helper function to parse timestamp as UTC
const parseAsUTC = (timestamp: string): Date => {
  if (!timestamp) return new Date()
  // If timestamp doesn't have timezone info, treat it as UTC
  if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-', 10)) {
    return new Date(timestamp + 'Z')
  }
  return new Date(timestamp)
}

// Helper function to format date consistently (parses as UTC, displays in local time)
const formatDate = (timestamp: string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  if (!timestamp) return ''
  const date = parseAsUTC(timestamp)
  return date.toLocaleString('en-US', options || {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

// Short date format for compact displays
const formatShortDate = (timestamp: string | null | undefined): string => {
  if (!timestamp) return ''
  const date = parseAsUTC(timestamp)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function OrderDetailPage() {
  const { id } = useParams(), router = useRouter(), supabase = createClient(), mounted = useRef(true)
  const [user, setUser] = useState<any>(null), [profile, setProfile] = useState<any>(null), [order, setOrder] = useState<any>(null)
  const [dispute, setDispute] = useState<any>(null), [adminActions, setAdminActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true), [actionLoading, setActionLoading] = useState(false), [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null), [toasts, setToasts] = useState<any[]>([])
  const [modal, setModal] = useState({ show: false, title: '', msg: '', onOk: () => {}, type: 'warning' })
  const [showDelivery, setShowDelivery] = useState(false), [deliveryText, setDeliveryText] = useState('')
  const [showReview, setShowReview] = useState(false), [rating, setRating] = useState(0), [hoverRating, setHoverRating] = useState(0), [reviewText, setReviewText] = useState(''), [hasReviewed, setHasReviewed] = useState(false)
  const [showDispute, setShowDispute] = useState(false), [disputeReason, setDisputeReason] = useState(''), [disputeDesc, setDisputeDesc] = useState('')
  const [copiedOrderId, setCopiedOrderId] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null)
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false)
  const [copiedDelivery, setCopiedDelivery] = useState(false)
  
  // Security confirmation states
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  const [hasConfirmedSecurity, setHasConfirmedSecurity] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  // 24-hour delivery window states
  const [deliveryDeadline, setDeliveryDeadline] = useState<string | null>(null)
  const [deliveryDeadlinePassed, setDeliveryDeadlinePassed] = useState(false)
  
  // Track if 48 hours have passed
  const [autoCompleteReady, setAutoCompleteReady] = useState(false)

  const toast = (type: string, title: string, msg: string) => {
    const t = { id: Date.now().toString(), type, title, msg }
    setToasts(p => [...p, t])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 5000)
  }

  const confirm = (title: string, msg: string, onOk: () => void, type = 'warning') => setModal({ show: true, title, msg, onOk, type })

  const copyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.id)
      setCopiedOrderId(true)
      toast('success', 'Copied!', 'Order ID copied to clipboard')
      setTimeout(() => setCopiedOrderId(false), 2000)
    } catch {
      toast('error', 'Failed', 'Could not copy to clipboard')
    }
  }

  // Log delivery access to database
  const logDeliveryAccess = async (accessType: 'reveal' | 'copy' | 'view_in_chat') => {
    if (!user || !order) return
    
    try {
      const { error } = await supabase.from('delivery_access_logs').insert({
        user_id: user.id,
        order_id: order.id,
        conversation_id: conversationId,
        access_type: accessType,
        access_location: 'order_details'
      })
      
      if (error) {
        console.error('Failed to log delivery access:', error)
      }
    } catch (err) {
      console.error('Error logging delivery access:', err)
    }
  }

  // Handle reveal with security confirmation
  const handleRevealDeliveryInfo = async () => {
    if (!hasConfirmedSecurity) {
      setShowSecurityWarning(true)
      return
    }
    
    // Log the reveal action
    await logDeliveryAccess('reveal')
    setShowDeliveryInfo(true)
  }

  // Confirm security warning and reveal
  const confirmSecurityAndReveal = async () => {
    setHasConfirmedSecurity(true)
    setShowSecurityWarning(false)
    
    // Log the reveal action
    await logDeliveryAccess('reveal')
    setShowDeliveryInfo(true)
    
    toast('info', 'Access Logged', 'This reveal has been logged for security')
  }

  // Hide delivery info
  const hideDeliveryInfo = () => {
    setShowDeliveryInfo(false)
  }

  // Copy delivery info with logging
  const copyDeliveryInfo = async () => {
    if (!deliveryInfo) return
    try {
      await navigator.clipboard.writeText(deliveryInfo)
      
      // Log the copy action
      await logDeliveryAccess('copy')
      
      setCopiedDelivery(true)
      toast('success', 'Copied!', 'Delivery information copied to clipboard')
      setTimeout(() => setCopiedDelivery(false), 2000)
    } catch {
      toast('error', 'Failed', 'Could not copy to clipboard')
    }
  }

  useEffect(() => { mounted.current = true; checkAuth(); return () => { mounted.current = false } }, [])
  useEffect(() => { user && profile && fetchOrder() }, [user, profile])
  
  // FIXED: 48-hour timer for delivered orders with proper UTC handling
  useEffect(() => {
    if (order?.status === 'delivered' && order.delivered_at) {
      const updateTimer = () => {
        // Parse delivered_at as UTC to avoid timezone issues
        const deliveredTime = parseAsUTC(order.delivered_at).getTime()
        const now = Date.now()
        const elapsed = now - deliveredTime
        const remaining = (48 * 60 * 60 * 1000) - elapsed // 48 hours in milliseconds
        
        if (remaining <= 0) {
          setTimeRemaining(null)
          setAutoCompleteReady(true)
        } else {
          setAutoCompleteReady(false)
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
        }
      }
      
      // Run immediately
      updateTimer()
      
      // Then update every second
      const iv = setInterval(updateTimer, 1000)
      return () => clearInterval(iv)
    } else {
      setTimeRemaining(null)
      setAutoCompleteReady(false)
    }
  }, [order])

  // FIXED: 24-hour delivery window timer for manual delivery orders in 'paid' status
  useEffect(() => {
    if (order?.status === 'paid' && order.listing?.delivery_type === 'manual') {
      const paidTime = order.paid_at || order.created_at
      
      const updateDeliveryTimer = () => {
        // Parse as UTC
        const paidTimestamp = parseAsUTC(paidTime).getTime()
        const now = Date.now()
        const elapsed = now - paidTimestamp
        const remaining = (24 * 60 * 60 * 1000) - elapsed // 24 hours in milliseconds
        
        if (remaining <= 0) {
          setDeliveryDeadline('Deadline passed')
          setDeliveryDeadlinePassed(true)
        } else {
          const hours = Math.floor(remaining / (1000 * 60 * 60))
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
          setDeliveryDeadline(`${hours}h ${minutes}m ${seconds}s`)
          setDeliveryDeadlinePassed(false)
        }
      }
      
      // Run immediately
      updateDeliveryTimer()
      
      // Then update every second
      const iv = setInterval(updateDeliveryTimer, 1000)
      return () => clearInterval(iv)
    } else {
      setDeliveryDeadline(null)
      setDeliveryDeadlinePassed(false)
    }
  }, [order])

  const checkAuth = async () => {
    try {
      const { data: { user: u }, error: e } = await Promise.race([supabase.auth.getUser(), new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 10000))]) as any
      if (!mounted.current) return
      if (e || !u) return router.push('/login')
      setUser(u)
      const { data: p, error: pe } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      if (!mounted.current) return
      if (pe) { setError('Failed to load profile'); setLoading(false); return }
      setProfile(p)
    } catch (e: any) {
      if (!mounted.current) return
      e.message?.includes('timeout') ? setError('Connection timed out') : router.push('/login')
      setLoading(false)
    }
  }

  const fetchOrder = async () => {
    try {
      const { data: d, error: e } = await supabase.from('orders').select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)').eq('id', id).single()
      if (!mounted.current) return
      if (e) throw e
      if (d.buyer_id !== user.id && d.seller_id !== user.id && !profile?.is_admin) return router.push('/dashboard')
      const o = { ...d, listing: { title: d.listing_title || 'Unknown', game: d.listing_game || 'N/A', category: d.listing_category || 'account', image_url: d.listing_image_url, delivery_type: d.listing_delivery_type || 'manual' } }
      setOrder(o)
      await Promise.allSettled([
        d.status === 'dispute_raised' && supabase.from('disputes').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(1).single().then(r => r.data && setDispute(r.data)),
        d.status === 'completed' && d.buyer_id === user?.id && supabase.from('reviews').select('id').eq('order_id', id).single().then(r => r.data && setHasReviewed(true)),
        (profile?.is_admin || d.dispute_opened_at) && supabase.from('admin_actions').select('*, admin:profiles!admin_actions_admin_id_fkey(username)').eq('target_type', 'order').eq('target_id', id).order('created_at', { ascending: false }).then(r => !r.error && setAdminActions(r.data || [])),
        // Fetch delivery information for buyers (or admins) after delivery
        (d.buyer_id === user?.id || profile?.is_admin) && (d.status === 'delivered' || d.status === 'completed' || d.status === 'dispute_raised') && fetchDeliveryInfo(d.id)
      ])
    } catch { mounted.current && setError('Failed to load order') }
    finally { mounted.current && setLoading(false) }
  }

  const fetchDeliveryInfo = async (orderId: string) => {
    try {
      // First check if delivery_content is stored directly on order (for automatic delivery)
      if (order?.delivery_content) {
        setDeliveryInfo(order.delivery_content)
        return
      }

      // Find the conversation for this order - try multiple approaches
      let convId: string | null = null
      
      // Try 1: Direct order_id match
      const { data: conv1 } = await supabase
        .from('conversations')
        .select('id')
        .eq('order_id', orderId)
        .single()
      
      if (conv1) {
        convId = conv1.id
      } else if (order) {
        // Try 2: Match by listing, buyer, seller
        const { data: conv2 } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', order.listing_id)
          .eq('buyer_id', order.buyer_id)
          .eq('seller_id', order.seller_id)
          .single()
        if (conv2) convId = conv2.id
      }
      
      if (!convId) {
        console.log('No conversation found for order:', orderId)
        return
      }

      // Store conversation ID for logging
      setConversationId(convId)
      console.log('Found conversation:', convId)

      // Get recent messages from this conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('content, created_at, message_type, sender_id')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (msgError) {
        console.error('Error fetching messages:', msgError)
        return
      }

      console.log('Found messages:', messages?.length)

      if (messages && messages.length > 0) {
        // Find delivery message - look for various patterns
        const deliveryMsg = messages.find((m: any) => {
          const content = m.content || ''
          return (
            content.includes('DELIVERY INFORMATION') || 
            content.includes('DELIVERY INFO') ||
            content.includes('📦 DELIVERY') ||
            content.includes('automatically delivered') ||
            content.includes('Account Details:') ||
            content.includes('Game Key:') ||
            content.includes('Top-Up Information:') ||
            content.includes('Delivery Information:') ||
            (m.message_type === 'system' && content.includes('delivered'))
          )
        })
        
        if (deliveryMsg) {
          const content = deliveryMsg.content
          console.log('Found delivery message:', content.substring(0, 100) + '...')
          
          // Try to extract delivery content using multiple patterns
          let extracted: string | null = null
          
          // Pattern 1: Manual delivery format - emoji + DELIVERY INFORMATION
          const p1 = content.match(/📦 DELIVERY INFORMATION\s*\n\n([\s\S]*?)\n\n━━━/)
          if (p1 && p1[1]) extracted = p1[1].trim()
          
          // Pattern 2: Manual delivery without emoji
          if (!extracted) {
            const p2 = content.match(/DELIVERY INFORMATION\s*\n\n([\s\S]*?)\n\n━━━/)
            if (p2 && p2[1]) extracted = p2[1].trim()
          }
          
          // Pattern 3: Automatic delivery format - "📋 Category:\n━━━━━━\nCONTENT\n━━━━━━"
          if (!extracted) {
            const p3 = content.match(/📋[^\n]*:\s*\n━+\s*\n([\s\S]*?)\n━+/)
            if (p3 && p3[1]) extracted = p3[1].trim()
          }
          
          // Pattern 4: Just between separator lines (━━━)
          if (!extracted) {
            const separatorMatches = content.match(/━{5,}\s*\n([\s\S]*?)\n━{5,}/)
            if (separatorMatches && separatorMatches[1]) {
              extracted = separatorMatches[1].trim()
            }
          }
          
          // Pattern 5: DELIVERY INFO variant
          if (!extracted) {
            const p5 = content.match(/DELIVERY INFO\s*\n[━─═]+\s*\n([\s\S]*?)\n[━─═]+/)
            if (p5 && p5[1]) extracted = p5[1].trim()
          }
          
          // Pattern 6: Simple - everything between header and checkmark
          if (!extracted) {
            const p6 = content.match(/DELIVERY[^\n]*\n\n([\s\S]*?)\n\n✅/)
            if (p6 && p6[1]) extracted = p6[1].trim()
          }
          
          // Pattern 7: Line-by-line extraction for edge cases
          if (!extracted) {
            const lines = content.split('\n')
            
            // Find start of delivery content (after separator line)
            let startIdx = -1
            let endIdx = -1
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i]
              // Look for separator line (━━━━)
              if (line.match(/^━{5,}$/)) {
                if (startIdx === -1) {
                  // First separator - content starts after
                  startIdx = i + 1
                } else {
                  // Second separator - content ends before
                  endIdx = i
                  break
                }
              }
            }
            
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
              const deliveryLines = lines.slice(startIdx, endIdx).join('\n').trim()
              if (deliveryLines) extracted = deliveryLines
            }
          }
          
          // Pattern 8: Last resort - if it's a system message from seller around delivery time
          if (!extracted && deliveryMsg.message_type === 'system') {
            // Try to get everything that looks like credentials
            const credMatch = content.match(/(?:Username|Email|Password|Code|Key|Account)[\s:]+[^\n]+/gi)
            if (credMatch && credMatch.length > 0) {
              extracted = credMatch.join('\n')
            }
          }
          
          if (extracted) {
            console.log('Successfully extracted delivery info:', extracted.substring(0, 50) + '...')
            setDeliveryInfo(extracted)
          } else {
            console.log('Could not parse delivery content, trying full extraction')
            // Last fallback: extract everything between first and second separator
            const allSeparators = [...content.matchAll(/━{5,}/g)]
            if (allSeparators.length >= 2) {
              const start = (allSeparators[0].index || 0) + allSeparators[0][0].length
              const end = allSeparators[1].index || content.length
              const betweenSeparators = content.substring(start, end).trim()
              if (betweenSeparators && betweenSeparators.length > 0) {
                setDeliveryInfo(betweenSeparators)
              }
            }
          }
        } else {
          console.log('No delivery message found in conversation')
        }
      }
    } catch (err) {
      console.error('Error fetching delivery info:', err)
    }
  }

  const deliver = () => {
    if (deliveryText.trim().length < 10) return toast('error', 'Error', 'Min 10 characters required')
    confirm('Confirm Delivery', 'Send delivery instructions and mark as delivered? Buyer has 48h to confirm.', async () => {
      setModal(p => ({ ...p, show: false })); setActionLoading(true)
      try {
        let convId = (await supabase.from('conversations').select('id').eq('order_id', order.id).single()).data?.id
        if (!convId) {
          const lc = (await supabase.from('conversations').select('id').eq('listing_id', order.listing_id).eq('buyer_id', order.buyer_id).eq('seller_id', order.seller_id).single()).data
          if (lc) { await supabase.from('conversations').update({ order_id: order.id }).eq('id', lc.id); convId = lc.id }
          else convId = (await supabase.from('conversations').insert({ listing_id: order.listing_id, order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id, last_message: '📦 Delivery sent', last_message_at: new Date().toISOString() }).select('id').single()).data?.id
        }
        await supabase.from('messages').insert({ conversation_id: convId, sender_id: user.id, receiver_id: order.buyer_id, listing_id: order.listing_id, order_id: order.id, content: `📦 DELIVERY INFORMATION\n\n${deliveryText.trim()}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ Marked as delivered.\n⏰ 48 hours to confirm receipt.\n⚠️ Raise dispute if issues.`, message_type: 'system', read: false })
        await supabase.from('conversations').update({ last_message: '📦 Delivery sent', last_message_at: new Date().toISOString() }).eq('id', convId)
        await supabase.from('orders').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', id)
        const be = (await supabase.from('profiles').select('email').eq('id', order.buyer_id).single()).data?.email
        be && sendDeliveredEmail({ id: order.id, listing_title: order.listing.title, buyer_email: be, seller_username: order.seller.username, site_url: getSiteUrl() }).catch(e => console.error('Email error:', e))
        toast('success', 'Delivered!', 'Instructions sent to buyer'); setShowDelivery(false); setDeliveryText(''); fetchOrder()
      } catch (e: any) { toast('error', 'Failed', e.message) }
      finally { setActionLoading(false) }
    })
  }

  const confirmReceipt = () => confirm('Confirm Receipt', 'Complete order and release payment?', async () => {
    setModal(p => ({ ...p, show: false })); setActionLoading(true)
    try {
      await supabase.from('orders').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
      setShowReview(true); fetchOrder()
    } catch (e: any) { toast('error', 'Failed', e.message) }
    finally { setActionLoading(false) }
  }, 'info')

  const submitDispute = async () => {
    if (!disputeReason) return toast('error', 'Error', 'Select a reason')
    if (disputeDesc.length < 20) return toast('error', 'Error', 'Min 20 characters')
    setActionLoading(true)
    try {
      await supabase.from('disputes').insert({ order_id: id, raised_by: user.id, reason: disputeReason, description: disputeDesc, evidence_urls: [], status: 'open' })
      await supabase.from('orders').update({ status: 'dispute_raised', dispute_reason: disputeReason, dispute_opened_at: new Date().toISOString() }).eq('id', id)
      const [b, s] = await Promise.all([supabase.from('profiles').select('email').eq('id', order.buyer_id).single(), supabase.from('profiles').select('email').eq('id', order.seller_id).single()])
      const isBuyer = order.buyer_id === user?.id
      b.data?.email && s.data?.email && sendDisputeEmails({ id: order.id, listing_title: order.listing.title, buyer_email: b.data.email, seller_email: s.data.email, dispute_reason: disputeReason, is_buyer_raising: isBuyer, site_url: getSiteUrl() }).catch(e => console.error('Email error:', e))
      toast('success', 'Dispute Raised', 'Support will review'); setShowDispute(false); fetchOrder()
    } catch (e: any) { toast('error', 'Failed', e.message) }
    finally { setActionLoading(false) }
  }

  const submitReview = async () => {
    if (!rating) return toast('error', 'Error', 'Select rating')
    setActionLoading(true)
    try {
      await supabase.from('reviews').insert({ order_id: id, buyer_id: user.id, rating, comment: reviewText.trim() || null })
      setShowReview(false); setHasReviewed(true); toast('success', 'Thanks!', 'Review submitted')
    } catch (e: any) { toast('error', 'Failed', e.message) }
    finally { setActionLoading(false) }
  }

  // Open chat with logging
  const openChat = async () => {
    if (!order) return
    try {
      let cid = (await supabase.from('conversations').select('id').eq('order_id', order.id).single()).data?.id
      if (!cid) {
        const lc = (await supabase.from('conversations').select('id').eq('listing_id', order.listing_id).eq('buyer_id', order.buyer_id).eq('seller_id', order.seller_id).single()).data
        if (lc) { await supabase.from('conversations').update({ order_id: order.id }).eq('id', lc.id); cid = lc.id }
        else cid = (await supabase.from('conversations').insert({ listing_id: order.listing_id, order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id, last_message: 'Started', last_message_at: new Date().toISOString() }).select('id').single()).data?.id
      }
      
      // Log view_in_chat action if delivery info exists
      if (deliveryInfo && (order.status === 'delivered' || order.status === 'completed')) {
        await logDeliveryAccess('view_in_chat')
      }
      
      router.push(`/messages?conversation=${cid}`)
    } catch { toast('error', 'Failed', 'Cannot open chat') }
  }

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Error</h1>
        <p className="text-gray-400 mb-6 text-sm sm:text-base">{error}</p>
        <button onClick={() => location.reload()} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold min-h-[48px]">Refresh</button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
    </div>
  )

  if (!order) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl sm:text-6xl mb-4">📦</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Not Found</h1>
        <Link href="/dashboard" className="text-purple-400">← Dashboard</Link>
      </div>
    </div>
  )

  const isBuyer = order.buyer_id === user?.id, isSeller = order.seller_id === user?.id, isAdmin = profile?.is_admin
  const fee = order.amount * 0.05, total = order.amount + fee, sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const isManualDelivery = order.listing?.delivery_type === 'manual'

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] space-y-3">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm mx-auto sm:mx-0 bg-slate-900/95 backdrop-blur-xl border rounded-xl p-3 sm:p-4 shadow-2xl ${t.type === 'success' ? 'border-green-500/50' : t.type === 'error' ? 'border-red-500/50' : 'border-yellow-500/50'}`}>
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-base sm:text-lg">{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm sm:text-base ${t.type === 'success' ? 'text-green-400' : t.type === 'error' ? 'text-red-400' : 'text-blue-400'}`}>{t.title}</p>
                <p className="text-gray-300 text-xs sm:text-sm truncate">{t.msg}</p>
              </div>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-white p-1">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className={`bg-slate-900/95 border-2 rounded-2xl p-4 sm:p-6 max-w-md w-full ${modal.type === 'info' ? 'border-blue-500/50' : 'border-yellow-500/50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${modal.type === 'info' ? 'bg-blue-500/20' : 'bg-yellow-500/20'}`}>
                <span className="text-xl sm:text-2xl">{modal.type === 'info' ? 'ℹ️' : '⚠️'}</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-bold ${modal.type === 'info' ? 'text-blue-400' : 'text-yellow-400'}`}>{modal.title}</h3>
            </div>
            <p className="text-gray-300 mb-6 text-sm sm:text-base whitespace-pre-line">{modal.msg}</p>
            <div className="flex gap-3">
              <button onClick={modal.onOk} className={`flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r min-h-[48px] ${modal.type === 'info' ? 'from-blue-500 to-cyan-500' : 'from-yellow-500 to-orange-500'}`}>Confirm</button>
              <button onClick={() => setModal(p => ({ ...p, show: false }))} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 min-h-[48px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Security Warning Modal for Delivery Info Reveal */}
      {showSecurityWarning && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-[95] p-0 sm:p-4">
          <div className="bg-slate-900/95 border-t-2 sm:border-2 border-orange-500/50 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md animate-slide-up sm:animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30 flex-shrink-0">
                <span className="text-2xl sm:text-3xl">🔐</span>
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-orange-400">Security Notice</h3>
                <p className="text-xs sm:text-sm text-gray-400">Reveal Delivery Information</p>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4 mb-6">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 sm:p-4">
                <p className="text-orange-200 text-xs sm:text-sm leading-relaxed">
                  <strong className="text-orange-300">⚠️ Important:</strong> Only reveal when you're ready to use this information. For your security, this action is logged.
                </p>
              </div>
              
              <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-green-400 mt-0.5 text-sm">✓</span>
                  <p className="text-gray-300 text-xs sm:text-sm">Keep credentials private - don't share screenshots</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-green-400 mt-0.5 text-sm">✓</span>
                  <p className="text-gray-300 text-xs sm:text-sm">Test immediately to verify everything works</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-green-400 mt-0.5 text-sm">✓</span>
                  <p className="text-gray-300 text-xs sm:text-sm">Change passwords after logging in (for accounts)</p>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-red-400 mt-0.5 text-sm">✕</span>
                  <p className="text-gray-300 text-xs sm:text-sm">Never share these details with anyone</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>This reveal will be logged for security purposes</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={confirmSecurityAndReveal}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all min-h-[48px] text-sm sm:text-base"
              >
                🔓 I Understand, Reveal
              </button>
              <button 
                onClick={() => setShowSecurityWarning(false)}
                className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all min-h-[48px] text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-900/95 border-t-2 sm:border-2 border-green-500/50 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-green-400">📦 Deliver Order</h2>
              <button onClick={() => { setShowDelivery(false); setDeliveryText('') }} className="text-gray-400 hover:text-white text-xl p-2">✕</button>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-yellow-200 text-xs">
              <p>⚠️ Instructions sent as system message • Buyer has 48h to confirm • Cannot be undone</p>
            </div>
            <textarea 
              value={deliveryText} 
              onChange={e => setDeliveryText(e.target.value)} 
              placeholder="Username: example@email.com&#10;Password: pass123&#10;&#10;Or: XXXX-XXXX-XXXX" 
              rows={6} 
              maxLength={2000} 
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono text-sm mb-2 resize-none focus:border-green-500/50 focus:outline-none" 
            />
            <div className="flex justify-between text-xs mb-4">
              <span className="text-gray-400">{deliveryText.length}/2000 (min 10)</span>
              {deliveryText.length >= 10 && <span className="text-green-400">✓ Ready</span>}
            </div>
            {deliveryText.trim() && (
              <div className="mb-4">
                <p className="text-white font-semibold mb-2 text-sm">Preview:</p>
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-blue-300 font-bold text-xs mb-1">🔔 System Notification</p>
                  <div className="text-white text-xs font-mono whitespace-pre-wrap break-words bg-slate-900/50 rounded p-2">📦 DELIVERY INFO{'\n'}━━━━━━{'\n'}{deliveryText.trim()}{'\n'}━━━━━━{'\n'}✅ Delivered • ⏰ 48h to confirm</div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={deliver} disabled={actionLoading || deliveryText.trim().length < 10} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 min-h-[48px]">{actionLoading ? 'Delivering...' : '✓ Deliver'}</button>
              <button onClick={() => { setShowDelivery(false); setDeliveryText('') }} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 min-h-[48px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-slate-900/95 border-t-2 sm:border-2 border-purple-500/50 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-400 mb-2">⭐ Rate Experience</h2>
            <p className="text-gray-300 mb-4 text-sm">How was {order.seller.username}?</p>
            <div className="flex justify-center gap-1 sm:gap-2 mb-4">
              {[1,2,3,4,5].map(s => (
                <button 
                  key={s} 
                  onMouseEnter={() => setHoverRating(s)} 
                  onMouseLeave={() => setHoverRating(0)} 
                  onClick={() => setRating(s)} 
                  className="text-3xl sm:text-4xl hover:scale-125 transition p-1"
                >
                  {s <= (hoverRating || rating) ? <span className="text-yellow-400">★</span> : <span className="text-gray-600">★</span>}
                </button>
              ))}
            </div>
            {rating > 0 && <p className="text-center text-white font-semibold mb-4">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</p>}
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share experience..." rows={3} maxLength={500} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-2 resize-none" />
            <p className="text-xs text-gray-400 mb-4">{reviewText.length}/500</p>
            <div className="flex gap-3">
              <button onClick={submitReview} disabled={!rating || actionLoading} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 min-h-[48px]">Submit</button>
              <button onClick={() => setShowReview(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 min-h-[48px]">Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
      </div>

      <div className="relative z-10">
        <Navigation />
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12 max-w-5xl">
          {isAdmin && !isBuyer && !isSeller && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-2xl">👑</span>
                <h3 className="text-orange-400 font-bold text-sm sm:text-base">Admin View</h3>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Link href={isAdmin && !isBuyer && !isSeller ? '/admin' : isBuyer ? '/customer-dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-3 sm:mb-4 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back
            </Link>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-mono truncate max-w-[200px] sm:max-w-none">📋 Order #{order.id.slice(0, 8)}...</span>
                    <button
                      onClick={copyOrderId}
                      className={`p-2 rounded-lg border transition-all duration-200 min-w-[40px] min-h-[40px] flex items-center justify-center ${
                        copiedOrderId 
                          ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Copy full Order ID"
                    >
                      {copiedOrderId ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold mt-3">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Order Details</span>
                  </h1>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-2 sm:px-4 rounded-xl border self-start ${sc.bg} ${sc.border}`}>
                  <span className="text-lg sm:text-xl">{sc.icon}</span>
                  <span className={`font-semibold text-sm sm:text-base ${sc.text}`}>{sc.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FIXED: 48-Hour Timer for DELIVERED orders */}
          {order.status === 'delivered' && isBuyer && (
            <div className={`border-2 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 ${
              autoCompleteReady 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50'
                : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/50 animate-pulse'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  autoCompleteReady ? 'bg-green-500/20' : 'bg-yellow-500/20'
                }`}>
                  <span className="text-2xl sm:text-4xl">{autoCompleteReady ? '✅' : '⏱️'}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg sm:text-xl font-bold ${autoCompleteReady ? 'text-green-400' : 'text-yellow-400'}`}>
                    {autoCompleteReady ? 'Ready to Auto-Complete' : 'Action Required'}
                  </h3>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-white">
                    {autoCompleteReady ? 'Processing...' : timeRemaining}
                  </p>
                  <p className="text-gray-300 text-xs sm:text-sm">
                    {autoCompleteReady 
                      ? 'This order will be auto-completed shortly. You can still confirm manually or raise a dispute.'
                      : 'Confirm or dispute. Auto-completes after 48h.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 24-Hour Delivery Window Timer - VENDOR VIEW */}
          {order.status === 'paid' && isManualDelivery && isSeller && deliveryDeadline && (
            <div className={`border-2 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 ${
              deliveryDeadlinePassed 
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50' 
                : 'bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/50'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  deliveryDeadlinePassed ? 'bg-red-500/20' : 'bg-orange-500/20'
                }`}>
                  <span className="text-2xl sm:text-4xl">{deliveryDeadlinePassed ? '🚨' : '⏰'}</span>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg sm:text-xl font-bold ${deliveryDeadlinePassed ? 'text-red-400' : 'text-orange-400'}`}>
                    {deliveryDeadlinePassed ? '⚠️ Delivery Deadline Passed!' : '📦 Delivery Required'}
                  </h3>
                  <p className={`text-xl sm:text-2xl font-mono font-bold ${deliveryDeadlinePassed ? 'text-red-300' : 'text-white'}`}>
                    {deliveryDeadline}
                  </p>
                  <p className={`text-xs sm:text-sm ${deliveryDeadlinePassed ? 'text-red-300' : 'text-gray-300'}`}>
                    {deliveryDeadlinePassed 
                      ? 'The buyer can now open a dispute. Please deliver immediately!'
                      : 'You have 24 hours from payment to deliver this order.'
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setShowDelivery(true)}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-bold text-white transition-all min-h-[48px] ${
                    deliveryDeadlinePassed 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg hover:shadow-red-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/50'
                  }`}
                >
                  📦 Deliver Now
                </button>
              </div>
            </div>
          )}

          {/* 24-Hour Delivery Window Timer - BUYER VIEW */}
          {order.status === 'paid' && isManualDelivery && isBuyer && deliveryDeadline && (
            <div className={`border-2 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 ${
              deliveryDeadlinePassed 
                ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/50' 
                : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/50'
            }`}>
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    deliveryDeadlinePassed ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    <span className="text-2xl sm:text-4xl">{deliveryDeadlinePassed ? '🛡️' : '⏳'}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg sm:text-xl font-bold ${deliveryDeadlinePassed ? 'text-red-400' : 'text-blue-400'}`}>
                      {deliveryDeadlinePassed ? '🛡️ Buyer Protection Active' : '⏳ Waiting for Delivery'}
                    </h3>
                    <p className={`text-xl sm:text-2xl font-mono font-bold ${deliveryDeadlinePassed ? 'text-red-300' : 'text-white'}`}>
                      {deliveryDeadline}
                    </p>
                    <p className={`text-xs sm:text-sm ${deliveryDeadlinePassed ? 'text-red-300' : 'text-gray-300'}`}>
                      {deliveryDeadlinePassed 
                        ? 'The vendor has exceeded the 24-hour delivery window. You can now open a dispute for non-delivery.'
                        : 'The seller has 24 hours from payment to deliver your order.'
                      }
                    </p>
                  </div>
                  {deliveryDeadlinePassed && (
                    <button 
                      onClick={() => {
                        setDisputeReason('Vendor failed to deliver within 24 hours')
                        setShowDispute(true)
                      }}
                      className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg hover:shadow-red-500/50 transition-all min-h-[48px]"
                    >
                      ⚠️ Open Dispute
                    </button>
                  )}
                </div>
                {!deliveryDeadlinePassed && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-blue-300 text-xs sm:text-sm flex items-start gap-2">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Your payment is protected. If the vendor doesn't deliver within 24 hours, you'll be able to request a refund.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DELIVERY INFORMATION DISPLAY - For Buyers */}
          {(isBuyer || isAdmin) && (order.status === 'delivered' || order.status === 'completed' || order.status === 'dispute_raised') && (
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-xl sm:text-2xl">🔑</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-green-400">Delivery Information</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Your credentials/codes from the seller</p>
                  </div>
                </div>
                {deliveryInfo && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={showDeliveryInfo ? hideDeliveryInfo : handleRevealDeliveryInfo}
                      className={`px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-xs sm:text-sm font-medium min-h-[40px] ${
                        showDeliveryInfo
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {showDeliveryInfo ? (
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                          Hide
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Show
                        </span>
                      )}
                    </button>
                    <button
                      onClick={copyDeliveryInfo}
                      disabled={!showDeliveryInfo}
                      className={`px-3 sm:px-4 py-2 rounded-lg border transition-all duration-200 text-xs sm:text-sm font-medium min-h-[40px] ${
                        copiedDelivery
                          ? 'bg-green-500/20 border-green-500/30 text-green-400'
                          : showDeliveryInfo
                            ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                            : 'bg-white/5 border-white/10 text-gray-600 cursor-not-allowed opacity-50'
                      }`}
                      title={showDeliveryInfo ? "Copy delivery information" : "Reveal first to copy"}
                    >
                      {copiedDelivery ? (
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Copied!</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">Copy</span>
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              {deliveryInfo ? (
                <>
                  {showDeliveryInfo ? (
                    <div className="bg-slate-900/80 border border-green-500/20 rounded-xl p-3 sm:p-4">
                      <pre className="text-white font-mono text-xs sm:text-sm whitespace-pre-wrap break-all leading-relaxed select-all overflow-x-auto">
                        {deliveryInfo}
                      </pre>
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <p className="text-xs text-green-400/70 flex items-center gap-2">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          This access has been logged for security purposes
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-900/80 border border-white/10 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-xs sm:text-sm">Click "Show" to reveal your delivery information</span>
                      </div>
                      <div className="mt-3 relative">
                        <div className="bg-slate-800/50 rounded-lg p-3 blur-sm select-none pointer-events-none">
                          <p className="text-white font-mono text-xs sm:text-sm">••••••••••••••••••••</p>
                          <p className="text-white font-mono text-xs sm:text-sm">••••••••••••••••</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl">🔒</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-900/80 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs sm:text-sm">Delivery info is available in your messages. Click below to view.</span>
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={openChat}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 px-4 rounded-xl font-medium border border-white/10 transition-all flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  View in Messages
                </button>
                {order.status === 'delivered' && isBuyer && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1 justify-center sm:justify-start">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Remember to confirm receipt or raise a dispute!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Order Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              <div className="w-full md:w-40 lg:w-48 h-40 sm:h-48 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0">
                {order.listing.image_url ? (
                  <img src={order.listing.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl sm:text-6xl">
                    {order.listing.category === 'account' ? '🎮' : order.listing.category === 'topup' ? '💰' : '🔑'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 truncate">{order.listing.title}</h2>
                <p className="text-purple-400 font-medium mb-4 text-sm sm:text-base">{order.listing.game}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
                  {[
                    { l: 'Qty', v: order.quantity }, 
                    { l: 'Price', v: `$${(order.amount / order.quantity).toFixed(2)}` }, 
                    { l: 'Type', v: order.listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual' }, 
                    { l: 'Date', v: formatShortDate(order.created_at) }
                  ].map((x, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                      <p className="text-xs text-gray-400 mb-0.5 sm:mb-1">{x.l}</p>
                      <p className="text-white font-bold text-sm sm:text-base truncate">{x.v}</p>
                    </div>
                  ))}
                </div>
                {order.delivered_at && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 sm:p-3 inline-block">
                    <p className="text-green-400 text-xs sm:text-sm">✓ Delivered {formatDate(order.delivered_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Participants */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">👥 Participants</h3>
              {[
                { l: 'Buyer', u: order.buyer, y: isBuyer, g: 'from-blue-500 to-cyan-500', b: 'bg-blue-500/20 text-blue-400' }, 
                { l: 'Seller', u: order.seller, y: isSeller, g: 'from-purple-500 to-pink-500', b: 'bg-pink-500/20 text-pink-400' }
              ].map((p, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 mb-3 sm:mb-4">
                  <p className="text-xs text-gray-400 mb-2 uppercase">{p.l}</p>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${p.g} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-base sm:text-lg">{p.u.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-white font-semibold text-base sm:text-lg truncate">{p.u.username}</span>
                    {p.y && <span className={`text-xs ${p.b} px-2 py-1 rounded-full flex-shrink-0`}>You</span>}
                  </div>
                </div>
              ))}
              <button onClick={openChat} className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white py-3 rounded-xl font-semibold border border-purple-500/30 min-h-[48px]">💬 Message</button>
            </div>

            {/* Payment */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4">💳 Payment</h3>
              <div className="space-y-2 sm:space-y-3 mb-4">
                <div className="flex justify-between text-sm sm:text-base"><span className="text-gray-400">Subtotal</span><span className="text-white font-semibold">${order.amount.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm sm:text-base"><span className="text-gray-400">Fee (5%)</span><span className="text-white font-semibold">${fee.toFixed(2)}</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-white font-bold">Total</span><span className="text-xl sm:text-2xl font-bold text-green-400">${total.toFixed(2)}</span></div>
              </div>
              {isSeller && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 sm:p-4 mb-4">
                  <h4 className="text-green-400 font-semibold mb-2 text-sm sm:text-base">💰 Your Earnings</h4>
                  <div className="text-xs sm:text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white">${order.amount.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Fee</span><span className="text-red-400">-${(order.amount * 0.05).toFixed(2)}</span></div>
                    <div className="border-t border-green-500/20 pt-1 flex justify-between"><span className="text-white font-bold">Net</span><span className="text-green-400 font-bold">${(order.amount * 0.95).toFixed(2)}</span></div>
                  </div>
                  <p className={`text-xs mt-2 px-2 py-1 rounded ${order.status === 'completed' ? 'text-green-400 bg-green-500/10' : order.status === 'delivered' ? 'text-yellow-400 bg-yellow-500/10' : order.status === 'paid' ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {order.status === 'completed' ? '✓ Released' : order.status === 'delivered' ? '⏳ On hold' : order.status === 'paid' ? '📦 Deliver to release' : '⚠️ Frozen'}
                  </p>
                </div>
              )}
              <div className="flex justify-between bg-white/5 rounded-lg p-3 border border-white/10">
                <span className="text-xs sm:text-sm text-gray-400">Status</span>
                <span className={`text-xs sm:text-sm font-bold px-3 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">⚡ Actions</h3>

            <div className="space-y-3">
              {/* Pending Payment Info */}
              {order.status === 'pending' && order.payment_status === 'pending' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex items-start sm:items-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">⏳</span>
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-yellow-400">Awaiting Payment</h4>
                      <p className="text-xs sm:text-sm text-gray-300">This order is waiting for payment confirmation</p>
                    </div>
                  </div>
                  <p className="text-yellow-300 text-xs sm:text-sm mt-3">
                    {isBuyer 
                      ? 'Please complete your payment to proceed with this order. If you\'ve already paid, please wait for confirmation.'
                      : 'The buyer needs to complete payment before you can deliver this order.'
                    }
                  </p>
                </div>
              )}

              {/* SELLER ACTION: Deliver Order (Manual Only) */}
              {isSeller && order.status === 'paid' && order.listing.delivery_type === 'manual' && (
                <button 
                  onClick={() => setShowDelivery(true)} 
                  disabled={actionLoading} 
                  className={`w-full text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg disabled:opacity-50 hover:shadow-lg transition-all min-h-[48px] ${
                    deliveryDeadlinePassed 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-red-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/50'
                  }`}
                >
                  📦 Deliver Order {deliveryDeadlinePassed && '(URGENT!)'}
                </button>
              )}

              {/* BUYER ACTIONS: Confirm or Dispute */}
              {isBuyer && order.status === 'delivered' && !showDispute && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={confirmReceipt} 
                    disabled={actionLoading} 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 sm:py-4 rounded-xl font-bold disabled:opacity-50 hover:shadow-lg hover:shadow-green-500/50 transition-all min-h-[48px]"
                  >
                    ✓ Confirm Receipt
                  </button>
                  <button 
                    onClick={() => setShowDispute(true)} 
                    className="bg-red-500/20 text-red-400 py-3 sm:py-4 rounded-xl font-bold border-2 border-red-500/50 hover:bg-red-500/30 transition-all min-h-[48px]"
                  >
                    ⚠️ Raise Dispute
                  </button>
                </div>
              )}

              {/* BUYER ACTION - Dispute for Non-Delivery */}
              {isBuyer && order.status === 'paid' && isManualDelivery && deliveryDeadlinePassed && !showDispute && (
                <div className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4 sm:p-6">
                  <div className="flex items-start sm:items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">🛡️</span>
                    </div>
                    <div>
                      <h4 className="text-lg sm:text-xl font-bold text-red-400">Buyer Protection Available</h4>
                      <p className="text-xs sm:text-sm text-gray-300">The vendor has exceeded the 24-hour delivery window</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setDisputeReason('Vendor failed to deliver within 24 hours')
                      setShowDispute(true)
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-lg hover:shadow-red-500/50 transition-all min-h-[48px]"
                  >
                    ⚠️ Open Non-Delivery Dispute
                  </button>
                </div>
              )}

              {/* BUYER: Dispute Form */}
              {isBuyer && showDispute && (order.status === 'delivered' || (order.status === 'paid' && isManualDelivery && deliveryDeadlinePassed)) && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 sm:p-6">
                  <h4 className="text-lg sm:text-xl font-bold text-red-400 mb-4">⚠️ Raise Dispute</h4>
                  
                  {order.status === 'paid' && deliveryDeadlinePassed && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4">
                      <p className="text-orange-300 text-xs sm:text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        This is a non-delivery dispute. The vendor has exceeded the 24-hour delivery window.
                      </p>
                    </div>
                  )}
                  
                  <select 
                    value={disputeReason} 
                    onChange={e => setDisputeReason(e.target.value)} 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 sm:px-4 py-3 text-white text-sm sm:text-base mb-4 focus:border-red-500/50 focus:outline-none"
                  >
                    <option value="">Select reason...</option>
                    <option value="Vendor failed to deliver within 24 hours">Vendor failed to deliver within 24 hours</option>
                    <option value="Item not received">Item not received</option>
                    <option value="Wrong item">Wrong item</option>
                    <option value="Not as described">Not as described</option>
                    <option value="Invalid credentials">Invalid credentials</option>
                    <option value="Code already used">Code already used</option>
                    <option value="Seller not responding">Seller not responding</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea 
                    value={disputeDesc} 
                    onChange={e => setDisputeDesc(e.target.value)} 
                    placeholder={order.status === 'paid' && deliveryDeadlinePassed 
                      ? "Please describe the situation..."
                      : "Describe the issue in detail (minimum 20 characters)..."
                    }
                    rows={4} 
                    maxLength={1000} 
                    className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 sm:px-4 py-3 text-white text-sm sm:text-base mb-2 resize-none focus:border-red-500/50 focus:outline-none" 
                  />
                  <p className="text-xs text-gray-400 mb-4">{disputeDesc.length}/1000 characters (min 20)</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={submitDispute} 
                      disabled={actionLoading || !disputeReason || disputeDesc.length < 20} 
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-red-500/50 transition-all min-h-[48px]"
                    >
                      {actionLoading ? 'Submitting...' : 'Submit Dispute'}
                    </button>
                    <button 
                      onClick={() => {setShowDispute(false); setDisputeReason(''); setDisputeDesc('')}} 
                      className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all min-h-[48px]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* DISPUTE ACTIVE */}
              {order.status === 'dispute_raised' && dispute && (
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-xl sm:text-2xl">⚠️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-red-400 font-bold text-base sm:text-lg">Dispute Active</p>
                      <p className="text-xs sm:text-sm text-gray-400">Opened: {formatDate(dispute.created_at)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold self-start ${
                      dispute.status === 'open' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {dispute.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-white mb-1"><strong className="text-red-400">Reason:</strong> {dispute.reason}</p>
                    <p className="text-xs sm:text-sm text-gray-300">{dispute.description}</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-xs sm:text-sm">💬 Support team is reviewing this dispute. You will be notified of any updates.</p>
                  </div>
                </div>
              )}

              {/* BUYER: Leave Review */}
              {isBuyer && order.status === 'completed' && !hasReviewed && (
                <button 
                  onClick={() => setShowReview(true)} 
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all min-h-[48px]"
                >
                  ⭐ Leave Review
                </button>
              )}

              {/* BUYER: Review Submitted */}
              {isBuyer && order.status === 'completed' && hasReviewed && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-green-400 font-semibold text-sm sm:text-base">✓ Thank you! Your review has been submitted.</p>
                </div>
              )}

              {/* WAITING MESSAGES */}
              {isBuyer && order.status === 'paid' && !deliveryDeadlinePassed && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-blue-400 font-semibold text-sm sm:text-base">
                    ⏳ Waiting for seller to deliver the item...
                    {isManualDelivery && deliveryDeadline && (
                      <span className="block text-xs sm:text-sm text-gray-400 mt-1">
                        Seller has {deliveryDeadline} to deliver
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        
          {/* Timeline */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">📋 Timeline</h3>
            <div className="space-y-0">
              {[
                { show: true, icon: '🛒', color: 'blue', title: 'Created', time: order.created_at, sub: `By ${order.buyer.username}` },
                { show: order.payment_status === 'paid', icon: '💳', color: 'green', title: 'Paid', time: order.paid_at || order.created_at, sub: 'Payment received' },
                { show: !!order.delivered_at, icon: '📦', color: 'yellow', title: 'Delivered', time: order.delivered_at, sub: `By ${order.seller.username}` },
                { show: !!order.dispute_opened_at, icon: '⚠️', color: 'red', title: 'Disputed', time: order.dispute_opened_at, sub: order.dispute_reason },
                ...adminActions.map(a => ({ show: true, icon: '👑', color: 'orange', title: a.action_type.replace(/_/g, ' '), time: a.created_at, sub: `Admin: ${a.admin?.username || 'Unknown'}` })),
                { show: !!order.completed_at && (order.status === 'completed' || order.status === 'refunded'), icon: order.status === 'refunded' ? '💰' : '✅', color: order.status === 'refunded' ? 'orange' : 'green', title: order.status === 'refunded' ? 'Refunded' : 'Completed', time: order.completed_at, sub: order.resolution_notes || '' }
              ].filter(e => e.show).sort((a, b) => {
                // Sort timeline events by time (oldest first)
                if (!a.time || !b.time) return 0
                return parseAsUTC(a.time).getTime() - parseAsUTC(b.time).getTime()
              }).map((e, i, arr) => (
                <div key={i} className="flex gap-3 sm:gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-${e.color}-500/20 to-${e.color}-500/20 rounded-xl flex items-center justify-center border border-${e.color}-500/30 flex-shrink-0`}>
                      <span className={`text-${e.color}-400 text-lg sm:text-xl`}>{e.icon}</span>
                    </div>
                    {i < arr.length - 1 && <div className={`w-0.5 flex-1 bg-gradient-to-b from-${e.color}-500/30 to-transparent min-h-[32px] sm:min-h-[40px]`}></div>}
                  </div>
                  <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                    <p className="text-white font-semibold text-sm sm:text-base">{e.title}</p>
                    {e.time && <p className="text-xs sm:text-sm text-gray-400">{formatDate(e.time)}</p>}
                    {e.sub && <p className="text-xs text-gray-500 mt-1 truncate">{e.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}