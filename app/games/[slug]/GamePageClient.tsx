'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import { getGameBySlug } from '@/lib/games-config'

interface Props {
  slug: string
}

export default function GamePageClient({ slug }: Props) {
  const [listings, setListings] = useState<any[]>([])
  const [filteredListings, setFilteredListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const supabase = createClient()
  const game = getGameBySlug(slug)

  useEffect(() => {
    if (game) {
      fetchListings()
    }
  }, [slug])

  useEffect(() => {
    applyFilters()
  }, [listings, selectedCategory, priceRange, sortBy])

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

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((listing) => listing.category === selectedCategory)
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
    setSelectedCategory('all')
    setPriceRange('all')
    setSortBy('newest')
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
                  <h2 className="text-xl font-bold text-white">Filters</h2>
                  <button onClick={resetFilters} className="text-sm text-purple-400 hover:text-purple-300 transition font-medium">
                    Reset
                  </button>
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

                {/* Sort By */}
                <div className="mb-6">
                  <label htmlFor="sort-by" className="block text-white font-semibold mb-3 text-sm">
                    Sort By
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 appearance-none cursor-pointer transition-all duration-300 hover:border-purple-500/30"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '3rem',
                    }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-white/10">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4">
                    <p className="text-sm text-gray-400" role="status" aria-live="polite">
                      Showing{' '}
                      <span className="text-white font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {filteredListings.length}
                      </span>{' '}
                      listings
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="flex-1" aria-label={`${game.name} listings`}>
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
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6" role="list">
                  {filteredListings.map((listing) => (
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
                          {listing.stock <= 3 && listing.stock > 0 && (
                            <div className="absolute top-3 right-3">
                              <span className="bg-orange-500/80 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold">
                                Only {listing.stock} left!
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="relative p-5">
                          <h3 className="text-white font-bold text-lg mb-2 group-hover:text-purple-400 transition line-clamp-1">
                            {listing.title}
                          </h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{listing.description}</p>
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
              )}
            </section>
          </div>
        </main>

        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12" role="contentinfo">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}