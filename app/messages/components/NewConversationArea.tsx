// File Path: app/messages/components/NewConversationArea.tsx

'use client'

import { RefObject } from 'react'
import { Message } from '../types'
import { formatRankDisplay } from '../utils/messageHelpers'
import MessageInput from './MessageInput'

interface NewConversationAreaProps {
  isVisible: boolean
  messageValue: string
  onMessageChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  sending: boolean
  uploadingImage: boolean
  imagePreview: string | null
  replyingTo: Message | null
  rateLimitError: string | null
  fileInputRef: RefObject<HTMLInputElement | null>
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearImage: () => void
  onClearReply: () => void
  onTriggerFileInput: () => void
  onBackClick: () => void
  // Boosting props
  isBoosting?: boolean
  boostingOrder?: {
    id: string
    order_number: string
    game: string
    current_rank: string
    desired_rank: string
    status: string
    final_price: number
  } | null
}

export default function NewConversationArea({
  isVisible,
  messageValue,
  onMessageChange,
  onSubmit,
  sending,
  uploadingImage,
  imagePreview,
  replyingTo,
  rateLimitError,
  fileInputRef,
  onImageSelect,
  onClearImage,
  onClearReply,
  onTriggerFileInput,
  onBackClick,
  isBoosting = false,
  boostingOrder = null
}: NewConversationAreaProps) {
  return (
    <div className={`${
      isVisible ? 'block' : 'hidden lg:block'
    } lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackClick}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-base sm:text-lg">
              {isBoosting ? 'New Boosting Chat' : 'New Conversation'}
            </h3>
            <p className="text-xs text-gray-400">Send a message to start the conversation</p>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className={`px-3 sm:px-4 py-2 border-b ${isBoosting ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className={`text-xs flex items-center gap-2 ${isBoosting ? 'text-cyan-300' : 'text-blue-300'}`}>
            <span>🛡️</span>
            <span className="line-clamp-2">Never share passwords, credit cards, or personal documents.</span>
          </p>
          <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full ${isBoosting ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
            <svg className={`w-3 h-3 ${isBoosting ? 'text-cyan-400' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className={`text-xs font-semibold ${isBoosting ? 'text-cyan-300' : 'text-blue-300'}`}>Protected by SSL</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md px-4">
          {isBoosting && boostingOrder ? (
            // Boosting order info
            <>
              <div className="text-4xl sm:text-6xl mb-4">⚡</div>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Start Boosting Chat</h3>
              
              {/* Boosting Order Card */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4 text-left">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚡</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {boostingOrder.game.charAt(0).toUpperCase()}{boostingOrder.game.slice(1)} Rank Boost
                    </p>
                    <p className="text-cyan-300 text-xs">
                      Order #{boostingOrder.order_number.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">From</p>
                      <p className="text-white font-semibold text-sm">
                        {formatRankDisplay(boostingOrder.current_rank)}
                      </p>
                    </div>
                    <div className="text-cyan-400 text-xl">→</div>
                    <div className="text-center">
                      <p className="text-gray-400 text-xs mb-1">To</p>
                      <p className="text-cyan-400 font-semibold text-sm">
                        {formatRankDisplay(boostingOrder.desired_rank)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-400 text-xs sm:text-sm mb-4">
                Start a conversation with your booster to discuss your order, share credentials, or ask questions.
              </p>
              
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3">
                <p className="text-xs text-cyan-300">
                  💡 <strong>Tip:</strong> Introduce yourself and let the booster know when you're available for the boost to begin.
                </p>
              </div>
            </>
          ) : (
            // Marketplace new conversation
            <>
              <div className="text-4xl sm:text-6xl mb-4">💬</div>
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-2">Start a Conversation</h3>
              <p className="text-gray-400 text-xs sm:text-base mb-4">
                Type your message below to start chatting with the seller about this listing.
              </p>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 sm:p-4">
                <p className="text-xs text-purple-300">
                  💡 <strong>Tip:</strong> Be clear about what you're interested in and ask any questions you have about the product.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Message Input */}
      <MessageInput
        value={messageValue}
        onChange={onMessageChange}
        onSubmit={onSubmit}
        disabled={!messageValue.trim() && !imagePreview}
        sending={sending}
        uploadingImage={uploadingImage}
        imagePreview={imagePreview}
        replyingTo={replyingTo}
        rateLimitError={rateLimitError}
        fileInputRef={fileInputRef}
        onImageSelect={onImageSelect}
        onClearImage={onClearImage}
        onClearReply={onClearReply}
        onTriggerFileInput={onTriggerFileInput}
        placeholder={isBoosting ? "Type your first message to the booster..." : "Type your first message..."}
        accentColor={isBoosting ? 'cyan' : 'purple'}
      />
    </div>
  )
}