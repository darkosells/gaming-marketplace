'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { gameNameToSlug } from '@/lib/games-config'

// Category data matching the navigation mega menu
const categoryData = {
  account: {
    icon: '🎮',
    label: 'Accounts',
    description: 'Level up instantly',
    gradient: 'from-purple-500 to-violet-600',
    hoverGlow: 'purple',
    games: ['GTA 5', 'Fortnite', 'Roblox', 'Valorant', 'League of Legends', 'Clash Royale', 'Clash of Clans', 'Steam']
  },
  items: {
    icon: '🎒',
    label: 'Items',
    description: 'Rare in-game items',
    gradient: 'from-pink-500 to-rose-600',
    hoverGlow: 'pink',
    games: ['Steal a Brainrot', 'Grow a Garden', 'Adopt me', 'Blox Fruits', 'Plants vs Brainrots']
  },
  currency: {
    icon: '💰',
    label: 'Currency',
    description: 'In-game money & credits',
    gradient: 'from-amber-500 to-orange-600',
    hoverGlow: 'orange',
    games: ['Roblox', 'Fortnite']
  },
  key: {
    icon: '🔑',
    label: 'Game Keys',
    description: 'Activation codes',
    gradient: 'from-blue-500 to-cyan-600',
    hoverGlow: 'blue',
    games: ['Steam', 'Playstation', 'Xbox']
  }
}

// Popular games for quick access
const popularGames = [
  { name: 'Fortnite', icon: '🎮' },
  { name: 'GTA 5', icon: '🚗' },
  { name: 'Roblox', icon: '🎲' },
  { name: 'Valorant', icon: '🎯' },
  { name: 'League of Legends', icon: '⚔️' },
  { name: 'Clash of Clans', icon: '🏰' },
]

// Boosting games data
const boostingGames = [
  {
    name: 'Valorant',
    slug: 'valorant',
    icon: '/game-icons/valorant.svg',
    description: 'Iron to Radiant',
    gradient: 'from-red-500 to-purple-600',
    status: 'live',
  },
  {
    name: 'League of Legends',
    slug: 'league-of-legends',
    icon: '⚔️',
    description: 'Iron to Challenger',
    gradient: 'from-blue-500 to-cyan-500',
    status: 'coming',
    releaseDate: 'Q1 2025',
  },
  {
    name: 'CS2',
    slug: 'cs2',
    icon: '🔫',
    description: 'Silver to Global',
    gradient: 'from-orange-500 to-yellow-500',
    status: 'coming',
    releaseDate: 'Q1 2025',
  },
]

// FAQ Data - Important for SEO
const faqData = [
  {
    question: "Is Nashflare safe to buy gaming accounts from?",
    answer: "Yes, Nashflare is a secure marketplace with buyer protection. All payments are held in escrow until you confirm delivery, and we have a 48-hour protection period for all purchases. Our verified seller system ensures you're buying from trusted vendors."
  },
  {
    question: "How does buyer protection work?",
    answer: "When you make a purchase, your payment is held securely until you confirm you've received your item. You have 48 hours to verify your purchase. If there's an issue, our support team will help resolve disputes and can issue refunds if necessary."
  },
  {
    question: "How long does delivery take?",
    answer: "Most digital items are delivered instantly or within a few hours. For gaming accounts, delivery typically takes 5-30 minutes as sellers need to provide login credentials. Some complex items may take up to 24 hours."
  },
  {
    question: "Can I sell my gaming accounts on Nashflare?",
    answer: "Yes! You can apply to become a verified vendor on Nashflare. Once approved, you can list gaming accounts, in-game items, currency, and game keys. We charge a small commission on successful sales."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept various payment methods including cryptocurrency (Bitcoin) and Skrill. More payment options are being added regularly. All transactions are processed securely with encryption."
  },
  {
    question: "What happens if I don't receive my item?",
    answer: "If you don't receive your item within the stated delivery time, contact our support team. With our buyer protection, you can open a dispute and receive a full refund if the seller fails to deliver."
  }
]

// Helper function to convert game name to URL slug
const gameToSlug = (gameName: string): string => {
  return gameName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// JSON-LD Structured Data for SEO
// NOTE: Organization and WebSite schemas are in layout.tsx (global)
// Only homepage-specific schemas are defined here

// FAQ Schema - Unique to homepage (helps with rich snippets)
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqData.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
}

// Marketplace/Store structured data - Unique to homepage
const marketplaceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  "name": "Nashflare Gaming Marketplace",
  "image": "https://nashflare.com/og-image.png",
  "url": "https://nashflare.com",
  "description": "Buy and sell gaming accounts, V-Bucks, Robux, game keys and more",
  "priceRange": "$",
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "00:00",
    "closes": "23:59"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Gaming Products",
    "itemListElement": [
      {
        "@type": "OfferCatalog",
        "name": "Gaming Accounts",
        "itemListElement": ["GTA 5 Accounts", "Fortnite Accounts", "Valorant Accounts", "Roblox Accounts"]
      },
      {
        "@type": "OfferCatalog",
        "name": "In-Game Currency",
        "itemListElement": ["V-Bucks", "Robux", "Game Credits"]
      },
      {
        "@type": "OfferCatalog",
        "name": "Game Keys",
        "itemListElement": ["Steam Keys", "PlayStation Keys", "Xbox Keys"]
      }
    ]
  }
}

export default function HomePageClient() {
  const router = useRouter()
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('search') as string
    if (query) {
      router.push(`/browse?search=${encodeURIComponent(query)}`)
    } else {
      router.push('/browse')
    }
  }

  // Toggle category expansion on mobile
  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  // Toggle FAQ expansion
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* JSON-LD Structured Data for SEO */}
      {/* NOTE: Organization and WebSite schemas removed - they are in layout.tsx */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketplaceJsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Optimized Cosmic Space Background - iOS Safari Compatible */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        
        {/* Gradient Mesh - Static, no animation */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Simplified Nebula Clouds - Reduced blur for iOS performance */}
        <div 
          className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '8s' }}
        ></div>
        <div 
          className={`absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        ></div>
        <div 
          className={`absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-3xl ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        ></div>
        
        {/* Grid Pattern - Static */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] opacity-50"></div>
        
        {/* Reduced Starfield */}
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-[5%] left-[12%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-[8%] left-[35%] w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[12%] left-[58%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s' }}></div>
            <div className="absolute top-[6%] left-[78%] w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute top-[25%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[28%] left-[45%] w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-[32%] left-[72%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4.5s' }}></div>
            <div className="absolute top-[45%] left-[8%] w-0.5 h-0.5 bg-white/70 rounded-full animate-pulse" style={{ animationDuration: '3.5s' }}></div>
            <div className="absolute top-[48%] left-[52%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[55%] left-[85%] w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
          </>
        )}
        
        {/* Simplified Planets - Hidden on mobile for performance */}
        <div className="absolute top-[12%] right-[8%] hidden md:block">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-[30%] left-0 right-0 h-1.5 bg-orange-300/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-2 border-orange-300/40 rounded-full -rotate-12"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[5%] hidden md:block">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            <div className="absolute top-[35%] left-0 right-0 h-1 bg-purple-300/40 rounded-full"></div>
          </div>
        </div>
        
        <div className="absolute top-[55%] right-[3%] hidden lg:block">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/40 rounded-full"></div>
          </div>
        </div>
        
        {/* Shooting Star */}
        {!prefersReducedMotion && (
          <div className="absolute top-[20%] left-[30%] hidden md:block">
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-[shooting_12s_ease-in-out_infinite] opacity-50" style={{ transform: 'rotate(-45deg)' }}></div>
          </div>
        )}
        
        {/* Floating Particles */}
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-32 left-[15%] w-2 h-2 bg-purple-400/50 rounded-full animate-[float_8s_ease-in-out_infinite] hidden md:block"></div>
            <div className="absolute top-60 right-[20%] w-2 h-2 bg-blue-400/40 rounded-full animate-[float_10s_ease-in-out_infinite] hidden md:block" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-40 left-[40%] w-1.5 h-1.5 bg-pink-400/50 rounded-full animate-[float_9s_ease-in-out_infinite] hidden md:block" style={{ animationDelay: '4s' }}></div>
          </>
        )}
        
        {/* Constellation Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none hidden md:block">
          <line x1="15%" y1="12%" x2="25%" y2="8%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="25%" y1="8%" x2="35%" y2="15%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="75%" y1="25%" x2="85%" y2="30%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="85%" y1="30%" x2="80%" y2="40%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
        </svg>
        
        {/* Vignette Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section - Category Focused */}
        <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-12">
          <div className="container mx-auto px-4">
            <header className="relative z-10 text-center max-w-4xl mx-auto mb-8 sm:mb-12">
              {/* SEO-Optimized H1 - iOS Safari Fix: Solid color instead of gradient text */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                Buy & Sell
                <span className="block sm:inline text-purple-400"> Gaming Accounts & Items</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
                Accounts, items, currency & game keys — all in one secure marketplace
              </p>
            </header>

            {/* Category Cards Grid - SEO: Using Link components for crawlability */}
            <nav aria-label="Product categories" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto mb-8 sm:mb-12">
              {Object.entries(categoryData).map(([key, category]) => (
                <div key={key} className="group">
                  {/* Desktop Card - SEO: Proper Link wrapper for crawlability */}
                  <article className="hidden sm:block relative overflow-hidden rounded-2xl bg-slate-900/80 border border-white/10 p-4 lg:p-6 hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10">
                    {/* Hover glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative">
                      {/* Icon and Title - Links to category page */}
                      <Link 
                        href={`/browse?category=${key}`}
                        className="flex items-center space-x-3 mb-3 group/header"
                      >
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${category.gradient} rounded-xl flex items-center justify-center text-2xl lg:text-3xl shadow-lg group-hover/header:scale-110 transition-transform duration-300`}>
                          {category.icon}
                        </div>
                        <div className="text-left">
                          <h2 className="text-lg lg:text-xl font-bold text-white group-hover/header:text-purple-400 transition-colors">{category.label}</h2>
                          <p className="text-xs lg:text-sm text-gray-400">{category.description}</p>
                        </div>
                      </Link>
                      
                      {/* Games preview - SEO: Using Link components */}
                      <ul className="space-y-1.5">
                        {category.games.slice(0, 4).map((game) => (
                          <li key={game}>
                            <Link
                              href={`/games/${gameToSlug(game)}?category=${key}`}
                              className="w-full flex items-center space-x-2 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg bg-white/5 hover:bg-white/10 text-left transition-colors group/game"
                            >
                              <span className="text-gray-400 group-hover/game:text-white text-xs lg:text-sm truncate">{game}</span>
                              <svg className="w-3 h-3 lg:w-4 lg:h-4 text-gray-500 group-hover/game:text-white ml-auto flex-shrink-0 opacity-0 group-hover/game:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </li>
                        ))}
                        {category.games.length > 4 && (
                          <li className="text-xs text-gray-500 text-center pt-1">
                            +{category.games.length - 4} more
                          </li>
                        )}
                      </ul>
                      
                      {/* View all link - SEO: Proper Link component */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <Link 
                          href={`/browse?category=${key}`}
                          className="flex items-center justify-center space-x-1 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                        >
                          <span>View All {category.label}</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>

                  {/* Mobile Card - Expandable with crawlable links */}
                  <div className="sm:hidden">
                    <button
                      onClick={() => toggleCategory(key)}
                      aria-expanded={expandedCategory === key}
                      className={`w-full relative overflow-hidden rounded-xl bg-slate-900/80 border ${expandedCategory === key ? 'border-white/20' : 'border-white/10'} p-4 text-left transition-all duration-300`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${expandedCategory === key ? 'opacity-10' : 'opacity-0'} transition-opacity duration-300`}></div>
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${category.gradient} rounded-lg flex items-center justify-center text-xl shadow-lg`}>
                            {category.icon}
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-white">{category.label}</h2>
                            <p className="text-xs text-gray-400">{category.games.length} games</p>
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedCategory === key ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {/* Mobile Expanded Games List - SEO: Using Link components */}
                    {expandedCategory === key && (
                      <div className="mt-2 bg-slate-900/60 border border-white/10 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                        {category.games.map((game) => (
                          <Link
                            key={game}
                            href={`/games/${gameToSlug(game)}?category=${key}`}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors min-h-[44px]"
                          >
                            <span className="text-gray-300 text-sm">{game}</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ))}
                        <Link
                          href={`/browse?category=${key}`}
                          className={`w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-lg bg-gradient-to-r ${category.gradient} text-white font-medium text-sm min-h-[44px]`}
                        >
                          <span>View All {category.label}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </nav>

            {/* Popular Games Quick Access - Already using Links (SEO friendly) */}
            <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <span className="text-lg sm:text-xl">🔥</span>
                <h2 className="text-sm sm:text-base font-semibold text-gray-400">Popular Games</h2>
              </div>
              <nav aria-label="Popular games" className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {popularGames.map((game) => (
                  <Link
                    key={game.name}
                    href={`/games/${gameNameToSlug(game.name)}`}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/70 hover:bg-slate-800/70 border border-white/10 hover:border-purple-500/30 rounded-full transition-all duration-200 hover:-translate-y-0.5 group min-h-[44px]"
                  >
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform">{game.icon}</span>
                    <span className="text-xs sm:text-sm text-gray-300 group-hover:text-white font-medium">{game.name}</span>
                  </Link>
                ))}
                <Link
                  href="/browse"
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all duration-200 min-h-[44px]"
                >
                  <span className="text-xs sm:text-sm text-gray-400">View All</span>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </nav>
            </div>

            {/* Search Bar - Secondary, below categories */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto" role="search">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/50 to-pink-600/50 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative flex items-center">
                  <label htmlFor="homepage-search" className="sr-only">Search for games, accounts, items</label>
                  <div className="absolute left-4 text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="homepage-search"
                    name="search"
                    placeholder="Search for anything..."
                    className="w-full pl-12 pr-24 sm:pr-28 py-3 sm:py-3.5 rounded-full bg-slate-900/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                  <button 
                    type="submit"
                    className="absolute right-1.5 sm:right-2 bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105 min-h-[40px]"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* SEO Content Section - Crawlable text with internal links */}
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
                The Trusted Gaming Marketplace
              </h2>
              <div className="text-gray-400 text-sm sm:text-base leading-relaxed space-y-4 text-center">
                <p>
                  Nashflare is your secure destination for buying and selling gaming accounts, 
                  in-game currency, rare items, and game keys. Join thousands of gamers who trust 
                  our marketplace for fast, safe transactions with buyer protection on every purchase.
                </p>
                <p>
                  Looking for a stacked{' '}
                  <Link href="/games/fortnite" className="text-purple-400 hover:text-purple-300 font-medium">
                    Fortnite account
                  </Link>{' '}
                  with rare skins? Want to skip the grind with a{' '}
                  <Link href="/games/gta-5" className="text-purple-400 hover:text-purple-300 font-medium">
                    GTA 5 modded account
                  </Link>
                  ? Or perhaps you need a competitive{' '}
                  <Link href="/games/valorant" className="text-purple-400 hover:text-purple-300 font-medium">
                    Valorant account
                  </Link>{' '}
                  or high-level{' '}
                  <Link href="/games/league-of-legends" className="text-purple-400 hover:text-purple-300 font-medium">
                    League of Legends account
                  </Link>
                  ? Browse our verified listings and find exactly what you need.
                </p>
                <p>
                  Sell your gaming accounts and items with instant payouts. Whether it&apos;s{' '}
                  <Link href="/games/roblox" className="text-purple-400 hover:text-purple-300 font-medium">
                    Roblox limiteds
                  </Link>
                  ,{' '}
                  <Link href="/games/clash-of-clans" className="text-purple-400 hover:text-purple-300 font-medium">
                    Clash of Clans
                  </Link>{' '}
                  bases, or{' '}
                  <Link href="/browse?category=key" className="text-purple-400 hover:text-purple-300 font-medium">
                    Steam game keys
                  </Link>
                  , Nashflare connects you with buyers worldwide.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: Boosting Services Section */}
        <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="boosting-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-purple-500/20 border border-red-500/30 mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-medium text-gray-300">New Service</span>
                </div>
                <h2 id="boosting-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Professional Game Boosting
                </h2>
                <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                  Rank up faster with verified professional boosters. Secure payments, live tracking, and guaranteed results.
                </p>
              </div>

              {/* Boosting Games Grid */}
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
                {boostingGames.map((game) => (
                  <Link
                    key={game.slug}
                    href={game.status === 'live' ? `/boosting/${game.slug}` : '/boosting'}
                    className={`
                      group relative p-5 sm:p-6 rounded-2xl border transition-all duration-300 overflow-hidden
                      ${game.status === 'live' 
                        ? 'bg-slate-900/80 border-white/10 hover:border-white/20 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10' 
                        : 'bg-slate-900/50 border-white/5 opacity-60 cursor-default'
                      }
                    `}
                    onClick={(e) => game.status !== 'live' && e.preventDefault()}
                  >
                    {/* Hover glow effect */}
                    {game.status === 'live' && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    )}

                    {/* Status Badge */}
                    {game.status === 'live' ? (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-medium text-green-400">Live</span>
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                        <span className="text-xs font-medium text-yellow-400">Coming Soon</span>
                      </div>
                    )}

                    <div className="relative">
                      {/* Game Icon */}
                      <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300
                        ${game.status === 'live' ? 'group-hover:scale-110' : ''}
                        ${game.status === 'live' ? `bg-gradient-to-br ${game.gradient}` : 'bg-slate-700/50'}
                      `}>
                        {game.icon.startsWith('/') ? (
                          <img 
                            src={game.icon} 
                            alt={game.name}
                            className={`w-8 h-8 object-contain ${game.status !== 'live' ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <span className={`text-3xl ${game.status !== 'live' ? 'grayscale' : ''}`}>{game.icon}</span>
                        )}
                      </div>

                      {/* Game Name */}
                      <h3 className={`text-xl font-bold mb-1 ${game.status === 'live' ? 'text-white' : 'text-gray-400'}`}>
                        {game.name}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm ${game.status === 'live' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {game.description}
                      </p>

                      {/* Release Date for coming soon */}
                      {game.status === 'coming' && game.releaseDate && (
                        <p className="text-xs text-gray-600 mt-2">{game.releaseDate}</p>
                      )}
                    </div>

                    {/* Arrow for live games */}
                    {game.status === 'live' && (
                      <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {/* Features Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: '🛡️', label: 'Account Safe' },
                  { icon: '💰', label: 'Money-Back Guarantee' },
                  { icon: '📊', label: 'Live Tracking' },
                  { icon: '⚡', label: 'Fast Completion' },
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900/60 border border-white/10">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-xs sm:text-sm text-gray-400">{feature.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <Link
                  href="/boosting"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-base sm:text-lg shadow-lg shadow-red-500/25 transition-all duration-300 hover:scale-105"
                >
                  <span>Explore Boosting Services</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Simplified with iOS-compatible styling */}
        <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="how-it-works-heading">
          <div className="container mx-auto px-4">
            <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-3 sm:mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 text-center mb-8 sm:mb-12 text-sm sm:text-base">
              Safe & simple in 3 easy steps
            </p>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              {/* Step 1 - iOS Safari Fix: Removed blur glow, using solid shadow instead */}
              <article className="text-center group">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 transition-shadow">
                    1
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Browse & Choose</h3>
                <p className="text-gray-400 text-sm sm:text-base px-4 sm:px-0">
                  Find verified listings for your favorite games
                </p>
              </article>

              {/* Step 2 - iOS Safari Fix: Removed blur glow, using solid shadow instead */}
              <article className="text-center group">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-pink-500/40 group-hover:shadow-pink-500/60 transition-shadow">
                    2
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Secure Payment</h3>
                <p className="text-gray-400 text-sm sm:text-base px-4 sm:px-0">
                  Pay safely with buyer protection
                </p>
              </article>

              {/* Step 3 - iOS Safari Fix: Removed blur glow, using solid shadow instead */}
              <article className="text-center group">
                <div className="relative inline-block mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-blue-500/40 group-hover:shadow-blue-500/60 transition-shadow">
                    3
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">Get Your Items</h3>
                <p className="text-gray-400 text-sm sm:text-base px-4 sm:px-0">
                  Receive instantly and start playing
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="trust-heading">
          <div className="container mx-auto px-4">
            <h2 id="trust-heading" className="sr-only">Why Trust Nashflare</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
              <article className="group p-4 sm:p-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-slate-900/80 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4 group-hover:border-purple-500/30 transition">🔒</div>
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Secure Payments</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Bank-level encryption</p>
              </article>
              <article className="group p-4 sm:p-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-slate-900/80 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4 group-hover:border-green-500/30 transition">✓</div>
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Verified Sellers</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Every seller is verified</p>
              </article>
              <article className="group p-4 sm:p-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-slate-900/80 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4 group-hover:border-blue-500/30 transition">💬</div>
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">24/7 Support</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Always here to help</p>
              </article>
              <article className="group p-4 sm:p-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-slate-900/80 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 sm:mb-4 group-hover:border-yellow-500/30 transition">⚡</div>
                <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Instant Delivery</h3>
                <p className="text-gray-500 text-xs sm:text-sm">Get your items fast</p>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ Section - Important for SEO */}
        <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8 sm:mb-12">
                <h2 id="faq-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-gray-500 text-sm sm:text-base">
                  Everything you need to know about buying and selling on Nashflare
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {faqData.map((faq, index) => (
                  <article 
                    key={index}
                    className="bg-slate-900/70 border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      aria-expanded={expandedFaq === index}
                      className="w-full flex items-center justify-between p-4 sm:p-6 text-left min-h-[60px] sm:min-h-[72px]"
                    >
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </h3>
                      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center transition-transform duration-200 ${expandedFaq === index ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {expandedFaq === index && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* Additional Help Link */}
              <div className="text-center mt-8">
                <p className="text-gray-500 text-sm sm:text-base">
                  Still have questions?{' '}
                  <Link href="/contact" className="text-purple-400 hover:text-purple-300 font-medium">
                    Contact our support team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl sm:rounded-3xl blur-xl"></div>
              <div className="relative text-center bg-slate-900/70 border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-10 lg:p-12">
                <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Ready to Start Trading?
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-6 sm:mb-8 px-4 sm:px-0">
                  Join thousands of gamers on Nashflare
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 min-h-[48px] flex items-center justify-center"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href="/browse"
                    className="bg-slate-800/70 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border border-white/10 hover:bg-slate-700/70 transition min-h-[48px] flex items-center justify-center"
                  >
                    Browse Listings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes shooting {
          0%, 100% { 
            opacity: 0; 
            transform: translateX(0) rotate(-45deg); 
          }
          20% {
            opacity: 0.6;
          }
          80% { 
            opacity: 0.3; 
            transform: translateX(100px) rotate(-45deg); 
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-15px); 
          }
        }
      `}</style>
    </div>
  )
}