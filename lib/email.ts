// lib/email.ts - Email notification service for Nashflare

const EDGE_FUNCTION_URL = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/send-order-email'

interface EmailResponse {
  success: boolean
  error?: string
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(data: {
  buyerEmail: string
  buyerUsername: string
  orderId: string
  listingTitle: string
  amount: number
  quantity: number
  sellerUsername: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'order_confirmation',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send order confirmation email:', error)
    return { success: false, error: error.message }
  }
}

// Send delivery notification email
export async function sendDeliveryNotificationEmail(data: {
  buyerEmail: string
  buyerUsername: string
  orderId: string
  listingTitle: string
  deliveryCode: string
  sellerUsername: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'delivery_notification',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send delivery notification email:', error)
    return { success: false, error: error.message }
  }
}

// Send new sale notification to seller
export async function sendNewSaleNotificationEmail(data: {
  sellerEmail: string
  sellerUsername: string
  orderId: string
  listingTitle: string
  amount: number
  quantity: number
  buyerUsername: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'new_sale',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send new sale notification email:', error)
    return { success: false, error: error.message }
  }
}

// Send password changed notification email
export async function sendPasswordChangedEmail(data: {
  userEmail: string
  username: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'password_changed',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send password changed email:', error)
    return { success: false, error: error.message }
  }
}

// Send username changed notification email
export async function sendUsernameChangedEmail(data: {
  userEmail: string
  oldUsername: string
  newUsername: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'username_changed',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send username changed email:', error)
    return { success: false, error: error.message }
  }
}

// Send dispute notification email
export async function sendDisputeNotificationEmail(data: {
  recipientEmail: string
  recipientUsername: string
  orderId: string
  disputeReason: string
  openedBy: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'dispute_opened',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send dispute notification email:', error)
    return { success: false, error: error.message }
  }
}

// Send withdrawal processed notification
export async function sendWithdrawalProcessedEmail(data: {
  vendorEmail: string
  vendorUsername: string
  amount: number
  method: string
  transactionId?: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'withdrawal_processed',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send withdrawal processed email:', error)
    return { success: false, error: error.message }
  }
}

// Helper function to get site URL
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://nashflare.com'
}

// Send welcome email to new users
export async function sendWelcomeEmail(data: {
  email: string
  username: string
  site_url?: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'welcome',
        userEmail: data.email,
        username: data.username
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error: error.message }
  }
}

// Combined function to send order emails (to both buyer and seller)
export async function sendOrderEmails(data: {
  id: string
  listing_title: string
  quantity: number
  total_amount: number
  seller_amount: number
  buyer_email: string
  seller_email: string
  buyer_username: string
  seller_username: string
  site_url: string
}): Promise<EmailResponse> {
  try {
    // Ensure amounts are valid numbers
    const safeAmount = Number(data.total_amount) || 0
    const safeQuantity = Number(data.quantity) || 1

    // Send to buyer
    await sendOrderConfirmationEmail({
      buyerEmail: data.buyer_email,
      buyerUsername: data.buyer_username,
      orderId: data.id,
      listingTitle: data.listing_title,
      amount: safeAmount,
      quantity: safeQuantity,
      sellerUsername: data.seller_username
    })

    // Send to seller
    await sendNewSaleNotificationEmail({
      sellerEmail: data.seller_email,
      sellerUsername: data.seller_username,
      orderId: data.id,
      listingTitle: data.listing_title,
      amount: Number(data.seller_amount) || safeAmount,
      quantity: safeQuantity,
      buyerUsername: data.buyer_username
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send order emails:', error)
    return { success: false, error: error.message }
  }
}

// Send delivered email notification
export async function sendDeliveredEmail(data: {
  id: string
  listing_title: string
  buyer_email: string
  seller_username: string
  site_url: string
}): Promise<EmailResponse> {
  // For now, we'll need to fetch the buyer username and delivery code
  // This is a simplified version - in production you'd pass all needed data
  return sendDeliveryNotificationEmail({
    buyerEmail: data.buyer_email,
    buyerUsername: 'Buyer', // Would need to pass this from the order page
    orderId: data.id,
    listingTitle: data.listing_title,
    deliveryCode: 'Check your messages for delivery details', // Placeholder
    sellerUsername: data.seller_username
  })
}

// Combined function to send dispute emails
export async function sendDisputeEmails(data: {
  id: string
  listing_title: string
  buyer_email: string
  seller_email: string
  dispute_reason: string
  is_buyer_raising: boolean
  site_url: string
}): Promise<EmailResponse> {
  try {
    // Notify the other party (the one who didn't raise the dispute)
    const recipientEmail = data.is_buyer_raising ? data.seller_email : data.buyer_email
    const recipientUsername = data.is_buyer_raising ? 'Seller' : 'Buyer' // Simplified
    const openerUsername = data.is_buyer_raising ? 'Buyer' : 'Seller'

    await sendDisputeNotificationEmail({
      recipientEmail,
      recipientUsername,
      orderId: data.id,
      disputeReason: data.dispute_reason,
      openedBy: openerUsername
    })

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send dispute emails:', error)
    return { success: false, error: error.message }
  }
  
}

// Send email verification code
export async function sendVerificationEmail(data: {
  userEmail: string
  username: string
  verificationCode: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'email_verification',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send verification email:', error)
    return { success: false, error: error.message }
  }
}

// 🔐 NEW: Send password reset verification code
export async function sendPasswordResetEmail(data: {
  userEmail: string
  username: string
  resetCode: string
}): Promise<EmailResponse> {
  try {
    console.log('📨 sendPasswordResetEmail called with:', data.userEmail)
    console.log('📨 Edge Function URL:', EDGE_FUNCTION_URL)
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'password_reset',
        ...data
      })
    })

    console.log('📨 Response status:', response.status)
    console.log('📨 Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.log('📨 Error response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('📨 Result:', result)

    return { success: true }
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error)
    return { success: false, error: error.message }
  }
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}


// ============================================================================
// BOOSTING EMAIL FUNCTIONS
// ============================================================================

/**
 * Send email to customer when a vendor submits an offer (accept or counter)
 */
export async function sendBoostNewOfferEmail(data: {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  offerPrice: number
  offerType: 'accept' | 'counter'
  requestId: string
  requestNumber: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_new_offer',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost new offer email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email to booster when their offer is accepted and paid
 */
export async function sendBoostOfferAcceptedEmail(data: {
  boosterEmail: string
  boosterUsername: string
  customerUsername: string
  currentRank: string
  desiredRank: string
  finalPrice: number
  boosterPayout: number
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_offer_accepted',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost offer accepted email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email to booster when customer submits credentials
 */
export async function sendBoostCredentialsSubmittedEmail(data: {
  boosterEmail: string
  boosterUsername: string
  customerUsername: string
  currentRank: string
  desiredRank: string
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_credentials_submitted',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost credentials submitted email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email to customer when booster starts the boost
 */
export async function sendBoostStartedEmail(data: {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_started',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost started email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email to customer with progress update
 */
export async function sendBoostProgressUpdateEmail(data: {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  newRank: string
  newRR: number
  gamesPlayed: number
  gamesWon: number
  notes?: string
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_progress_update',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost progress update email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send email to customer when boost is complete and needs confirmation
 */
export async function sendBoostPendingConfirmationEmail(data: {
  customerEmail: string
  customerUsername: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  startRank: string
  finalRank: string
  finalRR: number
  totalGames: number
  totalWins: number
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_pending_confirmation',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost pending confirmation email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send completion email to customer or booster
 */
export async function sendBoostCompletedEmail(data: {
  recipientType: 'customer' | 'booster'
  recipientEmail: string
  recipientUsername: string
  otherPartyUsername: string
  currentRank: string
  desiredRank: string
  finalRank: string
  totalGames: number
  completionTime: string
  boosterPayout?: number // Only for booster
  orderNumber: string
  orderId: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'boost_completed',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send boost completed email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send completion emails to both customer and booster
 */
export async function sendBoostCompletionEmails(params: {
  customerEmail: string
  customerUsername: string
  boosterEmail: string
  boosterUsername: string
  currentRank: string
  desiredRank: string
  finalRank: string
  totalGames: number
  completionTime: string
  boosterPayout: number
  orderNumber: string
  orderId: string
}): Promise<{ customerEmailSent: boolean; boosterEmailSent: boolean }> {
  const results = await Promise.allSettled([
    // Customer email
    sendBoostCompletedEmail({
      recipientType: 'customer',
      recipientEmail: params.customerEmail,
      recipientUsername: params.customerUsername,
      otherPartyUsername: params.boosterUsername,
      currentRank: params.currentRank,
      desiredRank: params.desiredRank,
      finalRank: params.finalRank,
      totalGames: params.totalGames,
      completionTime: params.completionTime,
      orderNumber: params.orderNumber,
      orderId: params.orderId
    }),
    // Booster email
    sendBoostCompletedEmail({
      recipientType: 'booster',
      recipientEmail: params.boosterEmail,
      recipientUsername: params.boosterUsername,
      otherPartyUsername: params.customerUsername,
      currentRank: params.currentRank,
      desiredRank: params.desiredRank,
      finalRank: params.finalRank,
      totalGames: params.totalGames,
      completionTime: params.completionTime,
      boosterPayout: params.boosterPayout,
      orderNumber: params.orderNumber,
      orderId: params.orderId
    })
  ])

  return {
    customerEmailSent: results[0].status === 'fulfilled' && (results[0].value as EmailResponse).success,
    boosterEmailSent: results[1].status === 'fulfilled' && (results[1].value as EmailResponse).success
  }
}

// ============================================================================
// MESSAGING EMAIL FUNCTIONS
// ============================================================================

/**
 * Send email notification when a user receives a new message
 */
export async function sendNewMessageEmail(data: {
  recipientEmail: string
  recipientUsername: string
  senderUsername: string
  messagePreview: string
  conversationId: string
  listingTitle?: string
  boostingOrderNumber?: string
}): Promise<EmailResponse> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        type: 'new_message',
        ...data
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send new message email:', error)
    return { success: false, error: error.message }
  }
}