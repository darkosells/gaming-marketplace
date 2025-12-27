// supabase/functions/send-order-email/templates/welcome.ts
// Welcome Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailFooter, getLargeLogoHTML } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { WelcomeData } from '../types.ts'

export function generateWelcomeEmail(data: WelcomeData): string {
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
              
              <!-- Welcome Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 48px 40px; text-align: center; position: relative;">
                  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);"></div>
                  
                  <!-- Logo -->
                  <div style="margin-bottom: 20px; position: relative;">
                    ${getLargeLogoHTML()}
                  </div>
                  
                  <div style="font-size: 64px; margin-bottom: 16px; position: relative;">🎮</div>
                  <h1 style="margin: 0; color: #ffffff; font-size: 40px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;">
                    Welcome to Nashflare!
                  </h1>
                  <p style="margin: 16px 0 0; color: rgba(255,255,255,0.95); font-size: 17px; font-weight: 500; position: relative;">
                    Your Gaming Marketplace Adventure Begins
                  </p>
                </td>
              </tr>
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>! 🎉
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Welcome to <strong style="color: #cbd5e1;">Nashflare</strong> - the ultimate marketplace for gaming accounts, in-game currency, items, and game keys. We're excited to have you join our growing community!
                  </p>
                  
                  <!-- Features Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                    <tr>
                      <td style="background: linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✨ What You Can Do</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        
                        <!-- Feature 1 -->
                        <div style="margin-bottom: 24px; padding-left: 16px; border-left: 3px solid #8b5cf6;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">🛒 Browse & Buy</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Find amazing deals on gaming accounts, in-game currency, rare items, and exclusive game keys across all popular games.
                          </p>
                        </div>
                        
                        <!-- Feature 2 -->
                        <div style="margin-bottom: 24px; padding-left: 16px; border-left: 3px solid #ec4899;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">💰 Sell Your Items</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Want to earn money? Upgrade to vendor status and start listing your gaming assets to thousands of buyers.
                          </p>
                        </div>
                        
                        <!-- Feature 3 -->
                        <div style="padding-left: 16px; border-left: 3px solid #10b981;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 17px; font-weight: 700;">🔒 Safe & Secure</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Shop with confidence! Every transaction is protected by our 48-hour buyer protection, secure escrow system, and dispute resolution.
                          </p>
                        </div>
                        
                      </td>
                    </tr>
                  </table>

                  <!-- Account Ready Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px; text-align: center;">
                        <p style="margin: 0 0 8px; color: #34d399; font-size: 20px;">✅</p>
                        <p style="margin: 0; color: #6ee7b7; font-size: 15px; font-weight: 700;">
                          Your account is ready!
                        </p>
                        <p style="margin: 8px 0 0; color: #86efac; font-size: 13px;">
                          Start exploring the marketplace and find your next gaming treasure.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/browse" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);">
                          Start Browsing →
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