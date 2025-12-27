// File Path: app/messages/hooks/useMessages.ts

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Message, Conversation } from '../types'
import { sendNewMessageEmail } from '@/lib/email'

interface UseMessagesProps {
  userId: string | null
  selectedConversation: Conversation | null
  onMessagesUpdated?: () => void
}

export function useMessages({ userId, selectedConversation, onMessagesUpdated }: UseMessagesProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch messages for current conversation
  const fetchMessages = useCallback(async () => {
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
      
      // Fetch reply messages
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
  }, [selectedConversation, supabase])

  // ============================================================================
  // EMAIL NOTIFICATION HELPER
  // ============================================================================
  
  /**
   * Check if we should send an email notification and send it if appropriate
   * Checks: rate limit (5 min), online status (3 min), and user preference
   */
  const sendMessageEmailNotification = useCallback(async (
    conversationId: string,
    receiverId: string,
    messageContent: string,
    senderUsername: string
  ) => {
    try {
      // Call the database function to check all conditions
      const { data: checkResult, error: checkError } = await supabase
        .rpc('should_send_message_email', {
          p_conversation_id: conversationId,
          p_recipient_id: receiverId,
          p_rate_limit_minutes: 5,
          p_online_threshold_minutes: 3
        })

      if (checkError) {
        console.error('Error checking email eligibility:', checkError)
        return
      }

      // If we shouldn't send, log the reason and return
      if (!checkResult?.should_send) {
        console.log(`Skipping message email: ${checkResult?.reason}`)
        return
      }

      // Get conversation context for the email
      let listingTitle: string | undefined
      let boostingOrderNumber: string | undefined

      // Check if it's a boosting conversation
      if (selectedConversation?.boosting_order_id) {
        boostingOrderNumber = selectedConversation.boosting_order?.order_number
      } else if (selectedConversation?.listing) {
        listingTitle = selectedConversation.listing.title
      } else if (selectedConversation?.order?.listing_title) {
        listingTitle = selectedConversation.order.listing_title
      }

      // Send the email
      const emailResult = await sendNewMessageEmail({
        recipientEmail: checkResult.recipient_email,
        recipientUsername: checkResult.recipient_username,
        senderUsername: senderUsername,
        messagePreview: messageContent,
        conversationId: conversationId,
        listingTitle: listingTitle,
        boostingOrderNumber: boostingOrderNumber
      })

      if (emailResult.success) {
        // Record that we sent an email (for rate limiting)
        await supabase.rpc('record_message_email_sent', {
          p_conversation_id: conversationId,
          p_recipient_id: receiverId
        })
        console.log('Message email notification sent successfully')
      } else {
        console.error('Failed to send message email:', emailResult.error)
      }
    } catch (error) {
      // Don't let email errors break the message sending flow
      console.error('Error in sendMessageEmailNotification:', error)
    }
  }, [supabase, selectedConversation])

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  // Send a message
  const sendMessage = useCallback(async (
    content: string,
    imageUrl: string | null = null,
    replyToId: string | null = null
  ): Promise<boolean> => {
    if (!selectedConversation || !userId) return false

    setSending(true)
    
    try {
      const receiverId = selectedConversation.buyer_id === userId 
        ? selectedConversation.seller_id 
        : selectedConversation.buyer_id

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: userId,
          receiver_id: receiverId,
          listing_id: selectedConversation.listing_id,
          order_id: selectedConversation.order_id,
          content: content,
          message_type: 'user',
          image_url: imageUrl,
          replied_to: replyToId,
          read: false
        })

      if (error) throw error

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id)

      await fetchMessages()
      onMessagesUpdated?.()

      // ========== SEND EMAIL NOTIFICATION (async, non-blocking) ==========
      // Get sender username for the email
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      const senderUsername = senderProfile?.username || 'Someone'
      
      // Send email notification in background (don't await)
      sendMessageEmailNotification(
        selectedConversation.id,
        receiverId,
        content,
        senderUsername
      )
      // ===================================================================
      
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    } finally {
      setSending(false)
    }
  }, [selectedConversation, userId, fetchMessages, onMessagesUpdated, supabase, sendMessageEmailNotification])

  // Send first message to a new conversation
  const sendFirstMessage = useCallback(async (
    conversationId: string,
    receiverId: string,
    listingId: string,
    content: string,
    imageUrl: string | null = null,
    replyToId: string | null = null
  ): Promise<boolean> => {
    if (!userId) return false

    setSending(true)
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          receiver_id: receiverId,
          listing_id: listingId,
          content: content,
          message_type: 'user',
          image_url: imageUrl,
          replied_to: replyToId,
          read: false
        })

      if (error) throw error

      // ========== SEND EMAIL NOTIFICATION FOR FIRST MESSAGE ==========
      // Get sender username for the email
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .single()

      const senderUsername = senderProfile?.username || 'Someone'
      
      // Send email notification in background (don't await)
      sendMessageEmailNotification(
        conversationId,
        receiverId,
        content,
        senderUsername
      )
      // ===============================================================
      
      return true
    } catch (error) {
      console.error('Error sending first message:', error)
      return false
    } finally {
      setSending(false)
    }
  }, [userId, supabase, sendMessageEmailNotification])

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!selectedConversation || !userId) return

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
          onMessagesUpdated?.()
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

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [selectedConversation, userId, fetchMessages, onMessagesUpdated, supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Log delivery access
  const logDeliveryAccess = useCallback(async (
    messageId: string,
    orderId: string | null
  ) => {
    if (!userId || !selectedConversation) return
    
    try {
      await supabase.from('delivery_access_logs').insert({
        user_id: userId,
        order_id: orderId || selectedConversation.order_id,
        conversation_id: selectedConversation.id,
        access_type: 'reveal',
        access_location: 'messenger'
      })
    } catch (err) {
      console.error('Error logging delivery access:', err)
    }
  }, [userId, selectedConversation, supabase])

  return {
    messages,
    setMessages,
    sending,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    sendFirstMessage,
    scrollToBottom,
    logDeliveryAccess
  }
}