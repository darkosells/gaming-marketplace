// Replace your entire app/page.tsx with this updated code

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    checkCart()
    
    // Listen for cart updates
    const handleStorageChange = () => checkCart()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart-updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart-updated', handleStorageChange)
    }
  }, [])

  const checkCart = () => {
    const cart = localStorage.getItem('cart')
    setCartItemCount(cart ? 1 : 0)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.refresh()
  }

  const games = [
    { name: 'Fortnite', icon: '🎮', category: 'Battle Royale' },
    { name: 'League of Legends', icon: '⚔️', category: 'MOBA' },
    { name: 'Valorant', icon: '🎯', category: 'FPS' },
    { name: 'Genshin Impact', icon: '🗡️', category: 'RPG' },
    { name: 'GTA 5', icon: '🚗', category: 'Action' },
    { name: 'Clash of Clans', icon: '🏰', category: 'Strategy' },
    { name: 'Roblox', icon: '🎲', category: 'Sandbox' },
    { name: 'Minecraft', icon: '⛏️', category: 'Sandbox' },
    { name: 'CS:GO', icon: '🔫', category: 'FPS' },
    { name: 'Apex Legends', icon: '🏆', category: 'Battle Royale' },
  ]

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (query) {
      router.push(`/browse?search=${encodeURIComponent(query)}`)
    } else {
      router.push('/browse')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <span className="text-xl font-bold text-white">GameVault</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <div 
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <button className="text-gray-300 hover:text-white transition flex items-center space-x-1">
                  <span>Browse Games</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Mega Menu */}
                {megaMenuOpen && (
                  <div className="absolute top-full left-0 w-screen max-w-4xl mt-2 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8">
                    <div className="grid grid-cols-3 gap-6">
                      {/* Categories */}
                      <div>
                        <h3 className="text-purple-400 font-semibold mb-4">Categories</h3>
                        <ul className="space-y-2">
                          <li>
                            <Link href="/browse?category=account" className="text-gray-300 hover:text-white transition">
                              Gaming Accounts
                            </Link>
                          </li>
                          <li>
                            <Link href="/browse?category=topup" className="text-gray-300 hover:text-white transition">
                              Top-Ups
                            </Link>
                          </li>
                          <li>
                            <Link href="/browse?category=key" className="text-gray-300 hover:text-white transition">
                              Game Keys
                            </Link>
                          </li>
                          <li>
                            <Link href="/browse" className="text-gray-300 hover:text-white transition">
                              All Items
                            </Link>
                          </li>
                        </ul>
                      </div>

                      {/* Popular Games */}
                      <div className="col-span-2">
                        <h3 className="text-purple-400 font-semibold mb-4">Popular Games</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {games.map((game) => (
                            <Link
                              key={game.name}
                              href={`/browse?game=${encodeURIComponent(game.name)}`}
                              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition group"
                            >
                              <span className="text-2xl group-hover:scale-110 transition">{game.icon}</span>
                              <div>
                                <div className="text-white font-medium">{game.name}</div>
                                <div className="text-xs text-gray-400">{game.category}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/browse" className="text-gray-300 hover:text-white transition">
                Browse All
              </Link>
              <Link href="/sell" className="text-gray-300 hover:text-white transition">
                Sell
              </Link>
            </div>

            {/* Right Side Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Cart Icon */}
                  <Link href="/cart" className="relative text-gray-300 hover:text-white transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                    Dashboard
                  </Link>
                  <div className="relative group">
                    <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="text-white">{profile?.username || 'Account'}</span>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <Link href="/dashboard" className="block px-4 py-3 text-white hover:bg-white/10 rounded-t-lg">
                        Dashboard
                      </Link>
                      <Link href="/sell" className="block px-4 py-3 text-white hover:bg-white/10">
                        Create Listing
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-b-lg">
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-300 hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4">
              <Link href="/browse?category=account" className="block text-gray-300 hover:text-white">Gaming Accounts</Link>
              <Link href="/browse?category=topup" className="block text-gray-300 hover:text-white">Top-Ups</Link>
              <Link href="/browse?category=key" className="block text-gray-300 hover:text-white">Game Keys</Link>
              <Link href="/browse" className="block text-gray-300 hover:text-white">Browse All</Link>
              {user ? (
                <>
                  <Link href="/dashboard" className="block text-gray-300 hover:text-white">Dashboard</Link>
                  <Link href="/sell" className="block text-gray-300 hover:text-white">Sell</Link>
                  <button onClick={handleLogout} className="block text-red-400 hover:text-red-300 w-full text-left">Logout</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-gray-300 hover:text-white">Login</Link>
                  <Link href="/signup" className="block text-purple-400 hover:text-purple-300">Sign Up</Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Level Up Your
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Gaming Experience</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Buy and sell gaming accounts, top-ups, and keys with complete security. Join thousands of gamers trading safely.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  placeholder="Search for games, accounts, items..."
                  className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-2 rounded-full font-semibold hover:shadow-lg transition"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
                <div className="text-gray-400 text-sm">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50K+</div>
                <div className="text-gray-400 text-sm">Listings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="text-gray-400 text-sm">Safe Trades</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            What Are You Looking For?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Gaming Accounts */}
            <Link href="/browse?category=account" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-white/10 p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="text-6xl mb-4 group-hover:scale-110 transition">🎮</div>
                <h3 className="text-2xl font-bold text-white mb-3">Gaming Accounts</h3>
                <p className="text-gray-300 mb-4">
                  High-level accounts with rare skins, achievements, and more
                </p>
                <div className="flex items-center text-purple-400 font-semibold">
                  Browse Accounts
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Top-Ups */}
            <Link href="/browse?category=topup" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg border border-white/10 p-8 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20">
                <div className="text-6xl mb-4 group-hover:scale-110 transition">💰</div>
                <h3 className="text-2xl font-bold text-white mb-3">Top-Ups & Currency</h3>
                <p className="text-gray-300 mb-4">
                  Instant delivery of in-game currency and credits
                </p>
                <div className="flex items-center text-pink-400 font-semibold">
                  Browse Top-Ups
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Game Keys */}
            <Link href="/browse?category=key" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg border border-white/10 p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="text-6xl mb-4 group-hover:scale-110 transition">🔑</div>
                <h3 className="text-2xl font-bold text-white mb-3">Game Keys</h3>
                <p className="text-gray-300 mb-4">
                  Activation codes for PC, Xbox, PlayStation, and more
                </p>
                <div className="flex items-center text-blue-400 font-semibold">
                  Browse Keys
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Games Section */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Popular Games
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Browse accounts, items, and currency for the most popular games
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {games.map((game) => (
              <Link
                key={game.name}
                href={`/browse?game=${encodeURIComponent(game.name)}`}
                className="group relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:scale-110 transition">{game.icon}</div>
                  <h3 className="text-white font-semibold mb-1">{game.name}</h3>
                  <p className="text-xs text-gray-400">{game.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Trading made simple and secure in 3 easy steps
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Browse & Choose</h3>
              <p className="text-gray-400">
                Search through thousands of verified listings and find exactly what you need
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure Payment</h3>
              <p className="text-gray-400">
                Your payment is held securely until you confirm delivery and satisfaction
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Get Your Items</h3>
              <p className="text-gray-400">
                Receive your account, currency, or key instantly and start playing!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="text-white font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-400 text-sm">Bank-level encryption</p>
            </div>
            <div>
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-white font-semibold mb-2">Verified Sellers</h3>
              <p className="text-gray-400 text-sm">Every seller is verified</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-white font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-400 text-sm">Always here to help</p>
            </div>
            <div>
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">Instant Delivery</h3>
              <p className="text-gray-400 text-sm">Get your items fast</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-3xl p-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of gamers buying and selling safely on GameVault
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition"
              >
                Create Free Account
              </Link>
              <Link
                href="/browse"
                className="bg-white/10 backdrop-blur-lg text-white px-8 py-4 rounded-lg font-semibold text-lg border border-white/20 hover:bg-white/20 transition"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-lg border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎮</span>
                </div>
                <span className="text-lg font-bold text-white">GameVault</span>
              </div>
              <p className="text-gray-400 text-sm">
                The most trusted marketplace for gaming assets.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/browse?category=account" className="hover:text-white transition">Gaming Accounts</Link></li>
                <li><Link href="/browse?category=topup" className="hover:text-white transition">Top-Ups</Link></li>
                <li><Link href="/browse?category=key" className="hover:text-white transition">Game Keys</Link></li>
                <li><Link href="/browse" className="hover:text-white transition">All Items</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/browse" className="hover:text-white transition">How It Works</Link></li>
                <li><Link href="/support" className="hover:text-white transition">Support</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}