'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import VendorRankBadge, { VendorRank, RANK_CONFIGS } from '@/app/dashboard/components/VendorRankBadge'

interface SellerProfile {
  id: string
  username: string
  role: string
  vendor_since: string
  total_reviews: number
  average_rating: number
  total_sales: number
  avatar_url: string | null
  verified: boolean
  // Rank fields
  vendor_rank: VendorRank
  commission_rate: number
}

interface Review {
  id: string
  rating: number
  comment: string
  created_at: string
  buyer: {
    username: string
  }
  listing: {
    title: string
    game: string
  }
}

interface Listing {
  id: string
  title: string
  game: string
  category: string
  price: number
  image_url: string
  image_urls: string[]
  delivery_type: string
  stock: number
  status: string
}

export default function SellerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')

  useEffect(() => {
    fetchSellerProfile()
  }, [params.id])

  const fetchSellerProfile = async () => {
    try {
      // Fetch seller profile with rank fields
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select(`
          id, 
          username, 
          role, 
          vendor_since, 
          total_reviews, 
          average_rating, 
          total_sales, 
          avatar_url, 
          verified,
          vendor_rank,
          commission_rate
        `)
        .eq('id', params.id)
        .single()

      if (sellerError) throw sellerError

      if (sellerData.role !== 'vendor') {
        alert('This user is not a vendor')
        router.push('/')
        return
      }

      // Set defaults for rank fields if not present
      setSeller({
        ...sellerData,
        vendor_rank: sellerData.vendor_rank || 'nova',
        commission_rate: sellerData.commission_rate ?? 5.00
      })

      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', params.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (listingsError) throw listingsError
      setListings(listingsData || [])

      // Fetch reviews with ORDER SNAPSHOT DATA instead of joining listings
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          order_id,
          buyer:profiles!reviews_buyer_id_fkey(username)
        `)
        .eq('seller_id', params.id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError

      // Get order snapshot data for each review
      const reviewsWithListings = await Promise.all(
        (reviewsData || []).map(async (review: any) => {
          const { data: orderData } = await supabase
            .from('orders')
            .select('listing_title, listing_game')
            .eq('id', review.order_id)
            .single()

          const buyerData = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer

          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            buyer: {
              username: buyerData?.username || 'Unknown'
            },
            listing: {
              // Use order snapshot data
              title: orderData?.listing_title || 'Unknown Product',
              game: orderData?.listing_game || 'Unknown Game'
            }
          }
        })
      )

      setReviews(reviewsWithListings)

    } catch (error: any) {
      console.error('Error fetching seller profile:', error)
      alert('Failed to load seller profile')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}>
            ★
          </span>
        ))}
      </div>
    )
  }

  const censorUsername = (username: string) => {
    if (!username || username.length <= 3) return username
    
    const firstTwo = username.substring(0, 2)
    const lastOne = username.substring(username.length - 1)
    const middle = '*'.repeat(Math.min(username.length - 3, 4))
    
    return `${firstTwo}${middle}${lastOne}`
  }

  const getListingImage = (listing: Listing) => {
    if (listing.image_urls && listing.image_urls.length > 0) {
      return listing.image_urls[0]
    }
    return listing.image_url
  }

  // Get rank description for display
  const getRankDescription = (rank: VendorRank) => {
    const descriptions = {
      nova: 'New Seller',
      star: 'Trusted Seller',
      galaxy: 'Top Seller',
      supernova: 'Elite Seller'
    }
    return descriptions[rank]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
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
          <p className="text-white mt-6 text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-white mb-4">Seller Not Found</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const rankConfig = RANK_CONFIGS[seller.vendor_rank]

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Nebula Clouds */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Seller Header Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar with Rank Glow */}
                <div className="relative group">
                  {/* Rank-based glow effect */}
                  <div className={`absolute -inset-1.5 bg-gradient-to-r ${rankConfig.gradient} rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-300`}></div>
                  <div className="relative w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden ring-4 ring-purple-500/30">
                    {seller.avatar_url ? (
                      <img 
                        src={seller.avatar_url} 
                        alt={seller.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-5xl font-bold text-white">
                        {seller.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {seller.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 ring-4 ring-slate-900">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Seller Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">{seller.username}</h1>
                    <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                      {/* Vendor Rank Badge - Prominent Display */}
                      <VendorRankBadge 
                        rank={seller.vendor_rank} 
                        size="lg" 
                        showLabel={true}
                        showTooltip={false}
                      />
                      {seller.verified && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/30">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Rank Description */}
                  <p className={`text-sm mb-2 ${rankConfig.textColor}`}>
                    {getRankDescription(seller.vendor_rank)}
                  </p>
                  
                  <p className="text-gray-400 mb-4">
                    Vendor since {new Date(seller.vendor_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {/* Rank Badge Card */}
                    <div className={`bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-white/10 hover:border-${rankConfig.bgGlow}/30 transition-all duration-300`}>
                      <div className="text-2xl mb-2 text-center">{rankConfig.icon}</div>
                      <p className={`text-lg sm:text-xl font-bold text-center ${rankConfig.textColor}`}>
                        {rankConfig.name}
                      </p>
                      <p className="text-xs text-gray-400 text-center">Rank</p>
                    </div>
                    
                    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-white/10 hover:border-yellow-500/30 transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        {renderStars(Math.round(seller.average_rating))}
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-white text-center">
                        {seller.average_rating > 0 ? seller.average_rating.toFixed(1) : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 text-center">Rating</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
                      <div className="text-2xl mb-2 text-center">📝</div>
                      <p className="text-lg sm:text-xl font-bold text-white text-center">{seller.total_reviews}</p>
                      <p className="text-xs text-gray-400 text-center">Reviews</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-white/10 hover:border-green-500/30 transition-all duration-300">
                      <div className="text-2xl mb-2 text-center">💰</div>
                      <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent text-center">
                        {seller.total_sales}
                      </p>
                      <p className="text-xs text-gray-400 text-center">Sales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex space-x-4 mb-6 border-b border-white/10 pb-4">
                <button
                  onClick={() => setActiveTab('listings')}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'listings'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🏪 Listings ({listings.length})
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'reviews'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ⭐ Reviews ({reviews.length})
                </button>
              </div>

              {/* Listings Tab */}
              {activeTab === 'listings' && (
                <>
                  {listings.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No active listings</h3>
                      <p className="text-gray-400">This seller doesn't have any items available right now.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map((listing) => (
                        <Link
                          key={listing.id}
                          href={`/listing/${listing.id}`}
                          className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10"
                        >
                          <div className="relative h-44 bg-gradient-to-br from-purple-500/20 to-pink-500/20 overflow-hidden">
                            {getListingImage(listing) ? (
                              <img 
                                src={getListingImage(listing)} 
                                alt={listing.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-6xl group-hover:scale-125 transition-transform duration-300">
                                {listing.category === 'account' ? '🎮' : listing.category === 'items' ? '🎒' : listing.category === 'currency' ? '💰' : '🔑'}
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <span className="bg-black/60 backdrop-blur-lg px-3 py-1 rounded-full text-xs text-white font-semibold border border-white/10">
                                {listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual'}
                              </span>
                            </div>

                          </div>
                          <div className="p-4">
                            <p className="text-xs text-purple-400 mb-1 font-semibold">{listing.game}</p>
                            <h3 className="text-white font-semibold mb-2 truncate group-hover:text-purple-300 transition">
                              {listing.title}
                            </h3>
                            <div className="flex justify-between items-center">
                              <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                ${listing.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <>
                  {reviews.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">⭐</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No reviews yet</h3>
                      <p className="text-gray-400">This seller hasn't received any reviews.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">
                                    {review.buyer.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{censorUsername(review.buyer.username)}</p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm text-purple-400 mb-2 bg-purple-500/10 px-3 py-1 rounded-full inline-block">
                                {review.listing.title} - {review.listing.game}
                              </p>
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-3 rounded-lg">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}