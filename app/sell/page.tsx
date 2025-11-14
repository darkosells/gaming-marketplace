'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [category, setCategory] = useState('account')
  const [game, setGame] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [platform, setPlatform] = useState('')
  const [stock, setStock] = useState('1')
  const [imageUrl, setImageUrl] = useState('')

  const popularGames = [
    'Fortnite',
    'League of Legends',
    'Valorant',
    'Genshin Impact',
    'GTA 5',
    'Clash of Clans',
    'Roblox',
    'Minecraft',
    'CS:GO',
    'Apex Legends',
    'Call of Duty',
    'FIFA',
    'Rocket League',
    'World of Warcraft',
    'Other'
  ]

  const platforms = [
    'PC',
    'PlayStation',
    'Xbox',
    'Nintendo Switch',
    'Mobile',
    'Cross-Platform'
  ]

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // Validation
    if (!game || !title || !price) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    if (parseFloat(price) <= 0) {
      setError('Price must be greater than 0')
      setSubmitting(false)
      return
    }

    if (parseInt(stock) < 1) {
      setError('Stock must be at least 1')
      setSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .insert([
          {
            seller_id: user.id,
            category,
            game,
            title,
            description,
            price: parseFloat(price),
            platform,
            stock: parseInt(stock),
            image_url: imageUrl || null,
            status: 'active'
          }
        ])
        .select()

      if (error) throw error

      setSuccess(true)
      
      // Redirect to the new listing after 2 seconds
      setTimeout(() => {
        if (data && data[0]) {
          router.push(`/listing/${data[0].id}`)
        } else {
          router.push('/dashboard')
        }
      }, 2000)

    } catch (error: any) {
      setError(error.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
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
            <h2 className="text-2xl font-bold text-white mb-2">Listing Created!</h2>
            <p className="text-gray-400 mb-4">
              Your listing has been published successfully. Redirecting...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Create New Listing</h1>
            <p className="text-gray-400">Fill in the details to list your item for sale</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setCategory('account')}
                  className={`p-4 rounded-lg border-2 transition ${
                    category === 'account'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">🎮</div>
                  <div className="text-white font-semibold">Account</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('topup')}
                  className={`p-4 rounded-lg border-2 transition ${
                    category === 'topup'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">💰</div>
                  <div className="text-white font-semibold">Top-Up</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('key')}
                  className={`p-4 rounded-lg border-2 transition ${
                    category === 'key'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">🔑</div>
                  <div className="text-white font-semibold">Game Key</div>
                </button>
              </div>
            </div>

            {/* Game Selection */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Game <span className="text-red-400">*</span>
              </label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '3rem'
                }}
              >
                <option value="" className="bg-slate-800 text-gray-400">Select a game</option>
                {popularGames.map((g) => (
                  <option key={g} value={g} className="bg-slate-800 text-white py-2">{g}</option>
                ))}
              </select>
              {game === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter game name"
                  value={game === 'Other' ? '' : game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-2"
                />
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Rare Fortnite Account - 50+ Skins"
                required
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-400 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail. Include level, features, items included, etc."
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <p className="text-sm text-gray-400 mt-1">{description.length}/1000 characters</p>
            </div>

            {/* Price and Stock Row */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Price */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Price (USD) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-white font-semibold mb-2">
                  Stock <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="1"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Platform */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select platform (optional)</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-400 mt-1">
                Optional: Add an image URL for your listing
              </p>
            </div>

            {/* Preview */}
            {imageUrl && (
              <div className="mb-6">
                <label className="block text-white font-semibold mb-2">Preview</label>
                <div className="relative h-48 bg-white/5 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded bg-white/5 border-white/10"
                />
                <span className="ml-3 text-sm text-gray-300">
                  I confirm that this listing complies with GameVault's{' '}
                  <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                    Terms of Service
                  </Link>{' '}
                  and I have the right to sell this item
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Listing...' : 'Create Listing'}
              </button>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-semibold border border-white/10 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}