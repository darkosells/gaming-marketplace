// supabase/functions/send-order-email/templates/boost-pending-confirmation.ts
// Boost Pending Confirmation Email Template (sent to customer when booster marks complete)

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { BoostPendingConfirmationData } from '../types.ts'

export function generateBoostPendingConfirmationEmail(data: BoostPendingConfirmationData): string {
  const winRate = data.totalGames && data.totalWins 
    ? Math.round((data.totalWins / data.totalGames) * 100) 
    : null

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
              
              ${getEmailHeader('🎯 ACTION REQUIRED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Alert Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 12px 28px; border-radius: 50px; box-shadow: 0 8px 24px rgba(251, 191, 36, 0.3);">
                          <p style="margin: 0; color: #1e293b; font-size: 14px; font-weight: 700; letter-spacing: 0.5px;">⏳ CONFIRMATION NEEDED</p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2; text-align: center;">
                    Your boost is complete, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.customerUsername}</span>!
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    <strong style="color: #34d399;">${data.boosterUsername}</strong> has marked your boost as complete. Please verify and confirm!
                  </p>
                  
                  <!-- Results Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(16, 185, 129, 0.2); padding: 20px 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #6ee7b7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🏆 Boost Results</p>
                            </td>
                            <td align="right">
                              <p style="margin: 0; color: #86efac; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderNumber}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 32px 24px;">
                        <!-- Rank Achievement -->
                        <div style="text-align: center; margin-bottom: 28px;">
                          <p style="margin: 0 0 16px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Rank Journey Complete</p>
                          <div style="display: inline-block; background: rgba(0,0,0,0.3); padding: 20px 40px; border-radius: 16px;">
                            <span style="color: #94a3b8; font-size: 16px; text-decoration: line-through;">${data.startRank}</span>
                            <span style="color: #64748b; font-size: 24px; margin: 0 16px;">→</span>
                            <span style="color: #34d399; font-size: 24px; font-weight: 800;">${data.finalRank}</span>
                            <span style="color: #6ee7b7; font-size: 14px; margin-left: 8px;">(${data.finalRR} RR)</span>
                          </div>
                          ${data.finalRank !== data.desiredRank ? `
                          <p style="margin: 12px 0 0; color: #fbbf24; font-size: 12px;">
                            Target was ${data.desiredRank} - Please verify in your account
                          </p>
                          ` : `
                          <p style="margin: 12px 0 0; color: #34d399; font-size: 14px; font-weight: 600;">
                            ✓ Target rank achieved!
                          </p>
                          `}
                        </div>
                        
                        <!-- Stats Summary -->
                        ${(data.totalGames || data.totalWins) ? `
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            ${data.totalGames ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Total Games</p>
                                <p style="margin: 0; color: #22d3ee; font-size: 28px; font-weight: 700;">${data.totalGames}</p>
                              </div>
                            </td>
                            ` : ''}
                            ${data.totalWins ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Wins</p>
                                <p style="margin: 0; color: #34d399; font-size: 28px; font-weight: 700;">${data.totalWins}</p>
                              </div>
                            </td>
                            ` : ''}
                            ${winRate !== null ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Win Rate</p>
                                <p style="margin: 0; color: #a78bfa; font-size: 28px; font-weight: 700;">${winRate}%</p>
                              </div>
                            </td>
                            ` : ''}
                          </tr>
                        </table>
                        ` : ''}
                      </td>
                    </tr>
                  </table>

                  <!-- Action Required -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.1); border: 2px solid rgba(251, 191, 36, 0.3); border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 24px;">
                        <p style="margin: 0 0 12px; color: #fbbf24; font-size: 15px; font-weight: 700;">⚠️ Please Verify & Confirm</p>
                        <p style="margin: 0 0 16px; color: #fef3c7; font-size: 14px; line-height: 1.6;">
                          1. Log into your Valorant account<br>
                          2. Verify your new rank matches the results above<br>
                          3. Check that no unauthorized changes were made<br>
                          4. <strong>Change your password immediately</strong><br>
                          5. Confirm completion in your dashboard
                        </p>
                        <p style="margin: 0; color: #fcd34d; font-size: 12px;">
                          Payment will be released to the booster after you confirm.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Issue Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 13px; line-height: 1.6;">
                          <strong style="color: #f87171;">Found an issue?</strong><br>
                          If your rank doesn't match or there's a problem with your account, open a dispute in your dashboard before confirming.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/dashboard/boosts/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);">
                          Verify & Confirm Completion →
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