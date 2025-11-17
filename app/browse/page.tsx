// Browse Page with SEO Metadata
// Location: app/browse/page.tsx

import type { Metadata } from 'next'
import { siteConfig } from '@/lib/seo-config'
import BrowsePageClient from './BrowsePageClient'

export const metadata: Metadata = {
  title: 'Browse Gaming Marketplace - Accounts, Items, Currency & Keys',
  description: 'Discover thousands of gaming accounts, in-game items, currency, and game keys. Filter by game, category, platform, and price. Verified sellers with secure transactions.',
  keywords: [
    ...siteConfig.keywords,
    'browse gaming accounts',
    'buy game items',
    'fortnite skins',
    'valorant accounts for sale',
    'roblox robux',
    'steam keys',
    'playstation codes',
    'xbox game pass',
    'gaming marketplace search',
    'filter game listings',
  ],
  openGraph: {
    title: 'Browse Gaming Marketplace | Nashflare',
    description: 'Find the best deals on gaming accounts, in-game items, currency, and game keys. Thousands of verified listings with buyer protection.',
    url: `${siteConfig.url}/browse`,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Browse Nashflare Gaming Marketplace',
      },
    ],
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Gaming Marketplace | Nashflare',
    description: 'Discover gaming accounts, items, currency & keys from verified sellers.',
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  alternates: {
    canonical: `${siteConfig.url}/browse`,
  },
}

export default function BrowsePage() {
  return <BrowsePageClient />
}