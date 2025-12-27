// supabase/functions/send-order-email/templates/dispute.ts
// Dispute Opened Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { DisputeData } from '../types.ts'

export function generateDisputeEmail(data: DisputeData): string {
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