// supabase/functions/send-order-email/templates/boost-new-offer.ts
// New Boost Offer Received Email Template (sent to customer)

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { BoostNewOfferData } from '../types.ts'

export function generateBoostNewOfferEmail(data: BoostNewOfferData): string {
  const isCounterOffer = data.offerType === 'counter'
  
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
              
              ${getEmailHeader(isCounterOffer ? '💬 COUNTER OFFER RECEIVED' : '🎯 NEW OFFER RECEIVED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Alert Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">🎮</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.customerUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    ${isCounterOffer 
                      ? `<strong style="color: #fbbf24;">${data.boosterUsername}</strong> has sent a counter offer for your boost request!`
                      : `<strong style="color: #34d399;">${data.boosterUsername}</strong> wants to boost your account!`
                    }
                  </p>
                  
                  <!-- Offer Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${isCounterOffer ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)'}; border: 2px solid ${isCounterOffer ? 'rgba(251, 191, 36, 0.3)' : 'rgba(16, 185, 129, 0.3)'}; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: ${isCounterOffer ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; padding: 20px 24px; border-bottom: 1px solid ${isCounterOffer ? 'rgba(251, 191, 36, 0.2)' : 'rgba(16, 185, 129, 0.2)'};">
                        <p style="margin: 0; color: ${isCounterOffer ? '#fde047' : '#6ee7b7'}; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${isCounterOffer ? '💬 Counter Offer' : '✓ Offer to Accept'}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        <!-- Rank Progress -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <div style="display: inline-block; background: rgba(0,0,0,0.3); padding: 16px 24px; border-radius: 12px;">
                            <span style="color: #f87171; font-size: 18px; font-weight: 700;">${data.currentRank}</span>
                            <span style="color: #64748b; font-size: 24px; margin: 0 12px;">→</span>
                            <span style="color: #34d399; font-size: 18px; font-weight: 700;">${data.desiredRank}</span>
                          </div>
                        </div>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 12px 0;">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Booster</p>
                            </td>
                            <td align="right" style="padding: 12px 0;">
                              <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 600;">${data.boosterUsername}</p>
                            </td>
                          </tr>
                          ${data.estimatedDays ? `
                          <tr>
                            <td style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                              <p style="margin: 0; color: #64748b; font-size: 14px; font-weight: 500;">Estimated Time</p>
                            </td>
                            <td align="right" style="padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.05);">
                              <p style="margin: 0; color: #c4b5fd; font-size: 14px; font-weight: 600;">${data.estimatedDays} days</p>
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td colspan="2" style="padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; color: ${isCounterOffer ? '#fbbf24' : '#34d399'}; font-size: 15px; font-weight: 700;">${isCounterOffer ? 'Counter Price' : 'Offer Price'}</p>
                                  </td>
                                  <td align="right">
                                    <p style="margin: 0; color: ${isCounterOffer ? '#fde047' : '#34d399'}; font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                                      $${data.offerPrice.toFixed(2)}
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
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">⏰ Don't miss out!</strong><br>
                          Review this offer and respond before it expires. You can accept, decline, or wait for more offers from other boosters.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/boosting/my-requests/${data.requestId}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);">
                          View Offer Details →
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