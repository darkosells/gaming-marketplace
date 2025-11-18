// app/listing/[id]/ListingDetailClient.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  game: string
  category: string
  platform: string
  image_url: string
  image_urls: string[]
  status: string
  stock: number
  created_at: string
  seller_id: string
  delivery_type: 'manual' | 'automatic'
  profiles: {
    id: string
    username: string
    avatar_url: string | null
    rating: number
    average_rating: number
    total_sales: number
    total_reviews: number
    verified: boolean
    created_at: string
  } | null
}

interface SimilarListing {
  id: string
  title: string
  price: number
  game: string
  category: string
  image_url: string
  image_urls: string[]
  profiles: {
    username: string
    average_rating: number
  } | {
    username: string
    average_rating: number
  }[]
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  buyer_id: string
  profiles: {
    username: string
  } | null
}

interface Props {
  initialListing: Listing
  listingId: string
}

export default function ListingDetailClient({ initialListing, listingId }: Props) {
  const router = useRouter()
  const [listing] = useState<Listing>(initialListing)
  const [reviews, setReviews] = useState<Review[]>([])
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: '', message: '', type: 'info' })
  
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    fetchReviews()
    fetchSimilarListings()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchSimilarListings = async () => {
    if (!listing) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          price,
          game,
          category,
          image_url,
          image_urls,
          profiles (
            username,
            average_rating
          )
        `)
        .eq('status', 'active')
        .neq('id', listing.id)
        .or(`game.eq.${listing.game},category.eq.${listing.category}`)
        .limit(4)
        .order('created_at', { ascending: false })

      if (error) throw error

      const sorted = (data || []).sort((a, b) => {
        const aScore = (a.game === listing.game ? 2 : 0) + (a.category === listing.category ? 1 : 0)
        const bScore = (b.game === listing.game ? 2 : 0) + (b.category === listing.category ? 1 : 0)
        return bScore - aScore
      })

      setSimilarListings(sorted.slice(0, 4))
    } catch (error) {
      console.error('Error fetching similar listings:', error)
    }
  }

  const fetchReviews = async () => {
    if (!listing?.seller_id) return
    
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          buyer_id,
          buyer:profiles!reviews_buyer_id_fkey(username)
        `)
        .eq('seller_id', listing.seller_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Reviews query error:', error)
        return
      }
      
      const mappedReviews = (data || []).map((review: any) => {
        const buyerData = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          buyer_id: review.buyer_id,
          profiles: buyerData ? { username: buyerData.username } : null
        }
      })
      
      setReviews(mappedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!listing) return

    const cart = {
      listing_id: listing.id,
      quantity: quantity,
      price: listing.price,
      title: listing.title
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    
    router.push('/cart')
  }

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    const existingCart = localStorage.getItem('cart')
    if (existingCart) {
      const proceed = confirm('You already have an item in your cart. Adding this item will replace it. Continue?')
      if (!proceed) return
    }

    if (quantity > listing.stock) {
      setModalMessage({
        title: 'Not Enough Stock',
        message: `Only ${listing.stock} items available. Please adjust your quantity.`,
        type: 'warning'
      })
      setShowModal(true)
      return
    }

    const cart = {
      listing_id: listing.id,
      quantity: quantity,
      price: listing.price,
      title: listing.title
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
    
    setModalMessage({
      title: 'Added to Cart!',
      message: 'Item has been added to your cart successfully.',
      type: 'success'
    })
    setShowModal(true)
  }

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    if (listing.seller_id === user.id) {
      setModalMessage({
        title: 'This is your listing!',
        message: 'You cannot contact yourself. This is your own product listing.',
        type: 'warning'
      })
      setShowModal(true)
      return
    }

    try {
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .single()

      if (existingConv) {
        router.push(`/messages?conversation=${existingConv.id}`)
        return
      }

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

      router.push(`/messages?conversation=${newConv.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      setModalMessage({
        title: 'Failed to Start Chat',
        message: 'Failed to start conversation. Please try again.',
        type: 'error'
      })
      setShowModal(true)
    }
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-3xl font-bold text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-400 mb-6">This listing may have been removed or doesn't exist.</p>
          <Link href="/browse" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition">
            ← Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  // Safe access with fallbacks
  const profileData = listing.profiles
  const sellerUsername = profileData?.username || 'Unknown Seller'
  const sellerId = profileData?.id || listing.seller_id
  const sellerRating = profileData?.average_rating || profileData?.rating || 0
  const sellerTotalSales = profileData?.total_sales || 0
  const sellerTotalReviews = profileData?.total_reviews || 0
  const sellerVerified = profileData?.verified || false
  const sellerAvatar = profileData?.avatar_url || null
  const sellerJoinDate = profileData?.created_at 
    ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown'

  const images = listing.image_urls && listing.image_urls.length > 0 
    ? listing.image_urls 
    : listing.image_url 
      ? [listing.image_url]
      : []

  const totalPrice = listing.price * quantity
  const serviceFee = totalPrice * 0.05
  const finalTotal = totalPrice + serviceFee

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">
                {modalMessage.type === 'error' ? '❌' :
                 modalMessage.type === 'warning' ? '⚠️' :
                 modalMessage.type === 'success' ? '✅' : 'ℹ️'}
              </div>
              <h3 className="text-xl font-bold text-white">{modalMessage.title}</h3>
            </div>
            <p className="text-gray-300 mb-6">{modalMessage.message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Cosmic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Stars - Static positions to avoid hydration mismatch */}
        {[
          { top: 10, left: 20, duration: 3, delay: 0 },
          { top: 25, left: 60, duration: 4, delay: 0.5 },
          { top: 35, left: 80, duration: 2.5, delay: 1 },
          { top: 15, left: 45, duration: 3.5, delay: 1.5 },
          { top: 45, left: 15, duration: 4.5, delay: 0.8 },
          { top: 5, left: 70, duration: 3.2, delay: 1.2 },
          { top: 40, left: 35, duration: 2.8, delay: 0.3 },
          { top: 20, left: 90, duration: 4.2, delay: 1.8 },
          { top: 48, left: 25, duration: 3.8, delay: 0.6 },
          { top: 8, left: 55, duration: 2.6, delay: 1.4 },
          { top: 30, left: 75, duration: 3.3, delay: 0.9 },
          { top: 42, left: 50, duration: 4.8, delay: 1.6 },
          { top: 18, left: 85, duration: 2.9, delay: 0.4 },
          { top: 38, left: 10, duration: 3.6, delay: 1.1 },
          { top: 12, left: 95, duration: 4.4, delay: 1.9 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-24 pb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/browse" className="text-gray-400 hover:text-white transition">Browse</Link>
            <span className="text-gray-600">/</span>
            <Link href={`/browse?game=${listing.game}`} className="text-gray-400 hover:text-white transition">{listing.game}</Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 truncate max-w-[200px]">{listing.title}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Product Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Product Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                {/* Image Gallery */}
                <div className="relative h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[activeImageIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition"
                          >
                            →
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition ${
                                  index === activeImageIndex ? 'bg-white w-8' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-9xl">
                        {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                      </span>
                    </div>
                  )}
                  {/* Category & Delivery Badge */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-black/50 backdrop-blur-lg px-4 py-2 rounded-full text-sm text-white font-semibold">
                      {listing.category === 'account' ? '🎮 Account' : listing.category === 'currency' ? '💰 Currency' : '🔑 Game Key'}
                    </span>
                    {listing.delivery_type === 'automatic' && (
                      <span className="bg-green-500/80 backdrop-blur-lg px-4 py-2 rounded-full text-sm text-white font-semibold flex items-center gap-1">
                        ⚡ Instant Delivery
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <p className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
                        <span>{listing.game}</span>
                        {listing.platform && (
                          <span className="bg-white/5 px-3 py-1 rounded-full text-sm text-gray-300">
                            {listing.platform}
                          </span>
                        )}
                      </p>
                      <h1 className="text-4xl font-bold text-white mb-2">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                          {listing.title}
                        </span>
                      </h1>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-white/10 mb-6">
                    <div className="flex space-x-8">
                      <button
                        onClick={() => setActiveTab('description')}
                        className={`pb-4 border-b-2 transition font-semibold ${
                          activeTab === 'description'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        📝 Description
                      </button>
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-4 border-b-2 transition font-semibold ${
                          activeTab === 'details'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        ℹ️ Details
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'description' && (
                    <div className="text-gray-300 leading-relaxed">
                      <p className="whitespace-pre-wrap">{listing.description || 'No description provided.'}</p>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-3">
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2">
                          <span>🏷️</span> Category
                        </span>
                        <span className="text-white font-semibold">
                          {listing.category === 'account' ? 'Gaming Account' : listing.category === 'currency' ? 'Currency' : 'Game Key'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2">
                          <span>🎮</span> Game
                        </span>
                        <span className="text-white font-semibold">{listing.game}</span>
                      </div>
                      {listing.platform && (
                        <div className="flex justify-between py-3 border-b border-white/10">
                          <span className="text-gray-400 flex items-center gap-2">
                            <span>💻</span> Platform
                          </span>
                          <span className="text-white font-semibold">{listing.platform}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2">
                          <span>📦</span> Stock
                        </span>
                        <span className={`font-semibold ${listing.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {listing.stock} available
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2">
                          <span>🚚</span> Delivery
                        </span>
                        <span className="text-white font-semibold flex items-center gap-2">
                          {listing.delivery_type === 'automatic' ? (
                            <>
                              <span className="text-green-400">⚡</span>
                              Instant (Automatic)
                            </>
                          ) : (
                            <>
                              <span className="text-blue-400">👤</span>
                              Manual
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-3">
                        <span className="text-gray-400 flex items-center gap-2">
                          <span>📅</span> Listed
                        </span>
                        <span className="text-white font-semibold">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Similar Products Section */}
              {similarListings.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">✨</span>
                    Similar Products
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {similarListings.map((item) => {
                      const itemImage = item.image_urls?.[0] || item.image_url
                      const sellerData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                      
                      return (
                        <Link
                          key={item.id}
                          href={`/listing/${item.id}`}
                          className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 group hover:-translate-y-1"
                        >
                          <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {itemImage ? (
                              <img
                                src={itemImage}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl group-hover:scale-125 transition-transform duration-300">
                                {item.category === 'account' ? '🎮' : item.category === 'currency' ? '💰' : '🔑'}
                              </div>
                            )}
                            {item.game === listing.game && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                  Same Game
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-purple-400 font-semibold mb-1">{item.game}</p>
                            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-1 group-hover:text-purple-400 transition">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-green-400 font-bold">${item.price.toFixed(2)}</p>
                              {sellerData?.average_rating > 0 && (
                                <div className="flex items-center gap-1 text-xs text-yellow-400">
                                  <span>★</span>
                                  <span>{sellerData.average_rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Seller Reviews Section - WITH CENSORED USERNAMES */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">⭐</span>
                  Seller Reviews
                </h2>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💭</div>
                    <p className="text-gray-400">No reviews yet</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to review this seller!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      // Censor username: show first 3 chars + ***
                      const rawUsername = review.profiles?.username || 'Anonymous'
                      const censoredUsername = rawUsername.length > 3 
                        ? rawUsername.substring(0, 3) + '***' 
                        : rawUsername
                      
                      return (
                        <div key={review.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {rawUsername.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-semibold">{censoredUsername}</p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
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
                          {review.comment && <p className="text-gray-300">{review.comment}</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Purchase & Seller */}
            <div className="space-y-6">
              {/* Purchase Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Price</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ${listing.price.toFixed(2)}
                  </p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-white font-semibold mb-3">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-xl transition border border-white/10 hover:border-purple-500/50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1
                        setQuantity(Math.min(Math.max(1, val), listing.stock))
                      }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl text-center text-white text-xl font-bold py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                      min="1"
                      max={listing.stock}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(listing.stock, quantity + 1))}
                      className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold text-xl transition border border-white/10 hover:border-purple-500/50"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    {listing.stock} available
                  </p>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Service Fee (5%)</span>
                    <span className="font-semibold">${serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-xl pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={listing.stock === 0}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    {listing.stock === 0 ? '❌ Out of Stock' : '🚀 Buy Now'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={listing.stock === 0}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold text-lg border-2 border-white/20 hover:border-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
                  >
                    🛒 Add to Cart
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-4 rounded-xl font-bold text-lg border-2 border-blue-500/50 transition-all duration-300 hover:scale-[1.02]"
                  >
                    💬 Contact Seller
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 space-y-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400 text-xl">✓</span>
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400 text-xl">✓</span>
                    <span>48h Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-300">
                    <span className="text-green-400 text-xl">✓</span>
                    <span>{listing.delivery_type === 'automatic' ? 'Instant Delivery' : 'Fast Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Seller Info Card - WITH AVATAR SUPPORT */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">👤</span>
                  Seller Information
                </h3>
                
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ring-4 ring-purple-500/20 overflow-hidden">
                    {sellerAvatar ? (
                      <img 
                        src={sellerAvatar} 
                        alt={sellerUsername}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {sellerUsername.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link href={`/seller/${sellerId}`} className="text-white font-bold text-lg hover:text-purple-400 transition">
                        {sellerUsername}
                      </Link>
                      {sellerVerified && (
                        <span className="text-blue-400 text-xl" title="Verified Seller">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Member since {sellerJoinDate}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400 flex items-center gap-2">
                      <span className="text-yellow-400">★</span>
                      Rating
                    </span>
                    <span className="text-white font-bold text-lg">
                      {sellerRating > 0 ? sellerRating.toFixed(1) : 'New'}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400 flex items-center gap-2">
                      <span className="text-green-400">💰</span>
                      Total Sales
                    </span>
                    <span className="text-white font-bold text-lg">{sellerTotalSales}</span>
                  </div>
                </div>

                <Link
                  href={`/seller/${sellerId}`}
                  className="block w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white py-3 rounded-xl font-semibold text-center border-2 border-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  View Full Profile →
                </Link>
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
    </div>
  )
}