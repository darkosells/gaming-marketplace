// app/listing/[id]/ListingDetailClient.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import VendorRankBadge, { VendorRank } from '@/app/dashboard/components/VendorRankBadge'

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
  tags: string[]
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
    vendor_rank?: VendorRank
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
  const quantity = 1
  const [activeTab, setActiveTab] = useState('description')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: '', message: '', type: 'info' })
  const [showMobilePurchase, setShowMobilePurchase] = useState(false)
  
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
      // Check if conversation already exists
      const { data: existingConv, error: checkError } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .eq('seller_id', listing.seller_id)
        .maybeSingle()

      if (existingConv) {
        // Conversation exists, go to it
        router.push(`/messages?conversation=${existingConv.id}`)
      } else {
        // No conversation exists, pass listing info via URL to create on first message
        router.push(`/messages?listing_id=${listing.id}&seller_id=${listing.seller_id}`)
      }
    } catch (error) {
      console.error('Error checking conversation:', error)
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
        <div className="relative z-10 text-center px-4">
          <div className="text-5xl sm:text-6xl mb-4">😞</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">Listing Not Found</h1>
          <p className="text-gray-400 mb-6 text-sm sm:text-base">This listing may have been removed or doesn't exist.</p>
          <Link href="/browse" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition inline-block">
            ← Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const profileData = listing.profiles
  const sellerUsername = profileData?.username || 'Unknown Seller'
  const sellerId = profileData?.id || listing.seller_id
  const sellerRating = profileData?.average_rating || profileData?.rating || 0
  const sellerTotalSales = profileData?.total_sales || 0
  const sellerTotalReviews = profileData?.total_reviews || 0
  const sellerVerified = profileData?.verified || false
  const sellerAvatar = profileData?.avatar_url || null
  const sellerRank: VendorRank = profileData?.vendor_rank || 'nova'
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
              <div className="text-3xl sm:text-4xl">
                {modalMessage.type === 'error' ? '❌' :
                 modalMessage.type === 'warning' ? '⚠️' :
                 modalMessage.type === 'success' ? '✅' : 'ℹ️'}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">{modalMessage.title}</h3>
            </div>
            <p className="text-gray-300 mb-6 text-sm sm:text-base">{modalMessage.message}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition min-h-[48px]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mobile Purchase Modal */}
      {showMobilePurchase && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobilePurchase(false)}
          ></div>
          <div className="relative w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Purchase Details</h3>
              <button 
                onClick={() => setShowMobilePurchase(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  ${listing.price.toFixed(2)}
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pb-4 border-b border-white/10">
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
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
                >
                  {listing.stock === 0 ? '❌ Out of Stock' : '🚀 Buy Now'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={listing.stock === 0}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold text-lg border-2 border-white/20 hover:border-purple-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
                >
                  🛒 Add to Cart
                </button>
                <button
                  onClick={handleContactSeller}
                  className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-4 rounded-xl font-bold text-lg border-2 border-blue-500/50 transition-all duration-300 min-h-[52px]"
                >
                  💬 Contact Seller
                </button>
              </div>

              {/* Trust Badges */}
              <div className="space-y-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
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
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-3 sm:pb-4">
          <div className="flex items-center space-x-2 text-xs sm:text-sm overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/" className="text-gray-400 hover:text-white transition whitespace-nowrap">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/browse" className="text-gray-400 hover:text-white transition whitespace-nowrap">Browse</Link>
            <span className="text-gray-600">/</span>
            <Link href={`/browse?game=${listing.game}`} className="text-gray-400 hover:text-white transition whitespace-nowrap">{listing.game}</Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">{listing.title}</span>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 pb-8 sm:pb-12">
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Product Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Main Product Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                {/* Image Gallery */}
                <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
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
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition min-w-[40px] min-h-[40px]"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition min-w-[40px] min-h-[40px]"
                          >
                            →
                          </button>
                          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setActiveImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition ${
                                  index === activeImageIndex ? 'bg-white w-6 sm:w-8' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl sm:text-7xl lg:text-9xl">
                        {listing.category === 'account' ? '🎮' : listing.category === 'currency' ? '💰' : '🔑'}
                      </span>
                    </div>
                  )}
                  {/* Category & Delivery Badge */}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="bg-black/50 backdrop-blur-lg px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white font-semibold">
                      {listing.category === 'account' ? '🎮 Account' : listing.category === 'currency' ? '💰 Currency' : '🔑 Game Key'}
                    </span>
                    {listing.delivery_type === 'automatic' && (
                      <span className="bg-green-500/80 backdrop-blur-lg px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white font-semibold flex items-center gap-1">
                        ⚡ Instant
                      </span>
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex-1 min-w-0">
                      <p className="text-purple-400 font-semibold mb-2 flex flex-wrap items-center gap-2 text-sm sm:text-base">
                        <span>{listing.game}</span>
                        {listing.platform && (
                          <span className="bg-white/5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-gray-300">
                            {listing.platform}
                          </span>
                        )}
                      </p>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent break-words">
                          {listing.title}
                        </span>
                      </h1>
                      
                      {/* Tags Display */}
                      {listing.tags && listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                          {listing.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs sm:text-sm text-purple-300 font-medium hover:bg-purple-500/20 transition"
                            >
                              🏷️ {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-white/10 mb-4 sm:mb-6">
                    <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                      <button
                        onClick={() => setActiveTab('description')}
                        className={`pb-3 sm:pb-4 border-b-2 transition font-semibold whitespace-nowrap text-sm sm:text-base ${
                          activeTab === 'description'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        📝 Description
                      </button>
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 sm:pb-4 border-b-2 transition font-semibold whitespace-nowrap text-sm sm:text-base ${
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
                    <div className="text-gray-300 leading-relaxed text-sm sm:text-base">
                      <p className="whitespace-pre-wrap">{listing.description || 'No description provided.'}</p>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between py-2 sm:py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                          <span>🏷️</span> Category
                        </span>
                        <span className="text-white font-semibold text-sm sm:text-base">
                          {listing.category === 'account' ? 'Gaming Account' : listing.category === 'currency' ? 'Currency' : 'Game Key'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 sm:py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                          <span>🎮</span> Game
                        </span>
                        <span className="text-white font-semibold text-sm sm:text-base">{listing.game}</span>
                      </div>
                      {listing.platform && (
                        <div className="flex justify-between py-2 sm:py-3 border-b border-white/10">
                          <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                            <span>💻</span> Platform
                          </span>
                          <span className="text-white font-semibold text-sm sm:text-base">{listing.platform}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 sm:py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                          <span>📦</span> Stock
                        </span>
                        <span className={`font-semibold text-sm sm:text-base ${listing.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {listing.stock} available
                        </span>
                      </div>
                      <div className="flex justify-between py-2 sm:py-3 border-b border-white/10">
                        <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                          <span>🚚</span> Delivery
                        </span>
                        <span className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
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
                      <div className="flex justify-between py-2 sm:py-3">
                        <span className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                          <span>📅</span> Listed
                        </span>
                        <span className="text-white font-semibold text-sm sm:text-base">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Similar Products Section */}
              {similarListings.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                    <span className="text-purple-400">✨</span>
                    Similar Products
                  </h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                              <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-125 transition-transform duration-300">
                                {item.category === 'account' ? '🎮' : item.category === 'currency' ? '💰' : '🔑'}
                              </div>
                            )}
                            {item.game === listing.game && (
                              <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2">
                                <span className="bg-purple-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold">
                                  Same Game
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 sm:p-3">
                            <p className="text-xs text-purple-400 font-semibold mb-1 truncate">{item.game}</p>
                            <h3 className="text-white font-semibold text-xs sm:text-sm mb-1.5 sm:mb-2 line-clamp-1 group-hover:text-purple-400 transition">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-green-400 font-bold text-sm sm:text-base">${item.price.toFixed(2)}</p>
                              {sellerData?.average_rating > 0 && (
                                <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-yellow-400">
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

              {/* Seller Reviews Section */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2">
                  <span className="text-purple-400">⭐</span>
                  Seller Reviews
                </h2>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-5xl sm:text-6xl mb-4">💭</div>
                    <p className="text-gray-400 text-sm sm:text-base">No reviews yet</p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-2">Be the first to review this seller!</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reviews.map((review) => {
                      const rawUsername = review.profiles?.username || 'Anonymous'
                      const censoredUsername = rawUsername.length > 3 
                        ? rawUsername.substring(0, 3) + '***' 
                        : rawUsername
                      
                      return (
                        <div key={review.id} className="bg-white/5 rounded-xl p-3 sm:p-4 hover:bg-white/10 transition">
                          <div className="flex items-center justify-between mb-3 gap-2">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-base sm:text-lg">
                                  {rawUsername.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-semibold text-sm sm:text-base truncate">{censoredUsername}</p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-base sm:text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
                              {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {review.comment && <p className="text-gray-300 text-sm sm:text-base">{review.comment}</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Purchase & Seller (Desktop) */}
            <div className="hidden lg:block space-y-6">
              {/* Purchase Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-300">
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Price</p>
                  <p className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ${listing.price.toFixed(2)}
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

              {/* Seller Info Card (Desktop) */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">👤</span>
                  Seller Information
                </h3>
                
                <div className="flex items-center space-x-3 mb-4">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link href={`/seller/${sellerId}`} className="text-white font-bold text-lg hover:text-purple-400 transition truncate">
                        {sellerUsername}
                      </Link>
                      {sellerVerified && (
                        <span className="text-blue-400 text-xl flex-shrink-0" title="Verified Seller">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Member since {sellerJoinDate}</p>
                  </div>
                </div>

                {/* Seller Rank Badge */}
                <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-sm">Seller Rank</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sellerRank === 'supernova' ? 'Elite Seller' :
                         sellerRank === 'galaxy' ? 'Top Seller' :
                         sellerRank === 'star' ? 'Trusted Seller' : 'New Seller'}
                      </p>
                    </div>
                    <VendorRankBadge rank={sellerRank} size="md" showLabel={true} showTooltip={false} />
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

            {/* Mobile Seller Info Card */}
            <div className="lg:hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-300">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-purple-400">👤</span>
                Seller Information
              </h3>
              
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ring-4 ring-purple-500/20 overflow-hidden flex-shrink-0">
                  {sellerAvatar ? (
                    <img 
                      src={sellerAvatar} 
                      alt={sellerUsername}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg sm:text-2xl">
                      {sellerUsername.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Link href={`/seller/${sellerId}`} className="text-white font-bold text-base sm:text-lg hover:text-purple-400 transition truncate">
                      {sellerUsername}
                    </Link>
                    {sellerVerified && (
                      <span className="text-blue-400 text-lg sm:text-xl flex-shrink-0" title="Verified Seller">✓</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">Member since {sellerJoinDate}</p>
                </div>
              </div>

              {/* Seller Rank Badge (Mobile) */}
              <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-sm">Seller Rank</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {sellerRank === 'supernova' ? 'Elite Seller' :
                       sellerRank === 'galaxy' ? 'Top Seller' :
                       sellerRank === 'star' ? 'Trusted Seller' : 'New Seller'}
                    </p>
                  </div>
                  <VendorRankBadge rank={sellerRank} size="sm" showLabel={true} showTooltip={false} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-yellow-400 text-2xl mb-1">★</div>
                  <div className="text-white font-bold text-lg">
                    {sellerRating > 0 ? sellerRating.toFixed(1) : 'New'}
                  </div>
                  <div className="text-gray-400 text-xs">Rating</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-green-400 text-2xl mb-1">💰</div>
                  <div className="text-white font-bold text-lg">{sellerTotalSales}</div>
                  <div className="text-gray-400 text-xs">Total Sales</div>
                </div>
              </div>

              <Link
                href={`/seller/${sellerId}`}
                className="block w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white py-3 rounded-xl font-semibold text-center border-2 border-purple-500/50 transition-all duration-300 text-sm sm:text-base min-h-[48px] flex items-center justify-center"
              >
                View Full Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-3 sm:p-4 z-40 safe-area-bottom">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Price</p>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ${listing.price.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowMobilePurchase(true)}
              disabled={listing.stock === 0}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[48px] text-sm sm:text-base"
            >
              {listing.stock === 0 ? '❌ Out of Stock' : '🚀 Purchase'}
            </button>
          </div>
        </div>

        <Footer />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  )
}