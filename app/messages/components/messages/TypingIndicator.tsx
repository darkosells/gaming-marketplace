// File Path: app/messages/components/messages/TypingIndicator.tsx

'use client'

import { TypingUser } from '../../types'
import Avatar from '../common/Avatar'

interface TypingIndicatorProps {
  typingUsers: Map<string, TypingUser>
  otherUserAvatarUrl: string | null
}

export default function TypingIndicator({ 
  typingUsers, 
  otherUserAvatarUrl 
}: TypingIndicatorProps) {
  const typingUsersList = Array.from(typingUsers.values())
  
  if (typingUsersList.length === 0) return null

  const typingUsername = typingUsersList[0].username

  return (
    <div className="flex gap-2 mb-2 justify-start">
      <div className="mt-1">
        <Avatar 
          avatarUrl={otherUserAvatarUrl}
          username={typingUsername}
          size="sm"
        />
      </div>
      <div className="max-w-[70%] items-start flex flex-col">
        <div className="rounded-2xl px-4 py-2.5 bg-slate-800/80 border border-white/10">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <span 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                style={{ animationDelay: '0ms' }}
              />
              <span 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                style={{ animationDelay: '150ms' }}
              />
              <span 
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 px-2">
          {typingUsername} is typing...
        </p>
      </div>
    </div>
  )
}