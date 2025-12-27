// File Path: app/messages/page.tsx

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navigation from '@/components/Navigation'

// Types
import { Message, UserProfile } from './types'

// Hooks
import {
  useMessages,
  useConversations,
  useTypingIndicator,
  useOnlineStatus,
  useRateLimiting,
  useImageUpload
} from './hooks'

// Utils
import { detectScamPattern } from './utils/messageHelpers'

// Components
import { ConversationsList, ChatArea, NewConversationArea } from './components'
import {
  ReportModal,
  ImageModal,
  DeliverySecurityModal,
  SecurityWarningBanner,
  ReportSuccessBanner
} from './components/modals'

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Auth state
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [showMobileConversations, setShowMobileConversations] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  
  // Pending new conversation state (marketplace)
  const [pendingListingId, setPendingListingId] = useState<string | null>(null)
  const [pendingSellerId, setPendingSellerId] = useState<string | null>(null)
  
  // Pending new conversation state (boosting)
  const [pendingBoostOrderId, setPendingBoostOrderId] = useState<string | null>(null)
  const [pendingBoostOrder, setPendingBoostOrder] = useState<any>(null)
  const [pendingBoostVendorId, setPendingBoostVendorId] = useState<string | null>(null)
  const [pendingBoostCustomerId, setPendingBoostCustomerId] = useState<string | null>(null)
  
  // Modal states
  const [showReportModal, setShowReportModal] = useState(false)
  const [showReportSuccess, setShowReportSuccess] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null)
  const [showSecurityWarning, setShowSecurityWarning] = useState(false)
  const [showDeliverySecurityModal, setShowDeliverySecurityModal] = useState(false)
  const [pendingRevealMessageId, setPendingRevealMessageId] = useState<string | null>(null)
  
  // Delivery reveal state
  const [revealedDeliveryMessages, setRevealedDeliveryMessages] = useState<Set<string>>(new Set())

  // Custom hooks
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    fetchConversations,
    markConversationAsRead,
    openConversation,
    createConversation,
    createBoostingConversation,
    findBoostingConversation,
    updateConversationLastMessage
  } = useConversations({ userId: user?.id })

  const {
    messages,
    sending,
    messagesEndRef,
    fetchMessages,
    sendMessage,
    sendFirstMessage,
    logDeliveryAccess
  } = useMessages({
    userId: user?.id,
    selectedConversation,
    onMessagesUpdated: fetchConversations
  })

  const { typingUsers, handleTypingChange } = useTypingIndicator({
    conversationId: selectedConversation?.id || null,
    userId: user?.id,
    username: userProfile?.username || null
  })

  const { otherUserOnline, otherUserLastSeen } = useOnlineStatus({
    currentUserId: user?.id,
    otherUserId: selectedConversation
      ? (selectedConversation.buyer_id === user?.id 
          ? selectedConversation.seller_id 
          : selectedConversation.buyer_id)
      : null
  })

  const {
    rateLimitError,
    setRateLimitError,
    checkMessageRateLimit,
    recordMessageSent,
    checkConversationRateLimit,
    recordConversationCreated
  } = useRateLimiting()

  const {
    uploadingImage,
    imagePreview,
    selectedImage,
    fileInputRef,
    handleImageSelect,
    uploadImage,
    clearImage,
    triggerFileInput
  } = useImageUpload({
    userId: user?.id,
    onSecurityWarning: () => setShowSecurityWarning(true)
  })

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [router, supabase])

  // Fetch user profile and handle URL params
  useEffect(() => {
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
    
    if (user) {
      fetchConversations()
      fetchUserProfile()
      
      // Handle URL params
      const conversationId = searchParams.get('conversation')
      const listingId = searchParams.get('listing_id')
      const sellerId = searchParams.get('seller_id')
      
      // Boosting params
      const boostOrderId = searchParams.get('boostOrder')
      const vendorId = searchParams.get('vendorId')
      const customerId = searchParams.get('customerId')
      
      if (conversationId) {
        openConversation(conversationId)
        setShowMobileConversations(false)
      } else if (boostOrderId && vendorId && customerId) {
        // Handle boosting order chat
        handleBoostingOrderChat(boostOrderId, vendorId, customerId)
      } else if (listingId && sellerId) {
        // Handle marketplace chat
        setPendingListingId(listingId)
        setPendingSellerId(sellerId)
        setShowMobileConversations(false)
      }
    }
  }, [user, searchParams])

  // Handle boosting order chat URL
  const handleBoostingOrderChat = async (boostOrderId: string, vendorId: string, customerId: string) => {
    // Check if conversation already exists
    const existingConv = await findBoostingConversation(boostOrderId)
    
    if (existingConv) {
      // Open existing conversation
      setSelectedConversation(existingConv)
      setShowMobileConversations(false)
      await markConversationAsRead(existingConv.id)
      // Update URL to use conversation ID
      router.replace(`/messages?conversation=${existingConv.id}`)
    } else {
      // Fetch boosting order details for new conversation
      try {
        const { data: boostOrder, error } = await supabase
          .from('boosting_orders')
          .select('id, order_number, game, current_rank, desired_rank, status, final_price')
          .eq('id', boostOrderId)
          .single()
        
        if (error) throw error
        
        // Set pending state for new boosting conversation
        setPendingBoostOrderId(boostOrderId)
        setPendingBoostOrder(boostOrder)
        setPendingBoostVendorId(vendorId)
        setPendingBoostCustomerId(customerId)
        setShowMobileConversations(false)
      } catch (error) {
        console.error('Error fetching boosting order:', error)
        router.push('/messages')
      }
    }
  }

  // Fetch messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      markConversationAsRead(selectedConversation.id)
      setRevealedDeliveryMessages(new Set())
    }
  }, [selectedConversation])

  // Handle typing indicator
  useEffect(() => {
    handleTypingChange(!!newMessage)
  }, [newMessage, handleTypingChange])

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || sending) return

    // New marketplace conversation flow
    if (pendingListingId && pendingSellerId && !selectedConversation) {
      await handleNewConversation()
      return
    }

    // New boosting conversation flow
    if (pendingBoostOrderId && pendingBoostVendorId && pendingBoostCustomerId && !selectedConversation) {
      await handleNewBoostingConversation()
      return
    }

    if (!selectedConversation) return

    // Rate limit check
    const rateLimitCheck = checkMessageRateLimit()
    if (!rateLimitCheck.allowed) {
      setRateLimitError(rateLimitCheck.error || 'Rate limit exceeded')
      return
    }

    // Scam pattern check
    const scamWarning = detectScamPattern(newMessage)
    if (scamWarning) {
      const confirmed = confirm(`⚠️ Security Warning: ${scamWarning}\n\nAre you sure you want to send this message?`)
      if (!confirmed) return
    }

    // Upload image if selected
    let imageUrl: string | null = null
    if (selectedImage) {
      imageUrl = await uploadImage()
      if (!imageUrl) {
        alert('Failed to upload image')
        return
      }
    }

    const messageContent = newMessage.trim() || (imageUrl ? '📷 Image' : '')
    
    const success = await sendMessage(messageContent, imageUrl, replyingTo?.id || null)
    
    if (success) {
      recordMessageSent()
      setNewMessage('')
      clearImage()
      setShowSecurityWarning(false)
      setReplyingTo(null)
    }
  }

  // Handle new marketplace conversation creation
  const handleNewConversation = async () => {
    if (!pendingListingId || !pendingSellerId) return

    const convRateLimitCheck = checkConversationRateLimit()
    if (!convRateLimitCheck.allowed) {
      setRateLimitError(convRateLimitCheck.error || 'Rate limit exceeded')
      return
    }

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

    // Upload image if selected
    let imageUrl: string | null = null
    if (selectedImage) {
      imageUrl = await uploadImage()
      if (!imageUrl) {
        alert('Failed to upload image')
        return
      }
    }

    const messageContent = newMessage.trim() || (imageUrl ? '📷 Image' : '')
    
    const newConv = await createConversation(pendingListingId, pendingSellerId, messageContent)
    
    if (newConv) {
      await sendFirstMessage(
        newConv.id,
        pendingSellerId,
        pendingListingId,
        messageContent,
        imageUrl,
        replyingTo?.id || null
      )

      recordConversationCreated()
      recordMessageSent()

      setPendingListingId(null)
      setPendingSellerId(null)
      setNewMessage('')
      clearImage()
      setShowSecurityWarning(false)
      setReplyingTo(null)

      await fetchConversations()
      await openConversation(newConv.id)
      
      router.push(`/messages?conversation=${newConv.id}`)
    }
  }

  // Handle new boosting conversation creation
  const handleNewBoostingConversation = async () => {
    if (!pendingBoostOrderId || !pendingBoostVendorId || !pendingBoostCustomerId) return

    const convRateLimitCheck = checkConversationRateLimit()
    if (!convRateLimitCheck.allowed) {
      setRateLimitError(convRateLimitCheck.error || 'Rate limit exceeded')
      return
    }

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

    // Upload image if selected
    let imageUrl: string | null = null
    if (selectedImage) {
      imageUrl = await uploadImage()
      if (!imageUrl) {
        alert('Failed to upload image')
        return
      }
    }

    const messageContent = newMessage.trim() || (imageUrl ? '📷 Image' : '')
    
    const newConv = await createBoostingConversation(
      pendingBoostOrderId,
      pendingBoostVendorId,
      pendingBoostCustomerId,
      messageContent
    )
    
    if (newConv) {
      // Send first message
      const receiverId = user?.id === pendingBoostCustomerId ? pendingBoostVendorId : pendingBoostCustomerId
      
      try {
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: newConv.id,
            sender_id: user?.id,
            receiver_id: receiverId,
            content: messageContent,
            message_type: 'user',
            image_url: imageUrl,
            replied_to: replyingTo?.id || null,
            read: false
          })

        if (error) throw error
      } catch (error) {
        console.error('Error sending first boosting message:', error)
      }

      recordConversationCreated()
      recordMessageSent()

      // Clear pending state
      setPendingBoostOrderId(null)
      setPendingBoostOrder(null)
      setPendingBoostVendorId(null)
      setPendingBoostCustomerId(null)
      setNewMessage('')
      clearImage()
      setShowSecurityWarning(false)
      setReplyingTo(null)

      await fetchConversations()
      await openConversation(newConv.id)
      
      router.push(`/messages?conversation=${newConv.id}`)
    }
  }

  // Handle conversation selection
  const handleSelectConversation = async (conv: any) => {
    setSelectedConversation(conv)
    setShowMobileConversations(false)
    await markConversationAsRead(conv.id)
  }

  // Handle mark order as delivered (marketplace only)
  const handleMarkDelivered = async () => {
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

  // Handle delivery reveal
  const handleRevealDelivery = (messageId: string) => {
    setPendingRevealMessageId(messageId)
    setShowDeliverySecurityModal(true)
  }

  const confirmAndRevealDelivery = async () => {
    if (!pendingRevealMessageId) return
    
    await logDeliveryAccess(pendingRevealMessageId, selectedConversation?.order_id || null)
    setRevealedDeliveryMessages(prev => new Set(prev).add(pendingRevealMessageId))
    setShowDeliverySecurityModal(false)
    setPendingRevealMessageId(null)
  }

  const handleHideDelivery = (messageId: string) => {
    setRevealedDeliveryMessages(prev => {
      const newSet = new Set(prev)
      newSet.delete(messageId)
      return newSet
    })
  }

  // Handle back click
  const handleBackClick = () => {
    setShowMobileConversations(true)
    if (pendingListingId) {
      setPendingListingId(null)
      setPendingSellerId(null)
      router.push('/messages')
    }
    if (pendingBoostOrderId) {
      setPendingBoostOrderId(null)
      setPendingBoostOrder(null)
      setPendingBoostVendorId(null)
      setPendingBoostCustomerId(null)
      router.push('/messages')
    }
  }

  // Handle image cancel with security warning
  const handleCancelImageUpload = () => {
    setShowSecurityWarning(false)
    clearImage()
  }

  // Get other user ID for report
  const getOtherUserId = () => {
    if (!selectedConversation || !user) return ''
    return selectedConversation.buyer_id === user.id 
      ? selectedConversation.seller_id 
      : selectedConversation.buyer_id
  }

  // Check if we have a pending new conversation (marketplace or boosting)
  const hasPendingNewConversation = (pendingListingId && pendingSellerId) || (pendingBoostOrderId && pendingBoostVendorId && pendingBoostCustomerId)

  // Loading state
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

        {/* Modals */}
        <DeliverySecurityModal
          isOpen={showDeliverySecurityModal}
          onConfirm={confirmAndRevealDelivery}
          onClose={() => {
            setShowDeliverySecurityModal(false)
            setPendingRevealMessageId(null)
          }}
        />

        <SecurityWarningBanner
          isVisible={showSecurityWarning}
          onDismiss={() => setShowSecurityWarning(false)}
          onCancelUpload={handleCancelImageUpload}
        />

        <ReportSuccessBanner
          isVisible={showReportSuccess}
          onDismiss={() => setShowReportSuccess(false)}
        />

        {selectedConversation && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            userId={user?.id || ''}
            otherUserId={getOtherUserId()}
            conversationId={selectedConversation.id}
            onSuccess={() => {
              setShowReportSuccess(true)
              setTimeout(() => setShowReportSuccess(false), 3000)
            }}
          />
        )}

        <ImageModal
          isOpen={showImageModal}
          imageUrl={modalImageUrl}
          onClose={() => setShowImageModal(false)}
        />

        {/* Messages Content */}
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-4 sm:pb-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className={`mb-4 sm:mb-6 ${!showMobileConversations && selectedConversation ? 'hidden sm:block' : ''}`}>
              <div className="inline-block mb-2 sm:mb-4">
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-xs sm:text-sm font-medium backdrop-blur-sm">
                  🚀 Space Chat Center
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Messages</span>
              </h1>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 h-[calc(100vh-140px)] sm:h-[calc(100vh-220px)]">
              {/* Conversations List */}
              <ConversationsList
                conversations={conversations}
                selectedConversationId={selectedConversation?.id || null}
                currentUserId={user?.id || ''}
                isVisible={showMobileConversations}
                onSelectConversation={handleSelectConversation}
              />

              {/* Chat Area or New Conversation Area */}
              {hasPendingNewConversation && !selectedConversation ? (
                <NewConversationArea
                  isVisible={!showMobileConversations}
                  messageValue={newMessage}
                  onMessageChange={setNewMessage}
                  onSubmit={handleSubmit}
                  sending={sending}
                  uploadingImage={uploadingImage}
                  imagePreview={imagePreview}
                  replyingTo={replyingTo}
                  rateLimitError={rateLimitError}
                  fileInputRef={fileInputRef}
                  onImageSelect={handleImageSelect}
                  onClearImage={clearImage}
                  onClearReply={() => setReplyingTo(null)}
                  onTriggerFileInput={triggerFileInput}
                  onBackClick={handleBackClick}
                  // Pass boosting info for display
                  isBoosting={!!pendingBoostOrderId}
                  boostingOrder={pendingBoostOrder}
                />
              ) : (
                <ChatArea
                  conversation={selectedConversation}
                  messages={messages}
                  currentUserId={user?.id || ''}
                  currentUserAvatarUrl={userProfile?.avatar_url || null}
                  currentUsername={userProfile?.username || user?.email?.charAt(0) || 'U'}
                  otherUserOnline={otherUserOnline}
                  otherUserLastSeen={otherUserLastSeen}
                  typingUsers={typingUsers}
                  revealedDeliveryMessages={revealedDeliveryMessages}
                  messagesEndRef={messagesEndRef}
                  messageValue={newMessage}
                  onMessageChange={setNewMessage}
                  onSubmit={handleSubmit}
                  sending={sending}
                  uploadingImage={uploadingImage}
                  imagePreview={imagePreview}
                  replyingTo={replyingTo}
                  rateLimitError={rateLimitError}
                  fileInputRef={fileInputRef}
                  onImageSelect={handleImageSelect}
                  onClearImage={clearImage}
                  onClearReply={() => setReplyingTo(null)}
                  onTriggerFileInput={triggerFileInput}
                  onBackClick={() => setShowMobileConversations(true)}
                  onReportClick={() => setShowReportModal(true)}
                  onMarkDelivered={handleMarkDelivered}
                  onReplyToMessage={setReplyingTo}
                  onImageClick={(url) => {
                    setModalImageUrl(url)
                    setShowImageModal(true)
                  }}
                  onRevealDelivery={handleRevealDelivery}
                  onHideDelivery={handleHideDelivery}
                  isVisible={!showMobileConversations}
                />
              )}
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
        
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
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