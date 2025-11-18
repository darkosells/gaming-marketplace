'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

export default function CreateListingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [createdListingId, setCreatedListingId] = useState<string | null>(null)

  // Form fields
  const [category, setCategory] = useState('account')
  const [game, setGame] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [platform, setPlatform] = useState('')
  const [stock, setStock] = useState('1')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  
  // Delivery fields
  const [deliveryType, setDeliveryType] = useState<'manual' | 'automatic'>('manual')
  const [deliveryCodes, setDeliveryCodes] = useState<string[]>([''])

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

  // Reset game when category changes
  useEffect(() => {
    setGame('')
  }, [category])

  // Update delivery codes array when stock changes
  useEffect(() => {
    if (deliveryType === 'automatic') {
      const stockNum = parseInt(stock) || 1
      setDeliveryCodes(prevCodes => {
        const newCodes = [...prevCodes]
        while (newCodes.length < stockNum) {
          newCodes.push('')
        }
        while (newCodes.length > stockNum) {
          newCodes.pop()
        }
        return newCodes
      })
    }
  }, [stock, deliveryType])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const handleDeliveryCodeChange = (index: number, value: string) => {
    const newCodes = [...deliveryCodes]
    newCodes[index] = value
    setDeliveryCodes(newCodes)
  }

  const handleImagesChange = (urls: string[]) => {
    setImageUrls(urls)
  }

  const getAvailableGames = () => {
    return categoryGamesMap[category] || []
  }

  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'account': return '🎮'
      case 'items': return '🎒'
      case 'currency': return '💰'
      case 'key': return '🔑'
      default: return '📦'
    }
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'account': return 'Account'
      case 'items': return 'Items'
      case 'currency': return 'Currency'
      case 'key': return 'Game Key'
      default: return cat
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

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

    if (deliveryType === 'automatic') {
      const emptyCodeIndex = deliveryCodes.findIndex(code => !code.trim())
      if (emptyCodeIndex !== -1) {
        setError(`Delivery code #${emptyCodeIndex + 1} is empty. All delivery codes must be filled for automatic delivery.`)
        setSubmitting(false)
        return
      }

      if (deliveryCodes.length !== parseInt(stock)) {
        setError('Number of delivery codes must match stock quantity')
        setSubmitting(false)
        return
      }
    }

    try {
      const { data: listingData, error: listingError } = await supabase
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
            image_url: imageUrls[0] || null,
            image_urls: imageUrls,
            status: 'active',
            delivery_type: deliveryType
          }
        ])
        .select()
        .single()

      if (listingError) throw listingError

      if (deliveryType === 'automatic' && listingData) {
        const codeInserts = deliveryCodes.map(code => ({
          listing_id: listingData.id,
          code_text: code.trim(),
          is_used: false
        }))

        const { error: codesError } = await supabase
          .from('delivery_codes')
          .insert(codeInserts)

        if (codesError) {
          await supabase.from('listings').delete().eq('id', listingData.id)
          throw new Error('Failed to save delivery codes: ' + codesError.message)
        }
      }

      setCreatedListingId(listingData?.id || null)
      setSuccess(true)
      
      setTimeout(() => {
        if (listingData) {
          router.push(`/listing/${listingData.id}`)
        } else {
          router.push('/dashboard')
        }
      }, 2000)

    } catch (error: any) {
      console.error('Create listing error:', error)
      setError(error.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        {/* Cosmic Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center px-4">
        {/* Cosmic Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Listing Created!</h2>
            <p className="text-gray-300 mb-2">Your listing has been published successfully</p>
            <p className="text-gray-400 text-sm">Redirecting to your listing...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Navigation */}
      <Navigation />

      {/* Performance-Optimized Cosmic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950"></div>
        
        {/* Animated gradient orbs - only 3 for performance */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '5s' }}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        
        {/* Floating particles - reduced to 5 */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              top: `${20 + i * 15}%`,
              left: `${10 + i * 20}%`,
              animation: `float ${4 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 mb-6 group transition-colors"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-2">Create New Listing</h1>
                <p className="text-gray-300 text-lg">List your gaming item for sale on Nashflare</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-10 shadow-2xl">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Category Selection */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-4">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { key: 'account', emoji: '🎮', label: 'Accounts' },
                  { key: 'items', emoji: '🎒', label: 'Items' },
                  { key: 'currency', emoji: '💰', label: 'Currency' },
                  { key: 'key', emoji: '🔑', label: 'Game Keys' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 ${
                      category === cat.key
                        ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/30'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-4xl mb-3">{cat.emoji}</div>
                    <div className="text-white font-semibold">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Selection */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-2">
                Game <span className="text-red-400">*</span>
              </label>
              <p className="text-sm text-gray-400 mb-3">
                {getCategoryEmoji(category)} {getAvailableGames().length} games available for {getCategoryLabel(category)}
              </p>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1.25rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '3.5rem'
                }}
              >
                <option value="" className="bg-slate-900 text-gray-400">Select a game...</option>
                {getAvailableGames().map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white py-2">{g}</option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-2">
                Listing Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  category === 'account' ? 'e.g., Rare Fortnite Account - 50+ Skins' :
                  category === 'items' ? 'e.g., Legendary Pet Bundle - Adopt me' :
                  category === 'currency' ? 'e.g., 10,000 Robux - Instant Delivery' :
                  'e.g., Steam Gift Card $50 Value'
                }
                required
                maxLength={100}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <p className="text-sm text-gray-400 mt-2">{title.length}/100 characters</p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail. Include level, features, items included, condition, etc."
                rows={6}
                maxLength={1000}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
              />
              <p className="text-sm text-gray-400 mt-2">{description.length}/1000 characters</p>
            </div>

            {/* Price and Stock Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-white font-bold text-lg mb-2">
                  Price (USD) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-semibold">$</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full pl-10 pr-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold text-lg mb-2">
                  Stock Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="1"
                  required
                  min="1"
                  className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Platform */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none cursor-pointer transition-all"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1.25rem center',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '3.5rem'
                }}
              >
                <option value="">Select platform (optional)</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Delivery Type */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-4">
                Delivery Type <span className="text-red-400">*</span>
              </label>
              <div className="grid lg:grid-cols-2 gap-5">
                <button
                  type="button"
                  onClick={() => setDeliveryType('manual')}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    deliveryType === 'manual'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/30'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-4xl mb-3">👤</div>
                  <div className="text-white font-bold text-lg mb-2">Manual Delivery</div>
                  <div className="text-sm text-gray-400">You manually send account details after payment confirmation</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryType('automatic')
                    const stockNum = parseInt(stock) || 1
                    setDeliveryCodes(new Array(stockNum).fill(''))
                  }}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    deliveryType === 'automatic'
                      ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-pink-500/20 shadow-lg shadow-purple-500/30'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="text-4xl mb-3">⚡</div>
                  <div className="text-white font-bold text-lg mb-2">Automatic Delivery</div>
                  <div className="text-sm text-gray-400">System auto-sends details via messenger immediately after payment</div>
                </button>
              </div>
            </div>

            {/* Delivery Codes */}
            {deliveryType === 'automatic' && (
              <div className="mb-8">
                <label className="block text-white font-bold text-lg mb-2">
                  Delivery Codes/Instructions <span className="text-red-400">*</span>
                </label>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-200">
                      Provide one delivery code/instruction for each item in stock. These will be automatically sent to buyers via messenger after payment is confirmed.
                    </p>
                  </div>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {deliveryCodes.map((code, index) => (
                    <div key={index} className="bg-slate-900/50 border border-white/10 rounded-xl p-5">
                      <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center space-x-2">
                        <span className="w-6 h-6 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400 text-xs">
                          {index + 1}
                        </span>
                        <span>Item #{index + 1}</span>
                      </label>
                      <textarea
                        value={code}
                        onChange={(e) => handleDeliveryCodeChange(index, e.target.value)}
                        placeholder="e.g., Username: player123 | Password: abc123xyz | Email: user@example.com"
                        required
                        rows={3}
                        maxLength={1000}
                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-2">{code.length}/1000 characters</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-4">
                Images
              </label>
              {user && (
                <ImageUploader
                  userId={user.id}
                  listingId="new"
                  existingImages={imageUrls}
                  onImagesChange={handleImagesChange}
                  maxImages={3}
                />
              )}
            </div>

            {/* Terms */}
            <div className="mb-8">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-5 h-5 rounded bg-slate-900/50 border-white/10 text-purple-500 focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  I confirm that this listing complies with Nashflare's{' '}
                  <Link href="/terms" className="text-purple-400 hover:text-purple-300 font-semibold">
                    Terms of Service
                  </Link>{' '}
                  and I have the legal right to sell this item
                </span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Listing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Listing</span>
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-lg border border-white/10 transition-all text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Custom Float Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px); 
          }
          50% { 
            transform: translateY(-20px); 
          }
        }
      `}</style>
    </div>
  )
}