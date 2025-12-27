// supabase/functions/send-order-email/templates/withdrawal.ts
// Withdrawal Processed Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { WithdrawalData } from '../types.ts'

export function generateWithdrawalEmail(data: WithdrawalData): string {
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