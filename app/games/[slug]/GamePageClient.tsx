'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getGameBySlug } from '@/lib/games-config'

interface Props {
  slug: string
}

// Tags for each game in Account category
const accountGameTags: { [key: string]: string[] } = {
  'Fortnite': ['Renegade Raider', 'Travis Scott', 'Black Knight', 'Take The L', 'Omega', 'Elite Agent', 'Blue Squire', 'Floss', 'IKONIK', 'Galaxy', 'Wonder', 'Reaper', 'Leviathan Axe', 'Mako', 'Lara Croft', 'Glow', 'Sparkle Specialist', 'Royale Knight', 'Peely', 'Deadpool', 'Havoc', 'Skull Trooper', 'Ghoul Trooper', 'STW', 'Midas', 'Wildcat'],
  'GTA 5': ['High Level', 'Modded Account', 'Rare Vehicles', 'Full Businesses', 'Bunker', 'CEO Office', 'MC Clubhouse', 'Hangar', 'Facility', 'Arena Workshop', 'Nightclub', 'Arcade', 'Casino Penthouse', 'Kosatka', 'Agency'],
  'Valorant': ['Radiant', 'Immortal', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Skins', 'Champions Bundle', 'Protocol 781-A', 'Prime Collection', 'Elderflame'],
  'Roblox': ['High RAP', 'Limiteds', 'Headless', 'Dominus', 'Korblox', 'Valkyrie', 'Sparkle Time Fedora', 'OG Account'],
  'League of Legends': ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'PAX Skins', 'Championship Riven', 'Black Alistar', 'Silver Kayle'],
  'Clash Royale': ['Level 14 King Tower', 'Max Cards', 'Champion Cards', 'Legendary Cards', 'High Trophy', 'Arena 15+'],
  'Clash of Clans': ['TH15', 'TH14', 'TH13', 'Max Heroes', 'Max Walls', 'High Trophies', 'Clan War League'],
  'Steam': ['High Level', 'Rare Games', 'VAC-Free', 'Prime Status', 'Trading Cards', 'Badges']
}

// Tags for each game in Items category
const itemsGameTags: { [key: string]: string[] } = {
  'Steal a Brainrot': ['Rare Items', 'Limited Edition', 'Event Items', 'Collectibles'],
  'Grow a Garden': ['Seeds', 'Tools', 'Decorations', 'Rare Plants'],
  'Adopt me': ['Legendary Pets', 'Neon Pets', 'Mega Neon', 'Vehicles', 'Toys', 'Gifts'],
  'Blox Fruits': ['Legendary Fruits', 'Mythical Fruits', 'Swords', 'Fighting Styles', 'Accessories'],
  'Plants vs Brainrots': ['Premium Plants', 'Power-ups', 'Coins', 'Gems']
}

const ITEMS_PER_PAGE = 12

export default function GamePageClient({ slug }: Props) {
  const [listings, setListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClient()
  const game = getGameBySlug(slug)

  useEffect(() => {
    if (game) {
      fetchListings()
    }
  }, [slug])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [listings, searchQuery, selectedCategory, selectedDeliveryType, priceRange, sortBy, selectedTags])

  // Reset tags when category changes
  useEffect(() => {
    setSelectedTags([])
  }, [selectedCategory])

  const fetchListings = async () => {
    if (!game) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(username, average_rating, total_reviews)')
        .eq('status', 'active')
        .eq('game', game.name)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
      setFilteredListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...listings]

    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((listing) => listing.category === selectedCategory)
    }

    if (selectedDeliveryType !== 'all') {
      filtered = filtered.filter(listing => listing.delivery_type === selectedDeliveryType)
    }

    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-10':
          filtered = filtered.filter((l) => l.price < 10)
          break
        case '10-50':
          filtered = filtered.filter((l) => l.price >= 10 && l.price < 50)
          break
        case '50-100':
          filtered = filtered.filter((l) => l.price >= 50 && l.price < 100)
          break
        case 'over-100':
          filtered = filtered.filter((l) => l.price >= 100)
          break
      }
    }

    // Filter by selected tags (listing must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(listing => {
        if (!listing.tags || !Array.isArray(listing.tags)) return false
        return selectedTags.every(tag => listing.tags.includes(tag))
      })
    }

    // Apply sorting
    switch (sortBy) {
      case 'recommended':
        // Smart ranking algorithm
        filtered.sort((a, b) => {
          // 1. Prioritize in-stock items
          if (a.stock === 0 && b.stock > 0) return 1
          if (b.stock === 0 && a.stock > 0) return -1
          
          // 2. Seller rating (higher ratings first)
          const ratingA = a.profiles?.average_rating || 0
          const ratingB = b.profiles?.average_rating || 0
          const ratingDiff = ratingB - ratingA
          
          // If rating difference is significant (> 0.5 stars), prioritize by rating
          if (Math.abs(ratingDiff) > 0.5) return ratingDiff
          
          // 3. Instant delivery priority (if ratings are similar)
          if (a.delivery_type === 'automatic' && b.delivery_type !== 'automatic') return -1
          if (b.delivery_type === 'automatic' && a.delivery_type !== 'automatic') return 1
          
          // 4. Number of reviews (more reviews = more established seller)
          const reviewsA = a.profiles?.total_reviews || 0
          const reviewsB = b.profiles?.total_reviews || 0
          if (reviewsB !== reviewsA) return reviewsB - reviewsA
          
          // 5. Recency as tiebreaker (newer listings get slight boost)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        break
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price)
        break
    }

    setFilteredListings(filtered)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedDeliveryType('all')
    setPriceRange('all')
    setSortBy('recommended')
    setSelectedTags([])
    setCurrentPage(1)
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'account':
        return '🎮 Accounts'
      case 'items':
        return '🎒 Items'
      case 'currency':
        return '💰 Currency'
      case 'key':
        return '🔑 Game Keys'
      default:
        return category
    }
  }

  // Get available tags based on selected category and game
  const getAvailableTags = () => {
    // Only show tags for Account and Items categories
    if (selectedCategory !== 'account' && selectedCategory !== 'items') {
      return []
    }

    if (!game) return []

    const tags = selectedCategory === 'account' 
      ? accountGameTags[game.name] || []
      : itemsGameTags[game.name] || []

    return tags
  }

  const shouldShowTags = () => {
    return (selectedCategory === 'account' || selectedCategory === 'items') && game
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentListings = filteredListings.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages: React.ReactNode[] = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          currentPage === 1
            ? 'bg-slate-800/50 text-gray-600 cursor-not-allowed'
            : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
        }`}
      >
        ← Previous
      </button>
    )

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className="px-4 py-2 rounded-lg font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2 text-gray-500">
            ...
          </span>
        )
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            currentPage === i
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
          }`}
        >
          {i}
        </button>
      )
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2 text-gray-500">
            ...
          </span>
        )
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="px-4 py-2 rounded-lg font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300"
        >
          {totalPages}
        </button>
      )
    }

    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          currentPage === totalPages
            ? 'bg-slate-800/50 text-gray-600 cursor-not-allowed'
            : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
        }`}
      >
        Next →
      </button>
    )

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
        {pages}
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-bold text-white mb-4">Game Not Found</h1>
          <Link href="/games" className="text-purple-400 hover:text-purple-300 transition">
            ← Browse All Games
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="container mx-auto px-4 pt-24 pb-12">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-purple-400 transition">
                  Home
                </Link>
              </li>
              <li className="text-gray-600">/</li>
              <li>
                <Link href="/games" className="text-gray-400 hover:text-purple-400 transition">
                  Games
                </Link>
              </li>
              <li className="text-gray-600">/</li>
              <li className="text-purple-400">{game.name}</li>
            </ol>
          </nav>

          {/* Page Header */}
          <header className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl" aria-hidden="true">
                {game.icon}
              </span>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white">
                  {game.name}
                </h1>
                <p className="text-purple-400 font-medium">{game.category}</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg max-w-3xl">{game.description}</p>
          </header>

          {/* Quick Category Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            {game.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
                }`}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 rounded-full font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300"
              >
                Show All
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0" role="complementary" aria-label="Filters">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </h2>
                  <button onClick={resetFilters} className="text-sm text-purple-400 hover:text-purple-300 transition font-medium">
                    Reset All
                  </button>
                </div>

                {/* Delivery Type Filter */}
                <div className="mb-6">
                  <label htmlFor="delivery-type" className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Delivery Type
                  </label>
                  <select
                    id="delivery-type"
                    value={selectedDeliveryType}
                    onChange={(e) => setSelectedDeliveryType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '3rem',
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="automatic">⚡ Instant Delivery</option>
                    <option value="manual">📦 Manual Delivery (up to 24h)</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label htmlFor="price-filter" className="block text-white font-semibold mb-3 text-sm">
                    Price Range
                  </label>
                  <select
                    id="price-filter"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '3rem',
                    }}
                  >
                    <option value="all">All Prices</option>
                    <option value="under-10">Under $10</option>
                    <option value="10-50">$10 - $50</option>
                    <option value="50-100">$50 - $100</option>
                    <option value="over-100">Over $100</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-white/10">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400" role="status" aria-live="polite">
                      Showing{' '}
                      <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {currentListings.length}
                      </span>{' '}
                      of{' '}
                      <span className="text-white font-semibold">{filteredListings.length}</span>{' '}
                      listings
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1" aria-label={`${game.name} listings`}>
              {/* Search Bar & Sort */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search listings..." 
                        className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300" 
                      />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {/* Sort Dropdown */}
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)} 
                    className="px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30 min-w-[200px]" 
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
                      backgroundRepeat: 'no-repeat', 
                      backgroundPosition: 'right 1rem center', 
                      backgroundSize: '1.5em 1.5em', 
                      paddingRight: '3rem' 
                    }}
                  >
                    <option value="recommended">⭐ Recommended</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Tags Section - Horizontal Buttons */}
              {shouldShowTags() && getAvailableTags().length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6 hover:border-purple-500/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Filter by Tags
                    </h3>
                    {selectedTags.length > 0 && (
                      <button
                        onClick={() => setSelectedTags([])}
                        className="text-sm text-purple-400 hover:text-purple-300 transition font-medium"
                      >
                        Clear Tags ({selectedTags.length})
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableTags().map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                          selectedTags.includes(tag)
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:bg-slate-800/80'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Filters Display */}
              {(selectedTags.length > 0 || selectedDeliveryType !== 'all') && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-400 font-medium">Active filters:</span>
                    {selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300"
                      >
                        🏷️ {tag}
                      </span>
                    ))}
                    {selectedDeliveryType !== 'all' && (
                      <span
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300"
                      >
                        {selectedDeliveryType === 'automatic' ? '⚡ Instant' : '📦 Manual'}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-20" role="status" aria-label="Loading listings">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                  </div>
                  <p className="text-white mt-6 text-lg">Loading {game.name} listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4" aria-hidden="true">
                    🔍
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
                  <p className="text-gray-400 mb-6">
                    {selectedCategory !== 'all'
                      ? `No ${getCategoryLabel(selectedCategory).toLowerCase()} available for ${game.name} right now.`
                      : `No ${game.name} listings available at the moment.`}
                  </p>
                  <button
                    onClick={resetFilters}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" role="list">
                    {currentListings.map((listing) => (
                      <Link key={listing.id} href={`/listing/${listing.id}`} className="group" role="listitem">
                        <article className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/0 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

                          <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {listing.image_url ? (
                              <img
                                src={listing.image_url}
                                alt={`${listing.title} - ${game.name} ${listing.category}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl group-hover:scale-125 transition-transform duration-300" aria-hidden="true">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              </div>
                            )}
                            {/* Category Badge - Top Left */}
                            <div className="absolute top-3 left-3">
                              <span className="bg-black/60 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold border border-white/10">
                                {listing.category === 'account'
                                  ? '🎮 Account'
                                  : listing.category === 'items'
                                  ? '🎒 Items'
                                  : listing.category === 'currency'
                                  ? '💰 Currency'
                                  : '🔑 Key'}
                              </span>
                            </div>
                            {/* Delivery Type Badge - Top Right */}
                            <div className="absolute top-3 right-3">
                              {listing.delivery_type === 'automatic' ? (
                                <span className="bg-green-500/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Instant
                                </span>
                              ) : (
                                <span className="bg-blue-500/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  24 Hour
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative p-5">
                            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-1">
                              {listing.title}
                            </h3>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
                            
                            {/* Tags Display */}
                            {listing.tags && listing.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {listing.tags.slice(0, 3).map((tag: string) => (
                                  <span key={tag} className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-300">
                                    {tag}
                                  </span>
                                ))}
                                {listing.tags.length > 3 && (
                                  <span className="px-2 py-1 bg-slate-800/50 border border-white/10 rounded text-xs text-gray-400">
                                    +{listing.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                ${parseFloat(listing.price).toFixed(2)}
                              </span>
                              <div className="text-right">
                                <p className="text-gray-500 text-xs mb-1">Seller</p>
                                <p className="text-white font-semibold text-sm">{listing.profiles?.username}</p>
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-yellow-400" aria-hidden="true">
                                    ★
                                  </span>
                                  <span className="text-gray-400 text-xs">
                                    {listing.profiles?.average_rating?.toFixed(1) || '0.0'} ({listing.profiles?.total_reviews || 0})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {renderPagination()}
                </>
              )}
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}