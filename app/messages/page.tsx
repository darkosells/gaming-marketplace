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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
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

  const checkAuth = async () => {
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
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* 2D Comic Space Background */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        
        {/* Gradient Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Animated Nebula Clouds */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        
        {/* Comic-style Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f120_1px,transparent_1px),linear-gradient(to_bottom,#6366f120_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_40%,transparent_100%)]"></div>
        
        {/* Twinkling Stars - Small */}
        <div className="absolute top-[5%] left-[10%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
        <div className="absolute top-[15%] left-[20%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[8%] left-[35%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '1s' }}></div>
        <div className="absolute top-[12%] left-[55%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '0.3s' }}></div>
        <div className="absolute top-[20%] left-[70%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-[25%] left-[85%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}></div>
        <div className="absolute top-[35%] left-[5%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.2s', animationDelay: '2s' }}></div>
        <div className="absolute top-[45%] left-[92%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.2s', animationDelay: '1.2s' }}></div>
        <div className="absolute top-[55%] left-[15%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '3.8s', animationDelay: '0.7s' }}></div>
        <div className="absolute top-[65%] left-[78%] w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDuration: '2.6s', animationDelay: '1.8s' }}></div>
        
        {/* Twinkling Stars - Medium */}
        <div className="absolute top-[10%] left-[45%] w-1.5 h-1.5 bg-blue-200 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-[30%] left-[75%] w-1.5 h-1.5 bg-purple-200 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute top-[50%] left-[8%] w-1.5 h-1.5 bg-pink-200 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '2s' }}></div>
        <div className="absolute top-[70%] left-[60%] w-1.5 h-1.5 bg-cyan-200 rounded-full animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
        
        {/* Comic-style Planets */}
        {/* Planet 1 - Saturn-like with ring */}
        <div className="absolute top-[15%] right-[10%] group">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-600 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-6 border-4 border-orange-300/60 rounded-full -rotate-12"></div>
          </div>
        </div>
        
        {/* Planet 2 - Purple gas giant */}
        <div className="absolute bottom-[20%] left-[8%]">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-700 rounded-full shadow-lg relative">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/30 rounded-full"></div>
            <div className="absolute top-[30%] left-0 right-0 h-1 bg-purple-300/40 rounded-full"></div>
            <div className="absolute top-[50%] left-0 right-0 h-0.5 bg-purple-200/30 rounded-full"></div>
          </div>
        </div>
        
        {/* Planet 3 - Small blue planet */}
        <div className="absolute top-[60%] right-[5%]">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-md">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/40 rounded-full"></div>
          </div>
        </div>
        
        {/* Comic-style Moon */}
        <div className="absolute top-[40%] left-[3%]">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full shadow-md relative">
            <div className="absolute top-1 left-1 w-2 h-2 bg-gray-400/50 rounded-full"></div>
            <div className="absolute top-3 left-4 w-1.5 h-1.5 bg-gray-400/50 rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-gray-400/50 rounded-full"></div>
          </div>
        </div>
        
        {/* Shooting Stars / Comets - Slow and subtle */}
        <div className="absolute top-[20%] left-[30%]">
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-white to-white rounded-full animate-[shooting_12s_ease-in-out_infinite] opacity-30" style={{ transform: 'rotate(-45deg)' }}></div>
        </div>
        <div className="absolute top-[50%] right-[25%]">
          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-cyan-200 to-white rounded-full animate-[shooting_15s_ease-in-out_infinite] opacity-25" style={{ transform: 'rotate(-30deg)', animationDelay: '6s' }}></div>
        </div>
        
        {/* Floating Cosmic Particles */}
        <div className="absolute top-20 left-[10%] w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 left-[25%] w-1 h-1 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-60 right-[15%] w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 right-[30%] w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-80 left-[40%] w-1 h-1 bg-pink-400/70 rounded-full animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 right-[20%] w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDuration: '3.8s', animationDelay: '2.5s' }}></div>
        
        {/* Comic-style Star Bursts */}
        <div className="absolute top-[25%] left-[60%]">
          <div className="relative">
            <div className="absolute w-3 h-3 bg-yellow-300/80 rotate-45 animate-pulse" style={{ animationDuration: '2s' }}></div>
            <div className="absolute w-3 h-3 bg-yellow-300/80 animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
        <div className="absolute top-[70%] left-[40%]">
          <div className="relative">
            <div className="absolute w-2 h-2 bg-cyan-300/70 rotate-45 animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
            <div className="absolute w-2 h-2 bg-cyan-300/70 animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
          </div>
        </div>
        
        {/* Comic Speed Lines (subtle) */}
        <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[30deg]"></div>
          <div className="absolute top-[30%] right-[10%] w-40 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[-20deg]"></div>
          <div className="absolute bottom-[25%] left-[15%] w-36 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-[15deg]"></div>
        </div>
        
        {/* Constellation Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <line x1="10%" y1="15%" x2="20%" y2="8%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="20%" y1="8%" x2="35%" y2="12%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="70%" y1="20%" x2="85%" y2="25%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
          <line x1="85%" y1="25%" x2="78%" y2="35%" stroke="white" strokeWidth="1" strokeDasharray="2,4" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navigation />

        {/* Messages Content */}
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm">
                  🚀 Space Chat Center
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Messages</span>
              </h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
              {/* Conversations List */}
              <div className="lg:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300">
                <div className="p-4 border-b border-white/10 bg-slate-800/60">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-purple-400">🌌</span>
                    Conversations
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="text-5xl mb-4">🛸</div>
                      <p className="text-gray-400">No transmissions yet</p>
                      <p className="text-gray-500 text-sm mt-2">Start by contacting a seller!</p>
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
                            markConversationAsRead(conv.id)
                          }}
                          className={`w-full text-left p-4 border-b border-white/10 hover:bg-white/5 transition-all duration-300 relative group ${
                            selectedConversation?.id === conv.id ? 'bg-purple-500/20 border-l-4 border-l-purple-500' : ''
                          } ${hasUnread ? 'bg-purple-500/10' : ''}`}
                        >
                          {hasUnread && (
                            <div className="absolute top-3 right-3">
                              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center shadow-lg shadow-pink-500/30">
                                {conv.unread_count}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3">
                            {/* Product Image in conversation list */}
                            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:scale-105 transition-transform duration-300">
                              {conv.listing?.image_url ? (
                                <img src={conv.listing.image_url} alt={conv.listing.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                              )}
                              {hasUnread && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <p className="font-semibold text-white truncate">{otherUser.username}</p>
                              <p className="text-xs text-purple-400 mb-1 truncate">{conv.listing?.title || 'Unknown Item'}</p>
                              <p className={`text-xs truncate ${hasUnread ? 'text-gray-300 font-semibold' : 'text-gray-400'}`}>
                                {conv.last_message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">{new Date(conv.last_message_at).toLocaleDateString()}</p>
                                {conv.order?.status && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    conv.order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    conv.order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    conv.order.status === 'refunded' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                    conv.order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  }`}>
                                    {conv.order.status === 'completed' ? 'Completed' :
                                     conv.order.status === 'dispute_raised' ? 'Dispute' :
                                     conv.order.status === 'refunded' ? 'Refunded' :
                                     conv.order.status === 'delivered' ? 'Delivered' :
                                     conv.order.status === 'paid' ? 'Paid' :
                                     conv.order.status === 'pending' ? 'Pending' :
                                     conv.order.status === 'cancelled' ? 'Cancelled' :
                                     conv.order.status.charAt(0).toUpperCase() + conv.order.status.slice(1)}
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

              {/* Chat Area */}
              <div className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-purple-500/30 transition-all duration-300">
                {!selectedConversation ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🛸</div>
                      <p className="text-gray-400 text-lg">Select a transmission to start messaging</p>
                      <p className="text-gray-500 text-sm mt-2">Your cosmic messages will appear here</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-white/10 bg-slate-800/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            {/* Avatar in chat header */}
                            {renderAvatar(
                              selectedConversation.buyer_id === user.id 
                                ? selectedConversation.seller.avatar_url 
                                : selectedConversation.buyer.avatar_url,
                              selectedConversation.buyer_id === user.id 
                                ? selectedConversation.seller.username 
                                : selectedConversation.buyer.username,
                              'sm'
                            )}
                            {selectedConversation.buyer_id === user.id 
                              ? selectedConversation.seller.username 
                              : selectedConversation.buyer.username}
                          </h3>
                          {selectedConversation.listing ? (
                            <Link 
                              href={`/listing/${selectedConversation.listing_id}`}
                              className="text-sm text-purple-400 hover:text-purple-300 hover:underline transition flex items-center gap-1 mt-1"
                            >
                              <span>🏷️</span>
                              {selectedConversation.listing.title} →
                            </Link>
                          ) : (
                            <p className="text-sm text-gray-500 italic mt-1">⚠️ Listing no longer available</p>
                          )}
                        </div>
                        {isSeller && selectedConversation.order && selectedConversation.order.status === 'pending' && (
                          <button
                            onClick={markOrderAsDelivered}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105"
                          >
                            ✓ Mark as Delivered
                          </button>
                        )}
                        {selectedConversation.order?.status === 'completed' && (
                          <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold border border-green-500/30">
                            ✓ Delivered
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                      {messages.map((message, index) => {
                        const isOwnMessage = message.sender_id === user.id
                        const isSystemMessage = message.message_type === 'system'
                        const previousMessage = index > 0 ? messages[index - 1] : null
                        const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                        
                        // Get the other user's info for displaying their avatar
                        const otherUserInfo = isOwnMessage 
                          ? (selectedConversation.buyer_id === user.id ? selectedConversation.seller : selectedConversation.buyer)
                          : (selectedConversation.buyer_id === user.id ? selectedConversation.seller : selectedConversation.buyer)
                        
                        return (
                          <div key={message.id}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-4">
                                <div className="bg-slate-800/80 backdrop-blur-lg px-4 py-1.5 rounded-full border border-white/10">
                                  <p className="text-xs text-gray-400 font-semibold">{formatDateSeparator(message.created_at)}</p>
                                </div>
                              </div>
                            )}
                            
                            {isSystemMessage ? (
                              <div className="flex justify-center my-4">
                                <div className="max-w-[85%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-4 shadow-lg">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">🔔</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-blue-300 font-bold text-sm">System Notification</span>
                                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                                      </div>
                                      <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                      <p className="text-xs text-blue-300/60 mt-3 text-center">
                                        {new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : message.sender?.is_admin ? (
                              <div className="flex justify-center my-4">
                                <div className="max-w-[85%] bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg border border-orange-400/30 rounded-2xl p-4 shadow-lg">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">👑</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-orange-300 font-bold text-sm">{message.sender.username}</span>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-200 border border-orange-400/50">ADMIN</span>
                                      </div>
                                      <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                                      <p className="text-xs text-orange-300/60 mt-3 text-center">
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
                                <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                  <div className={`rounded-2xl px-4 py-2.5 ${
                                    isOwnMessage 
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20' 
                                      : 'bg-slate-800/80 text-white border border-white/10'
                                  }`}>
                                    <p className="text-sm break-words leading-relaxed">{message.content}</p>
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
                    <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-slate-800/60 relative">
                      {showEmojiPicker && (
                        <div className="absolute bottom-20 left-4 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl z-50">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-400 font-semibold">Quick Emojis</p>
                            <button type="button" onClick={() => setShowEmojiPicker(false)} className="text-gray-400 hover:text-white transition">✕</button>
                          </div>
                          <div className="grid grid-cols-8 gap-2">
                            {commonEmojis.map((emoji, index) => (
                              <button key={index} type="button" onClick={() => insertEmoji(emoji)} className="text-2xl hover:bg-white/10 rounded-lg p-2 transition-all duration-200 hover:scale-125">
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="px-3 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300">
                          😊
                        </button>
                        <div className="flex-1 relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a cosmic message..."
                            className="relative w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sending}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {sending ? '...' : '🚀 Send'}
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
        <footer className="bg-slate-950/80 backdrop-blur-lg border-t border-white/5 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>&copy; 2024 GameVault. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {/* Custom CSS for shooting star animation */}
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
            <div className="relative inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
          </div>
          <p className="text-white mt-6 text-lg">Loading...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}