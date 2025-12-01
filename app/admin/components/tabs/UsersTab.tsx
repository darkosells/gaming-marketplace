'use client'

import { AdminUser, ITEMS_PER_PAGE } from '../../types'

interface UsersTabProps {
  users: AdminUser[]
  filteredUsers: AdminUser[]
  currentPage: number
  selectedItems: string[]
  isExporting: boolean
  canExportData: boolean
  onSelectItem: (id: string) => void
  onSelectAll: (items: any[]) => void
  onBanUser: (id: string, isBanned: boolean) => void
  onExportCSV: () => void
  renderPagination: (data: any[]) => React.ReactNode
}

export default function UsersTab({
  users,
  filteredUsers,
  currentPage,
  selectedItems,
  isExporting,
  canExportData,
  onSelectItem,
  onSelectAll,
  onBanUser,
  onExportCSV,
  renderPagination
}: UsersTabProps) {
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">All Users ({filteredUsers.length})</h2>
        <div className="flex gap-2">
          {canExportData && (
            <button
              onClick={onExportCSV}
              disabled={isExporting}
              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30 flex items-center gap-2"
            >
              <span>📥</span>
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
          <button
            onClick={() => onSelectAll(filteredUsers)}
            className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition border border-purple-500/30"
          >
            {selectedItems.length === filteredUsers.length ? '✓ Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {currentUsers.map((u) => (
          <div
            key={u.id}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedItems.includes(u.id)}
                onChange={() => onSelectItem(u.id)}
                disabled={u.is_admin}
                className="w-5 h-5 rounded"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-semibold">{u.username}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.is_admin
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : u.role === 'vendor'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    {u.is_admin ? 'ADMIN' : u.role}
                  </span>
                  {u.admin_level === 'super_admin' && (
                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      SUPER ADMIN
                    </span>
                  )}
                  {u.is_banned && (
                    <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                      BANNED
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400">
                  Rating: {u.rating} ⭐ | Sales: {u.total_sales} | Joined:{' '}
                  {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {!u.is_admin && (
              <button
                onClick={() => onBanUser(u.id, u.is_banned)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  u.is_banned
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                }`}
              >
                {u.is_banned ? '✓ Unban' : '🚫 Ban'}
              </button>
            )}
          </div>
        ))}
      </div>

      {renderPagination(filteredUsers)}
    </div>
  )
}