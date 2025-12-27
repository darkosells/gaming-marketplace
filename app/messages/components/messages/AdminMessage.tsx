// File Path: app/messages/components/messages/AdminMessage.tsx

'use client'

import { Message } from '../../types'
import { formatDateTime } from '../../utils/messageHelpers'

interface AdminMessageProps {
  message: Message
}

export default function AdminMessage({ message }: AdminMessageProps) {
  return (
    <div className="flex justify-center my-3 sm:my-4">
      <div className="max-w-[95%] sm:max-w-[85%] bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-400/30 rounded-2xl p-3 sm:p-4 shadow-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-xl">👑</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-orange-300 font-bold text-xs sm:text-sm">
                {message.sender.username}
              </span>
              <span className="px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 border border-orange-400/50">
                ADMIN
              </span>
            </div>
            <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
              {message.content}
            </div>
            <p className="text-xs text-orange-300/60 mt-2 sm:mt-3 text-center">
              {formatDateTime(message.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}