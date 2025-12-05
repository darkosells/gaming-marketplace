'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { blogPostsMeta, categories, popularGames } from '@/lib/blog'

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedGame, setSelectedGame] = useState('All Games')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState(blogPostsMeta)

  useEffect(() => {
    applyFilters()
  }, [selectedCategory, selectedGame, searchQuery])

  const applyFilters = () => {
    let filtered = [...blogPostsMeta]

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    // Game filter
    if (selectedGame !== 'All Games') {
      filtered = filtered.filter(post => post.game === selectedGame)
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredPosts(filtered)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Optimized Background - Subtle gradient, no blur orbs, no animations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
        {/* Subtle purple tint at top only */}
        <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-purple-950/30 to-transparent"></div>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <Navigation />

      <main className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Nashflare <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Blog</span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Expert guides, tips, and insights for buying and selling gaming accounts, items, and currency.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-10 space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                ))}
              </select>

              {/* Game Filter */}
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
              >
                {popularGames.map(game => (
                  <option key={game} value={game} className="bg-slate-900">{game}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Blog Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-purple-600/80 text-white text-xs font-medium rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span>{post.game}</span>
                      <span>•</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 text-sm line-clamp-3 flex-grow">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center text-purple-400 text-sm font-medium">
                      Read More
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Articles Found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query.</p>
            </div>
          )}

          {/* Newsletter CTA */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Stay Updated</h2>
            <p className="text-gray-300 mb-6 max-w-xl mx-auto">
              Get the latest guides, tips, and marketplace updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-grow px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all min-h-[44px]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}