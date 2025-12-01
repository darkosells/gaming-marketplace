'use client'

import { useMemo } from 'react'
import VendorRankBadge, { VendorRank, RANK_CONFIGS } from '../VendorRankBadge'

interface RankRequirements {
  min_completed_orders: number
  min_average_rating: number | null
  max_dispute_rate: number | null
  min_account_age_days: number
  commission_rate: number
}

interface ProgressMetric {
  label: string
  current: number
  required: number
  progress: number
  met: boolean
  icon: string
  format: (val: number) => string
  isInverse?: boolean
}

interface VendorRankCardProps {
  currentRank: VendorRank
  completedOrders: number
  averageRating: number
  disputeRate: number
  accountAgeDays: number
  commissionRate: number
  totalReviews: number
}

// Rank thresholds (should match database)
const RANK_THRESHOLDS: Record<VendorRank, RankRequirements> = {
  nova: {
    min_completed_orders: 0,
    min_average_rating: null,
    max_dispute_rate: null,
    min_account_age_days: 0,
    commission_rate: 5.00
  },
  star: {
    min_completed_orders: 25,
    min_average_rating: 4.0,
    max_dispute_rate: 15.00,
    min_account_age_days: 30,
    commission_rate: 4.50
  },
  galaxy: {
    min_completed_orders: 100,
    min_average_rating: 4.3,
    max_dispute_rate: 8.00,
    min_account_age_days: 90,
    commission_rate: 4.00
  },
  supernova: {
    min_completed_orders: 500,
    min_average_rating: 4.5,
    max_dispute_rate: 3.00,
    min_account_age_days: 180,
    commission_rate: 3.50
  }
}

const RANK_ORDER: VendorRank[] = ['nova', 'star', 'galaxy', 'supernova']

export default function VendorRankCard({
  currentRank,
  completedOrders,
  averageRating,
  disputeRate,
  accountAgeDays,
  commissionRate,
  totalReviews
}: VendorRankCardProps) {
  // Get next rank
  const currentRankIndex = RANK_ORDER.indexOf(currentRank)
  const nextRank = currentRankIndex < RANK_ORDER.length - 1 ? RANK_ORDER[currentRankIndex + 1] : null
  const nextRankRequirements = nextRank ? RANK_THRESHOLDS[nextRank] : null

  // Calculate progress to next rank
  const progressMetrics = useMemo((): ProgressMetric[] | null => {
    if (!nextRankRequirements) return null

    const metrics: ProgressMetric[] = []

    // Orders progress
    const ordersProgress = Math.min(100, (completedOrders / nextRankRequirements.min_completed_orders) * 100)
    metrics.push({
      label: 'Completed Orders',
      current: completedOrders,
      required: nextRankRequirements.min_completed_orders,
      progress: ordersProgress,
      met: completedOrders >= nextRankRequirements.min_completed_orders,
      icon: '📦',
      format: (val: number) => val.toString()
    })

    // Rating progress (if required)
    if (nextRankRequirements.min_average_rating !== null) {
      const ratingProgress = totalReviews === 0 ? 0 : Math.min(100, (averageRating / nextRankRequirements.min_average_rating) * 100)
      metrics.push({
        label: 'Average Rating',
        current: averageRating,
        required: nextRankRequirements.min_average_rating,
        progress: ratingProgress,
        met: totalReviews > 0 && averageRating >= nextRankRequirements.min_average_rating,
        icon: '⭐',
        format: (val: number) => val.toFixed(1)
      })
    }

    // Dispute rate progress (lower is better)
    if (nextRankRequirements.max_dispute_rate !== null) {
      const disputeProgress = disputeRate <= nextRankRequirements.max_dispute_rate ? 100 : Math.max(0, 100 - ((disputeRate - nextRankRequirements.max_dispute_rate) / nextRankRequirements.max_dispute_rate) * 100)
      metrics.push({
        label: 'Dispute Rate',
        current: disputeRate,
        required: nextRankRequirements.max_dispute_rate,
        progress: disputeProgress,
        met: disputeRate <= nextRankRequirements.max_dispute_rate,
        icon: '🛡️',
        format: (val: number) => `${val.toFixed(1)}%`,
        isInverse: true // Lower is better
      })
    }

    // Account age progress
    const ageProgress = Math.min(100, (accountAgeDays / nextRankRequirements.min_account_age_days) * 100)
    metrics.push({
      label: 'Account Age',
      current: accountAgeDays,
      required: nextRankRequirements.min_account_age_days,
      progress: ageProgress,
      met: accountAgeDays >= nextRankRequirements.min_account_age_days,
      icon: '📅',
      format: (val: number) => `${val} days`
    })

    return metrics
  }, [nextRankRequirements, completedOrders, averageRating, disputeRate, accountAgeDays, totalReviews])

  // Get rank-specific benefits
  const benefits = useMemo(() => {
    const allBenefits = {
      nova: [
        { icon: '✓', text: 'Basic marketplace access', active: true },
        { icon: '✓', text: 'Standard support', active: true }
      ],
      star: [
        { icon: '✓', text: '0.5% commission reduction', active: true },
        { icon: '✓', text: 'Verified badge upgrade', active: true },
        { icon: '✓', text: 'Small search boost', active: true }
      ],
      galaxy: [
        { icon: '✓', text: '1% commission reduction', active: true },
        { icon: '✓', text: 'Custom profile banner', active: true },
        { icon: '✓', text: 'Priority in disputes', active: true },
        { icon: '✓', text: '"Rising Seller" eligibility', active: true }
      ],
      supernova: [
        { icon: '✓', text: '1.5% commission reduction', active: true },
        { icon: '✓', text: 'Featured seller spotlight', active: true },
        { icon: '✓', text: 'Priority support', active: true },
        { icon: '✓', text: 'Unlimited active listings', active: true },
        { icon: '✓', text: 'Homepage feature eligibility', active: true }
      ]
    }

    return allBenefits[currentRank]
  }, [currentRank])

  const rankConfig = RANK_CONFIGS[currentRank]

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rankConfig.gradient} flex items-center justify-center text-2xl`}>
            {rankConfig.icon}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              Seller Rank
            </h3>
            <p className="text-gray-400 text-sm">Your current standing</p>
          </div>
        </div>
        <VendorRankBadge rank={currentRank} size="lg" showTooltip={false} />
      </div>

      {/* Current Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
          <div className="text-lg sm:text-xl font-bold text-white">{completedOrders}</div>
          <div className="text-xs text-gray-400">Orders</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
          <div className="text-lg sm:text-xl font-bold text-yellow-400">
            {totalReviews > 0 ? averageRating.toFixed(1) : 'N/A'}
          </div>
          <div className="text-xs text-gray-400">Rating</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
          <div className="text-lg sm:text-xl font-bold text-green-400">{commissionRate}%</div>
          <div className="text-xs text-gray-400">Commission</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-3 border border-white/5">
          <div className="text-lg sm:text-xl font-bold text-blue-400">{disputeRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-400">Disputes</div>
        </div>
      </div>

      {/* Progress to Next Rank */}
      {nextRank && progressMetrics && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <span>📈</span> Progress to {RANK_CONFIGS[nextRank].name}
            </h4>
            <VendorRankBadge rank={nextRank} size="sm" showTooltip={false} />
          </div>
          
          <div className="space-y-3">
            {progressMetrics.map((metric, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <span>{metric.icon}</span>
                    {metric.label}
                  </span>
                  <span className={metric.met ? 'text-green-400' : 'text-white'}>
                    {metric.format(metric.current)}
                    {' / '}
                    {metric.isInverse ? '≤' : ''}{metric.format(metric.required)}
                    {metric.met && ' ✓'}
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      metric.met
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}
                    style={{ width: `${metric.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Unlock Message */}
          {progressMetrics.every(m => m.met) ? (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
              <span className="text-green-400 font-semibold">
                🎉 You've met all requirements! Rank will update soon.
              </span>
            </div>
          ) : (
            <div className="mt-4 bg-slate-800/30 rounded-xl p-3 text-center">
              <span className="text-gray-400 text-sm">
                Meet all requirements above to unlock {RANK_CONFIGS[nextRank].name} rank
              </span>
            </div>
          )}
        </div>
      )}

      {/* Max Rank Message */}
      {!nextRank && (
        <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <span className="text-2xl mb-2 block">🏆</span>
          <span className="text-amber-400 font-bold">
            You've reached the highest rank!
          </span>
          <p className="text-gray-400 text-sm mt-1">
            Enjoy all premium benefits as a Supernova seller.
          </p>
        </div>
      )}

      {/* Current Benefits */}
      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span>🎁</span> Your Benefits
        </h4>
        <div className="grid sm:grid-cols-2 gap-2">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 text-sm"
            >
              <span className="text-green-400">{benefit.icon}</span>
              <span className="text-gray-300">{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All Ranks & Benefits Overview */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🎯</span> All Ranks & Benefits
        </h4>
        
        <div className="space-y-3">
          {RANK_ORDER.map((rank) => {
            const isCurrentRank = rank === currentRank
            const isUnlocked = RANK_ORDER.indexOf(rank) <= RANK_ORDER.indexOf(currentRank)
            const rankInfo = RANK_CONFIGS[rank]
            const threshold = RANK_THRESHOLDS[rank]
            
            const rankBenefits: Record<string, string[]> = {
              nova: [
                'Basic marketplace access',
                'Standard support'
              ],
              star: [
                '0.5% commission reduction (4.5%)',
                'Verified badge upgrade',
                'Small search boost'
              ],
              galaxy: [
                '1% commission reduction (4%)',
                'Custom profile banner',
                'Priority in disputes',
                '"Rising Seller" eligibility'
              ],
              supernova: [
                '1.5% commission reduction (3.5%)',
                'Featured seller spotlight',
                'Priority support',
                'Unlimited active listings',
                'Homepage feature eligibility'
              ]
            }

            const rankRequirements: Record<string, string[]> = {
              nova: ['Starting rank for all new sellers'],
              star: [
                '25+ completed orders',
                '4.0+ average rating',
                '≤15% dispute rate',
                '30+ days account age'
              ],
              galaxy: [
                '100+ completed orders',
                '4.3+ average rating',
                '≤8% dispute rate',
                '90+ days account age'
              ],
              supernova: [
                '500+ completed orders',
                '4.5+ average rating',
                '≤3% dispute rate',
                '180+ days account age'
              ]
            }

            return (
              <div 
                key={rank}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isCurrentRank 
                    ? 'bg-white/10 border-purple-500/50 ring-2 ring-purple-500/30' 
                    : isUnlocked
                      ? 'bg-white/5 border-white/10'
                      : 'bg-slate-800/30 border-white/5 opacity-75'
                }`}
              >
                {/* Rank Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rankInfo.gradient} flex items-center justify-center text-xl`}>
                      {rankInfo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{rankInfo.name}</span>
                        {isCurrentRank && (
                          <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full font-medium">
                            Current
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="px-2 py-0.5 bg-slate-700/50 text-gray-400 text-xs rounded-full font-medium">
                            🔒 Locked
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-400">{threshold.commission_rate}% commission</span>
                    </div>
                  </div>
                  <VendorRankBadge rank={rank} size="sm" showLabel={false} showTooltip={false} />
                </div>

                {/* Requirements & Benefits */}
                <div className="px-4 pb-4 grid sm:grid-cols-2 gap-4">
                  {/* Requirements */}
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Requirements</p>
                    <ul className="space-y-1.5">
                      {rankRequirements[rank].map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className={`mt-0.5 ${isUnlocked ? 'text-green-400' : 'text-gray-500'}`}>
                            {isUnlocked ? '✓' : '○'}
                          </span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Benefits</p>
                    <ul className="space-y-1.5">
                      {rankBenefits[rank].map((benefit, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className={`mt-0.5 ${isUnlocked ? 'text-green-400' : 'text-amber-400'}`}>
                            {isUnlocked ? '✓' : '★'}
                          </span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { RANK_THRESHOLDS, RANK_ORDER }