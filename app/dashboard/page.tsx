// COPY THIS ENTIRE CODE and replace your app/dashboard/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [myListings, setMyListings] = useState<any[]>([])
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
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    // Get profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    // Redirect customers to customer dashboard
    if (profileData?.role === 'customer') {
      router.push('/customer-dashboard')
      return
    }

    // Fetch user's listings
    await fetchMyListings(user.id)
    
    setLoading(false)
  }

  const fetchMyListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 relative z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <span className="text-xl font-bold text-white">GameVault</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/browse" className="text-gray-300 hover:text-white transition">
                Browse
              </Link>
              <Link href="/sell" className="text-gray-300 hover:text-white transition">
                Sell
              </Link>
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
              <div className="relative group z-[9999]">
                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-white">{profile?.username || 'Account'}</span>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {profile?.username}! 👋
            </h1>
            <p className="text-gray-400">
              Email: {user?.email}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-2">🛒</div>
              <h3 className="text-white font-semibold mb-1">Purchases</h3>
              <p className="text-3xl font-bold text-white">0</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-2">💰</div>
              <h3 className="text-white font-semibold mb-1">Active Listings</h3>
              <p className="text-3xl font-bold text-white">{myListings.filter(l => l.status === 'active').length}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="text-white font-semibold mb-1">Rating</h3>
              <p className="text-3xl font-bold text-white">{profile?.rating || '0.0'}</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link href="/sell" className="group">
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
                <div className="text-5xl mb-4 group-hover:scale-110 transition">📝</div>
                <h3 className="text-2xl font-bold text-white mb-2">Create a Listing</h3>
                <p className="text-gray-400">Start selling your gaming accounts, items, or keys</p>
              </div>
            </Link>

            <Link href="/browse" className="group">
              <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:border-pink-500/50 transition-all">
                <div className="text-5xl mb-4 group-hover:scale-110 transition">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">Browse Listings</h3>
                <p className="text-gray-400">Find accounts, top-ups, and game keys</p>
              </div>
            </Link>
          </div>

          {/* My Listings */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">My Listings</h2>
            {myListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-400">No listings yet</p>
                <p className="text-sm text-gray-500 mt-2 mb-4">Start selling by creating your first listing</p>
                <Link
                  href="/sell"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Create Listing
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <div key={listing.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {/* Image */}
                    <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      {listing.image_url ? (
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-5xl">
                            {listing.category === 'account' ? '🎮' : listing.category === 'topup' ? '💰' : '🔑'}
                          </span>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          listing.status === 'active' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                            : listing.status === 'sold'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <p className="text-xs text-purple-400 font-semibold mb-1">{listing.game}</p>
                      <h3 className="text-white font-semibold mb-2 line-clamp-2">{listing.title}</h3>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xl font-bold text-green-400">${listing.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">{listing.stock} in stock</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/listing/${listing.id}`}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 px-3 rounded-lg text-sm font-semibold text-center transition"
                        >
                          View
                        </Link>
                        <Link
                          href={`/listing/${listing.id}/edit`}
                          className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 px-3 rounded-lg text-sm font-semibold text-center transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}