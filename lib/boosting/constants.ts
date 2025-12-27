// ============================================================================
// NASHFLARE BOOSTING - CONSTANTS
// ============================================================================
// Location: lib/boosting/constants.ts
// ============================================================================

// ============================================================================
// COMMISSION & FEES
// ============================================================================

/** Platform commission rate (8%) */
export const BOOSTING_COMMISSION_RATE = 0.08

/** Maximum counter-offer above platform suggested price (50%) */
export const MAX_COUNTER_OFFER_MULTIPLIER = 1.50

// ============================================================================
// REQUEST SETTINGS
// ============================================================================

/** Maximum offers per boost request */
export const MAX_OFFERS_PER_REQUEST = 6

/** Request expiry in days */
export const REQUEST_EXPIRY_DAYS = 7

// ============================================================================
// QUEUE TYPE MULTIPLIERS
// ============================================================================

/** Duo queue price multiplier (+50%) */
export const DUO_QUEUE_MULTIPLIER = 1.50

/** Priority queue price multiplier (+30%) */
export const PRIORITY_MULTIPLIER = 1.30

// ============================================================================
// ADD-ON MULTIPLIERS
// ============================================================================

/** Offline mode add-on multiplier (+5%) */
export const ADDON_OFFLINE_MODE_MULTIPLIER = 0.05

/** Solo queue only add-on multiplier (+30%) */
export const ADDON_SOLO_QUEUE_ONLY_MULTIPLIER = 0.30

/** No 5-stack add-on multiplier (+20%) */
export const ADDON_NO_5_STACK_MULTIPLIER = 0.20

/** Specific agents add-on multiplier (+20%) */
export const ADDON_SPECIFIC_AGENTS_MULTIPLIER = 0.20

/** Stream add-on - Coming soon (disabled) */
export const ADDON_STREAM_ENABLED = false
export const ADDON_STREAM_MULTIPLIER = 0.15 // Future: +15%

// ============================================================================
// ADD-ONS CONFIGURATION
// ============================================================================

export interface AddonConfig {
  key: string
  label: string
  description: string
  multiplier: number
  enabled: boolean
  soloOnly: boolean // Only available for solo queue
  comingSoon?: boolean
}

export const ADDONS_CONFIG: AddonConfig[] = [
  {
    key: 'offlineMode',
    label: 'Offline Mode',
    description: 'Booster appears offline while playing on your account',
    multiplier: ADDON_OFFLINE_MODE_MULTIPLIER,
    enabled: true,
    soloOnly: true,
  },
  {
    key: 'soloQueueOnly',
    label: 'Solo Queue Only',
    description: 'Booster queues alone without other boosters in party',
    multiplier: ADDON_SOLO_QUEUE_ONLY_MULTIPLIER,
    enabled: true,
    soloOnly: true,
  },
  {
    key: 'no5Stack',
    label: 'No 5 Stack',
    description: 'Avoids matching against 5-stack enemy teams',
    multiplier: ADDON_NO_5_STACK_MULTIPLIER,
    enabled: true,
    soloOnly: true,
  },
  {
    key: 'specificAgents',
    label: 'Specific Agents',
    description: 'Request booster to play with your preferred agents',
    multiplier: ADDON_SPECIFIC_AGENTS_MULTIPLIER,
    enabled: true,
    soloOnly: false, // Available for both solo and duo
  },
  {
    key: 'stream',
    label: 'Stream',
    description: 'Watch your games live as the booster plays',
    multiplier: ADDON_STREAM_MULTIPLIER,
    enabled: false,
    soloOnly: false,
    comingSoon: true,
  },
]

// ============================================================================
// TIME ESTIMATES (hours per division by tier)
// ============================================================================

export const ESTIMATED_HOURS_PER_DIVISION: Record<string, number> = {
  Iron: 2,
  Bronze: 2.5,
  Silver: 3,
  Gold: 3.5,
  Platinum: 4,
  Diamond: 5,
  Ascendant: 6,
  Immortal: 8,
  Radiant: 12, // Only for final push
}

/** Average hours per division (used as fallback) */
export const DEFAULT_HOURS_PER_DIVISION = 4

/** Hours per day a booster typically plays */
export const BOOSTER_HOURS_PER_DAY = 6

// ============================================================================
// STATUS DISPLAY CONFIGURATION
// ============================================================================

export const REQUEST_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  open: { label: 'Open', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  accepted: { label: 'Accepted', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  paid: { label: 'Paid', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  in_progress: { label: 'In Progress', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  expired: { label: 'Expired', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  dispute: { label: 'Dispute', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
}

export const OFFER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  accepted: { label: 'Accepted', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  declined: { label: 'Declined', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  withdrawn: { label: 'Withdrawn', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  expired: { label: 'Expired', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
}

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  awaiting_credentials: { 
    label: 'Awaiting Credentials', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20',
    description: 'Waiting for customer to submit account credentials'
  },
  credentials_received: { 
    label: 'Ready to Start', 
    color: 'text-blue-400', 
    bgColor: 'bg-blue-500/20',
    description: 'Credentials received, booster can begin'
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20',
    description: 'Boosting is actively in progress'
  },
  pending_confirmation: { 
    label: 'Pending Confirmation', 
    color: 'text-cyan-400', 
    bgColor: 'bg-cyan-500/20',
    description: 'Target rank achieved, awaiting customer confirmation'
  },
  completed: { 
    label: 'Completed', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20',
    description: 'Order successfully completed'
  },
  dispute: { 
    label: 'Dispute', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20',
    description: 'A dispute has been raised'
  },
  refunded: { 
    label: 'Refunded', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20',
    description: 'Order was fully refunded'
  },
  partial_refund: { 
    label: 'Partial Refund', 
    color: 'text-orange-400', 
    bgColor: 'bg-orange-500/20',
    description: 'Order was partially refunded'
  },
}

// ============================================================================
// VALIDATION LIMITS
// ============================================================================

/** Minimum offer price (to prevent spam) */
export const MIN_OFFER_PRICE = 1.00

/** Maximum customer notes length */
export const MAX_NOTES_LENGTH = 500

/** Maximum vendor notes length */
export const MAX_VENDOR_NOTES_LENGTH = 300

/** Maximum specific agents selection */
export const MAX_SPECIFIC_AGENTS = 5

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

export const SUPPORTED_GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    enabled: true,
    icon: '/images/games/valorant.png',
  },
  // Future games can be added here
] as const

export type SupportedGame = typeof SUPPORTED_GAMES[number]['id']