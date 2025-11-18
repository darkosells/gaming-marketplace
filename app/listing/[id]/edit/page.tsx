// app/listing/[id]/edit/page.tsx - MODERNIZED EDIT LISTING WITH PAGINATION & ORDER TRACKING

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import ImageUploader from '@/components/ImageUploader'

// Category to Games mapping
const categoryGamesMap: { [key: string]: string[] } = {
  account: ['GTA 5', 'Fortnite', 'Roblox', 'Valorant', 'League of Legends', 'Clash Royale', 'Clash of Clans', 'Steam'],
  items: ['Steal a Brainrot', 'Grow a Garden', 'Adopt me', 'Blox Fruits', 'Plants vs Brainrots'],
  currency: ['Roblox', 'Fortnite'],
  key: ['Steam', 'Playstation', 'Xbox']
}

interface DeliveryCode {
  id: string
  code_text: string
  is_used: boolean
  order_id: string | null
  delivered_at: string | null
}

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [listing, setListing] = useState<any>(null)
  const [deliveryCodes, setDeliveryCodes] = useState<DeliveryCode[]>([])
  const [newCodes, setNewCodes] = useState<string[]>([''])

  // Pagination states
  const [availableCodesPage, setAvailableCodesPage] = useState(1)
  const [usedCodesPage, setUsedCodesPage] = useState(1)
  const codesPerPage = 10

  // Form state
  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [category, setCategory] = useState('account')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [platform, setPlatform] = useState('')
  const [stock, setStock] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [deliveryType, setDeliveryType] = useState<'manual' | 'automatic'>('manual')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchListing()
    }
  }, [user])

  // Reset game if it's not valid for the new category (but only after initial load)
  useEffect(() => {
    if (listing && category !== listing.category) {
      const validGames = categoryGamesMap[category] || []
      if (!validGames.includes(game)) {
        setGame('')
      }
    }
  }, [category])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
  }

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user owns this listing
      if (data.seller_id !== user.id) {
        alert('You do not have permission to edit this listing')
        router.push('/dashboard')
        return
      }

      setListing(data)
      setTitle(data.title)
      setGame(data.game)
      setCategory(data.category)
      setDescription(data.description || '')
      setPrice(data.price.toString())
      setPlatform(data.platform || '')
      setStock(data.stock.toString())
      setDeliveryType(data.delivery_type || 'manual')

      // Handle images - support both old single image and new array
      if (data.image_urls && data.image_urls.length > 0) {
        setImageUrls(data.image_urls)
      } else if (data.image_url) {
        setImageUrls([data.image_url])
      } else {
        setImageUrls([])
      }

      // Fetch delivery codes if automatic
      if (data.delivery_type === 'automatic') {
        await fetchDeliveryCodes()
      }
    } catch (error: any) {
      console.error('Error fetching listing:', error)
      alert('Failed to load listing')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_codes')
        .select('*')
        .eq('listing_id', params.id)
        .order('created_at', { ascending: true })

      if (error) throw error

      setDeliveryCodes(data || [])
    } catch (error: any) {
      console.error('Error fetching delivery codes:', error)
    }
  }

  const handleImagesChange = (urls: string[]) => {
    setImageUrls(urls)
  }

  const handleAddCodeField = () => {
    setNewCodes([...newCodes, ''])
  }

  const handleRemoveCodeField = (index: number) => {
    setNewCodes(newCodes.filter((_, i) => i !== index))
  }

  const handleNewCodeChange = (index: number, value: string) => {
    const updated = [...newCodes]
    updated[index] = value
    setNewCodes(updated)
  }

  const handleDeleteExistingCode = async (codeId: string) => {
    if (!confirm('Are you sure you want to delete this delivery code?')) return

    try {
      const { error } = await supabase
        .from('delivery_codes')
        .delete()
        .eq('id', codeId)

      if (error) throw error

      // Update stock count after deleting a code
      const newUnusedCount = unusedCodes.filter(c => c.id !== codeId).length
      await supabase
        .from('listings')
        .update({ stock: newUnusedCount })
        .eq('id', params.id)

      alert('Delivery code deleted successfully!')
      await fetchDeliveryCodes()
    } catch (error: any) {
      console.error('Error deleting code:', error)
      alert('Failed to delete delivery code: ' + error.message)
    }
  }

  const handleUpdateExistingCode = async (codeId: string, newText: string) => {
    if (!newText.trim()) {
      alert('Code text cannot be empty')
      return
    }

    try {
      const { error } = await supabase
        .from('delivery_codes')
        .update({ code_text: newText })
        .eq('id', codeId)

      if (error) throw error

      alert('Delivery code updated successfully!')
      await fetchDeliveryCodes()
    } catch (error: any) {
      console.error('Error updating code:', error)
      alert('Failed to update delivery code: ' + error.message)
    }
  }

  const getAvailableGames = () => {
    return categoryGamesMap[category] || []
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'account': return 'Accounts'
      case 'items': return 'Items'
      case 'currency': return 'Currency'
      case 'key': return 'Game Keys'
      default: return cat
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !game || !price) {
      alert('Please fill in all required fields')
      return
    }

    // Check if selected game is valid for category
    const validGames = categoryGamesMap[category] || []
    if (!validGames.includes(game)) {
      alert(`"${game}" is not a valid game for the ${getCategoryLabel(category)} category. Please select a valid game.`)
      return
    }

    if (deliveryType === 'manual' && !stock) {
      alert('Please enter stock quantity')
      return
    }

    setSaving(true)

    try {
      // Calculate current unused codes from state
      const currentUnusedCodes = deliveryCodes.filter(c => !c.is_used)
      let finalStock = deliveryType === 'manual' ? parseInt(stock) : currentUnusedCodes.length

      // If automatic delivery, handle new codes first
      if (deliveryType === 'automatic') {
        const validNewCodes = newCodes.filter(code => code.trim().length > 0)
        
        if (validNewCodes.length > 0) {
          const codesToInsert = validNewCodes.map(code => ({
            listing_id: params.id,
            code_text: code.trim()
          }))

          const { data: insertedCodes, error: codesError } = await supabase
            .from('delivery_codes')
            .insert(codesToInsert)
            .select()

          if (codesError) throw codesError

          // Update final stock count with new codes
          finalStock = currentUnusedCodes.length + validNewCodes.length
        }
      }

      // Determine the correct status based on stock
      let newStatus = listing.status
      if (finalStock > 0 && listing.status === 'out_of_stock') {
        newStatus = 'active' // Reactivate listing when stock is replenished
      } else if (finalStock === 0 && listing.status === 'active') {
        newStatus = 'out_of_stock' // Mark as out of stock when no stock
      }

      // Update listing with correct stock count AND status
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          title,
          game,
          category,
          description,
          price: parseFloat(price),
          platform,
          stock: finalStock,
          status: newStatus,
          image_url: imageUrls[0] || null, // Keep for backward compatibility
          image_urls: imageUrls, // New array field
          delivery_type: deliveryType
        })
        .eq('id', params.id)

      if (listingError) throw listingError

      // Reset new codes and refresh
      if (deliveryType === 'automatic') {
        setNewCodes([''])
        await fetchDeliveryCodes()
      }

      alert('Listing updated successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error updating listing:', error)
      alert('Failed to update listing: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this listing? This will hide it from the marketplace but preserve order history.')) {
      return
    }

    try {
      // Always use soft delete (set status to 'removed') to avoid foreign key issues
      const { error } = await supabase
        .from('listings')
        .update({ status: 'removed' })
        .eq('id', params.id)

      if (error) throw error

      alert('Listing removed successfully! It has been hidden from the marketplace.')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error removing listing:', error)
      alert('Failed to remove listing: ' + error.message)
    }
  }

  const handleViewOrder = (orderId: string) => {
    window.open(`/order/${orderId}`, '_blank')
  }

  const goToAvailablePage = (page: number) => {
    setAvailableCodesPage(page)
    document.getElementById('available-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const goToUsedPage = (page: number) => {
    setUsedCodesPage(page)
    document.getElementById('used-codes-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          <p className="text-white mt-6 text-lg">Loading listing...</p>
        </div>
      </div>
    )
  }

  const unusedCodes = deliveryCodes.filter(c => !c.is_used)
  const usedCodes = deliveryCodes.filter(c => c.is_used)

  // Pagination for available codes
  const totalAvailablePages = Math.ceil(unusedCodes.length / codesPerPage)
  const startAvailableIndex = (availableCodesPage - 1) * codesPerPage
  const endAvailableIndex = startAvailableIndex + codesPerPage
  const paginatedAvailableCodes = unusedCodes.slice(startAvailableIndex, endAvailableIndex)

  // Pagination for used codes
  const totalUsedPages = Math.ceil(usedCodes.length / codesPerPage)
  const startUsedIndex = (usedCodesPage - 1) * codesPerPage
  const endUsedIndex = startUsedIndex + codesPerPage
  const paginatedUsedCodes = usedCodes.slice(startUsedIndex, endUsedIndex)

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Cosmic Space Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Stars */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-flex items-center gap-2 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">Edit Listing</span>
              </h1>
              <p className="text-gray-400">Update your listing details, images, and delivery codes</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">📝</span>
                  Basic Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-2 font-semibold">Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                      placeholder="Epic Fortnite Account - Level 200"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div>
                      <label className="block text-white mb-2 font-semibold">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer transition"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1rem center',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '3rem'
                        }}
                        required
                      >
                        <option value="account">🎮 Accounts</option>
                        <option value="items">🎒 Items</option>
                        <option value="currency">💰 Currency</option>
                        <option value="key">🔑 Game Keys</option>
                      </select>
                    </div>

                    {/* Game Selection */}
                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        Game *
                        <span className="text-purple-400 text-xs font-normal ml-2">
                          ({getAvailableGames().length} options)
                        </span>
                      </label>
                      <select
                        value={game}
                        onChange={(e) => setGame(e.target.value)}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer transition"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 1rem center',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '3rem'
                        }}
                        required
                      >
                        <option value="">Select a game</option>
                        {getAvailableGames().map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      {game && !getAvailableGames().includes(game) && (
                        <p className="text-yellow-400 text-xs mt-2 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20">
                          ⚠️ Current game "{game}" is not in the {getCategoryLabel(category)} category. Please select a valid game.
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-semibold">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-32 transition"
                      placeholder="Describe your item..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white mb-2 font-semibold">Price (USD) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                          placeholder="25.00"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-semibold">Platform</label>
                      <input
                        type="text"
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                        placeholder="PC, PS5, Xbox..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Images Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">🖼️</span>
                  Product Images
                </h2>
                
                {user && (
                  <ImageUploader
                    userId={user.id}
                    listingId={params.id as string}
                    existingImages={imageUrls}
                    onImagesChange={handleImagesChange}
                    maxImages={3}
                  />
                )}
              </div>

              {/* Delivery Type Card */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <span className="text-purple-400">🚚</span>
                  Delivery Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white mb-3 font-semibold">Delivery Type</label>
                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('manual')}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                          deliveryType === 'manual'
                            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-4xl mb-3">👤</div>
                        <div className="text-white font-bold mb-2">Manual Delivery</div>
                        <div className="text-sm text-gray-400">You manually deliver after payment</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('automatic')}
                        className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                          deliveryType === 'automatic'
                            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="text-4xl mb-3">⚡</div>
                        <div className="text-white font-bold mb-2">Automatic Delivery</div>
                        <div className="text-sm text-gray-400">Instant delivery with codes</div>
                      </button>
                    </div>
                  </div>

                  {deliveryType === 'manual' && (
                    <div>
                      <label className="block text-white mb-2 font-semibold">Stock Quantity *</label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                        placeholder="10"
                        required
                      />
                    </div>
                  )}

                  {deliveryType === 'automatic' && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                      <p className="text-blue-400 text-sm flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Stock is automatically calculated from available delivery codes below
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Codes Management (only for automatic) */}
              {deliveryType === 'automatic' && (
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-purple-500/30 transition-all duration-300">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-purple-400">🎫</span>
                    Delivery Codes Management
                  </h2>

                  {/* Stats Overview */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="text-2xl font-bold text-green-400">{unusedCodes.length}</div>
                      <div className="text-sm text-gray-400">Available Codes</div>
                    </div>
                    <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="text-2xl font-bold text-gray-400">{usedCodes.length}</div>
                      <div className="text-sm text-gray-400">Used Codes</div>
                    </div>
                  </div>

                  {/* Available Codes with Pagination */}
                  {unusedCodes.length > 0 && (
                    <div className="mb-8" id="available-codes-section">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          Available Codes
                        </h3>
                        {unusedCodes.length > 0 && (
                          <p className="text-sm text-gray-400">
                            Showing {startAvailableIndex + 1}-{Math.min(endAvailableIndex, unusedCodes.length)} of {unusedCodes.length}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {paginatedAvailableCodes.map((code) => (
                          <div key={code.id} className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition">
                            <input
                              type="text"
                              defaultValue={code.code_text}
                              onBlur={(e) => {
                                if (e.target.value !== code.code_text) {
                                  handleUpdateExistingCode(code.id, e.target.value)
                                }
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition"
                            />
                            <span className="text-green-400 text-xs font-semibold px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                              ✓ Available
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingCode(code.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-semibold transition border border-red-500/30 hover:scale-105"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Pagination for Available Codes */}
                      {totalAvailablePages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            type="button"
                            onClick={() => goToAvailablePage(availableCodesPage - 1)}
                            disabled={availableCodesPage === 1}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalAvailablePages }, (_, i) => i + 1).map((page) => {
                              const showPage = 
                                page === 1 || 
                                page === totalAvailablePages || 
                                (page >= availableCodesPage - 1 && page <= availableCodesPage + 1)

                              if (!showPage) {
                                if (page === availableCodesPage - 2 || page === availableCodesPage + 2) {
                                  return (
                                    <span key={page} className="px-2 text-gray-500">
                                      ...
                                    </span>
                                  )
                                }
                                return null
                              }

                              return (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => goToAvailablePage(page)}
                                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                                    availableCodesPage === page
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                      : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => goToAvailablePage(availableCodesPage + 1)}
                            disabled={availableCodesPage === totalAvailablePages}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Used Codes with Pagination & Order Tracking */}
                  {usedCodes.length > 0 && (
                    <div className="mb-8" id="used-codes-section">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <span className="text-gray-400">✗</span>
                          Used Codes (Sold)
                        </h3>
                        {usedCodes.length > 0 && (
                          <p className="text-sm text-gray-400">
                            Showing {startUsedIndex + 1}-{Math.min(endUsedIndex, usedCodes.length)} of {usedCodes.length}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {paginatedUsedCodes.map((code) => (
                          <div key={code.id} className="flex items-center gap-3 bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 opacity-75">
                            <input
                              type="text"
                              value={code.code_text}
                              disabled
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-400 text-sm cursor-not-allowed"
                            />
                            <span className="text-gray-400 text-xs font-semibold px-3 py-1 bg-gray-500/20 rounded-full border border-gray-500/30">
                              ✗ Sold
                            </span>
                            <span className="text-gray-500 text-xs min-w-[100px]">
                              {code.delivered_at ? new Date(code.delivered_at).toLocaleDateString() : 'N/A'}
                            </span>
                            {code.order_id && (
                              <button
                                type="button"
                                onClick={() => handleViewOrder(code.order_id!)}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-semibold transition border border-blue-500/30 hover:scale-105 flex items-center gap-2"
                                title="View order details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Order
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Pagination for Used Codes */}
                      {totalUsedPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                          <button
                            type="button"
                            onClick={() => goToUsedPage(usedCodesPage - 1)}
                            disabled={usedCodesPage === 1}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>
                          
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalUsedPages }, (_, i) => i + 1).map((page) => {
                              const showPage = 
                                page === 1 || 
                                page === totalUsedPages || 
                                (page >= usedCodesPage - 1 && page <= usedCodesPage + 1)

                              if (!showPage) {
                                if (page === usedCodesPage - 2 || page === usedCodesPage + 2) {
                                  return (
                                    <span key={page} className="px-2 text-gray-500">
                                      ...
                                    </span>
                                  )
                                }
                                return null
                              }

                              return (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => goToUsedPage(page)}
                                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-300 ${
                                    usedCodesPage === page
                                      ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg'
                                      : 'bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={() => goToUsedPage(usedCodesPage + 1)}
                            disabled={usedCodesPage === totalUsedPages}
                            className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add New Codes Section - IMPROVED */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="text-3xl">➕</span>
                      Add New Delivery Codes
                    </h3>
                    <p className="text-gray-400 text-sm mb-5">
                      Enter each code separately. They will be automatically delivered to buyers upon payment.
                    </p>
                    
                    <div className="space-y-3 mb-5">
                      {newCodes.map((code, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-xl flex items-center justify-center text-purple-300 font-bold text-sm border border-purple-500/30">
                            {index + 1}
                          </div>
                          <input
                            type="text"
                            value={code}
                            onChange={(e) => handleNewCodeChange(index, e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition"
                            placeholder={`Enter delivery code #${index + 1} (e.g., ABCD-EFGH-1234)`}
                          />
                          {newCodes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCodeField(index)}
                              className="flex-shrink-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-xl transition hover:scale-105 border border-red-500/30"
                              title="Remove this code"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCodeField}
                      className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 px-4 py-3 rounded-xl font-semibold border-2 border-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
                    >
                      <span className="text-2xl">+</span>
                      Add Another Code
                    </button>

                    {newCodes.filter(c => c.trim()).length > 0 && (
                      <div className="mt-5 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <p className="text-green-400 text-sm font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {newCodes.filter(c => c.trim()).length} new code{newCodes.filter(c => c.trim()).length !== 1 ? 's' : ''} ready to be added
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
                    <p className="text-blue-400 text-sm flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">💡</span>
                      <span>
                        <strong>Tip:</strong> Each code is automatically delivered to buyers upon payment. 
                        Stock is calculated from available (unused) codes. You can track which order each code was used for.
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 disabled:opacity-50 hover:scale-[1.02]"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    '💾 Save Changes'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-8 py-4 rounded-xl font-bold border-2 border-red-500/50 transition-all duration-300 hover:scale-105"
                >
                  🗑️ Delete Listing
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}