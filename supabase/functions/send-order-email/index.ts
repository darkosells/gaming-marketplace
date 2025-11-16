// supabase/functions/send-order-email/index.ts
// Updated Edge Function for Nashflare email notifications

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
  type: 'order_confirmation' | 'delivery_notification' | 'new_sale' | 'dispute_opened' | 'withdrawal_processed' | 'password_changed' | 'username_changed' | 'welcome'
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
        subject = `Order Confirmed - ${emailRequest.listingTitle}`
        htmlContent = generateOrderConfirmationEmail(emailRequest)
        break

      case 'delivery_notification':
        toEmail = emailRequest.buyerEmail
        subject = `Your Order Has Been Delivered - ${emailRequest.listingTitle}`
        htmlContent = generateDeliveryNotificationEmail(emailRequest)
        break

      case 'new_sale':
        toEmail = emailRequest.sellerEmail
        subject = `New Sale! - ${emailRequest.listingTitle}`
        htmlContent = generateNewSaleEmail(emailRequest)
        break

      case 'dispute_opened':
        toEmail = emailRequest.recipientEmail
        subject = `Dispute Opened - Order #${emailRequest.orderId.substring(0, 8)}`
        htmlContent = generateDisputeEmail(emailRequest)
        break

      case 'withdrawal_processed':
        toEmail = emailRequest.vendorEmail
        subject = `Withdrawal Processed - $${emailRequest.amount.toFixed(2)}`
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
        subject = `🎮 Welcome to Nashflare!`
        htmlContent = generateWelcomeEmail(emailRequest)
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

// Email template generators
function generateOrderConfirmationEmail(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Order Confirmation</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Thanks for your order, ${data.buyerUsername}!</h2>
                  
                  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #a78bfa; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Order Details</p>
                    <p style="color: white; margin: 0 0 8px; font-size: 18px; font-weight: 600;">${data.listingTitle}</p>
                    <p style="color: #94a3b8; margin: 0 0 8px;">Quantity: ${data.quantity}</p>
                    <p style="color: #94a3b8; margin: 0 0 8px;">Seller: ${data.sellerUsername}</p>
                    <p style="color: #34d399; font-size: 24px; font-weight: bold; margin: 16px 0 0;">$${data.amount.toFixed(2)}</p>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      📦 Your order is being processed. The seller will deliver your item shortly. You'll receive another email when it's ready!
                    </p>
                  </div>

                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    Order ID: <span style="color: white; font-family: monospace;">${data.orderId.substring(0, 8)}...</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    If you didn't make this purchase, please contact our support immediately.
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">🎉 Order Delivered!</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Great news, ${data.buyerUsername}!</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">Your order has been delivered by ${data.sellerUsername}.</p>
                  
                  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #34d399; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Your Delivery Code</p>
                    <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; font-family: monospace; font-size: 14px; color: #fbbf24; word-break: break-all;">
                      ${data.deliveryCode}
                    </div>
                  </div>

                  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #f87171; margin: 0; font-size: 14px;">
                      ⚠️ <strong>Important:</strong> Please verify your delivery within 48 hours. If there's an issue, open a dispute before the protection period ends.
                    </p>
                  </div>

                  <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">
                    Item: <span style="color: white;">${data.listingTitle}</span>
                  </p>
                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    Order ID: <span style="color: white; font-family: monospace;">${data.orderId.substring(0, 8)}...</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    Keep this email safe - it contains your delivery information.
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">💰 New Sale!</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Congratulations, ${data.sellerUsername}! 🎉</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">You just made a sale!</p>
                  
                  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #fbbf24; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Sale Details</p>
                    <p style="color: white; margin: 0 0 8px; font-size: 18px; font-weight: 600;">${data.listingTitle}</p>
                    <p style="color: #94a3b8; margin: 0 0 8px;">Quantity: ${data.quantity}</p>
                    <p style="color: #94a3b8; margin: 0 0 8px;">Buyer: ${data.buyerUsername}</p>
                    <p style="color: #34d399; font-size: 24px; font-weight: bold; margin: 16px 0 0;">+$${data.amount.toFixed(2)}</p>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      📦 Please deliver the item to your buyer as soon as possible to maintain your seller rating!
                    </p>
                  </div>

                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    Order ID: <span style="color: white; font-family: monospace;">${data.orderId.substring(0, 8)}...</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    Thank you for being a valued seller on our platform!
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">⚠️ Dispute Opened</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Attention Required, ${data.recipientUsername}</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">A dispute has been opened on your order.</p>
                  
                  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #f87171; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Dispute Details</p>
                    <p style="color: white; margin: 0 0 8px;">Opened by: <strong>${data.openedBy}</strong></p>
                    <p style="color: #94a3b8; margin: 0;">Reason: ${data.disputeReason}</p>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      🔍 Please respond to this dispute in your dashboard. An admin will review the case and make a decision.
                    </p>
                  </div>

                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    Order ID: <span style="color: white; font-family: monospace;">${data.orderId.substring(0, 8)}...</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    Please respond to disputes promptly to avoid account penalties.
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">💸 Withdrawal Processed</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Great news, ${data.vendorUsername}!</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">Your withdrawal has been processed successfully.</p>
                  
                  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #34d399; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Withdrawal Details</p>
                    <p style="color: #34d399; font-size: 32px; font-weight: bold; margin: 0 0 16px;">$${data.amount.toFixed(2)}</p>
                    <p style="color: #94a3b8; margin: 0 0 8px;">Method: <span style="color: white;">${data.method}</span></p>
                    ${data.transactionId ? `<p style="color: #94a3b8; margin: 0;">Transaction ID: <span style="color: white; font-family: monospace;">${data.transactionId}</span></p>` : ''}
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      ℹ️ The funds should arrive in your account within 1-3 business days depending on your payment method.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    Thank you for being a valued seller on our platform!
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">🔒 Security Alert</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Password Changed Successfully</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">Hi ${data.username}, your password has been updated.</p>
                  
                  <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #34d399; font-weight: 600; margin: 0 0 12px; font-size: 14px; text-transform: uppercase;">Change Details</p>
                    <p style="color: white; margin: 0 0 8px; font-size: 16px;">
                      <strong>✅ Password Updated</strong>
                    </p>
                    <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                      Changed on: ${changeTime}
                    </p>
                  </div>

                  <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #f87171; margin: 0; font-size: 14px;">
                      ⚠️ <strong>Didn't change your password?</strong><br><br>
                      If you didn't make this change, your account may be compromised. Please contact our support team immediately and secure your account.
                    </p>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      💡 <strong>Security Tips:</strong><br>
                      • Use a unique password for Nashflare<br>
                      • Never share your password with anyone<br>
                      • Enable two-factor authentication when available
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    This is an automated security notification. Please do not reply to this email.
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🎮 Nashflare</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">✨ Account Update</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Username Changed Successfully</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">Your username has been updated on Nashflare.</p>
                  
                  <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #a78bfa; font-weight: 600; margin: 0 0 16px; font-size: 14px; text-transform: uppercase;">Username Change</p>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <div style="flex: 1;">
                        <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">Previous Username</p>
                        <p style="color: #f87171; margin: 0; font-size: 18px; font-weight: 600; text-decoration: line-through;">
                          ${data.oldUsername}
                        </p>
                      </div>
                    </div>
                    
                    <div style="text-align: center; margin: 12px 0;">
                      <span style="color: #a78bfa; font-size: 24px;">↓</span>
                    </div>
                    
                    <div>
                      <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px; text-transform: uppercase;">New Username</p>
                      <p style="color: #34d399; margin: 0; font-size: 18px; font-weight: 600;">
                        ${data.newUsername}
                      </p>
                    </div>
                  </div>

                  <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: white; margin: 0; font-size: 14px;">
                      📅 Changed on: <span style="color: #94a3b8;">${changeTime}</span>
                    </p>
                  </div>

                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px;">
                    <p style="color: #60a5fa; margin: 0; font-size: 14px;">
                      ℹ️ <strong>What this means:</strong><br>
                      • Your new username is now active across all of Nashflare<br>
                      • Other users will see your new username<br>
                      • Your profile URL will use your new username
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    If you didn't make this change, please contact support immediately.
                  </p>
                </td>
              </tr>
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
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 30px; text-align: center;">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">🎮 Welcome to Nashflare!</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your Gaming Marketplace Adventure Begins</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px; font-size: 24px;">Hey ${data.username}! 🎉</h2>
                  <p style="color: #94a3b8; margin: 0 0 24px; font-size: 16px;">
                    Welcome to Nashflare - the ultimate marketplace for gaming accounts, in-game currency, items, and game keys!
                  </p>
                  
                  <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #a78bfa; font-weight: 600; margin: 0 0 16px; font-size: 14px; text-transform: uppercase;">What You Can Do</p>
                    
                    <div style="margin-bottom: 12px;">
                      <p style="color: white; margin: 0 0 4px; font-size: 16px; font-weight: 600;">🛒 Browse & Buy</p>
                      <p style="color: #94a3b8; margin: 0; font-size: 14px;">Find amazing deals on gaming accounts, items, and more</p>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                      <p style="color: white; margin: 0 0 4px; font-size: 16px; font-weight: 600;">💰 Sell Your Items</p>
                      <p style="color: #94a3b8; margin: 0; font-size: 14px;">Upgrade to vendor status and start earning</p>
                    </div>
                    
                    <div>
                      <p style="color: white; margin: 0 0 4px; font-size: 16px; font-weight: 600;">🔒 Safe & Secure</p>
                      <p style="color: #94a3b8; margin: 0; font-size: 14px;">Buyer protection and secure transactions</p>
                    </div>
                  </div>

                  <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #34d399; margin: 0; font-size: 14px;">
                      ✅ <strong>Your account is ready!</strong><br>
                      Start exploring the marketplace and find your next gaming treasure.
                    </p>
                  </div>

                  <div style="text-align: center;">
                    <a href="https://nashflare.com/browse" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: bold; font-size: 16px;">
                      Start Browsing →
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: rgba(0,0,0,0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                  <p style="color: #64748b; margin: 0; font-size: 12px;">
                    © 2024 Nashflare. All rights reserved.<br>
                    Thanks for joining our gaming community!
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}