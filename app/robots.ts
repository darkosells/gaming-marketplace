// Robots.txt Generator
// Location: app/robots.ts

import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',           // API routes
          '/admin/',         // Admin panel
          '/dashboard/',     // Vendor dashboard
          '/customer-dashboard/', // Customer dashboard
          '/messages/',      // Private messages
          '/order/',         // Order details
          '/checkout/',      // Checkout process
          '/settings/',      // User settings
          '/cart/',          // Shopping cart
          '/sell/',          // Create listing page (requires auth)
          '/*.json$',        // JSON files
          '/*?*',            // Query parameters (optional, some prefer to include)
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/', // Block AI crawlers if desired
      },
      {
        userAgent: 'CCBot',
        disallow: '/', // Block CommonCrawl
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}