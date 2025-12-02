'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

interface Conversation {
  id: string
  listing_id: string
  order_id: string
  buyer_id: string
  seller_id: string
  last_message: string
  last_message_at: string
  listing: {
    title: string
    image_url: string
    game: string
  }
  buyer: {
    username: string
    avatar_url: string | null
  }
  seller: {
    username: string
    avatar_url: string | null
  }
  order: {
    status: string
    amount: number
  }
  unread_count?: number
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  message_type: string
  read: boolean
  image_url?: string | null
  replied_to?: string | null
  sender: {
    username: string
    is_admin: boolean
    avatar_url: string | null
  }
  reply_message?: {
    id: string
    content: string
    image_url?: string | null
    sender: {
      username: string
    }
  } | null
}

interface TypingUser {
  user_id: string
  username: string
  timestamp: number
}

// Component that uses useSearchParams
function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMobileConversations, setShowMobileConversations] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map())
  const [isTyping, setIsTyping] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [showReportSuccess, setShowReportSuccess] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [otherUserOnline, setOtherUserOnline] = useState(false)
  const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null)
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const [pendingSellerId, setPendingSellerId] = useState<string | null>(null)
  
  // NEW: Delivery code reveal states
  const [revealedDeliveryMessages, setRevealedDeliveryMessages] = useState<Set<string>>(new Set())
  const [showDeliverySecurityModal, setShowDeliverySecurityModal] = useState(false)
  const [pendingRevealMessageId, setPendingRevealMessageId] = useState<string | null>(null)
  
  // NEW: Rate limiting states
  const [messageTimestamps, setMessageTimestamps] = useState<number[]>([])
  const [conversationTimestamps, setConversationTimestamps] = useState<number[]>([])
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  
  // Rate limit constants
  const MESSAGE_COOLDOWN_MS = 1000 // 1 second between messages
  const MAX_MESSAGES_PER_MINUTE = 20
  const MAX_CONVERSATIONS_PER_HOUR = 5
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingBroadcastRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scam patterns to detect
  const scamPatterns = [
    /password/i,
    /credit card/i,
    /ssn|social security/i,
    /bank account/i,
    /routing number/i,
    /cvv|cvc/i,
    /verify.*account/i,
    /suspended.*account/i,
    /click.*here.*urgent/i,
    /won.*prize/i,
    /claim.*reward/i,
    /tax.*refund/i,
  ]

  const suspiciousLinkPatterns = [
    /bit\.ly/i,
    /tinyurl/i,
    /discord\.gg/i,
    /\.ru\//i,
    /\.tk\//i,
    /free.*nitro/i,
  ]

  // NEW: Check if message contains delivery info
  const isDeliveryMessage = (message: Message): boolean => {
    if (message.message_type !== 'system') return false
    const content = message.content || ''
    return (
      content.includes('DELIVERY INFORMATION') || 
      content.includes('DELIVERY INFO') ||
      content.includes('📦 DELIVERY') ||
      content.includes('automatically delivered') ||
      content.includes('Account Details:') ||
      content.includes('Game Key:') ||
      content.includes('Top-Up Information:') ||
      content.includes('Delivery Information:') ||
      (content.includes('delivered') && (
        content.includes('Username') || 
        content.includes('Password') || 
        content.includes('Code') ||
        content.includes('Key') ||
        content.includes('━━━')
      ))
    )
  }

  // NEW: Extract delivery content from message
  const extractDeliveryContent = (content: string): { header: string; credentials: string; footer: string } => {
    // Try to split the message into parts
    let header = ''
    let credentials = ''
    let footer = ''
    
    // Pattern 1: Look for separator lines
    const parts = content.split(/━{5,}/)
    if (parts.length >= 3) {
      header = parts[0].trim()
      credentials = parts[1].trim()
      footer = parts.slice(2).join('━━━━━━━━━━━━━━━━━━━━━━━━━').trim()
    } else if (parts.length === 2) {
      header = parts[0].trim()
      credentials = ''
      footer = parts[1].trim()
    } else {
      // Try to find credentials pattern
      const lines = content.split('\n')
      let inCredentials = false
      
      for (const line of lines) {
        if (line.includes('DELIVERY') || line.includes('📦')) {
          header += line + '\n'
          inCredentials = true
        } else if (line.includes('✅') || line.includes('⏰') || line.includes('⚠️')) {
          footer += line + '\n'
          inCredentials = false
        } else if (inCredentials && (
          line.includes('Username') || 
          line.includes('Password') || 
          line.includes('Email') ||
          line.includes('Code') ||
          line.includes('Key') ||
          line.includes(':')
        )) {
          credentials += line + '\n'
        } else if (inCredentials) {
          credentials += line + '\n'
        } else {
          header += line + '\n'
        }
      }
    }
    
    return { 
      header: header || 'Delivery Information', 
      credentials: credentials || content, 
      footer 
    }
  }

  // NEW: Log delivery access
  const logDeliveryAccess = async (messageId: string, orderId: string | null) => {
    if (!user || !selectedConversation) return
    
    try {
      await supabase.from('delivery_access_logs').insert({
        user_id: user.id,
        order_id: orderId || selectedConversation.order_id,
        conversation_id: selectedConversation.id,
        access_type: 'reveal',
        access_location: 'messenger'
      })
    } catch (err) {
      console.error('Error logging delivery access:', err)
    }
  }

  // NEW: Handle reveal button click
  const handleRevealDeliveryMessage = (messageId: string) => {
    setPendingRevealMessageId(messageId)
    setShowDeliverySecurityModal(true)
  }

  // NEW: Confirm and reveal delivery message
  const confirmAndRevealDelivery = async () => {
    if (!pendingRevealMessageId) return
    
    // Log the access
    await logDeliveryAccess(pendingRevealMessageId, selectedConversation?.order_id || null)
    
    // Add to revealed set
    setRevealedDeliveryMessages(prev => new Set(prev).add(pendingRevealMessageId))
    
    // Close modal
    setShowDeliverySecurityModal(false)
    setPendingRevealMessageId(null)
  }

  // NEW: Hide delivery message
  const hideDeliveryMessage = (messageId: string) => {
    setRevealedDeliveryMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageId)
      return newSet
    })
  }

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchUserProfile()
      
      const conversationId = searchParams.get('conversation')
      const listingId = searchParams.get('listing_id')
      const sellerId = searchParams.get('seller_id')
      
      if (conversationId) {
        openConversation(conversationId)
      } else if (listingId && sellerId) {
        setPendingListingId(listingId)
        setPendingSellerId(sellerId)
        setShowMobileConversations(false)
      }
    }
  }, [user, searchParams])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      markConversationAsRead(selectedConversation.id)
      
      // Reset revealed messages when switching conversations
      setRevealedDeliveryMessages(new Set())
      
      const otherUserId = selectedConversation.buyer_id === user.id 
        ? selectedConversation.seller_id 
        : selectedConversation.buyer_id
      
      const cleanupTracking = trackUserOnlineStatus(otherUserId)
      
      const messagesChannel = supabase
        .channel(`conversation-${selectedConversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            fetchMessages()
            markConversationAsRead(selectedConversation.id)
            fetchConversations()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, read: payload.new.read } : msg
              )
            )
          }
        )
        .subscribe()

      const typingChannel = supabase
        .channel(`typing-${selectedConversation.id}`)
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.user_id !== user.id) {
            setTypingUsers(prev => {
              const newMap = new Map(prev)
              newMap.set(payload.user_id, {
                user_id: payload.user_id,
                username: payload.username,
                timestamp: Date.now()
              })
              return newMap
            })

            setTimeout(() => {
              setTypingUsers(prev => {
                const newMap = new Map(prev)
                newMap.delete(payload.user_id)
                return newMap
              })
            }, 3000)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(messagesChannel)
        supabase.removeChannel(typingChannel)
        if (cleanupTracking) {
          cleanupTracking.then(cleanup => cleanup && cleanup())
        }
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (newMessage && selectedConversation && userProfile) {
      const now = Date.now()
      if (now - lastTypingBroadcastRef.current > 2000) {
        broadcastTyping()
        lastTypingBroadcastRef.current = now
      }

      if (!isTyping) {
        setIsTyping(true)
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 3000)
    } else {
      setIsTyping(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [newMessage])

  const broadcastTyping = async () => {
    if (!selectedConversation || !userProfile) return

    const channel = supabase.channel(`typing-${selectedConversation.id}`)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user.id,
        username: userProfile.username
      }
    })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const shouldShowDateSeparator = (currentMsg: Message, previousMsg: Message | null) => {
    if (!previousMsg) return true
    const currentDate = new Date(currentMsg.created_at)
    const previousDate = new Date(previousMsg.created_at)
    return currentDate.toDateString() !== previousDate.toDateString()
  }

  const formatDateSeparator = (date: string) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      })
    }
  }

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎮', '🔥', '✨', '🎉', '👋', '🙌', '💯', '✅', '❌', '🤔', '😎', '🥳']

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
    setLoading(false)
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', user.id)
            .eq('read', false)

          return { ...conv, unread_count: count || 0 }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const markConversationAsRead = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
        .eq('read', false)

      if (error) throw error

      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      )

      window.dispatchEvent(new Event('messages-read'))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const openConversation = async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    if (conv) {
      setSelectedConversation(conv)
      setShowMobileConversations(false)
      await markConversationAsRead(conversationId)
      
      const otherUserId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id
      trackUserOnlineStatus(otherUserId)
    } else {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            listing:listings(title, image_url, game),
            buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
            seller:profiles!conversations_seller_id_fkey(username, avatar_url),
            order:orders(status, amount)
          `)
          .eq('id', conversationId)
          .single()

        if (error) throw error
        setSelectedConversation(data)
        setShowMobileConversations(false)
        await markConversationAsRead(conversationId)
        
        const otherUserId = data.buyer_id === user.id ? data.seller_id : data.buyer_id
        trackUserOnlineStatus(otherUserId)
      } catch (error) {
        console.error('Error opening conversation:', error)
      }
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *, 
          sender:profiles!messages_sender_id_fkey(username, is_admin, avatar_url)
        `)
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      const messagesWithReplies = await Promise.all(
        (data || []).map(async (message) => {
          if (message.replied_to) {
            const { data: replyData } = await supabase
              .from('messages')
              .select('id, content, image_url, sender:profiles!messages_sender_id_fkey(username)')
              .eq('id', message.replied_to)
              .single()
            
            return { ...message, reply_message: replyData }
          }
          return { ...message, reply_message: null }
        })
      )
      
      setMessages(messagesWithReplies)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const trackUserOnlineStatus = async (userId: string) => {
    if (!userId) return
    
    try {
      const checkOnlineStatus = async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('last_seen')
          .eq('id', userId)
          .single()

        if (profileData?.last_seen) {
          const lastSeen = new Date(profileData.last_seen)
          const now = new Date()
          const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
          
          const isOnline = diffMinutes < 3
          setOtherUserOnline(isOnline)
          setOtherUserLastSeen(profileData.last_seen)
        } else {
          setOtherUserOnline(false)
          setOtherUserLastSeen(null)
        }
      }

      await checkOnlineStatus()
      const interval = setInterval(checkOnlineStatus, 10000)

      return () => {
        clearInterval(interval)
      }
    } catch (error) {
      console.error('Error tracking user status:', error)
      setOtherUserOnline(false)
    }
  }

  useEffect(() => {
    if (!user) return

    const updateLastSeen = async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id)
    }

    updateLastSeen()
    const interval = setInterval(updateLastSeen, 60000)

    return () => clearInterval(interval)
  }, [user])

  const formatLastSeen = (lastSeenDate: string | null): string => {
    if (!lastSeenDate) return 'Last seen recently'
    
    const lastSeen = new Date(lastSeenDate)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Active now'
    if (diffMinutes < 60) return `Last active ${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `Last active ${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Last active yesterday'
    if (diffDays < 7) return `Last active ${diffDays}d ago`
    
    return 'Last active long ago'
  }

  const detectScamPattern = (text: string): string | null => {
    for (const pattern of scamPatterns) {
      if (pattern.test(text)) {
        return 'This message contains potentially sensitive information'
      }
    }
    
    for (const pattern of suspiciousLinkPatterns) {
      if (pattern.test(text)) {
        return 'This message contains a suspicious link'
      }
    }
    
    return null
  }

  // NEW: Rate limiting check for messages
  const checkMessageRateLimit = (): { allowed: boolean; error?: string } => {
    const now = Date.now()
    
    // Clean up old timestamps (older than 1 minute)
    const recentTimestamps = messageTimestamps.filter(ts => now - ts < 60000)
    
    // Check cooldown (1 second between messages)
    if (recentTimestamps.length > 0) {
      const lastMessageTime = recentTimestamps[recentTimestamps.length - 1]
      if (now - lastMessageTime < MESSAGE_COOLDOWN_MS) {
        return { allowed: false, error: 'Please wait a moment before sending another message' }
      }
    }
    
    // Check messages per minute limit
    if (recentTimestamps.length >= MAX_MESSAGES_PER_MINUTE) {
      return { allowed: false, error: 'Too many messages. Please wait a minute before sending more.' }
    }
    
    return { allowed: true }
  }

  // NEW: Record message timestamp
  const recordMessageSent = () => {
    const now = Date.now()
    setMessageTimestamps(prev => {
      // Keep only timestamps from last minute
      const recent = prev.filter(ts => now - ts < 60000)
      return [...recent, now]
    })
  }

  // NEW: Rate limiting check for conversation creation
  const checkConversationRateLimit = (): { allowed: boolean; error?: string } => {
    const now = Date.now()
    
    // Clean up old timestamps (older than 1 hour)
    const recentTimestamps = conversationTimestamps.filter(ts => now - ts < 3600000)
    
    // Check conversations per hour limit
    if (recentTimestamps.length >= MAX_CONVERSATIONS_PER_HOUR) {
      const oldestTimestamp = recentTimestamps[0]
      const minutesUntilReset = Math.ceil((3600000 - (now - oldestTimestamp)) / 60000)
      return { 
        allowed: false, 
        error: `Too many new conversations. Please wait ${minutesUntilReset} minutes before starting another.` 
      }
    }
    
    return { allowed: true }
  }

  // NEW: Record conversation creation timestamp
  const recordConversationCreated = () => {
    const now = Date.now()
    setConversationTimestamps(prev => {
      // Keep only timestamps from last hour
      const recent = prev.filter(ts => now - ts < 3600000)
      return [...recent, now]
    })
  }

  // NEW: Clear rate limit error after delay
  useEffect(() => {
    if (rateLimitError) {
      const timer = setTimeout(() => setRateLimitError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [rateLimitError])

  const checkImageForSensitiveContent = (file: File): boolean => {
    const filename = file.name.toLowerCase()
    const sensitiveKeywords = ['password', 'ssn', 'license', 'card', 'bank', 'id']
    
    return sensitiveKeywords.some(keyword => filename.includes(keyword))
  }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          const MAX_WIDTH = 1920
          const MAX_HEIGHT = 1920
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to compress image'))
              }
            },
            'image/jpeg',
            0.8
          )
        }
      }
      reader.onerror = reject
    })
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Only image files (JPG, PNG, GIF, WEBP) are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    if (checkImageForSensitiveContent(file)) {
      setShowSecurityWarning(true)
    }

    setSelectedImage(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null

    try {
      const compressedBlob = await compressImage(selectedImage)
      
      const fileExt = selectedImage.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `messages/${fileName}`

      const { data, error } = await supabase.storage
        .from('message-images')
        .upload(filePath, compressedBlob, {
          contentType: selectedImage.type,
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || sending) return

    if (pendingListingId && pendingSellerId && !selectedConversation) {
      await createConversationAndSendMessage()
      return
    }

    if (!selectedConversation) return

    // NEW: Check rate limit
    const rateLimitCheck = checkMessageRateLimit()
    if (!rateLimitCheck.allowed) {
      setRateLimitError(rateLimitCheck.error || 'Rate limit exceeded')
      return
    }

    const scamWarning = detectScamPattern(newMessage)
    if (scamWarning) {
      const confirmed = confirm(`⚠️ Security Warning: ${scamWarning}\n\nAre you sure you want to send this message?`)
      if (!confirmed) return
    }

    setSending(true)
    setIsTyping(false)
    
    try {
      const receiverId = selectedConversation.buyer_id === user.id 
        ? selectedConversation.seller_id 
        : selectedConversation.buyer_id

      let imageUrl: string | null = null
      if (selectedImage) {
        setUploadingImage(true)
        imageUrl = await uploadImage()
        setUploadingImage(false)
        
        if (!imageUrl) {
          alert('Failed to upload image')
          setSending(false)
          return
        }
      }

      const messageContent = newMessage.trim() || (imageUrl ? '📷 Image' : '')

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: receiverId,
          listing_id: selectedConversation.listing_id,
          order_id: selectedConversation.order_id,
          content: messageContent,
          message_type: 'user',
          image_url: imageUrl,
          replied_to: replyingTo?.id || null,
          read: false
        })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({
          last_message: messageContent,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id)

      // NEW: Record successful message for rate limiting
      recordMessageSent()

      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      setShowSecurityWarning(false)
      setReplyingTo(null)
      fetchMessages()
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
      setUploadingImage(false)
    }
  }

  const createConversationAndSendMessage = async () => {
    if (!pendingListingId || !pendingSellerId) return

    // NEW: Check conversation rate limit
    const convRateLimitCheck = checkConversationRateLimit()
    if (!convRateLimitCheck.allowed) {
      setRateLimitError(convRateLimitCheck.error || 'Rate limit exceeded')
      return
    }

    // NEW: Check message rate limit
    const msgRateLimitCheck = checkMessageRateLimit()
    if (!msgRateLimitCheck.allowed) {
      setRateLimitError(msgRateLimitCheck.error || 'Rate limit exceeded')
      return
    }

    const scamWarning = detectScamPattern(newMessage)
    if (scamWarning) {
      const confirmed = confirm(`⚠️ Security Warning: ${scamWarning}\n\nAre you sure you want to send this message?`)
      if (!confirmed) return
    }

    setSending(true)
    setIsTyping(false)

    try {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          listing_id: pendingListingId,
          buyer_id: user.id,
          seller_id: pendingSellerId,
          last_message: newMessage.trim() || '📷 Image',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (convError) throw convError

      let imageUrl: string | null = null
      if (selectedImage) {
        setUploadingImage(true)
        imageUrl = await uploadImage()
        setUploadingImage(false)
        
        if (!imageUrl) {
          alert('Failed to upload image')
          setSending(false)
          return
        }
      }

      const messageContent = newMessage.trim() || (imageUrl ? '📷 Image' : '')

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          receiver_id: pendingSellerId,
          listing_id: pendingListingId,
          content: messageContent,
          message_type: 'user',
          image_url: imageUrl,
          replied_to: replyingTo?.id || null,
          read: false
        })

      if (msgError) throw msgError

      // NEW: Record successful conversation and message for rate limiting
      recordConversationCreated()
      recordMessageSent()

      setPendingListingId(null)
      setPendingSellerId(null)
      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      setShowSecurityWarning(false)
      setReplyingTo(null)

      await fetchConversations()
      await openConversation(newConv.id)
      
      router.push(`/messages?conversation=${newConv.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert('Failed to create conversation')
    } finally {
      setSending(false)
      setUploadingImage(false)
    }
  }

  const markOrderAsDelivered = async () => {
    if (!selectedConversation?.order_id) return
    const confirmed = confirm('Mark this order as delivered? The buyer will be notified.')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', selectedConversation.order_id)

      if (error) throw error
      alert('Order marked as delivered!')
      fetchConversations()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    }
  }

  const handleReportUser = () => {
    setShowReportModal(true)
  }

  const submitReport = async () => {
    if (!reportReason.trim() || !selectedConversation) return

    const otherUserId = selectedConversation.buyer_id === user.id 
      ? selectedConversation.seller_id 
      : selectedConversation.buyer_id

    setSubmittingReport(true)
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reported_user_id: otherUserId,
          reported_by: user.id,
          conversation_id: selectedConversation.id,
          reason: reportReason.trim(),
          status: 'pending'
        })

      if (error) throw error

      setShowReportModal(false)
      setReportReason('')
      setShowReportSuccess(true)
      
      setTimeout(() => {
        setShowReportSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  const isSeller = selectedConversation?.seller_id === user?.id

  const renderAvatar = (avatarUrl: string | null, username: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base'
    }
    
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white font-semibold">
            {username.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    )
  }

  const renderMessageStatus = (message: Message) => {
    if (message.sender_id !== user.id) return null
    if (message.message_type === 'system') return null

    const isRead = message.read

    return (
      <div className="flex items-center gap-0.5 ml-1">
        {isRead ? (
          <>
            <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <svg className="w-3.5 h-3.5 text-blue-400 -ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    )
  }

  const renderTypingIndicator = () => {
    const typingUsersList = Array.from(typingUsers.values())
    if (typingUsersList.length === 0) return null

    const typingUsername = typingUsersList[0].username

    return (
      <div className="flex gap-2 mb-2 justify-start">
        <div className="mt-1">
          {renderAvatar(
            (selectedConversation?.buyer_id === user.id 
              ? selectedConversation?.seller.avatar_url 
              : selectedConversation?.buyer.avatar_url) || null,
            typingUsername,
            'sm'
          )}
        </div>
        <div className="max-w-[70%] items-start flex flex-col">
          <div className="rounded-2xl px-4 py-2.5 bg-slate-800/80 border border-white/10">
            <div className="flex items-center gap-1">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1 px-2">{typingUsername} is typing...</p>
        </div>
      </div>
    )
  }

  // NEW: Render delivery message with blur/reveal
  const renderDeliveryMessage = (message: Message) => {
    const isRevealed = revealedDeliveryMessages.has(message.id)
    const { header, credentials, footer } = extractDeliveryContent(message.content)
    
    return (
      <div className="flex justify-center my-3 sm:my-4">
        <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 backdrop-blur-lg border-2 border-green-400/50 rounded-2xl p-3 sm:p-4 shadow-lg">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">🔑</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-green-300 font-bold text-xs sm:text-sm">Delivery Information</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                </div>
                {/* Reveal/Hide buttons */}
                <div className="flex items-center gap-2">
                  {isRevealed ? (
                    <button
                      onClick={() => hideDeliveryMessage(message.id)}
                      className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-xs font-medium text-green-300 hover:bg-green-500/30 transition-all flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                      Hide
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRevealDeliveryMessage(message.id)}
                      className="px-3 py-1 bg-green-500/30 border border-green-500/50 rounded-lg text-xs font-medium text-white hover:bg-green-500/40 transition-all flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Reveal
                    </button>
                  )}
                </div>
              </div>
              
              {/* Content area */}
              {isRevealed ? (
                <div className="space-y-2">
                  {/* Header */}
                  {header && (
                    <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {header}
                    </div>
                  )}
                  
                  {/* Credentials - shown when revealed */}
                  <div className="bg-slate-900/80 border border-green-500/30 rounded-lg p-3">
                    <pre className="text-white font-mono text-xs sm:text-sm whitespace-pre-wrap break-all leading-relaxed select-all">
                      {credentials}
                    </pre>
                  </div>
                  
                  {/* Footer */}
                  {footer && (
                    <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {footer}
                    </div>
                  )}
                  
                  {/* Security reminder */}
                  <div className="mt-2 pt-2 border-t border-green-500/20">
                    <p className="text-xs text-green-400/70 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Access logged for security
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header - always visible */}
                  {header && (
                    <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words opacity-80">
                      {header.split('\n').slice(0, 2).join('\n')}
                    </div>
                  )}
                  
                  {/* Blurred/hidden credentials */}
                  <div className="bg-slate-900/80 border border-white/10 rounded-lg p-3 relative overflow-hidden">
                    <div className="blur-sm select-none pointer-events-none">
                      <p className="text-white font-mono text-xs sm:text-sm">
                        ••••••••••••••••••••<br/>
                        ••••••••••••••••<br/>
                        ••••••••••
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="flex items-center gap-2 text-white">
                        <span className="text-2xl">🔒</span>
                        <span className="text-xs font-medium">Click "Reveal" to show</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Warning when hidden */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                    <p className="text-xs text-orange-300 flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Only reveal when ready to use. Action will be logged.
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-green-300/60 mt-2 sm:mt-3 text-center">
                {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
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
            <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* NEW: Delivery Security Warning Modal */}
        {showDeliverySecurityModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-orange-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                  <span className="text-3xl">🔐</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-400">Security Notice</h3>
                  <p className="text-sm text-gray-400">Reveal Delivery Information</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                  <p className="text-orange-200 text-sm leading-relaxed">
                    <strong className="text-orange-300">⚠️ Important:</strong> Only reveal when you're ready to use this information. For your security, this action is logged.
                  </p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <p className="text-gray-300 text-sm">Keep credentials private</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <p className="text-gray-300 text-sm">Test immediately to verify</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">✕</span>
                    <p className="text-gray-300 text-sm">Never share with anyone</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>This reveal will be logged for security purposes</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={confirmAndRevealDelivery}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                >
                  🔓 I Understand, Reveal
                </button>
                <button 
                  onClick={() => {
                    setShowDeliverySecurityModal(false)
                    setPendingRevealMessageId(null)
                  }}
                  className="flex-1 bg-white/5 text-white py-3 rounded-xl font-bold border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Warning Banner */}
        {showSecurityWarning && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto px-4">
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl border border-orange-400/30 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-orange-300 font-bold text-sm mb-1">Security Warning</h3>
                  <p className="text-white text-xs leading-relaxed mb-3">
                    This image filename suggests it may contain sensitive information. Never share passwords, credit cards, IDs, or personal documents.
                  </p>
                  <button
                    onClick={() => setShowSecurityWarning(false)}
                    className="text-xs text-orange-300 hover:text-orange-200 font-semibold"
                  >
                    I understand →
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowSecurityWarning(false)
                    setSelectedImage(null)
                    setImagePreview(null)
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Success Message */}
        {showReportSuccess && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md mx-auto px-4">
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-400/30 rounded-2xl p-4 shadow-2xl animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">✓</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-green-300 font-bold text-sm mb-1">Report Submitted</h3>
                  <p className="text-white text-xs leading-relaxed">
                    Thank you for your report. Our team will review it shortly and take appropriate action.
                  </p>
                </div>
                <button
                  onClick={() => setShowReportSuccess(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🚨</span>
                  Report User
                </h3>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">
                Help us keep Nashflare safe. Tell us why you're reporting this user.
              </p>
              
              <div className="space-y-3 mb-4">
                {['Scam or fraud', 'Inappropriate content', 'Harassment', 'Spam', 'Other'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setReportReason(reason)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      reportReason === reason
                        ? 'bg-purple-500/20 border-purple-500/50 text-white'
                        : 'bg-slate-800/50 border-white/10 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason('')
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reportReason || submittingReport}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:shadow-lg hover:shadow-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && modalImageUrl && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold"
              >
                ✕
              </button>
              <img
                src={modalImageUrl}
                alt="Full size"
                className="w-full h-auto rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

        {/* Messages Content */}
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-4 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6">
              <div className="inline-block mb-3 sm:mb-4">
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium backdrop-blur-sm">
                  🚀 Space Chat Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Messages</span>
              </h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-180px)] sm:h-[calc(100vh-220px)]">
              {/* Conversations List */}
              <div className={`${
                showMobileConversations ? 'block' : 'hidden lg:block'
              } lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
                <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400">🌌</span>
                    Conversations
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto relative">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="text-4xl sm:text-5xl mb-4">🛸</div>
                      <p className="text-gray-400 text-sm sm:text-base">No transmissions yet</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Start by contacting a seller!</p>
                    </div>
                  ) : (
                    <>
                      {conversations.map((conv) => {
                      const otherUser = conv.buyer_id === user.id ? conv.seller : conv.buyer
                      const hasUnread = (conv.unread_count || 0) > 0
                      
                      return (
                        <button
                          key={conv.id}
                          onClick={() => {
                            setSelectedConversation(conv)
                            setShowMobileConversations(false)
                            markConversationAsRead(conv.id)
                          }}
                          className={`w-full text-left p-3 sm:p-4 border-b border-white/10 hover:bg-white/5 transition-all duration-300 relative group ${
                            selectedConversation?.id === conv.id ? 'bg-purple-500/20 border-l-4 border-l-purple-500' : ''
                          } ${hasUnread ? 'bg-purple-500/10' : ''}`}
                        >
                          {hasUnread && (
                            <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full min-w-[20px] text-center shadow-lg shadow-pink-500/30">
                                {conv.unread_count}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-105 transition-transform duration-300">
                              {conv.listing?.image_url ? (
                                <img src={conv.listing.image_url} alt={conv.listing.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">🎮</div>
                              )}
                              {hasUnread && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-6 sm:pr-8">
                              <p className="font-semibold text-white truncate text-sm sm:text-base">{otherUser.username}</p>
                              <p className="text-xs text-purple-400 mb-1 truncate">{conv.listing?.title || 'Unknown Item'}</p>
                              <p className={`text-xs truncate ${hasUnread ? 'text-gray-300 font-semibold' : 'text-gray-400'}`}>
                                {conv.last_message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{new Date(conv.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                {conv.order?.status && (
                                  <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${
                                    conv.order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    conv.order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    conv.order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    conv.order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                    {conv.order.status === 'completed' ? 'Done' :
                                     conv.order.status === 'dispute_raised' ? 'Dispute' :
                                     conv.order.status === 'delivered' ? 'Delivered' :
                                     conv.order.status === 'paid' ? 'Paid' : 'Pending'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    </>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className={`${
                !showMobileConversations ? 'block' : 'hidden lg:block'
              } lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
                {!selectedConversation && !pendingListingId ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl mb-4">🛸</div>
                      <p className="text-gray-400 text-base sm:text-lg">Select a transmission to start messaging</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Your cosmic messages will appear here</p>
                    </div>
                  </div>
                ) : pendingListingId && !selectedConversation ? (
                  <>
                    {/* New Conversation Placeholder */}
                    <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowMobileConversations(true)
                            setPendingListingId(null)
                            setPendingSellerId(null)
                            router.push('/messages')
                          }}
                          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-base sm:text-lg">New Conversation</h3>
                          <p className="text-xs text-gray-400">Send a message to start the conversation</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 sm:px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-blue-300 flex items-center gap-2">
                          <span>🛡️</span>
                          <span>Never share passwords, credit cards, or personal documents. Nashflare staff will never ask for this info.</span>
                        </p>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-xs text-blue-300 font-semibold">Protected by SSL</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-4">
                      <div className="text-center max-w-md">
                        <div className="text-5xl sm:text-6xl mb-4">💬</div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Start a Conversation</h3>
                        <p className="text-gray-400 text-sm sm:text-base mb-4">
                          Type your message below to start chatting with the seller about this listing.
                        </p>
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                          <p className="text-xs text-purple-300">
                            💡 <strong>Tip:</strong> Be clear about what you're interested in and ask any questions you have about the product.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Message Input for new conversation */}
                    <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-slate-800/60 relative">
                      {imagePreview && (
                        <div className="mb-3 relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border-2 border-purple-500/50" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null)
                              setSelectedImage(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-2 sm:gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 sm:px-3 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex-shrink-0 text-base sm:text-lg"
                          title="Upload image"
                        >
                          📷
                        </button>
                        
                        <div className="flex-1 relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your first message..."
                            className="relative w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 text-sm sm:text-base"
                        >
                          {uploadingImage ? '📤' : sending ? '...' : <span className="hidden sm:inline">🚀 Send</span>}<span className="inline sm:hidden">🚀</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setShowMobileConversations(true)}
                          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                            <div className="relative">
                              {renderAvatar(
                                (selectedConversation.buyer_id === user.id 
                                  ? selectedConversation.seller.avatar_url 
                                  : selectedConversation.buyer.avatar_url) || null,
                                selectedConversation.buyer_id === user.id 
                                  ? selectedConversation.seller.username 
                                  : selectedConversation.buyer.username,
                                'sm'
                              )}
                              {otherUserOnline && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="truncate">
                                {selectedConversation.buyer_id === user.id 
                                  ? selectedConversation.seller.username 
                                  : selectedConversation.buyer.username}
                              </span>
                              <span className="text-xs font-normal text-gray-400">
                                {otherUserOnline ? (
                                  <span className="text-green-400 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                    Active now
                                  </span>
                                ) : (
                                  formatLastSeen(otherUserLastSeen)
                                )}
                              </span>
                            </div>
                          </h3>
                          {selectedConversation.listing ? (
                            <Link 
                              href={`/listing/${selectedConversation.listing_id}`}
                              className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 hover:underline transition flex items-center gap-1 mt-1 truncate"
                            >
                              <span>🏷️</span>
                              <span className="truncate">{selectedConversation.listing.title} →</span>
                            </Link>
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-500 italic mt-1">⚠️ Listing no longer available</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleReportUser}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group"
                            title="Report user"
                          >
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </button>
                          
                          {isSeller && selectedConversation.order && selectedConversation.order.status === 'pending' && (
                            <button
                              onClick={markOrderAsDelivered}
                              className="hidden sm:block bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 hover:scale-105 whitespace-nowrap"
                            >
                              ✓ Mark Delivered
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Security Info Banner */}
                    <div className="px-3 sm:px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-blue-300 flex items-center gap-2">
                          <span>🛡️</span>
                          <span>Never share passwords, credit cards, or personal documents. Nashflare staff will never ask for this info.</span>
                        </p>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-xs text-blue-300 font-semibold">Protected by SSL</span>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_id === user.id
                        const isSystemMessage = message.message_type === 'system'
                        const previousMessage = index > 0 ? messages[index - 1] : null
                        const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                        const hasScamPattern = detectScamPattern(message.content)
                        const isDelivery = isDeliveryMessage(message)
                        
                        return (
                          <div key={message.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-3 sm:my-4">
                                <div className="bg-slate-800/80 backdrop-blur-lg px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/10">
                                  <p className="text-xs text-gray-400 font-semibold">{formatDateSeparator(message.created_at)}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* UPDATED: Delivery messages with blur/reveal */}
                            {isSystemMessage && isDelivery ? (
                              renderDeliveryMessage(message)
                            ) : isSystemMessage ? (
                              <div className="flex justify-center my-3 sm:my-4">
                                <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-3 sm:p-4 shadow-lg">
                                  <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-base sm:text-xl">🔔</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-blue-300 font-bold text-xs sm:text-sm">System Notification</span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                      </div>
                                      <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</div>
                                      <p className="text-xs text-blue-300/60 mt-2 sm:mt-3 text-center">
                                        {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : message.sender?.is_admin ? (
                              <div className="flex justify-center my-3 sm:my-4">
                                <div className="max-w-[90%] sm:max-w-[85%] bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-400/30 rounded-2xl p-3 sm:p-4 shadow-lg">
                                  <div className="flex items-start gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-base sm:text-xl">👑</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-orange-300 font-bold text-xs sm:text-sm">{message.sender.username}</span>
                                        <span className="px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 border border-orange-400/50">ADMIN</span>
                                      </div>
                                      <div className="text-white text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</div>
                                      <p className="text-xs text-orange-300/60 mt-2 sm:mt-3 text-center">
                                        {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`flex gap-2 mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                {!isOwnMessage && (
                                  <div className="mt-1">
                                    {renderAvatar(message.sender.avatar_url, message.sender.username, 'sm')}
                                  </div>
                                )}
                                <div className={`max-w-[75%] sm:max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                  {hasScamPattern && !isOwnMessage && (
                                    <div className="mb-1 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
                                      <p className="text-xs text-red-300 flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>{hasScamPattern}</span>
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                                    isOwnMessage 
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                                      : 'bg-slate-800/80 text-white border border-white/10'
                                  } ${hasScamPattern && !isOwnMessage ? 'border-red-500/50' : ''} group relative`}>
                                    {message.reply_message && (
                                      <div className="mb-2 pb-2 border-b border-white/20">
                                        <div className="flex items-start gap-2 bg-black/20 rounded-lg p-2">
                                          <div className="w-1 bg-white/40 rounded-full"></div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold opacity-80">{message.reply_message.sender.username}</p>
                                            {message.reply_message.image_url ? (
                                              <p className="text-xs opacity-70 truncate">📷 Image</p>
                                            ) : (
                                              <p className="text-xs opacity-70 truncate">{message.reply_message.content}</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {message.image_url && (
                                      <div className="mb-2">
                                        <img
                                          src={message.image_url}
                                          alt="Shared image"
                                          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition"
                                          onClick={() => {
                                            setModalImageUrl(message.image_url!)
                                            setShowImageModal(true)
                                          }}
                                        />
                                      </div>
                                    )}
                                    {message.content && message.content !== '📷 Image' && (
                                      <p className="text-xs sm:text-sm break-words leading-relaxed">{message.content}</p>
                                    )}
                                    
                                    <button
                                      onClick={() => setReplyingTo(message)}
                                      className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 rounded-full p-1.5"
                                      title="Reply"
                                    >
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                    </button>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1 px-2">
                                    <p className="text-xs text-gray-500">
                                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {renderMessageStatus(message)}
                                  </div>
                                </div>
                                {isOwnMessage && (
                                  <div className="mt-1">
                                    {renderAvatar(userProfile?.avatar_url || null, userProfile?.username || user.email?.charAt(0) || 'U', 'sm')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {renderTypingIndicator()}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-slate-800/60 relative">
                      {replyingTo && (
                        <div className="mb-3 bg-slate-700/50 border border-white/10 rounded-xl p-3 flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span className="text-xs text-purple-300 font-semibold">Replying to {replyingTo.sender.username}</span>
                            </div>
                            {replyingTo.image_url ? (
                              <p className="text-xs text-gray-400 truncate">📷 Image</p>
                            ) : (
                              <p className="text-xs text-gray-400 truncate">{replyingTo.content}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-400 hover:text-white flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      {imagePreview && (
                        <div className="mb-3 relative inline-block">
                          <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border-2 border-purple-500/50" />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null)
                              setSelectedImage(null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      
                      {showEmojiPicker && (
                        <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 sm:p-4 shadow-2xl z-50 max-w-[calc(100%-1rem)]">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <p className="text-xs sm:text-sm text-gray-400 font-semibold">Quick Emojis</p>
                            <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white transition text-lg">✕</button>
                          </div>
                          <div className="grid grid-cols-8 gap-1 sm:gap-2 max-h-[200px] overflow-y-auto">
                            {commonEmojis.map((emoji, index) => (
                              <button key={index} type="button" onClick={() => insertEmoji(emoji)} className="text-xl sm:text-2xl hover:bg-white/10 rounded-lg p-1.5 sm:p-2 transition-all duration-200 hover:scale-125">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NEW: Rate limit error message */}
                      {rateLimitError && (
                        <div className="mb-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                          <p className="text-red-400 text-xs flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {rateLimitError}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 sm:gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2 sm:px-3 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex-shrink-0 text-base sm:text-lg"
                          title="Upload image"
                        >
                          📷
                        </button>
                        
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="px-2 sm:px-3 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex-shrink-0 text-base sm:text-lg">
                          😊
                        </button>
                        <div className="flex-1 relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value.slice(0, 2000))}
                            maxLength={2000}
                            placeholder="Type a message..."
                            className="relative w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          />
                          {/* Character counter - shows when approaching limit */}
                          {newMessage.length > 1800 && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${newMessage.length >= 2000 ? 'text-red-400' : 'text-yellow-400'}`}>
                              {newMessage.length}/2000
                            </span>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 text-sm sm:text-base"
                        >
                          {uploadingImage ? '📤' : sending ? '...' : <span className="hidden sm:inline">🚀 Send</span>}<span className="inline sm:hidden">🚀</span>
                        </button>
                      </div>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-6 sm:py-8 mt-8 sm:mt-12">
          <div className="container mx-auto px-3 sm:px-4 text-center text-gray-500 text-xs sm:text-sm">
            <p>&copy; 2025 Nashflare. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes shooting {
          0%, 100% { opacity: 0; transform: translateX(0) rotate(-45deg); }
          50% { opacity: 0.6; transform: translateX(100px) rotate(-45deg); }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

// Main component wrapped with Suspense
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-pulse"></div>
        </div>
        <div className="relative z-10 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
            <div className="relative inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-4 sm:mt-6 text-base sm:text-lg">Loading...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}