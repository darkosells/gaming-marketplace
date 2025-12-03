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

// Game-specific platform options (null means no platform selection needed)
const gamePlatformsMap: { [key: string]: string[] | null } = {
  'GTA 5': ['PC', 'Playstation 4', 'Playstation 5', 'Xbox X/S', 'Xbox One'],
  'Fortnite': ['PC', 'Playstation', 'Xbox', 'Switch', 'Android', 'iOS'],
  'Roblox': null,
  'Valorant': ['PC', 'Playstation', 'Xbox'],
  'League of Legends': null,
  'Clash Royale': null,
  'Clash of Clans': null,
  'Steam': null,
  // Items category games
  'Steal a Brainrot': null,
  'Grow a Garden': null,
  'Adopt me': null,
  'Blox Fruits': null,
  'Plants vs Brainrots': null,
}

// Valorant-specific options
const valorantRegions = ['NA', 'EU/TR/MENA/CIS', 'LATAM', 'Brazil', 'AP', 'KR']
const valorantRanks = ['Ranked Ready', 'Unranked', 'Radiant', 'Immortal', 'Ascendant', 'Diamond', 'Gold']

// League of Legends-specific options
const lolServers = ['Europe Nordic & East', 'Europe West', 'North America', 'Brazil']

// Tags for each game in Account category
const accountGameTags: { [key: string]: string[] } = {
  'Fortnite': ['Renegade Raider', 'Travis Scott', 'Black Knight', 'Take The L', 'Omega', 'Elite Agent', 'Blue Squire', 'Floss', 'IKONIK', 'Galaxy', 'Wonder', 'Reaper', 'Leviathan Axe', 'Mako', 'Lara Croft', 'Glow', 'Sparkle Specialist', 'Royale Knight', 'Peely', 'Deadpool', 'Havoc', 'Skull Trooper', 'Ghoul Trooper', 'STW', 'Midas', 'Wildcat'],
  'GTA 5': ['High Level', 'Modded Account', 'Billions', 'Modded Outfits', 'Modded Cars', 'All Unlocks', 'Max Stats', 'Male', 'Female', 'Fast Run', 'Arena Workshop', 'Nightclub'],
  'Valorant': ['Radiant', 'Immortal', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Skins', 'Champions Bundle', 'Protocol 781-A', 'Prime Collection', 'Elderflame'],
  'Roblox': ['High RAP', 'Limiteds', 'Headless', 'Dominus', 'Korblox', 'Valkyrie', 'Sparkle Time Fedora', 'OG Account'],
  'League of Legends': ['Challenger', 'Grandmaster', 'Master', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze', 'PAX Skins', 'Championship Riven', 'Black Alistar', 'Silver Kayle'],
  'Clash Royale': ['Level 14 King Tower', 'Max Cards', 'Champion Cards', 'Legendary Cards', 'High Trophy', 'Arena 15+'],
  'Clash of Clans': ['TH15', 'TH14', 'TH13', 'Max Heroes', 'Max Walls', 'High Trophies', 'Clan War League'],
  'Steam': ['High Level', 'Rare Games', 'VAC-Free', 'Prime Status', 'Trading Cards', 'Badges']
}

// Tags for each game in Items category
const itemsGameTags: { [key: string]: string[] } = {
  'Steal a Brainrot': ['Rare Items', 'Limited Edition', 'Event Items', 'Collectibles'],
  'Grow a Garden': ['Seeds', 'Tools', 'Decorations', 'Rare Plants'],
  'Adopt me': ['Legendary Pets', 'Neon Pets', 'Mega Neon', 'Vehicles', 'Toys', 'Gifts'],
  'Blox Fruits': ['Legendary Fruits', 'Mythical Fruits', 'Swords', 'Fighting Styles', 'Accessories'],
  'Plants vs Brainrots': ['Premium Plants', 'Power-ups', 'Coins', 'Gems']
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
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  
  // Game-specific fields
  const [valorantRegion, setValorantRegion] = useState('')
  const [valorantRank, setValorantRank] = useState('')
  const [lolServer, setLolServer] = useState('')
  
  // Delivery fields
  const [deliveryType, setDeliveryType] = useState<'manual' | 'automatic'>('manual')
  const [deliveryCodes, setDeliveryCodes] = useState<string[]>([''])

  useEffect(() => {
    checkAuth()
  }, [])

  // Reset game, tags, and game-specific fields when category changes
  useEffect(() => {
    setGame('')
    setSelectedTags([])
    setTagSearchQuery('')
    setPlatform('')
    setValorantRegion('')
    setValorantRank('')
    setLolServer('')
  }, [category])

  // Reset tags and game-specific fields when game changes
  useEffect(() => {
    setSelectedTags([])
    setTagSearchQuery('')
    setPlatform('')
    setValorantRegion('')
    setValorantRank('')
    setLolServer('')
  }, [game])

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

  const getAvailablePlatforms = () => {
    if (!game) return null
    return gamePlatformsMap[game] || null
  }

  const shouldShowPlatformField = () => {
    const platforms = getAvailablePlatforms()
    return platforms !== null && platforms.length > 0
  }

  // Get available tags based on selected category and game
  const getAvailableTags = () => {
    // Only show tags for Account and Items categories
    if (category !== 'account' && category !== 'items') {
      return []
    }

    if (!game) {
      return []
    }

    const tags = category === 'account' 
      ? accountGameTags[game] || []
      : itemsGameTags[game] || []

    // Filter tags based on search query
    if (tagSearchQuery) {
      return tags.filter(tag => 
        tag.toLowerCase().includes(tagSearchQuery.toLowerCase())
      )
    }

    return tags
  }

  const shouldShowTags = () => {
    return (category === 'account' || category === 'items') && game
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
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

    // Validate required fields
    if (!game || !title || !description || !price) {
      setError('Please fill in all required fields')
      setSubmitting(false)
      return
    }

    // Validate platform only if required for the selected game
    if (shouldShowPlatformField() && !platform) {
      setError('Please select a platform')
      setSubmitting(false)
      return
    }

    // Validate Valorant-specific fields
    if (game === 'Valorant' && (!valorantRegion || !valorantRank)) {
      setError('Please select Region and Rank for Valorant listings')
      setSubmitting(false)
      return
    }

    // Validate LoL-specific fields
    if (game === 'League of Legends' && !lolServer) {
      setError('Please select a Server for League of Legends listings')
      setSubmitting(false)
      return
    }

    if (title.length < 10) {
      setError('Title must be at least 10 characters long')
      setSubmitting(false)
      return
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters long')
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
      console.log('=== STARTING LISTING CREATION ===')
      console.log('User ID:', user.id)
      
      const insertData: any = {
        seller_id: user.id,
        category,
        game,
        title,
        description,
        price: parseFloat(price),
        platform: shouldShowPlatformField() ? platform : null,
        stock: parseInt(stock),
        image_url: imageUrls[0] || null,
        image_urls: imageUrls,
        status: 'active',
        delivery_type: deliveryType,
        tags: selectedTags.length > 0 ? selectedTags : null
      }

      // Add Valorant-specific fields
      if (game === 'Valorant') {
        insertData.region = valorantRegion
        insertData.rank = valorantRank
      }

      // Add LoL-specific fields
      if (game === 'League of Legends') {
        insertData.server = lolServer
      }
      
      console.log('Data to insert:', insertData)

      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .insert([insertData])
        .select()
        .single()

      console.log('=== SUPABASE RESPONSE ===')
      console.log('Data:', listingData)
      console.log('Error:', listingError)
      
      if (listingError) {
        console.error('=== LISTING ERROR DETAILS ===')
        console.error('Message:', listingError.message)
        console.error('Details:', listingError.details)
        console.error('Hint:', listingError.hint)
        console.error('Code:', listingError.code)
        throw new Error(listingError.message || 'Database error occurred')
      }

      if (deliveryType === 'automatic' && listingData) {
        console.log('=== INSERTING DELIVERY CODES ===')
        const codeInserts = deliveryCodes.map(code => ({
          listing_id: listingData.id,
          code_text: code.trim(),
          is_used: false
        }))
        
        console.log('Delivery codes to insert:', codeInserts)

        const { error: codesError } = await supabase
          .from('delivery_codes')
          .insert(codeInserts)

        if (codesError) {
          console.error('=== DELIVERY CODES ERROR ===')
          console.error('Message:', codesError.message)
          console.error('Details:', codesError.details)
          await supabase.from('listings').delete().eq('id', listingData.id)
          throw new Error('Failed to save delivery codes: ' + codesError.message)
        }
        
        console.log('Delivery codes inserted successfully')
      }

      console.log('=== LISTING CREATED SUCCESSFULLY ===')
      console.log('Listing ID:', listingData?.id)
      
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
      console.error('=== CATCH BLOCK ERROR ===')
      console.error('Full error object:', error)
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      
      const errorMessage = error?.message || 'Failed to create listing. Check browser console for details.'
      setError(errorMessage)
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

            {/* Platform Selection - Only show for games that have platforms */}
            {shouldShowPlatformField() && (
              <div className="mb-8">
                <label className="block text-white font-bold text-lg mb-2">
                  Platform <span className="text-red-400">*</span>
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
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
                  <option value="">Select a platform...</option>
                  {getAvailablePlatforms()?.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Valorant-specific fields */}
            {game === 'Valorant' && (
              <div className="mb-8 grid lg:grid-cols-2 gap-6">
                {/* Region */}
                <div>
                  <label className="block text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Region <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={valorantRegion}
                    onChange={(e) => setValorantRegion(e.target.value)}
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
                    <option value="">Select a region...</option>
                    {valorantRegions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Rank */}
                <div>
                  <label className="block text-white font-bold text-lg mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Rank <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={valorantRank}
                    onChange={(e) => setValorantRank(e.target.value)}
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
                    <option value="">Select a rank...</option>
                    {valorantRanks.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* League of Legends-specific fields */}
            {game === 'League of Legends' && (
              <div className="mb-8">
                <label className="block text-white font-bold text-lg mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  Server <span className="text-red-400">*</span>
                </label>
                <select
                  value={lolServer}
                  onChange={(e) => setLolServer(e.target.value)}
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
                  <option value="">Select a server...</option>
                  {lolServers.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags Selection - Only for Accounts and Items */}
            {shouldShowTags() && (
              <div className="mb-8">
                <label className="block text-white font-bold text-lg mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Tags <span className="text-gray-400 text-sm font-normal ml-2">(Optional - helps buyers find your listing)</span>
                  </div>
                </label>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-200">
                      Select relevant tags to help buyers find your listing when filtering. Choose all that apply to your {category === 'account' ? 'account' : 'items'}.
                    </p>
                  </div>
                </div>

                {/* Tag Search */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={tagSearchQuery}
                    onChange={(e) => setTagSearchQuery(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full px-5 py-3 pl-12 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Selected Tags Display */}
                {selectedTags.length > 0 && (
                  <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">Selected Tags ({selectedTags.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="text-xs text-purple-400 hover:text-purple-300 transition font-medium"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition group"
                        >
                          <span>{tag}</span>
                          <svg className="w-4 h-4 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Tags */}
                <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4 max-h-80 overflow-y-auto">
                  <p className="text-sm text-gray-400 mb-3">Click to select tags:</p>
                  {getAvailableTags().length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getAvailableTags().map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            selectedTags.includes(tag)
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                              : 'bg-slate-800/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:bg-slate-800/80'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">
                      {tagSearchQuery ? 'No tags found matching your search' : 'No tags available for this game'}
                    </p>
                  )}
                </div>
              </div>
            )}

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
                minLength={10}
                maxLength={100}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <p className="text-sm text-gray-400 mt-2">
                {title.length}/100 characters
                {title.length > 0 && title.length < 10 && (
                  <span className="text-orange-400 ml-2">• Minimum 10 characters required</span>
                )}
              </p>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-white font-bold text-lg mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item in detail. Include level, features, items included, condition, etc."
                rows={6}
                required
                minLength={20}
                maxLength={1000}
                className="w-full px-5 py-4 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
              />
              <p className="text-sm text-gray-400 mt-2">
                {description.length}/1000 characters
                {description.length > 0 && description.length < 20 && (
                  <span className="text-orange-400 ml-2">• Minimum 20 characters required</span>
                )}
              </p>
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
                  <div className="text-4xl mb-3">📦</div>
                  <div className="text-white font-bold text-lg mb-2">Manual Delivery</div>
                  <div className="text-sm text-gray-400">You manually send account details after payment confirmation (up to 48h)</div>
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
                  <div className="text-white font-bold text-lg mb-2">Instant Delivery</div>
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