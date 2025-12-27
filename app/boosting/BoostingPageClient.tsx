'use client'

// ============================================================================
// BOOSTING PAGE CLIENT COMPONENT
// ============================================================================
// Location: app/boosting/BoostingPageClient.tsx
// ============================================================================

import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// ============================================================================
// FAQ DATA
// ============================================================================
const faqs = [
  {
    question: 'Is game boosting safe?',
    answer: 'Yes, our boosting services prioritize account safety. We use VPN protection matching your region, play at natural hours, and our verified boosters follow strict safety protocols. We also offer offline mode options and never share your credentials.',
  },
  {
    question: 'How long does a rank boost take?',
    answer: 'Completion time varies based on the rank difference and game. Most boosts are completed within 1-7 days. You\'ll receive real-time progress updates and can track your boost live through your dashboard.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept PayPal and cryptocurrency payments. All transactions are secured with escrow protection - your payment is held safely until the boost is completed to your satisfaction.',
  },
  {
    question: 'What if I\'m not satisfied with the service?',
    answer: 'We offer a 100% money-back guarantee if we cannot complete your order as promised. Our dispute resolution team is available 24/7 to handle any issues that may arise.',
  },
  {
    question: 'Can I play on my account during the boost?',
    answer: 'For most boosts, we recommend not playing ranked games during the boosting period to avoid conflicts. However, you can pause the boost anytime through your dashboard if you need to play.',
  },
  {
    question: 'How do I track my boost progress?',
    answer: 'Once your boost starts, you\'ll have access to a live dashboard showing current rank, games played, win rate, and screenshot updates from your booster. You\'ll also receive email notifications for major milestones.',
  },
  {
    question: 'Are your boosters verified?',
    answer: 'Yes, all boosters must pass our verification process including rank verification, identity confirmation, and a trial period. We only accept boosters who are in the top ranks of their respective games.',
  },
  {
    question: 'What happens to my account credentials?',
    answer: 'Your credentials are encrypted and only accessible to your assigned booster. After completion, we recommend changing your password. We never store or share your login information.',
  },
]

// ============================================================================
// CLIENT COMPONENT
// ============================================================================
export default function BoostingPageClient() {
  const games = [
    {
  name: 'Valorant',
  icon: '/game-icons/valorant.svg',
      description: 'Iron to Radiant. Solo & Duo queue available.',
      gradient: 'from-red-500 to-purple-600',
      borderColor: 'border-red-500/30',
      bgColor: 'bg-red-500/10',
      status: 'live',
      boosters: '50+',
      href: '/boosting/valorant',
    },
    {
      name: 'League of Legends',
      icon: '⚔️',
      description: 'Iron to Challenger. All queues and roles.',
      gradient: 'from-blue-500 to-cyan-500',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-500/5',
      status: 'coming',
      releaseDate: 'Q1 2025',
      href: '#',
    },
    {
      name: 'Counter-Strike 2',
      icon: '🔫',
      description: 'Silver to Global Elite. Premier & Competitive.',
      gradient: 'from-orange-500 to-yellow-500',
      borderColor: 'border-orange-500/20',
      bgColor: 'bg-orange-500/5',
      status: 'coming',
      releaseDate: 'Q1 2025',
      href: '#',
    },
    {
      name: 'Overwatch 2',
      icon: '🦸',
      description: 'Bronze to Grand Master. All roles supported.',
      gradient: 'from-orange-400 to-pink-500',
      borderColor: 'border-orange-400/20',
      bgColor: 'bg-orange-400/5',
      status: 'coming',
      releaseDate: 'Q2 2025',
      href: '#',
    },
    {
      name: 'Apex Legends',
      icon: '🏆',
      description: 'Bronze to Predator. Battle Royale & Ranked.',
      gradient: 'from-red-600 to-red-400',
      borderColor: 'border-red-500/20',
      bgColor: 'bg-red-500/5',
      status: 'coming',
      releaseDate: 'Q2 2025',
      href: '#',
    },
    {
      name: 'Rocket League',
      icon: '🚗',
      description: 'Bronze to Supersonic Legend.',
      gradient: 'from-blue-400 to-purple-500',
      borderColor: 'border-blue-400/20',
      bgColor: 'bg-blue-400/5',
      status: 'coming',
      releaseDate: 'Q2 2025',
      href: '#',
    },
  ]

  const features = [
    {
      icon: '🏆',
      title: 'Verified Boosters',
      description: 'All boosters are verified high-rank players with proven track records and reviews.',
    },
    {
      icon: '🔒',
      title: 'Secure Payments',
      description: 'Pay safely via PayPal or Crypto. Money held in escrow until order completion.',
    },
    {
      icon: '📊',
      title: 'Live Progress Tracking',
      description: 'Watch your rank climb with real-time updates, screenshots, and progress reports.',
    },
    {
      icon: '💰',
      title: 'Competitive Pricing',
      description: 'Our unique bid system means boosters compete for your order, ensuring best prices.',
    },
    {
      icon: '🛡️',
      title: 'Buyer Protection',
      description: '100% money-back guarantee if we can\'t complete your order as promised.',
    },
    {
      icon: '⚡',
      title: 'Fast Completion',
      description: 'Priority options available for urgent orders. Most boosts completed within days.',
    },
  ]

  const stats = [
    { value: '1,000+', label: 'Boosts Completed' },
    { value: '4.9/5', label: 'Average Rating' },
    { value: '50+', label: 'Active Boosters' },
    { value: '24/7', label: 'Support' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Optimized Background - GPU accelerated */}
      <div 
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ 
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Animated Gradient - CSS only, very lightweight */}
        <div 
          className="absolute inset-0 animate-pulse-slow"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 10% 10%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 60% 50% at 90% 20%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 80% 80%, rgba(139, 92, 246, 0.18) 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 20% 90%, rgba(219, 39, 119, 0.12) 0%, transparent 50%)
            `,
          }}
        />
        
        {/* Brighter Stars Layer 1 - Larger stars */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 10% 5%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 25% 15%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 50% 8%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 75% 20%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 90% 12%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 15% 35%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 40% 30%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 65% 40%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 85% 35%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 5% 55%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 30% 60%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 55% 50%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 70% 65%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 95% 55%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 20% 80%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 45% 75%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 60% 85%, rgba(255,255,255,0.7), transparent),
              radial-gradient(2px 2px at 80% 78%, rgba(255,255,255,0.8), transparent),
              radial-gradient(2px 2px at 35% 95%, rgba(255,255,255,0.9), transparent),
              radial-gradient(2px 2px at 92% 90%, rgba(255,255,255,0.8), transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Stars Layer 2 - Smaller dimmer stars for depth */}
        <div 
          className="absolute inset-0 opacity-60"
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
              radial-gradient(1px 1px at 42% 65%, white, transparent),
              radial-gradient(1px 1px at 58% 78%, white, transparent),
              radial-gradient(1px 1px at 72% 70%, white, transparent),
              radial-gradient(1px 1px at 85% 82%, white, transparent),
              radial-gradient(1px 1px at 95% 68%, white, transparent),
              radial-gradient(1px 1px at 3% 88%, white, transparent),
              radial-gradient(1px 1px at 25% 92%, white, transparent),
              radial-gradient(1px 1px at 55% 95%, white, transparent),
              radial-gradient(1px 1px at 75% 88%, white, transparent),
              radial-gradient(1px 1px at 98% 95%, white, transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />

        {/* Accent color stars - purple/pink tinted */}
        <div 
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 15% 25%, rgba(192, 132, 252, 0.9), transparent),
              radial-gradient(2px 2px at 45% 15%, rgba(244, 114, 182, 0.8), transparent),
              radial-gradient(2px 2px at 72% 45%, rgba(192, 132, 252, 0.9), transparent),
              radial-gradient(2px 2px at 28% 70%, rgba(244, 114, 182, 0.8), transparent),
              radial-gradient(2px 2px at 88% 72%, rgba(192, 132, 252, 0.9), transparent),
              radial-gradient(2px 2px at 8% 85%, rgba(244, 114, 182, 0.8), transparent)
            `,
            backgroundSize: '100% 100%',
          }}
        />
      </div>

      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section className="pt-24 sm:pt-32 pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30  mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-purple-300 font-medium text-sm">Boosting Services Now Live</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Professional
                <span className="block mt-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Game Boosting
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                Rank up faster with verified professional boosters. Secure payments, live tracking, and guaranteed results.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <Link
                  href="/boosting/valorant"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg shadow-lg shadow-purple-500/25 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                >
                  <span>🎯</span>
                  Start Boosting
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  Learn How It Works
                </a>
              </div>

              {/* Trust Badges in Hero */}
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12">
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10">
                  <span className="text-lg sm:text-xl">💳</span>
                  <span className="text-xs sm:text-sm text-gray-300">PayPal</span>
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10">
                  <span className="text-lg sm:text-xl">₿</span>
                  <span className="text-xs sm:text-sm text-gray-300">Crypto</span>
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10">
                  <span className="text-lg sm:text-xl">🔒</span>
                  <span className="text-xs sm:text-sm text-gray-300">SSL Secured</span>
                </div>
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10">
                  <span className="text-lg sm:text-xl">🛡️</span>
                  <span className="text-xs sm:text-sm text-gray-300">Escrow</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="p-4 rounded-xl bg-slate-900/60  border border-white/10 hover:border-purple-500/30 transition-all duration-300"
                  >
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Choose Your Game
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Select your game and start climbing the ranks today
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <Link
                  key={game.name}
                  href={game.href}
                  className={`
                    group relative p-6 rounded-2xl border  transition-all duration-300 overflow-hidden
                    ${game.status === 'live' 
                      ? `${game.bgColor} ${game.borderColor} hover:border-opacity-60 hover:scale-[1.02]` 
                      : 'bg-slate-800/40 border-white/10 opacity-70 cursor-not-allowed'
                    }
                  `}
                  onClick={(e) => game.status !== 'live' && e.preventDefault()}
                >
                  {/* Glow Effect */}
                  {game.status === 'live' && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  )}

                  {/* Coming Soon Badge */}
                  {game.status === 'coming' && (
                    <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                      <span className="text-xs font-medium text-yellow-400">Coming Soon</span>
                    </div>
                  )}

                  {/* Live Badge */}
                  {game.status === 'live' && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-medium text-green-400">Live</span>
                    </div>
                  )}

                  <div className="relative">
                    {/* Icon */}
                    <div className={`
                      w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300
                      ${game.status === 'live' ? 'group-hover:scale-110' : ''}
                      ${game.status === 'live' ? `bg-gradient-to-br ${game.gradient} bg-opacity-20` : 'bg-slate-700/50'}
                    `}>
                      {game.icon.startsWith('/') ? (
  <img 
    src={game.icon} 
    alt={game.name}
    className={`w-10 h-10 object-contain ${game.status !== 'live' ? 'grayscale' : ''}`}
  />
) : (
  <span className={`text-4xl ${game.status !== 'live' ? 'grayscale' : ''}`}>{game.icon}</span>
)}
                    </div>

                    {/* Name */}
                    <h3 className={`text-2xl font-bold mb-2 ${game.status === 'live' ? 'text-white' : 'text-gray-400'}`}>
                      {game.name}
                    </h3>

                    {/* Description */}
                    <p className={`text-sm mb-4 ${game.status === 'live' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {game.description}
                    </p>

                    {/* Stats/Info */}
                    {game.status === 'live' ? (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">{game.boosters} Active Boosters</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm">{game.releaseDate}</span>
                    )}
                  </div>

                  {/* Arrow */}
                  {game.status === 'live' && (
                    <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-4 bg-black/20">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                How It Works
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Our unique bid system lets boosters compete for your order, ensuring the best price and service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: 1,
                  icon: '📝',
                  title: 'Create Request',
                  description: 'Select your current and target rank, choose options, and submit your boost request.',
                },
                {
                  step: 2,
                  icon: '🔔',
                  title: 'Receive Offers',
                  description: 'Verified boosters review your request and send competitive offers within minutes.',
                },
                {
                  step: 3,
                  icon: '✅',
                  title: 'Accept & Pay',
                  description: 'Compare offers, check ratings, accept the best one, and pay securely.',
                },
                {
                  step: 4,
                  icon: '🚀',
                  title: 'Track Progress',
                  description: 'Follow your boost in real-time with screenshots and updates until completion.',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative p-6 rounded-2xl bg-slate-900/60  border border-white/10 hover:border-purple-500/30 transition-all duration-300 group"
                >
                  {/* Step Number */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Why Choose Nashflare?
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                The most trusted game boosting platform with unmatched security and service
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-slate-900/60  border border-white/10 hover:border-purple-500/30 transition-all duration-300 group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 px-4 bg-black/20">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-400 max-w-xl mx-auto">
                Everything you need to know about our boosting services
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group p-6 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
                >
                  <summary className="flex items-center justify-between text-white font-semibold text-lg list-none cursor-pointer">
                    <span>{faq.question}</span>
                    <span className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center group-open:rotate-180 transition-transform duration-300">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-4 text-gray-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-white/10">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Trusted & Secure</h2>
                <p className="text-gray-400 text-sm">Your safety is our top priority</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <span className="text-3xl">💳</span>
                  </div>
                  <p className="text-white font-semibold text-sm">PayPal</p>
                  <p className="text-gray-500 text-xs">Buyer Protection</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <span className="text-3xl">₿</span>
                  </div>
                  <p className="text-white font-semibold text-sm">Crypto</p>
                  <p className="text-gray-500 text-xs">BTC, ETH & More</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <p className="text-white font-semibold text-sm">SSL Encrypted</p>
                  <p className="text-gray-500 text-xs">256-bit Security</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <span className="text-3xl">🛡️</span>
                  </div>
                  <p className="text-white font-semibold text-sm">Escrow</p>
                  <p className="text-gray-500 text-xs">Money-Back Guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Become a Booster CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20  text-center relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-3xl"></div>

              <div className="relative">
                <div className="text-5xl mb-6">💎</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Want to Become a Booster?
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  If you're a high-rank player, you can earn money by helping others reach their goals. 
                  Join our team of verified boosters and start earning today.
                </p>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
                >
                  Apply Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  )
}