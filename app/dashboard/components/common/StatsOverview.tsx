import type { Listing, Order } from '../../types'

interface StatsOverviewProps {
  netRevenue: number
  totalCommission: number
  activeListings: Listing[]
  pendingOrders: Order[]
  pendingEarnings: number
  completedOrders: Order[]
}

export default function StatsOverview({
  netRevenue,
  totalCommission,
  activeListings,
  pendingOrders,
  pendingEarnings,
  completedOrders
}: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      {/* Available Balance */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-green-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-lg sm:text-xl lg:text-2xl">💰</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Available</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-0.5 sm:mb-1">
          ${netRevenue.toFixed(2)}
        </div>
        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Available Balance</div>
        {totalCommission > 0 && (
          <div className="text-[10px] sm:text-xs text-orange-400 mt-1 sm:mt-2 bg-orange-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:block">
            Platform fee: ${totalCommission.toFixed(2)}
          </div>
        )}
      </div>

      {/* Active Listings */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-purple-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-lg sm:text-xl lg:text-2xl">📦</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Active</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{activeListings.length}</div>
        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Active Listings</div>
      </div>

      {/* Pending Orders */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-yellow-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-lg sm:text-xl lg:text-2xl">⏳</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Pending</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{pendingOrders.length}</div>
        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Pending Orders</div>
        <div className="text-[10px] sm:text-xs text-yellow-400 mt-1 sm:mt-2 bg-yellow-500/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hidden sm:block">
          ${pendingEarnings.toFixed(2)} on hold
        </div>
      </div>

      {/* Completed Sales */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:border-blue-500/30 transition-all duration-300 group">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-lg sm:text-xl lg:text-2xl">✅</span>
          </div>
          <span className="text-[10px] sm:text-xs text-gray-500 bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hidden sm:inline">Total</span>
        </div>
        <div className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-0.5 sm:mb-1">{completedOrders.length}</div>
        <div className="text-[10px] sm:text-xs lg:text-sm text-gray-400">Completed Sales</div>
      </div>
    </div>
  )
}