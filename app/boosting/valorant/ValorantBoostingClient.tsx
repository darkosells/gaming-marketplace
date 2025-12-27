'use client'

// ============================================================================
// VALORANT BOOSTING CLIENT COMPONENT
// ============================================================================
// Location: app/boosting/valorant/ValorantBoostingClient.tsx
// ============================================================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// Types & Utils
import { RankKey, QueueType, AddonSelection, PriceCalculation } from '@/lib/boosting/types'
import { calculateBoostPrice, formatPrice } from '@/lib/boosting/pricing'
import { BOOSTING_COMMISSION_RATE, MAX_COUNTER_OFFER_MULTIPLIER, MAX_NOTES_LENGTH } from '@/lib/boosting/constants'

// Components
import RankSelector from '@/components/boosting/RankSelector'
import QueueTypeSelector from '@/components/boosting/QueueTypeSelector'
import AddonSelector from '@/components/boosting/AddonSelector'
import PriceSummary from '@/components/boosting/PriceSummary'
import RankProgressBar from '@/components/boosting/RankProgressBar'

// FAQ Data (used for both UI and structured data)
const FAQ_ITEMS = [
  {
    question: "Will my account get banned?",
    answer: "No. Our boosters use VPN protection matching your region, play at normal hours, and use offline mode to ensure your account stays completely safe. We've completed thousands of boosts with a 0% ban rate."
  },
  {
    question: "How do you protect my login credentials?",
    answer: "Your credentials are encrypted with AES-256 encryption and stored securely. Boosters can only view them once you approve the order, and access is automatically revoked when the boost is complete."
  },
  {
    question: "What if the booster doesn't finish?",
    answer: "You're protected by our money-back guarantee. If a booster fails to complete your order, you'll receive a full refund or we'll assign a new booster at no extra cost."
  },
  {
    question: "Can I play on my account during the boost?",
    answer: "For Solo Queue boosts, we recommend not playing to avoid interference. However, with Duo Queue, you'll play alongside your booster and can use your account normally between sessions."
  },
  {
    question: "How long will my boost take?",
    answer: "Completion time depends on the number of divisions. Most boosts are completed within 1-7 days. You can add Priority Queue for faster completion times."
  },
]

export default function ValorantBoostingClient() {
  const router = useRouter()
  const supabase = createClient()

  // Auth state
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [currentRank, setCurrentRank] = useState<RankKey | null>(null)
  const [desiredRank, setDesiredRank] = useState<RankKey | null>(null)
  const [queueType, setQueueType] = useState<QueueType>('solo')
  const [isPriority, setIsPriority] = useState(false)
  const [addons, setAddons] = useState<AddonSelection>({
    offlineMode: false,
    soloQueueOnly: false,
    no5Stack: false,
    specificAgents: false,
    stream: false,
  })
  const [specificAgents, setSpecificAgents] = useState<string[]>([])
  const [customerOfferPrice, setCustomerOfferPrice] = useState<number | null>(null)
  const [customerNotes, setCustomerNotes] = useState('')

  // Calculated price
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null)

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (err) {
        console.error('Auth check error:', err)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  // Recalculate price when options change
  useEffect(() => {
    if (currentRank && desiredRank) {
      try {
        const calc = calculateBoostPrice({
          currentRank,
          desiredRank,
          queueType,
          isPriority,
          addons,
          specificAgentsList: specificAgents,
        })
        setCalculation(calc)
        // Reset customer offer to match new total
        if (customerOfferPrice === null || customerOfferPrice === calculation?.total) {
          setCustomerOfferPrice(calc.total)
        }
      } catch (error) {
        setCalculation(null)
      }
    } else {
      setCalculation(null)
    }
  }, [currentRank, desiredRank, queueType, isPriority, addons, specificAgents])

  // Reset solo-only addons when switching to duo
  useEffect(() => {
    if (queueType === 'duo') {
      setAddons(prev => ({
        ...prev,
        offlineMode: false,
        soloQueueOnly: false,
        no5Stack: false,
      }))
    }
  }, [queueType])

  // Handle form submission
  const handleSubmit = async () => {
    if (!user) {
      router.push('/login?redirect=/boosting/valorant')
      return
    }

    if (!currentRank || !desiredRank || !calculation) {
      setError('Please select both current and desired ranks')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const offerPrice = customerOfferPrice ?? calculation.total
      const platformFee = offerPrice * BOOSTING_COMMISSION_RATE
      const maxCounterPrice = offerPrice * MAX_COUNTER_OFFER_MULTIPLIER

      // Calculate expiry date (7 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { data, error: insertError } = await supabase
        .from('boost_requests')
        .insert({
          customer_id: user.id,
          game: 'valorant',
          current_rank: currentRank,
          current_rr: 0,
          desired_rank: desiredRank,
          queue_type: queueType,
          is_priority: isPriority,
          addon_offline_mode: addons.offlineMode,
          addon_solo_queue_only: addons.soloQueueOnly,
          addon_no_5_stack: addons.no5Stack,
          addon_specific_agents: addons.specificAgents,
          specific_agents_list: addons.specificAgents ? specificAgents : null,
          addon_stream: false,
          platform_suggested_price: calculation.total,
          customer_offer_price: offerPrice,
          platform_fee: platformFee,
          max_counter_price: maxCounterPrice,
          estimated_days_min: calculation.estimatedDaysMin,
          estimated_days_max: calculation.estimatedDaysMax,
          customer_notes: customerNotes || null,
          status: 'open',
          total_offers_received: 0,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }

      // Redirect to the request detail page
      router.push(`/boosting/my-requests/${data.id}?created=true`)
    } catch (err: any) {
      console.error('Error creating boost request:', err)
      setError(err.message || 'Failed to create boost request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Optimized Background - GPU accelerated, no styled-jsx */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ 
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Static Gradient (removed animation to avoid styled-jsx) */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 10% 10%, rgba(239, 68, 68, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 90% 20%, rgba(168, 85, 247, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 80% 80%, rgba(239, 68, 68, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 20% 90%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Stars Layer 1 */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 10% 5%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 25% 15%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 50% 8%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 75% 20%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2px 2px at 90% 12%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 15% 35%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 40% 30%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2px 2px at 65% 40%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 85% 35%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 5% 55%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 30% 60%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 55% 50%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2px 2px at 70% 65%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 95% 55%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 20% 80%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 45% 75%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 60% 85%, rgba(255,255,255,0.6), transparent),
              radial-gradient(2px 2px at 80% 78%, rgba(255,255,255,0.7), transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Stars Layer 2 - Smaller */}
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 5% 10%, white, transparent),
              radial-gradient(1px 1px at 18% 22%, white, transparent),
              radial-gradient(1px 1px at 33% 5%, white, transparent),
              radial-gradient(1px 1px at 48% 18%, white, transparent),
              radial-gradient(1px 1px at 62% 28%, white, transparent),
              radial-gradient(1px 1px at 78% 8%, white, transparent),
              radial-gradient(1px 1px at 88% 32%, white, transparent),
              radial-gradient(1px 1px at 8% 42%, white, transparent),
              radial-gradient(1px 1px at 22% 52%, white, transparent),
              radial-gradient(1px 1px at 38% 45%, white, transparent),
              radial-gradient(1px 1px at 52% 38%, white, transparent),
              radial-gradient(1px 1px at 68% 55%, white, transparent),
              radial-gradient(1px 1px at 82% 48%, white, transparent),
              radial-gradient(1px 1px at 12% 68%, white, transparent),
              radial-gradient(1px 1px at 28% 72%, white, transparent),
              radial-gradient(1px 1px at 58% 78%, white, transparent),
              radial-gradient(1px 1px at 72% 70%, white, transparent),
              radial-gradient(1px 1px at 85% 82%, white, transparent),
              radial-gradient(1px 1px at 95% 68%, white, transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Colored accent stars */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 15% 25%, rgba(248, 113, 113, 0.9), transparent),
              radial-gradient(2px 2px at 45% 15%, rgba(192, 132, 252, 0.8), transparent),
              radial-gradient(2px 2px at 72% 45%, rgba(248, 113, 113, 0.9), transparent),
              radial-gradient(2px 2px at 28% 70%, rgba(192, 132, 252, 0.8), transparent),
              radial-gradient(2px 2px at 88% 72%, rgba(248, 113, 113, 0.9), transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/boosting"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Boosting
            </Link>
            
            <div className="flex items-center gap-4 mb-2">
              {/* Valorant Logo */}
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center overflow-hidden">
                <img 
                  src="/game-icons/valorant.svg" 
                  alt="Valorant"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  Valorant Rank Boosting
                </h1>
                <p className="text-gray-400">
                  Configure your boost and let verified boosters compete for your order
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Rank Selection - Higher z-index for dropdown */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 relative z-40">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-white">Select Your Ranks</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="relative z-30">
                    <RankSelector
                      label="Current Rank"
                      value={currentRank}
                      onChange={(rank) => {
                        setCurrentRank(rank)
                        if (desiredRank && rank >= desiredRank) {
                          setDesiredRank(null)
                        }
                      }}
                      maxRank={desiredRank || undefined}
                      placeholder="Select current rank..."
                    />
                  </div>
                  
                  <div className="relative z-20">
                    <RankSelector
                      label="Desired Rank"
                      value={desiredRank}
                      onChange={setDesiredRank}
                      minRank={currentRank || undefined}
                      placeholder="Select target rank..."
                      disabled={!currentRank}
                    />
                  </div>
                </div>

                {/* Rank Progress Visualization */}
                {currentRank && desiredRank && (
                  <RankProgressBar
                    currentRank={currentRank}
                    desiredRank={desiredRank}
                  />
                )}

                {/* Estimated Completion Time Display */}
                {calculation && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-purple-500/10 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Estimated Completion</p>
                          <p className="text-lg font-bold text-white">
                            {calculation.estimatedDaysMin === calculation.estimatedDaysMax 
                              ? `${calculation.estimatedDaysMin} day${calculation.estimatedDaysMin !== 1 ? 's' : ''}`
                              : `${calculation.estimatedDaysMin}-${calculation.estimatedDaysMax} days`
                            }
                          </p>
                        </div>
                      </div>
                      {!isPriority && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Want it faster?</p>
                          <button 
                            onClick={() => setIsPriority(true)}
                            className="text-sm text-purple-400 hover:text-purple-300 font-medium transition"
                          >
                            Add Priority Queue →
                          </button>
                        </div>
                      )}
                      {isPriority && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-yellow-400">Priority Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Queue Type */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-white">Queue Type</h2>
                </div>

                <QueueTypeSelector
                  value={queueType}
                  onChange={setQueueType}
                />
              </div>

              {/* Step 3: Add-ons */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <h2 className="text-xl font-bold text-white">Options & Add-ons</h2>
                </div>

                <AddonSelector
                  queueType={queueType}
                  addons={addons}
                  onAddonsChange={setAddons}
                  isPriority={isPriority}
                  onPriorityChange={setIsPriority}
                  specificAgents={specificAgents}
                  onSpecificAgentsChange={setSpecificAgents}
                />
              </div>

              {/* Step 4: Notes (Optional) */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-xl font-bold text-white">Additional Notes</h2>
                  <span className="text-xs text-gray-500">(Optional)</span>
                </div>

                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
                  placeholder="Any special requests or scheduling preferences..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 resize-none"
                  rows={3}
                />
                <p className="mt-2 text-xs text-gray-500 text-right">
                  {customerNotes.length}/{MAX_NOTES_LENGTH} characters
                </p>
              </div>

              {/* Guarantee Badges */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Our Guarantees
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: '🛡️', title: '100% Account Safety', desc: 'VPN protection & offline mode included' },
                    { icon: '💰', title: 'Money-Back Guarantee', desc: 'Full refund if not satisfied' },
                    { icon: '🔒', title: 'Encrypted Credentials', desc: 'AES-256 encryption for your data' },
                    { icon: '⚡', title: 'Fast Completion', desc: 'Most boosts done in 1-7 days' },
                    { icon: '👨‍💻', title: 'Verified Boosters', desc: 'All boosters are ID verified' },
                    { icon: '📊', title: 'Live Progress Tracking', desc: 'Real-time updates on your boost' },
                  ].map((badge, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{badge.title}</p>
                        <p className="text-xs text-gray-400">{badge.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ Section - Lazy Loaded with native details/summary */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, index) => (
                    <details 
                      key={index}
                      className="group border border-white/10 rounded-lg overflow-hidden"
                    >
                      <summary className="flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors cursor-pointer list-none">
                        <span className="text-sm font-medium text-white pr-4">{faq.question}</span>
                        <span className="w-8 h-8 flex-shrink-0 rounded-full bg-purple-500/20 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                          <svg 
                            className="w-4 h-4 text-purple-400"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </summary>
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Price Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <PriceSummary
                  calculation={calculation}
                  currentRank={currentRank}
                  desiredRank={desiredRank}
                  queueType={queueType}
                  addons={addons}
                  customerOfferPrice={customerOfferPrice ?? undefined}
                  onOfferPriceChange={setCustomerOfferPrice}
                  showOfferInput={true}
                />

                {/* Trustpilot Banner */}
                <a 
                  href="https://www.trustpilot.com/review/nashflare.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {/* Trustpilot Star Icon */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#00B67A"/>
                      </svg>
                      <span className="text-sm font-semibold text-white">Trustpilot</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4" viewBox="0 0 24 24" fill="#00B67A">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-green-400">Excellent</span>
                  </div>
                </a>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={!calculation || submitting}
                  className={`
                    w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200
                    flex items-center justify-center gap-3
                    ${calculation && !submitting
                      ? 'bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white shadow-lg shadow-red-500/25 hover:scale-[1.02]'
                      : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Boosting
                    </>
                  )}
                </button>

                {/* Quick Trust Indicators */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>256-bit SSL Encrypted</span>
                </div>

                {/* Not Logged In Warning */}
                {!user && (
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm text-yellow-300 font-medium">Not logged in</p>
                        <p className="text-xs text-yellow-400/70 mt-1">
                          You'll be redirected to login when you submit
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* How It Works */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-white/10">
                  <h4 className="font-semibold text-white mb-4">How It Works</h4>
                  <div className="space-y-3">
                    {[
                      { icon: '📝', text: 'Submit your boost request' },
                      { icon: '🔔', text: 'Verified boosters send offers' },
                      { icon: '✅', text: 'Accept the best offer' },
                      { icon: '💳', text: 'Pay securely & submit credentials' },
                      { icon: '🎮', text: 'Track progress in real-time' },
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-lg">{step.icon}</span>
                        <span className="text-sm text-gray-400">{step.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Verified Boosters</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}