// supabase/functions/send-order-email/templates/vendor-approved.ts
// Vendor Approved Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { VendorApprovedData } from '../types.ts'

export function generateVendorApprovedEmail(data: VendorApprovedData): string {
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
              
              ${getEmailHeader('🎉 VENDOR APPROVED')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Celebration -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 80px; margin-bottom: 16px;">🎊</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; line-height: 1.2;">
                          Congratulations, <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 18px; line-height: 1.6; text-align: center;">
                    Your vendor application has been <strong style="color: #34d399;">approved</strong>! 🚀
                  </p>
                  
                  <!-- Success Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 32px; text-align: center;">
                        <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 16px 32px; border-radius: 50px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4); margin-bottom: 20px;">
                          <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">✓ VERIFIED VENDOR</p>
                        </div>
                        <p style="margin: 0; color: #6ee7b7; font-size: 15px; font-weight: 600;">
                          You now have full access to seller features
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- What You Can Do Now -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 16px; overflow: hidden; margin-bottom: 32px;">
                    <tr>
                      <td style="background: linear-gradient(90deg, rgba(167, 139, 250, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <p style="margin: 0; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">🚀 What You Can Do Now</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 28px 24px;">
                        
                        <!-- Feature 1 -->
                        <div style="margin-bottom: 20px; padding-left: 16px; border-left: 3px solid #10b981;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 16px; font-weight: 700;">📦 Create Listings</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Start listing your gaming accounts, in-game currency, items, and game keys to sell to our community.
                          </p>
                        </div>
                        
                        <!-- Feature 2 -->
                        <div style="margin-bottom: 20px; padding-left: 16px; border-left: 3px solid #8b5cf6;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 16px; font-weight: 700;">💰 Earn Money</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Get paid for every sale. We only take a small 5% commission - you keep 95% of your earnings!
                          </p>
                        </div>
                        
                        <!-- Feature 3 -->
                        <div style="padding-left: 16px; border-left: 3px solid #ec4899;">
                          <p style="margin: 0 0 6px; color: #ffffff; font-size: 16px; font-weight: 700;">📊 Vendor Dashboard</p>
                          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.5;">
                            Access your vendor dashboard to manage listings, track orders, view analytics, and withdraw your earnings.
                          </p>
                        </div>
                        
                      </td>
                    </tr>
                  </table>

                  <!-- Tips for Success -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">💡 Tips for Success</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          • Use high-quality images and detailed descriptions<br>
                          • Price competitively by checking similar listings<br>
                          • Respond quickly to buyer messages<br>
                          • Deliver orders promptly to build a great reputation<br>
                          • Maintain excellent customer service for positive reviews
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);">
                          Go to Vendor Dashboard →
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