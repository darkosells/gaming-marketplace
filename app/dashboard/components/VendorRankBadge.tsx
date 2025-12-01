'use client'

import { useMemo } from 'react'

export type VendorRank = 'nova' | 'star' | 'galaxy' | 'supernova'

interface VendorRankBadgeProps {
  rank: VendorRank
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  showTooltip?: boolean
  className?: string
}

interface RankConfig {
  name: string
  icon: string
  gradient: string
  bgGlow: string
  borderColor: string
  textColor: string
  description: string
  commission: string
}

const RANK_CONFIGS: Record<VendorRank, RankConfig> = {
  nova: {
    name: 'Nova',
    icon: '✦',
    gradient: 'from-purple-500/80 to-violet-600/80',
    bgGlow: 'purple-500',
    borderColor: 'border-purple-500/50',
    textColor: 'text-purple-300',
    description: 'New Seller',
    commission: '5%'
  },
  star: {
    name: 'Star',
    icon: '⭐',
    gradient: 'from-blue-400 to-purple-500',
    bgGlow: 'blue-500',
    borderColor: 'border-blue-400/50',
    textColor: 'text-blue-300',
    description: 'Rising Seller',
    commission: '4.5%'
  },
  galaxy: {
    name: 'Galaxy',
    icon: '🌌',
    gradient: 'from-pink-500 via-purple-500 to-indigo-500',
    bgGlow: 'pink-500',
    borderColor: 'border-pink-400/50',
    textColor: 'text-pink-300',
    description: 'Trusted Seller',
    commission: '4%'
  },
  supernova: {
    name: 'Supernova',
    icon: '💫',
    gradient: 'from-amber-400 via-orange-500 to-yellow-400',
    bgGlow: 'amber-400',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-300',
    description: 'Elite Seller',
    commission: '3.5%'
  }
}

const SIZE_CLASSES = {
  xs: {
    container: 'px-1.5 py-0.5 text-[10px]',
    icon: 'text-xs',
    label: 'text-[10px]'
  },
  sm: {
    container: 'px-2 py-1 text-xs',
    icon: 'text-sm',
    label: 'text-xs'
  },
  md: {
    container: 'px-3 py-1.5 text-sm',
    icon: 'text-base',
    label: 'text-sm'
  },
  lg: {
    container: 'px-4 py-2 text-base',
    icon: 'text-lg',
    label: 'text-base'
  },
  xl: {
    container: 'px-5 py-2.5 text-lg',
    icon: 'text-xl',
    label: 'text-lg'
  }
}

export default function VendorRankBadge({
  rank,
  size = 'sm',
  showLabel = true,
  showTooltip = true,
  className = ''
}: VendorRankBadgeProps) {
  const config = RANK_CONFIGS[rank]
  const sizeClass = SIZE_CLASSES[size]

  const isAnimated = rank === 'galaxy' || rank === 'supernova'

  return (
    <div className={`relative inline-flex group ${className}`}>
      {/* Glow effect for higher ranks */}
      {isAnimated && (
        <div 
          className={`absolute inset-0 bg-${config.bgGlow}/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        />
      )}
      
      {/* Badge */}
      <div
        className={`
          relative inline-flex items-center gap-1 rounded-full font-semibold
          bg-gradient-to-r ${config.gradient}
          ${config.borderColor} border
          ${sizeClass.container}
          ${isAnimated ? 'animate-pulse-slow' : ''}
          transition-all duration-300 hover:scale-105
        `}
      >
        {/* Shimmer effect for supernova */}
        {rank === 'supernova' && (
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
          </div>
        )}
        
        <span className={`${sizeClass.icon} relative z-10`}>{config.icon}</span>
        {showLabel && (
          <span className={`${sizeClass.label} text-white font-bold relative z-10`}>
            {config.name}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800/95 backdrop-blur-lg rounded-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap">
          <div className="text-center">
            <p className={`font-bold ${config.textColor}`}>{config.name} Seller</p>
            <p className="text-gray-400 text-xs">{config.description}</p>
            <p className="text-green-400 text-xs mt-1">{config.commission} commission</p>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-slate-800/95" />
          </div>
        </div>
      )}
    </div>
  )
}

// Export config for use in other components
export { RANK_CONFIGS }
export type { RankConfig }