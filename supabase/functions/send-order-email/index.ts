// supabase/functions/send-order-email/index.ts
// Enhanced Edge Function with Professional Cosmic-Themed Email Templates
// All emails now feature consistent branding with purple-pink gradients and logo

// @ts-ignore - Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// @ts-ignore - Deno global
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = 'Nashflare <noreply@nashflare.com>'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  type: 'order_confirmation' | 'delivery_notification' | 'new_sale' | 'dispute_opened' | 'withdrawal_processed' | 'password_changed' | 'username_changed' | 'welcome' | 'email_verification' | 'password_reset'
  [key: string]: any
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

    switch (emailRequest.type) {
      case 'order_confirmation':
        toEmail = emailRequest.buyerEmail
        subject = `🎮 Order Confirmed - ${emailRequest.listingTitle}`
        htmlContent = generateOrderConfirmationEmail(emailRequest)
        break

      case 'delivery_notification':
        toEmail = emailRequest.buyerEmail
        subject = `🎉 Your Order Has Been Delivered - ${emailRequest.listingTitle}`
        htmlContent = generateDeliveryNotificationEmail(emailRequest)
        break

      case 'new_sale':
        toEmail = emailRequest.sellerEmail
        subject = `💰 New Sale! - ${emailRequest.listingTitle}`
        htmlContent = generateNewSaleEmail(emailRequest)
        break

      case 'dispute_opened':
        toEmail = emailRequest.recipientEmail
        subject = `⚠️ Dispute Opened - Order #${emailRequest.orderId.substring(0, 8)}`
        htmlContent = generateDisputeEmail(emailRequest)
        break

      case 'withdrawal_processed':
        toEmail = emailRequest.vendorEmail
        subject = `💸 Withdrawal Processed - $${emailRequest.amount.toFixed(2)}`
        htmlContent = generateWithdrawalEmail(emailRequest)
        break

      case 'password_changed':
        toEmail = emailRequest.userEmail
        subject = `🔒 Password Changed - Nashflare Security Alert`
        htmlContent = generatePasswordChangedEmail(emailRequest)
        break

      case 'username_changed':
        toEmail = emailRequest.userEmail
        subject = `✨ Username Changed - Nashflare Account Update`
        htmlContent = generateUsernameChangedEmail(emailRequest)
        break

      case 'welcome':
        toEmail = emailRequest.userEmail
        subject = `🎮 Welcome to Nashflare - Your Gaming Marketplace!`
        htmlContent = generateWelcomeEmail(emailRequest)
        break

      case 'email_verification':
        toEmail = emailRequest.userEmail
        subject = `🔐 Verify Your Nashflare Account - Code: ${emailRequest.verificationCode}`
        htmlContent = generateVerificationEmail(emailRequest)
        break

      case 'password_reset':
        toEmail = emailRequest.userEmail
        subject = `🔐 Reset Your Password - Code: ${emailRequest.resetCode}`
        htmlContent = generatePasswordResetEmail(emailRequest)
        break

      default:
        throw new Error(`Unknown email type: ${emailRequest.type}`)
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: subject,
        html: htmlContent,
      }),
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

// ============================================
// SHARED EMAIL COMPONENTS
// ============================================

// Logo URL - PNG version for better email client compatibility
// Try these URLs in order of likelihood:
const LOGO_URLS = [
  'https://gaming-marketplace-five.vercel.app/nashflare-logo.png',
  'https://gaming-marketplace-five.vercel.app/nashflare-logo',
  'https://gaming-marketplace-five.vercel.app/logo.png',
  'https://gaming-marketplace-five.vercel.app/nashflare.png',
]
const LOGO_URL = LOGO_URLS[0] // Update index if first one doesn't work
const USE_LOGO_IMAGE = true // Using PNG logo

function getEmailHeader(title: string): string {
  const logoHTML = USE_LOGO_IMAGE 
    ? `<img src="${LOGO_URL}" alt="Nashflare" width="80" height="80" style="display: inline-block; vertical-align: middle;" />`
    : `
    <!-- Stylized Text Logo -->
    <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); border: 3px solid rgba(255,255,255,0.5); border-radius: 20px; backdrop-filter: blur(10px); position: relative; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div style="font-size: 42px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 12px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">N</div>
      </div>
      <div style="position: absolute; bottom: 2px; right: 2px; width: 20px; height: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; border: 2px solid rgba(255,255,255,0.9);"></div>
    </div>
    `
    
  return `
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 48px 40px; text-align: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);"></div>
        
        <!-- Logo -->
        <div style="margin-bottom: 20px; position: relative;">
          ${logoHTML}
        </div>
        
        <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;">
          Nashflare
        </h1>
        <div style="margin: 16px 0 0; display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 10px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);">
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${title}</p>
        </div>
      </td>
    </tr>
  `
}

function getEmailFooter(): string {
  return `
    <tr>
      <td style="background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%); padding: 32px 40px; text-align: center; border-top: 1px solid rgba(167, 139, 250, 0.2);">
        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; line-height: 1.6;">
          © 2025 Nashflare. All rights reserved.
        </p>
        <p style="margin: 0; color: #475569; font-size: 11px; line-height: 1.5;">
          The ultimate marketplace for gaming accounts, currency, and items.
        </p>
      </td>
    </tr>
  `
}

// ============================================
// EMAIL TEMPLATE GENERATORS
// ============================================

function generateOrderConfirmationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('ORDER CONFIRMATION')}
              
              <!-- Main Content Area -->
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Success Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 12px 28px; border-radius: 50px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);">
                          <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">✓ ORDER PLACED SUCCESSFULLY</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Thanks for your order, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.buyerUsername}</span>!
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Your order has been confirmed and ${data.sellerUsername} has been notified. We'll send you another email once your items are delivered.
                  </p>
                  
                  <!-- Order Details Card with Glassmorphism -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">📦 Order Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <p style="color: #ffffff; margin: 0 0 16px; font-size: 20px; font-weight: 700; line-height: 1.4;">
                          ${data.listingTitle}
                        </p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Quantity</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 14px; font-weight: 600;">${data.quantity}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Seller</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 14px; font-weight: 600;">${data.sellerUsername}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Order ID</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderId.substring(0, 8).toUpperCase()}</p>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 700;">Total Paid</p>
                                  </td>
                                  <td align="right">
                                    <p style="margin: 0; color: #34d399; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                      $${data.amount.toFixed(2)}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">📦 What's Next?</strong><br>
                          The seller is preparing your order. You'll receive your items via our secure messaging system. Check your messages regularly for delivery updates!
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Protection Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="padding: 20px 24px; text-align: center;">
                        <p style="margin: 0 0 8px; color: #34d399; font-size: 24px;">🛡️</p>
                        <p style="margin: 0; color: #6ee7b7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                          Protected by Nashflare Buyer Protection
                        </p>
                        <p style="margin: 8px 0 0; color: #86efac; font-size: 12px;">
                          48-hour guarantee • Secure escrow • Dispute resolution
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateDeliveryNotificationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('🎉 ORDER DELIVERED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Celebration Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">🎊</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Great news, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.buyerUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    Your order has been delivered by <strong style="color: #cbd5e1;">${data.sellerUsername}</strong>
                  </p>
                  
                  <!-- Delivery Code Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="margin: 0 0 16px; color: #fbbf24; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🔑 Your Delivery Code</p>
                        <div style="background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; margin-bottom: 12px;">
                          <p style="margin: 0; font-family: 'Courier New', monospace; font-size: 16px; color: #fde047; word-break: break-all; line-height: 1.6; font-weight: 600;">
                            ${data.deliveryCode}
                          </p>
                        </div>
                        <p style="margin: 0; color: #fcd34d; font-size: 12px;">
                          Save this code - you'll need it to access your items
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Item Details -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Item</p>
                        <p style="margin: 0 0 16px; color: #ffffff; font-size: 16px; font-weight: 600;">${data.listingTitle}</p>
                        <p style="margin: 0 0 4px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase;">Order ID</p>
                        <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-family: 'Courier New', monospace;">#${data.orderId.substring(0, 8).toUpperCase()}</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Critical Warning -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #f87171;">⚠️ Important - Action Required</strong><br><br>
                          You have <strong style="color: #fee2e2;">48 hours</strong> to verify your delivery. If there's any issue with your order, please open a dispute before the buyer protection period ends. After 48 hours, the funds will be released to the seller.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Buttons -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="padding: 8px;">
                        <a href="https://nashflare.com/orders/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);">
                          View Order Details →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateNewSaleEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('💰 NEW SALE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Celebration -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">💸</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Congratulations, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.sellerUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    You just made a sale! 🎉
                  </p>
                  
                  <!-- Sale Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">💰 Sale Details</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <p style="color: #ffffff; margin: 0 0 20px; font-size: 20px; font-weight: 700; line-height: 1.4;">
                          ${data.listingTitle}
                        </p>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Quantity Sold</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 14px; font-weight: 600;">${data.quantity}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Buyer</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 14px; font-weight: 600;">${data.buyerUsername}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Order ID</p>
                            </td>
                            <td align="right" style="padding: 8px 0;">
                              <p style="margin: 0; color: #cbd5e1; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderId.substring(0, 8).toUpperCase()}</p>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: #a78bfa; font-size: 15px; font-weight: 700;">You Earned</p>
                                  </td>
                                  <td align="right">
                                    <p style="margin: 0; color: #34d399; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                      +$${data.amount.toFixed(2)}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Required Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">📦 Action Required</strong><br><br>
                          Please deliver the items to your buyer as soon as possible to maintain your seller rating and ensure customer satisfaction!
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/orders/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);">
                          Deliver Order Now →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateDisputeEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('⚠️ DISPUTE OPENED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Alert Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; padding: 12px 28px; border-radius: 50px;">
                          <p style="margin: 0; color: #fca5a5; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">⚠️ ATTENTION REQUIRED</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2; text-align: center;">
                    Hello <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.recipientUsername}</span>
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    A dispute has been opened on your order and requires your immediate attention.
                  </p>
                  
                  <!-- Dispute Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(239, 68, 68, 0.15); padding: 20px 24px; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                        <p style="margin: 0; color: #fca5a5; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">⚠️ Dispute Information</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">Opened By</p>
                              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${data.openedBy}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                              <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">Reason</p>
                              <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.5;">${data.disputeReason}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                              <p style="margin: 0 0 4px; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">Order ID</p>
                              <p style="margin: 0; color: #cbd5e1; font-size: 13px; font-family: 'Courier New', monospace;">#${data.orderId.substring(0, 8).toUpperCase()}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Required -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">🔍 What Happens Next?</strong><br><br>
                          Please respond to this dispute in your dashboard with your side of the story. Our admin team will review all evidence from both parties and make a fair decision. Quick responses help resolve disputes faster!
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/disputes/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);">
                          Respond to Dispute →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateWithdrawalEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('💸 WITHDRAWAL PROCESSED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">💵</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Great news, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.vendorUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    Your withdrawal has been processed successfully.
                  </p>
                  
                  <!-- Amount Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 2px solid rgba(16, 185, 129, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 40px; text-align: center;">
                        <p style="margin: 0 0 16px; color: #6ee7b7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Withdrawal Amount</p>
                        <p style="margin: 0 0 24px; color: #34d399; font-size: 48px; font-weight: 800; letter-spacing: -2px; text-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);">
                          $${data.amount.toFixed(2)}
                        </p>
                        <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px;">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding: 8px 0; text-align: left;">
                                <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 500;">Payment Method</p>
                              </td>
                              <td align="right" style="padding: 8px 0;">
                                <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 600;">${data.method}</p>
                              </td>
                            </tr>
                            ${data.transactionId ? `
                            <tr>
                              <td style="padding: 8px 0; text-align: left; border-top: 1px solid rgba(255,255,255,0.05);">
                                <p style="margin: 0; color: #64748b; font-size: 13px; font-weight: 500;">Transaction ID</p>
                              </td>
                              <td align="right" style="padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                                <p style="margin: 0; color: #cbd5e1; font-size: 11px; font-family: 'Courier New', monospace;">${data.transactionId}</p>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">ℹ️ Processing Time</strong><br><br>
                          The funds should arrive in your account within <strong style="color: #d8b4fe;">1-3 business days</strong> depending on your payment method. If you have any questions, feel free to contact our support team!
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generatePasswordChangedEmail(data: any): string {
  const changeTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('🔒 SECURITY ALERT')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Password Changed Successfully
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Hi <strong style="color: #cbd5e1;">${data.username}</strong>, your password has been updated.
                  </p>
                  
                  <!-- Success Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 28px 24px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <p style="margin: 0 0 8px; color: #6ee7b7; font-size: 16px; font-weight: 700;">
                          Password Updated
                        </p>
                        <p style="margin: 0; color: #86efac; font-size: 13px;">
                          Changed on: ${changeTime}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #f87171;">⚠️ Didn't change your password?</strong><br><br>
                          If you didn't make this change, your account may be compromised. Please contact our support team immediately and secure your account.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Tips -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">💡 Security Tips</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          • Use a unique password for Nashflare<br>
                          • Never share your password with anyone<br>
                          • Enable two-factor authentication when available<br>
                          • Use a password manager for extra security
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateUsernameChangedEmail(data: any): string {
  const changeTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('✨ ACCOUNT UPDATE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Username Changed Successfully
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Your username has been updated on Nashflare.
                  </p>
                  
                  <!-- Username Change Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="margin: 0 0 24px; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Username Change</p>
                        
                        <!-- Old Username -->
                        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Previous Username</p>
                          <p style="margin: 0; color: #f87171; font-size: 20px; font-weight: 700; text-decoration: line-through; opacity: 0.7;">
                            ${data.oldUsername}
                          </p>
                        </div>
                        
                        <!-- Arrow -->
                        <div style="text-align: center; margin: 16px 0;">
                          <span style="color: #a78bfa; font-size: 32px; font-weight: bold;">↓</span>
                        </div>
                        
                        <!-- New Username -->
                        <div style="background: linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%); border: 2px solid rgba(167, 139, 250, 0.4); border-radius: 12px; padding: 20px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">New Username</p>
                          <p style="margin: 0; color: #34d399; font-size: 24px; font-weight: 800;">
                            ${data.newUsername}
                          </p>
                        </div>
                        
                        <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; text-align: center;">
                          Changed on: <span style="color: #94a3b8;">${changeTime}</span>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">ℹ️ What this means</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          • Your new username is now active across all of Nashflare<br>
                          • Other users will see your new username in chats and listings<br>
                          • Your profile URL will use your new username<br>
                          • All your orders and reviews remain unchanged
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateWelcomeEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              <!-- Welcome Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 48px 40px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);"></div>
                  
                  <!-- Logo -->
                  <div style="margin-bottom: 20px; position: relative;">
                    ${USE_LOGO_IMAGE 
                      ? `<img src="${LOGO_URL}" alt="Nashflare" width="100" height="100" style="display: inline-block; vertical-align: middle;" />`
                      : `
                      <div style="display: inline-block; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); border: 4px solid rgba(255,255,255,0.5); border-radius: 24px; backdrop-filter: blur(10px); position: relative; box-shadow: 0 12px 40px rgba(0,0,0,0.4);">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                          <div style="font-size: 52px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 16px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">N</div>
                        </div>
                        <div style="position: absolute; bottom: 4px; right: 4px; width: 24px; height: 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; border: 3px solid rgba(255,255,255,0.9);"></div>
                      </div>
                      `
                    }
                  </div>
                  
                  <div style="font-size: 64px; margin-bottom: 16px; position: relative;">🎮</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 40px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;">
                    Welcome to Nashflare!
                  </h1>
                  <p style="margin: 16px 0 0; color: rgba(255,255,255,0.95); font-size: 17px; font-weight: 500; position: relative;">
                    Your Gaming Marketplace Adventure Begins
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>! 🎉
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Welcome to <strong style="color: #cbd5e1;">Nashflare</strong> - the ultimate marketplace for gaming accounts, in-game currency, items, and game keys. We're excited to have you join our growing community!
                  </p>
                  
                  <!-- Features Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                    <tr>
                      <td style="background: linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✨ What You Can Do</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        
                        <!-- Feature 1 -->
                        <div style="margin-bottom: 24px; padding-left: 16px; border-left: 3px solid #8b5cf6;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">🛒 Browse & Buy</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Find amazing deals on gaming accounts, in-game currency, rare items, and exclusive game keys across all popular games.
                          </p>
                        </div>
                        
                        <!-- Feature 2 -->
                        <div style="margin-bottom: 24px; padding-left: 16px; border-left: 3px solid #ec4899;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">💰 Sell Your Items</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Want to earn money? Upgrade to vendor status and start listing your gaming assets to thousands of buyers.
                          </p>
                        </div>
                        
                        <!-- Feature 3 -->
                        <div style="padding-left: 16px; border-left: 3px solid #10b981;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">🔒 Safe & Secure</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Shop with confidence! Every transaction is protected by our 48-hour buyer protection, secure escrow system, and dispute resolution.
                          </p>
                        </div>
                        
                      </td>
                    </tr>
                  </table>

                  <!-- Account Ready Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px; text-align: center;">
                        <p style="margin: 0 0 8px; color: #34d399; font-size: 20px;">✅</p>
                        <p style="margin: 0; color: #6ee7b7; font-size: 15px; font-weight: 700;">
                          Your account is ready!
                        </p>
                        <p style="margin: 8px 0 0; color: #86efac; font-size: 13px;">
                          Start exploring the marketplace and find your next gaming treasure.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/browse" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);">
                          Start Browsing →
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generateVerificationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('🔐 EMAIL VERIFICATION')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>! 👋
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Thanks for signing up for Nashflare! To complete your registration and secure your account, please verify your email address.
                  </p>
                  
                  <!-- Verification Code Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%); border: 3px solid rgba(139, 92, 246, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 12px 48px rgba(139, 92, 246, 0.3); margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 48px 32px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔐</div>
                        <p style="margin: 0 0 24px; color: #a78bfa; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
                        <div style="background: rgba(0,0,0,0.4); border-radius: 16px; padding: 28px 20px; display: inline-block; min-width: 280px; border: 2px solid rgba(167, 139, 250, 0.2);">
                          <p style="margin: 0; font-size: 56px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace; text-shadow: 0 4px 12px rgba(139, 92, 246, 0.5);">
                            ${data.verificationCode}
                          </p>
                        </div>
                        <p style="margin: 24px 0 0; color: #c4b5fd; font-size: 13px;">
                          Enter this code on the verification page to activate your account
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid #fbbf24; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fde047; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #fbbf24;">⏰ Important:</strong><br>
                          This verification code will expire in <strong style="color: #fef08a;">10 minutes</strong> for security reasons. If it expires, you can request a new code.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color:#f87171;">🔒 Security Note:</strong><br><br>
                          Never share this code with anyone. Nashflare will <strong>never</strong> ask for your verification code via email, phone, or any other method. If you receive such a request, it's a scam!
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Additional Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                          If you didn't create an account on Nashflare,<br>
                          you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

function generatePasswordResetEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
    </head>
    <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); min-height: 100vh; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #1e293b 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 100px rgba(139, 92, 246, 0.2);">
              
              ${getEmailHeader('🔐 PASSWORD RESET')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>! 👋
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. Use the code below to set a new password for your Nashflare account.
                  </p>
                  
                  <!-- Reset Code Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border: 3px solid rgba(239, 68, 68, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 12px 48px rgba(239, 68, 68, 0.3); margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 48px 32px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔑</div>
                        <p style="margin: 0 0 24px; color: #fca5a5; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Your Reset Code</p>
                        <div style="background: rgba(0,0,0,0.4); border-radius: 16px; padding: 28px 20px; display: inline-block; min-width: 280px; border: 2px solid rgba(239, 68, 68, 0.2);">
                          <p style="margin: 0; font-size: 56px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace; text-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);">
                            ${data.resetCode}
                          </p>
                        </div>
                        <p style="margin: 24px 0 0; color: #fecaca; font-size: 13px;">
                          Enter this code along with your new password to reset your account
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid #fbbf24; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fde047; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #fbbf24;">⏰ Important:</strong><br>
                          This reset code will expire in <strong style="color: #fef08a;">10 minutes</strong> for security reasons. If it expires, you can request a new code on the password reset page.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #f87171;">🔒 Security Alert:</strong><br><br>
                          • Never share this code with anyone<br>
                          • Nashflare will <strong>never</strong> ask for this code<br>
                          • If you didn't request this reset, ignore this email<br>
                          • Your password will remain unchanged unless you use this code
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Additional Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                          If you didn't request a password reset,<br>
                          you can safely ignore this email and your password will remain unchanged.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              ${getEmailFooter()}
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}