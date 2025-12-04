// app/how-it-works/page.tsx
// Server component with SEO metadata and JSON-LD schemas

import type { Metadata } from 'next'
import HowItWorksClient from './HowItWorksClient'

// Site configuration
const siteConfig = {
  name: 'Nashflare',
  url: 'https://nashflare.com',
  ogImage: 'https://nashflare.com/og-image.png',
  twitterHandle: '@nashflare',
  locale: 'en_US',
}

// Static metadata for this page
export const metadata: Metadata = {
  title: 'How It Works - Buy & Sell Gaming Products Safely | Nashflare',
  description: 'Learn how to buy and sell gaming accounts, in-game currency, items, and game keys safely on Nashflare. Secure escrow system, 48-hour buyer protection, and verified sellers.',
  keywords: [
    'how to buy game accounts',
    'how to sell game accounts',
    'gaming marketplace guide',
    'secure game trading',
    'buy gaming accounts safely',
    'sell gaming accounts online',
    'escrow gaming marketplace',
    'buyer protection gaming',
    'nashflare guide',
    'gaming trade tutorial',
  ],
  openGraph: {
    type: 'website',
    title: 'How Nashflare Works - Safe Gaming Marketplace',
    description: 'The safest way to buy and sell gaming accounts, currency, and keys. Learn about our escrow system and 48-hour buyer protection.',
    url: `${siteConfig.url}/how-it-works`,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'How Nashflare Works - Gaming Marketplace Guide',
      },
    ],
    locale: siteConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Nashflare Works - Safe Gaming Marketplace',
    description: 'Learn how to buy and sell gaming products safely with escrow protection and verified sellers.',
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  alternates: {
    canonical: `${siteConfig.url}/how-it-works`,
  },
}

// HowTo Schema for Buyers - Can appear as rich snippet in Google
const buyerHowToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  'name': 'How to Buy Gaming Products on Nashflare',
  'description': 'A step-by-step guide to safely purchasing gaming accounts, in-game currency, items, and game keys on Nashflare marketplace.',
  'image': siteConfig.ogImage,
  'totalTime': 'PT10M',
  'estimatedCost': {
    '@type': 'MonetaryAmount',
    'currency': 'USD',
    'value': '0',
  },
  'supply': [],
  'tool': [
    {
      '@type': 'HowToTool',
      'name': 'Nashflare Account',
    },
    {
      '@type': 'HowToTool',
      'name': 'Payment Method (PayPal or Crypto)',
    },
  ],
  'step': [
    {
      '@type': 'HowToStep',
      'position': 1,
      'name': 'Find What You Need',
      'text': 'Browse the extensive catalog of gaming accounts, in-game currency, items, and game keys. Use filters to search by game, category, or platform. Compare prices from multiple vendors and check seller ratings and reviews.',
      'url': `${siteConfig.url}/browse`,
    },
    {
      '@type': 'HowToStep',
      'position': 2,
      'name': 'Add to Cart & Checkout',
      'text': 'Once you find the perfect listing, add it to your cart and proceed to secure checkout. Payment is processed securely with a transparent 5% service fee. Multiple payment options are available including PayPal and cryptocurrency.',
      'url': `${siteConfig.url}/cart`,
    },
    {
      '@type': 'HowToStep',
      'position': 3,
      'name': 'Receive Your Order',
      'text': 'After payment confirmation, the seller will deliver your purchase. Digital codes are often delivered instantly. Account details are sent via secure chat with real-time order tracking.',
      'url': `${siteConfig.url}/dashboard`,
    },
    {
      '@type': 'HowToStep',
      'position': 4,
      'name': 'Confirm & Review',
      'text': 'Verify your purchase and confirm delivery. Your funds are held in escrow until you confirm receipt. You have a 48-hour buyer protection window to verify everything. Leave feedback for the seller after a successful transaction.',
      'url': `${siteConfig.url}/dashboard`,
    },
  ],
}

// HowTo Schema for Sellers
const sellerHowToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  'name': 'How to Sell Gaming Products on Nashflare',
  'description': 'A step-by-step guide to listing and selling gaming accounts, in-game currency, items, and game keys on Nashflare marketplace.',
  'image': siteConfig.ogImage,
  'totalTime': 'PT15M',
  'estimatedCost': {
    '@type': 'MonetaryAmount',
    'currency': 'USD',
    'value': '0',
  },
  'step': [
    {
      '@type': 'HowToStep',
      'position': 1,
      'name': 'Create Your Listing',
      'text': 'List your gaming products with detailed descriptions, screenshots, and competitive pricing to attract buyers. Use the easy listing creation form to add images and set your own prices.',
      'url': `${siteConfig.url}/sell`,
    },
    {
      '@type': 'HowToStep',
      'position': 2,
      'name': 'Receive Orders',
      'text': 'When a buyer purchases your listing, you will be notified immediately. Funds are held in escrow for security. Manage all orders from your seller dashboard.',
      'url': `${siteConfig.url}/dashboard`,
    },
    {
      '@type': 'HowToStep',
      'position': 3,
      'name': 'Deliver the Product',
      'text': 'Send the product details to the buyer through the secure messaging system. Mark the order as delivered once complete. Multiple delivery methods are supported.',
      'url': `${siteConfig.url}/messages`,
    },
    {
      '@type': 'HowToStep',
      'position': 4,
      'name': 'Get Paid',
      'text': 'Once the buyer confirms receipt, funds are released to your account automatically. Enjoy low platform fees and quick withdrawal processing to your preferred payment method.',
      'url': `${siteConfig.url}/dashboard`,
    },
  ],
}

// Breadcrumb Schema
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    {
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': siteConfig.url,
    },
    {
      '@type': 'ListItem',
      'position': 2,
      'name': 'How It Works',
      'item': `${siteConfig.url}/how-it-works`,
    },
  ],
}

// FAQ Schema for the mini FAQ section
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  'mainEntity': [
    {
      '@type': 'Question',
      'name': 'Is it safe to buy gaming accounts on Nashflare?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Yes! Our escrow system holds funds until delivery is confirmed. You have 48 hours to verify everything before payment is released to the seller.',
      },
    },
    {
      '@type': 'Question',
      'name': 'What fees does Nashflare charge?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'We charge a 5% service fee on purchases. This covers payment processing, buyer protection, and platform maintenance.',
      },
    },
    {
      '@type': 'Question',
      'name': 'How fast is delivery on Nashflare?',
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Digital codes are often delivered instantly. Account details are typically delivered within 1-24 hours through our secure messaging system.',
      },
    },
    {
      '@type': 'Question',
      'name': "What if the seller doesn't deliver my order?",
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': 'Open a dispute within your 48-hour protection window. Our team will investigate and issue a full refund if the seller fails to deliver.',
      },
    },
  ],
}

export default function HowItWorksPage() {
  return (
    <>
      {/* HowTo Schema for Buyers - Can get featured snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buyerHowToSchema) }}
      />
      {/* HowTo Schema for Sellers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sellerHowToSchema) }}
      />
      {/* Breadcrumb Schema - Shows navigation in search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* FAQ Schema - Can show expandable FAQ in search results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HowItWorksClient />
    </>
  )
}