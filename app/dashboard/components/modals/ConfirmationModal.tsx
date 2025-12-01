'use client'

import { useEffect } from 'react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger' | 'warning'
  isProcessing?: boolean
  details?: {
    label: string
    value: string
    highlight?: boolean
  }[]
  sections?: {
    title: string
    items: {
      label: string
      value: string
      type?: 'default' | 'fee' | 'total' | 'highlight'
    }[]
  }[]
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default',
  isProcessing = false,
  details,
  sections
}: ConfirmationModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, isProcessing, onClose])

  if (!isOpen) return null

  const icons = {
    default: (
      <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
        <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    danger: (
      <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
        <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    )
  }

  const buttonColors = {
    default: 'from-purple-500 to-pink-500 hover:shadow-purple-500/50',
    danger: 'from-red-500 to-rose-500 hover:shadow-red-500/50',
    warning: 'from-yellow-500 to-amber-500 hover:shadow-yellow-500/50'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => !isProcessing && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900/95 border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Icon */}
        {icons[type]}

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        {message && (
          <p className="text-gray-400 text-center text-sm sm:text-base mb-4">
            {message}
          </p>
        )}

        {/* Simple Details */}
        {details && details.length > 0 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-4 space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <span className="text-gray-400 text-sm">{detail.label}</span>
                <span className={`text-sm font-semibold ${detail.highlight ? 'text-purple-400' : 'text-white'}`}>
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Sections (for detailed breakdowns like fees) */}
        {sections && sections.length > 0 && (
          <div className="space-y-4 mb-6">
            {sections.map((section, sIndex) => (
              <div key={sIndex} className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">{section.title}</h4>
                <div className="space-y-2">
                  {section.items.map((item, iIndex) => (
                    <div 
                      key={iIndex} 
                      className={`flex items-center justify-between gap-3 ${
                        item.type === 'total' ? 'pt-2 border-t border-white/10 mt-2' : ''
                      }`}
                    >
                      <span className={`text-sm ${
                        item.type === 'fee' ? 'text-red-400' : 
                        item.type === 'total' ? 'text-gray-300 font-semibold' : 
                        item.type === 'highlight' ? 'text-green-400 font-semibold' :
                        'text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                      <span className={`text-sm font-semibold ${
                        item.type === 'fee' ? 'text-red-400' : 
                        item.type === 'total' ? 'text-white' : 
                        item.type === 'highlight' ? 'text-green-400' :
                        'text-white'
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 border border-white/10 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 bg-gradient-to-r ${buttonColors[type]} text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}