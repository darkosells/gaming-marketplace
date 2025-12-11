// app/listing/[id]/ListingDetailClient.tsx
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import VendorRankBadge, { VendorRank } from '@/app/dashboard/components/VendorRankBadge'
import MoneyBackGuarantee from './MoneyBackGuarantee'
import WhatYouGet from './WhatYouGet'

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

type UnavailableReason = 'out_of_stock' | 'inactive' | 'deleted' | 'not_found' | null

interface Props {
  initialListing: Listing | null
  listingId: string
  unavailableReason?: UnavailableReason
}

// Optimized star data - reduced from 15 to 6 stars
const STAR_DATA = [
  { top: 10, left: 20, duration: 3, delay: 0 },
  { top: 25, left: 60, duration: 4, delay: 0.5 },
  { top: 35, left: 80, duration: 2.5, delay: 1 },
  { top: 15, left: 45, duration: 3.5, delay: 1.5 },
  { top: 45, left: 15, duration: 4.5, delay: 0.8 },
  { top: 8, left: 70, duration: 3.2, delay: 1.2 },
]

// Memoized Background Component - prevents re-renders
const CosmicBackground = () => (
  <div className="fixed inset-0 z-0 will-change-transform">
    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
    {/* Reduced blur from 150px to 60px for better performance */}
    <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[60px] motion-reduce:animate-none animate-pulse-slow"></div>
    <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[50px] motion-reduce:animate-none animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
    
    {/* Reduced star count for performance */}
    {STAR_DATA.map((star, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 bg-white rounded-full motion-reduce:opacity-50 motion-reduce:animate-none animate-pulse-slow"
        style={{
          top: `${star.top}%`,
          left: `${star.left}%`,
          animationDuration: `${star.duration}s`,
          animationDelay: `${star.delay}s`
        }}
      />
    ))}
  </div>
)

// Unavailable Page Component
function ListingUnavailablePage({ 
  listing, 
  reason 
}: { 
  listing: Listing | null
  reason: 'out_of_stock' | 'inactive' | 'deleted' | 'not_found' 
}) {
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchSimilarListings()
  }, [listing])

  const fetchSimilarListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select('id, title, price, game, image_url, image_urls, category, profiles(username, average_rating)')
        .eq('status', 'active')
        .gt('stock', 0)
        .limit(4)

      if (listing?.game) {
        query = query.eq('game', listing.game)
      } else if (listing?.category) {
        query = query.eq('category', listing.category)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      if ((!data || data.length < 4) && listing?.category) {
        const { data: moreData } = await supabase
          .from('listings')
          .select('id, title, price, game, image_url, image_urls, category, profiles(username, average_rating)')
          .eq('status', 'active')
          .gt('stock', 0)
          .eq('category', listing.category)
          .neq('game', listing.game || '')
          .limit(4 - (data?.length || 0))
          .order('created_at', { ascending: false })

        setSimilarListings([...(data || []), ...(moreData || [])])
      } else {
        setSimilarListings(data || [])
      }
    } catch (error) {
      console.error('Error fetching similar listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const content = useMemo(() => {
    switch (reason) {
      case 'out_of_stock':
        return {
          emoji: '📦',
          title: 'Out of Stock',
          subtitle: listing?.title || 'This listing',
          message: 'This item is currently sold out. The seller may restock soon, or you can check out similar listings below.',
          color: 'yellow',
          showNotifyButton: true
        }
      case 'inactive':
        return {
          emoji: '⏸️',
          title: 'Temporarily Unavailable',
          subtitle: listing?.title || 'This listing',
          message: 'The seller has temporarily paused this listing. It may become available again soon.',
          color: 'blue',
          showNotifyButton: false
        }
      case 'deleted':
        return {
          emoji: '🗑️',
          title: 'Listing Removed',
          subtitle: 'This listing is no longer available',
          message: 'The seller has removed this listing from the marketplace. Check out similar items below!',
          color: 'gray',
          showNotifyButton: false
        }
      case 'not_found':
      default:
        return {
          emoji: '🔍',
          title: 'Listing Not Found',
          subtitle: "We couldn't find this listing",
          message: "This listing may have been removed or the link might be incorrect. Browse our marketplace to find what you're looking for!",
          color: 'purple',
          showNotifyButton: false
        }
    }
  }, [reason, listing?.title])

  const colorClasses = {
    yellow: {
      bg: 'from-yellow-500/10 to-orange-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      button: 'from-yellow-500 to-orange-500 hover:shadow-yellow-500/50'
    },
    blue: {
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      button: 'from-blue-500 to-cyan-500 hover:shadow-blue-500/50'
    },
    gray: {
      bg: 'from-gray-500/10 to-slate-500/10',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      button: 'from-gray-500 to-slate-500 hover:shadow-gray-500/50'
    },
    purple: {
      bg: 'from-purple-500/10 to-pink-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      button: 'from-purple-500 to-pink-500 hover:shadow-purple-500/50'
    }
  }

  const colors = colorClasses[content.color as keyof typeof colorClasses]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <CosmicBackground />

      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Reduced backdrop-blur for performance */}
            <div className={`bg-gradient-to-r ${colors.bg} backdrop-blur-md border-2 ${colors.border} rounded-3xl p-6 sm:p-8 md:p-12 mb-8 text-center`}>
              <div className="relative inline-block mb-6">
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.button} rounded-full blur-xl opacity-50 motion-reduce:animate-none animate-pulse-slow`}></div>
                <div className="relative text-6xl sm:text-7xl md:text-8xl motion-reduce:animate-none animate-bounce-slow">
                  {content.emoji}
                </div>
              </div>

              <div className="inline-block mb-4">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${colors.badge}`}>
                  {content.title}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                {content.subtitle}
              </h1>

              <p className="text-gray-300 text-base sm:text-lg mb-8 max-w-2xl mx-auto">
                {content.message}
              </p>

              {listing && (reason === 'out_of_stock' || reason === 'inactive') && (
                <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-6 mb-8 max-w-md mx-auto">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0">
                      {listing.image_url || (listing.image_urls && listing.image_urls[0]) ? (
                        <img 
                          src={listing.image_urls?.[0] || listing.image_url} 
                          alt={listing.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl sm:text-3xl">
                            {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h3 className="text-white font-bold truncate text-sm sm:text-base">{listing.title}</h3>
                      <p className="text-purple-400 text-xs sm:text-sm">{listing.game}</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-400 mt-1">${listing.price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {reason === 'out_of_stock' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-center gap-2 text-yellow-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-semibold">Currently Unavailable</span>
                      </div>
                    </div>
                  )}

                  {reason === 'inactive' && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-center gap-2 text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">Paused by seller</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/browse"
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r ${colors.button} text-white rounded-xl font-bold text-base sm:text-lg hover:shadow-lg transition-all duration-200 hover:scale-105`}
                >
                  🔍 Browse Marketplace
                </Link>
                
                {listing?.game && (
                  <Link
                    href={`/browse?game=${encodeURIComponent(listing.game)}`}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-base sm:text-lg border border-white/20 transition-all duration-200 hover:scale-105"
                  >
                    🎮 More {listing.game}
                  </Link>
                )}
              </div>

              {content.showNotifyButton && listing && (
                <div className="mt-6">
                  <button
                    onClick={() => alert('Notification feature coming soon! You will be notified when this item is back in stock.')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 transition-all text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notify me when available
                  </button>
                </div>
              )}
            </div>

            {similarListings.length > 0 && (
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-3">
                  <span className="text-purple-400">✨</span>
                  {listing?.game ? `More ${listing.game} Listings` : 'Similar Listings'}
                </h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {similarListings.map((item) => {
                    const itemImage = item.image_urls?.[0] || item.image_url
                    const sellerData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
                    
                    return (
                      <Link
                        key={item.id}
                        href={`/listing/${item.id}`}
                        className="group bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-200 hover:-translate-y-1"
                      >
                        <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-3xl sm:text-4xl">
                                {item.category === 'account' ? '🎮' : item.category === 'items' ? '🎒' : item.category === 'currency' ? '💰' : '🔑'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-2 sm:p-3">
                          <h3 className="text-white font-semibold text-xs sm:text-sm truncate group-hover:text-purple-400 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-purple-400 text-xs mb-1 sm:mb-2">{item.game}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm sm:text-lg font-bold text-green-400">${item.price.toFixed(2)}</span>
                            {sellerData?.average_rating > 0 && (
                              <span className="text-xs text-yellow-400 flex items-center gap-0.5">
                                ★ {sellerData.average_rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-6 text-center">
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                  >
                    View all listings
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 text-center">
              <p className="text-gray-400 mb-4">Need help finding something specific?</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/browse"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  🔍 Search Marketplace
                </Link>
                <span className="hidden sm:inline text-gray-600">•</span>
                <a
                  href="mailto:support@nashflare.com"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  📧 Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}

// Main Component
export default function ListingDetailClient({ initialListing, listingId, unavailableReason }: Props) {
  const router = useRouter()
  const [listing] = useState<Listing | null>(initialListing)
  const [reviews, setReviews] = useState<Review[]>([])
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])
  const quantity = 1
  const [activeTab, setActiveTab] = useState('description')
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: '', message: '', type: 'info' })
  const [showMobilePurchase, setShowMobilePurchase] = useState(false)
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false)
  
  const supabase = createClient()

  if (unavailableReason) {
    return <ListingUnavailablePage listing={initialListing} reason={unavailableReason} />
  }

  // Memoized values to prevent recalculation
  const isOwnListing = useMemo(() => user && listing && listing.seller_id === user.id, [user, listing])
  
  const profileData = listing?.profiles
  const sellerUsername = profileData?.username || 'Unknown Seller'
  const sellerId = profileData?.id || listing?.seller_id
  const sellerRating = profileData?.average_rating || profileData?.rating || 0
  const sellerTotalSales = profileData?.total_sales || 0
  const sellerTotalReviews = profileData?.total_reviews || 0
  const sellerVerified = profileData?.verified || false
  const sellerAvatar = profileData?.avatar_url || null
  const sellerRank: VendorRank = profileData?.vendor_rank || 'nova'
  
  const sellerJoinDate = useMemo(() => {
    return profileData?.created_at 
      ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Unknown'
  }, [profileData?.created_at])

  const images = useMemo(() => {
    if (!listing) return []
    return listing.image_urls && listing.image_urls.length > 0 
      ? listing.image_urls 
      : listing.image_url 
        ? [listing.image_url]
        : []
  }, [listing?.image_urls, listing?.image_url])

  useEffect(() => {
    checkUser()
    fetchReviews()
    fetchSimilarListings()
  }, [])

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }, [supabase])

  const fetchSimilarListings = useCallback(async () => {
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
        .gt('stock', 0)
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
  }, [listing, supabase])

  const fetchReviews = useCallback(async () => {
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
  }, [listing?.seller_id, supabase])

  const handleBuyNow = useCallback(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!listing) return

    if (listing.seller_id === user.id) {
      setModalMessage({
        title: 'Cannot Buy Own Product',
        message: 'You cannot purchase your own listing. This is your product!',
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
    
    router.push('/cart')
  }, [user, listing, quantity, router])

  const handleAddToCart = useCallback(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    if (listing.seller_id === user.id) {
      setModalMessage({
        title: 'Cannot Add to Cart',
        message: 'You cannot add your own listing to cart. This is your product!',
        type: 'warning'
      })
      setShowModal(true)
      return
    }

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
  }, [user, listing, quantity, router])

  const handleContactSeller = useCallback(async () => {
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
        .maybeSingle()

      if (existingConv) {
        router.push(`/messages?conversation=${existingConv.id}`)
      } else {
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
  }, [user, listing, router, supabase])

  // Memoized image navigation handlers
  const handlePrevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const handleNextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  if (!listing) {
    return <ListingUnavailablePage listing={null} reason="not_found" />
  }

  // Get category icon - memoized inline
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'account': return '🎮'
      case 'currency': return '💰'
      case 'items': return '🎒'
      default: return '🔑'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Conditional Modal Rendering - Only mount when needed */}
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

      {/* Money-Back Guarantee Info Modal - Only mount when needed */}
      {showGuaranteeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Money-Back Guarantee</h3>
              </div>
              <button
                onClick={() => setShowGuaranteeModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4 text-gray-300 text-sm">
              <p>
                Your purchase is protected by our 48-hour Money-Back Guarantee. If something goes wrong, we've got you covered.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <p className="text-white font-medium">Item Not As Described</p>
                    <p className="text-gray-400 text-xs">Full refund if the item doesn't match the listing description</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <p className="text-white font-medium">Non-Delivery</p>
                    <p className="text-gray-400 text-xs">Full refund if you don't receive your item</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <p className="text-white font-medium">Account Issues</p>
                    <p className="text-gray-400 text-xs">Protected if account credentials don't work or get recovered</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400">
                  <span className="text-white font-medium">How to claim:</span> Open a dispute within 48 hours of purchase through your order details page. Our team will review and resolve within 24 hours.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuaranteeModal(false)}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition min-h-[48px]"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Mobile Purchase Modal - Only mount when needed */}
      {showMobilePurchase && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowMobilePurchase(false)}
          ></div>
          <div className="relative w-full bg-slate-900/95 backdrop-blur-md border-t border-white/10 rounded-t-3xl max-h-[85vh] overflow-y-auto animate-slide-up will-change-transform">
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Complete Purchase</h3>
              <button 
                onClick={() => setShowMobilePurchase(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {isOwnListing && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="text-yellow-300 font-semibold">This is your listing</p>
                      <p className="text-yellow-300/70 text-sm">You cannot purchase your own product</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center py-2">
                <p className="text-gray-400 text-sm mb-1">Total Price</p>
                <p className="text-4xl font-bold text-green-400">
                  ${listing.price.toFixed(2)}
                </p>
              </div>

              {/* Money-Back Guarantee - Prominent in Modal */}
              {!isOwnListing && (
                <MoneyBackGuarantee 
                  onLearnMore={() => {
                    setShowMobilePurchase(false)
                    setShowGuaranteeModal(true)
                  }} 
                />
              )}

              <div className="space-y-3">
                <button
                  onClick={handleBuyNow}
                  disabled={listing.stock === 0 || isOwnListing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
                >
                  {isOwnListing ? '🚫 Your Listing' : listing.stock === 0 ? '❌ Out of Stock' : '🚀 Buy Now'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={listing.stock === 0 || isOwnListing}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold text-lg border-2 border-white/20 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
                >
                  {isOwnListing ? '🚫 Cannot Add' : '🛒 Add to Cart'}
                </button>
                {!isOwnListing && (
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-4 rounded-xl font-bold text-lg border-2 border-blue-500/50 transition-all duration-200 min-h-[52px]"
                  >
                    💬 Contact Seller
                  </button>
                )}
                {isOwnListing && (
                  <Link
                    href="/dashboard?tab=listings"
                    className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-4 rounded-xl font-bold text-lg border-2 border-purple-500/50 transition-all duration-200 min-h-[52px] flex items-center justify-center"
                  >
                    ✏️ Edit in Dashboard
                  </Link>
                )}
              </div>

              {/* Payment Security - Compact in Modal */}
              {!isOwnListing && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400 text-xs font-medium">SECURE CHECKOUT</span>
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                      <span className="text-blue-400 font-bold text-xs">Pay</span>
                      <span className="text-blue-300 font-bold text-xs">Pal</span>
                    </div>
                    <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                      <span className="text-orange-400 text-sm">₿</span>
                      <span className="text-gray-300 text-xs font-medium">Crypto</span>
                    </div>
                    <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-gray-300 text-xs font-medium">SSL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optimized Cosmic Background */}
      <CosmicBackground />

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
          {isOwnListing && (
            <div className="mb-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">👋</span>
                  <div>
                    <p className="text-yellow-300 font-bold text-lg">This is your listing!</p>
                    <p className="text-yellow-300/70 text-sm">You're viewing your own product as it appears to buyers</p>
                  </div>
                </div>
                <Link
                  href="/dashboard?tab=listings"
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-4 py-2 rounded-xl font-semibold border border-yellow-500/50 transition whitespace-nowrap text-sm"
                >
                  ✏️ Edit Listing
                </Link>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Product Info */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Main Product Card - Reduced backdrop-blur */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-200">
                {/* Image Gallery */}
                <div className="relative h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {images.length > 0 ? (
                    <>
                      <img
                        src={images[activeImageIndex]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={handlePrevImage}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition min-w-[40px] min-h-[40px]"
                          >
                            ←
                          </button>
                          <button
                            onClick={handleNextImage}
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
                        {getCategoryIcon(listing.category)}
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="bg-black/50 backdrop-blur-sm px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white font-semibold">
                      {listing.category === 'account' ? '🎮 Account' : listing.category === 'currency' ? '💰 Currency' : listing.category === 'items' ? '🎒 Items' : '🔑 Game Key'}
                    </span>
                    {listing.delivery_type === 'automatic' && (
                      <span className="bg-green-500/80 backdrop-blur-sm px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white font-semibold flex items-center gap-1">
                        ⚡ Instant
                      </span>
                    )}
                  </div>
                  {isOwnListing && (
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                      <span className="bg-yellow-500/80 backdrop-blur-sm px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm text-white font-semibold">
                        👤 Your Listing
                      </span>
                    </div>
                  )}
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
                        <span className="text-purple-400 break-words">
                          {listing.title}
                        </span>
                      </h1>
                      
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
                      <button
                        onClick={() => setActiveTab('included')}
                        className={`pb-3 sm:pb-4 border-b-2 transition font-semibold whitespace-nowrap text-sm sm:text-base ${
                          activeTab === 'included'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        📦 What's Included
                      </button>
                    </div>
                  </div>

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
                          {listing.category === 'account' ? 'Gaming Account' : listing.category === 'currency' ? 'Currency' : listing.category === 'items' ? 'In-Game Items' : 'Game Key'}
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

                  {activeTab === 'included' && (
                    <WhatYouGet category={listing.category} deliveryType={listing.delivery_type} />
                  )}
                </div>
              </div>

              {/* Mobile Money-Back Guarantee - Visible on page (not in modal) */}
              <div className="lg:hidden">
                <MoneyBackGuarantee onLearnMore={() => setShowGuaranteeModal(true)} />
              </div>

              {/* Similar Products Section */}
              {similarListings.length > 0 && (
                <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-200">
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
                          className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-200 group hover:-translate-y-1"
                        >
                          <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {itemImage ? (
                              <img
                                src={itemImage}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl sm:text-4xl group-hover:scale-125 transition-transform duration-200">
                                {getCategoryIcon(item.category)}
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
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-purple-500/30 transition-all duration-200">
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
              {/* Purchase Card - Reduced backdrop-blur */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sticky top-24 hover:border-purple-500/30 transition-all duration-200">
                {isOwnListing && (
                  <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-yellow-300 font-semibold">Your Listing</p>
                        <p className="text-yellow-300/70 text-sm">You cannot purchase this</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price - Clean and Simple */}
                <div className="mb-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">Price</p>
                  <p className="text-5xl font-bold text-green-400">
                    ${listing.price.toFixed(2)}
                  </p>
                </div>

                {/* Money-Back Guarantee - ABOVE Buy Buttons */}
                {!isOwnListing && (
                  <div className="mb-4">
                    <MoneyBackGuarantee 
                      onLearnMore={() => setShowGuaranteeModal(true)} 
                      variant="compact"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={listing.stock === 0 || isOwnListing}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
                  >
                    {isOwnListing ? '🚫 Your Listing' : listing.stock === 0 ? '❌ Out of Stock' : '🚀 Buy Now'}
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={listing.stock === 0 || isOwnListing}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold text-lg border-2 border-white/20 hover:border-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] disabled:hover:scale-100"
                  >
                    {isOwnListing ? '🚫 Cannot Add' : '🛒 Add to Cart'}
                  </button>
                  {!isOwnListing && (
                    <button
                      onClick={handleContactSeller}
                      className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-4 rounded-xl font-bold text-lg border-2 border-blue-500/50 transition-all duration-200 hover:scale-[1.02]"
                    >
                      💬 Contact Seller
                    </button>
                  )}
                  {isOwnListing && (
                    <Link
                      href="/dashboard?tab=listings"
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-4 rounded-xl font-bold text-lg border-2 border-purple-500/50 transition-all duration-200 hover:scale-[1.02] flex items-center justify-center"
                    >
                      ✏️ Edit in Dashboard
                    </Link>
                  )}
                </div>

                {/* Additional Trust Indicators - Below Buy Buttons */}
                {!isOwnListing && (
                  <div className="mt-6 space-y-4">
                    {/* Quick Trust Points */}
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Secure
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        {listing.delivery_type === 'automatic' ? 'Instant' : 'Fast'} Delivery
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-400">✓</span>
                        24/7 Support
                      </span>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-center gap-3">
                        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                          <span className="text-blue-400 font-bold text-xs">Pay</span>
                          <span className="text-blue-300 font-bold text-xs">Pal</span>
                        </div>
                        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                          <span className="text-orange-400 text-sm">₿</span>
                          <span className="text-gray-300 text-xs font-medium">Crypto</span>
                        </div>
                        <div className="bg-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-gray-300 text-xs font-medium">SSL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Info Card (Desktop) - Reduced backdrop-blur */}
              <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-200">
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
                        loading="lazy"
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
                      {isOwnListing && (
                        <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-semibold">You</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Member since {sellerJoinDate}</p>
                  </div>
                </div>

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
                  className="block w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white py-3 rounded-xl font-semibold text-center border-2 border-purple-500/50 transition-all duration-200 hover:scale-[1.02]"
                >
                  View Full Profile →
                </Link>
              </div>
            </div>

            {/* Mobile Seller Info Card */}
            <div className="lg:hidden bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 hover:border-purple-500/30 transition-all duration-200">
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
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg sm:text-2xl">
                      {sellerUsername.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                    <Link href={`/seller/${sellerId}`} className="text-white font-bold text-base sm:text-lg hover:text-purple-400 transition truncate">
                      {sellerUsername}
                    </Link>
                    {sellerVerified && (
                      <span className="text-blue-400 text-lg sm:text-xl flex-shrink-0" title="Verified Seller">✓</span>
                    )}
                    {isOwnListing && (
                      <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full font-semibold">You</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">Member since {sellerJoinDate}</p>
                </div>
              </div>

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
                className="block w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-white py-3 rounded-xl font-semibold text-center border-2 border-purple-500/50 transition-all duration-200 text-sm sm:text-base min-h-[48px] flex items-center justify-center"
              >
                View Full Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-3 sm:p-4 z-40 safe-area-bottom">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-0.5">Price</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                ${listing.price.toFixed(2)}
              </p>
              <p className="text-xs text-green-400/70">✓ {listing.delivery_type === 'automatic' ? 'Instant delivery' : 'Fast delivery'}</p>
            </div>
            {isOwnListing ? (
              <Link
                href="/dashboard?tab=listings"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-lg transition-all duration-200 whitespace-nowrap min-h-[48px] text-sm sm:text-base flex items-center"
              >
                ✏️ Edit Listing
              </Link>
            ) : (
              <button
                onClick={() => setShowMobilePurchase(true)}
                disabled={listing.stock === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[48px] text-sm sm:text-base"
              >
                {listing.stock === 0 ? '❌ Out of Stock' : '🚀 Purchase'}
              </button>
            )}
          </div>
        </div>

        <Footer />
      </div>

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
          animation: slide-up 0.2s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
        /* Slower, more performant animations */
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-slow,
          .animate-bounce-slow,
          .animate-slide-up {
            animation: none !important;
          }
          * {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  )
}