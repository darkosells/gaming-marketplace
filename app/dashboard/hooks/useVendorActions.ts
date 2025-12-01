'use client'

import { useState, useCallback } from 'react'
import type { Listing, WithdrawalFees } from '../types'

// Generate human-readable reference number: WD-YYYYMMDD-XXXXXX
const generateReferenceNumber = (): string => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}${month}${day}`
  
  // Generate 6 character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `WD-${dateStr}-${code}`
}

// Modal types for withdrawal
export interface WithdrawalConfirmModal {
  isOpen: boolean
  amount: number
  method: 'bitcoin' | 'skrill'
  address: string
  fees: WithdrawalFees
}

export interface WithdrawalNotificationModal {
  isOpen: boolean
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  referenceNumber?: string
}

// ========== WITHDRAWAL ACTIONS ==========
export function useWithdrawalActions(
  user: any,
  netRevenue: number,
  fetchWithdrawals: (userId: string) => Promise<void>,
  supabase: any
) {
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bitcoin' | 'skrill' | ''>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false)
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState<WithdrawalConfirmModal>({
    isOpen: false,
    amount: 0,
    method: 'bitcoin',
    address: '',
    fees: { percentageFee: 0, flatFee: 0, totalFee: 0, netAmount: 0 }
  })
  
  const [notificationModal, setNotificationModal] = useState<WithdrawalNotificationModal>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    referenceNumber: undefined
  })

  const calculateWithdrawalFees = useCallback((amount: number, method: 'bitcoin' | 'skrill'): WithdrawalFees => {
    if (method === 'bitcoin') {
      const percentageFee = amount * 0.06
      const flatFee = 20
      const totalFee = percentageFee + flatFee
      const netAmount = amount - totalFee
      return { percentageFee, flatFee, totalFee, netAmount }
    } else {
      const percentageFee = amount * 0.05
      const flatFee = 1
      const totalFee = percentageFee + flatFee
      const netAmount = amount - totalFee
      return { percentageFee, flatFee, totalFee, netAmount }
    }
  }, [])

  const showNotification = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string,
    referenceNumber?: string
  ) => {
    setNotificationModal({
      isOpen: true,
      type,
      title,
      message,
      referenceNumber
    })
  }, [])

  const closeNotification = useCallback(() => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }, [])

  // Validate and show confirmation modal
  const handleWithdrawalSubmit = useCallback(async () => {
    if (!withdrawalMethod) {
      showNotification('warning', 'Method Required', 'Please select a withdrawal method.')
      return
    }

    const amount = parseFloat(withdrawalAmount)

    if (isNaN(amount) || amount <= 0) {
      showNotification('warning', 'Invalid Amount', 'Please enter a valid withdrawal amount.')
      return
    }

    if (withdrawalMethod === 'bitcoin' && amount < 100) {
      showNotification('warning', 'Minimum Not Met', 'Minimum withdrawal amount for Bitcoin is $100.')
      return
    }
    if (withdrawalMethod === 'skrill' && amount < 10) {
      showNotification('warning', 'Minimum Not Met', 'Minimum withdrawal amount for Skrill is $10.')
      return
    }

    if (amount > netRevenue) {
      showNotification('error', 'Insufficient Balance', `Your available balance is $${netRevenue.toFixed(2)}.`)
      return
    }

    if (!withdrawalAddress.trim()) {
      showNotification('warning', 'Address Required', `Please enter your ${withdrawalMethod === 'bitcoin' ? 'Bitcoin wallet address' : 'Skrill email'}.`)
      return
    }

    if (withdrawalMethod === 'bitcoin' && withdrawalAddress.length < 26) {
      showNotification('warning', 'Invalid Address', 'Please enter a valid Bitcoin wallet address.')
      return
    }

    if (withdrawalMethod === 'skrill' && !withdrawalAddress.includes('@')) {
      showNotification('warning', 'Invalid Email', 'Please enter a valid Skrill email address.')
      return
    }

    const fees = calculateWithdrawalFees(amount, withdrawalMethod)

    // Show confirmation modal
    setConfirmModal({
      isOpen: true,
      amount,
      method: withdrawalMethod,
      address: withdrawalAddress,
      fees
    })
  }, [withdrawalMethod, withdrawalAmount, withdrawalAddress, netRevenue, calculateWithdrawalFees, showNotification])

  // Actually process the withdrawal after confirmation
  const processWithdrawal = useCallback(async () => {
    setWithdrawalProcessing(true)
    closeConfirmModal()

    try {
      const referenceNumber = generateReferenceNumber()
      
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: confirmModal.amount,
          method: confirmModal.method,
          address: confirmModal.address,
          fee_percentage: confirmModal.method === 'bitcoin' ? 6 : 5,
          fee_flat: confirmModal.method === 'bitcoin' ? 20 : 1,
          fee_total: confirmModal.fees.totalFee,
          net_amount: confirmModal.fees.netAmount,
          status: 'pending',
          reference_number: referenceNumber
        })

      if (error) throw error

      showNotification(
        'success',
        'Withdrawal Submitted!',
        'Your request is now pending review. You will be notified once it is processed.',
        referenceNumber
      )

      setShowWithdrawalForm(false)
      setWithdrawalMethod('')
      setWithdrawalAmount('')
      setWithdrawalAddress('')
      await fetchWithdrawals(user.id)
    } catch (error: any) {
      console.error('Withdrawal error:', error)
      showNotification('error', 'Withdrawal Failed', error.message || 'An error occurred while processing your withdrawal.')
    } finally {
      setWithdrawalProcessing(false)
    }
  }, [confirmModal, user, supabase, fetchWithdrawals, closeConfirmModal, showNotification])

  const resetWithdrawalForm = useCallback(() => {
    setShowWithdrawalForm(false)
    setWithdrawalMethod('')
    setWithdrawalAmount('')
    setWithdrawalAddress('')
  }, [])

  return {
    showWithdrawalForm,
    setShowWithdrawalForm,
    withdrawalMethod,
    setWithdrawalMethod,
    withdrawalAmount,
    setWithdrawalAmount,
    withdrawalAddress,
    setWithdrawalAddress,
    withdrawalProcessing,
    calculateWithdrawalFees,
    handleWithdrawalSubmit,
    processWithdrawal,
    resetWithdrawalForm,
    // Modal states and controls
    confirmModal,
    closeConfirmModal,
    notificationModal,
    closeNotification,
    showNotification
  }
}

// ========== BULK ACTIONS ==========
export function useBulkActions(
  user: any,
  myListings: Listing[],
  displayedListings: Listing[],
  filteredListings: Listing[],
  fetchMyListings: (userId: string) => Promise<void>,
  supabase: any
) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<string>('')
  const [bulkStatusChange, setBulkStatusChange] = useState<string>('')
  const [bulkCategoryChange, setBulkCategoryChange] = useState<string>('')
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<string>('')
  const [bulkPricePercentage, setBulkPricePercentage] = useState<string>('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const toggleSelectListing = useCallback((listingId: string) => {
    setSelectedListings(prev => {
      const newSelected = new Set(prev)
      if (newSelected.has(listingId)) {
        newSelected.delete(listingId)
      } else {
        newSelected.add(listingId)
      }
      return newSelected
    })
  }, [])

  const selectAllDisplayedListings = useCallback(() => {
    const allDisplayedIds = new Set(displayedListings.map(l => l.id))
    setSelectedListings(allDisplayedIds)
  }, [displayedListings])

  const selectAllFilteredListings = useCallback(() => {
    const allFilteredIds = new Set(filteredListings.map(l => l.id))
    setSelectedListings(allFilteredIds)
  }, [filteredListings])

  const deselectAll = useCallback(() => {
    setSelectedListings(new Set())
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedListings(new Set())
  }, [])

  const exportListingsToCSV = useCallback((selectedIds: string[]) => {
    const selectedListingsData = myListings.filter(l => selectedIds.includes(l.id))

    const headers = ['Title', 'Game', 'Category', 'Price', 'Stock', 'Status', 'Delivery Type', 'Created At']
    const rows = selectedListingsData.map(listing => [
      listing.title,
      listing.game,
      listing.category,
      listing.price,
      listing.stock,
      listing.status,
      listing.delivery_type,
      new Date(listing.created_at).toLocaleDateString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listings-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, [myListings])

  const handleBulkAction = useCallback(async () => {
    if (selectedListings.size === 0) {
      alert('Please select at least one listing')
      return
    }

    if (!bulkActionType) {
      alert('Please select an action')
      return
    }

    const selectedIds = Array.from(selectedListings)

    if (bulkActionType === 'status' && !bulkStatusChange) {
      alert('Please select a status')
      return
    }

    if (bulkActionType === 'category' && !bulkCategoryChange) {
      alert('Please select a category')
      return
    }

    if (bulkActionType === 'price' && (!bulkPriceAdjustment || !bulkPricePercentage)) {
      alert('Please enter price adjustment details')
      return
    }

    const confirmMessage = `Are you sure you want to ${bulkActionType} ${selectedIds.length} listing(s)?`
    if (!confirm(confirmMessage)) return

    setBulkProcessing(true)

    try {
      if (bulkActionType === 'delete') {
        const { error } = await supabase
          .from('listings')
          .update({ status: 'removed' })
          .in('id', selectedIds)

        if (error) throw error
        alert(`✅ Successfully deleted ${selectedIds.length} listing(s)`)
      }

      if (bulkActionType === 'status') {
        const { error } = await supabase
          .from('listings')
          .update({ status: bulkStatusChange })
          .in('id', selectedIds)

        if (error) throw error
        alert(`✅ Successfully updated status for ${selectedIds.length} listing(s)`)
      }

      if (bulkActionType === 'category') {
        const { error } = await supabase
          .from('listings')
          .update({ category: bulkCategoryChange })
          .in('id', selectedIds)

        if (error) throw error
        alert(`✅ Successfully updated category for ${selectedIds.length} listing(s)`)
      }

      if (bulkActionType === 'price') {
        const percentage = parseFloat(bulkPricePercentage)
        if (isNaN(percentage)) {
          alert('Invalid percentage')
          setBulkProcessing(false)
          return
        }

        const selectedListingsData = myListings.filter(l => selectedIds.includes(l.id))

        for (const listing of selectedListingsData) {
          const currentPrice = parseFloat(listing.price)
          let newPrice = currentPrice

          if (bulkPriceAdjustment === 'increase') {
            newPrice = currentPrice * (1 + percentage / 100)
          } else {
            newPrice = currentPrice * (1 - percentage / 100)
          }

          newPrice = Math.max(0.01, newPrice)

          const { error } = await supabase
            .from('listings')
            .update({ price: newPrice.toFixed(2) })
            .eq('id', listing.id)

          if (error) throw error
        }

        alert(`✅ Successfully adjusted prices for ${selectedIds.length} listing(s)`)
      }

      if (bulkActionType === 'export') {
        exportListingsToCSV(selectedIds)
        alert(`✅ Successfully exported ${selectedIds.length} listing(s) to CSV`)
      }

      await fetchMyListings(user.id)

      exitSelectionMode()
      setShowBulkActions(false)
      setBulkActionType('')
      setBulkStatusChange('')
      setBulkCategoryChange('')
      setBulkPriceAdjustment('')
      setBulkPricePercentage('')

    } catch (error: any) {
      console.error('Bulk action error:', error)
      alert('Failed to perform bulk action: ' + error.message)
    } finally {
      setBulkProcessing(false)
    }
  }, [selectedListings, bulkActionType, bulkStatusChange, bulkCategoryChange, bulkPriceAdjustment, bulkPricePercentage, myListings, user, supabase, fetchMyListings, exitSelectionMode, exportListingsToCSV])

  const resetBulkActions = useCallback(() => {
    setShowBulkActions(false)
    setBulkActionType('')
    setBulkStatusChange('')
    setBulkCategoryChange('')
    setBulkPriceAdjustment('')
    setBulkPricePercentage('')
  }, [])

  return {
    selectionMode,
    setSelectionMode,
    selectedListings,
    showBulkActions,
    setShowBulkActions,
    bulkActionType,
    setBulkActionType,
    bulkStatusChange,
    setBulkStatusChange,
    bulkCategoryChange,
    setBulkCategoryChange,
    bulkPriceAdjustment,
    setBulkPriceAdjustment,
    bulkPricePercentage,
    setBulkPricePercentage,
    bulkProcessing,
    toggleSelectListing,
    selectAllDisplayedListings,
    selectAllFilteredListings,
    deselectAll,
    exitSelectionMode,
    handleBulkAction,
    resetBulkActions
  }
}