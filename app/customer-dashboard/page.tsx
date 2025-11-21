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
  const [verificationStatus, setVerificationStatus] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const ordersPerPage = 5
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Add timeout for auth check to prevent infinite loading
      const authPromise = supabase.auth.getUser()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 10000)
      )
      
      const { data: { user }, error: userError } = await Promise.race([authPromise, timeoutPromise]) as any
      
      if (userError || !user) { 
        router.push('/login')
        return 
      }
      
      setUser(user)
      
      // Fetch profile with timeout
      const profilePromise = supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 10000))
      ]) as any
      
      if (profileError) {
        console.error('Profile fetch error:', profileError)
        setError('Failed to load profile. Please try again.')
        setLoading(false)
        return
      }
      
      setProfile(profileData)
      
      if (profileData?.role === 'vendor') { 
        router.push('/dashboard')
        return 
      }
      
      // Fetch all data in parallel instead of sequentially - much faster!
      const results = await Promise.allSettled([
        fetchMyOrders(user.id),
        fetchVerificationStatus(user.id)
      ])
      
      // Check for any failures but don't block loading
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch data ${index}:`, result.reason)
        }
      })
      
      setLoading(false)
    } catch (error: any) {
      console.error('Check user error:', error)
      setLoading(false) // Always stop loading on error
      
      if (error.message?.includes('timeout')) {
        setError('Connection timed out. Please refresh the page.')
      } else {
        router.push('/login')
      }
    }
  }

  const fetchMyOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, listing:listings(title, game, image_url, category)')
        .eq('buyer_id', userId)
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

  const fetchVerificationStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendor_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      // It's OK if there's no verification status - user just hasn't applied
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch verification error:', error)
      }
      
      setVerificationStatus(data)
    } catch (error) {
      console.error('Error fetching verification:', error)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(myOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = myOrders.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: document.getElementById('orders-section')?.offsetTop || 0, behavior: 'smooth' })
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading dashboard...</p>
          <p className="text-gray-500 mt-2 text-sm">This should only take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* 2D Comic Space Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Stars */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        
        {/* Planets */}
        <div className="absolute top-[15%] right-[10%] group">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[8%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="inline-block mb-4">
                    <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium">
                      👤 Customer Portal
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    Welcome back, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">{profile?.username}</span>! 👋
                  </h1>
                  <p className="text-gray-400">
                    Email: <span className="text-white">{user?.email}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">
                    🛒 Customer Account
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Status Section */}
            {verificationStatus && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📋</span>
                  Vendor Application Status
                </h2>
                
                {verificationStatus.status === 'pending' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">⏳</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400">Application Under Review</h3>
                        <p className="text-gray-300">Submitted on {new Date(verificationStatus.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-400">Your vendor application is being reviewed. This typically takes 1-3 business days.</p>
                  </div>
                )}
                
                {verificationStatus.status === 'approved' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">✅</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-400">Application Approved!</h3>
                        <p className="text-gray-300">Approved on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4">Congratulations! You are now a verified vendor.</p>
                    <Link href="/dashboard" className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 hover:scale-105">
                      Go to Vendor Dashboard →
                    </Link>
                  </div>
                )}
                
                {verificationStatus.status === 'rejected' && verificationStatus.can_resubmit && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">🔄</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-yellow-400">Resubmission Required</h3>
                        <p className="text-gray-300">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-semibold mb-2">What needs to be fixed:</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {verificationStatus.resubmission_fields?.map((field: string) => (
                          <span key={field} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm border border-yellow-500/30">
                            {field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-white text-sm whitespace-pre-wrap">{verificationStatus.resubmission_instructions}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4">Please review the instructions and submit a new application.</p>
                    <Link href="/become-vendor" className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105">
                      🔄 Submit New Application
                    </Link>
                  </div>
                )}
                
                {verificationStatus.status === 'rejected' && !verificationStatus.can_resubmit && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <span className="text-4xl">🚫</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-red-400">Application Rejected</h3>
                        <p className="text-gray-300">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-4">
                      <h4 className="text-red-400 font-semibold mb-2">Reason:</h4>
                      <p className="text-white">{verificationStatus.rejection_reason}</p>
                    </div>
                    <p className="text-gray-400">Your application has been permanently rejected. Contact support if you believe this was an error.</p>
                    <a href="mailto:support@gamevault.com" className="inline-block mt-4 text-purple-400 hover:text-purple-300 underline transition">
                      Contact Support
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{myOrders.length}</div>
                <div className="text-sm text-gray-400">Total Orders</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{myOrders.filter(o => o.status === 'pending' || o.status === 'paid' || o.status === 'delivered').length}</div>
                <div className="text-sm text-gray-400">Pending Orders</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">✅</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Done</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{myOrders.filter(o => o.status === 'completed').length}</div>
                <div className="text-sm text-gray-400">Completed Orders</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Link href="/browse" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Browse Marketplace</h3>
                <p className="text-gray-400 text-sm">Find gaming accounts, items, and keys</p>
              </Link>

              <Link href="/messages" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Messages</h3>
                <p className="text-gray-400 text-sm">Chat with sellers and track orders</p>
              </Link>

              <Link href="/settings" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">⚙️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Account Settings</h3>
                <p className="text-gray-400 text-sm">Manage your profile and preferences</p>
              </Link>
            </div>

            {/* My Orders Section with Pagination */}
            <div id="orders-section" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📦</span>
                  My Orders
                </h2>
                {myOrders.length > 0 && (
                  <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                    Showing {startIndex + 1}-{Math.min(endIndex, myOrders.length)} of {myOrders.length}
                  </span>
                )}
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-2xl font-bold text-white mb-2">No orders yet</h3>
                  <p className="text-gray-400 mb-6">Start shopping to see your orders here!</p>
                  <Link href="/browse" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105">
                    Browse Listings
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentOrders.map((order) => (
                      <div key={order.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            {order.listing?.image_url ? (
                              <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl">
                                  {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'items' ? '🎒' : order.listing?.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">{order.listing?.title || 'Unknown Item'}</h3>
                            <p className="text-purple-400 text-sm">{order.listing?.game}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${parseFloat(order.amount).toFixed(2)}</span>
                              <span className="text-gray-500 text-sm">Qty: {order.quantity}</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                order.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                order.status === 'pending' || order.status === 'paid' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/30'
                              }`}>
                                {order.status === 'delivered' ? 'DELIVERED' :
                                 order.status === 'dispute_raised' ? 'DISPUTE' :
                                 order.status?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-sm mb-2">{new Date(order.created_at).toLocaleDateString()}</p>
                            <Link href={`/order/${order.id}`} className="inline-block px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition-all duration-300 border border-purple-500/30">
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Become Vendor CTA - Now at Bottom */}
            {(!verificationStatus || (verificationStatus.status === 'rejected' && verificationStatus.can_resubmit)) && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl">🚀</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Want to Sell on GameVault?</h3>
                      <p className="text-gray-300">
                        {verificationStatus?.can_resubmit 
                          ? 'Fix the issues and resubmit your application to become a vendor.' 
                          : 'Become a verified vendor and start earning money by selling gaming products.'}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/become-vendor" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
                  >
                    {verificationStatus?.can_resubmit ? '🔄 Resubmit Application' : '🚀 Become a Vendor'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2025 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}