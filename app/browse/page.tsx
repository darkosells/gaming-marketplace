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

function BrowseContent() {
  const [listings, setListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedGame, setSelectedGame] = useState('all')
  const [selectedPlatform, setSelectedPlatform] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const supabase = createClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize filters from URL params
    const categoryParam = searchParams.get('category')
    const gameParam = searchParams.get('game')
    const searchParam = searchParams.get('search')
    
    if (categoryParam) setSelectedCategory(categoryParam)
    if (gameParam) setSelectedGame(gameParam)
    if (searchParam) setSearchQuery(searchParam)
    
    fetchListings()
  }, [searchParams])

  useEffect(() => { applyFilters() }, [listings, searchQuery, selectedCategory, selectedGame, selectedPlatform, priceRange, sortBy])

  // Reset game selection when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      // Check if current game is valid for new category
      const validGames = categoryGamesMap[selectedCategory] || []
      if (!validGames.includes(selectedGame)) {
        setSelectedGame('all')
      }
    }
  }, [selectedCategory])

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

    if (priceRange !== 'all') {
      switch (priceRange) {
        case 'under-10': filtered = filtered.filter(l => l.price < 10); break
        case '10-50': filtered = filtered.filter(l => l.price >= 10 && l.price < 50); break
        case '50-100': filtered = filtered.filter(l => l.price >= 50 && l.price < 100); break
        case 'over-100': filtered = filtered.filter(l => l.price >= 100); break
      }
    }

    switch (sortBy) {
      case 'newest': filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'price-low': filtered.sort((a, b) => a.price - b.price); break
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break
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

  // Get available games based on selected category
  const getAvailableGames = () => {
    if (selectedCategory === 'all') {
      // Show all unique games from listings when no category is selected
      return Array.from(new Set(listings.map(l => l.game)))
    }
    return categoryGamesMap[selectedCategory] || []
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
                      Showing <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{filteredListings.length}</span> of <span className="text-white font-semibold">{listings.length}</span> listings
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
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}>
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredListings.map((listing) => (
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
                          <div className="absolute top-3 left-3">
                            <span className="bg-black/60 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold border border-white/10">
                              {listing.category === 'account' ? '🎮 Account' : listing.category === 'items' ? '🎒 Items' : listing.category === 'currency' ? '💰 Currency' : '🔑 Key'}
                            </span>
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
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{listing.description}</p>
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
              )}
            </main>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

// Main component wrapped with Suspense
export default function BrowsePage() {
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