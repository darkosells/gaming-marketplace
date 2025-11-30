'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function VendorDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myListings, setMyListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [displayedListings, setDisplayedListings] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'balance' | 'inventory'>('listings')
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bitcoin' | 'skrill' | ''>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Infinite scroll states for Listings
  const [listingsDisplayCount, setListingsDisplayCount] = useState(20)
  const [isLoadingMoreListings, setIsLoadingMoreListings] = useState(false)
  const [hasMoreListings, setHasMoreListings] = useState(true)
  const listingsObserverTarget = useRef<HTMLDivElement>(null)

  // Infinite scroll states for Orders
  const [ordersDisplayCount, setOrdersDisplayCount] = useState(20)
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false)
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  const ordersObserverTarget = useRef<HTMLDivElement>(null)

  // Pagination states for Withdrawals only
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const withdrawalsPerPage = 5

  // Advanced Filter States for Listings
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGame, setFilterGame] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>('all')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [showFilters, setShowFilters] = useState(false)

  // ============ NEW: Order Filter States ============
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all')
  const [orderFilterGame, setOrderFilterGame] = useState<string>('all')
  const [orderFilterDeliveryType, setOrderFilterDeliveryType] = useState<string>('all')
  const [orderFilterPriceMin, setOrderFilterPriceMin] = useState('')
  const [orderFilterPriceMax, setOrderFilterPriceMax] = useState('')
  const [orderFilterDateFrom, setOrderFilterDateFrom] = useState('')
  const [orderFilterDateTo, setOrderFilterDateTo] = useState('')
  const [orderSortBy, setOrderSortBy] = useState<string>('newest')
  const [showOrderFilters, setShowOrderFilters] = useState(false)
  // ============ END NEW ============

  // Bulk Actions States
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedListings, setSelectedListings] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<string>('')
  const [bulkStatusChange, setBulkStatusChange] = useState<string>('')
  const [bulkCategoryChange, setBulkCategoryChange] = useState<string>('')
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState<string>('')
  const [bulkPricePercentage, setBulkPricePercentage] = useState<string>('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Inventory Management States
  const [inventoryStats, setInventoryStats] = useState({
    lowStock: [] as any[],
    outOfStock: [] as any[],
    overstocked: [] as any[],
    totalValue: 0,
    automaticDeliveryStats: {
      totalCodes: 0,
      usedCodes: 0,
      remainingCodes: 0,
      usageRate: 0
    }
  })
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out' | 'over'>('all')
  const [inventorySort, setInventorySort] = useState<'stock' | 'value' | 'usage'>('stock')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  // Apply filters whenever listings or filter states change
  useEffect(() => {
    applyFiltersAndSort()
  }, [myListings, searchQuery, filterGame, filterCategory, filterStatus, filterDeliveryType, filterPriceMin, filterPriceMax, filterDateRange, sortBy])

  // ============ NEW: Apply order filters ============
  useEffect(() => {
    applyOrderFiltersAndSort()
  }, [myOrders, orderSearchQuery, orderFilterStatus, orderFilterGame, orderFilterDeliveryType, orderFilterPriceMin, orderFilterPriceMax, orderFilterDateFrom, orderFilterDateTo, orderSortBy])
  // ============ END NEW ============

  // Update displayed listings when filtered listings or display count changes
  useEffect(() => {
    const newDisplayed = filteredListings.slice(0, listingsDisplayCount)
    setDisplayedListings(newDisplayed)
    setHasMoreListings(listingsDisplayCount < filteredListings.length)
  }, [filteredListings, listingsDisplayCount])

  // ============ MODIFIED: Update displayed orders from filtered orders ============
  useEffect(() => {
    const newDisplayed = filteredOrders.slice(0, ordersDisplayCount)
    setDisplayedOrders(newDisplayed)
    setHasMoreOrders(ordersDisplayCount < filteredOrders.length)
  }, [filteredOrders, ordersDisplayCount])
  // ============ END MODIFIED ============

  // Calculate Inventory Stats
  useEffect(() => {
    if (myListings.length > 0) {
      calculateInventoryStats()
    }
  }, [myListings, myOrders])

  // Intersection Observer for Listings infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreListings && !isLoadingMoreListings && activeTab === 'listings') {
          loadMoreListings()
        }
      },
      { threshold: 0.1 }
    )

    if (listingsObserverTarget.current) {
      observer.observe(listingsObserverTarget.current)
    }

    return () => {
      if (listingsObserverTarget.current) {
        observer.unobserve(listingsObserverTarget.current)
      }
    }
  }, [hasMoreListings, isLoadingMoreListings, listingsDisplayCount, filteredListings.length, activeTab])

  // Intersection Observer for Orders infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreOrders && !isLoadingMoreOrders && activeTab === 'orders') {
          loadMoreOrders()
        }
      },
      { threshold: 0.1 }
    )

    if (ordersObserverTarget.current) {
      observer.observe(ordersObserverTarget.current)
    }

    return () => {
      if (ordersObserverTarget.current) {
        observer.unobserve(ordersObserverTarget.current)
      }
    }
  }, [hasMoreOrders, isLoadingMoreOrders, ordersDisplayCount, filteredOrders.length, activeTab])

  const loadMoreListings = useCallback(() => {
    if (isLoadingMoreListings || !hasMoreListings) return

    setIsLoadingMoreListings(true)

    setTimeout(() => {
      setListingsDisplayCount(prev => prev + 20)
      setIsLoadingMoreListings(false)
    }, 300)
  }, [isLoadingMoreListings, hasMoreListings])

  const loadMoreOrders = useCallback(() => {
    if (isLoadingMoreOrders || !hasMoreOrders) return

    setIsLoadingMoreOrders(true)

    setTimeout(() => {
      setOrdersDisplayCount(prev => prev + 20)
      setIsLoadingMoreOrders(false)
    }, 300)
  }, [isLoadingMoreOrders, hasMoreOrders])

  const checkUser = async () => {
    try {
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      )

      const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any

      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 10000))
      ]) as any

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Failed to load profile. Please try again.')
        setLoading(false)
        return
      }

      setProfile(profileData)

      if (profileData?.role !== 'vendor') {
        router.push('/customer-dashboard')
        return
      }

      const results = await Promise.allSettled([
        fetchMyListings(user.id),
        fetchMyOrders(user.id),
        fetchWithdrawals(user.id)
      ])

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch data ${index}:`, result.reason)
        }
      })

      setLoading(false)
    } catch (error: any) {
      console.error('Check user error:', error)
      setLoading(false)

      if (error.message?.includes('timeout')) {
        setError('Connection timed out. Please refresh the page.')
      } else {
        router.push('/login')
      }
    }
  }

  const fetchMyListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch listings error:', error)
        return
      }

      setMyListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const fetchMyOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!buyer_id (
            username
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch orders error:', error)
        return
      }
      
      const mappedOrders = (data || []).map(order => ({
        ...order,
        listing: {
          title: order.listing_title || 'Unknown Item',
          game: order.listing_game || 'N/A',
          category: order.listing_category || 'account',
          image_url: order.listing_image_url
        }
      }))

      setMyOrders(mappedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const fetchWithdrawals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch withdrawals error:', error)
        return
      }

      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  // Calculate Inventory Stats
  const calculateInventoryStats = () => {
    const lowStock = myListings.filter(l => l.stock > 0 && l.stock < 5 && l.status === 'active')
    const outOfStock = myListings.filter(l => l.stock === 0 || l.status === 'out_of_stock')
    const overstocked = myListings.filter(l => l.stock > 50 && l.status === 'active')
    const totalValue = myListings.reduce((sum, l) => {
      if (l.status !== 'removed') {
        return sum + (l.stock * parseFloat(l.price))
      }
      return sum
    }, 0)

    const automaticListings = myListings.filter(l => l.delivery_type === 'automatic')
    const totalCodes = automaticListings.reduce((sum, l) => sum + l.stock, 0)
    const automaticListingIds = automaticListings.map(l => l.id)
    const usedCodes = myOrders.filter(o =>
      automaticListingIds.includes(o.listing_id) &&
      (o.status === 'completed' || o.status === 'delivered')
    ).length

    const remainingCodes = totalCodes - usedCodes
    const usageRate = totalCodes > 0 ? ((usedCodes / totalCodes) * 100) : 0

    setInventoryStats({
      lowStock,
      outOfStock,
      overstocked,
      totalValue,
      automaticDeliveryStats: {
        totalCodes,
        usedCodes,
        remainingCodes,
        usageRate
      }
    })
  }

  // Get filtered inventory listings
  const getFilteredInventory = () => {
    let filtered = [...myListings]

    switch (inventoryFilter) {
      case 'low':
        filtered = inventoryStats.lowStock
        break
      case 'out':
        filtered = inventoryStats.outOfStock
        break
      case 'over':
        filtered = inventoryStats.overstocked
        break
      default:
        filtered = myListings.filter(l => l.status !== 'removed')
    }

    switch (inventorySort) {
      case 'stock':
        filtered.sort((a, b) => a.stock - b.stock)
        break
      case 'value':
        filtered.sort((a, b) => (b.stock * parseFloat(b.price)) - (a.stock * parseFloat(a.price)))
        break
      case 'usage':
        filtered.sort((a, b) => {
          if (a.delivery_type === 'automatic' && b.delivery_type === 'automatic') {
            const aOrders = myOrders.filter(o => o.listing_id === a.id && (o.status === 'completed' || o.status === 'delivered')).length
            const bOrders = myOrders.filter(o => o.listing_id === b.id && (o.status === 'completed' || o.status === 'delivered')).length
            const aRate = a.stock > 0 ? aOrders / a.stock : 0
            const bRate = b.stock > 0 ? bOrders / b.stock : 0
            return bRate - aRate
          }
          return 0
        })
        break
    }

    return filtered
  }

  // Advanced filtering and sorting logic for Listings
  const applyFiltersAndSort = () => {
    let filtered = [...myListings]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(query) ||
        listing.game.toLowerCase().includes(query) ||
        listing.category.toLowerCase().includes(query)
      )
    }

    if (filterGame !== 'all') {
      filtered = filtered.filter(listing => listing.game === filterGame)
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === filterCategory)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(listing => listing.status === filterStatus)
    }

    if (filterDeliveryType !== 'all') {
      filtered = filtered.filter(listing => listing.delivery_type === filterDeliveryType)
    }

    if (filterPriceMin) {
      const minPrice = parseFloat(filterPriceMin)
      filtered = filtered.filter(listing => parseFloat(listing.price) >= minPrice)
    }
    if (filterPriceMax) {
      const maxPrice = parseFloat(filterPriceMax)
      filtered = filtered.filter(listing => parseFloat(listing.price) <= maxPrice)
    }

    if (filterDateRange !== 'all') {
      const now = new Date()
      const daysAgo = filterDateRange === '7days' ? 7 : filterDateRange === '30days' ? 30 : 90
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(listing => new Date(listing.created_at) >= cutoffDate)
    }

    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case 'stock_high':
        filtered.sort((a, b) => b.stock - a.stock)
        break
      case 'stock_low':
        filtered.sort((a, b) => a.stock - b.stock)
        break
      default:
        break
    }

    setFilteredListings(filtered)
    setListingsDisplayCount(20)
  }

  // ============ NEW: Order filtering and sorting logic ============
  const applyOrderFiltersAndSort = () => {
    let filtered = [...myOrders]

    // Search filter (Order ID, Buyer username, Game)
    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.buyer?.username?.toLowerCase().includes(query) ||
        order.listing?.game?.toLowerCase().includes(query) ||
        order.listing?.title?.toLowerCase().includes(query) ||
        order.listing_title?.toLowerCase().includes(query) ||
        order.listing_game?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (orderFilterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilterStatus)
    }

    // Game filter
    if (orderFilterGame !== 'all') {
      filtered = filtered.filter(order => 
        order.listing?.game === orderFilterGame || 
        order.listing_game === orderFilterGame
      )
    }

    // Delivery type filter
    if (orderFilterDeliveryType !== 'all') {
      filtered = filtered.filter(order => order.delivery_type === orderFilterDeliveryType)
    }

    // Price range filter
    if (orderFilterPriceMin) {
      const minPrice = parseFloat(orderFilterPriceMin)
      filtered = filtered.filter(order => parseFloat(order.amount) >= minPrice)
    }
    if (orderFilterPriceMax) {
      const maxPrice = parseFloat(orderFilterPriceMax)
      filtered = filtered.filter(order => parseFloat(order.amount) <= maxPrice)
    }

    // Date range filter
    if (orderFilterDateFrom) {
      const fromDate = new Date(orderFilterDateFrom)
      fromDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(order => new Date(order.created_at) >= fromDate)
    }
    if (orderFilterDateTo) {
      const toDate = new Date(orderFilterDateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(order => new Date(order.created_at) <= toDate)
    }

    // Sorting
    switch (orderSortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        break
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
        break
      default:
        break
    }

    setFilteredOrders(filtered)
    setOrdersDisplayCount(20)
  }

  // Get unique games from orders
  const uniqueOrderGames = Array.from(new Set(myOrders.map(o => o.listing?.game || o.listing_game).filter(Boolean))).sort()

  // Clear order filters
  const clearOrderFilters = () => {
    setOrderSearchQuery('')
    setOrderFilterStatus('all')
    setOrderFilterGame('all')
    setOrderFilterDeliveryType('all')
    setOrderFilterPriceMin('')
    setOrderFilterPriceMax('')
    setOrderFilterDateFrom('')
    setOrderFilterDateTo('')
    setOrderSortBy('newest')
  }

  // Count active order filters
  const activeOrderFilterCount = [
    orderSearchQuery,
    orderFilterStatus !== 'all',
    orderFilterGame !== 'all',
    orderFilterDeliveryType !== 'all',
    orderFilterPriceMin,
    orderFilterPriceMax,
    orderFilterDateFrom,
    orderFilterDateTo
  ].filter(Boolean).length

  // Export orders to CSV
  const exportOrdersToCSV = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : myOrders
    
    if (ordersToExport.length === 0) {
      alert('No orders to export')
      return
    }

    const headers = [
      'Order ID',
      'Date',
      'Buyer',
      'Item Title',
      'Game',
      'Category',
      'Delivery Type',
      'Gross Amount',
      'Platform Fee (5%)',
      'Net Earnings',
      'Status'
    ]

    const rows = ordersToExport.map(order => {
      const grossAmount = parseFloat(order.amount)
      const platformFee = grossAmount * 0.05
      const netEarnings = grossAmount * 0.95
      
      return [
        order.id,
        new Date(order.created_at).toLocaleString(),
        order.buyer?.username || 'Unknown',
        order.listing?.title || order.listing_title || 'Unknown Item',
        order.listing?.game || order.listing_game || 'N/A',
        order.listing?.category || order.listing_category || 'N/A',
        order.delivery_type || 'manual',
        `$${grossAmount.toFixed(2)}`,
        `$${platformFee.toFixed(2)}`,
        `$${netEarnings.toFixed(2)}`,
        order.status
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    alert(`✅ Successfully exported ${ordersToExport.length} orders to CSV`)
  }
  // ============ END NEW ============

  // Get unique games from listings
  const uniqueGames = Array.from(new Set(myListings.map(l => l.game))).sort()

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setFilterGame('all')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterDeliveryType('all')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setFilterDateRange('all')
    setSortBy('newest')
  }

  // Count active filters
  const activeFilterCount = [
    searchQuery,
    filterGame !== 'all',
    filterCategory !== 'all',
    filterStatus !== 'all',
    filterDeliveryType !== 'all',
    filterPriceMin,
    filterPriceMax,
    filterDateRange !== 'all'
  ].filter(Boolean).length
// Bulk Actions Functions
  const toggleSelectListing = (listingId: string) => {
    const newSelected = new Set(selectedListings)
    if (newSelected.has(listingId)) {
      newSelected.delete(listingId)
    } else {
      newSelected.add(listingId)
    }
    setSelectedListings(newSelected)
  }

  const selectAllDisplayedListings = () => {
    const allDisplayedIds = new Set(displayedListings.map(l => l.id))
    setSelectedListings(allDisplayedIds)
  }

  const selectAllFilteredListings = () => {
    const allFilteredIds = new Set(filteredListings.map(l => l.id))
    setSelectedListings(allFilteredIds)
  }

  const deselectAll = () => {
    setSelectedListings(new Set())
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedListings(new Set())
  }

  const handleBulkAction = async () => {
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
  }

  const exportListingsToCSV = (selectedIds: string[]) => {
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
  }

  const calculateWithdrawalFees = (amount: number, method: 'bitcoin' | 'skrill') => {
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
  }

  const handleWithdrawalSubmit = async () => {
    if (!withdrawalMethod) {
      alert('Please select a withdrawal method')
      return
    }

    const amount = parseFloat(withdrawalAmount)

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (withdrawalMethod === 'bitcoin' && amount < 100) {
      alert('Minimum withdrawal amount for Bitcoin is $100')
      return
    }
    if (withdrawalMethod === 'skrill' && amount < 10) {
      alert('Minimum withdrawal amount for Skrill is $10')
      return
    }

    if (amount > netRevenue) {
      alert(`Insufficient balance. Your available balance is $${netRevenue.toFixed(2)}`)
      return
    }

    if (!withdrawalAddress.trim()) {
      alert(`Please enter your ${withdrawalMethod === 'bitcoin' ? 'Bitcoin wallet address' : 'Skrill email'}`)
      return
    }

    if (withdrawalMethod === 'bitcoin' && withdrawalAddress.length < 26) {
      alert('Please enter a valid Bitcoin wallet address')
      return
    }

    if (withdrawalMethod === 'skrill' && !withdrawalAddress.includes('@')) {
      alert('Please enter a valid Skrill email address')
      return
    }

    const fees = calculateWithdrawalFees(amount, withdrawalMethod)

    const confirmMessage = `Withdrawal Summary:
    
Amount: $${amount.toFixed(2)}
Method: ${withdrawalMethod === 'bitcoin' ? 'Bitcoin' : 'Skrill'}
${withdrawalMethod === 'bitcoin' ? 'Wallet Address' : 'Skrill Email'}: ${withdrawalAddress}

Fees:
- ${withdrawalMethod === 'bitcoin' ? '6%' : '5%'} fee: $${fees.percentageFee.toFixed(2)}
- Flat fee: $${fees.flatFee.toFixed(2)}
- Total fees: $${fees.totalFee.toFixed(2)}

You will receive: $${fees.netAmount.toFixed(2)}

Proceed with withdrawal?`

    if (!confirm(confirmMessage)) return

    setWithdrawalProcessing(true)

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          method: withdrawalMethod,
          address: withdrawalAddress,
          fee_percentage: withdrawalMethod === 'bitcoin' ? 6 : 5,
          fee_flat: withdrawalMethod === 'bitcoin' ? 20 : 1,
          fee_total: fees.totalFee,
          net_amount: fees.netAmount,
          status: 'pending'
        })

      if (error) throw error

      alert('✅ Withdrawal request submitted successfully!\n\nYour request is now pending review. You will be notified once it is processed.')

      setShowWithdrawalForm(false)
      setWithdrawalMethod('')
      setWithdrawalAmount('')
      setWithdrawalAddress('')
      await fetchWithdrawals(user.id)
    } catch (error: any) {
      console.error('Withdrawal error:', error)
      alert('Failed to submit withdrawal request: ' + error.message)
    } finally {
      setWithdrawalProcessing(false)
    }
  }

  const goToWithdrawalsPage = (page: number) => {
    setWithdrawalsPage(page)
    document.getElementById('withdrawals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading dashboard...</p>
          <p className="text-gray-500 mt-2 text-sm">This should only take a moment</p>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be a vendor to access this page.</p>
          <Link href="/customer-dashboard" className="text-purple-400 hover:text-purple-300 transition">
            Go to Customer Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  const activeListings = myListings.filter(l => l.status === 'active')
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0)
  const totalCommission = grossRevenue * 0.05
  const totalEarnings = grossRevenue * 0.95
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0)
  const netRevenue = totalEarnings - totalWithdrawn
  const pendingOrders = myOrders.filter(o =>
    o.status === 'paid' ||
    o.status === 'delivered' ||
    o.status === 'dispute_raised'
  )
  const pendingEarnings = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.amount) * 0.95), 0)

  const totalWithdrawalsPages = Math.ceil(withdrawals.length / withdrawalsPerPage)
  const startWithdrawalsIndex = (withdrawalsPage - 1) * withdrawalsPerPage
  const endWithdrawalsIndex = startWithdrawalsIndex + withdrawalsPerPage
  const paginatedWithdrawals = withdrawals.slice(startWithdrawalsIndex, endWithdrawalsIndex)

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* 2D Comic Space Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>

        {/* Stars - Hidden on mobile for performance */}
        <div className="hidden sm:block">
          <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
          <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
          <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
          <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
          <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
          <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        </div>

        {/* Planets - Hidden on mobile */}
        <div className="hidden lg:block absolute top-[15%] right-[10%] group">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="hidden lg:block absolute bottom-[20%] left-[8%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
          </div>
        </div>

        {/* Floating Particles - Hidden on mobile */}
        <div className="hidden sm:block">
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
          <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>⚡</span>
                Bulk Actions
              </h2>
              <button
                onClick={() => setShowBulkActions(false)}
                className="text-gray-400 hover:text-white transition p-2"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <p className="text-purple-300 text-sm">
                <span className="font-bold">{selectedListings.size}</span> listing(s) selected
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Select Action</label>
                <select
                  value={bulkActionType}
                  onChange={(e) => setBulkActionType(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">Choose action...</option>
                  <option value="status">Change Status</option>
                  <option value="category">Change Category</option>
                  <option value="price">Adjust Prices</option>
                  <option value="delete">Delete Listings</option>
                  <option value="export">Export to CSV</option>
                </select>
              </div>

              {bulkActionType === 'status' && (
                <div>
                  <label className="block text-white font-semibold mb-2">New Status</label>
                  <select
                    value={bulkStatusChange}
                    onChange={(e) => setBulkStatusChange(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">Select status...</option>
                    <option value="active">Active</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              )}

              {bulkActionType === 'category' && (
                <div>
                  <label className="block text-white font-semibold mb-2">New Category</label>
                  <select
                    value={bulkCategoryChange}
                    onChange={(e) => setBulkCategoryChange(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="">Select category...</option>
                    <option value="account">Account</option>
                    <option value="currency">Currency</option>
                    <option value="key">Key</option>
                  </select>
                </div>
              )}

              {bulkActionType === 'price' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Adjustment Type</label>
                    <select
                      value={bulkPriceAdjustment}
                      onChange={(e) => setBulkPriceAdjustment(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value="">Select adjustment...</option>
                      <option value="increase">Increase by %</option>
                      <option value="decrease">Decrease by %</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Percentage</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={bulkPricePercentage}
                      onChange={(e) => setBulkPricePercentage(e.target.value)}
                      placeholder="e.g., 10 for 10%"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => setShowBulkActions(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAction}
                  disabled={bulkProcessing || !bulkActionType}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    'Apply Action'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section - Mobile Optimized */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-block mb-3 sm:mb-4">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
                      🏪 Vendor Portal
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Vendor Dashboard</span>
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base">
                    Welcome back, <span className="text-white font-semibold">{profile?.username}</span>! Manage your listings and sales here.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.verified && (
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold border border-blue-500/30 flex items-center gap-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified Seller
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg sm:text-xl lg:text-2xl">💰</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Available</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                  ${netRevenue.toFixed(2)}
                </div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Available Balance</div>
                {totalCommission > 0 && (
                  <div className="text-[10px] sm:text-xs text-orange-400 mt-1 sm:mt-2 bg-orange-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:block">
                    Platform fee: ${totalCommission.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Active</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{activeListings.length}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Active Listings</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg sm:text-xl lg:text-2xl">⏳</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Pending</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{pendingOrders.length}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Pending Orders</div>
                <div className="text-[10px] sm:text-xs text-yellow-400 mt-1 sm:mt-2 bg-yellow-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:block">
                  ${pendingEarnings.toFixed(2)} on hold
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-lg sm:text-xl lg:text-2xl">✅</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Total</span>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{completedOrders.length}</div>
                <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Completed Sales</div>
              </div>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <Link
                href="/sell"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                  <span className="text-xl sm:text-2xl lg:text-3xl">📝</span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Create Listing</h3>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">List a new item for sale on the marketplace</p>
              </Link>
              <Link
                href="/messages"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                  <span className="text-xl sm:text-2xl lg:text-3xl">💬</span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Messages</h3>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">Chat with your buyers and manage orders</p>
              </Link>
              <Link
                href="/browse"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 group-hover:scale-110 transition-transform mx-auto sm:mx-0">
                  <span className="text-xl sm:text-2xl lg:text-3xl">🎮</span>
                </div>
                <h3 className="text-sm sm:text-base lg:text-xl font-bold text-white mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors text-center sm:text-left">Browse</h3>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm hidden sm:block">Explore the marketplace and see competition</p>
              </Link>
            </div>

            {/* Main Content Tabs - Mobile Optimized */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-6 sm:mb-8 border-b border-white/10 pb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'listings'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  📦 <span className="hidden sm:inline">My </span>Listings ({myListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'orders'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  🛒 <span className="hidden sm:inline">My </span>Orders ({myOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('balance')}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'balance'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  💰 <span className="hidden sm:inline">Balance</span><span className="sm:hidden">$</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm lg:text-base whitespace-nowrap ${activeTab === 'inventory'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  📊 Inventory
                </button>
              </div>
{/* Listings Tab with Infinite Scroll */}
              {activeTab === 'listings' && (
                <div id="listings-section">
                  {/* Header with Bulk Actions and Selection Mode */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">📦</span>
                        My Listings
                      </h2>
                      {filteredListings.length > 0 && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          Showing {displayedListings.length} of {filteredListings.length} listings
                          {filteredListings.length !== myListings.length && (
                            <span className="text-purple-400"> (filtered from {myListings.length} total)</span>
                          )}
                          {selectionMode && selectedListings.size > 0 && (
                            <span className="text-purple-400"> • {selectedListings.size} selected</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                      {!selectionMode ? (
                        <>
                          {displayedListings.length > 0 && (
                            <button
                              onClick={() => setSelectionMode(true)}
                              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                            >
                              <span>☑️</span>
                              <span className="hidden sm:inline">Select Multiple</span>
                              <span className="sm:hidden">Select</span>
                            </button>
                          )}
                          <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${showFilters
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                              }`}
                          >
                            <span className="text-base sm:text-lg">🔍</span>
                            Filters
                            {activeFilterCount > 0 && (
                              <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{activeFilterCount}</span>
                            )}
                          </button>
                          <Link
                            href="/sell"
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                          >
                            + <span className="hidden sm:inline">Create </span>Listing
                          </Link>
                        </>
                      ) : (
                        <>
                          {selectedListings.size === 0 ? (
                            <>
                              <button
                                onClick={selectAllDisplayedListings}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 text-xs sm:text-sm"
                              >
                                Select Displayed ({displayedListings.length})
                              </button>
                              <button
                                onClick={selectAllFilteredListings}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-all duration-300 text-xs sm:text-sm hidden sm:block"
                              >
                                Select All ({filteredListings.length})
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={deselectAll}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-all duration-300 text-xs sm:text-sm"
                              >
                                Deselect All
                              </button>
                              <button
                                onClick={() => setShowBulkActions(true)}
                                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-orange-500/50 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                              >
                                <span>⚡</span>
                                Bulk ({selectedListings.size})
                              </button>
                            </>
                          )}
                          <button
                            onClick={exitSelectionMode}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all duration-300 text-xs sm:text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Advanced Filter Panel - Mobile Optimized */}
                  {showFilters && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔍 Search</label>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by title, game, or category..."
                          className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🎮 Game</label>
                          <select
                            value={filterGame}
                            onChange={(e) => setFilterGame(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Games</option>
                            {uniqueGames.map(game => (
                              <option key={game} value={game}>{game}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📂 Category</label>
                          <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Categories</option>
                            <option value="account">Accounts</option>
                            <option value="currency">Currency</option>
                            <option value="key">Keys</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📊 Status</label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="out_of_stock">Out of Stock</option>
                            <option value="draft">Draft</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🚚 Delivery</label>
                          <select
                            value={filterDeliveryType}
                            onChange={(e) => setFilterDeliveryType(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Types</option>
                            <option value="automatic">Automatic</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Min Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={filterPriceMin}
                            onChange={(e) => setFilterPriceMin(e.target.value)}
                            placeholder="$ 0.00"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Max Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={filterPriceMax}
                            onChange={(e) => setFilterPriceMax(e.target.value)}
                            placeholder="$ 999.99"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 Date Added</label>
                          <select
                            value={filterDateRange}
                            onChange={(e) => setFilterDateRange(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Time</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔢 Sort By</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="stock_high">Stock: High to Low</option>
                            <option value="stock_low">Stock: Low to High</option>
                          </select>
                        </div>
                      </div>

                      {activeFilterCount > 0 && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={clearFilters}
                            className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border border-red-500/30 flex items-center gap-2"
                          >
                            <span>✕</span>
                            Clear All Filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Listings Grid - Mobile Optimized */}
                  {filteredListings.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="text-5xl sm:text-6xl mb-4">{myListings.length === 0 ? '📦' : '🔍'}</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {myListings.length === 0 ? 'No listings yet' : 'No listings match your filters'}
                      </h3>
                      <p className="text-gray-400 mb-6 text-sm sm:text-base">
                        {myListings.length === 0
                          ? 'Create your first listing to start selling!'
                          : 'Try adjusting your filters to see more results'}
                      </p>
                      {myListings.length === 0 ? (
                        <Link
                          href="/sell"
                          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                        >
                          Create Listing
                        </Link>
                      ) : (
                        <button
                          onClick={clearFilters}
                          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        {displayedListings.map((listing) => (
                          <div key={listing.id} className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group relative">
                            {selectionMode && (
                              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
                                <input
                                  type="checkbox"
                                  checked={selectedListings.has(listing.id)}
                                  onChange={() => toggleSelectListing(listing.id)}
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-white/30 bg-slate-900/80 checked:bg-purple-500 checked:border-purple-500 cursor-pointer transition-all"
                                />
                              </div>
                            )}

                            <div className="relative h-28 sm:h-36 lg:h-44 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                              {listing.image_url ? (
                                <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl group-hover:scale-125 transition-transform duration-300">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                                </div>
                              )}
                              <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    listing.status === 'sold' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                      listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                        'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                  {listing.status === 'out_of_stock' ? 'OOS' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </span>
                              </div>
                              {listing.delivery_type === 'automatic' && (
                                <div className={`absolute ${selectionMode ? 'bottom-2 sm:bottom-3 left-2 sm:left-3' : 'top-2 sm:top-3 left-2 sm:left-3'}`}>
                                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    ⚡ Auto
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 sm:p-4">
                              <h3 className="text-white font-semibold mb-1 truncate group-hover:text-purple-300 transition text-sm sm:text-base">{listing.title}</h3>
                              <p className="text-xs sm:text-sm text-purple-400 mb-2 sm:mb-3">{listing.game}</p>
                              <div className="flex justify-between items-center mb-3 sm:mb-4">
                                <div>
                                  <span className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${listing.price}</span>
                                  <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">You earn: ${(listing.price * 0.95).toFixed(2)}</p>
                                </div>
                                <span className="text-xs sm:text-sm text-gray-400 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                                  Stock: {listing.stock}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Link
                                  href={`/listing/${listing.id}`}
                                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all duration-300 border border-purple-500/30"
                                >
                                  View
                                </Link>
                                <Link
                                  href={`/listing/${listing.id}/edit`}
                                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-center transition-all duration-300 border border-blue-500/30"
                                >
                                  Edit
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {hasMoreListings && (
                        <div ref={listingsObserverTarget} className="flex justify-center py-6 sm:py-8">
                          {isLoadingMoreListings ? (
                            <div className="flex items-center gap-3 text-purple-400">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs sm:text-sm font-semibold">Loading more listings...</span>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs sm:text-sm">Scroll for more</div>
                          )}
                        </div>
                      )}

                      {!hasMoreListings && displayedListings.length > 20 && (
                        <div className="text-center py-6 sm:py-8">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-gray-400 text-xs sm:text-sm">
                            <span>✓</span>
                            You've reached the end of your listings
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ============ ENHANCED ORDERS TAB ============ */}
              {activeTab === 'orders' && (
                <div id="orders-section">
                  {/* Header with Filter Toggle and Export */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">🛒</span>
                        My Orders
                      </h2>
                      {filteredOrders.length > 0 && (
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          Showing {displayedOrders.length} of {filteredOrders.length} orders
                          {filteredOrders.length !== myOrders.length && (
                            <span className="text-purple-400"> (filtered from {myOrders.length} total)</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
                      <button
                        onClick={() => setShowOrderFilters(!showOrderFilters)}
                        className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${showOrderFilters
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                      >
                        <span className="text-base sm:text-lg">🔍</span>
                        Filters
                        {activeOrderFilterCount > 0 && (
                          <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs">{activeOrderFilterCount}</span>
                        )}
                      </button>
                      <button
                        onClick={exportOrdersToCSV}
                        disabled={myOrders.length === 0}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>📥</span>
                        <span className="hidden sm:inline">Export CSV</span>
                        <span className="sm:hidden">Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Order Filter Panel - NEW */}
                  {showOrderFilters && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
                      {/* Search Bar */}
                      <div>
                        <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔍 Search Orders</label>
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          placeholder="Search by Order ID, buyer username, game, or item..."
                          className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Status Filter */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📊 Status</label>
                          <select
                            value={orderFilterStatus}
                            onChange={(e) => setOrderFilterStatus(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="delivered">Delivered</option>
                            <option value="completed">Completed</option>
                            <option value="dispute_raised">Dispute</option>
                            <option value="refunded">Refunded</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Game Filter */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🎮 Game</label>
                          <select
                            value={orderFilterGame}
                            onChange={(e) => setOrderFilterGame(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Games</option>
                            {uniqueOrderGames.map(game => (
                              <option key={game} value={game}>{game}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delivery Type Filter */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🚚 Delivery</label>
                          <select
                            value={orderFilterDeliveryType}
                            onChange={(e) => setOrderFilterDeliveryType(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="all">All Types</option>
                            <option value="automatic">Automatic</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>

                        {/* Sort By */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">🔢 Sort By</label>
                          <select
                            value={orderSortBy}
                            onChange={(e) => setOrderSortBy(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="price_low">Price: Low to High</option>
                          </select>
                        </div>

                        {/* Min Price */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Min Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orderFilterPriceMin}
                            onChange={(e) => setOrderFilterPriceMin(e.target.value)}
                            placeholder="$ 0.00"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          />
                        </div>

                        {/* Max Price */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">💵 Max Price</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={orderFilterPriceMax}
                            onChange={(e) => setOrderFilterPriceMax(e.target.value)}
                            placeholder="$ 999.99"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm"
                          />
                        </div>

                        {/* Date From */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 From Date</label>
                          <input
                            type="date"
                            value={orderFilterDateFrom}
                            onChange={(e) => setOrderFilterDateFrom(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm [color-scheme:dark]"
                          />
                        </div>

                        {/* Date To */}
                        <div>
                          <label className="block text-white font-semibold mb-2 text-xs sm:text-sm">📅 To Date</label>
                          <input
                            type="date"
                            value={orderFilterDateTo}
                            onChange={(e) => setOrderFilterDateTo(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all text-sm [color-scheme:dark]"
                          />
                        </div>
                      </div>

                      {activeOrderFilterCount > 0 && (
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={clearOrderFilters}
                            className="px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 border border-red-500/30 flex items-center gap-2"
                          >
                            <span>✕</span>
                            Clear All Filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Orders List - Mobile Optimized */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <div className="text-5xl sm:text-6xl mb-4">{myOrders.length === 0 ? '📭' : '🔍'}</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {myOrders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
                      </h3>
                      <p className="text-gray-400 mb-6 text-sm sm:text-base">
                        {myOrders.length === 0 
                          ? 'Your sales will appear here once customers start buying!' 
                          : 'Try adjusting your filters to see more results'}
                      </p>
                      {myOrders.length > 0 && (
                        <button
                          onClick={clearOrderFilters}
                          className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 sm:space-y-4">
                        {displayedOrders.map((order: any) => {
                          const orderNetEarning = parseFloat(order.amount) * 0.95
                          const orderCommission = parseFloat(order.amount) * 0.05

                          return (
                            <div key={order.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-5 hover:border-purple-500/30 transition-all duration-300">
                              {/* Mobile Layout */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                {/* Image */}
                                <div className="flex items-center gap-3 sm:block">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {order.listing?.image_url ? (
                                      <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-lg sm:text-xl lg:text-2xl">
                                        {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'currency' ? '💰' : '🔑'}
                                      </span>
                                    )}
                                  </div>
                                  {/* Mobile: Show status badge next to image */}
                                  <div className="sm:hidden">
                                    <h4 className="text-white font-semibold text-sm">{order.listing?.title || 'Unknown Item'}</h4>
                                    <p className="text-xs text-gray-400">Buyer: <span className="text-purple-400">{order.buyer?.username}</span></p>
                                  </div>
                                </div>
                                
                                {/* Details */}
                                <div className="flex-1 hidden sm:block">
                                  <h4 className="text-white font-semibold text-sm lg:text-base">{order.listing?.title || 'Unknown Item'}</h4>
                                  <p className="text-xs sm:text-sm text-gray-400">Buyer: <span className="text-purple-400">{order.buyer?.username}</span></p>
                                  <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                                    {new Date(order.created_at).toLocaleDateString()} • {order.listing?.game}
                                  </p>
                                </div>
                                
                                {/* Mobile: Date and Game */}
                                <div className="sm:hidden flex justify-between items-center text-xs text-gray-500 -mt-1">
                                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                  <span>{order.listing?.game}</span>
                                </div>
                                
                                {/* Price and Status */}
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                                  <div className="text-right">
                                    <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${orderNetEarning.toFixed(2)}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                                      Gross: ${order.amount} | Fee: -${orderCommission.toFixed(2)}
                                    </p>
                                  </div>
                                  <span className={`inline-block mt-0 sm:mt-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${order.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      order.status === 'delivered' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                        order.status === 'paid' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                          order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                            order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                              order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                                'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                    }`}>
                                    {order.status === 'delivered' ? 'Awaiting' :
                                      order.status === 'dispute_raised' ? 'Dispute' :
                                        order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                  </span>
                                </div>
                                
                                {/* View Button */}
                                <Link
                                  href={`/order/${order.id}`}
                                  className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 border border-purple-500/30 text-center"
                                >
                                  View Details
                                </Link>
                              </div>
                              
                              {/* Order ID - Small text at bottom */}
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[10px] sm:text-xs text-gray-600 font-mono">
                                  Order ID: {order.id.slice(0, 8)}...{order.id.slice(-4)}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {hasMoreOrders && (
                        <div ref={ordersObserverTarget} className="flex justify-center py-6 sm:py-8">
                          {isLoadingMoreOrders ? (
                            <div className="flex items-center gap-3 text-purple-400">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-xs sm:text-sm font-semibold">Loading more orders...</span>
                            </div>
                          ) : (
                            <div className="text-gray-500 text-xs sm:text-sm">Scroll for more</div>
                          )}
                        </div>
                      )}

                      {!hasMoreOrders && displayedOrders.length > 20 && (
                        <div className="text-center py-6 sm:py-8">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-xl text-gray-400 text-xs sm:text-sm">
                            <span>✓</span>
                            You've reached the end of your orders
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Balance Tab - Mobile Optimized */}
              {activeTab === 'balance' && (
                <div id="balance-section">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">💰</span>
                    Balance & Withdrawals
                  </h2>

                  {/* Balance Overview - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-gray-400 text-xs sm:text-sm">Total Earned</span>
                        <span className="text-xl sm:text-2xl">💵</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">${totalEarnings.toFixed(2)}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">From {completedOrders.length} completed orders</div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-gray-400 text-xs sm:text-sm">Withdrawn</span>
                        <span className="text-xl sm:text-2xl">📤</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">${totalWithdrawn.toFixed(2)}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{withdrawals.filter(w => w.status === 'completed').length} completed withdrawals</div>
                    </div>

                    <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-green-400 text-xs sm:text-sm font-semibold">Available Balance</span>
                        <span className="text-xl sm:text-2xl">💰</span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                        ${netRevenue.toFixed(2)}
                      </div>
                      <button
                        onClick={() => setShowWithdrawalForm(true)}
                        disabled={netRevenue <= 0}
                        className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 sm:py-2.5 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                      >
                        Request Withdrawal
                      </button>
                    </div>
                  </div>

                  {/* Withdrawal Form Modal */}
                  {showWithdrawalForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl sm:text-2xl font-bold text-white">Request Withdrawal</h3>
                          <button
                            onClick={() => {
                              setShowWithdrawalForm(false)
                              setWithdrawalMethod('')
                              setWithdrawalAmount('')
                              setWithdrawalAddress('')
                            }}
                            className="text-gray-400 hover:text-white transition p-2"
                          >
                            <span className="text-2xl">✕</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-white font-semibold mb-2 text-sm">Withdrawal Method</label>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setWithdrawalMethod('bitcoin')}
                                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${withdrawalMethod === 'bitcoin'
                                    ? 'border-orange-500 bg-orange-500/10'
                                    : 'border-white/10 bg-slate-800/50 hover:border-orange-500/50'
                                  }`}
                              >
                                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">₿</div>
                                <div className="text-white font-semibold text-sm sm:text-base">Bitcoin</div>
                                <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Min: $100 | Fee: 6% + $20</div>
                              </button>
                              <button
                                onClick={() => setWithdrawalMethod('skrill')}
                                className={`p-3 sm:p-4 rounded-xl border-2 transition-all ${withdrawalMethod === 'skrill'
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-white/10 bg-slate-800/50 hover:border-purple-500/50'
                                  }`}
                              >
                                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💳</div>
                                <div className="text-white font-semibold text-sm sm:text-base">Skrill</div>
                                <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Min: $10 | Fee: 5% + $1</div>
                              </button>
                            </div>
                          </div>

                          {withdrawalMethod && (
                            <>
                              <div>
                                <label className="block text-white font-semibold mb-2 text-sm">Amount (USD)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min={withdrawalMethod === 'bitcoin' ? 100 : 10}
                                  max={netRevenue}
                                  value={withdrawalAmount}
                                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                                  placeholder={`Min: $${withdrawalMethod === 'bitcoin' ? '100' : '10'} | Available: $${netRevenue.toFixed(2)}`}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-white font-semibold mb-2 text-sm">
                                  {withdrawalMethod === 'bitcoin' ? 'Bitcoin Wallet Address' : 'Skrill Email'}
                                </label>
                                <input
                                  type="text"
                                  value={withdrawalAddress}
                                  onChange={(e) => setWithdrawalAddress(e.target.value)}
                                  placeholder={withdrawalMethod === 'bitcoin' ? 'Enter your Bitcoin wallet address' : 'Enter your Skrill email'}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                                />
                              </div>

                              {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                                  <h4 className="text-white font-semibold mb-3 text-sm">Fee Breakdown</h4>
                                  {(() => {
                                    const fees = calculateWithdrawalFees(parseFloat(withdrawalAmount), withdrawalMethod)
                                    return (
                                      <div className="space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between text-gray-400">
                                          <span>Withdrawal Amount:</span>
                                          <span className="text-white">${parseFloat(withdrawalAmount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>{withdrawalMethod === 'bitcoin' ? '6%' : '5%'} Fee:</span>
                                          <span className="text-orange-400">-${fees.percentageFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400">
                                          <span>Flat Fee:</span>
                                          <span className="text-orange-400">-${fees.flatFee.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                                          <span className="text-white">You Will Receive:</span>
                                          <span className="text-green-400">${fees.netAmount.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                              onClick={() => {
                                setShowWithdrawalForm(false)
                                setWithdrawalMethod('')
                                setWithdrawalAmount('')
                                setWithdrawalAddress('')
                              }}
                              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleWithdrawalSubmit}
                              disabled={withdrawalProcessing || !withdrawalMethod || !withdrawalAmount || !withdrawalAddress}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {withdrawalProcessing ? (
                                <span className="flex items-center justify-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  Processing...
                                </span>
                              ) : (
                                'Submit Request'
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Withdrawal History - Mobile Optimized */}
                  <div id="withdrawals-section">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Withdrawal History</h3>
                    {withdrawals.length === 0 ? (
                      <div className="text-center py-10 sm:py-12 bg-slate-800/30 rounded-xl border border-white/5">
                        <div className="text-4xl sm:text-5xl mb-3">💸</div>
                        <p className="text-gray-400 text-sm">No withdrawal history yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {paginatedWithdrawals.map((withdrawal: any) => (
                            <div key={withdrawal.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl">{withdrawal.method === 'bitcoin' ? '₿' : '💳'}</span>
                                  </div>
                                  <div>
                                    <h4 className="text-white font-semibold text-sm sm:text-base">${withdrawal.amount} via {withdrawal.method === 'bitcoin' ? 'Bitcoin' : 'Skrill'}</h4>
                                    <p className="text-xs sm:text-sm text-gray-400">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Net: ${withdrawal.net_amount} (Fee: ${withdrawal.fee_total.toFixed(2)})</p>
                                  </div>
                                </div>
                                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                      withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                        'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                  {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination for Withdrawals */}
                        {totalWithdrawalsPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                            <button
                              onClick={() => goToWithdrawalsPage(withdrawalsPage - 1)}
                              disabled={withdrawalsPage === 1}
                              className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalWithdrawalsPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                onClick={() => goToWithdrawalsPage(page)}
                                className={`px-3 sm:px-4 py-2 rounded-lg transition-all text-sm ${withdrawalsPage === page
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                  }`}
                              >
                                {page}
                              </button>
                            ))}
                            <button
                              onClick={() => goToWithdrawalsPage(withdrawalsPage + 1)}
                              disabled={withdrawalsPage === totalWithdrawalsPages}
                              className="px-3 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
  {/* Inventory Tab - Mobile Optimized */}
              {activeTab === 'inventory' && (
                <div id="inventory-section">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-orange-400">📊</span>
                        Inventory Management
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        Monitor stock levels and manage your inventory
                      </p>
                    </div>
                  </div>

                  {/* Inventory Stats Overview - Mobile Optimized */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-orange-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <span className="text-lg sm:text-xl lg:text-2xl">💎</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Total Value</span>
                      </div>
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                        ${inventoryStats.totalValue.toFixed(2)}
                      </div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Total Inventory Worth</div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-red-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <span className="text-lg sm:text-xl lg:text-2xl">⚠️</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Alert</span>
                      </div>
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.lowStock.length}</div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Low Stock (&lt;5)</div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-yellow-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Restock</span>
                      </div>
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.outOfStock.length}</div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Out of Stock</div>
                    </div>

                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/30 transition-all duration-300">
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <span className="text-lg sm:text-xl lg:text-2xl">📈</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Overstocked</span>
                      </div>
                      <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{inventoryStats.overstocked.length}</div>
                      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Overstocked (&gt;50)</div>
                    </div>
                  </div>

                  {/* Automatic Delivery Stats - Mobile Optimized */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <span className="text-xl sm:text-2xl">⚡</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Automatic Delivery Code Stats</h3>
                        <p className="text-xs sm:text-sm text-gray-400">Track your automatic delivery inventory usage</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Total Codes</div>
                        <div className="text-xl sm:text-2xl font-bold text-white">{inventoryStats.automaticDeliveryStats.totalCodes}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Used Codes</div>
                        <div className="text-xl sm:text-2xl font-bold text-red-400">{inventoryStats.automaticDeliveryStats.usedCodes}</div>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Remaining</div>
                        <div className={`text-xl sm:text-2xl font-bold ${inventoryStats.automaticDeliveryStats.remainingCodes < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {Math.max(0, inventoryStats.automaticDeliveryStats.remainingCodes)}
                        </div>
                        {inventoryStats.automaticDeliveryStats.remainingCodes < 0 && (
                          <div className="text-[10px] sm:text-xs text-red-400 mt-1">
                            ⚠️ Stock discrepancy
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-gray-400 mb-1">Usage Rate</div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-400">{inventoryStats.automaticDeliveryStats.usageRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    {inventoryStats.automaticDeliveryStats.usageRate > 80 && (
                      <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl p-3">
                        <p className="text-orange-400 text-xs sm:text-sm">
                          ⚠️ High usage rate detected! Consider restocking your automatic delivery codes soon.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Filter and Sort Controls - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setInventoryFilter('all')}
                        className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'all'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                      >
                        All Items
                      </button>
                      <button
                        onClick={() => setInventoryFilter('low')}
                        className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'low'
                            ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                      >
                        ⚠️ Low ({inventoryStats.lowStock.length})
                      </button>
                      <button
                        onClick={() => setInventoryFilter('out')}
                        className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'out'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                      >
                        📦 Out ({inventoryStats.outOfStock.length})
                      </button>
                      <button
                        onClick={() => setInventoryFilter('over')}
                        className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm ${inventoryFilter === 'over'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                          }`}
                      >
                        📈 Over ({inventoryStats.overstocked.length})
                      </button>
                    </div>
                    <div className="sm:ml-auto">
                      <select
                        value={inventorySort}
                        onChange={(e) => setInventorySort(e.target.value as any)}
                        className="w-full sm:w-auto bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xs sm:text-sm"
                      >
                        <option value="stock">Sort by Stock (Low to High)</option>
                        <option value="value">Sort by Value (High to Low)</option>
                        <option value="usage">Sort by Usage Rate (Auto only)</option>
                      </select>
                    </div>
                  </div>

                  {/* Inventory Table - Mobile Optimized */}
                  {(() => {
                    const filteredInventory = getFilteredInventory()
                    return filteredInventory.length === 0 ? (
                      <div className="text-center py-12 sm:py-16">
                        <div className="text-5xl sm:text-6xl mb-4">📦</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No items found</h3>
                        <p className="text-gray-400 mb-6 text-sm sm:text-base">No listings match the selected filter</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-slate-900/50 border-b border-white/10">
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Item</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Game</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Stock</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Price</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Value</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Type</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Status</th>
                                  <th className="text-left p-4 text-sm font-semibold text-gray-400">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredInventory.map((listing: any) => {
                                  const itemValue = listing.stock * parseFloat(listing.price)
                                  const isLowStock = listing.stock > 0 && listing.stock < 5 && listing.status === 'active'
                                  const isOutOfStock = listing.stock === 0 || listing.status === 'out_of_stock'
                                  const isOverstocked = listing.stock > 50 && listing.status === 'active'

                                  return (
                                    <tr key={listing.id} className="border-b border-white/5 hover:bg-slate-900/30 transition-colors">
                                      <td className="p-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {listing.image_url ? (
                                              <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                                            ) : (
                                              <span className="text-xl">
                                                {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                                              </span>
                                            )}
                                          </div>
                                          <div>
                                            <div className="text-white font-semibold text-sm">{listing.title}</div>
                                            <div className="text-xs text-gray-500">{listing.category}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className="text-purple-400 text-sm">{listing.game}</span>
                                      </td>
                                      <td className="p-4">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-lg font-bold ${isOutOfStock ? 'text-red-400' :
                                              isLowStock ? 'text-orange-400' :
                                                isOverstocked ? 'text-purple-400' :
                                                  'text-white'
                                            }`}>
                                            {listing.stock}
                                          </span>
                                          {isLowStock && <span className="text-xs">⚠️</span>}
                                          {isOutOfStock && <span className="text-xs">🚫</span>}
                                          {isOverstocked && <span className="text-xs">📈</span>}
                                        </div>
                                      </td>
                                      <td className="p-4">
                                        <span className="text-green-400 font-semibold">${listing.price}</span>
                                      </td>
                                      <td className="p-4">
                                        <span className="text-orange-400 font-semibold">${itemValue.toFixed(2)}</span>
                                      </td>
                                      <td className="p-4">
                                        {listing.delivery_type === 'automatic' ? (
                                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                                            ⚡ Auto
                                          </span>
                                        ) : (
                                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs border border-gray-500/30">
                                            Manual
                                          </span>
                                        )}
                                      </td>
                                      <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                            listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                          }`}>
                                          {listing.status === 'out_of_stock' ? 'Out of Stock' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                        </span>
                                      </td>
                                      <td className="p-4">
                                        <Link
                                          href={`/listing/${listing.id}/edit`}
                                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-all border border-purple-500/30 inline-block"
                                        >
                                          Restock
                                        </Link>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden space-y-3">
                          {filteredInventory.map((listing: any) => {
                            const itemValue = listing.stock * parseFloat(listing.price)
                            const isLowStock = listing.stock > 0 && listing.stock < 5 && listing.status === 'active'
                            const isOutOfStock = listing.stock === 0 || listing.status === 'out_of_stock'
                            const isOverstocked = listing.stock > 50 && listing.status === 'active'

                            return (
                              <div key={listing.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {listing.image_url ? (
                                      <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-2xl">
                                        {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-semibold text-sm truncate">{listing.title}</h4>
                                    <p className="text-purple-400 text-xs">{listing.game}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {listing.delivery_type === 'automatic' ? (
                                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] border border-blue-500/30">
                                          ⚡ Auto
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-gray-500/20 text-gray-400 rounded text-[10px] border border-gray-500/30">
                                          Manual
                                        </span>
                                      )}
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                          listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        }`}>
                                        {listing.status === 'out_of_stock' ? 'OOS' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5">
                                  <div>
                                    <div className="text-[10px] text-gray-500">Stock</div>
                                    <div className={`text-sm font-bold flex items-center gap-1 ${isOutOfStock ? 'text-red-400' :
                                        isLowStock ? 'text-orange-400' :
                                          isOverstocked ? 'text-purple-400' :
                                            'text-white'
                                      }`}>
                                      {listing.stock}
                                      {isLowStock && <span className="text-[10px]">⚠️</span>}
                                      {isOutOfStock && <span className="text-[10px]">🚫</span>}
                                      {isOverstocked && <span className="text-[10px]">📈</span>}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500">Price</div>
                                    <div className="text-sm font-bold text-green-400">${listing.price}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-gray-500">Value</div>
                                    <div className="text-sm font-bold text-orange-400">${itemValue.toFixed(2)}</div>
                                  </div>
                                </div>
                                
                                <Link
                                  href={`/listing/${listing.id}/edit`}
                                  className="mt-3 w-full block px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition-all border border-purple-500/30 text-center"
                                >
                                  Restock / Edit
                                </Link>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )
                  })()}

                  {/* Restocking Recommendations - Mobile Optimized */}
                  {(inventoryStats.lowStock.length > 0 || inventoryStats.outOfStock.length > 0) && (
                    <div className="mt-6 sm:mt-8 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl sm:text-3xl">💡</span>
                        <div>
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">Restocking Recommendations</h3>
                          <p className="text-xs sm:text-sm text-gray-400">Based on your current inventory levels</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {inventoryStats.outOfStock.length > 0 && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <p className="text-red-400 font-semibold mb-1 text-sm sm:text-base">🚨 Urgent: {inventoryStats.outOfStock.length} items out of stock</p>
                            <p className="text-xs sm:text-sm text-gray-400">These items need immediate restocking to continue selling</p>
                          </div>
                        )}
                        {inventoryStats.lowStock.length > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <p className="text-orange-400 font-semibold mb-1 text-sm sm:text-base">⚠️ Warning: {inventoryStats.lowStock.length} items running low</p>
                            <p className="text-xs sm:text-sm text-gray-400">Consider restocking these items soon to avoid running out</p>
                          </div>
                        )}
                        {inventoryStats.overstocked.length > 0 && (
                          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
                            <p className="text-purple-400 font-semibold mb-1 text-sm sm:text-base">📈 Info: {inventoryStats.overstocked.length} items overstocked</p>
                            <p className="text-xs sm:text-sm text-gray-400">Consider promotional pricing to move excess inventory</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-6 sm:py-8 mt-8 sm:mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-xs sm:text-sm">
            <p>&copy; 2025 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}