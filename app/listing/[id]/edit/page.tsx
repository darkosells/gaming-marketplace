// app/listing/[id]/edit/page.tsx - EDIT LISTING WITH DELIVERY CODE MANAGEMENT

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

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
  const [imageUrl, setImageUrl] = useState('')
  const [deliveryType, setDeliveryType] = useState<'manual' | 'automatic'>('manual')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchListing()
    }
  }, [user])

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
      setImageUrl(data.image_url || '')
      setDeliveryType(data.delivery_type || 'manual')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !game || !price) {
      alert('Please fill in all required fields')
      return
    }

    if (deliveryType === 'manual' && !stock) {
      alert('Please enter stock quantity')
      return
    }

    setSaving(true)

    try {
      // Update listing
      const { error: listingError } = await supabase
        .from('listings')
        .update({
          title,
          game,
          category,
          description,
          price: parseFloat(price),
          platform,
          stock: deliveryType === 'manual' ? parseInt(stock) : 0, // Stock for manual, will be auto-calculated for automatic
          image_url: imageUrl,
          delivery_type: deliveryType
        })
        .eq('id', params.id)

      if (listingError) throw listingError

      // If automatic delivery, handle new codes
      if (deliveryType === 'automatic') {
        const validNewCodes = newCodes.filter(code => code.trim().length > 0)
        
        if (validNewCodes.length > 0) {
          const codesToInsert = validNewCodes.map(code => ({
            listing_id: params.id,
            code_text: code.trim()
          }))

          const { error: codesError } = await supabase
            .from('delivery_codes')
            .insert(codesToInsert)

          if (codesError) throw codesError

          // Reset new codes
          setNewCodes([''])
          await fetchDeliveryCodes()
        }
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
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      alert('Listing deleted successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error deleting listing:', error)
      alert('Failed to delete listing: ' + error.message)
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
            <p className="text-gray-400">Update your listing details and manage delivery codes</p>
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
                  <div>
                    <label className="block text-white mb-2 font-semibold">Game *</label>
                    <input
                      type="text"
                      value={game}
                      onChange={(e) => setGame(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Fortnite"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-semibold">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                      required
                    >
                      <option value="account">Account</option>
                      <option value="topup">Top-up</option>
                      <option value="key">Game Key</option>
                    </select>
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

                <div>
                  <label className="block text-white mb-2 font-semibold">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
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

                {/* Add New Codes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Add New Codes</h3>
                  <div className="space-y-3 mb-4">
                    {newCodes.map((code, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => handleNewCodeChange(index, e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                          placeholder="Enter delivery code or instructions"
                        />
                        {newCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCodeField(index)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-3 rounded-lg transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCodeField}
                    className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg font-semibold border border-purple-500/50 transition"
                  >
                    + Add Another Code
                  </button>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
                    <p className="text-yellow-400 text-sm">
                      💡 <strong>Tip:</strong> Each code will be automatically delivered to buyers when they complete payment. 
                      Stock is calculated from the number of available (unused) codes.
                    </p>
                  </div>
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