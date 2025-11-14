'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('active')
  const [imageUrl, setImageUrl] = useState('')
  const [deliveryType, setDeliveryType] = useState<'manual' | 'automatic'>('manual')
  
  // Delivery codes
  const [deliveryCodes, setDeliveryCodes] = useState<DeliveryCode[]>([])
  const [newCodes, setNewCodes] = useState<string[]>([])
  const [showAddCodes, setShowAddCodes] = useState(false)

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
      const { data: listing, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      // Check if user owns this listing
      if (listing.seller_id !== user.id) {
        router.push('/dashboard')
        return
      }

      // Set form fields
      setTitle(listing.title)
      setDescription(listing.description || '')
      setPrice(listing.price.toString())
      setPlatform(listing.platform || '')
      setStatus(listing.status)
      setImageUrl(listing.image_url || '')
      setDeliveryType(listing.delivery_type || 'manual')

      // Fetch delivery codes if automatic delivery
      if (listing.delivery_type === 'automatic') {
        fetchDeliveryCodes()
      }

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching listing:', error)
      setError('Failed to load listing')
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
    } catch (error) {
      console.error('Error fetching delivery codes:', error)
    }
  }

  const handleUpdateListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title,
          description,
          price: parseFloat(price),
          platform,
          status,
          image_url: imageUrl || null
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Update error:', error)
      setError(error.message || 'Failed to update listing')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCode = async (codeId: string, newText: string) => {
    try {
      const { error } = await supabase
        .from('delivery_codes')
        .update({ code_text: newText, updated_at: new Date().toISOString() })
        .eq('id', codeId)

      if (error) throw error

      // Update local state
      setDeliveryCodes(prev =>
        prev.map(code => code.id === codeId ? { ...code, code_text: newText } : code)
      )

      alert('Delivery code updated successfully')
    } catch (error: any) {
      console.error('Error updating code:', error)
      alert('Failed to update delivery code: ' + error.message)
    }
  }

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm('Delete this delivery code? This will reduce your stock by 1.')) return

    try {
      const { error } = await supabase
        .from('delivery_codes')
        .delete()
        .eq('id', codeId)

      if (error) throw error

      // Update local state
      setDeliveryCodes(prev => prev.filter(code => code.id !== codeId))
      alert('Delivery code deleted successfully')
    } catch (error: any) {
      console.error('Error deleting code:', error)
      alert('Failed to delete delivery code: ' + error.message)
    }
  }

  const handleAddNewCodes = async () => {
    if (newCodes.length === 0) return

    // Validate all codes are filled
    const emptyIndex = newCodes.findIndex(code => !code.trim())
    if (emptyIndex !== -1) {
      setError(`New code #${emptyIndex + 1} is empty`)
      return
    }

    setSubmitting(true)
    try {
      const codeInserts = newCodes.map(code => ({
        listing_id: params.id as string,
        code_text: code.trim(),
        is_used: false
      }))

      const { error } = await supabase
        .from('delivery_codes')
        .insert(codeInserts)

      if (error) throw error

      // Refresh delivery codes
      await fetchDeliveryCodes()
      setNewCodes([])
      setShowAddCodes(false)
      alert('New delivery codes added successfully')
    } catch (error: any) {
      console.error('Error adding codes:', error)
      setError('Failed to add delivery codes: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/dashboard')
    } catch (error: any) {
      console.error('Delete error:', error)
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Listing Updated!</h2>
            <p className="text-gray-400 mb-4">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const unusedCodes = deliveryCodes.filter(code => !code.is_used)
  const usedCodes = deliveryCodes.filter(code => code.is_used)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Edit Listing</h1>
            <p className="text-gray-400">Update your listing details</p>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateListing} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Basic Info Card */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Price and Platform */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Platform</label>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '3rem'
                  }}
                >
                  <option value="active" className="bg-slate-800">Active</option>
                  <option value="sold" className="bg-slate-800">Sold</option>
                  <option value="removed" className="bg-slate-800">Removed</option>
                  <option value="out_of_stock" className="bg-slate-800">Out of Stock</option>
                </select>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-white font-semibold mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Delivery Codes Management (only for automatic delivery) */}
            {deliveryType === 'automatic' && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">Delivery Codes</h2>
                    <p className="text-sm text-gray-400">
                      Available: {unusedCodes.length} | Sold: {usedCodes.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCodes(!showAddCodes)}
                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
                  >
                    {showAddCodes ? 'Cancel' : '+ Add Codes'}
                  </button>
                </div>

                {/* Add New Codes */}
                {showAddCodes && (
                  <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Add New Delivery Codes</h3>
                    <div className="space-y-3 mb-4">
                      {newCodes.map((code, index) => (
                        <div key={index}>
                          <textarea
                            value={code}
                            onChange={(e) => {
                              const updated = [...newCodes]
                              updated[index] = e.target.value
                              setNewCodes(updated)
                            }}
                            placeholder={`New code #${index + 1}`}
                            rows={2}
                            maxLength={1000}
                            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">{code.length}/1000 characters</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCodes([...newCodes, ''])}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-semibold border border-white/10 transition"
                      >
                        + Add Another
                      </button>
                      {newCodes.length > 0 && (
                        <button
                          type="button"
                          onClick={handleAddNewCodes}
                          disabled={submitting}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          Save New Codes
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Unused Codes */}
                {unusedCodes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-3">Available Codes</h3>
                    <div className="space-y-2">
                      {unusedCodes.map((code, index) => (
                        <div key={code.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Code #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCode(code.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                          <textarea
                            value={code.code_text}
                            onChange={(e) => handleUpdateCode(code.id, e.target.value)}
                            rows={2}
                            maxLength={1000}
                            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">{code.code_text.length}/1000 characters</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Used Codes (Read-only) */}
                {usedCodes.length > 0 && (
                  <div>
                    <h3 className="text-white font-semibold mb-3">Sold Codes (Read-only)</h3>
                    <div className="space-y-2">
                      {usedCodes.map((code, index) => (
                        <div key={code.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">Sold Code #{index + 1}</span>
                            <span className="text-xs text-green-400">✓ Delivered</span>
                          </div>
                          <div className="text-sm text-gray-500 font-mono bg-black/20 rounded p-2">
                            {code.code_text.substring(0, 50)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold border border-white/10 transition text-center"
                >
                  Cancel
                </Link>
              </div>

              <button
                type="button"
                onClick={handleDeleteListing}
                className="w-full mt-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-3 rounded-lg font-semibold border border-red-500/50 transition"
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