'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  game: string
  category: string
  platform: string
  image_url: string
  status: string
  created_at: string
  seller_id: string
  profiles: {
    username: string
    rating: number
  }
}

// Separate component that uses useSearchParams
function BrowseContent() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedGame, setSelectedGame] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const supabase = createClient()

  // Load filters from URL params
  useEffect(() => {
    const category = searchParams.get('category')
    const game = searchParams.get('game')
    const search = searchParams.get('search')
    
    if (category) setSelectedCategory(category)
    if (game) setSelectedGame(game)
    if (search) setSearchQuery(search)
  }, [searchParams])

  useEffect(() => {
    fetchListings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [listings, searchQuery, selectedCategory, selectedGame, selectedPlatform, priceRange, sortBy])

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles (
            username,
            rating
          )
        `)
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

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.game.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(listing => listing.category === selectedCategory)
    }

    // Game filter
    if (selectedGame !== 'all') {
      filtered = filtered.filter(listing => listing.game === selectedGame)
    }

    // Platform filter
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(listing => listing.platform === selectedPlatform)
    }

    // Price range filter
    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-10':
          filtered = filtered.filter(listing => listing.price < 10)
          break
        case '10-50':
          filtered = filtered.filter(listing => listing.price >= 10 && listing.price < 50)
          break
        case '50-100':
          filtered = filtered.filter(listing => listing.price >= 50 && listing.price < 100)
          break
        case 'over-100':
          filtered = filtered.filter(listing => listing.price >= 100)
          break
      }
    }

    // Sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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
    setPriceRange('all')
    setSortBy('newest')
  }

  // Get unique games from listings
  const uniqueGames = Array.from(new Set(listings.map(l => l.game)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Browse Marketplace</h1>
          <p className="text-gray-400">Discover gaming accounts, top-ups, and game keys</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Reset
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="all" className="bg-slate-800 text-white">All Categories</option>
                  <option value="account" className="bg-slate-800 text-white">Gaming Accounts</option>
                  <option value="topup" className="bg-slate-800 text-white">Top-Ups</option>
                  <option value="key" className="bg-slate-800 text-white">Game Keys</option>
                </select>
              </div>

              {/* Game Filter */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="all" className="bg-slate-800 text-white">All Games</option>
                  {uniqueGames.map(game => (
                    <option key={game} value={game} className="bg-slate-800 text-white">{game}</option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="all" className="bg-slate-800 text-white">All Platforms</option>
                  <option value="PC" className="bg-slate-800 text-white">PC</option>
                  <option value="PlayStation" className="bg-slate-800 text-white">PlayStation</option>
                  <option value="Xbox" className="bg-slate-800 text-white">Xbox</option>
                  <option value="Nintendo" className="bg-slate-800 text-white">Nintendo</option>
                  <option value="Mobile" className="bg-slate-800 text-white">Mobile</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Price Range</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="all" className="bg-slate-800 text-white">All Prices</option>
                  <option value="under-10" className="bg-slate-800 text-white">Under $10</option>
                  <option value="10-50" className="bg-slate-800 text-white">$10 - $50</option>
                  <option value="50-100" className="bg-slate-800 text-white">$50 - $100</option>
                  <option value="over-100" className="bg-slate-800 text-white">Over $100</option>
                </select>
              </div>

              {/* Quick Stats */}
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm text-gray-400">
                  Showing <span className="text-white font-semibold">{filteredListings.length}</span> of{' '}
                  <span className="text-white font-semibold">{listings.length}</span> listings
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Search & Sort Bar */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search listings..."
                    className="w-full px-4 py-3 pl-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="newest" className="bg-slate-800 text-white">Newest First</option>
                  <option value="oldest" className="bg-slate-800 text-white">Oldest First</option>
                  <option value="price-low" className="bg-slate-800 text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-slate-800 text-white">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="text-white mt-4">Loading listings...</p>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={resetFilters}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/listing/${listing.id}`}
                    className="group"
                  >
                    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                      {/* Image */}
                      <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        {listing.image_url ? (
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl">
                              {listing.category === 'account' ? '🎮' : listing.category === 'topup' ? '💰' : '🔑'}
                            </span>
                          </div>
                        )}
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-black/50 backdrop-blur-lg px-3 py-1 rounded-full text-xs text-white font-semibold">
                            {listing.category === 'account' ? 'Account' : listing.category === 'topup' ? 'Top-Up' : 'Key'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Game Name */}
                        <p className="text-sm text-purple-400 font-semibold mb-1">{listing.game}</p>
                        
                        {/* Title */}
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-purple-400 transition">
                          {listing.title}
                        </h3>

                        {/* Description */}
                        {listing.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {listing.description}
                          </p>
                        )}

                        {/* Platform */}
                        {listing.platform && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs bg-white/5 px-2 py-1 rounded text-gray-300">
                              {listing.platform}
                            </span>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          {/* Price */}
                          <div>
                            <p className="text-2xl font-bold text-green-400">
                              ${listing.price.toFixed(2)}
                            </p>
                          </div>

                          {/* Seller Info */}
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Seller</p>
                            <p className="text-sm text-white font-semibold">{listing.profiles?.username}</p>
                            {listing.profiles?.rating > 0 && (
                              <p className="text-xs text-yellow-400">★ {listing.profiles.rating.toFixed(1)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

// Main component wrapped with Suspense
export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}