// Homepage with SEO Metadata
// Location: app/page.tsx
// This file exports metadata and imports the client component

import type { Metadata } from 'next'
import { siteConfig } from '@/lib/seo-config'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Buy & Sell Gaming Accounts, Currency & Keys',
  description: 'The #1 trusted gaming marketplace. Buy and sell gaming accounts, in-game currency, items, and game keys for Fortnite, Valorant, GTA 5, Roblox, and more. Secure transactions with 48-hour buyer protection.',
  keywords: [
    ...siteConfig.keywords,
    'gaming marketplace',
    'buy fortnite account',
    'sell valorant account',
    'gta 5 modded accounts',
    'roblox robux',
    'game key deals',
  ],
  openGraph: {
    title: `${siteConfig.name} - #1 Gaming Marketplace for Accounts, Currency & Keys`,
    description: 'Buy and sell gaming accounts, currency, and keys with complete security. Join thousands of gamers trading safely on Nashflare.',
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Nashflare Gaming Marketplace - Buy & Sell Gaming Assets Securely',
      },
    ],
    locale: siteConfig.locale,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Gaming Marketplace`,
    description: 'Buy and sell gaming accounts, currency, and keys securely. 48-hour buyer protection included.',
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  alternates: {
    canonical: siteConfig.url,
  },
}

export default function HomePage() {
  return <HomePageClient />
}