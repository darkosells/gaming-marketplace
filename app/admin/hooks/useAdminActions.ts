'use client'

import { createClient } from '@/lib/supabase'
import { logAdminActionSimple as logAdminAction } from '@/lib/auditLog'
import type { FraudFlag, AdminUser, AdminListing, AdminOrder, FRAUD_CONFIG } from '../types'

interface UseAdminActionsProps {
  userId: string
  profile: any
  users: AdminUser[]
  orders: AdminOrder[]
  listings: AdminListing[]
  activeDisputes: AdminOrder[]
  fraudFlags: FraudFlag[]
  isSuperAdmin: boolean
  // Refresh functions
  fetchUsers: () => Promise<void>
  fetchListings: () => Promise<void>
  fetchOrders: () => Promise<void>
  fetchDisputes: () => Promise<void>
  fetchReviews: () => Promise<void>
  fetchWithdrawals: () => Promise<void>
  fetchVerifications: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchFraudFlags: () => Promise<void>
}

// Helper function to send vendor status emails
async function sendVendorStatusEmail(
  type: 'vendor_approved' | 'vendor_rejected' | 'vendor_resubmission_required',
  data: {
    userEmail: string
    username: string
    rejectionReason?: string
    resubmissionFields?: string[]
    resubmissionInstructions?: string
  }
) {
  try {
    console.log('📧 Attempting to send vendor status email:', { type, data })
    
    const supabase = createClient()
    const { data: functionData, error } = await supabase.functions.invoke('send-order-email', {
      body: {
        type,
        userEmail: data.userEmail,
        username: data.username,
        rejectionReason: data.rejectionReason,
        resubmissionFields: data.resubmissionFields,
        resubmissionInstructions: data.resubmissionInstructions
      }
    })

    if (error) {
      console.error('❌ Failed to send vendor status email:', error)
      return false
    }

    console.log('✅ Vendor status email sent successfully:', functionData)
    return true
  } catch (error) {
    console.error('❌ Error sending vendor status email:', error)
    return false
  }
}

export function useAdminActions({
  userId,
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
}: UseAdminActionsProps) {
  const supabase = createClient()

  // Fraud Config
  const FRAUD_CONFIG = {
    MAX_FAILED_LOGINS: 5,
    MAX_DISPUTES_RATIO: 0.3,
    MIN_ACCOUNT_AGE_DAYS: 7,
    MAX_CHARGEBACKS: 2,
    SUSPICIOUS_PRICE_MULTIPLIER: 0.3,
    MAX_RAPID_ORDERS: 5,
    MIN_DELIVERY_TIME_MINUTES: 5
  }

  // User Actions
  const handleBanUser = async (id: string, isBanned: boolean) => {
    const reason = isBanned ? null : prompt('Ban reason:')
    if (!isBanned && !reason) return

    await supabase.from('profiles').update({
      is_banned: !isBanned,
      banned_at: !isBanned ? new Date().toISOString() : null,
      ban_reason: reason
    }).eq('id', id)

    await logAdminAction(userId, isBanned ? 'user_unbanned' : 'user_banned', `${isBanned ? 'Unbanned' : 'Banned'} user ${id}`)
    alert(`User ${isBanned ? 'unbanned' : 'banned'}`)
    fetchUsers()
  }

  // Listing Actions
  const handleDeleteListing = async (id: string) => {
    if (!confirm('Delete listing?')) return
    await supabase.from('listings').delete().eq('id', id)
    await logAdminAction(userId, 'listing_deleted', `Deleted listing ${id}`)
    alert('Listing deleted')
    fetchListings()
  }

  // Review Actions
  const handleSaveReview = async (reviewId: string, editedComment: string) => {
    await supabase.from('reviews').update({
      comment: editedComment.trim() || null,
      edited_by_admin: true,
      edited_at: new Date().toISOString()
    }).eq('id', reviewId)
    await logAdminAction(userId, 'review_edited', `Edited review ${reviewId}`)
    alert('Review updated')
    fetchReviews()
  }

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    await supabase.from('reviews').delete().eq('id', id)
    await logAdminAction(userId, 'review_deleted', `Deleted review ${id}`)
    alert('Review deleted')
    fetchReviews()
  }

  // Withdrawal Actions
  const handleApproveWithdrawal = async (withdrawalId: string, transactionId: string, notes: string) => {
    if (!transactionId.trim()) {
      alert('Transaction ID required')
      return false
    }
    await supabase.from('withdrawals').update({
      status: 'completed',
      processed_by: userId,
      processed_at: new Date().toISOString(),
      transaction_id: transactionId.trim(),
      admin_notes: notes.trim() || null
    }).eq('id', withdrawalId)
    await logAdminAction(userId, 'withdrawal_approved', `Approved withdrawal ${withdrawalId}`)
    alert('✅ Approved!')
    fetchWithdrawals()
    return true
  }

  const handleRejectWithdrawal = async (withdrawalId: string, reason: string) => {
  if (reason.trim().length < 5) {
    alert('Provide reason (min 5 chars)')
    return false
  }
  await supabase.from('withdrawals').update({
    status: 'rejected',
    processed_by: userId,
    processed_at: new Date().toISOString(),
    rejection_reason: reason.trim(),
    admin_notes: reason.trim()
  }).eq('id', withdrawalId)
  await logAdminAction(userId, 'withdrawal_rejected', `Rejected withdrawal ${withdrawalId}: ${reason.trim()}`)
  alert('❌ Rejected.')
  fetchWithdrawals()
  return true
}

  // Verification Actions
  const handleAcceptAgreement = async (verificationId: string) => {
    const { error } = await supabase.from('vendor_verifications').update({
      documents_viewed_by: userId,
      documents_viewed_at: new Date().toISOString()
    }).eq('id', verificationId)
    
    if (error) {
      console.error('Agreement error:', error)
      alert('Failed to record agreement.')
      return false
    }
    return true
  }

  const handleApproveVerification = async (verification: any, adminNotes: string) => {
    try {
      const { error: updateError } = await supabase.from('vendor_verifications').update({
        status: 'approved',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes.trim() || null
      }).eq('id', verification.id)

      if (updateError) throw updateError

      const { error: profileError } = await supabase.from('profiles').update({
        role: 'vendor',
        vendor_since: new Date().toISOString(),
        verified: true
      }).eq('id', verification.user_id)

      if (profileError) throw profileError

      await supabase.from('vendor_verifications').update({
        id_front_url: null,
        id_back_url: null,
        documents_cleared: true
      }).eq('id', verification.id)

      await logAdminAction(userId, 'vendor_verification_approved', `Approved verification for ${verification.user?.username}`)
      
      // DEBUG: Log what we have in verification.user
      console.log('🔍 DEBUG - Verification object:', verification)
      console.log('🔍 DEBUG - verification.user:', verification.user)
      console.log('🔍 DEBUG - verification.user?.email:', verification.user?.email)
      console.log('🔍 DEBUG - verification.user?.username:', verification.user?.username)
      
      // Send approval email notification
      if (verification.user?.email && verification.user?.username) {
        console.log('✅ Conditions met, sending approval email...')
        await sendVendorStatusEmail('vendor_approved', {
          userEmail: verification.user.email,
          username: verification.user.username
        })
      } else {
        console.log('❌ Email conditions NOT met - email or username missing')
      }
      
      alert('✅ Verification approved!')
      fetchVerifications()
      fetchUsers()
      return true
    } catch (error) {
      console.error('Approve error:', error)
      alert('Failed to approve.')
      return false
    }
  }

  const handleRejectVerification = async (
    verification: any,
    rejectionType: 'resubmission_required' | 'permanent',
    rejectionReason: string,
    adminNotes: string,
    resubmissionFields: string[],
    resubmissionInstructions: string
  ) => {
    try {
      let updateData: any = {
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        rejection_type: rejectionType,
        admin_notes: adminNotes.trim() || null,
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
        updateData.rejection_reason = rejectionReason.trim()
        updateData.resubmission_fields = null
        updateData.resubmission_instructions = null
      }

      const { error } = await supabase.from('vendor_verifications').update(updateData).eq('id', verification.id)
      if (error) throw error

      await logAdminAction(userId, 'vendor_verification_rejected', `Rejected verification for ${verification.user?.username} (${rejectionType})`)
      
      // DEBUG: Log what we have in verification.user
      console.log('🔍 DEBUG - Verification object:', verification)
      console.log('🔍 DEBUG - verification.user:', verification.user)
      console.log('🔍 DEBUG - verification.user?.email:', verification.user?.email)
      console.log('🔍 DEBUG - verification.user?.username:', verification.user?.username)
      
      // Send rejection or resubmission email notification
      if (verification.user?.email && verification.user?.username) {
        console.log('✅ Conditions met, sending rejection/resubmission email...')
        if (rejectionType === 'resubmission_required') {
          await sendVendorStatusEmail('vendor_resubmission_required', {
            userEmail: verification.user.email,
            username: verification.user.username,
            resubmissionFields: resubmissionFields,
            resubmissionInstructions: resubmissionInstructions.trim()
          })
        } else {
          await sendVendorStatusEmail('vendor_rejected', {
            userEmail: verification.user.email,
            username: verification.user.username,
            rejectionReason: rejectionReason.trim()
          })
        }
      } else {
        console.log('❌ Email conditions NOT met - email or username missing')
      }
      
      alert(rejectionType === 'permanent' ? '❌ Permanently rejected.' : '🔄 Resubmission requested.')
      fetchVerifications()
      return true
    } catch (error) {
      console.error('Reject error:', error)
      alert('Failed to reject. Check console for details.')
      return false
    }
  }

  // Dispute Actions
  const handleResolveDispute = async (orderId: string, resolution: 'buyer' | 'seller') => {
    const isBuyer = resolution === 'buyer'
    if (!confirm(isBuyer ? 'Refund buyer?' : 'Complete for seller?')) return

    const notes = prompt('Resolution notes (optional):')
    const newStatus = isBuyer ? 'refunded' : 'completed'

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, buyer:profiles!orders_buyer_id_fkey(username), seller:profiles!orders_seller_id_fkey(username)')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          completed_at: new Date().toISOString(),
          resolved_by: userId,
          resolution_notes: notes || null
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      const { data: convData } = await supabase
        .from('conversations')
        .select('id, listing_id')
        .eq('order_id', orderId)
        .single()

      if (convData) {
        const resolutionMessage = isBuyer
          ? `✅ DISPUTE RESOLVED - REFUNDED ✅\n\nThis dispute has been resolved in favor of the BUYER.\n\nThe order has been refunded and the buyer will receive their funds back.\n\nResolved by: ${profile.username}${notes ? `\n\nAdmin Notes: ${notes}` : ''}\n\nThis conversation is now closed.`
          : `✅ DISPUTE RESOLVED - COMPLETED ✅\n\nThis dispute has been resolved in favor of the SELLER.\n\nThe order has been marked as completed and the seller will receive their payment.\n\nResolved by: ${profile.username}${notes ? `\n\nAdmin Notes: ${notes}` : ''}\n\nThis conversation is now closed.`

        await supabase.from('messages').insert({
          conversation_id: convData.id,
          sender_id: userId,
          receiver_id: orderData.buyer_id,
          listing_id: convData.listing_id,
          order_id: orderId,
          content: resolutionMessage,
          message_type: 'system'
        })

        await supabase.from('conversations').update({
          last_message: isBuyer ? '✅ Dispute resolved - Buyer refunded' : '✅ Dispute resolved - Order completed',
          last_message_at: new Date().toISOString()
        }).eq('id', convData.id)
      }

      await logAdminAction(userId, 'dispute_resolved', `Resolved dispute ${orderId} in favor of ${resolution}`)
      alert(`✅ Resolved for ${resolution}`)
      fetchDisputes()
      fetchOrders()
    } catch (error) {
      console.error('Error resolving dispute:', error)
      alert('Failed to resolve dispute')
    }
  }

  // Notification Actions
  const handleMarkNotificationRead = async (id: string) => {
    await supabase.from('admin_notifications').update({ read: true }).eq('id', id)
    fetchNotifications()
  }

  const handleMarkAllNotificationsRead = async () => {
    await supabase.from('admin_notifications').update({ read: true }).eq('admin_id', userId).eq('read', false)
    fetchNotifications()
  }

  // Bulk Actions
  const handleBulkAction = async (action: string, selectedItems: string[], activeTab: string) => {
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
        await logAdminAction(userId, 'bulk_user_ban', `Banned ${selectedItems.length} users`)
        alert(`✅ Banned ${selectedItems.length} users`)
        fetchUsers()
      } else if (activeTab === 'listings' && action === 'delete') {
        await Promise.all(selectedItems.map(id =>
          supabase.from('listings').delete().eq('id', id)
        ))
        await logAdminAction(userId, 'bulk_listing_delete', `Deleted ${selectedItems.length} listings`)
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
        await logAdminAction(userId, 'bulk_order_refund', `Refunded ${selectedItems.length} orders`)
        alert(`✅ Refunded ${selectedItems.length} orders`)
        fetchOrders()
      }
      return true
    } catch (error) {
      console.error('Bulk action error:', error)
      alert('Failed to complete bulk action')
      return false
    }
  }

  // Fraud Detection Actions
  const createFraudFlag = async (
    targetUserId: string,
    type: FraudFlag['type'],
    severity: FraudFlag['severity'],
    description: string
  ) => {
    try {
      // Check if similar flag already exists
      const { data: existing } = await supabase
        .from('fraud_flags')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('type', type)
        .eq('status', 'active')
        .single()

      if (existing) return // Don't create duplicate active flags

      const { error } = await supabase
        .from('fraud_flags')
        .insert({
          user_id: targetUserId,
          type: type,
          severity,
          description,
          auto_detected: false,
          detection_source: 'manual_scan',
          status: 'active'
        })

      if (error) throw error

      await supabase.from('admin_notifications').insert({
        admin_id: userId,
        message: `🚨 New ${severity} fraud flag: ${description}`,
        type: 'fraud_flag',
        link: `/admin?tab=fraud`
      })

      await logAdminAction(userId, 'fraud_flag_created', `Created ${severity} ${type} flag for user ${targetUserId}`)
    } catch (error) {
      console.error('Error creating fraud flag:', error)
    }
  }

  const handleReviewFraudFlag = async (
    flagId: string,
    status: 'reviewed' | 'resolved' | 'false_positive',
    notes: string
  ) => {
    if (!isSuperAdmin) {
      alert('Only super admins can manage fraud flags')
      return false
    }

    try {
      const { error } = await supabase
        .from('fraud_flags')
        .update({
          status,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: notes
        })
        .eq('id', flagId)

      if (error) throw error

      await logAdminAction(userId, 'fraud_flag_reviewed', `Reviewed fraud flag ${flagId} as ${status}`)
      alert(`✅ Fraud flag marked as ${status}`)
      fetchFraudFlags()
      return true
    } catch (error) {
      console.error('Error reviewing fraud flag:', error)
      alert('Failed to update fraud flag')
      return false
    }
  }

  const checkForFraudPatterns = async () => {
    if (!isSuperAdmin) return

    try {
      for (const userProfile of users) {
        const userOrders = orders.filter(o => o.buyer_id === userProfile.id || o.seller_id === userProfile.id)
        const userDisputes = activeDisputes.filter(d => d.buyer_id === userProfile.id || d.seller_id === userProfile.id)
        const userListings = listings.filter(l => l.seller_id === userProfile.id)

        // Pattern 1: High dispute ratio
        if (userOrders.length >= 3) {
          const disputeRatio = userDisputes.length / userOrders.length
          if (disputeRatio > FRAUD_CONFIG.MAX_DISPUTES_RATIO) {
            await createFraudFlag(userProfile.id, 'multiple_disputes', 'high',
              `User has ${userDisputes.length} disputes out of ${userOrders.length} orders (${(disputeRatio * 100).toFixed(1)}% dispute rate)`)
          }
        }

        // Pattern 2: New account with high activity
        const accountAgeDays = (Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24)
        if (accountAgeDays < FRAUD_CONFIG.MIN_ACCOUNT_AGE_DAYS && userOrders.length > 10) {
          await createFraudFlag(userProfile.id, 'suspicious_activity', 'medium',
            `New account (${accountAgeDays.toFixed(0)} days old) with unusually high activity (${userOrders.length} orders)`)
        }

        // Pattern 3: Rapid transactions
        const recentOrders = userOrders.filter(o => {
          const orderTime = new Date(o.created_at).getTime()
          return Date.now() - orderTime < 60 * 60 * 1000
        })
        if (recentOrders.length >= FRAUD_CONFIG.MAX_RAPID_ORDERS) {
          await createFraudFlag(userProfile.id, 'rapid_transactions', 'high',
            `${recentOrders.length} orders placed within 1 hour`)
        }

        // Pattern 4: Suspiciously low pricing for sellers
        if (userListings.length > 0) {
          const gameListings: { [key: string]: number[] } = {}
          listings.forEach(l => {
            if (!gameListings[l.game]) gameListings[l.game] = []
            gameListings[l.game].push(parseFloat(l.price))
          })

          for (const listing of userListings) {
            const gamePrices = gameListings[listing.game] || []
            if (gamePrices.length >= 3) {
              const avgPrice = gamePrices.reduce((sum, p) => sum + p, 0) / gamePrices.length
              const listingPrice = parseFloat(listing.price)
              if (listingPrice < avgPrice * FRAUD_CONFIG.SUSPICIOUS_PRICE_MULTIPLIER) {
                await createFraudFlag(userProfile.id, 'low_pricing', 'medium',
                  `Listing "${listing.title}" priced at $${listingPrice} (${((listingPrice / avgPrice) * 100).toFixed(0)}% of market average $${avgPrice.toFixed(2)})`)
              }
            }
          }
        }

        // Pattern 5: Instant deliveries
        const instantDeliveries = userOrders.filter(o => {
          if (!o.delivered_at || o.seller_id !== userProfile.id) return false
          const deliveryTime = (new Date(o.delivered_at).getTime() - new Date(o.created_at).getTime()) / 1000 / 60
          return deliveryTime < FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES
        })
        if (instantDeliveries.length >= 3) {
          await createFraudFlag(userProfile.id, 'account_manipulation', 'medium',
            `${instantDeliveries.length} orders delivered in under ${FRAUD_CONFIG.MIN_DELIVERY_TIME_MINUTES} minutes (possible automation)`)
        }
      }
    } catch (error) {
      console.error('Error checking fraud patterns:', error)
    }
  }

  // Export Functions
  const exportToCSV = async (dataType: 'users' | 'orders' | 'listings' | 'disputes' | 'withdrawals' | 'fraud_flags', allData: any) => {
    try {
      let data: any[] = []
      let headers: string[] = []
      let filename = ''

      switch (dataType) {
        case 'users':
          headers = ['ID', 'Username', 'Email', 'Role', 'Rating', 'Total Sales', 'Created At', 'Is Banned']
          filename = 'users_export.csv'
          data = allData.users.map((u: any) => [
            u.id, u.username, u.email, u.role, u.rating, u.total_sales,
            new Date(u.created_at).toLocaleString(), u.is_banned ? 'Yes' : 'No'
          ])
          break
        case 'orders':
          headers = ['ID', 'Buyer', 'Seller', 'Amount', 'Status', 'Game', 'Created At', 'Completed At']
          filename = 'orders_export.csv'
          data = allData.orders.map((o: any) => [
            o.id, o.buyer?.username || 'Unknown', o.seller?.username || 'Unknown',
            o.amount, o.status, o.listing_game, new Date(o.created_at).toLocaleString(),
            o.completed_at ? new Date(o.completed_at).toLocaleString() : 'N/A'
          ])
          break
        case 'listings':
          headers = ['ID', 'Title', 'Game', 'Price', 'Stock', 'Status', 'Seller', 'Created At']
          filename = 'listings_export.csv'
          data = allData.listings.map((l: any) => [
            l.id, l.title, l.game, l.price, l.stock, l.status,
            l.profiles?.username || 'Unknown', new Date(l.created_at).toLocaleString()
          ])
          break
        case 'disputes':
          headers = ['Order ID', 'Buyer', 'Seller', 'Amount', 'Status', 'Reason', 'Opened At', 'Resolved At']
          filename = 'disputes_export.csv'
          const disputes = [...allData.activeDisputes, ...allData.solvedDisputes]
          data = disputes.map((d: any) => [
            d.id, d.buyer?.username || 'Unknown', d.seller?.username || 'Unknown',
            d.amount, d.status, d.dispute_reason || 'N/A',
            d.dispute_opened_at ? new Date(d.dispute_opened_at).toLocaleString() : 'N/A',
            d.completed_at ? new Date(d.completed_at).toLocaleString() : 'N/A'
          ])
          break
        case 'withdrawals':
          headers = ['ID', 'User', 'Amount', 'Net Amount', 'Method', 'Status', 'Created At', 'Processed At']
          filename = 'withdrawals_export.csv'
          const withdrawals = [...allData.pendingWithdrawals, ...allData.processedWithdrawals]
          data = withdrawals.map((w: any) => [
            w.id, w.user?.username || 'Unknown', w.amount, w.net_amount,
            w.method, w.status, new Date(w.created_at).toLocaleString(),
            w.processed_at ? new Date(w.processed_at).toLocaleString() : 'N/A'
          ])
          break
        case 'fraud_flags':
          headers = ['ID', 'User', 'Type', 'Severity', 'Description', 'Status', 'Auto Detected', 'Created At', 'Reviewed At']
          filename = 'fraud_flags_export.csv'
          data = allData.fraudFlags.map((f: any) => [
            f.id, f.user?.username || 'Unknown', f.type, f.severity,
            f.description, f.status, f.auto_detected ? 'Yes' : 'No',
            new Date(f.created_at).toLocaleString(),
            f.reviewed_at ? new Date(f.reviewed_at).toLocaleString() : 'N/A'
          ])
          break
      }

      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map((cell: any) => {
          const cellStr = String(cell || '').replace(/"/g, '""')
          return `"${cellStr}"`
        }).join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()

      await logAdminAction(userId, 'data_exported', `Exported ${dataType} data to CSV`)
      alert(`✅ ${filename} downloaded successfully`)
      return true
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
      return false
    }
  }

  return {
    // User Actions
    handleBanUser,
    
    // Listing Actions
    handleDeleteListing,
    
    // Review Actions
    handleSaveReview,
    handleDeleteReview,
    
    // Withdrawal Actions
    handleApproveWithdrawal,
    handleRejectWithdrawal,
    
    // Verification Actions
    handleAcceptAgreement,
    handleApproveVerification,
    handleRejectVerification,
    
    // Dispute Actions
    handleResolveDispute,
    
    // Notification Actions
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    
    // Bulk Actions
    handleBulkAction,
    
    // Fraud Actions
    createFraudFlag,
    handleReviewFraudFlag,
    checkForFraudPatterns,
    
    // Export
    exportToCSV
  }
}