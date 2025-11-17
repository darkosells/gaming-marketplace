'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export default function ContactPage() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

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
        
        <div className="absolute top-[12%] right-[8%]">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-[30%] left-0 right-0 h-1.5 bg-orange-300/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-2 border-orange-300/40 rounded-full -rotate-12"></div>
          </div>
        </div>
        
        <div className="absolute bottom-[25%] left-[5%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            <div className="absolute top-[35%] left-0 right-0 h-1 bg-purple-300/40 rounded-full"></div>
          </div>
        </div>
        
        {!prefersReducedMotion && (
          <>
            <div className="absolute top-32 left-[15%] w-2 h-2 bg-purple-400/50 rounded-full animate-[float_8s_ease-in-out_infinite]"></div>
            <div className="absolute top-60 right-[20%] w-2 h-2 bg-blue-400/40 rounded-full animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}></div>
          </>
        )}
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Main Content */}
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm">
                  📞 Get In Touch
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Contact <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Support</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Have questions or need assistance? We're here to help you 24/7.
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              {/* Contact Methods Grid */}
              <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* Live Chat Card - Coming Soon */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-8 hover:border-green-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-3xl">
                        💬
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Live Chat</h3>
                        <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-semibold rounded-full mt-1">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-6">
                      Real-time support chat is currently being integrated. Soon you'll be able to get instant help from our support team directly on the platform.
                    </p>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-sm text-gray-400 mb-2">In the meantime, contact us via:</p>
                      <a 
                        href="mailto:contact@nashflare.com" 
                        className="text-lg font-semibold text-green-400 hover:text-green-300 transition"
                      >
                        contact@nashflare.com
                      </a>
                    </div>
                  </div>
                </div>

                {/* Email Card */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-8 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-3xl">
                        📧
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Email Support</h3>
                        <p className="text-gray-400 text-sm">Response within 24 hours</p>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-6">
                      For detailed inquiries, account issues, disputes, or formal requests, reach out to us via email. We typically respond within 24 hours.
                    </p>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/20">
                      <p className="text-sm text-gray-400 mb-2">Email us at:</p>
                      <a 
                        href="mailto:contact@nashflare.com" 
                        className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 transition"
                      >
                        contact@nashflare.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Info */}
              <div className="grid md:grid-cols-3 gap-6 mt-8 mb-16">
                <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 text-center hover:border-purple-500/30 transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                    ⏰
                  </div>
                  <h3 className="text-white font-semibold mb-2">Response Time</h3>
                  <p className="text-gray-400 text-sm">Within 24 hours for all email inquiries</p>
                </div>
                <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 text-center hover:border-pink-500/30 transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                    ⚖️
                  </div>
                  <h3 className="text-white font-semibold mb-2">Dispute Resolution</h3>
                  <p className="text-gray-400 text-sm">48-72 hours for dispute investigations</p>
                </div>
                <div className="bg-slate-900/30 border border-white/5 rounded-xl p-6 text-center hover:border-blue-500/30 transition-all duration-300">
                  <div className="w-14 h-14 bg-slate-900/50 border border-white/5 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                    🌍
                  </div>
                  <h3 className="text-white font-semibold mb-2">Global Support</h3>
                  <p className="text-gray-400 text-sm">Available worldwide, 7 days a week</p>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-8 mb-40">
                <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { 
                      q: 'How long does delivery take?', 
                      a: 'Most digital products are delivered instantly after payment confirmation. For accounts, delivery typically occurs within 1-24 hours.' 
                    },
                    { 
                      q: 'What if I don\'t receive my order?', 
                      a: 'You have 48-hour buyer protection. If you don\'t receive your order, you can open a dispute and our team will investigate.' 
                    },
                    { 
                      q: 'How do I become a vendor?', 
                      a: 'Simply upgrade your account from the customer dashboard. Click "Become a Vendor" and you can start listing immediately.' 
                    },
                    { 
                      q: 'Is my payment secure?', 
                      a: 'Yes! We use industry-standard encryption and secure payment processing. Your financial information is never stored on our servers.' 
                    },
                    { 
                      q: 'Can I get a refund?', 
                      a: 'Refunds are handled through our dispute system. If a seller fails to deliver, you\'ll receive a full refund within your protection window.' 
                    },
                    { 
                      q: 'How do I report a problem?', 
                      a: 'Email us at contact@nashflare.com with your order ID and details. We\'ll investigate and respond within 24 hours.' 
                    }
                  ].map((faq, idx) => (
                    <div key={idx} className="bg-slate-900/30 border border-white/5 rounded-xl p-6 hover:bg-slate-800/50 transition-all duration-300">
                      <h4 className="text-lg font-semibold text-white mb-3">{faq.q}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
                  <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-4">Still Have Questions?</h3>
                    <p className="text-gray-400 mb-6">Our team is ready to help with any concerns.</p>
                    <a 
                      href="mailto:contact@nashflare.com"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                    >
                      <span>Email Us Now</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 border-t border-white/5 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🎮</span>
                  </div>
                  <span className="text-lg font-bold text-white">Nashflare</span>
                </div>
                <p className="text-gray-500 text-sm">
                  The most trusted marketplace for gaming assets.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Marketplace</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/browse?category=account" className="hover:text-white transition">Gaming Accounts</Link></li>
                  <li><Link href="/browse?category=topup" className="hover:text-white transition">Top-Ups</Link></li>
                  <li><Link href="/browse?category=key" className="hover:text-white transition">Game Keys</Link></li>
                  <li><Link href="/browse" className="hover:text-white transition">All Items</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-4">Legal</h4>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
                  <li><Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/5 pt-8 text-center text-gray-500 text-sm">
              <p>&copy; 2024 Nashflare. All rights reserved.</p>
            </div>
          </div>
        </footer>
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