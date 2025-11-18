'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function VendorDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [myListings, setMyListings] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'balance'>('listings')
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bitcoin' | 'skrill' | ''>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination states
  const [listingsPage, setListingsPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)
  const [withdrawalsPage, setWithdrawalsPage] = useState(1)
  const itemsPerPage = 6 // 6 items per page for grid layouts (listings)
  const ordersPerPage = 5 // 5 items per page for list layouts (orders, withdrawals)
  
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
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
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

      if (profileData?.role !== 'vendor') {
        router.push('/customer-dashboard')
        return
      }

      // Fetch all data in parallel instead of sequentially - much faster!
      const results = await Promise.allSettled([
        fetchMyListings(user.id),
        fetchMyOrders(user.id),
        fetchWithdrawals(user.id)
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

  const fetchMyListings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', userId)
        .neq('status', 'removed')
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

  const fetchWithdrawals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Fetch withdrawals error:', error)
        return
      }
      
      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    }
  }

  const calculateWithdrawalFees = (amount: number, method: 'bitcoin' | 'skrill') => {
    if (method === 'bitcoin') {
      const percentageFee = amount * 0.06
      const flatFee = 20
      const totalFee = percentageFee + flatFee
      const netAmount = amount - totalFee
      return { percentageFee, flatFee, totalFee, netAmount }
    } else {
      const percentageFee = amount * 0.05
      const flatFee = 1
      const totalFee = percentageFee + flatFee
      const netAmount = amount - totalFee
      return { percentageFee, flatFee, totalFee, netAmount }
    }
  }

  const handleWithdrawalSubmit = async () => {
    if (!withdrawalMethod) {
      alert('Please select a withdrawal method')
      return
    }

    const amount = parseFloat(withdrawalAmount)
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (withdrawalMethod === 'bitcoin' && amount < 100) {
      alert('Minimum withdrawal amount for Bitcoin is $100')
      return
    }
    if (withdrawalMethod === 'skrill' && amount < 10) {
      alert('Minimum withdrawal amount for Skrill is $10')
      return
    }

    if (amount > netRevenue) {
      alert(`Insufficient balance. Your available balance is $${netRevenue.toFixed(2)}`)
      return
    }

    if (!withdrawalAddress.trim()) {
      alert(`Please enter your ${withdrawalMethod === 'bitcoin' ? 'Bitcoin wallet address' : 'Skrill email'}`)
      return
    }

    if (withdrawalMethod === 'bitcoin' && withdrawalAddress.length < 26) {
      alert('Please enter a valid Bitcoin wallet address')
      return
    }

    if (withdrawalMethod === 'skrill' && !withdrawalAddress.includes('@')) {
      alert('Please enter a valid Skrill email address')
      return
    }

    const fees = calculateWithdrawalFees(amount, withdrawalMethod)

    const confirmMessage = `Withdrawal Summary:
    
Amount: $${amount.toFixed(2)}
Method: ${withdrawalMethod === 'bitcoin' ? 'Bitcoin' : 'Skrill'}
${withdrawalMethod === 'bitcoin' ? 'Wallet Address' : 'Skrill Email'}: ${withdrawalAddress}

Fees:
- ${withdrawalMethod === 'bitcoin' ? '6%' : '5%'} fee: $${fees.percentageFee.toFixed(2)}
- Flat fee: $${fees.flatFee.toFixed(2)}
- Total fees: $${fees.totalFee.toFixed(2)}

You will receive: $${fees.netAmount.toFixed(2)}

Proceed with withdrawal?`

    if (!confirm(confirmMessage)) return

    setWithdrawalProcessing(true)

    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: amount,
          method: withdrawalMethod,
          address: withdrawalAddress,
          fee_percentage: withdrawalMethod === 'bitcoin' ? 6 : 5,
          fee_flat: withdrawalMethod === 'bitcoin' ? 20 : 1,
          fee_total: fees.totalFee,
          net_amount: fees.netAmount,
          status: 'pending'
        })

      if (error) throw error

      alert('✅ Withdrawal request submitted successfully!\n\nYour request is now pending review. You will be notified once it is processed.')
      
      setShowWithdrawalForm(false)
      setWithdrawalMethod('')
      setWithdrawalAmount('')
      setWithdrawalAddress('')
      await fetchWithdrawals(user.id)
    } catch (error: any) {
      console.error('Withdrawal error:', error)
      alert('Failed to submit withdrawal request: ' + error.message)
    } finally {
      setWithdrawalProcessing(false)
    }
  }

  // Pagination helper functions
  const goToListingsPage = (page: number) => {
    setListingsPage(page)
    document.getElementById('listings-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToOrdersPage = (page: number) => {
    setOrdersPage(page)
    document.getElementById('orders-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToWithdrawalsPage = (page: number) => {
    setWithdrawalsPage(page)
    document.getElementById('withdrawals-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  if (profile?.role !== 'vendor') {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-6">You need to be a vendor to access this page.</p>
          <Link href="/customer-dashboard" className="text-purple-400 hover:text-purple-300 transition">
            Go to Customer Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  const activeListings = myListings.filter(l => l.status === 'active')
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0)
  const totalCommission = grossRevenue * 0.05
  const totalEarnings = grossRevenue * 0.95
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0)
  const netRevenue = totalEarnings - totalWithdrawn
  const pendingOrders = myOrders.filter(o => 
    o.status === 'paid' || 
    o.status === 'delivered' || 
    o.status === 'dispute_raised'
  )
  const pendingEarnings = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.amount) * 0.95), 0)

  // Pagination calculations for Listings
  const totalListingsPages = Math.ceil(myListings.length / itemsPerPage)
  const startListingsIndex = (listingsPage - 1) * itemsPerPage
  const endListingsIndex = startListingsIndex + itemsPerPage
  const paginatedListings = myListings.slice(startListingsIndex, endListingsIndex)

  // Pagination calculations for Orders
  const totalOrdersPages = Math.ceil(myOrders.length / ordersPerPage)
  const startOrdersIndex = (ordersPage - 1) * ordersPerPage
  const endOrdersIndex = startOrdersIndex + ordersPerPage
  const paginatedOrders = myOrders.slice(startOrdersIndex, endOrdersIndex)

  // Pagination calculations for Withdrawals
  const totalWithdrawalsPages = Math.ceil(withdrawals.length / ordersPerPage)
  const startWithdrawalsIndex = (withdrawalsPage - 1) * ordersPerPage
  const endWithdrawalsIndex = startWithdrawalsIndex + ordersPerPage
  const paginatedWithdrawals = withdrawals.slice(startWithdrawalsIndex, endWithdrawalsIndex)

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
                    <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                      🏪 Vendor Portal
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Vendor Dashboard</span>
                  </h1>
                  <p className="text-gray-400">
                    Welcome back, <span className="text-white font-semibold">{profile?.username}</span>! Manage your listings and sales here.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {profile?.verified && (
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified Seller
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">💰</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Available</span>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                  ${netRevenue.toFixed(2)}
                </div>
                <div className="text-sm text-gray-400">Available Balance</div>
                {totalCommission > 0 && (
                  <div className="text-xs text-orange-400 mt-2 bg-orange-500/10 px-2 py-1 rounded">
                    Platform fee: ${totalCommission.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">📦</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{activeListings.length}</div>
                <div className="text-sm text-gray-400">Active Listings</div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-yellow-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Pending</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{pendingOrders.length}</div>
                <div className="text-sm text-gray-400">Pending Orders</div>
                <div className="text-xs text-yellow-400 mt-2 bg-yellow-500/10 px-2 py-1 rounded">
                  ${pendingEarnings.toFixed(2)} on hold
                </div>
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl">✅</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{completedOrders.length}</div>
                <div className="text-sm text-gray-400">Completed Sales</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Link
                href="/sell"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">📝</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Create Listing</h3>
                <p className="text-gray-400 text-sm">List a new item for sale on the marketplace</p>
              </Link>
              <Link
                href="/messages"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Messages</h3>
                <p className="text-gray-400 text-sm">Chat with your buyers and manage orders</p>
              </Link>
              <Link
                href="/browse"
                className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">🎮</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Browse</h3>
                <p className="text-gray-400 text-sm">Explore the marketplace and see competition</p>
              </Link>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'listings'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  📦 My Listings ({myListings.length})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🛒 My Orders ({myOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab('balance')}
                  className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'balance'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  💰 Balance & Withdrawals
                </button>
              </div>

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <div id="listings-section">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">📦</span>
                        My Listings
                      </h2>
                      {myListings.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1">
                          Showing {startListingsIndex + 1}-{Math.min(endListingsIndex, myListings.length)} of {myListings.length} listings
                        </p>
                      )}
                    </div>
                    <Link
                      href="/sell"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                    >
                      + Create Listing
                    </Link>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No listings yet</h3>
                      <p className="text-gray-400 mb-6">Create your first listing to start selling!</p>
                      <Link
                        href="/sell"
                        className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                      >
                        Create Listing
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedListings.map((listing) => (
                          <div key={listing.id} className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1">
                            <div className="relative h-44 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                              {listing.image_url ? (
                                <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl group-hover:scale-125 transition-transform duration-300">
                                  {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                                </div>
                              )}
                              <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                  listing.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  listing.status === 'sold' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                  listing.status === 'out_of_stock' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                  'bg-red-500/20 text-red-400 border-red-500/30'
                                }`}>
                                  {listing.status === 'out_of_stock' ? 'Out of Stock' : listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="text-white font-semibold mb-1 truncate group-hover:text-purple-300 transition">{listing.title}</h3>
                              <p className="text-sm text-purple-400 mb-3">{listing.game}</p>
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${listing.price}</span>
                                  <p className="text-xs text-gray-500">You earn: ${(listing.price * 0.95).toFixed(2)}</p>
                                </div>
                                <span className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded-full">
                                  Stock: {listing.stock}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <Link
                                  href={`/listing/${listing.id}`}
                                  className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2.5 rounded-lg text-sm font-semibold text-center transition-all duration-300 border border-purple-500/30"
                                >
                                  View
                                </Link>
                                <Link
                                  href={`/listing/${listing.id}/edit`}
                                  className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2.5 rounded-lg text-sm font-semibold text-center transition-all duration-300 border border-blue-500/30"
                                >
                                  Edit
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination Controls for Listings */}
                      {totalListingsPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => goToListingsPage(listingsPage - 1)}
                            disabled={listingsPage === 1}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalListingsPages }, (_, i) => i + 1).map((page) => {
                              const showPage = 
                                page === 1 || 
                                page === totalListingsPages || 
                                (page >= listingsPage - 1 && page <= listingsPage + 1)

                              if (!showPage) {
                                if (page === listingsPage - 2 || page === listingsPage + 2) {
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
                                  onClick={() => goToListingsPage(page)}
                                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                                    listingsPage === page
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                      : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => goToListingsPage(listingsPage + 1)}
                            disabled={listingsPage === totalListingsPages}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div id="orders-section">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span className="text-purple-400">🛒</span>
                      My Orders
                    </h2>
                    {myOrders.length > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        Showing {startOrdersIndex + 1}-{Math.min(endOrdersIndex, myOrders.length)} of {myOrders.length} orders
                      </p>
                    )}
                  </div>

                  {myOrders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📭</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No orders yet</h3>
                      <p className="text-gray-400 mb-6">Your sales will appear here once customers start buying!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {paginatedOrders.map((order: any) => {
                          const orderNetEarning = parseFloat(order.amount) * 0.95
                          const orderCommission = parseFloat(order.amount) * 0.05
                          
                          return (
                            <div key={order.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {order.listing?.image_url ? (
                                    <img src={order.listing.image_url} alt={order.listing.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-2xl">
                                      {order.listing?.category === 'account' ? '🎮' : order.listing?.category === 'items' ? '🎒' : order.listing?.category === 'currency' ? '💰' : '🔑'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold">{order.listing?.title || 'Unknown Item'}</h4>
                                  <p className="text-sm text-gray-400">Buyer: <span className="text-purple-400">{order.buyer?.username}</span></p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${orderNetEarning.toFixed(2)}</p>
                                  <p className="text-xs text-gray-500">
                                    Gross: ${order.amount} | Fee: -${orderCommission.toFixed(2)}
                                  </p>
                                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                                    order.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    order.status === 'delivered' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    order.status === 'paid' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                                    order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' :
                                    'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                  }`}>
                                    {order.status === 'delivered' ? 'Awaiting Confirmation' :
                                     order.status === 'dispute_raised' ? 'Dispute Active' :
                                     order.status === 'refunded' ? 'Refunded' :
                                     order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                                  </span>
                                </div>
                                <Link
                                  href={`/order/${order.id}`}
                                  className="px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition-all duration-300 border border-purple-500/30"
                                >
                                  View Details
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Pagination Controls for Orders */}
                      {totalOrdersPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                          <button
                            onClick={() => goToOrdersPage(ordersPage - 1)}
                            disabled={ordersPage === 1}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalOrdersPages }, (_, i) => i + 1).map((page) => {
                              const showPage = 
                                page === 1 || 
                                page === totalOrdersPages || 
                                (page >= ordersPage - 1 && page <= ordersPage + 1)

                              if (!showPage) {
                                if (page === ordersPage - 2 || page === ordersPage + 2) {
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
                                  onClick={() => goToOrdersPage(page)}
                                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                                    ordersPage === page
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                      : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            onClick={() => goToOrdersPage(ordersPage + 1)}
                            disabled={ordersPage === totalOrdersPages}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Balance Tab */}
              {activeTab === 'balance' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">💰</span>
                    Balance & Withdrawals
                  </h2>

                  {/* Balance Overview */}
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                      <div className="text-2xl mb-2">💵</div>
                      <div className="text-gray-400 text-sm">Available Balance</div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${netRevenue.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">Ready to withdraw</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
                      <div className="text-2xl mb-2">⏳</div>
                      <div className="text-gray-400 text-sm">Pending Earnings</div>
                      <div className="text-3xl font-bold text-yellow-400">${pendingEarnings.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">From orders awaiting completion</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-gray-400 text-sm">Total Earned</div>
                      <div className="text-3xl font-bold text-purple-400">${totalEarnings.toFixed(2)}</div>
                      <div className="text-xs text-gray-500 mt-1">Lifetime earnings (after fees)</div>
                    </div>
                  </div>

                  {/* Withdraw Button */}
                  {!showWithdrawalForm && (
                    <button
                      onClick={() => setShowWithdrawalForm(true)}
                      disabled={netRevenue < 10}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-8 hover:scale-[1.02]"
                    >
                      {netRevenue < 10 ? '💰 Minimum $10 Required to Withdraw' : '💸 Withdraw Funds'}
                    </button>
                  )}

                  {/* Withdrawal Form */}
                  {showWithdrawalForm && (
                    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 mb-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <span>💸</span>
                          Request Withdrawal
                        </h3>
                        <button
                          onClick={() => {
                            setShowWithdrawalForm(false)
                            setWithdrawalMethod('')
                            setWithdrawalAmount('')
                            setWithdrawalAddress('')
                          }}
                          className="text-gray-400 hover:text-white transition p-1"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Step 1: Select Method */}
                      <div className="mb-6">
                        <label className="block text-white font-semibold mb-3">1. Select Withdrawal Method</label>
                        <div className="grid md:grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setWithdrawalMethod('bitcoin')}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                              withdrawalMethod === 'bitcoin'
                                ? 'border-orange-500 bg-orange-500/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="text-3xl mb-2">₿</div>
                            <div className="text-white font-semibold mb-1">Bitcoin</div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>• Minimum: <span className="text-orange-400 font-semibold">$100</span></p>
                              <p>• Fee: <span className="text-red-400">6% + $20</span></p>
                              <p>• Converted at blockchain.com rate</p>
                              <p>• Main Bitcoin network only</p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setWithdrawalMethod('skrill')}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                              withdrawalMethod === 'skrill'
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="text-3xl mb-2">💳</div>
                            <div className="text-white font-semibold mb-1">Skrill</div>
                            <div className="text-xs text-gray-400 space-y-1">
                              <p>• Minimum: <span className="text-purple-400 font-semibold">$10</span></p>
                              <p>• Fee: <span className="text-red-400">5% + $1</span></p>
                              <p>• Sent in Euros (EUR)</p>
                              <p>• Must be registered to you</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {withdrawalMethod && (
                        <>
                          {/* Step 2: Enter Amount */}
                          <div className="mb-6">
                            <label className="block text-white font-semibold mb-2">
                              2. Enter Amount (USD)
                            </label>
                            <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min={withdrawalMethod === 'bitcoin' ? 100 : 10}
                                max={netRevenue}
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                placeholder={withdrawalMethod === 'bitcoin' ? '100.00' : '10.00'}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300"
                              />
                            </div>
                            <div className="flex justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                Min: ${withdrawalMethod === 'bitcoin' ? '100' : '10'} | Max: ${netRevenue.toFixed(2)}
                              </p>
                              <button
                                onClick={() => setWithdrawalAmount(netRevenue.toFixed(2))}
                                className="text-xs text-green-400 hover:text-green-300 transition"
                              >
                                Withdraw All
                              </button>
                            </div>
                          </div>

                          {/* Step 3: Enter Address */}
                          <div className="mb-6">
                            <label className="block text-white font-semibold mb-2">
                              3. {withdrawalMethod === 'bitcoin' ? 'Bitcoin Wallet Address' : 'Skrill Email Address'}
                            </label>
                            <input
                              type={withdrawalMethod === 'bitcoin' ? 'text' : 'email'}
                              value={withdrawalAddress}
                              onChange={(e) => setWithdrawalAddress(e.target.value)}
                              placeholder={withdrawalMethod === 'bitcoin' ? 'bc1q...' : 'your@email.com'}
                              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300"
                            />
                            {withdrawalMethod === 'skrill' && (
                              <p className="text-xs text-yellow-400 mt-2">
                                ⚠️ The Skrill account must be registered in your name
                              </p>
                            )}
                          </div>

                          {/* Fee Preview */}
                          {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 mb-6">
                              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <span>📊</span>
                                Fee Breakdown
                              </h4>
                              {(() => {
                                const amount = parseFloat(withdrawalAmount)
                                const fees = calculateWithdrawalFees(amount, withdrawalMethod)
                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Withdrawal Amount</span>
                                      <span className="text-white">${amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Percentage Fee ({withdrawalMethod === 'bitcoin' ? '6%' : '5%'})</span>
                                      <span className="text-red-400">-${fees.percentageFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Flat Fee</span>
                                      <span className="text-red-400">-${fees.flatFee.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-white/10 pt-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-white font-bold">You Will Receive</span>
                                        <span className="text-green-400 font-bold">${fees.netAmount.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )}

                          {/* Submit Button */}
                          <button
                            onClick={handleWithdrawalSubmit}
                            disabled={withdrawalProcessing}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02]"
                          >
                            {withdrawalProcessing ? (
                              <span className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Processing...
                              </span>
                            ) : (
                              '✅ Submit Withdrawal Request'
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Withdrawal History */}
                  <div id="withdrawals-section">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>📋</span>
                        Withdrawal History
                      </h3>
                      {withdrawals.length > 0 && (
                        <p className="text-sm text-gray-400 mt-1">
                          Showing {startWithdrawalsIndex + 1}-{Math.min(endWithdrawalsIndex, withdrawals.length)} of {withdrawals.length} withdrawals
                        </p>
                      )}
                    </div>
                    
                    {withdrawals.length === 0 ? (
                      <div className="text-center py-12 bg-slate-800/50 border border-white/10 rounded-xl">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="text-gray-400">No withdrawals yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {paginatedWithdrawals.map((withdrawal) => (
                            <div key={withdrawal.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">{withdrawal.method === 'bitcoin' ? '₿' : '💳'}</span>
                                    <span className="text-white font-semibold">
                                      {withdrawal.method === 'bitcoin' ? 'Bitcoin' : 'Skrill'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                                      withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                      withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                      withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                      withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                    }`}>
                                      {withdrawal.status.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    To: {withdrawal.address.substring(0, 20)}...
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Requested: {new Date(withdrawal.created_at).toLocaleString()}
                                  </p>
                                  {withdrawal.processed_at && (
                                    <p className="text-xs text-gray-500">
                                      Processed: {new Date(withdrawal.processed_at).toLocaleString()}
                                    </p>
                                  )}
                                  
                                  {withdrawal.status === 'rejected' && withdrawal.admin_notes && (
                                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                      <p className="text-xs text-red-400 font-semibold mb-1">❌ Rejection Reason:</p>
                                      <p className="text-sm text-red-300">{withdrawal.admin_notes}</p>
                                    </div>
                                  )}
                                  
                                  {withdrawal.status === 'completed' && withdrawal.admin_notes && (
                                    <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                      <p className="text-xs text-green-400 font-semibold mb-1">✅ Admin Note:</p>
                                      <p className="text-sm text-green-300">{withdrawal.admin_notes}</p>
                                    </div>
                                  )}
                                  
                                  {withdrawal.status === 'completed' && withdrawal.transaction_id && (
                                    <div className="mt-2">
                                      <p className="text-xs text-gray-400">
                                        Transaction ID: <span className="text-purple-400 font-mono">{withdrawal.transaction_id}</span>
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="text-xl font-bold text-white">${parseFloat(withdrawal.amount).toFixed(2)}</p>
                                  <p className="text-sm text-gray-400">
                                    Fee: ${parseFloat(withdrawal.fee_total).toFixed(2)}
                                  </p>
                                  <p className="text-sm text-green-400 font-semibold">
                                    {withdrawal.status === 'rejected' ? 'Refunded to balance' : `Receive: $${parseFloat(withdrawal.net_amount).toFixed(2)}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination Controls for Withdrawals */}
                        {totalWithdrawalsPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                              onClick={() => goToWithdrawalsPage(withdrawalsPage - 1)}
                              disabled={withdrawalsPage === 1}
                              className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ← Previous
                            </button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalWithdrawalsPages }, (_, i) => i + 1).map((page) => {
                                const showPage = 
                                  page === 1 || 
                                  page === totalWithdrawalsPages || 
                                  (page >= withdrawalsPage - 1 && page <= withdrawalsPage + 1)

                                if (!showPage) {
                                  if (page === withdrawalsPage - 2 || page === withdrawalsPage + 2) {
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
                                    onClick={() => goToWithdrawalsPage(page)}
                                    className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                                      withdrawalsPage === page
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                        : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                )
                              })}
                            </div>

                            <button
                              onClick={() => goToWithdrawalsPage(withdrawalsPage + 1)}
                              disabled={withdrawalsPage === totalWithdrawalsPages}
                              className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next →
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}