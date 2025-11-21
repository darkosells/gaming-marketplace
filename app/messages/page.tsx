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
  content: string
  created_at: string
  message_type: string
  read: boolean
  sender: {
    username: string
    is_admin: boolean
    avatar_url: string | null
  }
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchUserProfile()
      
      const conversationId = searchParams.get('conversation')
      if (conversationId) {
        openConversation(conversationId)
      }
    }
  }, [user, searchParams])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      markConversationAsRead(selectedConversation.id)
      
      const channel = supabase
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
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      setShowMobileConversations(false) // Hide conversations list on mobile
      await markConversationAsRead(conversationId)
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
        .select(`*, sender:profiles!messages_sender_id_fkey(username, is_admin, avatar_url)`)
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const receiverId = selectedConversation.buyer_id === user.id 
        ? selectedConversation.seller_id 
        : selectedConversation.buyer_id

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: receiverId,
          listing_id: selectedConversation.listing_id,
          order_id: selectedConversation.order_id,
          content: newMessage.trim(),
          message_type: 'user',
          read: false
        })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({
          last_message: newMessage.trim(),
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id)

      setNewMessage('')
      fetchMessages()
      fetchConversations()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
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

  const isSeller = selectedConversation?.seller_id === user?.id

  // Helper function to render avatar
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
      {/* Background - keeping same as original */}
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
              {/* Conversations List - Hidden on mobile when chat is open */}
              <div className={`${
                showMobileConversations ? 'block' : 'hidden lg:block'
              } lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
                <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400">🌌</span>
                    Conversations
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 px-4">
                      <div className="text-4xl sm:text-5xl mb-4">🛸</div>
                      <p className="text-gray-400 text-sm sm:text-base">No transmissions yet</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Start by contacting a seller!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
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
                    })
                  )}
                </div>
              </div>

              {/* Chat Area - Hidden on mobile when conversations list is shown */}
              <div className={`${
                !showMobileConversations ? 'block' : 'hidden lg:block'
              } lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300`}>
                {!selectedConversation ? (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl mb-4">🛸</div>
                      <p className="text-gray-400 text-base sm:text-lg">Select a transmission to start messaging</p>
                      <p className="text-gray-500 text-xs sm:text-sm mt-2">Your cosmic messages will appear here</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-3 sm:p-4 border-b border-white/10 bg-slate-800/60">
                      <div className="flex items-center justify-between gap-2">
                        {/* Mobile Back Button */}
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
                            {renderAvatar(
                              selectedConversation.buyer_id === user.id 
                                ? selectedConversation.seller.avatar_url 
                                : selectedConversation.buyer.avatar_url,
                              selectedConversation.buyer_id === user.id 
                                ? selectedConversation.seller.username 
                                : selectedConversation.buyer.username,
                              'sm'
                            )}
                            <span className="truncate">
                              {selectedConversation.buyer_id === user.id 
                                ? selectedConversation.seller.username 
                                : selectedConversation.buyer.username}
                            </span>
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

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_id === user.id
                        const isSystemMessage = message.message_type === 'system'
                        const previousMessage = index > 0 ? messages[index - 1] : null
                        const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                        
                        return (
                          <div key={message.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-3 sm:my-4">
                                <div className="bg-slate-800/80 backdrop-blur-lg px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/10">
                                  <p className="text-xs text-gray-400 font-semibold">{formatDateSeparator(message.created_at)}</p>
                                </div>
                              </div>
                            )}
                            
                            {isSystemMessage ? (
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
                                  <div className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                                    isOwnMessage 
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                                      : 'bg-slate-800/80 text-white border border-white/10'
                                  }`}>
                                    <p className="text-xs sm:text-sm break-words leading-relaxed">{message.content}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 px-2">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
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
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-white/10 bg-slate-800/60 relative">
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
                      
                      <div className="flex gap-2 sm:gap-3">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="px-2 sm:px-3 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 flex-shrink-0 text-base sm:text-lg">
                          😊
                        </button>
                        <div className="flex-1 relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="relative w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sending}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0 text-sm sm:text-base"
                        >
                          {sending ? '...' : <span className="hidden sm:inline">🚀 Send</span>}<span className="inline sm:hidden">🚀</span>
                        </button>
                      </div>
                    </form>
                  </>
                )}
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