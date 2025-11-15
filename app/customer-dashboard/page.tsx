// app/customer-dashboard/page.tsx - CUSTOMER DASHBOARD WITH ORDER PAGINATION

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 5
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch orders error:', error)
        return
      }
      
      // Use snapshot data stored in the order
      const ordersWithListings = (data || []).map((order: any) => {
        const listingSnapshot = {
          title: order.listing_title || 'Unknown Item',
          game: order.listing_game || 'N/A',
          category: order.listing_category || 'account',
          image_url: order.listing_image_url || null
        }
        
        return {
          ...order,
          listing: listingSnapshot
        }
      })
      
      setMyOrders(ordersWithListings)
    } catch (error) {
      console.error('Error fetching orders:', error)
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

  const pendingOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'paid' || o.status === 'delivered')
  const completedOrders = myOrders.filter(o => o.status === 'completed')

  // Pagination calculations
  const totalPages = Math.ceil(myOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = myOrders.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of orders section
    document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

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
              href="/settings"
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:border-purple-500/50 transition group"
            >
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Settings</h3>
              <p className="text-gray-400 text-sm">Manage your account</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div id="orders-section" className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
              {myOrders.length > 0 && (
                <span className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, myOrders.length)} of {myOrders.length} orders
                </span>
              )}
            </div>

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
              <>
                <div className="space-y-4">
                  {currentOrders.map((order: any) => (
                    <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition">
                      <div className="flex items-center gap-4">
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
                          <p className="text-xl font-bold text-white">${parseFloat(order.amount).toFixed(2)}</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'pending' || order.status === 'paid' ? 'bg-yellow-500/20 text-yellow-400' :
                            order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                            order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                            order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {order.status === 'paid' ? 'Paid' :
                             order.status === 'delivered' ? 'Delivered' :
                             order.status === 'dispute_raised' ? 'Dispute' :
                             order.status === 'refunded' ? 'Refunded' :
                             order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = 
                          page === 1 || 
                          page === totalPages || 
                          (page >= currentPage - 1 && page <= currentPage + 1)

                        if (!showPage) {
                          // Show ellipsis for gaps
                          if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-500">
                                ...
                              </span>
                            )
                          }
                          return null
                        }

                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-semibold transition ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                : 'bg-white/5 hover:bg-white/10 text-white'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
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