// supabase/functions/send-order-email/templates/boost-started.ts
// Boost Started Email Template (sent to customer when booster starts working)

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { BoostStartedData } from '../types.ts'

export function generateBoostStartedEmail(data: BoostStartedData): string {
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
              
              ${getEmailHeader('🚀 BOOST STARTED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Celebration -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">🎮</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Your boost has begun, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.customerUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    <strong style="color: #a78bfa;">${data.boosterUsername}</strong> has started working on your account. Sit back and watch your rank climb! 📈
                  </p>
                  
                  <!-- Status Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%); border: 2px solid rgba(139, 92, 246, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(139, 92, 246, 0.2); padding: 20px 24px; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #c4b5fd; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🎯 In Progress</p>
                            </td>
                            <td align="right">
                              <p style="margin: 0; color: #d8b4fe; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderNumber}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px 24px;">
                        <!-- Rank Progress Visual -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <div style="display: inline-block; background: rgba(0,0,0,0.3); padding: 20px 40px; border-radius: 16px;">
                            <p style="margin: 0 0 12px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Rank Journey</p>
                            <span style="color: #f87171; font-size: 22px; font-weight: 700;">${data.currentRank}</span>
                            <span style="color: #a78bfa; font-size: 28px; margin: 0 20px;">⟶</span>
                            <span style="color: #34d399; font-size: 22px; font-weight: 700;">${data.desiredRank}</span>
                          </div>
                        </div>
                        
                        <!-- Booster Info -->
                        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Your Booster</p>
                          <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">${data.boosterUsername}</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- What to Expect -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(16, 185, 129, 0.08); border-left: 4px solid #10b981; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #34d399; font-size: 14px; font-weight: 700;">📊 What to Expect</p>
                        <p style="margin: 0; color: #86efac; font-size: 13px; line-height: 1.6;">
                          • You'll receive email updates as your booster progresses<br>
                          • Track live progress in your dashboard<br>
                          • Screenshots and stats will be shared along the way<br>
                          • You'll need to confirm completion when target is reached
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Important Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid #fbbf24; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #fbbf24; font-size: 14px; font-weight: 700;">⚠️ Important</p>
                        <p style="margin: 0; color: #fef3c7; font-size: 13px; line-height: 1.6;">
                          Please <strong>do not</strong> log into your account while the boost is in progress. This may interrupt the booster's work and could cause issues with your account.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/dashboard/boosts/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);">
                          Track Your Progress →
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