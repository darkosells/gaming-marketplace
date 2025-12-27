'use client'

// ============================================================================
// ADDON SELECTOR COMPONENT
// ============================================================================
// Location: components/boosting/AddonSelector.tsx
// ============================================================================

import { useState } from 'react'
import { QueueType, AddonSelection, ValorantAgent, VALORANT_AGENTS } from '@/lib/boosting/types'
import { 
  ADDONS_CONFIG, 
  PRIORITY_MULTIPLIER,
  MAX_SPECIFIC_AGENTS 
} from '@/lib/boosting/constants'

interface AddonSelectorProps {
  queueType: QueueType
  addons: AddonSelection
  onAddonsChange: (addons: AddonSelection) => void
  isPriority: boolean
  onPriorityChange: (priority: boolean) => void
  specificAgents: string[]
  onSpecificAgentsChange: (agents: string[]) => void
  disabled?: boolean
}

export default function AddonSelector({
  queueType,
  addons,
  onAddonsChange,
  isPriority,
  onPriorityChange,
  specificAgents,
  onSpecificAgentsChange,
  disabled = false,
}: AddonSelectorProps) {
  const [showAgentModal, setShowAgentModal] = useState(false)

  // Filter addons based on queue type
  const availableAddons = ADDONS_CONFIG.filter(addon => {
    // Skip stream for now (coming soon)
    if (addon.key === 'stream') return true // Show but disabled
    // Solo-only addons not available for duo
    if (addon.soloOnly && queueType === 'duo') return false
    return addon.enabled || addon.comingSoon
  })

  const handleAddonToggle = (key: string) => {
    if (disabled) return
    
    const addonKey = key as keyof AddonSelection
    const newAddons = { ...addons, [addonKey]: !addons[addonKey] }
    
    // If toggling off specific agents, clear the list
    if (key === 'specificAgents' && addons.specificAgents) {
      onSpecificAgentsChange([])
    }
    
    // If toggling on specific agents, show modal
    if (key === 'specificAgents' && !addons.specificAgents) {
      setShowAgentModal(true)
    }
    
    onAddonsChange(newAddons)
  }

  const handleAgentToggle = (agent: string) => {
    if (specificAgents.includes(agent)) {
      onSpecificAgentsChange(specificAgents.filter(a => a !== agent))
    } else if (specificAgents.length < MAX_SPECIFIC_AGENTS) {
      onSpecificAgentsChange([...specificAgents, agent])
    }
  }

  const priorityPercentage = Math.round((PRIORITY_MULTIPLIER - 1) * 100)

  return (
    <div className="space-y-4">
      {/* Priority Option - Always Available */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Priority Service
        </label>
        
        <button
          type="button"
          onClick={() => !disabled && onPriorityChange(!isPriority)}
          disabled={disabled}
          className={`
            w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${isPriority
              ? 'border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-500/20'
              : 'border-white/10 bg-slate-800/40 hover:border-yellow-500/30 hover:bg-slate-800/60'
            }
          `}
        >
          {/* Checkbox */}
          <div className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0
            ${isPriority 
              ? 'border-yellow-500 bg-yellow-500' 
              : 'border-gray-500 bg-transparent'
            }
          `}>
            {isPriority && (
              <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Icon */}
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isPriority ? 'bg-yellow-500/20' : 'bg-slate-700/50'}
          `}>
            <svg className={`w-5 h-5 ${isPriority ? 'text-yellow-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-semibold ${isPriority ? 'text-white' : 'text-gray-300'}`}>
                Priority Queue
              </h4>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-500/20 text-yellow-400">
                +{priorityPercentage}%
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              Your order gets prioritized for faster completion
            </p>
          </div>
        </button>
      </div>

      {/* Add-ons Section */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3">
          Add-ons
          {queueType === 'duo' && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Some add-ons only available for Solo Queue)
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableAddons.map((addon) => {
            const isSelected = addons[addon.key as keyof AddonSelection]
            const isDisabled = disabled || addon.comingSoon || (addon.soloOnly && queueType === 'duo')
            const percentage = Math.round(addon.multiplier * 100)

            return (
              <button
                key={addon.key}
                type="button"
                onClick={() => !isDisabled && handleAddonToggle(addon.key)}
                disabled={isDisabled}
                className={`
                  relative flex items-start gap-3 p-3 rounded-xl border-2 transition-all duration-200 text-left
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${isSelected && !isDisabled
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-slate-800/40 hover:border-white/20'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                  ${isSelected && !isDisabled
                    ? 'border-purple-500 bg-purple-500' 
                    : 'border-gray-500 bg-transparent'
                  }
                `}>
                  {isSelected && !isDisabled && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`font-medium text-sm ${isSelected && !isDisabled ? 'text-white' : 'text-gray-300'}`}>
                      {addon.label}
                    </h4>
                    {addon.comingSoon ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-500/30 text-gray-400">
                        COMING SOON
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">
                        +{percentage}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {addon.description}
                  </p>
                </div>

                {/* Solo Only Badge */}
                {addon.soloOnly && queueType === 'duo' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-gray-400">
                    Solo Only
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Specific Agents Selection (if selected) */}
      {addons.specificAgents && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">Select Preferred Agents</h4>
            <span className="text-xs text-gray-400">
              {specificAgents.length}/{MAX_SPECIFIC_AGENTS} selected
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {VALORANT_AGENTS.map((agent) => (
              <button
                key={agent}
                type="button"
                onClick={() => handleAgentToggle(agent)}
                disabled={disabled || (!specificAgents.includes(agent) && specificAgents.length >= MAX_SPECIFIC_AGENTS)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${specificAgents.includes(agent)
                    ? 'bg-purple-500 text-white'
                    : specificAgents.length >= MAX_SPECIFIC_AGENTS
                      ? 'bg-slate-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                  }
                `}
              >
                {agent}
              </button>
            ))}
          </div>

          {specificAgents.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Select up to {MAX_SPECIFIC_AGENTS} agents you'd like the booster to play
            </p>
          )}
        </div>
      )}
    </div>
  )
}