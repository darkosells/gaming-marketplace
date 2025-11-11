// COPY THIS ENTIRE CODE and replace your app/listing/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  game: string
  category: string
  platform: string
  image_url: string
  status: string
  stock: number
  created_at: string
  seller_id: string
  profiles: {
    id: string
    username: string
    rating: number
    total_sales: number
    verified: boolean
    created_at: string
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  reviewer_id: string
  profiles: {
    username: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<Listing | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartItemCount, setCartItemCount] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchListing()
    checkCart()
    
    // Listen for cart updates
    const handleStorageChange = () => checkCart()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('cart-updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('cart-updated', handleStorageChange)
    }
  }, [params.id])

  const checkCart = () => {
    const cart = localStorage.getItem('cart')
    setCartItemCount(cart ? 1 : 0)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles (
            id,
            username,
            rating,
            total_sales,
            verified,
            created_at
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setListing(data)
    } catch (error) {
      console.error('Error fetching listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    if (!listing?.seller_id) return
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:reviewer_id (
            username
          )
        `)
        .eq('reviewee_id', listing.seller_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  useEffect(() => {
    if (listing) {
      fetchReviews()
    }
  }, [listing])

  const handleBuyNow = () => {
    if (!user) {
      router.push('/login')
      return
    }
    // Will implement checkout later
    alert('Checkout functionality coming soon!')
  }

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    // Check if cart already has an item
    const existingCart = localStorage.getItem('cart')
    if (existingCart) {
      const proceed = confirm('You already have an item in your cart. Adding this item will replace it. Continue?')
      if (!proceed) return
    }

    // Add to cart (single item only)
    const cart = {
      listing_id: listing.id,
      quantity: quantity
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cart-updated'))
    
    // Redirect to cart
    router.push('/cart')
  }

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    try {
      // Check if conversation already exists
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .single()

      if (existingConv) {
        // Conversation exists, redirect to it
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          last_message: 'Started conversation',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      // Redirect to messages
      router.push(`/messages?conversation=${newConv.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to start conversation. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Listing Not Found</h1>
          <Link href="/browse" className="text-purple-400 hover:text-purple-300">
            ← Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = listing.price * quantity
  const sellerJoinDate = new Date(listing.profiles.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
              {user ? (
                <>
                  {/* Cart Icon */}
                  <Link href="/cart" className="relative text-gray-300 hover:text-white transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {cartItemCount}
                      </span>
                    )}
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
                </>
              ) : (
                <Link href="/login" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/" className="text-gray-400 hover:text-white">Home</Link>
          <span className="text-gray-600">/</span>
          <Link href="/browse" className="text-gray-400 hover:text-white">Browse</Link>
          <span className="text-gray-600">/</span>
          <Link href={`/browse?game=${listing.game}`} className="text-gray-400 hover:text-white">{listing.game}</Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-300">{listing.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Product Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Product Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
              {/* Image */}
              <div className="relative h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {listing.image_url ? (
                  <img
                    src={listing.image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-9xl">
                      {listing.category === 'account' ? '🎮' : listing.category === 'topup' ? '💰' : '🔑'}
                    </span>
                  </div>
                )}
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full text-sm text-white font-semibold">
                    {listing.category === 'account' ? 'Gaming Account' : listing.category === 'topup' ? 'Top-Up' : 'Game Key'}
                  </span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-purple-400 font-semibold mb-2">{listing.game}</p>
                    <h1 className="text-3xl font-bold text-white mb-2">{listing.title}</h1>
                    {listing.platform && (
                      <span className="inline-block bg-white/5 px-3 py-1 rounded-full text-sm text-gray-300">
                        {listing.platform}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10 mb-6">
                  <div className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`pb-4 border-b-2 transition ${
                        activeTab === 'description'
                          ? 'border-purple-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      Description
                    </button>
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`pb-4 border-b-2 transition ${
                        activeTab === 'details'
                          ? 'border-purple-500 text-white'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'description' && (
                  <div className="text-gray-300">
                    <p className="whitespace-pre-wrap">{listing.description || 'No description provided.'}</p>
                  </div>
                )}

                {activeTab === 'details' && (
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Category</span>
                      <span className="text-white font-semibold">
                        {listing.category === 'account' ? 'Gaming Account' : listing.category === 'topup' ? 'Top-Up' : 'Game Key'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Game</span>
                      <span className="text-white font-semibold">{listing.game}</span>
                    </div>
                    {listing.platform && (
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Platform</span>
                        <span className="text-white font-semibold">{listing.platform}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Stock</span>
                      <span className="text-white font-semibold">{listing.stock} available</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-gray-400">Listed</span>
                      <span className="text-white font-semibold">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Reviews Section */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Seller Reviews</h2>
              
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {review.profiles.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-semibold">{review.profiles.username}</p>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Card & Seller Info */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold text-green-400">${listing.price.toFixed(2)}</p>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Quantity</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(listing.stock, parseInt(e.target.value) || 1)))}
                    className="w-20 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(listing.stock, quantity + 1))}
                    className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">{listing.stock} in stock</p>
              </div>

              {/* Total */}
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total</span>
                  <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition"
                >
                  Buy Now
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold border border-white/20 transition"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg font-semibold border border-white/10 transition"
                >
                  Contact Seller
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Buyer Protection</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <span className="text-green-400">✓</span>
                  <span className="text-gray-300">Instant Delivery</span>
                </div>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Seller Information</h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {listing.profiles.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Link href={`/seller/${listing.profiles.id}`} className="text-white font-semibold hover:text-purple-400 transition">
                      {listing.profiles.username}
                    </Link>
                    {listing.profiles.verified && (
                      <span className="text-blue-400" title="Verified Seller">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">Member since {sellerJoinDate}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Rating</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white font-semibold">
                      {listing.profiles.rating > 0 ? listing.profiles.rating.toFixed(1) : 'New'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-gray-400">Total Sales</span>
                  <span className="text-white font-semibold">{listing.profiles.total_sales}</span>
                </div>
              </div>

              <Link
                href={`/seller/${listing.profiles.id}`}
                className="block w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg font-semibold text-center border border-white/10 transition"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}