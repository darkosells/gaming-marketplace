'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AdminAnalytics from '@/components/AdminAnalytics'
import SearchFilterBar from '@/components/SearchFilterBar'
import AdminNotifications from '@/components/AdminNotifications'
import { logAdminAction } from '@/lib/auditLog'
import AuditLogViewer from '@/components/AuditLogViewer'

const ITEMS_PER_PAGE = 10

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')
  const [disputeSubTab, setDisputeSubTab] = useState('active')
  const [verificationSubTab, setVerificationSubTab] = useState('pending')
  const [currentPage, setCurrentPage] = useState(1)
  
  // Data states
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
  
  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gameFilter, setGameFilter] = useState('all')
  
  // Bulk action states
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // Notification states
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Analytics states
const [analyticsData, setAnalyticsData] = useState<{
  revenueChart: any[]
  ordersChart: any[]
  disputeRate: number
  avgOrderValue: number
  topGames: any[]
  topSellers: any[]
}>({
  revenueChart: [],
  ordersChart: [],
  disputeRate: 0,
  avgOrderValue: 0,
  topGames: [],
  topSellers: []
})
  
  // Modal states
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
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchListings(),
        fetchOrders(),
        fetchConversations(),
        fetchDisputes(),
        fetchReviews(),
        fetchWithdrawals(),
        fetchVerifications(),
        fetchNotifications()
      ])
    }
    loadData()

    
    
      
      // Real-time subscriptions
      const ordersChannel = supabase
        .channel('admin-orders-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchOrders()
          fetchDisputes()
          calculateAnalytics()
        })
        .subscribe()
      
      const disputesChannel = supabase
        .channel('admin-disputes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, () => {
          fetchDisputes()
          fetchOrders()
        })
        .subscribe()
      
      const usersChannel = supabase
        .channel('admin-users-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchUsers()
          fetchVerifications()
        })
        .subscribe()
      
      const listingsChannel = supabase
        .channel('admin-listings-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
          fetchListings()
        })
        .subscribe()
      
      const withdrawalsChannel = supabase
        .channel('admin-withdrawals-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
          fetchWithdrawals()
        })
        .subscribe()
      
      const verificationsChannel = supabase
        .channel('admin-verifications-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vendor_verifications' }, () => {
          fetchVerifications()
        })
        .subscribe()
      
      const reviewsChannel = supabase
        .channel('admin-reviews-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => {
          fetchReviews()
        })
        .subscribe()
      
      const conversationsChannel = supabase
        .channel('admin-conversations-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
          fetchConversations()
        })
        .subscribe()
      
      const notificationsChannel = supabase
        .channel('admin-notifications-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
          fetchNotifications()
        })
        .subscribe()
      
      return () => {
        supabase.removeChannel(ordersChannel)
        supabase.removeChannel(disputesChannel)
        supabase.removeChannel(usersChannel)
        supabase.removeChannel(listingsChannel)
        supabase.removeChannel(withdrawalsChannel)
        supabase.removeChannel(verificationsChannel)
        supabase.removeChannel(reviewsChannel)
        supabase.removeChannel(conversationsChannel)
        supabase.removeChannel(notificationsChannel)
      }
    }
  }, [profile])

useEffect(() => {
  if (profile?.is_admin && orders.length > 0) {
    calculateAnalytics()
  }
}, [orders, users, activeDisputes])
  
useEffect(() => { 
  setCurrentPage(1)
  setSelectedItems([])
}, [activeTab, disputeSubTab, verificationSubTab])

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

  // Fetch functions
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
    const reviewsWithSellers = await Promise.all((data || []).map(async (review: any) => {
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

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    }
  }

  const calculateAnalytics = async () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().split('T')[0]
    })
    
    const revenueChart = last7Days.map(date => {
      const dayOrders = orders.filter(o => o.created_at?.startsWith(date))
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0),
        orders: dayOrders.length
      }
    })

    const completedOrders = orders.filter(o => o.status === 'completed')
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0
    const disputeRate = orders.length > 0 ? (activeDisputes.length / orders.length) * 100 : 0

    const gameRevenue: { [key: string]: { revenue: number; count: number } } = {}
    completedOrders.forEach(o => {
      const game = o.listing_game || 'Unknown'
      if (!gameRevenue[game]) gameRevenue[game] = { revenue: 0, count: 0 }
      gameRevenue[game].revenue += parseFloat(o.amount || 0)
      gameRevenue[game].count += 1
    })
    const topGames = Object.entries(gameRevenue)
      .map(([game, data]) => ({ game, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    const sellerStats: { [key: string]: any } = {}
users.filter(u => u.role === 'vendor').forEach(vendor => {
  const vendorSales = completedOrders.filter(o => o.seller_id === vendor.id)
  sellerStats[vendor.id] = {
  username: vendor.username,
  total_sales: vendorSales.length,
  rating: vendor.average_rating || 0
}
})
    const topSellers = Object.values(sellerStats)
      .sort((a: any, b: any) => b.total_sales - a.total_sales)
      .slice(0, 5)

    setAnalyticsData({
      revenueChart,
      ordersChart: revenueChart,
      disputeRate: parseFloat(disputeRate.toFixed(2)),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      topGames,
      topSellers
    })
  }
  // Notification handlers
  const handleMarkNotificationRead = async (id: string) => {
    await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id)
    fetchNotifications()
  }

  const handleMarkAllNotificationsRead = async () => {
    await supabase
      .from('admin_notifications')
      .update({ read: true })
      .eq('admin_id', user?.id)
      .eq('read', false)
    fetchNotifications()
  }

  // Bulk action handlers
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = (items: any[]) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(items.map(i => i.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) return
    
    if (!confirm(`Are you sure you want to ${action} ${selectedItems.length} items?`)) return

    try {
      if (activeTab === 'users' && action === 'ban') {
        const reason = prompt('Ban reason (optional):') || 'Bulk ban by admin'
        await Promise.all(selectedItems.map(id => 
          supabase.from('profiles').update({ 
            is_banned: true, 
            banned_at: new Date().toISOString(),
            ban_reason: reason 
          }).eq('id', id)
        ))
        alert(`✅ Banned ${selectedItems.length} users`)
        fetchUsers()
      } else if (activeTab === 'listings' && action === 'delete') {
        await Promise.all(selectedItems.map(id => 
          supabase.from('listings').delete().eq('id', id)
        ))
        alert(`✅ Deleted ${selectedItems.length} listings`)
        fetchListings()
      } else if (activeTab === 'orders' && action === 'refund') {
        await Promise.all(selectedItems.map(id => 
          supabase.from('orders').update({ 
            status: 'refunded',
            completed_at: new Date().toISOString(),
            resolution_notes: 'Bulk refunded by admin'
          }).eq('id', id)
        ))
        alert(`✅ Refunded ${selectedItems.length} orders`)
        fetchOrders()
      }
      setSelectedItems([])
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to complete bulk action')
    }
  }

  const handleClearSelection = () => setSelectedItems([])

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

      const { error } = await supabase.from('vendor_verifications').update(updateData).eq('id', selectedVerification.id)
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
  
  const handleResolveDispute = async (id: string, res: 'buyer' | 'seller') => { 
    const isBuyer = res === 'buyer'
    if (!confirm(isBuyer ? 'Refund buyer?' : 'Complete for seller?')) return
    const notes = prompt('Resolution notes (optional):')
    const newStatus = isBuyer ? 'refunded' : 'completed'
    
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, buyer:profiles!orders_buyer_id_fkey(username), seller:profiles!orders_seller_id_fkey(username)')
        .eq('id', id)
        .single()
      
      if (orderError) throw orderError
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          completed_at: new Date().toISOString(), 
          resolved_by: user.id, 
          resolution_notes: notes || null 
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, listing_id')
        .eq('order_id', id)
        .single()
      
      if (convData) {
        const resolutionMessage = isBuyer
          ? `✅ DISPUTE RESOLVED - REFUNDED ✅\n\nThis dispute has been resolved in favor of the BUYER.\n\nThe order has been refunded and the buyer will receive their funds back.\n\nResolved by: ${profile.username}${notes ? `\n\nAdmin Notes: ${notes}` : ''}\n\nThis conversation is now closed.`
          : `✅ DISPUTE RESOLVED - COMPLETED ✅\n\nThis dispute has been resolved in favor of the SELLER.\n\nThe order has been marked as completed and the seller will receive their payment.\n\nResolved by: ${profile.username}${notes ? `\n\nAdmin Notes: ${notes}` : ''}\n\nThis conversation is now closed.`

        await supabase.from('messages').insert({
          conversation_id: convData.id,
          sender_id: user.id,
          receiver_id: orderData.buyer_id,
          listing_id: convData.listing_id,
          order_id: id,
          content: resolutionMessage,
          message_type: 'system'
        })

        await supabase.from('conversations').update({
          last_message: isBuyer ? '✅ Dispute resolved - Buyer refunded' : '✅ Dispute resolved - Order completed',
          last_message_at: new Date().toISOString()
        }).eq('id', convData.id)
      }
      
      alert(`✅ Resolved for ${res}`)
      fetchDisputes()
      fetchOrders()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('Failed to resolve dispute')
    }
  }
  
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  // Filtering and pagination helpers
  const applyFilters = (items: any[]) => {
    let filtered = items

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item => {
        if (activeTab === 'users') {
          return item.username?.toLowerCase().includes(query) || 
                 item.email?.toLowerCase().includes(query)
        } else if (activeTab === 'listings') {
          return item.title?.toLowerCase().includes(query) || 
                 item.game?.toLowerCase().includes(query)
        } else if (activeTab === 'orders' || activeTab === 'messages') {
          return item.listing_title?.toLowerCase().includes(query) ||
                 item.buyer?.username?.toLowerCase().includes(query) ||
                 item.seller?.username?.toLowerCase().includes(query)
        } else if (activeTab === 'reviews') {
          return item.buyer?.username?.toLowerCase().includes(query) ||
                 item.seller?.username?.toLowerCase().includes(query) ||
                 item.comment?.toLowerCase().includes(query)
        }
        return true
      })
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at || item.last_message_at || 0)
        if (dateFilter === 'today') return itemDate >= today
        if (dateFilter === 'week') return itemDate >= weekAgo
        if (dateFilter === 'month') return itemDate >= monthAgo
        return true
      })
    }

    if (statusFilter !== 'all' && activeTab === 'orders') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    if (gameFilter !== 'all' && (activeTab === 'listings' || activeTab === 'orders')) {
      filtered = filtered.filter(item => 
        item.game === gameFilter || item.listing_game === gameFilter
      )
    }

    return filtered
  }

  const getAvailableGames = () => {
    if (activeTab === 'listings') {
      return [...new Set(listings.map(l => l.game).filter(Boolean))]
    } else if (activeTab === 'orders') {
      return [...new Set(orders.map(o => o.listing_game).filter(Boolean))]
    }
    return []
  }

  const getCurrentPageData = (d: any[]) => d.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const getTotalPages = (d: any[]) => Math.ceil(d.length / ITEMS_PER_PAGE)
  
  const renderPagination = (d: any[]) => { 
    const t = getTotalPages(d)
    if (t <= 1) return null
    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition">← Prev</button>
        {Array.from({ length: Math.min(5, t) }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => setCurrentPage(p)} className={`w-10 h-10 rounded-lg font-semibold transition ${currentPage === p ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage(p => Math.min(t, p + 1))} disabled={currentPage === t} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition">Next →</button>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    </div>
  )

  const stats = { 
    totalUsers: users.length, 
    totalListings: listings.length, 
    totalOrders: orders.length, 
    activeDisputes: activeDisputes.length, 
    solvedDisputes: solvedDisputes.length, 
    pendingVerifications: pendingVerifications.length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + parseFloat(o.amount || 0), 0)
  }

  const filteredUsers = applyFilters(users)
  const filteredListings = applyFilters(listings)
  const filteredOrders = applyFilters(orders)
  const filteredConversations = applyFilters(conversations)
  const filteredReviews = applyFilters(reviews)

  const currentUsers = getCurrentPageData(filteredUsers)
  const currentListings = getCurrentPageData(filteredListings)
  const currentOrders = getCurrentPageData(filteredOrders)
  const currentConversations = getCurrentPageData(filteredConversations)
  const currentActiveDisputes = getCurrentPageData(activeDisputes)
  const currentSolvedDisputes = getCurrentPageData(solvedDisputes)
  const currentPendingVerifications = getCurrentPageData(pendingVerifications)
  const currentPastVerifications = getCurrentPageData(pastVerifications)
  const currentReviews = getCurrentPageData(filteredReviews)
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Simplified Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/8 rounded-full blur-[160px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>
      </div>
      
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
                <span className="text-2xl">👑</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>
            <div className="flex items-center space-x-4">
              <AdminNotifications
                notifications={notifications}
                unreadCount={unreadCount}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
              />
              <Link href="/" className="text-gray-300 hover:text-white transition">Main Site</Link>
              <button onClick={handleLogout} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-white transition border border-white/10">
                {profile?.username} (Logout)
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Manage users, listings, orders, disputes, and verifications</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-gray-400 text-xs">Total Users</div>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-gray-400 text-xs">Total Listings</div>
              <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-gray-400 text-xs">Total Orders</div>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">⚠️</div>
              <div className="text-gray-400 text-xs">Active Disputes</div>
              <div className="text-2xl font-bold text-white">{stats.activeDisputes}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-gray-400 text-xs">Solved Disputes</div>
              <div className="text-2xl font-bold text-white">{stats.solvedDisputes}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:bg-white/15 transition">
              <div className="text-2xl mb-1">🔍</div>
              <div className="text-gray-400 text-xs">Pending Verifications</div>
              <div className="text-2xl font-bold text-white">{stats.pendingVerifications}</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'listings', label: 'Listings', icon: '📦' },
              { id: 'orders', label: 'Orders', icon: '💰' },
              { id: 'messages', label: 'Messages', icon: '💬' },
              { id: 'disputes', label: 'Disputes', icon: '⚠️' },
              { id: 'verifications', label: 'Verifications', icon: '🔍', badge: stats.pendingVerifications > 0 ? stats.pendingVerifications : undefined },
              { id: 'reviews', label: 'Reviews', icon: '⭐' },
              { id: 'withdrawals', label: 'Withdrawals', icon: '💸' },
              { id: 'audit', label: 'Audit Logs', icon: '📜' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition relative ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/10'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
            
            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <AdminAnalytics 
                analyticsData={analyticsData}
                stats={stats}
                users={users}
              />
            )}
            
            {/* Search/Filter Bar for data tabs */}
            {['users', 'listings', 'orders', 'messages', 'reviews'].includes(activeTab) && (
              <SearchFilterBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                gameFilter={gameFilter}
                setGameFilter={setGameFilter}
                activeTab={activeTab}
                games={getAvailableGames()}
                selectedItems={selectedItems}
                onBulkAction={handleBulkAction}
                onClearSelection={handleClearSelection}
              />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">All Users ({filteredUsers.length})</h2>
                  <button
                    onClick={() => handleSelectAll(filteredUsers)}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
                  >
                    {selectedItems.length === filteredUsers.length ? '✓ Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-4">
                  {currentUsers.map((u) => (
                    <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(u.id)}
                          onChange={() => handleSelectItem(u.id)}
                          disabled={u.is_admin}
                          className="w-5 h-5 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">{u.username}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${u.is_admin ? 'bg-red-500/20 text-red-400 border border-red-500/30' : u.role === 'vendor' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                              {u.is_admin ? 'ADMIN' : u.role}
                            </span>
                            {u.is_banned && <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">BANNED</span>}
                          </div>
                          <p className="text-sm text-gray-400">Rating: {u.rating} ⭐ | Sales: {u.total_sales} | Joined: {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {!u.is_admin && (
                        <button onClick={() => handleBanUser(u.id, u.is_banned)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'}`}>
                          {u.is_banned ? '✓ Unban' : '🚫 Ban'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {renderPagination(filteredUsers)}
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">All Listings ({filteredListings.length})</h2>
                  <button
                    onClick={() => handleSelectAll(filteredListings)}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
                  >
                    {selectedItems.length === filteredListings.length ? '✓ Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-4">
                  {currentListings.map((l) => (
                    <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(l.id)}
                          onChange={() => handleSelectItem(l.id)}
                          className="w-5 h-5 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">{l.title}</span>
                            <span className={`px-2 py-1 rounded text-xs ${l.status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                              {l.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{l.game} | ${l.price} | Stock: {l.stock} | Seller: {l.profiles?.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/listing/${l.id}`} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30">View</Link>
                        <button onClick={() => handleDeleteListing(l.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition border border-red-500/30">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(filteredListings)}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">All Orders ({filteredOrders.length})</h2>
                  <button
                    onClick={() => handleSelectAll(filteredOrders)}
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
                  >
                    {selectedItems.length === filteredOrders.length ? '✓ Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-4">
                  {currentOrders.map((o) => (
                    <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(o.id)}
                          onChange={() => handleSelectItem(o.id)}
                          className="w-5 h-5 rounded"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold">{o.listing_title || 'Unknown'}</span>
                            <span className={`px-2 py-1 rounded text-xs ${o.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : o.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">${o.amount} | Buyer: {o.buyer?.username} | Seller: {o.seller?.username}</p>
                        </div>
                      </div>
                      <Link href={`/order/${o.id}`} className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30">View</Link>
                    </div>
                  ))}
                </div>
                {renderPagination(filteredOrders)}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Conversations ({filteredConversations.length})</h2>
                <div className="space-y-4">
                  {currentConversations.map((c) => (
                    <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl border border-white/10">🎮</div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{c.listing?.title || 'Unknown'}</h3>
                        <p className="text-sm text-gray-400">{c.buyer?.username} ↔ {c.seller?.username}</p>
                        <p className="text-xs text-gray-500 truncate mt-1">{c.last_message}</p>
                      </div>
                      <Link href={`/admin/messages/${c.id}`} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition border border-purple-500/30">View Chat</Link>
                    </div>
                  ))}
                </div>
                {renderPagination(filteredConversations)}
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setDisputeSubTab('active')} className={`px-4 py-2 rounded-lg font-semibold transition ${disputeSubTab === 'active' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                    Active ({activeDisputes.length})
                  </button>
                  <button onClick={() => setDisputeSubTab('solved')} className={`px-4 py-2 rounded-lg font-semibold transition ${disputeSubTab === 'solved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                    Solved ({solvedDisputes.length})
                  </button>
                </div>
                
                {disputeSubTab === 'active' && (
                  <div className="space-y-4">
                    {currentActiveDisputes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-400">No active disputes</p>
                      </div>
                    ) : currentActiveDisputes.map((o) => (
                      <div key={o.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-bold text-lg">{o.listing_title || 'Unknown Listing'}</h3>
                              <span className="px-2 py-1 rounded text-xs bg-red-500/30 text-red-300 border border-red-500/40">DISPUTE</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div>
                                <p className="text-xs text-gray-400">Order ID</p>
                                <p className="text-white font-mono text-sm">{o.id.slice(0, 8)}...</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Buyer</p>
                                <p className="text-blue-400 font-semibold">{o.buyer?.username}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Seller</p>
                                <p className="text-green-400 font-semibold">{o.seller?.username}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400">Amount</p>
                                <p className="text-white font-bold">${o.amount}</p>
                              </div>
                            </div>
                            {o.dispute_reason && (
                              <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
                                <p className="text-xs text-red-400 font-semibold mb-1">Dispute Reason:</p>
                                <p className="text-white text-sm">{o.dispute_reason}</p>
                              </div>
                            )}
                            <p className="text-xs text-gray-500">
                              Opened: {o.dispute_opened_at ? new Date(o.dispute_opened_at).toLocaleString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4">
                          <p className="text-xs text-gray-400 mb-3 font-semibold">ADMIN ACTIONS</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Link 
                              href={`/admin/disputes/${o.id}/chat`}
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition border border-orange-500/30 font-semibold"
                            >
                              💬 Open Dispute Chat
                            </Link>
                            <button 
                              onClick={() => handleResolveDispute(o.id, 'buyer')} 
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30 font-semibold"
                            >
                              💰 Refund Buyer
                            </button>
                            <button 
                              onClick={() => handleResolveDispute(o.id, 'seller')} 
                              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition border border-blue-500/30 font-semibold"
                            >
                              ✓ Complete for Seller
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {renderPagination(activeDisputes)}
                  </div>
                )}
                
                {disputeSubTab === 'solved' && (
                  <div className="space-y-4">
                    {currentSolvedDisputes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-400">No solved disputes yet</p>
                      </div>
                    ) : currentSolvedDisputes.map((o) => (
                      <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between hover:bg-white/10 transition">
                        <div>
                          <h3 className="text-white font-bold">{o.listing_title}</h3>
                          <p className="text-gray-400 text-sm">{o.buyer?.username} ↔ {o.seller?.username} | ${o.amount}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs ${o.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>{o.status}</span>
                            {o.resolution_notes && (
                              <span className="text-xs text-gray-500">Notes: {o.resolution_notes.slice(0, 50)}...</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Resolved: {o.completed_at ? new Date(o.completed_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                        <Link 
                          href={`/admin/disputes/${o.id}/chat`}
                          className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition border border-gray-500/30 h-fit"
                        >
                          View Chat
                        </Link>
                      </div>
                    ))}
                    {renderPagination(solvedDisputes)}
                  </div>
                )}
              </div>
            )}
            {/* Verifications Tab - CONTINUES FROM PART 3 */}
            {activeTab === 'verifications' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setVerificationSubTab('pending')} className={`px-4 py-2 rounded-lg font-semibold transition ${verificationSubTab === 'pending' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                    Pending ({pendingVerifications.length})
                  </button>
                  <button onClick={() => setVerificationSubTab('past')} className={`px-4 py-2 rounded-lg font-semibold transition ${verificationSubTab === 'past' ? 'bg-gradient-to-r from-gray-500 to-slate-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                    Past ({pastVerifications.length})
                  </button>
                </div>
                
                {verificationSubTab === 'pending' && (
                  <div className="space-y-4">
                    {pendingVerifications.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-400">No pending verifications</p>
                      </div>
                    ) : currentPendingVerifications.map((v) => (
                      <div key={v.id} className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 flex items-center justify-center text-3xl border border-white/10">🔍</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-white font-bold">{v.full_name}</h3>
                            <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PENDING</span>
                            {v.resubmission_count > 0 && <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">🔄 RESUBMISSION #{v.resubmission_count}</span>}
                          </div>
                          <p className="text-gray-300 text-sm">Username: {v.user?.username}</p>
                          <p className="text-gray-400 text-sm">{v.city}, {v.country} | ID: {v.id_type?.replace('_', ' ')}</p>
                          {v.resubmission_count > 0 && <p className="text-orange-400 text-xs mt-1">⚠️ This is a resubmission - check previous rejection</p>}
                          <p className="text-gray-500 text-xs mt-2">Submitted: {new Date(v.created_at).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleViewVerificationDetails(v)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition">🔎 Review</button>
                      </div>
                    ))}
                    {renderPagination(pendingVerifications)}
                  </div>
                )}
                
                {verificationSubTab === 'past' && (
                  <div className="space-y-4">
                    {pastVerifications.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-400">No past verifications</p>
                      </div>
                    ) : currentPastVerifications.map((v) => (
                      <div key={v.id} className={`border rounded-xl p-4 ${v.status === 'approved' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-3xl">{v.status === 'approved' ? '✅' : '❌'}</span>
                          <h3 className="text-white font-bold">{v.full_name}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${v.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{v.status?.toUpperCase()}</span>
                          {v.rejection_type === 'resubmission_required' && <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">CAN RESUBMIT</span>}
                        </div>
                        <p className="text-gray-300 text-sm">Username: {v.user?.username} | Reviewed by: {v.reviewer?.username}</p>
                        <p className="text-gray-400 text-sm">{v.city}, {v.country}</p>
                        {v.rejection_reason && <div className="bg-red-500/10 border border-red-500/20 rounded p-2 mt-2"><p className="text-red-400 text-xs">Reason: {v.rejection_reason}</p></div>}
                        <p className="text-gray-500 text-xs mt-2">Reviewed: {v.reviewed_at ? new Date(v.reviewed_at).toLocaleString() : 'N/A'}</p>
                      </div>
                    ))}
                    {renderPagination(pastVerifications)}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Reviews ({filteredReviews.length})</h2>
                <div className="space-y-4">
                  {currentReviews.map((r) => (
                    <div key={r.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">{[1,2,3,4,5].map(s => <span key={s} className={s <= r.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>)}</div>
                        <span className="text-white">{r.rating}/5</span>
                        {r.edited_by_admin && <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">Edited by Admin</span>}
                      </div>
                      <p className="text-gray-300 text-sm">Buyer: {r.buyer?.username} → Seller: {r.seller?.username}</p>
                      {editingReview?.id === r.id ? (
                        <div className="mt-2">
                          <textarea value={editedComment} onChange={(e) => setEditedComment(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" rows={3} />
                          <div className="flex gap-2 mt-2">
                            <button onClick={handleSaveReview} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30">Save</button>
                            <button onClick={() => setEditingReview(null)} className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition border border-gray-500/30">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <p className="text-white text-sm bg-white/5 p-3 rounded-lg border border-white/10">{r.comment || 'No comment'}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={() => handleEditReview(r)} className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition border border-yellow-500/30">✏️ Edit</button>
                            <button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition border border-red-500/30">🗑️ Delete</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {renderPagination(filteredReviews)}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <button onClick={() => setDisputeSubTab('active')} className={`px-4 py-2 rounded-lg font-semibold transition ${disputeSubTab === 'active' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                    Pending ({pendingWithdrawals.length})
                  </button>
                  <button onClick={() => setDisputeSubTab('solved')} className={`px-4 py-2 rounded-lg font-semibold transition ${disputeSubTab === 'solved' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'}`}>
                    Processed ({processedWithdrawals.length})
                  </button>
                </div>
                
                {disputeSubTab === 'active' && (
                  <div className="space-y-4">
                    {pendingWithdrawals.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-400">No pending withdrawals</p>
                      </div>
                    ) : pendingWithdrawals.map((w) => (
                      <div key={w.id} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex justify-between">
                        <div>
                          <h3 className="text-white font-bold">{w.method === 'bitcoin' ? '₿ Bitcoin' : '💳 Skrill'}</h3>
                          <p className="text-gray-300">User: {w.user?.username}</p>
                          <p className="text-white font-bold text-xl">${parseFloat(w.amount).toFixed(2)} → ${parseFloat(w.net_amount).toFixed(2)}</p>
                          <p className="text-gray-400 text-xs break-all mt-1">{w.address}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleApproveWithdrawal(w.id)} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30">✅ Approve</button>
                          <button onClick={() => handleRejectWithdrawal(w.id)} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition border border-red-500/30">❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {disputeSubTab === 'solved' && (
                  <div className="space-y-4">
                    {processedWithdrawals.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-400">No processed withdrawals</p>
                      </div>
                    ) : processedWithdrawals.map((w) => (
                      <div key={w.id} className={`border rounded-xl p-4 ${w.status === 'completed' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <h3 className="text-white font-bold">{w.method === 'bitcoin' ? '₿' : '💳'} {w.user?.username}</h3>
                        <p className="text-white">${parseFloat(w.net_amount).toFixed(2)}</p>
                        <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${w.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>{w.status?.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="relative z-10 pointer-events-auto">
                <AuditLogViewer currentAdminId={user?.id} />
              </div>
            )}

      {/* ALL MODALS BELOW */}
      
      {/* Agreement Modal */}
      {showAgreementModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-lg w-full">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Sensitive Document Access</h2>
              <p className="text-gray-300">Viewing documents for <strong className="text-white">{selectedVerification.user?.username}</strong></p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-sm text-gray-300">
              <p>• Access will be logged</p>
              <p>• One-time view only</p>
              <p>• Documents deleted after decision</p>
              <p>• Do not screenshot or share</p>
            </div>
            <div className="flex items-start gap-3 mb-6">
              <input type="checkbox" checked={agreementAccepted} onChange={(e) => setAgreementAccepted(e.target.checked)} className="w-5 h-5 mt-0.5 rounded" />
              <label className="text-white text-sm">I agree to handle this information responsibly.</label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAcceptAgreement} disabled={!agreementAccepted} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition">View Documents</button>
              <button onClick={() => { setShowAgreementModal(false); setSelectedVerification(null); setAgreementAccepted(false) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Details Modal */}
      {showVerificationDetailsModal && selectedVerification && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 rounded-2xl p-8 max-w-4xl w-full my-8">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Verification Review</h2>
              <button onClick={() => { setShowVerificationDetailsModal(false); setSelectedVerification(null) }} className="text-gray-400 hover:text-white text-2xl transition">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Personal Info</h3>
                <p className="text-gray-400 text-xs">Name</p>
                <p className="text-white mb-2">{selectedVerification.full_name}</p>
                <p className="text-gray-400 text-xs">DOB</p>
                <p className="text-white mb-2">{new Date(selectedVerification.date_of_birth).toLocaleDateString()}</p>
                <p className="text-gray-400 text-xs">Phone</p>
                <p className="text-white mb-2">{selectedVerification.phone_number}</p>
                <p className="text-gray-400 text-xs">Username</p>
                <p className="text-purple-400 font-semibold">{selectedVerification.user?.username}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Address</h3>
                <p className="text-white mb-2">{selectedVerification.street_address}</p>
                <p className="text-white mb-2">{selectedVerification.city}, {selectedVerification.state_province}</p>
                <p className="text-white">{selectedVerification.postal_code}, {selectedVerification.country}</p>
              </div>
              {!selectedVerification.documents_cleared && selectedVerification.id_front_url && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">ID Documents <span className="text-xs text-red-400">(One-time view)</span></h3>
                  <p className="text-gray-400 text-xs mb-2">Type: {selectedVerification.id_type?.replace('_', ' ')}</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Front</p>
                      <img src={selectedVerification.id_front_url} alt="ID Front" className="w-full rounded-lg" />
                    </div>
                    {selectedVerification.id_back_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Back</p>
                        <img src={selectedVerification.id_back_url} alt="ID Back" className="w-full rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedVerification.documents_cleared && (
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 md:col-span-2 text-center">
                  <span className="text-3xl">🔒</span>
                  <p className="text-gray-400 mt-2">Documents permanently deleted</p>
                </div>
              )}
              {selectedVerification.has_previous_experience && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4">Vendor Experience</h3>
                  {selectedVerification.platform_names && <p className="text-white mb-2">Platforms: {selectedVerification.platform_names}</p>}
                  {selectedVerification.platform_usernames && <p className="text-white mb-2">Usernames: {selectedVerification.platform_usernames}</p>}
                  {selectedVerification.experience_description && <p className="text-white">{selectedVerification.experience_description}</p>}
                </div>
              )}
            </div>
            {selectedVerification.status === 'pending' && (
              <div className="flex gap-4 mt-8">
                <button onClick={() => setVerificationDecisionModal('approve')} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-green-500/30 transition">✅ Approve</button>
                <button onClick={() => setVerificationDecisionModal('reject')} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-red-500/30 transition">❌ Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Decision Modal */}
      {verificationDecisionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 overflow-y-auto">
          <div className={`border-2 rounded-2xl p-8 max-w-2xl w-full my-8 ${verificationDecisionModal === 'approve' ? 'bg-gradient-to-br from-slate-900 to-green-900 border-green-500/50' : 'bg-gradient-to-br from-slate-900 to-red-900 border-red-500/50'}`}>
            <h2 className="text-2xl font-bold text-white mb-2">{verificationDecisionModal === 'approve' ? '✅ Approve Vendor' : '❌ Reject Application'}</h2>
            <p className="text-gray-300 mb-6">{verificationDecisionModal === 'approve' ? 'User will become a vendor and can start selling.' : 'Choose rejection type below.'}</p>
            
            {verificationDecisionModal === 'reject' && (
              <>
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3">Rejection Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setRejectionType('resubmission_required')} className={`p-4 rounded-lg border-2 text-left transition ${rejectionType === 'resubmission_required' ? 'border-yellow-500 bg-yellow-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}>
                      <div className="text-2xl mb-2">🔄</div>
                      <div className="text-white font-semibold">Request Resubmission</div>
                      <div className="text-gray-400 text-sm mt-1">User can fix issues and reapply.</div>
                    </button>
                    <button onClick={() => setRejectionType('permanent')} className={`p-4 rounded-lg border-2 text-left transition ${rejectionType === 'permanent' ? 'border-red-500 bg-red-500/20' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}>
                      <div className="text-2xl mb-2">🚫</div>
                      <div className="text-white font-semibold">Permanent Rejection</div>
                      <div className="text-gray-400 text-sm mt-1">User cannot reapply.</div>
                    </button>
                  </div>
                </div>
                
                {rejectionType === 'resubmission_required' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-white font-semibold mb-3">Fields That Need Resubmission <span className="text-red-400">*</span></label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'id_front', label: 'ID Front Photo' },
                          { id: 'id_back', label: 'ID Back Photo' },
                          { id: 'full_name', label: 'Full Name' },
                          { id: 'date_of_birth', label: 'Date of Birth' },
                          { id: 'phone_number', label: 'Phone Number' },
                          { id: 'address', label: 'Address Information' },
                          { id: 'id_type', label: 'ID Type Selection' },
                          { id: 'experience', label: 'Vendor Experience Info' }
                        ].map((field) => (
                          <label key={field.id} className="flex items-center gap-2 text-white text-sm bg-white/5 p-2 rounded cursor-pointer hover:bg-white/10 transition border border-white/10">
                            <input type="checkbox" checked={resubmissionFields.includes(field.id)} onChange={(e) => { if (e.target.checked) { setResubmissionFields([...resubmissionFields, field.id]) } else { setResubmissionFields(resubmissionFields.filter(f => f !== field.id)) } }} className="w-4 h-4 rounded" />
                            {field.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-white font-semibold mb-2">Resubmission Instructions <span className="text-red-400">*</span></label>
                      <textarea value={resubmissionInstructions} onChange={(e) => setResubmissionInstructions(e.target.value)} placeholder="Explain clearly what the user needs to fix..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                      <p className="text-xs text-gray-400 mt-1">{resubmissionInstructions.length}/1000 (minimum 20)</p>
                    </div>
                  </>
                )}
                
                {rejectionType === 'permanent' && (
                  <div className="mb-4">
                    <label className="block text-white font-semibold mb-2">Permanent Rejection Reason <span className="text-red-400">*</span></label>
                    <textarea value={verificationRejectionReason} onChange={(e) => setVerificationRejectionReason(e.target.value)} placeholder="Explain why this application is permanently rejected..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                    <p className="text-xs text-gray-400 mt-1">{verificationRejectionReason.length}/500 (minimum 10)</p>
                  </div>
                )}
              </>
            )}
            
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">Admin Notes (Internal Only)</label>
              <textarea value={verificationAdminNotes} onChange={(e) => setVerificationAdminNotes(e.target.value)} placeholder="Notes for other admins..." rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
            </div>
            
            <div className="flex gap-3">
              <button onClick={verificationDecisionModal === 'approve' ? handleApproveVerification : handleRejectVerification} disabled={verificationDecisionModal === 'reject' && ((rejectionType === 'resubmission_required' && (resubmissionFields.length === 0 || resubmissionInstructions.trim().length < 20)) || (rejectionType === 'permanent' && verificationRejectionReason.trim().length < 10))} className={`flex-1 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${verificationDecisionModal === 'approve' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30' : rejectionType === 'permanent' ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/30' : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/30'}`}>
                {verificationDecisionModal === 'approve' ? 'Confirm Approval' : rejectionType === 'permanent' ? 'Permanently Reject' : 'Request Resubmission'}
              </button>
              <button onClick={() => { setVerificationDecisionModal(null); setVerificationRejectionReason(''); setVerificationAdminNotes(''); setRejectionType('resubmission_required'); setResubmissionFields([]); setResubmissionInstructions('') }} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Withdrawal Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-green-900 border-2 border-green-500/50 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">✅ Approve Withdrawal</h2>
            <div className="mb-4">
              <label className="block text-white text-sm mb-2">Transaction ID *</label>
              <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="BTC hash or Skrill ref..." />
            </div>
            <div className="mb-6">
              <label className="block text-white text-sm mb-2">Notes (Optional)</label>
              <textarea value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent" rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={confirmApproveWithdrawal} disabled={!transactionId.trim()} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition">Confirm</button>
              <button onClick={() => { setShowApproveModal(false); setApprovingWithdrawalId(null) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-red-900 border-2 border-red-500/50 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">❌ Reject Withdrawal</h2>
            <div className="mb-6">
              <label className="block text-white text-sm mb-2">Rejection Reason *</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent" rows={4} placeholder="Min 5 characters..." />
            </div>
            <div className="flex gap-3">
              <button onClick={confirmRejectWithdrawal} disabled={rejectionReason.trim().length < 5} className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition">Confirm</button>
              <button onClick={() => { setShowRejectModal(false); setRejectingWithdrawalId(null) }} className="flex-1 bg-white/10 text-white py-3 rounded-lg hover:bg-white/20 transition border border-white/10">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}