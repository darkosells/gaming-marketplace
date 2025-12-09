'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

export default function GuideTab() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

  const orderStatuses = [
    {
      status: 'pending',
      label: 'Pending',
      icon: '⏳',
      color: 'yellow',
      description: 'Order has been placed but payment is not yet confirmed.',
      vendorAction: 'Wait for payment confirmation.',
      bgClass: 'bg-yellow-500/20 border-yellow-500/30',
      textClass: 'text-yellow-400'
    },
    {
      status: 'paid',
      label: 'Paid',
      icon: '💳',
      color: 'blue',
      description: 'Payment confirmed. For automatic delivery, codes are sent instantly. For manual delivery, you need to deliver.',
      vendorAction: 'Deliver the item to the buyer (manual delivery only).',
      bgClass: 'bg-blue-500/20 border-blue-500/30',
      textClass: 'text-blue-400'
    },
    {
      status: 'delivered',
      label: 'Delivered',
      icon: '📦',
      color: 'purple',
      description: 'Item has been delivered. Buyer has 48 hours to confirm or raise a dispute.',
      vendorAction: 'Wait for buyer confirmation or auto-completion.',
      bgClass: 'bg-purple-500/20 border-purple-500/30',
      textClass: 'text-purple-400'
    },
    {
      status: 'completed',
      label: 'Completed',
      icon: '✅',
      color: 'green',
      description: 'Order successfully completed. Funds are now in your available balance.',
      vendorAction: 'Funds available for withdrawal!',
      bgClass: 'bg-green-500/20 border-green-500/30',
      textClass: 'text-green-400'
    },
    {
      status: 'dispute_raised',
      label: 'Dispute Raised',
      icon: '⚠️',
      color: 'orange',
      description: 'Buyer has raised a dispute. An admin will review and make a decision.',
      vendorAction: 'Respond to the dispute via order chat. Provide evidence if needed.',
      bgClass: 'bg-orange-500/20 border-orange-500/30',
      textClass: 'text-orange-400'
    },
    {
      status: 'refunded',
      label: 'Refunded',
      icon: '↩️',
      color: 'red',
      description: 'Order was refunded to the buyer. No funds will be released.',
      vendorAction: 'Review what went wrong to prevent future issues.',
      bgClass: 'bg-red-500/20 border-red-500/30',
      textClass: 'text-red-400'
    },
    {
      status: 'cancelled',
      label: 'Cancelled',
      icon: '❌',
      color: 'gray',
      description: 'Order was cancelled before completion.',
      vendorAction: 'No action needed.',
      bgClass: 'bg-gray-500/20 border-gray-500/30',
      textClass: 'text-gray-400'
    }
  ]

  const timelineSteps = [
    {
      step: 1,
      title: 'Order Placed',
      description: 'Buyer purchases your listing',
      icon: '🛒',
      time: 'Instant'
    },
    {
      step: 2,
      title: 'Payment Confirmed',
      description: 'Funds are held in escrow',
      icon: '💳',
      time: 'Instant'
    },
    {
      step: 3,
      title: 'Item Delivered',
      description: 'Auto-delivery sends codes instantly, or you deliver manually',
      icon: '📦',
      time: 'Auto: Instant | Manual: Within 24 hours'
    },
    {
      step: 4,
      title: 'Buyer Protection Period',
      description: 'Buyer can confirm receipt or raise a dispute',
      icon: '🛡️',
      time: '48 hours'
    },
    {
      step: 5,
      title: 'Order Completed',
      description: 'Funds released to your balance (minus 5% commission)',
      icon: '✅',
      time: 'After confirmation or 48h auto-complete'
    },
    {
      step: 6,
      title: 'Withdraw Earnings',
      description: 'Request withdrawal via Bitcoin or Skrill',
      icon: '💰',
      time: 'Anytime'
    }
  ]

  const faqItems: FAQItem[] = [
    {
      question: 'When are orders automatically completed?',
      answer: 'Orders are automatically marked as completed 48 hours after delivery if the buyer hasn\'t confirmed receipt or raised a dispute. This protects both parties while ensuring you get paid even if the buyer forgets to confirm.'
    },
    {
      question: 'How does the 5% commission work?',
      answer: 'Nashflare charges a 5% commission on completed orders. For example, if you sell an item for $100, you\'ll receive $95. This commission covers payment processing, platform maintenance, and customer support.'
    },
    {
      question: 'When can I withdraw my earnings?',
      answer: 'You can withdraw your available balance anytime! Funds become available as soon as an order is marked as completed. There are no holding periods after order completion.'
    },
    {
      question: 'What are the withdrawal fees?',
      answer: 'Bitcoin: 6% + $20 flat fee (minimum $100). Skrill: 5% + $1 flat fee (minimum $10). We recommend accumulating a larger balance before withdrawing to minimize fee impact.'
    },
    {
      question: 'What happens if a buyer raises a dispute?',
      answer: 'When a dispute is raised, the order funds remain in escrow until an admin reviews the case. You\'ll be notified and can respond via the order chat. Provide any evidence (screenshots, delivery proof) to support your case. Admins typically resolve disputes within 24-48 hours.'
    },
    {
      question: 'How does automatic delivery work?',
      answer: 'For listings with automatic delivery, you upload codes/keys to our system. When a buyer purchases, the code is instantly delivered via email and shown on the order page. Stock automatically decreases, and listings go "out of stock" when codes run out.'
    },
    {
      question: 'Can buyers leave reviews?',
      answer: 'Yes! After order completion, buyers can leave a 1-5 star rating and optional comment. Your overall rating is displayed on your profile and listings. Good ratings help attract more buyers.'
    },
    {
      question: 'What if my listing goes out of stock?',
      answer: 'For automatic delivery listings, stock updates automatically. For manual delivery, you should update stock manually. Out-of-stock listings remain visible but cannot be purchased until restocked.'
    },
    {
      question: 'How do I become a verified seller?',
      answer: 'Apply for verification through your profile settings. You\'ll need to submit ID verification documents. Verified sellers get a badge, higher trust from buyers, and access to higher withdrawal limits.'
    },
    {
      question: 'What\'s the buyer protection period?',
      answer: 'Buyers have 48 hours after delivery to confirm receipt or raise a dispute. During this time, funds are held securely. This protects buyers from non-delivery while ensuring sellers get paid for legitimate transactions.'
    }
  ]

  return (
    <div id="guide-section">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
        <span className="text-purple-400">📚</span>
        Seller Guide
      </h2>

      {/* Quick Stats / Key Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl mb-2">5%</div>
          <div className="text-xs sm:text-sm text-gray-400">Platform Commission</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl mb-2">48h</div>
          <div className="text-xs sm:text-sm text-gray-400">Buyer Protection</div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl mb-2">⚡</div>
          <div className="text-xs sm:text-sm text-gray-400">Instant Auto-Delivery</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-2xl sm:text-3xl mb-2">24/7</div>
          <div className="text-xs sm:text-sm text-gray-400">Withdraw Anytime</div>
        </div>
      </div>

      {/* Order Lifecycle Timeline */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span>🔄</span> Order Lifecycle
        </h3>
        
        <div className="relative">
          {/* Timeline Line - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-green-500 transform -translate-x-1/2"></div>
          
          <div className="space-y-4 lg:space-y-0">
            {timelineSteps.map((step, index) => (
              <div key={step.step} className={`lg:flex lg:items-center lg:gap-8 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right lg:pr-8' : 'lg:text-left lg:pl-8'}`}>
                  <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-3 lg:justify-start">
                      <span className="text-2xl">{step.icon}</span>
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base">{step.title}</h4>
                        <p className="text-gray-400 text-xs sm:text-sm">{step.description}</p>
                        <p className="text-purple-400 text-xs mt-1">⏱️ {step.time}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Step Number - Center on large screens */}
                <div className="hidden lg:flex w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/30 z-10 flex-shrink-0">
                  {step.step}
                </div>
                
                {/* Empty space for alternating layout */}
                <div className="hidden lg:block flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Status Definitions */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span>📋</span> Order Status Guide
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {orderStatuses.map((status) => (
            <div 
              key={status.status}
              className={`${status.bgClass} border rounded-xl p-4 hover:scale-[1.02] transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{status.icon}</span>
                <span className={`font-bold ${status.textClass}`}>{status.label}</span>
              </div>
              <p className="text-gray-300 text-xs sm:text-sm mb-2">{status.description}</p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] sm:text-xs text-gray-400">
                  <span className="font-semibold">Your action:</span> {status.vendorAction}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commission & Fees Breakdown */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span>💵</span> Commission & Fees
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Platform Commission */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 sm:p-5">
            <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
              <span>🏪</span> Platform Commission
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Commission Rate</span>
                <span className="text-white font-bold text-lg">5%</span>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Example:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sale Price</span>
                    <span className="text-white">$100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Commission (5%)</span>
                    <span className="text-red-400">-$5.00</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-white/10">
                    <span className="text-gray-300 font-semibold">You Receive</span>
                    <span className="text-green-400 font-bold">$95.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Fees */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 sm:p-5">
            <h4 className="text-green-400 font-bold mb-3 flex items-center gap-2">
              <span>💸</span> Withdrawal Fees
            </h4>
            <div className="space-y-3">
              {/* Bitcoin */}
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">₿</span>
                  <span className="text-white font-semibold">Bitcoin</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentage Fee</span>
                    <span className="text-white">6%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Flat Fee</span>
                    <span className="text-white">$20.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Withdrawal</span>
                    <span className="text-yellow-400">$100.00</span>
                  </div>
                </div>
              </div>
              
              {/* Skrill */}
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💳</span>
                  <span className="text-white font-semibold">Skrill</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Percentage Fee</span>
                    <span className="text-white">5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Flat Fee</span>
                    <span className="text-white">$1.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Minimum Withdrawal</span>
                    <span className="text-yellow-400">$10.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-purple-300 font-semibold text-sm">Pro Tip</p>
              <p className="text-gray-400 text-xs sm:text-sm">Accumulate a larger balance before withdrawing to minimize the impact of flat fees. For example, withdrawing $500 via Skrill costs $26 (5.2%) vs withdrawing $50 which costs $3.50 (7%).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Important Timelines */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span>⏰</span> Important Timelines
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="text-3xl mb-2">🛡️</div>
            <h4 className="text-blue-400 font-bold mb-1">Buyer Protection</h4>
            <p className="text-2xl font-bold text-white mb-1">48 Hours</p>
            <p className="text-gray-400 text-xs sm:text-sm">After delivery, buyers have 48 hours to confirm or dispute</p>
          </div>
          
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-3xl mb-2">✅</div>
            <h4 className="text-green-400 font-bold mb-1">Auto-Complete</h4>
            <p className="text-2xl font-bold text-white mb-1">48 Hours</p>
            <p className="text-gray-400 text-xs sm:text-sm">Orders auto-complete if buyer doesn't act within 48h</p>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="text-purple-400 font-bold mb-1">Fund Release</h4>
            <p className="text-2xl font-bold text-white mb-1">Instant</p>
            <p className="text-gray-400 text-xs sm:text-sm">Funds available immediately after order completion</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <span>❓</span> Frequently Asked Questions
        </h3>
        
        <div className="space-y-2 sm:space-y-3">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className="border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left bg-slate-700/30 hover:bg-slate-700/50 transition-all"
              >
                <span className="text-white font-medium text-sm sm:text-base pr-4">{item.question}</span>
                <span className={`text-purple-400 transition-transform duration-200 flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              
              {expandedFAQ === index && (
                <div className="p-4 bg-slate-800/50 border-t border-white/5">
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Need More Help */}
      <div className="mt-6 sm:mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 sm:p-6 text-center">
        <div className="text-3xl sm:text-4xl mb-3">💬</div>
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Need More Help?</h3>
        <p className="text-gray-400 text-sm sm:text-base mb-4">
          Can't find what you're looking for? Our support team is here to help!
        </p>
        <a 
  href="/contact" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          <span>Contact Support</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  )
}