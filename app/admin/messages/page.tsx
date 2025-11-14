// app/admin/messages/[conversationId]/page.tsx - ADMIN SPECTATOR VIEW

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
  }
}

export default function AdminSpectatorView() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [conversation, setConversation] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (profile?.is_admin) {
      fetchConversation()
      fetchMessages()
      
      // Set up real-time subscription
      const channel = supabase
        .channel(`admin-spectate-${params.conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${params.conversationId}`
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
  }, [profile])

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

  const fetchConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, game, image_url),
          buyer:profiles!conversations_buyer_id_fkey(username),
          seller:profiles!conversations_seller_id_fkey(username),
          order:orders(id, status, amount, dispute_reason)
        `)
        .eq('id', params.conversationId)
        .single()

      if (error) throw error
      setConversation(data)
    } catch (error) {
      console.error('Error fetching conversation:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username)
        `)
        .eq('conversation_id', params.conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-white text-xl mb-4">Conversation not found</p>
          <Link href="/admin" className="text-purple-400 hover:text-purple-300">
            ← Back to Admin Dashboard
          </Link>
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
              <span className="text-xl font-bold text-white">Admin - Spectator Mode</span>
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
          {/* Spectator Notice */}
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👁️</div>
              <div className="flex-1">
                <h3 className="text-yellow-400 font-bold">Spectator Mode (Read-Only)</h3>
                <p className="text-yellow-200 text-sm">You are viewing this conversation as an admin. Users cannot see that you're watching.</p>
              </div>
            </div>
          </div>

          {/* Conversation Info */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                {conversation.listing?.image_url ? (
                  <img src={conversation.listing.image_url} alt={conversation.listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎮</div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{conversation.listing?.title || 'Unknown Item'}</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Buyer</p>
                    <p className="text-white font-semibold">{conversation.buyer?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Seller</p>
                    <p className="text-white font-semibold">{conversation.seller?.username}</p>
                  </div>
                  {conversation.order && (
                    <>
                      <div>
                        <p className="text-sm text-gray-400">Order Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          conversation.order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          conversation.order.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                          conversation.order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {conversation.order.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Order Amount</p>
                        <p className="text-white font-semibold">${conversation.order.amount}</p>
                      </div>
                    </>
                  )}
                </div>
                {conversation.order?.dispute_reason && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-xs text-red-400 font-semibold mb-1">Dispute Reason:</p>
                    <p className="text-white text-sm">{conversation.order.dispute_reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-white font-bold">Conversation History</h3>
              <p className="text-sm text-gray-400">Total messages: {messages.length}</p>
            </div>

            <div className="h-[600px] overflow-y-auto p-4 space-y-1">
              {messages.map((message, index) => {
                const isBuyer = message.sender_id === conversation.buyer_id
                const isSeller = message.sender_id === conversation.seller_id
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
                        <div className="max-w-[85%] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-4 shadow-lg">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">🔔</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-blue-300 font-bold text-sm">System Notification</span>
                              </div>
                              <div className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                                {message.content}
                              </div>
                              <p className="text-xs text-blue-300/60 mt-3 text-center">
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
                      <div className={`flex gap-2 mb-2 ${isSeller ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar */}
                        {isBuyer && (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white font-semibold text-xs">
                              {conversation.buyer.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Message Bubble */}
                        <div className={`max-w-[70%] ${isSeller ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-2 mb-1 px-2">
                            <span className={`text-xs font-semibold ${
                              isBuyer ? 'text-blue-400' : 'text-green-400'
                            }`}>
                              {message.sender.username}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isBuyer ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'
                            }`}>
                              {isBuyer ? 'Buyer' : 'Seller'}
                            </span>
                          </div>
                          <div className={`rounded-2xl px-4 py-2 ${
                            isSeller
                              ? 'bg-green-500/20 text-white border border-green-500/30' 
                              : 'bg-blue-500/20 text-white border border-blue-500/30'
                          }`}>
                            <p className="text-sm break-words">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        {/* Avatar */}
                        {isSeller && (
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white font-semibold text-xs">
                              {conversation.seller.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Read-only Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <span className="text-xl">🔒</span>
                <span className="text-sm">Read-only mode - You cannot send messages in spectator view</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}