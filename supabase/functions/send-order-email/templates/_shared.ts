// supabase/functions/send-order-email/templates/_shared.ts
// Shared email components and configuration

// ============================================
// CONFIGURATION
// ============================================

// Trustpilot AFS Configuration
export const TRUSTPILOT_AFS_EMAIL = 'nashflare.com+2e25b37e1e@invite.trustpilot.com'
export const TRUSTPILOT_AFS_ENABLED = true // Toggle to enable/disable Trustpilot AFS

// Logo URL - PNG version for better email client compatibility
// Try these URLs in order of likelihood:
export const LOGO_URLS = [
  'https://gaming-marketplace-five.vercel.app/nashflare-logo.png',
  'https://gaming-marketplace-five.vercel.app/nashflare-logo',
  'https://gaming-marketplace-five.vercel.app/logo.png',
  'https://gaming-marketplace-five.vercel.app/nashflare.png',
]
export const LOGO_URL = LOGO_URLS[0] // Update index if first one doesn't work
export const USE_LOGO_IMAGE = true // Using PNG logo

// ============================================
// SHARED EMAIL COMPONENTS
// ============================================

export function getEmailHeader(title: string): string {
  const logoHTML = USE_LOGO_IMAGE 
    ? `<img src="${LOGO_URL}" alt="Nashflare" width="80" height="80" style="display: inline-block; vertical-align: middle;" />`
    : `
    <!-- Stylized Text Logo -->
    <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); border: 3px solid rgba(255,255,255,0.5); border-radius: 20px; backdrop-filter: blur(10px); position: relative; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div style="font-size: 42px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 12px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">N</div>
      </div>
      <div style="position: absolute; bottom: 2px; right: 2px; width: 20px; height: 20px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; border: 2px solid rgba(255,255,255,0.9);"></div>
    </div>
    `
    
  return `
    <tr>
      <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 48px 40px; text-align: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%);"></div>
        
        <!-- Logo -->
        <div style="margin-bottom: 20px; position: relative;">
          ${logoHTML}
        </div>
        
        <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 4px 12px rgba(0,0,0,0.3); position: relative;">
          Nashflare
        </h1>
        <div style="margin: 16px 0 0; display: inline-block; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); padding: 10px 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.3);">
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${title}</p>
        </div>
      </td>
    </tr>
  `
}

export function getEmailFooter(): string {
  return `
    <tr>
      <td style="background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 100%); padding: 32px 40px; text-align: center; border-top: 1px solid rgba(167, 139, 250, 0.2);">
        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; line-height: 1.6;">
          © 2025 Nashflare. All rights reserved.
        </p>
        <p style="margin: 0; color: #475569; font-size: 11px; line-height: 1.5;">
          The ultimate marketplace for gaming accounts, currency, and items.
        </p>
      </td>
    </tr>
  `
}

// ============================================
// TRUSTPILOT AFS STRUCTURED DATA SNIPPET
// ============================================

export function getTrustpilotAFSSnippet(recipientName: string, recipientEmail: string, referenceId: string): string {
  // Trustpilot AFS structured data snippet
  // This allows Trustpilot to extract customer info for review invitations
  // Wrapped in HTML comments for compatibility with systems that strip script tags
  return `
    <!-- Trustpilot AFS Structured Data -->
    <script type="application/json+trustpilot">
    {
      "recipientName": "${recipientName}",
      "recipientEmail": "${recipientEmail}",
      "referenceId": "${referenceId}"
    }
    </script>
    <!-- End Trustpilot AFS -->
  `
}

// ============================================
// LARGE LOGO FOR WELCOME EMAIL
// ============================================

export function getLargeLogoHTML(): string {
  return USE_LOGO_IMAGE 
    ? `<img src="${LOGO_URL}" alt="Nashflare" width="100" height="100" style="display: inline-block; vertical-align: middle;" />`
    : `
    <div style="display: inline-block; width: 100px; height: 100px; background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%); border: 4px solid rgba(255,255,255,0.5); border-radius: 24px; backdrop-filter: blur(10px); position: relative; box-shadow: 0 12px 40px rgba(0,0,0,0.4);">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
        <div style="font-size: 52px; font-weight: 900; color: #ffffff; text-shadow: 0 4px 16px rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">N</div>
      </div>
      <div style="position: absolute; bottom: 4px; right: 4px; width: 24px; height: 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; border: 3px solid rgba(255,255,255,0.9);"></div>
    </div>
    `
}