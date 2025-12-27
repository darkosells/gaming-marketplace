'use client'

// ============================================================================
// RANK PROGRESS BAR COMPONENT
// ============================================================================
// Location: components/boosting/RankProgressBar.tsx
// ============================================================================

import Image from 'next/image'
import { RankKey } from '@/lib/boosting/types'
import { getRanksBetween, getRankIcon, RANKS_MAP } from '@/lib/boosting/ranks'

interface RankProgressBarProps {
  currentRank: RankKey | null
  desiredRank: RankKey | null
  progressRank?: RankKey | null // For tracking progress
  compact?: boolean
}

export default function RankProgressBar({
  currentRank,
  desiredRank,
  progressRank,
  compact = false,
}: RankProgressBarProps) {
  if (!currentRank || !desiredRank) {
    return null
  }

  const ranksInRange = getRanksBetween(currentRank, desiredRank)
  const progressOrder = progressRank ? RANKS_MAP[progressRank]?.order : null
  const currentOrder = RANKS_MAP[currentRank]?.order || 0

  // Calculate progress percentage
  const totalSteps = ranksInRange.length - 1
  const completedSteps = progressOrder ? progressOrder - currentOrder : 0
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  if (compact) {
    // Compact version - just a progress bar
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative">
              <Image
                src={RANKS_MAP[currentRank]?.image || ''}
                alt={RANKS_MAP[currentRank]?.name || ''}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-sm font-medium text-gray-300">
              {RANKS_MAP[currentRank]?.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">
              {RANKS_MAP[desiredRank]?.name}
            </span>
            <div className="w-6 h-6 relative">
              <Image
                src={RANKS_MAP[desiredRank]?.image || ''}
                alt={RANKS_MAP[desiredRank]?.name || ''}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {progressRank && progressRank !== currentRank && (
          <p className="text-xs text-gray-400 mt-1 text-center">
            Currently at: <span className="text-white font-medium">{RANKS_MAP[progressRank]?.name}</span>
          </p>
        )}
      </div>
    )
  }

  // Determine layout based on number of ranks
  const isLargeBoost = ranksInRange.length > 12
  const isMediumBoost = ranksInRange.length > 6

  // Full version - show each rank with progress bar
  return (
    <div className="w-full">
      <div className="relative p-3 rounded-xl bg-slate-900/30">
        {/* Progress Bar Background - spans full width */}
        <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-700 rounded-full" style={{ marginTop: isLargeBoost || isMediumBoost ? '-12px' : '0' }} />
        
        {/* Progress Bar Fill - shows completed progress when tracking */}
        {progressRank && (
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ 
              width: `calc(${progressPercentage}% - 16px)`,
              marginTop: isLargeBoost || isMediumBoost ? '-12px' : '0'
            }}
          />
        )}

        {/* Rank Icons Grid - wraps to multiple rows */}
        <div className={`
          relative flex flex-wrap justify-between items-center
          ${isLargeBoost ? 'gap-1' : isMediumBoost ? 'gap-1.5' : 'gap-2'}
        `}>
          {ranksInRange.map((rank, index) => {
            const isCompleted = progressOrder ? rank.order <= progressOrder : index === 0
            const isCurrent = progressRank === rank.key || (index === 0 && !progressRank)
            const isStart = index === 0
            const isEnd = index === ranksInRange.length - 1

            // Determine icon size based on number of ranks
            const iconSize = isLargeBoost ? 'w-8 h-8' : isMediumBoost ? 'w-9 h-9' : 'w-10 h-10'
            const innerIconSize = isLargeBoost ? 'w-6 h-6' : isMediumBoost ? 'w-7 h-7' : 'w-7 h-7'

            return (
              <div 
                key={rank.key}
                className="flex flex-col items-center relative z-10"
                title={rank.name}
              >
                {/* Rank Node */}
                <div 
                  className={`
                    relative ${iconSize} rounded-full flex items-center justify-center
                    transition-all duration-300 border-2
                    ${isStart 
                      ? 'bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/30' 
                      : isEnd
                        ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-500/30'
                        : isCompleted 
                          ? 'bg-slate-700 border-purple-400/50' 
                          : 'bg-slate-800 border-slate-600'
                    }
                    ${isCurrent && !isStart && !isEnd ? 'ring-2 ring-yellow-500/50 border-yellow-400' : ''}
                  `}
                >
                  <div className={`${innerIconSize} relative`}>
                    <Image
                      src={rank.image}
                      alt={rank.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  
                  {/* Completed Checkmark - only show for tracking progress */}
                  {isCompleted && !isCurrent && !isStart && progressRank && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Rank Name - only show for start and end */}
                {(isStart || isEnd) && !isLargeBoost && !isMediumBoost && (
                  <span 
                    className={`
                      mt-1.5 text-[10px] font-medium text-center whitespace-nowrap
                      ${isStart ? 'text-cyan-400' : 'text-purple-400'}
                    `}
                  >
                    {rank.name}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Start/End Labels for medium/large boosts */}
        {(isLargeBoost || isMediumBoost) && (
          <div className="flex justify-between mt-2 px-1">
            <span className="text-xs text-cyan-400 font-medium">{RANKS_MAP[currentRank]?.name}</span>
            <span className="text-xs text-purple-400 font-medium">{RANKS_MAP[desiredRank]?.name}</span>
          </div>
        )}
      </div>

      {/* Divisions Counter */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium">
          {ranksInRange.length - 1} division{ranksInRange.length - 1 !== 1 ? 's' : ''} to boost
        </span>
      </div>
    </div>
  )
}