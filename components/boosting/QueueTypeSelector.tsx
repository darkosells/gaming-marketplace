'use client'

// ============================================================================
// QUEUE TYPE SELECTOR COMPONENT
// ============================================================================
// Location: components/boosting/QueueTypeSelector.tsx
// ============================================================================

import { QueueType } from '@/lib/boosting/types'
import { DUO_QUEUE_MULTIPLIER } from '@/lib/boosting/constants'

interface QueueTypeSelectorProps {
  value: QueueType
  onChange: (type: QueueType) => void
  disabled?: boolean
}

export default function QueueTypeSelector({
  value,
  onChange,
  disabled = false,
}: QueueTypeSelectorProps) {
  const duoPercentage = Math.round((DUO_QUEUE_MULTIPLIER - 1) * 100)

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-300">
        Queue Type
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Solo Queue Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('solo')}
          disabled={disabled}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${value === 'solo'
              ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20'
              : 'border-white/10 bg-slate-800/40 hover:border-purple-500/30 hover:bg-slate-800/60'
            }
          `}
        >
          {/* Selection Indicator */}
          <div className={`
            absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'solo' 
              ? 'border-purple-500 bg-purple-500' 
              : 'border-gray-500'
            }
          `}>
            {value === 'solo' && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center mb-3
            ${value === 'solo' ? 'bg-purple-500/20' : 'bg-slate-700/50'}
          `}>
            <svg className={`w-6 h-6 ${value === 'solo' ? 'text-purple-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-lg mb-1 ${value === 'solo' ? 'text-white' : 'text-gray-300'}`}>
            Solo Queue
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 pr-6">
            Booster plays on your account while you're offline
          </p>

          {/* Price Tag */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-700/50">
            <span className="text-xs font-medium text-gray-400">Base Price</span>
          </div>
        </button>

        {/* Duo Queue Option */}
        <button
          type="button"
          onClick={() => !disabled && onChange('duo')}
          disabled={disabled}
          className={`
            relative p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${value === 'duo'
              ? 'border-cyan-500 bg-cyan-500/10 ring-2 ring-cyan-500/20'
              : 'border-white/10 bg-slate-800/40 hover:border-cyan-500/30 hover:bg-slate-800/60'
            }
          `}
        >
          {/* Selection Indicator */}
          <div className={`
            absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${value === 'duo' 
              ? 'border-cyan-500 bg-cyan-500' 
              : 'border-gray-500'
            }
          `}>
            {value === 'duo' && (
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Icon */}
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center mb-3
            ${value === 'duo' ? 'bg-cyan-500/20' : 'bg-slate-700/50'}
          `}>
            <svg className={`w-6 h-6 ${value === 'duo' ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className={`font-bold text-lg mb-1 ${value === 'duo' ? 'text-white' : 'text-gray-300'}`}>
            Duo Queue
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-400 pr-6">
            Play together with your booster in the same party
          </p>

          {/* Price Tag */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20">
            <span className="text-xs font-bold text-cyan-400">+{duoPercentage}%</span>
          </div>
        </button>
      </div>

      {/* Info Text */}
      {value === 'duo' && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
          <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-cyan-300">
            With Duo Queue, you'll play on your own account alongside the booster. Coordinate schedules after order is accepted.
          </p>
        </div>
      )}
    </div>
  )
}