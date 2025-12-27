// supabase/functions/send-order-email/templates/order-confirmation.ts
// Order Confirmation Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter, getTrustpilotAFSSnippet, TRUSTPILOT_AFS_ENABLED } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { OrderConfirmationData } from '../types.ts'

export function generateOrderConfirmationEmail(data: OrderConfirmationData): string {
  // Generate Trustpilot AFS snippet for this order
  const trustpilotSnippet = TRUSTPILOT_AFS_ENABLED 
    ? getTrustpilotAFSSnippet(data.buyerUsername, data.buyerEmail, data.orderId)
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      ${trustpilotSnippet}
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