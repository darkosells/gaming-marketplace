'use client'

import React, { useState } from 'react'
import { AdminReview, ITEMS_PER_PAGE } from '../../types'

interface ReviewsTabProps {
  reviews: AdminReview[]
  filteredReviews: AdminReview[]
  currentPage: number
  onSaveReview: (reviewId: string, editedComment: string) => Promise<void>
  onDeleteReview: (id: string) => void
  renderPagination: (data: any[]) => React.ReactNode | null
}

export default function ReviewsTab({
  reviews,
  filteredReviews,
  currentPage,
  onSaveReview,
  onDeleteReview,
  renderPagination
}: ReviewsTabProps) {
  const [editingReview, setEditingReview] = useState<AdminReview | null>(null)
  const [editedComment, setEditedComment] = useState('')

  const currentReviews = filteredReviews.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleEditReview = (review: AdminReview) => {
    setEditingReview(review)
    setEditedComment(review.comment || '')
  }

  const handleSaveReview = async () => {
    if (!editingReview) return
    await onSaveReview(editingReview.id, editedComment)
    setEditingReview(null)
    setEditedComment('')
  }

  const handleCancelEdit = () => {
    setEditingReview(null)
    setEditedComment('')
  }

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={star <= rating ? 'text-yellow-400' : 'text-gray-600'}
      >
        ★
      </span>
    ))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Reviews ({filteredReviews.length})
      </h2>

      <div className="space-y-4">
        {currentReviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">⭐</div>
            <p className="text-gray-400">No reviews found</p>
          </div>
        ) : (
          currentReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition"
            >
              {/* Review Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex">{renderStars(r.rating)}</div>
                  <span className="text-white font-semibold">{r.rating}/5</span>
                  {r.edited_by_admin && (
                    <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Edited by Admin
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </p>
              </div>

              {/* Buyer/Seller Info */}
              <p className="text-gray-400 text-sm mb-3">
                <span className="text-blue-400">{r.buyer?.username || 'Unknown'}</span>
                {' → '}
                <span className="text-green-400">{r.seller?.username || 'Unknown'}</span>
              </p>

              {/* Review Content */}
              {editingReview?.id === r.id ? (
                <div className="mt-2">
                  <textarea
                    value={editedComment}
                    onChange={(e) => setEditedComment(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Edit review comment..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleSaveReview}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition border border-green-500/30"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm hover:bg-gray-500/30 transition border border-gray-500/30"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                    <p className="text-white text-sm">
                      {r.comment || <span className="text-gray-500 italic">No comment</span>}
                    </p>
                  </div>
                  {r.edited_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Edited: {new Date(r.edited_at).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditReview(r)}
                      className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition border border-yellow-500/30"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onDeleteReview(r.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition border border-red-500/30"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {renderPagination(filteredReviews)}
    </div>
  )
}