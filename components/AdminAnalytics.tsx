'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CHART_COLORS = {
  primary: '#a855f7',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6'
}

interface AnalyticsProps {
  analyticsData: {
    revenueChart: any[]
    ordersChart: any[]
    disputeRate: number
    avgOrderValue: number
    topGames: any[]
    topSellers: any[]
  }
  stats: {
    totalRevenue: number
    totalUsers: number
  }
  users: any[]
}

export default function AdminAnalytics({ analyticsData, stats, users }: AnalyticsProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">📊 Platform Analytics</h2>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-purple-400 text-sm mb-2">Avg Order Value</div>
          <div className="text-3xl font-bold text-white">${analyticsData.avgOrderValue}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-green-400 text-sm mb-2">Dispute Rate</div>
          <div className="text-3xl font-bold text-white">{analyticsData.disputeRate}%</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-blue-400 text-sm mb-2">Total Revenue</div>
          <div className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl p-6">
          <div className="text-orange-400 text-sm mb-2">Active Users</div>
          <div className="text-3xl font-bold text-white">{users.filter(u => !u.is_banned).length}</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Revenue (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData.revenueChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
            <XAxis dataKey="date" stroke="#ffffff60" />
            <YAxis stroke="#ffffff60" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
              labelStyle={{ color: '#ffffff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke={CHART_COLORS.primary} strokeWidth={3} name="Revenue ($)" />
            <Line type="monotone" dataKey="orders" stroke={CHART_COLORS.secondary} strokeWidth={3} name="Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Games and Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Games */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Games by Revenue</h3>
          {analyticsData.topGames.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topGames.map((game: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-semibold">{game.game}</div>
                    <div className="text-sm text-gray-400">{game.count} orders</div>
                  </div>
                  <div className="text-lg font-bold text-green-400">${game.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No data yet</div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Top Sellers</h3>
          {analyticsData.topSellers.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topSellers.map((seller: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-white font-semibold">{seller.username}</div>
                    <div className="text-sm text-gray-400">{seller.rating ? seller.rating.toFixed(1) : '0.0'} ⭐</div>
                  </div>
                  <div className="text-lg font-bold text-purple-400">{seller.total_sales} sales</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No vendors yet</div>
          )}
        </div>
      </div>
    </div>
  )
}