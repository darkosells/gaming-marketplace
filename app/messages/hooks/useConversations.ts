// File Path: app/messages/hooks/useConversations.ts

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Conversation } from '../types'

interface UseConversationsProps {
  userId: string | null
}

export function useConversations({ userId }: UseConversationsProps) {
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  // Fetch all conversations for current user
  const fetchConversations = useCallback(async () => {
    if (!userId) return

    try {
      // Fetch conversations with order snapshot data and boosting orders
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount, listing_title, listing_game, listing_image_url, listing_category),
          boosting_order:boosting_orders(id, order_number, game, current_rank, desired_rank, status, final_price)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Get unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('receiver_id', userId)
            .eq('read', false)

          return { ...conv, unread_count: count || 0 }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }, [userId, supabase])

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('read', false)

      if (error) throw error

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        )
      )

      // Dispatch event for navigation badge update
      window.dispatchEvent(new Event('messages-read'))
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [userId, supabase])

  // Open a conversation by ID
  const openConversation = useCallback(async (conversationId: string) => {
    // First check if it's in the current list
    const conv = conversations.find(c => c.id === conversationId)
    if (conv) {
      setSelectedConversation(conv)
      await markConversationAsRead(conversationId)
      return conv
    }

    // If not found, fetch it directly
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount, listing_title, listing_game, listing_image_url, listing_category),
          boosting_order:boosting_orders(id, order_number, game, current_rank, desired_rank, status, final_price)
        `)
        .eq('id', conversationId)
        .single()

      if (error) throw error
      
      setSelectedConversation(data)
      await markConversationAsRead(conversationId)
      return data
    } catch (error) {
      console.error('Error opening conversation:', error)
      return null
    }
  }, [conversations, markConversationAsRead, supabase])

  // Create a new conversation (marketplace)
  const createConversation = useCallback(async (
    listingId: string,
    sellerId: string,
    initialMessage: string
  ): Promise<Conversation | null> => {
    if (!userId) return null

    try {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          buyer_id: userId,
          seller_id: sellerId,
          last_message: initialMessage,
          last_message_at: new Date().toISOString()
        })
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount, listing_title, listing_game, listing_image_url, listing_category),
          boosting_order:boosting_orders(id, order_number, game, current_rank, desired_rank, status, final_price)
        `)
        .single()

      if (convError) throw convError

      return newConv
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }, [userId, supabase])

  // Create a new boosting conversation
  const createBoostingConversation = useCallback(async (
    boostingOrderId: string,
    vendorId: string,
    customerId: string,
    initialMessage: string
  ): Promise<Conversation | null> => {
    if (!userId) return null

    try {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          boosting_order_id: boostingOrderId,
          buyer_id: customerId,
          seller_id: vendorId,
          last_message: initialMessage,
          last_message_at: new Date().toISOString()
        })
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount, listing_title, listing_game, listing_image_url, listing_category),
          boosting_order:boosting_orders(id, order_number, game, current_rank, desired_rank, status, final_price)
        `)
        .single()

      if (convError) throw convError

      return newConv
    } catch (error) {
      console.error('Error creating boosting conversation:', error)
      return null
    }
  }, [userId, supabase])

  // Find existing conversation by boosting order ID
  const findBoostingConversation = useCallback(async (
    boostingOrderId: string
  ): Promise<Conversation | null> => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(title, image_url, game),
          buyer:profiles!conversations_buyer_id_fkey(username, avatar_url),
          seller:profiles!conversations_seller_id_fkey(username, avatar_url),
          order:orders(status, amount, listing_title, listing_game, listing_image_url, listing_category),
          boosting_order:boosting_orders(id, order_number, game, current_rank, desired_rank, status, final_price)
        `)
        .eq('boosting_order_id', boostingOrderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      
      return data
    } catch (error) {
      console.error('Error finding boosting conversation:', error)
      return null
    }
  }, [supabase])

  // Update conversation's last message
  const updateConversationLastMessage = useCallback(async (
    conversationId: string,
    lastMessage: string
  ) => {
    try {
      await supabase
        .from('conversations')
        .update({
          last_message: lastMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)
    } catch (error) {
      console.error('Error updating conversation:', error)
    }
  }, [supabase])

  return {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    fetchConversations,
    markConversationAsRead,
    openConversation,
    createConversation,
    createBoostingConversation,
    findBoostingConversation,
    updateConversationLastMessage
  }
}