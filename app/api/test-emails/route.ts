// app/api/test-emails/route.ts
// Test API route to send test emails
// Access via: /api/test-emails?type=all&email=your@email.com
// Or: /api/test-emails?type=boost_started&email=your@email.com

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// All test email payloads
function getTestPayloads(email: string) {
  return {
    // ============================================
    // MARKETPLACE EMAILS
    // ============================================
    order_confirmation: {
      type: 'order_confirmation',
      buyerEmail: email,
      buyerUsername: 'TestBuyer',
      sellerUsername: 'ProSeller',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      quantity: 1,
      amount: 49.99,
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    },
    delivery_notification: {
      type: 'delivery_notification',
      buyerEmail: email,
      buyerUsername: 'TestBuyer',
      sellerUsername: 'ProSeller',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      orderId: 'test-order-12345678-abcd-efgh-ijkl',
      deliveryCode: 'USERNAME: EpicGamer123\nPASSWORD: SecurePass456\nEMAIL: gamer@email.com\n\nPlease change the password immediately!'
    },
    new_sale: {
      type: 'new_sale',
      sellerEmail: email,
      sellerUsername: 'ProSeller',
      buyerUsername: 'TestBuyer',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      quantity: 1,
      amount: 47.49,
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    },
    dispute_opened: {
      type: 'dispute_opened',
      recipientEmail: email,
      recipientUsername: 'ProSeller',
      openedBy: 'TestBuyer',
      disputeReason: 'The account credentials provided do not work. I tried logging in multiple times but keep getting "invalid password" error.',
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    },
    withdrawal_processed: {
      type: 'withdrawal_processed',
      vendorEmail: email,
      vendorUsername: 'ProSeller',
      amount: 150.00,
      method: 'Bitcoin (BTC)',
      transactionId: 'btc_tx_abc123def456ghi789'
    },
    password_changed: {
      type: 'password_changed',
      userEmail: email,
      username: 'TestUser'
    },
    username_changed: {
      type: 'username_changed',
      userEmail: email,
      oldUsername: 'OldUsername123',
      newUsername: 'NewAwesomeName'
    },
    welcome: {
      type: 'welcome',
      userEmail: email,
      username: 'NewGamer2025'
    },
    email_verification: {
      type: 'email_verification',
      userEmail: email,
      username: 'NewGamer2025',
      verificationCode: '847291'
    },
    password_reset: {
      type: 'password_reset',
      userEmail: email,
      username: 'TestUser',
      resetCode: '593847'
    },
    vendor_approved: {
      type: 'vendor_approved',
      userEmail: email,
      username: 'NewVendor'
    },
    vendor_rejected: {
      type: 'vendor_rejected',
      userEmail: email,
      username: 'RejectedUser',
      rejectionReason: 'The ID document provided appears to be altered or invalid.'
    },
    vendor_resubmission_required: {
      type: 'vendor_resubmission_required',
      userEmail: email,
      username: 'PendingVendor',
      resubmissionFields: ['id_front', 'selfie'],
      resubmissionInstructions: 'Your ID front photo is blurry. Please retake in good lighting.'
    },

    // ============================================
    // BOOSTING EMAILS
    // ============================================
    boost_new_offer: {
      type: 'boost_new_offer',
      customerEmail: email,
      customerUsername: 'GamerPro',
      boosterUsername: 'RadiantBooster',
      currentRank: 'Gold 2',
      desiredRank: 'Platinum 1',
      offerPrice: 45.00,
      estimatedDays: 3,
      offerType: 'accept',
      requestId: 'test-request-12345678'
    },
    boost_new_offer_counter: {
      type: 'boost_new_offer',
      customerEmail: email,
      customerUsername: 'GamerPro',
      boosterUsername: 'RadiantBooster',
      currentRank: 'Gold 2',
      desiredRank: 'Platinum 1',
      offerPrice: 55.00,
      estimatedDays: 2,
      offerType: 'counter',
      requestId: 'test-request-12345678'
    },
    boost_offer_accepted: {
      type: 'boost_offer_accepted',
      boosterEmail: email,
      boosterUsername: 'RadiantBooster',
      customerUsername: 'GamerPro',
      currentRank: 'Gold 2',
      desiredRank: 'Platinum 1',
      finalPrice: 45.00,
      boosterPayout: 41.40,
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_credentials_submitted: {
      type: 'boost_credentials_submitted',
      boosterEmail: email,
      boosterUsername: 'RadiantBooster',
      customerUsername: 'GamerPro',
      currentRank: 'Gold 2',
      desiredRank: 'Platinum 1',
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_started: {
      type: 'boost_started',
      customerEmail: email,
      customerUsername: 'GamerPro',
      boosterUsername: 'RadiantBooster',
      currentRank: 'Gold 2',
      desiredRank: 'Platinum 1',
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_progress_update: {
      type: 'boost_progress_update',
      customerEmail: email,
      customerUsername: 'GamerPro',
      boosterUsername: 'RadiantBooster',
      currentRank: 'Gold 2',
      newRank: 'Gold 3',
      newRR: 67,
      desiredRank: 'Platinum 1',
      gamesPlayed: 8,
      gamesWon: 6,
      notes: 'Great session today! Won 6 out of 8 games. Your account is playing really well. Should reach Platinum by tomorrow!',
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_pending_confirmation: {
      type: 'boost_pending_confirmation',
      customerEmail: email,
      customerUsername: 'GamerPro',
      boosterUsername: 'RadiantBooster',
      startRank: 'Gold 2',
      finalRank: 'Platinum 1',
      finalRR: 24,
      desiredRank: 'Platinum 1',
      totalGames: 18,
      totalWins: 14,
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_completed_customer: {
      type: 'boost_completed',
      recipientEmail: email,
      recipientUsername: 'GamerPro',
      recipientType: 'customer',
      otherPartyUsername: 'RadiantBooster',
      startRank: 'Gold 2',
      finalRank: 'Platinum 1',
      desiredRank: 'Platinum 1',
      totalGames: 18,
      totalWins: 14,
      finalPrice: 45.00,
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    },
    boost_completed_booster: {
      type: 'boost_completed',
      recipientEmail: email,
      recipientUsername: 'RadiantBooster',
      recipientType: 'booster',
      otherPartyUsername: 'GamerPro',
      startRank: 'Gold 2',
      finalRank: 'Platinum 1',
      desiredRank: 'Platinum 1',
      totalGames: 18,
      totalWins: 14,
      finalPrice: 45.00,
      boosterPayout: 41.40,
      orderId: 'test-boost-order-12345678',
      orderNumber: 'BOOST-2024-001'
    }
  }
}

async function sendEmail(payload: any) {
  const { data, error } = await supabase.functions.invoke('send-order-email', {
    body: payload
  })
  return { data, error }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ 
      error: 'Email parameter required',
      usage: '/api/test-emails?type=all&email=your@email.com',
      availableTypes: [
        'all',
        'all_boosting',
        '--- Marketplace ---',
        'order_confirmation',
        'delivery_notification', 
        'new_sale',
        'dispute_opened',
        'withdrawal_processed',
        'password_changed',
        'username_changed',
        'welcome',
        'email_verification',
        'password_reset',
        'vendor_approved',
        'vendor_rejected',
        'vendor_resubmission_required',
        '--- Boosting ---',
        'boost_new_offer',
        'boost_new_offer_counter',
        'boost_offer_accepted',
        'boost_credentials_submitted',
        'boost_started',
        'boost_progress_update',
        'boost_pending_confirmation',
        'boost_completed_customer',
        'boost_completed_booster'
      ]
    }, { status: 400 })
  }

  if (!type) {
    return NextResponse.json({ 
      error: 'Type parameter required',
      availableTypes: ['all', 'all_boosting', ...Object.keys(getTestPayloads(email))]
    }, { status: 400 })
  }

  const payloads = getTestPayloads(email)

  // Send ALL emails
  if (type === 'all') {
    const results: any[] = []
    const emailTypes = Object.keys(payloads) as (keyof typeof payloads)[]

    for (const emailType of emailTypes) {
      const payload = payloads[emailType]
      const { data, error } = await sendEmail(payload)
      
      results.push({
        type: emailType,
        success: !error,
        error: error?.message || null
      })

      // Wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Sent ${successCount}/${results.length} emails to ${email}`,
      successCount,
      failCount,
      results
    })
  }

  // Send ALL BOOSTING emails only
  if (type === 'all_boosting') {
    const boostingTypes = [
      'boost_new_offer',
      'boost_new_offer_counter',
      'boost_offer_accepted',
      'boost_credentials_submitted',
      'boost_started',
      'boost_progress_update',
      'boost_pending_confirmation',
      'boost_completed_customer',
      'boost_completed_booster'
    ]
    
    const results: any[] = []

    for (const emailType of boostingTypes) {
      const payload = payloads[emailType as keyof typeof payloads]
      const { data, error } = await sendEmail(payload)
      
      results.push({
        type: emailType,
        success: !error,
        error: error?.message || null
      })

      // Wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      message: `Sent ${successCount}/${results.length} boosting emails to ${email}`,
      successCount,
      failCount,
      results
    })
  }

  // Send single email type
  const payload = payloads[type as keyof typeof payloads]
  
  if (!payload) {
    return NextResponse.json({ 
      error: `Unknown email type: ${type}`,
      availableTypes: Object.keys(payloads)
    }, { status: 400 })
  }

  const { data, error } = await sendEmail(payload)

  if (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }

  return NextResponse.json({ 
    success: true, 
    message: `${type} email sent to ${email}`,
    data 
  })
}