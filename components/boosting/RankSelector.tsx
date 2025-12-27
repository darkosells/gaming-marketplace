'use client'

// ============================================================================
// RANK SELECTOR COMPONENT
// ============================================================================
// Location: components/boosting/RankSelector.tsx
// ============================================================================

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { RankKey } from '@/lib/boosting/types'
import { RANKS, getRanksByTier, getRankIcon, RANKS_MAP } from '@/lib/boosting/ranks'

interface RankSelectorProps {
  label: string
  value: RankKey | null
  onChange: (rank: RankKey) => void
  minRank?: RankKey
  maxRank?: RankKey
  excludeRank?: RankKey
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function RankSelector({
  label,
  value,
  onChange,
  minRank,
  maxRank,
  excludeRank,
  disabled = false,
  error,
  placeholder = 'Select rank...',
}: RankSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter ranks based on min/max
  const getFilteredRanks = () => {
    let filtered = [...RANKS]
    
    if (minRank !== undefined) {
      const minIndex = RANKS.findIndex(r => r.key === minRank)
      if (minIndex !== -1) {
        filtered = filtered.filter((_, index) => index > minIndex)
      }
    }
    
    if (maxRank !== undefined) {
      const maxIndex = RANKS.findIndex(r => r.key === maxRank)
      if (maxIndex !== -1) {
        filtered = filtered.filter((_, index) => index < maxIndex)
      }
    }
    
    if (excludeRank) {
      filtered = filtered.filter(r => r.key !== excludeRank)
    }
    
    return filtered
  }

  const filteredRanks = getFilteredRanks()
  const selectedRank = value ? RANKS_MAP[value] : null

  // Group filtered ranks by tier
  const ranksByTier = filteredRanks.reduce((acc, rank) => {
    if (!acc[rank.tier]) {
      acc[rank.tier] = []
    }
    acc[rank.tier].push(rank)
    return acc
  }, {} as Record<string, typeof RANKS>)

  const handleSelect = (rank: RankKey) => {
    onChange(rank)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200
          ${disabled 
            ? 'bg-slate-800/30 border-white/5 cursor-not-allowed opacity-50' 
            : isOpen
              ? 'bg-slate-800/80 border-purple-500 ring-2 ring-purple-500/20'
              : error
                ? 'bg-slate-800/60 border-red-500/50 hover:border-red-500'
                : 'bg-slate-800/60 border-white/10 hover:border-purple-500/50'
          }
        `}
      >
        {selectedRank ? (
          <>
            {/* Rank Image */}
            <div className="w-10 h-10 relative flex-shrink-0">
              <Image
                src={selectedRank.image}
                alt={selectedRank.name}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            
            {/* Rank Name */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-white font-semibold truncate">{selectedRank.name}</p>
              <p className="text-xs text-gray-400">{selectedRank.tier}</p>
            </div>
          </>
        ) : (
          <span className="flex-1 text-left text-gray-500">{placeholder}</span>
        )}

        {/* Dropdown Arrow */}
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div 
          className="absolute left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          style={{ zIndex: 9999 }}
        >
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent"
            style={{ maxHeight: '320px' }}
          >
            {Object.entries(ranksByTier).map(([tier, ranks]) => (
              <div key={tier}>
                {/* Tier Header */}
                <div 
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider sticky top-0"
                  style={{ 
                    backgroundColor: ranks[0]?.color ? `${ranks[0].color}20` : '#1e1e2e',
                    color: ranks[0]?.color || '#a0a0a0',
                  }}
                >
                  {tier}
                </div>
                
                {/* Ranks in Tier */}
                {ranks.map((rank) => (
                  <button
                    key={rank.key}
                    type="button"
                    onClick={() => handleSelect(rank.key)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150
                      ${value === rank.key 
                        ? 'bg-purple-500/20' 
                        : 'hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Rank Image */}
                    <div className="w-8 h-8 relative flex-shrink-0">
                      <Image
                        src={rank.image}
                        alt={rank.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    
                    {/* Rank Name */}
                    <span 
                      className="font-medium flex-1 text-left"
                      style={{ color: rank.color }}
                    >
                      {rank.name}
                    </span>

                    {/* Selected Check */}
                    {value === rank.key && (
                      <svg className="w-5 h-5 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            ))}
            
            {filteredRanks.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No ranks available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}