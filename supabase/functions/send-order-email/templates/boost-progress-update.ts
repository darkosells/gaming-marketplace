// supabase/functions/send-order-email/templates/boost-progress-update.ts
// Boost Progress Update Email Template (sent to customer)

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { BoostProgressUpdateData } from '../types.ts'

export function generateBoostProgressUpdateEmail(data: BoostProgressUpdateData): string {
  const winRate = data.gamesPlayed && data.gamesWon 
    ? Math.round((data.gamesWon / data.gamesPlayed) * 100) 
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
              
              ${getEmailHeader('📈 PROGRESS UPDATE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Header -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">📊</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Boost Update, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.customerUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    <strong style="color: #a78bfa;">${data.boosterUsername}</strong> has submitted a progress update for your boost.
                  </p>
                  
                  <!-- Progress Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%); border: 2px solid rgba(34, 211, 238, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(34, 211, 238, 0.15); padding: 20px 24px; border-bottom: 1px solid rgba(34, 211, 238, 0.2);">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #67e8f9; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🎯 Current Progress</p>
                            </td>
                            <td align="right">
                              <p style="margin: 0; color: #a5f3fc; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderNumber}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <!-- Rank Progress Visual -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <p style="margin: 0 0 12px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Rank Progress</p>
                          <div style="display: inline-block; background: rgba(0,0,0,0.3); padding: 16px 24px; border-radius: 12px;">
                            <span style="color: #94a3b8; font-size: 14px;">${data.currentRank}</span>
                            <span style="color: #64748b; margin: 0 8px;">→</span>
                            <span style="color: #22d3ee; font-size: 20px; font-weight: 700;">${data.newRank}</span>
                            <span style="color: #67e8f9; font-size: 14px; margin-left: 8px;">(${data.newRR} RR)</span>
                            <span style="color: #64748b; margin: 0 8px;">→</span>
                            <span style="color: #34d399; font-size: 14px;">${data.desiredRank}</span>
                          </div>
                        </div>
                        
                        <!-- Stats Grid -->
                        ${(data.gamesPlayed || data.gamesWon) ? `
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                          <tr>
                            ${data.gamesPlayed ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Games</p>
                                <p style="margin: 0; color: #22d3ee; font-size: 24px; font-weight: 700;">${data.gamesPlayed}</p>
                              </div>
                            </td>
                            ` : ''}
                            ${data.gamesWon ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Wins</p>
                                <p style="margin: 0; color: #34d399; font-size: 24px; font-weight: 700;">${data.gamesWon}</p>
                              </div>
                            </td>
                            ` : ''}
                            ${winRate !== null ? `
                            <td style="width: 33%; padding: 0 6px;">
                              <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase;">Win Rate</p>
                                <p style="margin: 0; color: #a78bfa; font-size: 24px; font-weight: 700;">${winRate}%</p>
                              </div>
                            </td>
                            ` : ''}
                          </tr>
                        </table>
                        ` : ''}
                        
                        <!-- Booster Notes -->
                        ${data.notes ? `
                        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px;">
                          <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase;">Booster Notes</p>
                          <p style="margin: 0; color: #e2e8f0; font-size: 14px; line-height: 1.5;">${data.notes}</p>
                        </div>
                        ` : ''}
                      </td>
                    </tr>
                  </table>

                  <!-- Encouragement -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">🎮 Looking good!</strong><br>
                          Your boost is progressing well. Check your dashboard for screenshots and detailed progress history.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/dashboard/boosts/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);">
                          View Full Progress →
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