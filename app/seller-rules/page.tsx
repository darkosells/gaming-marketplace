'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function SellerRulesPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const sections = [
    {
      id: 'general',
      icon: '📋',
      title: 'General Requirements',
      content: [
        {
          subtitle: 'Eligibility',
          items: [
            'You must be at least 18 years old to sell on Nashflare',
            'You must complete identity verification before listing products',
            'You must provide accurate personal and contact information',
            'You must have a valid email address and phone number',
            'Sellers are responsible for complying with all applicable laws in their jurisdiction'
          ]
        },
        {
          subtitle: 'Account Standards',
          items: [
            'One seller account per person - multiple accounts are prohibited',
            'Account sharing is not allowed',
            'You must maintain a valid payment method for receiving payouts',
            'Your account information must be kept up to date',
            'Sellers must respond to buyer inquiries within 24 hours'
          ]
        }
      ]
    },
    {
      id: 'commission',
      icon: '💰',
      title: 'Commission & Fees',
      content: [
        {
          subtitle: 'Platform Commission',
          items: [
            'Nashflare charges a 5% commission on all successful sales',
            'Commission is automatically deducted from the sale amount',
            'No listing fees or monthly subscription charges',
            'Commission applies to the product price only, not buyer fees',
            'Commission rates may vary for special promotions or seller tiers'
          ]
        },
        {
          subtitle: 'Withdrawal Policies',
          items: [
            'Funds are available for withdrawal after the 48-hour buyer protection period',
            'Withdrawals are processed within 1-3 business days',
            'Four withdrawal methods are available with different fees and minimums'
          ]
        },
        {
          subtitle: 'Withdrawal Methods & Fees',
          items: [
            '₿ Bitcoin: Minimum $100 | Fee: 6% + $20 | Processed in 24-48 hours',
            '💳 Skrill: Minimum $10 | Fee: 5% + $1 | Sent in EUR, 1-2 business days',
            '🅿️ Payoneer: Minimum $20 | Fee: 2% + $1.50 | Sent in USD, 1-2 business days',
            '🌐 Wise: Minimum $10 | Fee: 1% + $0.50 | Sent in USD, typically 1 business day (Lowest fees!)'
          ]
        }
      ]
    },
    {
      id: 'listings',
      icon: '📦',
      title: 'Listing Guidelines',
      content: [
        {
          subtitle: 'What You Can Sell',
          items: [
            'Gaming accounts (with proper disclosure of account details)',
            'In-game items, currency, and virtual goods',
            'Game keys and activation codes',
            'Gaming services (boosting, coaching, etc.)',
            'Digital gaming-related products only'
          ]
        },
        {
          subtitle: 'Listing Requirements',
          items: [
            'Accurate and detailed product descriptions are mandatory',
            'Clear pricing with no hidden fees',
            'Accurate delivery time estimates',
            'High-quality images when applicable',
            'Proper categorization of products',
            'Disclosure of any restrictions or requirements'
          ]
        },
        {
          subtitle: 'Prohibited Items',
          items: [
            'Stolen accounts or items obtained through fraud',
            'Accounts or items from banned/suspended players',
            'Real money trading (RMT) for games that explicitly prohibit it with legal consequences',
            'Personal information or data',
            'Malware, hacks, cheats, or exploits',
            'Physical goods (this is a digital-only marketplace)',
            'Adult or inappropriate content',
            'Counterfeit or fake products'
          ]
        }
      ]
    },
    {
      id: 'delivery',
      icon: '🚀',
      title: 'Delivery Requirements',
      content: [
        {
          subtitle: 'Delivery Standards',
          items: [
            'Deliver products within the timeframe specified in your listing',
            'Automatic delivery items must be properly configured',
            'Manual delivery must begin within 4 hours of purchase confirmation',
            'Communicate with buyers if any delays occur',
            'Provide all necessary information for the buyer to access their purchase'
          ]
        },
        {
          subtitle: 'Delivery Methods',
          items: [
            'Automatic Delivery: Pre-configured codes/credentials delivered instantly',
            'Manual Delivery: Seller delivers directly via our secure messaging system',
            'Ensure delivery information is complete and accurate',
            'Never deliver outside of the Nashflare platform',
            'Use our secure messaging system for all delivery communications'
          ]
        },
        {
          subtitle: 'Failed Deliveries',
          items: [
            'If you cannot fulfill an order, cancel it immediately',
            'Repeated failed deliveries will result in account penalties',
            'Refund orders promptly if you cannot deliver',
            'Do not accept orders you cannot fulfill'
          ]
        }
      ]
    },
    {
      id: 'buyer-protection',
      icon: '🛡️',
      title: 'Buyer Protection Period',
      content: [
        {
          subtitle: 'How It Works',
          items: [
            'All purchases have a 48-hour buyer protection period',
            'Buyers can request refunds during this period if the product is not as described',
            'Funds are held in escrow until the protection period ends',
            'After 48 hours, funds are released to your available balance',
            'Disputes may extend the holding period'
          ]
        },
        {
          subtitle: 'Seller Responsibilities',
          items: [
            'Respond to buyer concerns promptly during the protection period',
            'Provide evidence if a dispute arises',
            'Cooperate with Nashflare support during investigations',
            'Accept legitimate refund requests gracefully'
          ]
        }
      ]
    },
    {
      id: 'disputes',
      icon: '⚖️',
      title: 'Dispute Resolution',
      content: [
        {
          subtitle: 'Dispute Process',
          items: [
            'Buyers can open disputes within the 48-hour protection period',
            'Both parties must provide evidence to support their case',
            'Nashflare admin will review and make a final decision',
            'Decisions are based on evidence, policies, and communication records',
            'All dispute decisions are final'
          ]
        },
        {
          subtitle: 'Common Dispute Outcomes',
          items: [
            'Full refund to buyer if product was not delivered or significantly misrepresented',
            'Partial refund if product was partially delivered or had minor issues',
            'No refund if buyer received exactly what was described',
            'Account penalties for sellers who lose multiple disputes'
          ]
        },
        {
          subtitle: 'Avoiding Disputes',
          items: [
            'Be accurate and detailed in your listings',
            'Communicate clearly with buyers',
            'Deliver exactly what is promised',
            'Respond to issues before they become disputes',
            'Keep records of all deliveries and communications'
          ]
        }
      ]
    },
    {
      id: 'conduct',
      icon: '🤝',
      title: 'Seller Conduct',
      content: [
        {
          subtitle: 'Communication Standards',
          items: [
            'Be professional and respectful in all communications',
            'Do not use offensive, abusive, or discriminatory language',
            'Respond to messages within 24 hours',
            'Do not spam buyers or other sellers',
            'Do not share personal contact information to conduct transactions outside Nashflare'
          ]
        },
        {
          subtitle: 'Prohibited Behavior',
          items: [
            'Price manipulation or artificial market inflation',
            'Fake reviews or rating manipulation',
            'Harassment of buyers or other sellers',
            'Attempting to bypass platform fees',
            'Creating fake disputes or false claims',
            'Selling the same item multiple times',
            'Using bots or automated tools without authorization'
          ]
        }
      ]
    },
    {
      id: 'penalties',
      icon: '⚠️',
      title: 'Violations & Penalties',
      content: [
        {
          subtitle: 'Warning System',
          items: [
            'Minor violations may result in warnings',
            'Warnings are logged and reviewed periodically',
            'Multiple warnings escalate to more serious penalties',
            'Warnings can affect your seller tier status'
          ]
        },
        {
          subtitle: 'Account Restrictions',
          items: [
            'Temporary listing suspension for repeated violations',
            'Withdrawal holds for suspicious activity',
            'Reduced visibility in search results',
            'Removal from seller tier benefits'
          ]
        },
        {
          subtitle: 'Account Termination',
          items: [
            'Permanent ban for serious violations (fraud, scams, etc.)',
            'Funds may be forfeited in cases of confirmed fraud',
            'No appeal for violations involving criminal activity',
            'Terminated accounts cannot create new seller accounts'
          ]
        }
      ]
    },
    {
      id: 'security',
      icon: '🔐',
      title: 'Security & Privacy',
      content: [
        {
          subtitle: 'Account Security',
          items: [
            'Enable two-factor authentication when available',
            'Use a strong, unique password',
            'Do not share your account credentials',
            'Report any suspicious activity immediately',
            'Log out from shared devices'
          ]
        },
        {
          subtitle: 'Data Handling',
          items: [
            'Buyer information is confidential and must not be shared',
            'Do not store buyer information outside of Nashflare',
            'Respect buyer privacy at all times',
            'Report any data breaches immediately'
          ]
        }
      ]
    },
    {
      id: 'changes',
      icon: '📝',
      title: 'Policy Updates',
      content: [
        {
          subtitle: 'Changes to Rules',
          items: [
            'Nashflare reserves the right to modify these rules at any time',
            'Major changes will be announced via email and platform notifications',
            'Continued use of the platform constitutes acceptance of updated rules',
            'Historical violations are subject to the rules in effect at the time',
            'Check this page regularly for updates'
          ]
        }
      ]
    }
  ]

  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Stars */}
        <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-[30%] left-[75%] w-1 h-1 bg-blue-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-[50%] left-[8%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[70%] left-[60%] w-1 h-1 bg-cyan-200 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[15%] left-[45%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Planets */}
        <div className="hidden sm:block absolute top-[15%] right-[10%]">
          <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 h-4 sm:h-6 border-2 sm:border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Content */}
      <div className="pt-16 lg:pt-20"></div>
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 text-center">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">📜</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4">
              Seller Rules & Guidelines
            </h1>
            <p className="text-gray-300 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto">
              Read and understand these rules before becoming a vendor on Nashflare. 
              All sellers must comply with these guidelines to maintain their selling privileges.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl mb-1">5%</div>
              <p className="text-gray-400 text-xs sm:text-sm">Commission</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl mb-1">48h</div>
              <p className="text-gray-400 text-xs sm:text-sm">Buyer Protection</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl mb-1">$10</div>
              <p className="text-gray-400 text-xs sm:text-sm">Min Withdrawal</p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl mb-1">18+</div>
              <p className="text-gray-400 text-xs sm:text-sm">Age Required</p>
            </div>
          </div>

          {/* Withdrawal Methods Quick Reference */}
          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">💸</span>
              Withdrawal Methods at a Glance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">₿</div>
                <p className="text-white font-medium text-sm">Bitcoin</p>
                <p className="text-gray-400 text-xs">6% + $20</p>
                <p className="text-gray-500 text-[10px]">Min $100</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">💳</div>
                <p className="text-white font-medium text-sm">Skrill</p>
                <p className="text-gray-400 text-xs">5% + $1</p>
                <p className="text-gray-500 text-[10px]">Min $10</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🅿️</div>
                <p className="text-white font-medium text-sm">Payoneer</p>
                <p className="text-gray-400 text-xs">2% + $1.50</p>
                <p className="text-gray-500 text-[10px]">Min $20</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center relative">
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                  BEST
                </div>
                <div className="text-2xl mb-1">🌐</div>
                <p className="text-white font-medium text-sm">Wise</p>
                <p className="text-gray-400 text-xs">1% + $0.50</p>
                <p className="text-gray-500 text-[10px]">Min $10</p>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5 mb-6 sm:mb-8">
            <div className="flex items-start gap-3">
              <div className="text-2xl sm:text-3xl flex-shrink-0">⚠️</div>
              <div>
                <h3 className="text-amber-400 font-semibold mb-2 text-sm sm:text-base">Important Notice</h3>
                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                  By applying to become a seller on Nashflare, you agree to abide by all rules and guidelines outlined on this page. 
                  Violations may result in warnings, account restrictions, or permanent termination. 
                  Please read each section carefully before submitting your vendor application.
                </p>
              </div>
            </div>
          </div>

          {/* Rules Sections */}
          <div className="space-y-3 sm:space-y-4">
            {sections.map((section) => (
              <div 
                key={section.id}
                className="bg-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl">{section.icon}</span>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{section.title}</h2>
                  </div>
                  <svg 
                    className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {activeSection === section.id && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-slate-700/50">
                    <div className="pt-4 space-y-4 sm:space-y-5">
                      {section.content.map((subsection, idx) => (
                        <div key={idx}>
                          <h3 className="text-purple-400 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                            {subsection.subtitle}
                          </h3>
                          <ul className="space-y-2">
                            {subsection.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex items-start gap-2 text-gray-300 text-xs sm:text-sm">
                                <span className="text-purple-400 mt-1 flex-shrink-0">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Last Updated */}
          <div className="text-center text-gray-500 text-xs sm:text-sm mt-6 sm:mt-8">
            Last updated: December 2024
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mt-6 sm:mt-8 text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Ready to Start Selling?</h3>
            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 max-w-lg mx-auto">
              If you've read and agree to all the rules above, you're ready to apply to become a vendor on Nashflare.
            </p>
            <Link
              href="/become-vendor"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
            >
              <span>🚀</span>
              Apply to Become a Vendor
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}