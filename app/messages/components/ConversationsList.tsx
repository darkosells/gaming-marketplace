// File Path: app/messages/components/ConversationsList.tsx

'use client'

import { Conversation } from '../types'
import ConversationItem from './ConversationItem'

interface ConversationsListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  currentUserId: string
  isVisible: boolean
  onSelectConversation: (conversation: Conversation) => void
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  currentUserId,
  isVisible,
  onSelectConversation
}: ConversationsListProps) {
  return (
    <div className={`${
      isVisible ? 'block' : 'hidden lg:block'
    } lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <span className="text-purple-400">🌌</span>
          Conversations
        </h2>
      </div>
      
      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto relative">
        {conversations.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="text-4xl sm:text-5xl mb-4">🛸</div>
            <p className="text-gray-400 text-sm sm:text-base">No transmissions yet</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Start by contacting a seller!</p>
          </div>
        ) : (
          <>
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                currentUserId={currentUserId}
                isSelected={selectedConversationId === conv.id}
                onClick={() => onSelectConversation(conv)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  )
}