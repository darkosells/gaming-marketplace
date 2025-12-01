'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Listing, Order, InventoryStats, InventoryFilter, InventorySort } from '../types'

// ========== LISTING FILTERS ==========
export function useListingFilters(myListings: Listing[]) {
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

  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [displayedListings, setDisplayedListings] = useState<Listing[]>([])
  const [listingsDisplayCount, setListingsDisplayCount] = useState(20)
  const [isLoadingMoreListings, setIsLoadingMoreListings] = useState(false)
  const [hasMoreListings, setHasMoreListings] = useState(true)
  const listingsObserverTarget = useRef<HTMLDivElement>(null)

  // Apply filters whenever listings or filter states change
  const applyFiltersAndSort = useCallback(() => {
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
    }

    setFilteredListings(filtered)
    setListingsDisplayCount(20)
  }, [myListings, searchQuery, filterGame, filterCategory, filterStatus, filterDeliveryType, filterPriceMin, filterPriceMax, filterDateRange, sortBy])

  useEffect(() => {
    applyFiltersAndSort()
  }, [applyFiltersAndSort])

  useEffect(() => {
    const newDisplayed = filteredListings.slice(0, listingsDisplayCount)
    setDisplayedListings(newDisplayed)
    setHasMoreListings(listingsDisplayCount < filteredListings.length)
  }, [filteredListings, listingsDisplayCount])

  const loadMoreListings = useCallback(() => {
    if (isLoadingMoreListings || !hasMoreListings) return

    setIsLoadingMoreListings(true)
    setTimeout(() => {
      setListingsDisplayCount(prev => prev + 20)
      setIsLoadingMoreListings(false)
    }, 300)
  }, [isLoadingMoreListings, hasMoreListings])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setFilterGame('all')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterDeliveryType('all')
    setFilterPriceMin('')
    setFilterPriceMax('')
    setFilterDateRange('all')
    setSortBy('newest')
  }, [])

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

  return {
    // Filter state
    searchQuery, setSearchQuery,
    filterGame, setFilterGame,
    filterCategory, setFilterCategory,
    filterStatus, setFilterStatus,
    filterDeliveryType, setFilterDeliveryType,
    filterPriceMin, setFilterPriceMin,
    filterPriceMax, setFilterPriceMax,
    filterDateRange, setFilterDateRange,
    sortBy, setSortBy,
    showFilters, setShowFilters,
    // Results
    filteredListings,
    displayedListings,
    // Infinite scroll
    listingsDisplayCount,
    isLoadingMoreListings,
    hasMoreListings,
    listingsObserverTarget,
    loadMoreListings,
    // Actions
    clearFilters,
    activeFilterCount
  }
}

// ========== ORDER FILTERS ==========
export function useOrderFilters(myOrders: Order[]) {
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

  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [displayedOrders, setDisplayedOrders] = useState<Order[]>([])
  const [ordersDisplayCount, setOrdersDisplayCount] = useState(20)
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false)
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  const ordersObserverTarget = useRef<HTMLDivElement>(null)

  const applyOrderFiltersAndSort = useCallback(() => {
    let filtered = [...myOrders]

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

    if (orderFilterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === orderFilterStatus)
    }

    if (orderFilterGame !== 'all') {
      filtered = filtered.filter(order => 
        order.listing?.game === orderFilterGame || 
        order.listing_game === orderFilterGame
      )
    }

    if (orderFilterDeliveryType !== 'all') {
      filtered = filtered.filter(order => order.delivery_type === orderFilterDeliveryType)
    }

    if (orderFilterPriceMin) {
      const minPrice = parseFloat(orderFilterPriceMin)
      filtered = filtered.filter(order => parseFloat(order.amount) >= minPrice)
    }
    if (orderFilterPriceMax) {
      const maxPrice = parseFloat(orderFilterPriceMax)
      filtered = filtered.filter(order => parseFloat(order.amount) <= maxPrice)
    }

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
    }

    setFilteredOrders(filtered)
    setOrdersDisplayCount(20)
  }, [myOrders, orderSearchQuery, orderFilterStatus, orderFilterGame, orderFilterDeliveryType, orderFilterPriceMin, orderFilterPriceMax, orderFilterDateFrom, orderFilterDateTo, orderSortBy])

  useEffect(() => {
    applyOrderFiltersAndSort()
  }, [applyOrderFiltersAndSort])

  useEffect(() => {
    const newDisplayed = filteredOrders.slice(0, ordersDisplayCount)
    setDisplayedOrders(newDisplayed)
    setHasMoreOrders(ordersDisplayCount < filteredOrders.length)
  }, [filteredOrders, ordersDisplayCount])

  const loadMoreOrders = useCallback(() => {
    if (isLoadingMoreOrders || !hasMoreOrders) return

    setIsLoadingMoreOrders(true)
    setTimeout(() => {
      setOrdersDisplayCount(prev => prev + 20)
      setIsLoadingMoreOrders(false)
    }, 300)
  }, [isLoadingMoreOrders, hasMoreOrders])

  const clearOrderFilters = useCallback(() => {
    setOrderSearchQuery('')
    setOrderFilterStatus('all')
    setOrderFilterGame('all')
    setOrderFilterDeliveryType('all')
    setOrderFilterPriceMin('')
    setOrderFilterPriceMax('')
    setOrderFilterDateFrom('')
    setOrderFilterDateTo('')
    setOrderSortBy('newest')
  }, [])

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

  const exportOrdersToCSV = useCallback(() => {
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
  }, [filteredOrders, myOrders])

  return {
    // Filter state
    orderSearchQuery, setOrderSearchQuery,
    orderFilterStatus, setOrderFilterStatus,
    orderFilterGame, setOrderFilterGame,
    orderFilterDeliveryType, setOrderFilterDeliveryType,
    orderFilterPriceMin, setOrderFilterPriceMin,
    orderFilterPriceMax, setOrderFilterPriceMax,
    orderFilterDateFrom, setOrderFilterDateFrom,
    orderFilterDateTo, setOrderFilterDateTo,
    orderSortBy, setOrderSortBy,
    showOrderFilters, setShowOrderFilters,
    // Results
    filteredOrders,
    displayedOrders,
    // Infinite scroll
    ordersDisplayCount,
    isLoadingMoreOrders,
    hasMoreOrders,
    ordersObserverTarget,
    loadMoreOrders,
    // Actions
    clearOrderFilters,
    activeOrderFilterCount,
    exportOrdersToCSV
  }
}

// ========== INVENTORY FILTERS ==========
export function useInventoryFilters(
  myListings: Listing[], 
  myOrders: Order[], 
  inventoryStats: InventoryStats
) {
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all')
  const [inventorySort, setInventorySort] = useState<InventorySort>('stock')

  const getFilteredInventory = useCallback(() => {
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
  }, [myListings, myOrders, inventoryStats, inventoryFilter, inventorySort])

  return {
    inventoryFilter,
    setInventoryFilter,
    inventorySort,
    setInventorySort,
    getFilteredInventory
  }
}