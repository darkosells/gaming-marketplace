// NEW FILE: app/admin/page.tsx
// This is the main admin dashboard

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface DashboardStats {
  total_users: number
  total_vendors: number
  total_customers: number  // This is actually 'buyer' role in your DB
  banned_users: number
  total_listings: number
  active_listings: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_revenue: number
  orders_last_7_days: number
  users_last_7_days: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get profile and check admin status
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError || !profileData?.is_admin) {
        alert('Access Denied: Admin privileges required')
        router.push('/')
        return
      }

      setProfile(profileData)
      
      // Fetch dashboard data
      await Promise.all([
        fetchStats(),
        fetchRecentActivity()
      ])
      
    } catch (error) {
      console.error('Error checking admin:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single()

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent orders with details
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(username, email),
          listing:listings(title, price, seller_id)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentActivity(data || [])
    } catch (error) {
      console.error('Error fetching activity:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Admin Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-gray-300 hover:text-white transition">
                Users
              </Link>
              <Link href="/admin/listings" className="text-gray-300 hover:text-white transition">
                Listings
              </Link>
              <Link href="/admin/orders" className="text-gray-300 hover:text-white transition">
                Orders
              </Link>
              <Link href="/" className="text-gray-300 hover:text-white transition">
                Main Site
              </Link>
              <div className="relative group">
                <button className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg transition border border-red-500/50">
                  <span className="text-red-400 font-semibold">👑 Admin</span>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white font-semibold">{profile?.username}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Overview of your marketplace</p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Users Stats */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">👥</div>
                  <span className="text-green-400 text-sm font-semibold">
                    +{stats.users_last_7_days} this week
                  </span>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-white">{stats.total_users}</p>
                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Vendors:</span>
                    <span className="text-white font-semibold">{stats.total_vendors}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Customers:</span>
                    <span className="text-white font-semibold">{stats.total_customers}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Banned:</span>
                    <span className="text-red-400 font-semibold">{stats.banned_users}</span>
                  </div>
                </div>
              </div>

              {/* Listings Stats */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">📦</div>
                  <Link href="/admin/listings" className="text-purple-400 text-sm font-semibold hover:text-purple-300">
                    View All →
                  </Link>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Total Listings</h3>
                <p className="text-3xl font-bold text-white">{stats.total_listings}</p>
                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Active:</span>
                    <span className="text-green-400 font-semibold">{stats.active_listings}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Inactive:</span>
                    <span className="text-gray-400 font-semibold">{stats.total_listings - stats.active_listings}</span>
                  </div>
                </div>
              </div>

              {/* Orders Stats */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🛒</div>
                  <span className="text-green-400 text-sm font-semibold">
                    +{stats.orders_last_7_days} this week
                  </span>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Total Orders</h3>
                <p className="text-3xl font-bold text-white">{stats.total_orders}</p>
                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Pending:</span>
                    <span className="text-yellow-400 font-semibold">{stats.pending_orders}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 mt-1">
                    <span>Completed:</span>
                    <span className="text-green-400 font-semibold">{stats.completed_orders}</span>
                  </div>
                </div>
              </div>

              {/* Revenue Stats */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-500/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💰</div>
                  <Link href="/admin/orders" className="text-green-400 text-sm font-semibold hover:text-green-300">
                    View Orders →
                  </Link>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-400">${stats.total_revenue.toFixed(2)}</p>
                <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Avg Order:</span>
                    <span className="text-white font-semibold">
                      ${stats.completed_orders > 0 ? (stats.total_revenue / stats.completed_orders).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/admin/users" className="group">
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition">
                <div className="text-4xl mb-3 group-hover:scale-110 transition">👥</div>
                <h3 className="text-lg font-bold text-white mb-1">Manage Users</h3>
                <p className="text-sm text-gray-400">View, edit, ban, or promote users</p>
              </div>
            </Link>

            <Link href="/admin/listings" className="group">
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition">
                <div className="text-4xl mb-3 group-hover:scale-110 transition">📦</div>
                <h3 className="text-lg font-bold text-white mb-1">Manage Listings</h3>
                <p className="text-sm text-gray-400">Approve, edit, or remove listings</p>
              </div>
            </Link>

            <Link href="/admin/orders" className="group">
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-6 transition">
                <div className="text-4xl mb-3 group-hover:scale-110 transition">🛒</div>
                <h3 className="text-lg font-bold text-white mb-1">Manage Orders</h3>
                <p className="text-sm text-gray-400">View and manage all transactions</p>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Orders</h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((order) => (
                  <div key={order.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            order.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : order.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {order.status.toUpperCase()}
                          </span>
                          <span className="text-white font-semibold">{order.listing?.title}</span>
                          <span className="text-green-400 font-bold">${order.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Buyer: {order.buyer?.username}</span>
                          <span>•</span>
                          <span>{new Date(order.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <Link
                        href={`/admin/orders?id=${order.id}`}
                        className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-semibold transition"
                      >
                        View
                      </Link>
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