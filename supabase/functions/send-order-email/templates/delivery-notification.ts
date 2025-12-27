// supabase/functions/send-order-email/templates/delivery-notification.ts
// Delivery Notification Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { DeliveryNotificationData } from '../types.ts'

export function generateDeliveryNotificationEmail(data: DeliveryNotificationData): string {
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
                  
                  <!-- Secure Access Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%); border: 2px solid rgba(34, 197, 94, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 24px; text-align: center;">
                        <p style="margin: 0 0 16px; color: #22c55e; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🔐 Secure Delivery</p>
                        <p style="margin: 0 0 8px; color: #86efac; font-size: 16px; font-weight: 600;">
                          Your delivery code is ready!
                        </p>
                        <p style="margin: 0; color: #a7f3d0; font-size: 14px; line-height: 1.5;">
                          For your security, please log in to Nashflare to view your delivery code securely.
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
                        <a href="https://nashflare.com/order/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);">
                          🔑 View Your Delivery Code →
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