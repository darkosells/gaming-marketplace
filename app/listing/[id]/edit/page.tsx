// app/listing/[id]/edit/page.tsx - EDIT LISTING WITH FIXED DROPDOWNS & IMPROVED CODES UI

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

      console.log('=== DEBUG: Stock Update ===')
      console.log('Delivery Type:', deliveryType)
      console.log('Current unused codes count:', currentUnusedCodes.length)
      console.log('Initial final stock:', finalStock)

      // If automatic delivery, handle new codes first
      if (deliveryType === 'automatic') {
        const validNewCodes = newCodes.filter(code => code.trim().length > 0)
        
        console.log('Valid new codes to add:', validNewCodes.length, validNewCodes)
        
        if (validNewCodes.length > 0) {
          const codesToInsert = validNewCodes.map(code => ({
            listing_id: params.id,
            code_text: code.trim()
          }))

          console.log('Inserting codes:', codesToInsert)

          const { data: insertedCodes, error: codesError } = await supabase
            .from('delivery_codes')
            .insert(codesToInsert)
            .select()

          if (codesError) {
            console.error('Error inserting codes:', codesError)
            throw codesError
          }

          console.log('Codes inserted successfully:', insertedCodes)

          // Update final stock count with new codes
          finalStock = currentUnusedCodes.length + validNewCodes.length
          console.log('Updated final stock (after adding codes):', finalStock)
        }
      }

      console.log('Updating listing with stock:', finalStock)

      // Determine the correct status based on stock
      let newStatus = listing.status
      if (finalStock > 0 && listing.status === 'out_of_stock') {
        newStatus = 'active' // Reactivate listing when stock is replenished
      } else if (finalStock === 0 && listing.status === 'active') {
        newStatus = 'out_of_stock' // Mark as out of stock when no stock
      }

      console.log('New status:', newStatus)

      // Update listing with correct stock count AND status
      const { data: updatedListing, error: listingError } = await supabase
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
        .select()

      if (listingError) {
        console.error('Error updating listing:', listingError)
        throw listingError
      }

      console.log('Listing updated successfully:', updatedListing)
      console.log('=== END DEBUG ===')

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const unusedCodes = deliveryCodes.filter(c => !c.is_used)
  const usedCodes = deliveryCodes.filter(c => c.is_used)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Edit Listing</h1>
            <p className="text-gray-400">Update your listing details, images, and delivery codes</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Basic Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Epic Fortnite Account - Level 200"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Category Selection - FIXED: Using solid dark background */}
                  <div>
                    <label className="block text-white mb-2 font-semibold">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#1e1b4b] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '3rem',
                        backgroundColor: '#1e1b4b'
                      }}
                      required
                    >
                      <option value="account" style={{ backgroundColor: '#1e1b4b', color: 'white' }}>🎮 Accounts</option>
                      <option value="items" style={{ backgroundColor: '#1e1b4b', color: 'white' }}>🎒 Items</option>
                      <option value="currency" style={{ backgroundColor: '#1e1b4b', color: 'white' }}>💰 Currency</option>
                      <option value="key" style={{ backgroundColor: '#1e1b4b', color: 'white' }}>🔑 Game Keys</option>
                    </select>
                  </div>

                  {/* Game Selection - Dynamic based on category */}
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
                      className="w-full bg-[#1e1b4b] border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 1rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '3rem',
                        backgroundColor: '#1e1b4b'
                      }}
                      required
                    >
                      <option value="" style={{ backgroundColor: '#1e1b4b', color: 'white' }}>Select a game</option>
                      {getAvailableGames().map((g) => (
                        <option key={g} value={g} style={{ backgroundColor: '#1e1b4b', color: 'white' }}>{g}</option>
                      ))}
                    </select>
                    {game && !getAvailableGames().includes(game) && (
                      <p className="text-yellow-400 text-xs mt-1">
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
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none h-32"
                    placeholder="Describe your item..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white mb-2 font-semibold">Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="25.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-semibold">Platform</label>
                    <input
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="PC, PS5, Xbox..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Product Images</h2>
              
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
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Delivery Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2 font-semibold">Delivery Type</label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('manual')}
                      className={`p-4 rounded-lg border-2 transition ${
                        deliveryType === 'manual'
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="text-3xl mb-2">👤</div>
                      <div className="text-white font-semibold mb-1">Manual Delivery</div>
                      <div className="text-sm text-gray-400">You manually deliver after payment</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('automatic')}
                      className={`p-4 rounded-lg border-2 transition ${
                        deliveryType === 'automatic'
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="text-white font-semibold mb-1">Automatic Delivery</div>
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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="10"
                      required
                    />
                  </div>
                )}

                {deliveryType === 'automatic' && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-400 text-sm">
                      ⚡ Stock is automatically calculated from available delivery codes below
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Codes Management (only for automatic) */}
            {deliveryType === 'automatic' && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Delivery Codes Management</h2>

                {/* Existing Codes */}
                {deliveryCodes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Existing Codes ({unusedCodes.length} available, {usedCodes.length} used)
                    </h3>

                    {/* Available Codes */}
                    {unusedCodes.length > 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-400 mb-2">Available Codes:</p>
                        {unusedCodes.map((code) => (
                          <div key={code.id} className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <input
                              type="text"
                              defaultValue={code.code_text}
                              onBlur={(e) => {
                                if (e.target.value !== code.code_text) {
                                  handleUpdateExistingCode(code.id, e.target.value)
                                }
                              }}
                              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                            />
                            <span className="text-green-400 text-xs font-semibold px-2">✓ Available</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingCode(code.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded text-sm font-semibold transition"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Used Codes (Read-only) */}
                    {usedCodes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400 mb-2">Used Codes (sold):</p>
                        {usedCodes.map((code) => (
                          <div key={code.id} className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 rounded-lg p-3 opacity-60">
                            <input
                              type="text"
                              value={code.code_text}
                              disabled
                              className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                            />
                            <span className="text-gray-400 text-xs font-semibold px-2">✗ Sold</span>
                            <span className="text-gray-500 text-xs">
                              {code.delivered_at ? new Date(code.delivered_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Add New Codes - IMPROVED STYLING */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">➕</span>
                    Add New Delivery Codes
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Enter each code on a separate line. Each code will be automatically delivered to buyers.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    {newCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => handleNewCodeChange(index, e.target.value)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                          placeholder={`Enter delivery code #${index + 1} (e.g., ABCD-EFGH-1234)`}
                        />
                        {newCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCodeField(index)}
                            className="flex-shrink-0 bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-lg transition hover:scale-105"
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
                    className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 px-4 py-3 rounded-lg font-semibold border border-purple-500/50 transition flex items-center justify-center gap-2 hover:scale-[1.02]"
                  >
                    <span className="text-xl">+</span>
                    Add Another Code
                  </button>

                  {newCodes.filter(c => c.trim()).length > 0 && (
                    <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 text-sm font-semibold">
                        ✓ {newCodes.filter(c => c.trim()).length} new code{newCodes.filter(c => c.trim()).length !== 1 ? 's' : ''} ready to be added
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                  <p className="text-yellow-400 text-sm">
                    💡 <strong>Tip:</strong> Each code will be automatically delivered to buyers when they complete payment. 
                    Stock is calculated from the number of available (unused) codes.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-8 py-4 rounded-lg font-semibold border border-red-500/50 transition"
              >
                Delete Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}