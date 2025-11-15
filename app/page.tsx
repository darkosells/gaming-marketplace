'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'

export default function Home() {
  const router = useRouter()

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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20">
          <div className="container mx-auto px-4">
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                  🚀 The #1 Gaming Marketplace
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Level Up Your
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"> Gaming Experience</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Buy and sell gaming accounts, top-ups, and keys with complete security. Join thousands of gamers trading safely.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                  <div className="relative">
                    <input
                      type="text"
                      name="search"
                      placeholder="Search for games, accounts, items..."
                      className="w-full px-6 py-4 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">10K+</div>
                  <div className="text-gray-500 text-sm">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent mb-2">50K+</div>
                  <div className="text-gray-500 text-sm">Listings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">99.9%</div>
                  <div className="text-gray-500 text-sm">Safe Trades</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              What Are You Looking For?
            </h2>
            <p className="text-gray-500 text-center mb-12">Choose your category and start exploring</p>

            <div className="grid md:grid-cols-3 gap-8">
              <Link href="/browse?category=account" className="group">
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-white/5 p-8 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🎮</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Gaming Accounts</h3>
                    <p className="text-gray-400 mb-4">
                      High-level accounts with rare skins, achievements, and more
                    </p>
                    <div className="flex items-center text-purple-400 font-semibold group-hover:text-purple-300">
                      Browse Accounts
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/browse?category=topup" className="group">
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-white/5 p-8 hover:border-pink-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">💰</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Top-Ups & Currency</h3>
                    <p className="text-gray-400 mb-4">
                      Instant delivery of in-game currency and credits
                    </p>
                    <div className="flex items-center text-pink-400 font-semibold group-hover:text-pink-300">
                      Browse Top-Ups
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/browse?category=key" className="group">
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-lg border border-white/5 p-8 hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
                  <div className="relative">
                    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">🔑</div>
                    <h3 className="text-2xl font-bold text-white mb-3">Game Keys</h3>
                    <p className="text-gray-400 mb-4">
                      Activation codes for PC, Xbox, PlayStation, and more
                    </p>
                    <div className="flex items-center text-blue-400 font-semibold group-hover:text-blue-300">
                      Browse Keys
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Popular Games Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
              Popular Games
            </h2>
            <p className="text-gray-500 text-center mb-12">
              Browse accounts, items, and currency for the most popular games
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {games.map((game) => (
                <Link
                  key={game.name}
                  href={`/browse?game=${encodeURIComponent(game.name)}`}
                  className="group relative overflow-hidden rounded-xl bg-slate-900/30 backdrop-blur-lg border border-white/5 p-6 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-3 group-hover:scale-125 transition-transform duration-300">{game.icon}</div>
                    <h3 className="text-white font-semibold mb-1">{game.name}</h3>
                    <p className="text-xs text-gray-500">{game.category}</p>
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
            <p className="text-gray-500 text-center mb-12">
              Trading made simple and secure in 3 easy steps
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Browse & Choose</h3>
                <p className="text-gray-400">
                  Search through thousands of verified listings and find exactly what you need
                </p>
              </div>

              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Secure Payment</h3>
                <p className="text-gray-400">
                  Your payment is held securely until you confirm delivery and satisfaction
                </p>
              </div>

              <div className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    3
                  </div>
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
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="group">
                <div className="w-16 h-16 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:border-purple-500/30 transition">🔒</div>
                <h3 className="text-white font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-500 text-sm">Bank-level encryption</p>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:border-green-500/30 transition">✓</div>
                <h3 className="text-white font-semibold mb-2">Verified Sellers</h3>
                <p className="text-gray-500 text-sm">Every seller is verified</p>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:border-blue-500/30 transition">💬</div>
                <h3 className="text-white font-semibold mb-2">24/7 Support</h3>
                <p className="text-gray-500 text-sm">Always here to help</p>
              </div>
              <div className="group">
                <div className="w-16 h-16 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:border-yellow-500/30 transition">⚡</div>
                <h3 className="text-white font-semibold mb-2">Instant Delivery</h3>
                <p className="text-gray-500 text-sm">Get your items fast</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
              <div className="relative text-center bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                  Ready to Start Trading?
                </h2>
                <p className="text-xl text-gray-400 mb-8">
                  Join thousands of gamers buying and selling safely on GameVault
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href="/browse"
                    className="bg-slate-800/50 backdrop-blur-lg text-white px-8 py-4 rounded-lg font-semibold text-lg border border-white/10 hover:bg-slate-700/50 transition"
                  >
                    Browse Listings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎮</span>
                  </div>
                  <span className="text-lg font-bold text-white">GameVault</span>
                </div>
                <p className="text-gray-500 text-sm">
                  The most trusted marketplace for gaming assets.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Marketplace</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/browse?category=account" className="hover:text-white transition">Gaming Accounts</Link></li>
                  <li><Link href="/browse?category=topup" className="hover:text-white transition">Top-Ups</Link></li>
                  <li><Link href="/browse?category=key" className="hover:text-white transition">Game Keys</Link></li>
                  <li><Link href="/browse" className="hover:text-white transition">All Items</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                  <li><Link href="/browse" className="hover:text-white transition">How It Works</Link></li>
                  <li><Link href="/support" className="hover:text-white transition">Support</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2024 GameVault. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}