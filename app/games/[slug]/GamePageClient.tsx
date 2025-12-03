'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { getGameBySlug } from '@/lib/games-config'
import { getSEOContentBySlug } from '@/lib/seo-content-config'

interface Props {
  slug: string
}

// Game-specific platform options (null or empty array means no platform filter)
const gamePlatformsMap: { [key: string]: string[] | null } = {
  'GTA 5': ['PC', 'Playstation 4', 'Playstation 5', 'Xbox X/S', 'Xbox One'],
  'Fortnite': ['PC', 'Playstation', 'Xbox', 'Switch', 'Android', 'iOS'],
  'Roblox': null,
  'Valorant': ['PC', 'Playstation', 'Xbox'],
  'League of Legends': null,
  'Clash Royale': null,
  'Clash of Clans': null,
  'Steam': null,
  // Items category games
  'Steal a Brainrot': null,
  'Grow a Garden': null,
  'Adopt me': null,
  'Blox Fruits': null,
  'Plants vs Brainrots': null,
}

// Valorant-specific options
const valorantRegions = ['NA', 'EU/TR/MENA/CIS', 'LATAM', 'Brazil', 'AP', 'KR']
const valorantRanks = ['Ranked Ready', 'Unranked', 'Radiant', 'Immortal', 'Ascendant', 'Diamond', 'Gold']

// League of Legends-specific options
const lolServers = ['Europe Nordic & East', 'Europe West', 'North America', 'Brazil']

// Tags for each game in Account category
const accountGameTags: { [key: string]: string[] } = {
  'Fortnite': ['Renegade Raider', 'Travis Scott', 'Black Knight', 'Take The L', 'Omega', 'Elite Agent', 'Blue Squire', 'Floss', 'IKONIK', 'Galaxy', 'Wonder', 'Reaper', 'Leviathan Axe', 'Mako', 'Lara Croft', 'Glow', 'Sparkle Specialist', 'Royale Knight', 'Peely', 'Deadpool', 'Havoc', 'Skull Trooper', 'Ghoul Trooper', 'STW', 'Midas', 'Wildcat'],
  'GTA 5': ['High Level', 'Modded Account', 'Billions', 'Modded Outfits', 'Modded Cars', 'All Unlocks', 'Max Stats', 'Male', 'Female', 'Fast Run', 'Arena Workshop', 'Nightclub'],
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
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('recommended')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Game-specific filters
  const [selectedValorantRegion, setSelectedValorantRegion] = useState('all')
  const [selectedValorantRank, setSelectedValorantRank] = useState('all')
  const [selectedLolServer, setSelectedLolServer] = useState('all')

  const supabase = createClient()
  const searchParams = useSearchParams()
  const game = getGameBySlug(slug)
  const seoContent = getSEOContentBySlug(slug)

  useEffect(() => {
    // Initialize category from URL params
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
    
    if (game) {
      fetchListings()
    }
  }, [slug, searchParams])

  useEffect(() => {
    applyFilters()
    setCurrentPage(1) // Reset to first page when filters change
  }, [listings, searchQuery, selectedCategory, selectedPlatform, selectedDeliveryType, priceRange, sortBy, selectedTags, selectedValorantRegion, selectedValorantRank, selectedLolServer])

  // Reset tags and game-specific filters when category changes
  useEffect(() => {
    setSelectedTags([])
    setTagSearchQuery('')
    setSelectedPlatform('all')
    setSelectedValorantRegion('all')
    setSelectedValorantRank('all')
    setSelectedLolServer('all')
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

    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(listing => listing.platform === selectedPlatform)
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

    // Valorant-specific filters
    if (game?.name === 'Valorant') {
      if (selectedValorantRegion !== 'all') {
        filtered = filtered.filter(listing => listing.region === selectedValorantRegion)
      }
      if (selectedValorantRank !== 'all') {
        filtered = filtered.filter(listing => listing.rank === selectedValorantRank)
      }
    }

    // League of Legends-specific filters
    if (game?.name === 'League of Legends') {
      if (selectedLolServer !== 'all') {
        filtered = filtered.filter(listing => listing.server === selectedLolServer)
      }
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
    setSelectedPlatform('all')
    setSelectedDeliveryType('all')
    setPriceRange('all')
    setSortBy('recommended')
    setSelectedTags([])
    setTagSearchQuery('')
    setCurrentPage(1)
    setMobileFiltersOpen(false)
    setSelectedValorantRegion('all')
    setSelectedValorantRank('all')
    setSelectedLolServer('all')
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

  // Get available platforms for the current game
  const getAvailablePlatforms = () => {
    if (!game) return null
    return gamePlatformsMap[game.name] || null
  }

  const shouldShowPlatformFilter = () => {
    const platforms = getAvailablePlatforms()
    return platforms !== null && platforms.length > 0
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

    if (tagSearchQuery) {
      return tags.filter(tag => 
        tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    }

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

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  // Count active filters for display
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedTags.length > 0) count += selectedTags.length
    if (selectedCategory !== 'all') count++
    if (selectedPlatform !== 'all') count++
    if (selectedValorantRegion !== 'all') count++
    if (selectedValorantRank !== 'all') count++
    if (selectedLolServer !== 'all') count++
    if (selectedDeliveryType !== 'all') count++
    if (priceRange !== 'all') count++
    return count
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
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5

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
        className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] text-sm sm:text-base ${
          currentPage === 1
            ? 'bg-slate-800/50 text-gray-600 cursor-not-allowed'
            : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
        }`}
      >
        <span className="hidden sm:inline">← Previous</span>
        <span className="sm:hidden">←</span>
      </button>
    )

    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => goToPage(1)}
          className="px-3 sm:px-4 py-2 rounded-lg font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300 min-h-[44px] text-sm sm:text-base"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-1 sm:px-2 text-gray-500 text-sm sm:text-base">
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
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] text-sm sm:text-base ${
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
          <span key="ellipsis2" className="px-1 sm:px-2 text-gray-500 text-sm sm:text-base">
            ...
          </span>
        )
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => goToPage(totalPages)}
          className="px-3 sm:px-4 py-2 rounded-lg font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300 min-h-[44px] text-sm sm:text-base"
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
        className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 min-h-[44px] text-sm sm:text-base ${
          currentPage === totalPages
            ? 'bg-slate-800/50 text-gray-600 cursor-not-allowed'
            : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white'
        }`}
      >
        <span className="hidden sm:inline">Next →</span>
        <span className="sm:hidden">→</span>
      </button>
    )

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
        {pages}
      </div>
    )
  }

  // Filter sidebar content (used in both desktop and mobile)
  const FilterContent = () => (
    <>
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

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-white font-semibold mb-3 text-sm">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '3rem',
          }}
        >
          <option value="all">All Categories</option>
          {game?.categories.map((cat) => (
            <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
          ))}
        </select>
      </div>

      {/* Platform Filter - Only show for games that have platforms */}
      {shouldShowPlatformFilter() && (
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Platform
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '3rem',
            }}
          >
            <option value="all">All Platforms</option>
            {getAvailablePlatforms()?.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
      )}

      {/* Valorant-specific filters */}
      {game?.name === 'Valorant' && (
        <>
          {/* Region Filter */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Region
            </label>
            <select
              value={selectedValorantRegion}
              onChange={(e) => setSelectedValorantRegion(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '3rem',
              }}
            >
              <option value="all">All Regions</option>
              {valorantRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Rank Filter */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Rank
            </label>
            <select
              value={selectedValorantRank}
              onChange={(e) => setSelectedValorantRank(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '3rem',
              }}
            >
              <option value="all">All Ranks</option>
              {valorantRanks.map(rank => (
                <option key={rank} value={rank}>{rank}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* League of Legends-specific filters */}
      {game?.name === 'League of Legends' && (
        <div className="mb-6">
          <label className="block text-white font-semibold mb-3 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Server
          </label>
          <select
            value={selectedLolServer}
            onChange={(e) => setSelectedLolServer(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '3rem',
            }}
          >
            <option value="all">All Servers</option>
            {lolServers.map(server => (
              <option key={server} value={server}>{server}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tags Section */}
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
                {tagSearchQuery ? 'No tags found' : 'Select a category to see tags'}
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
        <label className="block text-white font-semibold mb-3 text-sm">Price Range</label>
        <select
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
          <p className="text-sm text-gray-400">
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
    </>
  )

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
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10">
        <Navigation />

        <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
          {/* Breadcrumb */}
          <nav className="mb-4 sm:mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-xs sm:text-sm">
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
              <li className="text-purple-400 truncate max-w-[120px] sm:max-w-none">{game.name}</li>
            </ol>
          </nav>

          {/* Page Header */}
          <header className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <span className="text-4xl sm:text-5xl md:text-6xl" aria-hidden="true">
                {game.icon}
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                  {game.name}
                </h1>
                <p className="text-purple-400 font-medium text-sm sm:text-base">{game.category}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg max-w-3xl">{game.description}</p>
          </header>

          {/* Quick Category Links */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
            {game.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium transition-all duration-300 text-sm sm:text-base min-h-[36px] sm:min-h-[40px] ${
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
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:text-white transition-all duration-300 text-sm sm:text-base min-h-[36px] sm:min-h-[40px]"
              >
                Show All
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0" role="complementary" aria-label="Filters">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <FilterContent />
              </div>
            </aside>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-full shadow-2xl shadow-purple-500/50 font-semibold flex items-center gap-2 hover:scale-105 transition-transform duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {/* Mobile Filters Modal */}
            {mobileFiltersOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <div 
                  className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setMobileFiltersOpen(false)}
                ></div>
                
                {/* Filter Panel */}
                <div className="relative w-full sm:max-w-lg sm:mx-4 bg-slate-900/95 backdrop-blur-xl border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[85vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <button 
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <FilterContent />
                  </div>

                  {/* Footer */}
                  <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-800/50">
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 min-h-[48px]"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <section className="flex-1 min-w-0" aria-label={`${game.name} listings`}>
              {/* Search Bar & Sort */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        placeholder="Search listings..." 
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300" 
                      />
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                  {/* Sort Dropdown */}
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)} 
                    className="px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30 sm:min-w-[200px]" 
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

                {/* Active Filters Display */}
                {(selectedTags.length > 0 || selectedDeliveryType !== 'all' || selectedPlatform !== 'all' || selectedValorantRegion !== 'all' || selectedValorantRank !== 'all' || selectedLolServer !== 'all') && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs sm:text-sm text-gray-400">Active filters:</span>
                      {selectedTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 transition min-h-[32px]"
                        >
                          <span>🏷️ {tag}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                      {selectedDeliveryType !== 'all' && (
                        <button
                          onClick={() => setSelectedDeliveryType('all')}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300 transition min-h-[32px]"
                        >
                          <span>{selectedDeliveryType === 'automatic' ? '⚡ Instant' : '📦 Manual'}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {selectedPlatform !== 'all' && (
                        <button
                          onClick={() => setSelectedPlatform('all')}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-300 transition min-h-[32px]"
                        >
                          <span>🎮 {selectedPlatform}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {selectedValorantRegion !== 'all' && (
                        <button
                          onClick={() => setSelectedValorantRegion('all')}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-full text-xs text-red-300 transition min-h-[32px]"
                        >
                          <span>🌍 {selectedValorantRegion}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {selectedValorantRank !== 'all' && (
                        <button
                          onClick={() => setSelectedValorantRank('all')}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300 transition min-h-[32px]"
                        >
                          <span>🏆 {selectedValorantRank}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      {selectedLolServer !== 'all' && (
                        <button
                          onClick={() => setSelectedLolServer('all')}
                          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full text-xs text-cyan-300 transition min-h-[32px]"
                        >
                          <span>🖥️ {selectedLolServer}</span>
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="text-center py-16 sm:py-20" role="status" aria-label="Loading listings">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
                  </div>
                  <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading {game.name} listings...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 text-center">
                  <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">
                    🔍
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No listings found</h3>
                  <p className="text-gray-400 text-sm sm:text-base mb-6">
                    {selectedCategory !== 'all'
                      ? `No ${getCategoryLabel(selectedCategory).toLowerCase()} available for ${game.name} right now.`
                      : `No ${game.name} listings available at the moment.`}
                  </p>
                  <button
                    onClick={resetFilters}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 min-h-[48px]"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" role="list">
                    {currentListings.map((listing) => (
                      <Link key={listing.id} href={`/listing/${listing.id}`} className="group" role="listitem">
                        <article className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1 sm:hover:-translate-y-2">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/0 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>

                          <div className="relative h-40 sm:h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {listing.image_url ? (
                              <img
                                src={listing.image_url}
                                alt={`${listing.title} - ${game.name} ${listing.category}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-5xl sm:text-6xl group-hover:scale-125 transition-transform duration-300" aria-hidden="true">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              </div>
                            )}
                            {/* Category Badge - Top Left */}
                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                              <span className="bg-black/60 backdrop-blur-lg px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs text-white font-semibold border border-white/10">
                                {listing.category === 'account'
                                  ? '🎮 Account'
                                  : listing.category === 'items'
                                  ? '🎒 Items'
                                  : listing.category === 'currency'
                                  ? '💰 Currency'
                                  : '🔑 Key'}
                              </span>
                            </div>
                            {/* Delivery Badge - Top Right */}
                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                              {listing.delivery_type === 'automatic' ? (
                                <span className="bg-green-500/80 backdrop-blur-lg px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Instant
                                </span>
                              ) : (
                                <span className="bg-blue-500/80 backdrop-blur-lg px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs text-white font-semibold flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  24 Hours
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="relative p-4 sm:p-5">
                            <h3 className="text-white font-bold text-base sm:text-lg mb-2 group-hover:text-purple-400 transition line-clamp-1">
                              {listing.title}
                            </h3>
                            <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-2">{listing.description}</p>
                            
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
                              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                ${parseFloat(listing.price).toFixed(2)}
                              </span>
                              <div className="text-right">
                                <p className="text-gray-500 text-xs mb-0.5 sm:mb-1">Seller</p>
                                <p className="text-white font-semibold text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{listing.profiles?.username}</p>
                                <div className="flex items-center justify-end gap-1">
                                  <span className="text-yellow-400 text-xs sm:text-sm" aria-hidden="true">
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

          {/* SEO Content Section */}
          {seoContent && (
            <section className="mt-12 sm:mt-16" aria-label={`About ${game.name} on Nashflare`}>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
                  {/* Main Title & Description */}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">
                    {seoContent.mainTitle}
                  </h2>
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">
                    {seoContent.mainDescription}
                  </p>

                  {/* Content Sections */}
                  <div className="space-y-6 sm:space-y-8">
                    {seoContent.sections.map((section, index) => (
                      <div key={index}>
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></span>
                          {section.title}
                        </h3>
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* FAQs */}
                  {seoContent.faqs.length > 0 && (
                    <div className="mt-8 sm:mt-10">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Frequently Asked Questions
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        {seoContent.faqs.map((faq, index) => (
                          <div key={index} className="bg-slate-800/50 rounded-xl p-4 sm:p-5 border border-white/5">
                            <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">{faq.question}</h4>
                            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
                    <p className="text-gray-500 text-xs italic">
                      {seoContent.disclaimer}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
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
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}