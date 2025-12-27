// supabase/functions/send-order-email/templates/vendor-rejected.ts
// Vendor Rejected Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { VendorRejectedData } from '../types.ts'

export function generateVendorRejectedEmail(data: VendorRejectedData): string {
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
              
              ${getEmailHeader('📋 APPLICATION UPDATE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hello <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Thank you for your interest in becoming a vendor on Nashflare. After careful review, we regret to inform you that we are unable to approve your application at this time.
                  </p>
                  
                  <!-- Status Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border: 2px solid rgba(239, 68, 68, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(239, 68, 68, 0.15); padding: 20px 24px; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">
                        <p style="margin: 0; color: #fca5a5; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❌ Application Not Approved</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <p style="margin: 0 0 12px; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase;">Reason</p>
                        <p style="margin: 0; color: #fca5a5; font-size: 15px; line-height: 1.6;">
                          ${data.rejectionReason || 'Your application did not meet our verification requirements.'}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">ℹ️ What This Means</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          This decision is final and you will not be able to resubmit a vendor application. However, you can still use Nashflare as a buyer to purchase gaming products from our marketplace.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Support Note -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                          If you believe this decision was made in error or have questions about your application, please contact our support team at <a href="mailto:support@nashflare.com" style="color: #a78bfa; text-decoration: none; font-weight: 600;">support@nashflare.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/browse" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);">
                          Continue Browsing →
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