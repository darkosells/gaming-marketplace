// Robots.txt Generator
// Location: app/robots.ts

import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/browse',
          '/games/',
          '/blog/',
          '/listing/',
          '/seller/',
          '/signup',
          '/login',
          '/terms',
          '/privacy',
          '/cookies',
          '/how-it-works',
          '/contact',
        ],
        disallow: [
          '/api/',                // API routes
          '/admin/',              // Admin panel
          '/dashboard/',          // Vendor dashboard
          '/customer-dashboard/', // Customer dashboard
          '/messages/',           // Private messages
          '/order/',              // Order details
          '/checkout/',           // Checkout process
          '/settings/',           // User settings
          '/cart/',               // Shopping cart
          '/sell/',               // Create listing page (requires auth)
          '/forgot-password',     // Auth pages
          '/reset-password',      // Auth pages
          '/verify-email',        // Auth pages
          '/_next/',              // Next.js internals
          '/static/',             // Static files that shouldn't be indexed
          '/*.json$',             // JSON files
        ],
      },
      // Googlebot-specific rules (allow everything we want indexed)
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/browse',
          '/games/',
          '/blog/',
          '/listing/',
          '/profile/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/customer-dashboard/',
          '/messages/',
          '/order/',
          '/checkout/',
          '/settings/',
          '/cart/',
          '/sell/',
        ],
      },
      // Bingbot-specific rules
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/browse',
          '/games/',
          '/blog/',
          '/listing/',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/customer-dashboard/',
          '/messages/',
          '/order/',
          '/checkout/',
          '/settings/',
          '/cart/',
          '/sell/',
        ],
      },
      // Block AI training crawlers
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/', // Block Google's AI training crawler (separate from search)
      },
      {
        userAgent: 'FacebookBot',
        disallow: '/', // Block Meta AI training (keep Facebot for link previews)
      },
      {
        userAgent: 'Bytespider',
        disallow: '/', // Block ByteDance/TikTok crawler
      },
      // Block aggressive SEO tool crawlers that can slow your site
      {
        userAgent: 'AhrefsBot',
        crawlDelay: 10,
        allow: '/',
      },
      {
        userAgent: 'SemrushBot',
        crawlDelay: 10,
        allow: '/',
      },
      {
        userAgent: 'MJ12bot',
        disallow: '/', // Majestic bot - often too aggressive
      },
      {
        userAgent: 'DotBot',
        disallow: '/',
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  }
}