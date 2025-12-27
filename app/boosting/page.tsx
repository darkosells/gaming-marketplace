// ============================================================================
// BOOSTING MAIN LANDING PAGE - SEO OPTIMIZED
// ============================================================================
// Location: app/boosting/page.tsx
// ============================================================================

import { Metadata } from 'next'
import { siteConfig, generateMetadata } from '@/lib/seo-config'
import BoostingPageClient from './BoostingPageClient'

// ============================================================================
// SEO METADATA (using your existing pattern)
// ============================================================================
export const metadata: Metadata = generateMetadata({
  title: 'Game Boosting Services | Valorant, LoL, CS2 Rank Boost',
  description: 'Professional game boosting services for Valorant, League of Legends, CS2 & more. Verified boosters, secure PayPal & crypto payments, live tracking. Boost your rank today!',
  path: '/boosting',
  image: `${siteConfig.url}/og-boosting.png`,
})

// ============================================================================
// STRUCTURED DATA (JSON-LD)
// ============================================================================
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${siteConfig.url}/boosting#service`,
      "name": "Game Boosting Services",
      "description": "Professional game boosting services for competitive games including Valorant, League of Legends, CS2, and more. Verified boosters, secure payments, live progress tracking.",
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
      "serviceType": "Game Rank Boosting",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Game Boosting Services",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Valorant Rank Boosting",
              "description": "Professional Valorant rank boosting from Iron to Radiant"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "League of Legends Boosting",
              "description": "LoL elo boosting from Iron to Challenger"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "CS2 Rank Boosting",
              "description": "Counter-Strike 2 rank boosting services"
            }
          }
        ]
      }
    },
    {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/boosting`,
      "url": `${siteConfig.url}/boosting`,
      "name": "Game Boosting Services | Nashflare",
      "description": "Professional game boosting services for Valorant, LoL, CS2 & more",
      "isPartOf": {
        "@type": "WebSite",
        "name": siteConfig.name,
        "url": siteConfig.url
      }
    },
    {
      "@type": "FAQPage",
      "@id": `${siteConfig.url}/boosting#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Is game boosting safe?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, our boosting services prioritize account safety. We use VPN protection matching your region, play at natural hours, and our verified boosters follow strict safety protocols. We also offer offline mode options and never share your credentials."
          }
        },
        {
          "@type": "Question",
          "name": "How long does a rank boost take?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Completion time varies based on the rank difference and game. Most boosts are completed within 1-7 days. You'll receive real-time progress updates and can track your boost live through your dashboard."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods do you accept?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We accept PayPal and cryptocurrency payments. All transactions are secured with escrow protection - your payment is held safely until the boost is completed to your satisfaction."
          }
        },
        {
          "@type": "Question",
          "name": "What if I'm not satisfied with the service?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer a 100% money-back guarantee if we cannot complete your order as promised. Our dispute resolution team is available 24/7 to handle any issues that may arise."
          }
        },
        {
          "@type": "Question",
          "name": "Can I play on my account during the boost?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "For most boosts, we recommend not playing ranked games during the boosting period to avoid conflicts. However, you can pause the boost anytime through your dashboard if you need to play."
          }
        }
      ]
    }
  ]
}

// ============================================================================
// PAGE COMPONENT (Server Component wrapper)
// ============================================================================
export default function BoostingPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BoostingPageClient />
    </>
  )
}