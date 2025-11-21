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

export default function CartPage() {
  const router = useRouter()
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

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
        setQuantity(cart.quantity)
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

  const updateQuantity = (newQuantity: number) => {
    if (!cartItem) return
    
    const validQuantity = Math.max(1, Math.min(cartItem.listing.stock, newQuantity))
    setQuantity(validQuantity)
    
    const cart = {
      listing_id: cartItem.listing_id,
      quantity: validQuantity
    }
    localStorage.setItem('cart', JSON.stringify(cart))
  }

  const removeFromCart = () => {
    localStorage.removeItem('cart')
    setCartItem(null)
    setQuantity(1)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background for Loading */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading cart...</p>
        </div>
      </div>
    )
  }

  const subtotal = cartItem ? cartItem.listing.price * quantity : 0
  const serviceFee = subtotal * 0.05
  const total = subtotal + serviceFee

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-24 pb-12">
          {/* Page Header */}
          <div className="mb-8">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium">
                🛒 Your Cart
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Shopping <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Cart</span>
            </h1>
          </div>

          {!cartItem ? (
            // Empty Cart
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center hover:border-purple-500/30 transition-all duration-300">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
                <p className="text-gray-400 mb-6">
                  Add items to your cart to get started
                </p>
                <Link
                  href="/browse"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                >
                  Browse Listings
                </Link>
              </div>
            </div>
          ) : (
            // Cart with Item
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📦</span>
                    Cart Item
                  </h2>
                  
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 group">
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
                    <div className="flex-1">
                      <Link
                        href={`/listing/${cartItem.listing.id}`}
                        className="text-white font-semibold text-lg hover:text-purple-400 transition mb-1 block"
                      >
                        {cartItem.listing.title}
                      </Link>
                      <p className="text-purple-400 text-sm mb-2">{cartItem.listing.game}</p>
                      <p className="text-gray-400 text-sm mb-4">
                        Sold by{' '}
                        <Link
                          href={`/seller/${cartItem.listing.seller_id}`}
                          className="text-purple-400 hover:text-purple-300 transition"
                        >
                          {cartItem.listing.profiles.username}
                        </Link>
                      </p>

                      {/* Quantity Selector */}
                      <div className="flex items-center gap-4 mb-4">
                        <label className="text-white text-sm font-semibold">Quantity:</label>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(quantity - 1)}
                            disabled={quantity <= 1}
                            className="w-8 h-8 bg-slate-800/80 hover:bg-white/10 rounded-lg text-white font-bold transition border border-white/10 hover:border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={quantity}
                            onChange={(e) => updateQuantity(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-slate-800/80 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                          />
                          <button
                            onClick={() => updateQuantity(quantity + 1)}
                            disabled={quantity >= cartItem.listing.stock}
                            className="w-8 h-8 bg-slate-800/80 hover:bg-white/10 rounded-lg text-white font-bold transition border border-white/10 hover:border-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-400">
                          ({cartItem.listing.stock} available)
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                          ${(cartItem.listing.price * quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={removeFromCart}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold transition flex items-center gap-1"
                        >
                          <span>🗑️</span> Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-300 text-sm flex items-start gap-2">
                      <span className="text-lg">ℹ️</span>
                      <span>
                        <span className="font-semibold">Note:</span> You can only purchase one item at a time. 
                        To buy a different item, please complete this purchase first or remove it from your cart.
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">📋</span>
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Service Fee (5%)</span>
                      <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between text-white text-xl font-bold">
                        <span>Total</span>
                        <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 mb-4"
                  >
                    Proceed to Checkout
                  </button>

                  <Link
                    href="/browse"
                    className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold border border-white/10 transition-all duration-300 hover:border-purple-500/30"
                  >
                    Continue Shopping
                  </Link>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>Buyer Protection</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-300 group">
                      <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                      <span>Instant Delivery</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2025 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}