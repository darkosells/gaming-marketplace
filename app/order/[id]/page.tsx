'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { sendOrderEmails, sendDeliveredEmail, sendDisputeEmails, getSiteUrl } from '@/lib/email'

const STATUS_CONFIG: Record<string, any> = {
  paid: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', icon: '💳', label: 'Paid - Awaiting Delivery' },
  delivered: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '📦', label: 'Delivered - Awaiting Confirmation' },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', icon: '✅', label: 'Completed' },
  dispute_raised: { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', icon: '⚠️', label: 'Dispute Raised' },
  cancelled: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400', icon: '❌', label: 'Cancelled' },
  refunded: { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', icon: '💰', label: 'Refunded' }
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

  const toast = (type: string, title: string, msg: string) => {
    const t = { id: Date.now().toString(), type, title, msg }
    setToasts(p => [...p, t])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), 5000)
  }

  const confirm = (title: string, msg: string, onOk: () => void, type = 'warning') => setModal({ show: true, title, msg, onOk, type })

  useEffect(() => { mounted.current = true; checkAuth(); return () => { mounted.current = false } }, [])
  useEffect(() => { user && profile && fetchOrder() }, [user, profile])
  useEffect(() => {
    if (order?.status === 'delivered' && order.delivered_at) {
      const iv = setInterval(() => {
        const h = 48 - (Date.now() - new Date(order.delivered_at).getTime()) / 3600000
        h <= 0 ? (setTimeRemaining('Auto-completing...'), clearInterval(iv)) : setTimeRemaining(`${Math.floor(h)}h ${Math.floor((h % 1) * 60)}m ${Math.floor(((h % 1) * 60 % 1) * 60)}s`)
      }, 1000)
      return () => clearInterval(iv)
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
        (profile?.is_admin || d.dispute_opened_at) && supabase.from('admin_actions').select('*, admin:profiles!admin_actions_admin_id_fkey(username)').eq('target_type', 'order').eq('target_id', id).order('created_at', { ascending: false }).then(r => !r.error && setAdminActions(r.data || []))
      ])
    } catch { mounted.current && setError('Failed to load order') }
    finally { mounted.current && setLoading(false) }
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
        be && sendDeliveredEmail({ id: order.id, listing_title: order.listing.title, buyer_email: be, seller_username: order.seller.username, site_url: getSiteUrl() }).catch(() => {})
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
    b.data?.email && s.data?.email && sendDisputeEmails({ id: order.id, listing_title: order.listing.title, buyer_email: b.data.email, seller_email: s.data.email, dispute_reason: disputeReason, is_buyer_raising: isBuyer, site_url: getSiteUrl() }).catch(() => {})
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

  const openChat = async () => {
    if (!order) return
    try {
      let cid = (await supabase.from('conversations').select('id').eq('order_id', order.id).single()).data?.id
      if (!cid) {
        const lc = (await supabase.from('conversations').select('id').eq('listing_id', order.listing_id).eq('buyer_id', order.buyer_id).eq('seller_id', order.seller_id).single()).data
        if (lc) { await supabase.from('conversations').update({ order_id: order.id }).eq('id', lc.id); cid = lc.id }
        else cid = (await supabase.from('conversations').insert({ listing_id: order.listing_id, order_id: order.id, buyer_id: order.buyer_id, seller_id: order.seller_id, last_message: 'Started', last_message_at: new Date().toISOString() }).select('id').single()).data?.id
      }
      router.push(`/messages?conversation=${cid}`)
    } catch { toast('error', 'Failed', 'Cannot open chat') }
  }

  const simPay = () => confirm('Simulate Payment', '⚠️ TEST: Simulate payment?', async () => {
    setModal(p => ({ ...p, show: false })); setActionLoading(true)
    try {
      await supabase.from('orders').update({ payment_status: 'paid', status: 'paid' }).eq('id', id)
      const [b, s] = await Promise.all([supabase.from('profiles').select('email, username').eq('id', order.buyer_id).single(), supabase.from('profiles').select('email, username').eq('id', order.seller_id).single()])
      b.data?.email && s.data?.email && await sendOrderEmails({ id: order.id, listing_title: order.listing.title, quantity: order.quantity, total_amount: order.amount * 1.05, seller_amount: order.amount * 0.95, buyer_email: b.data.email, seller_email: s.data.email, buyer_username: b.data.username, seller_username: s.data.username, site_url: getSiteUrl() })
      toast('success', 'Paid!', 'Emails sent'); setTimeout(fetchOrder, 1000)
    } catch (e: any) { toast('error', 'Failed', e.message) }
    finally { setActionLoading(false) }
  })

  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">⚠️</div><h1 className="text-3xl font-bold text-white mb-4">Error</h1><p className="text-gray-400 mb-6">{error}</p><button onClick={() => location.reload()} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold">Refresh</button></div></div>
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div></div>
  if (!order) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="text-center"><div className="text-6xl mb-4">📦</div><h1 className="text-3xl font-bold text-white mb-4">Not Found</h1><Link href="/dashboard" className="text-purple-400">← Dashboard</Link></div></div>

  const isBuyer = order.buyer_id === user?.id, isSeller = order.seller_id === user?.id, isAdmin = profile?.is_admin
  const fee = order.amount * 0.05, total = order.amount + fee, sc = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-3">{toasts.map(t => (
        <div key={t.id} className={`max-w-sm bg-slate-900/95 backdrop-blur-xl border rounded-xl p-4 shadow-2xl ${t.type === 'success' ? 'border-green-500/50' : t.type === 'error' ? 'border-red-500/50' : 'border-yellow-500/50'}`}>
          <div className="flex items-start gap-3">
            <span className="text-lg">{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚠️'}</span>
            <div className="flex-1"><p className={`font-semibold ${t.type === 'success' ? 'text-green-400' : t.type === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>{t.title}</p><p className="text-gray-300 text-sm">{t.msg}</p></div>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
      ))}</div>

      {/* Confirm Modal */}
      {modal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className={`bg-slate-900/95 border-2 rounded-2xl p-6 max-w-md w-full ${modal.type === 'info' ? 'border-blue-500/50' : 'border-yellow-500/50'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${modal.type === 'info' ? 'bg-blue-500/20' : 'bg-yellow-500/20'}`}><span className="text-2xl">{modal.type === 'info' ? 'ℹ️' : '⚠️'}</span></div>
              <h3 className={`text-xl font-bold ${modal.type === 'info' ? 'text-blue-400' : 'text-yellow-400'}`}>{modal.title}</h3>
            </div>
            <p className="text-gray-300 mb-6 whitespace-pre-line">{modal.msg}</p>
            <div className="flex gap-3">
              <button onClick={modal.onOk} className={`flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r ${modal.type === 'info' ? 'from-blue-500 to-cyan-500' : 'from-yellow-500 to-orange-500'}`}>Confirm</button>
              <button onClick={() => setModal(p => ({ ...p, show: false }))} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Modal */}
      {showDelivery && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border-2 border-green-500/50 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4"><h2 className="text-2xl font-bold text-green-400">📦 Deliver Order</h2><button onClick={() => { setShowDelivery(false); setDeliveryText('') }} className="text-gray-400 hover:text-white text-xl">✕</button></div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 text-yellow-200 text-xs">
              <p>⚠️ Instructions sent as system message • Buyer has 48h to confirm • Cannot be undone</p>
            </div>
            <textarea value={deliveryText} onChange={e => setDeliveryText(e.target.value)} placeholder="Username: example@email.com&#10;Password: pass123&#10;&#10;Or: XXXX-XXXX-XXXX" rows={8} maxLength={2000} className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono text-sm mb-2 resize-none focus:border-green-500/50 focus:outline-none" />
            <div className="flex justify-between text-xs mb-4"><span className="text-gray-400">{deliveryText.length}/2000 (min 10)</span>{deliveryText.length >= 10 && <span className="text-green-400">✓ Ready</span>}</div>
            {deliveryText.trim() && (
              <div className="mb-4"><p className="text-white font-semibold mb-2 text-sm">Preview:</p>
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <p className="text-blue-300 font-bold text-xs mb-1">🔔 System Notification</p>
                  <div className="text-white text-xs font-mono whitespace-pre-wrap break-words bg-slate-900/50 rounded p-2">📦 DELIVERY INFO{'\n'}━━━━━━{'\n'}{deliveryText.trim()}{'\n'}━━━━━━{'\n'}✅ Delivered • ⏰ 48h to confirm</div>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={deliver} disabled={actionLoading || deliveryText.trim().length < 10} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">{actionLoading ? 'Delivering...' : '✓ Deliver'}</button>
              <button onClick={() => { setShowDelivery(false); setDeliveryText('') }} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/95 border-2 border-purple-500/50 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-purple-400 mb-2">⭐ Rate Experience</h2>
            <p className="text-gray-300 mb-4 text-sm">How was {order.seller.username}?</p>
            <div className="flex justify-center gap-2 mb-4">{[1,2,3,4,5].map(s => (
              <button key={s} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} className="text-4xl hover:scale-125 transition">{s <= (hoverRating || rating) ? <span className="text-yellow-400">★</span> : <span className="text-gray-600">★</span>}</button>
            ))}</div>
            {rating > 0 && <p className="text-center text-white font-semibold mb-4">{['','Poor','Fair','Good','Very Good','Excellent'][rating]}</p>}
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share experience..." rows={3} maxLength={500} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm mb-2 resize-none" />
            <p className="text-xs text-gray-400 mb-4">{reviewText.length}/500</p>
            <div className="flex gap-3">
              <button onClick={submitReview} disabled={!rating || actionLoading} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-bold disabled:opacity-50">Submit</button>
              <button onClick={() => setShowReview(false)} className="flex-1 bg-white/5 text-white py-2.5 rounded-xl font-bold border border-white/10">Skip</button>
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 z-0"><div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div><div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div><div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div></div>

      <div className="relative z-10">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          {isAdmin && !isBuyer && !isSeller && <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6"><div className="flex items-center gap-3"><span className="text-2xl">👑</span><div><h3 className="text-orange-400 font-bold">Admin View</h3></div></div></div>}

          {/* Header */}
          <div className="mb-8">
            <Link href={isAdmin && !isBuyer && !isSeller ? '/admin' : isBuyer ? '/customer-dashboard' : '/dashboard'} className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Back</Link>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div><span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm">📋 Order #{order.id.substring(0, 8)}</span><h1 className="text-3xl font-bold mt-3"><span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Order Details</span></h1></div>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${sc.bg} ${sc.border}`}><span className="text-xl">{sc.icon}</span><span className={`font-semibold ${sc.text}`}>{sc.label}</span></div>
              </div>
            </div>
          </div>

          {/* Timer */}
          {order.status === 'delivered' && timeRemaining && isBuyer && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-2 border-yellow-500/50 rounded-2xl p-6 mb-6 animate-pulse">
              <div className="flex items-center gap-4"><div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center"><span className="text-4xl">⏱️</span></div><div><h3 className="text-xl font-bold text-yellow-400">Action Required</h3><p className="text-2xl font-mono font-bold text-white">{timeRemaining}</p><p className="text-gray-300 text-sm">Confirm or dispute. Auto-completes after 48h.</p></div></div>
            </div>
          )}

          {/* Order Card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">{order.listing.image_url ? <img src={order.listing.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-6xl">{order.listing.category === 'account' ? '🎮' : order.listing.category === 'topup' ? '💰' : '🔑'}</div>}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{order.listing.title}</h2>
                <p className="text-purple-400 font-medium mb-4">{order.listing.game}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">{[{ l: 'Qty', v: order.quantity }, { l: 'Price', v: `$${(order.amount / order.quantity).toFixed(2)}` }, { l: 'Type', v: order.listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual' }, { l: 'Date', v: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }].map((x, i) => <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10"><p className="text-xs text-gray-400 mb-1">{x.l}</p><p className="text-white font-bold">{x.v}</p></div>)}</div>
                {order.delivered_at && <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 inline-block"><p className="text-green-400 text-sm">✓ Delivered {new Date(order.delivered_at).toLocaleString()}</p></div>}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Participants */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">👥 Participants</h3>
              {[{ l: 'Buyer', u: order.buyer, y: isBuyer, g: 'from-blue-500 to-cyan-500', b: 'bg-blue-500/20 text-blue-400' }, { l: 'Seller', u: order.seller, y: isSeller, g: 'from-purple-500 to-pink-500', b: 'bg-pink-500/20 text-pink-400' }].map((p, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4"><p className="text-xs text-gray-400 mb-2 uppercase">{p.l}</p><div className="flex items-center gap-3"><div className={`w-12 h-12 bg-gradient-to-br ${p.g} rounded-full flex items-center justify-center`}><span className="text-white font-bold text-lg">{p.u.username.charAt(0).toUpperCase()}</span></div><span className="text-white font-semibold text-lg">{p.u.username}</span>{p.y && <span className={`text-xs ${p.b} px-2 py-1 rounded-full`}>You</span>}</div></div>
              ))}
              <button onClick={openChat} className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-white py-3 rounded-xl font-semibold border border-purple-500/30">💬 Message</button>
            </div>

            {/* Payment */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">💳 Payment</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white font-semibold">${order.amount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Fee (5%)</span><span className="text-white font-semibold">${fee.toFixed(2)}</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-white font-bold">Total</span><span className="text-2xl font-bold text-green-400">${total.toFixed(2)}</span></div>
              </div>
              {isSeller && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
                  <h4 className="text-green-400 font-semibold mb-2">💰 Your Earnings</h4>
                  <div className="text-sm space-y-1"><div className="flex justify-between"><span className="text-gray-400">Amount</span><span className="text-white">${order.amount.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-gray-400">Fee</span><span className="text-red-400">-${(order.amount * 0.05).toFixed(2)}</span></div><div className="border-t border-green-500/20 pt-1 flex justify-between"><span className="text-white font-bold">Net</span><span className="text-green-400 font-bold">${(order.amount * 0.95).toFixed(2)}</span></div></div>
                  <p className={`text-xs mt-2 px-2 py-1 rounded ${order.status === 'completed' ? 'text-green-400 bg-green-500/10' : order.status === 'delivered' ? 'text-yellow-400 bg-yellow-500/10' : order.status === 'paid' ? 'text-blue-400 bg-blue-500/10' : 'text-red-400 bg-red-500/10'}`}>{order.status === 'completed' ? '✓ Released' : order.status === 'delivered' ? '⏳ On hold' : order.status === 'paid' ? '📦 Deliver to release' : '⚠️ Frozen'}</p>
                </div>
              )}
              <div className="flex justify-between bg-white/5 rounded-lg p-3 border border-white/10"><span className="text-sm text-gray-400">Status</span><span className={`text-sm font-bold px-3 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{order.payment_status.toUpperCase()}</span></div>
              {order.payment_status === 'pending' && isBuyer && <div className="mt-4"><div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3 text-yellow-400 text-xs">⚠️ TEST MODE</div><button onClick={simPay} disabled={actionLoading} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50">💳 Simulate Payment</button></div>}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-4">⚡ Actions</h3>
            <div className="space-y-3">
              {isSeller && order.status === 'paid' && order.listing.delivery_type === 'manual' && <button onClick={() => setShowDelivery(true)} disabled={actionLoading} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50">📦 Deliver Order</button>}
              {isBuyer && order.status === 'delivered' && !showDispute && (
                <div className="grid md:grid-cols-2 gap-3">
                  <button onClick={confirmReceipt} disabled={actionLoading} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold disabled:opacity-50">✓ Confirm Receipt</button>
                  <button onClick={() => setShowDispute(true)} className="bg-red-500/20 text-red-400 py-4 rounded-xl font-bold border border-red-500/30">⚠️ Raise Dispute</button>
                </div>
              )}
              {isBuyer && showDispute && order.status === 'delivered' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <h4 className="text-xl font-bold text-red-400 mb-4">⚠️ Raise Dispute</h4>
                  <select value={disputeReason} onChange={e => setDisputeReason(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-lg px-4 py-3 text-white mb-4 [&>option]:bg-slate-800"><option value="">Select reason...</option>{['Item not received', 'Wrong item', 'Not as described', 'Invalid credentials', 'Code used', 'No response', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}</select>
                  <textarea value={disputeDesc} onChange={e => setDisputeDesc(e.target.value)} placeholder="Details (min 20 chars)..." rows={4} maxLength={1000} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white mb-2 resize-none" /><p className="text-xs text-gray-400 mb-4">{disputeDesc.length}/1000</p>
                  <div className="flex gap-3"><button onClick={submitDispute} disabled={actionLoading} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">Submit</button><button onClick={() => setShowDispute(false)} className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10">Cancel</button></div>
                </div>
              )}
              {order.status === 'dispute_raised' && dispute && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                  <div className="flex items-start gap-3 mb-4"><div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center"><span className="text-2xl">⚠️</span></div><div><p className="text-red-400 font-bold text-lg">Dispute Active</p><p className="text-sm text-gray-400">Opened: {new Date(dispute.created_at).toLocaleString()}</p></div><span className={`px-3 py-1 rounded-full text-xs font-semibold ${dispute.status === 'open' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>{dispute.status.toUpperCase()}</span></div>
                  <p className="text-sm text-white mb-1"><strong>Reason:</strong> {dispute.reason}</p><p className="text-sm text-gray-300">{dispute.description}</p>
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"><p className="text-yellow-400 text-sm">💬 Support is reviewing.</p></div>
                </div>
              )}
              {isBuyer && order.status === 'completed' && !hasReviewed && <button onClick={() => setShowReview(true)} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg">⭐ Leave Review</button>}
              {isBuyer && order.status === 'completed' && hasReviewed && <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center"><p className="text-green-400">✓ Review submitted. Thanks!</p></div>}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-6">📋 Timeline</h3>
            <div className="space-y-0">
              {[
                { show: true, icon: '🛒', color: 'blue', title: 'Created', time: order.created_at, sub: `By ${order.buyer.username}` },
                { show: order.payment_status === 'paid', icon: '💳', color: 'green', title: 'Paid', time: null, sub: 'Payment received' },
                { show: !!order.delivered_at, icon: '📦', color: 'yellow', title: 'Delivered', time: order.delivered_at, sub: `By ${order.seller.username}` },
                { show: !!order.dispute_opened_at, icon: '⚠️', color: 'red', title: 'Disputed', time: order.dispute_opened_at, sub: order.dispute_reason },
                ...adminActions.map(a => ({ show: true, icon: '👑', color: 'orange', title: a.action_type.replace(/_/g, ' '), time: a.created_at, sub: `Admin: ${a.admin?.username || 'Unknown'}` })),
                { show: !!order.completed_at && (order.status === 'completed' || order.status === 'refunded'), icon: order.status === 'refunded' ? '💰' : '✅', color: order.status === 'refunded' ? 'orange' : 'green', title: order.status === 'refunded' ? 'Refunded' : 'Completed', time: order.completed_at, sub: order.resolution_notes || '' }
              ].filter(e => e.show).map((e, i, arr) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center"><div className={`w-12 h-12 bg-gradient-to-br from-${e.color}-500/20 to-${e.color}-500/20 rounded-xl flex items-center justify-center border border-${e.color}-500/30`}><span className={`text-${e.color}-400 text-xl`}>{e.icon}</span></div>{i < arr.length - 1 && <div className={`w-0.5 flex-1 bg-gradient-to-b from-${e.color}-500/30 to-transparent min-h-[40px]`}></div>}</div>
                  <div className="flex-1 pb-6"><p className="text-white font-semibold">{e.title}</p>{e.time && <p className="text-sm text-gray-400">{new Date(e.time).toLocaleString()}</p>}{e.sub && <p className="text-xs text-gray-500 mt-1">{e.sub}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <footer className="bg-slate-950/80 border-t border-white/5 py-8 mt-12 text-center text-gray-500 text-sm">© 2024 Nashflare</footer>
      </div>
    </div>
  )
}