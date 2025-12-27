// supabase/functions/send-order-email/templates/new-message.ts
// New Message Received Email Template

// @ts-ignore - Deno requires .ts extension
import { getEmailHeader, getEmailFooter } from './_shared.ts'
// @ts-ignore - Deno requires .ts extension
import type { NewMessageData } from '../types.ts'

export function generateNewMessageEmail(data: NewMessageData): string {
  const messagePreview = data.messagePreview.length > 150 
    ? data.messagePreview.substring(0, 150) + '...' 
    : data.messagePreview
  
  // Determine the context (marketplace order, boosting order, or general)
  let contextLabel = ''
  let contextDetails = ''
  
  if (data.boostingOrderNumber) {
    contextLabel = '🎮 Boosting Order'
    contextDetails = `Order #${data.boostingOrderNumber}`
  } else if (data.listingTitle) {
    contextLabel = '🛒 Marketplace'
    contextDetails = data.listingTitle
  } else {
    contextLabel = '💬 Direct Message'
    contextDetails = 'New conversation'
  }

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
              
              ${getEmailHeader('💬 NEW MESSAGE')}
              
              <tr>
                <td style="padding: 48px 40px; background: linear-gradient(to bottom, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);">
                  
                  <!-- Greeting -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 64px; margin-bottom: 16px;">📩</div>
                        <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.2;">
                          Hey <span style="background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${data.recipientUsername}</span>!
                        </h2>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color: #94a3b8; margin: 0 0 32px; font-size: 16px; line-height: 1.6; text-align: center;">
                    You have a new message from <strong style="color: #22d3ee;">${data.senderUsername}</strong>
                  </p>
                  
                  <!-- Message Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); border: 2px solid rgba(34, 211, 238, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); margin-bottom: 24px;">
                    <tr>
                      <td style="background: rgba(34, 211, 238, 0.15); padding: 16px 24px; border-bottom: 1px solid rgba(34, 211, 238, 0.2);">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #67e8f9; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">${contextLabel}</p>
                              <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">${contextDetails}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 24px;">
                        <!-- Sender Avatar & Name -->
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="48">
                              <div style="width: 44px; height: 44px; background: linear-gradient(135deg, #22d3ee 0%, #a78bfa 100%); border-radius: 50%; text-align: center; line-height: 44px;">
                                <span style="color: #ffffff; font-size: 18px; font-weight: 700;">${data.senderUsername.charAt(0).toUpperCase()}</span>
                              </div>
                            </td>
                            <td style="padding-left: 12px;">
                              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${data.senderUsername}</p>
                              <p style="margin: 2px 0 0; color: #64748b; font-size: 12px;">Just now</p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Message Preview -->
                        <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; border-left: 3px solid #22d3ee;">
                          <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 1.6; font-style: italic;">
                            "${messagePreview}"
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Info Alert -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(139, 92, 246, 0.08); border-left: 4px solid #8b5cf6; border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px 24px;">
                        <p style="margin: 0; color: #c4b5fd; font-size: 14px; line-height: 1.6;">
                          <strong style="color: #a78bfa;">💡 Quick tip:</strong><br>
                          Respond promptly to keep the conversation going and ensure smooth transactions!
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <a href="https://nashflare.com/messages?conversationId=${data.conversationId}" style="display: inline-block; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 40px rgba(6, 182, 212, 0.4);">
                          Reply to Message →
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