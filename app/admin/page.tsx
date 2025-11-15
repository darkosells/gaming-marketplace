'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const ITEMS_PER_PAGE = 10

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [disputeSubTab, setDisputeSubTab] = useState('active')
  const [verificationSubTab, setVerificationSubTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeDisputes, setActiveDisputes] = useState<any[]>([])
  const [solvedDisputes, setSolvedDisputes] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([])
  const [processedWithdrawals, setProcessedWithdrawals] = useState<any[]>([])
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([])
  const [pastVerifications, setPastVerifications] = useState<any[]>([])
  const [editingReview, setEditingReview] = useState<any>(null)
  const [editedComment, setEditedComment] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [approvingWithdrawalId, setApprovingWithdrawalId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [showVerificationDetailsModal, setShowVerificationDetailsModal] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [verificationDecisionModal, setVerificationDecisionModal] = useState<'approve' | 'reject' | null>(null)
  const [verificationRejectionReason, setVerificationRejectionReason] = useState('')
  const [verificationAdminNotes, setVerificationAdminNotes] = useState('')
  const [rejectionType, setRejectionType] = useState<'resubmission_required' | 'permanent'>('resubmission_required')
  const [resubmissionFields, setResubmissionFields] = useState<string[]>([])
  const [resubmissionInstructions, setResubmissionInstructions] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { checkAdmin() }, [])
  
  useEffect(() => {
    if (profile?.is_admin) {
      if (activeTab === 'users') fetchUsers()
      if (activeTab === 'listings') fetchListings()
      if (activeTab === 'orders') fetchOrders()
      if (activeTab === 'messages') fetchConversations()
      if (activeTab === 'disputes') fetchDisputes()
      if (activeTab === 'reviews') fetchReviews()
      if (activeTab === 'withdrawals') fetchWithdrawals()
      if (activeTab === 'verifications') fetchVerifications()
    }
  }, [activeTab, profile])
  
  useEffect(() => { setCurrentPage(1) }, [activeTab, disputeSubTab, verificationSubTab])

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) { router.push('/login'); return }
      setUser(user)
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profileError || !profileData?.is_admin) { router.push('/'); return }
      setProfile(profileData)
      setLoading(false)
    } catch (error) { router.push('/') }
  }

  const fetchUsers = async () => { const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); if (data) setUsers(data) }
  const fetchListings = async () => { const { data } = await supabase.from('listings').select('*, profiles(username)').order('created_at', { ascending: false }); if (data) setListings(data) }
  const fetchOrders = async () => { const { data } = await supabase.from('orders').select('*, buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)').order('created_at', { ascending: false }); if (data) setOrders(data) }
  const fetchConversations = async () => { const { data } = await supabase.from('conversations').select('*, listing:listings(title, game, image_url), buyer:profiles!conversations_buyer_id_fkey(username), seller:profiles!conversations_seller_id_fkey(username), order:orders(status, amount)').order('last_message_at', { ascending: false }); if (data) setConversations(data) }
  
  const fetchDisputes = async () => {
    const { data: activeData } = await supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(username, id), seller:profiles!orders_seller_id_fkey(username, id)').eq('status', 'dispute_raised').order('dispute_opened_at', { ascending: false })
    setActiveDisputes(activeData || [])
    const { data: solvedData } = await supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(username, id), seller:profiles!orders_seller_id_fkey(username, id)').not('dispute_opened_at', 'is', null).neq('status', 'dispute_raised').order('completed_at', { ascending: false })
    setSolvedDisputes(solvedData || [])
  }
  
  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*, buyer:profiles!buyer_id(username)').order('created_at', { ascending: false })
    const reviewsWithSellers = await Promise.all((data || []).map(async (review) => {
      if (review.seller_id) { const { data: sellerData } = await supabase.from('profiles').select('username').eq('id', review.seller_id).single(); return { ...review, seller: sellerData } }
      return { ...review, seller: null }
    }))
    setReviews(reviewsWithSellers)
  }
  
  const fetchWithdrawals = async () => {
    const { data: pendingData } = await supabase.from('withdrawals').select('*, user:profiles!user_id(username, id)').eq('status', 'pending').order('created_at', { ascending: false })
    setPendingWithdrawals(pendingData || [])
    const { data: processedData } = await supabase.from('withdrawals').select('*, user:profiles!user_id(username, id), processor:profiles!processed_by(username)').in('status', ['completed', 'rejected']).order('processed_at', { ascending: false })
    setProcessedWithdrawals(processedData || [])
  }
  
  const fetchVerifications = async () => {
    const { data: pendingData } = await supabase.from('vendor_verifications').select('*, user:profiles!user_id(username, id, created_at)').eq('status', 'pending').order('created_at', { ascending: false })
    setPendingVerifications(pendingData || [])
    const { data: pastData } = await supabase.from('vendor_verifications').select('*, user:profiles!user_id(username, id), reviewer:profiles!reviewed_by(username)').neq('status', 'pending').order('reviewed_at', { ascending: false })
    setPastVerifications(pastData || [])
  }

  const handleViewVerificationDetails = (v: any) => { 
    setSelectedVerification(v)
    if (v.documents_viewed_at || v.documents_cleared) { 
      setShowVerificationDetailsModal(true) 
    } else { 
      setShowAgreementModal(true) 
    } 
  }
  
  const handleAcceptAgreement = async () => {
    if (!agreementAccepted) { alert('You must accept the agreement.'); return }
    try {
      const { error } = await supabase.from('vendor_verifications').update({ documents_viewed_by: user.id, documents_viewed_at: new Date().toISOString() }).eq('id', selectedVerification.id)
      if (error) { console.error('Agreement error:', error); throw error }
      setShowAgreementModal(false)
      setShowVerificationDetailsModal(true)
      setAgreementAccepted(false)
    } catch (error) { 
      console.error('Error:', error)
      alert('Failed to record agreement.') 
    }
  }
  
  const handleApproveVerification = async () => {
    if (!selectedVerification) return
    try {
      const { error: updateError } = await supabase.from('vendor_verifications').update({ 
        status: 'approved', 
        reviewed_by: user.id, 
        reviewed_at: new Date().toISOString(), 
        admin_notes: verificationAdminNotes.trim() || null 
      }).eq('id', selectedVerification.id)
      
      if (updateError) { console.error('Update error:', updateError); throw updateError }
      
      const { error: profileError } = await supabase.from('profiles').update({ 
        role: 'vendor', 
        vendor_since: new Date().toISOString(), 
        verified: true 
      }).eq('id', selectedVerification.user_id)
      
      if (profileError) { console.error('Profile error:', profileError); throw profileError }
      
      await supabase.from('vendor_verifications').update({ 
        id_front_url: null, 
        id_back_url: null, 
        documents_cleared: true 
      }).eq('id', selectedVerification.id)
      
      alert('✅ Verification approved!')
      setVerificationDecisionModal(null)
      setShowVerificationDetailsModal(false)
      setSelectedVerification(null)
      setVerificationAdminNotes('')
      fetchVerifications()
      fetchUsers()
    } catch (error) { 
      console.error('Approve error:', error)
      alert('Failed to approve.') 
    }
  }
  
  const handleRejectVerification = async () => {
    if (!selectedVerification) return
    
    if (rejectionType === 'resubmission_required') {
      if (resubmissionFields.length === 0) { alert('Please select at least one field.'); return }
      if (resubmissionInstructions.trim().length < 20) { alert('Please provide detailed instructions (min 20 chars).'); return }
    } else {
      if (verificationRejectionReason.trim().length < 10) { alert('Please provide a reason (min 10 chars).'); return }
    }

    try {
      let updateData: any = {
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        rejection_type: rejectionType,
        admin_notes: verificationAdminNotes.trim() || null,
        id_front_url: null,
        id_back_url: null,
        documents_cleared: true
      }

      if (rejectionType === 'resubmission_required') {
        updateData.can_resubmit = true
        updateData.resubmission_fields = resubmissionFields
        updateData.resubmission_instructions = resubmissionInstructions.trim()
        updateData.rejection_reason = `Resubmission required for: ${resubmissionFields.join(', ')}`
      } else {
        updateData.can_resubmit = false
        updateData.rejection_reason = verificationRejectionReason.trim()
        updateData.resubmission_fields = null
        updateData.resubmission_instructions = null
      }

      console.log('Updating verification with:', updateData)
      
      const { error } = await supabase
        .from('vendor_verifications')
        .update(updateData)
        .eq('id', selectedVerification.id)
      
      console.log('Update error:', error)
      
      if (error) throw error

      alert(rejectionType === 'permanent' ? '❌ Permanently rejected.' : '🔄 Resubmission requested.')
      setVerificationDecisionModal(null)
      setShowVerificationDetailsModal(false)
      setSelectedVerification(null)
      setVerificationRejectionReason('')
      setVerificationAdminNotes('')
      setRejectionType('resubmission_required')
      setResubmissionFields([])
      setResubmissionInstructions('')
      fetchVerifications()
    } catch (error) { 
      console.error('Reject error:', error)
      alert('Failed to reject. Check console for details.') 
    }
  }

  const handleEditReview = (r: any) => { setEditingReview(r); setEditedComment(r.comment || '') }
  const handleSaveReview = async () => { if (!editingReview) return; await supabase.from('reviews').update({ comment: editedComment.trim() || null, edited_by_admin: true, edited_at: new Date().toISOString() }).eq('id', editingReview.id); alert('Review updated'); setEditingReview(null); fetchReviews() }
  const handleDeleteReview = async (id: string) => { if (!confirm('Delete this review?')) return; await supabase.from('reviews').delete().eq('id', id); alert('Review deleted'); fetchReviews() }
  const handleApproveWithdrawal = (id: string) => { setApprovingWithdrawalId(id); setTransactionId(''); setApproveNotes(''); setShowApproveModal(true) }
  const confirmApproveWithdrawal = async () => { if (!transactionId.trim()) { alert('Transaction ID required'); return }; await supabase.from('withdrawals').update({ status: 'completed', processed_by: user.id, processed_at: new Date().toISOString(), transaction_id: transactionId.trim(), admin_notes: approveNotes.trim() || null }).eq('id', approvingWithdrawalId); alert('✅ Approved!'); setShowApproveModal(false); setApprovingWithdrawalId(null); fetchWithdrawals() }
  const handleRejectWithdrawal = (id: string) => { setRejectingWithdrawalId(id); setRejectionReason(''); setShowRejectModal(true) }
  const confirmRejectWithdrawal = async () => { if (rejectionReason.trim().length < 5) { alert('Provide reason (min 5 chars)'); return }; await supabase.from('withdrawals').update({ status: 'rejected', processed_by: user.id, processed_at: new Date().toISOString(), admin_notes: rejectionReason.trim() }).eq('id', rejectingWithdrawalId); alert('❌ Rejected.'); setShowRejectModal(false); setRejectingWithdrawalId(null); fetchWithdrawals() }
  const handleBanUser = async (id: string, banned: boolean) => { const reason = banned ? null : prompt('Ban reason:'); if (!banned && !reason) return; await supabase.from('profiles').update({ is_banned: !banned, banned_at: !banned ? new Date().toISOString() : null, ban_reason: reason }).eq('id', id); alert(`User ${banned ? 'unbanned' : 'banned'}`); fetchUsers() }
  const handleDeleteListing = async (id: string) => { if (!confirm('Delete listing?')) return; await supabase.from('listings').delete().eq('id', id); alert('Listing deleted'); fetchListings() }
  const handleResolveDispute = async (id: string, res: 'buyer' | 'seller') => { const isBuyer = res === 'buyer'; if (!confirm(isBuyer ? 'Refund buyer?' : 'Complete for seller?')) return; const notes = prompt('Resolution notes (optional):'); const newStatus = isBuyer ? 'refunded' : 'completed'; await supabase.from('orders').update({ status: newStatus, completed_at: new Date().toISOString(), resolved_by: user.id, resolution_notes: notes || null }).eq('id', id); alert(`✅ Resolved for ${res}`); fetchDisputes(); fetchOrders() }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }
  const getCurrentPageData = (d: any[]) => d.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const getTotalPages = (d: any[]) => Math.ceil(d.length / ITEMS_PER_PAGE)
  const renderPagination = (d: any[]) => { const t = getTotalPages(d); if (t <= 1) return null; return (<div className="flex items-center justify-center gap-2 mt-6"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">← Prev</button>{Array.from({ length: Math.min(5, t) }, (_, i) => i + 1).map(p => (<button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-lg font-semibold ${currentPage === p ? 'bg-purple-500 text-white' : 'bg-white/10 text-white'}`}>{p}</button>))}<button onClick={() => setCurrentPage(p => Math.min(t, p + 1))} disabled={currentPage === t} className="px-4 py-2 bg-white/10 text-white rounded-lg disabled:opacity-50">Next →</button></div>) }

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>

  const stats = { totalUsers: users.length, totalListings: listings.length, totalOrders: orders.length, activeDisputes: activeDisputes.length, solvedDisputes: solvedDisputes.length, pendingVerifications: pendingVerifications.length }
  const currentUsers = getCurrentPageData(users), currentListings = getCurrentPageData(listings), currentOrders = getCurrentPageData(orders), currentConversations = getCurrentPageData(conversations), currentActiveDisputes = getCurrentPageData(activeDisputes), currentSolvedDisputes = getCurrentPageData(solvedDisputes), currentPendingVerifications = getCurrentPageData(pendingVerifications), currentPastVerifications = getCurrentPageData(pastVerifications)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10"><div className="container mx-auto px-4"><div className="flex items-center justify-between h-16"><Link href="/" className="flex items-center space-x-2"><div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center"><span className="text-2xl">👑</span></div><span className="text-xl font-bold text-white">Admin Panel</span></Link><div className="flex items-center space-x-4"><Link href="/" className="text-gray-300 hover:text-white">Main Site</Link><button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white">{profile?.username} (Logout)</button></div></div></div></nav>
      <div className="container mx-auto px-4 py-12"><div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8"><h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1><p className="text-gray-300">Manage users, listings, orders, disputes, and verifications</p></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">👥</div><div className="text-gray-400 text-xs">Users</div><div className="text-2xl font-bold text-white">{stats.totalUsers}</div></div>
          <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">📦</div><div className="text-gray-400 text-xs">Listings</div><div className="text-2xl font-bold text-white">{stats.totalListings}</div></div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">💰</div><div className="text-gray-400 text-xs">Orders</div><div className="text-2xl font-bold text-white">{stats.totalOrders}</div></div>
          <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">⚠️</div><div className="text-gray-400 text-xs">Active Disputes</div><div className="text-2xl font-bold text-white">{stats.activeDisputes}</div></div>
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">✅</div><div className="text-gray-400 text-xs">Solved Disputes</div><div className="text-2xl font-bold text-white">{stats.solvedDisputes}</div></div>
          <div className="bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-white/10 rounded-xl p-4"><div className="text-2xl mb-1">🔍</div><div className="text-gray-400 text-xs">Pending Verifications</div><div className="text-2xl font-bold text-white">{stats.pendingVerifications}</div></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">{['users', 'listings', 'orders', 'messages', 'disputes', 'verifications', 'reviews', 'withdrawals'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-lg font-semibold transition relative ${activeTab === tab ? tab === 'verifications' ? 'bg-cyan-500 text-white' : tab === 'reviews' ? 'bg-yellow-500 text-white' : tab === 'withdrawals' ? 'bg-green-500 text-white' : 'bg-purple-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'verifications' && '🔍'}{tab === 'reviews' && '⭐'}{tab === 'withdrawals' && '💸'}{tab === 'verifications' && stats.pendingVerifications > 0 && (<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{stats.pendingVerifications}</span>)}</button>))}</div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
          {activeTab === 'users' && (<div><h2 className="text-2xl font-bold text-white mb-4">All Users ({users.length})</h2><div className="space-y-4">{currentUsers.map((u) => (<div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-white font-semibold">{u.username}</span><span className={`px-2 py-1 rounded text-xs ${u.is_admin ? 'bg-red-500/20 text-red-400' : u.role === 'vendor' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.is_admin ? 'ADMIN' : u.role}</span>{u.is_banned && <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">BANNED</span>}</div><p className="text-sm text-gray-400">Rating: {u.rating} | Sales: {u.total_sales} | Joined: {new Date(u.created_at).toLocaleDateString()}</p></div>{!u.is_admin && <button onClick={() => handleBanUser(u.id, u.is_banned)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${u.is_banned ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{u.is_banned ? 'Unban' : 'Ban'}</button>}</div>))}</div>{renderPagination(users)}</div>)}
          {activeTab === 'listings' && (<div><h2 className="text-2xl font-bold text-white mb-4">All Listings ({listings.length})</h2><div className="space-y-4">{currentListings.map((l) => (<div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-white font-semibold">{l.title}</span><span className={`px-2 py-1 rounded text-xs ${l.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{l.status}</span></div><p className="text-sm text-gray-400">{l.game} | ${l.price} | Stock: {l.stock} | Seller: {l.profiles?.username}</p></div><div className="flex gap-2"><Link href={`/listing/${l.id}`} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">View</Link><button onClick={() => handleDeleteListing(l.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">Delete</button></div></div>))}</div>{renderPagination(listings)}</div>)}
          {activeTab === 'orders' && (<div><h2 className="text-2xl font-bold text-white mb-4">All Orders ({orders.length})</h2><div className="space-y-4">{currentOrders.map((o) => (<div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between"><div><div className="flex items-center gap-2"><span className="text-white font-semibold">{o.listing_title || 'Unknown'}</span><span className={`px-2 py-1 rounded text-xs ${o.status === 'completed' ? 'bg-green-500/20 text-green-400' : o.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{o.status}</span></div><p className="text-sm text-gray-400">${o.amount} | Buyer: {o.buyer?.username} | Seller: {o.seller?.username}</p></div><Link href={`/order/${o.id}`} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">View</Link></div>))}</div>{renderPagination(orders)}</div>)}
          {activeTab === 'messages' && (<div><h2 className="text-2xl font-bold text-white mb-4">Conversations ({conversations.length})</h2><div className="space-y-4">{currentConversations.map((c) => (<div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"><div className="w-16 h-16 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">🎮</div><div className="flex-1"><h3 className="text-white font-semibold">{c.listing?.title || 'Unknown'}</h3><p className="text-sm text-gray-400">{c.buyer?.username} ↔ {c.seller?.username}</p><p className="text-xs text-gray-500 truncate">{c.last_message}</p></div><Link href={`/admin/messages/${c.id}`} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm">View Chat</Link></div>))}</div>{renderPagination(conversations)}</div>)}
          {activeTab === 'disputes' && (<div><div className="flex gap-3 mb-6"><button onClick={() => setDisputeSubTab('active')} className={`px-4 py-2 rounded-lg font-semibold ${disputeSubTab === 'active' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-300'}`}>Active ({activeDisputes.length})</button><button onClick={() => setDisputeSubTab('solved')} className={`px-4 py-2 rounded-lg font-semibold ${disputeSubTab === 'solved' ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-300'}`}>Solved ({solvedDisputes.length})</button></div>{disputeSubTab === 'active' && (<div className="space-y-4">{currentActiveDisputes.map((o) => (<div key={o.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"><div className="flex items-start justify-between"><div><h3 className="text-white font-bold">{o.listing_title || 'Unknown'}</h3><p className="text-gray-300 text-sm">Buyer: {o.buyer?.username} | Seller: {o.seller?.username}</p><p className="text-gray-400 text-sm">${o.amount}</p></div><div className="flex flex-col gap-2"><button onClick={() => handleResolveDispute(o.id, 'buyer')} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">💰 Refund Buyer</button><button onClick={() => handleResolveDispute(o.id, 'seller')} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm">✓ Complete</button></div></div></div>))}{renderPagination(activeDisputes)}</div>)}{disputeSubTab === 'solved' && (<div className="space-y-4">{currentSolvedDisputes.map((o) => (<div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between"><div><h3 className="text-white font-bold">{o.listing_title}</h3><p className="text-gray-400 text-sm">{o.buyer?.username} ↔ {o.seller?.username} | ${o.amount}</p><span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${o.status === 'refunded' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>{o.status}</span></div></div>))}{renderPagination(solvedDisputes)}</div>)}</div>)}
          {activeTab === 'verifications' && (<div><div className="flex gap-3 mb-6"><button onClick={() => setVerificationSubTab('pending')} className={`px-4 py-2 rounded-lg font-semibold ${verificationSubTab === 'pending' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-gray-300'}`}>Pending ({pendingVerifications.length})</button><button onClick={() => setVerificationSubTab('past')} className={`px-4 py-2 rounded-lg font-semibold ${verificationSubTab === 'past' ? 'bg-gray-500 text-white' : 'bg-white/5 text-gray-300'}`}>Past ({pastVerifications.length})</button></div>{verificationSubTab === 'pending' && (<div className="space-y-4">{pendingVerifications.length === 0 ? <div className="text-center py-12"><div className="text-5xl mb-4">✅</div><p className="text-gray-400">No pending verifications</p></div> : currentPendingVerifications.map((v) => (<div key={v.id} className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-4"><div className="w-16 h-16 rounded-lg bg-cyan-500/20 flex items-center justify-center text-3xl">🔍</div><div className="flex-1"><div className="flex items-center gap-2 mb-2"><h3 className="text-white font-bold">{v.full_name}</h3><span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">PENDING</span>{v.resubmission_count > 0 && <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">🔄 RESUBMISSION #{v.resubmission_count}</span>}</div><p className="text-gray-300 text-sm">Username: {v.user?.username}</p><p className="text-gray-400 text-sm">{v.city}, {v.country} | ID: {v.id_type?.replace('_', ' ')}</p>{v.resubmission_count > 0 && <p className="text-orange-400 text-xs mt-1">⚠️ This is a resubmission - check previous rejection</p>}<p className="text-gray-500 text-xs mt-2">Submitted: {new Date(v.created_at).toLocaleString()}</p></div><button onClick={() => handleViewVerificationDetails(v)} className="px-6 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg font-semibold">🔎 Review</button></div>))}{renderPagination(pendingVerifications)}</div>)}{verificationSubTab === 'past' && (<div className="space-y-4">{pastVerifications.length === 0 ? <div className="text-center py-12"><div className="text-5xl mb-4">📋</div><p className="text-gray-400">No past verifications</p></div> : currentPastVerifications.map((v) => (<div key={v.id} className={`border rounded-xl p-4 ${v.status === 'approved' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}><div className="flex items-center gap-2 mb-2"><span className="text-3xl">{v.status === 'approved' ? '✅' : '❌'}</span><h3 className="text-white font-bold">{v.full_name}</h3><span className={`px-2 py-1 rounded text-xs ${v.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{v.status?.toUpperCase()}</span>{v.rejection_type === 'resubmission_required' && <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">CAN RESUBMIT</span>}</div><p className="text-gray-300 text-sm">Username: {v.user?.username} | Reviewed by: {v.reviewer?.username}</p><p className="text-gray-400 text-sm">{v.city}, {v.country}</p>{v.rejection_reason && <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2"><p className="text-red-400 text-xs">Reason: {v.rejection_reason}</p></div>}<p className="text-gray-500 text-xs mt-2">Reviewed: {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString() : 'N/A'}</p></div>))}{renderPagination(pastVerifications)}</div>)}</div>)}
          {activeTab === 'reviews' && (<div><h2 className="text-2xl font-bold text-white mb-4">Reviews ({reviews.length})</h2><div className="space-y-4">{getCurrentPageData(reviews).map((r) => (<div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><div className="flex">{[1,2,3,4,5].map(s => <span key={s} className={s <= r.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>)}</div><span className="text-white">{r.rating}/5</span>{r.edited_by_admin && <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">Edited</span>}</div><p className="text-gray-300 text-sm">Buyer: {r.buyer?.username} → Seller: {r.seller?.username}</p>{editingReview?.id === r.id ? (<div className="mt-2"><textarea value={editedComment} onChange={(e) => setEditedComment(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded p-2 text-white text-sm" rows={3} /><div className="flex gap-2 mt-2"><button onClick={handleSaveReview} className="px-4 py-2 bg-green-500/20 text-green-400 rounded text-sm">Save</button><button onClick={() => setEditingReview(null)} className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded text-sm">Cancel</button></div></div>) : (<div className="mt-2"><p className="text-white text-sm bg-white/5 p-2 rounded">{r.comment || 'No comment'}</p><div className="flex gap-2 mt-2"><button onClick={() => handleEditReview(r)} className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded text-sm">✏️ Edit</button><button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded text-sm">🗑️ Delete</button></div></div>)}</div>))}</div>{renderPagination(reviews)}</div>)}
          {activeTab === 'withdrawals' && (<div><div className="flex gap-3 mb-6"><button onClick={() => setDisputeSubTab('active')} className={`px-4 py-2 rounded-lg font-semibold ${disputeSubTab === 'active' ? 'bg-yellow-500/30 text-yellow-400' : 'bg-white/5 text-gray-400'}`}>Pending ({pendingWithdrawals.length})</button><button onClick={() => setDisputeSubTab('solved')} className={`px-4 py-2 rounded-lg font-semibold ${disputeSubTab === 'solved' ? 'bg-green-500/30 text-green-400' : 'bg-white/5 text-gray-400'}`}>Processed ({processedWithdrawals.length})</button></div>{disputeSubTab === 'active' && (<div className="space-y-4">{pendingWithdrawals.map((w) => (<div key={w.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex justify-between"><div><h3 className="text-white font-bold">{w.method === 'bitcoin' ? '₿ Bitcoin' : '💳 Skrill'}</h3><p className="text-gray-300">User: {w.user?.username}</p><p className="text-white font-bold text-xl">${parseFloat(w.amount).toFixed(2)} → ${parseFloat(w.net_amount).toFixed(2)}</p><p className="text-gray-400 text-xs break-all">{w.address}</p></div><div className="flex flex-col gap-2"><button onClick={() => handleApproveWithdrawal(w.id)} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm">✅ Approve</button><button onClick={() => handleRejectWithdrawal(w.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm">❌ Reject</button></div></div>))}</div>)}{disputeSubTab === 'solved' && (<div className="space-y-4">{processedWithdrawals.map((w) => (<div key={w.id} className={`border rounded-xl p-4 ${w.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}><h3 className="text-white font-bold">{w.method === 'bitcoin' ? '₿' : '💳'} {w.user?.username}</h3><p className="text-white">${parseFloat(w.net_amount).toFixed(2)}</p><span className={`inline-block px-2 py-1 rounded text-xs ${w.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{w.status?.toUpperCase()}</span></div>))}</div>)}</div>)}
        </div>
      </div></div>

      {showAgreementModal && selectedVerification && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-lg w-full"><div className="text-center mb-6"><div className="text-5xl mb-4">⚠️</div><h2 className="text-2xl font-bold text-white mb-2">Sensitive Document Access</h2><p className="text-gray-300">Viewing documents for <strong className="text-white">{selectedVerification.user?.username}</strong></p></div><div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-sm text-gray-300"><p>• Access will be logged</p><p>• One-time view only</p><p>• Documents deleted after decision</p><p>• Do not screenshot or share</p></div><div className="flex items-start gap-3 mb-6"><input type="checkbox" checked={agreementAccepted} onChange={(e) => setAgreementAccepted(e.target.checked)} className="w-5 h-5 mt-0.5" /><label className="text-white text-sm">I agree to handle this information responsibly.</label></div><div className="flex gap-3"><button onClick={handleAcceptAgreement} disabled={!agreementAccepted} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50">View Documents</button><button onClick={() => { setShowAgreementModal(false); setSelectedVerification(null); setAgreementAccepted(false) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg">Cancel</button></div></div></div>)}

      {showVerificationDetailsModal && selectedVerification && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"><div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 rounded-2xl p-8 max-w-4xl w-full my-8"><div className="flex justify-between mb-6"><h2 className="text-2xl font-bold text-white">Verification Review</h2><button onClick={() => { setShowVerificationDetailsModal(false); setSelectedVerification(null) }} className="text-gray-400 hover:text-white text-2xl">✕</button></div><div className="grid md:grid-cols-2 gap-6"><div className="bg-white/5 border border-white/10 rounded-xl p-4"><h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3><p className="text-gray-400 text-xs">Name</p><p className="text-white mb-2">{selectedVerification.full_name}</p><p className="text-gray-400 text-xs">DOB</p><p className="text-white mb-2">{new Date(selectedVerification.date_of_birth).toLocaleDateString()}</p><p className="text-gray-400 text-xs">Phone</p><p className="text-white mb-2">{selectedVerification.phone_number}</p><p className="text-gray-400 text-xs">Username</p><p className="text-purple-400 font-semibold">{selectedVerification.user?.username}</p></div><div className="bg-white/5 border border-white/10 rounded-xl p-4"><h3 className="text-lg font-semibold text-white mb-4">Address</h3><p className="text-white mb-2">{selectedVerification.street_address}</p><p className="text-white mb-2">{selectedVerification.city}, {selectedVerification.state_province}</p><p className="text-white">{selectedVerification.postal_code}, {selectedVerification.country}</p></div>{!selectedVerification.documents_cleared && selectedVerification.id_front_url && (<div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2"><h3 className="text-lg font-semibold text-white mb-4">ID Documents <span className="text-xs text-red-400">(One-time view)</span></h3><p className="text-gray-400 text-xs mb-2">Type: {selectedVerification.id_type?.replace('_', ' ')}</p><div className="grid md:grid-cols-2 gap-4"><div><p className="text-xs text-gray-400 mb-2">Front</p><img src={selectedVerification.id_front_url} alt="ID Front" className="w-full rounded-lg" /></div>{selectedVerification.id_back_url && <div><p className="text-xs text-gray-400 mb-2">Back</p><img src={selectedVerification.id_back_url} alt="ID Back" className="w-full rounded-lg" /></div>}</div></div>)}{selectedVerification.documents_cleared && <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 md:col-span-2 text-center"><span className="text-3xl">🔒</span><p className="text-gray-400 mt-2">Documents permanently deleted</p></div>}{selectedVerification.has_previous_experience && (<div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2"><h3 className="text-lg font-semibold text-white mb-4">Vendor Experience</h3>{selectedVerification.platform_names && <p className="text-white mb-2">Platforms: {selectedVerification.platform_names}</p>}{selectedVerification.platform_usernames && <p className="text-white mb-2">Usernames: {selectedVerification.platform_usernames}</p>}{selectedVerification.experience_description && <p className="text-white">{selectedVerification.experience_description}</p>}</div>)}</div>{selectedVerification.status === 'pending' && (<div className="flex gap-4 mt-8"><button onClick={() => setVerificationDecisionModal('approve')} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg">✅ Approve</button><button onClick={() => setVerificationDecisionModal('reject')} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-lg font-semibold text-lg">❌ Reject</button></div>)}</div></div>)}

      {verificationDecisionModal && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto"><div className={`border-2 rounded-2xl p-8 max-w-2xl w-full my-8 ${verificationDecisionModal === 'approve' ? 'bg-gradient-to-br from-slate-900 to-green-900 border-green-500/50' : 'bg-gradient-to-br from-slate-900 to-red-900 border-red-500/50'}`}><h2 className="text-2xl font-bold text-white mb-2">{verificationDecisionModal === 'approve' ? '✅ Approve Vendor' : '❌ Reject Application'}</h2><p className="text-gray-300 mb-6">{verificationDecisionModal === 'approve' ? 'User will become a vendor and can start selling.' : 'Choose rejection type below.'}</p>{verificationDecisionModal === 'reject' && (<><div className="mb-6"><label className="block text-white font-semibold mb-3">Rejection Type</label><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={() => setRejectionType('resubmission_required')} className={`p-4 rounded-lg border-2 text-left transition ${rejectionType === 'resubmission_required' ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}><div className="text-2xl mb-2">🔄</div><div className="text-white font-semibold">Request Resubmission</div><div className="text-gray-400 text-sm mt-1">User can fix issues and reapply.</div></button><button onClick={() => setRejectionType('permanent')} className={`p-4 rounded-lg border-2 text-left transition ${rejectionType === 'permanent' ? 'border-red-500 bg-red-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}><div className="text-2xl mb-2">🚫</div><div className="text-white font-semibold">Permanent Rejection</div><div className="text-gray-400 text-sm mt-1">User cannot reapply.</div></button></div></div>{rejectionType === 'resubmission_required' && (<><div className="mb-4"><label className="block text-white font-semibold mb-3">Fields That Need Resubmission <span className="text-red-400">*</span></label><div className="grid grid-cols-2 gap-2">{[{ id: 'id_front', label: 'ID Front Photo' },{ id: 'id_back', label: 'ID Back Photo' },{ id: 'full_name', label: 'Full Name' },{ id: 'date_of_birth', label: 'Date of Birth' },{ id: 'phone_number', label: 'Phone Number' },{ id: 'address', label: 'Address Information' },{ id: 'id_type', label: 'ID Type Selection' },{ id: 'experience', label: 'Vendor Experience Info' }].map((field) => (<label key={field.id} className="flex items-center gap-2 text-white text-sm bg-white/5 p-2 rounded cursor-pointer hover:bg-white/10"><input type="checkbox" checked={resubmissionFields.includes(field.id)} onChange={(e) => { if (e.target.checked) { setResubmissionFields([...resubmissionFields, field.id]) } else { setResubmissionFields(resubmissionFields.filter(f => f !== field.id)) } }} className="w-4 h-4 rounded" />{field.label}</label>))}</div></div><div className="mb-4"><label className="block text-white font-semibold mb-2">Resubmission Instructions <span className="text-red-400">*</span></label><textarea value={resubmissionInstructions} onChange={(e) => setResubmissionInstructions(e.target.value)} placeholder="Explain clearly what the user needs to fix..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none" /><p className="text-xs text-gray-400 mt-1">{resubmissionInstructions.length}/1000 (minimum 20)</p></div></>)}{rejectionType === 'permanent' && (<div className="mb-4"><label className="block text-white font-semibold mb-2">Permanent Rejection Reason <span className="text-red-400">*</span></label><textarea value={verificationRejectionReason} onChange={(e) => setVerificationRejectionReason(e.target.value)} placeholder="Explain why this application is permanently rejected..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none" /><p className="text-xs text-gray-400 mt-1">{verificationRejectionReason.length}/500 (minimum 10)</p></div>)}</>)}<div className="mb-6"><label className="block text-white font-semibold mb-2">Admin Notes (Internal Only)</label><textarea value={verificationAdminNotes} onChange={(e) => setVerificationAdminNotes(e.target.value)} placeholder="Notes for other admins..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none" /></div><div className="flex gap-3"><button onClick={verificationDecisionModal === 'approve' ? handleApproveVerification : handleRejectVerification} disabled={verificationDecisionModal === 'reject' && ((rejectionType === 'resubmission_required' && (resubmissionFields.length === 0 || resubmissionInstructions.trim().length < 20)) || (rejectionType === 'permanent' && verificationRejectionReason.trim().length < 10))} className={`flex-1 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${verificationDecisionModal === 'approve' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : rejectionType === 'permanent' ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}>{verificationDecisionModal === 'approve' ? 'Confirm Approval' : rejectionType === 'permanent' ? 'Permanently Reject' : 'Request Resubmission'}</button><button onClick={() => { setVerificationDecisionModal(null); setVerificationRejectionReason(''); setVerificationAdminNotes(''); setRejectionType('resubmission_required'); setResubmissionFields([]); setResubmissionInstructions('') }} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10">Cancel</button></div></div></div>)}

      {showApproveModal && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-gradient-to-br from-slate-900 to-green-900 border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full"><h2 className="text-2xl font-bold text-white mb-6">✅ Approve Withdrawal</h2><div className="mb-4"><label className="block text-white text-sm mb-2">Transaction ID *</label><input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" placeholder="BTC hash or Skrill ref..." /></div><div className="mb-6"><label className="block text-white text-sm mb-2">Notes (Optional)</label><textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" rows={3} /></div><div className="flex gap-3"><button onClick={confirmApproveWithdrawal} disabled={!transactionId.trim()} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50">Confirm</button><button onClick={() => { setShowApproveModal(false); setApprovingWithdrawalId(null) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg">Cancel</button></div></div></div>)}

      {showRejectModal && (<div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full"><h2 className="text-2xl font-bold text-white mb-6">❌ Reject Withdrawal</h2><div className="mb-6"><label className="block text-white text-sm mb-2">Rejection Reason *</label><textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white" rows={4} placeholder="Min 5 characters..." /></div><div className="flex gap-3"><button onClick={confirmRejectWithdrawal} disabled={rejectionReason.trim().length < 5} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50">Confirm</button><button onClick={() => { setShowRejectModal(false); setRejectingWithdrawalId(null) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg">Cancel</button></div></div></div>)}
    </div>
  )
}