// Create a new file: app/cart/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItem, setCartItem] = useState<CartItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)

  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setProfile(profileData)
    
    // Load cart from localStorage
    loadCart()
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const loadCart = async () => {
    const cartData = localStorage.getItem('cart')
    if (!cartData) {
      setCartItem(null)
      return
    }

    try {
      const cart = JSON.parse(cartData)
      
      // Fetch listing details
      const { data: listing, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles (
            username
          )
        `)
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
        // Listing no longer available, clear cart
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
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cart-updated'))
  }

  const handleCheckout = () => {
    // Will implement payment later
    alert('Checkout functionality coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const subtotal = cartItem ? cartItem.listing.price * quantity : 0
  const serviceFee = subtotal * 0.05 // 5% service fee
  const total = subtotal + serviceFee

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
              <span className="text-xl font-bold text-white">GameVault</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/browse" className="text-gray-300 hover:text-white transition">
                Browse
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Dashboard
              </Link>
              <div className="relative group z-[9999]">
                <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {profile?.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[9999]">
                  <Link href="/dashboard" className="block px-4 py-3 text-white hover:bg-white/10 rounded-t-lg">
                    Dashboard
                  </Link>
                  <Link href="/sell" className="block px-4 py-3 text-white hover:bg-white/10">
                    Create Listing
                  </Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:bg-white/10 rounded-b-lg">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Shopping Cart</h1>

        {!cartItem ? (
          // Empty Cart
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
              <p className="text-gray-400 mb-6">
                Add items to your cart to get started
              </p>
              <Link
                href="/browse"
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
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
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Cart Item</h2>
                
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    {cartItem.listing.image_url ? (
                      <img
                        src={cartItem.listing.image_url}
                        alt={cartItem.listing.title}
                        className="w-full h-full object-cover"
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
                        className="text-purple-400 hover:text-purple-300"
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
                          className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => updateQuantity(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => updateQuantity(quantity + 1)}
                          disabled={quantity >= cartItem.listing.stock}
                          className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm text-gray-400">
                        ({cartItem.listing.stock} available)
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-green-400">
                        ${(cartItem.listing.price * quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={removeFromCart}
                        className="text-red-400 hover:text-red-300 text-sm font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-blue-300 text-sm">
                    <span className="font-semibold">Note:</span> You can only purchase one item at a time. 
                    To buy a different item, please complete this purchase first or remove it from your cart.
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-6">Order Summary</h2>

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
                      <span className="text-green-400">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition mb-4"
                >
                  Proceed to Checkout
                </button>

                <Link
                  href="/browse"
                  className="block w-full text-center bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10 transition"
                >
                  Continue Shopping
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400">✓</span>
                    <span>Instant Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}