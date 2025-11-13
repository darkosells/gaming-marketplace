// app/admin/page.tsx - ADMIN DASHBOARD

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      if (activeTab === 'users') fetchUsers()
      if (activeTab === 'listings') fetchListings()
      if (activeTab === 'orders') fetchOrders()
    }
  }, [activeTab, profile])

  const checkAdmin = async () => {
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

      if (profileError || !profileData?.is_admin) {
        router.push('/') // Redirect non-admins
        return
      }

      setProfile(profileData)
      setLoading(false)
    } catch (error) {
      console.error('Check admin error:', error)
      router.push('/')
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setUsers(data || [])
  }

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })

    if (!error) setListings(data || [])
  }

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        buyer:profiles!buyer_id(username),
        seller:profiles!seller_id(username),
        listing:listings(title, game)
      `)
      .order('created_at', { ascending: false })

    if (!error) setOrders(data || [])
  }

  const handleBanUser = async (userId: string, currentlyBanned: boolean) => {
    const action = currentlyBanned ? 'unban' : 'ban'
    const reason = currentlyBanned ? null : prompt('Ban reason:')
    
    if (!currentlyBanned && !reason) return

    const { error } = await supabase
      .from('profiles')
      .update({
        is_banned: !currentlyBanned,
        banned_at: !currentlyBanned ? new Date().toISOString() : null,
        ban_reason: reason
      })
      .eq('id', userId)

    if (!error) {
      alert(`User ${action}ned successfully`)
      fetchUsers()
    }
  }

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Delete this listing?')) return

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)

    if (!error) {
      alert('Listing deleted')
      fetchListings()
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

  const stats = {
    totalUsers: users.length,
    totalListings: listings.length,
    totalOrders: orders.length,
    activeListings: listings.filter(l => l.status === 'active').length,
    bannedUsers: users.filter(u => u.is_banned).length,
    pendingOrders: orders.filter(o => o.status === 'pending').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Main Site
              </Link>
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                  <span className="text-white">{profile?.username}</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-lg">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-300">Manage users, listings, and orders</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">👥</div>
              <div className="text-gray-400 text-xs">Total Users</div>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">📦</div>
              <div className="text-gray-400 text-xs">Total Listings</div>
              <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-gray-400 text-xs">Total Orders</div>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-gray-400 text-xs">Active Listings</div>
              <div className="text-2xl font-bold text-white">{stats.activeListings}</div>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">🚫</div>
              <div className="text-gray-400 text-xs">Banned Users</div>
              <div className="text-2xl font-bold text-white">{stats.bannedUsers}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">⏳</div>
              <div className="text-gray-400 text-xs">Pending Orders</div>
              <div className="text-2xl font-bold text-white">{stats.pendingOrders}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'users'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'listings'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Listings
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              Orders
            </button>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">All Users</h2>
                {users.map((u) => (
                  <div key={u.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-white font-semibold">{u.username}</h3>
                          {u.is_admin ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                              ADMIN
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              u.role === 'vendor' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {u.role}
                            </span>
                          )}
                          {u.is_banned && (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-500/20 text-red-400">
                              BANNED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          Rating: {u.rating} | Sales: {u.total_sales} | Joined: {new Date(u.created_at).toLocaleDateString()}
                        </p>
                        {u.is_banned && u.ban_reason && (
                          <p className="text-sm text-red-400 mt-1">Ban reason: {u.ban_reason}</p>
                        )}
                      </div>
                      {!u.is_admin && (
                        <button
                          onClick={() => handleBanUser(u.id, u.is_banned)}
                          className={`px-4 py-2 rounded-lg font-semibold transition ${
                            u.is_banned
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">All Listings</h2>
                {listings.map((l) => (
                  <div key={l.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-white font-semibold">{l.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            l.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            l.status === 'sold' ? 'bg-gray-500/20 text-gray-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {l.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {l.game} | ${l.price} | Stock: {l.stock} | Seller: {l.profiles?.username}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/listing/${l.id}`}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteListing(l.id)}
                          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">All Orders</h2>
                {orders.map((o) => (
                  <div key={o.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-white font-semibold">{o.listing?.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            o.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            o.status === 'disputed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {o.listing?.game} | ${o.amount} | Buyer: {o.buyer?.username} | Seller: {o.seller?.username}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(o.created_at).toLocaleString()}
                        </p>
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