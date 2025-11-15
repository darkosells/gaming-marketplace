// app/dashboard/page.tsx - VENDOR DASHBOARD WITH REJECTION REASONS DISPLAYED

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
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'listings' | 'orders' | 'balance'>('listings')
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [withdrawalMethod, setWithdrawalMethod] = useState<'bitcoin' | 'skrill' | ''>('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalAddress, setWithdrawalAddress] = useState('')
  const [withdrawalProcessing, setWithdrawalProcessing] = useState(false)
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
      await fetchWithdrawals(user.id)
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
      const percentageFee = amount * 0.06 // 6%
      const flatFee = 20 // $20
      const totalFee = percentageFee + flatFee
      const netAmount = amount - totalFee
      return { percentageFee, flatFee, totalFee, netAmount }
    } else {
      const percentageFee = amount * 0.05 // 5%
      const flatFee = 1 // $1
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

    // Check minimum amounts
    if (withdrawalMethod === 'bitcoin' && amount < 100) {
      alert('Minimum withdrawal amount for Bitcoin is $100')
      return
    }
    if (withdrawalMethod === 'skrill' && amount < 10) {
      alert('Minimum withdrawal amount for Skrill is $10')
      return
    }

    // Check if user has enough balance
    if (amount > netRevenue) {
      alert(`Insufficient balance. Your available balance is $${netRevenue.toFixed(2)}`)
      return
    }

    if (!withdrawalAddress.trim()) {
      alert(`Please enter your ${withdrawalMethod === 'bitcoin' ? 'Bitcoin wallet address' : 'Skrill email'}`)
      return
    }

    // Validate Bitcoin address (basic check)
    if (withdrawalMethod === 'bitcoin' && withdrawalAddress.length < 26) {
      alert('Please enter a valid Bitcoin wallet address')
      return
    }

    // Validate Skrill email
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
  
  // Calculate revenue with commission deduction
  const completedOrders = myOrders.filter(o => o.status === 'completed')
  const grossRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.amount), 0)
  const totalCommission = grossRevenue * 0.05 // 5% platform commission
  const totalEarnings = grossRevenue * 0.95 // Total earnings after commission
  
  // Calculate total withdrawals (pending + completed)
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')
  const completedWithdrawals = withdrawals.filter(w => w.status === 'completed')
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0)
  
  // Available balance = total earnings - withdrawn/pending amounts
  const netRevenue = totalEarnings - totalWithdrawn
  
  // Pending orders include paid, delivered (awaiting confirmation), and disputes
  const pendingOrders = myOrders.filter(o => 
    o.status === 'paid' || 
    o.status === 'delivered' || 
    o.status === 'dispute_raised'
  )

  // Calculate pending earnings (not yet released)
  const pendingEarnings = pendingOrders.reduce((sum, o) => sum + (parseFloat(o.amount) * 0.95), 0)

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
              <div className="text-gray-400 text-sm">Available Balance</div>
              <div className="text-3xl font-bold text-green-400">${netRevenue.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">After 5% platform fee</div>
              {totalCommission > 0 && (
                <div className="text-xs text-orange-400 mt-1">
                  Commission paid: ${totalCommission.toFixed(2)}
                </div>
              )}
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
              <div className="text-xs text-yellow-400 mt-1">
                ${pendingEarnings.toFixed(2)} on hold
              </div>
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
              <button
                onClick={() => setActiveTab('balance')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'balance'
                    ? 'bg-green-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                💰 Balance & Withdrawals
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
                            <div>
                              <span className="text-xl font-bold text-white">${listing.price}</span>
                              <p className="text-xs text-gray-500">You earn: ${(listing.price * 0.95).toFixed(2)}</p>
                            </div>
                            <span className="text-sm text-gray-400">
                              Stock: {listing.stock}
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
                    {myOrders.map((order: any) => {
                      const orderNetEarning = parseFloat(order.amount) * 0.95
                      const orderCommission = parseFloat(order.amount) * 0.05
                      
                      return (
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
                              <p className="text-xl font-bold text-green-400">${orderNetEarning.toFixed(2)}</p>
                              <p className="text-xs text-gray-500">
                                Gross: ${order.amount} | Fee: -${orderCommission.toFixed(2)}
                              </p>
                              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                order.status === 'delivered' ? 'bg-yellow-500/20 text-yellow-400' :
                                order.status === 'paid' ? 'bg-blue-500/20 text-blue-400' :
                                order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                                order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400' :
                                order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                                'bg-purple-500/20 text-purple-400'
                              }`}>
                                {order.status === 'delivered' ? 'Awaiting Confirmation' :
                                 order.status === 'dispute_raised' ? 'Dispute Active' :
                                 order.status === 'refunded' ? 'Refunded' :
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
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {/* Balance Tab */}
            {activeTab === 'balance' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-6">💰 Balance & Withdrawals</h2>

                {/* Balance Overview */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
                    <div className="text-2xl mb-2">💵</div>
                    <div className="text-gray-400 text-sm">Available Balance</div>
                    <div className="text-3xl font-bold text-green-400">${netRevenue.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">Ready to withdraw</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="text-gray-400 text-sm">Pending Earnings</div>
                    <div className="text-3xl font-bold text-yellow-400">${pendingEarnings.toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">From orders awaiting completion</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
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
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                  >
                    {netRevenue < 10 ? '💰 Minimum $10 Required to Withdraw' : '💸 Withdraw Funds'}
                  </button>
                )}

                {/* Withdrawal Form */}
                {showWithdrawalForm && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Request Withdrawal</h3>
                      <button
                        onClick={() => {
                          setShowWithdrawalForm(false)
                          setWithdrawalMethod('')
                          setWithdrawalAmount('')
                          setWithdrawalAddress('')
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Step 1: Select Method */}
                    <div className="mb-6">
                      <label className="block text-white font-semibold mb-3">1. Select Withdrawal Method</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Bitcoin Option */}
                        <button
                          type="button"
                          onClick={() => setWithdrawalMethod('bitcoin')}
                          className={`p-4 rounded-lg border-2 transition text-left ${
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

                        {/* Skrill Option */}
                        <button
                          type="button"
                          onClick={() => setWithdrawalMethod('skrill')}
                          className={`p-4 rounded-lg border-2 transition text-left ${
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
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min={withdrawalMethod === 'bitcoin' ? 100 : 10}
                              max={netRevenue}
                              value={withdrawalAmount}
                              onChange={(e) => setWithdrawalAmount(e.target.value)}
                              placeholder={withdrawalMethod === 'bitcoin' ? '100.00' : '10.00'}
                              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-3 text-white focus:border-green-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              Min: ${withdrawalMethod === 'bitcoin' ? '100' : '10'} | Max: ${netRevenue.toFixed(2)}
                            </p>
                            <button
                              onClick={() => setWithdrawalAmount(netRevenue.toFixed(2))}
                              className="text-xs text-green-400 hover:text-green-300"
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
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                          />
                          {withdrawalMethod === 'skrill' && (
                            <p className="text-xs text-yellow-400 mt-2">
                              ⚠️ The Skrill account must be registered in your name
                            </p>
                          )}
                        </div>

                        {/* Fee Preview */}
                        {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                            <h4 className="text-white font-semibold mb-3">Fee Breakdown</h4>
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
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/50 transition disabled:opacity-50"
                        >
                          {withdrawalProcessing ? 'Processing...' : '✅ Submit Withdrawal Request'}
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Withdrawal History */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Withdrawal History</h3>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-12 bg-white/5 border border-white/10 rounded-xl">
                      <div className="text-5xl mb-4">📋</div>
                      <p className="text-gray-400">No withdrawals yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{withdrawal.method === 'bitcoin' ? '₿' : '💳'}</span>
                                <span className="text-white font-semibold">
                                  {withdrawal.method === 'bitcoin' ? 'Bitcoin' : 'Skrill'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  withdrawal.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                  withdrawal.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                  withdrawal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                  'bg-gray-500/20 text-gray-400'
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
                              
                              {/* SHOW ADMIN NOTES / REJECTION REASON */}
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
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}