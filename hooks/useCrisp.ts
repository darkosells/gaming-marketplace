'use client'

import { useCallback, useEffect, useState } from 'react'
import { crispChat } from '@/components/CrispChat'

interface UseCrispOptions {
  // Optional: Pre-set context when opening chat
  orderId?: string
  listingId?: string
}

export function useCrisp(options?: UseCrispOptions) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Check if Crisp is already loaded
    if (crispChat.isReady()) {
      setIsReady(true)
      return
    }

    // Listen for Crisp ready event
    const handleReady = () => setIsReady(true)
    window.addEventListener('crisp:ready', handleReady)

    return () => {
      window.removeEventListener('crisp:ready', handleReady)
    }
  }, [])

  // Open chat (optionally with context)
  const openChat = useCallback(() => {
    if (options?.orderId || options?.listingId) {
      crispChat.setContext({
        orderId: options.orderId,
        listingId: options.listingId
      })
    }
    crispChat.open()
  }, [options?.orderId, options?.listingId])

  // Open chat with a pre-filled message
  const openWithMessage = useCallback((message: string) => {
    if (options?.orderId || options?.listingId) {
      crispChat.setContext({
        orderId: options.orderId,
        listingId: options.listingId
      })
    }
    crispChat.openWithTopic(message)
  }, [options?.orderId, options?.listingId])

  // Open chat specifically for order help
  const openOrderHelp = useCallback((orderId: string) => {
    crispChat.setContext({ orderId, issue: 'order_help' })
    crispChat.openWithTopic(`I need help with order #${orderId.slice(0, 8)}...`)
  }, [])

  // Open chat for general questions
  const openGeneralHelp = useCallback(() => {
    crispChat.open()
  }, [])

  // Close chat
  const closeChat = useCallback(() => {
    crispChat.close()
  }, [])

  return {
    isReady,
    openChat,
    openWithMessage,
    openOrderHelp,
    openGeneralHelp,
    closeChat
  }
}

export default useCrisp