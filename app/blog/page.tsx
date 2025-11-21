'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// Hardcoded blog posts for SEO
const blogPosts = [
  {
    slug: 'fortnite-account-safety-guide-2024',
    title: 'The Complete Guide to Fortnite Account Safety in 2024',
    excerpt: 'Learn essential tips to protect your Fortnite account from scammers, secure your V-Bucks, and maintain account integrity when buying or selling.',
    category: 'Guides',
    game: 'Fortnite',
    author: 'Nashflare Team',
    date: '2024-11-15',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop',
    tags: ['Fortnite', 'Account Safety', 'Security']
  },
  {
    slug: 'valorant-ranked-guide-climb-to-radiant',
    title: 'How to Climb to Radiant in Valorant: Pro Tips & Strategies',
    excerpt: 'Master the art of climbing the Valorant ranked ladder with proven strategies from professional players and high-ELO accounts.',
    category: 'Guides',
    game: 'Valorant',
    author: 'Nashflare Team',
    date: '2024-11-12',
    readTime: '12 min read',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop',
    tags: ['Valorant', 'Ranked', 'Gaming Tips']
  },
  {
    slug: 'gta-5-modded-accounts-ultimate-buyers-guide',
    title: 'GTA 5 Modded Accounts: The Ultimate Buyer\'s Guide',
    excerpt: 'Everything you need to know before purchasing a GTA 5 modded account - from safety precautions to what features to look for.',
    category: 'Buyers Guide',
    game: 'GTA 5',
    author: 'Nashflare Team',
    date: '2024-11-10',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop',
    tags: ['GTA 5', 'Modded Accounts', 'Buying Guide']
  },
  {
    slug: 'league-of-legends-smurf-accounts-explained',
    title: 'League of Legends Smurf Accounts: Everything You Need to Know',
    excerpt: 'Discover why smurf accounts are popular in League of Legends, how to identify quality accounts, and the best practices for purchasing.',
    category: 'Education',
    game: 'League of Legends',
    author: 'Nashflare Team',
    date: '2024-11-08',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&auto=format&fit=crop',
    tags: ['League of Legends', 'Smurf Accounts', 'Gaming']
  },
  {
    slug: 'roblox-limited-items-investment-guide-2024',
    title: 'Roblox Limited Items: Investment Guide for 2024',
    excerpt: 'Learn how to invest in Roblox limited items, understand market trends, and maximize your Robux returns with smart trading strategies.',
    category: 'Investment',
    game: 'Roblox',
    author: 'Nashflare Team',
    date: '2024-11-05',
    readTime: '11 min read',
    image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&auto=format&fit=crop',
    tags: ['Roblox', 'Limited Items', 'Investment']
  },
  {
    slug: 'clash-of-clans-base-building-ultimate-guide',
    title: 'Clash of Clans: The Ultimate Base Building Guide',
    excerpt: 'Master the art of base building in Clash of Clans with layouts that defend against any attack strategy and protect your resources.',
    category: 'Guides',
    game: 'Clash of Clans',
    author: 'Nashflare Team',
    date: '2024-11-03',
    readTime: '14 min read',
    image: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=800&auto=format&fit=crop',
    tags: ['Clash of Clans', 'Base Building', 'Strategy']
  },
  {
    slug: 'gaming-marketplace-safety-avoiding-scams',
    title: 'Gaming Marketplace Safety: How to Avoid Scams',
    excerpt: 'Essential safety tips for buying and selling gaming accounts, items, and currency across all major gaming marketplaces.',
    category: 'Safety',
    game: 'General',
    author: 'Nashflare Team',
    date: '2024-11-01',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop',
    tags: ['Safety', 'Scam Prevention', 'Marketplace']
  },
  {
    slug: 'best-gaming-accounts-to-buy-2024',
    title: 'Best Gaming Accounts to Buy in 2024',
    excerpt: 'Explore the most valuable and sought-after gaming accounts across popular games including Fortnite, Valorant, and GTA 5.',
    category: 'Reviews',
    game: 'General',
    author: 'Nashflare Team',
    date: '2024-10-28',
    readTime: '13 min read',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&auto=format&fit=crop',
    tags: ['Gaming Accounts', 'Reviews', '2024']
  }
]

const categories = ['All', 'Guides', 'Buyers Guide', 'Education', 'Investment', 'Safety', 'Reviews']
const popularGames = ['All Games', 'Fortnite', 'Valorant', 'GTA 5', 'League of Legends', 'Roblox', 'Clash of Clans', 'General']

export default function BlogPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedGame, setSelectedGame] = useState('All Games')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState(blogPosts)

  useEffect(() => {
    applyFilters()
  }, [selectedCategory, selectedGame, searchQuery])

  const applyFilters = () => {
    let filtered = [...blogPosts]

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Performance-Optimized Cosmic Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-blue-600/15 rounded-full blur-[90px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating particles */}
        <div className="absolute top-[10%] left-[5%] w-2 h-2 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDuration: '3s', animationDelay: '0s' }}></div>
        <div className="absolute top-[60%] left-[15%] w-1.5 h-1.5 bg-pink-400/30 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-2 h-2 bg-blue-400/30 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[80%] right-[25%] w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[50%] left-[50%] w-2 h-2 bg-pink-400/30 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 pt-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
            <span className="text-purple-300 text-sm font-semibold">📚 Gaming Knowledge Hub</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Nashflare <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">Blog</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Expert guides, tips, and insights for gaming marketplaces, account trading, and game strategies
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>

          {/* Category & Game Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50'
                      : 'bg-slate-900/60 text-gray-400 hover:text-white hover:bg-slate-800/60 border border-white/10'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Game Filter */}
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="px-4 py-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {popularGames.map((game) => (
                <option key={game} value={game} className="bg-slate-900">
                  {game}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-gray-400">
              Showing <span className="text-white font-semibold">{filteredPosts.length}</span> of{' '}
              <span className="text-white font-semibold">{blogPosts.length}</span> articles
            </p>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No articles found</h3>
            <p className="text-gray-400">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-purple-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-gray-400 mb-4 line-clamp-3 text-sm">
                    {post.excerpt}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-slate-800/60 text-gray-400 text-xs rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-white/10">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
          <div className="text-5xl mb-6">📬</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Gaming Insights
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Get the latest guides, marketplace tips, and gaming strategies delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-slate-900/60 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}