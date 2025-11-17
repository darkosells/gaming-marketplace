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

export default function AdminSpectateChat() {
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
    }
  }, [profile])

  useEffect(() => {
    if (conversation) {
      fetchMessages()
      
      // Set up real-time subscription for live updates
      const channel = supabase
        .channel(`admin-spectate-${conversation.id}`)
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

  const fetchConversation = async () => {
    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(id, title, game, image_url, price),
          buyer:profiles!conversations_buyer_id_fkey(id, username),
          seller:profiles!conversations_seller_id_fkey(id, username),
          order:orders(id, status, amount, created_at)
        `)
        .eq('id', params.conversationId)
        .single()

      if (convError) {
        console.error('Conversation fetch error:', convError)
        alert('Failed to load conversation')
        router.push('/admin')
        return
      }
      
      setConversation(convData)
    } catch (error: any) {
      console.error('Error fetching conversation:', error)
      router.push('/admin')
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

  if (loading || !conversation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
          <p className="text-white text-xl">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Simplified Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/50 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-purple-600/15 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Navigation */}
      <nav className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <span className="text-xl font-bold text-white">Admin - Spectate Chat</span>
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

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Spectate Mode Notice */}
          <div className="bg-blue-500/20 border border-blue-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">👁️</div>
              <div className="flex-1">
                <h3 className="text-blue-400 font-bold">Spectate Mode (Read-Only)</h3>
                <p className="text-blue-200 text-sm">You are viewing this conversation as a spectator. Your presence is not visible to users and you cannot send messages.</p>
              </div>
            </div>
          </div>

          {/* Conversation Info */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {conversation.listing?.image_url ? (
                <img src={conversation.listing.image_url} alt={conversation.listing.title} className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-3xl border border-white/10">🎮</div>
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{conversation.listing?.title || 'Unknown Listing'}</h2>
                <p className="text-gray-400">{conversation.listing?.game} • ${conversation.listing?.price}</p>
              </div>
              {conversation.order && (
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    conversation.order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    conversation.order.status === 'dispute_raised' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {conversation.order.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <p className="text-gray-400 text-sm mt-1">${conversation.order.amount}</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Buyer</p>
                <p className="text-blue-400 font-semibold">{conversation.buyer?.username}</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Seller</p>
                <p className="text-green-400 font-semibold">{conversation.seller?.username}</p>
              </div>
            </div>
          </div>

          {/* Chat Messages - Read Only */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">Conversation History</h3>
                <p className="text-sm text-gray-400">{messages.length} messages</p>
              </div>
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Live Updates</span>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto p-4 space-y-1">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-5xl mb-4">💬</div>
                    <p className="text-gray-400 mb-2">No messages in this conversation</p>
                    <p className="text-sm text-gray-500">The conversation is empty</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isBuyer = message.sender_id === conversation.buyer_id
                  const isSeller = message.sender_id === conversation.seller_id
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
                        <div className={`flex gap-2 mb-2 ${isBuyer ? 'justify-start' : 'justify-end'}`}>
                          {/* Avatar for buyer (left side) */}
                          {isBuyer && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-blue-500/30">
                              <span className="text-white font-semibold text-xs">
                                {message.sender.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          
                          {/* Message Bubble */}
                          <div className={`max-w-[70%] ${isBuyer ? 'items-start' : 'items-end'} flex flex-col`}>
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
                          
                          {/* Avatar for seller (right side) */}
                          {(isSeller || isAdmin) && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                              isAdmin ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border border-green-500/30'
                            }`}>
                              <span className="text-white font-semibold text-xs">
                                {isAdmin ? '👑' : message.sender.username.charAt(0).toUpperCase()}
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

            {/* Read-Only Footer */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center justify-center gap-3 text-gray-400">
                <span className="text-xl">🔒</span>
                <p className="text-sm">Spectate mode - messaging disabled</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {conversation.order?.status === 'dispute_raised' && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-red-400 font-bold">⚠️ Active Dispute</h3>
                  <p className="text-red-200 text-sm">This order has an active dispute</p>
                </div>
                <Link
                  href={`/admin/disputes/${conversation.order.id}/chat`}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition"
                >
                  💬 Join as Participant
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}