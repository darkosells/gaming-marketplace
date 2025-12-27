// File Path: app/messages/components/modals/ReportModal.tsx

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  otherUserId: string
  conversationId: string
  onSuccess: () => void
}

const reportReasons = [
  'Scam or fraud',
  'Inappropriate content',
  'Harassment',
  'Spam',
  'Other'
]

export default function ReportModal({
  isOpen,
  onClose,
  userId,
  otherUserId,
  conversationId,
  onSuccess
}: ReportModalProps) {
  const supabase = createClient()
  const [reportReason, setReportReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reportReason.trim()) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reported_user_id: otherUserId,
          reported_by: userId,
          conversation_id: conversationId,
          reason: reportReason.trim(),
          status: 'pending'
        })

      if (error) throw error

      setReportReason('')
      onClose()
      onSuccess()
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setReportReason('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md shadow-2xl animate-slide-up sm:animate-fade-in max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🚨</span>
            Report User
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl p-2"
          >
            ✕
          </button>
        </div>
        
        <p className="text-gray-400 text-xs sm:text-sm mb-4">
          Help us keep Nashflare safe. Tell us why you're reporting this user.
        </p>
        
        <div className="space-y-2 sm:space-y-3 mb-4">
          {reportReasons.map((reason) => (
            <button
              key={reason}
              onClick={() => setReportReason(reason)}
              className={`w-full text-left px-3 sm:px-4 py-3 rounded-xl border transition-all min-h-[48px] text-sm ${
                reportReason === reason
                  ? 'bg-purple-500/20 border-purple-500/50 text-white'
                  : 'bg-slate-800/50 border-white/10 text-gray-300 hover:bg-white/5'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition min-h-[48px] text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reportReason || submitting}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}