// File Path: app/messages/components/messages/MessageBubble.tsx

'use client'

import { Message } from '../../types'
import { formatTime, detectScamPattern } from '../../utils/messageHelpers'
import Avatar from '../common/Avatar'

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  currentUserAvatarUrl: string | null
  currentUsername: string
  onReply: (message: Message) => void
  onImageClick: (imageUrl: string) => void
}

export default function MessageBubble({
  message,
  isOwnMessage,
  currentUserAvatarUrl,
  currentUsername,
  onReply,
  onImageClick
}: MessageBubbleProps) {
  const hasScamPattern = detectScamPattern(message.content)

  // Render message read status (double check marks)
  const renderMessageStatus = () => {
    if (!isOwnMessage) return null
    if (message.message_type === 'system') return null

    const isRead = message.read

    return (
      <div className="flex items-center gap-0.5 ml-1">
        {isRead ? (
          <>
            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3.5 h-3.5 text-blue-400 -ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    )
  }

  return (
    <div className={`flex gap-2 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {/* Other user's avatar on the left */}
      {!isOwnMessage && (
        <div className="mt-1 flex-shrink-0">
          <Avatar 
            avatarUrl={message.sender.avatar_url} 
            username={message.sender.username} 
            size="sm" 
          />
        </div>
      )}
      
      <div className={`max-w-[80%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Scam warning */}
        {hasScamPattern && !isOwnMessage && (
          <div className="mb-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-300 flex items-center gap-1">
              <span>⚠️</span>
              <span className="line-clamp-1">{hasScamPattern}</span>
            </p>
          </div>
        )}
        
        {/* Message bubble */}
        <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
          isOwnMessage 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
            : 'bg-slate-800/80 text-white border border-white/10'
        } ${hasScamPattern && !isOwnMessage ? 'border-red-500/50' : ''} group relative`}>
          
          {/* Reply preview */}
          {message.reply_message && (
            <div className="mb-2 pb-2 border-b border-white/20">
              <div className="flex items-start gap-2 bg-black/20 rounded-lg p-2">
                <div className="w-1 bg-white/40 rounded-full flex-shrink-0 self-stretch" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold opacity-80">
                    {message.reply_message.sender.username}
                  </p>
                  {message.reply_message.image_url ? (
                    <p className="text-xs opacity-70 truncate">📷 Image</p>
                  ) : (
                    <p className="text-xs opacity-70 truncate">
                      {message.reply_message.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Image attachment */}
          {message.image_url && (
            <div className="mb-2">
              <img
                src={message.image_url}
                alt="Shared image"
                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition max-h-48 sm:max-h-64"
                onClick={() => onImageClick(message.image_url!)}
              />
            </div>
          )}
          
          {/* Message content */}
          {message.content && message.content !== '📷 Image' && (
            <p className="text-xs sm:text-sm break-words leading-relaxed">
              {message.content}
            </p>
          )}
          
          {/* Reply button */}
          <button
            onClick={() => onReply(message)}
            className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 rounded-full p-1.5 min-h-[28px] min-w-[28px] flex items-center justify-center"
            title="Reply"
          >
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
        </div>
        
        {/* Timestamp and read status */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <p className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </p>
          {renderMessageStatus()}
        </div>
      </div>
      
      {/* Own avatar on the right */}
      {isOwnMessage && (
        <div className="mt-1 flex-shrink-0">
          <Avatar 
            avatarUrl={currentUserAvatarUrl} 
            username={currentUsername} 
            size="sm" 
          />
        </div>
      )}
    </div>
  )
}