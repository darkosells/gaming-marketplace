// supabase/functions/send-order-email/templates/boost-completed.ts
// Boost Completed Email Template (sent to both customer and booster after confirmation)

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { BoostCompletedData } from '../types.ts'

export function generateBoostCompletedEmail(data: BoostCompletedData): string {
  const isCustomer = data.recipientType === 'customer'
  const winRate = data.totalGames && data.totalWins 
    ? Math.round((data.totalWins / data.totalGames) * 100) 
    : null

  if (isCustomer) {
    // Customer completion email
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
                
                ${getEmailHeader('🏆 BOOST COMPLETE')}
                
                <tr>
                  <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                    
                    <!-- Celebration -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <div style="font-size: 80px; margin-bottom: 16px;">🎉</div>
                          <h2 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; line-height: 1.2;">
                            Congratulations, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.recipientUsername}</span>!
                          </h2>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #94a3b8; margin: 0 0 32px; font-size: 18px; line-height: 1.6; text-align: center;">
                      Your boost order has been completed successfully! 🚀
                    </p>
                    
                    <!-- Success Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 32px; text-align: center;">
                          <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 16px 32px; border-radius: 50px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4); margin-bottom: 24px;">
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">✓ ORDER COMPLETED</p>
                          </div>
                          
                          <!-- Rank Achievement -->
                          <div style="background: rgba(0,0,0,0.3); padding: 24px 40px; border-radius: 16px; margin-bottom: 20px;">
                            <p style="margin: 0 0 12px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Your New Rank</p>
                            <div style="margin-bottom: 8px;">
                              <span style="color: #64748b; font-size: 14px; text-decoration: line-through;">${data.startRank}</span>
                              <span style="color: #64748b; margin: 0 12px;">→</span>
                              <span style="color: #34d399; font-size: 28px; font-weight: 800;">${data.finalRank}</span>
                            </div>
                          </div>
                          
                          <!-- Stats -->
                          ${(data.totalGames || data.totalWins) ? `
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td align="center">
                                <table cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    ${data.totalGames ? `
                                    <td style="padding: 0 8px;">
                                      <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px 20px; text-align: center;">
                                        <p style="margin: 0; color: #22d3ee; font-size: 20px; font-weight: 700;">${data.totalGames}</p>
                                        <p style="margin: 4px 0 0; color: #64748b; font-size: 11px;">Games</p>
                                      </div>
                                    </td>
                                    ` : ''}
                                    ${data.totalWins ? `
                                    <td style="padding: 0 8px;">
                                      <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px 20px; text-align: center;">
                                        <p style="margin: 0; color: #34d399; font-size: 20px; font-weight: 700;">${data.totalWins}</p>
                                        <p style="margin: 4px 0 0; color: #64748b; font-size: 11px;">Wins</p>
                                      </div>
                                    </td>
                                    ` : ''}
                                    ${winRate !== null ? `
                                    <td style="padding: 0 8px;">
                                      <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 12px 20px; text-align: center;">
                                        <p style="margin: 0; color: #a78bfa; font-size: 20px; font-weight: 700;">${winRate}%</p>
                                        <p style="margin: 4px 0 0; color: #64748b; font-size: 11px;">Win Rate</p>
                                      </div>
                                    </td>
                                    ` : ''}
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          ` : ''}
                        </td>
                      </tr>
                    </table>

                    <!-- Security Reminder -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 8px; color: #f87171; font-size: 14px; font-weight: 700;">🔒 Security Reminder</p>
                          <p style="margin: 0; color: #fca5a5; font-size: 13px; line-height: 1.6;">
                            If you haven't already, please <strong>change your password</strong> and enable 2FA on your Valorant account to ensure continued security.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Review Request -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 8px; color: #a78bfa; font-size: 14px; font-weight: 700;">⭐ Leave a Review</p>
                          <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                            Had a great experience? Leave a review for <strong>${data.otherPartyUsername}</strong> to help other customers!
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="https://nashflare.com/dashboard/boosts/${data.orderId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);">
                            View Order & Leave Review →
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
  } else {
    // Booster completion email - payment released
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
                
                ${getEmailHeader('💰 PAYMENT RELEASED')}
                
                <tr>
                  <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                    
                    <!-- Celebration -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center">
                          <div style="font-size: 80px; margin-bottom: 16px;">💸</div>
                          <h2 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; line-height: 1.2;">
                            Great work, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.recipientUsername}</span>!
                          </h2>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #94a3b8; margin: 0 0 32px; font-size: 18px; line-height: 1.6; text-align: center;">
                      <strong style="color: #34d399;">${data.otherPartyUsername}</strong> has confirmed completion. Payment has been released! 🎉
                    </p>
                    
                    <!-- Payment Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                      <tr>
                        <td style="background: rgba(16, 185, 129, 0.2); padding: 20px 24px; border-bottom: 1px solid rgba(16, 185, 129, 0.2);">
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td>
                                <p style="margin: 0; color: #6ee7b7; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">💰 Earnings Released</p>
                              </td>
                              <td align="right">
                                <p style="margin: 0; color: #86efac; font-size: 12px; font-family: 'Courier New', monospace;">#${data.orderNumber}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px 24px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">Added to your balance</p>
                          <p style="margin: 0 0 24px; color: #34d399; font-size: 56px; font-weight: 800; letter-spacing: -2px; text-shadow: 0 4px 12px rgba(52, 211, 153, 0.3);">
                            +$${data.boosterPayout?.toFixed(2) || '0.00'}
                          </p>
                          
                          <!-- Boost Summary -->
                          <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; display: inline-block;">
                            <span style="color: #64748b; font-size: 14px;">${data.startRank}</span>
                            <span style="color: #64748b; margin: 0 8px;">→</span>
                            <span style="color: #34d399; font-size: 16px; font-weight: 700;">${data.finalRank}</span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Withdraw Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                      <tr>
                        <td style="padding: 20px 24px;">
                          <p style="margin: 0 0 8px; color: #a78bfa; font-size: 14px; font-weight: 700;">💳 Ready to Withdraw</p>
                          <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                            Your earnings have been added to your balance. You can withdraw your funds anytime from your vendor dashboard via Bitcoin or Skrill.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <a href="https://nashflare.com/dashboard/boosting/earnings" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);">
                            View Earnings & Withdraw →
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
}