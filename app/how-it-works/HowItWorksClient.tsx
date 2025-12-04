// app/how-it-works/HowItWorksClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

export default function HowItWorksClient() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const buyerSteps = [
    {
      step: 1,
      icon: '🔍',
      title: 'Find What You Need',
      description: 'Browse our extensive catalog of gaming accounts, in-game currency, items, and game keys. Use filters to find exactly what you\'re looking for.',
      details: ['Search by game, category, or platform', 'Compare prices from multiple vendors', 'Check seller ratings and reviews']
    },
    {
      step: 2,
      icon: '🛒',
      title: 'Add to Cart & Checkout',
      description: 'Once you find the perfect listing, add it to your cart and proceed to secure checkout with our protected payment system.',
      details: ['Secure payment processing', 'Service fee transparency (5%)', 'Multiple payment options']
    },
    {
      step: 3,
      icon: '📦',
      title: 'Receive Your Order',
      description: 'After payment confirmation, the seller will deliver your purchase. Digital codes are often delivered instantly!',
      details: ['Instant delivery for digital codes', 'Account details via secure chat', 'Real-time order tracking']
    },
    {
      step: 4,
      icon: '✅',
      title: 'Confirm & Review',
      description: 'Verify your purchase and confirm delivery. Your funds are held in escrow until you confirm receipt.',
      details: ['48-hour buyer protection window', 'Dispute resolution if issues arise', 'Leave feedback for the seller']
    }
  ]

  const sellerSteps = [
    {
      step: 1,
      icon: '📝',
      title: 'Create Your Listing',
      description: 'List your gaming products with detailed descriptions, screenshots, and competitive pricing to attract buyers.',
      details: ['Easy listing creation form', 'Add images and descriptions', 'Set your own prices']
    },
    {
      step: 2,
      icon: '🔔',
      title: 'Receive Orders',
      description: 'When a buyer purchases your listing, you\'ll be notified immediately. Funds are held in escrow for security.',
      details: ['Instant order notifications', 'Secure escrow protection', 'Order management dashboard']
    },
    {
      step: 3,
      icon: '🚀',
      title: 'Deliver the Product',
      description: 'Send the product details to the buyer through our secure messaging system. Mark the order as delivered.',
      details: ['Private chat with buyer', 'Secure delivery confirmation', 'Multiple delivery methods']
    },
    {
      step: 4,
      icon: '💰',
      title: 'Get Paid',
      description: 'Once the buyer confirms receipt, funds are released to your account. Withdraw whenever you want!',
      details: ['Automatic fund release', 'Low platform fees', 'Quick withdrawal processing']
    }
  ]

  const protectionFeatures = [
    {
      icon: '🛡️',
      title: 'Secure Escrow System',
      description: 'Buyer funds are held securely until delivery is confirmed, protecting both parties.'
    },
    {
      icon: '⚖️',
      title: 'Dispute Resolution',
      description: 'Our team mediates any issues between buyers and sellers fairly and quickly.'
    },
    {
      icon: '🔒',
      title: 'Verified Sellers',
      description: 'Sellers earn verification badges through consistent positive transactions.'
    },
    {
      icon: '⭐',
      title: 'Rating System',
      description: 'Transparent ratings help you choose trustworthy trading partners.'
    },
    {
      icon: '📞',
      title: '24/7 Support',
      description: 'Our support team is always available to help with any questions.'
    },
    {
      icon: '🔐',
      title: 'Secure Payments',
      description: 'Industry-standard encryption protects all financial transactions.'
    }
  ]

  const faqItems = [
    { q: 'Is it safe to buy accounts?', a: 'Yes! Our escrow system holds funds until delivery is confirmed. You have 48 hours to verify everything before payment is released.' },
    { q: 'What fees does Nashflare charge?', a: 'We charge a 5% service fee on purchases. This covers payment processing, buyer protection, and platform maintenance.' },
    { q: 'How fast is delivery?', a: 'Digital codes are often instant. Account details are typically delivered within 1-24 hours through our secure messaging system.' },
    { q: 'What if the seller doesn\'t deliver?', a: 'Open a dispute within your 48-hour protection window. Our team will investigate and issue a full refund if the seller fails to deliver.' }
  ]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Optimized Cosmic Space Background */}
      <div className="fixed inset-0 z-0 will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        <div 
          className={`absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[100px] ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '8s' }}
        ></div>
        <div 
          className={`absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[90px] ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        ></div>
        <div 
          className={`absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[80px] ${!prefersReducedMotion ? 'animate-pulse' : ''}`}
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        ></div>
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-[5%] left-[12%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-[8%] left-[35%] w-0.5 h-0.5 bg-white/80 rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[12%] left-[58%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s' }}></div>
            <div className="absolute top-[25%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[32%] left-[72%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4.5s' }}></div>
            <div className="absolute top-[48%] left-[52%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="absolute top-[65%] left-[25%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '5s' }}></div>
            <div className="absolute top-[75%] left-[38%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s' }}></div>
          </>
        )}
        
        {/* Planets - Hidden on mobile */}
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
        
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-32 left-[15%] w-2 h-2 bg-purple-400/50 rounded-full animate-[float_8s_ease-in-out_infinite] hidden md:block"></div>
            <div className="absolute top-60 right-[20%] w-2 h-2 bg-blue-400/40 rounded-full animate-[float_10s_ease-in-out_infinite] hidden md:block" style={{ animationDelay: '2s' }}></div>
          </>
        )}
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-20 sm:pt-24">
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">How It Works</span>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="relative pt-8 sm:pt-12 pb-16 sm:pb-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm">
                🎯 Simple & Secure Trading
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              How <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Nashflare</span> Works
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8 px-4">
              The safest and easiest way to buy and sell gaming accounts, in-game currency, items, and game keys. 
              Our platform protects both buyers and sellers every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/browse"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 min-h-[48px]"
              >
                Start Buying
              </Link>
              <Link
                href="/signup"
                className="bg-slate-800/50 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border border-white/10 hover:bg-slate-700/50 transition min-h-[48px]"
              >
                Become a Seller
              </Link>
            </div>
          </div>
        </section>

        {/* Buyer Journey */}
        <section className="py-16 sm:py-20" aria-labelledby="buyer-steps-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12">
              <h2 id="buyer-steps-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                For <span className="text-green-400">Buyers</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
                Purchase gaming products with confidence using our secure marketplace
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {buyerSteps.map((step) => (
                <article key={step.step} className="relative">
                  {step.step < 4 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-green-500/50 to-transparent z-0"></div>
                  )}
                  
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-5 sm:p-6 hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-xl sm:text-2xl">
                          {step.icon}
                        </div>
                        <span className="text-green-400 font-bold text-base sm:text-lg">Step {step.step}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-gray-400 mb-4 text-sm">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <span className="text-green-400 mt-0.5">•</span>
                            <span className="text-gray-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Seller Journey */}
        <section className="py-16 sm:py-20" aria-labelledby="seller-steps-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12">
              <h2 id="seller-steps-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                For <span className="text-purple-400">Sellers</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
                Monetize your gaming assets and reach thousands of buyers
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {sellerSteps.map((step) => (
                <article key={step.step} className="relative">
                  {step.step < 4 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent z-0"></div>
                  )}
                  
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-5 sm:p-6 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 h-full">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                    <div className="relative">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl sm:text-2xl">
                          {step.icon}
                        </div>
                        <span className="text-purple-400 font-bold text-base sm:text-lg">Step {step.step}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-gray-400 mb-4 text-sm">{step.description}</p>
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-sm">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span className="text-gray-300">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Protection Features */}
        <section className="py-16 sm:py-20" aria-labelledby="protection-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 sm:mb-12">
              <h2 id="protection-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Your Safety is Our <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Priority</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
                We've built multiple layers of protection to ensure safe and secure trading
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {protectionFeatures.map((feature, idx) => (
                <article key={idx} className="bg-slate-900/30 border border-white/5 rounded-xl p-5 sm:p-6 hover:bg-slate-800/50 hover:border-purple-500/30 transition-all duration-300 group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-4 group-hover:border-purple-500/30 transition">
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Buyer Protection Highlight */}
        <section className="py-16 sm:py-20" aria-labelledby="buyer-protection-heading">
          <div className="container mx-auto px-4">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl sm:rounded-3xl blur-xl"></div>
              <div className="relative text-center bg-slate-900/50 border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
                <div className="text-5xl sm:text-6xl mb-6">🛡️</div>
                <h2 id="buyer-protection-heading" className="text-2xl sm:text-3xl font-bold text-white mb-4">48-Hour Buyer Protection</h2>
                <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
                  After receiving your order, you have 48 hours to verify everything is as described. 
                  If there's any issue, open a dispute and our team will help resolve it. 
                  Your money stays safe until you're completely satisfied.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">100%</div>
                    <div className="text-xs sm:text-sm text-gray-500">Money-Back Guarantee</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">24/7</div>
                    <div className="text-xs sm:text-sm text-gray-500">Support Available</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                    <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">48h</div>
                    <div className="text-xs sm:text-sm text-gray-500">Protection Window</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4 text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Trading?
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of gamers who trust Nashflare for safe and secure gaming trades.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 min-h-[48px]"
              >
                Create Free Account
              </Link>
              <Link
                href="/browse"
                className="bg-slate-800/50 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg border border-white/10 hover:bg-slate-700/50 transition min-h-[48px]"
              >
                Browse Listings
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Mini Section */}
        <section className="py-16 sm:py-20" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <h2 id="faq-heading" className="text-xl sm:text-2xl font-bold text-white text-center mb-8">Common Questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqItems.map((faq, idx) => (
                <article key={idx} className="bg-slate-900/30 border border-white/5 rounded-xl p-5 sm:p-6 hover:bg-slate-800/50 transition-all duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-400 text-sm">{faq.a}</p>
                </article>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/contact" className="text-purple-400 hover:text-purple-300 font-semibold transition">
                Have more questions? Contact our support team →
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>

      {/* CSS animations */}
      <style jsx>{`
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