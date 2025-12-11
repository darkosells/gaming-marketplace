'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import LiveSupportButton from '@/components/LiveSupportButton'

interface CartItem {
  listing_id: string
  quantity: number
  listing: {
    id: string
    title: string
    price: number
    game: string
    category: string
    image_url: string
    stock: number
    seller_id: string
    delivery_type: string
    profiles: {
      username: string
      avatar_url: string | null
      average_rating: number
      total_sales: number
      total_reviews: number
    }
  }
}

export default function CartPage() {
  const router = useRouter()
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const quantity = 1 // Fixed quantity - always 1
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    loadCart()
    setLoading(false)
  }

  const loadCart = async () => {
    const cartData = localStorage.getItem('cart')
    if (!cartData) {
      setCartItem(null)
      return
    }

    try {
      const cart = JSON.parse(cartData)
      
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`*, profiles (username, avatar_url, average_rating, total_sales, total_reviews)`)
        .eq('id', cart.listing_id)
        .single()

      if (error) throw error

      if (listing && listing.status === 'active') {
        setCartItem({
          listing_id: cart.listing_id,
          quantity: 1,
          listing: listing
        })
      } else {
        localStorage.removeItem('cart')
        setCartItem(null)
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      localStorage.removeItem('cart')
      setCartItem(null)
    }
  }

  const formatDeliveryTime = (deliveryType: string): string => {
    if (deliveryType === 'automatic') {
      return 'Instant'
    }
    return 'Usually within 24h'
  }

  const getDeliveryIcon = (deliveryType: string): string => {
    if (deliveryType === 'automatic') {
      return '⚡'
    }
    return '📦'
  }

  const removeFromCart = () => {
    localStorage.removeItem('cart')
    setCartItem(null)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const renderStars = (rating: number) => {
    const stars: React.ReactNode[] = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id="halfStar">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="#4B5563" />
              </linearGradient>
            </defs>
            <path fill="url(#halfStar)" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        )
      } else {
        stars.push(
          <svg key={i} className="w-4 h-4 text-gray-600 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        )
      }
    }
    return stars
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[60px]"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[60px]"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50"></div>
            <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading cart...</p>
        </div>
      </div>
    )
  }

  const subtotal = cartItem ? cartItem.listing.price * quantity : 0
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  // Checkout Steps Component
  const CheckoutSteps = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-center mb-6 sm:mb-8">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Step 1: Cart */}
        <div className="flex items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
            currentStep >= 1 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-white/10 text-gray-400'
          }`}>
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <span className={`ml-2 text-xs sm:text-sm font-medium hidden sm:inline ${
            currentStep >= 1 ? 'text-white' : 'text-gray-400'
          }`}>Cart</span>
        </div>

        {/* Connector */}
        <div className={`w-8 sm:w-16 h-0.5 ${
          currentStep > 1 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'
        }`}></div>

        {/* Step 2: Payment */}
        <div className="flex items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
            currentStep >= 2 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-white/10 text-gray-400'
          }`}>
            {currentStep > 2 ? '✓' : '2'}
          </div>
          <span className={`ml-2 text-xs sm:text-sm font-medium hidden sm:inline ${
            currentStep >= 2 ? 'text-white' : 'text-gray-400'
          }`}>Payment</span>
        </div>

        {/* Connector */}
        <div className={`w-8 sm:w-16 h-0.5 ${
          currentStep > 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-white/20'
        }`}></div>

        {/* Step 3: Confirmation */}
        <div className="flex items-center">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base ${
            currentStep >= 3 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
              : 'bg-white/10 text-gray-400'
          }`}>
            {currentStep > 3 ? '✓' : '3'}
          </div>
          <span className={`ml-2 text-xs sm:text-sm font-medium hidden sm:inline ${
            currentStep >= 3 ? 'text-white' : 'text-gray-400'
          }`}>Confirmation</span>
        </div>
      </div>
    </div>
  )

  // Buyer Protection Badge Component
  const BuyerProtectionBadge = () => (
    <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-emerald-400 font-bold text-sm sm:text-base mb-1">48-Hour Buyer Protection</h4>
          <p className="text-gray-300 text-xs sm:text-sm">
            Full refund guarantee if the item isn't as described or not delivered. Your payment is secure.
          </p>
        </div>
      </div>
    </div>
  )

  // Payment Methods Component
  const PaymentMethods = () => (
    <div className="mt-4 pt-4 border-t border-white/10">
      <p className="text-gray-400 text-xs mb-3">Accepted Payment Methods</p>
      <div className="flex items-center gap-3">
        {/* PayPal */}
        <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/15 transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.774.774 0 0 1 .763-.642h6.622c2.352 0 4.058.632 5.063 1.878.93 1.152 1.175 2.629.73 4.395-.024.093-.05.186-.078.28-.553 2.102-1.626 3.701-3.2 4.757-1.518 1.019-3.472 1.535-5.808 1.535H7.123a.775.775 0 0 0-.763.641l-.91 4.773a.642.642 0 0 1-.374 0z" fill="#003087"/>
            <path d="M19.049 8.093c.026-.175.048-.354.066-.536.576-3.727-2.465-5.478-6.627-5.478H6.165a.935.935 0 0 0-.923.772L2.047 20.597a.561.561 0 0 0 .554.652h4.036l1.013-6.43-.031.203a.934.934 0 0 1 .922-.772h1.921c3.772 0 6.724-1.533 7.587-5.967.026-.132.048-.26.066-.386l-.066.196z" fill="#002F6B"/>
            <path d="M9.098 8.093a.934.934 0 0 1 .923-.772h5.853c.693 0 1.34.045 1.93.14.168.027.333.058.493.093.16.035.316.074.467.118.076.022.15.046.224.07.296.098.57.213.82.347.576-3.727-2.465-5.478-6.627-5.478H6.165a.935.935 0 0 0-.923.772L2.047 20.597a.561.561 0 0 0 .554.652h4.036l1.013-6.43 1.448-6.726z" fill="#009CDE"/>
          </svg>
          <span className="text-white text-xs font-medium">PayPal</span>
        </div>
        
        {/* Crypto */}
        <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/15 transition-colors">
          <svg className="w-5 h-5 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
            <path fill="#FFF" d="M14.976 10.268c.196-1.322-.807-2.032-2.18-2.507l.446-1.788-1.088-.271-.434 1.741c-.286-.071-.58-.138-.872-.205l.437-1.752-1.087-.271-.446 1.787c-.237-.054-.469-.107-.695-.163l.001-.006-1.5-.375-.29 1.162s.807.185.79.196c.44.11.52.403.506.635l-.507 2.033c.03.008.07.019.113.037l-.115-.029-.71 2.85c-.054.133-.19.333-.497.257.011.016-.79-.197-.79-.197l-.54 1.246 1.415.353c.263.066.521.135.775.2l-.45 1.809 1.086.271.446-1.789c.297.08.586.155.868.226l-.444 1.781 1.087.271.45-1.805c1.86.352 3.259.21 3.848-1.472.474-1.355-.024-2.137-1.002-2.647.713-.164 1.25-.632 1.394-1.599zm-2.496 3.5c-.337 1.354-2.617.622-3.357.438l.599-2.401c.74.184 3.11.55 2.758 1.963zm.337-3.52c-.308 1.232-2.204.606-2.82.452l.543-2.177c.616.154 2.597.441 2.277 1.725z"/>
          </svg>
          <span className="text-white text-xs font-medium">Crypto</span>
        </div>

        {/* Card payments via PayPal */}
        <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/15 transition-colors">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-white text-xs font-medium">Card</span>
        </div>
      </div>
    </div>
  )

  // Trustpilot Badge Component
  const TrustpilotBadge = ({ compact = false }: { compact?: boolean }) => (
    <a 
      href="https://www.trustpilot.com/review/nashflare.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className={`block bg-[#00B67A]/10 hover:bg-[#00B67A]/20 border border-[#00B67A]/30 rounded-xl transition-colors duration-200 hover:border-[#00B67A]/50 ${compact ? 'p-3' : 'p-4'}`}
    >
      <div className={`flex items-center justify-between ${compact ? 'gap-2' : 'gap-3'}`}>
        <div className="flex-1 min-w-0">
          {/* Characteristic Trustpilot Stars - Green boxes with white stars */}
          <div className="flex items-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} bg-[#00B67A] flex items-center justify-center`}>
                <svg className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} text-white`} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </div>
            ))}
          </div>
          
          {/* Text */}
          <div className="flex items-center gap-1.5">
            <span className={`text-white font-bold ${compact ? 'text-xs' : 'text-sm'}`}>Excellent</span>
            <span className={`text-gray-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>on</span>
            <span className={`text-[#00B67A] font-semibold ${compact ? 'text-xs' : 'text-sm'}`}>Trustpilot</span>
          </div>
        </div>

        {/* Arrow */}
        <svg className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  )

  // How It Works Component
  const HowItWorks = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null)
    
    const faqs = [
      {
        question: "How fast will I receive my purchase?",
        answer: "Instant delivery items are delivered automatically within seconds. Manual delivery items are typically delivered within 24 hours, depending on the seller's response time."
      },
      {
        question: "What if the item isn't as described?",
        answer: "You're protected by our 48-hour Money-Back Guarantee. If the item doesn't match the description, simply open a dispute and we'll resolve it within 24 hours."
      },
      {
        question: "Is my payment secure?",
        answer: "Absolutely! We use 256-bit SSL encryption and process payments through PayPal and trusted crypto providers. Your financial data is never stored on our servers."
      },
      {
        question: "Can I contact the seller before buying?",
        answer: "Yes! You can message any seller directly from the listing page to ask questions before making a purchase."
      }
    ]

    return (
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-colors duration-200">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-purple-400">🚀</span>
          How It Works
        </h3>
        
        {/* 3-Step Visual */}
        <div className="flex items-center justify-between mb-6">
          {/* Step 1 */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">💳</span>
            </div>
            <p className="text-white font-semibold text-sm sm:text-base">Pay</p>
            <p className="text-gray-400 text-xs mt-0.5">Secure checkout</p>
          </div>
          
          {/* Arrow */}
          <div className="flex-shrink-0 px-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          
          {/* Step 2 */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">📦</span>
            </div>
            <p className="text-white font-semibold text-sm sm:text-base">Receive</p>
            <p className="text-gray-400 text-xs mt-0.5">Instant or fast</p>
          </div>
          
          {/* Arrow */}
          <div className="flex-shrink-0 px-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
          
          {/* Step 3 */}
          <div className="flex-1 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-2">
              <span className="text-xl sm:text-2xl">🎮</span>
            </div>
            <p className="text-white font-semibold text-sm sm:text-base">Enjoy</p>
            <p className="text-gray-400 text-xs mt-0.5">Start playing</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="border-t border-white/10 pt-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>❓</span>
            Frequently Asked Questions
          </h4>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-white text-sm font-medium pr-4">{faq.question}</span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === index ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-4 pb-3">
                    <p className="text-gray-400 text-sm">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Security Banner Component
  const SecurityBanner = () => (
    <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800/50 rounded-lg border border-white/5">
      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span className="text-gray-400 text-xs">256-bit SSL Encryption</span>
      <span className="text-gray-600">•</span>
      <span className="text-gray-400 text-xs">Your data is protected</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Mobile Summary Modal */}
      {showMobileSummary && cartItem && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowMobileSummary(false)}
          ></div>
          <div className="relative w-full bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up will-change-transform">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white">Order Summary</h3>
              <button 
                onClick={() => setShowMobileSummary(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Buyer Protection Badge */}
              <BuyerProtectionBadge />

              <div className="text-center py-2">
                <p className="text-gray-400 text-sm mb-1">Total Price</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${subtotal.toFixed(2)}
                </p>
              </div>

              {/* Security Banner */}
              <SecurityBanner />

              <button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-colors duration-200 min-h-[52px]"
              >
                Proceed to Checkout
              </button>

              <Link
                href="/browse"
                className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-semibold border border-white/10 transition-colors duration-200 hover:border-purple-500/30 min-h-[52px] flex items-center justify-center"
              >
                Continue Shopping
              </Link>

              {/* Payment Methods */}
              <PaymentMethods />

              {/* Trustpilot Badge */}
              <div className="mt-4">
                <TrustpilotBadge />
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>Verified Sellers</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-300">
                  <span className="text-green-400 text-xl">✓</span>
                  <span>24/7 Support</span>
                </div>
              </div>

              {/* Live Support Button - Opens Crisp Chat */}
              <LiveSupportButton />
            </div>
          </div>
        </div>
      )}

      {/* Optimized Background - Reduced blur and animations */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[60px]"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[60px]"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[60px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Main Content */}
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-24 sm:pb-12">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium">
                🛒 Your Cart
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              Shopping <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Cart</span>
            </h1>
          </div>

          {/* Checkout Progress Steps */}
          {cartItem && <CheckoutSteps currentStep={1} />}

          {!cartItem ? (
            // Empty Cart
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-8 sm:p-12 text-center hover:border-purple-500/30 transition-colors duration-200">
                <div className="text-5xl sm:text-6xl mb-4">🛒</div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                <p className="text-gray-400 mb-6 text-sm sm:text-base">
                  Add items to your cart to get started
                </p>
                <Link
                  href="/browse"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-colors duration-200 min-h-[48px] flex items-center justify-center"
                >
                  Browse Listings
                </Link>
              </div>
            </div>
          ) : (
            // Cart with Item
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-colors duration-200">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📦</span>
                    Cart Item
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="w-full sm:w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 group">
                      {cartItem.listing.image_url ? (
                        <img
                          src={cartItem.listing.image_url}
                          alt={cartItem.listing.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">
                            {cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/listing/${cartItem.listing.id}`}
                        className="text-white font-semibold text-base sm:text-lg hover:text-purple-400 transition mb-1 block line-clamp-2"
                      >
                        {cartItem.listing.title}
                      </Link>
                      <p className="text-purple-400 text-xs sm:text-sm mb-2">{cartItem.listing.game}</p>
                      
                      {/* Seller Info with Stats */}
                      <div className="flex items-center gap-2 mb-3">
                        <Link
                          href={`/seller/${cartItem.listing.seller_id}`}
                          className="flex items-center gap-2 group"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {cartItem.listing.profiles.avatar_url ? (
                              <img src={cartItem.listing.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              cartItem.listing.profiles.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-purple-400 hover:text-purple-300 transition text-sm font-medium group-hover:underline">
                            {cartItem.listing.profiles.username}
                          </span>
                        </Link>
                        
                        {/* Seller Rating & Sales */}
                        <div className="flex items-center gap-2 text-xs">
                          {cartItem.listing.profiles.total_reviews > 0 && (
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                              <div className="flex items-center">
                                {renderStars(cartItem.listing.profiles.average_rating)}
                              </div>
                              <span className="text-yellow-400 font-semibold ml-1">
                                {cartItem.listing.profiles.average_rating.toFixed(1)}
                              </span>
                              <span className="text-gray-400">
                                ({cartItem.listing.profiles.total_reviews})
                              </span>
                            </div>
                          )}
                          {cartItem.listing.profiles.total_sales > 0 && (
                            <div className="bg-white/5 px-2 py-1 rounded-lg text-gray-300">
                              <span className="text-green-400 font-semibold">{cartItem.listing.profiles.total_sales}</span> sales
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delivery Estimate */}
                      <div className="flex items-center gap-2 mb-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                        <span className="text-lg">
                          {getDeliveryIcon(cartItem.listing.delivery_type)}
                        </span>
                        <div>
                          <span className="text-xs text-gray-400">Est. Delivery: </span>
                          <span className={`text-sm font-semibold ${
                            cartItem.listing.delivery_type === 'automatic'
                              ? 'text-green-400' 
                              : 'text-blue-400'
                          }`}>
                            {formatDeliveryTime(cartItem.listing.delivery_type)}
                          </span>
                        </div>
                      </div>

                      {/* Fixed Quantity Display */}
                      <div className="flex items-center gap-2 mb-3 sm:mb-4 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                        <span className="text-gray-400 text-xs sm:text-sm">Quantity:</span>
                        <span className="text-white font-semibold text-sm sm:text-base">1</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          ${cartItem.listing.price.toFixed(2)}
                        </p>
                        <button
                          onClick={removeFromCart}
                          className="text-red-400 hover:text-red-300 text-xs sm:text-sm font-semibold transition flex items-center gap-1 min-h-[40px] px-3"
                        >
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-4 sm:mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 sm:p-4">
                    <p className="text-blue-300 text-xs sm:text-sm flex items-start gap-2">
                      <span className="text-base sm:text-lg flex-shrink-0">ℹ️</span>
                      <span>
                        <span className="font-semibold">Note:</span> You can only purchase one item at a time. 
                        To buy a different item, please complete this purchase first or remove it from your cart.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Buyer Protection Badge - Desktop (below cart item) */}
                <div className="hidden lg:block">
                  <BuyerProtectionBadge />
                </div>

                {/* How It Works - Desktop */}
                <div className="hidden lg:block">
                  <HowItWorks />
                </div>

                {/* Mobile: Buyer Protection + How It Works */}
                <div className="lg:hidden space-y-4">
                  <BuyerProtectionBadge />
                  <HowItWorks />
                </div>
              </div>

              {/* Desktop Order Summary */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-colors duration-200">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📋</span>
                    Order Summary
                  </h2>

                  <div className="text-center py-4 mb-4">
                    <p className="text-gray-400 text-sm mb-2">Total Price</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      ${subtotal.toFixed(2)}
                    </p>
                  </div>

                  {/* Security Banner */}
                  <div className="mb-4">
                    <SecurityBanner />
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-colors duration-200 mb-4"
                  >
                    Proceed to Checkout
                  </button>

                  <Link
                    href="/browse"
                    className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold border border-white/10 transition-colors duration-200 hover:border-purple-500/30"
                  >
                    Continue Shopping
                  </Link>

                  {/* Payment Methods */}
                  <PaymentMethods />

                  {/* Trustpilot Badge */}
                  <div className="mt-4">
                    <TrustpilotBadge compact />
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>Verified Sellers</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>24/7 Support</span>
                    </div>
                  </div>

                  {/* Live Support Button - Opens Crisp Chat */}
                  <div className="mt-4">
                    <LiveSupportButton />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Fixed Bottom Bar - Only show when cart has items */}
        {cartItem && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 p-3 sm:p-4 z-40 safe-area-bottom will-change-transform transform-gpu">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Price</p>
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${subtotal.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => setShowMobileSummary(true)}
                className="bg-white/10 text-white px-4 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-colors duration-200 min-h-[48px] text-sm whitespace-nowrap"
              >
                📋 Summary
              </button>
              <button
                onClick={handleCheckout}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-colors duration-200 whitespace-nowrap min-h-[48px] text-sm"
              >
                🚀 Checkout
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
        /* Respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-up,
          .animate-pulse,
          .animate-spin {
            animation: none !important;
          }
          * {
            transition-duration: 0.01ms !important;
          }
        }
        /* Optimize scrolling */
        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  )
}