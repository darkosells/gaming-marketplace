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
  }
  seller: {
    username: string
  }
  order: {
    status: string
    amount: number
  }
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  sender: {
    username: string
  }
}

// Component that uses useSearchParams
function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      
      // Check if we should open a specific conversation
      const conversationId = searchParams.get('conversation')
      if (conversationId) {
        openConversation(conversationId)
      }
    }
  }, [user, searchParams])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      
      // Set up real-time subscription
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

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    setLoading(false)
  }

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username),
          seller:profiles!conversations_seller_id_fkey(username),
          order:orders(status, amount)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const openConversation = async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId)
    if (conv) {
      setSelectedConversation(conv)
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user.id)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username)
        `)
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
          content: newMessage.trim()
        })

      if (error) throw error

      // Update conversation last message
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <Navigation />

      {/* Messages Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Messages</h1>

          <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Conversations</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-400">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const otherUser = conv.buyer_id === user.id ? conv.seller : conv.buyer
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full text-left p-4 border-b border-white/10 hover:bg-white/5 transition ${
                          selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            {conv.listing?.image_url ? (
                              <img
                                src={conv.listing.image_url}
                                alt={conv.listing.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                🎮
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-white font-semibold truncate">
                                {otherUser.username}
                              </p>
                              {conv.order?.status && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  conv.order.status === 'completed' 
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {conv.order.status}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-purple-400 mb-1">{conv.listing?.title || 'Unknown Item'}</p>
                            <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden flex flex-col">
              {!selectedConversation ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-400">Select a conversation to start messaging</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold">
                          {selectedConversation.buyer_id === user.id 
                            ? selectedConversation.seller.username 
                            : selectedConversation.buyer.username}
                        </h3>
                        <p className="text-sm text-purple-400">{selectedConversation.listing?.title || 'Unknown Item'}</p>
                      </div>
                      {isSeller && selectedConversation.order && selectedConversation.order.status === 'pending' && (
                        <button
                          onClick={markOrderAsDelivered}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          Mark as Delivered
                        </button>
                      )}
                      {selectedConversation.order?.status === 'completed' && (
                        <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold">
                          ✓ Delivered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwnMessage = message.sender_id === user.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwnMessage 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-white/10 text-white'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 px-2">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-white/5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component wrapped with Suspense
export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-white mt-4">Loading...</p>
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}