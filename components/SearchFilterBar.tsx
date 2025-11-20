'use client'

interface SearchFilterProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  dateFilter: 'all' | 'today' | 'week' | 'month'
  setDateFilter: (filter: 'all' | 'today' | 'week' | 'month') => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  gameFilter: string
  setGameFilter: (game: string) => void
  activeTab: string
  games: string[]
  selectedItems: string[]
  onBulkAction: (action: string) => void
  onClearSelection: () => void
}

export default function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  statusFilter,
  setStatusFilter,
  gameFilter,
  setGameFilter,
  activeTab,
  games,
  selectedItems,
  onBulkAction,
  onClearSelection
}: SearchFilterProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        {/* Status/Game Filter */}
        {activeTab === 'orders' ? (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="dispute_raised">Dispute</option>
            <option value="refunded">Refunded</option>
          </select>
        ) : (activeTab === 'listings' || activeTab === 'orders') ? (
          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Games</option>
            {games.map(game => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        ) : (
          <div></div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-between">
          <span className="text-white font-semibold">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            {activeTab === 'users' && (
              <button
                onClick={() => onBulkAction('ban')}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border border-red-500/30 font-semibold"
              >
                🚫 Bulk Ban
              </button>
            )}
            {activeTab === 'listings' && (
              <button
                onClick={() => onBulkAction('delete')}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition border border-red-500/30 font-semibold"
              >
                🗑️ Bulk Delete
              </button>
            )}
            {activeTab === 'orders' && (
              <button
                onClick={() => onBulkAction('refund')}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition border border-orange-500/30 font-semibold"
              >
                💰 Bulk Refund
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition border border-white/10"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}