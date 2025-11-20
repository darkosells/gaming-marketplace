'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

// Category to Games mapping
const categoryGamesMap: { [key: string]: string[] } = {
  account: ['GTA 5', 'Fortnite', 'Roblox', 'Valorant', 'League of Legends', 'Clash Royale', 'Clash of Clans', 'Steam'],
  items: ['Steal a Brainrot', 'Grow a Garden', 'Adopt me', 'Blox Fruits', 'Plants vs Brainrots'],
  currency: ['Roblox', 'Fortnite'],
  key: ['Steam', 'Playstation', 'Xbox']
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

function BrowseContent() {
  const [listings, setListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedGame, setSelectedGame] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize filters from URL params
    const categoryParam = searchParams.get('category')
    const gameParam = searchParams.get('game')
    const searchParam = searchParams.get('search')
    const tagParam = searchParams.get('tag')
    
    if (categoryParam) setSelectedCategory(categoryParam)
    if (gameParam) setSelectedGame(gameParam)
    if (searchParam) setSearchQuery(searchParam)
    if (tagParam) setSelectedTags([tagParam])
    
    fetchListings()
  }, [searchParams])

  useEffect(() => { 
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [listings, searchQuery, selectedCategory, selectedGame, selectedPlatform, selectedDeliveryType, priceRange, sortBy, selectedTags])

  // Reset game selection and tags when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      // Check if current game is valid for new category
      const validGames = categoryGamesMap[selectedCategory] || []
      if (!validGames.includes(selectedGame)) {
        setSelectedGame('all')
      }
    }
    // Reset tags when category changes
    setSelectedTags([])
    setTagSearchQuery('')
  }, [selectedCategory])

  // Reset tags when game changes
  useEffect(() => {
    setSelectedTags([])
    setTagSearchQuery('')
  }, [selectedGame])

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*, profiles(username, average_rating, total_reviews)')
        .eq('status', 'active')
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
        listing.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedCategory)
    }

    if (selectedGame !== 'all') {
      filtered = filtered.filter(listing => listing.game === selectedGame)
    }

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(listing => listing.platform === selectedPlatform)
    }

    if (selectedDeliveryType !== 'all') {
      filtered = filtered.filter(listing => listing.delivery_type === selectedDeliveryType)
    }

    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-10': filtered = filtered.filter(l => l.price < 10); break
        case '10-50': filtered = filtered.filter(l => l.price >= 10 && l.price < 50); break
        case '50-100': filtered = filtered.filter(l => l.price >= 50 && l.price < 100); break
        case 'over-100': filtered = filtered.filter(l => l.price >= 100); break
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
          if (a.delivery_type === 'instant' && b.delivery_type !== 'instant') return -1
          if (b.delivery_type === 'instant' && a.delivery_type !== 'instant') return 1
          
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
    setSelectedGame('all')
    setSelectedPlatform('all')
    setSelectedDeliveryType('all')
    setPriceRange('all')
    setSortBy('recommended')
    setSelectedTags([])
    setTagSearchQuery('')
    setCurrentPage(1)
  }

  // Get available games based on selected category
  const getAvailableGames = () => {
    if (selectedCategory === 'all') {
      // Show all unique games from listings when no category is selected
      return Array.from(new Set(listings.map(l => l.game)))
    }
    return categoryGamesMap[selectedCategory] || []
  }

  // Get available tags based on selected category and game
  const getAvailableTags = () => {
    // Only show tags for Account and Items categories
    if (selectedCategory !== 'account' && selectedCategory !== 'items') {
      return []
    }

    if (selectedGame === 'all') {
      return []
    }

    const tags = selectedCategory === 'account' 
      ? accountGameTags[selectedGame] || []
      : itemsGameTags[selectedGame] || []

    // Filter tags based on search query
    if (tagSearchQuery) {
      return tags.filter(tag => 
        tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    }

    return tags
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'account': return '🎮 Accounts'
      case 'items': return '🎒 Items'
      case 'currency': return '💰 Currency'
      case 'key': return '🔑 Game Keys'
      default: return category
    }
  }

  const shouldShowTags = () => {
    return (selectedCategory === 'account' || selectedCategory === 'items') && selectedGame !== 'all'
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

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Page Content */}
        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                🛍️ Marketplace
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Browse <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Marketplace</span>
            </h1>
            <p className="text-gray-400 text-lg">Discover gaming accounts, items, currency, and game keys from verified sellers</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                  </h2>
                  <button onClick={resetFilters} className="text-sm text-purple-400 hover:text-purple-300 transition font-medium">Reset All</button>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm">Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
                  >
                    <option value="all">All Categories</option>
                    <option value="account">🎮 Accounts</option>
                    <option value="items">🎒 Items</option>
                    <option value="currency">💰 Currency</option>
                    <option value="key">🔑 Game Keys</option>
                  </select>
                </div>

                {/* Game Filter - Dynamic based on category */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm">
                    Game 
                    {selectedCategory !== 'all' && (
                      <span className="text-purple-400 text-xs ml-2">
                        ({getAvailableGames().length} available)
                      </span>
                    )}
                  </label>
                  <select 
                    value={selectedGame} 
                    onChange={(e) => setSelectedGame(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
                  >
                    <option value="all">All Games</option>
                    {getAvailableGames().map(game => (
                      <option key={game} value={game}>{game}</option>
                    ))}
                  </select>
                  {selectedCategory !== 'all' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing games for {getCategoryLabel(selectedCategory)}
                    </p>
                  )}
                </div>

                {/* Tags Section - Only for Accounts and Items with game selected */}
                {shouldShowTags() && (
                  <div className="mb-6">
                    <label className="block text-white font-semibold mb-3 text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags
                      </span>
                      {selectedTags.length > 0 && (
                        <button
                          onClick={() => setSelectedTags([])}
                          className="text-xs text-purple-400 hover:text-purple-300 transition"
                        >
                          Clear ({selectedTags.length})
                        </button>
                      )}
                    </label>

                    {/* Tag Search */}
                    <div className="relative mb-3">
                      <input
                        type="text"
                        value={tagSearchQuery}
                        onChange={(e) => setTagSearchQuery(e.target.value)}
                        placeholder="Search tags..."
                        className="w-full px-4 py-2 pl-10 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3 p-3 bg-purple-500/5 rounded-lg border border-purple-500/20">
                        {selectedTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => removeTag(tag)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs text-purple-300 transition group"
                          >
                            <span>{tag}</span>
                            <svg className="w-3.5 h-3.5 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Available Tags */}
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                      {getAvailableTags().length > 0 ? (
                        getAvailableTags().map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all duration-200 ${
                              selectedTags.includes(tag)
                                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-medium'
                                : 'bg-slate-800/50 border border-white/10 text-gray-300 hover:bg-slate-800/80 hover:border-purple-500/20'
                            }`}
                          >
                            {tag}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          {tagSearchQuery ? 'No tags found' : 'No tags available'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Type Filter */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Delivery Type
                  </label>
                  <select 
                    value={selectedDeliveryType} 
                    onChange={(e) => setSelectedDeliveryType(e.target.value)} 
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
                  >
                    <option value="all">All Types</option>
                    <option value="instant">⚡ Instant Delivery</option>
                    <option value="manual">📦 Manual Delivery (up to 48h)</option>
                  </select>
                </div>

                {/* Platform Filter */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm">Platform</label>
                  <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}>
                    <option value="all">All Platforms</option>
                    <option value="PC">🖥️ PC</option>
                    <option value="PlayStation">🎮 PlayStation</option>
                    <option value="Xbox">🟢 Xbox</option>
                    <option value="Nintendo">🔴 Nintendo</option>
                    <option value="Mobile">📱 Mobile</option>
                  </select>
                </div>

                {/* Price Range Filter */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3 text-sm">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}>
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
                    <p className="text-sm text-gray-400">
                      Showing <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{currentListings.length}</span> of <span className="text-white font-semibold">{filteredListings.length}</span> listings
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
              {/* Search & Sort Bar */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative">
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search listings..." className="w-full px-4 py-3 pl-12 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300" />
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30 min-w-[200px]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}>
                    <option value="recommended">⭐ Recommended</option>
                    <option value="price-low">💰 Price: Low to High</option>
                    <option value="price-high">💎 Price: High to Low</option>
                  </select>
                </div>

                {/* Active Filters Display */}
                {(selectedTags.length > 0 || selectedDeliveryType !== 'all') && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-sm text-gray-400">Active filters:</span>
                      {selectedTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 transition"
                        >
                          <span>🏷️ {tag}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                      {selectedDeliveryType !== 'all' && (
                        <button
                          onClick={() => setSelectedDeliveryType('all')}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300 transition"
                        >
                          <span>{selectedDeliveryType === 'instant' ? '⚡ Instant' : '📦 Manual'}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Listings Grid */}
              {loading ? (
                <div className="text-center py-20">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
                  </div>
                  <p className="text-white mt-6 text-lg">Loading listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
                  <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                  <button onClick={resetFilters} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {currentListings.map((listing) => (
                      <Link key={listing.id} href={`/listing/${listing.id}`} className="group">
                        <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2">
                          {/* Hover glow effect */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/0 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                          
                          <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {listing.image_url ? (
                              <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-6xl group-hover:scale-125 transition-transform duration-300">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              </div>
                            )}
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                              <span className="bg-black/60 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold border border-white/10">
                                {listing.category === 'account' ? '🎮 Account' : listing.category === 'items' ? '🎒 Items' : listing.category === 'currency' ? '💰 Currency' : '🔑 Key'}
                              </span>
                              {listing.delivery_type === 'instant' && (
                                <span className="bg-green-500/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Instant
                                </span>
                              )}
                            </div>
                            {listing.stock <= 3 && listing.stock > 0 && (
                              <div className="absolute top-3 right-3">
                                <span className="bg-orange-500/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold">
                                  Only {listing.stock} left!
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="relative p-5">
                            <p className="text-purple-400 text-sm font-semibold mb-1">{listing.game}</p>
                            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-1">{listing.title}</h3>
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
                              <span className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${parseFloat(listing.price).toFixed(2)}</span>
                              <div className="text-right">
                                <p className="text-gray-500 text-xs mb-1">Seller</p>
                                <p className="text-white font-semibold text-sm">{listing.profiles?.username}</p>
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-yellow-400">★</span>
                                  <span className="text-gray-400 text-xs">{listing.profiles?.average_rating?.toFixed(1) || '0.0'} ({listing.profiles?.total_reviews || 0})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination */}
                  {renderPagination()}
                </>
              )}
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  )
}

// Main component wrapped with Suspense
export default function BrowsePageClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background for Suspense */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading marketplace...</p>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}