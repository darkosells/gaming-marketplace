// app/listing/[id]/edit/page.tsx - MODERNIZED EDIT LISTING WITH TAGS, VALIDATION & GAME-SPECIFIC FILTERS

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ImageUploader from '@/components/ImageUploader'

// Custom Modal Component
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type: 'alert' | 'confirm'
  confirmText?: string
  cancelText?: string
}

function CustomModal({ isOpen, onClose, onConfirm, title, message, type, confirmText = 'OK', cancelText = 'Cancel' }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={type === 'alert' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-purple-500/20 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {type === 'confirm' ? (
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white text-center mb-2">{title}</h3>
        
        {/* Message */}
        <p className="text-gray-300 text-center mb-6">{message}</p>
        
        {/* Buttons */}
        <div className={`flex gap-3 ${type === 'alert' ? 'justify-center' : 'justify-center'}`}>
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-gray-300 rounded-xl font-semibold transition-all duration-300 border border-white/10 hover:border-white/20"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (type === 'confirm' && onConfirm) {
                onConfirm()
              }
              onClose()
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              type === 'confirm'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/30'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  // Items category games - no platform
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

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: 'alert' | 'confirm'
    title: string
    message: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  })

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
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearchQuery, setTagSearchQuery] = useState('')

  // Game-specific fields
  const [valorantRegion, setValorantRegion] = useState('')
  const [valorantRank, setValorantRank] = useState('')
  const [lolServer, setLolServer] = useState('')

  // Helper functions for modal
  const showAlert = (title: string, message: string) => {
    setModal({
      isOpen: true,
      type: 'alert',
      title,
      message
    })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      onConfirm
    })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchListing()
    }
  }, [user])

  // Reset game and game-specific fields if category changes
  useEffect(() => {
    if (listing && category !== listing.category) {
      const validGames = categoryGamesMap[category] || []
      if (!validGames.includes(game)) {
        setGame('')
        setPlatform('')
        setValorantRegion('')
        setValorantRank('')
        setLolServer('')
      }
    }
  }, [category])

  // Reset tags and game-specific fields when game changes
  useEffect(() => {
    if (listing && (category !== listing.category || game !== listing.game)) {
      setSelectedTags([])
      setTagSearchQuery('')
      setPlatform('')
      setValorantRegion('')
      setValorantRank('')
      setLolServer('')
    }
  }, [category, game])

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
        showAlert('Access Denied', 'You do not have permission to edit this listing')
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
      setDeliveryType(data.delivery_type === 'instant' ? 'automatic' : 'manual')
      
      // Load existing tags
      if (data.tags && Array.isArray(data.tags)) {
        setSelectedTags(data.tags)
      }

      // Load game-specific fields
      setValorantRegion(data.region || '')
      setValorantRank(data.rank || '')
      setLolServer(data.server || '')

      // Handle images - support both old single image and new array
      if (data.image_urls && data.image_urls.length > 0) {
        setImageUrls(data.image_urls)
      } else if (data.image_url) {
        setImageUrls([data.image_url])
      } else {
        setImageUrls([])
      }

      // Fetch delivery codes if automatic
      if (data.delivery_type === 'instant' || data.delivery_type === 'automatic') {
        await fetchDeliveryCodes()
      }
    } catch (error: any) {
      console.error('Error fetching listing:', error)
      showAlert('Error', 'Failed to load listing')
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
    showConfirm(
      'Delete Delivery Code',
      'Are you sure you want to delete this delivery code? This action cannot be undone.',
      async () => {
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

          showAlert('Success', 'Delivery code deleted successfully!')
          await fetchDeliveryCodes()
        } catch (error: any) {
          console.error('Error deleting code:', error)
          showAlert('Error', 'Failed to delete delivery code: ' + error.message)
        }
      }
    )
  }

  const handleUpdateExistingCode = async (codeId: string, newText: string) => {
    if (!newText.trim()) {
      showAlert('Validation Error', 'Code text cannot be empty')
      return
    }

    try {
      const { error } = await supabase
        .from('delivery_codes')
        .update({ code_text: newText })
        .eq('id', codeId)

      if (error) throw error

      showAlert('Success', 'Delivery code updated successfully!')
      await fetchDeliveryCodes()
    } catch (error: any) {
      console.error('Error updating code:', error)
      showAlert('Error', 'Failed to update delivery code: ' + error.message)
    }
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

    if (!title || !game || !description || !price) {
      showAlert('Validation Error', 'Please fill in all required fields')
      return
    }

    // Validate platform only if required for the selected game
    if (shouldShowPlatformField() && !platform) {
      showAlert('Validation Error', 'Please select a platform')
      return
    }

    // Validate Valorant-specific fields
    if (game === 'Valorant' && (!valorantRegion || !valorantRank)) {
      showAlert('Validation Error', 'Please select Region and Rank for Valorant listings')
      return
    }

    // Validate LoL-specific fields
    if (game === 'League of Legends' && !lolServer) {
      showAlert('Validation Error', 'Please select a Server for League of Legends listings')
      return
    }

    if (title.length < 10) {
      showAlert('Validation Error', 'Title must be at least 10 characters long')
      return
    }

    if (description.length < 20) {
      showAlert('Validation Error', 'Description must be at least 20 characters long')
      return
    }

    // Check if selected game is valid for category
    const validGames = categoryGamesMap[category] || []
    if (!validGames.includes(game)) {
      showAlert('Validation Error', `"${game}" is not a valid game for the ${getCategoryLabel(category)} category. Please select a valid game.`)
      return
    }

    if (deliveryType === 'manual' && !stock) {
      showAlert('Validation Error', 'Please enter stock quantity')
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

      // Build update data
      const updateData: any = {
        title,
        game,
        category,
        description,
        price: parseFloat(price),
        platform: shouldShowPlatformField() ? platform : null,
        stock: finalStock,
        status: newStatus,
        image_url: imageUrls[0] || null, // Keep for backward compatibility
        image_urls: imageUrls, // New array field
        delivery_type: deliveryType === 'automatic' ? 'instant' : 'manual',
        tags: selectedTags.length > 0 ? selectedTags : null
      }

      // Add Valorant-specific fields
      if (game === 'Valorant') {
        updateData.region = valorantRegion
        updateData.rank = valorantRank
      } else {
        updateData.region = null
        updateData.rank = null
      }

      // Add LoL-specific fields
      if (game === 'League of Legends') {
        updateData.server = lolServer
      } else {
        updateData.server = null
      }

      // Update listing
      const { error: listingError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', params.id)

      if (listingError) throw listingError

      // Reset new codes and refresh
      if (deliveryType === 'automatic') {
        setNewCodes([''])
        await fetchDeliveryCodes()
      }

      showAlert('Success', 'Listing updated successfully!')
      // Navigate after modal closes
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Error updating listing:', error)
      showAlert('Error', 'Failed to update listing: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    showConfirm(
      'Remove Listing',
      'Are you sure you want to remove this listing? This will hide it from the marketplace but preserve order history.',
      async () => {
        try {
          // Always use soft delete (set status to 'removed') to avoid foreign key issues
          const { error } = await supabase
            .from('listings')
            .update({ status: 'removed' })
            .eq('id', params.id)

          if (error) throw error

          showAlert('Success', 'Listing removed successfully! It has been hidden from the marketplace.')
          // Navigate after modal closes
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } catch (error: any) {
          console.error('Error removing listing:', error)
          showAlert('Error', 'Failed to remove listing: ' + error.message)
        }
      }
    )
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
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.type === 'confirm' ? 'Yes, Continue' : 'OK'}
        cancelText="Cancel"
      />

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
              <p className="text-gray-400">Update your listing details, images, tags, and delivery codes</p>
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
                    <label className="block text-white mb-2 font-semibold">
                      Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
                      placeholder="Epic Fortnite Account - Level 200"
                      required
                      minLength={10}
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      {title.length}/100 characters
                      {title.length > 0 && title.length < 10 && (
                        <span className="text-orange-400 ml-2">• Minimum 10 characters required</span>
                      )}
                    </p>
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

                  {/* Platform Selection - Only show for games that have platforms */}
                  {shouldShowPlatformField() && (
                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        Platform <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value)}
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
                        <option value="">Select a platform</option>
                        {getAvailablePlatforms()?.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Valorant-specific fields */}
                  {game === 'Valorant' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Region */}
                      <div>
                        <label className="block text-white mb-2 font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Region <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={valorantRegion}
                          onChange={(e) => setValorantRegion(e.target.value)}
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
                          <option value="">Select a region</option>
                          {valorantRegions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rank */}
                      <div>
                        <label className="block text-white mb-2 font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Rank <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={valorantRank}
                          onChange={(e) => setValorantRank(e.target.value)}
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
                          <option value="">Select a rank</option>
                          {valorantRanks.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* League of Legends-specific fields */}
                  {game === 'League of Legends' && (
                    <div>
                      <label className="block text-white mb-2 font-semibold flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                        Server <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={lolServer}
                        onChange={(e) => setLolServer(e.target.value)}
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
                        <option value="">Select a server</option>
                        {lolServers.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tags Selection - Only for Accounts and Items */}
                  {shouldShowTags() && (
                    <div>
                      <label className="block text-white mb-2 font-semibold">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Tags <span className="text-gray-400 text-sm font-normal ml-2">(Optional - helps buyers find your listing)</span>
                        </div>
                      </label>
                      
                      {/* Tag Search */}
                      <div className="relative mb-3">
                        <input
                          type="text"
                          value={tagSearchQuery}
                          onChange={(e) => setTagSearchQuery(e.target.value)}
                          placeholder="Search tags..."
                          className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>

                      {/* Selected Tags Display */}
                      {selectedTags.length > 0 && (
                        <div className="mb-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
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
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm text-purple-300 transition group"
                              >
                                <span>{tag}</span>
                                <svg className="w-3.5 h-3.5 group-hover:text-red-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Available Tags */}
                      <div className="bg-slate-800 border border-white/10 rounded-xl p-4 max-h-60 overflow-y-auto">
                        <p className="text-sm text-gray-400 mb-3">Click to select tags:</p>
                        {getAvailableTags().length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {getAvailableTags().map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  selectedTags.includes(tag)
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-700/50 text-gray-300 border border-white/10 hover:border-purple-500/30 hover:bg-slate-700/80'
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

                  <div>
                    <label className="block text-white mb-2 font-semibold">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 h-32 transition"
                      placeholder="Describe your item..."
                      required
                      minLength={20}
                    />
                    <p className="text-sm text-gray-400 mt-2">
                      {description.length}/1000 characters
                      {description.length > 0 && description.length < 20 && (
                        <span className="text-orange-400 ml-2">• Minimum 20 characters required</span>
                      )}
                    </p>
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

                    {/* Stock - only show for manual delivery */}
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
                        <div className="text-4xl mb-3">📦</div>
                        <div className="text-white font-bold mb-2">Manual Delivery</div>
                        <div className="text-sm text-gray-400">You manually deliver after payment (up to 48h)</div>
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
                        <div className="text-white font-bold mb-2">Instant Delivery</div>
                        <div className="text-sm text-gray-400">Instant delivery with codes</div>
                      </button>
                    </div>
                  </div>

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

                  {/* Add New Codes Section */}
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
        <Footer />
      </div>
    </div>
  )
}