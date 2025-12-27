// ============================================================================
// NASHFLARE BOOSTING - MAIN EXPORTS
// ============================================================================
// Location: lib/boosting/index.ts
// ============================================================================

// Types
export * from './types'

// Constants
export * from './constants'

// Ranks
export {
  RANKS,
  RANKS_MAP,
  TIERS,
  getRank,
  getRankName,
  getRankOrder,
  getRankTier,
  getRankColor,
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
  RANK_ICONS,
  type RankData,
  type TierData,
} from './ranks'

// Pricing
export {
  calculateBoostPrice,
  calculateEstimatedTime,
  validateCounterOfferPrice,
  calculateOfferPlatformFee,
  calculateVendorPayout,
  formatPrice,
  formatPriceRaw,
  roundToTwoDecimals,
  getPriceBreakdown,
  getQuickPriceEstimate,
  getDivisionPrice,
  BASE_PRICES,
  type PriceBreakdownItem,
} from './pricing'