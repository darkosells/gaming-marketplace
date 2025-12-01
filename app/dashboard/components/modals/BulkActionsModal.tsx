interface BulkActionsModalProps {
  selectedCount: number
  bulkActionType: string
  setBulkActionType: (type: string) => void
  bulkStatusChange: string
  setBulkStatusChange: (status: string) => void
  bulkCategoryChange: string
  setBulkCategoryChange: (category: string) => void
  bulkPriceAdjustment: string
  setBulkPriceAdjustment: (adjustment: string) => void
  bulkPricePercentage: string
  setBulkPricePercentage: (percentage: string) => void
  bulkProcessing: boolean
  handleBulkAction: () => Promise<void>
  onClose: () => void
}

export default function BulkActionsModal({
  selectedCount,
  bulkActionType,
  setBulkActionType,
  bulkStatusChange,
  setBulkStatusChange,
  bulkCategoryChange,
  setBulkCategoryChange,
  bulkPriceAdjustment,
  setBulkPriceAdjustment,
  bulkPricePercentage,
  setBulkPricePercentage,
  bulkProcessing,
  handleBulkAction,
  onClose
}: BulkActionsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>⚡</span>
            Bulk Actions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
          <p className="text-purple-300 text-sm">
            <span className="font-bold">{selectedCount}</span> listing(s) selected
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">Select Action</label>
            <select
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Choose action...</option>
              <option value="status">Change Status</option>
              <option value="category">Change Category</option>
              <option value="price">Adjust Prices</option>
              <option value="delete">Delete Listings</option>
              <option value="export">Export to CSV</option>
            </select>
          </div>

          {bulkActionType === 'status' && (
            <div>
              <label className="block text-white font-semibold mb-2">New Status</label>
              <select
                value={bulkStatusChange}
                onChange={(e) => setBulkStatusChange(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select status...</option>
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          )}

          {bulkActionType === 'category' && (
            <div>
              <label className="block text-white font-semibold mb-2">New Category</label>
              <select
                value={bulkCategoryChange}
                onChange={(e) => setBulkCategoryChange(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select category...</option>
                <option value="account">Account</option>
                <option value="currency">Currency</option>
                <option value="key">Key</option>
              </select>
            </div>
          )}

          {bulkActionType === 'price' && (
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Adjustment Type</label>
                <select
                  value={bulkPriceAdjustment}
                  onChange={(e) => setBulkPriceAdjustment(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">Select adjustment...</option>
                  <option value="increase">Increase by %</option>
                  <option value="decrease">Decrease by %</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-semibold mb-2">Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={bulkPricePercentage}
                  onChange={(e) => setBulkPricePercentage(e.target.value)}
                  placeholder="e.g., 10 for 10%"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkAction}
              disabled={bulkProcessing || !bulkActionType}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                'Apply Action'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}