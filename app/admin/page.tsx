// app/admin/page.tsx - ADMIN DASHBOARD WITH PAGINATION

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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  
  // Data states
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [conversations, setConversations] = useState<any[]>([])
  const [activeDisputes, setActiveDisputes] = useState<any[]>([])
  const [solvedDisputes, setSolvedDisputes] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [editingReview, setEditingReview] = useState<any>(null)
  const [editedComment, setEditedComment] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      if (activeTab === 'users') fetchUsers()
      if (activeTab === 'listings') fetchListings()
      if (activeTab === 'orders') fetchOrders()
      if (activeTab === 'messages') fetchConversations()
      if (activeTab === 'disputes') fetchDisputes()
      if (activeTab === 'reviews') fetchReviews()
    }
  }, [activeTab, profile])

  // Reset to page 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, disputeSubTab])

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.is_admin) {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    } catch (error) {
      console.error('Check admin error:', error)
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
  }

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error) setListings(data || [])
  }

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!buyer_id(username),
        seller:profiles!seller_id(username)
      `)
      .order('created_at', { ascending: false })

    if (!error) setOrders(data || [])
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, game, image_url),
          buyer:profiles!conversations_buyer_id_fkey(username),
          seller:profiles!conversations_seller_id_fkey(username),
          order:orders(status, amount)
        `)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchDisputes = async () => {
    try {
      // Fetch active disputes (status = dispute_raised)
      const { data: activeData, error: activeError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(username, id),
          seller:profiles!orders_seller_id_fkey(username, id)
        `)
        .eq('status', 'dispute_raised')
        .order('dispute_opened_at', { ascending: false })

      if (activeError) throw activeError
      setActiveDisputes(activeData || [])

      // Fetch solved disputes - orders that HAD a dispute but are now resolved
      // These are orders with dispute_opened_at set but status is NOT dispute_raised
      const { data: solvedData, error: solvedError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(username, id),
          seller:profiles!orders_seller_id_fkey(username, id)
        `)
        .not('dispute_opened_at', 'is', null)
        .neq('status', 'dispute_raised')
        .order('completed_at', { ascending: false })

      if (solvedError) throw solvedError
      setSolvedDisputes(solvedData || [])
    } catch (error) {
      console.error('Error fetching disputes:', error)
    }
  }

  const fetchReviews = async () => {
    try {
      // First fetch reviews with buyer info
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          buyer:profiles!buyer_id(username)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error.message, error.details, error.hint)
        throw error
      }

      // If reviews have seller_id, fetch seller info separately
      const reviewsWithSellers = await Promise.all((data || []).map(async (review) => {
        if (review.seller_id) {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', review.seller_id)
            .single()
          return { ...review, seller: sellerData }
        }
        return { ...review, seller: null }
      }))

      setReviews(reviewsWithSellers)
    } catch (error: any) {
      console.error('Error fetching reviews:', error.message || error)
    }
  }

  const handleEditReview = (review: any) => {
    setEditingReview(review)
    setEditedComment(review.comment || '')
  }

  const handleSaveReview = async () => {
    if (!editingReview) return

    try {
      const { error } = await supabase
        .from('reviews')
        .update({ 
          comment: editedComment.trim() || null,
          edited_by_admin: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', editingReview.id)

      if (error) throw error

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'review_edited',
        target_type: 'review',
        target_id: editingReview.id,
        description: `Edited review comment for order ${editingReview.order_id}`,
        metadata: {
          original_comment: editingReview.comment,
          new_comment: editedComment.trim(),
          rating: editingReview.rating
        }
      })

      alert('Review updated successfully')
      setEditingReview(null)
      fetchReviews()
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      // Log admin action
      await supabase.from('admin_actions').insert({
        admin_id: user.id,
        action_type: 'review_deleted',
        target_type: 'review',
        target_id: reviewId,
        description: 'Deleted review',
        metadata: {}
      })

      alert('Review deleted')
      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban'
    const reason = currentlyBanned ? null : prompt('Ban reason:')
    
    if (!currentlyBanned && !reason) return

    const { error } = await supabase
      .from('profiles')
      .update({
        is_banned: !currentlyBanned,
        banned_at: !currentlyBanned ? new Date().toISOString() : null,
        ban_reason: reason
      })
      .eq('id', userId)

    if (!error) {
      alert(`User ${action}ned successfully`)
      fetchUsers()
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Delete this listing?')) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (!error) {
      alert('Listing deleted')
      fetchListings()
    }
  }

  const handleResolveDispute = async (orderId: string, resolution: 'buyer' | 'seller') => {
    let confirmMsg = ''
    let newStatus = ''
    let actionType = ''
    let resolutionType = ''
    let description = ''
    
    if (resolution === 'buyer') {
      confirmMsg = 'Resolve dispute in favor of BUYER?\n\nThis will:\n• Mark the order as REFUNDED\n• The buyer will receive their money back\n• The seller will not be paid'
      newStatus = 'refunded'
      actionType = 'dispute_resolved_buyer'
      resolutionType = 'refunded'
      description = 'Dispute resolved in favor of buyer - Order refunded'
    } else {
      confirmMsg = 'Resolve dispute in favor of SELLER?\n\nThis will:\n• Mark the order as COMPLETED\n• The seller will keep the payment\n• The buyer will not receive a refund'
      newStatus = 'completed'
      actionType = 'dispute_resolved_seller'
      resolutionType = 'completed'
      description = 'Dispute resolved in favor of seller - Order completed'
    }
    
    if (!confirm(confirmMsg)) return

    // Optional: Ask for resolution notes
    const notes = prompt('Add resolution notes (optional):')

    try {
      // Get current order status for logging
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

      const previousStatus = currentOrder?.status || 'dispute_raised'

      // Update the order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          completed_at: new Date().toISOString(),
          resolved_by: user.id,
          resolution_notes: notes || null,
          resolution_type: resolutionType
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Log the admin action using existing table structure
      const { error: logError } = await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          target_type: 'order',
          target_id: orderId,
          description: description + (notes ? ` | Notes: ${notes}` : ''),
          metadata: {
            previous_status: previousStatus,
            new_status: newStatus,
            resolution_type: resolutionType,
            notes: notes || null
          }
        })

      if (logError) {
        console.error('Failed to log admin action:', logError)
        // Don't fail the whole operation if logging fails
      }
      
      if (resolution === 'buyer') {
        alert('✅ Dispute resolved in favor of BUYER\n\nOrder has been marked as REFUNDED.')
      } else {
        alert('✅ Dispute resolved in favor of SELLER\n\nOrder has been marked as COMPLETED.')
      }
      
      fetchDisputes()
      fetchOrders()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('Failed to resolve dispute')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Pagination logic
  const getCurrentPageData = (data: any[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (data: any[]) => {
    return Math.ceil(data.length / ITEMS_PER_PAGE)
  }

  const renderPagination = (data: any[]) => {
    const totalPages = getTotalPages(data)
    if (totalPages <= 1) return null

    const pageNumbers = []
    const showEllipsis = totalPages > 7

    if (showEllipsis) {
      // Show first page
      pageNumbers.push(1)
      
      // Show ellipsis or pages around current page
      if (currentPage > 3) {
        pageNumbers.push('...')
      }
      
      // Show pages around current page
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pageNumbers.push(i)
      }
      
      // Show ellipsis or last page
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...')
      }
      
      // Show last page
      pageNumbers.push(totalPages)
    } else {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            currentPage === 1
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          ← Previous
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((pageNum, index) => (
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="text-gray-400 px-2">...</span>
          ) : (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum as number)}
              className={`w-10 h-10 rounded-lg font-semibold transition ${
                currentPage === pageNum
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {pageNum}
            </button>
          )
        ))}

        {/* Next Button */}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            currentPage === totalPages
              ? 'bg-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          Next →
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const stats = {
    totalUsers: users.length,
    totalListings: listings.length,
    totalOrders: orders.length,
    totalConversations: conversations.length,
    activeListings: listings.filter(l => l.status === 'active').length,
    bannedUsers: users.filter(u => u.is_banned).length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    activeDisputes: activeDisputes.length,
    solvedDisputes: solvedDisputes.length
  }

  // Get current page data
  const currentUsers = getCurrentPageData(users)
  const currentListings = getCurrentPageData(listings)
  const currentOrders = getCurrentPageData(orders)
  const currentConversations = getCurrentPageData(conversations)
  const currentActiveDisputes = getCurrentPageData(activeDisputes)
  const currentSolvedDisputes = getCurrentPageData(solvedDisputes)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Main Site
              </Link>
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                  <span className="text-white">{profile?.username}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-lg">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Manage users, listings, orders, messages, and disputes</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-gray-400 text-xs">Total Users</div>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <div className="text-red-400 text-xs mt-1">{stats.bannedUsers} banned</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-gray-400 text-xs">Total Listings</div>
              <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
              <div className="text-green-400 text-xs mt-1">{stats.activeListings} active</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-gray-400 text-xs">Total Orders</div>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
              <div className="text-yellow-400 text-xs mt-1">{stats.pendingOrders} pending</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-gray-400 text-xs">Conversations</div>
              <div className="text-2xl font-bold text-white">{stats.totalConversations}</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">⚠️</div>
              <div className="text-gray-400 text-xs">Active Disputes</div>
              <div className="text-2xl font-bold text-white">{stats.activeDisputes}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-gray-400 text-xs">Solved Disputes</div>
              <div className="text-2xl font-bold text-white">{stats.solvedDisputes}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'listings'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Listings
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'messages'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'disputes'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Disputes
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'reviews'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Reviews ⭐
            </button>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">All Users</h2>
                  <span className="text-gray-400 text-sm">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, users.length)} of {users.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {currentUsers.map((u) => (
                    <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-semibold">{u.username}</h3>
                            {u.is_admin ? (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                ADMIN
                              </span>
                            ) : (
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                u.role === 'vendor' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                              }`}>
                                {u.role}
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                BANNED
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Rating: {u.rating} | Sales: {u.total_sales} | Joined: {new Date(u.created_at).toLocaleDateString()}
                          </p>
                          {u.is_banned && u.ban_reason && (
                            <p className="text-sm text-red-400 mt-1">Ban reason: {u.ban_reason}</p>
                          )}
                        </div>
                        {!u.is_admin && (
                          <button
                            onClick={() => handleBanUser(u.id, u.is_banned)}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                              u.is_banned
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(users)}
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">All Listings</h2>
                  <span className="text-gray-400 text-sm">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, listings.length)} of {listings.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {currentListings.map((l) => (
                    <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-semibold">{l.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              l.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              l.status === 'sold' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {l.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {l.game} | ${l.price} | Stock: {l.stock} | Seller: {l.profiles?.username}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/listing/${l.id}`}
                            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => handleDeleteListing(l.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(listings)}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">All Orders</h2>
                  <span className="text-gray-400 text-sm">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, orders.length)} of {orders.length}
                  </span>
                </div>
                <div className="space-y-4">
                  {currentOrders.map((o) => (
                    <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-white font-semibold">{o.listing_title || 'Unknown Item'}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              o.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              o.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                              o.status === 'dispute_solved' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            {o.listing_game || 'N/A'} | ${o.amount} | Buyer: {o.buyer?.username} | Seller: {o.seller?.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(o.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Link
                          href={`/order/${o.id}`}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {renderPagination(orders)}
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">All Conversations</h2>
                  <span className="text-gray-400 text-sm">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, conversations.length)} of {conversations.length}
                  </span>
                </div>
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-400">No conversations yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {currentConversations.map((conv) => (
                        <div key={conv.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                              {conv.listing?.image_url ? (
                                <img src={conv.listing.image_url} alt={conv.listing.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-semibold mb-1">{conv.listing?.title || 'Unknown Item'}</h3>
                              <p className="text-sm text-gray-400 mb-1">
                                <span className="text-blue-400">{conv.buyer?.username}</span> ↔ <span className="text-green-400">{conv.seller?.username}</span>
                              </p>
                              <p className="text-xs text-gray-500 truncate mb-1">
                                Last: {conv.last_message}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(conv.last_message_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              {conv.order && (
                                <span className={`px-3 py-1 rounded text-xs font-semibold text-center ${
                                  conv.order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  conv.order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                                  conv.order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                                  'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {conv.order.status}
                                </span>
                              )}
                              <Link
                                href={`/admin/messages/${conv.id}`}
                                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-xs font-semibold transition text-center whitespace-nowrap"
                              >
                                👁️ View Chat
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderPagination(conversations)}
                  </>
                )}
              </div>
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <div>
                {/* Dispute Sub-Tabs */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setDisputeSubTab('active')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      disputeSubTab === 'active'
                        ? 'bg-red-500 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Active Disputes ({stats.activeDisputes})
                  </button>
                  <button
                    onClick={() => setDisputeSubTab('solved')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      disputeSubTab === 'solved'
                        ? 'bg-green-500 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Solved Disputes ({stats.solvedDisputes})
                  </button>
                </div>

                {/* Active Disputes */}
                {disputeSubTab === 'active' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">Active Disputes</h2>
                      {activeDisputes.length > 0 && (
                        <span className="text-gray-400 text-sm">
                          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, activeDisputes.length)} of {activeDisputes.length}
                        </span>
                      )}
                    </div>
                    {activeDisputes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="text-gray-400">No active disputes</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {currentActiveDisputes.map((order) => (
                            <div key={order.id} className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                  {order.listing_image_url ? (
                                    <img src={order.listing_image_url} alt={order.listing_title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-white font-bold">{order.listing_title || 'Unknown Item'}</h3>
                                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                                      DISPUTE RAISED
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">
                                    <strong>Buyer:</strong> {order.buyer?.username} | <strong>Seller:</strong> {order.seller?.username}
                                  </p>
                                  <p className="text-sm text-gray-400 mb-2">
                                    Amount: ${order.amount} | Game: {order.listing_game || 'N/A'} | Category: {order.listing_category || 'N/A'}
                                  </p>
                                  {order.dispute_reason && (
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
                                      <p className="text-xs text-gray-400 mb-1">Dispute Reason:</p>
                                      <p className="text-sm text-white">{order.dispute_reason}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Opened: {order.dispute_opened_at ? new Date(order.dispute_opened_at).toLocaleString() : 'N/A'}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Link
                                    href={`/admin/disputes/${order.id}/chat`}
                                    className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-4 py-2 rounded-lg text-sm font-semibold transition text-center whitespace-nowrap"
                                  >
                                    💬 Join Chat
                                  </Link>
                                  <button
                                    onClick={() => handleResolveDispute(order.id, 'buyer')}
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    💰 Refund Buyer
                                  </button>
                                  <button
                                    onClick={() => handleResolveDispute(order.id, 'seller')}
                                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    ✓ Complete Order
                                  </button>
                                  <Link
                                    href={`/order/${order.id}`}
                                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-semibold transition text-center"
                                  >
                                    View Order
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {renderPagination(activeDisputes)}
                      </>
                    )}
                  </div>
                )}

                {/* Solved Disputes */}
                {disputeSubTab === 'solved' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-white">Solved Disputes</h2>
                      {solvedDisputes.length > 0 && (
                        <span className="text-gray-400 text-sm">
                          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, solvedDisputes.length)} of {solvedDisputes.length}
                        </span>
                      )}
                    </div>
                    {solvedDisputes.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-400">No solved disputes yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {currentSolvedDisputes.map((order) => (
                            <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                              <div className="flex items-start gap-4">
                                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                  {order.listing_image_url ? (
                                    <img src={order.listing_image_url} alt={order.listing_title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-white font-bold">{order.listing_title || 'Unknown Item'}</h3>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                      order.status === 'refunded' 
                                        ? 'bg-orange-500/20 text-orange-400' 
                                        : 'bg-green-500/20 text-green-400'
                                    }`}>
                                      {order.status === 'refunded' ? '💰 REFUNDED' : '✓ COMPLETED'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 mb-2">
                                    <strong>Buyer:</strong> {order.buyer?.username} | <strong>Seller:</strong> {order.seller?.username}
                                  </p>
                                  <p className="text-sm text-gray-400 mb-2">
                                    Amount: ${order.amount} | Game: {order.listing_game || 'N/A'} | Category: {order.listing_category || 'N/A'}
                                  </p>
                                  
                                  {/* Resolution Info */}
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-2">
                                    <p className="text-xs text-gray-400 mb-1">Resolution:</p>
                                    <p className="text-sm text-white font-semibold">
                                      {order.status === 'refunded' 
                                        ? '💰 Buyer won - Order refunded' 
                                        : '✓ Seller won - Order completed'}
                                    </p>
                                    {order.resolution_notes && (
                                      <p className="text-xs text-gray-400 mt-2">
                                        <strong>Admin Notes:</strong> {order.resolution_notes}
                                      </p>
                                    )}
                                  </div>

                                  {order.dispute_reason && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-2">
                                      <p className="text-xs text-red-400 mb-1">Original Dispute Reason:</p>
                                      <p className="text-sm text-white">{order.dispute_reason}</p>
                                    </div>
                                  )}
                                  
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <p>Dispute Opened: {order.dispute_opened_at ? new Date(order.dispute_opened_at).toLocaleString() : 'N/A'}</p>
                                    <p>Resolved: {order.completed_at ? new Date(order.completed_at).toLocaleString() : 'N/A'}</p>
                                  </div>
                                </div>
                                <Link
                                  href={`/order/${order.id}`}
                                  className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-semibold transition"
                                >
                                  View History
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        {renderPagination(solvedDisputes)}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">All Reviews</h2>
                  <span className="text-gray-400 text-sm">
                    {reviews.length > 0 && `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, reviews.length)} of ${reviews.length}`}
                  </span>
                </div>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">⭐</div>
                    <p className="text-gray-400">No reviews yet</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {getCurrentPageData(reviews).map((review) => (
                        <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {/* Star Rating */}
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <span key={star} className={`text-lg ${star <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                                <span className="text-white font-semibold">{review.rating}/5</span>
                                {review.edited_by_admin && (
                                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-500/20 text-orange-400">
                                    Edited by Admin
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-xs text-gray-400">Reviewer (Buyer)</p>
                                  <p className="text-white font-semibold">{review.buyer?.username || 'Unknown'}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-400">Seller</p>
                                  <p className="text-white font-semibold">{review.seller?.username || 'Unknown'}</p>
                                </div>
                              </div>

                              <div className="mb-3">
                                <p className="text-xs text-gray-400">Order ID</p>
                                <p className="text-sm text-purple-400 font-mono">
                                  {review.order_id ? review.order_id.substring(0, 8) + '...' : 'N/A'}
                                </p>
                              </div>

                              {/* Review Comment */}
                              {editingReview?.id === review.id ? (
                                <div className="mb-3">
                                  <label className="block text-xs text-gray-400 mb-1">Edit Comment</label>
                                  <textarea
                                    value={editedComment}
                                    onChange={(e) => setEditedComment(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none"
                                    placeholder="Edit review comment..."
                                  />
                                  <p className="text-xs text-gray-500 mt-1">{editedComment.length}/500 characters</p>
                                </div>
                              ) : (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-400 mb-1">Comment</p>
                                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                                    <p className="text-sm text-white">
                                      {review.comment || <span className="text-gray-500 italic">No comment provided</span>}
                                    </p>
                                  </div>
                                </div>
                              )}

                              <div className="text-xs text-gray-500">
                                Created: {new Date(review.created_at).toLocaleString()}
                                {review.edited_at && ` | Edited: ${new Date(review.edited_at).toLocaleString()}`}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              {editingReview?.id === review.id ? (
                                <>
                                  <button
                                    onClick={handleSaveReview}
                                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    ✓ Save
                                  </button>
                                  <button
                                    onClick={() => setEditingReview(null)}
                                    className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEditReview(review)}
                                    className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap"
                                  >
                                    🗑️ Delete
                                  </button>
                                  <Link
                                    href={`/order/${review.order_id}`}
                                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm font-semibold transition text-center whitespace-nowrap"
                                  >
                                    View Order
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {renderPagination(reviews)}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}