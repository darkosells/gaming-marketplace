'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

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
    profiles: {
      username: string
    }
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState('test')
  const [showComingSoon, setShowComingSoon] = useState(false)
  
  // Billing form state
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    country: '',
    zipCode: ''
  })

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
    
    setUser(user)
    setBillingInfo(prev => ({ ...prev, email: user.email || '' }))
    loadCart()
    setLoading(false)
  }

  const loadCart = async () => {
    const cartData = localStorage.getItem('cart')
    if (!cartData) {
      router.push('/cart')
      return
    }

    try {
      const cart = JSON.parse(cartData)
      
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`*, profiles (username)`)
        .eq('id', cart.listing_id)
        .single()

      if (error) throw error

      if (listing && listing.status === 'active') {
        setCartItem({
          listing_id: cart.listing_id,
          quantity: cart.quantity,
          listing: listing
        })
      } else {
        localStorage.removeItem('cart')
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      router.push('/cart')
    }
  }

  const handlePlaceOrder = async () => {
    if (!cartItem || !user) return

    // For real payment methods, show coming soon message
    if (selectedPayment === 'card' || selectedPayment === 'crypto') {
      setShowComingSoon(true)
      return
    }

    // Basic validation for test mode
    if (!billingInfo.firstName || !billingInfo.lastName || !billingInfo.email) {
      alert('Please fill in all required billing information')
      return
    }

    setProcessing(true)

    try {
      const totalPrice = cartItem.listing.price * cartItem.quantity

      // Create the order - let the database trigger populate listing snapshot fields
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          listing_id: cartItem.listing.id,
          buyer_id: user.id,
          seller_id: cartItem.listing.seller_id,
          amount: totalPrice,
          quantity: cartItem.quantity,
          status: 'pending',
          payment_status: 'pending',
          payment_method: selectedPayment
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw new Error(orderError.message || 'Failed to create order')
      }

      if (!order) {
        throw new Error('Order was not created')
      }

      // Clear cart
      localStorage.removeItem('cart')
      window.dispatchEvent(new Event('cart-updated'))

      // Redirect to order page where they can simulate payment
      router.push(`/order/${order.id}`)

    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Failed to create order: ' + (error.message || 'Unknown error occurred'))
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (!cartItem) {
    return null
  }

  const subtotal = cartItem.listing.price * cartItem.quantity
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Page Header */}
          <div className="mb-8">
            <Link href="/cart" className="text-purple-400 hover:text-purple-300 transition flex items-center gap-2 mb-4">
              <span>←</span> Back to Cart
            </Link>
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                💳 Secure Checkout
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Checkout</span>
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Billing Information */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📝</span>
                  Billing Information
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">First Name *</label>
                    <input
                      type="text"
                      value={billingInfo.firstName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">Last Name *</label>
                    <input
                      type="text"
                      value={billingInfo.lastName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white font-medium mb-2 text-sm">Email *</label>
                    <input
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-white font-medium mb-2 text-sm">Address</label>
                    <input
                      type="text"
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">City</label>
                    <input
                      type="text"
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">Country</label>
                    <select
                      value={billingInfo.country}
                      onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em', paddingRight: '3rem' }}
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="AU">Australia</option>
                      <option value="NL">Netherlands</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-2 text-sm">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={billingInfo.zipCode}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">💳</span>
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {/* Test/Simulation Mode */}
                  <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'test' 
                      ? 'bg-green-500/20 border-green-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-green-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="test"
                      checked={selectedPayment === 'test'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedPayment === 'test' ? 'border-green-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'test' && (
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold flex items-center gap-2">
                        Test Mode
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded">DEV</span>
                      </p>
                      <p className="text-gray-400 text-sm">Simulate payment for testing purposes</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-2xl">🧪</span>
                    </div>
                  </label>

                  {/* Credit/Debit Card (Coming Soon) */}
                  <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'card' 
                      ? 'bg-purple-500/20 border-purple-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-purple-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={selectedPayment === 'card'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedPayment === 'card' ? 'border-purple-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'card' && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold flex items-center gap-2">
                        Credit / Debit Card
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">COMING SOON</span>
                      </p>
                      <p className="text-gray-400 text-sm">Visa, Mastercard, American Express</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-2xl">💳</span>
                    </div>
                  </label>

                  {/* Cryptocurrency (Coming Soon) */}
                  <label className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                    selectedPayment === 'crypto' 
                      ? 'bg-purple-500/20 border-purple-500/50' 
                      : 'bg-slate-800/50 border-white/10 hover:border-purple-500/30'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="crypto"
                      checked={selectedPayment === 'crypto'}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                      selectedPayment === 'crypto' ? 'border-purple-500' : 'border-gray-500'
                    }`}>
                      {selectedPayment === 'crypto' && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold flex items-center gap-2">
                        Cryptocurrency
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded">COMING SOON</span>
                      </p>
                      <p className="text-gray-400 text-sm">Bitcoin, Ethereum, USDT via Coinbase Commerce</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-2xl">₿</span>
                    </div>
                  </label>
                </div>

                {/* Info box based on selection */}
                {selectedPayment === 'test' && (
                  <div className="mt-6 p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                    <p className="text-green-300 text-sm flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <span>
                        <span className="font-semibold">Test Mode Active:</span> Your order will be created and you can simulate the payment on the order details page. 
                        No real payment will be processed.
                      </span>
                    </p>
                  </div>
                )}

                {selectedPayment === 'card' && (
                  <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                    <p className="text-yellow-300 text-sm flex items-start gap-2">
                      <span className="text-lg">🚧</span>
                      <span>
                        <span className="font-semibold">Coming Soon:</span> Bank card payments are being integrated. 
                        Want to be notified when this goes live? Email us at{' '}
                        <a href="mailto:contact@nashflare.com" className="text-yellow-200 underline hover:text-white transition">
                          contact@nashflare.com
                        </a>
                      </span>
                    </p>
                  </div>
                )}

                {selectedPayment === 'crypto' && (
                  <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                    <p className="text-yellow-300 text-sm flex items-start gap-2">
                      <span className="text-lg">🚧</span>
                      <span>
                        <span className="font-semibold">Coming Soon:</span> Cryptocurrency payments via Coinbase Commerce are being integrated. 
                        Want to be notified when this goes live? Email us at{' '}
                        <a href="mailto:contact@nashflare.com" className="text-yellow-200 underline hover:text-white transition">
                          contact@nashflare.com
                        </a>
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📦</span>
                  Order Summary
                </h2>

                {/* Item */}
                <div className="flex gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    {cartItem.listing.image_url ? (
                      <img
                        src={cartItem.listing.image_url}
                        alt={cartItem.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">
                          {cartItem.listing.category === 'account' ? '🎮' : cartItem.listing.category === 'topup' ? '💰' : '🔑'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm line-clamp-2">{cartItem.listing.title}</p>
                    <p className="text-purple-400 text-xs">{cartItem.listing.game}</p>
                    <p className="text-gray-400 text-xs">Qty: {cartItem.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${(cartItem.listing.price * cartItem.quantity).toFixed(2)}</p>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Service Fee (5%)</span>
                    <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between text-white text-xl font-bold">
                      <span>Total</span>
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={processing || (selectedPayment !== 'test')}
                  className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 mb-4 ${
                    selectedPayment === 'test'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/50 hover:scale-105'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {processing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Order...
                    </span>
                  ) : selectedPayment === 'test' ? (
                    'Create Test Order'
                  ) : (
                    'Payment Coming Soon'
                  )}
                </button>

                {selectedPayment === 'test' && (
                  <p className="text-center text-gray-500 text-xs mb-6">
                    You'll simulate payment on the order page
                  </p>
                )}

                {selectedPayment !== 'test' && (
                  <p className="text-center text-yellow-400 text-xs mb-6">
                    Select "Test Mode" to create a test order
                  </p>
                )}

                {/* Trust Badges */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">🔒</span>
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">🛡️</span>
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">⚡</span>
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">💬</span>
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl max-w-md w-full border border-white/20 shadow-2xl p-8 text-center">
            <div className="text-6xl mb-6">🚧</div>
            <h3 className="text-2xl font-bold text-white mb-4">Payment Coming Soon!</h3>
            <p className="text-gray-300 mb-6">
              {selectedPayment === 'card' 
                ? 'Bank card payments are currently being integrated with our payment provider.'
                : 'Cryptocurrency payments via Coinbase Commerce are currently being integrated.'
              }
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Want to be notified when this payment method goes live?<br />
              Email us at{' '}
              <a href="mailto:contact@nashflare.com" className="text-purple-400 hover:text-purple-300 underline">
                contact@nashflare.com
              </a>
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowComingSoon(false)
                  setSelectedPayment('test')
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all"
              >
                Use Test Mode Instead
              </button>
              <button
                onClick={() => setShowComingSoon(false)}
                className="w-full bg-white/10 text-white py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}