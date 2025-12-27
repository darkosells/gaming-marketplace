// supabase/functions/send-order-email/test-emails.ts
// Test script to send all email types
// Run with: npx ts-node test-emails.ts
// Or use in a Next.js API route for testing

// ⚠️ IMPORTANT: Update this email to YOUR email address for testing
const TEST_EMAIL = 'your-email@example.com' // <-- CHANGE THIS!

// Your Supabase Edge Function URL (update after deploying, or use local)
const EDGE_FUNCTION_URL = 'https://your-project.supabase.co/functions/v1/send-order-email'
// For local testing: 'http://localhost:54321/functions/v1/send-order-email'

// Your Supabase Anon Key (for authorization)
const SUPABASE_ANON_KEY = 'your-anon-key-here' // <-- CHANGE THIS!

interface TestEmail {
  name: string
  payload: any
}

const testEmails: TestEmail[] = [
  {
    name: 'Order Confirmation',
    payload: {
      type: 'order_confirmation',
      buyerEmail: TEST_EMAIL,
      buyerUsername: 'TestBuyer',
      sellerUsername: 'ProSeller',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      quantity: 1,
      amount: 49.99,
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    }
  },
  {
    name: 'Delivery Notification',
    payload: {
      type: 'delivery_notification',
      buyerEmail: TEST_EMAIL,
      buyerUsername: 'TestBuyer',
      sellerUsername: 'ProSeller',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      orderId: 'test-order-12345678-abcd-efgh-ijkl',
      deliveryCode: 'USERNAME: EpicGamer123\nPASSWORD: SecurePass456\nEMAIL: gamer@email.com\n\nPlease change the password immediately after login!'
    }
  },
  {
    name: 'New Sale (Seller)',
    payload: {
      type: 'new_sale',
      sellerEmail: TEST_EMAIL,
      sellerUsername: 'ProSeller',
      buyerUsername: 'TestBuyer',
      listingTitle: 'Fortnite Account - 500 V-Bucks + Rare Skins',
      quantity: 1,
      amount: 47.49, // After 5% commission
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    }
  },
  {
    name: 'Dispute Opened',
    payload: {
      type: 'dispute_opened',
      recipientEmail: TEST_EMAIL,
      recipientUsername: 'ProSeller',
      openedBy: 'TestBuyer',
      disputeReason: 'The account credentials provided do not work. I tried logging in multiple times but keep getting "invalid password" error. Please help resolve this issue.',
      orderId: 'test-order-12345678-abcd-efgh-ijkl'
    }
  },
  {
    name: 'Withdrawal Processed',
    payload: {
      type: 'withdrawal_processed',
      vendorEmail: TEST_EMAIL,
      vendorUsername: 'ProSeller',
      amount: 150.00,
      method: 'Bitcoin (BTC)',
      transactionId: 'btc_tx_abc123def456ghi789'
    }
  },
  {
    name: 'Password Changed',
    payload: {
      type: 'password_changed',
      userEmail: TEST_EMAIL,
      username: 'TestUser'
    }
  },
  {
    name: 'Username Changed',
    payload: {
      type: 'username_changed',
      userEmail: TEST_EMAIL,
      oldUsername: 'OldUsername123',
      newUsername: 'NewAwesomeName'
    }
  },
  {
    name: 'Welcome',
    payload: {
      type: 'welcome',
      userEmail: TEST_EMAIL,
      username: 'NewGamer2025'
    }
  },
  {
    name: 'Email Verification',
    payload: {
      type: 'email_verification',
      userEmail: TEST_EMAIL,
      username: 'NewGamer2025',
      verificationCode: '847291'
    }
  },
  {
    name: 'Password Reset',
    payload: {
      type: 'password_reset',
      userEmail: TEST_EMAIL,
      username: 'TestUser',
      resetCode: '593847'
    }
  },
  {
    name: 'Vendor Approved',
    payload: {
      type: 'vendor_approved',
      userEmail: TEST_EMAIL,
      username: 'NewVendor'
    }
  },
  {
    name: 'Vendor Rejected',
    payload: {
      type: 'vendor_rejected',
      userEmail: TEST_EMAIL,
      username: 'RejectedUser',
      rejectionReason: 'The ID document provided appears to be altered or invalid. We detected inconsistencies in the document that do not meet our verification standards.'
    }
  },
  {
    name: 'Vendor Resubmission Required',
    payload: {
      type: 'vendor_resubmission_required',
      userEmail: TEST_EMAIL,
      username: 'PendingVendor',
      resubmissionFields: ['id_front', 'selfie'],
      resubmissionInstructions: 'Your ID front photo is blurry and text is not readable. Your selfie does not clearly show your face alongside the ID. Please retake both photos in good lighting conditions.'
    }
  }
]

// Function to send a single test email
async function sendTestEmail(test: TestEmail): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(test.payload)
    })

    const data = await response.json()
    
    if (data.success) {
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Function to send all test emails with delay
async function sendAllTestEmails() {
  console.log('🚀 Starting Email Tests...\n')
  console.log(`📧 Sending to: ${TEST_EMAIL}\n`)
  console.log('=' .repeat(50))

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < testEmails.length; i++) {
    const test = testEmails[i]
    console.log(`\n[${i + 1}/${testEmails.length}] Sending: ${test.name}...`)
    
    const result = await sendTestEmail(test)
    
    if (result.success) {
      console.log(`   ✅ SUCCESS`)
      successCount++
    } else {
      console.log(`   ❌ FAILED: ${result.error}`)
      failCount++
    }

    // Wait 2 seconds between emails to avoid rate limiting
    if (i < testEmails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n📊 Results: ${successCount} passed, ${failCount} failed`)
  console.log(`\n📬 Check your inbox at: ${TEST_EMAIL}`)
}

// Export for use in other files
export { testEmails, sendTestEmail, sendAllTestEmails }

// Run if executed directly
// sendAllTestEmails()