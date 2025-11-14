// app/dashboard/page.tsx - UPDATED VENDOR DASHBOARD WITH DISPUTE SYSTEM SUPPORT

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function VendorDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [myListings, setMyListings] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'orders'>('listings')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    checkCart()
    
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
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        router.push('/login')
        return
      }

      setProfile(profileData)

      if (profileData?.role !== 'vendor') {
        router.push('/customer-dashboard')
        return
      }

      await fetchMyListings(user.id)
      await fetchMyOrders(user.id)
      setLoading(false)
    } catch (error) {
      console.error('Check user error:', error)
      router.push('/login')
    }
  }

  const fetchMyListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .neq('status', 'removed') // ✅ Exclude soft-deleted listings
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch listings error:', error)
        return
      }
      
      setMyListings(data || [])
    } catch (error) {
      console.error('Error fetching listings:', error)
    }
  }

  const fetchMyOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          listing:listings (
            title,
            game,
            image_url,
            category
          ),
          buyer:profiles!buyer_id (
            username
          )
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch orders error:', error)
        return
      }
      
      setMyOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
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

  if (profile?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be a vendor to access this page.</p>
          <Link href="/customer-dashboard" className="text-purple-400 hover:text-purple-300">
            Go to Customer Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  const activeListings = myListings.filter(l => l.status === 'active')
  
  // ✅ UPDATED: Only count revenue from COMPLETED orders (not delivered)
  // Delivered orders are in 48-hour confirmation period and funds are on hold
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0)
  
  // ✅ UPDATED: Pending includes paid, delivered (awaiting confirmation), and disputes
  const pendingOrders = myOrders.filter(o => 
    o.status === 'paid' || 
    o.status === 'delivered' || 
    o.status === 'dispute_raised'
  )

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
              <Link href="/messages" className="text-gray-300 hover:text-white transition">
                Messages
              </Link>
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
                      {profile?.username?.charAt(0).toUpperCase() || 'V'}
                    </span>
                  </div>
                  <span className="text-white">{profile?.username || 'Vendor'}</span>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]">
                  <Link href="/dashboard" className="block px-4 py-3 text-white hover:bg-white/10 rounded-t-lg">
                    Dashboard
                  </Link>
                  <Link href="/sell" className="block px-4 py-3 text-white hover:bg-white/10">
                    Create Listing
                  </Link>
                  <Link href="/messages" className="block px-4 py-3 text-white hover:bg-white/10">
                    Messages
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
              Vendor Dashboard
            </h1>
            <p className="text-gray-300">
              Welcome back, {profile?.username}! Manage your listings and sales here.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-gray-400 text-sm">Total Revenue</div>
              <div className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">From completed orders only</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-gray-400 text-sm">Active Listings</div>
              <div className="text-3xl font-bold text-white">{activeListings.length}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-gray-400 text-sm">Pending Orders</div>
              <div className="text-3xl font-bold text-white">{pendingOrders.length}</div>
              <div className="text-xs text-gray-500 mt-1">Paid + Delivered + Disputes</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-gray-400 text-sm">Completed Sales</div>
              <div className="text-3xl font-bold text-white">{completedOrders.length}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/sell"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">Create Listing</h3>
              <p className="text-gray-400 text-sm">List a new item for sale</p>
            </Link>
            <Link
              href="/messages"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">Messages</h3>
              <p className="text-gray-400 text-sm">Chat with buyers</p>
            </Link>
            <Link
              href="/browse"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="text-xl font-bold text-white mb-2">Browse</h3>
              <p className="text-gray-400 text-sm">Explore the marketplace</p>
            </Link>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <div className="flex space-x-4 mb-6 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'listings'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Listings ({myListings.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'orders'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Orders ({myOrders.length})
              </button>
            </div>

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">My Listings</h2>
                  <Link
                    href="/sell"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
                  >
                    + Create Listing
                  </Link>
                </div>

                {myListings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-white mb-2">No listings yet</h3>
                    <p className="text-gray-400 mb-6">Create your first listing to start selling!</p>
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
                      <div key={listing.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition">
                        <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          {listing.image_url ? (
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                              {listing.category === 'account' ? '🎮' : listing.category === 'topup' ? '💰' : '🔑'}
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              listing.status === 'active' ? 'bg-green-500/90 text-white' :
                              listing.status === 'sold' ? 'bg-gray-500/90 text-white' :
                              listing.status === 'out_of_stock' ? 'bg-yellow-500/90 text-white' :
                              'bg-red-500/90 text-white'
                            }`}>
                              {listing.status === 'out_of_stock' ? 'Out of Stock' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-1 truncate">{listing.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{listing.game}</p>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xl font-bold text-white">${listing.price}</span>
                            <span className="text-sm text-gray-400">
                              Stock: {listing.stock} | {listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/listing/${listing.id}`}
                              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg text-sm font-semibold text-center transition"
                            >
                              View
                            </Link>
                            <Link
                              href={`/listing/${listing.id}/edit`}
                              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg text-sm font-semibold text-center transition"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">My Orders</h2>

                {myOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-6">Your sales will appear here once customers start buying!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myOrders.map((order: any) => (
                      <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            {order.listing?.image_url ? (
                              <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="text-2xl">
                                {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'topup' ? '💰' : '🔑'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{order.listing?.title || 'Unknown Item'}</h4>
                            <p className="text-sm text-gray-400">Buyer: {order.buyer?.username}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">${order.amount}</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              order.status === 'delivered' ? 'bg-yellow-500/20 text-yellow-400' :
                              order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                              order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                              order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                              'bg-purple-500/20 text-purple-400'
                            }`}>
                              {order.status === 'delivered' ? 'Awaiting Confirmation' :
                               order.status === 'dispute_raised' ? 'Dispute Active' :
                               order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                            </span>
                          </div>
                          <Link
                            href={`/order/${order.id}`}
                            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}