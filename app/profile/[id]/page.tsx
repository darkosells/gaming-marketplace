'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface SellerProfile {
  id: string
  username: string
  role: string
  vendor_since: string
  total_reviews: number
  average_rating: number
  total_sales: number
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
      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('id, username, role, vendor_since, total_reviews, average_rating, total_sales')
        .eq('id', params.id)
        .single()

      if (sellerError) throw sellerError

      if (sellerData.role !== 'vendor') {
        alert('This user is not a vendor')
        router.push('/')
        return
      }

      setSeller(sellerData)

      // Fetch seller's listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', params.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (listingsError) throw listingsError
      setListings(listingsData || [])

      // Fetch seller's reviews
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

      // Fetch order/listing info for each review
      const reviewsWithListings = await Promise.all(
        (reviewsData || []).map(async (review: any) => {
          const { data: orderData } = await supabase
            .from('orders')
            .select('listing:listings(title, game)')
            .eq('id', review.order_id)
            .single()

          // Fix buyer type - Supabase returns it as an array with one object
          const buyerData = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer
          
          // Fix listing type - same issue
          const listingData = orderData?.listing 
            ? (Array.isArray(orderData.listing) ? orderData.listing[0] : orderData.listing)
            : null

          return {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            buyer: {
              username: buyerData?.username || 'Unknown'
            },
            listing: {
              title: listingData?.title || 'Unknown',
              game: listingData?.game || 'Unknown'
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

  // Censor username for privacy (e.g., "john123" -> "jo****3")
  const censorUsername = (username: string) => {
    if (!username || username.length <= 3) return username
    
    const firstTwo = username.substring(0, 2)
    const lastOne = username.substring(username.length - 1)
    const middle = '*'.repeat(Math.min(username.length - 3, 4)) // Max 4 stars
    
    return `${firstTwo}${middle}${lastOne}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Seller Not Found</h1>
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Seller Header */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl font-bold text-white">
                {seller.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{seller.username}</h1>
                <p className="text-gray-400 mb-3">
                  Vendor since {new Date(seller.vendor_since).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-6">
                  <div>
                    {renderStars(Math.round(seller.average_rating))}
                    <p className="text-sm text-gray-400 mt-1">
                      {seller.average_rating.toFixed(1)} ({seller.total_reviews} {seller.total_reviews === 1 ? 'review' : 'reviews'})
                    </p>
                  </div>
                  {seller.total_sales > 0 && (
                    <div className="border-l border-white/20 pl-6">
                      <p className="text-2xl font-bold text-white">{seller.total_sales}</p>
                      <p className="text-sm text-gray-400">Total Sales</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <div className="flex space-x-4 mb-6 border-b border-white/10 pb-4">
              <button
                onClick={() => setActiveTab('listings')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'listings'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Listings ({listings.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  activeTab === 'reviews'
                    ? 'bg-purple-500/30 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Reviews ({reviews.length})
              </button>
            </div>

            {/* Listings Tab */}
            {activeTab === 'listings' && (
              <>
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-xl font-bold text-white mb-2">No active listings</h3>
                    <p className="text-gray-400">This seller doesn't have any items available right now.</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/listing/${listing.id}`}
                        className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition group"
                      >
                        <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                          {listing.image_url ? (
                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                              {listing.category === 'account' ? '🎮' : listing.category === 'topup' ? '💰' : '🔑'}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold mb-1 truncate">{listing.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{listing.game}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xl font-bold text-white">${listing.price}</span>
                            <span className="text-sm text-gray-400">
                              {listing.delivery_type === 'automatic' ? '⚡ Auto' : '👤 Manual'}
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
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">⭐</div>
                    <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
                    <p className="text-gray-400">This seller hasn't received any reviews.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
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
                            <p className="text-sm text-purple-400 mb-2">
                              {review.listing.title} - {review.listing.game}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        {review.comment && (
                          <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
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
    </div>
  )
}