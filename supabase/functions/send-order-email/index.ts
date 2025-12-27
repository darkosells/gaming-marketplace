// supabase/functions/send-order-email/index.ts
// Enhanced Edge Function with Professional Cosmic-Themed Email Templates
// All emails now feature consistent branding with purple-pink gradients and logo
// Includes Trustpilot AFS (Automatic Feedback Service) integration for order confirmations

// @ts-ignore - Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Import types
// @ts-ignore - Deno requires .ts extension
import type { 
  EmailRequest,
  OrderConfirmationData,
  DeliveryNotificationData,
  NewSaleData,
  DisputeData,
  WithdrawalData,
  PasswordChangedData,
  UsernameChangedData,
  WelcomeData,
  VerificationData,
  PasswordResetData,
  VendorApprovedData,
  VendorRejectedData,
  VendorResubmissionData,
  BoostNewOfferData,
  BoostOfferAcceptedData,
  BoostCredentialsSubmittedData,
  BoostStartedData,
  BoostProgressUpdateData,
  BoostPendingConfirmationData,
  BoostCompletedData,
  NewMessageData
} from './types.ts'

// Import shared config
// @ts-ignore - Deno requires .ts extension
import { TRUSTPILOT_AFS_EMAIL, TRUSTPILOT_AFS_ENABLED } from './templates/_shared.ts'

// Import all email template generators
// @ts-ignore - Deno requires .ts extension
import { generateOrderConfirmationEmail } from './templates/order-confirmation.ts'
// @ts-ignore - Deno requires .ts extension
import { generateDeliveryNotificationEmail } from './templates/delivery-notification.ts'
// @ts-ignore - Deno requires .ts extension
import { generateNewSaleEmail } from './templates/new-sale.ts'
// @ts-ignore - Deno requires .ts extension
import { generateDisputeEmail } from './templates/dispute.ts'
// @ts-ignore - Deno requires .ts extension
import { generateWithdrawalEmail } from './templates/withdrawal.ts'
// @ts-ignore - Deno requires .ts extension
import { generatePasswordChangedEmail } from './templates/password-changed.ts'
// @ts-ignore - Deno requires .ts extension
import { generateUsernameChangedEmail } from './templates/username-changed.ts'
// @ts-ignore - Deno requires .ts extension
import { generateWelcomeEmail } from './templates/welcome.ts'
// @ts-ignore - Deno requires .ts extension
import { generateVerificationEmail } from './templates/verification.ts'
// @ts-ignore - Deno requires .ts extension
import { generatePasswordResetEmail } from './templates/password-reset.ts'
// @ts-ignore - Deno requires .ts extension
import { generateVendorApprovedEmail } from './templates/vendor-approved.ts'
// @ts-ignore - Deno requires .ts extension
import { generateVendorRejectedEmail } from './templates/vendor-rejected.ts'
// @ts-ignore - Deno requires .ts extension
import { generateVendorResubmissionEmail } from './templates/vendor-resubmission.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostNewOfferEmail } from './templates/boost-new-offer.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostOfferAcceptedEmail } from './templates/boost-offer-accepted.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostCredentialsSubmittedEmail } from './templates/boost-credentials-submitted.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostStartedEmail } from './templates/boost-started.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostProgressUpdateEmail } from './templates/boost-progress-update.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostPendingConfirmationEmail } from './templates/boost-pending-confirmation.ts'
// @ts-ignore - Deno requires .ts extension
import { generateBoostCompletedEmail } from './templates/boost-completed.ts'
// @ts-ignore - Deno requires .ts extension
import { generateNewMessageEmail } from './templates/new-message.ts'

// @ts-ignore - Deno global
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Nashflare <noreply@nashflare.com>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const emailRequest: EmailRequest = await req.json()
    
    let subject = ''
    let htmlContent = ''
    let toEmail = ''
    let bccEmails: string[] = []

    switch (emailRequest.type) {
      case 'order_confirmation':
        toEmail = emailRequest.buyerEmail
        subject = `🎮 Order Confirmed - ${emailRequest.listingTitle}`
        htmlContent = generateOrderConfirmationEmail(emailRequest as unknown as OrderConfirmationData)
        // Add Trustpilot AFS as BCC for order confirmations
        if (TRUSTPILOT_AFS_ENABLED) {
          bccEmails.push(TRUSTPILOT_AFS_EMAIL)
        }
        break

      case 'delivery_notification':
        toEmail = emailRequest.buyerEmail
        subject = `🎉 Your Order Has Been Delivered - ${emailRequest.listingTitle}`
        htmlContent = generateDeliveryNotificationEmail(emailRequest as unknown as DeliveryNotificationData)
        break

      case 'new_sale':
        toEmail = emailRequest.sellerEmail
        subject = `💰 New Sale! - ${emailRequest.listingTitle}`
        htmlContent = generateNewSaleEmail(emailRequest as unknown as NewSaleData)
        break

      case 'dispute_opened':
        toEmail = emailRequest.recipientEmail
        subject = `⚠️ Dispute Opened - Order #${emailRequest.orderId.substring(0, 8)}`
        htmlContent = generateDisputeEmail(emailRequest as unknown as DisputeData)
        break

      case 'withdrawal_processed':
        toEmail = emailRequest.vendorEmail
        subject = `💸 Withdrawal Processed - $${emailRequest.amount.toFixed(2)}`
        htmlContent = generateWithdrawalEmail(emailRequest as unknown as WithdrawalData)
        break

      case 'password_changed':
        toEmail = emailRequest.userEmail
        subject = `🔒 Password Changed - Nashflare Security Alert`
        htmlContent = generatePasswordChangedEmail(emailRequest as unknown as PasswordChangedData)
        break

      case 'username_changed':
        toEmail = emailRequest.userEmail
        subject = `✨ Username Changed - Nashflare Account Update`
        htmlContent = generateUsernameChangedEmail(emailRequest as unknown as UsernameChangedData)
        break

      case 'welcome':
        toEmail = emailRequest.userEmail
        subject = `🎮 Welcome to Nashflare - Your Gaming Marketplace!`
        htmlContent = generateWelcomeEmail(emailRequest as unknown as WelcomeData)
        break

      case 'email_verification':
        toEmail = emailRequest.userEmail
        subject = `🔐 Verify Your Nashflare Account - Code: ${emailRequest.verificationCode}`
        htmlContent = generateVerificationEmail(emailRequest as unknown as VerificationData)
        break

      case 'password_reset':
        toEmail = emailRequest.userEmail
        subject = `🔐 Reset Your Password - Code: ${emailRequest.resetCode}`
        htmlContent = generatePasswordResetEmail(emailRequest as unknown as PasswordResetData)
        break

      case 'vendor_approved':
        toEmail = emailRequest.userEmail
        subject = `🎉 Congratulations! Your Vendor Application is Approved!`
        htmlContent = generateVendorApprovedEmail(emailRequest as unknown as VendorApprovedData)
        break

      case 'vendor_rejected':
        toEmail = emailRequest.userEmail
        subject = `📋 Vendor Application Update - Nashflare`
        htmlContent = generateVendorRejectedEmail(emailRequest as unknown as VendorRejectedData)
        break

      case 'vendor_resubmission_required':
        toEmail = emailRequest.userEmail
        subject = `🔄 Action Required: Vendor Application Needs Updates`
        htmlContent = generateVendorResubmissionEmail(emailRequest as unknown as VendorResubmissionData)
        break

      // ============================================
      // BOOSTING EMAILS
      // ============================================

      case 'boost_new_offer':
        toEmail = emailRequest.customerEmail
        subject = emailRequest.offerType === 'counter' 
          ? `💬 Counter Offer Received - ${emailRequest.currentRank} → ${emailRequest.desiredRank}`
          : `🎯 New Boost Offer - ${emailRequest.currentRank} → ${emailRequest.desiredRank}`
        htmlContent = generateBoostNewOfferEmail(emailRequest as unknown as BoostNewOfferData)
        break

      case 'boost_offer_accepted':
        toEmail = emailRequest.boosterEmail
        subject = `🎉 Offer Accepted & Paid - Order #${emailRequest.orderNumber}`
        htmlContent = generateBoostOfferAcceptedEmail(emailRequest as unknown as BoostOfferAcceptedData)
        break

      case 'boost_credentials_submitted':
        toEmail = emailRequest.boosterEmail
        subject = `🔐 Credentials Received - Order #${emailRequest.orderNumber} Ready to Start!`
        htmlContent = generateBoostCredentialsSubmittedEmail(emailRequest as unknown as BoostCredentialsSubmittedData)
        break

      case 'boost_started':
        toEmail = emailRequest.customerEmail
        subject = `🚀 Boost Started - Order #${emailRequest.orderNumber}`
        htmlContent = generateBoostStartedEmail(emailRequest as unknown as BoostStartedData)
        break

      case 'boost_progress_update':
        toEmail = emailRequest.customerEmail
        subject = `📈 Progress Update - Now at ${emailRequest.newRank} (${emailRequest.newRR} RR)`
        htmlContent = generateBoostProgressUpdateEmail(emailRequest as unknown as BoostProgressUpdateData)
        break

      case 'boost_pending_confirmation':
        toEmail = emailRequest.customerEmail
        subject = `🎯 Boost Complete - Please Confirm! Order #${emailRequest.orderNumber}`
        htmlContent = generateBoostPendingConfirmationEmail(emailRequest as unknown as BoostPendingConfirmationData)
        break

      case 'boost_completed':
        toEmail = emailRequest.recipientEmail
        subject = emailRequest.recipientType === 'customer'
          ? `🏆 Boost Complete - Order #${emailRequest.orderNumber}`
          : `💰 Payment Released - +$${emailRequest.boosterPayout?.toFixed(2)} Order #${emailRequest.orderNumber}`
        htmlContent = generateBoostCompletedEmail(emailRequest as unknown as BoostCompletedData)
        break

      // ============================================
      // MESSAGING EMAILS
      // ============================================

      case 'new_message':
        toEmail = emailRequest.recipientEmail
        subject = `💬 New message from ${emailRequest.senderUsername} - Nashflare`
        htmlContent = generateNewMessageEmail(emailRequest as unknown as NewMessageData)
        break

      default:
        throw new Error(`Unknown email type: ${emailRequest.type}`)
    }

    // Build email payload
    const emailPayload: any = {
      from: FROM_EMAIL,
      to: [toEmail],
      subject: subject,
      html: htmlContent,
    }

    // Add BCC if any
    if (bccEmails.length > 0) {
      emailPayload.bcc = bccEmails
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Resend API error: ${error}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})