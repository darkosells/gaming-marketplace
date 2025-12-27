// ============================================================================
// NASHFLARE BOOSTING - VALORANT RANKS DATA & UTILITIES
// ============================================================================
// Location: lib/boosting/ranks.ts
// ============================================================================

import { RankKey, RankTier, ValorantRank } from './types'

// ============================================================================
// RANK IMAGE BASE PATH
// ============================================================================

// Using CDN for rank images - can also use local: '/ranks/valorant'
const RANK_IMAGE_BASE = 'https://trackercdn.com/cdn/tracker.gg/valorant/icons/tiersv2'

// ============================================================================
// RANK DATA
// ============================================================================

export interface RankData {
  key: RankKey
  name: string
  tier: RankTier
  division: number | null
  order: number
  color: string
  bgColor: string
  borderColor: string
  gradient: string
  image: string // Path to rank icon image
}

export const RANKS: RankData[] = [
  // Iron
  { key: 'iron_1', name: 'Iron 1', tier: 'Iron', division: 1, order: 1, color: '#4A4A4A', bgColor: 'bg-gray-600/30', borderColor: 'border-gray-500', gradient: 'from-gray-600 to-gray-700', image: `${RANK_IMAGE_BASE}/3.png` },
  { key: 'iron_2', name: 'Iron 2', tier: 'Iron', division: 2, order: 2, color: '#4A4A4A', bgColor: 'bg-gray-600/30', borderColor: 'border-gray-500', gradient: 'from-gray-600 to-gray-700', image: `${RANK_IMAGE_BASE}/4.png` },
  { key: 'iron_3', name: 'Iron 3', tier: 'Iron', division: 3, order: 3, color: '#4A4A4A', bgColor: 'bg-gray-600/30', borderColor: 'border-gray-500', gradient: 'from-gray-600 to-gray-700', image: `${RANK_IMAGE_BASE}/5.png` },
  
  // Bronze
  { key: 'bronze_1', name: 'Bronze 1', tier: 'Bronze', division: 1, order: 4, color: '#B97450', bgColor: 'bg-orange-900/30', borderColor: 'border-orange-700', gradient: 'from-orange-800 to-orange-900', image: `${RANK_IMAGE_BASE}/6.png` },
  { key: 'bronze_2', name: 'Bronze 2', tier: 'Bronze', division: 2, order: 5, color: '#B97450', bgColor: 'bg-orange-900/30', borderColor: 'border-orange-700', gradient: 'from-orange-800 to-orange-900', image: `${RANK_IMAGE_BASE}/7.png` },
  { key: 'bronze_3', name: 'Bronze 3', tier: 'Bronze', division: 3, order: 6, color: '#B97450', bgColor: 'bg-orange-900/30', borderColor: 'border-orange-700', gradient: 'from-orange-800 to-orange-900', image: `${RANK_IMAGE_BASE}/8.png` },
  
  // Silver
  { key: 'silver_1', name: 'Silver 1', tier: 'Silver', division: 1, order: 7, color: '#B4B4B4', bgColor: 'bg-gray-400/20', borderColor: 'border-gray-400', gradient: 'from-gray-400 to-gray-500', image: `${RANK_IMAGE_BASE}/9.png` },
  { key: 'silver_2', name: 'Silver 2', tier: 'Silver', division: 2, order: 8, color: '#B4B4B4', bgColor: 'bg-gray-400/20', borderColor: 'border-gray-400', gradient: 'from-gray-400 to-gray-500', image: `${RANK_IMAGE_BASE}/10.png` },
  { key: 'silver_3', name: 'Silver 3', tier: 'Silver', division: 3, order: 9, color: '#B4B4B4', bgColor: 'bg-gray-400/20', borderColor: 'border-gray-400', gradient: 'from-gray-400 to-gray-500', image: `${RANK_IMAGE_BASE}/11.png` },
  
  // Gold
  { key: 'gold_1', name: 'Gold 1', tier: 'Gold', division: 1, order: 10, color: '#ECB93D', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500', gradient: 'from-yellow-500 to-yellow-600', image: `${RANK_IMAGE_BASE}/12.png` },
  { key: 'gold_2', name: 'Gold 2', tier: 'Gold', division: 2, order: 11, color: '#ECB93D', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500', gradient: 'from-yellow-500 to-yellow-600', image: `${RANK_IMAGE_BASE}/13.png` },
  { key: 'gold_3', name: 'Gold 3', tier: 'Gold', division: 3, order: 12, color: '#ECB93D', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500', gradient: 'from-yellow-500 to-yellow-600', image: `${RANK_IMAGE_BASE}/14.png` },
  
  // Platinum
  { key: 'platinum_1', name: 'Platinum 1', tier: 'Platinum', division: 1, order: 13, color: '#5DC5D9', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400', gradient: 'from-cyan-400 to-cyan-600', image: `${RANK_IMAGE_BASE}/15.png` },
  { key: 'platinum_2', name: 'Platinum 2', tier: 'Platinum', division: 2, order: 14, color: '#5DC5D9', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400', gradient: 'from-cyan-400 to-cyan-600', image: `${RANK_IMAGE_BASE}/16.png` },
  { key: 'platinum_3', name: 'Platinum 3', tier: 'Platinum', division: 3, order: 15, color: '#5DC5D9', bgColor: 'bg-cyan-500/20', borderColor: 'border-cyan-400', gradient: 'from-cyan-400 to-cyan-600', image: `${RANK_IMAGE_BASE}/17.png` },
  
  // Diamond
  { key: 'diamond_1', name: 'Diamond 1', tier: 'Diamond', division: 1, order: 16, color: '#E47EFF', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400', gradient: 'from-purple-400 to-purple-600', image: `${RANK_IMAGE_BASE}/18.png` },
  { key: 'diamond_2', name: 'Diamond 2', tier: 'Diamond', division: 2, order: 17, color: '#E47EFF', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400', gradient: 'from-purple-400 to-purple-600', image: `${RANK_IMAGE_BASE}/19.png` },
  { key: 'diamond_3', name: 'Diamond 3', tier: 'Diamond', division: 3, order: 18, color: '#E47EFF', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-400', gradient: 'from-purple-400 to-purple-600', image: `${RANK_IMAGE_BASE}/20.png` },
  
  // Ascendant
  { key: 'ascendant_1', name: 'Ascendant 1', tier: 'Ascendant', division: 1, order: 19, color: '#2DB67D', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-400', gradient: 'from-emerald-400 to-emerald-600', image: `${RANK_IMAGE_BASE}/21.png` },
  { key: 'ascendant_2', name: 'Ascendant 2', tier: 'Ascendant', division: 2, order: 20, color: '#2DB67D', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-400', gradient: 'from-emerald-400 to-emerald-600', image: `${RANK_IMAGE_BASE}/22.png` },
  { key: 'ascendant_3', name: 'Ascendant 3', tier: 'Ascendant', division: 3, order: 21, color: '#2DB67D', bgColor: 'bg-emerald-500/20', borderColor: 'border-emerald-400', gradient: 'from-emerald-400 to-emerald-600', image: `${RANK_IMAGE_BASE}/23.png` },
  
  // Immortal
  { key: 'immortal_1', name: 'Immortal 1', tier: 'Immortal', division: 1, order: 22, color: '#D9415E', bgColor: 'bg-red-500/20', borderColor: 'border-red-400', gradient: 'from-red-400 to-red-600', image: `${RANK_IMAGE_BASE}/24.png` },
  { key: 'immortal_2', name: 'Immortal 2', tier: 'Immortal', division: 2, order: 23, color: '#D9415E', bgColor: 'bg-red-500/20', borderColor: 'border-red-400', gradient: 'from-red-400 to-red-600', image: `${RANK_IMAGE_BASE}/25.png` },
  { key: 'immortal_3', name: 'Immortal 3', tier: 'Immortal', division: 3, order: 24, color: '#D9415E', bgColor: 'bg-red-500/20', borderColor: 'border-red-400', gradient: 'from-red-400 to-red-600', image: `${RANK_IMAGE_BASE}/26.png` },
  
  // Radiant
  { key: 'radiant', name: 'Radiant', tier: 'Radiant', division: null, order: 25, color: '#FFFFAA', bgColor: 'bg-yellow-300/20', borderColor: 'border-yellow-300', gradient: 'from-yellow-200 to-yellow-400', image: `${RANK_IMAGE_BASE}/27.png` },
]

// Create a map for quick lookup
export const RANKS_MAP: Record<RankKey, RankData> = RANKS.reduce((acc, rank) => {
  acc[rank.key] = rank
  return acc
}, {} as Record<RankKey, RankData>)

// ============================================================================
// TIER DATA
// ============================================================================

export interface TierData {
  name: RankTier
  color: string
  bgColor: string
  divisions: number
  ranks: RankKey[]
}

export const TIERS: TierData[] = [
  { name: 'Iron', color: '#4A4A4A', bgColor: 'bg-gray-600', divisions: 3, ranks: ['iron_1', 'iron_2', 'iron_3'] },
  { name: 'Bronze', color: '#B97450', bgColor: 'bg-orange-800', divisions: 3, ranks: ['bronze_1', 'bronze_2', 'bronze_3'] },
  { name: 'Silver', color: '#B4B4B4', bgColor: 'bg-gray-400', divisions: 3, ranks: ['silver_1', 'silver_2', 'silver_3'] },
  { name: 'Gold', color: '#ECB93D', bgColor: 'bg-yellow-500', divisions: 3, ranks: ['gold_1', 'gold_2', 'gold_3'] },
  { name: 'Platinum', color: '#5DC5D9', bgColor: 'bg-cyan-400', divisions: 3, ranks: ['platinum_1', 'platinum_2', 'platinum_3'] },
  { name: 'Diamond', color: '#E47EFF', bgColor: 'bg-purple-400', divisions: 3, ranks: ['diamond_1', 'diamond_2', 'diamond_3'] },
  { name: 'Ascendant', color: '#2DB67D', bgColor: 'bg-emerald-400', divisions: 3, ranks: ['ascendant_1', 'ascendant_2', 'ascendant_3'] },
  { name: 'Immortal', color: '#D9415E', bgColor: 'bg-red-400', divisions: 3, ranks: ['immortal_1', 'immortal_2', 'immortal_3'] },
  { name: 'Radiant', color: '#FFFFAA', bgColor: 'bg-yellow-200', divisions: 1, ranks: ['radiant'] },
]

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get rank data by key
 */
export function getRank(key: RankKey): RankData | undefined {
  return RANKS_MAP[key]
}

/**
 * Get rank name by key
 */
export function getRankName(key: RankKey): string {
  return RANKS_MAP[key]?.name || key
}

/**
 * Get rank order (for comparison)
 */
export function getRankOrder(key: RankKey): number {
  return RANKS_MAP[key]?.order || 0
}

/**
 * Get rank tier
 */
export function getRankTier(key: RankKey): RankTier | undefined {
  return RANKS_MAP[key]?.tier
}

/**
 * Get rank color
 */
export function getRankColor(key: RankKey): string {
  return RANKS_MAP[key]?.color || '#ffffff'
}

/**
 * Get rank image URL
 */
export function getRankImage(key: RankKey): string {
  return RANKS_MAP[key]?.image || ''
}

/**
 * Check if rank A is lower than rank B
 */
export function isRankLower(rankA: RankKey, rankB: RankKey): boolean {
  return getRankOrder(rankA) < getRankOrder(rankB)
}

/**
 * Check if rank A is higher than rank B
 */
export function isRankHigher(rankA: RankKey, rankB: RankKey): boolean {
  return getRankOrder(rankA) > getRankOrder(rankB)
}

/**
 * Get number of divisions between two ranks
 */
export function getDivisionsBetween(fromRank: RankKey, toRank: RankKey): number {
  const fromOrder = getRankOrder(fromRank)
  const toOrder = getRankOrder(toRank)
  return Math.max(0, toOrder - fromOrder)
}

/**
 * Get all ranks between two ranks (inclusive)
 */
export function getRanksBetween(fromRank: RankKey, toRank: RankKey): RankData[] {
  const fromOrder = getRankOrder(fromRank)
  const toOrder = getRankOrder(toRank)
  return RANKS.filter(rank => rank.order >= fromOrder && rank.order <= toOrder)
}

/**
 * Get valid target ranks (higher than current)
 */
export function getValidTargetRanks(currentRank: RankKey): RankData[] {
  const currentOrder = getRankOrder(currentRank)
  return RANKS.filter(rank => rank.order > currentOrder)
}

/**
 * Get valid current ranks (lower than target)
 */
export function getValidCurrentRanks(targetRank: RankKey): RankData[] {
  const targetOrder = getRankOrder(targetRank)
  return RANKS.filter(rank => rank.order < targetOrder)
}

/**
 * Get next rank
 */
export function getNextRank(currentRank: RankKey): RankData | undefined {
  const currentOrder = getRankOrder(currentRank)
  return RANKS.find(rank => rank.order === currentOrder + 1)
}

/**
 * Get previous rank
 */
export function getPreviousRank(currentRank: RankKey): RankData | undefined {
  const currentOrder = getRankOrder(currentRank)
  return RANKS.find(rank => rank.order === currentOrder - 1)
}

/**
 * Check if rank is valid
 */
export function isValidRank(key: string): key is RankKey {
  return key in RANKS_MAP
}

/**
 * Get all ranks as options for select
 */
export function getRankOptions(): { value: RankKey; label: string; tier: RankTier }[] {
  return RANKS.map(rank => ({
    value: rank.key,
    label: rank.name,
    tier: rank.tier,
  }))
}

/**
 * Group ranks by tier
 */
export function getRanksByTier(): Record<RankTier, RankData[]> {
  return RANKS.reduce((acc, rank) => {
    if (!acc[rank.tier]) {
      acc[rank.tier] = []
    }
    acc[rank.tier].push(rank)
    return acc
  }, {} as Record<RankTier, RankData[]>)
}

/**
 * Calculate progress percentage between two ranks
 */
export function calculateProgressPercentage(
  currentRank: RankKey,
  targetRank: RankKey,
  progressRank: RankKey
): number {
  const totalDivisions = getDivisionsBetween(currentRank, targetRank)
  if (totalDivisions === 0) return 100
  
  const completedDivisions = getDivisionsBetween(currentRank, progressRank)
  return Math.min(100, Math.round((completedDivisions / totalDivisions) * 100))
}

/**
 * Format rank for display with color
 */
export function formatRankDisplay(key: RankKey): { name: string; color: string; tier: RankTier } {
  const rank = RANKS_MAP[key]
  return {
    name: rank?.name || key,
    color: rank?.color || '#ffffff',
    tier: rank?.tier || 'Iron',
  }
}

// ============================================================================
// RANK ICONS (SVG paths or emoji fallbacks)
// ============================================================================

export const RANK_ICONS: Record<RankTier, string> = {
  Iron: '🔩',
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💎',
  Diamond: '💠',
  Ascendant: '🌟',
  Immortal: '👑',
  Radiant: '☀️',
}

/**
 * Get rank icon (emoji) - for fallback use
 */
export function getRankIcon(key: RankKey): string {
  const tier = getRankTier(key)
  return tier ? RANK_ICONS[tier] : '🎮'
}

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

export default {
  RANKS,
  RANKS_MAP,
  TIERS,
  getRank,
  getRankName,
  getRankOrder,
  getRankTier,
  getRankColor,
  getRankImage,
  isRankLower,
  isRankHigher,
  getDivisionsBetween,
  getRanksBetween,
  getValidTargetRanks,
  getValidCurrentRanks,
  getNextRank,
  getPreviousRank,
  isValidRank,
  getRankOptions,
  getRanksByTier,
  calculateProgressPercentage,
  formatRankDisplay,
  getRankIcon,
}