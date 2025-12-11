'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// Extend window type for Crisp
declare global {
  interface Window {
    $crisp: any[]
    CRISP_WEBSITE_ID: string
  }
}

interface CrispChatProps {
  websiteId?: string
}

export default function CrispChat({ websiteId = '689635ab-3370-4dc0-8b8a-82aeeda0cff0' }: CrispChatProps) {
  const isLoaded = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    // Prevent double loading
    if (isLoaded.current || typeof window === 'undefined') return
    
    const loadCrisp = async () => {
      // Initialize Crisp configuration
      window.$crisp = []
      window.CRISP_WEBSITE_ID = websiteId

      // Hide the default chat launcher - we'll trigger it from our own buttons
      window.$crisp.push(['config', 'hide:on:away', true])
      window.$crisp.push(['config', 'hide:on:mobile', false])
      
      // IMPORTANT: Hide the chat box by default
      window.$crisp.push(['do', 'chat:hide'])
      
      // Set color to match Nashflare theme
      window.$crisp.push(['config', 'color:theme', 'purple'])

      // Create and load the Crisp script
      const script = document.createElement('script')
      script.src = 'https://client.crisp.chat/l.js'
      script.async = true
      script.id = 'crisp-script'
      document.head.appendChild(script)

      script.onload = async () => {
        isLoaded.current = true
        
        // Ensure chat stays hidden after load
        if (window.$crisp) {
          window.$crisp.push(['do', 'chat:hide'])
        }

        // Load user data AFTER Crisp is fully initialized
        try {
          const { data: { user } } = await supabase.auth.getUser()
          
          if (user && user.email) {
            // Set user email
            window.$crisp.push(['set', 'user:email', [user.email]])
            
            // Get user profile for additional details
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, role, total_sales, rating, verified, created_at')
              .eq('id', user.id)
              .single()

            if (profile) {
              // Set username as nickname
              if (profile.username) {
                window.$crisp.push(['set', 'user:nickname', [profile.username]])
              }

              // Set session data - CORRECT FORMAT: each key-value pair as separate call
              window.$crisp.push(['set', 'session:data', ['user_id', user.id]])
              window.$crisp.push(['set', 'session:data', ['role', profile.role || 'customer']])
              window.$crisp.push(['set', 'session:data', ['verified', profile.verified ? 'Yes' : 'No']])
              
              if (profile.created_at) {
                window.$crisp.push(['set', 'session:data', ['member_since', new Date(profile.created_at).toLocaleDateString()]])
              }

              // Add vendor-specific data
              if (profile.role === 'vendor') {
                if (typeof profile.total_sales === 'number') {
                  window.$crisp.push(['set', 'session:data', ['total_sales', profile.total_sales.toString()]])
                }
                if (typeof profile.rating === 'number') {
                  window.$crisp.push(['set', 'session:data', ['rating', profile.rating.toFixed(1)]])
                }
              }

              // Set segment - CORRECT FORMAT: array with single segment string
              if (profile.role) {
                window.$crisp.push(['set', 'session:segments', [[profile.role]]])
              }
            }
          }
        } catch (error) {
          // Silently fail - chat will still work without user data
          console.warn('Could not load user data for Crisp:', error)
        }
        
        // Dispatch event so other components know Crisp is ready
        window.dispatchEvent(new CustomEvent('crisp:ready'))
      }
    }

    // Lazy load: wait 2 seconds after page load for better performance
    const timer = setTimeout(loadCrisp, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [websiteId, supabase])

  // This component doesn't render anything visible
  return null
}

// Utility functions for controlling Crisp from anywhere
export const crispChat = {
  // Open the chat widget
  open: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:show'])
      window.$crisp.push(['do', 'chat:open'])
    }
  },

  // Close the chat widget
  close: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:close'])
      window.$crisp.push(['do', 'chat:hide'])
    }
  },

  // Toggle chat visibility
  toggle: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:toggle'])
    }
  },

  // Send an automated message from the user (starts conversation with context)
  sendMessage: (message: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]])
    }
  },

  // Set the chat to a specific topic/context (useful for order issues)
  setContext: (context: { orderId?: string; listingId?: string; issue?: string }) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      if (context.orderId) {
        window.$crisp.push(['set', 'session:data', ['order_id', context.orderId]])
      }
      if (context.listingId) {
        window.$crisp.push(['set', 'session:data', ['listing_id', context.listingId]])
      }
      if (context.issue) {
        window.$crisp.push(['set', 'session:data', ['issue_type', context.issue]])
      }
    }
  },

  // Open chat with a specific topic pre-filled
  openWithTopic: (topic: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:show'])
      window.$crisp.push(['do', 'chat:open'])
      // Pre-fill the message input
      window.$crisp.push(['set', 'message:text', [topic]])
    }
  },

  // Check if Crisp is loaded
  isReady: () => {
    return typeof window !== 'undefined' && window.$crisp && window.CRISP_WEBSITE_ID
  }
}