// ============================================================================
// NASHFLARE BOOSTING - PRICING CALCULATION
// ============================================================================
// Location: lib/boosting/pricing.ts
// ============================================================================

import { RankKey, QueueType, AddonSelection, PriceCalculation, BoostOptions } from './types'
import { RANKS, getRankOrder, getDivisionsBetween, getRankTier } from './ranks'
import {
  BOOSTING_COMMISSION_RATE,
  MAX_COUNTER_OFFER_MULTIPLIER,
  DUO_QUEUE_MULTIPLIER,
  PRIORITY_MULTIPLIER,
  ADDON_OFFLINE_MODE_MULTIPLIER,
  ADDON_SOLO_QUEUE_ONLY_MULTIPLIER,
  ADDON_NO_5_STACK_MULTIPLIER,
  ADDON_SPECIFIC_AGENTS_MULTIPLIER,
  ESTIMATED_HOURS_PER_DIVISION,
  DEFAULT_HOURS_PER_DIVISION,
  BOOSTER_HOURS_PER_DAY,
} from './constants'

// ============================================================================
// BASE PRICES PER DIVISION (matches database)
// ============================================================================

/**
 * Base price per division jump
 * These should match the boosting_pricing_tiers table
 */
export const BASE_PRICES: Record<string, number> = {
  // Iron tier
  'iron_1->iron_2': 3.00,
  'iron_2->iron_3': 3.00,
  'iron_3->bronze_1': 3.50,
  // Bronze tier
  'bronze_1->bronze_2': 4.00,
  'bronze_2->bronze_3': 4.00,
  'bronze_3->silver_1': 4.50,
  // Silver tier
  'silver_1->silver_2': 5.00,
  'silver_2->silver_3': 5.00,
  'silver_3->gold_1': 5.50,
  // Gold tier
  'gold_1->gold_2': 6.00,
  'gold_2->gold_3': 6.50,
  'gold_3->platinum_1': 7.00,
  // Platinum tier
  'platinum_1->platinum_2': 9.00,
  'platinum_2->platinum_3': 10.00,
  'platinum_3->diamond_1': 12.00,
  // Diamond tier
  'diamond_1->diamond_2': 15.00,
  'diamond_2->diamond_3': 18.00,
  'diamond_3->ascendant_1': 22.00,
  // Ascendant tier
  'ascendant_1->ascendant_2': 28.00,
  'ascendant_2->ascendant_3': 32.00,
  'ascendant_3->immortal_1': 40.00,
  // Immortal tier
  'immortal_1->immortal_2': 55.00,
  'immortal_2->immortal_3': 65.00,
  'immortal_3->radiant': 120.00,
}

/**
 * Get base price for a single division jump
 */
export function getDivisionPrice(fromRank: RankKey, toRank: RankKey): number {
  const key = `${fromRank}->${toRank}`
  return BASE_PRICES[key] || 10.00 // Fallback price
}

// ============================================================================
// MAIN PRICE CALCULATOR
// ============================================================================

/**
 * Calculate the complete price breakdown for a boost
 */
export function calculateBoostPrice(options: BoostOptions): PriceCalculation {
  const {
    currentRank,
    desiredRank,
    queueType,
    isPriority,
    addons,
  } = options

  // Validate ranks
  const currentOrder = getRankOrder(currentRank)
  const desiredOrder = getRankOrder(desiredRank)
  
  if (currentOrder >= desiredOrder) {
    throw new Error('Desired rank must be higher than current rank')
  }

  const divisions = desiredOrder - currentOrder

  // ============================================
  // 1. Calculate base price (sum of all division jumps)
  // ============================================
  let basePrice = 0
  const ranksInRange = RANKS.filter(r => r.order >= currentOrder && r.order < desiredOrder)
  
  for (let i = 0; i < ranksInRange.length; i++) {
    const fromRank = ranksInRange[i].key
    const nextRankIndex = RANKS.findIndex(r => r.order === ranksInRange[i].order + 1)
    if (nextRankIndex >= 0) {
      const toRank = RANKS[nextRankIndex].key
      basePrice += getDivisionPrice(fromRank, toRank)
    }
  }

  // ============================================
  // 2. Calculate queue type fee
  // ============================================
  let duoFee = 0
  if (queueType === 'duo') {
    duoFee = basePrice * (DUO_QUEUE_MULTIPLIER - 1) // +50%
  }

  // ============================================
  // 3. Calculate priority fee
  // ============================================
  let priorityFee = 0
  if (isPriority) {
    priorityFee = basePrice * (PRIORITY_MULTIPLIER - 1) // +30%
  }

  // ============================================
  // 4. Calculate addon fees
  // ============================================
  let addonFees = 0
  
  // Solo-only addons (only apply for solo queue)
  if (queueType === 'solo') {
    if (addons.offlineMode) {
      addonFees += basePrice * ADDON_OFFLINE_MODE_MULTIPLIER // +5%
    }
    if (addons.soloQueueOnly) {
      addonFees += basePrice * ADDON_SOLO_QUEUE_ONLY_MULTIPLIER // +30%
    }
    if (addons.no5Stack) {
      addonFees += basePrice * ADDON_NO_5_STACK_MULTIPLIER // +20%
    }
  }
  
  // Specific agents applies to both queue types
  if (addons.specificAgents) {
    addonFees += basePrice * ADDON_SPECIFIC_AGENTS_MULTIPLIER // +20%
  }

  // ============================================
  // 5. Calculate totals
  // ============================================
  const subtotal = basePrice + duoFee + priorityFee + addonFees
  const platformFee = subtotal * BOOSTING_COMMISSION_RATE // 8%
  const total = subtotal + platformFee

  // ============================================
  // 6. Calculate max counter-offer price
  // ============================================
  const maxCounterPrice = (subtotal + (subtotal * BOOSTING_COMMISSION_RATE)) * MAX_COUNTER_OFFER_MULTIPLIER

  // ============================================
  // 7. Calculate estimated time
  // ============================================
  const { estimatedDaysMin, estimatedDaysMax } = calculateEstimatedTime(
    currentRank,
    desiredRank,
    isPriority
  )

  return {
    basePrice: roundToTwoDecimals(basePrice),
    duoFee: roundToTwoDecimals(duoFee),
    priorityFee: roundToTwoDecimals(priorityFee),
    addonFees: roundToTwoDecimals(addonFees),
    subtotal: roundToTwoDecimals(subtotal),
    platformFee: roundToTwoDecimals(platformFee),
    total: roundToTwoDecimals(total),
    divisions,
    maxCounterPrice: roundToTwoDecimals(maxCounterPrice),
    estimatedDaysMin,
    estimatedDaysMax,
  }
}

// ============================================================================
// TIME ESTIMATION
// ============================================================================

/**
 * Calculate estimated completion time in days
 */
export function calculateEstimatedTime(
  currentRank: RankKey,
  desiredRank: RankKey,
  isPriority: boolean = false
): { estimatedDaysMin: number; estimatedDaysMax: number } {
  const ranksInRange = RANKS.filter(
    r => r.order >= getRankOrder(currentRank) && r.order < getRankOrder(desiredRank)
  )

  // Calculate total hours based on tier difficulty
  let totalHours = 0
  for (const rank of ranksInRange) {
    const tierHours = ESTIMATED_HOURS_PER_DIVISION[rank.tier] || DEFAULT_HOURS_PER_DIVISION
    totalHours += tierHours
  }

  // Priority reduces time by ~25%
  if (isPriority) {
    totalHours *= 0.75
  }

  // Convert to days (assuming booster plays ~6 hours per day)
  const daysFloat = totalHours / BOOSTER_HOURS_PER_DAY
  
  // Add variance for min/max
  const estimatedDaysMin = Math.max(1, Math.floor(daysFloat * 0.8))
  const estimatedDaysMax = Math.ceil(daysFloat * 1.3)

  return { estimatedDaysMin, estimatedDaysMax }
}

// ============================================================================
// OFFER VALIDATION
// ============================================================================

/**
 * Validate a vendor's counter-offer price
 */
export function validateCounterOfferPrice(
  offeredPrice: number,
  platformSuggestedPrice: number
): { valid: boolean; error?: string } {
  const maxAllowed = platformSuggestedPrice * MAX_COUNTER_OFFER_MULTIPLIER
  
  if (offeredPrice <= 0) {
    return { valid: false, error: 'Price must be greater than zero' }
  }
  
  if (offeredPrice > maxAllowed) {
    return { 
      valid: false, 
      error: `Counter-offer cannot exceed $${maxAllowed.toFixed(2)} (50% above platform price)` 
    }
  }
  
  return { valid: true }
}

/**
 * Calculate platform fee for an offered price
 */
export function calculateOfferPlatformFee(offeredPrice: number): number {
  return roundToTwoDecimals(offeredPrice * BOOSTING_COMMISSION_RATE)
}

/**
 * Calculate vendor payout for an offered price
 */
export function calculateVendorPayout(offeredPrice: number): number {
  const platformFee = calculateOfferPlatformFee(offeredPrice)
  return roundToTwoDecimals(offeredPrice - platformFee)
}

// ============================================================================
// PRICE FORMATTING
// ============================================================================

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

/**
 * Format price without currency symbol
 */
export function formatPriceRaw(price: number): string {
  return price.toFixed(2)
}

/**
 * Round to two decimal places
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100
}

// ============================================================================
// PRICE BREAKDOWN HELPERS
// ============================================================================

export interface PriceBreakdownItem {
  label: string
  amount: number
  percentage?: number
  isAddition?: boolean
  isSubtotal?: boolean
  isTotal?: boolean
}

/**
 * Get price breakdown as display items
 */
export function getPriceBreakdown(calculation: PriceCalculation, queueType: QueueType, addons: AddonSelection): PriceBreakdownItem[] {
  const items: PriceBreakdownItem[] = [
    {
      label: `Base Price (${calculation.divisions} division${calculation.divisions > 1 ? 's' : ''})`,
      amount: calculation.basePrice,
    },
  ]

  if (queueType === 'duo' && calculation.duoFee > 0) {
    items.push({
      label: 'Duo Queue',
      amount: calculation.duoFee,
      percentage: 50,
      isAddition: true,
    })
  }

  if (calculation.priorityFee > 0) {
    items.push({
      label: 'Priority',
      amount: calculation.priorityFee,
      percentage: 30,
      isAddition: true,
    })
  }

  if (queueType === 'solo') {
    if (addons.offlineMode) {
      items.push({
        label: 'Offline Mode',
        amount: calculation.basePrice * ADDON_OFFLINE_MODE_MULTIPLIER,
        percentage: 5,
        isAddition: true,
      })
    }
    if (addons.soloQueueOnly) {
      items.push({
        label: 'Solo Queue Only',
        amount: calculation.basePrice * ADDON_SOLO_QUEUE_ONLY_MULTIPLIER,
        percentage: 30,
        isAddition: true,
      })
    }
    if (addons.no5Stack) {
      items.push({
        label: 'No 5 Stack',
        amount: calculation.basePrice * ADDON_NO_5_STACK_MULTIPLIER,
        percentage: 20,
        isAddition: true,
      })
    }
  }

  if (addons.specificAgents) {
    items.push({
      label: 'Specific Agents',
      amount: calculation.basePrice * ADDON_SPECIFIC_AGENTS_MULTIPLIER,
      percentage: 20,
      isAddition: true,
    })
  }

  items.push({
    label: 'Subtotal',
    amount: calculation.subtotal,
    isSubtotal: true,
  })

  items.push({
    label: 'Platform Fee',
    amount: calculation.platformFee,
    percentage: 8,
    isAddition: true,
  })

  items.push({
    label: 'Total',
    amount: calculation.total,
    isTotal: true,
  })

  return items
}

// ============================================================================
// QUICK PRICE ESTIMATES
// ============================================================================

/**
 * Get a quick price estimate without full calculation
 * Useful for marketplace previews
 */
export function getQuickPriceEstimate(
  currentRank: RankKey,
  desiredRank: RankKey
): { min: number; max: number } {
  const divisions = getDivisionsBetween(currentRank, desiredRank)
  
  // Rough estimate: $5-$20 per division average
  const avgPricePerDivision = 8
  const base = divisions * avgPricePerDivision
  
  return {
    min: roundToTwoDecimals(base * 1.08), // With 8% fee
    max: roundToTwoDecimals(base * 2.5 * 1.08), // With all addons + duo + priority
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
}