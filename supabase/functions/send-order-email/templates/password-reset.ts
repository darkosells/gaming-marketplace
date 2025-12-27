// supabase/functions/send-order-email/templates/password-reset.ts
// Password Reset Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { PasswordResetData } from '../types.ts'

export function generatePasswordResetEmail(data: PasswordResetData): string {
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
              
              ${getEmailHeader('🔐 PASSWORD RESET')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.username}</span>! 👋
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    We received a request to reset your password. Use the code below to set a new password for your Nashflare account.
                  </p>
                  
                  <!-- Reset Code Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%); border: 3px solid rgba(239, 68, 68, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 12px 48px rgba(239, 68, 68, 0.3); margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 48px 32px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 20px;">🔑</div>
                        <p style="margin: 0 0 24px; color: #fca5a5; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">Your Reset Code</p>
                        <div style="background: rgba(0,0,0,0.4); border-radius: 16px; padding: 28px 20px; display: inline-block; min-width: 280px; border: 2px solid rgba(239, 68, 68, 0.2);">
                          <p style="margin: 0; font-size: 56px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace; text-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);">
                            ${data.resetCode}
                          </p>
                        </div>
                        <p style="margin: 24px 0 0; color: #fecaca; font-size: 13px;">
                          Enter this code along with your new password to reset your account
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid #fbbf24; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fde047; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #fbbf24;">⏰ Important:</strong><br>
                          This reset code will expire in <strong style="color: #fef08a;">10 minutes</strong> for security reasons. If it expires, you can request a new code on the password reset page.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Notice -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #f87171;">🔒 Security Alert:</strong><br><br>
                          • Never share this code with anyone<br>
                          • Nashflare will <strong>never</strong> ask for this code<br>
                          • If you didn't request this reset, ignore this email<br>
                          • Your password will remain unchanged unless you use this code
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Additional Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                          If you didn't request a password reset,<br>
                          you can safely ignore this email and your password will remain unchanged.
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