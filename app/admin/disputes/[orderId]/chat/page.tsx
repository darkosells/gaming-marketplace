// app/admin/disputes/[orderId]/chat/page.tsx - ADMIN DISPUTE CHAT (3-WAY)

'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  message_type: string
  sender: {
    username: string
    is_admin: boolean
  }
}

export default function AdminDisputeChat() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🎮', '🔥', '✨', '🎉', '👋', '🙌', '💯', '✅', '❌', '🤔', '😎', '🥳']

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      fetchOrder()
    }
  }, [profile])

  useEffect(() => {
    if (conversation) {
      fetchMessages()
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`admin-dispute-chat-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          () => {
            fetchMessages()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [conversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData?.is_admin) {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    }
  }

  const fetchOrder = async () => {
    try {
      // First fetch the order with snapshot data (no joins needed for listing)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(id, username),
          seller:profiles!orders_seller_id_fkey(id, username)
        `)
        .eq('id', params.orderId)
        .single()

      if (orderError) {
        console.error('Order fetch error:', orderError.message, orderError.details, orderError.hint)
        throw orderError
      }
      
      console.log('Order fetched:', orderData)
      setOrder(orderData)

      // Get conversation for this order (use limit 1 to handle any duplicates)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('order_id', params.orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (convError) {
        console.error('Conversation fetch error:', convError.message, convError.details, convError.hint)
        // No conversation exists - this shouldn't happen for a dispute
        alert('No conversation found for this order. The order may not have an associated chat yet.')
        router.push('/admin')
        return
      }
      
      console.log('Conversation fetched:', convData)
      setConversation(convData)
    } catch (error: any) {
      console.error('Error fetching order:', error.message || error)
    }
  }

  const fetchMessages = async () => {
    if (!conversation) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, is_admin)
        `)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation || sending) return

    setSending(true)

    try {
      // Determine receiver - admin messages go to both buyer and seller
      // We'll send to buyer by default, but the conversation shows all messages
      const receiverId = order.buyer_id

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: profile.id,
          receiver_id: receiverId,
          listing_id: conversation.listing_id,
          order_id: conversation.order_id,
          content: newMessage.trim(),
          message_type: 'user'
        })

      if (error) throw error

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: `Admin: ${newMessage.trim().substring(0, 50)}`,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversation.id)

      setNewMessage('')
      setShowEmojiPicker(false)
      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
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

  if (loading || !order || !conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-xl">Loading dispute chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <span className="text-xl font-bold text-white">Admin - Dispute Chat</span>
            </Link>

            <Link 
              href="/admin"
              className="text-gray-300 hover:text-white transition flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Admin Participation Notice */}
          <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-orange-400 font-bold">Admin Participant Mode</h3>
                <p className="text-orange-200 text-sm">You are participating in this dispute chat. Your messages will be visible to both buyer and seller with an "ADMIN" badge.</p>
              </div>
            </div>
          </div>

          {/* Dispute Info */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-bold text-white">Dispute Details</h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                ACTIVE DISPUTE
              </span>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-400">Order ID</p>
                <p className="text-white font-mono text-sm">{order.id.slice(0, 8)}...</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Buyer</p>
                <p className="text-blue-400 font-semibold">{order.buyer?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Seller</p>
                <p className="text-green-400 font-semibold">{order.seller?.username}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p className="text-white font-semibold">${order.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Listing</p>
                <p className="text-white font-semibold">{order.listing_title || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Game</p>
                <p className="text-white font-semibold">{order.listing_game || 'N/A'}</p>
              </div>
            </div>
            {order.dispute_reason && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-xs text-red-400 font-semibold mb-2">Dispute Reason:</p>
                <p className="text-white">{order.dispute_reason}</p>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-white font-bold">3-Way Dispute Chat</h3>
              <p className="text-sm text-gray-400">Admin, Buyer, and Seller</p>
            </div>

            <div className="h-[500px] overflow-y-auto p-4 space-y-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-400 mb-2">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation by sending a message as admin</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                const isSender = message.sender_id === profile.id
                const isBuyer = message.sender_id === order.buyer_id
                const isSeller = message.sender_id === order.seller_id
                const isAdmin = message.sender?.is_admin
                const isSystemMessage = message.message_type === 'system'
                const previousMessage = index > 0 ? messages[index - 1] : null
                const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
                
                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-white/10 px-4 py-1 rounded-full">
                          <p className="text-xs text-gray-400 font-semibold">
                            {formatDateSeparator(message.created_at)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* System Message */}
                    {isSystemMessage ? (
                      <div className="flex justify-center my-4">
                        <div className="max-w-[85%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">🔔</span>
                            </div>
                            <div className="flex-1">
                              <span className="text-blue-300 font-bold text-sm">System Notification</span>
                              <div className="text-white text-sm whitespace-pre-wrap mt-2">{message.content}</div>
                              <p className="text-xs text-blue-300/60 mt-2 text-center">
                                {new Date(message.created_at).toLocaleString([], { 
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Regular Message */
                      <div className={`flex gap-2 mb-2 ${isSender ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar for others */}
                        {!isSender && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            isAdmin ? 'bg-gradient-to-br from-red-500 to-orange-500' :
                            isBuyer ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30' :
                            'bg-gradient-to-br from-green-500/30 to-emerald-500/30'
                          }`}>
                            <span className="text-white font-semibold text-xs">
                              {message.sender.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-2 mb-1 px-2">
                            <span className={`text-xs font-semibold ${
                              isAdmin ? 'text-orange-400' :
                              isBuyer ? 'text-blue-400' : 
                              'text-green-400'
                            }`}>
                              {message.sender.username}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                              isAdmin ? 'bg-orange-500/30 text-orange-300' :
                              isBuyer ? 'bg-blue-500/20 text-blue-300' : 
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {isAdmin ? 'ADMIN' : isBuyer ? 'Buyer' : 'Seller'}
                            </span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2 ${
                            isAdmin 
                              ? 'bg-orange-500/20 text-white border border-orange-500/40'
                              : isSender
                              ? 'bg-red-500/20 text-white border border-red-500/30'
                              : isBuyer
                              ? 'bg-blue-500/20 text-white border border-blue-500/30'
                              : 'bg-green-500/20 text-white border border-green-500/30'
                          }`}>
                            <p className="text-sm break-words">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {/* Avatar for self */}
                        {isSender && (
                          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white font-semibold text-xs">
                              👑
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5 relative">
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 left-4 bg-slate-800 border border-white/20 rounded-lg p-3 shadow-2xl z-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400 font-semibold">Quick Emojis</p>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:bg-white/10 rounded p-1 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="px-3 py-3 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 transition"
                >
                  😊
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message as admin..."
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send as Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}