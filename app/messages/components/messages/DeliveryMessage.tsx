// File Path: app/messages/components/messages/DeliveryMessage.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Message } from '../../types'
import { formatDateTime } from '../../utils/messageHelpers'
import { extractDeliveryContent } from '../../utils/deliveryHelpers'

interface DeliveryMessageProps {
  message: Message
  orderId: string | null
  isRevealed: boolean
  onReveal: (messageId: string) => void
  onHide: (messageId: string) => void
}

export default function DeliveryMessage({
  message,
  orderId,
  isRevealed,
  onReveal,
  onHide
}: DeliveryMessageProps) {
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)
  const { credentials } = extractDeliveryContent(message.content)
  const isCopied = copiedOrderId === orderId

  const copyOrderId = async () => {
    if (!orderId) return
    try {
      await navigator.clipboard.writeText(orderId)
      setCopiedOrderId(orderId)
      setTimeout(() => setCopiedOrderId(null), 2000)
    } catch (err) {
      console.error('Failed to copy order ID:', err)
    }
  }

  return (
    <div className="flex justify-center my-3 sm:my-4">
      <div className="max-w-[95%] sm:max-w-[85%] bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 backdrop-blur-lg border-2 border-green-400/50 rounded-2xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl sm:text-2xl">🔑</span>
          </div>
          <div className="flex-1 min-w-0">
            {/* Header with reveal/hide buttons */}
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-green-300 font-bold text-xs sm:text-sm">
                  Delivery Information
                </span>
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                {isRevealed ? (
                  <button
                    onClick={() => onHide(message.id)}
                    className="px-2 sm:px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-medium text-green-300 hover:bg-green-500/30 transition-all flex items-center gap-1 min-h-[32px]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <span className="hidden sm:inline">Hide</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onReveal(message.id)}
                    className="px-2 sm:px-3 py-1 bg-green-500/30 border border-green-500/50 rounded-lg text-xs font-medium text-white hover:bg-green-500/40 transition-all flex items-center gap-1 min-h-[32px]"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline">Reveal</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Order ID Display */}
            {orderId && (
              <div className="mb-3 bg-slate-900/60 border border-green-500/20 rounded-lg p-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-gray-400">Order:</span>
                    <span className="text-xs font-mono text-green-300 truncate">
                      #{orderId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={copyOrderId}
                      className={`p-1.5 rounded-md border transition-all duration-200 min-h-[28px] min-w-[28px] flex items-center justify-center ${
                        isCopied 
                          ? 'bg-green-500/20 border-green-500/30 text-green-400' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                      title="Copy full Order ID"
                    >
                      {isCopied ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <Link
                      href={`/order/${orderId}`}
                      className="px-2.5 py-1.5 bg-green-500/20 border border-green-500/30 rounded-md text-xs font-medium text-green-300 hover:bg-green-500/30 transition-all flex items-center gap-1.5 min-h-[28px]"
                    >
                      <span>View Order</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content area */}
            {isRevealed ? (
              <div className="space-y-2">
                {/* Credentials - shown when revealed */}
                <div className="bg-slate-900/80 border border-green-500/30 rounded-lg p-2 sm:p-3">
                  <pre className="text-white font-mono text-xs sm:text-sm whitespace-pre-wrap break-all leading-relaxed select-all">
                    {credentials}
                  </pre>
                </div>
                
                {/* Security reminder */}
                <div className="pt-2 border-t border-green-500/20">
                  <p className="text-xs text-green-400/70 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Access logged for security
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Blurred/hidden credentials */}
                <div className="bg-slate-900/80 border border-white/10 rounded-lg p-2 sm:p-3 relative overflow-hidden">
                  <div className="blur-sm select-none pointer-events-none">
                    <p className="text-white font-mono text-xs sm:text-sm">
                      ••••••••••••••••••••<br/>
                      ••••••••••••••••<br/>
                      ••••••••••
                    </p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-xl sm:text-2xl">🔒</span>
                      <span className="text-xs font-medium">Click "Reveal" to show</span>
                    </div>
                  </div>
                </div>
                
                {/* Warning when hidden */}
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                  <p className="text-xs text-orange-300 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="line-clamp-2">Only reveal when ready. Action will be logged.</span>
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-xs text-green-300/60 mt-2 sm:mt-3 text-center">
              {formatDateTime(message.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}