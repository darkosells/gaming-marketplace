// File Path: app/messages/components/messages/DateSeparator.tsx

'use client'

import { formatDateSeparator } from '../../utils/messageHelpers'

interface DateSeparatorProps {
  timestamp: string
}

export default function DateSeparator({ timestamp }: DateSeparatorProps) {
  return (
    <div className="flex items-center justify-center my-3 sm:my-4">
      <div className="bg-slate-800/80 backdrop-blur-lg px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/10">
        <p className="text-xs text-gray-400 font-semibold">
          {formatDateSeparator(timestamp)}
        </p>
      </div>
    </div>
  )
}