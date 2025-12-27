// File Path: app/messages/components/ChatArea.tsx

'use client'

import { RefObject } from 'react'
import { Conversation, Message, TypingUser } from '../types'
import { shouldShowDateSeparator } from '../utils/messageHelpers'
import { isDeliveryMessage } from '../utils/deliveryHelpers'
import ChatHeader from './ChatHeader'
import MessageInput from './MessageInput'
import {
  MessageBubble,
  DeliveryMessage,
  SystemMessage,
  AdminMessage,
  TypingIndicator,
  DateSeparator
} from './messages'

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  currentUserAvatarUrl: string | null
  currentUsername: string
  otherUserOnline: boolean
  otherUserLastSeen: string | null
  typingUsers: Map<string, TypingUser>
  revealedDeliveryMessages: Set<string>
  messagesEndRef: RefObject<HTMLDivElement | null>
  // Input props
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
  // Actions
  onBackClick: () => void
  onReportClick: () => void
  onMarkDelivered: () => void
  onReplyToMessage: (message: Message) => void
  onImageClick: (imageUrl: string) => void
  onRevealDelivery: (messageId: string) => void
  onHideDelivery: (messageId: string) => void
  // Visibility
  isVisible: boolean
}

export default function ChatArea({
  conversation,
  messages,
  currentUserId,
  currentUserAvatarUrl,
  currentUsername,
  otherUserOnline,
  otherUserLastSeen,
  typingUsers,
  revealedDeliveryMessages,
  messagesEndRef,
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
  onReportClick,
  onMarkDelivered,
  onReplyToMessage,
  onImageClick,
  onRevealDelivery,
  onHideDelivery,
  isVisible
}: ChatAreaProps) {
  if (!conversation) {
    return (
      <div className={`${
        isVisible ? 'block' : 'hidden lg:block'
      } lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-5xl sm:text-6xl mb-4">🛸</div>
            <p className="text-gray-400 text-base sm:text-lg">Select a transmission to start messaging</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Your cosmic messages will appear here</p>
          </div>
        </div>
      </div>
    )
  }

  const otherUser = conversation.buyer_id === currentUserId 
    ? conversation.seller 
    : conversation.buyer

  return (
    <div className={`${
      isVisible ? 'block' : 'hidden lg:block'
    } lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        currentUserId={currentUserId}
        otherUserOnline={otherUserOnline}
        otherUserLastSeen={otherUserLastSeen}
        onBackClick={onBackClick}
        onReportClick={onReportClick}
        onMarkDelivered={onMarkDelivered}
      />

      {/* Security Info Banner */}
      <div className="px-3 sm:px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-blue-300 flex items-center gap-2">
            <span>🛡️</span>
            <span className="line-clamp-1">Never share passwords, credit cards, or personal documents.</span>
          </p>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-blue-300 font-semibold">Protected by SSL</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === currentUserId
          const isSystemMessage = message.message_type === 'system'
          const previousMessage = index > 0 ? messages[index - 1] : null
          const showDateSeparatorFlag = shouldShowDateSeparator(
            message.created_at, 
            previousMessage?.created_at || null
          )
          const isDelivery = isDeliveryMessage(message)
          
          return (
            <div key={message.id}>
              {/* Date separator */}
              {showDateSeparatorFlag && (
                <DateSeparator timestamp={message.created_at} />
              )}
              
              {/* Delivery messages with blur/reveal */}
              {isSystemMessage && isDelivery ? (
                <DeliveryMessage
                  message={message}
                  orderId={message.order_id || conversation.order_id}
                  isRevealed={revealedDeliveryMessages.has(message.id)}
                  onReveal={onRevealDelivery}
                  onHide={onHideDelivery}
                />
              ) : isSystemMessage ? (
                <SystemMessage message={message} />
              ) : message.sender?.is_admin ? (
                <AdminMessage message={message} />
              ) : (
                <MessageBubble
                  message={message}
                  isOwnMessage={isOwnMessage}
                  currentUserAvatarUrl={currentUserAvatarUrl}
                  currentUsername={currentUsername}
                  onReply={onReplyToMessage}
                  onImageClick={onImageClick}
                />
              )}
            </div>
          )
        })}
        
        {/* Typing indicator */}
        <TypingIndicator
          typingUsers={typingUsers}
          otherUserAvatarUrl={otherUser.avatar_url}
        />
        
        <div ref={messagesEndRef} />
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
      />
    </div>
  )
}