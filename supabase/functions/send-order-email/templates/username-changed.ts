// supabase/functions/send-order-email/templates/username-changed.ts
// Username Changed Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { UsernameChangedData } from '../types.ts'

export function generateUsernameChangedEmail(data: UsernameChangedData): string {
  const changeTime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

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
              
              ${getEmailHeader('✨ ACCOUNT UPDATE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Username Changed Successfully
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Your username has been updated on Nashflare.
                  </p>
                  
                  <!-- Username Change Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%); border: 1px solid rgba(167, 139, 250, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 32px 24px;">
                        <p style="margin: 0 0 24px; color: #a78bfa; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Username Change</p>
                        
                        <!-- Old Username -->
                        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Previous Username</p>
                          <p style="margin: 0; color: #f87171; font-size: 20px; font-weight: 700; text-decoration: line-through; opacity: 0.7;">
                            ${data.oldUsername}
                          </p>
                        </div>
                        
                        <!-- Arrow -->
                        <div style="text-align: center; margin: 16px 0;">
                          <span style="color: #a78bfa; font-size: 32px; font-weight: bold;">↓</span>
                        </div>
                        
                        <!-- New Username -->
                        <div style="background: linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%); border: 2px solid rgba(167, 139, 250, 0.4); border-radius: 12px; padding: 20px; text-align: center;">
                          <p style="margin: 0 0 8px; color: #a78bfa; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">New Username</p>
                          <p style="margin: 0; color: #34d399; font-size: 24px; font-weight: 800;">
                            ${data.newUsername}
                          </p>
                        </div>
                        
                        <p style="margin: 24px 0 0; color: #64748b; font-size: 12px; text-align: center;">
                          Changed on: <span style="color: #94a3b8;">${changeTime}</span>
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">ℹ️ What this means</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          • Your new username is now active across all of Nashflare<br>
                          • Other users will see your new username in chats and listings<br>
                          • Your profile URL will use your new username<br>
                          • All your orders and reviews remain unchanged
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