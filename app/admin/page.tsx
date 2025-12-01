'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// Existing components
import AdminAnalytics from '@/components/AdminAnalytics'
import SearchFilterBar from '@/components/SearchFilterBar'
import AdminNotifications from '@/components/AdminNotifications'
import AuditLogViewer from '@/components/AuditLogViewer'
import FraudAlertsWidget, { CriticalAlertBanner } from '@/components/FraudAlertsWidget'

// New modular components
import { useAdminData } from './hooks/useAdminData'
import { useAdminActions } from './hooks/useAdminActions'
import { ITEMS_PER_PAGE, FraudFlag, AdminVerification } from './types'

// Tab Components
import UsersTab from './components/tabs/UsersTab'
import ListingsTab from './components/tabs/ListingsTab'
import OrdersTab from './components/tabs/OrdersTab'
import MessagesTab from './components/tabs/MessagesTab'
import DisputesTab from './components/tabs/DisputesTab'
import VerificationsTab from './components/tabs/VerificationsTab'
import ReviewsTab from './components/tabs/ReviewsTab'
import WithdrawalsTab from './components/tabs/WithdrawalsTab'
import FraudTab from './components/tabs/FraudTab'

// Modal Components
import {
  AgreementModal,
  VerificationDetailsModal,
  VerificationDecisionModal,
  ApproveWithdrawalModal,
  RejectWithdrawalModal,
  FraudReviewModal
} from './components/modals/AdminModals'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')
  const [disputeSubTab, setDisputeSubTab] = useState<'active' | 'solved'>('active')
  const [verificationSubTab, setVerificationSubTab] = useState<'pending' | 'past'>('pending')
  const [withdrawalSubTab, setWithdrawalSubTab] = useState<'pending' | 'processed'>('pending')
  const [fraudSubTab, setFraudSubTab] = useState<'active' | 'reviewed'>('active')
  const [currentPage, setCurrentPage] = useState(1)

  // Search/Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gameFilter, setGameFilter] = useState('all')

  // Bulk action states
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Notification panel state
  const [showNotifications, setShowNotifications] = useState(false)

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
  const [selectedVerification, setSelectedVerification] = useState<AdminVerification | null>(null)
  const [showAgreementModal, setShowAgreementModal] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [verificationDecisionModal, setVerificationDecisionModal] = useState<'approve' | 'reject' | null>(null)
  const [verificationRejectionReason, setVerificationRejectionReason] = useState('')
  const [verificationAdminNotes, setVerificationAdminNotes] = useState('')
  const [rejectionType, setRejectionType] = useState<'resubmission_required' | 'permanent'>('resubmission_required')
  const [resubmissionFields, setResubmissionFields] = useState<string[]>([])
  const [resubmissionInstructions, setResubmissionInstructions] = useState('')

  // Fraud modal states
  const [showFraudDetailsModal, setShowFraudDetailsModal] = useState(false)
  const [selectedFraudFlag, setSelectedFraudFlag] = useState<FraudFlag | null>(null)
  const [fraudReviewNotes, setFraudReviewNotes] = useState('')
  const [fraudReviewStatus, setFraudReviewStatus] = useState<'reviewed' | 'resolved' | 'false_positive'>('reviewed')

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Permission checks
  const isAdmin = profile?.is_admin === true
  const isSuperAdmin = profile?.admin_level === 'super_admin'
  const canExportData = isAdmin
  const canViewFraudDetection = isAdmin
  const canManageFraudFlags = isSuperAdmin

  // Use custom hooks for data
  const {
    users,
    listings,
    orders,
    conversations,
    activeDisputes,
    solvedDisputes,
    reviews,
    pendingWithdrawals,
    processedWithdrawals,
    pendingVerifications,
    pastVerifications,
    fraudFlags,
    notifications,
    unreadCount,
    analyticsData,
    stats,
    fetchUsers,
    fetchListings,
    fetchOrders,
    fetchDisputes,
    fetchReviews,
    fetchWithdrawals,
    fetchVerifications,
    fetchNotifications,
    fetchFraudFlags,
    fetchAllData: refreshData
  } = useAdminData(user?.id, isAdmin)

  // Use custom hooks for actions
  const actions = useAdminActions({
    userId: user?.id,
    profile,
    users,
    orders,
    listings,
    activeDisputes,
    fraudFlags,
    isSuperAdmin,
    fetchUsers,
    fetchListings,
    fetchOrders,
    fetchDisputes,
    fetchReviews,
    fetchWithdrawals,
    fetchVerifications,
    fetchNotifications,
    fetchFraudFlags
  })

  // Check admin authentication
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) { router.push('/login'); return }
        setUser(user)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (profileError || !profileData?.is_admin) { router.push('/'); return }
        setProfile(profileData)
        setLoading(false)
      } catch (error) { router.push('/') }
    }
    checkAdmin()
  }, [])

  // Reset pagination when changing tabs
  useEffect(() => {
    setCurrentPage(1)
    setSelectedItems([])
  }, [activeTab, disputeSubTab, verificationSubTab, withdrawalSubTab, fraudSubTab])

  // Filter helpers
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
        } else if (activeTab === 'fraud') {
          return item.user?.username?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
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

  const getAvailableGames = (): string[] => {
    if (activeTab === 'listings') {
      return [...new Set(listings.map(l => l.game).filter((g): g is string => Boolean(g)))]
    } else if (activeTab === 'orders') {
      return [...new Set(orders.map(o => o.listing_game).filter((g): g is string => Boolean(g)))]
    }
    return []
  }

  const getTotalPages = (d: any[]) => Math.ceil(d.length / ITEMS_PER_PAGE)

  const renderPagination = (data: any[]): React.ReactNode | null => {
    const totalPages = getTotalPages(data)
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => setCurrentPage(p)}
            className={`w-10 h-10 rounded-lg font-semibold transition ${
              currentPage === p
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 transition"
        >
          Next →
        </button>
      </div>
    )
  }

  // Selection handlers
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

  const handleClearSelection = () => setSelectedItems([])

  // Verification modal handlers
  const handleViewVerificationDetails = (v: AdminVerification) => {
    setSelectedVerification(v)
    if (v.documents_viewed_at || v.documents_cleared) {
      setShowVerificationDetailsModal(true)
    } else {
      setShowAgreementModal(true)
    }
  }

  const handleAcceptAgreement = async () => {
    if (!agreementAccepted || !selectedVerification) return
    const success = await actions.handleAcceptAgreement(selectedVerification.id)
    if (success) {
      setShowAgreementModal(false)
      setShowVerificationDetailsModal(true)
      setAgreementAccepted(false)
    }
  }

  const handleApproveVerification = async () => {
    if (!selectedVerification) return
    const success = await actions.handleApproveVerification(selectedVerification, verificationAdminNotes)
    if (success) {
      setVerificationDecisionModal(null)
      setShowVerificationDetailsModal(false)
      setSelectedVerification(null)
      setVerificationAdminNotes('')
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

    const success = await actions.handleRejectVerification(
      selectedVerification,
      rejectionType,
      verificationRejectionReason,
      verificationAdminNotes,
      resubmissionFields,
      resubmissionInstructions
    )
    
    if (success) {
      setVerificationDecisionModal(null)
      setShowVerificationDetailsModal(false)
      setSelectedVerification(null)
      setVerificationRejectionReason('')
      setVerificationAdminNotes('')
      setRejectionType('resubmission_required')
      setResubmissionFields([])
      setResubmissionInstructions('')
    }
  }

  // Withdrawal handlers
  const handleApproveWithdrawal = (id: string) => {
    setApprovingWithdrawalId(id)
    setTransactionId('')
    setApproveNotes('')
    setShowApproveModal(true)
  }

  const confirmApproveWithdrawal = async () => {
    if (!approvingWithdrawalId) return
    const success = await actions.handleApproveWithdrawal(approvingWithdrawalId, transactionId, approveNotes)
    if (success) {
      setShowApproveModal(false)
      setApprovingWithdrawalId(null)
    }
  }

  const handleRejectWithdrawal = (id: string) => {
    setRejectingWithdrawalId(id)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const confirmRejectWithdrawal = async () => {
    if (!rejectingWithdrawalId) return
    const success = await actions.handleRejectWithdrawal(rejectingWithdrawalId, rejectionReason)
    if (success) {
      setShowRejectModal(false)
      setRejectingWithdrawalId(null)
    }
  }

  // Review handlers
  const handleEditReview = (r: any) => {
    setEditingReview(r)
    setEditedComment(r.comment || '')
  }

  const handleSaveReview = async () => {
    if (!editingReview) return
    await actions.handleSaveReview(editingReview.id, editedComment)
    setEditingReview(null)
  }

  // Fraud handlers
  const handleReviewFraudFlag = async () => {
    if (!selectedFraudFlag) return
    const success = await actions.handleReviewFraudFlag(selectedFraudFlag.id, fraudReviewStatus, fraudReviewNotes)
    if (success) {
      setShowFraudDetailsModal(false)
      setSelectedFraudFlag(null)
      setFraudReviewNotes('')
    }
  }

  // Export handler
  const handleExportCSV = async (dataType: 'users' | 'orders' | 'listings' | 'disputes' | 'withdrawals' | 'fraud_flags') => {
    setIsExporting(true)
    await actions.exportToCSV(dataType, {
      users,
      orders,
      listings,
      activeDisputes,
      solvedDisputes,
      pendingWithdrawals,
      processedWithdrawals,
      fraudFlags
    })
    setIsExporting(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Loading state
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-xl">Loading Admin Panel...</div>
      </div>
    </div>
  )

  // Apply filters
  const filteredUsers = applyFilters(users)
  const filteredListings = applyFilters(listings)
  const filteredOrders = applyFilters(orders)
  const filteredConversations = applyFilters(conversations)
  const filteredReviews = applyFilters(reviews)

  return (
    <>
      {/* Critical Fraud Alert Banner - Shows at top for critical alerts */}
      {canViewFraudDetection && <CriticalAlertBanner />}
      
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        {/* Cosmic Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px]"></div>
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
              {isSuperAdmin && (
                <span className="ml-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-xs font-bold rounded text-white shadow-lg">
                  SUPER ADMIN
                </span>
              )}
            </Link>
            <div className="flex items-center space-x-4">
              {/* Fraud Alerts Widget - Real-time fraud notifications */}
              {canViewFraudDetection && (
                <FraudAlertsWidget 
                  onAlertClick={(alert) => {
                    setActiveTab('fraud')
                  }} 
                />
              )}
              
              <AdminNotifications
                notifications={notifications}
                unreadCount={unreadCount}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                onMarkRead={actions.handleMarkNotificationRead}
                onMarkAllRead={actions.handleMarkAllNotificationsRead}
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
            <p className="text-gray-300">Manage users, listings, orders, disputes, verifications, and fraud detection</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
            {[
              { icon: '👥', label: 'Total Users', value: stats.totalUsers },
              { icon: '📦', label: 'Total Listings', value: stats.totalListings },
              { icon: '💰', label: 'Total Orders', value: stats.totalOrders },
              { icon: '⚠️', label: 'Active Disputes', value: stats.activeDisputes },
              { icon: '✅', label: 'Solved Disputes', value: stats.solvedDisputes },
              { icon: '🔍', label: 'Pending Verifications', value: stats.pendingVerifications },
              ...(canViewFraudDetection ? [{ icon: '🚨', label: 'Active Fraud Flags', value: stats.activeFraudFlags, danger: true }] : [])
            ].map((stat, i) => (
              <div
                key={i}
                className={`backdrop-blur-lg border rounded-xl p-4 hover:bg-white/15 transition ${
                  stat.danger ? 'bg-red-500/20 border-red-500/30' : 'bg-white/10 border-white/10'
                }`}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className={`text-xs ${stat.danger ? 'text-gray-300' : 'text-gray-400'}`}>{stat.label}</div>
                <div className={`text-2xl font-bold ${stat.danger ? 'text-red-400' : 'text-white'}`}>{stat.value}</div>
              </div>
            ))}
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
              ...(canViewFraudDetection ? [{ id: 'fraud', label: 'Fraud Detection', icon: '🚨', badge: stats.activeFraudFlags > 0 ? stats.activeFraudFlags : undefined }] : []),
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
              <AdminAnalytics analyticsData={analyticsData} stats={stats} users={users} />
            )}

            {/* Search/Filter Bar */}
            {['users', 'listings', 'orders', 'messages', 'reviews', 'fraud'].includes(activeTab) && (
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
                onBulkAction={(action) => actions.handleBulkAction(action, selectedItems, activeTab)}
                onClearSelection={handleClearSelection}
              />
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <UsersTab
                users={users}
                filteredUsers={filteredUsers}
                currentPage={currentPage}
                selectedItems={selectedItems}
                isExporting={isExporting}
                canExportData={canExportData}
                currentAdminId={user?.id || ''}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onBanUser={actions.handleBanUser}
                onExportCSV={() => handleExportCSV('users')}
                renderPagination={renderPagination}
              />
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <ListingsTab
                listings={listings}
                filteredListings={filteredListings}
                currentPage={currentPage}
                selectedItems={selectedItems}
                isExporting={isExporting}
                canExportData={canExportData}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onDeleteListing={actions.handleDeleteListing}
                onExportCSV={() => handleExportCSV('listings')}
                renderPagination={renderPagination}
              />
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                filteredOrders={filteredOrders}
                currentPage={currentPage}
                selectedItems={selectedItems}
                isExporting={isExporting}
                canExportData={canExportData}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
                onExportCSV={() => handleExportCSV('orders')}
                renderPagination={renderPagination}
              />
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <MessagesTab
                conversations={conversations}
                filteredConversations={filteredConversations}
                currentPage={currentPage}
                renderPagination={renderPagination}
              />
            )}

            {/* Disputes Tab */}
            {activeTab === 'disputes' && (
              <DisputesTab
                activeDisputes={activeDisputes}
                solvedDisputes={solvedDisputes}
                disputeSubTab={disputeSubTab}
                setDisputeSubTab={setDisputeSubTab}
                currentPage={currentPage}
                isExporting={isExporting}
                canExportData={canExportData}
                onResolveDispute={actions.handleResolveDispute}
                onExportCSV={() => handleExportCSV('disputes')}
                renderPagination={renderPagination}
              />
            )}

            {/* Verifications Tab */}
            {activeTab === 'verifications' && (
              <VerificationsTab
                pendingVerifications={pendingVerifications}
                pastVerifications={pastVerifications}
                verificationSubTab={verificationSubTab}
                setVerificationSubTab={setVerificationSubTab}
                currentPage={currentPage}
                onViewDetails={handleViewVerificationDetails}
                renderPagination={renderPagination}
              />
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <ReviewsTab
                reviews={reviews}
                filteredReviews={filteredReviews}
                currentPage={currentPage}
                onSaveReview={actions.handleSaveReview}
                onDeleteReview={actions.handleDeleteReview}
                renderPagination={renderPagination}
              />
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <WithdrawalsTab
                pendingWithdrawals={pendingWithdrawals}
                processedWithdrawals={processedWithdrawals}
                withdrawalSubTab={withdrawalSubTab}
                setWithdrawalSubTab={setWithdrawalSubTab}
                currentPage={currentPage}
                isExporting={isExporting}
                canExportData={canExportData}
                onApproveWithdrawal={handleApproveWithdrawal}
                onRejectWithdrawal={handleRejectWithdrawal}
                onExportCSV={() => handleExportCSV('withdrawals')}
                renderPagination={renderPagination}
              />
            )}

            {/* Fraud Tab */}
            {activeTab === 'fraud' && canViewFraudDetection && (
              <FraudTab
                fraudFlags={fraudFlags}
                users={users}
                orders={orders}
                listings={listings}
                activeDisputes={activeDisputes}
                userId={user?.id}
                isSuperAdmin={isSuperAdmin}
                onRefresh={refreshData}
              />
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'audit' && (
              <div className="relative z-10 pointer-events-auto">
                <AuditLogViewer currentAdminId={user?.id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AgreementModal
        isOpen={showAgreementModal}
        verification={selectedVerification}
        agreementAccepted={agreementAccepted}
        setAgreementAccepted={setAgreementAccepted}
        onAccept={handleAcceptAgreement}
        onClose={() => {
          setShowAgreementModal(false)
          setSelectedVerification(null)
          setAgreementAccepted(false)
        }}
      />

      <VerificationDetailsModal
        isOpen={showVerificationDetailsModal}
        verification={selectedVerification}
        onClose={() => {
          setShowVerificationDetailsModal(false)
          setSelectedVerification(null)
        }}
        onApprove={() => setVerificationDecisionModal('approve')}
        onReject={() => setVerificationDecisionModal('reject')}
      />

      <VerificationDecisionModal
        isOpen={!!verificationDecisionModal}
        decisionType={verificationDecisionModal}
        rejectionType={rejectionType}
        setRejectionType={setRejectionType}
        rejectionReason={verificationRejectionReason}
        setRejectionReason={setVerificationRejectionReason}
        adminNotes={verificationAdminNotes}
        setAdminNotes={setVerificationAdminNotes}
        resubmissionFields={resubmissionFields}
        setResubmissionFields={setResubmissionFields}
        resubmissionInstructions={resubmissionInstructions}
        setResubmissionInstructions={setResubmissionInstructions}
        onConfirm={verificationDecisionModal === 'approve' ? handleApproveVerification : handleRejectVerification}
        onClose={() => {
          setVerificationDecisionModal(null)
          setVerificationRejectionReason('')
          setVerificationAdminNotes('')
          setRejectionType('resubmission_required')
          setResubmissionFields([])
          setResubmissionInstructions('')
        }}
      />

      <ApproveWithdrawalModal
        isOpen={showApproveModal}
        transactionId={transactionId}
        setTransactionId={setTransactionId}
        notes={approveNotes}
        setNotes={setApproveNotes}
        onConfirm={confirmApproveWithdrawal}
        onClose={() => {
          setShowApproveModal(false)
          setApprovingWithdrawalId(null)
        }}
      />

      <RejectWithdrawalModal
        isOpen={showRejectModal}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onConfirm={confirmRejectWithdrawal}
        onClose={() => {
          setShowRejectModal(false)
          setRejectingWithdrawalId(null)
        }}
      />

      <FraudReviewModal
        isOpen={showFraudDetailsModal}
        flag={selectedFraudFlag}
        reviewStatus={fraudReviewStatus}
        setReviewStatus={setFraudReviewStatus}
        reviewNotes={fraudReviewNotes}
        setReviewNotes={setFraudReviewNotes}
        onConfirm={handleReviewFraudFlag}
        onClose={() => {
          setShowFraudDetailsModal(false)
          setSelectedFraudFlag(null)
          setFraudReviewNotes('')
        }}
      />
    </div>
    </>
  )
}