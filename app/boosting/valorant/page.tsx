// ============================================================================
// VALORANT BOOSTING PAGE - SEO OPTIMIZED
// ============================================================================
// Location: app/boosting/valorant/page.tsx
// ============================================================================

import { Metadata } from 'next'
import { siteConfig, generateMetadata } from '@/lib/seo-config'
import ValorantBoostingClient from './ValorantBoostingClient'

// ============================================================================
// SEO METADATA
// ============================================================================
export const metadata: Metadata = generateMetadata({
  title: 'Valorant Boosting | Iron to Radiant Rank Boost Service',
  description: 'Professional Valorant rank boosting from Iron to Radiant. Verified boosters, VPN protection, offline mode, 100% account safety. Solo & Duo queue available. Fast completion with live tracking.',
  path: '/boosting/valorant',
  image: `${siteConfig.url}/og-valorant-boosting.png`,
})

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${siteConfig.url}/boosting/valorant#service`,
      "name": "Valorant Rank Boosting Service",
      "description": "Professional Valorant rank boosting from Iron to Radiant. Solo queue and duo queue options available with verified professional boosters.",
      "provider": {
        "@type": "Organization",
        "name": siteConfig.name,
        "url": siteConfig.url,
        "logo": `${siteConfig.url}/logo.png`
      },
      "areaServed": {
        "@type": "Place",
        "name": "Worldwide"
      },
      "serviceType": "Valorant Rank Boosting",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "offerCount": "50+"
      },
      "termsOfService": `${siteConfig.url}/terms`,
      "brand": {
        "@type": "Brand",
        "name": "Valorant"
      }
    },
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/boosting/valorant`,
      "url": `${siteConfig.url}/boosting/valorant`,
      "name": "Valorant Boosting | Iron to Radiant Rank Boost | Nashflare",
      "description": "Professional Valorant rank boosting service with verified boosters",
      "isPartOf": {
        "@type": "WebSite",
        "name": siteConfig.name,
        "url": siteConfig.url
      },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": siteConfig.url
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Boosting",
            "item": `${siteConfig.url}/boosting`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Valorant",
            "item": `${siteConfig.url}/boosting/valorant`
          }
        ]
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.url}/boosting/valorant#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Will my Valorant account get banned?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. Our boosters use VPN protection matching your region, play at normal hours, and use offline mode to ensure your account stays completely safe. We've completed thousands of boosts with a 0% ban rate."
          }
        },
        {
          "@type": "Question",
          "name": "How do you protect my login credentials?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Your credentials are encrypted with AES-256 encryption and stored securely. Boosters can only view them once you approve the order, and access is automatically revoked when the boost is complete."
          }
        },
        {
          "@type": "Question",
          "name": "What if the booster doesn't finish my Valorant boost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "You're protected by our money-back guarantee. If a booster fails to complete your order, you'll receive a full refund or we'll assign a new booster at no extra cost."
          }
        },
        {
          "@type": "Question",
          "name": "Can I play Valorant on my account during the boost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For Solo Queue boosts, we recommend not playing to avoid interference. However, with Duo Queue, you'll play alongside your booster and can use your account normally between sessions."
          }
        },
        {
          "@type": "Question",
          "name": "How long will my Valorant rank boost take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Completion time depends on the number of divisions. Most boosts are completed within 1-7 days. You can add Priority Queue for faster completion times."
          }
        }
      ]
    }
  ]
}

// ============================================================================
// PAGE COMPONENT (Server Component wrapper)
// ============================================================================
export default function ValorantBoostingPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ValorantBoostingClient />
    </>
  )
}