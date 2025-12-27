// File Path: app/messages/components/MessageInput.tsx

'use client'

import { useState, RefObject } from 'react'
import { Message } from '../types'
import { commonEmojis } from '../utils/messageHelpers'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  disabled: boolean
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
  placeholder?: string
  accentColor?: 'purple' | 'cyan'
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  disabled,
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
  placeholder = 'Type a message...',
  accentColor = 'purple'
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const insertEmoji = (emoji: string) => {
    onChange(value + emoji)
    setShowEmojiPicker(false)
  }

  // Dynamic color classes based on accentColor
  const colors = {
    purple: {
      replyIcon: 'text-purple-400',
      replyText: 'text-purple-300',
      imageBorder: 'border-purple-500/50',
      buttonHover: 'hover:border-purple-500/30',
      inputGlow: 'from-purple-600 to-pink-600',
      inputRing: 'focus:ring-purple-500/50 focus:border-purple-500/50',
      sendButton: 'from-purple-500 to-pink-500 hover:shadow-purple-500/50'
    },
    cyan: {
      replyIcon: 'text-cyan-400',
      replyText: 'text-cyan-300',
      imageBorder: 'border-cyan-500/50',
      buttonHover: 'hover:border-cyan-500/30',
      inputGlow: 'from-cyan-600 to-blue-600',
      inputRing: 'focus:ring-cyan-500/50 focus:border-cyan-500/50',
      sendButton: 'from-cyan-500 to-blue-500 hover:shadow-cyan-500/50'
    }
  }

  const c = colors[accentColor]

  return (
    <form onSubmit={onSubmit} className="p-3 sm:p-4 border-t border-white/10 bg-slate-800/60 relative">
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-3 bg-slate-700/50 border border-white/10 rounded-xl p-2 sm:p-3 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${c.replyIcon} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className={`text-xs ${c.replyText} font-semibold truncate`}>
                Replying to {replyingTo.sender.username}
              </span>
            </div>
            {replyingTo.image_url ? (
              <p className="text-xs text-gray-400 truncate">📷 Image</p>
            ) : (
              <p className="text-xs text-gray-400 truncate">{replyingTo.content}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClearReply}
            className="text-gray-400 hover:text-white flex-shrink-0 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Image preview */}
      {imagePreview && (
        <div className="mb-3 relative inline-block">
          <img src={imagePreview} alt="Preview" className={`h-16 sm:h-20 rounded-lg border-2 ${c.imageBorder}`} />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Emoji picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 sm:p-4 shadow-2xl z-50 max-w-[calc(100%-1rem)]">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Quick Emojis</p>
            <button 
              type="button" 
              onClick={() => setShowEmojiPicker(false)} 
              className="text-gray-400 hover:text-white transition text-lg p-1"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 sm:gap-2 max-h-[200px] overflow-y-auto">
            {commonEmojis.map((emoji, index) => (
              <button 
                key={index} 
                type="button" 
                onClick={() => insertEmoji(emoji)} 
                className="text-xl sm:text-2xl hover:bg-white/10 rounded-lg p-1.5 sm:p-2 transition-all duration-200 hover:scale-125 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rate limit error message */}
      {rateLimitError && (
        <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <p className="text-red-400 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {rateLimitError}
          </p>
        </div>
      )}
      
      {/* Input row */}
      <div className="flex gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={onImageSelect}
          className="hidden"
        />
        
        {/* Image upload button */}
        <button
          type="button"
          onClick={onTriggerFileInput}
          className={`p-2 sm:px-3 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 ${c.buttonHover} transition-all duration-300 flex-shrink-0 text-base sm:text-lg min-h-[44px] min-w-[44px] flex items-center justify-center`}
          title="Upload image"
        >
          📷
        </button>
        
        {/* Emoji button */}
        <button 
          type="button" 
          onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
          className={`p-2 sm:px-3 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 ${c.buttonHover} transition-all duration-300 flex-shrink-0 text-base sm:text-lg min-h-[44px] min-w-[44px] flex items-center justify-center`}
        >
          😊
        </button>
        
        {/* Text input */}
        <div className="flex-1 relative group">
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${c.inputGlow} rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300`} />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, 2000))}
            maxLength={2000}
            placeholder={placeholder}
            className={`relative w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 ${c.inputRing} transition-all duration-300 min-h-[44px]`}
          />
          {/* Character counter - shows when approaching limit */}
          {value.length > 1800 && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${value.length >= 2000 ? 'text-red-400' : 'text-yellow-400'}`}>
              {value.length}/2000
            </span>
          )}
        </div>
        
        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || sending || uploadingImage}
          className={`bg-gradient-to-r ${c.sendButton} text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 text-sm min-h-[44px]`}
        >
          {uploadingImage ? '📤' : sending ? '...' : '🚀'}
        </button>
      </div>
    </form>
  )
}