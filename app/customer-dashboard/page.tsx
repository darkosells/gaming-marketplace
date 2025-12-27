'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { RANKS_MAP } from '@/lib/boosting/ranks'
import { RankKey } from '@/lib/boosting/types'

// Boosting types
interface BoostRequest {
  id: string
  request_number: string
  game: string
  current_rank: string
  desired_rank: string
  customer_offer_price: number
  status: string
  total_offers_received: number
  expires_at: string
  created_at: string
}

interface BoostingOrder {
  id: string
  order_number: string
  game: string
  current_rank: string
  desired_rank: string
  progress_current_rank: string | null
  final_price: number
  status: string
  payment_status: string
  created_at: string
  vendor?: {
    username: string
    avatar_url: string | null
  }
}

export default function CustomerDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [verificationStatus, setVerificationStatus] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  
  // Boosting state
  const [boostRequests, setBoostRequests] = useState<BoostRequest[]>([])
  const [boostOrders, setBoostOrders] = useState<BoostingOrder[]>([])
  
  const ordersPerPage = 5
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
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
      
      const results = await Promise.allSettled([
        fetchMyOrders(user.id),
        fetchVerificationStatus(user.id),
        fetchBoostRequests(user.id),
        fetchBoostOrders(user.id)
      ])
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to fetch data ${index}:`, result.reason)
        }
      })
      
      setLoading(false)
    } catch (error: any) {
      console.error('Check user error:', error)
      setLoading(false)
      
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
        .select('*')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Fetch orders error:', error)
        return
      }
      
      const transformedOrders = (data || []).map(order => ({
        ...order,
        listing: {
          title: order.listing_title || 'Deleted Listing',
          game: order.listing_game || 'N/A',
          image_url: order.listing_image_url || null,
          category: order.listing_category || 'account'
        }
      }))
      
      setMyOrders(transformedOrders)
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
      
      if (error && error.code !== 'PGRST116') {
        console.error('Fetch verification error:', error)
      }
      
      setVerificationStatus(data)
    } catch (error) {
      console.error('Error fetching verification:', error)
    }
  }

  // Fetch boost requests (customer's open requests) with actual offer counts
  const fetchBoostRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('boost_requests')
        .select(`
          *,
          boost_offers!boost_offers_request_id_fkey (
            id,
            status
          )
        `)
        .eq('customer_id', userId)
        .in('status', ['open', 'has_offers'])
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Fetch boost requests error:', error)
        return
      }
      
      // Transform data to include actual pending offer count
      const transformedData = (data || []).map(request => {
        const pendingOffers = request.boost_offers?.filter(
          (offer: any) => offer.status === 'pending'
        ) || []
        return {
          ...request,
          total_offers_received: pendingOffers.length,
          boost_offers: undefined // Remove the nested data
        }
      })
      
      setBoostRequests(transformedData)
    } catch (error) {
      console.error('Error fetching boost requests:', error)
    }
  }

  // Fetch boost orders (customer's boost orders)
  const fetchBoostOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('boosting_orders')
        .select(`
          *,
          vendor:profiles!boosting_orders_vendor_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Fetch boost orders error:', error)
        return
      }
      
      setBoostOrders(data || [])
    } catch (error) {
      console.error('Error fetching boost orders:', error)
    }
  }

  const totalPages = Math.ceil(myOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const currentOrders = myOrders.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: document.getElementById('orders-section')?.offsetTop || 0, behavior: 'smooth' })
  }

  // Boosting stats
  const activeBoostOrders = boostOrders.filter(o => 
    ['awaiting_credentials', 'credentials_received', 'in_progress', 'pending_confirmation'].includes(o.status)
  )
  const completedBoostOrders = boostOrders.filter(o => o.status === 'completed')
  const pendingRequests = boostRequests.filter(r => r.status === 'open' || r.status === 'has_offers')

  // Status config for boost orders
  const BOOST_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    awaiting_credentials: { label: 'Awaiting Credentials', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    credentials_received: { label: 'Starting Soon', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    in_progress: { label: 'In Progress', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    pending_confirmation: { label: 'Confirm Completion', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    dispute: { label: 'Dispute', color: 'text-red-400', bgColor: 'bg-red-500/20' }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-5xl sm:text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">{error}</p>
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
            <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading dashboard...</p>
          <p className="text-gray-500 mt-2 text-xs sm:text-sm">This should only take a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
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
        <div className="absolute top-[15%] right-[10%] hidden sm:block">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-5 sm:h-6 border-2 sm:border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        <div className="absolute bottom-[20%] left-[8%] hidden sm:block">
          <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
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

        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-block mb-3 sm:mb-4">
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-xs sm:text-sm font-medium">
                      👤 Customer Portal
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                    Welcome back, <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent break-words">{profile?.username}</span>! 👋
                  </h1>
                  <p className="text-gray-400 text-sm sm:text-base truncate">
                    Email: <span className="text-white">{user?.email}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold border border-blue-500/30 whitespace-nowrap">
                    🛒 Customer Account
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Status Section */}
            {verificationStatus && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📋</span>
                  Vendor Application Status
                </h2>
                
                {verificationStatus.status === 'pending' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl sm:text-4xl">⏳</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-yellow-400">Application Under Review</h3>
                        <p className="text-gray-300 text-sm sm:text-base">Submitted on {new Date(verificationStatus.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base">Your vendor application is being reviewed. This typically takes 1-3 business days.</p>
                  </div>
                )}
                
                {verificationStatus.status === 'approved' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl sm:text-4xl">✅</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-green-400">Application Approved!</h3>
                        <p className="text-gray-300 text-sm sm:text-base">Approved on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">Congratulations! You are now a verified vendor.</p>
                    <Link href="/dashboard" className="inline-block bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                      Go to Vendor Dashboard →
                    </Link>
                  </div>
                )}
                
                {verificationStatus.status === 'rejected' && verificationStatus.can_resubmit && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl sm:text-4xl">🔄</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-yellow-400">Resubmission Required</h3>
                        <p className="text-gray-300 text-sm sm:text-base">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-slate-800/50 border border-white/10 rounded-lg p-3 sm:p-4 mb-4">
                      <h4 className="text-white font-semibold mb-2 text-sm sm:text-base">What needs to be fixed:</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {verificationStatus.resubmission_fields?.map((field: string) => (
                          <span key={field} className="px-2 sm:px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs sm:text-sm border border-yellow-500/30">
                            {field.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                      <div className="bg-black/20 rounded-lg p-2 sm:p-3">
                        <p className="text-white text-xs sm:text-sm whitespace-pre-wrap">{verificationStatus.resubmission_instructions}</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4 text-sm sm:text-base">Please review the instructions and submit a new application.</p>
                    <Link href="/become-vendor" className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                      🔄 Submit New Application
                    </Link>
                  </div>
                )}
                
                {verificationStatus.status === 'rejected' && !verificationStatus.can_resubmit && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-3xl sm:text-4xl">🚫</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-red-400">Application Rejected</h3>
                        <p className="text-gray-300 text-sm sm:text-base">Reviewed on {new Date(verificationStatus.reviewed_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 sm:p-4 mb-4">
                      <h4 className="text-red-400 font-semibold mb-2 text-sm sm:text-base">Reason:</h4>
                      <p className="text-white text-sm sm:text-base">{verificationStatus.rejection_reason}</p>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base">Your application has been permanently rejected. Contact support if you believe this was an error.</p>
                    <a href="mailto:support@nashflare.com" className="inline-block mt-4 text-purple-400 hover:text-purple-300 underline transition text-sm sm:text-base">
                      Contact Support
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl sm:text-2xl">🛒</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{myOrders.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">Marketplace Orders</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl sm:text-2xl">🎮</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{activeBoostOrders.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">Active Boosts</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl sm:text-2xl">📋</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Open</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{pendingRequests.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">Boost Requests</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-xl sm:text-2xl">✅</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Done</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{completedBoostOrders.length}</div>
                <div className="text-xs sm:text-sm text-gray-400">Completed Boosts</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
              <Link href="/browse" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl sm:text-3xl">🔍</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Marketplace</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Browse accounts & items</p>
              </Link>

              <Link href="/boosting" className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 sm:p-6 hover:border-cyan-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl sm:text-3xl">🎮</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">Rank Boost</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Get boosted today</p>
              </Link>

              <Link href="/messages" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl sm:text-3xl">💬</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Messages</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Chat with sellers</p>
              </Link>

              <Link href="/settings" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl sm:text-3xl">⚙️</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Settings</h3>
                <p className="text-gray-400 text-xs sm:text-sm">Manage profile</p>
              </Link>
            </div>

            {/* Active Boost Orders Section */}
            {(activeBoostOrders.length > 0 || pendingRequests.length > 0) && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-cyan-500/30 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400">🎮</span>
                    My Boosting Activity
                  </h2>
                  <Link 
                    href="/boosting/my-requests"
                    className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
                  >
                    View All →
                  </Link>
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <span className="text-yellow-400">📋</span>
                      Open Requests ({pendingRequests.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingRequests.slice(0, 3).map((request) => {
                        const currentRank = RANKS_MAP[request.current_rank as RankKey]
                        const desiredRank = RANKS_MAP[request.desired_rank as RankKey]
                        
                        return (
                          <Link
                            key={request.id}
                            href={`/boosting/my-requests/${request.id}`}
                            className="block bg-slate-800/50 border border-yellow-500/20 rounded-xl p-4 hover:border-yellow-500/40 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 relative rounded-lg bg-slate-900/50 p-1">
                                    {currentRank?.image ? (
                                      <Image src={currentRank.image} alt={currentRank.name} fill className="object-contain" unoptimized />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">🎮</div>
                                    )}
                                  </div>
                                  <span className="text-gray-500">→</span>
                                  <div className="w-10 h-10 relative rounded-lg bg-slate-900/50 p-1">
                                    {desiredRank?.image ? (
                                      <Image src={desiredRank.image} alt={desiredRank.name} fill className="object-contain" unoptimized />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">🎮</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">{currentRank?.name} → {desiredRank?.name}</p>
                                  <p className="text-gray-500 text-xs">{request.total_offers_received} offers received</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-green-400 font-bold">${request.customer_offer_price.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Your offer</p>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Active Orders */}
                {activeBoostOrders.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <span className="text-cyan-400">🎮</span>
                      Active Boosts ({activeBoostOrders.length})
                    </h3>
                    <div className="space-y-3">
                      {activeBoostOrders.slice(0, 3).map((order) => {
                        const currentRank = RANKS_MAP[order.current_rank as RankKey]
                        const desiredRank = RANKS_MAP[order.desired_rank as RankKey]
                        const statusConfig = BOOST_STATUS_CONFIG[order.status]
                        
                        return (
                          <Link
                            key={order.id}
                            href={`/dashboard/boosts/${order.id}`}
                            className="block bg-slate-800/50 border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/40 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 relative rounded-lg bg-slate-900/50 p-1">
                                    {currentRank?.image ? (
                                      <Image src={currentRank.image} alt={currentRank.name} fill className="object-contain" unoptimized />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">🎮</div>
                                    )}
                                  </div>
                                  <span className="text-gray-500">→</span>
                                  <div className="w-10 h-10 relative rounded-lg bg-slate-900/50 p-1">
                                    {desiredRank?.image ? (
                                      <Image src={desiredRank.image} alt={desiredRank.name} fill className="object-contain" unoptimized />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">🎮</div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">{currentRank?.name} → {desiredRank?.name}</p>
                                  <p className="text-gray-500 text-xs">by {order.vendor?.username || 'Booster'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusConfig?.bgColor} ${statusConfig?.color}`}>
                                  {statusConfig?.label}
                                </span>
                                {order.status === 'pending_confirmation' && (
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-white/10">
                  <Link
                    href="/boosting"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                  >
                    🎮 Request New Boost
                  </Link>
                  <Link
                    href="/boosting/my-requests"
                    className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 transition-all"
                  >
                    📋 View All Requests
                  </Link>
                </div>
              </div>
            )}

            {/* Boost CTA if no activity */}
            {activeBoostOrders.length === 0 && pendingRequests.length === 0 && (
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-cyan-500/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl sm:text-3xl">🎮</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Need a Rank Boost?</h3>
                      <p className="text-gray-300 text-sm sm:text-base">
                        Get your dream rank with our professional boosting service. Fast, secure, and affordable.
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/boosting" 
                    className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap text-center"
                  >
                    🚀 Get Boosted Now
                  </Link>
                </div>
              </div>
            )}

            {/* My Orders Section with Pagination */}
            <div id="orders-section" className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-purple-400">📦</span>
                  Marketplace Orders
                </h2>
                {myOrders.length > 0 && (
                  <span className="text-xs sm:text-sm text-gray-400 bg-white/5 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                    Showing {startIndex + 1}-{Math.min(endIndex, myOrders.length)} of {myOrders.length}
                  </span>
                )}
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="text-5xl sm:text-6xl mb-4">📭</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No orders yet</h3>
                  <p className="text-gray-400 mb-6 text-sm sm:text-base">Start shopping to see your orders here!</p>
                  <Link href="/browse" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-sm sm:text-base">
                    Browse Listings
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    {currentOrders.map((order) => (
                      <div key={order.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-3 sm:p-4 lg:p-5 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            {order.listing?.image_url ? (
                              <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-2xl sm:text-3xl">
                                  {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'items' ? '🎒' : order.listing?.category === 'currency' ? '💰' : '🔑'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg line-clamp-1">{order.listing?.title || 'Deleted Listing'}</h3>
                            <p className="text-purple-400 text-xs sm:text-sm">{order.listing?.game || 'N/A'}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${parseFloat(order.amount).toFixed(2)}</span>
                              <span className="text-gray-500 text-xs sm:text-sm">Qty: {order.quantity}</span>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border ${
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
                          <div className="w-full sm:w-auto sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-2">
                            <p className="text-gray-500 text-xs sm:text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                            <Link href={`/order/${order.id}`} className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 border border-purple-500/30 whitespace-nowrap">
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mt-6 sm:mt-8">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        ← Previous
                      </button>
                      
                      <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-2 sm:pb-0">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 flex-shrink-0 text-sm ${
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
                        className="w-full sm:w-auto px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Become Vendor CTA */}
            {(!verificationStatus || (verificationStatus.status === 'rejected' && verificationStatus.can_resubmit)) && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/50 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl sm:text-3xl">🚀</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Want to Sell on Nashflare?</h3>
                      <p className="text-gray-300 text-sm sm:text-base">
                        {verificationStatus?.can_resubmit 
                          ? 'Fix the issues and resubmit your application to become a vendor.' 
                          : 'Become a verified vendor and start earning money by selling gaming products.'}
                      </p>
                    </div>
                  </div>
                  <Link 
                    href="/become-vendor" 
                    className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap text-center"
                  >
                    {verificationStatus?.can_resubmit ? '🔄 Resubmit Application' : '🚀 Become a Vendor'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}