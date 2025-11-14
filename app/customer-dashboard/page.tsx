// app/customer-dashboard/page.tsx - FIXED CUSTOMER DASHBOARD

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [myOrders, setMyOrders] = useState<any[]>([])
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

      // CRITICAL: Redirect vendors to vendor dashboard
      if (profileData?.role === 'vendor') {
        console.log('User is a vendor, redirecting to vendor dashboard')
        router.push('/dashboard')
        return
      }

      await fetchMyOrders(user.id)
      setLoading(false)
    } catch (error) {
      console.error('Check user error:', error)
      router.push('/login')
    }
  }

  const fetchMyOrders = async (userId: string) => {
    try {
      console.log('🔍 Fetching orders for user:', userId)
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Fetch orders error:', error)
        return
      }
      
      console.log('📦 Raw orders data from database:', data)
      
      // Use snapshot data stored in the order
      const ordersWithListings = (data || []).map((order: any) => {
        // Use snapshot data from order columns (fallback to 'Unknown' if not available)
        const listingSnapshot = {
          title: order.listing_title || 'Unknown Item',
          game: order.listing_game || 'N/A',
          category: order.listing_category || 'account',
          image_url: order.listing_image_url || null
        }
        
        console.log(`Order ${order.id}:`, {
          hasSnapshot: !!order.listing_title,
          listingTitle: listingSnapshot.title,
          snapshotData: listingSnapshot
        })
        
        return {
          ...order,
          listing: listingSnapshot
        }
      })
      
      console.log('✅ Final orders with listings:', ordersWithListings)
      setMyOrders(ordersWithListings)
    } catch (error) {
      console.error('💥 Error fetching orders:', error)
    }
  }

  const handleBecomeVendor = async () => {
    const confirmed = confirm('Are you sure you want to become a vendor? This will give you access to sell items on the marketplace.')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: 'vendor',
          vendor_since: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Success! You are now a vendor. Redirecting to vendor dashboard...')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update account. Please try again.')
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

  // If we get here and user is not a customer, show error
  if (profile?.role !== 'customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">This page is for customers only.</p>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
            Go to Vendor Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  const pendingOrders = myOrders.filter(o => o.status === 'pending')
  const completedOrders = myOrders.filter(o => o.status === 'completed')

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
                      {profile?.username?.charAt(0).toUpperCase() || 'C'}
                    </span>
                  </div>
                  <span className="text-white">{profile?.username || 'Customer'}</span>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]">
                  <Link href="/customer-dashboard" className="block px-4 py-3 text-white hover:bg-white/10 rounded-t-lg">
                    My Account
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
              Welcome, {profile?.username}!
            </h1>
            <p className="text-gray-300">
              Manage your orders and account here.
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">📦</div>
              <div className="text-gray-400 text-sm">Total Orders</div>
              <div className="text-3xl font-bold text-white">{myOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">⏳</div>
              <div className="text-gray-400 text-sm">Pending</div>
              <div className="text-3xl font-bold text-white">{pendingOrders.length}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-2">✅</div>
              <div className="text-gray-400 text-sm">Completed</div>
              <div className="text-3xl font-bold text-white">{completedOrders.length}</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/browse"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">🎮</div>
              <h3 className="text-xl font-bold text-white mb-2">Browse Listings</h3>
              <p className="text-gray-400 text-sm">Find gaming accounts, top-ups & keys</p>
            </Link>
            <Link
              href="/messages"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">Messages</h3>
              <p className="text-gray-400 text-sm">Chat with sellers</p>
            </Link>
            <Link
              href="/customer-dashboard"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">Manage your account</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Orders</h2>

            {myOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-white mb-2">No orders yet</h3>
                <p className="text-gray-400 mb-6">Start shopping to see your orders here!</p>
                <Link
                  href="/browse"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order: any) => (
                  <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition">
                    <div className="flex items-center gap-4">
                      {/* ✅ FIXED: Added optional chaining for all listing properties */}
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        {order.listing?.image_url ? (
                          <img src={order.listing.image_url} alt={order.listing.title || 'Item'} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-2xl">
                            {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'topup' ? '💰' : '🔑'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{order.listing?.title || 'Unknown Item'}</h4>
                        <p className="text-sm text-gray-400">{order.listing?.game || 'N/A'}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">${order.amount}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          order.status === 'disputed' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <Link
                        href={`/order/${order.id}`}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition inline-block"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Become Vendor Card */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Want to start selling?</h3>
                <p className="text-gray-300">
                  Upgrade to a vendor account to list and sell gaming items on GameVault
                </p>
              </div>
              <button
                onClick={handleBecomeVendor}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition whitespace-nowrap"
              >
                Become a Vendor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}