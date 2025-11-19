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

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}