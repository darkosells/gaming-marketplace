// supabase/functions/send-order-email/templates/password-changed.ts
// Password Changed Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { PasswordChangedData } from '../types.ts'

export function generatePasswordChangedEmail(data: PasswordChangedData): string {
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
              
              ${getEmailHeader('🔒 SECURITY ALERT')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <h2 style="color: #ffffff; margin: 0 0 12px; font-size: 28px; font-weight: 700; line-height: 1.2;">
                    Password Changed Successfully
                  </h2>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6;">
                    Hi <strong style="color: #cbd5e1;">${data.username}</strong>, your password has been updated.
                  </p>
                  
                  <!-- Success Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 28px 24px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
                        <p style="margin: 0 0 8px; color: #6ee7b7; font-size: 16px; font-weight: 700;">
                          Password Updated
                        </p>
                        <p style="margin: 0; color: #86efac; font-size: 13px;">
                          Changed on: ${changeTime}
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Warning Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #f87171;">⚠️ Didn't change your password?</strong><br><br>
                          If you didn't make this change, your account may be compromised. Please contact our support team immediately and secure your account.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Tips -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0 0 12px; color: #a78bfa; font-size: 14px; font-weight: 700;">💡 Security Tips</p>
                        <p style="margin: 0; color: #c4b5fd; font-size: 13px; line-height: 1.6;">
                          • Use a unique password for Nashflare<br>
                          • Never share your password with anyone<br>
                          • Enable two-factor authentication when available<br>
                          • Use a password manager for extra security
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