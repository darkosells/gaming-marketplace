'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ImageGallery from '@/components/ImageGallery'

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
  profiles: {
    id: string
    username: string
    rating: number
    total_sales: number
    total_reviews: number
    average_rating: number
    verified: boolean
    created_at: string
    avatar_url: string | null  // Added avatar_url
  }
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
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalMessage, setModalMessage] = useState({ title: '', message: '', type: 'info' })
  
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchListing()
  }, [params.id])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
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
            total_reviews,
            average_rating,
            verified,
            created_at,
            avatar_url
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
          buyer:profiles!reviews_buyer_id_fkey(username)
        `)
        .eq('seller_id', listing.seller_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      
      const mappedReviews = (data || []).map((review: any) => {
        const buyerData = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer
        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          reviewer_id: '',
          profiles: {
            username: buyerData?.username || 'Anonymous'
          }
        }
      })
      
      setReviews(mappedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }

  useEffect(() => {
    if (listing) {
      fetchReviews()
      fetchSimilarListings()
    }
  }, [listing])

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!listing) return

    if (listing.seller_id === user.id) {
      alert('You cannot buy your own listing!')
      return
    }

    if (listing.stock < quantity) {
      alert('Not enough stock available!')
      return
    }

    const totalPrice = listing.price * quantity
    const serviceFee = totalPrice * 0.05
    const finalTotal = totalPrice + serviceFee

    const confirmed = confirm(
      `Confirm Purchase:\n\n` +
      `Item: ${listing.title}\n` +
      `Quantity: ${quantity}\n` +
      `Price: $${totalPrice.toFixed(2)}\n` +
      `Service Fee (5%): $${serviceFee.toFixed(2)}\n` +
      `Total: $${finalTotal.toFixed(2)}\n\n` +
      `Continue with purchase?`
    )

    if (!confirmed) return

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount: totalPrice,
          quantity: quantity,
          status: 'paid',
          payment_status: 'pending',
          payment_method: 'test'
        })
        .select()
        .single()

      if (orderError) throw orderError

      const existingCart = localStorage.getItem('cart')
      if (existingCart) {
        const cart = JSON.parse(existingCart)
        if (cart.listing_id === listing.id) {
          localStorage.removeItem('cart')
          window.dispatchEvent(new Event('cart-updated'))
        }
      }

      alert('Order created! You can now simulate payment on the order page.')
      router.push(`/order/${order.id}`)

    } catch (error: any) {
      console.error('Error creating order:', error)
      alert('Failed to create order: ' + error.message)
    }
  }

  const censorUsername = (username: string) => {
    if (!username || username.length <= 3) return username
    
    const firstTwo = username.substring(0, 2)
    const lastOne = username.substring(username.length - 1)
    const middle = '*'.repeat(Math.min(username.length - 3, 4))
    
    return `${firstTwo}${middle}${lastOne}`
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

    const cart = {
      listing_id: listing.id,
      quantity: quantity
    }
    localStorage.setItem('cart', JSON.stringify(cart))
    
    window.dispatchEvent(new Event('cart-updated'))
    
    router.push('/cart')
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
      alert('Failed to start conversation. Please try again.')
    }
  }

  const getListingImages = (): string[] => {
    if (!listing) return []
    
    if (listing.image_urls && listing.image_urls.length > 0) {
      return listing.image_urls
    }
    
    if (listing.image_url) {
      return [listing.image_url]
    }
    
    return []
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
          <p className="text-white mt-6 text-lg">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-white mb-4">Listing Not Found</h1>
          <Link href="/browse" className="text-purple-400 hover:text-purple-300 transition">
            ← Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = listing.price * quantity
  const sellerJoinDate = new Date(listing.profiles.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const listingImages = getListingImages()

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
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

        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-24 pb-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-400 hover:text-purple-400 transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/browse" className="text-gray-400 hover:text-purple-400 transition">Browse</Link>
            <span className="text-gray-600">/</span>
            <Link href={`/browse?game=${listing.game}`} className="text-gray-400 hover:text-purple-400 transition">{listing.game}</Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400">{listing.title}</span>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Main Listing Card */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-300">
                <div className="p-6">
                  <ImageGallery images={listingImages} title={listing.title} compact={true} />
                </div>

                <div className="p-6 border-t border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-purple-400 font-semibold">{listing.game}</p>
                        <span className="bg-black/60 backdrop-blur-lg px-3 py-1.5 rounded-full text-xs text-white font-semibold border border-white/10">
                          {listing.category === 'account' ? '🎮 Gaming Account' : listing.category === 'topup' ? '💰 Top-Up' : '🔑 Game Key'}
                        </span>
                      </div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                        {listing.title}
                      </h1>
                      {listing.platform && (
                        <span className="inline-block bg-white/5 px-4 py-1.5 rounded-full text-sm text-gray-300 border border-white/10">
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
                        className={`pb-4 border-b-2 transition font-medium ${
                          activeTab === 'description'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        Description
                      </button>
                      <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-4 border-b-2 transition font-medium ${
                          activeTab === 'details'
                            ? 'border-purple-500 text-white'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {activeTab === 'description' && (
                    <div className="text-gray-300">
                      <p className="whitespace-pre-wrap leading-relaxed">{listing.description || 'No description provided.'}</p>
                    </div>
                  )}

                  {activeTab === 'details' && (
                    <div className="space-y-3">
                      <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                        <span className="text-gray-400">Category</span>
                        <span className="text-white font-semibold">
                          {listing.category === 'account' ? 'Gaming Account' : listing.category === 'topup' ? 'Top-Up' : 'Game Key'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                        <span className="text-gray-400">Game</span>
                        <span className="text-white font-semibold">{listing.game}</span>
                      </div>
                      {listing.platform && (
                        <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                          <span className="text-gray-400">Platform</span>
                          <span className="text-white font-semibold">{listing.platform}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                        <span className="text-gray-400">Stock</span>
                        <span className={`font-semibold ${listing.stock <= 3 ? 'text-orange-400' : 'text-white'}`}>
                          {listing.stock} available {listing.stock <= 3 && listing.stock > 0 && '⚠️'}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                        <span className="text-gray-400">Images</span>
                        <span className="text-white font-semibold">{listingImages.length} photo(s)</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-white/10 hover:bg-white/5 px-2 rounded transition">
                        <span className="text-gray-400">Listed</span>
                        <span className="text-white font-semibold">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Similar Products */}
              {similarListings.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
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
                                {item.category === 'account' ? '🎮' : item.category === 'topup' ? '💰' : '🔑'}
                              </div>
                            )}
                            {item.game === listing.game && (
                              <div className="absolute top-2 left-2">
                                <span className="bg-purple-500/90 backdrop-blur-lg text-white text-xs px-2 py-1 rounded-full font-semibold">
                                  Same Game
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-purple-400 mb-1">{item.game}</p>
                            <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition">
                              {item.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-green-400 font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${item.price.toFixed(2)}</span>
                              {sellerData?.average_rating > 0 && (
                                <span className="text-xs text-yellow-400">
                                  ★ {sellerData.average_rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-yellow-400">⭐</span>
                  Seller Reviews
                </h2>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-gray-400">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {review.profiles.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-semibold">{censorUsername(review.profiles.username)}</p>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={`${i < review.rating ? 'text-yellow-400' : 'text-gray-600'} transition`}>
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
                        {review.comment && (
                          <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Purchase Card */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2">Price</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">${listing.price.toFixed(2)}</p>
                </div>

                <div className="mb-6">
                  <label className="block text-white font-semibold mb-2">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition border border-white/10 hover:border-purple-500/30"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(listing.stock, parseInt(e.target.value) || 1)))}
                      className="w-20 px-4 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(listing.stock, quantity + 1))}
                      className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg text-white font-bold transition border border-white/10 hover:border-purple-500/30"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{listing.stock} in stock</p>
                </div>

                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total</span>
                    <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-semibold border border-white/20 transition-all duration-300 hover:border-purple-500/30"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-semibold border border-white/10 transition-all duration-300 hover:border-purple-500/30"
                  >
                    Contact Seller
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                  <div className="flex items-center space-x-3 text-sm group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-gray-300">Secure Payment</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-gray-300">Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm group">
                    <span className="text-green-400 group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-gray-300">Instant Delivery</span>
                  </div>
                </div>
              </div>

              {/* Seller Info Card - UPDATED WITH AVATAR */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-purple-400">👤</span>
                  Seller Information
                </h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30">
                    {listing.profiles.avatar_url ? (
                      <img 
                        src={listing.profiles.avatar_url} 
                        alt={listing.profiles.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {listing.profiles.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link href={`/profile/${listing.profiles.id}`} className="text-white font-semibold hover:text-purple-400 transition">
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
                        {listing.profiles.average_rating > 0 
                          ? listing.profiles.average_rating.toFixed(1) 
                          : 'No reviews yet'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-gray-400">Total Reviews</span>
                    <span className="text-white font-semibold">
                      {listing.profiles.total_reviews || 0}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/profile/${listing.profiles.id}`}
                  className="block w-full mt-4 bg-white/5 hover:bg-white/10 text-white py-2 rounded-xl font-semibold text-center border border-white/10 transition-all duration-300 hover:border-purple-500/30"
                >
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                modalMessage.type === 'warning' 
                  ? 'bg-yellow-500/20 border border-yellow-500/30' 
                  : modalMessage.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/30'
                  : modalMessage.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-blue-500/20 border border-blue-500/30'
              }`}>
                <span className="text-3xl">
                  {modalMessage.type === 'warning' ? '⚠️' :
                   modalMessage.type === 'error' ? '❌' :
                   modalMessage.type === 'success' ? '✅' : 'ℹ️'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {modalMessage.title}
              </h3>
              
              <p className="text-gray-300 mb-6">
                {modalMessage.message}
              </p>
              
              <button
                onClick={() => setShowModal(false)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}