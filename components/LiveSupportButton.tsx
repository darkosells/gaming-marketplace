'use client'

import { useCrisp } from '@/hooks/useCrisp'

interface LiveSupportButtonProps {
  // Visual variants
  variant?: 'default' | 'compact' | 'inline' | 'banner'
  // Optional: link to specific order for context
  orderId?: string
  listingId?: string
  // Custom text
  text?: string
  // Custom class for styling
  className?: string
}

export default function LiveSupportButton({
  variant = 'default',
  orderId,
  listingId,
  text,
  className = ''
}: LiveSupportButtonProps) {
  const { openChat, openOrderHelp, isReady } = useCrisp({ orderId, listingId })

  const handleClick = () => {
    if (orderId) {
      openOrderHelp(orderId)
    } else {
      openChat()
    }
  }

  // Compact inline version (like in cart sidebar)
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`group flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 rounded-lg transition-all duration-300 ${className}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs text-blue-300 group-hover:text-blue-200 font-medium">
          {text || 'Support available'}
        </span>
      </button>
    )
  }

  // Inline text link version
  if (variant === 'inline') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors ${className}`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
        </span>
        <span className="text-sm underline underline-offset-2">{text || 'Live support'}</span>
      </button>
    )
  }

  // Banner style (full width)
  if (variant === 'banner') {
    return (
      <button
        onClick={handleClick}
        className={`w-full group flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all duration-300 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-white font-medium text-sm">{text || 'Need help?'}</p>
            <p className="text-gray-400 text-xs">Chat with our support team</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-400 font-medium">Online</span>
          <svg className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    )
  }

  // Default style (matches your current LiveSupportIndicator)
  return (
    <button
      onClick={handleClick}
      className={`group w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-blue-500/30 hover:border-blue-500/50 rounded-xl transition-all duration-300 ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <span className="text-sm text-blue-300 group-hover:text-blue-200 font-medium">
        {text || 'Need help? Support available'}
      </span>
      <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}