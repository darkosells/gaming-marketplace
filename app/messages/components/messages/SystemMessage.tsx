// File Path: app/messages/components/messages/SystemMessage.tsx

'use client'

import { Message } from '../../types'
import { formatDateTime } from '../../utils/messageHelpers'

interface SystemMessageProps {
  message: Message
}

export default function SystemMessage({ message }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-3 sm:my-4">
      <div className="max-w-[95%] sm:max-w-[85%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-xl">🔔</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-300 font-bold text-xs sm:text-sm">
                System Notification
              </span>
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
              {message.content}
            </div>
            <p className="text-xs text-blue-300/60 mt-2 sm:mt-3 text-center">
              {formatDateTime(message.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}